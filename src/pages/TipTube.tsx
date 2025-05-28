import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import PaidVideoPrompt from "../components/PaidVideoPrompt";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { useNavigate } from "react-router-dom";

const popularCategories = [
  "All", "Tech", "Beauty", "Gaming", "Food", "Travel",
  "Finance", "Fashion", "Music", "Sports", "Education"
];

// Mapping categories to category IDs
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
  title: string; // Mapped from `name`
  thumbnail?: string; // Mapped from `video_Thumbnail`
  videoUrl?: string; // Mapped from `video_link`
  duration?: number; // Mapped from `play_duration` or `duration`
  isPaid: boolean; // Mapped from `is_paid_promotional`
  pricePerMinute?: number; // Mapped from `promotional_price`
  views: number; // Mapped from `total_views`
  posted: string; // Mapped from `createddate`
  sponsored?: boolean; // Not provided, default to false
  channelId: number; // Mapped from channel_id, channelId, or createdby
  avatar?: string; // Mapped from `channel_profile`
  creatorName: string; // Mapped from `channelName`
  isVerified?: boolean; // Not provided, default to false
  userId: number; // Mapped from `createdby`
}

interface Channel {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
}

interface Analytics {
  totalViews: number;
  totalEarnings: number;
  videoCount: number;
}

interface APIResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface VideoAPIResponse extends APIResponse<Video[]> {
  total_count?: number;
  current_page?: number;
}

interface ChannelAPIResponse extends APIResponse<Channel> {}

interface AnalyticsAPIResponse extends APIResponse<Analytics> {}

