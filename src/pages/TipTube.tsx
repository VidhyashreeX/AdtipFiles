
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import PaidVideoPrompt from "../components/PaidVideoPrompt";

// Sample data for TipTube videos
const tipTubeData = [
  {
    id: 1,
    user: {
      name: "Marketing Pro",
      avatar: "/placeholder.svg",
      isVerified: true,
    },
    video: {
      thumbnail: "/placeholder.svg",
      duration: 765, // in seconds (12:45)
      title: "How to Create Viral Marketing Campaigns",
      views: "250K",
      posted: "2 days ago",
      sponsored: true,
      isPaid: false,
      pricePerMinute: 0,
    },
  },
  {
    id: 2,
    user: {
      name: "Tech Reviewer",
      avatar: "/placeholder.svg",
      isVerified: true,
    },
    video: {
      thumbnail: "/placeholder.svg",
      duration: 500, // in seconds (08:20)
      title: "Latest Smartphone Review - Is it Worth Buying?",
      views: "185K",
      posted: "1 day ago",
      sponsored: false,
      isPaid: true,
      pricePerMinute: 4,
    },
  },
  {
    id: 3,
    user: {
      name: "Fitness Guru",
      avatar: "/placeholder.svg",
      isVerified: false,
    },
    video: {
      thumbnail: "/placeholder.svg",
      duration: 930, // in seconds (15:30)
      title: "10-Minute Home Workout for Beginners",
      views: "320K",
      posted: "3 days ago",
      sponsored: false,
      isPaid: false,
      pricePerMinute: 0,
    },
  },
  {
    id: 4,
    user: {
      name: "Cooking Expert",
      avatar: "/placeholder.svg",
      isVerified: true,
    },
    video: {
      thumbnail: "/placeholder.svg",
      duration: 375, // in seconds (06:15)
      title: "Quick and Easy Dinner Recipes for Busy People",
      views: "145K",
      posted: "5 days ago",
      sponsored: false,
      isPaid: true,
      pricePerMinute: 5,
    },
  },
  {
    id: 5,
    user: {
      name: "Travel Vlogger",
      avatar: "/placeholder.svg",
      isVerified: true,
    },
    video: {
      thumbnail: "/placeholder.svg",
      duration: 1330, // in seconds (22:10)
      title: "Hidden Gems in Southeast Asia You Must Visit",
      views: "210K",
      posted: "1 week ago",
      sponsored: true,
      isPaid: false,
      pricePerMinute: 0,
    },
  },
];

// Sample data for popular categories
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
  const { isAuthenticated, user, updateUserProfile } = useAuth();
  
  // Check if user is watching videos and prompt login after a few videos
  useEffect(() => {
    if (!isAuthenticated && videoWatchCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [videoWatchCount, isAuthenticated]);
  
  const handleVideoClick = (id: number) => {
    const video = tipTubeData.find(item => item.id === id);
    
    if (!video) return;
    
    // If it's a paid video and user is authenticated, show payment prompt
    if (video.video.isPaid) {
      setSelectedVideo(id);
      setShowPaidVideoPrompt(true);
      return;
    }
    
    // For free videos
    processVideoView();
  };
  
  const processVideoView = () => {
    // Increase watch count for non-authenticated users
    if (!isAuthenticated) {
      setVideoWatchCount(prevCount => prevCount + 1);
    } else {
      // If user is authenticated, update wallet
      if (user) {
        const currentWallet = user.wallet || 0;
        const isPremium = user.isPremium || false;
        const earnAmount = isPremium ? 1 : 0.06;
        
        updateUserProfile({
          wallet: currentWallet + earnAmount
        });
      }
    }
  }
  
  const handlePaidVideoContinue = () => {
    setShowPaidVideoPrompt(false);
    // Since payment is already processed in the PaidVideoPrompt component,
    // we don't need to do anything else here
  };
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-20 md:pb-0 bg-gray-50">
      {/* Show login prompt if needed */}
      {showLoginPrompt && (
        <VideoLoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}
      
      {/* Show paid video prompt if needed */}
      {showPaidVideoPrompt && selectedVideo !== null && (
        <PaidVideoPrompt
          onClose={() => setShowPaidVideoPrompt(false)}
          onContinue={handlePaidVideoContinue}
          pricePerMinute={tipTubeData.find(v => v.id === selectedVideo)?.video.pricePerMinute || 0}
          videoDuration={tipTubeData.find(v => v.id === selectedVideo)?.video.duration || 0}
          videoTitle={tipTubeData.find(v => v.id === selectedVideo)?.video.title || ""}
          creatorName={tipTubeData.find(v => v.id === selectedVideo)?.user.name || ""}
        />
      )}
      
      {/* Categories horizontal scroll - Made sticky with different z-index */}
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

      {/* Main content */}
      <div className="max-w-screen-lg mx-auto pt-4 px-4">
        {/* Featured Video */}
        <div className="mb-6">
          <div 
            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleVideoClick(0)}
          >
            <img 
              src="/placeholder.svg" 
              alt="Featured Video" 
              className="w-full h-full object-cover"
            />
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
                <img 
                  src="/placeholder.svg" 
                  alt="Creator" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="ml-2 text-sm font-medium">AdTip Official</span>
                <span className="ml-1 text-adtip-teal text-xs">✓</span>
              </div>
              <div className="text-xs text-gray-500">
                500K views • Sponsored
              </div>
            </div>
          </div>
        </div>

        {/* Watch to Earn Banner */}
        <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
          <h3 className="font-bold text-lg mb-1">Watch to Earn!</h3>
          <p className="text-sm mb-1">
            TipTube is a great place to enjoy your favourite content and to earn some cash while watching in between ads!
          </p>
        </div>

        {/* Videos List */}
        <h3 className="font-bold text-lg mb-4">Recommended Videos</h3>
        <div className="space-y-6">
          {tipTubeData.map((video) => (
            <div 
              key={video.id} 
              className="flex gap-4 group cursor-pointer"
              onClick={() => handleVideoClick(video.id)}
            >
              <div className="relative w-40 h-24 md:w-56 md:h-32 flex-shrink-0 overflow-hidden rounded-md">
                <img 
                  src={video.video.thumbnail} 
                  alt={video.video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                  {formatDuration(video.video.duration)}
                </div>
                {video.video.isPaid && (
                  <div className="absolute top-2 right-2 bg-adtip-teal text-white px-1.5 py-0.5 rounded text-xs">
                    ₹{video.video.pricePerMinute}/min
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-adtip-teal transition-colors">
                  {video.video.title}
                </h3>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {video.video.views} views • {video.video.posted}
                  </span>
                  {video.video.sponsored && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      Ad
                    </span>
                  )}
                  {video.video.isPaid && (
                    <span className="ml-2 text-xs bg-adtip-teal/10 text-adtip-teal px-1.5 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-2">
                  <img 
                    src={video.user.avatar} 
                    alt={video.user.name} 
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="ml-2 text-xs text-gray-700">
                    {video.user.name}
                  </span>
                  {video.user.isVerified && (
                    <span className="ml-1 text-adtip-teal text-xs">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TipTube;
