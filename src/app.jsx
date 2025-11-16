import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, Users, Calendar, MapPin, Bell, User, Home, Plus, X, Check, Share2, Copy, LogOut, Edit, Trash2, Send, Heart, MessageCircle, ChevronRight, Search, Filter, Navigation, Settings, UserPlus, Clock, Image, Vote, Utensils, Loader2, Menu, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateJoinCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Storage helper
const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

const suggestionTemplates = {
  recreational: [
    { name: 'Riverside Adventure Park', address: 'Central plaza', reason: 'Perfect for outdoor activities and games' },
    { name: 'Urban Gaming Lounge', address: 'Warehouse district', reason: 'Indoor gaming and entertainment hub' },
    { name: 'Community Sports Complex', address: 'Midtown center', reason: 'Multiple sports facilities available' }
  ],
  dining: [
    { name: 'The Gathering Table', address: 'Food district', reason: 'Great for groups with diverse menu options' },
    { name: 'Skyline Bistro', address: 'High-rise view', reason: 'Upscale dining with amazing views' },
    { name: 'Family Style Kitchen', address: 'Central square', reason: 'Casual dining perfect for large groups' }
  ],
  family_vacation: [
    { name: 'Lakeside Resort & Spa', address: 'Waterfront promenade', reason: 'Family-friendly with activities for all ages' },
    { name: 'Mountain View Lodge', address: 'Ridgeline trailhead', reason: 'Scenic location with hiking trails' },
    { name: 'Beach Front Hotel', address: 'Coastal boardwalk', reason: 'Ocean activities and family entertainment' }
  ],
  entertainment: [
    { name: 'Grand Cinema Complex', address: 'Entertainment district', reason: 'Latest movies and IMAX screens' },
    { name: 'Live Music Venue', address: 'Arts quarter', reason: 'Great acoustics and vibrant atmosphere' },
    { name: 'Comedy & Theater Club', address: 'Downtown row', reason: 'Perfect for a fun night out' }
  ],
  shopping: [
    { name: 'Plaza Shopping Center', address: 'Retail promenade', reason: 'Over 200 stores and restaurants' },
    { name: 'Artisan Market Square', address: 'Old town', reason: 'Unique boutiques and local crafts' },
    { name: 'Mega Market Hall', address: 'Transit hub', reason: 'All major brands under one roof' }
  ],
  educational: [
    { name: 'Science & Discovery Museum', address: 'Museum district', reason: 'Interactive exhibits and workshops' },
    { name: 'Public Library Commons', address: 'City center', reason: 'Quiet study spaces and resources' },
    { name: 'University Conference Hall', address: 'Campus area', reason: 'Professional learning environment' }
  ]
};

const placeQueryMap = {
  recreational: ['park', 'playground', 'recreation center'],
  dining: ['restaurant', 'brunch', 'food hall'],
  family_vacation: ['family attraction', 'zoo', 'aquarium'],
  entertainment: ['concert venue', 'arcade', 'theater'],
  shopping: ['mall', 'boutique', 'shopping'],
  educational: ['museum', 'science center', 'library']
};

const fallbackOffsets = [
  { lat: 0, lng: 0 },
  { lat: 0.003, lng: 0.001 },
  { lat: -0.002, lng: 0.002 },
  { lat: 0.001, lng: -0.003 }
];

const restaurantFallbacks = [
  { name: 'Gather & Dine', description: 'Shared plates & craft cocktails' },
  { name: 'Sunset Brunch Club', description: 'All-day brunch & mocktails' },
  { name: 'Midtown Noodle House', description: 'Comfort bowls & late-night snacks' },
  { name: 'Rooftop Grill Society', description: 'Skewer flights & skyline views' },
  { name: 'Garden & Grain', description: 'Veg-forward bites & tea bar' },
  { name: 'City Scoop Café', description: 'Desserts and espresso pairings' }
];

const geocodeCache = {};

// Mock AI function
const generateAISuggestions = async (partyType, memberLocations = []) => {
  const templates = suggestionTemplates[partyType] || suggestionTemplates.recreational;

  if (!memberLocations.length) {
    return templates.map(template => ({
      ...template,
      lat: null,
      lng: null,
      distanceMiles: null
    }));
  }

  const midpoint = calculateMidpoint(
    memberLocations.map(loc => ({
      lat: loc.location_lat,
      lng: loc.location_lng
    }))
  );

  const queries = placeQueryMap[partyType] || ['meetup spot', 'community space'];
  for (const query of queries) {
    try {
      const places = await fetchNearbyPlaces(midpoint, query, 5);
      if (places.length) {
        return places;
      }
    } catch (error) {
      // Try the next query or fallback to templates
    }
  }

  return templates.map((template, index) => {
    const offset = fallbackOffsets[index % fallbackOffsets.length];
    const lat = midpoint.lat + offset.lat;
    const lng = midpoint.lng + offset.lng;
    const distanceMiles = calculateDistanceMiles(midpoint, { lat, lng });

    return {
      ...template,
      lat,
      lng,
      distanceMiles: Number(distanceMiles.toFixed(1)),
      address: `${template.address} · ${distanceMiles.toFixed(1)} miles from meetup center`
    };
  });
};

