import React, { useState, useEffect } from "react";
import { User, Friend, Notification } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserPlus, Users, Search, User as UserIcon, Check, X, Clock, Sparkles } from "lucide-react";
import FriendInviteGenerator from "../Components/friends/FriendInviteGenerator.js";

export default function Friends() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allFriendships = await Friend.list();
      
      const acceptedFriends = allFriendships.filter(
        f => f.status === "accepted" && 
        (f.requester_id === currentUser.id || f.recipient_id === currentUser.id)
      );
      setFriends(acceptedFriends);

      const pending = allFriendships.filter(
        f => f.status === "pending" && f.recipient_id === currentUser.id
      );
      setPendingRequests(pending);

      const sent = allFriendships.filter(
        f => f.status === "pending" && f.requester_id === currentUser.id
      );
      setSentRequests(sent);

    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (username) => {
    try {
      const allUsers = await User.list();
      const targetUser = allUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
      
      if (!targetUser) {
        alert("User not found with that username.");
        return;
      }

      if (targetUser.id === user.id) {
        alert("You can't send a friend request to yourself!");
        return;
      }

      const allFriendships = await Friend.list();
      const existingFriendship = allFriendships.find(f => 
        (f.requester_id === user.id && f.recipient_id === targetUser.id) ||
        (f.requester_id === targetUser.id && f.recipient_id === user.id)
      );

      if (existingFriendship) {
        if (existingFriendship.status === "accepted") {
          alert("You're already friends with this person!");
        } else if (existingFriendship.status === "pending") {
          alert("Friend request already sent or pending!");
        }
        return;
      }

      await Friend.create({
        requester_id: user.id,
        recipient_id: targetUser.id,
        status: "pending"
      });

      await Notification.create({
        user_id: targetUser.id,
        type: "friend_request",
        title: "New Friend Request",
        message: `${user.full_name} sent you a friend request`,
        related_id: user.id
      });

      setSearchTerm("");
      loadData();
      
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const respondToRequest = async (friendshipId, response) => {
    try {
      await Friend.update(friendshipId, { status: response });
      loadData();
    } catch (error) {
      console.error("Error responding to friend request:", error);
    }
  };

  const getUserName = async (userId) => {
    try {
      const allUsers = await User.list();
      const user = allUsers.find(u => u.id === userId);
      return user?.full_name || "Unknown User";
    } catch {
      return "Unknown User";
    }
  };

  const FriendCard = ({ friendship }) => {
    const [friendName, setFriendName] = useState("");
    const friendId = friendship.requester_id === user.id 
      ? friendship.recipient_id 
      : friendship.requester_id;

    useEffect(() => {
      getUserName(friendId).then(setFriendName);
    }, [friendId]);

    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {friendName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{friendName}</h3>
              <p className="text-sm text-gray-500">Friends since {new Date(friendship.created_date).toLocaleDateString()}</p>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              Friends
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  const RequestCard = ({ request, type }) => {
    const [requesterName, setRequesterName] = useState("");

    useEffect(() => {
      getUserName(request.requester_id).then(setRequesterName);
    }, [request.requester_id]);

    if (type === "sent") {
      return (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Request Sent</h3>
                <p className="text-sm text-gray-600">Waiting for response</p>
              </div>
              <Badge className="bg-orange-500 text-white border-0">Pending</Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {requesterName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{requesterName}</h3>
              <p className="text-sm text-gray-600">Wants to be your friend</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => respondToRequest(request.id, "accepted")}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respondToRequest(request.id, "declined")}
                className="border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-1/4"></div>
 