import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, ThumbsDown, Maximize2, Minimize2, VolumeX, Volume2, Play, Pause } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "../contexts/SidebarContext";
import ShareModal from "@/components/ShareModal";
import { useAuthModal } from "../contexts/AuthModalContext";
import { useShortsInfinite } from "../hooks/api";


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
  const { openLoginModal } = useAuthModal();
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const { id: shortIdParam } = useParams(); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
   const [watchedCount, setWatchedCount] = useState(0);
  const rewardedShorts = useRef(new Set<number>());
  const [showRewardPopupCount, setShowRewardPopupCount] = useState(false);
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [isGlobalMuted, setIsGlobalMuted] = useState(() => {
    const stored = localStorage.getItem('shortsGlobalMuted');
    return stored ? JSON.parse(stored) : false;
  });

   const [shareOpen, setShareOpen] = useState(false);
   const handleVideoPlay = (short) => {
    if (!rewardedShorts.current.has(short.id)) {
      rewardedShorts.current.add(short.id);
      setWatchedCount((count) => count + 1);
      console.log(`Short ${short.id} started playing - count incremented`);
    }
  };
  // Show popup after 5 unique plays
  useEffect(() => {
    if (watchedCount >= 5) {
      setShowRewardPopupCount(true);
      setWatchedCount(0); // reset count for next rewards

      // Hide popup automatically after 3 seconds
      const timer = setTimeout(() => {
        setShowRewardPopupCount(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [watchedCount]);
const [selectedShort, setSelectedShort] = useState<{ id: number } | null>(null);

  // React Query hook for shorts data
  const {
    data: shortsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError
  } = useShortsInfinite({
    user_id: localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : undefined,
    shortId: shortIdParam
  });

  // Transform React Query data to shorts format
  const transformedShorts = React.useMemo(() => {
    if (!shortsData?.pages) return [];

    return shortsData.pages.flatMap(page => {
      const rawShorts = Array.isArray(page.data) ? page.data : [];
      return rawShorts
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
    });
  }, [shortsData]);



   const [showRewardPopup, setShowRewardPopup] = useState(false);
   const handleVideoComplete = (short) => {
  // only reward when opened via deep link
  if (shortIdParam) {
    // You can also add an API call here to credit Rs.1 if logged in
    console.log(`User watched short ${short.id} fully - credit Rs.1`);
    setShowRewardPopup(true);
  }
};

const handleShare = (short) => {
  setSelectedShort(short);
  setShareOpen(true);
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

  // Infinite scroll loader observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (loaderObserverRef.current) loaderObserverRef.current.disconnect();
    loaderObserverRef.current = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: shortsListRef.current, threshold: 0.8 }
    );
    if (loaderRef.current) loaderObserverRef.current.observe(loaderRef.current);
    return () => loaderObserverRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      const nextShort = transformedShorts[idx + i];
      if (nextShort) {
        const video = videoRefs.current.get(nextShort.id);
        if (video && video.preload !== "auto") {
          console.log(`Preloading video ${nextShort.id}`);
          video.preload = "auto";
          video.load(); // Request to load the video
        }
      }
    }
  }, [transformedShorts]);

  // --- Video Play/Pause/Scroll Snap Observer ---
  useEffect(() => {
    if (!transformedShorts.length || !shortsListRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = Number(entry.target.getAttribute("data-video-id"));
          const idx = transformedShorts.findIndex(s => s.id === videoId);
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
    transformedShorts.forEach(short => {
      const video = videoRefs.current.get(short.id);
      if (video) observerRef.current!.observe(video);
    });
    return () => observerRef.current?.disconnect();
  }, [transformedShorts, isGlobalMuted, isGlobalPlaying, preloadNext]);

  // --- Fullscreen Toggle ---
  const toggleFullscreen = () => {
    const element = shortsListRef.current;
    if (!element || !transformedShorts[currentIndex]) return;
    if (!document.fullscreenElement) {
      // Entering fullscreen: always scroll to currentIndex
      const currentShortElement = shortContainerRefs.current.get(transformedShorts[currentIndex].id);
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
      if (!document.fullscreenElement && shortsListRef.current && transformedShorts.length > 0) {
        const currentShortElement = shortContainerRefs.current.get(transformedShorts[currentIndex]?.id);
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
  }, [transformedShorts, currentIndex]);

  // --- Like/Dislike Toggles ---
  const toggleLike = (id: number) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  // --- Play/Pause and Mute Controls (Global) ---
  const handlePlayPause = useCallback(() => {
    setIsGlobalPlaying((prev) => {
      const newState = !prev;
      // Pause or play the current video
      const currentId = transformedShorts[currentIndex]?.id;
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
  }, [transformedShorts, currentIndex]);

  const handleMute = useCallback(() => {
    setIsGlobalMuted((prev) => {
      const newState = !prev;
      // Mute or unmute the current video
      const currentId = transformedShorts[currentIndex]?.id;
      const video = videoRefs.current.get(currentId);
      if (video) {
        video.muted = newState;
        setIsMuted((prev) => ({ ...prev, [currentId]: newState }));
      }
      return newState;
    });
  }, [transformedShorts, currentIndex]);

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
        if (currentIndex < transformedShorts.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setTimeout(() => {
            const nextShortElement = shortContainerRefs.current.get(transformedShorts[nextIndex]?.id);
            if (nextShortElement) {
              nextShortElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const nextVideo = videoRefs.current.get(transformedShorts[nextIndex]?.id);
            if (nextVideo) {
              if (isGlobalPlaying) {
                nextVideo.play();
                setIsPlaying(prev => ({ ...prev, [transformedShorts[nextIndex].id]: true }));
              } else {
                nextVideo.pause();
                setIsPlaying(prev => ({ ...prev, [transformedShorts[nextIndex].id]: false }));
              }
              nextVideo.muted = isGlobalMuted;
              setIsMuted(prev => ({ ...prev, [transformedShorts[nextIndex].id]: isGlobalMuted }));
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
            const prevShortElement = shortContainerRefs.current.get(transformedShorts[prevIndex]?.id);
            if (prevShortElement) {
              prevShortElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const prevVideo = videoRefs.current.get(transformedShorts[prevIndex]?.id);
            if (prevVideo) {
              if (isGlobalPlaying) {
                prevVideo.play();
                setIsPlaying(prev => ({ ...prev, [transformedShorts[prevIndex].id]: true }));
              } else {
                prevVideo.pause();
                setIsPlaying(prev => ({ ...prev, [transformedShorts[prevIndex].id]: false }));
              }
              prevVideo.muted = isGlobalMuted;
              setIsMuted(prev => ({ ...prev, [transformedShorts[prevIndex].id]: isGlobalMuted }));
            }
          }, 0);
        }
      }
    };
    window.addEventListener('keydown', keyListener);
    return () => window.removeEventListener('keydown', keyListener);
  }, [toggleFullscreen, transformedShorts, currentIndex, handleMute, handlePlayPause, isGlobalMuted, isGlobalPlaying]);

  // --- Update localStorage when global mute/play changes ---
  useEffect(() => {
    localStorage.setItem('shortsGlobalMuted', JSON.stringify(isGlobalMuted));
  }, [isGlobalMuted]);
  useEffect(() => {
    localStorage.setItem('shortsGlobalPlaying', JSON.stringify(isGlobalPlaying));
  }, [isGlobalPlaying]);

  // --- Render Logic ---
  if (isLoading && shorts.length === 0) return <div className="flex items-center justify-center h-screen bg-card text-foreground">Loading...</div>;
  if (queryError) return <div className="flex items-center justify-center h-screen bg-card text-red-500">{queryError.message || 'Error loading shorts'}</div>;

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
          "relative flex flex-col items-center bg-card overflow-hidden",
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
            !isMobile && "bg-card"
          )}
          style={{
            overflowX: 'hidden',
            boxSizing: 'border-box',
            width: '100vw',
            maxWidth: '100vw',
          }}
        >
          {transformedShorts.map((short, idx) => (
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
                  playsInline
                  muted={isMuted[short.id] ?? true}
                  poster={short.content.thumbnail}
                  tabIndex={-1}
                  controls={false}
                  onEnded={() => handleVideoComplete(short)}
                            onPlay={() => handleVideoPlay(short)} // Track play here
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
onClick={() => {
  setSelectedShort(short); // 'short' exists here in the map() loop
  setShareOpen(true);
}}

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
          {hasNextPage && (
            <div ref={loaderRef} className="flex items-center justify-center w-full h-32 text-muted-foreground text-lg animate-pulse">
              {isFetchingNextPage ? 'Loading more shorts...' : 'Load more shorts'}
            </div>
          )}
        </div>
          {/* Reward popup */}
      {showRewardPopupCount && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white rounded-md px-6 py-3 shadow-lg z-50">
          🎉 Congratulations! You earned ₹1 for playing 5 reels
        </div>
      )}

{selectedShort && (
  <ShareModal
    shareUrl={`${window.location.origin}/short/${selectedShort.id}`}
    open={shareOpen}
    onClose={() => setShareOpen(false)}
  />
)}
{showRewardPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-card rounded-lg p-6 max-w-sm w-full text-center">
      <h2 className="text-xl font-bold mb-3">🎉 Congratulations!</h2>
      <p className="mb-2">You earned ₹1 for watching this video</p>
      <p className="mb-4 text-muted-foreground">Credit added to your wallet</p>
      <button
        onClick={openLoginModal}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2 w-full"
      >
        Login Now
      </button>
      <button
        onClick={() => window.location.href = "https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app&hl=en_IN"} // your app store link
        className="border border-blue-500 text-blue-500 px-4 py-2 rounded w-full"
      >
        Download AdTip App
      </button>
    </div>
  </div>
)}


      </div>
    </>
  );
};

export default TipShorts;
