import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import PaidVideoPrompt from "../components/PaidVideoPrompt";

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
  duration?: number; // Mapped from `play_duration` (currently null in response)
  isPaid: boolean; // Mapped from `is_paid_promotional`
  pricePerMinute?: number; // Mapped from `promotional_price`
  views: number; // Mapped from `total_views`
  posted: string; // Mapped from `createddate`
  sponsored?: boolean; // Not provided, default to false
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
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const { isAuthenticated, user } = useAuth();

  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;
  const token = user?.accessToken || null;
  const userId = user?.id || null;

  // Type guard for video array
  const isVideoArray = (data: unknown): data is Video[] =>
    Array.isArray(data) && data.every(item => typeof item === 'object' && 'id' in item && 'name' in item);

  // Transform API video data to match Video interface
  const transformVideoData = (apiVideo: any): Video => ({
    id: apiVideo.id,
    title: apiVideo.name || "Untitled Video",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link,
    duration: apiVideo.play_duration ? parseInt(apiVideo.play_duration, 10) : undefined,
    isPaid: !!apiVideo.is_paid_promotional,
    pricePerMinute: apiVideo.promotional_price || undefined,
    views: apiVideo.total_views || 0,
    posted: apiVideo.createddate || "Recently",
    sponsored: false, // Not provided in API
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: false, // Not provided in API
    userId: apiVideo.createdby || 0,
  });

  // Fetch data (videos, channel, analytics)
  const fetchData = useCallback(async () => {
    if (!userId || !token || !hasMore) {
      setError("Authentication required. Please log in.");
      setShowLoginPrompt(true);
      setVideos([]);
      setChannel(null);
      setAnalytics(null);
      return;
    }

    setLoading(true);
    const abortController = new AbortController();
    setError(null);

    // Fetch videos
    try {
      const categoryId = categoryToIdMap[selectedCategory] || 0;
      console.log(`Fetching videos from: ${BASE_URL}/getvideos/${userId}/${categoryId}/${offset}`);
      const videoRes = await fetch(`${BASE_URL}/getvideos/${userId}/${categoryId}/${offset}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,
      });

      if (!videoRes.ok) {
        if (videoRes.status === 401) {
          setError("Authentication failed. Please log in again.");
          setShowLoginPrompt(true);
        } else if (videoRes.status === 404) {
          setError("No videos found for this category.");
        } else {
          setError(`Failed to load videos: ${videoRes.statusText}`);
        }
        throw new Error(`Video API returned status: ${videoRes.status}`);
      }

      const videoData = await videoRes.json();
      setApiResponseData(videoData);
      console.log("Video API response:", videoData);

      let videoList: Video[] = [];
      if (videoData && typeof videoData === 'object' && 'data' in videoData && isVideoArray(videoData.data)) {
        videoList = videoData.data.map(transformVideoData);
      } else if (isVideoArray(videoData)) {
        videoList = videoData.map(transformVideoData);
      } else {
        setError("Unexpected video data format");
      }

      console.log(`Processed ${videoList.length} videos`);
      setVideos(prev => (offset === 1 ? videoList : [...prev, ...videoList]));
      setHasMore(videoList.length > 0);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Error fetching videos:", err);
      setVideos(prev => prev || []);
    }

    // Fetch channel
    try {
      console.log(`Fetching channel from: ${BASE_URL}/getchannelbyuserid/${userId}`);
      const channelRes = await fetch(`${BASE_URL}/getchannelbyuserid/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,
      });

      if (!channelRes.ok) {
        if (channelRes.status === 401) {
          setError("Authentication failed. Please log in again.");
          setShowLoginPrompt(true);
        }
        console.warn(`Channel API returned status: ${channelRes.status}`);
        setChannel(null);
        return;
      }

      const channelData = await channelRes.json();
      console.log("Channel API response:", channelData);

      // Validate and set channel data
      if (channelData && typeof channelData === 'object' && 'id' in channelData && 'name' in channelData) {
        setChannel({
          id: channelData.id,
          name: channelData.name,
          description: channelData.description || undefined,
          avatar: channelData.avatar || undefined,
        });
      } else {
        console.warn("Invalid channel data format:", channelData);
        setChannel(null);
      }

      // Fetch analytics if channel ID exists
      if (channelData?.id) {
        try {
          console.log(`Fetching analytics from: ${BASE_URL}/analytics/${channelData.id}`);
          const analyticsRes = await fetch(`${BASE_URL}/analytics/${channelData.id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          });

          if (!analyticsRes.ok) {
            if (analyticsRes.status === 401) {
              setError("Authentication failed. Please log in again.");
              setShowLoginPrompt(true);
            }
            console.warn(`Analytics API returned status: ${analyticsRes.status}`);
            setAnalytics(null);
            return;
          }

          const analyticsData = await analyticsRes.json();
          console.log("Analytics API response:", analyticsData);
          setAnalytics(analyticsData);
        } catch (analyticsErr: any) {
          if (analyticsErr.name === "AbortError") return;
          console.error("Error fetching analytics:", analyticsErr);
          setAnalytics(null);
        }
      } else {
        console.warn("No channel ID found, skipping analytics fetch");
      }
    } catch (channelErr: any) {
      if (channelErr.name === "AbortError") return;
      console.error("Error fetching channel:", channelErr);
      setChannel(null);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }

    return () => abortController.abort();
  }, [userId, token, selectedCategory, offset, BASE_URL]);

  const loadMore = () => setOffset(prev => prev + 1);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAuthenticated && videoWatchCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [videoWatchCount, isAuthenticated]);

  const handleVideoClick = (id: number) => {
    const video = videos?.find(item => item.id === id);
    if (!video) return;

    if (video.isPaid) {
      setSelectedVideo(id);
      setShowPaidVideoPrompt(true);
    } else {
      if (playingVideoId !== null && playingVideoId !== id) {
        const currentVideo = videoRefs.current[playingVideoId];
        if (currentVideo) {
          currentVideo.pause();
        }
      }

      const videoElement = videoRefs.current[id];
      if (videoElement) {
        videoElement.play().catch(err => {
          console.error("Error playing video:", err);
          setError("Failed to play video. Please check the video URL or browser compatibility.");
        });
        setPlayingVideoId(id);
        processVideoView();
      }
    }
  };

  const handlePaidVideoContinue = () => {
    setShowPaidVideoPrompt(false);
    const video = videos?.find(item => item.id === selectedVideo);
    if (video && selectedVideo !== null) {
      const videoElement = videoRefs.current[selectedVideo];
      if (videoElement) {
        videoElement.play().catch(err => {
          console.error("Error playing paid video:", err);
          setError("Failed to play paid video. Please check the video URL or browser compatibility.");
        });
        setPlayingVideoId(selectedVideo);
      }
    }
  };

  const processVideoView = () => {
    if (!isAuthenticated) {
      setVideoWatchCount(prev => prev + 1);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined || isNaN(seconds)) {
      return "0:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
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
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <h3 className="font-bold text-md mb-1">Error fetching data:</h3>
            <p>{error}</p>
          </div>
        )}

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
        </div>

        <h3 className="font-bold text-lg mb-4">Recommended Videos</h3>
        <div className="space-y-6">
          {loading ? (
            <div>Loading videos...</div>
          ) : videos.length === 0 ? (
            <div>No videos found. {userId ? `Using userId: ${userId}` : 'No userId specified'}</div>
          ) : (
            <>
              {videos.map((video) => (
                <div key={video.id} className="flex gap-4 group cursor-pointer" onClick={() => handleVideoClick(video.id)}>
                  <div className="relative w-40 h-24 md:w-56 md:h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
                    {video.videoUrl ? (
                      <video
                        ref={(el) => (videoRefs.current[video.id] = el)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        poster={video.thumbnail || "/placeholder.svg"}
                        controls
                        preload="metadata"
                        onPlay={() => setPlayingVideoId(video.id)}
                        onPause={() => setPlayingVideoId(null)}
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                      {formatDuration(video.duration)}
                    </div>
                    {video.isPaid && (
                      <div className="absolute top-2 right-2 bg-adtip-teal text-white px-1.5 py-0.5 rounded text-xs">
                        ₹{video.pricePerMinute || 0}/min
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-adtip-teal transition-colors">
                      {video.title || "Untitled Video"}
                    </h3>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      {typeof video.views === 'number' ? `${video.views.toLocaleString()} views` : '0 views'} • {video.posted || 'Recently'}
                      {video.sponsored && (
                        <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Ad</span>
                      )}
                      {video.isPaid && (
                        <span className="ml-2 bg-adtip-teal/10 text-adtip-teal px-1.5 py-0.5 rounded">Paid</span>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      {video.avatar ? (
                        <img src={video.avatar} alt={video.creatorName} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">{(video.creatorName || "").charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="ml-2 text-xs text-gray-700">{video.creatorName || "Unknown Creator"}</span>
                      {video.isVerified && <span className="ml-1 text-adtip-teal text-xs">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && (
                <button onClick={loadMore} className="mt-4 px-4 py-2 bg-adtip-teal text-white rounded">
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TipTube;