
import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/integrations/Core";
import { User as UserIcon, Mail, Calendar, MapPin, Save, Settings, Camera, Upload } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    username: "", // New field
    bio: "",
    location: "",
    interests: "",
    phone: "",
    profile_picture_url: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData({
        username: currentUser.username || "", // Initialize new field
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        interests: currentUser.interests || "",
        phone: currentUser.phone || "",
        profile_picture_url: currentUser.profile_picture_url || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData(formData);
      await loadProfile();
      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
      await User.updateMyUserData({ profile_picture_url: file_url });
      loadProfile(); // Reload profile to update UI with new image
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ProfileAvatar component
  const ProfileAvatar = ({ size = "24", editable = false }) => (
    <div className={`relative w-${size} h-${size} group`}>
      {user?.profile_picture_url ? (
        <img
          src={user.profile_picture_url}
          alt={user.full_name || "User Avatar"}
          className={`w-${size} h-${size} rounded-full object-cover border-4 border-white shadow-lg`}
        />
      ) : (
        <div className={`w-${size} h-${size} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-white/30 shadow-lg`}>
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
      {editable && editMode && (
        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          {uploadingImage ? (
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={uploadingImage}
          />
        </label>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:pr-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? "outline" : "default"}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {editMode ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-0 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Replaced existing avatar display with ProfileAvatar component */}
            <ProfileAvatar size="24" editable={true} />
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{user?.full_name}</h2>
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <span className="text-lg">@{user?.username || 'username-not-set'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(user?.created_date).toLocaleDateString()}</span>
              </div>
              <Badge className="mt-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
                {user?.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {editMode ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="e.g. john_doe_2024"
                  className="h-12"
                />
                <p className="text-xs text-gray-500">
                  Your unique username that others can use to find and add you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
 