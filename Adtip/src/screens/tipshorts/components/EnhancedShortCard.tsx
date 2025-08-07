import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Share,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import { type ShortVideo } from '../../../hooks/useShortsQuery';
import { Share2, Heart, MessageCircle, Play, Pause, VolumeX, Volume2 } from 'lucide-react-native';
import shareService from '../../../services/ShareService';
import VideoErrorBoundary from '../../../components/common/VideoErrorBoundary';
import CloudflareStreamPlayer from '../../../components/CloudflareStreamPlayer';
import {Logger} from '../../../utils/ProductionLogger';
import VideoPlaybackService, { VideoMetadata } from '../../../services/VideoPlaybackService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnhancedShortCardProps {
  item: ShortVideo;
  index: number;
  isActive: boolean;
  isLiked: boolean; // Add isLiked prop
  onVideoLoad: (videoId: string) => void;
  onVideoCompletion?: (videoId: string) => void; // Add video completion callback
  onLike: (shortId: string, creatorId: string, isCurrentlyLiked: boolean) => void;
  combinedGesture: any;
  showPlayPause: boolean;
  videoProgress: { [key: string]: number };
  setVideoProgress: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  isGloballyPlaying: boolean;
  isGloballyMuted: boolean;
  toggleGlobalMute: () => void;
  insets: any;
  isGuest: boolean;
  onGuestAction: (action: string) => void;
  onChannelNavigation?: (channelData: { id: string; name: string; avatar?: string }) => void;
  onComment?: (shortId: string) => void;
  onFollow?: (channelId: string) => void;
}

// Optimized Video Player Component with Memory Leak Prevention and Strict Pause Control
const OptimizedVideoPlayer = memo(({
  source,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  style,
  onVideoCompletion, // Add onVideoCompletion prop
}: {
  source: { uri: string };
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  style?: any;
  onVideoCompletion?: (videoId: string) => void; // Add onVideoCompletion prop
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(true);
  const videoRef = useRef<any>(null);

  // Import Video component dynamically
  const Video = require('react-native-video').default;

  // Prevent state updates if component is unmounted
  const safeSetIsLoaded = useCallback((loaded: boolean) => {
    if (isMountedRef.current) {
      setIsLoaded(loaded);
    }
  }, []);

  const safeSetHasError = useCallback((error: boolean) => {
    if (isMountedRef.current) {
      setHasError(error);
    }
  }, []);

  // Validate source URI
  const isValidUri = source?.uri && typeof source.uri === 'string' && source.uri.trim().length > 0;

  // Set error state if URI is invalid
  useEffect(() => {
    if (!isValidUri) {
      console.warn('[OptimizedVideoPlayer] Invalid or missing video URI:', source?.uri);
      safeSetHasError(true);
      safeSetIsLoaded(false);
    } else {
      safeSetHasError(false);
    }
  }, [isValidUri, source?.uri, safeSetHasError, safeSetIsLoaded]);

  // Throttled seeking to prevent excessive operations
  const lastSeekTimeRef = useRef(0);
  const SEEK_THROTTLE_MS = 500; // Minimum time between seek operations

  const throttledSeek = useCallback((position: number) => {
    const now = Date.now();
    if (now - lastSeekTimeRef.current < SEEK_THROTTLE_MS) {
      return; // Skip if too soon since last seek
    }

    if (videoRef.current && isMountedRef.current) {
      try {
        lastSeekTimeRef.current = now;
        videoRef.current.seek(position);
      } catch (error) {
        Logger.warn('OptimizedVideoPlayer', 'Error during throttled seek:', error);
      }
    }
  }, []);

  // Consolidated cleanup on unmount to prevent memory leaks
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Force cleanup video resources with error handling
      if (videoRef.current) {
        try {
          // Stop video playback immediately
          videoRef.current.paused = true;
          // Reset to beginning for next use
          throttledSeek(0);
          Logger.debug('OptimizedVideoPlayer', 'Video cleanup completed');
        } catch (error) {
          Logger.warn('OptimizedVideoPlayer', 'Error during video cleanup:', error);
        }
      }

      // Reset state to prevent memory leaks
      setIsLoaded(false);
      setHasError(false);
    };
  }, [throttledSeek]);

  // Optimized pause control - only when necessary
  useEffect(() => {
    if (!isActive && videoRef.current && isMountedRef.current) {
      // Only reset video if it was actually playing
      if (!isPaused) {
        throttledSeek(0);
      }
    }
  }, [isActive, isPaused, throttledSeek]);

  const shouldPlay = isActive && !isPaused && isLoaded && !hasError && isValidUri;

  const handleLoad = useCallback((data: any) => {
    if (!isMountedRef.current) return;

    safeSetIsLoaded(true);
    safeSetHasError(false);
    onLoad?.(data);
  }, [onLoad, safeSetIsLoaded, safeSetHasError]);

  const handleError = useCallback((error: any) => {
    if (!isMountedRef.current) return;

    console.warn('[OptimizedVideoPlayer] Video Error:', error);
    safeSetHasError(true);
    safeSetIsLoaded(false);
  }, [safeSetHasError, safeSetIsLoaded]);

  const handleProgress = useCallback((data: any) => {
    if (!isMountedRef.current || !isActive) return;

    onProgress?.(data);
  }, [isActive, onProgress]);

  const handleCompletion = useCallback(() => {
    if (!isMountedRef.current || !isActive || !onVideoCompletion || !isValidUri) return;

    // Safely extract videoId from source.uri with proper validation
    try {
      const videoId = source.uri.split('/').pop() || '';
      onVideoCompletion(videoId);
    } catch (error) {
      console.warn('[OptimizedVideoPlayer] Error extracting video ID:', error);
    }
  }, [isActive, onVideoCompletion, source.uri, isValidUri]);

  // Return error placeholder if URI is invalid
  if (!isValidUri) {
    return (
      <View style={[StyleSheet.absoluteFill, style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Video not available</Text>
      </View>
    );
  }

  // Device capability detection for adaptive video settings
  const getOptimizedVideoSettings = useCallback(() => {
    // Basic device capability detection
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

  // Get optimized settings based on device capabilities
  const videoSettings = useMemo(() => getOptimizedVideoSettings(), [getOptimizedVideoSettings]);

  return (
    <Video
      ref={videoRef}
      source={source}
      paused={!shouldPlay}
      muted={isMuted}
      repeat={true}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, style]}
      onLoad={handleLoad}
      onProgress={handleProgress}
      onError={handleError}
      onEnd={handleCompletion}
      bufferConfig={videoSettings.bufferConfig}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      playWhenInactive={false}
      controls={false}
      disableFocus={true}
      fullscreen={false}
      hideShutterView={true}
      // Adaptive memory optimization settings
      maxBitRate={videoSettings.maxBitRate}
      reportBandwidth={false} // Disable bandwidth reporting to save memory
      preventsDisplaySleepDuringVideoPlayback={false} // Allow display sleep to save battery
    />
  );
});

