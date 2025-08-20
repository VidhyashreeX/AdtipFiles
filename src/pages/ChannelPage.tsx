import React from "react";
import axios from "axios";
import {
  User,
  MessageSquare,
  Video,
  Star,
  Heart,
  Eye,
  Pencil,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ✅ Build API base URL
const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;
  const getAuthToken = () => {
  try {
    const stored = localStorage.getItem("UserLoggedIn");
    if (!stored) return null;
    return `Bearer ${stored}`; // 👈 prepend Bearer
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
        const response = await axios.get(
          `${BASE_URL}/getchannelbyuserid/${storedUserId}`
        );

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
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading channel...
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

  // Save changes
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

    const response = await axios.post(`${BASE_URL}/updatechanel`, payload, {
      headers: {
        Authorization: getAuthToken(), // Bearer <token>
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans">
      {/* Hero / Cover Photo */}
      <div className="relative h-52 flex-shrink-0 overflow-visible">
        {channelData.profileCoverImage ? (
          <img
            src={channelData.profileCoverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500"></div>
        )}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            {channelData.profileImage ? (
              <img
                src={channelData.profileImage}
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <User className="w-16 h-16 text-purple-500" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden px-8 pb-4 mt-16">
        {/* Left Info */}
        <div className="w-1/3 pr-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {channelData.channelName}
            </h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditClick}
              className="text-gray-600 hover:text-purple-600"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Eye className="w-4 h-4" /> {channelData.totalSubscribers} subs
            </Badge>
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Video className="w-4 h-4" /> {channelData.totalVideos} videos
            </Badge>
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Heart className="w-4 h-4" /> {channelData.total_ads_view} views
            </Badge>
          </div>

          {/* About */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-700">About</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {channelData.description || "No description available."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Videos */}
        <div className="w-2/3 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" /> Uploaded Videos
          </h2>
          <div className="grid grid-cols-2 gap-4 pb-4">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="group bg-white border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="relative">
                  {video.cloudflareVideoId ? (
                    <iframe
                      src={getStreamIframeUrl(video.cloudflareVideoId)}
                      title={video.title}
                      width="100%"
                      height="160"
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                      allowFullScreen
                      style={{ background: "#000" }}
                    />
                  ) : (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-28 object-cover"
                    />
                  )}
                  {video.duration && (
                    <Badge className="absolute bottom-1 right-1 bg-black/80 text-white text-xs">
                      {video.duration}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-500 transition-colors">
                    {video.title}
                  </h3>
                  {video.views && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                      <Eye className="w-3 h-3" /> {video.views} views
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Channel</h2>
              <Button size="icon" variant="ghost" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              <label className="font-medium">Channel Name</label>
              <input
                className="border rounded px-3 py-2"
                placeholder="Channel Name"
                value={formData.channelName}
                onChange={(e) =>
                  setFormData({ ...formData, channelName: e.target.value })
                }
              />

              <label className="font-medium">Profile Photo (Upload)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "profilePhoto")}
                ref={profileInputRef}
              />
              {formData.profilePhoto && (
                <img
                  src={formData.profilePhoto}
                  alt="Preview"
                  className="mt-2 w-24 h-24 rounded-full object-cover border"
                />
              )}

              <label className="font-medium">Cover Photo (Upload)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverPhoto")}
                ref={coverInputRef}
              />
              {formData.coverPhoto && (
                <img
                  src={formData.coverPhoto}
                  alt="Preview"
                  className="mt-2 w-full h-28 object-cover border rounded"
                />
              )}

              <label className="font-medium">Description</label>
              <textarea
                className="border rounded px-3 py-2 h-24"
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Save */}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} className="bg-purple-600 text-white">
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
