import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
  NativeModules,
  BackHandler,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withDelay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import { ENDPOINTS } from '../../constants/api';
import { useShorts } from '../../contexts/ShortsContext';
import VideoPreloaderService from '../../services/VideoPreloaderService';
import { getSecureMediaUrl, getFallbackAvatarUrl } from '../../utils/mediaUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_SIZE = 10;

// Native components with fallback
let ExoPlayerView: any = null;

try {
  const { requireNativeComponent } = require('react-native');
  ExoPlayerView = requireNativeComponent('ExoPlayerView');
} catch (error) {
  console.warn('ExoPlayer not available, using react-native-video');
}

interface ShortVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    subscribers: number;
  };
  views: number;
  likes: number;
  duration: string;
  createdAt: string;
  category: string;
  isPaidPromotional?: boolean;
  postedAt: string;
  description: string;
  videoUrl: string;
  comments: number;
  musicName?: string;
}

interface PublicShot {
  id: number;
  name: string;
  category_id: number;
  video_link: string;
  video_description: string;
  total_views: number;
  total_likes: number;
  createddate: string;
  video_Thumbnail: string;
  channelName: string;
  channel_profile: string;
  channelId: number;
  total_comments: number;
  play_duration: string;
  is_paid_promotional: number;
  total_channel_followers: number;
}

// Optimized Video Player Component with instant response
const OptimizedVideoPlayer = memo(({
  source,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  onEnd,
  style,
}: {
  source: { uri: string };
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  onEnd?: () => void;
  style?: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);

  // Enhanced logic similar to HomeScreen PostItem
  const shouldPlay = isActive && !isPaused && isLoaded && !hasError;

  // Effect for automatic play/pause based on visibility (like HomeScreen)
  useEffect(() => {
    if (isActive && isLoaded && !hasError) {
      // Auto-play when video becomes active (unless manually paused)
      if (!wasManuallyPaused) {
        // Video should play automatically
      }
    } else {
      // Auto-pause when video goes out of view
      setWasManuallyPaused(false); // Reset manual pause state when out of view
    }
  }, [isActive, isLoaded, hasError, wasManuallyPaused]);

  const handleLoad = useCallback((data: any) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(data);
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    console.warn('Video load error:', error);
    setHasError(true);
    setIsLoaded(false);
  }, []);

  const handleProgress = useCallback((data: any) => {
    if (isActive && onProgress) {
      onProgress(data);
    }
  }, [isActive, onProgress]);

  // Use ExoPlayer if available for better performance
  if (ExoPlayerView && !hasError) {
    return (
      <ExoPlayerView
        source={source}
        paused={!shouldPlay}
        muted={isMuted}
        repeat={true}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, style]}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onError={handleError}
        onEnd={onEnd}
      />
    );
  }

  // Fallback to react-native-video with optimized config
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
      onEnd={onEnd}
      bufferConfig={{
        minBufferMs: 1500,
        maxBufferMs: 5000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 1500,
      }}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      playWhenInactive={false}
      mixWithOthers="duck" // Duck other audio when playing
    />
  );
});

// Enhanced Play/Pause Overlay Indicator
const PlayPauseOverlay = memo(({
  isPlaying,
  isVisible,
}: {
  isPlaying: boolean;
  isVisible: boolean;
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Show play/pause indicator
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 8, stiffness: 100 })
      );
      opacity.value = withTiming(1, { duration: 150 });

      // Hide after delay
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.playPauseOverlay, animatedStyle]}>
      <View style={styles.playPauseBackground}>
        <Icon 
          name={isPlaying ? "pause" : "play"} 
          size={48} 
          color="#FFFFFF" 
        />
      </View>
    </Animated.View>
  );
});

