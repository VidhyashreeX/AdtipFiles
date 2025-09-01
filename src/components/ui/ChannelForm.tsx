import React, { useState } from "react";
import { Save, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/ui/uploadzone";
import { cn } from "@/lib/utils";

interface ChannelFormProps {
  onSave?: (data: ChannelFormData) => void;
  initialData?: Partial<ChannelFormData>;
}

export interface ChannelFormData {
  channelName: string;
  description: string;
  coverImage?: File;
  profileImage?: File;
  channelId?: string;
}
export interface Channel {
  channelId: number;
  channelName: string;
  description: string;
  channelUrl: string;
  profileImage: string;
  profileCoverImage: string;
  totalSubscribers: number;
  totalVideos: number;
  totalShorts: number;
  createdBy: number;
  updatedBy: number;
  createddate: string;
  updateddate: string;
  total_ads_display: number;
  total_ads_like: number;
  total_ads_view: number;
  total_earnings: number;
  totalReels: number;
}

export function ChannelForm({ onSave, initialData }: ChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    channelName: initialData?.channelName || "",
    description: initialData?.description || "",
  });

  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const maxDescriptionLength = 500;

  const handleInputChange = (field: keyof ChannelFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    if (field === "description" && value.length > maxDescriptionLength) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverImageSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, coverImage: file }));
    const reader = new FileReader();
    reader.onload = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileImageSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, profileImage: file }));
    const reader = new FileReader();
    reader.onload = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave?.(formData);
  };

  const isFormValid = formData.channelName.trim().length > 0;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Title */}
      <h1 className="text-xl font-semibold text-center">Channel Settings</h1>

      {/* Cover Image */}
      <div>
        {coverImagePreview ? (
          <div className="relative h-40 rounded-lg overflow-hidden bg-muted shadow-md">
            <img src={coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
              onClick={() => {
                setCoverImagePreview(null);
                setFormData((prev) => ({ ...prev, coverImage: undefined }));
              }}
              aria-label="Remove cover image"
            >
              <Plus className="h-4 w-4 rotate-45" />
            </Button>
          </div>
        ) : (
          <UploadZone
            variant="cover"
            onFileSelect={handleCoverImageSelect}
            className="h-40 rounded-lg border border-dashed border-border cursor-pointer"
          />
        )}
      </div>

      {/* Profile Image */}
      <div className="flex justify-center">
        <div className="relative">
          {profileImagePreview ? (
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-md">
                <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-success hover:bg-success/90 border-2 border-background"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleProfileImageSelect(file);
                  };
                  input.click();
                }}
              >
                <Camera className="h-3 w-3 text-success-foreground" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <UploadZone
                variant="profile"
                onFileSelect={handleProfileImageSelect}
                className="rounded-full cursor-pointer"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-success hover:bg-success/90 border-2 border-background"
              >
                <Camera className="h-3 w-3 text-success-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="channelName">Channel Name *</Label>
          <Input
            id="channelName"
            value={formData.channelName}
            onChange={handleInputChange("channelName")}
            placeholder="Enter channel name"
            className="h-12"
          />
        </div>

        <div className="relative">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange("description")}
            placeholder="Tell people what your channel is about..."
            className="min-h-[120px] resize-none"
            maxLength={maxDescriptionLength}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {formData.description.length}/{maxDescriptionLength}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSave}
        disabled={!isFormValid}
        className="w-full h-12 font-semibold text-base shadow-form disabled:opacity-50"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Channel
      </Button>
    </div>
  );
}
