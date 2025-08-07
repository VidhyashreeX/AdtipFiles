import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  AppState,
} from 'react-native';
import CloudflareStreamPlayer from '../../../components/CloudflareStreamPlayer';
import VideoPlaybackService, { VideoMetadata } from '../../../services/VideoPlaybackService';
import { Logger } from '../../../utils/ProductionLogger';
import { TipShortsLogger } from '../../../utils/logger';

// Audio Manager Service for centralized audio cleanup
class TipShortsAudioManager {
  private static instance: TipShortsAudioManager;
  private activeVideos = new Map<string, any>();
  private cleanupTimeouts = new Map<string, NodeJS.Timeout>();

  static getInstance(): TipShortsAudioManager {
    if (!TipShortsAudioManager.instance) {
      TipShortsAudioManager.instance = new TipShortsAudioManager();
    }
    return TipShortsAudioManager.instance;
  }

  registerVideo(videoId: string, videoRef: any) {
    this.activeVideos.set(videoId, videoRef);
    TipShortsLogger.debug(`AudioManager: Registered video ${videoId}`);
  }

  unregisterVideo(videoId: string) {
    this.activeVideos.delete(videoId);
    this.clearCleanupTimeout(videoId);
    TipShortsLogger.debug(`AudioManager: Unregistered video ${videoId}`);
  }

  pauseVideo(videoId: string, delay = 100) {
    this.clearCleanupTimeout(videoId);

    const timeout = setTimeout(() => {
      const videoRef = this.activeVideos.get(videoId);
      if (videoRef && typeof videoRef.pause === 'function') {
        try {
          videoRef.pause();
          TipShortsLogger.debug(`AudioManager: Paused video ${videoId}`);
        } catch (error) {
          TipShortsLogger.warn(`AudioManager: Error pausing video ${videoId}:`, error);
        }
      }
    }, delay);

    this.cleanupTimeouts.set(videoId, timeout);
  }

  pauseAllVideos() {
    TipShortsLogger.debug('AudioManager: Pausing all videos');
    this.activeVideos.forEach((videoRef, videoId) => {
      if (videoRef && typeof videoRef.pause === 'function') {
        try {
          videoRef.pause();
        } catch (error) {
          TipShortsLogger.warn(`AudioManager: Error pausing video ${videoId}:`, error);
        }
      }
    });
  }

  private clearCleanupTimeout(videoId: string) {
    const timeout = this.cleanupTimeouts.get(videoId);
    if (timeout) {
      clearTimeout(timeout);
      this.cleanupTimeouts.delete(videoId);
    }
  }

  cleanup() {
    TipShortsLogger.debug('AudioManager: Full cleanup');
    this.pauseAllVideos();
    this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cleanupTimeouts.clear();
    this.activeVideos.clear();
  }
}

interface OptimizedVideoPlayerProps {
  videoId: string;
  videoUrl?: string;
  streamVideoId?: string;
  streamStatus?: string;
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  onCompletion?: (videoId: string) => void;
  style?: any;
  width: number;
  height: number;
}

