import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, ThumbsDown, Maximize2, Minimize2, VolumeX, Volume2, Play, Pause } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "../contexts/SidebarContext";

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
    likes: number;
    comments: number;
    shares: number;
    thumbnail: string;
  };
  musicName: string;
}

interface ApiResponse<T> {
  status?: string;
  message?: string;
  data?: T;
}

const PRELOAD_COUNT = 2;
const SHORTS_PAGE_SIZE = 8; // How many shorts to fetch per page
const SHORT_ASPECT_RATIO = 9 / 16; // Standard phone portrait aspect ratio
const MAX_SHORT_WIDTH = 420; // px, typical phone width for shorts
const NAVBAR_HEIGHT = 72; // px, assumed navbar height for non-fullscreen state

const TipShorts = () => {
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const { id: shortIdParam } = useParams(); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [isGlobalMuted, setIsGlobalMuted] = useState(() => {
    const stored = localStorage.getItem('shortsGlobalMuted');
    return stored ? JSON.parse(stored) : false;
  });
   const [showCopied, setShowCopied] = useState(false);

const handleShare = async (short) => {
  const url = `${window.location.origin}/short/${short.id}`;
  try {
    await navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1800); // Hide after 1.8 seconds
  } catch(error) {
    console.error(error);
    // Optionally you can show error toast here
  }
};

  const [isGlobalPlaying, setIsGlobalPlaying] = useState(() => {
    const stored = localStorage.getItem('shortsGlobalPlaying');
    return stored ? JSON.parse(stored) : true;
  });
  const containerRef = useRef<HTMLDivElement>(null); // Main wrapper for the entire shorts section
  const shortsListRef = useRef<HTMLDivElement>(null); // The scrollable list of shorts
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const shortContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map()); // Ref to individual short wrappers
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderObserverRef = useRef<IntersectionObserver | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed, isMobile } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState(256); // default expanded
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;

  useEffect(() => {
    if (isMobile) return setSidebarWidth(0);
    setSidebarWidth(isCollapsed ? 64 : 256);
  }, [isCollapsed, isMobile]);

