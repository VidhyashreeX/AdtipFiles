import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import PaidVideoPrompt from "../components/PaidVideoPrompt";

const popularCategories = [
  "All", "Tech", "Beauty", "Gaming", "Food", "Travel",
  "Finance", "Fashion", "Music", "Sports", "Education"
];

const TipTube = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPaidVideoPrompt, setShowPaidVideoPrompt] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [videoWatchCount, setVideoWatchCount] = useState(0);
  const [videos, setVideos] = useState<any[] | null>(null); // Nullable state to handle loading state
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetch("http://3.6.15.198:7082/api/getvideos/51951/0/1")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVideos(data);
        } else if (Array.isArray(data?.videos)) {
          setVideos(data.videos);
        } else {
          console.error("Unexpected video data format:", data);
          setVideos([]);
        }
      })
      .catch(error => {
        console.error("Error fetching videos:", error);
        setVideos([]);
      });
  }, []);

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
      processVideoView();
    }
  };

  const processVideoView = () => {
    if (!isAuthenticated) {
      setVideoWatchCount(prev => prev + 1);
    }
  };

  const handlePaidVideoContinue = () => {
    setShowPaidVideoPrompt(false);
  };

  const formatDuration = (seconds: number) => {
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
            onClick={() => setSelectedCategory(category)}
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
        {/* Static featured section */}
        <div className="mb-6">
          <div
            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleVideoClick(0)}
          >
            <img src="/placeholder.svg" alt="Featured Video" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <svg className="h-6 w-6 text-adtip-teal" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
              15:45
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-bold text-lg">How To Make Money Online in 2025</h2>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <img src="/placeholder.svg" alt="Creator" className="w-8 h-8 rounded-full object-cover" />
                <span className="ml-2 text-sm font-medium">AdTip Official</span>
                <span className="ml-1 text-adtip-teal text-xs">✓</span>
              </div>
              <div className="text-xs text-gray-500">500K views • Sponsored</div>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
          <h3 className="font-bold text-lg mb-1">TipTube Videos</h3>
          <p className="text-sm mb-1">Enjoy your favorite content from creators around the world!</p>
        </div>

        <h3 className="font-bold text-lg mb-4">Recommended Videos</h3>
        <div className="space-y-6">
          {videos === null ? (
            <div>Loading videos...</div>
          ) : videos.length === 0 ? (
            <div>No videos found.</div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="flex gap-4 group cursor-pointer" onClick={() => handleVideoClick(video.id)}>
                <div className="relative w-40 h-24 md:w-56 md:h-32 flex-shrink-0 overflow-hidden rounded-md">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                    {formatDuration(video.duration)}
                  </div>
                  {video.isPaid && (
                    <div className="absolute top-2 right-2 bg-adtip-teal text-white px-1.5 py-0.5 rounded text-xs">
                      ₹{video.pricePerMinute}/min
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-adtip-teal transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    {video.views} views • {video.posted}
                    {video.sponsored && (
                      <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Ad</span>
                    )}
                    {video.isPaid && (
                      <span className="ml-2 bg-adtip-teal/10 text-adtip-teal px-1.5 py-0.5 rounded">Paid</span>
                    )}
                  </div>
                  <div className="flex items-center mt-2">
                    <img src={video.avatar || "/placeholder.svg"} alt={video.creatorName} className="w-5 h-5 rounded-full" />
                    <span className="ml-2 text-xs text-gray-700">{video.creatorName}</span>
                    {video.isVerified && <span className="ml-1 text-adtip-teal text-xs">✓</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TipTube;
