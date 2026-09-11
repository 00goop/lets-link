
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Party, Photo, PartyMember, Poll as PollEntity } from "@/entities/all"; // Added Poll entity
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PartyHeader from "../components/partydetails/PartyHeader";
import MembersList from "../Components/partydetails/MembersList.js";
import LocationSuggestions from "../components/partydetails/LocationSuggestions";
import SharedAlbum from "../components/partydetails/SharedAlbum";
import LiveLocationMap from "../components/partydetails/LiveLocationMap";
import Polls from "../components/partydetails/Polls";
import FoodFinder from "../components/partydetails/FoodFinder"; // New import

export default function PartyDetails() {
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [host, setHost] = useState(null);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partyMembers, setPartyMembers] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get("id");

  const loadPartyDetails = useCallback(async () => {
    if (!partyId) {
        setLoading(false);
        return;
    }
    // Don't set loading to true here to allow for background refresh
    try {
      const user = await User.me();
      setCurrentUser(user);

      const partyData = await Party.get(partyId);
      setParty(partyData);
      
      const allPartyMembers = await PartyMember.filter({ party_id: partyId });
      setPartyMembers(allPartyMembers);

      const allUsers = await User.list();
      
      const hostData = allUsers.find(u => u.id === partyData.host_id);
      setHost(hostData);

      const memberData = allUsers.filter(u => partyData.member_ids?.includes(u.id));
      setMembers(memberData);

      const partyPhotos = await Photo.filter({ party_id: partyId }, "-created_date");
      setPhotos(partyPhotos);

    } catch (error) {
      console.error("Error loading party details:", error);
      // Optional: navigate to a 404 or error page
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    loadPartyDetails();
  }, [loadPartyDetails]);
  
  const handleStartPoll = async (suggestions) => {
    const pollOptions = suggestions.map(s => JSON.stringify(s)); // Store full suggestion object as a string
    await PollEntity.create({
      party_id: party.id,
      created_by: currentUser.id,
      question: `Which location should we go to for "${party.title}"?`,
      options: pollOptions,
      status: 'open'
    });
    // The Polls component will automatically refresh via its own useEffect
  };

  const isUserMember = party?.host_id === currentUser?.id || party?.member_ids?.includes(currentUser?.id);
  const isHost = party?.host_id === currentUser?.id;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-10 w-24 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-48 bg-gray-200 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Party not found</h1>
        <p className="text-gray-500 mb-6">
          The party you're looking for doesn't exist or may have been removed.
        </p>
        <Link to={createPageUrl("Dashboard")}>
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:pr-6 space-y-8">
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(createPageUrl("Parties"))}
        className="gap-2 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parties
      </Button>
      
      {/* Party Header */}
      <PartyHeader 
        party={party}
        host={host}
        currentUser={currentUser}
        onPartyUpdate={loadPartyDetails}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Live Location Map */}
          {isUserMember && (
            <LiveLocationMap
              party={party}
              currentUser={currentUser}
              partyMembers={partyMembers}
              allUsers={[host, ...members].filter(Boolean)}
            />
          )}

          {/* Polls */}
          {isUserMember && (
            <Polls 
              party={party}
              currentUser={currentUser}
              isHost={isHost}
              partyMembers={partyMembers}
            />
          )}

          {/* Location Suggestions */}
          <LocationSuggestions 
            party={party}
            currentUser={currentUser}
            isUserMember={isUserMember}
            onPartyUpdate={loadPartyDetails}
            onStartPoll={handleStartPoll}
          />

          {/* Food Finder */}
          {party.location_name && ( 
             <FoodFinder partyLocation={party} />
          )}
          
          {/* Shared Album */}
          <SharedAlbum
            party={party}
            photos={photos}
            currentUser={currentUser}
            isUserMember={isUserMember}
            onPhotoUpload={loadPartyDetails}
          />
        </div>
        
        {/* Members List */}
        <div className="lg:col-span-1">
          <MembersList 
            host={host} 
            members={members} 
            maxSize={party.max_size}
          />
        </div>
      </div>
    </div>
  );
}