// Play/Pause Overlay Component
const PlayPauseOverlay = memo(({
  isPlaying,
  isVisible,
}: {
  isPlaying: boolean;
  isVisible: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.playPauseOverlay}>
      <View style={styles.playPauseBackground}>
        {isPlaying ? (
          <Pause size={48} color="#FFFFFF" />
        ) : (
          <Play size={48} color="#FFFFFF" />
        )}
      </View>
    </View>
  );
});

// Progress Bar Component
const VideoProgressBar = memo(({ 
  progress = 0, 
  isActive = false,
}: { 
  progress: number; 
  isActive: boolean;
}) => {
  if (!isActive || progress <= 0) return null;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground} />
      <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
    </View>
  );
});

// Animated Like Button Component
const AnimatedLikeButton = memo(({
  isLiked,
  onPress,
  likeCount,
  disabled = false,
}: {
  isLiked: boolean;
  onPress: () => void;
  likeCount: number;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Heart
        size={30}
        color={isLiked ? "#FF3040" : "#FFFFFF"}
        fill={isLiked ? "#FF3040" : "transparent"}
      />

      <Text style={styles.actionText}>
        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
      </Text>
    </TouchableOpacity>
  );
});

// Main Enhanced Short Card Component
const EnhancedShortCard: React.FC<EnhancedShortCardProps> = memo(({
  item,
  index,
  isActive,
  isLiked, // Use the passed-in prop
  onVideoLoad,
  onVideoCompletion, // Add onVideoCompletion prop
  onLike,
  combinedGesture,
  showPlayPause,
  videoProgress,
  setVideoProgress,
  isGloballyPlaying,
  isGloballyMuted,
  toggleGlobalMute,
  insets,
  isGuest,
  onGuestAction,
  onChannelNavigation,
  onComment,
  onFollow,
}) => {
  const [showThumbnail, setShowThumbnail] = useState(true);
  // REMOVED: const [isLiked, setIsLiked] = useState(false);

  // Safety check: Don't render if item is invalid
  if (!item || !item.id || !item.channel || !item.channel.id) {
    console.warn('[EnhancedShortCard] Invalid item data:', item);
    return null;
  }

  // Higher-order function to handle guest action protection
  const protectAction = useCallback((actionName: string, callback: () => void) => {
    return () => {
      if (isGuest) {
        onGuestAction(actionName);
        return;
      }
      callback();
    };
  }, [isGuest, onGuestAction]);

  const handleVideoLoadLocal = useCallback(() => {
    setShowThumbnail(false);
    if (item?.id) {
      onVideoLoad(item.id);
    }
  }, [item?.id, onVideoLoad]);

  const handleVideoProgress = useCallback((data: any) => {
    if (isActive && data.currentTime && data.seekableDuration && item?.id) {
      const progress = data.currentTime / data.seekableDuration;
      setVideoProgress(prev => ({
        ...prev,
        [item.id]: Math.min(Math.max(progress, 0), 1)
      }));
    }
  }, [isActive, item?.id, setVideoProgress]);

  const handleLike = protectAction('like shorts', () => {
    if (item?.id && item?.channel?.id) {
      // Don't set local state. Just call the parent's handler.
      // The `isLiked` prop already reflects the current state.
      onLike(item.id, item.channel.id, isLiked);
    }
  });

  const handleChannelPress = protectAction('view channels', () => {
    if (onChannelNavigation && item?.channel) {
      onChannelNavigation({
        id: item.channel.id,
        name: item.channel.name,
        avatar: item.channel.avatar
      });
    }
  });

  const handleComment = protectAction('comment on shorts', () => {
    if (onComment && item?.id) {
      onComment(item.id);
    }
  });

  const handleFollow = protectAction('follow users', () => {
    if (onFollow && item?.channel?.id) {
      onFollow(item.channel.id);
    }
  });

  const handleShare = protectAction('share shorts', async () => {
    if (!item?.id || !item?.channel?.name) return;
    try {
      // Use ShareService for proper deep link generation
      const shortTitle = `${item.channel.name} - Short Video`;
      await shareService.shareShort(item.id.toString(), shortTitle, {
        useUniversalLink: true,
        includeAppName: true
      });

      console.log('[EnhancedShortCard] Successfully shared short video:', item.id);
    } catch (error) {
      console.error('[EnhancedShortCard] Error sharing:', error);
      // Fallback to basic share
      try {
        const shareContent = {
          message: `Check out this amazing short video by ${item.channel.name}! https://adtip.in/short/${item.id}`,
          title: `${item.channel.name} - Short Video`,
        };
        await Share.share(shareContent);
      } catch (fallbackError) {
        console.error('[EnhancedShortCard] Fallback share also failed:', fallbackError);
      }
    }
  });



  // Prepare video metadata for hybrid playback
  const videoMetadata: VideoMetadata = useMemo(() => ({
    id: item.id,
    video_link: item?.videoUrl || '',
    stream_video_id: item?.stream_video_id,
    stream_status: item?.stream_status,
    adaptive_manifest_url: item?.adaptive_manifest_url,
    stream_ready_at: item?.stream_ready_at,
    isShot: true,
  }), [item]);

  // Get optimal playback configuration
  const playbackConfig = useMemo(() => {
    const service = VideoPlaybackService.getInstance();

    // Get debug info for troubleshooting
    const debugInfo = service.getDebugInfo(videoMetadata);
    console.log('[EnhancedShortCard] Video debug info:', debugInfo);

    return service.getPlaybackConfig(videoMetadata, {
      preferStream: true,
      quality: 'auto',
      autoplay: isActive && isGloballyPlaying,
      muted: isGloballyMuted,
      controls: false,
    });
  }, [videoMetadata, isActive, isGloballyPlaying, isGloballyMuted]);

  // Validate video sources
  const hasValidSource = playbackConfig.streamVideoId || playbackConfig.videoUrl;

  return (
    <View style={styles.shortCardContainer}>
      {/* Video Player with tap gesture */}
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.videoContainer}>
          <VideoErrorBoundary
            onError={(error, errorInfo) => {
              console.error('[EnhancedShortCard] Video error boundary caught:', error);
              console.error('[EnhancedShortCard] Error info:', errorInfo);
            }}
          >
            {hasValidSource ? (
              <CloudflareStreamPlayer
                streamVideoId={playbackConfig.streamVideoId}
                streamStatus={videoMetadata.stream_status}
                fallbackVideoUrl={playbackConfig.videoUrl}
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                autoplay={isActive && isGloballyPlaying}
                muted={isGloballyMuted}
                controls={false}
                paused={!isActive || !isGloballyPlaying} // Add proper paused control
                useStreamPlayer={playbackConfig.useStreamPlayer}
                style={styles.video}
                isShort={true} // Mark as short video for proper aspect ratio handling
                onLoad={handleVideoLoadLocal}
                onProgress={handleVideoProgress}
                onEnd={() => {
                  if (onVideoCompletion && item?.id) {
                    onVideoCompletion(item.id);
                  }
                }}
                onError={(error) => {
                  console.error('[EnhancedShortCard] Video playback error:', {
                    error,
                    videoId: item.id,
                    streamVideoId: playbackConfig.streamVideoId,
                    streamStatus: videoMetadata.stream_status,
                    fallbackUrl: playbackConfig.videoUrl
                  });
                }}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>Video not available</Text>
              </View>
            )}
          </VideoErrorBoundary>

          {/* Thumbnail overlay while loading */}
          {showThumbnail && item.thumbnail && (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnailOverlay}
              resizeMode="cover"
            />
          )}

          {/* Play/Pause Overlay Indicator */}
          <PlayPauseOverlay 
            isPlaying={isGloballyPlaying && isActive}
            isVisible={showPlayPause && isActive}
          />
        </View>
      </GestureDetector>

      {/* Progress Bar */}
      <VideoProgressBar
        progress={item?.id ? (videoProgress[item.id] || 0) : 0}
        isActive={isActive}
      />

      {/* Fixed Persistent Overlays */}
      <View style={styles.overlayContainer}>
        {/* Mute button - top right */}
        <TouchableOpacity
          onPress={toggleGlobalMute}
          style={styles.muteButton}
          activeOpacity={0.7}
        >
          {isGloballyMuted ? (
            <VolumeX size={20} color="#FFF" />
          ) : (
            <Volume2 size={20} color="#FFF" />
          )}
        </TouchableOpacity>

        {/* Fixed bottom content positioning */}
        <View style={[styles.bottomContent, {
          paddingBottom: Math.max(
            insets.bottom +
            (isGuest ? 90 : 70) +
            (Platform.OS === 'android' && isGuest ? 20 : 0),
            40
          ),
          bottom: 0,
        }]}>
          <View style={styles.leftContent}>
            {/* Channel info row */}
            <View style={styles.channelInfo}>
              <TouchableOpacity
                onPress={handleChannelPress}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.channel.avatar }}
                  style={styles.channelAvatar}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.channelDetails}
                onPress={handleChannelPress}
                activeOpacity={0.8}
              >
                <Text style={styles.channelName} numberOfLines={1}>
                  {item.channel.name}
                </Text>
                <Text style={styles.musicName} numberOfLines={1}>
                  ♪ {item.musicName || 'Original Sound'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.followButton}
                activeOpacity={0.8}
                onPress={handleFollow}
              >
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          </View>

          {/* Action buttons - right side */}
          <View style={styles.rightActions}>
            <AnimatedLikeButton
              isLiked={isLiked}
              onPress={handleLike}
              likeCount={item.likes}
              disabled={false}
            />
            
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={handleComment}
            >
              <MessageCircle size={30} color="#FFF" />
              <Text style={styles.actionText}>
                {item.comments > 999 ? `${(item.comments / 1000).toFixed(1)}K` : item.comments}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={handleShare}
            >
              <Share2 size={30} color="#FFF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  shortCardContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    // Ensure video maintains proper aspect ratio for mobile shorts
    aspectRatio: 9 / 16, // 9:16 aspect ratio for mobile shorts
  },
  thumbnailOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 100,
  },
  playPauseBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#FF3040',
    borderRadius: 1.5,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'box-none',
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
    pointerEvents: 'auto',
    justifyContent: 'flex-end',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 10,
  },
  channelDetails: {
    flex: 1,
  },
  channelName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  musicName: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  followButton: {
    backgroundColor: '#FF3040',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  followText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 16,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rightActions: {
    alignItems: 'center',
    pointerEvents: 'auto',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default EnhancedShortCard;
