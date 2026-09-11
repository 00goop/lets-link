import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Party } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Users, MapPin, Clock, Sparkles } from "lucide-react";

export default function CreateParty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    max_size: "",
    scheduled_date: ""
  });

  const partyTypes = [
    { value: "recreational", label: "Recreational", icon: "🏃‍♀️", desc: "Sports, outdoor activities, games" },
    { value: "dining", label: "Dining", icon: "🍽️", desc: "Restaurants, cafes, food experiences" },
    { value: "family_vacation", label: "Family Vacation", icon: "👨‍👩‍👧‍👦", desc: "Family trips and getaways" },
    { value: "entertainment", label: "Entertainment", icon: "🎭", desc: "Movies, concerts, shows" },
    { value: "shopping", label: "Shopping", icon: "🛍️", desc: "Shopping trips and markets" },
    { value: "educational", label: "Educational", icon: "📚", desc: "Museums, workshops, learning" }
  ];

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = await User.me();
      const joinCode = generateJoinCode();

      const partyData = {
        ...formData,
        host_id: currentUser.id,
        join_code: joinCode,
        max_size: formData.max_size ? parseInt(formData.max_size) : null,
        member_ids: [],
        status: "planning"
      };

      const newParty = await Party.create(partyData);
      navigate(createPageUrl(`PartyDetails?id=${newParty.id}`));
    } catch (error) {
      console.error("Error creating party:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Party
          </h1>
          <p className="text-gray-500 mt-1">Plan your next adventure with friends</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Party Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="What's your party about?"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell people what to expect..."
                className="h-24 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Party Type */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Party Type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partyTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.type === type.value
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                  <p className="text-sm text-gray-500">{type.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Party Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date" className="text-sm font-medium">
                  <Clock className="w-4 h-4 inline mr-1" />
                  When is it happening?
                </Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_size" className="text-sm font-medium">
                  <Users className="w-4 h-4 inline mr-1" />
                  Max Group Size (optional)
                </Label>
                <Input
                  id="max_size"
                  type="number"
                  min="2"
                  max="100"
                  value={formData.max_size}
                  onChange={(e) => handleInputChange('max_size', e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className="h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="h-12 px-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.title || !formData.type}
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? "Creating..." : "Create Party"}
          </Button>
        </div>
      </form>
    </div>
  );
}