// Enhanced Animated Like Button with improved response
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
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Instant feedback - no delay
    scale.value = withSequence(
      withTiming(0.85, { duration: 50 }), // Faster response
      withSpring(1.05, { damping: 8, stiffness: 150 }),
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    if (!isLiked) {
      // Heart burst animation for new likes
      heartScale.value = withSequence(
        withTiming(1.5, { duration: 100 }),
        withSpring(1, { damping: 6, stiffness: 100 })
      );
    }

    runOnJS(onPress)();
  }, [disabled, isLiked, onPress]);

  return (
    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7} // Faster visual feedback
    >
      <Animated.View style={[
        {
          width: 48,
          height: 48,
          backgroundColor: isLiked ? '#FF3040' : 'rgba(255,255,255,0.2)',
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isLiked ? '#FF3040' : 'rgba(255,255,255,0.3)',
        },
        buttonAnimatedStyle
      ]}>
        <Animated.View style={heartAnimatedStyle}>
          <Icon 
            name="heart" 
            size={24} 
            color="#FFFFFF"
            fill={isLiked ? "#FFFFFF" : "transparent"}
          />
        </Animated.View>
      </Animated.View>
      
      <Text style={styles.actionText}>
        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
      </Text>
    </TouchableOpacity>
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
  const progressWidth = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive && progress > 0) {
      progressWidth.value = withTiming(progress * SCREEN_WIDTH, { duration: 100 });
      opacity.value = withTiming(0.8, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [progress, isActive]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.progressContainer, containerStyle]}>
      <View style={styles.progressBackground} />
      <Animated.View style={[styles.progressFill, progressStyle]} />
    </Animated.View>
  );
});

// Skeleton Component
const ShortsSkeleton: React.FC = memo(() => {
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    pulseAnimation.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.3, { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnimation.value, [0, 1], [0.3, 0.8], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonVideo, animatedStyle]} />
    </View>
  );
});

