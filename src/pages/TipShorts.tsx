import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { contentAPI, userAPI } from '../services/api';

interface TipShort {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: "video";
  user_name: string;
  user_profile_image: string | null;
  likeCount: number;
  commentCount: number;
  is_liked: boolean;
  views: number;
}

const TipShorts = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !user?.accessToken) {
      setError("User session expired. Please login again.");
      navigate("/login");
      return;
    }
    // Prevent multiple fetches per mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    try {
      setLoading(true);
      setError(null);
      const [balanceResponse, shortsResponse] = await Promise.all([
        userAPI.getWalletBalance(user.id.toString()),
        contentAPI.getShorts(user.id.toString())
      ]);
      if (balanceResponse.data.status === 200) {
        setBalance(balanceResponse.data.availableBalance);
      }
      // Defensive: shortsResponse.data.data must be an array
      if (!shortsResponse.data || !Array.isArray(shortsResponse.data.data)) {
        setShorts([]);
        setError("No shorts available at the moment.");
        return;
      }
      const validShorts = shortsResponse.data.data.filter(
        (short) => short && short.media_url && short.media_type === "video"
      );
      setShorts(validShorts);
      const likedState = {};
      validShorts.forEach((short) => {
        likedState[short.id] = short.is_liked;
      });
      setLiked(likedState);
      if (validShorts.length === 0) {
        setError("No shorts available at the moment.");
      }
    } catch (err) {
      setError("Failed to load shorts. Please try again later.");
      setShorts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, navigate]);

  // Only fetch data once on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      fetchData();
    }
    return () => {
      hasInitialized.current = false;
      videoRefs.current.forEach(video => {
        if (video) {
          video.pause();
          video.src = "";
          video.load();
        }
      });
    };
  }, []); // Only run on mount/unmount

  // Handle video playback with better error handling
  useEffect(() => {
    if (!shorts.length || currentIndex < 0 || currentIndex >= shorts.length) return;

    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;

    // Pause all other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Play current video
    const playVideo = async () => {
      try {
        setVideoLoading(true);
        await currentVideo.play();
        setVideoLoading(false);
      } catch (err) {
        console.error("Error playing video:", err);
        setVideoLoading(false);
        setError("Failed to play video. Please try again.");
      }
    };

    playVideo();

    return () => {
      if (currentVideo) {
        currentVideo.pause();
      }
    };
  }, [currentIndex, shorts]);

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setVideoLoading(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setVideoLoading(true);
    }
  };

  const toggleLike = (id: number) => {
    setLiked(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) return <div className="text-white h-screen flex items-center justify-center">Loading videos...</div>;
  if (error) return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-adtip-teal flex items-center justify-center mb-6">
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
      <Button onClick={() => { hasInitialized.current = false; fetchData(); }} className="mt-4">Retry</Button>
      <Button onClick={() => navigate("/home")} className="bg-adtip-teal text-white hover:bg-adtip-teal/90 px-6 py-2 rounded-lg mb-2">Go to Home</Button>
      <button onClick={() => navigate("/tiptube")} className="text-adtip-teal text-sm hover:underline">or explore TipTube</button>
    </div>
  );
  if (!shorts.length) return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-adtip-teal flex items-center justify-center mb-6">
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">No Shorts Found</h1>
      <p className="text-gray-600 mb-6">It looks like there are no shorts available at the moment.</p>
      <Button onClick={() => { hasInitialized.current = false; fetchData(); }} className="mt-4">Retry</Button>
      <Button onClick={() => navigate("/home")} className="bg-adtip-teal text-white hover:bg-adtip-teal/90 px-6 py-2 rounded-lg mb-2">Go to Home</Button>
      <button onClick={() => navigate("/tiptube")} className="text-adtip-teal text-sm hover:underline">or explore TipTube</button>
    </div>
  );

  const currentShort = shorts[currentIndex];

  return (
    <div className="h-screen bg-black overflow-hidden">
      <div className="relative h-full w-full overflow-hidden">
        <div className="h-full w-full bg-gray-900 flex items-center justify-center">
          {videoLoading && (
            <div className="absolute text-white">Loading video...</div>
          )}
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentShort.media_url}
            muted={false}
            className="h-full w-full object-cover"
            onCanPlay={() => setVideoLoading(false)}
            onError={() => {
              setVideoLoading(false);
              setError("Failed to load video. Please try another short.");
            }}
          />
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-semibold">Balance: ₹{parseFloat(balance).toFixed(2)}</span>
          </div>
          <Button
            size="sm"
            className="teal-button text-xs"
            onClick={() => navigate("/premium")}
          >
            Go Premium
          </Button>
        </div>

        <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-6">
          <button onClick={() => toggleLike(currentShort.id)} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full ${liked[currentShort.id] ? 'bg-pink-500/20' : 'bg-black/20'} backdrop-blur-lg flex items-center justify-center`}>
              <Heart className={`h-6 w-6 ${liked[currentShort.id] ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.likeCount}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.commentCount}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.views}</span>
          </button>
        </div>

        <div className="absolute left-4 right-20 bottom-6 text-white">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden mr-3">
              {currentShort.user_profile_image ? (
                <img src={currentShort.user_profile_image} alt={currentShort.user_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-2" />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-sm">{currentShort.user_name}</h3>
              </div>
              <Button size="sm" className="h-7 mt-1 teal-button text-xs">Follow</Button>
            </div>
          </div>

          <p className="text-sm mb-2">{currentShort.title}</p>

          <div className="flex items-center text-xs bg-black/30 rounded-full px-3 py-1 w-fit">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12 6.5L9 18z" fill="currentColor" /></svg>
            Music Name
          </div>
        </div>

        <div className="absolute top-16 left-4 right-4 flex">
          {shorts.map((_, index) => (
            <div key={index} className={`h-1 flex-1 mx-0.5 rounded-full ${index === currentIndex ? 'bg-adtip-teal' : 'bg-gray-400/50'}`} />
          ))}
        </div>

        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 bottom-0 w-1/3 h-full" onClick={handlePrevious} />
          <div className="absolute right-0 top-0 bottom-0 w-1/3 h-full" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
};

export default TipShorts;