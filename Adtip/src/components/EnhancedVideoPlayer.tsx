// adtip-reactnative/Adtip/src/components/EnhancedVideoPlayer.tsx
// Enhanced Video Player with comprehensive error handling, buffering management, and connectivity fixes
// Replaces existing video players with optimized streaming and recovery mechanisms

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  forwardRef, 
  useImperativeHandle,
} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import VideoStreamingService from '../services/VideoStreamingService';
import CloudflareStreamPlayer from './CloudflareStreamPlayer';
import { Logger } from '../utils/ProductionLogger';

interface EnhancedVideoPlayerProps {
  videoId: string;
  streamVideoId?: string;
  streamStatus?: 'uploading' | 'ready' | 'error' | 'inprogress';
  fallbackVideoUrl?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  paused?: boolean;
  loop?: boolean;
  isActive?: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  onBuffer?: (isBuffering: boolean) => void;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  quality?: 'auto' | 'high' | 'medium' | 'low';
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => Promise<number>;
  reload: () => void;
}

const EnhancedVideoPlayer = forwardRef<VideoPlayerRef, EnhancedVideoPlayerProps>((props, ref) => {
  const {
    videoId,
    streamVideoId,
    streamStatus,
    fallbackVideoUrl,
    width = Dimensions.get('window').width,
    height = 200,
    autoplay = false,
    muted = true,
    controls = false,
    paused = false,
    loop = false,
    isActive = false,
    onLoad,
    onProgress,
    onError,
    onEnd,
    onBuffer,
    style,
    resizeMode = 'contain',
    quality = 'auto',
  } = props;
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSource, setCurrentSource] = useState<any>(null);
  const [useCloudflarePlayer, setUseCloudflarePlayer] = useState(false);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  
  // Refs
  const videoRef = useRef<any>(null);
  const streamingService = VideoStreamingService.getInstance();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Expose player controls through ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current?.play) {
        videoRef.current.play();
      }
    },
    pause: () => {
      if (videoRef.current?.pause) {
        videoRef.current.pause();
      }
    },
    seek: (time: number) => {
      if (videoRef.current?.seek) {
        videoRef.current.seek(time);
      }
    },
    getCurrentTime: async () => {
      return new Promise((resolve) => {
        if (videoRef.current?.getCurrentTime) {
          videoRef.current.getCurrentTime(resolve);
        } else {
          resolve(0);
        }
      });
    },
    reload: () => {
      handleReload();
    },
  }), []);

  // Initialize network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkType(state.type);
      setIsNetworkAvailable(state.isConnected ?? false);
      
      if (!state.isConnected && !hasError) {
        handleNetworkDisconnection();
      } else if (state.isConnected && hasError) {
        // Network recovered, retry if we had network errors
        handleNetworkRecovery();
      }
    });

    return () => unsubscribe();
  }, [hasError]);

  // Initialize video source and configuration
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    initializeVideoSource();
    
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
    };
  }, [videoId, streamVideoId, streamStatus, quality]);

  // Handle active state changes
  useEffect(() => {
    if (!isActive && videoRef.current) {
      // Pause video when not active to save resources
      if (videoRef.current.pause) {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  /**
   * Initialize video source based on available data
   */
  const initializeVideoSource = useCallback(async () => {
    try {
      Logger.debug('EnhancedVideoPlayer', 'Initializing video source:', {
        videoId,
        streamVideoId,
        streamStatus,
        fallbackVideoUrl,
      });

      // Reset state
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
      setRetryCount(0);

      // Determine optimal video configuration
      const config = streamingService.getOptimalVideoConfig(videoId, {
        quality,
        enableAdaptiveBitrate: networkType === 'wifi',
        maxRetries: 3,
        bufferTimeout: 30000,
        preloadDistance: 2,
      });

      // Check if we should use Cloudflare Stream
      if (streamVideoId && streamStatus === 'ready') {
        setUseCloudflarePlayer(true);
        setCurrentSource({ streamVideoId, fallbackVideoUrl });
      } else if (fallbackVideoUrl) {
        setUseCloudflarePlayer(false);
        setCurrentSource({ uri: fallbackVideoUrl });
      } else {
        throw new Error('No valid video source available');
      }

    } catch (error) {
      Logger.error('EnhancedVideoPlayer', 'Failed to initialize video source:', error);
      handleVideoError(error);
    }
  }, [videoId, streamVideoId, streamStatus, fallbackVideoUrl, quality, networkType]);

  /**
   * Handle video loading completion
   */
  const handleVideoLoad = useCallback((data: any) => {
    if (!isMountedRef.current) return;

    Logger.debug('EnhancedVideoPlayer', 'Video loaded successfully:', { videoId, data });
    
    setIsLoading(false);
    setIsBuffering(false);
    setHasError(false);
    setRetryCount(0);
    
    onLoad?.(data);
  }, [videoId, onLoad]);

  /**
   * Handle video progress updates
   */
  const handleVideoProgress = useCallback((data: any) => {
    if (!isMountedRef.current || !isActive) return;
    
    onProgress?.(data);
  }, [isActive, onProgress]);

  /**
   * Handle video buffering
   */
  const handleVideoBuffer = useCallback((isBufferingNow: boolean) => {
    if (!isMountedRef.current) return;

    setIsBuffering(isBufferingNow);
    onBuffer?.(isBufferingNow);

    if (isBufferingNow) {
      // Set timeout for buffer detection
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      bufferTimeoutRef.current = setTimeout(() => {
        if (isBuffering && !hasError) {
          Logger.warn('EnhancedVideoPlayer', 'Buffer timeout detected, attempting recovery');
          handleBufferTimeout();
        }
      }, 15000); // 15 seconds buffer timeout
    } else {
      // Clear buffer timeout when buffering ends
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
    }
  }, [isBuffering, hasError]);

  /**
   * Handle video errors with intelligent recovery
   */
  const handleVideoError = useCallback(async (error: any) => {
    if (!isMountedRef.current) return;

    Logger.error('EnhancedVideoPlayer', 'Video error occurred:', { videoId, error, retryCount });

    const errorAnalysis = await streamingService.handleStreamingError(videoId, error, retryCount);
    
    if (errorAnalysis.shouldRetry && retryCount < 3) {
      Logger.debug('EnhancedVideoPlayer', 'Attempting recovery:', errorAnalysis.nextAction);
      
      setRetryCount(prev => prev + 1);
      
      // Wait before retry
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      retryTimeoutRef.current = setTimeout(() => {
        switch (errorAnalysis.nextAction) {
          case 'retry_with_lower_quality':
            retryWithLowerQuality();
            break;
          case 'retry_with_fallback':
            retryWithFallback();
            break;
          case 'retry_current_config':
            handleReload();
            break;
          default:
            initializeVideoSource();
        }
      }, delay);
    } else {
      // Max retries reached or unrecoverable error
      setHasError(true);
      setErrorMessage('Video playback failed. Please check your connection and try again.');
      setIsLoading(false);
      setIsBuffering(false);
      
      onError?.(error);
    }
  }, [videoId, retryCount, streamingService, onError]);

  /**
   * Handle network disconnection
   */
  const handleNetworkDisconnection = useCallback(() => {
    Logger.warn('EnhancedVideoPlayer', 'Network disconnected during playback');
    
    setIsBuffering(true);
    setErrorMessage('Network connection lost. Reconnecting...');
  }, []);

  /**
   * Handle network recovery
   */
  const handleNetworkRecovery = useCallback(() => {
    if (hasError && retryCount < 3) {
      Logger.debug('EnhancedVideoPlayer', 'Network recovered, retrying playback');
      
      setHasError(false);
      setErrorMessage('');
      initializeVideoSource();
    }
  }, [hasError, retryCount, initializeVideoSource]);

  /**
   * Handle buffer timeout
   */
  const handleBufferTimeout = useCallback(() => {
    Logger.warn('EnhancedVideoPlayer', 'Buffer timeout, attempting recovery');
    
    if (retryCount < 2) {
      retryWithLowerQuality();
    } else {
      handleVideoError(new Error('Buffer timeout - network too slow'));
    }
  }, [retryCount]);

  /**
   * Retry with lower quality settings
   */
  const retryWithLowerQuality = useCallback(() => {
    Logger.debug('EnhancedVideoPlayer', 'Retrying with lower quality');
    
    const lowerQuality = quality === 'high' ? 'medium' : 'low';
    
    // Re-initialize with lower quality
    const config = streamingService.getOptimalVideoConfig(videoId, {
      quality: lowerQuality,
      enableAdaptiveBitrate: false, // Disable adaptive to save bandwidth
      maxRetries: 2,
      bufferTimeout: 20000,
      preloadDistance: 1,
    });
    
    setIsLoading(true);
    setHasError(false);
    initializeVideoSource();
  }, [quality, videoId, streamingService, initializeVideoSource]);

  /**
   * Retry with fallback video source
   */
  const retryWithFallback = useCallback(() => {
    Logger.debug('EnhancedVideoPlayer', 'Retrying with fallback source');
    
    if (useCloudflarePlayer && fallbackVideoUrl) {
      setUseCloudflarePlayer(false);
      setCurrentSource({ uri: fallbackVideoUrl });
      setIsLoading(true);
      setHasError(false);
    } else {
      handleVideoError(new Error('No fallback source available'));
    }
  }, [useCloudflarePlayer, fallbackVideoUrl]);

  /**
   * Manual reload function
   */
  const handleReload = useCallback(() => {
    Logger.debug('EnhancedVideoPlayer', 'Manual reload requested');
    
    clearTimeouts();
    setRetryCount(0);
    initializeVideoSource();
  }, [initializeVideoSource]);

  /**
   * Clear all timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
  }, []);

  // Render error state
  if (hasError) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {!isNetworkAvailable && (
            <Text style={styles.networkText}>No internet connection</Text>
          )}
        </View>
      </View>
    );
  }

  // Render Cloudflare Stream player
  if (useCloudflarePlayer && currentSource?.streamVideoId) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        {(isLoading || isBuffering) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              {isLoading ? 'Loading video...' : 'Buffering...'}
            </Text>
          </View>
        )}
        <CloudflareStreamPlayer
          streamVideoId={currentSource.streamVideoId}
          streamStatus={streamStatus}
          fallbackVideoUrl={currentSource.fallbackVideoUrl}
          width={width}
          height={height}
          autoplay={autoplay && isActive}
          muted={muted}
          controls={controls}
          paused={paused || !isActive}
          onLoad={() => handleVideoLoad({})}
          onError={handleVideoError}
          onProgress={handleVideoProgress}
          onEnd={onEnd}
          style={styles.player}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  // Render standard video player
  if (currentSource?.uri) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        {(isLoading || isBuffering) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              {isLoading ? 'Loading video...' : 'Buffering...'}
            </Text>
          </View>
        )}
        <Video
          ref={videoRef}
          source={currentSource}
          style={styles.player}
          controls={controls}
          resizeMode={resizeMode}
          onLoad={handleVideoLoad}
          onError={handleVideoError}
          onProgress={handleVideoProgress}
          onEnd={onEnd}
          onBuffer={({ isBuffering }) => handleVideoBuffer(isBuffering)}
          muted={muted}
          paused={paused || !isActive}
          repeat={loop}
          playWhenInactive={false}
          playInBackground={false}
          bufferConfig={{
            minBufferMs: networkType === 'wifi' ? 1500 : 3000,
            maxBufferMs: networkType === 'wifi' ? 5000 : 8000,
            bufferForPlaybackMs: networkType === 'wifi' ? 1000 : 2000,
            bufferForPlaybackAfterRebufferMs: networkType === 'wifi' ? 2000 : 3000,
          }}
        />
      </View>
    );
  }

  // No valid source
  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No video source available</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  player: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  networkText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

EnhancedVideoPlayer.displayName = 'EnhancedVideoPlayer';

export default EnhancedVideoPlayer;