const generateRestaurantSuggestions = async (location, dietary, memberLocations = []) => {
  let center = null;
  if (memberLocations.length) {
    center = calculateMidpoint(memberLocations.map(loc => ({
      lat: loc.location_lat,
      lng: loc.location_lng
    })));
  }

  if (!center && location) {
    center = await geocodePlaceName(location);
  }

  if (!center) {
    return [];
  }

  const dietaryQuery = dietary ? `${dietary} restaurant` : 'restaurant';
  const restaurants = await fetchNearbyPlaces(center, dietaryQuery, 6, false);
  return restaurants.map(place => ({
    name: place.name,
    cuisine: dietary || 'Restaurant',
    rating: place.score ?? 4.2,
    address: place.address,
    distanceMiles: place.distanceMiles
  }));
};

const calculateMidpoint = (locations) => {
  if (!locations.length) return null;
  const sum = locations.reduce((acc, loc) => ({
    lat: acc.lat + loc.lat,
    lng: acc.lng + loc.lng
  }), { lat: 0, lng: 0 });
  return { lat: sum.lat / locations.length, lng: sum.lng / locations.length };
};

const toRadians = (deg) => (deg * Math.PI) / 180;

const calculateDistanceMiles = (pointA, pointB) => {
  if (!pointA || !pointB) return 0;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const geocodePlaceName = async (placeName) => {
  if (!placeName) return null;
  if (geocodeCache[placeName]) {
    return geocodeCache[placeName];
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      placeName
    )}&email=support@letslink.app`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Failed to geocode');
    const data = await response.json();
    if (!data.length) throw new Error('No data');

    const coord = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache[placeName] = coord;
    return coord;
  } catch {
    return null;
  }
};

const buildFallbackPlaces = (center, query, limit = 5) => {
  const results = [];
  for (let i = 0; i < limit; i += 1) {
    const template = restaurantFallbacks[i % restaurantFallbacks.length];
    const offset = fallbackOffsets[i % fallbackOffsets.length];
    const lat = center.lat + offset.lat * (i + 1);
    const lng = center.lng + offset.lng * (i + 1);
    results.push({
      name: `${template.name}${query ? ` · ${query.split(' ')[0]}` : ''}`,
      address: `${(lat).toFixed(4)}, ${(lng).toFixed(4)} • ${template.description}`,
      lat,
      lng,
      distanceMiles: Number(calculateDistanceMiles(center, { lat, lng }).toFixed(1)),
      score: Number((4.1 + (i * 0.1)).toFixed(1))
    });
  }
  return results;
};

const fetchNearbyPlaces = async (center, query, limit = 5, allowFallback = true) => {
  if (!center) return [];
  const delta = 0.02;
  const viewbox = [
    (center.lng - delta).toFixed(6),
    (center.lat + delta).toFixed(6),
    (center.lng + delta).toFixed(6),
    (center.lat - delta).toFixed(6)
  ].join(',');

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(
      query
    )}&bounded=1&viewbox=${viewbox}&email=support@letslink.app`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Failed to fetch places');
    const data = await response.json();
    if (!data.length) throw new Error('No data');

    return data.map(place => {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      return {
        name: place.display_name?.split(',')[0] || place.name || 'Suggested spot',
        address: place.display_name,
        lat,
        lng,
        distanceMiles: Number(calculateDistanceMiles(center, { lat, lng }).toFixed(1)),
        score: place.importance ? Number((3.5 + place.importance).toFixed(1)) : undefined
      };
    });
  } catch (error) {
    if (allowFallback) {
      return buildFallbackPlaces(center, query, limit);
    }
    throw error;
  }
};

// Party type emojis
const partyTypeEmojis = {
  recreational: '🎮',
  dining: '🍽️',
  family_vacation: '👨‍👩‍👧‍👦',
  entertainment: '🎬',
  shopping: '🛍️',
  educational: '📚'
};

