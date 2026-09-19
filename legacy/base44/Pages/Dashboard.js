import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Party, PartyMember } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, MapPin, Clock, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [myParties, setMyParties] = useState([]);
  const [availableParties, setAvailableParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allParties = await Party.list("-created_date");
      const userParties = allParties.filter(party => 
        party.host_id === currentUser.id || 
        party.member_ids?.includes(currentUser.id)
      );
      setMyParties(userParties);

      const available = allParties.filter(party => 
        party.host_id !== currentUser.id && 
        !party.member_ids?.includes(currentUser.id) &&
        party.status === "planning" &&
        (!party.max_size || (party.member_ids?.length || 0) < party.max_size)
      ).slice(0, 6);
      setAvailableParties(available);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPartyTypeIcon = (type) => {
    const icons = {
      recreational: "🏃‍♂️",
      dining: "🍽️",
      family_vacation: "👨‍👩‍👧‍👦",
      entertainment: "🎭",
      shopping: "🛍️",
      educational: "📚"
    };
    return icons[type] || "🎉";
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: "bg-blue-100 text-blue-700 border-blue-200",
      confirmed: "bg-green-100 text-green-700 border-green-200",
      completed: "bg-gray-100 text-gray-700 border-gray-200",
      cancelled: "bg-red-100 text-red-700 border-red-200"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-xl w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:pr-6 space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <span className="text-sm font-semibold text-purple-200">Welcome back!</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">
                Hey, {user?.full_name?.split(' ')[0] || 'Friend'}! 👋
              </h1>
              <p className="text-purple-100 text-lg">
                Ready to create amazing memories?
              </p>
            </div>
            <Link to={createPageUrl("CreateParty")}>
              <Button className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <Plus className="w-5 h-5 mr-2" />
                Create Party
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-l-blue-500">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{myParties.length}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">My Parties</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{availableParties.length}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Available</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {myParties.filter(p => p.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-1">Confirmed</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {myParties.filter(p => p.status === 'planning').length}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-1">Planning</div>
          </CardContent>
        </Card>
      </div>

      {/* My Parties Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">My Parties</h2>
          </div>
          <Link to={createPageUrl("Parties")}>
            <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {myParties.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No parties yet</h3>
              <p className="text-gray-600 mb-6">Start your adventure by creating your first party!</p>
              <Link to={createPageUrl("CreateParty")}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Party
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myParties.slice(0, 6).map((party) => (
              <Link key={party.id} to={createPageUrl(`PartyDetails?id=${party.id}`)}>
                <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-3xl">{getPartyTypeIcon(party.type)}</div>
                      <Badge variant="outline" className={`border ${getStatusColor(party.status)} text-xs font-semibold`}>
                        {party.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors">
                      {party.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{party.description}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{(party.member_ids?.length || 0) + 1} members</span>
                    </div>

                    {party.scheduled_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4 text-pink-500" />
                        <span className="font-medium">{format(new Date(party.scheduled_date), "MMM d, yyyy")}</span>
                      </div>
                    )}

                    {party.location_name && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="font-medium truncate">{party.location_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Available Parties Section */}
      {availableParties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Available Parties</h2>
            </div>
            <Link to={createPageUrl("Parties")}>
              <Button variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                Explore More
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableParties.map((party) => (
              <Link key={party.id} to={createPageUrl(`PartyDetails?id=${party.id}`)}>
                <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-3xl">{getPartyTypeIcon(party.type)}</div>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold border-0 shadow-md">
                        Open
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-emerald-600 transition-colors">
                      {party.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{party.description}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">
                        {(party.member_ids?.length || 0) + 1}
                        {party.max_size && ` / ${party.max_size}`} members
                      </span>
                    </div>

                    {party.scheduled_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4 text-teal-500" />
                        <span className="font-medium">{format(new Date(party.scheduled_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}