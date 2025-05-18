import { useState, useEffect, useContext, useRef } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface AuthContextType {
  user: { id: string; name: string; accessToken: string | null; isPremium: boolean } | null;
}
const AuthContext = React.createContext<AuthContextType>({ user: null });

interface TipShort {
  id: number;
  user: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  content: {
    video: string;
    description: string;
    likes: string;
    comments: number;
    shares: number;
  };
  musicName: string;
}

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

const TipShorts = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [balance, setBalance] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const userId = user?.id || "";
  const token = user?.accessToken || null;
  const currentShort = shorts[currentIndex];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId || !token) {
        throw new Error("Please log in to view videos");
      }

      // Fetch shorts
      const shortsUrl = `${BASE_URL}/getshots/${userId}`;
      console.log("Fetching shorts from:", shortsUrl);
      const shortsResponse = await axios.get(shortsUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("getshots response:", shortsResponse.data);
      if (shortsResponse.status === 200) {
        if (!Array.isArray(shortsResponse.data)) {
          throw new Error("Invalid data format: Expected an array of shorts");
        }
        // Validate each short object
        const validShorts = shortsResponse.data.filter((short: any): short is TipShort => {
          return (
            typeof short === "object" &&
            short !== null &&
            typeof short.id === "number" &&
            typeof short.user === "object" &&
            typeof short.user.name === "string" &&
            typeof short.user.avatar === "string" &&
            typeof short.user.isVerified === "boolean" &&
            typeof short.content === "object" &&
            typeof short.content.video === "string" &&
            typeof short.content.description === "string" &&
            typeof short.content.likes === "string" &&
            typeof short.content.comments === "number" &&
            typeof short.content.shares === "number" &&
            typeof short.musicName === "string"
          );
        });
        if (validShorts.length === 0) {
          throw new Error("No valid shorts found in the response");
        }
        setShorts(validShorts);
      } else {
        throw new Error(`Unexpected response status: ${shortsResponse.status}`);
      }

      // Fetch balance
      const balanceResponse = await axios.get(`${BASE_URL}/getfunds/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("getfunds response:", balanceResponse.data);
      if (balanceResponse.status === 200) {
        setBalance(parseFloat(balanceResponse.data.availableBalance) || 0);
      } else {
        throw new Error(`Unexpected response status: ${balanceResponse.status}`);
      }

      // Fetch premium status
      const premiumResponse = await axios.get(`${BASE_URL}/check-premium/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("check-premium response:", premiumResponse.data);
      if (premiumResponse.status === 200) {
        setIsPremium(premiumResponse.data.isPremium || false);
      } else {
        throw new Error(`Unexpected response status: ${premiumResponse.status}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error occurred";
      console.error("Fetch error:", errorMessage, err.response?.data);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please sign in again.");
        navigate("/login");
      } else if (retryCount < maxRetries) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${maxRetries}`);
        setRetryCount(retryCount + 1);
        setTimeout(() => fetchData(), 2000); // Retry after 2 seconds
      } else {
        setError(`Failed to load data after ${maxRetries} attempts: ${errorMessage}`);
      }
    } finally {
      if (retryCount >= maxRetries || !error) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, token, navigate]);

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < shorts.length) {
      videoRefs.current.forEach((video, index) => {
        if (video && index !== currentIndex) {
          video.pause();
        }
      });

      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        currentVideo.play().catch((err) => {
          console.error("Error playing video:", err);
          setError("Failed to play video. Please try again.");
        });
      }
    }
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
    if (!isPremium) {
      setError("Upgrade to premium to like videos");
      return;
    }
    setLiked(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) return <div className="text-white h-screen flex items-center justify-center">Loading videos...</div>;
  if (error) return (
    <div className="text-red-500 h-screen flex flex-col items-center justify-center">
      <p>{error}</p>
      <Button onClick={() => { setRetryCount(0); fetchData(); }} className="mt-4">Retry</Button>
    </div>
  );
  if (!currentShort) return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-adtip-teal flex items-center justify-center mb-6">
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-600 mb-6">Oops! It looks like the page you're looking for doesn't exist or has been moved.</p>
      <Button
        onClick={() => navigate("/home")}
        className="bg-adtip-teal text-white hover:bg-adtip-teal/90 px-6 py-2 rounded-lg mb-2"
      >
        Go to Home
      </Button>
      <button
        onClick={() => navigate("/tiptube")}
        className="text-adtip-teal text-sm hover:underline"
      >
        or explore TipTube
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black overflow-hidden">
      <div className="relative h-full w-full overflow-hidden">
        <div className="h-full w-full bg-gray-900 flex items-center justify-center">
          {videoLoading && (
            <div className="absolute text-white">Loading video...</div>
          )}
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentShort.content.video}
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
            <span className="text-white text-sm font-semibold">Balance: ₹{balance.toFixed(2)}</span>
            {isPremium && (
              <span className="text-adtip-teal text-xs bg-adtip-teal/20 px-2 py-1 rounded-full">Premium</span>
            )}
          </div>
          <Button
            size="sm"
            className="teal-button text-xs"
            onClick={() => navigate("/premium")}
          >
            {isPremium ? "Manage Plan" : "Go Premium"}
          </Button>
        </div>

        <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-6">
          <button onClick={() => toggleLike(currentShort.id)} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full ${liked[currentShort.id] ? 'bg-pink-500/20' : 'bg-black/20'} backdrop-blur-lg flex items-center justify-center`}>
              <Heart className={`h-6 w-6 ${liked[currentShort.id] ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.likes}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.comments}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.shares}</span>
          </button>
        </div>

        <div className="absolute left-4 right-20 bottom-6 text-white">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden mr-3">
              {currentShort.user.avatar ? (
                <img src={currentShort.user.avatar} alt={currentShort.user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-2" />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-sm">{currentShort.user.name}</h3>
                {currentShort.user.isVerified && <span className="ml-1 text-adtip-teal text-xs">✓</span>}
              </div>
              <Button size="sm" className="h-7 mt-1 teal-button text-xs">Follow</Button>
            </div>
          </div>

          <p className="text-sm mb-2">{currentShort.content.description}</p>

          <div className="flex items-center text-xs bg-black/30 rounded-full px-3 py-1 w-fit">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12 6.5L9 18z" fill="currentColor" /></svg>
            {currentShort.musicName}
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