const TipTube = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPaidVideoPrompt, setShowPaidVideoPrompt] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [videoWatchCount, setVideoWatchCount] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiResponseData, setApiResponseData] = useState<unknown>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPremiumOverlay, setShowPremiumOverlay] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;
  const token = user?.accessToken || null;
  const userId = user?.id || null;
  // Type guard for video array
  const isVideoArray = (data: unknown): data is Video[] =>
    Array.isArray(data) && data.every(item => typeof item === 'object' && 'id' in item && 'name' in item);

  // Transform API video data to match Video interface
  const transformVideoData = (apiVideo: any): Video => ({    id: apiVideo.id || 0,
    title: apiVideo.name || "", // API returns 'name' instead of 'title'
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link, // API returns 'video_link' instead of 'video_url'
    // Handle both possible duration field names and ensure proper number conversion
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    isPaid: !!apiVideo.is_paid_promotional,
    pricePerMinute: apiVideo.promotional_price || undefined,
    views: apiVideo.total_views || 0,
    posted: apiVideo.createddate || "Recently",
    sponsored: false,
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: false,
    userId: apiVideo.createdby || 0,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0
  });

  const fetchWithRetry = useCallback(async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        
        if (response.status === 401) {
          setError("Authentication failed. Please log in again.");
          setShowLoginPrompt(true);
          throw new Error("Authentication failed");
        }
        
        if (i === retries - 1) throw new Error(`Failed after ${retries} retries`);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } catch (err) {
        if (i === retries - 1) throw err;
      }
    }
    throw new Error("Unexpected error in fetchWithRetry");
  }, []);  // Fetch data (videos, channel, analytics)
  const fetchData = useCallback(async () => {
    // If no more data to load, return early
    if (!hasMore) return;

    // Determine if we should use public or authenticated API
    const usePublicApi = !localStorage.getItem("UserLoggedIn") || !userId || !token;
    const apiEndpoint = usePublicApi 
      ? `${BASE_URL}/getpublicvideos/${categoryToIdMap[selectedCategory] || 0}/${offset}`
      : `${BASE_URL}/getvideos/${userId}/${categoryToIdMap[selectedCategory] || 0}/${offset}`;

    setLoading(true);
    const abortController = new AbortController();
    setError(null);

    try {      console.log(`Fetching videos from: ${apiEndpoint}`);
      const fetchOptions: RequestInit = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(usePublicApi ? {} : { Authorization: `Bearer ${token}` }),
        },
        signal: abortController.signal,
      };

      // Fetch videos using either public or authenticated endpoint
      const videoRes = await fetchWithRetry(apiEndpoint, fetchOptions);

      const videoData = await videoRes.json() as VideoAPIResponse;
      
      if (!videoData || !Array.isArray(videoData.data)) {
        throw new Error("Invalid video data format received from server");
      }

      const videoList = videoData.data.map(transformVideoData);
      console.log(`Processed ${videoList.length} videos`);
      
      setVideos(prev => (offset === 1 ? videoList : [...prev, ...videoList]));
      setHasMore(videoList.length > 0);      // Only fetch channel and analytics data for authenticated users on first page
      if (!usePublicApi && offset === 1) {
        try {
          const channelId = await fetchChannel(abortController);
          if (channelId) {
            await fetchAnalytics(abortController, channelId);
          }
        } catch (err) {
          console.error("Error in channel/analytics fetch:", err);
          // Don't rethrow - this is not critical for the main video display
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      
      console.error("Error in fetchData:", err);
      const errorMessage = err.message === "Authentication failed"
        ? "Authentication failed. Please log in again."
        : "Failed to load content. Please try again.";
      
      setError(errorMessage);
      if (err.message === "Authentication failed") {
        setShowLoginPrompt(true);
      }
      
      setVideos(prev => prev || []);
    } finally {
      setLoading(false);
    }

    return () => abortController.abort();
  }, [userId, token, selectedCategory, offset, BASE_URL, hasMore]);

  const fetchChannel = async (abortController: AbortController) => {
    try {
      console.log(`Fetching channel from: ${BASE_URL}/getchannelbyuserid/${userId}`);
      const res = await fetchWithRetry(
        `${BASE_URL}/getchannelbyuserid/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        }
      );

      const channelData = (await res.json()) as ChannelAPIResponse;
      
      if (!channelData?.data?.id) {
        console.log("No valid channel data found");
        setChannel(null);
        setAnalytics(null);
        return null;
      }
      
      setChannel(channelData.data);
      return channelData.data.id;
    } catch (err: any) {
      console.error("Error fetching channel:", err);
      setChannel(null);
      setAnalytics(null);
      return null;
    }
  };

  const fetchAnalytics = async (abortController: AbortController, channelId: number) => {
    if (!channelId) {
      console.log("Skipping analytics fetch - no channel ID");
      return;
    }
    
    try {
      console.log(`Fetching analytics from: ${BASE_URL}/analytics/${channelId}`);
      const res = await fetchWithRetry(
        `${BASE_URL}/analytics/${channelId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        }
      );

      const analyticsData = (await res.json()) as AnalyticsAPIResponse;
      if (!analyticsData?.data) {
        console.log("No valid analytics data found");
        setAnalytics(null);
        return;
      }
      
      setAnalytics(analyticsData.data);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setAnalytics(null);
    }
  };

  const loadMore = () => setOffset(prev => prev + 1);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAuthenticated && videoWatchCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [videoWatchCount, isAuthenticated]);

  const processVideoView = useCallback(() => {
    if (!isAuthenticated) {
      setVideoWatchCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 2) {
          setShowLoginPrompt(true);
        }
        return newCount;
      });
    }
  }, [isAuthenticated]);

  const handleVideoClick = useCallback((id: number) => {
    const video = videos?.find(item => item.id === id);
    if (!video) {
      setError("Video not found");
      return;
    }

    if (video.isPaid) {
      setSelectedVideo(id);
      setShowPaidVideoPrompt(true);
      return;
    }

    // Stop currently playing video if exists
    if (playingVideoId !== null && playingVideoId !== id) {
      const currentVideo = videoRefs.current[playingVideoId];
      if (currentVideo) {
        currentVideo.pause();
      }
    }

    const videoElement = videoRefs.current[id];
    if (!videoElement) {
      setError("Video player not initialized");
      return;
    }

    videoElement.play().catch(err => {
      console.error("Error playing video:", err);
      setError("Failed to play video. Please try again.");
    });

    setPlayingVideoId(id);
    processVideoView();
  }, [videos, playingVideoId, processVideoView]);

  const handlePaidVideoContinue = useCallback(() => {
    setShowPaidVideoPrompt(false);
    const video = videos?.find(item => item.id === selectedVideo);
    if (!video || !selectedVideo) {
      setError("Video not found");
      return;
    }

    const videoElement = videoRefs.current[selectedVideo];
    if (!videoElement) {
      setError("Video player not initialized");
      return;
    }

    videoElement.play().catch(err => {
      console.error("Error playing paid video:", err);
      setError("Failed to play video. Please try again.");
    });

    setPlayingVideoId(selectedVideo);
    processVideoView();
  }, [videos, selectedVideo, processVideoView]);

  // Cleanup function for video resources
  useEffect(() => {
    return () => {
      // Pause all videos and clear refs when component unmounts
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause();
        }
      });
      videoRefs.current = {};
    };
  }, []);
  const formatDuration = (duration: number | string | undefined) => {
    if (duration === undefined || duration === null) return "0:00";
    
    // Convert string duration to number if needed
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

  const handleChannelClick = (e: React.MouseEvent, channelId: number) => {
    e.stopPropagation(); // Prevent video click handler from firing
    navigate(`/channel/${channelId}`);
  };
  const VideoCreator = ({ video }: { video: Video }) => (
    <button 
      onClick={(e) => handleChannelClick(e, video.channelId)}
      className="text-xs text-gray-600 hover:text-adtip-teal transition-colors text-left flex items-center gap-1"
    >
      <span>{video.creatorName}</span>
      {video.isVerified && (
        <svg className="w-3 h-3 text-adtip-teal" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  const handleFullscreen = (vid: HTMLVideoElement) => {
    if (vid.requestFullscreen) vid.requestFullscreen();
    else if ((vid as any).webkitRequestFullscreen) (vid as any).webkitRequestFullscreen();
  };

  const TipTubeContent = () => (
    <div className="pb-20 md:pb-0 bg-gray-50">
      {showLoginPrompt && <VideoLoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      {showPaidVideoPrompt && selectedVideo !== null && (
        <PaidVideoPrompt
          onClose={() => setShowPaidVideoPrompt(false)}
          onContinue={handlePaidVideoContinue}
          pricePerMinute={videos?.find(v => v.id === selectedVideo)?.pricePerMinute || 0}
          videoDuration={videos?.find(v => v.id === selectedVideo)?.duration || 0}
          videoTitle={videos?.find(v => v.id === selectedVideo)?.title || ""}
          creatorName={videos?.find(v => v.id === selectedVideo)?.creatorName || ""}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      
      <div className="bg-white sticky top-[60px] md:top-[57px] z-10 py-3 px-4 overflow-x-auto flex whitespace-nowrap gap-3 no-scrollbar shadow-sm">
        {popularCategories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setOffset(1); // Reset offset when changing category
              setVideos([]); // Clear videos to avoid stale data
            }}
            className={`px-4 py-1.5 rounded-full text-sm transition-all ${
              selectedCategory === category
                ? "bg-adtip-teal text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="max-w-screen-lg mx-auto pt-4 px-4">
        {import.meta.env.MODE === 'development' && apiResponseData && !videos?.length && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
            <h3 className="font-bold text-md mb-1">API Response Debug:</h3>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(apiResponseData, null, 2)}
            </pre>
          </div>
        )}

        {channel && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <img src={channel.avatar || "/placeholder.svg"} alt="Channel" className="w-12 h-12 rounded-full" />
              <div>
                <h2 className="text-lg font-bold">{channel.name}</h2>
                {channel.description && <p className="text-sm text-gray-600">{channel.description}</p>}
              </div>
            </div>
          </div>
        )}

        {analytics && (
          <div className="mb-6 bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-md font-bold mb-2">Channel Analytics</h3>
            <p className="text-sm">Total Views: {analytics.totalViews}</p>
            <p className="text-sm">Total Earnings: ₹{analytics.totalEarnings}</p>
            <p className="text-sm">Video Count: {analytics.videoCount}</p>
          </div>
        )}

        <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
          <h3 className="font-bold text-lg mb-1">TipTube Videos</h3>
          <p className="text-sm mb-1">Enjoy your favorite content from creators around the world!</p>
        </div>        {/* Video Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="relative group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"              onMouseEnter={(e) => {
                e.preventDefault();
                const video = videoRefs.current[vid.id];
                if (video && document.contains(video)) {
                  const playPromise = async () => {
                    try {
                      video.muted = true;
                      video.currentTime = 0;
                      await video.play();
                    } catch (err) {
                      // Only log if it's not an abort error due to quick mouse movements
                      if (err.name !== 'AbortError') {
                        console.log('Preview play failed:', err);
                      }
                    }
                  };
                  playPromise();
                }
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                const video = videoRefs.current[vid.id];
                if (video && document.contains(video)) {
                  // Only attempt to pause if the video is actually playing
                  if (!video.paused) {
                    video.pause();
                  }
                  video.currentTime = 0;
                  if (!document.fullscreenElement) {
                    video.load(); // Reset to thumbnail only if not in fullscreen
                  }
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                const video = videoRefs.current[vid.id];
                if (video) {
                  if (!video.paused) {
                    video.pause();
                  }
                  handleFullscreen(video);
                  // Ensure video plays after entering fullscreen
                  video.play().catch((err) => console.log('Fullscreen play failed:', err));
                }
              }}
            >
              <div className="relative aspect-video bg-gray-100">
                <video                  ref={el => {
                    videoRefs.current[vid.id] = el;
                    if (el && vid.isPaid && !user?.is_premium) {
                      el.addEventListener('timeupdate', () => {
                        if (el.currentTime >= 5) {
                          el.pause();
                          setShowPremiumOverlay(vid.id);
                          // Keep video in fullscreen if it's currently fullscreen
                          if (document.fullscreenElement === el) {
                            // Do nothing, keep fullscreen
                          } else {
                            el.load(); // Reset to thumbnail only if not fullscreen
                          }
                        }
                      });
                    }
                  }}
                  src={vid.videoUrl}
                  poster={vid.thumbnail}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  playsInline
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-white text-xs">
                  {formatDuration(vid.duration)}
                </div>
                {vid.isPaid && vid.pricePerMinute && (
                  <div className="absolute top-2 right-2 bg-adtip-teal px-2 py-1 rounded text-white text-xs font-medium">
                    ₹{vid.pricePerMinute}/min
                  </div>
                )}                {showPremiumOverlay === vid.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-3"
                       style={{ zIndex: 9999 }}>
                    <div className="text-white text-center max-w-[85%]">
                      <h3 className="font-semibold text-xs leading-snug mb-1">Unlock Premium Content</h3>
                      <p className="text-[10px] text-gray-300 mb-2">Get unlimited access to all paid videos</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Exit fullscreen before navigating
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        }
                        navigate('/premium');
                      }}
                      className="bg-adtip-teal hover:bg-[#13b799] text-white px-3 py-1 rounded-full font-medium text-[11px] transition-colors duration-200 flex items-center gap-1"
                    >
                      <span>Upgrade to Premium</span>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium line-clamp-2 mb-2">{vid.title}</h3>
                <div className="flex flex-col gap-1">
                  <VideoCreator video={vid} />
                  <div className="text-xs text-gray-500">
                    {vid.views.toLocaleString()} views
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="w-full py-3 text-center text-sm text-gray-600 hover:text-adtip-teal transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );

  return <TipTubeContent />;
};

export default TipTube;