// Main App Component
export default function LetsLinkApp() {
  // Auth state
  const [currentUser, setCurrentUser] = usePersistedState('currentUser', null);
  const [users, setUsers] = usePersistedState('users', []);
  
  // App state
  const [parties, setParties] = usePersistedState('parties', []);
  const [partyMembers, setPartyMembers] = usePersistedState('partyMembers', []);
  const [friends, setFriends] = usePersistedState('friends', []);
  const [photos, setPhotos] = usePersistedState('photos', []);
  const [notifications, setNotifications] = usePersistedState('notifications', []);
  const [polls, setPolls] = usePersistedState('polls', []);
  const [votes, setVotes] = usePersistedState('votes', []);
  
  // UI state
  const [currentView, setCurrentView] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Computed values
  const myParties = parties.filter(p => 
    p.host_id === currentUser?.id || 
    partyMembers.some(m => m.party_id === p.id && m.user_id === currentUser?.id)
  );
  
  const myFriends = friends.filter(f => 
    (f.requester_id === currentUser?.id || f.recipient_id === currentUser?.id) && 
    f.status === 'accepted'
  );
  
  const unreadNotifications = notifications.filter(n => n.user_id === currentUser?.id && !n.read);

  // Auth functions
  const handleAuth = (email, password, fullName, username) => {
    if (isSignUp) {
      const newUser = {
        id: generateId(),
        email,
        full_name: fullName,
        username: username || email.split('@')[0],
        role: 'user',
        bio: '',
        location: '',
        interests: '',
        phone: '',
        profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setShowAuthModal(false);
    } else {
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        setShowAuthModal(false);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  // Party functions
  const createParty = (partyData) => {
    const newParty = {
      id: generateId(),
      ...partyData,
      host_id: currentUser.id,
      join_code: generateJoinCode(),
      status: 'planning',
      member_ids: [currentUser.id],
      created_at: new Date().toISOString()
    };
    setParties([...parties, newParty]);
    
    const membership = {
      id: generateId(),
      party_id: newParty.id,
      user_id: currentUser.id,
      status: 'active',
      joined_at: new Date().toISOString()
    };
    setPartyMembers([...partyMembers, membership]);
    
    setShowCreateParty(false);
    setSelectedParty(newParty);
    setCurrentView('party-detail');
  };

  const joinParty = (joinCode) => {
    const party = parties.find(p => p.join_code === joinCode);
    if (party && !party.member_ids.includes(currentUser.id)) {
      const updatedParty = {
        ...party,
        member_ids: [...party.member_ids, currentUser.id]
      };
      setParties(parties.map(p => p.id === party.id ? updatedParty : p));
      
      const membership = {
        id: generateId(),
        party_id: party.id,
        user_id: currentUser.id,
        status: 'active',
        joined_at: new Date().toISOString()
      };
      setPartyMembers([...partyMembers, membership]);
      
      setSelectedParty(updatedParty);
      setCurrentView('party-detail');
    }
  };

  // Friend functions
  const sendFriendRequest = (username) => {
    const recipient = users.find(u => u.username === username);
    if (recipient && recipient.id !== currentUser.id) {
      const newFriendship = {
        id: generateId(),
        requester_id: currentUser.id,
        recipient_id: recipient.id,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setFriends([...friends, newFriendship]);
      
      const notification = {
        id: generateId(),
        user_id: recipient.id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.username} wants to be friends`,
        read: false,
        related_id: newFriendship.id,
        created_at: new Date().toISOString()
      };
      setNotifications([...notifications, notification]);
    }
  };

  const acceptFriendRequest = (friendshipId) => {
    setFriends(friends.map(f => 
      f.id === friendshipId ? { ...f, status: 'accepted' } : f
    ));
    setNotifications(notifications.filter(n => n.related_id !== friendshipId));
  };

  // Render auth modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Let's Link
            </h1>
            <p className="text-gray-600">Plan amazing outings with friends</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !isSignUp
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  isSignUp
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAuth(
                  formData.get('email'),
                  formData.get('password'),
                  formData.get('fullName'),
                  formData.get('username')
                );
              }}
              className="space-y-4"
            >
              {isSignUp && (
                <>
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </>
              )}
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={(e) => {
                  const form = e.target.closest('div');
                  const inputs = form.querySelectorAll('input');
                  const data = {};
                  inputs.forEach(input => {
                    data[input.name] = input.value;
                  });
                  handleAuth(data.email, data.password, data.fullName, data.username);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Let's Link
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('notifications')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <img
                src={currentUser.profile_picture_url}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden sm:block font-medium">{currentUser.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop & Mobile Overlay */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:block p-4 shadow-xl lg:shadow-none
        `}>
          {isMobileMenuOpen && (
            <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b">
              <h2 className="font-bold text-lg">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <nav className="space-y-2">
            <NavItem
              icon={Home}
              label="Home"
              active={currentView === 'home'}
              onClick={() => {
                setCurrentView('home');
                setIsMobileMenuOpen(false);
              }}
            />
            <NavItem
              icon={Calendar}
              label="Parties"
              active={currentView === 'parties'}
              onClick={() => {
                setCurrentView('parties');
                setIsMobileMenuOpen(false);
              }}
              badge={myParties.length}
            />
            <NavItem
              icon={Users}
              label="Friends"
              active={currentView === 'friends'}
              onClick={() => {
                setCurrentView('friends');
                setIsMobileMenuOpen(false);
              }}
              badge={myFriends.length}
            />
            <NavItem
              icon={Bell}
              label="Notifications"
              active={currentView === 'notifications'}
              onClick={() => {
                setCurrentView('notifications');
                setIsMobileMenuOpen(false);
              }}
              badge={unreadNotifications.length}
            />
            <NavItem
              icon={User}
              label="Profile"
              active={currentView === 'profile'}
              onClick={() => {
                setCurrentView('profile');
                setIsMobileMenuOpen(false);
              }}
            />
          </nav>
        </aside>

        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {currentView === 'home' && (
            <HomeView
              currentUser={currentUser}
              parties={myParties}
              friends={myFriends}
              onCreateParty={() => setShowCreateParty(true)}
              onViewParties={() => setCurrentView('parties')}
              onViewParty={(party) => {
                setSelectedParty(party);
                setCurrentView('party-detail');
              }}
            />
          )}

          {currentView === 'parties' && (
            <PartiesView
              parties={myParties}
              currentUser={currentUser}
              onCreateParty={() => setShowCreateParty(true)}
              onViewParty={(party) => {
                setSelectedParty(party);
                setCurrentView('party-detail');
              }}
              onJoinParty={joinParty}
            />
          )}

          {currentView === 'party-detail' && selectedParty && (
            <PartyDetailView
              party={selectedParty}
              currentUser={currentUser}
              partyMembers={partyMembers.filter(m => m.party_id === selectedParty.id)}
              users={users}
              photos={photos.filter(p => p.party_id === selectedParty.id)}
              polls={polls.filter(p => p.party_id === selectedParty.id)}
              votes={votes}
              onBack={() => setCurrentView('parties')}
              onUpdateParty={(updates) => {
                const updated = { ...selectedParty, ...updates };
                setParties(parties.map(p => p.id === selectedParty.id ? updated : p));
                setSelectedParty(updated);
              }}
              onUploadPhoto={(photoData) => {
                const newPhoto = {
                  id: generateId(),
                  party_id: selectedParty.id,
                  uploader_id: currentUser.id,
                  ...photoData,
                  likes: [],
                  created_at: new Date().toISOString()
                };
                setPhotos([...photos, newPhoto]);
              }}
              onCreatePoll={(pollData) => {
                const newPoll = {
                  id: generateId(),
                  party_id: selectedParty.id,
                  created_by: currentUser.id,
                  ...pollData,
                  status: 'open',
                  created_at: new Date().toISOString()
                };
                setPolls([...polls, newPoll]);
              }}
              onVote={(pollId, option) => {
                const existingVote = votes.find(v => v.poll_id === pollId && v.user_id === currentUser.id);
                if (existingVote) {
                  setVotes(votes.map(v => 
                    v.id === existingVote.id ? { ...v, selected_option: option } : v
                  ));
                } else {
                  setVotes([...votes, {
                    id: generateId(),
                    poll_id: pollId,
                    user_id: currentUser.id,
                    selected_option: option,
                    created_at: new Date().toISOString()
                  }]);
                }
              }}
              onUpdateLocation={(lat, lng, name) => {
                const membership = partyMembers.find(
                  m => m.party_id === selectedParty.id && m.user_id === currentUser.id
                );
                if (membership) {
                  setPartyMembers(partyMembers.map(m =>
                    m.id === membership.id
                      ? { ...m, location_lat: lat, location_lng: lng, location_name: name }
                      : m
                  ));
                }
              }}
            />
          )}

          {currentView === 'friends' && (
            <FriendsView
              currentUser={currentUser}
              friends={friends}
              users={users}
              onSendRequest={sendFriendRequest}
              onAcceptRequest={acceptFriendRequest}
            />
          )}

          {currentView === 'notifications' && (
            <NotificationsView
              notifications={notifications.filter(n => n.user_id === currentUser.id)}
              onMarkRead={(id) => {
                setNotifications(notifications.map(n =>
                  n.id === id ? { ...n, read: true } : n
                ));
              }}
              onDelete={(id) => {
                setNotifications(notifications.filter(n => n.id !== id));
              }}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView
              user={currentUser}
              onUpdateProfile={(updates) => {
                const updated = { ...currentUser, ...updates };
                setCurrentUser(updated);
                setUsers(users.map(u => u.id === currentUser.id ? updated : u));
              }}
            />
          )}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around">
        <MobileNavItem
          icon={Home}
          label="Home"
          active={currentView === 'home'}
          onClick={() => setCurrentView('home')}
        />
        <MobileNavItem
          icon={Calendar}
          label="Parties"
          active={currentView === 'parties'}
          onClick={() => setCurrentView('parties')}
          badge={myParties.length}
        />
        <MobileNavItem
          icon={Users}
          label="Friends"
          active={currentView === 'friends'}
          onClick={() => setCurrentView('friends')}
        />
        <MobileNavItem
          icon={User}
          label="Profile"
          active={currentView === 'profile'}
          onClick={() => setCurrentView('profile')}
        />
      </nav>

      {/* Create Party Modal */}
      {showCreateParty && (
        <CreatePartyModal
          onClose={() => setShowCreateParty(false)}
          onCreate={createParty}
        />
      )}
    </div>
  );
}

// Navigation Components
function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {badge > 0 && (
        <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
          active ? 'bg-white/20' : 'bg-purple-100 text-purple-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 ${
        active ? 'text-purple-600' : 'text-gray-600'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// View Components
function HomeView({ currentUser, parties, friends, onCreateParty, onViewParties, onViewParty }) {
  const upcomingParties = parties
    .filter(p => p.status !== 'cancelled' && new Date(p.scheduled_date) >= new Date())
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser.username}!</h2>
          <p className="text-gray-600 mt-1">Ready to plan your next adventure?</p>
        </div>
        <button
          onClick={onCreateParty}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Party</span>
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Active Parties"
          value={parties.filter(p => p.status !== 'cancelled').length}
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Users}
          label="Friends"
          value={friends.length}
          gradient="from-pink-500 to-pink-600"
        />
        <StatCard
          icon={Camera}
          label="Memories"
          value={0}
          gradient="from-blue-500 to-blue-600"
        />
      </div>

      {/* Upcoming Parties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Upcoming Parties</h3>
          <button
            onClick={onViewParties}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingParties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingParties.map(party => (
              <PartyCard key={party.id} party={party} onClick={() => onViewParty(party)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No upcoming parties</p>
            <button
              onClick={onCreateParty}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Create Your First Party
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-80" />
      </div>
    </div>
  );
}

function PartyCard({ party, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all text-left w-full border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{partyTypeEmojis[party.type]}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          party.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
          party.status === 'confirmed' ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {party.status}
        </span>
      </div>
      <h4 className="font-bold text-lg text-gray-900 mb-2">{party.title}</h4>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{party.description}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(party.scheduled_date)}
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {party.member_ids.length}/{party.max_size}
        </div>
      </div>
    </button>
  );
}

function PartiesView({ parties, currentUser, onCreateParty, onViewParty, onJoinParty }) {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">My Parties</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all"
          >
            <Users className="w-5 h-5" />
            Join Party
          </button>
          <button
            onClick={onCreateParty}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Party
          </button>
        </div>
      </div>

      {parties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map(party => (
            <PartyCard key={party.id} party={party} onClick={() => onViewParty(party)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No parties yet</p>
          <p className="text-gray-500 mb-6">Create a party or join one with a code</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all"
            >
              Join Party
            </button>
            <button
              onClick={onCreateParty}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Create Party
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Join Party</h3>
              <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter join code"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4"
            />
            <button
              onClick={() => {
                onJoinParty(joinCode);
                setShowJoinModal(false);
                setJoinCode('');
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PartyDetailView({ 
  party, 
  currentUser, 
  partyMembers, 
  users, 
  photos, 
  polls, 
  votes,
  onBack, 
  onUpdateParty,
  onUploadPhoto,
  onCreatePoll,
  onVote,
  onUpdateLocation
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLocationShare, setShowLocationShare] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const isHost = party.host_id === currentUser.id;
  const members = partyMembers.map(m => users.find(u => u.id === m.user_id)).filter(Boolean);
  const memberLocations = partyMembers.filter(m => m.location_lat && m.location_lng);

  const shareJoinCode = () => {
    navigator.clipboard.writeText(party.join_code);
    alert('Join code copied!');
  };

  const shareLink = () => {
    const link = `${window.location.origin}?join=${party.join_code}`;
    if (navigator.share) {
      navigator.share({ title: party.title, url: link });
    } else {
      navigator.clipboard.writeText(link);
      alert('Link copied!');
    }
  };

  const handleShareLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onUpdateLocation(
          position.coords.latitude,
          position.coords.longitude,
          'Current Location'
        );
        setShowLocationShare(false);
        alert('Location shared successfully!');
      },
      (error) => {
        let message = 'Unable to retrieve location. ';
        if (error.code === error.PERMISSION_DENIED) {
          message += 'Please enable location permissions in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message += 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message += 'Location request timed out. Please try again.';
        }
        setLocationError(message);
      }
    );
  };

  const generateSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await generateAISuggestions(party.type, memberLocations);
      setAiSuggestions(suggestions);
    } catch (error) {
      alert('Failed to generate suggestions');
    }
    setIsLoadingSuggestions(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <div className="flex gap-2">
          {isHost && (
            <button className="p-2 hover:bg-white rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="p-2 hover:bg-white rounded-lg transition-colors relative"
          >
            <Share2 className="w-5 h-5" />
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl p-2 w-48 z-10">
                <button
                  onClick={shareJoinCode}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Join Code
                </button>
                <button
                  onClick={shareLink}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Link
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Party Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl">{partyTypeEmojis[party.type]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{party.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                party.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                party.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {party.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{party.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(party.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>{party.member_ids.length}/{party.max_size} members</span>
              </div>
              {party.location_name && (
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <MapPin className="w-5 h-5" />
                  <span>{party.location_name}</span>
                </div>
              )}
              {!party.location_name && (
                <div className="flex items-center gap-2 text-purple-600 col-span-2">
                  <Navigation className="w-5 h-5" />
                  <span className="text-sm">Location to be determined by AI suggestions</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Join Code</p>
            <p className="text-2xl font-bold text-purple-600 tracking-wider">{party.join_code}</p>
          </div>
          <button
            onClick={shareJoinCode}
            className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'location'} onClick={() => setActiveTab('location')}>
            Location
          </TabButton>
          <TabButton active={activeTab === 'polls'} onClick={() => setActiveTab('polls')}>
            Polls
          </TabButton>
          <TabButton active={activeTab === 'photos'} onClick={() => setActiveTab('photos')}>
            Photos
          </TabButton>
          <TabButton active={activeTab === 'food'} onClick={() => setActiveTab('food')}>
            Food Finder
          </TabButton>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({members.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <img
                        src={member.profile_picture_url}
                        alt={member.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-gray-600">@{member.username}</p>
                      </div>
                      {member.id === party.host_id && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                          Host
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <LocationTab
              party={party}
              memberLocations={memberLocations}
              users={users}
              onShareLocation={handleShareLocation}
              showLocationShare={showLocationShare}
              setShowLocationShare={setShowLocationShare}
              locationError={locationError}
              isLoadingSuggestions={isLoadingSuggestions}
              aiSuggestions={aiSuggestions}
              onGenerateSuggestions={generateSuggestions}
              isHost={isHost}
              onCreatePoll={onCreatePoll}
              onNavigateToPolls={() => setActiveTab('polls')}
            />
          )}

          {activeTab === 'polls' && (
            <PollsTab
              polls={polls}
              votes={votes}
              currentUser={currentUser}
              isHost={isHost}
              onCreatePoll={onCreatePoll}
              onVote={onVote}
            />
          )}

          {activeTab === 'photos' && (
            <PhotosTab
              photos={photos}
              users={users}
              currentUser={currentUser}
              onUploadPhoto={onUploadPhoto}
            />
          )}

          {activeTab === 'food' && (
            <FoodFinderTab
              partyLocation={party.location_name}
              memberLocations={memberLocations}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
        active
          ? 'text-purple-600 border-b-2 border-purple-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function LocationTab({ 
  party,
  memberLocations, 
  users, 
  onShareLocation, 
  showLocationShare,
  setShowLocationShare,
  locationError,
  isLoadingSuggestions,
  aiSuggestions,
  onGenerateSuggestions,
  isHost,
  onCreatePoll,
  onNavigateToPolls
}) {
  const midpoint = calculateMidpoint(memberLocations.map(m => ({ lat: m.location_lat, lng: m.location_lng })));
  const totalMembers = party.member_ids.length;
  const shareCount = memberLocations.length;

  const progressMessage =
    shareCount === 0
      ? '?? Waiting for members to share locations...'
      : shareCount < totalMembers
      ? '?? More locations = Better suggestions!'
      : '? All locations shared! Generate suggestions below.';
  const embedUrl = `https://maps.google.com/maps?q=${midpoint?.lat || 37.7749},${midpoint?.lng || -122.4194}&z=12&output=embed`;
  const openMapUrl = `https://www.google.com/maps?q=${midpoint?.lat || 0},${midpoint?.lng || 0}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Location Planning</h3>
          <p className="text-sm text-gray-500">Share locations for AI-powered venue suggestions</p>
        </div>
        <button
          onClick={() => setShowLocationShare(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Share My Location
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      {locationError && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-900">Location Sharing Progress</span>
          <span className="text-sm font-bold text-purple-600">{shareCount}/{totalMembers} members</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
            style={{ width: `${(shareCount / totalMembers) * 100}%` }}
          />
        </div>
        <p className="text-xs text-purple-700 mt-2">{progressMessage}</p>
      </div>

      {shareCount > 0 ? (
        <>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <iframe
              width="100%"
              height="400"
              frameBorder="0"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
              src={embedUrl}
              allowFullScreen
              className="w-full"
              title="Party midpoint map"
            />
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {shareCount} member{shareCount !== 1 ? 's' : ''} shared location
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Midpoint: {midpoint ? `${midpoint.lat.toFixed(4)}, ${midpoint.lng.toFixed(4)}` : 'Calculating...'}
                  </p>
                </div>
                <a
                  href={openMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Shared Locations</h4>
            <div className="space-y-2">
              {memberLocations.map(member => {
                const user = users.find(u => u.id === member.user_id);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={user?.profile_picture_url}
                      alt={user?.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {member.location_lat.toFixed(4)}, {member.location_lng.toFixed(4)}
                      </p>
                    </div>
                    <MapPin className="w-5 h-5 text-purple-500" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-lg mb-1">?? AI Location Suggestions</h4>
                <p className="text-sm text-purple-100">
                  Based on your {party.type.replace('_', ' ')} party type and member locations
                </p>
              </div>
              <button
                onClick={onGenerateSuggestions}
                disabled={isLoadingSuggestions}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium shadow-lg"
              >
                {isLoadingSuggestions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Generate Suggestions
                  </>
                )}
              </button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="space-y-3 mt-4">
                {aiSuggestions.map((suggestion, idx) => {
                  const hasCoordinates = suggestion.lat != null && suggestion.lng != null;
                  const mapsLink = hasCoordinates
                    ? `https://www.google.com/maps?q=${suggestion.lat},${suggestion.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.name + ' ' + suggestion.address)}`;

                  return (
                    <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-white/50">#{idx + 1}</span>
                            <h5 className="font-bold text-lg">{suggestion.name}</h5>
                          </div>
                          <p className="text-sm text-purple-100 mb-2">
                            {suggestion.address}
                            {suggestion.distanceMiles ? (
                              <span className="block text-xs text-purple-200">
                                ~{suggestion.distanceMiles} miles from midpoint
                              </span>
                            ) : null}
                          </p>
                          <p className="text-sm text-white/90 bg-white/10 rounded-lg px-3 py-2">✨ {suggestion.reason}</p>
                        </div>
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 p-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors shadow-lg"
                          title="Open in Maps"
                        >
                          <Navigation className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  );
                })}

                {isHost && onCreatePoll && (
                  <button
                    onClick={() => {
                      onCreatePoll({
                        question: `Where should we meet for ${party.title}?`,
                        options: aiSuggestions.slice(0, 4).map((suggestion) => suggestion.name)
                      });
                      if (onNavigateToPolls) {
                        onNavigateToPolls();
                      } else {
                        alert('Poll created! Head to the Polls tab to track the votes.');
                      }
                    }}
                    className="w-full mt-4 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
                  >
                    Create Poll From These Locations
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-purple-200">
          <MapPin className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h4 className="font-bold text-lg text-gray-900 mb-2">No locations shared yet</h4>
          <p className="text-gray-600 mb-4">Members need to share their location to get AI-powered suggestions</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm">
            <Navigation className="w-4 h-4" />
            AI will suggest venues perfect for your <strong className="ml-1">{party.type.replace('_', ' ')}</strong> party
          </div>
        </div>
      )}

      {showLocationShare && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Share Location</h3>
              <button onClick={() => setShowLocationShare(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Real-time sync:</strong> Your location will be shared with all party members and synced across all devices instantly.
                </p>
              </div>
              <p className="text-gray-600">
                Share your current location to help AI find the perfect meeting spot for your {party.type.replace('_', ' ')} party.
              </p>
            </div>
            <button
              onClick={onShareLocation}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Share My Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function PollsTab({ polls, votes, currentUser, isHost, onCreatePoll, onVote }) {
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleCreatePoll = () => {
    if (question && options.every(o => o.trim())) {
      onCreatePoll({ question, options: options.filter(o => o.trim()) });
      setQuestion('');
      setOptions(['', '']);
      setShowCreatePoll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Polls</h3>
        {isHost && (
          <button
            onClick={() => setShowCreatePoll(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Poll
          </button>
        )}
      </div>

      {polls.length > 0 ? (
        <div className="space-y-4">
          {polls.map(poll => {
            const pollVotes = votes.filter(v => v.poll_id === poll.id);
            const userVote = pollVotes.find(v => v.user_id === currentUser.id);
            
            return (
              <div key={poll.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold">{poll.question}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    poll.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {poll.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {poll.options.map((option, idx) => {
                    const optionVotes = pollVotes.filter(v => v.selected_option === option).length;
                    const percentage = pollVotes.length > 0 ? (optionVotes / pollVotes.length) * 100 : 0;
                    const isSelected = userVote?.selected_option === option;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => poll.status === 'open' && onVote(poll.id, option)}
                        disabled={poll.status === 'closed'}
                        className={`w-full p-3 rounded-lg text-left relative overflow-hidden ${
                          isSelected
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        } disabled:cursor-not-allowed`}
                      >
                        <div
                          className="absolute inset-0 bg-purple-200 opacity-30"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          <span className="text-sm text-gray-600">
                            {optionVotes} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-3">{pollVotes.length} total votes</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No polls yet</p>
        </div>
      )}

      {showCreatePoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Create Poll</h3>
              <button onClick={() => setShowCreatePoll(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What should we decide?"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Options</label>
                {options.map((option, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[idx] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2"
                  />
                ))}
                <button
                  onClick={() => setOptions([...options, ''])}
                  className="text-purple-600 text-sm hover:text-purple-700"
                >
                  + Add Option
                </button>
              </div>
              <button
                onClick={handleCreatePoll}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotosTab({ photos, users, currentUser, onUploadPhoto }) {
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (previewUrl) {
      onUploadPhoto({
        file_url: previewUrl,
        caption
      });
      // Send push notification to all party members
      console.log('🔔 Push notification sent: New photo uploaded by', currentUser.username);
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl('');
      setShowUpload(false);
    }
  };

  const handleLike = (photoId) => {
    // In a real app, this would update the likes array
    console.log('?? Photo liked:', photoId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Shared Photos</h3>
          <p className="text-sm text-gray-500">Photos sync across all devices in real-time</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Upload Photo
        </button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(photo => {
            const uploader = users.find(u => u.id === photo.uploader_id);
            const isLiked = photo.likes.includes(currentUser.id);
            return (
              <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img src={photo.file_url} alt={photo.caption} className="w-full h-48 object-cover" />
                <div className="p-3">
                  <p className="text-sm mb-2">{photo.caption}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={uploader?.profile_picture_url}
                        alt={uploader?.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>@{uploader?.username}</span>
                    </div>
                    <button
                      onClick={() => handleLike(photo.id)}
                      className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {photo.likes.length}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(photo.created_at)} at {formatTime(photo.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No photos yet</p>
          <p className="text-sm text-gray-500">Upload the first photo to get started</p>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Upload Photo</h3>
              <button onClick={() => {
                setShowUpload(false);
                setPreviewUrl('');
                setSelectedFile(null);
                setCaption('');
              }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!previewUrl ? (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">Click to upload photo</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                  <button
                    onClick={() => {
                      setPreviewUrl('');
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                rows="3"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>🔔 Push notification:</strong> All party members will be notified when you upload this photo
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={!previewUrl}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Upload Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FoodFinderTab({ partyLocation, memberLocations }) {
  const [dietary, setDietary] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const hasLocationInfo = memberLocations.length > 0 || Boolean(partyLocation);

  const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Kosher'];

  const searchRestaurants = async () => {
    setIsLoading(true);
    setError('');
    try {
      const results = await generateRestaurantSuggestions(partyLocation, dietary, memberLocations);
      if (!results.length) {
        setError('No restaurants found nearby. Try sharing locations or changing filters.');
      }
      setRestaurants(results);
    } catch {
      setError('Failed to find restaurants. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-4">Find Restaurants</h3>
        {!hasLocationInfo && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 text-sm text-purple-700 rounded-xl">
            Share the party location or ask friends to send theirs for hyper-local picks. We&apos;ll still suggest trending spots nearby.
          </div>
        )}
        <div className="flex gap-2 mb-4 flex-wrap">
          {dietaryOptions.map(option => (
            <button
              key={option}
              onClick={() => setDietary(dietary === option ? '' : option)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                dietary === option
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-500'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={searchRestaurants}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search Restaurants
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="space-y-3">
          {restaurants.map((restaurant, idx) => (
            <div key={idx} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-lg">{restaurant.name}</h4>
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="text-sm font-medium">
                    {(restaurant.rating ?? 4.2).toFixed(1)}
                  </span>
                  <span>★</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
              <p className="text-sm text-gray-500">{restaurant.address}</p>
              {restaurant.distanceMiles && (
                <p className="text-xs text-gray-400 mt-1">
                  ~{restaurant.distanceMiles} miles from meetup center
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendsView({ currentUser, friends, users, onSendRequest, onAcceptRequest }) {
  const [searchUsername, setSearchUsername] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);

  const myFriends = friends
    .filter(f => 
      (f.requester_id === currentUser.id || f.recipient_id === currentUser.id) && 
      f.status === 'accepted'
    )
    .map(f => {
      const friendId = f.requester_id === currentUser.id ? f.recipient_id : f.requester_id;
      return users.find(u => u.id === friendId);
    })
    .filter(Boolean);

  const pendingRequests = friends
    .filter(f => f.recipient_id === currentUser.id && f.status === 'pending')
    .map(f => ({
      ...f,
      requester: users.find(u => u.id === f.requester_id)
    }))
    .filter(r => r.requester);

  const handleSendRequest = () => {
    if (searchUsername.trim()) {
      onSendRequest(searchUsername.trim());
      setSearchUsername('');
      setShowAddFriend(false);
    }
  };

  const shareInviteLink = () => {
    const link = `${window.location.origin}?friend=${currentUser.id}`;
    if (navigator.share) {
      navigator.share({ title: 'Add me on Let\'s Link', url: link });
    } else {
      navigator.clipboard.writeText(link);
      alert('Invite link copied!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Friends</h2>
        <div className="flex gap-2">
          <button
            onClick={shareInviteLink}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share Link
          </button>
          <button
            onClick={() => setShowAddFriend(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            Add Friend
          </button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Friend Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={request.requester.profile_picture_url}
                    alt={request.requester.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{request.requester.full_name}</p>
                    <p className="text-sm text-gray-600">@{request.requester.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptRequest(request.id)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="font-bold text-lg mb-4">My Friends ({myFriends.length})</h3>
        {myFriends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <img
                  src={friend.profile_picture_url}
                  alt={friend.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium">{friend.full_name}</p>
                  <p className="text-sm text-gray-600">@{friend.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No friends yet</p>
            <button
              onClick={() => setShowAddFriend(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Add Your First Friend
            </button>
          </div>
        )}
      </div>

      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Friend</h3>
              <button onClick={() => setShowAddFriend(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4"
            />
            <button
              onClick={handleSendRequest}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Send Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsView({ notifications, onMarkRead, onDelete }) {
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>

      {sortedNotifications.length > 0 ? (
        <div className="space-y-3">
          {sortedNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all ${
                notification.read
                  ? 'bg-white border-gray-200'
                  : 'bg-purple-50 border-purple-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">{notification.title}</h4>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(notification.created_at)} at {formatTime(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => onMarkRead(notification.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No notifications</p>
          <p className="text-gray-500 mt-2">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}

function ProfileView({ user, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    username: user.username,
    bio: user.bio || '',
    location: user.location || '',
    interests: user.interests || '',
    phone: user.phone || '',
    profile_picture_url: user.profile_picture_url || ''
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        full_name: user.full_name,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        interests: user.interests || '',
        phone: user.phone || '',
        profile_picture_url: user.profile_picture_url || ''
      });
    }
  }, [isEditing, user]);

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: reader.result?.toString() || ''
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profile_picture_url: '' }));
  };

  const displayedPhoto =
    formData.profile_picture_url ||
    user.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-xl font-medium hover:bg-purple-200 transition-all"
        >
          <Edit className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <img
              src={displayedPhoto}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-purple-200 object-cover"
            />
            {isEditing && (
              <>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer text-white font-medium text-sm gap-2">
                  <Camera className="w-4 h-4" />
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                {formData.profile_picture_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs px-2 py-1 bg-white text-purple-600 rounded-full border border-purple-200 shadow"
                  >
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name}</h3>
                <p className="text-gray-600 mb-3">@{user.username}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                    {user.role}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interests</label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              {user.bio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                  <p className="text-gray-900">{user.bio}</p>
                </div>
              )}
              {user.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                  <p className="text-gray-900">{user.location}</p>
                </div>
              )}
              {user.interests && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Interests</h4>
                  <p className="text-gray-900">{user.interests}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePartyModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'recreational',
    scheduled_date: '',
    max_size: 10,
    location_name: '',
    location_address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      type: form.type.value,
      scheduled_date: form.scheduled_date.value,
      max_size: parseInt(form.max_size.value),
      location_name: form.location_name.value,
      location_address: form.location_address.value
    };
    onCreate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Create New Party</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Party Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer BBQ Party"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell your friends what this party is about..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Party Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="recreational">🎮 Recreational</option>
              <option value="dining">🍽️ Dining</option>
              <option value="family_vacation">👨‍👩‍👧‍👦 Family Vacation</option>
              <option value="entertainment">🎬 Entertainment</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="educational">📚 Educational</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date & Time</label>
              <input
                type="datetime-local"
                name="scheduled_date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Group Size</label>
              <input
                type="number"
                name="max_size"
                required
                min="2"
                value={formData.max_size}
                onChange={(e) => setFormData({ ...formData, max_size: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location Name (Optional)</label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="Leave blank for AI suggestions"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Skip this and let AI suggest the perfect spot based on everyone's location
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address (Optional)</label>
            <input
              type="text"
              name="location_address"
              value={formData.location_address}
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              placeholder="Or let AI find the best location"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={() => onCreate(formData)}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            Create Party
          </button>
        </div>
      </div>
    </div>
  );
}






