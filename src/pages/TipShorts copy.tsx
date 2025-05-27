import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, ThumbsDown, Maximize2 } from "lucide-react";
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
const MAX_WIDTH = 420; // px, for shorts aspect ratio
const MAX_HEIGHT = 750; // px, for shorts aspect ratio

const TipShorts = () => {
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [disliked, setDisliked] = useState<{ [key: number]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const observer = useRef<IntersectionObserver | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/api`;

  // Fetch shorts
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

  // IntersectionObserver for video play/pause
  useEffect(() => {
    if (!shorts.length) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = Number(entry.target.getAttribute("data-video-id"));
          if (entry.isIntersecting) {
            setCurrentIndex(shorts.findIndex((s) => s.id === videoId));
            playVideo(videoId);
            preloadNext(currentIndex);
          } else {
            pauseVideo(videoId);
          }
        });
      },
      { threshold: 0.85 }
    );
    shorts.forEach((short) => {
      const video = videoRefs.current.get(short.id);
      if (video) observer.current!.observe(video);
    });
    return () => observer.current?.disconnect();
    // eslint-disable-next-line
  }, [shorts, currentIndex]);

  // Play/pause helpers
  const playVideo = (id: number) => {
    videoRefs.current.forEach((video, vid) => {
      if (vid !== id) {
        video.pause();
        video.muted = true;
        setIsPlaying((prev) => ({ ...prev, [vid]: false }));
        setIsMuted((prev) => ({ ...prev, [vid]: true }));
      }
    });
    const video = videoRefs.current.get(id);
    if (video) {
      video.muted = false;
      setIsMuted((prev) => ({ ...prev, [id]: false }));
      video.play().then(() => setIsPlaying((prev) => ({ ...prev, [id]: true }))).catch(() => {
        video.muted = true;
        setIsMuted((prev) => ({ ...prev, [id]: true }));
      });
    }
  };
  const pauseVideo = (id: number) => {
    const video = videoRefs.current.get(id);
    if (video) {
      video.pause();
      video.muted = true;
      setIsPlaying((prev) => ({ ...prev, [id]: false }));
      setIsMuted((prev) => ({ ...prev, [id]: true }));
    }
  };
  const preloadNext = (idx: number) => {
    for (let i = 1; i <= PRELOAD_COUNT; i++) {
      const next = shorts[idx + i];
      if (next) {
        const video = videoRefs.current.get(next.id);
        if (video) {
          video.preload = "auto";
          video.load();
        }
      }
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!isFullscreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Like/dislike
  const toggleLike = (id: number) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleDislike = (id: number) => setDisliked((prev) => ({ ...prev, [id]: !prev[id] }));

  // Navigation
  const goTo = (dir: "next" | "prev") => {
    let newIdx = currentIndex;
    if (dir === "next" && currentIndex < shorts.length - 1) newIdx++;
    if (dir === "prev" && currentIndex > 0) newIdx--;
    setCurrentIndex(newIdx);
    const video = videoRefs.current.get(shorts[newIdx]?.id);
    if (video) video.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-black text-red-500">{error}</div>;

  return (
    <>
      {/* Prevent vertical scroll on the entire page */}
      <style>{`
        html, body {
          height: 100dvh !important;
          overflow: hidden !important;
        }
      `}</style>
      {/* Outer container starts just below navbar */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full flex flex-col items-center bg-white overflow-hidden",
          isFullscreen ? "fixed inset-0 z-50" : ""
        )}
        style={{
          height: 'calc(100dvh - 72px)', // 72px = navbar height
          maxHeight: 'calc(100dvh - 72px)',
          overflow: 'hidden',
        }}
      >
        {/* Shorts List fills the container and scrolls inside */}
        <div
          className="w-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{
            height: '100%',
            maxHeight: '100%',
            padding: '0 0 env(safe-area-inset-bottom,16px) 0', // remove top padding
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {shorts.map((short, idx) => (
            <div
              key={short.id}
              className={cn(
                "snap-start flex items-center justify-center w-full",
                idx === currentIndex ? "z-20" : "z-10"
              )}
              style={{
                height: '92dvh',
                maxHeight: '92dvh',
                width: '100vw',
                margin: 0,
                position: "relative",
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: 'transparent',
              }}
            >
              {/* Video Box - make the whole box clickable to pause/play */}
              <div
                className="relative flex flex-col items-center justify-center w-full h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
                style={{height: '100%', maxHeight: 650, maxWidth: 370, margin: '0 auto'}}
                onClick={() => {
                  const video = videoRefs.current.get(short.id);
                  if (video) {
                    if (video.paused) {
                      video.play();
                      setIsPlaying((prev) => ({ ...prev, [short.id]: true }));
                    } else {
                      video.pause();
                      setIsPlaying((prev) => ({ ...prev, [short.id]: false }));
                    }
                  }
                }}
              >
                <video
                  ref={el => el && videoRefs.current.set(short.id, el)}
                  className="rounded-2xl w-full h-full object-contain bg-black"
                  style={{ aspectRatio: "9/16", maxHeight: '100%', maxWidth: 370, background: "#000" }}
                  data-video-id={short.id}
                  loop
                  playsInline
                  muted={isMuted[short.id]}
                  poster={short.user.avatar}
                  tabIndex={-1}
                >
                  <source src={short.content.video} type="video/mp4" />
                </video>
                {/* Overlay UI */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={short.user.avatar} alt={short.user.name} className="w-10 h-10 rounded-full border-2 border-white" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-base">@{short.user.name}</span>
                      <span className="text-xs text-gray-200">{short.musicName}</span>
                    </div>
                    <Button size="sm" className="ml-2 bg-white text-black hover:bg-white/90">Follow</Button>
                  </div>
                  <div className="text-white text-sm mb-2 line-clamp-2">{short.content.description}</div>
                  {/* Floating Action Bar */}
                  <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 pointer-events-auto">
                    <button onClick={() => toggleLike(short.id)} className="flex flex-col items-center group">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80">
                        <Heart className={cn("w-6 h-6", liked[short.id] ? "text-red-500 fill-red-500" : "text-white")} />
                      </div>
                      <span className="text-white text-xs mt-1">{short.content.likes}</span>
                    </button>
                    <button onClick={() => toggleDislike(short.id)} className="flex flex-col items-center group">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80">
                        <ThumbsDown className={cn("w-6 h-6", disliked[short.id] ? "text-blue-500 fill-blue-500" : "text-white")} />
                      </div>
                    </button>
                    <button className="flex flex-col items-center group">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white text-xs mt-1">{short.content.comments}</span>
                    </button>
                    <button className="flex flex-col items-center group">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80">
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white text-xs mt-1">{short.content.shares}</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Navigation, fullscreen, and mute controls beside the short */}
              <div
                className="fixed flex flex-col items-center gap-4"
                style={{
                  right: 0,
                  left: 'auto',
                  top: '58%', // move further down for better vertical centering
                  transform: 'translateY(-50%)',
                  zIndex: 50,
                  width: 60,
                  pointerEvents: 'auto',
                  paddingRight: 8,
                }}
              >
                {idx === currentIndex && (
                  <>
                    {idx > 0 && (
                      <button
                        onClick={() => goTo("prev")}
                        className="bg-black text-white border-2 border-white p-2 rounded-full shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        aria-label="Previous"
                      >
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 15l4-4 4 4"/></svg>
                      </button>
                    )}
                    {idx < shorts.length - 1 && (
                      <button
                        onClick={() => goTo("next")}
                        className="bg-black text-white border-2 border-white p-2 rounded-full shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        aria-label="Next"
                      >
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 9l-4 4-4-4"/></svg>
                      </button>
                    )}
                    {/* Mute/unmute button */}
                    <button
                      onClick={() => setIsMuted((prev) => ({ ...prev, [short.id]: !prev[short.id] }))}
                      className="bg-black text-white border-2 border-white p-2 rounded-full shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                      aria-label={isMuted[short.id] ? "Unmute" : "Mute"}
                    >
                      {isMuted[short.id] ? (
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 9v6h4l5 5V4l-5 5H9z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/></svg>
                      ) : (
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 9v6h4l5 5V4l-5 5H9z"/></svg>
                      )}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="mt-8 bg-black text-white border-2 border-white p-2 rounded-full shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                      aria-label="Fullscreen"
                      style={{ marginTop: 32 }}
                    >
                      <Maximize2 className="w-7 h-7" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TipShorts;