import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Party, PartyMember } from "@/entities/all";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, AlertCircle, CheckCircle } from "lucide-react";

export default function JoinPartyDialog({ open, onOpenChange, onSuccess }) {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const currentUser = await User.me();
      
      // Find party with matching join code
      const allParties = await Party.list();
      const party = allParties.find(p => p.join_code === joinCode.toUpperCase());
      
      if (!party) {
        setError("Invalid join code. Please check and try again.");
        return;
      }

      if (party.host_id === currentUser.id) {
        setError("You can't join your own party!");
        return;
      }

      if (party.member_ids?.includes(currentUser.id)) {
        setError("You're already a member of this party!");
        return;
      }

      if (party.max_size && (party.member_ids?.length || 0) >= party.max_size - 1) {
        setError("This party is full!");
        return;
      }

      if (party.status !== "planning") {
        setError("This party is no longer accepting new members.");
        return;
      }

      // Add user to party
      const updatedMemberIds = [...(party.member_ids || []), currentUser.id];
      await Party.update(party.id, { member_ids: updatedMemberIds });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        navigate(createPageUrl(`PartyDetails?id=${party.id}`));
        onOpenChange(false);
        setJoinCode("");
        setSuccess(false);
      }, 1500);

    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error("Error joining party:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setJoinCode("");
    setError("");
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Join Party with Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-code">Enter Party Code</Label>
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              className="text-center font-mono tracking-wider"
              disabled={loading || success}
            />
            <p className="text-xs text-gray-500">
              Ask the party host for their unique join code
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Successfully joined the party! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={!joinCode.trim() || loading || success}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Joining..." : "Join Party"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}