const fetchShorts = useCallback(
  async (pageNum: number) => {
    setLoading(true);
    setError(null);

    const isPublic = !isAuthenticated && !localStorage.getItem("UserLoggedIn");
    const userId = localStorage.getItem("userId") || "50816";

    try {
      let normalized: TipShort[] = [];

      if (shortIdParam) {
        // Deep link mode — one short only
        const res = await fetch(`${BASE_URL}/getShortById/${userId}/${shortIdParam}`);
        if (!res.ok) throw new Error(`Failed to load short: ${res.status}`);
        const data = await res.json();
        const s = data.data?.[0];
        if (s && s.video_link) {
          normalized = [
            {
              id: s.id,
              user: {
                name: s.channelName || "Unknown",
                avatar: s.channel_profile && s.channel_profile !== "null" ? s.channel_profile : "/placeholder.svg",
                isVerified: false,
              },
              content: {
                video: s.video_link,
                description: s.video_desciption || s.name || "No description",
                likes: Number(s.total_likes || 0),
                comments: Number(s.total_comments || 0),
                shares: 0,
                thumbnail: s.video_Thumbnail || s.channel_profile || "/placeholder.svg",
              },
              musicName: s.name || "Unknown",
            },
          ];
        }
        setHasMore(false); // no pagination for single mode
      } else {
        // Normal paginated feed
        const apiUrl = isPublic
          ? `${BASE_URL}/getpublicshots`
          : `${BASE_URL}/getshots/${userId}`;

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Failed to load tip shorts: ${res.status}`);
        const data = await res.json();
        const rawShorts = Array.isArray(data.data) ? data.data : [];

        normalized = rawShorts
          .map((s: any): TipShort | null => {
            if (!s.video_link) return null;
            return {
              id: s.id,
              user: {
                name: s.channelName || "Unknown",
                avatar: s.channel_profile && s.channel_profile !== "null" ? s.channel_profile : "/placeholder.svg",
                isVerified: false,
              },
              content: {
                video: s.video_link,
                description: s.video_desciption || s.name || "No description",
                likes: Number(s.total_likes || 0),
                comments: Number(s.total_comments || 0),
                shares: 0,
                thumbnail: s.video_Thumbnail || s.channel_profile || "/placeholder.svg",
              },
              musicName: s.name || "Unknown",
            };
          })
          .filter((s): s is TipShort => s !== null);

        // Simulate pagination
        const start = (pageNum - 1) * SHORTS_PAGE_SIZE;
        const end = start + SHORTS_PAGE_SIZE;
        const pageShorts = normalized.slice(start, end);
        normalized = pageNum === 1 ? pageShorts : [...shorts, ...pageShorts];
        setHasMore(pageShorts.length > 0);
      }

      setShorts(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  },
  [isAuthenticated, BASE_URL, shortIdParam]
);


  // --- Initial Fetch & Pagination ---
  useEffect(() => {
    fetchShorts(1);
    setPage(1);
  }, [fetchShorts]);

  // --- Infinite Scroll Loader Observer ---
  useEffect(() => {
    if (!hasMore || loading) return;
    if (loaderObserverRef.current) loaderObserverRef.current.disconnect();
    loaderObserverRef.current = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchShorts(page + 1);
          setPage(p => p + 1);
        }
      },
      { root: shortsListRef.current, threshold: 0.8 }
    );
    if (loaderRef.current) loaderObserverRef.current.observe(loaderRef.current);
    return () => loaderObserverRef.current?.disconnect();
  }, [hasMore, loading, page, fetchShorts]);

  // --- Preemptive Fetch: Fetch next set when user reaches 2nd last short ---
  useEffect(() => {
    if (
      hasMore &&
      !loading &&
      shorts.length > 0 &&
      currentIndex >= shorts.length - 2
    ) {
      fetchShorts(page + 1);
      setPage(p => p + 1);
    }
  }, [currentIndex, shorts.length, hasMore, loading, page, fetchShorts]);

  // --- Video Play/Pause & Preloading Logic ---
  const playVideo = useCallback((id: number) => {
    videoRefs.current.forEach((video, vid) => {
      if (vid !== id) {
        video.pause();
        video.muted = true; // Mute non-active videos
        setIsPlaying((prev) => ({ ...prev, [vid]: false }));
        setIsMuted((prev) => ({ ...prev, [vid]: true }));
      }
    });

    const video = videoRefs.current.get(id);
    if (video) {
      video.muted = false; // Unmute the active video by default
      setIsMuted((prev) => ({ ...prev, [id]: false }));
      video.play()
        .then(() => setIsPlaying((prev) => ({ ...prev, [id]: true })))
        .catch((e) => {
          console.warn(`Autoplay prevented for video ${id}:`, e);
          video.muted = true;
          setIsMuted((prev) => ({ ...prev, [id]: true }));
          setIsPlaying((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, []);

  const pauseVideo = useCallback((id: number) => {
    const video = videoRefs.current.get(id);
    if (video) {
      video.pause();
      video.muted = true; // Mute when paused
      setIsPlaying((prev) => ({ ...prev, [id]: false }));
      setIsMuted((prev) => ({ ...prev, [id]: true }));
    }
  }, []);

  const preloadNext = useCallback((idx: number) => {
    for (let i = 1; i <= PRELOAD_COUNT; i++) {
      const nextShort = shorts[idx + i];
      if (nextShort) {
        const video = videoRefs.current.get(nextShort.id);
        if (video && video.preload !== "auto") {
          console.log(`Preloading video ${nextShort.id}`);
          video.preload = "auto";
          video.load(); // Request to load the video
        }
      }
    }
  }, [shorts]);

  // --- Video Play/Pause/Scroll Snap Observer ---
  useEffect(() => {
    if (!shorts.length || !shortsListRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = Number(entry.target.getAttribute("data-video-id"));
          const idx = shorts.findIndex(s => s.id === videoId);
          const video = videoRefs.current.get(videoId);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.95) {
            setCurrentIndex(idx);
            // Apply global mute state always, but only play if isGlobalPlaying is true
            if (video) {
              video.muted = isGlobalMuted;
              setIsMuted(prev => ({ ...prev, [videoId]: isGlobalMuted }));
              if (isGlobalPlaying) {
                // Only play if not already playing
                if (video.paused) {
                  video.play().then(() => setIsPlaying(prev => ({ ...prev, [videoId]: true })))
                    .catch(() => setIsPlaying(prev => ({ ...prev, [videoId]: false })));
                } else {
                  setIsPlaying(prev => ({ ...prev, [videoId]: true }));
                }
              } else {
                video.pause();
                setIsPlaying(prev => ({ ...prev, [videoId]: false }));
              }
            }
            preloadNext(idx);
          } else {
            if (video) {
              video.pause();
              setIsPlaying(prev => ({ ...prev, [videoId]: false }));
            }
          }
        });
      },
      { root: shortsListRef.current, threshold: 0.95 }
    );
    shorts.forEach(short => {
      const video = videoRefs.current.get(short.id);
      if (video) observerRef.current!.observe(video);
    });
    return () => observerRef.current?.disconnect();
  }, [shorts, isGlobalMuted, isGlobalPlaying, preloadNext]);

  // --- Fullscreen Toggle ---
  const toggleFullscreen = () => {
    const element = shortsListRef.current;
    if (!element || !shorts[currentIndex]) return;
    if (!document.fullscreenElement) {
      // Entering fullscreen: always scroll to currentIndex
      const currentShortElement = shortContainerRefs.current.get(shorts[currentIndex].id);
      if (currentShortElement) {
        currentShortElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        const requestFs = async () => {
          if (element.requestFullscreen) await element.requestFullscreen();
          else if ((element as any).webkitRequestFullscreen) await (element as any).webkitRequestFullscreen();
          else if ((element as any).msRequestFullscreen) await (element as any).msRequestFullscreen();
        };
        requestFs();
      }
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };

  // --- Fullscreen State Listener ---
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // On exiting fullscreen, always scroll to the currentIndex short
      if (!document.fullscreenElement && shortsListRef.current && shorts.length > 0) {
        const currentShortElement = shortContainerRefs.current.get(shorts[currentIndex]?.id);
        if (currentShortElement) {
          requestAnimationFrame(() => {
            currentShortElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          });
        }
      }
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("msfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("msfullscreenchange", handler);
    };
  }, [shorts, currentIndex]);

  // --- Like/Dislike Toggles ---
  const toggleLike = (id: number) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  // --- Play/Pause and Mute Controls (Global) ---
  const handlePlayPause = useCallback(() => {
    setIsGlobalPlaying((prev) => {
      const newState = !prev;
      // Pause or play the current video
      const currentId = shorts[currentIndex]?.id;
      const video = videoRefs.current.get(currentId);
      if (video) {
        if (newState) {
          video.play();
          setIsPlaying((prev) => ({ ...prev, [currentId]: true }));
        } else {
          video.pause();
          setIsPlaying((prev) => ({ ...prev, [currentId]: false }));
        }
      }
      return newState;
    });
  }, [shorts, currentIndex]);

  const handleMute = useCallback(() => {
    setIsGlobalMuted((prev) => {
      const newState = !prev;
      // Mute or unmute the current video
      const currentId = shorts[currentIndex]?.id;
      const video = videoRefs.current.get(currentId);
      if (video) {
        video.muted = newState;
        setIsMuted((prev) => ({ ...prev, [currentId]: newState }));
      }
      return newState;
    });
  }, [shorts, currentIndex]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleMute();
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < shorts.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setTimeout(() => {
            const nextShortElement = shortContainerRefs.current.get(shorts[nextIndex]?.id);
            if (nextShortElement) {
              nextShortElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const nextVideo = videoRefs.current.get(shorts[nextIndex]?.id);
            if (nextVideo) {
              if (isGlobalPlaying) {
                nextVideo.play();
                setIsPlaying(prev => ({ ...prev, [shorts[nextIndex].id]: true }));
              } else {
                nextVideo.pause();
                setIsPlaying(prev => ({ ...prev, [shorts[nextIndex].id]: false }));
              }
              nextVideo.muted = isGlobalMuted;
              setIsMuted(prev => ({ ...prev, [shorts[nextIndex].id]: isGlobalMuted }));
            }
          }, 0);
        }
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setTimeout(() => {
            const prevShortElement = shortContainerRefs.current.get(shorts[prevIndex]?.id);
            if (prevShortElement) {
              prevShortElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const prevVideo = videoRefs.current.get(shorts[prevIndex]?.id);
            if (prevVideo) {
              if (isGlobalPlaying) {
                prevVideo.play();
                setIsPlaying(prev => ({ ...prev, [shorts[prevIndex].id]: true }));
              } else {
                prevVideo.pause();
                setIsPlaying(prev => ({ ...prev, [shorts[prevIndex].id]: false }));
              }
              prevVideo.muted = isGlobalMuted;
              setIsMuted(prev => ({ ...prev, [shorts[prevIndex].id]: isGlobalMuted }));
            }
          }, 0);
        }
      }
    };
    window.addEventListener('keydown', keyListener);
    return () => window.removeEventListener('keydown', keyListener);
  }, [toggleFullscreen, shorts, currentIndex, handleMute, handlePlayPause, isGlobalMuted, isGlobalPlaying]);

  // --- Update localStorage when global mute/play changes ---
  useEffect(() => {
    localStorage.setItem('shortsGlobalMuted', JSON.stringify(isGlobalMuted));
  }, [isGlobalMuted]);
  useEffect(() => {
    localStorage.setItem('shortsGlobalPlaying', JSON.stringify(isGlobalPlaying));
  }, [isGlobalPlaying]);

  // --- Render Logic ---
  if (loading && shorts.length === 0) return <div className="flex items-center justify-center h-screen bg-white text-gray-800">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-white text-red-500">{error}</div>;

  return (
    <>
      {/* Prevent vertical scroll on the entire page */}
      <style>{`
        html, body {
          height: 100dvh !important;
          overflow: hidden !important;
          background-color: white;
        }
      `}</style>
      {/* Outer container starts just below navbar */}
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col items-center bg-white overflow-hidden",
          isFullscreen ? "fixed inset-0 z-50 bg-black" : "",
          "w-full h-full"
        )}
        style={{
          position: isFullscreen ? undefined : 'fixed',
          top: isFullscreen ? undefined : NAVBAR_HEIGHT,
          left: 0,
          right: 0,
          width: isFullscreen ? '100vw' : '100vw',
          height: isFullscreen ? '100dvh' : `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
          maxHeight: isFullscreen ? '100dvh' : `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
          overflow: 'hidden',
          backgroundColor: isFullscreen ? 'black' : 'white',
          zIndex: isFullscreen ? 50 : undefined,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // Desktop only: margin left for sidebar, smooth transition
          ...(isMobile ? {} : {
            marginLeft: `${sidebarWidth}px`,
            transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          })
        }}
      >
        {/* Shorts List fills the container and scrolls inside */}
        <div
          ref={shortsListRef}
          className={cn(
            "w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide",
            !isMobile && "bg-white"
          )}
          style={{
            overflowX: 'hidden',
            boxSizing: 'border-box',
            width: '100vw',
            maxWidth: '100vw',
          }}
        >
          {shorts.map((short, idx) => (
            <div
              key={short.id}
              ref={el => el && shortContainerRefs.current.set(short.id, el)}
              className={cn(
                "snap-start flex-shrink-0 flex items-center justify-center w-full relative",
                idx === currentIndex ? "z-20" : "z-10"
              )}
              style={{
                height: '100%',
                maxHeight: '100%',
                width: '100vw',
                maxWidth: '100vw',
                margin: 'auto',
                position: "relative",
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: 'transparent',
              }}
              onClick={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                handlePlayPause();
              }}
            >
              {/* Video Box (the actual short content area) */}
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center overflow-hidden rounded-lg",
                  !isMobile && "mx-auto",
                  !isMobile && "shadow-xl",
                  !isMobile && "bg-black"
                )}
                style={{
                  aspectRatio: SHORT_ASPECT_RATIO,
                  maxHeight: '100%',
                  maxWidth: !isMobile ? `${MAX_SHORT_WIDTH}px` : '100%',
                  margin: '0 auto',
                  border: !isMobile ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
                  ...(isFullscreen && {
                    width: '100%',
                    height: '100%',
                    borderRadius: '0',
                    border: 'none',
                  })
                }}
              >
                <video
                  ref={el => el && videoRefs.current.set(short.id, el)}
                  className="w-full h-full object-contain"
                  data-video-id={short.id}
                  loop
                  playsInline
                  muted={isMuted[short.id] ?? true}
                  poster={short.content.thumbnail}
                  tabIndex={-1}
                  controls={false}
                  style={{ background: 'black' }}
                >
                  <source src={short.content.video} type="video/mp4" />
                </video>
                {/* Overlay all controls/info on top of video for desktop only */}
                {!isMobile && idx === currentIndex && (
                  <>
                    {/* Play/Pause Button (Top Left) */}
                    <button
                      onClick={handlePlayPause}
                      className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white pointer-events-auto"
                      aria-label={isGlobalPlaying ? "Pause" : "Play"}
                    >
                      {isGlobalPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                    {/* Mute/unmute button (Top Right) */}
                    <button
                      onClick={handleMute}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white pointer-events-auto"
                      aria-label={isGlobalMuted ? "Unmute" : "Mute"}
                    >
                      {isGlobalMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    {/* Fullscreen button (Bottom Right) */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="absolute bottom-20 right-4 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white pointer-events-auto"
                      aria-label="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </button>
                    {/* Overlay UI (User Info, Description, Actions) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-16 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col gap-2 pointer-events-none"
                         style={{
                           maxWidth: !isMobile ? `${MAX_SHORT_WIDTH}px` : '100%',
                           margin: 'auto',
                           left: '0', right: '0',
                         }}
                    >
                      <div className="flex items-center gap-3 mb-2 pointer-events-auto">
                        <img src={short.user.avatar} alt={short.user.name} className="w-10 h-10 rounded-full border-2 border-white" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">@{short.user.name}</span>
                          <span className="text-xs text-gray-300">{short.musicName}</span>
                        </div>
                        <Button size="sm" className="ml-2 bg-red-600 text-white hover:bg-red-700 rounded-md px-3 py-1 text-sm font-medium">Subscribe</Button>
                      </div>
                      <div className="text-white text-sm mb-2 line-clamp-2 pointer-events-auto">{short.content.description}</div>
                    </div>
                    {/* Floating Action Bar (Right Side) */}
                    <div className="absolute bottom-1/4 flex flex-col items-center gap-4 pointer-events-auto"
                         style={{
                           right: '16px',
                           transform: 'none',
                         }}
                    >
                      <button onClick={() => toggleLike(short.id)} className="flex flex-col items-center">
                        <Heart className={cn("w-8 h-8", liked[short.id] ? "text-red-500 fill-red-500" : "text-white")} />
                        <span className="text-white text-xs mt-1">{short.content.likes}</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <MessageSquare className="w-8 h-8 text-white" />
                        <span className="text-white text-xs mt-1">{short.content.comments}</span>
                      </button>
                    <button
  className="flex flex-col items-center"
  onClick={() => handleShare(short)}
>
  <Share2 className="w-8 h-8 text-white" />
  <span className="text-white text-xs mt-1">{short.content.shares}</span>
</button>

                      <button className="flex flex-col items-center mt-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl font-bold leading-none">...</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
                {/* Mobile: fallback to old overlay logic (do not touch) */}
                {isMobile && idx === currentIndex && (
                  <>
                    {/* ...existing mobile overlay logic... */}
                  </>
                )}
              </div>
            </div>
          ))}
          {/* Loader at the end for infinite scroll */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center w-full h-32 text-gray-500 text-lg animate-pulse">
              Loading more shorts...
            </div>
          )}
        </div>
      {showCopied && (
  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 
                  bg-white/10 backdrop-blur-lg border border-white/20 
                  text-white rounded-full shadow-lg flex items-center space-x-2 
                  transition-all animate-fade-in-out z-50">
    <svg
      className="w-5 h-5 text-emerald-300"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <span className="text-sm text-gray-900 dark:text-white">
  Link copied to clipboard!
</span>
  </div>
)}


      </div>
    </>
  );
};

export default TipShorts;