import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ShareModal from "@/components/ShareModal";
import { Play, Clock, Eye } from "lucide-react";

const categories = [
  { name: "All", icon: "🏠" },
  { name: "Tech", icon: "💻" },
  { name: "Beauty", icon: "💄" },
  { name: "Gaming", icon: "🎮" },
  { name: "Food", icon: "🍔" },
  { name: "Travel", icon: "✈️" },
  { name: "Finance", icon: "💰" },
  { name: "Fashion", icon: "👗" },
  { name: "Music", icon: "🎵" },
  { name: "Sports", icon: "🏀" },
  { name: "Education", icon: "📚" },
];

const categoryToIdMap: { [key: string]: number } = {
  All: 0,
  Tech: 1,
  Beauty: 2,
  Gaming: 3,
  Food: 4,
  Travel: 5,
  Finance: 6,
  Fashion: 7,
  Music: 8,
  Sports: 9,
  Education: 10,
};

interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration?: number;
  views: number;
  posted: string;
  channelId: number;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  price?: number;
}

interface Short {
  id: number;
  title: string;
  thumbnail?: string;
  views: number;
  creatorName: string;
  avatar?: string;
}

const formatDuration = (duration: number | string | undefined) => {
  if (duration === undefined || duration === null) return "0:00";
  const totalSeconds = typeof duration === "string" ? parseInt(duration, 10) : duration;
  if (isNaN(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString || dateString === "Recently") return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const TipTube = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: number } | null>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);

  const videoRefs = useRef<{ [id: number]: HTMLVideoElement | null }>({});
  const feedRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const shortsScrollRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;
  const token = user?.accessToken || null;
  const userId = user?.id || null;

  const transformVideoData = (apiVideo: any): Video => ({
    id: apiVideo.id || 0,
    title: apiVideo.name || "",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0,
    posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: apiVideo.isVerified || false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  });

  const transformShortData = (apiShort: any): Short => ({
    id: apiShort.id || 0,
    title: apiShort.name || apiShort.description || "",
    thumbnail: apiShort.video_Thumbnail !== "undefined" ? apiShort.video_Thumbnail : undefined,
    views: apiShort.total_views || 0,
    creatorName: apiShort.channelName || "Unknown Creator",
    avatar: apiShort.channel_profile !== "null" ? apiShort.channel_profile : undefined,
  });

  const fetchVideos = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const usePublicApi = !localStorage.getItem("UserLoggedIn") || !userId || !token;

        const apiEndpoint = usePublicApi
          ? `${BASE_URL}/getpublicvideos/${categoryToIdMap[selectedCategory] || 0}/${reset ? 1 : offset}`
          : `${BASE_URL}/getvideos/${userId}/${categoryToIdMap[selectedCategory] || 0}/${reset ? 1 : offset}`;

        const res = await fetch(apiEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
          },
        });

        const data = await res.json();
        const videoList = Array.isArray(data.data) ? data.data.map(transformVideoData) : [];

        setVideos((prev) => (reset ? videoList : [...prev, ...videoList]));
        setHasMore(videoList.length > 0);
      } catch (err) {
        console.error("Error fetching videos", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, offset, BASE_URL, userId, token, loading]
  );

  const fetchShorts = useCallback(async () => {
    try {
      const usePublicApi = !localStorage.getItem("UserLoggedIn") || !userId || !token;

      const apiEndpoint = usePublicApi
        ? `${BASE_URL}/getpublicshorts/1`
        : `${BASE_URL}/getshorts/${userId}/1`;

      const res = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();
      const shortsList = Array.isArray(data.data) ? data.data.map(transformShortData).slice(0, 10) : [];

      setShorts(shortsList);
    } catch (err) {
      console.error("Error fetching shorts", err);
    }
  }, [BASE_URL, userId, token]);

  useEffect(() => {
    setOffset(1);
    setVideos([]);
    fetchVideos(true);
    fetchShorts();
  }, [selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setOffset((prev) => prev + 1);
      }
    };
    const ref = feedRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [loading, hasMore]);

  useEffect(() => {
    if (offset > 1) fetchVideos();
  }, [offset]);

  const handleVideoClick = (video: Video) => {
    navigate(`/watch/${video.id}`);
  };

  const handleShortClick = (short: Short) => {
    navigate(`/short/${short.id}`);
  };

  const handleShare = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    setSelectedVideo({ id: video.id });
    setShareOpen(true);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollShorts = (direction: "left" | "right") => {
    if (shortsScrollRef.current) {
      const scrollAmount = 300;
      shortsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div ref={feedRef} className="min-h-screen overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="relative">
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass-button flex items-center justify-center shadow-glow hover:shadow-glow transition-all"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={categoryScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pl-12 pr-12"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category.name
                      ? "bg-adtip-teal text-white shadow-glow"
                      : "glass-button text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass-button flex items-center justify-center shadow-glow hover:shadow-glow transition-all"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="glass-card rounded-2xl overflow-hidden shadow-surround hover:shadow-glow transition-all cursor-pointer group">
            <div className="relative aspect-video bg-gradient-to-br from-adtip-teal/20 to-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded mb-4">
                    SPONSORED
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Advertise with Adtip</h3>
                  <p className="text-muted-foreground mb-4">Reach millions of engaged viewers</p>
                  <button className="px-6 py-2.5 bg-adtip-teal text-white rounded-full font-medium hover:bg-opacity-90 shadow-glow transition-all">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {shorts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Shorts</h2>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollShorts("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass-button flex items-center justify-center shadow-glow hover:shadow-glow transition-all"
              >
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div
                ref={shortsScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pl-12 pr-12"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {shorts.map((short) => (
                  <div
                    key={short.id}
                    onClick={() => handleShortClick(short)}
                    className="flex-shrink-0 w-[180px] glass-card rounded-2xl overflow-hidden shadow-surround hover:shadow-glow hover:scale-105 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={short.thumbnail || "/placeholder.svg"}
                        alt={short.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 text-white text-xs mb-2">
                          <Eye className="w-3 h-3" />
                          <span>{formatViews(short.views)} views</span>
                        </div>
                        <p className="text-white text-sm font-medium line-clamp-2">{short.title}</p>
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollShorts("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass-button flex items-center justify-center shadow-glow hover:shadow-glow transition-all"
              >
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video)}
              onMouseEnter={() => {
                setHoveredVideoId(video.id);
                const ref = videoRefs.current[video.id];
                if (ref && video.videoUrl) {
                  ref.currentTime = 0;
                  ref.play().catch(() => {});
                }
              }}
              onMouseLeave={() => {
                setHoveredVideoId(null);
                const ref = videoRefs.current[video.id];
                if (ref) {
                  ref.pause();
                  ref.currentTime = 0;
                }
              }}
              className="glass-card rounded-xl overflow-hidden shadow-surround hover:shadow-glow hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="relative aspect-video bg-muted overflow-hidden">
                {hoveredVideoId === video.id && video.videoUrl ? (
                  <video
                    ref={(el) => (videoRefs.current[video.id] = el)}
                    src={video.videoUrl}
                    poster={video.thumbnail}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}

                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-white text-xs font-medium rounded">
                  {formatDuration(video.duration)}
                </div>

                {video.price && video.price > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-adtip-teal text-white text-xs font-bold rounded-full shadow-glow">
                    ₹{video.price}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-adtip-teal/0 group-hover:bg-adtip-teal shadow-glow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>

              <div className="p-3">
                <div className="flex gap-3 mb-2">
                  <img
                    src={video.avatar || "/placeholder.svg"}
                    alt={video.creatorName}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-adtip-teal transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs text-muted-foreground truncate">{video.creatorName}</p>
                      {video.isVerified && (
                        <svg className="w-3 h-3 text-adtip-teal flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatViews(video.views)}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(video.posted)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={(e) => handleShare(e, video)}
                    className="flex-1 glass-inner px-3 py-1.5 rounded-full text-xs font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/channel/${video.channelId}`);
                    }}
                    className="glass-inner p-1.5 rounded-full hover:bg-muted/50 transition-all"
                  >
                    <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-adtip-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-medium">Loading more videos...</p>
            </div>
          </div>
        )}

        {!loading && !hasMore && videos.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No more videos to load</p>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No videos found</h3>
            <p className="text-muted-foreground">Try selecting a different category</p>
          </div>
        )}
      </div>

      {selectedVideo && (
        <ShareModal
          shareUrl={`${window.location.origin}/watch/${selectedVideo.id}`}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
};

export default TipTube;
