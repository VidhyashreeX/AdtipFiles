import React, { memo, useState, useCallback } from 'react';
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
import { Share2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnhancedShortCardProps {
  item: ShortVideo;
  index: number;
  isActive: boolean;
  onVideoLoad: (videoId: string) => void;
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
}

// Optimized Video Player Component
const OptimizedVideoPlayer = memo(({
  source,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  style,
}: {
  source: { uri: string };
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  style?: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Import Video component dynamically
  const Video = require('react-native-video').default;

  const shouldPlay = isActive && !isPaused && isLoaded && !hasError;

  const handleLoad = useCallback((data: any) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(data);
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    console.warn('[Video Error]:', error);
    setHasError(true);
    setIsLoaded(false);
  }, []);

  const handleProgress = useCallback((data: any) => {
    if (isActive && onProgress) {
      onProgress(data);
    }
  }, [isActive, onProgress]);

  return (
    <Video
      source={source}
      paused={!shouldPlay}
      muted={isMuted}
      repeat={true}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, style]}
      onLoad={handleLoad}
      onProgress={handleProgress}
      onError={handleError}
      bufferConfig={{
        minBufferMs: 1500,
        maxBufferMs: 5000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 1500,
      }}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      playWhenInactive={false}
      controls={false}
      disableFocus={true}
      fullscreen={false}
      hideShutterView={true}
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
        <Icon 
          name={isPlaying ? "pause" : "play"} 
          size={48} 
          color="#FFFFFF" 
        />
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
      <View style={[
        styles.actionIconContainer,
        {
          backgroundColor: isLiked ? '#FF3040' : 'rgba(255,255,255,0.2)',
          borderColor: isLiked ? '#FF3040' : 'rgba(255,255,255,0.3)',
        }
      ]}>
        <Icon 
          name="heart" 
          size={24} 
          color={isLiked ? "#FFFFFF" : "#FFFFFF"}
        />
      </View>
      
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
  onVideoLoad,
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
}) => {
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  // Safety check: Don't render if item is invalid
  if (!item || !item.id || !item.channel || !item.channel.id) {
    console.warn('[EnhancedShortCard] Invalid item data:', item);
    return null;
  }

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

  const handleLike = useCallback(() => {
    if (isGuest) {
      onGuestAction('like shorts');
      return;
    }

    if (item?.id && item?.channel?.id) {
      setIsLiked(!isLiked);
      onLike(item.id, item.channel.id, isLiked);
    }
  }, [item?.id, item?.channel?.id, isLiked, onLike, isGuest, onGuestAction]);

  return (
    <View style={styles.shortCardContainer}>
      {/* Video Player with tap gesture */}
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.videoContainer}>
          <OptimizedVideoPlayer
            source={{ uri: item.videoUrl }}
            isActive={isActive}
            isPaused={!isGloballyPlaying}
            isMuted={isGloballyMuted}
            style={styles.video}
            onLoad={handleVideoLoadLocal}
            onProgress={handleVideoProgress}
          />

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
          <Icon name={isGloballyMuted ? "volume-x" : "volume-2"} size={20} color="#FFF" />
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
              <Image
                source={{ uri: item.channel.avatar }}
                style={styles.channelAvatar}
              />
              <View style={styles.channelDetails}>
                <Text style={styles.channelName} numberOfLines={1}>
                  {item.channel.name}
                </Text>
                <Text style={styles.musicName} numberOfLines={1}>
                  ♪ {item.musicName || 'Original Sound'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.followButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (isGuest) {
                    onGuestAction('follow users');
                    return;
                  }
                  // TODO: Add follow functionality for authenticated users
                }}
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
              onPress={() => {
                if (isGuest) {
                  onGuestAction('comment on shorts');
                  return;
                }
                // TODO: Add comment functionality for authenticated users
              }}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="message-circle" size={24} color="#FFF" />
              </View>
              <Text style={styles.actionText}>
                {item.comments > 999 ? `${(item.comments / 1000).toFixed(1)}K` : item.comments}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={async () => {
                if (isGuest) {
                  onGuestAction('share shorts');
                  return;
                }

                if (!item?.id || !item?.channel?.name) return;
                try {
                  const deepLink = `https://adtip.in/tipshorts/${item.id}`;
                  const shareContent = {
                    message: `Check out this amazing short video by ${item.channel.name}! ${deepLink}`,
                    url: deepLink,
                    title: `${item.channel.name} - Short Video`,
                  };

                  await Share.share(shareContent);
                  console.log('[EnhancedShortCard] Successfully shared deep link:', deepLink);
                } catch (error) {
                  console.error('[EnhancedShortCard] Error sharing:', error);
                }
              }}
            >
              <View style={styles.actionIconContainer}>
                <Share2 size={24} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => {
                if (isGuest) {
                  onGuestAction('access more options');
                  return;
                }
                // TODO: Add more options functionality for authenticated users
              }}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="more-horizontal" size={24} color="#FFF" />
              </View>
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
  },
  video: {
    width: '100%',
    height: '100%',
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
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
