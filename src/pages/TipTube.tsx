import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { useParams } from "react-router-dom";
import ShareModal from "@/components/ShareModal";


// Add icons for categories (use emoji or SVG for demo)
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
  All: 0, Tech: 1, Beauty: 2, Gaming: 3, Food: 4, Travel: 5, Finance: 6, Fashion: 7, Music: 8, Sports: 9, Education: 10,
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

// Sidebar menu definitions with SVG icons
const mainMenu = [
  {
    key: "Home",
    label: "Home",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M3 10.5L12 4l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10.5Z"/><path d="M9 22V12h6v10"/></svg>
    ),
  },
  {
    key: "TipTube",
    label: "TipTube",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20 6,4"/></svg>
    ),
  },
  {
    key: "TipShort",
    label: "TipShort",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    ),
  },
  {
    key: "TipCall",
    label: "TipCall",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.72 3.28a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c1.05.35 2.15.59 3.28.72A2 2 0 0 1 22 16.92z"/></svg>
    ),
  },
];

const marketplaceMenu = [
  {
    key: "TipShop",
    label: "Tip Shop",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    ),
  },
  {
    key: "Analysis",
    label: "Analysis",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 19V7M9 19V3M15 19v-8M20 19v-4"/></svg>
    ),
  },
  {
    key: "Follow",
    label: "Follow",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
    ),
  },
  {
    key: "MyWallet",
    label: "My Wallet",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M2 11h20"/></svg>
    ),
  },
  {
    key: "BecomeSeller",
    label: "Become Seller",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>
    ),
  },
  {
    key: "PostAdvertisers",
    label: "Post Advertisers",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M3 11v2a1 1 0 0 0 1 1h3l3 3V7l-3 3H4a1 1 0 0 0-1 1z"/><path d="M13 16h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-3"/></svg>
    ),
  },
  {
    key: "PremiumContent",
    label: "Premium Content",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    ),
  },
];

const TipTube = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  // At the top of your AdTubeWatchPage component (or wherever this button is used)
const [shareOpen, setShareOpen] = useState(false);
const [selectedVideo, setSelectedVideo] = useState<{ id: number } | null>(null);

  
  const [videos, setVideos] = useState<Video[]>([]);
const { id: videoIdParam } = useParams();
const [showRewardPopup, setShowRewardPopup] = useState(false);
const handleVideoComplete = (video) => {
  // Only reward if opened from a shareable link
  // i.e., we're in deep link mode AND the fetched video's ID matches the deep link
  if (videoIdParam && video && String(video.id) === String(videoIdParam)) {
    console.log(`User watched shared video ${video.id} fully - credit Rs.1`);
    
    // Optional: reward API call if logged in
    /*
    if (userId && token) {
      fetch(`${BASE_URL}/credit-reward/${userId}`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
    }
    */

    setShowRewardPopup(true);
  }
};


  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);


