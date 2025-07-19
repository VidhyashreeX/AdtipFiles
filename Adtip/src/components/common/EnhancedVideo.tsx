import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Video, { VideoProperties } from 'react-native-video';
import { useSingleVideoCleanup } from '../../hooks/useVideoCleanup';
import { VideoLogger } from '../../utils/logger';

interface EnhancedVideoProps extends VideoProperties {
  // Additional props for enhanced functionality
  enableAutoCleanup?: boolean;
  pauseOnAppBackground?: boolean;
  onCleanup?: () => void;
  debugTag?: string;
}

interface EnhancedVideoRef {
  seek: (time: number) => void;
  pause: () => void;
  resume: () => void;
  cleanup: () => void;
  getVideoRef: () => React.RefObject<Video>;
}

/**
 * Enhanced Video component with automatic memory leak prevention
 * Wraps react-native-video with proper cleanup and memory management
 */
const EnhancedVideo = forwardRef<EnhancedVideoRef, EnhancedVideoProps>(({
  enableAutoCleanup = true,
  pauseOnAppBackground = true,
  onCleanup,
  debugTag = 'EnhancedVideo',
  paused: externalPaused = false,
  onLoad,
  onProgress,
  onEnd,
  onError,
  onBuffer,
  ...videoProps
}, ref) => {
  const videoRef = useRef<Video>(null);
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(!externalPaused);
  
  // Use cleanup hook
  const {
    registerTimer,
    clearTimer,
    pauseVideo,
    stopVideo,
    cleanup: performCleanup,
    isMounted,
  } = useSingleVideoCleanup(videoRef);

  // Track playing state
  useEffect(() => {
    isPlayingRef.current = !externalPaused;
  }, [externalPaused]);

  // Enhanced onLoad handler
  const handleLoad = useCallback((data: unknown) => {
    if (!isMounted()) return;

    VideoLogger.debug(`Video loaded: ${debugTag}`, data);
    onLoad?.(data);
  }, [onLoad, debugTag, isMounted]);

  // Enhanced onProgress handler
  const handleProgress = useCallback((data: unknown) => {
    if (!isMounted()) return;

    onProgress?.(data);
  }, [onProgress, isMounted]);

  // Enhanced onEnd handler
  const handleEnd = useCallback(() => {
    if (!isMounted()) return;

    VideoLogger.debug(`Video ended: ${debugTag}`);
    onEnd?.();
  }, [onEnd, debugTag, isMounted]);

  // Enhanced onError handler
  const handleError = useCallback((error: unknown) => {
    if (!isMounted()) return;

    VideoLogger.error(`Video error: ${debugTag}`, error);
    onError?.(error);
  }, [onError, debugTag, isMounted]);

  // Enhanced onBuffer handler
  const handleBuffer = useCallback((data: unknown) => {
    if (!isMounted()) return;

    onBuffer?.(data);
  }, [onBuffer, isMounted]);

  // App state handling
  useEffect(() => {
    if (!pauseOnAppBackground) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMounted()) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        VideoLogger.debug(`App backgrounded - pausing video: ${debugTag}`);
        pauseVideo();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [pauseOnAppBackground, pauseVideo, debugTag, isMounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      VideoLogger.debug(`Component unmounting - performing cleanup: ${debugTag}`);

      if (enableAutoCleanup) {
        performCleanup();
        onCleanup?.();
      }

      isMountedRef.current = false;
    };
  }, [enableAutoCleanup, performCleanup, onCleanup, debugTag]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (isMounted() && videoRef.current) {
        videoRef.current.seek(time);
      }
    },
    pause: () => {
      if (isMounted()) {
        pauseVideo();
      }
    },
    resume: () => {
      if (isMounted()) {
        VideoLogger.debug(`Resuming video: ${debugTag}`);
      }
    },
    cleanup: () => {
      performCleanup();
      onCleanup?.();
    },
    getVideoRef: () => videoRef,
  }), [pauseVideo, performCleanup, onCleanup, debugTag, isMounted]);

  // Don't render if component is unmounted
  if (!isMountedRef.current) {
    return null;
  }

  return (
    <Video
      ref={videoRef}
      {...videoProps}
      paused={externalPaused}
      onLoad={handleLoad}
      onProgress={handleProgress}
      onEnd={handleEnd}
      onError={handleError}
      onBuffer={handleBuffer}
      // Memory optimization settings
      bufferConfig={{
        minBufferMs: 1500,
        maxBufferMs: 5000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 1500,
        ...videoProps.bufferConfig,
      }}
      // Prevent background playback to save memory
      playInBackground={false}
      playWhenInactive={false}
      // Disable focus to prevent memory leaks
      disableFocus={true}
      // Hide shutter view to prevent memory issues
      hideShutterView={true}
    />
  );
});

EnhancedVideo.displayName = 'EnhancedVideo';

export default EnhancedVideo;
export type { EnhancedVideoRef, EnhancedVideoProps };
