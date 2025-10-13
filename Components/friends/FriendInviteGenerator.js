import React, { useState, useCallback } from "react";
import { User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function FriendInviteGenerator() {
  const [user, setUser] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generateInviteLink = useCallback((userId) => {
    const link = `${window.location.origin}${createPageUrl(`AddFriend?user=${userId}`)}`;
    setInviteLink(link);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      generateInviteLink(currentUser.id);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, [generateInviteLink]);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Add me as a friend on Let's Link!",
          text: `Hi! I'd like to connect with you on Let's Link. Click this link to add me as a friend:`,
          url: inviteLink
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard();
    }
  };

  if (!user) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Share2 className="w-5 h-5" />
          Share Your Friend Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Share this link with anyone you want to add as a friend. They can click it to send you a friend request instantly!
        </p>
        
        <div className="flex gap-2">
          <Input
            value={inviteLink}
            readOnly
            className="text-xs bg-gray-50"
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <Button onClick={shareViaWebShare} className="w-full bg-gray-900 hover:bg-gray-800 gap-2">
          <Share2 className="w-4 h-4" />
          Share Friend Link
        </Button>
      </CardContent>
    </Card>
  );
}