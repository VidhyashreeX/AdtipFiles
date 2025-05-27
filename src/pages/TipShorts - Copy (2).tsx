import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, ThumbsDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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

interface ApiResponse<T> {
  status?: string;
  message?: string;
  data?: T;
}

const TipShorts = () => {
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [disliked, setDisliked] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    videoRefs.current = Array(shorts.length).fill(null);
  }, [shorts]);
  useEffect(() => {
    // Don't redirect during initial load/auth check
    if (!isAuthenticated && !localStorage.getItem("UserLoggedIn")) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchShorts = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);

      try {
        const userId = localStorage.getItem("userId") || "50816";
        const apiUrl = `${BASE_URL}/getshots/${userId}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
          throw new Error(`Failed to load tip shorts: ${res.status} ${await res.text()}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("API did not return JSON.");
        }

        const data: ApiResponse<unknown[]> = await res.json();
        const rawShorts = Array.isArray(data.data) ? data.data : [];

        const normalized: TipShort[] = rawShorts
          .map((short): TipShort | null => {
            const s = short as {
              id: number;
              video_link: string;
              channelName?: string;
              channel_profile?: string;
              video_desciption?: string;
              total_likes?: number;
              total_comments?: number;
              video_music?: string;
            };
            if (!s.video_link) return null;

            return {
              id: s.id,
              user: {
                name: s.channelName || "Unknown",
                avatar: s.channel_profile || "/placeholder.svg",
                isVerified: false,
              },
              content: {
                video: s.video_link.startsWith("http")
                  ? s.video_link
                  : `${BASE_URL.replace(/\/api$/, "")}${s.video_link}`,
                description: s.video_desciption || s.channelName || "No description",
                likes: String(s.total_likes || 0),
                comments: s.total_comments || 0,
                shares: 0,
              },
              musicName: s.video_music || "Unknown",
            };
          })
          .filter((s): s is TipShort => s !== null);

        if (normalized.length === 0) {
          throw new Error("No valid shorts found.");
        }

        setShorts(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
  }, [isAuthenticated, BASE_URL]);
  const pauseAllVideosExcept = useCallback(
    (exceptIndex: number) => {
      videoRefs.current.forEach((video, idx) => {
        if (video && idx !== exceptIndex && !video.paused && isMounted.current) {
          video.pause();
          video.muted = true; // Always mute non-current videos
          setIsPlaying((prev) => ({ ...prev, [shorts[idx].id]: false }));
          setIsMuted((prev) => ({ ...prev, [shorts[idx].id]: true }));
        }
      });
    },
    [shorts]
  );

  const handleUnmute = useCallback((id: number, index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    
    // Only allow unmuting the current video
    if (index === currentIndex) {
      video.muted = false;
      setIsMuted(prev => ({ ...prev, [id]: false }));
      
      video.play().catch(err => {
        console.error("Error playing video after unmute:", err);
        setPlaybackError("Failed to play video.");
        video.muted = true;
        setIsMuted(prev => ({ ...prev, [id]: true }));
      });
    }
  }, [currentIndex]);

  const playVideoAtIndex = useCallback(
    (index: number) => {
      const video = videoRefs.current[index];
      if (video && isMounted.current) {
        // Always start muted to allow autoplay
        video.muted = true;
        setIsMuted(prev => ({ ...prev, [shorts[index].id]: true }));
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (isMounted.current) {
                setIsPlaying(prev => ({ ...prev, [shorts[index].id]: true }));
                // Keep it muted and show the unmute UI
                if (index === currentIndex) {
                  setPlaybackError(null);
                }
              }
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              if (isMounted.current) {
                setPlaybackError("Tap to play");
                setIsPlaying(prev => ({ ...prev, [shorts[index].id]: false }));
                video.muted = true;
                setIsMuted(prev => ({ ...prev, [shorts[index].id]: true }));
              }
            });
        }
      }
    },
    [shorts, isMuted, currentIndex]
  );

  // Keyboard navigation: Up / Down arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore repeated events on holding key

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < shorts.length - 1) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);
          pauseAllVideosExcept(newIndex);
          playVideoAtIndex(newIndex);
          containerRef.current?.scrollTo({
            top: newIndex * window.innerHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          pauseAllVideosExcept(newIndex);
          playVideoAtIndex(newIndex);
          containerRef.current?.scrollTo({
            top: newIndex * window.innerHeight,
            behavior: "smooth",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shorts.length, pauseAllVideosExcept, playVideoAtIndex]);

  // Scroll handler to change only one short per scroll event, debounce the scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const onScroll = () => {
      if (scrollTimeout) return; // already waiting to handle

      scrollTimeout = setTimeout(() => {
        if (!containerRef.current || !isMounted.current) {
          scrollTimeout = null;
          return;
        }

        const scrollPos = containerRef.current.scrollTop;
        const videoHeight = window.innerHeight;
        const newIndex = Math.round(scrollPos / videoHeight);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
          setCurrentIndex(newIndex);
          pauseAllVideosExcept(newIndex);
          playVideoAtIndex(newIndex);
          // Snap scroll to exact newIndex to avoid partial scroll
          containerRef.current.scrollTo({
            top: newIndex * videoHeight,
            behavior: "smooth",
          });
        }
        scrollTimeout = null;
      }, 100); // 100ms debounce to limit frequent index changes
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", onScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", onScroll);
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [currentIndex, shorts.length, pauseAllVideosExcept, playVideoAtIndex]);

  useEffect(() => {
    if (shorts.length > 0) {
      playVideoAtIndex(0);
    }
  }, [shorts, playVideoAtIndex]);

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDislike = (id: number) => {
    setDisliked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePlayPause = (id: number, index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (isPlaying[id]) {
      video.pause();
      setIsPlaying((prev) => ({ ...prev, [id]: false }));
    } else {
      pauseAllVideosExcept(index);
      playVideoAtIndex(index);
    }
  };

  // Auto-advance to next video when current ends
  const handleVideoEnded = (index: number) => {
    if (index < shorts.length - 1) {
      setCurrentIndex(index + 1);
      pauseAllVideosExcept(index + 1);
      playVideoAtIndex(index + 1);
      containerRef.current?.scrollTo({
        top: (index + 1) * window.innerHeight,
        behavior: "smooth",
      });
    } else {
      // Optionally, loop to first video
      setCurrentIndex(0);
      pauseAllVideosExcept(0);
      playVideoAtIndex(0);
      containerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Touch support for mobile swipe
  useEffect(() => {
    let startY = 0;
    let endY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      endY = e.changedTouches[0].clientY;
      const deltaY = endY - startY;
      if (Math.abs(deltaY) > 50) {
        if (deltaY < 0 && currentIndex < shorts.length - 1) {
          setCurrentIndex(currentIndex + 1);
          pauseAllVideosExcept(currentIndex + 1);
          playVideoAtIndex(currentIndex + 1);
          containerRef.current?.scrollTo({
            top: (currentIndex + 1) * window.innerHeight,
            behavior: "smooth",
          });
        } else if (deltaY > 0 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
          pauseAllVideosExcept(currentIndex - 1);
          playVideoAtIndex(currentIndex - 1);
          containerRef.current?.scrollTo({
            top: (currentIndex - 1) * window.innerHeight,
            behavior: "smooth",
          });
        }
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [currentIndex, shorts.length, pauseAllVideosExcept, playVideoAtIndex]);

  // Snap scroll CSS for full-screen shorts
  // ...existing code...
  return (
    <div className="min-h-screen bg-white overflow-y-scroll snap-y snap-mandatory mt-[-40px] scrollbar-hide">
      {shorts.map((short, index) => (
        <div
          key={short.id}
          className="snap-start flex items-start justify-center w-full h-screen py-4 overflow-hidden relative"
        >
          <div className="flex items-start justify-center space-x-4 w-full h-full bg-gray-100 rounded-2xl shadow-lg border border-gray-200 relative">
            <div className="w-[360px] h-[90vh] bg-gray-900 relative rounded-2xl flex items-center justify-center transition-all duration-300">
              {short.content.video ? (
                <>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    className="h-full w-full object-cover rounded-2xl"
                    loop={false}
                    playsInline
                    muted={isMuted[short.id]}
                    onClick={() => {
                      if (isMuted[short.id] && index === currentIndex) {
                        handleUnmute(short.id, index);
                      } else {
                        togglePlayPause(short.id, index);
                      }
                    }}
                    onEnded={() => handleVideoEnded(index)}
                    onError={() => {
                      if (isMounted.current) setPlaybackError("Failed to load video.");
                    }}
                  >
                    <source src={short.content.video} type="video/mp4" />
                  </video>
                  
                  {/* Unmute overlay - only show for current, muted video */}
                  {isMuted[short.id] && index === currentIndex && !playbackError && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
                      onClick={() => handleUnmute(short.id, index)}
                    >
                      <div className="text-white text-center p-4 bg-black/70 rounded-lg backdrop-blur-sm">
                        <p className="text-lg font-semibold">Tap to unmute</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Error overlay */}
                  {playbackError && index === currentIndex && (
                    <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center p-2 rounded-t-2xl">
                      {playbackError}
                    </div>
                  )}
                  {/* Username and Description Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 text-white p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-2xl">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white cursor-pointer">
                        <img
                          src={short.user.avatar || "/placeholder.svg"}
                          alt={short.user.name}
                          className="h-full w-full object-cover rounded-full"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          draggable={false}
                        />
                      </div>
                      {/* Clickable channel name */}
                      <h3
                        className="font-semibold text-base drop-shadow cursor-pointer hover:underline"
                        onClick={() => navigate(`/channel/${encodeURIComponent(short.user.name)}`)}
                      >
                        @{short.user.name}
                      </h3>
                    </div>
                    <p className="text-base font-medium drop-shadow line-clamp-3">
                      {short.content.description}
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white bg-gray-900 rounded-2xl">
                  Video source not available
                </div>
              )}
            </div>
            {/* Right-side actions - now to the right of the video */}
            <div className="flex flex-col items-center space-y-4 h-[90vh] justify-center ml-2">
              <Button size="sm" className="h-8 bg-red-600 text-white text-sm font-semibold rounded-full px-4">
                Subscribe
              </Button>
              <button onClick={() => toggleLike(short.id)} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Heart className={`h-6 w-6 ${liked[short.id] ? "text-red-500 fill-red-500" : "text-gray-600"}`} />
                </div>
                <span className="text-black text-xs font-semibold mt-1">{short.content.likes}</span>
              </button>
              <button onClick={() => toggleDislike(short.id)} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <ThumbsDown className={`h-6 w-6 ${disliked[short.id] ? "text-blue-500 fill-blue-500" : "text-gray-600"}`} />
                </div>
                <span className="text-black text-xs font-semibold mt-1">Dislike</span>
              </button>
              <button className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-black text-xs font-semibold mt-1">{short.content.comments}</span>
              </button>
              <button className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-black text-xs font-semibold mt-1">{short.content.shares}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TipShorts;