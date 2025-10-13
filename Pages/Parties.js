import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Party, PartyMember } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Users, MapPin, Clock, Filter, Code } from "lucide-react";
import { format } from "date-fns";
import JoinPartyDialog from "../Components/parties/JoinPartyDialog.js";

export default function Parties() {
  const [user, setUser] = useState(null);
  const [allParties, setAllParties] = useState([]);
  const [myParties, setMyParties] = useState([]);
  const [availableParties, setAvailableParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const parties = await Party.list("-created_date");
      setAllParties(parties);

      // Filter my parties
      const userParties = parties.filter(party => 
        party.host_id === currentUser.id || 
        party.member_ids?.includes(currentUser.id)
      );
      setMyParties(userParties);

      // Filter available parties
      const available = parties.filter(party => 
        party.host_id !== currentUser.id && 
        !party.member_ids?.includes(currentUser.id) &&
        party.status === "planning" &&
        (!party.max_size || (party.member_ids?.length || 0) < party.max_size)
      );
      setAvailableParties(available);

    } catch (error) {
      console.error("Error loading parties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterParties = (parties) => {
    return parties.filter(party => {
      const matchesSearch = party.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          party.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || party.type === typeFilter;
      const matchesStatus = statusFilter === "all" || party.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
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

  const PartyCard = ({ party, isMyParty = false }) => (
    <Link to={createPageUrl(`PartyDetails?id=${party.id}`)}>
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors line-clamp-1">
              {party.title}
            </CardTitle>
            <div className="flex gap-2 shrink-0">
              {isMyParty && party.host_id === user?.id && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">Host</Badge>
              )}
              <Badge className={`${getStatusColor(party.status)} border text-xs`}>
                {party.status}
              </Badge>
            </div>
          </div>
          <Badge className={`${getPartyTypeColor(party.type)} w-fit text-xs`}>
            {party.type.replace('_', ' ')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {party.description || "No description provided"}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-4 h-4" />
            <span>
              {(party.member_ids?.length || 0) + 1}
              {party.max_size && ` / ${party.max_size}`} members
            </span>
          </div>

          {party.scheduled_date && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(party.scheduled_date), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          )}

          {party.location_name && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{party.location_name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Code className="w-3 h-3" />
            <span>#{party.join_code}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-56 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:pr-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parties</h1>
          <p className="text-gray-500 mt-1">Discover and manage your social gatherings</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowJoinDialog(true)}
            className="flex-1 md:flex-none gap-2"
          >
            <Code className="w-4 h-4" />
            Join with Code
          </Button>
          <Link to={createPageUrl("CreateParty")} className="flex-1 md:flex-none">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Create Party
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="recreational">Recreational</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="family_vacation">Family Vacation</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
 