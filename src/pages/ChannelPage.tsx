import React from "react";
import axios from "axios";
import { userAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  MessageSquare,
  Video,
  Star,
  Heart,
  Eye,
  Pencil,
  X,
  Film,
  Smartphone,
  Play,
  Clock,
  Calendar,
  Settings,
  Share2,
  Bell,
  Plus,
  Grid3X3,
  List,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ChannelAnalytics from "../components/ChannelAnalytics";
import SubscribersList from "../components/SubscribersList";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { toast } from "sonner";
import { uploadToR2 } from '../services/r2UploadService';

const getAuthToken = () => {
  try {
    const stored = localStorage.getItem("UserLoggedIn");
    if (!stored) return null;
    return `Bearer ${stored}`;
  } catch {
    return null;
  }
};

const ChannelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channelData, setChannelData] = React.useState<any | null>(null);
  const [videos, setVideos] = React.useState<any[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = React.useState<'posts' | 'videos' | 'shorts'>('posts');
  const [contentData, setContentData] = React.useState<any[]>([]);
  const [contentLoading, setContentLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showSubscribers, setShowSubscribers] = React.useState(false);
  const [showPaidContentModal, setShowPaidContentModal] = React.useState(false);
  const [paidContentAmount, setPaidContentAmount] = React.useState('');
  const [earningsData, setEarningsData] = React.useState<any>(null);
  const [earningsLoading, setEarningsLoading] = React.useState(true);
  const [withdrawLoading, setWithdrawLoading] = React.useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = React.useState(false);
  const [playingVideoId, setPlayingVideoId] = React.useState<number | null>(null);
  const [loadingVideoId, setLoadingVideoId] = React.useState<number | null>(null);
  const [videoErrors, setVideoErrors] = React.useState<Set<number>>(new Set());

  const profileInputRef = React.useRef<HTMLInputElement | null>(null);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);

  const closeModal = () => {
    setIsEditing(false);
    setFormData(null);

    if (profileInputRef.current) profileInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Check if user has content-premium
  const hasContentPremium = () => {
    return user?.is_premium === true;
  };

  // ✅ Fetch channel by userId from localStorage
  React.useEffect(() => {
    // Pause any playing videos when navigating to channel page
    const pauseAllVideos = () => {
      // Pause any TipTube videos
      document.querySelectorAll('video').forEach(video => {
        if (!video.paused) {
          video.pause();
        }
      });
      
      // Update TipShorts global playing state if it exists
      if (localStorage.getItem('shortsGlobalPlaying')) {
        localStorage.setItem('shortsGlobalPlaying', 'false');
      }
    };
    
    pauseAllVideos();
    
    const fetchChannel = async () => {
      const storedUserId = localStorage.getItem("UserId");

      if (!storedUserId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const response = await userAPI.getChannel(storedUserId);

        if (response.status === 200 && response.data?.data?.length > 0) {
          const channelInfo = response.data.data[0];
          setChannelData(channelInfo);
        } else {
          setError("No channel data found.");
          setChannelData(null);
        }
      } catch (err) {
        console.error("Failed to fetch channel:", err);
        setError("Failed to fetch channel data. Try again.");
        setChannelData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, []);

  // ✅ Fetch earnings data
  React.useEffect(() => {
    const fetchEarnings = async () => {
      // Try different possible field names for channel ID
      const channelId = channelData?.channelId || channelData?.id || channelData?.channel_id;
      
      if (!channelId) {
        return;
      }

      setEarningsLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          console.error("❌ No auth token available");
          setEarningsLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/earnings`,
          {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200 && response.data?.status) {
          setEarningsData(response.data.data);
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch earnings:", err);
        console.error("❌ Error details:", err.response?.data);
      } finally {
        setEarningsLoading(false);
      }
    };

    fetchEarnings();
  }, [channelData]);

  // ✅ Fetch channel content from API
  const fetchChannelContent = React.useCallback(async () => {
    const channelId = channelData?.channelId || channelData?.id || channelData?.channel_id;
    
    if (!channelId) {
      return;
    }

    setContentLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("❌ No auth token available for content fetch");
        setContentLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/content`,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.status) {
        
        const contentData = response.data.data.content.map((item: any) => {
          // Map content_type strings directly
          let type = 'video'; // default
          if (item.content_type === 'post') type = 'post';
          else if (item.content_type === 'short') type = 'short';
          else if (item.content_type === 'video') type = 'video';
          else if (item.content_type === 'unknown') type = 'video'; // treat unknown as video
          
          // Parse description for posts (it's a JSON string)
          let description = item.description;
          let images = [];
          if (type === 'post' && item.description) {
            try {
              const parsedDesc = JSON.parse(item.description);
              description = parsedDesc.text || item.description;
              images = parsedDesc.images || [];
            } catch (e) {
              // If parsing fails, use description as is
              description = item.description;
            }
          }

          const mappedItem = {
            id: item.id,
            title: item.title,
            description: description,
            videoLink: item.video_link,
            thumbnail: item.thumbnail,
            type: type, // 'post', 'video', 'short' based on content_type
            views: parseInt(item.views) || 0,
            likes: parseInt(item.likes) || 0,
            comments: parseInt(item.comments) || 0,
            shares: parseInt(item.shares) || 0,
            price: parseFloat(item.price) || 0,
            isPaid: item.is_paid === 1,
            createdAt: item.created_date,
            updatedAt: item.updated_date,
            images: images // For posts
          };
          return mappedItem;
        });
        
        setContentData(contentData);
      } else {
        console.error("❌ Invalid content response:", response.data);
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch content:", err);
      console.error("❌ Error details:", err.response?.data);
    } finally {
      setContentLoading(false);
    }
  }, [channelData]);

  // Call fetchChannelContent when channelData changes
  React.useEffect(() => {
    fetchChannelContent();
  }, [fetchChannelContent]);

  // Listen for content upload events
  React.useEffect(() => {
    const handleContentUploaded = () => {
      fetchChannelContent();
    };

    // Listen for custom event
    window.addEventListener('contentUploaded', handleContentUploaded);
    
    // Also listen for focus events (when user comes back to tab)
    const handleFocus = () => {
      fetchChannelContent();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('contentUploaded', handleContentUploaded);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchChannelContent]);

  // Loading/Error state
  if (loading) {
    return (
      <div className="min-h-screen bg-adtip-teal/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading your channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channelData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Video className="w-16 h-16 text-gray-400 mx-auto" />
          <h1 className="text-2xl font-bold text-black">Channel Not Found</h1>
          <p className="text-gray-600">{error || "No channel available."}</p>
        </div>
      </div>
    );
  }

  // Cloudflare Stream Helper
  const getStreamIframeUrl = (videoId: string) =>
    `https://customer-94e2ffe1e7d5daf0d3de8d11c55dd2d6.cloudflarestream.com/${videoId}/iframe?autoplay=false&muted=true&controls=true`;

  // Handle edit
  const handleEditClick = () => {
    setFormData({
      channelName: channelData.channelName,
      description: channelData.description || "",
      profilePhoto: null,
      coverPhoto: null,
    });
    setIsEditing(true);
  };

  // Save changes (with API)
  const handleSave = async () => {
    if (!formData) return;

    // Check description length
    if (formData.description && formData.description.length > 250) {
      toast.error("Description is too long! Maximum 250 characters allowed.");
      return;
    }

    const storedUserId = localStorage.getItem("UserId"); 
    if (!storedUserId) {
      toast.error("User not authenticated: missing userId");
      return;
    }

    setSaving(true);

    try {
      // ✅ Build payload with correct field names
      const channelId = channelData?.channelId || channelData?.id || channelData?.channel_id;
      const payload = {
        id: channelId, // required by API
        name: formData.channelName,
        description: formData.description,
        profile_image: formData.profilePhoto || channelData?.profileImage,
        profile_cover_image: formData.coverPhoto || channelData?.profileCoverImage,
      };

      console.log("📤 Sending update payload:", payload);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/updatechannel`, payload, {
        headers: {
          Authorization: getAuthToken(),
        },
      });


      if (response.status === 200 && response.data.status) {
        // Merge updated data locally
        setChannelData((prev: any) => ({ ...prev, ...payload }));
        closeModal();
        toast.success("Channel updated successfully!");
      } else {
        toast.error("Failed to update channel");
      }
    } catch (err: any) {
      console.error("❌ Update channel failed:", err.response || err.message);
      toast.error(err.response?.data?.message || "Something went wrong while updating channel");
    } finally {
      setSaving(false);
    }
  };

  // File input handler
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "coverPhoto"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      // Show loading state
      setSaving(true);
      
      // Upload to R2 and get URL
      const uploadResult = await uploadToR2(
        file, 
        'images', // folder for profile/cover images
        user?.id || 0,
        (progress) => {
          console.log(`Uploading ${field}: ${progress.percentage}%`);
        }
      );

      if (uploadResult.success) {
        // Update form data with the URL
        setFormData((prev: any) => ({
          ...prev,
          [field]: uploadResult.url,
        }));
        
        toast.success(`${field === 'profilePhoto' ? 'Profile' : 'Cover'} image uploaded successfully!`);
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error(`Error uploading ${field}:`, error);
      toast.error(`Failed to upload ${field === 'profilePhoto' ? 'profile' : 'cover'} image: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle withdraw funds
  const handleWithdraw = () => {
    const availableAmount = earningsData?.earnings?.available_for_withdrawal || 0;
    
    if (!availableAmount || availableAmount <= 0) {
      toast.error("No funds available for withdrawal");
      return;
    }

    setShowWithdrawConfirm(true);
  };

  const confirmWithdraw = async () => {
    const availableAmount = earningsData?.earnings?.available_for_withdrawal || 0;
    const channelId = channelData?.channelId || channelData?.id || channelData?.channel_id;
    
    if (!channelId) {
      toast.error("Channel ID not found. Please try again.");
      return;
    }
    
    setWithdrawLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required. Please log in again");
        return;
      }


      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/withdraw`,
        { amount: availableAmount },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );


      if (response.status === 200 && response.data?.status) {
        toast.success("Withdrawal request submitted successfully!");
        
        // Refresh earnings data
        const earningsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/earnings`,
          {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
        
        if (earningsResponse.status === 200 && earningsResponse.data?.status) {
          setEarningsData(earningsResponse.data.data);
        }
      } else {
        const errorMsg = response.data?.message || "Failed to process withdrawal request";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("❌ Withdrawal failed:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to process withdrawal request";
      toast.error(`Withdrawal failed: ${errorMsg}`);
    } finally {
      setWithdrawLoading(false);
    }
  };


  // Get content by type
  const getContentByType = (type: string) => {
    return contentData.filter(item => item.type === type);
  };

  // Refresh content function
  const refreshContent = async () => {
    await fetchChannelContent();
  };

  // Render content card
  const renderContentCard = (item: any, index: number) => (
    <Card key={item.id || index} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          {/* Video Content */}
          {(item.type === 'video' || item.type === 'short') && item.videoLink ? (
            <div 
              className={`w-full relative group cursor-pointer ${
                item.type === 'short' ? 'h-96' : 'h-48'
              }`} 
              onClick={() => {
                if (playingVideoId === item.id) {
                  setPlayingVideoId(null);
                  setLoadingVideoId(null);
                } else {
                  setLoadingVideoId(item.id);
                  setPlayingVideoId(item.id);
                }
              }}
            >
              {playingVideoId === item.id ? (
                <div className="w-full h-full bg-black">
                  {loadingVideoId === item.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                  
                  {/* Video Error Fallback */}
                  {videoErrors.has(item.id) && (
                    <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">⚠️</div>
                        <div className="text-sm font-medium">Video failed to load</div>
                        <div className="text-xs mt-1 opacity-75">Check console for details</div>
                        <button 
                          onClick={() => {
                            setVideoErrors(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(item.id);
                              return newSet;
                            });
                            // Force reload the video
                            const video = document.querySelector(`video[key="video-${item.id}"]`) as HTMLVideoElement;
                            if (video) {
                              video.load();
                            }
                          }}
                          className="mt-2 px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                  <video
                    key={`video-${item.id}`}
                    src={item.videoLink}
                    controls
                    controlsList="nodownload"
                    muted={false}
                    autoPlay
                    crossOrigin="anonymous"
                    preload="metadata"
                    playsInline
                    className={`w-full h-full ${
                      item.type === 'short' ? 'object-cover' : 'object-contain'
                    }`}
                    onLoadStart={() => {
                      // Test if the video URL is accessible
                      fetch(item.videoLink, { method: 'HEAD' })
                        .then(response => {
                        })
                        .catch(error => {
                          console.error("🎬 Video URL not accessible:", error);
                        });
                    }}
                    onCanPlay={() => {
                      setLoadingVideoId(null);
                    }}
                    onError={(error) => {
                      const video = error.target as HTMLVideoElement;
                      console.error("🎬 Video error:", error, item.videoLink);
                      console.error("🎬 Video error details:", {
                        error: video.error,
                        networkState: video.networkState,
                        readyState: video.readyState,
                        src: video.src,
                        currentSrc: video.currentSrc,
                        errorCode: video.error?.code,
                        errorMessage: video.error?.message
                      });
                      
                      // Mark this video as having an error
                      setVideoErrors(prev => new Set([...prev, item.id]));
                      
                      // Try to retry loading the video
                      setTimeout(() => {
                        video.load();
                      }, 1000);
                      
                      setLoadingVideoId(null);
                      setPlayingVideoId(null);
                    }}
                    onEnded={() => setPlayingVideoId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{ 
                      aspectRatio: item.type === 'short' ? '9/16' : '16/9',
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }}
                  />
                  
                  {/* Type Badge for Playing Video */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    item.type === 'short' 
                      ? 'bg-adtip-teal text-white' 
                      : 'bg-black/70 text-white'
                  }`}>
                    {item.type === 'short' ? 'SHORT' : 'VIDEO'}
                  </div>
                </div>
              ) : (
                <>
                  {/* Thumbnail Display */}
                  {item.thumbnail && item.thumbnail.startsWith('http') ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      style={{ 
                        aspectRatio: item.type === 'short' ? '9/16' : '16/9',
                        maxHeight: '100%',
                        maxWidth: '100%'
                      }}
                      loading={item.type === 'short' ? 'eager' : 'lazy'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback immediately when image fails
                        const container = target.closest('.relative');
                        if (container) {
                          const fallback = container.querySelector('.thumbnail-fallback') as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback when thumbnail fails to load or is missing */}
                  <div 
                    className="thumbnail-fallback w-full h-full bg-gradient-to-br from-adtip-teal to-adtip-teal/80 flex items-center justify-center absolute inset-0"
                    style={{ 
                      aspectRatio: item.type === 'short' ? '9/16' : '16/9',
                      maxHeight: '100%',
                      maxWidth: '100%',
                      display: !item.thumbnail || !item.thumbnail.startsWith('http') ? 'flex' : 'none'
                    }}
                  >
                    <div className="text-center">
                      <Play className="w-12 h-12 text-white mx-auto mb-2" />
                      <p className="text-white text-sm font-medium px-2">{item.title}</p>
                    </div>
                  </div>
                  
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Type Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    item.type === 'short' 
                      ? 'bg-adtip-teal text-white' 
                      : 'bg-black/70 text-white'
                  }`}>
                    {item.type === 'short' ? 'SHORT' : 'VIDEO'}
                  </div>
                </>
              )}
            </div>
          ) : item.thumbnail ? (
            /* Image Content (for posts) */
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            /* Fallback for no media */
            <div className="w-full h-48 bg-gradient-to-br from-adtip-teal to-adtip-teal/80 flex items-center justify-center">
              {item.type === 'video' ? (
                <Play className="w-12 h-12 text-white" />
              ) : item.type === 'short' ? (
                <Film className="w-12 h-12 text-white" />
              ) : (
                <MessageSquare className="w-12 h-12 text-white" />
              )}
            </div>
          )}
          
          {item.isPaid && (
            <Badge className="absolute top-2 right-2 bg-adtip-teal/10 text-adtip-teal border-adtip-teal/20">
              ₹{item.price.toFixed(2)}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-black">{item.title}</h3>
          
          {item.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(item.views || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatNumber(item.likes || 0)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {formatNumber(item.comments || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {formatNumber(item.shares || 0)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-600">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              {item.isPaid && (
                <p className="text-sm font-semibold text-adtip-teal">
                  ₹{item.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - YouTube Style */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-64 lg:h-80 bg-gradient-to-r from-teal-600 via-teal-500 to-green-500">
          {channelData.profileCoverImage && (
            <img
              src={channelData.profileCoverImage}
              alt="Channel Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Channel Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Profile Picture */}
              <div className="relative">
                {channelData.profileImage ? (
                  <img
                    src={channelData.profileImage}
                    alt="Channel Avatar"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-teal-500" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>

              {/* Channel Details */}
              <div className="flex-1 text-white">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                      {channelData.channelName}
                    </h1>
                    <div className="flex items-center gap-6 text-sm md:text-base">
                      <span className="flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full">
                        <MessageSquare className="w-4 h-4" />
                        {formatNumber(contentData.filter(item => item.type === 'post').length)} posts
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full">
                        <Video className="w-4 h-4" />
                        {formatNumber(contentData.filter(item => item.type === 'video').length)} videos
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full">
                        <Film className="w-4 h-4" />
                        {formatNumber(contentData.filter(item => item.type === 'short').length)} shorts
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full">
                        <Users className="w-4 h-4" />
                        {formatNumber(channelData.totalSubscribers || 0)} subscribers
                      </span>
                    </div>
                  </div>
                  
                  {/* Join Date - Top Right */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(channelData.createddate || channelData.createdAt)}</span>
                    </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={handleEditClick}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => setShowSubscribers(true)}
                    >
                    <Users className="w-4 h-4 mr-2" />
                    Subscribers
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 1. About Section */}
          {channelData.description && (
            <Card>
            <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-adtip-teal">About</h2>
                <p className="text-gray-700 leading-relaxed">{channelData.description}</p>
            </CardContent>
          </Card>
          )}

          {/* 2. Earnings Overview */}
          <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-adtip-teal">Earnings Overview</h2>
                {hasContentPremium() && (
                  <Button
                    onClick={handleWithdraw}
                    disabled={!earningsData?.earnings?.available_for_withdrawal || earningsData.earnings.available_for_withdrawal <= 0 || withdrawLoading}
                    className="bg-adtip-teal hover:bg-adtip-teal/90 text-white"
                  >
                    {withdrawLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Withdraw Funds'
                    )}
                  </Button>
                )}
                </div>

              {!hasContentPremium() ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-blue-100 rounded-full mb-4">
                    <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Premium Required</h3>
                  <p className="text-blue-800 mb-6 max-w-md">
                    This earnings overview is only available for premium users. Upgrade to premium to access exclusive features and detailed analytics.
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
                    <p className="text-sm text-blue-700">
                      <strong>Premium Benefits:</strong> Access to detailed earnings analytics, advanced features, and priority support.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate("/chooseplan", { state: { openCreatorPacks: true } })}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              ) : earningsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adtip-teal"></div>
                  <span className="ml-2">Loading earnings...</span>
                      </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Views */}
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-sm font-semibold text-black">Total Views</h3>
                    <p className="text-xl font-bold text-blue-600">
                      {formatNumber(earningsData?.earnings?.total_views || 0)}
                    </p>
                    </div>

                  {/* Total View Earnings */}
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h3 className="text-sm font-semibold text-black">View Earnings</h3>
                    <p className="text-xl font-bold text-green-600">
                      ₹{(earningsData?.earnings?.view_earnings || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Paid Content Views */}
                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
                    <Star className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="text-sm font-semibold text-black">Paid Content Views</h3>
                    <p className="text-xl font-bold text-purple-600">
                      {formatNumber(earningsData?.earnings?.paid_views || 0)}
                    </p>
                      </div>

                  {/* Paid Content Earnings */}
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <h3 className="text-sm font-semibold text-black">Paid Content Earnings</h3>
                    <p className="text-xl font-bold text-orange-600">
                      ₹{(earningsData?.earnings?.paid_video_earnings || 0).toFixed(2)}
                    </p>
                    </div>
                  
                  {/* Total Earnings */}
                  <div className="text-center p-4 bg-gradient-to-br from-adtip-teal/10 to-adtip-teal/5 rounded-lg">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-adtip-teal" />
                    <h3 className="text-sm font-semibold text-black">Total Earnings</h3>
                    <p className="text-xl font-bold text-adtip-teal">
                      ₹{(earningsData?.earnings?.total_earnings || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Total Withdrawn */}
                  <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <h3 className="text-sm font-semibold text-black">Total Withdrawn</h3>
                    <p className="text-xl font-bold text-gray-600">
                      ₹{(earningsData?.earnings?.total_withdrawn || 0).toFixed(2)}
                    </p>
                      </div>

                  {/* Available Balance */}
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-black">Available Balance</h3>
                    <p className="text-xl font-bold text-emerald-600">
                      ₹{(earningsData?.earnings?.available_balance || 0).toFixed(2)}
                    </p>
                    </div>
                  
                  {/* Available for Withdrawal */}
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-black">Available for Withdrawal</h3>
                    <p className="text-xl font-bold text-indigo-600">
                      ₹{(earningsData?.earnings?.available_for_withdrawal || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>

          {/* 3. Content Tabs */}
          <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-adtip-teal">Content</h2>
                
            {/* Tab Navigation */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'bg-white text-adtip-teal shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Posts
                  </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'videos'
                        ? 'bg-white text-adtip-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Videos
                </button>
                <button
                  onClick={() => setActiveTab('shorts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'shorts'
                        ? 'bg-white text-adtip-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Shorts
                </button>
              </div>

              {/* Refresh Button */}
                  <button
                onClick={refreshContent}
                disabled={contentLoading}
                className="ml-4 px-3 py-2 bg-adtip-teal text-white rounded-md text-sm font-medium hover:bg-adtip-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {contentLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
              {/* Content Display */}
              <div className="space-y-6">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adtip-teal"></div>
                    <span className="ml-2">Loading content...</span>
                  </div>
                ) : (
                  <>
                    {activeTab === 'posts' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getContentByType('post').map((item, index) => renderContentCard(item, index))}
                        {getContentByType('post').length === 0 && (
                          <div className="col-span-full text-center py-12 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No posts uploaded yet</p>
                            </div>
                          )}
                            </div>
                    )}
                          
                    {activeTab === 'videos' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getContentByType('video').map((item, index) => renderContentCard(item, index))}
                        {getContentByType('video').length === 0 && (
                          <div className="col-span-full text-center py-12 text-gray-500">
                            <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No videos uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shorts' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getContentByType('short').map((item, index) => renderContentCard(item, index))}
                        {getContentByType('short').length === 0 && (
                          <div className="col-span-full text-center py-12 text-gray-500">
                            <Film className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No shorts uploaded yet</p>
              </div>
            )}
              </div>
            )}
                  </>
            )}
          </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Channel</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Channel Name */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name
              </label>
              <Input
                value={formData?.channelName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, channelName: e.target.value })
                  }
                placeholder="Enter channel name"
                />
              </div>

            {/* Description with Character Limit */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
                <span className="text-xs text-gray-500 ml-2">
                  ({formData?.description?.length || 0}/250 characters)
                </span>
              </label>
              <Textarea
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-adtip-teal focus:border-transparent h-24 resize-none ${
                  (formData?.description?.length || 0) > 250
                    ? 'border-red-300 bg-red-50'
                    : (formData?.description?.length || 0) > 200
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-300'
                }`}
                placeholder="Tell viewers about your channel"
                value={formData?.description || ""}
                maxLength={250}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {(formData?.description?.length || 0) > 250 && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Description is too long! Maximum 250 characters allowed.
                </p>
              )}
              {(formData?.description?.length || 0) > 200 && (formData?.description?.length || 0) <= 250 && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Description is getting long. {250 - (formData?.description?.length || 0)} characters remaining.
                </p>
              )}
            </div>

            {/* Profile Image */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <Input
                  type="file"
                  accept="image/*"
                  ref={profileInputRef}
                  onChange={(e) => handleFileChange(e, "profilePhoto")}
              />
              {formData?.profilePhoto && (
                <div className="mt-2">
                  <img 
                    src={formData.profilePhoto} 
                    alt="Profile preview" 
                    className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                  />
                  <p className="text-xs text-green-600 mt-1">✓ Profile image uploaded</p>
                </div>
              )}
              </div>

            {/* Cover Image */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <Input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  onChange={(e) => handleFileChange(e, "coverPhoto")}
              />
              {formData?.coverPhoto && (
                <div className="mt-2">
                  <img 
                    src={formData.coverPhoto} 
                    alt="Cover preview" 
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <p className="text-xs text-green-600 mt-1">✓ Cover image uploaded</p>
                </div>
              )}
              </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || (formData?.description?.length || 0) > 250}
                className="bg-adtip-teal hover:bg-adtip-teal/90 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paid Content Modal */}
      <Dialog open={showPaidContentModal} onOpenChange={setShowPaidContentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Paid Content</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={paidContentAmount}
                onChange={(e) => setPaidContentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPaidContentModal(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-adtip-teal hover:bg-adtip-teal/90 text-white"
                onClick={() => {
                  // Handle paid content upload
                  setShowPaidContentModal(false);
                }}
              >
                Upload Paid Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscribers List Modal */}
      <SubscribersList
        channelId={channelData?.channelId || channelData?.id || channelData?.channel_id}
        isOpen={showSubscribers}
        onClose={() => setShowSubscribers(false)}
        subscriberCount={channelData?.totalSubscribers || 0}
      />

      {/* Withdrawal Confirmation Dialog */}
      <ConfirmationDialog
        open={showWithdrawConfirm}
        onOpenChange={setShowWithdrawConfirm}
        title="Confirm Withdrawal"
        description={`Are you sure you want to withdraw ₹${(earningsData?.earnings?.available_for_withdrawal || 0).toFixed(2)}? This action cannot be undone.`}
        confirmText="Withdraw"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmWithdraw}
        loading={withdrawLoading}
      />

    </div>
  );
};

export default ChannelPage;




