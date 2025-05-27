import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, ThumbsDown, Maximize2, Minimize2, VolumeX, Volume2, Play, Pause } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const PRELOAD_COUNT = 2;
const SHORT_ASPECT_RATIO = 9 / 16; // Standard phone portrait aspect ratio
const MAX_SHORT_WIDTH = 420; // px, typical phone width for shorts
const NAVBAR_HEIGHT = 72; // px, assumed navbar height for non-fullscreen state

const TipShorts = () => {
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null); // Main wrapper for the entire shorts section
  const shortsListRef = useRef<HTMLDivElement>(null); // The scrollable list of shorts
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const shortContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map()); // Ref to individual short wrappers
  const observer = useRef<IntersectionObserver | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;

  // --- Fetch shorts ---
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem("UserLoggedIn")) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const userId = localStorage.getItem("userId") || "50816";
        const apiUrl = `${BASE_URL}/getshots/${userId}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Failed to load tip shorts: ${res.status}`);
        const data: ApiResponse<unknown[]> = await res.json();
        const rawShorts = Array.isArray(data.data) ? data.data : [];
        const normalized: TipShort[] = rawShorts
          .map((short): TipShort | null => {
            const s = short as any;
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
        if (normalized.length === 0) throw new Error("No valid shorts found.");
        setShorts(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, BASE_URL, navigate]);

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

  // --- IntersectionObserver for video play/pause ---
  useEffect(() => {
    if (!shorts.length || !shortsListRef.current) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = Number(entry.target.getAttribute("data-video-id"));
          const shortIndex = shorts.findIndex((s) => s.id === videoId);

          // Check if the short is fully in view (or mostly in view from the top)
          // For 'snap-start', a threshold close to 1 is good to ensure it's the primary visible item.
          if (entry.isIntersecting && entry.intersectionRatio >= 0.95) { // Increased threshold for 'snap-start'
            setCurrentIndex(shortIndex);
            playVideo(videoId);
            preloadNext(shortIndex);
          } else {
            pauseVideo(videoId);
          }
        });
      },
      { root: shortsListRef.current, threshold: 0.95 } // Observe relative to the scrollable list, higher threshold
    );

    // Initial observation for all shorts
    shorts.forEach((short) => {
      const video = videoRefs.current.get(short.id);
      if (video) {
        observer.current!.observe(video);
      }
    });

    // Handle initial play for the first short after components mount
    const initialPlayCheck = () => {
      if (shorts[0] && videoRefs.current.get(shorts[0].id) && shortsListRef.current) {
        const firstShortElement = shortContainerRefs.current.get(shorts[0].id); // Use shortContainerRefs
        if (firstShortElement) {
          const rect = firstShortElement.getBoundingClientRect();
          const listRect = shortsListRef.current.getBoundingClientRect();

          // Check if the first short is at the top of the scrollable container
          if (Math.abs(rect.top - listRect.top) < 5) { // Allowing a small tolerance for floating point
             playVideo(shorts[0].id);
             preloadNext(0);
          }
        }
      }
    };
    const timeoutId = setTimeout(initialPlayCheck, 200);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [shorts, playVideo, pauseVideo, preloadNext]);


  // --- Fullscreen Toggle ---
  const toggleFullscreen = () => {
    const element = shortsListRef.current; // Target the scrollable list for fullscreen
    if (!element) return;

    if (!document.fullscreenElement) {
      // Only scroll if the current short is not already at the top
      const currentShortElement = shortContainerRefs.current.get(shorts[currentIndex]?.id);
      if (currentShortElement && element) {
        const rect = currentShortElement.getBoundingClientRect();
        const listRect = element.getBoundingClientRect();
        if (Math.abs(rect.top - listRect.top) > 5) {
          currentShortElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
      if (element.requestFullscreen) element.requestFullscreen();
      else if ((element as any).webkitRequestFullscreen) (element as any).webkitRequestFullscreen();
      else if ((element as any).msRequestFullscreen) (element as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("msfullscreenchange", handler);

    // Keyboard shortcuts
    const keyListener = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
      if ((e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        const currentId = shorts[currentIndex]?.id;
        const video = videoRefs.current.get(currentId);
        if (video) {
          video.muted = !video.muted;
          setIsMuted((prev) => ({ ...prev, [currentId]: video.muted }));
        }
      }
      if ((e.key === ' ' || e.code === 'Space')) {
        // Spacebar toggles play/pause
        e.preventDefault();
        const currentId = shorts[currentIndex]?.id;
        const video = videoRefs.current.get(currentId);
        if (video) {
          if (video.paused) {
            video.play();
            setIsPlaying((prev) => ({ ...prev, [currentId]: true }));
          } else {
            video.pause();
            setIsPlaying((prev) => ({ ...prev, [currentId]: false }));
          }
        }
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
              nextVideo.play();
              setIsPlaying((prev) => ({ ...prev, [shorts[nextIndex].id]: true }));
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
              prevVideo.play();
              setIsPlaying((prev) => ({ ...prev, [shorts[prevIndex].id]: true }));
            }
          }, 0);
        }
      }
    };
    window.addEventListener('keydown', keyListener);

    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("msfullscreenchange", handler);
      window.removeEventListener('keydown', keyListener);
    };
  }, [toggleFullscreen, shorts, currentIndex, isFullscreen]);

  // --- Like/Dislike Toggles ---
  const toggleLike = (id: number) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  // --- Render Logic ---
  if (loading) return <div className="flex items-center justify-center h-screen bg-white text-gray-800">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-white text-red-500">{error}</div>;

  return (
    <>
      {/* Prevent vertical scroll on the entire page */}
      <style>{`
        html, body {
          height: 100dvh !important;
          overflow: hidden !important;
          background-color: white; /* Ensure body also has white background */
        }
      `}</style>
      {/* Outer container starts just below navbar */}
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col items-center bg-white overflow-hidden",
          isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
        )}
        style={{
          position: isFullscreen ? undefined : 'fixed',
          top: isFullscreen ? undefined : NAVBAR_HEIGHT,
          left: isFullscreen ? undefined : 'var(--sidebar-width, 72px)', // adjust if your sidebar is a different width
          right: 0,
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100dvh' : `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
          maxHeight: isFullscreen ? '100dvh' : `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
          overflow: 'hidden',
          backgroundColor: isFullscreen ? 'black' : 'white',
          zIndex: isFullscreen ? 50 : undefined,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Shorts List fills the container and scrolls inside */}
        <div
          ref={shortsListRef}
          className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{
            // Removed paddingTop and paddingBottom to ensure exact top snapping
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {shorts.map((short, idx) => (
            <div
              key={short.id}
              ref={el => el && shortContainerRefs.current.set(short.id, el)} // Store ref for individual short container
              className={cn(
                "snap-start flex-shrink-0 flex items-center justify-center w-full relative", // Changed to snap-start
                idx === currentIndex ? "z-20" : "z-10"
              )}
              style={{
                height: '100%', // Each short should take 100% height of the scrollable container
                maxHeight: '100%',
                maxWidth: isFullscreen ? `calc(100dvh * ${SHORT_ASPECT_RATIO})` : `${MAX_SHORT_WIDTH}px`,
                margin: 'auto', // Still center horizontally
                position: "relative",
                scrollSnapAlign: 'start', // Ensure snapping to the top
                scrollSnapStop: 'always',
                background: 'transparent',
              }}
            >
              {/* Video Box (the actual short content area) */}
              <div
                className="relative flex flex-col items-center justify-center w-full h-full bg-[#121212] overflow-hidden rounded-lg"
                style={{
                    aspectRatio: SHORT_ASPECT_RATIO,
                    maxHeight: '100%',
                    maxWidth: '100%',
                    margin: '0 auto',
                    border: '1px solid rgba(255,255,255,0.1)',
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
                  poster={short.user.avatar}
                  tabIndex={-1}
                >
                  <source src={short.content.video} type="video/mp4" />
                </video>

                {/* Video controls overlay (Play/Pause, Mute, Fullscreen) */}
                {idx === currentIndex && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                       style={{
                         maxWidth: isFullscreen ? `calc(100dvh * ${SHORT_ASPECT_RATIO})` : '100%',
                         maxHeight: '100%',
                         margin: 'auto',
                         left: '0', right: '0',
                       }}
                  >
                    {/* Play/Pause Overlay Icon */}
                    {!isPlaying[short.id] && (
                        <div className="absolute flex items-center justify-center w-full h-full bg-black/30 pointer-events-auto"
                            onClick={() => {
                                const video = videoRefs.current.get(short.id);
                                if (video) {
                                    video.play();
                                    setIsPlaying((prev) => ({ ...prev, [short.id]: true }));
                                }
                            }}>
                            <Play className="w-16 h-16 text-white opacity-80" />
                        </div>
                    )}
                     {isPlaying[short.id] && (
                        <div className="absolute flex items-center justify-center w-full h-full bg-transparent pointer-events-auto"
                            onClick={() => {
                                const video = videoRefs.current.get(short.id);
                                if (video) {
                                    video.pause();
                                    setIsPlaying((prev) => ({ ...prev, [short.id]: false }));
                                }
                            }}>
                        </div>
                    )}

                    {/* Mute/unmute button (Top Right) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = videoRefs.current.get(short.id);
                        if (video) {
                          video.muted = !video.muted;
                          setIsMuted((prev) => ({ ...prev, [short.id]: video.muted }));
                        }
                      }}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white pointer-events-auto"
                      aria-label={isMuted[short.id] ? "Unmute" : "Mute"}
                    >
                      {isMuted[short.id] ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </button>

                    {/* Fullscreen button (Bottom Right) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="absolute bottom-20 right-4 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white pointer-events-auto"
                      aria-label="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </button>
                  </div>
                )}

                {/* Overlay UI (User Info, Description, Actions) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-16 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col gap-2 pointer-events-none"
                     style={{
                       maxWidth: isFullscreen ? `calc(100dvh * ${SHORT_ASPECT_RATIO})` : '100%',
                       margin: 'auto',
                       left: '0', right: '0',
                     }}
                >
                  {/* Content for info and description */}
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

                {/* Floating Action Bar (Right Side - outside info overlay but within short boundary) */}
                <div className="absolute bottom-1/4 flex flex-col items-center gap-4 pointer-events-auto"
                     style={{
                       right: isFullscreen ? `calc(50% - (100dvh * ${SHORT_ASPECT_RATIO} / 2) + 16px)` : '16px',
                       transform: isFullscreen ? 'translateX(50%)' : 'none',
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
                  <button className="flex flex-col items-center">
                    <Share2 className="w-8 h-8 text-white" />
                    <span className="text-white text-xs mt-1">{short.content.shares}</span>
                  </button>
                  {/* More options button (three dots) */}
                  <button className="flex flex-col items-center mt-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold leading-none">...</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TipShorts;