import React from "react";
import axios from "axios";
import { userAPI } from "../services/api";
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
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChannelAnalytics from "../components/ChannelAnalytics";

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
  const [channelData, setChannelData] = React.useState<any | null>(null);
  const [videos, setVideos] = React.useState<any[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = React.useState<'videos' | 'shorts' | 'live' | 'playlists'>('videos');

  const profileInputRef = React.useRef<HTMLInputElement | null>(null);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);

  const closeModal = () => {
    setIsEditing(false);
    setFormData(null);

    if (profileInputRef.current) profileInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ✅ Fetch channel by userId from localStorage
  React.useEffect(() => {
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
          setChannelData(response.data.data[0]);
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

  // ✅ Fetch videos (still from localStorage for now)
  React.useEffect(() => {
    const fetchVideos = () => {
      try {
        const saved = localStorage.getItem("uploadedVideos");
        const parsed = saved ? JSON.parse(saved) : [];
        setVideos(parsed);
      } catch (error) {
        console.error("Failed to load videos from localStorage", error);
        setVideos([]);
      }
    };

    fetchVideos();
    window.addEventListener("videosUpdated", fetchVideos);
    return () => window.removeEventListener("videosUpdated", fetchVideos);
  }, []);

  // Loading/Error state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
          <h1 className="text-2xl font-bold text-gray-800">Channel Not Found</h1>
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

    const storedUserId = localStorage.getItem("UserId"); 
    if (!storedUserId) {
      alert("User not authenticated: missing userId");
      return;
    }

    try {
      // ✅ Build payload
      const payload = {
        id: channelData.channelId, // required by API
        channelName: formData.channelName,
        description: formData.description,
        profileImage: formData.profilePhoto || channelData.profileImage,
        profileCoverImage: formData.coverPhoto || channelData.profileCoverImage,
        updatedBy: Number(storedUserId),
      };

      console.log("📤 Sending update payload:", payload);

      const response = await axios.post(`https://api.adtip.in/updatechanel`, payload, {
        headers: {
          Authorization: getAuthToken(),
        },
      });

      console.log("✅ Update response:", response.data);

      if (response.status === 200) {
        // Merge updated data locally
        setChannelData((prev: any) => ({ ...prev, ...payload }));
        closeModal();
      } else {
        alert("Failed to update channel.");
      }
    } catch (err: any) {
      console.error("❌ Update channel failed:", err.response || err.message);
      alert(err.response?.data?.message || "Something went wrong while updating channel.");
    }
  };

  // File input handler
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "coverPhoto"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev: any) => ({
        ...prev,
        [field]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - YouTube Style */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-64 lg:h-80 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500">
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
                    <User className="w-12 h-12 md:w-16 md:h-16 text-purple-500" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>

              {/* Channel Details */}
              <div className="flex-1 text-white">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                      {channelData.channelName}
                    </h1>
                    <div className="flex items-center gap-6 text-sm md:text-base">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {formatNumber(channelData.totalSubscribers || 0)} subscribers
                      </span>
                      <span className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        {formatNumber(channelData.totalVideos || 0)} videos
                      </span>
                      <span className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        {formatNumber(channelData.totalShorts || 0)} shorts
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
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
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Analytics Section - Prominent Position */}
        <div className="mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-purple-500" />
                  Channel Analytics
                </h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Demo Mode
                </Badge>
              </div>
              <ChannelAnalytics
                analytics={null}
                isLoading={false}
                demoMode={true}
                onWithdraw={(amount) => {
                  console.log('Withdrawing amount:', amount);
                  alert(`Withdrawal request for ₹${amount.toLocaleString()} submitted successfully!`);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Channel Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Section */}
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  About
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {channelData.description || "No description available."}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(new Date().toISOString())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Subscribers</span>
                    </div>
                    <span className="font-bold text-purple-600">{formatNumber(channelData.totalSubscribers || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Videos</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatNumber(channelData.totalVideos || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <Film className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Shorts</span>
                    </div>
                    <span className="font-bold text-pink-600">{formatNumber(channelData.totalShorts || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Videos & Tabs */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'videos'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Videos
                </button>
                <button
                  onClick={() => setActiveTab('shorts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'shorts'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Shorts
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'live'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'playlists'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Playlists
                </button>
              </div>

              {/* View Mode Toggle & Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'videos' && (
              <div>
                {videos.length === 0 ? (
                  <div className="text-center py-16">
                    <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                    <p className="text-gray-500 mb-6">Start creating content to build your channel</p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Your First Video
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {videos.map((video, index) => (
                      <Card
                        key={video.id || index}
                        className="group bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="relative">
                          {video.cloudflareVideoId ? (
                            <iframe
                              src={getStreamIframeUrl(video.cloudflareVideoId)}
                              title={video.title}
                              className="w-full aspect-video"
                              allow="autoplay; encrypted-media"
                              frameBorder="0"
                              allowFullScreen
                            />
                          ) : (
                            <div className="relative w-full aspect-video bg-gray-200 flex items-center justify-center">
                              <Play className="w-12 h-12 text-gray-400" />
                              {video.thumbnail && (
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Duration Badge */}
                          {video.duration && (
                            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                              {video.duration}
                            </Badge>
                          )}
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-black ml-1" />
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors mb-2">
                            {video.title || `Video ${index + 1}`}
                          </h3>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              {video.views && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {formatNumber(video.views)}
                                </span>
                              )}
                              {video.uploadDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(video.uploadDate)}
                                </span>
                              )}
                            </div>
                            
                            {video.earnings && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <DollarSign className="w-3 h-3" />
                                ₹{formatNumber(video.earnings)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shorts' && (
              <div className="text-center py-16">
                <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shorts yet</h3>
                <p className="text-gray-500 mb-6">Create engaging short-form content</p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Short
                </Button>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No live streams</h3>
                <p className="text-gray-500 mb-6">Go live and connect with your audience</p>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Streaming
                </Button>
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists</h3>
                <p className="text-gray-500 mb-6">Organize your content into playlists</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Channel</h2>
              <Button size="icon" variant="ghost" onClick={closeModal} className="hover:bg-gray-100">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter channel name"
                  value={formData?.channelName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, channelName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "profilePhoto")}
                  ref={profileInputRef}
                  className="w-full"
                />
                {formData?.profilePhoto && (
                  <img
                    src={formData.profilePhoto}
                    alt="Preview"
                    className="mt-2 w-20 h-20 rounded-full object-cover border-2 border-purple-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "coverPhoto")}
                  ref={coverInputRef}
                  className="w-full"
                />
                {formData?.coverPhoto && (
                  <img
                    src={formData.coverPhoto}
                    alt="Preview"
                    className="mt-2 w-full h-24 object-cover border-2 border-purple-200 rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-none"
                  placeholder="Tell viewers about your channel"
                  value={formData?.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPage;
