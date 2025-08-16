import React from "react";
import { useParams } from "react-router-dom";
import {
  Youtube,
  Instagram,
  Phone,
  User,
  MessageSquare,
  Video,
  Star,
  Heart,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MyChannel = () => {
  const { channelName } = useParams();

  // Load saved channel data
  const savedData = localStorage.getItem("myChannelData");
  const channelData = savedData ? JSON.parse(savedData) : null;

  // Example video list
  const [videos, setVideos] = React.useState([]);

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

    // Initial load
    fetchVideos();

    // Update when a new video is saved
    window.addEventListener("videosUpdated", fetchVideos);
    return () => window.removeEventListener("videosUpdated", fetchVideos);
  }, []);

  // If no channel data or name doesn't match, show error
  if (
    !channelData ||
    decodeURIComponent(channelName || "") !== channelData.name
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Video className="w-16 h-16 text-gray-400 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">
            Channel Not Found
          </h1>
          <p className="text-gray-600">
            No channel data found for this page.
          </p>
        </div>
      </div>
    );
  }

  // --- Cloudflare Stream Helper ---
  const getStreamIframeUrl = (videoId) =>
    `https://customer-94e2ffe1e7d5daf0d3de8d11c55dd2d6.cloudflarestream.com/${videoId}/iframe?autoplay=false&muted=true&controls=true`;

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans">
      {/* Hero */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500"></div>
        <div className="absolute top-0 left-0 w-full h-1/4 bg-black/10"></div>

        {/* Avatar */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <User className="w-16 h-16 text-purple-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden px-8 pb-4 mt-16">
        {/* Left: Info */}
        <div className="w-1/3 pr-6 flex flex-col gap-6 overflow-y-auto">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {channelData.name}
          </h1>

          <div className="flex flex-wrap gap-2">
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Eye className="w-4 h-4" /> 42.5K subs
            </Badge>
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Video className="w-4 h-4" /> {videos.length} videos
            </Badge>
            <Badge className="gap-1 px-3 py-1 bg-gray-200 text-gray-800">
              <Heart className="w-4 h-4" /> 1.2M views
            </Badge>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-2">
         
            {channelData.youtubeLink && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2 bg-white border border-gray-200 hover:border-purple-300"
              >
                <a
                  href={channelData.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="w-4 h-4 text-red-500" /> YouTube
                </a>
              </Button>
            )}
            {channelData.instagramLink && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2 bg-white border border-gray-200 hover:border-purple-300"
              >
                <a
                  href={channelData.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                </a>
              </Button>
            )}
          </div>

          {/* About */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-700">About</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {channelData.comment}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Videos */}
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
                  {/* Cloudflare Stream video embed if present */}
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
    </div>
  );
};

export default MyChannel;
