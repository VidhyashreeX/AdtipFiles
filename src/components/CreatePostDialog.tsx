import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { ChannelRequiredDialog } from "./ChannelRequiredDialog";
import { uploadToR2 } from '../services/r2UploadService';
import api from '@/services/api';
import { ImageIcon, Video, Play, Upload, Calculator, DollarSign, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import PricingCalculator from './PricingCalculator';
import { PricingCalculation } from '@/services/pricingService';
import { UnifiedUploadProgress, VideoUploadData } from '../services/UnifiedUploadService';
import UnifiedUploadService from '../services/UnifiedUploadService';

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
  
  // Enhanced upload states
  const [uploadProgress, setUploadProgress] = useState<UnifiedUploadProgress | null>(null);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [compressionQuality, setCompressionQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Create Post states
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [isPromoted, setIsPromoted] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Video states
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoCategory, setVideoCategory] = useState('');
  const [videoQuality, setVideoQuality] = useState('');
  const [videoDuration, setVideoDuration] = useState('00:00:00'); // Will be calculated from video
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [videoPrice, setVideoPrice] = useState('');
  const [isEarnMoney, setIsEarnMoney] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Short video states
  const [shortTitle, setShortTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [shortCategory, setShortCategory] = useState('');
  const [shortQuality, setShortQuality] = useState('');
  const [shortVideo, setShortVideo] = useState<File | null>(null);
  const [shortVideoPreview, setShortVideoPreview] = useState<string>('');
  const [shortThumbnailFile, setShortThumbnailFile] = useState<File | null>(null);
  const [shortThumbnailPreview, setShortThumbnailPreview] = useState<string>('');
  const [shortDuration, setShortDuration] = useState('00:00:00'); // Will be calculated from video
  const [isEarnMoneyShort, setIsEarnMoneyShort] = useState(false);
  const [isPaidShort, setIsPaidShort] = useState(false);
  const [shortPrice, setShortPrice] = useState('');
  
  // Pricing calculator states
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);
  const [calculatedPricing, setCalculatedPricing] = useState<PricingCalculation | null>(null);
  const [pricingMode, setPricingMode] = useState<'simple' | 'advanced'>('simple');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const shortVideoInputRef = useRef<HTMLInputElement>(null);
  const shortThumbnailInputRef = useRef<HTMLInputElement>(null);

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
    
    // Calculate and set video duration
    calculateVideoDuration(file).then(duration => {
      setVideoDuration(duration);
    });
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
    
    // Calculate and set short video duration
    calculateVideoDuration(file).then(duration => {
      setShortDuration(duration);
    });
  }, []);

  // Handle short thumbnail selection
  const handleShortThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setShortThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    setShortThumbnailPreview(previewUrl);
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
    if (!postTitle.trim() || !postContent.trim() || !postCategory) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (!user?.channelId) {
      setShowChannelDialog(true);
      return;
    }

    if (!token) {
      toast.error("Please log in again");
      return;
    }

    setIsLoading(true);
    
    try {
      // For posts, use contentType = 2 and create a simple text post
      const requestData = {
        title: postTitle,
        contentType: 2, // 2=Post
        categoryId: Number(postCategory) || 1,
        channelId: Number(user.channelId),
        contentDescription: postContent,
        images: [], // No images for text posts
        userId: user.id,
        is_paid_promotional: isPromoted,
        promotional_price: isPromoted ? Number(promotionalPrice) || 0 : null
      };

      await api.post('/api/uploadcontent', requestData);
    toast.success("Post created successfully!");
    
    // Trigger refresh event for ChannelPage
    window.dispatchEvent(new CustomEvent('contentUploaded'));
    
    onOpenChange(false);
    } catch (error) {
      console.error('Post creation error:', error);
      // @ts-ignore
      const status = error?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please log in again.');
      } else {
        toast.error("Failed to create post. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate video duration
  const calculateVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);
        
        const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log('📹 Calculated video duration:', formattedDuration, 'from file:', file.name);
        resolve(formattedDuration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        console.warn('⚠️ Could not calculate video duration, using default');
        resolve('00:01:00'); // Default 1 minute
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Video compression function
  const compressVideo = async (file: File, quality: 'high' | 'medium' | 'low'): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        // Set compression settings based on quality
        const settings = {
          high: { width: 1920, height: 1080, bitrate: 2000000 },
          medium: { width: 1280, height: 720, bitrate: 1000000 },
          low: { width: 854, height: 480, bitrate: 500000 }
        };

        const { width, height, bitrate } = settings[quality];
        
        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let newWidth = width;
        let newHeight = height;
        
        if (aspectRatio > width / height) {
          newHeight = width / aspectRatio;
        } else {
          newWidth = height * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        video.oncanplay = () => {
          ctx.drawImage(video, 0, 0, newWidth, newHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'video/mp4' });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress video'));
            }
          }, 'video/mp4', 0.8);
        };

        video.play();
      };

      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  };

  // Enhanced video upload with compression and progress tracking
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
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      let processedVideo = selectedVideo;
      
      // Compress video if needed
      if (compressionQuality !== 'high') {
        setIsCompressing(true);
        setUploadStage('Compressing video...');
        
        try {
          processedVideo = await compressVideo(selectedVideo, compressionQuality);
          console.log(`Video compressed: ${selectedVideo.size} -> ${processedVideo.size} bytes`);
        } catch (error) {
          console.warn('Video compression failed, using original:', error);
          processedVideo = selectedVideo;
        } finally {
          setIsCompressing(false);
        }
      }

      // Ensure we have a thumbnail file
      if (!thumbnailFile && processedVideo) {
        console.log('No thumbnail provided, will use video file as thumbnail');
      }

      // Calculate video duration
      const calculatedDuration = await calculateVideoDuration(processedVideo);
      console.log('📹 Using calculated duration:', calculatedDuration);

      // Prepare upload data for UnifiedUploadService
      const uploadData: VideoUploadData = {
        videoFile: processedVideo,
        thumbnailFile: thumbnailFile || undefined,
        metadata: {
        name: videoTitle,
          description: videoDescription,
          categoryId: Number(videoCategory) || 1,
          channelId: Number(user.channelId),
          userId: user.id,
          isShot: postType === 'tip-shorts',
          duration: calculatedDuration,
          is_paid_promotional: isPaidVideo,
          promotional_price: isPaidVideo ? Number(videoPrice) || 0 : undefined,
        }
      };

      // Use UnifiedUploadService for upload
      const uploadService = UnifiedUploadService;
      const uploadMethod = postType === 'tip-shorts' ? 
        uploadService.uploadTipShorts.bind(uploadService) : 
        uploadService.uploadTipTube.bind(uploadService);

      const result = await uploadMethod(uploadData, (progress) => {
        setUploadProgress(progress);
        setUploadStage(progress.stage);
      });

      if (result.success) {
        setUploadSuccess(true);
        toast.success(`Video uploaded successfully using ${result.method.toUpperCase()}!`);
        
        // Trigger refresh event for ChannelPage
        window.dispatchEvent(new CustomEvent('contentUploaded'));
        
        // Reset form
        setVideoTitle('');
        setVideoDescription('');
        setVideoCategory('');
        setVideoQuality('');
        setSelectedVideo(null);
        setThumbnailFile(null);
        setVideoPreview(null);
        setThumbnailPreview(null);
        setIsPaidVideo(false);
        setVideoPrice('');
        
        // Close dialog after a short delay
        setTimeout(() => {
        onOpenChange(false);
        }, 1500);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (errorMessage.includes('video_Thumbnail')) {
          errorMessage = 'Upload failed: Missing thumbnail. Please try again.';
        } else if (errorMessage.includes('Authentication')) {
          errorMessage = 'Upload failed: Authentication error. Please log in again.';
        } else if (errorMessage.includes('500')) {
          errorMessage = 'Upload failed: Server error. Please try again later.';
        } else if (errorMessage.includes('400')) {
          errorMessage = 'Upload failed: Invalid request. Please check your input.';
        }
      }
      
      setUploadError(errorMessage);
      
      const status = (error as any)?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please log in again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsCompressing(false);
      setUploadProgress(null);
      setUploadStage('');
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

    if (!shortVideo || !shortTitle || !shortDescription || !shortCategory || !shortQuality) {
      toast.error("Please fill in all required fields and select a video");
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate video duration
      const calculatedDuration = await calculateVideoDuration(shortVideo);
      console.log('📹 Short video duration:', calculatedDuration);
      
      // Upload short video to R2
      const videoResult = await uploadToR2(shortVideo, 'videos', user.id);
      const videoUrl = videoResult.url;
      
      // Upload thumbnail if provided, otherwise create placeholder
      let thumbnailUrl;
      if (shortThumbnailFile) {
        const thumbnailResult = await uploadToR2(shortThumbnailFile, 'thumbnails', user.id);
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
        ctx.fillText('Short Video Thumbnail', 160, 120);
      }
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
      const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
      const thumbnailResult = await uploadToR2(placeholderFile, 'thumbnails', user.id);
        thumbnailUrl = thumbnailResult.url;
      }

      // Call API with R2 URLs using correct API structure
      const requestData = {
        title: shortTitle,
        contentType: 1, // 1=Short
        categoryId: Number(shortCategory) || 1,
        channelId: Number(user.channelId),
        videoLink: videoUrl,
        video_Thumbnail: thumbnailUrl,
        contentDescription: shortDescription,
        duration: calculatedDuration, // Use calculated duration
        userId: user.id,
        is_paid_promotional: isPaidShort,
        promotional_price: isPaidShort ? Number(shortPrice) || 0 : null
      };

      await api.post('/api/uploadcontent', requestData);

        toast.success("Short video uploaded successfully!");
        
        // Trigger refresh event for ChannelPage
        window.dispatchEvent(new CustomEvent('contentUploaded'));
        
        onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      // @ts-ignore
      const status = error?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please log in again.');
      } else {
      toast.error("Failed to upload short video. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pricing calculation
  const handlePricingCalculated = (pricing: PricingCalculation) => {
    setCalculatedPricing(pricing);
    // Auto-fill the price fields based on calculated pricing
    if (postType === 'create-post') {
      setPromotionalPrice(pricing.perViewPrice.toString());
    } else if (postType === 'tip-tube') {
      setVideoPrice(pricing.perViewPrice.toString());
    } else if (postType === 'tip-shorts') {
      setShortPrice(pricing.perViewPrice.toString());
    }
  };

  const resetForm = () => {
    setPostTitle('');
    setPostContent('');
    setPostCategory('');
    setIsPromoted(false);
    setPromotionalPrice('');
    setPostImages([]);
    setImagePreviews([]);
    setVideoTitle('');
    setVideoDescription('');
    setVideoCategory('');
    setVideoQuality('');
    setIsPaidVideo(false);
    setVideoPrice('');
    setIsEarnMoney(false);
    setSelectedVideo(null);
    setVideoPreview('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShortTitle('');
    setShortDescription('');
    setShortCategory('');
    setShortQuality('');
    setShortVideo(null);
    setShortVideoPreview('');
    setShortThumbnailFile(null);
    setShortThumbnailPreview('');
    setVideoDuration('00:00:00');
    setShortDuration('00:00:00');
    setIsEarnMoneyShort(false);
    setIsPaidShort(false);
    setShortPrice('');
    setShowPricingCalculator(false);
    setCalculatedPricing(null);
    setPricingMode('simple');
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

              <div className="space-y-2">
                <Label htmlFor="postCategory">Category *</Label>
                <Select value={postCategory} onValueChange={setPostCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Trend</SelectItem>
                    <SelectItem value="2">Health</SelectItem>
                    <SelectItem value="3">Start-ups</SelectItem>
                    <SelectItem value="6">All</SelectItem>
                    <SelectItem value="8">Animals & Pets</SelectItem>
                    <SelectItem value="10">Autos & Vehicles</SelectItem>
                    <SelectItem value="11">Beauty & Fashion</SelectItem>
                    <SelectItem value="12">Comedy</SelectItem>
                    <SelectItem value="15">Film & Animation</SelectItem>
                    <SelectItem value="18">Food & Drink</SelectItem>
                    <SelectItem value="19">Gaming</SelectItem>
                    <SelectItem value="22">Music</SelectItem>
                    <SelectItem value="23">News & Politics</SelectItem>
                    <SelectItem value="25">People & Blogs</SelectItem>
                    <SelectItem value="27">Sports</SelectItem>
                    <SelectItem value="29">Devotion</SelectItem>
                    <SelectItem value="30">Love</SelectItem>
                    <SelectItem value="31">WhatsApp Status</SelectItem>
                    <SelectItem value="32">Wishes</SelectItem>
                    <SelectItem value="33">Motivation</SelectItem>
                    <SelectItem value="34">Technology</SelectItem>
                    <SelectItem value="35">Business & Job</SelectItem>
                    <SelectItem value="36">Astrology</SelectItem>
                    <SelectItem value="37">Emotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="promoted"
                  checked={isPromoted}
                  onCheckedChange={setIsPromoted}
                />
                  <Label htmlFor="promoted">Promoted post (Paid content)</Label>
                </div>
                
                {isPromoted && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="promotionalPrice">Price (₹) *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPricingCalculator(true)}
                        className="text-adtip-teal border-adtip-teal hover:bg-adtip-teal hover:text-white"
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        Calculate Price
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        id="promotionalPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={promotionalPrice}
                        onChange={(e) => setPromotionalPrice(e.target.value)}
                        placeholder="Enter price for content consumers"
                        required={isPromoted}
                      />
                      
                      {calculatedPricing && (
                        <div className="bg-adtip-teal/10 border border-adtip-teal/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-adtip-teal" />
                            <span className="text-sm font-medium text-adtip-teal">Calculated Pricing</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Per-View: ₹{calculatedPricing.perViewPrice.toFixed(2)}</div>
                            <div>Expected Views: {calculatedPricing.expectedViews.toLocaleString()}</div>
                            <div>Total Budget: ₹{calculatedPricing.totalBudget.toFixed(2)}</div>
                            <div>Your Earnings: ₹{calculatedPricing.creatorEarnings.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      This is the amount content consumers will pay to view your post
                    </p>
                  </div>
                )}
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
                        className="w-full h-48 rounded border object-cover"
                        preload="metadata"
                        crossOrigin="anonymous"
                      />
                      {videoDuration !== '00:00:00' && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Duration: {videoDuration}
                        </div>
                      )}
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
                        <SelectItem value="1">Trend</SelectItem>
                        <SelectItem value="2">Health</SelectItem>
                        <SelectItem value="3">Start-ups</SelectItem>
                        <SelectItem value="6">All</SelectItem>
                        <SelectItem value="8">Animals & Pets</SelectItem>
                        <SelectItem value="10">Autos & Vehicles</SelectItem>
                        <SelectItem value="11">Beauty & Fashion</SelectItem>
                        <SelectItem value="12">Comedy</SelectItem>
                        <SelectItem value="15">Film & Animation</SelectItem>
                        <SelectItem value="18">Food & Drink</SelectItem>
                        <SelectItem value="19">Gaming</SelectItem>
                        <SelectItem value="22">Music</SelectItem>
                        <SelectItem value="23">News & Politics</SelectItem>
                        <SelectItem value="25">People & Blogs</SelectItem>
                        <SelectItem value="27">Sports</SelectItem>
                        <SelectItem value="29">Devotion</SelectItem>
                        <SelectItem value="30">Love</SelectItem>
                        <SelectItem value="31">WhatsApp Status</SelectItem>
                        <SelectItem value="32">Wishes</SelectItem>
                        <SelectItem value="33">Motivation</SelectItem>
                        <SelectItem value="34">Technology</SelectItem>
                        <SelectItem value="35">Business & Job</SelectItem>
                        <SelectItem value="36">Astrology</SelectItem>
                        <SelectItem value="37">Emotional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoQuality">Display Quality *</Label>
                    <Select value={videoQuality} onValueChange={setVideoQuality} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select display quality" />
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


                {/* Video Compression Options */}
                <div className="space-y-2">
                  <Label htmlFor="compressionQuality">File Compression</Label>
                  <Select value={compressionQuality} onValueChange={(value: 'high' | 'medium' | 'low') => setCompressionQuality(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select compression level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Quality (1080p • Larger file size)</SelectItem>
                      <SelectItem value="medium">Medium Quality (720p • Recommended)</SelectItem>
                      <SelectItem value="low">Low Quality (480p • Smaller file size)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {compressionQuality === 'high' && 'Best quality, larger file size'}
                    {compressionQuality === 'medium' && 'Balanced quality and file size'}
                    {compressionQuality === 'low' && 'Smaller file size, faster upload'}
                  </p>
                </div>

                {/* Upload Progress */}
                {(isLoading || isCompressing || uploadProgress) && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCompressing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-adtip-teal" />
                        ) : uploadSuccess ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : uploadError ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-adtip-teal" />
                        )}
                        <span className="text-sm font-medium">
                          {isCompressing ? 'Compressing video...' : 
                           uploadSuccess ? 'Upload completed!' :
                           uploadError ? 'Upload failed' :
                           uploadStage || 'Uploading...'}
                        </span>
                      </div>
                      {uploadProgress && (
                        <span className="text-sm text-gray-500">
                          {uploadProgress.percentage}%
                        </span>
                      )}
                    </div>
                    
                    {uploadProgress && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{uploadProgress.stage}</span>
                          <span>{uploadProgress.method.toUpperCase()}</span>
                        </div>
                        {uploadProgress.currentStep && (
                          <p className="text-xs text-gray-400">{uploadProgress.currentStep}</p>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {uploadError}
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        Video uploaded successfully! Closing dialog...
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                </div>

                <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paidVideo"
                    checked={isPaidVideo}
                    onCheckedChange={setIsPaidVideo}
                  />
                    <Label htmlFor="paidVideo">Paid video (Promotional content)</Label>
                  </div>
                  
                  {isPaidVideo && (
                    <div className="space-y-2">
                      <Label htmlFor="videoPrice">Price (₹) *</Label>
                      <Input
                        id="videoPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={videoPrice}
                        onChange={(e) => setVideoPrice(e.target.value)}
                        placeholder="Enter price for content consumers"
                        required={isPaidVideo}
                      />
                      <p className="text-sm text-gray-500">
                        This is the amount content consumers will pay to view your video
                      </p>
                    </div>
                  )}
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
              <div className="space-y-2">
                <Label htmlFor="shortTitle">Title *</Label>
                <Input
                  id="shortTitle"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  placeholder="Add title for your short"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Describe your short video..."
                  className="min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shortCategory">Category *</Label>
                  <Select value={shortCategory} onValueChange={setShortCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Trend</SelectItem>
                      <SelectItem value="2">Health</SelectItem>
                      <SelectItem value="3">Start-ups</SelectItem>
                      <SelectItem value="6">All</SelectItem>
                      <SelectItem value="8">Animals & Pets</SelectItem>
                      <SelectItem value="10">Autos & Vehicles</SelectItem>
                      <SelectItem value="11">Beauty & Fashion</SelectItem>
                      <SelectItem value="12">Comedy</SelectItem>
                      <SelectItem value="15">Film & Animation</SelectItem>
                      <SelectItem value="18">Food & Drink</SelectItem>
                      <SelectItem value="19">Gaming</SelectItem>
                      <SelectItem value="22">Music</SelectItem>
                      <SelectItem value="23">News & Politics</SelectItem>
                      <SelectItem value="25">People & Blogs</SelectItem>
                      <SelectItem value="27">Sports</SelectItem>
                      <SelectItem value="29">Devotion</SelectItem>
                      <SelectItem value="30">Love</SelectItem>
                      <SelectItem value="31">WhatsApp Status</SelectItem>
                      <SelectItem value="32">Wishes</SelectItem>
                      <SelectItem value="33">Motivation</SelectItem>
                      <SelectItem value="34">Technology</SelectItem>
                      <SelectItem value="35">Business & Job</SelectItem>
                      <SelectItem value="36">Astrology</SelectItem>
                      <SelectItem value="37">Emotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortQuality">Quality *</Label>
                  <Select value={shortQuality} onValueChange={setShortQuality} required>
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

              <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="earnMoneyShort"
                  checked={isEarnMoneyShort}
                  onCheckedChange={setIsEarnMoneyShort}
                />
                <Label htmlFor="earnMoneyShort">Earn money while upload video</Label>
              </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="paidShort"
                      checked={isPaidShort}
                      onCheckedChange={setIsPaidShort}
                    />
                    <Label htmlFor="paidShort">Paid short (Promotional content)</Label>
                  </div>
                  
                  {isPaidShort && (
                    <div className="space-y-2">
                      <Label htmlFor="shortPrice">Price (₹) *</Label>
                      <Input
                        id="shortPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={shortPrice}
                        onChange={(e) => setShortPrice(e.target.value)}
                        placeholder="Enter price for content consumers"
                        required={isPaidShort}
                      />
                      <p className="text-sm text-gray-500">
                        This is the amount content consumers will pay to view your short
                      </p>
                    </div>
                  )}
                </div>
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
                      {shortDuration !== '00:00:00' && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Duration: {shortDuration}
                        </div>
                      )}
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

              <div className="space-y-2">
                <Label>Thumbnail (Optional)</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shortThumbnailInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Select Thumbnail
                  </Button>
                  {shortThumbnailPreview && (
                    <img
                      src={shortThumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  )}
                </div>
                <input
                  ref={shortThumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleShortThumbnailSelect}
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