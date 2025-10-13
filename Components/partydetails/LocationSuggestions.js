
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartyMember, Party, Poll } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { MapPin, Search, Sparkles, Navigation, Send, Check, Vote, Plus } from 'lucide-react'; // Added Plus icon
import { Skeleton } from '@/components/ui/skeleton';

export default function LocationSuggestions({ party, currentUser, isUserMember, onPartyUpdate, onStartPoll }) {
  const [memberLocations, setMemberLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [userLocationShared, setUserLocationShared] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [locationError, setLocationError] = useState(null); // New state for location errors

  const fetchMemberLocations = useCallback(async () => {
    setLoadingLocations(true);
    const allPartyMembers = await PartyMember.filter({ party_id: party.id });
    const locations = allPartyMembers.filter(pm => pm.location_lat && pm.location_lng);
    setMemberLocations(locations);
    setUserLocationShared(allPartyMembers.some(pm => pm.user_id === currentUser.id && pm.location_lat));
    setLoadingLocations(false);
  }, [party.id, currentUser.id]);

  useEffect(() => {
    fetchMemberLocations();
  }, [fetchMemberLocations]);

  const shareLocation = () => {
    setLocationError(null); // Clear previous errors

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const existingMember = (await PartyMember.filter({ party_id: party.id, user_id: currentUser.id }))[0];
        if (existingMember) {
          await PartyMember.update(existingMember.id, { location_lat: latitude, location_lng: longitude });
        } else {
          await PartyMember.create({
            party_id: party.id,
            user_id: currentUser.id,
            location_lat: latitude,
            location_lng: longitude,
            status: 'confirmed'
          });
        }
        fetchMemberLocations();
        setLocationError(null); // Clear error on success
      },
      (error) => {
        console.error("Error getting location", error);
        
        let errorMessage = "Could not get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location permissions in your browser settings to help find the best meeting spot.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "The request to get your location timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const generateSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const memberCoords = memberLocations.map(ml => `(${ml.location_lat}, ${ml.location_lng})`).join(', ');
      const prompt = `
        I am planning a "${party.type.replace(/_/g, ' ')}" party titled "${party.title}".
        The members are located at these coordinates: ${memberCoords}.
        Suggest 3 interesting and suitable public venues (like restaurants, parks, cafes, etc.) that are centrally located for the group.
        For each suggestion, provide a name, a short compelling reason, a general address, a star rating (out of 5), and a price level (e.g., $, $$, $$$).
      `;
      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" },
                  address: { type: "string" },
                  rating: { type: "number" },
                  price_level: { type: "string" }
                },
                required: ["name", "reason", "address", "rating", "price_level"]
              }
            }
          }
        }
      });
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestions(prev => 
      prev.some(s => s.name === suggestion.name)
        ? prev.filter(s => s.name !== suggestion.name)
        : [...prev, suggestion]
    );
  };
  
  const handleStartPoll = () => {
    if (selectedSuggestions.length > 0) {
      onStartPoll(selectedSuggestions);
      setSelectedSuggestions([]);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Location Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isUserMember && (
          <div> {/* Added a div wrapper here for location-related elements */}
            <div className={`p-4 rounded-lg flex items-center justify-between ${userLocationShared ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              {userLocationShared ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <p className="font-medium">Your location is shared for suggestions!</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-blue-700 mb-1">Help find the best spot!</p>
                    <p className="text-xs text-blue-600">Share your location to get personalized suggestions</p>
                  </div>
                  <Button size="sm" onClick={shareLocation} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Navigation className="w-4 h-4" /> Share
                  </Button>
                </>
              )}
            </div>
            
            {locationError && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">Location Access Needed</p>
                    <p className="text-xs text-amber-700 mt-1">{locationError}</p>
                    <p className="text-xs text-amber-600 mt-2">
                      💡 Tip: Check your browser settings (usually in the address bar) to enable location access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{memberLocations.length}</span> out of {(party.member_ids?.length || 0) + 1} members have shared their location.
        </p>
        
        {party.host_id === currentUser?.id && (
          <Button 
            onClick={generateSuggestions} 
            disabled={loadingSuggestions || memberLocations.length < 1} 
            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Sparkles className="w-4 h-4" />
            {loadingSuggestions ? 'Generating Ideas...' : 'Generate Location Suggestions'}
          </Button>
        )}

        {memberLocations.length < 1 && party.host_id === currentUser?.id && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              At least one member needs to share their location before AI can suggest meeting spots.
            </p>
          </div>
        )}
        
        {loadingSuggestions && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">AI-Powered Suggestions:</h3>
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestions.some(s => s.name === suggestion.name);
              return (
                <div key={index} className={`p-4 border rounded-lg transition-all ${isSelected ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{suggestion.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>⭐ {suggestion.rating || 'N/A'}</span>
                        <span>{suggestion.price_level || ''}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{suggestion.reason}</p>
                    </div>
                    {party.host_id === currentUser?.id && (
                      <Button size="sm" onClick={() => handleSelectSuggestion(suggestion)} variant={isSelected ? "default" : "outline"} className="gap-2">
                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
             {party.host_id === currentUser?.id && selectedSuggestions.length > 0 && (
                <Button onClick={handleStartPoll} className="w-full gap-2 mt-4">
                    <Vote className="w-4 h-4"/>
                    Start a Poll with {selectedSuggestions.length} selected location(s)
                </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