// Main TipShorts Enhanced Component
const TipShortsEnhanced = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isGloballyMuted, isGloballyPlaying, toggleGlobalPlayPause, toggleGlobalMute } = useShorts();
  const insets = useSafeAreaInsets();

  // Core states
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interaction states
  const [likedShorts, setLikedShorts] = useState<{ [key: string]: boolean }>({});
  const [likingShorts, setLikingShorts] = useState<{ [key: string]: boolean }>({});
  
  // Pagination states
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Video states
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [visibleVideoIds, setVisibleVideoIds] = useState<string[]>([]);
  const [showPlayPause, setShowPlayPause] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);
  const apiCallsRef = useRef(0);
  const lastFetchTime = useRef(0);
  const videoPreloader = VideoPreloaderService.getInstance();

  // Viewability config for instant video control (like HomeScreen)
  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 60, // Video must be 60% visible
    minimumViewTime: 50, // Very short for instant response
    waitForInteraction: false,
  };

  // Instant visibility tracking like HomeScreen
  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const currentVisibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id as string);

    setVisibleVideoIds(currentVisibleIds);

    // Auto-set active index based on most visible item
    if (viewableItems.length > 0) {
      const mostVisibleItem = viewableItems.reduce((prev, current) => 
        (current.percentVisible || 0) > (prev.percentVisible || 0) ? current : prev
      );
      
      if (mostVisibleItem.item) {
        const newActiveIndex = shorts.findIndex(short => short.id === mostVisibleItem.item.id);
        if (newActiveIndex !== -1 && newActiveIndex !== activeIndex) {
          setActiveIndex(newActiveIndex);
        }
      }
    }
  }, [shorts, activeIndex]);

  // Handle video load and start preloading next
  const handleVideoLoad = useCallback((videoId: string) => {
    setLoadedVideos(prev => new Set([...prev, videoId]));
    
    // Start preloading next video after current starts playing
    const currentVideoIndex = shorts.findIndex(short => short.id === videoId);
    if (currentVideoIndex !== -1) {
      videoPreloader.preloadNextVideo(currentVideoIndex, shorts);
    }
  }, [shorts, videoPreloader]);

  // Enhanced tap gesture with play/pause indicator
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(() => {
        toggleGlobalPlayPause();
        setShowPlayPause(true);
        setTimeout(() => setShowPlayPause(false), 100);
      })();
    });

  // Double tap gesture for like
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const currentShort = shorts[activeIndex];
      if (currentShort) {
        runOnJS(handleLikeShort)(
          currentShort.id, 
          currentShort.channel.id, 
          currentShort.likes
        );
      }
    });

  // Combined gesture
  const combinedGesture = Gesture.Exclusive(doubleTapGesture, tapGesture);

  // Optimized scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Optimized API call with minimal network usage
  const fetchShorts = useCallback(async (reset = false) => {
    const now = Date.now();
    if (now - lastFetchTime.current < 1000 && !reset) return;
    
    if (isFetchingMore && !reset) return;

    try {
      if (reset) {
        setLoading(true);
        setShorts([]);
        setPage(1);
        setHasMore(true);
        setLoadedVideos(new Set());
        setVisibleVideoIds([]);
        apiCallsRef.current = 0;
        videoPreloader.clearAll();
      } else {
        setIsFetchingMore(true);
      }
      setError(null);
      lastFetchTime.current = now;

      const userId = user?.id || '50816';
      const currentPage = reset ? 1 : page;
      const apiUrl = `${ENDPOINTS.GET_SHORTS}/${userId}?page=${currentPage}&limit=${PAGE_SIZE}`;

      console.log(`[TipShorts] API Call #${++apiCallsRef.current}: Fetching page ${currentPage}`);
      
      const response = await ApiService.get(apiUrl);

      if (!response || (!response.data && response.status !== 200)) {
        throw new Error('Failed to load shorts');
      }

      const publicShots: PublicShot[] = Array.isArray(response.data)
        ? response.data
        : response.data.status === 200 && Array.isArray(response.data.data)
          ? response.data.data
          : [];      const mappedShorts: ShortVideo[] = (await Promise.all(
        publicShots
          .map(async (shot: PublicShot) => ({
            id: shot.id?.toString() || Math.random().toString(),
            title: shot.name || 'Untitled Short',            thumbnail: shot.video_Thumbnail && shot.video_Thumbnail !== 'undefined'
              ? (await getSecureMediaUrl(shot.video_Thumbnail)) || null
              : null,
            channel: {
              id: shot.channelId?.toString() || 'unknownChannel',
              name: shot.channelName || 'Unknown Channel',              avatar: shot.channel_profile && shot.channel_profile !== 'null'
                ? (await getSecureMediaUrl(shot.channel_profile)) || getFallbackAvatarUrl(shot.channelId || Math.random().toString())
                : getFallbackAvatarUrl(shot.channelId || Math.random().toString()),
              verified: false,
              subscribers: shot.total_channel_followers || 0,
            },
            views: shot.total_views || 0,
            likes: shot.total_likes || 0,
            duration: shot.play_duration || '0:00',
            createdAt: shot.createddate || new Date().toISOString(),
            category: shot.category_id?.toString() || '1',
            isPaidPromotional: shot.is_paid_promotional === 1,
            postedAt: shot.createddate || new Date().toISOString(),
            description: shot.video_description && shot.video_description !== 'undefined'
              ? shot.video_description
              : 'No description available',
            videoUrl: (await getSecureMediaUrl(shot.video_link || '')) || '',
            comments: shot.total_comments || 0,
            musicName: shot.name || 'Original Sound',
          }))
      )).filter(short => short.videoUrl && short.videoUrl.startsWith('http'));

      setShorts(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newUniqueShorts = mappedShorts.filter(s => !existingIds.has(s.id));
        const result = reset ? newUniqueShorts : [...prev, ...newUniqueShorts];
        
        // Preload first video if this is a reset
        if (result.length > 0 && reset) {
          setTimeout(() => {
            const firstVideo = result[0];
            videoPreloader.preloadVideo(firstVideo.id, firstVideo.videoUrl);
          }, 500);
        }
        
        return result;
      });

      setHasMore(mappedShorts.length === PAGE_SIZE);
      if (mappedShorts.length > 0) {
        setPage(prev => prev + 1);
      }

      console.log(`[TipShorts] Successfully loaded ${mappedShorts.length} shorts`);
    } catch (fetchError: any) {
      console.error(`[TipShorts] API Error #${apiCallsRef.current}:`, fetchError);
      setError('Failed to load shorts. Please try again.');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  }, [page, user, isFetchingMore, videoPreloader]);

  // Optimized like handler with instant response
  const handleLikeShort = useCallback(async (shortId: string, creatorId: string, currentLikes: number) => {
    if (!user?.id || likingShorts[shortId]) return;

    const wasLiked = likedShorts[shortId] || false;
    const newLikedState = !wasLiked;

    // Instant optimistic update
    setLikedShorts(prev => ({ ...prev, [shortId]: newLikedState }));
    setShorts(prevShorts =>
      prevShorts.map(short =>
        short.id === shortId
          ? { ...short, likes: short.likes + (newLikedState ? 1 : -1) }
          : short
      )
    );

    setLikingShorts(prev => ({ ...prev, [shortId]: true }));

    try {
      const response = await ApiService.likeShortVideo({
        reelId: parseInt(shortId),
        userId: parseInt(user.id.toString()),
        like: newLikedState ? 1 : 0,
        reelCreatorId: parseInt(creatorId),
      });

      if (response.status !== 200 && response.status !== 1) {
        throw new Error('API response indicates failure');
      }
    } catch (error: any) {
      console.error('Error updating like status:', error);
      
      // Rollback on error
      setLikedShorts(prev => ({ ...prev, [shortId]: wasLiked }));
      setShorts(prevShorts =>
        prevShorts.map(short =>
          short.id === shortId
            ? { ...short, likes: short.likes + (wasLiked ? 1 : -1) }
            : short
        )
      );
    } finally {
      setLikingShorts(prev => {
        const newState = { ...prev };
        delete newState[shortId];
        return newState;
      });
    }
  }, [user, likedShorts, likingShorts]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setActiveIndex(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
    fetchShorts(true);
  }, [fetchShorts]);

  // End reached handler
  const handleEndReached = useCallback(() => {
    if (!loading && !isFetchingMore && hasMore && shorts.length > 0) {
      fetchShorts(false);
    }
  }, [loading, isFetchingMore, hasMore, fetchShorts, shorts.length]);

  // Enhanced Short Card Component with fixed positioning
  const EnhancedShortCard = memo(({
    item,
    index,
    isActive,
  }: {
    item: ShortVideo;
    index: number;
    isActive: boolean;
  }) => {
    const [showThumbnail, setShowThumbnail] = useState(true);
    const isVisible = visibleVideoIds.includes(item.id);

    const handleVideoLoadLocal = useCallback(() => {
      setShowThumbnail(false);
      handleVideoLoad(item.id);
    }, [item.id]);

    const handleVideoProgress = useCallback((data: any) => {
      if (isActive && data.currentTime && data.seekableDuration) {
        const progress = data.currentTime / data.seekableDuration;
        setVideoProgress(prev => ({
          ...prev,
          [item.id]: Math.min(Math.max(progress, 0), 1)
        }));
      }
    }, [isActive, item.id]);

    return (
      <View style={styles.shortCardContainer}>
        {/* Video Player with tap gesture */}
        <GestureDetector gesture={combinedGesture}>
          <View style={styles.videoContainer}>
            <OptimizedVideoPlayer
              source={{ uri: item.videoUrl }}
              isActive={isVisible} // Use visibility instead of active index
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
              isPlaying={isGloballyPlaying && isVisible}
              isVisible={showPlayPause && isActive}
            />
          </View>
        </GestureDetector>

        {/* Progress Bar */}
        <VideoProgressBar 
          progress={videoProgress[item.id] || 0}
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
            paddingBottom: Math.max(insets.bottom + 70, 40),
            bottom: 0, // Fixed to bottom
          }]}>
            <View style={styles.leftContent}>
              {/* Channel info row */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile' as never, { userId: item.channel.id } as never)}
                style={styles.channelInfo}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.channel.avatar }} style={styles.channelAvatar} />
                <View style={styles.channelDetails}>
                  <Text style={styles.channelName}>@{item.channel.name}</Text>
                  {item.musicName && (
                    <Text style={styles.musicName}>♫ {item.musicName}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.followButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              
              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            {/* Action Buttons - right side with improved spacing */}
            <View style={styles.rightActions}>
              <AnimatedLikeButton
                isLiked={!!likedShorts[item.id]}
                onPress={() => handleLikeShort(item.id, item.channel.id, item.likes)}
                likeCount={item.likes}
                disabled={!!likingShorts[item.id]}
              />
              
              <TouchableOpacity 
                style={styles.actionButton}
                activeOpacity={0.7}
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
                  try {
                    await Share.share({
                      message: `Check out this amazing short by ${item.channel.name}! 🎥`,
                      url: item.videoUrl,
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="share-2" size={24} color="#FFF" />
                </View>
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                activeOpacity={0.7}
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

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Initial fetch
  useEffect(() => {
    fetchShorts(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoPreloader.clearAll();
    };
  }, [videoPreloader]);

  // Render loading state with skeletons
  if (loading && shorts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <FlatList
          data={Array(3).fill(null)}
          keyExtractor={(_, index) => `skeleton-${index}`}
          renderItem={() => <ShortsSkeleton />}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && shorts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <View style={styles.errorContainer}>
          <Icon name="wifi-off" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchShorts(true)}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <Icon name="refresh-cw" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      
      <Animated.FlatList
        ref={flatListRef}
        data={shorts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <EnhancedShortCard
            item={item}
            index={index}
            isActive={index === activeIndex}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        directionalLockEnabled
        disableIntervalMomentum
        onScroll={scrollHandler}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialScrollIndex={0}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF3040" />
            </View>
          ) : null
        }
      />

      {/* Debug info (remove in production) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            API: {apiCallsRef.current} | Active: {activeIndex + 1}/{shorts.length} | Visible: {visibleVideoIds.length}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Skeleton Styles
  skeletonContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  skeletonVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3040',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Video Styles
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

  // Play/Pause Overlay Styles
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

  // Progress Bar Styles
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

  // Overlay Styles
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
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 50,
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

  // Content Styles - Fixed positioning
  leftContent: {
    flex: 1,
    marginRight: 16,
    pointerEvents: 'auto',
    justifyContent: 'flex-end', // Align to bottom
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  channelAvatar: {
    width: 40, // Slightly smaller
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 10, // Reduced margin
  },
  channelDetails: {
    flex: 1,
  },
  channelName: {
    color: '#FFF',
    fontSize: 15, // Slightly smaller
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  musicName: {
    color: '#FFF',
    fontSize: 11, // Smaller
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  followButton: {
    backgroundColor: '#FF3040',
    paddingVertical: 6, // Smaller padding
    paddingHorizontal: 14,
    borderRadius: 16, // Smaller radius
  },
  followText: {
    color: 'white',
    fontSize: 11, // Smaller text
    fontWeight: '600',
  },
  description: {
    color: '#FFF',
    fontSize: 13, // Smaller text
    lineHeight: 16,
    marginTop: 4, // Reduced margin
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Action Styles - Fixed positioning
  rightActions: {
    alignItems: 'center',
    pointerEvents: 'auto',
    justifyContent: 'flex-end', // Align to bottom
    paddingBottom: 10, // Add some padding from bottom
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20, // Consistent spacing
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
    fontSize: 10, // Smaller text
    marginTop: 3, // Reduced margin
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Footer Styles
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },

  // Debug Styles
  debugInfo: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 60 : 90,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFF',
    fontSize: 9,
  },
});

export default TipShortsEnhanced;