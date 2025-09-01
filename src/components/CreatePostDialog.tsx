import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { ChannelRequiredDialog } from "./ChannelRequiredDialog";
import { uploadToR2 } from '../services/r2UploadService';
import { ImageIcon, Video, Play, Upload } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postType: 'create-post' | 'tip-tube' | 'tip-shorts';
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({
  open,
  onOpenChange,
  postType
}) => {
  const { user } = useAuth();
  const token = localStorage.getItem('UserLoggedIn');
  
  // Common states
  const [isLoading, setIsLoading] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  
  // Create Post states
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isPromoted, setIsPromoted] = useState(false);
  const [postImages, setPostImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Video states
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoCategory, setVideoCategory] = useState('');
  const [videoQuality, setVideoQuality] = useState('');
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [isEarnMoney, setIsEarnMoney] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  // Short video states
  const [shortVideo, setShortVideo] = useState<File | null>(null);
  const [shortVideoPreview, setShortVideoPreview] = useState<string>('');
  const [isEarnMoneyShort, setIsEarnMoneyShort] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const shortVideoInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection for Create Post
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + postImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error("Please select only image files");
      return;
    }
    
    setPostImages(prev => [...prev, ...validFiles]);
    
    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [postImages]);

  // Handle video selection
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }

    setSelectedVideo(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  }, []);

  // Handle short video selection
  const handleShortVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }

    setShortVideo(file);
    const previewUrl = URL.createObjectURL(file);
    setShortVideoPreview(previewUrl);
  }, []);

  // Handle thumbnail selection
  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  }, []);

  // Remove image
  const removeImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Create Post submission
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // TODO: Implement create post API call
    toast.success("Post created successfully!");
    onOpenChange(false);
  };

  // Handle Video upload
  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.channelId) {
      setShowChannelDialog(true);
      return;
    }

    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    if (!videoTitle || !videoDescription || !videoCategory || !videoQuality || !selectedVideo) {
      toast.error("Please fill all required fields and select a video");
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Upload video to R2
      const videoResult = await uploadToR2(selectedVideo, 'videos', user.id);
      const videoUrl = videoResult.url;
      
      // Step 2: Upload thumbnail to R2
      let thumbnailUrl = '';
      if (thumbnailFile) {
        const thumbnailResult = await uploadToR2(thumbnailFile, 'thumbnails', user.id);
        thumbnailUrl = thumbnailResult.url;
      } else {
        // Create placeholder thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 320, 240);
          ctx.fillStyle = '#666';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Video Thumbnail', 160, 120);
        }
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
        const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
        const placeholderResult = await uploadToR2(placeholderFile, 'thumbnails', user.id);
        thumbnailUrl = placeholderResult.url;
      }

      // Step 3: Call API with R2 URLs
      const requestData = {
        name: videoTitle,
        videoDesciption: videoDescription,
        categoryId: videoCategory,
        channelId: user.channelId,
        videoLink: videoUrl,
        video_Thumbnail: thumbnailUrl,
        isShot: postType === 'tip-shorts' ? 1 : 0,
        play_duration: "0", // You can calculate this if needed
        promotional_price: "0",
        isPaid: isPaidVideo ? 1 : 0,
        quality: videoQuality,
        earnMoney: isEarnMoney ? 1 : 0
      };

      const response = await fetch('https://api.adtip.in/api/uploadshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Video uploaded successfully!");
        onOpenChange(false);
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Short upload
  const handleShortUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.channelId) {
      setShowChannelDialog(true);
      return;
    }

    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    if (!shortVideo) {
      toast.error("Please select a video");
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload short video to R2
      const videoResult = await uploadToR2(shortVideo, 'videos', user.id);
      const videoUrl = videoResult.url;
      
      // Create placeholder thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Short Video Thumbnail', 160, 120);
      }
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
      const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
      const thumbnailResult = await uploadToR2(placeholderFile, 'thumbnails', user.id);
      const thumbnailUrl = thumbnailResult.url;

      // Call API with R2 URLs
      const requestData = {
        name: `Short Video ${Date.now()}`,
        videoDesciption: "Short video content",
        categoryId: "entertainment",
        channelId: user.channelId,
        videoLink: videoUrl,
        video_Thumbnail: thumbnailUrl,
        isShot: 1,
        play_duration: "0",
        promotional_price: "0",
        isPaid: 0,
        quality: "standard",
        earnMoney: isEarnMoneyShort ? 1 : 0
      };

      const response = await fetch('https://api.adtip.in/api/uploadshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast.success("Short video uploaded successfully!");
        onOpenChange(false);
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload short video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPostTitle('');
    setPostContent('');
    setIsPromoted(false);
    setPostImages([]);
    setImagePreviews([]);
    setVideoTitle('');
    setVideoDescription('');
    setVideoCategory('');
    setVideoQuality('');
    setIsPaidVideo(false);
    setIsEarnMoney(false);
    setSelectedVideo(null);
    setVideoPreview('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShortVideo(null);
    setShortVideoPreview('');
    setIsEarnMoneyShort(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const getDialogTitle = () => {
    switch (postType) {
      case 'create-post': return 'Create Post';
      case 'tip-tube': return 'Upload Video (TipTube)';
      case 'tip-shorts': return 'Create Short (TipShot)';
      default: return 'Create Content';
    }
  };

  const getDialogDescription = () => {
    switch (postType) {
      case 'create-post': return 'Share your thoughts and media with your audience.';
      case 'tip-tube': return 'Upload your video content and monetize your creativity.';
      case 'tip-shorts': return 'Create engaging short videos for your followers.';
      default: return 'Create and share content with your audience.';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          {/* Create Post Form */}
          {postType === 'create-post' && (
            <form onSubmit={handleCreatePost} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="postTitle">Title *</Label>
                <Input
                  id="postTitle"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Add title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postContent">What's on your mind? *</Label>
                <Textarea
                  id="postContent"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="promoted"
                  checked={isPromoted}
                  onCheckedChange={setIsPromoted}
                />
                <Label htmlFor="promoted">Promoted post</Label>
              </div>

              <div className="space-y-2">
                <Label>Upload Media (up to 5 images)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </button>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Publishing...' : 'Publish Post'}
              </Button>
            </form>
          )}

          {/* Upload Video (TipTube) Form */}
          {postType === 'tip-tube' && (
            <form onSubmit={handleVideoUpload} className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="earnMoney"
                  checked={isEarnMoney}
                  onCheckedChange={setIsEarnMoney}
                />
                <Label htmlFor="earnMoney">Earn money while upload video</Label>
              </div>

              <div className="space-y-2">
                <Label>Video *</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Video
                  </Button>
                  {videoPreview && (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full rounded border"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Select Thumbnail
                  </Button>
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Video Details</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="videoTitle">Title *</Label>
                  <Input
                    id="videoTitle"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoDescription">Description *</Label>
                  <Textarea
                    id="videoDescription"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Enter video description"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoCategory">Category *</Label>
                    <Select value={videoCategory} onValueChange={setVideoCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoQuality">Quality *</Label>
                    <Select value={videoQuality} onValueChange={setVideoQuality} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (480p)</SelectItem>
                        <SelectItem value="standard">Standard (720p)</SelectItem>
                        <SelectItem value="high">High (1080p)</SelectItem>
                        <SelectItem value="ultra">Ultra (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="paidVideo"
                    checked={isPaidVideo}
                    onCheckedChange={setIsPaidVideo}
                  />
                  <Label htmlFor="paidVideo">Paid video</Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </form>
          )}

          {/* Create Short (TipShot) Form */}
          {postType === 'tip-shorts' && (
            <form onSubmit={handleShortUpload} className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="earnMoneyShort"
                  checked={isEarnMoneyShort}
                  onCheckedChange={setIsEarnMoneyShort}
                />
                <Label htmlFor="earnMoneyShort">Earn money while upload video</Label>
              </div>

              <div className="space-y-2">
                <Label>Short Video *</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shortVideoInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Select Short Video
                  </Button>
                  {shortVideoPreview && (
                    <div className="relative">
                      <video
                        src={shortVideoPreview}
                        controls
                        className="w-full rounded border"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}
                </div>
                <input
                  ref={shortVideoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleShortVideoSelect}
                  className="hidden"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload Short'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Channel Required Dialog */}
      <ChannelRequiredDialog
        open={showChannelDialog}
        onClose={() => setShowChannelDialog(false)}
        onCreateChannel={() => {
          setShowChannelDialog(false);
          onOpenChange(false);
        }}
      />
    </>
  );
};

export default CreatePostDialog;