const handleAdTubeShare = (apiVideo: any) => {
  if (!apiVideo?.id || apiVideo.id === 0) {
    console.error("Cannot share: video ID is missing or invalid", apiVideo);
    return;
  }
  setSelectedVideo({ id: apiVideo.id });
  setShareOpen(true);
};



  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const videoRefs = useRef<{ [id: number]: HTMLVideoElement | null }>({});
  const feedRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;
  const token = user?.accessToken || null;
  const userId = user?.id || null;
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Transform API video data to match Video interface
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
    isVerified: false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  });

  // Fetch videos (infinite scroll)
 const fetchVideos = useCallback(
  async (reset = false) => {
    setLoading(true);

    try {
      const usePublicApi =
        !localStorage.getItem("UserLoggedIn") || !userId || !token;

      const apiEndpoint = usePublicApi
        ? `${BASE_URL}/getpublicvideos/${categoryToIdMap[selectedCategory] || 0}/${
            reset ? 1 : offset
          }`
        : `${BASE_URL}/getvideos/${userId}/${
            categoryToIdMap[selectedCategory] || 0
          }/${reset ? 1 : offset}`;

      const res = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();
      const videoList = Array.isArray(data.data)
        ? data.data.map(transformVideoData)
        : [];

      // ⭐ If we're in deep-link mode (/watch/:id)
      if (videoIdParam) {
        const foundVideo = videoList.find(
          (video) => String(video.id) === String(videoIdParam)
        );

        if (foundVideo) {
          setCurrentVideo(foundVideo);
          setVideos([]); // Optional: hide the rest of the list
          setHasMore(false);
        } else {
          // If not found in first page, optionally fallback to fetching more or showing "not found"
          setHasMore(false);
        }
        return; // Stop normal feed flow
      }

      // Normal feed mode — update the video list
      setVideos((prev) => (reset ? videoList : [...prev, ...videoList]));
      setHasMore(videoList.length > 0);
    } catch (err) {
      console.error("Error fetching videos", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  },
  [
    videoIdParam,
    selectedCategory,
    offset,
    BASE_URL,
    userId,
    token,
    categoryToIdMap,
  ]
);


  // Initial fetch and on category/search change
  useEffect(() => {
    setOffset(1);
    fetchVideos(true);
  }, [selectedCategory, search]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setOffset(prev => prev + 1);
      }
    };
    const ref = feedRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => { if (ref) ref.removeEventListener("scroll", handleScroll); };
  }, [loading, hasMore]);

  useEffect(() => {
    if (offset > 1) fetchVideos();
  }, [offset]);

  // Video player modal logic
  const openPlayer = (video: Video) => {
    setCurrentVideo(video);
    setShowPlayer(true);
  };
  const closePlayer = () => {
    setShowPlayer(false);
    setCurrentVideo(null);
  };

  // Keyboard controls for video player
  useEffect(() => {
    if (!currentVideo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const video = videoPlayerRef.current;
      if (!video) return;
      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        if (video.paused) video.play(); else video.pause();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          video.requestFullscreen?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVideo]);

  // --- UI ---
  return (
    <div ref={feedRef} className="h-screen overflow-y-auto px-4 py-6 bg-gray-100">
      {/* If a video is selected, show YouTube-style layout */}
      {currentVideo ? (
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-screen-2xl mx-auto">
          {/* Main Video Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-black rounded-xl overflow-hidden shadow-lg">
              <video
                ref={videoPlayerRef}
                src={currentVideo.videoUrl}
                poster={currentVideo.thumbnail}
                controls
                 onEnded={() => handleVideoComplete(currentVideo)}
                autoPlay
                className="w-full aspect-video max-h-[70vh] object-contain bg-black"
                style={{ background: 'black' }}
              />
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{currentVideo.title}</h2>
              <div className="flex items-center gap-3 mb-2">
                <img src={currentVideo.avatar || "/placeholder.svg"} alt={currentVideo.creatorName} className="w-10 h-10 rounded-full" />
                <div className="flex flex-col">
                  <a
                    href={`/channel/${currentVideo.channelId}`}
                    className="font-semibold text-gray-900 hover:underline text-base line-clamp-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Pause video when navigating to channel
                      const video = videoPlayerRef.current;
                      if (video) {
                        video.pause();
                      }
                    }}
                  >
                    {currentVideo.creatorName}
                  </a>
                  <span className="text-xs text-gray-500">{currentVideo.views.toLocaleString()} views • {currentVideo.posted}</span>
                </div>
                <button className="ml-auto px-4 py-1.5 rounded-full bg-adtip-teal text-white font-medium text-sm">Subscribe</button>
              </div>
              <div className="flex gap-3 mt-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 9l-3 3m0 0l-3-3m3 3V4m0 16v-7" /></svg>
                  Like
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2V4m0 16v-7" /></svg>
                  Dislike
                </button>
          <button
  onClick={() => handleAdTubeShare(currentVideo)}
  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
>
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
  Share
</button>


              </div>
              <button onClick={() => setCurrentVideo(null)} className="mt-4 px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-medium hover:bg-gray-300">Back to Feed</button>
            </div>
          </div>
          {/* Relevant Videos Sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="flex flex-col gap-3">
              {videos.filter(v => v.id !== currentVideo.id).map((video, idx) => (
                <div
  key={video.id}
  className="flex gap-3 bg-white rounded-lg shadow hover:shadow-md cursor-pointer overflow-hidden"
  onClick={() => {
    setCurrentVideo(video);
feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  }}
>
  <img
    src={video.thumbnail || "/placeholder.svg"}
    alt={video.title}
    className="w-36 h-20 object-cover flex-shrink-0"
  />
  <div className="flex flex-col justify-between py-2 pr-2 min-w-0 flex-1">
    <div className="font-semibold text-gray-900 text-sm line-clamp-2">
      {video.title}
    </div>
    <div className="flex items-center gap-2 mt-1">
      <img
        src={video.avatar || "/placeholder.svg"}
        alt={video.creatorName}
        className="w-6 h-6 rounded-full"
      />
      <span className="text-xs text-gray-600 truncate">
        {video.creatorName}
      </span>
    </div>
    <span className="text-xs text-gray-500 mt-1">
      {video.views.toLocaleString()} views • {video.posted}
    </span>
  </div>
</div>

              ))}
              {loading && (
                <div className="flex justify-center py-4 text-adtip-teal font-medium">Loading more...</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Default grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map(video => (
            <div
              key={video.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer flex flex-col"
              onClick={() => setCurrentVideo(video)}
              onMouseEnter={() => {
                setHoveredVideoId(video.id);
                const ref = videoRefs.current[video.id];
                if (ref) {
                  ref.currentTime = 0;
                  ref.play();
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
            >
              <div className="relative aspect-video bg-gray-200 rounded-t-xl overflow-hidden">
                {/* Price badge if paid */}
                {video.price && video.price > 0 && (
                  <span className="absolute top-2 right-2 bg-adtip-teal text-white text-xs px-3 py-1 rounded-full z-10 shadow">
                    ₹{video.price}
                  </span>
                )}
                {/* Show video on hover, else show thumbnail */}
                {hoveredVideoId === video.id && video.videoUrl ? (
                  <video
                    ref={el => (videoRefs.current[video.id] = el)}
                    src={video.videoUrl}
                    poster={video.thumbnail}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ background: 'black' }}
                  />
                ) : (
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <img src={video.avatar || "/placeholder.svg"} alt={video.creatorName} className="w-8 h-8 rounded-full" />
                  <div className="flex flex-col">
                    <a
                      href={`/channel/${video.channelId}`}
                      className="font-semibold text-sm text-adtip-teal hover:underline line-clamp-1"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Pause video when navigating to channel
                        const videoElement = document.querySelector(`video[src="${video.videoUrl}"]`) as HTMLVideoElement;
                        if (videoElement) {
                          videoElement.pause();
                        }
                        // Also pause current modal video if playing
                        const modalVideo = videoPlayerRef.current;
                        if (modalVideo) {
                          modalVideo.pause();
                        }
                      }}
                    >
                      {video.creatorName}
                    </a>
                    <span className="text-xs text-gray-500">{video.views.toLocaleString()} views • {video.posted}</span>
                  </div>
                </div>
                <div className="font-medium text-gray-900 text-base line-clamp-2 mb-1">{video.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && !currentVideo && (
        <div className="flex justify-center py-8">
          <span className="text-adtip-teal font-medium">Loading...</span>
        </div>
      )}
      {!loading && !hasMore && videos.length === 0 && (
        <div className="text-center text-gray-500 py-12">No videos found.</div>
      )}
      {/* Copied Toast */}
{selectedVideo && (
  <ShareModal
    shareUrl={`${window.location.origin}/watch/${selectedVideo.id}`}
    open={shareOpen}
    onClose={() => setShareOpen(false)}
  />
)}


      {showRewardPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
      <h2 className="text-xl font-bold mb-3">🎉 Congratulations!</h2>
      <p className="mb-2">You earned ₹1 for watching this video</p>
      <p className="mb-4 text-gray-600">Credit added to your wallet</p>
      <button
        onClick={() => window.location.href = "/login"}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2 w-full"
      >
        Login Now
      </button>
      <button
        onClick={() =>
          window.location.href = "https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app&hl=en_IN"
        }
        className="border border-blue-500 text-blue-500 px-4 py-2 rounded w-full"
      >
        Download AdTip App
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default TipTube;