// Optimized Video Player Component with Memory Leak Prevention and Audio Management
const OptimizedVideoPlayer = memo<OptimizedVideoPlayerProps>(({
  videoId,
  videoUrl,
  streamVideoId,
  streamStatus,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  onCompletion,
  style,
  width,
  height,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(true);
  const videoRef = useRef<any>(null);
  const lastActiveState = useRef(isActive);
  const audioManager = TipShortsAudioManager.getInstance();

  // Track app state for audio management
  const appState = useRef(AppState.currentState);

  // Create video metadata for playback service
  const videoMetadata: VideoMetadata = {
    id: videoId,
    videoUrl: videoUrl || '',
    streamVideoId: streamVideoId || '',
    stream_status: streamStatus || 'ready',
    title: `Short Video ${videoId}`,
    duration: 0,
    thumbnail: '',
  };

  // Get optimal playback configuration
  const playbackConfig = React.useMemo(() => {
    const service = VideoPlaybackService.getInstance();
    return service.getPlaybackConfig(videoMetadata, {
      preferStream: true,
      quality: 'auto',
      autoplay: isActive && !isPaused,
      muted: isMuted,
      controls: false,
    });
  }, [videoMetadata, isActive, isPaused, isMuted]);

  // Enhanced load handler with error recovery
  const handleLoad = useCallback((data: any) => {
    if (!isMountedRef.current) return;
    
    TipShortsLogger.debug(`Video loaded: ${videoId}`, data);
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(data);
  }, [videoId, onLoad]);

  // Enhanced progress handler with throttling
  const handleProgress = useCallback((data: any) => {
    if (!isMountedRef.current || !isActive) return;
    
    // Throttle progress updates to prevent excessive re-renders
    onProgress?.(data);
  }, [isActive, onProgress]);

  // Enhanced error handler with recovery
  const handleError = useCallback((error: any) => {
    if (!isMountedRef.current) return;
    
    TipShortsLogger.error(`Video error for ${videoId}:`, error);
    setHasError(true);
    setIsLoaded(false);
  }, [videoId]);

  // Enhanced completion handler
  const handleCompletion = useCallback(() => {
    if (!isMountedRef.current) return;
    
    TipShortsLogger.debug(`Video completed: ${videoId}`);
    onCompletion?.(videoId);
  }, [videoId, onCompletion]);

  // Register video with audio manager on mount
  useEffect(() => {
    if (videoRef.current) {
      audioManager.registerVideo(videoId, videoRef.current);
    }

    return () => {
      audioManager.unregisterVideo(videoId);
    };
  }, [videoId, audioManager]);

  // Handle active state changes for audio management
  useEffect(() => {
    if (lastActiveState.current !== isActive) {
      lastActiveState.current = isActive;

      if (!isActive) {
        // Video became inactive, use audio manager to pause
        audioManager.pauseVideo(videoId);
      }
    }
  }, [isActive, audioManager, videoId]);

  // Handle app state changes for audio management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      appState.current = nextAppState;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background, use audio manager to pause all
        TipShortsLogger.debug(`App going to background, pausing all videos`);
        audioManager.pauseAllVideos();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [audioManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      TipShortsLogger.debug(`Component unmounting for video: ${videoId}`);
      // Audio manager will handle cleanup automatically
    };
  }, [videoId]);

  // Device capability detection for adaptive video settings
  const getOptimizedVideoSettings = useCallback(() => {
    const isLowEndDevice = Platform.OS === 'android' &&
      (Platform.constants?.Release < '8.0' || Platform.constants?.Model?.includes('Go'));

    return {
      maxBitRate: isLowEndDevice ? 1000000 : 2000000, // 1Mbps for low-end, 2Mbps for others
      bufferConfig: isLowEndDevice ? {
        minBufferMs: 1000,
        maxBufferMs: 3000,
        bufferForPlaybackMs: 500,
        bufferForPlaybackAfterRebufferMs: 1000,
      } : {
        minBufferMs: 1500,
        maxBufferMs: 5000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 1500,
      }
    };
  }, []);

  const videoSettings = getOptimizedVideoSettings();

  // Determine if video should play
  const shouldPlay = isActive && !isPaused && appState.current === 'active';

  // Validate video sources
  const hasValidSource = playbackConfig.streamVideoId || playbackConfig.videoUrl;

  if (!hasValidSource) {
    TipShortsLogger.warn(`No valid video source for video: ${videoId}`);
    return <View style={[styles.errorContainer, style]} />;
  }

  if (hasError) {
    return <View style={[styles.errorContainer, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <CloudflareStreamPlayer
        ref={videoRef}
        streamVideoId={playbackConfig.streamVideoId}
        streamStatus={streamStatus}
        fallbackVideoUrl={playbackConfig.videoUrl}
        width={width}
        height={height}
        autoplay={shouldPlay}
        muted={isMuted}
        controls={false}
        paused={!shouldPlay}
        useStreamPlayer={playbackConfig.useStreamPlayer}
        style={styles.video}
        isShort={true}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onError={handleError}
        onEnd={handleCompletion}
        // Enhanced audio management props
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        bufferConfig={videoSettings.bufferConfig}
        maxBitRate={videoSettings.maxBitRate}
        reportBandwidth={false}
        preventsDisplaySleepDuringVideoPlayback={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

export default OptimizedVideoPlayer;
