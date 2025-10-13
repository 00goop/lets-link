
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadFile } from "@/integrations/Core";
import { Photo, Notification } from "@/entities/all"; // Added Notification import
import { Camera, Plus, Upload, Image as ImageIcon } from 'lucide-react';

export default function SharedAlbum({ party, photos, currentUser, isUserMember, onPhotoUpload }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await Photo.create({
        party_id: party.id,
        uploader_id: currentUser.id,
        file_url,
        caption,
        likes: []
      });

      // Send notifications to other party members
      const memberIdsToNotify = [party.host_id, ...(party.member_ids || [])].filter(id => id !== currentUser.id);
      for (const memberId of memberIdsToNotify) {
        await Notification.create({
          user_id: memberId,
          type: "photo_tagged", // Re-using for general photo uploads
          title: "New Photo in Party",
          message: `${currentUser.full_name} added a new photo to "${party.title}".`,
          related_id: party.id
        });
      }

      setShowUploadDialog(false);
      setFile(null);
      setCaption("");
      onPhotoUpload();
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-600" />
            Shared Album
          </CardTitle>
          {isUserMember && (
            <Button onClick={() => setShowUploadDialog(true)} className="gap-2 bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4" /> Upload Photo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative aspect-square group overflow-hidden rounded-lg">
                  <img src={photo.file_url} alt={photo.caption || 'Party photo'} className="w-full h-full object-cover" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-lg">No Photos Yet</h3>
              <p>Be the first to upload a photo from this party!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Upload Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Photo File
              </label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                Caption (optional)
              </label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a description..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
