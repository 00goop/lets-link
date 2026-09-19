import React, { useState, useEffect, useCallback } from 'react';
import { Poll, Vote } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Vote as VoteIcon, CheckCircle, BarChart2, Info } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Haversine formula to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance * 0.621371; // Convert to miles
};

function PollItem({ poll, currentUser, onVote, onClosePoll, partyMembers }) {
  const [votes, setVotes] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);

  const isHost = poll.created_by === currentUser.id;

  const loadVotes = useCallback(async () => {
    const pollVotes = await Vote.filter({ poll_id: poll.id });
    setVotes(pollVotes);
    setTotalVotes(pollVotes.length);
    const currentUserVote = pollVotes.find(v => v.user_id === currentUser.id);
    setUserVote(currentUserVote);
  }, [poll.id, currentUser.id]);

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  const handleVote = async (option) => {
    await onVote(poll.id, option);
    loadVotes();
  };

  const hasVoted = !!userVote;

  // Function to render poll option details
  const renderOption = (option, isLocation) => {
    if (!isLocation) return <div className="font-medium">{option}</div>;
    
    const location = JSON.parse(option);
    return (
      <div className="text-left">
        <div className="font-bold text-gray-900">{location.name}</div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
          <span>⭐ {location.rating || 'N/A'}</span>
          <span>{location.price_level || ''}</span>
        </div>
      </div>
    );
  };
  
  const isLocationPoll = poll.options[0]?.includes('{');

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-900 mb-4">{poll.question}</h4>
        {isHost && poll.status === 'open' && (
          <Button size="sm" variant="outline" onClick={() => onClosePoll(poll.id)}>Close Poll</Button>
        )}
        {poll.status === 'closed' && (
          <div className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded-full">Closed</div>
        )}
      </div>
      <div className="space-y-3">
        {poll.options.map(option => {
          const voteCount = votes.filter(v => v.selected_option === option).length;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isUserChoice = userVote?.selected_option === option;

          if (!hasVoted && poll.status === 'open') {
            return (
              <Button key={option} variant="outline" className="w-full justify-start h-auto py-2" onClick={() => handleVote(option)}>
                {renderOption(option, isLocationPoll)}
              </Button>
            );
          }

          return (
            <div key={option} className={`p-3 rounded-md ${isUserChoice ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center text-sm mb-1">
                <div className={`flex-1 ${isUserChoice ? 'text-blue-800' : 'text-gray-700'}`}>
                   {renderOption(option, isLocationPoll)}
                </div>
                <span className="text-gray-500 ml-4">{voteCount} votes ({Math.round(percentage)}%)</span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Polls({ party, currentUser, isHost, partyMembers }) {
  const [polls, setPolls] = useState([]);
  
  const loadPolls = useCallback(async () => {
    const partyPolls = await Poll.filter({ party_id: party.id }, "-created_date");
    setPolls(partyPolls);
  }, [party.id]);

  useEffect(() => {
    loadPolls();
    const interval = setInterval(loadPolls, 5000); // Refresh polls every 5 seconds
    return () => clearInterval(interval);
  }, [loadPolls]);

  const handleVote = async (pollId, option) => {
    const existingVotes = await Vote.filter({ poll_id: pollId, user_id: currentUser.id });
    if(existingVotes.length > 0) {
        await Vote.update(existingVotes[0].id, { selected_option: option });
    } else {
        await Vote.create({
            poll_id: pollId,
            user_id: currentUser.id,
            selected_option: option
        });
    }
  };
  
  const handleClosePoll = async (pollId) => {
    await Poll.update(pollId, { status: 'closed' });
    loadPolls();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <VoteIcon className="w-5 h-5 text-purple-600" />
          Party Polls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {polls.length > 0 ? (
          polls.map(poll => (
            <PollItem 
              key={poll.id} 
              poll={poll} 
              currentUser={currentUser} 
              onVote={handleVote} 
              onClosePoll={handleClosePoll}
              partyMembers={partyMembers}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-lg">No polls yet</h3>
            <p>{isHost ? "Suggest some locations to start a poll!" : "The host hasn't created any polls yet."}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}