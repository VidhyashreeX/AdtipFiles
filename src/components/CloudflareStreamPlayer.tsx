// Cloudflare Stream Player Component for Web
// Provides adaptive streaming with fallback support
// Based on React Native mobile app implementation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle, Video } from 'lucide-react';

interface CloudflareStreamPlayerProps {
  streamVideoId?: string;
  streamStatus?: 'uploading' | 'ready' | 'error' | 'inprogress';
  fallbackVideoUrl?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  paused?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: any) => void;
  onEnd?: () => void;
  style?: React.CSSProperties;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  useStreamPlayer?: boolean;
  isShort?: boolean;
  className?: string;
}

const CloudflareStreamPlayer: React.FC<CloudflareStreamPlayerProps> = ({
  streamVideoId,
  streamStatus,
  fallbackVideoUrl,
  width = 320,
  height = 200,
  autoplay = true,
  muted = true,
  controls = true,
  paused = false,
  onLoad,
  onError,
  onProgress,
  onEnd,
  style,
  resizeMode = 'contain',
  useStreamPlayer = true,
  isShort = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate if Stream playback is possible
  const isStreamReady = streamVideoId && streamStatus === 'ready';
  const shouldUseStream = useStreamPlayer && isStreamReady;

  // Determine optimal resize mode for shorts
  const effectiveResizeMode = isShort ? 'cover' : resizeMode;

  // Generate Stream Player URL with validation
  const getStreamPlayerUrl = useCallback(() => {
    if (!isStreamReady) {
      console.warn('[CloudflareStreamPlayer] Cannot generate Stream URL - invalid stream data:', {
        streamVideoId,
        streamStatus,
        isStreamReady
      });
      return null;
    }

    // For web, we'll use the HLS manifest URL directly
    const customerCode = 'your-customer-code'; // This should come from config
    return `https://customer-${customerCode}.cloudflarestream.com/${streamVideoId}/manifest/video.m3u8`;
  }, [isStreamReady, streamVideoId, streamStatus]);

  // Handle video errors
  const handleVideoError = useCallback((error: any) => {
    const video = error.target as HTMLVideoElement;
    console.error('[CloudflareStreamPlayer] Video playback error:', {
      error,
      videoSrc: video.src,
      videoError: video.error,
      networkState: video.networkState,
      readyState: video.readyState,
      errorCode: video.error?.code,
      errorMessage: video.error?.message
    });
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  }, [onError]);

  // Handle video load
  const handleVideoLoad = useCallback(() => {
    console.log('[CloudflareStreamPlayer] Video loaded successfully');
    setIsLoading(false);
    setHasError(false);
    setIsPlaying(!paused);
    onLoad?.();
  }, [paused, onLoad]);

  // Handle video progress
  const handleVideoProgress = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.duration) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      onProgress?.({
        currentTime: video.currentTime,
        duration: video.duration,
        progress: (video.currentTime / video.duration) * 100
      });
    }
  }, [onProgress]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    console.log('[CloudflareStreamPlayer] Video playback ended');
    setIsPlaying(false);
    if (!isShort) {
      onEnd?.();
    }
  }, [isShort, onEnd]);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(handleVideoError);
      setIsPlaying(true);
    }
  }, [isPlaying, handleVideoError]);

  // Handle mute/unmute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle mouse events for controls
  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  // Handle click to play/pause
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  }, [togglePlayPause]);

  // Determine video source with proper validation
  const getVideoSource = useCallback(async () => {
    // Only use Stream HLS if we have a valid, ready stream
    if (shouldUseStream) {
      const hlsUrl = getStreamPlayerUrl();
      if (hlsUrl) {
        return hlsUrl;
      }
    }

    // Fall back to direct video URL
    if (fallbackVideoUrl) {
      // Validate URL format
      try {
        new URL(fallbackVideoUrl);
        console.log('🎬 Using video URL:', fallbackVideoUrl);
        
        // Test if the video URL is accessible
        try {
          const response = await fetch(fallbackVideoUrl, { 
            method: 'HEAD',
            mode: 'no-cors' // This will work even with CORS issues
          });
          console.log('🎬 Video URL accessibility test:', response.type);
        } catch (error) {
          console.warn('🎬 Video URL may not be accessible:', error);
        }
        
        return fallbackVideoUrl;
      } catch (error) {
        console.error('❌ Invalid video URL:', fallbackVideoUrl);
        return null;
      }
    }

    return null;
  }, [shouldUseStream, getStreamPlayerUrl, fallbackVideoUrl, streamVideoId, streamStatus]);

  // Update video source when props change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadVideoSource = async () => {
      try {
        const newSource = await getVideoSource();
        if (newSource && video.src !== newSource) {
          // Set video source directly
          video.src = newSource;
          video.load();
          
          // Set up event listeners for video loading
          video.addEventListener('loadeddata', () => {
            setHasError(false);
            setIsLoading(false);
          });
          
          video.addEventListener('error', (error) => {
            console.error('[CloudflareStreamPlayer] Video error:', error);
            setHasError(true);
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('[CloudflareStreamPlayer] Error loading video source:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadVideoSource();
  }, [getVideoSource]);

  // Handle autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || paused) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('[CloudflareStreamPlayer] Autoplay failed:', error);
        // Autoplay failed, user interaction required
      }
    };

    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
      playVideo();
    } else {
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('canplay', playVideo);
    };
  }, [autoplay, paused]);

  // Handle pause prop changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused && !video.paused) {
      video.pause();
      setIsPlaying(false);
    } else if (!paused && video.paused && isPlaying) {
      video.play().catch(handleVideoError);
    }
  }, [paused, isPlaying, handleVideoError]);

  // Load video source on mount and when props change
  useEffect(() => {
    const loadSource = async () => {
      setIsLoadingSource(true);
      try {
        const source = await getVideoSource();
        setVideoSource(source);
      } catch (error) {
        console.error('[CloudflareStreamPlayer] Error loading video source:', error);
        setVideoSource(null);
      } finally {
        setIsLoadingSource(false);
      }
    };

    loadSource();
  }, [getVideoSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Render error state with better fallback
  if (hasError) {
    return (
      <div 
        className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-white text-sm mb-2 font-medium">Video unavailable</p>
          <p className="text-gray-400 text-xs mb-4 max-w-xs">
            Video cannot be played. The video file may not exist or is not accessible.
          </p>
          
          {/* Show video URL for debugging */}
          {fallbackVideoUrl && (
            <div className="mb-4">
              <div className="w-24 h-16 bg-gray-600 rounded mx-auto flex items-center justify-center">
                <Video className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xs mt-2 break-all max-w-xs">
                {fallbackVideoUrl}
              </p>
            </div>
          )}
          
          {/* Retry button */}
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              // Force reload the video
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingSource) {
    return (
      <div 
        className={`relative bg-black rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!videoSource) {
    return (
      <div 
        className={`relative bg-black rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-white mx-auto mb-4" />
          <p className="text-white text-sm">No video source available</p>
        </div>
      </div>
    );
  }

  const objectFit = effectiveResizeMode === 'cover' ? 'cover' : 
                   effectiveResizeMode === 'stretch' ? 'fill' : 'contain';

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      style={{ width, height, ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-xs">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        style={{ objectFit }}
        muted={isMuted}
        playsInline
        preload="none"
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onTimeUpdate={handleVideoProgress}
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
      >
        <source src={videoSource} type="video/mp4" />
        <source src={videoSource} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>

      {/* Custom controls overlay */}
      {controls && (showControls || !isPlaying) && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {controls && showControls && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
          <div className="w-full bg-white bg-opacity-30 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Short badge */}
      {isShort && (
        <div className="absolute top-2 left-2 bg-adtip-teal text-white px-2 py-1 rounded text-xs font-medium">
          Short
        </div>
      )}
    </div>
  );
};

export default CloudflareStreamPlayer;
