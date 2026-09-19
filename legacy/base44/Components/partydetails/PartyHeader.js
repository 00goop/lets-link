
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Party } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Users, MapPin, Clock, Code, Share2, LogIn, LogOut, Edit, 
  CheckCircle, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PartyHeader({ party, host, currentUser, onPartyUpdate }) {
  const navigate = useNavigate();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [ending, setEnding] = useState(false);

  const isHost = party.host_id === currentUser?.id;
  const isMember = party.member_ids?.includes(currentUser?.id);
  const canJoin = !isHost && !isMember && party.status === 'planning' && (!party.max_size || (party.member_ids?.length || 0) < party.max_size - 1);

  const handleJoinParty = async () => {
    if (!canJoin) return;
    const updatedMemberIds = [...(party.member_ids || []), currentUser.id];
    await Party.update(party.id, { member_ids: updatedMemberIds });
    onPartyUpdate();
  };

  const handleLeaveParty = async () => {
    if (!isMember) return;
    const updatedMemberIds = party.member_ids.filter(id => id !== currentUser.id);
    await Party.update(party.id, { member_ids: updatedMemberIds });
    navigate(createPageUrl("Parties"));
  };

  const handleEndParty = async () => {
    setEnding(true);
    try {
      await Party.update(party.id, { status: "completed" });
      onPartyUpdate();
      setShowEndDialog(false);
    } catch (error) {
      console.error("Error ending party:", error);
    } finally {
      setEnding(false);
    }
  };
  
  const getPartyTypeColor = (type) => {
    const colors = {
      recreational: "bg-emerald-100 text-emerald-700",
      dining: "bg-orange-100 text-orange-700",
      family_vacation: "bg-purple-100 text-purple-700",
      entertainment: "bg-pink-100 text-pink-700",
      shopping: "bg-blue-100 text-blue-700",
      educational: "bg-yellow-100 text-yellow-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };
  
  const getStatusColor = (status) => {
    const colors = {
      planning: "bg-blue-50 text-blue-600 border-blue-200",
      confirmed: "bg-green-50 text-green-600 border-green-200",
      completed: "bg-gray-50 text-gray-600 border-gray-200",
      cancelled: "bg-red-50 text-red-600 border-red-200"
    };
    return colors[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const copyJoinLink = () => {
    const joinLink = `${window.location.origin}${createPageUrl(`PartyDetails?id=${party.id}`)}`;
    navigator.clipboard.writeText(joinLink);
    alert('Join link copied to clipboard!');
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${getPartyTypeColor(party.type)}`}>{party.type.replace(/_/g, ' ')}</Badge>
                <Badge className={`${getStatusColor(party.status)} border`}>
                  {party.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {party.status}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{party.title}</h1>
              <p className="mt-2 text-lg text-blue-100">{party.description}</p>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {isHost && party.status !== 'completed' && party.status !== 'cancelled' && (
                <>
                  <Button variant="secondary" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 gap-2">
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button 
                    onClick={() => setShowEndDialog(true)} 
                    variant="outline" 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> End Party
                  </Button>
                </>
              )}
              {isMember && !isHost && party.status !== 'completed' && (
                <Button onClick={handleLeaveParty} variant="destructive" className="gap-2">
                  <LogOut className="w-4 h-4" /> Leave Party
                </Button>
              )}
              {canJoin && (
                <Button onClick={handleJoinParty} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <LogIn className="w-4 h-4" /> Join Party
                </Button>
              )}
              <Button onClick={copyJoinLink} variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30 gap-2">
                <Share2 className="w-4 h-4" /> Share Invite
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {party.scheduled_date ? format(new Date(party.scheduled_date), "MMM d, h:mm a") : 'Not set'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Members</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {(party.member_ids?.length || 0) + 1}
                {party.max_size ? ` / ${party.max_size}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><MapPin className="w-5 h-5 text-green-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">{party.location_name || 'TBD'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg"><Code className="w-5 h-5 text-orange-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Join Code</p>
              <p className="font-semibold text-gray-800 font-mono text-lg sm:text-xl tracking-wider">{party.join_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* End Party Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              End Party?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end this party? This will mark it as completed and members won't be able to make new changes or uploads.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndParty} disabled={ending} className="bg-red-600 hover:bg-red-700">
              {ending ? "Ending..." : "End Party"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
