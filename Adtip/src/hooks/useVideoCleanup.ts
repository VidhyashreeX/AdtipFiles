import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { VideoLogger } from '../utils/logger';

/**
 * Custom hook for managing video component cleanup and memory management
 * Prevents memory leaks by properly cleaning up video resources
 */
export const useVideoCleanup = () => {
  const videoRefs = useRef<Set<any>>(new Set());
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  /**
   * Register a video ref for cleanup
   */
  const registerVideoRef = useCallback((videoRef: any) => {
    if (videoRef && videoRef.current) {
      videoRefs.current.add(videoRef.current);
    }
  }, []);

  /**
   * Unregister a video ref
   */
  const unregisterVideoRef = useCallback((videoRef: any) => {
    if (videoRef && videoRef.current) {
      videoRefs.current.delete(videoRef.current);
    }
  }, []);

  /**
   * Register a timer for cleanup
   */
  const registerTimer = useCallback((timer: NodeJS.Timeout) => {
    timers.current.add(timer);
  }, []);

  /**
   * Clear a specific timer
   */
  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timers.current.delete(timer);
  }, []);

  /**
   * Pause all registered videos
   */
  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach(videoRef => {
      try {
        if (videoRef && typeof videoRef.seek === 'function') {
          // For react-native-video, we can't directly pause but we can seek to current position
          // The parent component should handle paused state
          VideoLogger.debug('Pausing video ref');
        }
      } catch (error) {
        VideoLogger.warn('Error pausing video:', error);
      }
    });
  }, []);

  /**
   * Stop and cleanup all videos
   */
  const stopAllVideos = useCallback(() => {
    videoRefs.current.forEach(videoRef => {
      try {
        if (videoRef) {
          // Seek to beginning and let parent component handle paused state
          if (typeof videoRef.seek === 'function') {
            videoRef.seek(0);
          }
          console.log('[VideoCleanup] Stopped video ref');
        }
      } catch (error) {
        console.warn('[VideoCleanup] Error stopping video:', error);
      }
    });
  }, []);

  /**
   * Clear all timers
   */
  const clearAllTimers = useCallback(() => {
    timers.current.forEach(timer => {
      clearTimeout(timer);
    });
    timers.current.clear();
  }, []);

  /**
   * Complete cleanup of all resources
   */
  const cleanup = useCallback(() => {
    VideoLogger.debug('Performing complete cleanup');

    // Stop all videos
    stopAllVideos();

    // Clear all timers
    clearAllTimers();

    // Clear refs
    videoRefs.current.clear();

    // Mark as unmounted
    isMountedRef.current = false;
  }, [stopAllVideos, clearAllTimers]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        VideoLogger.debug('App backgrounded - pausing videos');
        pauseAllVideos();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [pauseAllVideos]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    registerVideoRef,
    unregisterVideoRef,
    registerTimer,
    clearTimer,
    pauseAllVideos,
    stopAllVideos,
    clearAllTimers,
    cleanup,
    isMounted: () => isMountedRef.current,
  };
};

/**
 * Hook specifically for single video component cleanup
 */
export const useSingleVideoCleanup = (videoRef: React.RefObject<any>) => {
  const isMountedRef = useRef(true);
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());

  /**
   * Register a timer for cleanup
   */
  const registerTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
  }, []);

  /**
   * Clear a specific timer
   */
  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timersRef.current.delete(timer);
  }, []);

  /**
   * Pause the video
   */
  const pauseVideo = useCallback(() => {
    if (!isMountedRef.current || !videoRef.current) return;

    try {
      // The parent component should handle the paused state
      // This is just for logging and potential future enhancements
      console.log('[SingleVideoCleanup] Pausing video');
    } catch (error) {
      console.warn('[SingleVideoCleanup] Error pausing video:', error);
    }
  }, [videoRef]);

  /**
   * Stop the video
   */
  const stopVideo = useCallback(() => {
    if (!isMountedRef.current || !videoRef.current) return;

    try {
      if (typeof videoRef.current.seek === 'function') {
        videoRef.current.seek(0);
      }
      console.log('[SingleVideoCleanup] Stopped video');
    } catch (error) {
      console.warn('[SingleVideoCleanup] Error stopping video:', error);
    }
  }, [videoRef]);

  /**
   * Complete cleanup
   */
  const cleanup = useCallback(() => {
    VideoLogger.debug('SingleVideoCleanup - Performing cleanup');

    // Stop video
    stopVideo();

    // Clear all timers
    timersRef.current.forEach(timer => {
      clearTimeout(timer);
    });
    timersRef.current.clear();

    // Mark as unmounted
    isMountedRef.current = false;
  }, [stopVideo]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        pauseVideo();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [pauseVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    registerTimer,
    clearTimer,
    pauseVideo,
    stopVideo,
    cleanup,
    isMounted: () => isMountedRef.current,
  };
};

export default useVideoCleanup;
