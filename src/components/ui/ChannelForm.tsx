import React, { useState, useEffect } from "react";
import { Save, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/ui/uploadzone";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import api from "../../services/api";

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
  const { user } = useAuth();
  const [formData, setFormData] = useState<ChannelFormData>({
    channelName: initialData?.channelName || "",
    description: initialData?.description || "",
  });

  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [existingChannels, setExistingChannels] = useState<any[]>([]);
  const [showChannelWarning, setShowChannelWarning] = useState(false);
  const maxDescriptionLength = 500;

  // Check for existing channels when component mounts
  useEffect(() => {
    const checkExistingChannels = async () => {
      if (!user?.id) return;

      try {
        const token = localStorage.getItem('UserLoggedIn');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/getchannelbyuserid/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.status && data.data && data.data.length > 0) {
            setExistingChannels(data.data);
            setShowChannelWarning(true);
          }
        }
      } catch (error) {
        console.error('❌ Error checking existing channels:', error);
      }
    };

    checkExistingChannels();
  }, [user?.id]);

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

  const handleSave = async () => {
    if (!user?.id) {
      console.error('No user ID available for channel creation');
      return;
    }

    setIsCreating(true);
    try {
      // Create the channel via API - using direct fetch to ensure localhost
      const token = localStorage.getItem('UserLoggedIn');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/savemychannel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user.id,
          name: formData.channelName,
          description: formData.description,
          // Add image uploads if needed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Extract channelId from response
      const channelId = responseData?.data?.[0]?.channelId || responseData?.channelId;
      
      if (channelId) {
        // Update formData with the channelId
        const updatedFormData = {
          ...formData,
          channelId: String(channelId)
        };
        
        onSave?.(updatedFormData);
      } else {
        throw new Error('Channel creation failed - no channelId returned');
      }
    } catch (error) {
      console.error('❌ Error creating channel:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = formData.channelName.trim().length > 0;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Title */}
      <h1 className="text-xl font-semibold text-center">Channel Settings</h1>

      {/* Warning for existing channels */}
      {showChannelWarning && existingChannels.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Warning: You already have existing channels
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You currently have {existingChannels.length} channel(s):</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {existingChannels.map((channel, index) => (
                    <li key={index} className="font-medium">
                      {channel.channelName} (ID: {channel.channelId})
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Creating another channel will add to your existing channels. 
                  Consider using your existing channel instead.
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200 transition-colors"
                  onClick={() => setShowChannelWarning(false)}
                >
                  I understand, continue creating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        disabled={!isFormValid || isCreating}
        className="w-full h-12 font-semibold text-base shadow-form disabled:opacity-50"
      >
        <Save className="w-4 h-4 mr-2" />
        {isCreating ? 'Creating Channel...' : 'Save Channel'}
      </Button>
    </div>
  );
}
