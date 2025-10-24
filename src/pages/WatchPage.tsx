/**
 * WatchPage - YouTube-style video watch page
 * 
 * Features:
 * - Integrated advertising system with TiptubePlayer
 * - YouTube-style layout with video, description, comments, and recommendations
 * - Glassmorphism effects with surround light
 * - Full dark/light mode theming
 * - Responsive design
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import TiptubePlayer from "../components/TiptubePlayer";
import ShareModal from "@/components/ShareModal";
import { useAuthModal } from "../contexts/AuthModalContext";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Flag, 
  MoreHorizontal,
  ChevronDown,
  Send
} from "lucide-react";

interface Video {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  videoUrl?: string;
  duration?: number;
  views: number;
  likes?: number;
  dislikes?: number;
  posted: string;
  channelId: number;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  price?: number;
  subscribers?: number;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  likes: number;
  posted: string;
  replies?: Comment[];
}

const formatDuration = (duration: number | string | undefined) => {
  if (duration === undefined || duration === null) return "0:00";
  const totalSeconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;
  const token = user?.accessToken || null;
  const userId = user?.id || null;

  // Transform API video data
  const transformVideoData = (apiVideo: any): Video => ({
    id: apiVideo.id || 0,
    title: apiVideo.name || "",
    description: apiVideo.description || "No description available",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0,
    likes: apiVideo.likes || Math.floor(Math.random() * 10000),
    dislikes: apiVideo.dislikes || Math.floor(Math.random() * 500),
    posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: apiVideo.isVerified || false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
    subscribers: apiVideo.subscribers || Math.floor(Math.random() * 100000),
  });

  // Fetch video details
  useEffect(() => {
    if (!id) return;
    
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const usePublicApi = !localStorage.getItem("UserLoggedIn") || !userId || !token;
        
        // Fetch specific video by ID
        const videoEndpoint = `${BASE_URL}/getvideo/${id}/${userId || 0}`;
        
        const videoRes = await fetch(videoEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
          },
        });
        
        const videoData = await videoRes.json();
        
        // Check if video was found
        if (videoData.status === 200 && videoData.data && Array.isArray(videoData.data) && videoData.data.length > 0) {
          const foundVideo = transformVideoData(videoData.data[0]);
          setCurrentVideo(foundVideo);
        } else {
          console.error("Video not found");
          toast.error("Video not found");
          navigate("/watch");
          return;
        }
        
        // Fetch related videos
        const relatedEndpoint = usePublicApi
          ? `${BASE_URL}/getpublicvideos/0/1`
          : `${BASE_URL}/getvideos/${userId}/0/1`;
        
        const relatedRes = await fetch(relatedEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
          },
        });
        
        const relatedData = await relatedRes.json();
        const relatedList = Array.isArray(relatedData.data)
          ? relatedData.data.map(transformVideoData).filter((v) => String(v.id) !== String(id))
          : [];
        
        setRelatedVideos(relatedList.slice(0, 20));
        
        // Mock comments for now
        setComments([
          {
            id: 1,
            userId: 101,
            userName: "John Doe",
            userAvatar: "/placeholder.svg",
            text: "Great video! Very informative.",
            likes: 42,
            posted: "2 days ago",
          },
          {
            id: 2,
            userId: 102,
            userName: "Jane Smith",
            userAvatar: "/placeholder.svg",
            text: "Thanks for sharing this content!",
            likes: 28,
            posted: "1 day ago",
          },
        ]);
      } catch (err) {
        console.error("Error fetching video", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id, BASE_URL, userId, token, navigate]);

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      if (currentVideo) {
        setCurrentVideo({ ...currentVideo, likes: (currentVideo.likes || 0) - 1 });
      }
    } else {
      setIsLiked(true);
      if (isDisliked) {
        setIsDisliked(false);
        if (currentVideo) {
          setCurrentVideo({ 
            ...currentVideo, 
            likes: (currentVideo.likes || 0) + 1,
            dislikes: (currentVideo.dislikes || 0) - 1 
          });
        }
      } else {
        if (currentVideo) {
          setCurrentVideo({ ...currentVideo, likes: (currentVideo.likes || 0) + 1 });
        }
      }
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
      if (currentVideo) {
        setCurrentVideo({ ...currentVideo, dislikes: (currentVideo.dislikes || 0) - 1 });
      }
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setIsLiked(false);
        if (currentVideo) {
          setCurrentVideo({ 
            ...currentVideo, 
            dislikes: (currentVideo.dislikes || 0) + 1,
            likes: (currentVideo.likes || 0) - 1 
          });
        }
      } else {
        if (currentVideo) {
          setCurrentVideo({ ...currentVideo, dislikes: (currentVideo.dislikes || 0) + 1 });
        }
      }
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now(),
      userId: userId || 0,
      userName: user?.name || "Guest User",
      userAvatar: user?.profile_image || "/placeholder.svg",
      text: newComment,
      likes: 0,
      posted: "just now",
    };
    
    setComments([comment, ...comments]);
    setNewComment("");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-adtip-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Video not found</h2>
          <button 
            onClick={() => navigate("/")} 
            className="px-6 py-2 bg-adtip-teal text-white rounded-full hover:bg-opacity-90 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1920px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Video Player with Glassmorphism Container */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-surround mb-6">
              <div className="relative aspect-video bg-black">
                {currentVideo.videoUrl && (
                  <TiptubePlayer
                    videoId={currentVideo.id}
                    videoUrl={currentVideo.videoUrl}
                    userId={userId || undefined}
                    autoplay={true}
                    width="100%"
                    height="100%"
                    onVideoEnd={() => console.log("Video ended")}
                    onVideoPlay={() => console.log("Video playing")}
                  />
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="glass-card rounded-2xl p-6 mb-6 shadow-surround">
              <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
                {currentVideo.title}
              </h1>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                {/* Channel Info */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(`/channel/${currentVideo.channelId}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={currentVideo.avatar || "/placeholder.svg"} 
                      alt={currentVideo.creatorName}
                      className="w-12 h-12 rounded-full ring-2 ring-adtip-teal/20"
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {currentVideo.creatorName}
                        </span>
                        {currentVideo.isVerified && (
                          <svg className="w-4 h-4 text-adtip-teal" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatViews(currentVideo.subscribers || 0)} subscribers
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSubscribe}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                      isSubscribed
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-adtip-teal text-white hover:bg-opacity-90 shadow-glow'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="glass-button flex items-center rounded-full overflow-hidden">
                    <button
                      onClick={handleLike}
                      className={`px-4 py-2.5 flex items-center gap-2 transition-all ${
                        isLiked ? 'text-adtip-teal' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{formatViews(currentVideo.likes || 0)}</span>
                    </button>
                    <div className="w-px h-6 bg-border"></div>
                    <button
                      onClick={handleDislike}
                      className={`px-4 py-2.5 transition-all ${
                        isDisliked ? 'text-red-500' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <button
                    onClick={() => setShareOpen(true)}
                    className="glass-button px-4 py-2.5 rounded-full flex items-center gap-2 text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                  </button>

                  <button className="glass-button p-2.5 rounded-full text-foreground hover:bg-muted/50 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Video Stats & Description */}
              <div className="glass-inner rounded-xl p-4 bg-muted/30 backdrop-blur-sm">
                <div className="flex items-center gap-4 text-sm font-medium text-foreground mb-3">
                  <span>{formatViews(currentVideo.views)} views</span>
                  <span>•</span>
                  <span>{formatDate(currentVideo.posted)}</span>
                  {currentVideo.price && currentVideo.price > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-adtip-teal">₹{currentVideo.price}</span>
                    </>
                  )}
                </div>
                
                <div className={`text-foreground/90 ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                  {currentVideo.description}
                </div>
                
                {currentVideo.description && currentVideo.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-sm font-medium text-foreground hover:text-adtip-teal transition-colors flex items-center gap-1"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="glass-card rounded-2xl p-6 shadow-surround">
              <h3 className="text-xl font-bold text-foreground mb-6">
                {comments.length} Comments
              </h3>

              {/* Add Comment */}
              {user ? (
                <div className="flex gap-4 mb-8">
                  <img 
                    src={user.profile_image || "/placeholder.svg"} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-transparent border-b-2 border-muted focus:border-adtip-teal outline-none py-2 text-foreground placeholder:text-muted-foreground transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 rounded-full bg-adtip-teal text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all shadow-glow"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setNewComment("")}
                        className="px-4 py-2 rounded-full text-foreground hover:bg-muted transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-inner rounded-xl p-4 mb-6 text-center">
                  <p className="text-muted-foreground mb-3">Sign in to leave a comment</p>
                  <button
                    onClick={openLoginModal}
                    className="px-6 py-2 bg-adtip-teal text-white rounded-full hover:bg-opacity-90 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <img 
                      src={comment.userAvatar} 
                      alt={comment.userName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.posted}
                        </span>
                      </div>
                      <p className="text-foreground/90 mb-2">{comment.text}</p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{comment.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Videos Sidebar */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="glass-card rounded-2xl p-4 shadow-surround sticky top-4">
              <h3 className="text-lg font-bold text-foreground mb-4 px-2">Related Videos</h3>
              <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
                {relatedVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      navigate(`/watch/${video.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="glass-inner rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all group"
                  >
                    <div className="flex gap-3 p-2">
                      <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-adtip-teal transition-colors">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-muted-foreground truncate">
                            {video.creatorName}
                          </span>
                          {video.isVerified && (
                            <svg className="w-3 h-3 text-adtip-teal flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatViews(video.views)} views • {formatDate(video.posted)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {currentVideo && (
        <ShareModal
          shareUrl={`${window.location.origin}/watch/${currentVideo.id}`}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
};

export default WatchPage;
