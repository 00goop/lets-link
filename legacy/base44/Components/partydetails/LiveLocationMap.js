
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyMember } from "@/entities/all";
import { Map, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

const getCustomIcon = (name, isCurrentUser) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    const bgColor = isCurrentUser ? '#1d4ed8' : '#4b5563'; // Blue for current user, gray for others
    const textColor = 'white';

    return L.divIcon({
        html: `<div style="background-color: ${bgColor}; color: ${textColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${initial}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export default function LiveLocationMap({ party, currentUser, partyMembers, allUsers }) {
  const [locations, setLocations] = useState([]);
  const [center, setCenter] = useState([51.505, -0.09]);
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const watchIdRef = useRef(null);

  const findUserLocationRecord = useCallback(() => {
    return partyMembers.find(pm => pm.user_id === currentUser.id);
  }, [partyMembers, currentUser.id]);

  useEffect(() => {
    const memberLocations = partyMembers
      .map(pm => {
        const user = allUsers.find(u => u.id === pm.user_id);
        if (pm.location_lat && pm.location_lng && user) {
          return {
            lat: pm.location_lat,
            lng: pm.location_lng,
            name: user.full_name,
            isCurrentUser: user.id === currentUser.id,
          };
        }
        return null;
      })
      .filter(Boolean);

    setLocations(memberLocations);

    if (memberLocations.length > 0) {
      const latitudes = memberLocations.map(l => l.lat);
      const longitudes = memberLocations.map(l => l.lng);
      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      setCenter([avgLat, avgLng]);
    } else {
        setCenter([37.7749, -122.4194]); // Default to SF
    }
    
    // Check if user is already sharing location
    if (findUserLocationRecord()?.location_lat) {
        setTracking(true);
    }

  }, [partyMembers, allUsers, currentUser.id, findUserLocationRecord]);

  const updateLocationInDB = async (latitude, longitude) => {
    const userLocationRecord = findUserLocationRecord();
    if (userLocationRecord) {
      await PartyMember.update(userLocationRecord.id, { location_lat: latitude, location_lng: longitude });
    } else {
      await PartyMember.create({
        party_id: party.id,
        user_id: currentUser.id,
        location_lat: latitude,
        location_lng: longitude,
        status: 'confirmed'
      });
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    if (!watchIdRef.current) {
      setLocationError(null); // Clear previous errors when starting
      setTracking(true);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocationInDB(latitude, longitude);
          setLocationError(null); // Clear error on successful update
        },
        (error) => {
          console.error("Error watching position:", error);
          
          let errorMessage = "";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable it in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred while tracking location.";
              break;
          }
          
          setLocationError(errorMessage);
          stopTracking(); // Stop tracking on error
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }
  };

  const stopTracking = () => {
    if (navigator.geolocation && watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTracking(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => stopTracking();
  }, []);
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-indigo-600" />
          Live Map
        </CardTitle>
        <Button 
          onClick={tracking ? stopTracking : startTracking} 
          variant={tracking ? "destructive" : "default"} 
          size="sm" 
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          {tracking ? 'Stop Sharing' : 'Share My Location'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {locationError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              {/* Warning Icon */}
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-amber-800 font-medium">Location Tracking Issue</p>
                <p className="text-xs text-amber-700 mt-1">{locationError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-96 w-full rounded-lg overflow-hidden">
            <MapContainer center={center} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((loc, index) => (
                    <Marker key={index} position={[loc.lat, loc.lng]} icon={getCustomIcon(loc.name, loc.isCurrentUser)}>
                        <Popup>{loc.name}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
        
        {locations.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            <p>No locations shared yet. Be the first to share yours!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
