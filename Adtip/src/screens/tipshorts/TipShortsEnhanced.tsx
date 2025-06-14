import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
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
  Alert,
  AppState,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video'; // Fallback to react-native-video
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import { ENDPOINTS } from '../../constants/api';
import { useShorts } from '../../contexts/ShortsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_SIZE = 8;

// Try to get native components, fallback if not available
let ExoPlayerView: any = null;
let ExoPlayerPreloader: any = null;

try {
  const { requireNativeComponent } = require('react-native');
  ExoPlayerView = requireNativeComponent('ExoPlayerView');
  ExoPlayerPreloader = NativeModules.ExoPlayerPreloader;
} catch (error) {
  console.warn('ExoPlayer native components not available, falling back to react-native-video');
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

// Animated Like Button Component
const AnimatedLikeButton = memo(({
  isLiked,
  onPress,
  likeCount,
  disabled = false,
  size = 48,
}: {
  isLiked: boolean;
  onPress: () => void;
  likeCount: number;
  disabled?: boolean;
  size?: number;
}) => {
  const scale = useSharedValue(1);
  const heartColor = useSharedValue(isLiked ? 1 : 0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Animate scale
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    if (!isLiked) {
      heartColor.value = withTiming(1, { duration: 300 });
    } else {
      heartColor.value = withTiming(0, { duration: 200 });
    }

    runOnJS(onPress)();
  }, [disabled, isLiked, onPress]);

  return (
    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        { 
          width: size, 
          height: size,
          backgroundColor: isLiked ? '#FF6B6B' : 'rgba(255,255,255,0.2)',
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
        }, 
        animatedStyles
      ]}>
        <Icon 
          name={isLiked ? "heart" : "heart"} 
          size={size * 0.5} 
          color="#FFFFFF" 
        />
      </Animated.View>
      
      <Text style={styles.actionText}>{likeCount}</Text>
    </TouchableOpacity>
  );
});

// Enhanced Video Player Component with fallback
const EnhancedVideoPlayer = memo(({
  source,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  style,
  preload = false,
}: {
  source: { uri: string };
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: () => void;
  onProgress?: (data: any) => void;
  style?: any;
  preload?: boolean;
}) => {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Use ExoPlayer if available, otherwise fallback to react-native-video
  if (ExoPlayerView) {
    return (
      <Animated.View style={[style, animatedStyle]}>
        <ExoPlayerView
          source={source}
          paused={isPaused || !isActive}
          muted={isMuted}
          preload={preload}
          style={StyleSheet.absoluteFill}
          onLoad={onLoad}
          onProgress={onProgress}
        />
      </Animated.View>
    );
  }

  // Fallback to react-native-video
  return (
    <Animated.View style={[style, animatedStyle]}>
      <Video
        source={source}
        paused={isPaused || !isActive}
        muted={isMuted}
        repeat
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        onLoad={onLoad}
        onProgress={onProgress}
      />
    </Animated.View>
  );
});

// Progress Bar Component
const VideoProgressBar = memo(({ 
  progress = 0, 
  duration = 0 
}: { 
  progress: number; 
  duration: number; 
}) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress * SCREEN_WIDTH, { duration: 100 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground} />
      <Animated.View style={[styles.progressFill, progressStyle]} />
    </View>
  );
});

// Main TipShorts Enhanced Component
const TipShortsEnhanced = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isGloballyMuted, isGloballyPlaying, toggleGlobalPlayPause, toggleGlobalMute } = useShorts();

  // States
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedShorts, setLikedShorts] = useState<{ [key: string]: boolean }>({});
  const [likingShorts, setLikingShorts] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const preloadedVideos = useRef<Set<string>>(new Set());

  // Preload next videos (only if ExoPlayer is available)
  const preloadNextVideos = useCallback((currentIndex: number) => {
    if (!ExoPlayerPreloader) return;

    const nextIndexes = [currentIndex + 1, currentIndex + 2];
    
    nextIndexes.forEach(index => {
      if (shorts[index] && !preloadedVideos.current.has(shorts[index].id)) {
        ExoPlayerPreloader.preloadVideo(shorts[index].videoUrl);
        preloadedVideos.current.add(shorts[index].id);
      }
    });
  }, [shorts]);

  // Scroll handler with preloading
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      isScrolling.value = true;
      
      const currentIndex = Math.round(event.contentOffset.y / SCREEN_HEIGHT);
      
      if (currentIndex !== activeIndex) {
        runOnJS(setActiveIndex)(currentIndex);
        runOnJS(preloadNextVideos)(currentIndex);
      }
    },
    onEndDrag: () => {
      isScrolling.value = false;
    },
  });

  // Gesture for double tap to like
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

  // Fetch shorts from API
  const fetchShorts = useCallback(async (reset = false) => {
    if (isFetchingMore && !reset) return;

    try {
      if (reset) {
        setLoading(true);
        setShorts([]);
        setPage(1);
        setHasMore(true);
        preloadedVideos.current.clear();
      } else {
        setIsFetchingMore(true);
      }
      setError(null);

      const userId = user?.id || '50816';
      const currentPage = reset ? 1 : page;
      const apiUrl = `${ENDPOINTS.GET_SHORTS}/${userId}?page=${currentPage}&limit=${PAGE_SIZE}`;

      const response = await ApiService.get(apiUrl);

      if (!response || (!response.data && response.status !== 200)) {
        throw new Error('Failed to load shorts');
      }

      const publicShots: PublicShot[] = Array.isArray(response.data)
        ? response.data
        : response.data.status === 200 && Array.isArray(response.data.data)
          ? response.data.data
          : [];

      const mappedShorts: ShortVideo[] = publicShots
        .map((shot: PublicShot) => ({
          id: shot.id?.toString() || Math.random().toString(),
          title: shot.name || 'Untitled Short',
          thumbnail: shot.video_Thumbnail && shot.video_Thumbnail !== 'undefined'
            ? shot.video_Thumbnail
            : 'https://via.placeholder.com/360x640.png?text=No+Thumbnail',
          channel: {
            id: shot.channelId?.toString() || 'unknownChannel',
            name: shot.channelName || 'Unknown Channel',
            avatar: shot.channel_profile && shot.channel_profile !== 'null'
              ? shot.channel_profile
              : `https://i.pravatar.cc/80?u=${shot.channelId || Math.random()}`,
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
          videoUrl: shot.video_link || '',
          comments: shot.total_comments || 0,
          musicName: shot.name || 'Original Sound',
        }))
        .filter(short => short.videoUrl && short.videoUrl.startsWith('http'));

      setShorts(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newUniqueShorts = mappedShorts.filter(s => !existingIds.has(s.id));
        const result = reset ? newUniqueShorts : [...prev, ...newUniqueShorts];
        
        // Preload first few videos if ExoPlayer is available
        if (result.length > 0 && ExoPlayerPreloader) {
          setTimeout(() => {
            result.slice(0, 3).forEach((short) => {
              if (!preloadedVideos.current.has(short.id)) {
                ExoPlayerPreloader.preloadVideo(short.videoUrl);
                preloadedVideos.current.add(short.id);
              }
            });
          }, 100);
        }
        
        return result;
      });

      setHasMore(mappedShorts.length === PAGE_SIZE);
      if (mappedShorts.length > 0) {
        setPage(prev => prev + 1);
      }
    } catch (fetchError: any) {
      console.error('Error fetching shorts:', fetchError);
      setError('Failed to load shorts. Please try again.');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  }, [page, user, isFetchingMore]);

  // Handle like/unlike
  const handleLikeShort = useCallback(async (shortId: string, creatorId: string, currentLikes: number) => {
    if (!user?.id || likingShorts[shortId]) return;

    const wasLiked = likedShorts[shortId] || false;
    const newLikedState = !wasLiked;

    // Optimistic update
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

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setActiveIndex(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
    fetchShorts(true);
  }, [fetchShorts]);

  // Handle end reached
  const handleEndReached = useCallback(() => {
    if (!loading && !isFetchingMore && hasMore) {
      fetchShorts(false);
    }
  }, [loading, isFetchingMore, hasMore, fetchShorts]);

  // Enhanced Short Card Component
  const EnhancedShortCard = memo(({
    item,
    index,
    isActive,
  }: {
    item: ShortVideo;
    index: number;
    isActive: boolean;
  }) => {
    const cardScale = useSharedValue(1);
    const overlayOpacity = useSharedValue(0);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

    useEffect(() => {
      if (isActive) {
        cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
        overlayOpacity.value = withTiming(1, { duration: 300 });
      } else {
        cardScale.value = withSpring(0.95, { damping: 15, stiffness: 100 });
        overlayOpacity.value = withTiming(0.7, { duration: 300 });
      }
    }, [isActive]);

    return (
      <GestureDetector gesture={doubleTapGesture}>
        <Animated.View style={[styles.shortCardContainer, cardAnimatedStyle]}>
          {/* Video Player */}
          <EnhancedVideoPlayer
            source={{ uri: item.videoUrl }}
            isActive={isActive}
            isPaused={!isGloballyPlaying}
            isMuted={isGloballyMuted}
            style={styles.video}
            preload={index <= activeIndex + 2}
            onProgress={(data) => {
              setVideoProgress(prev => ({
                ...prev,
                [item.id]: data.currentTime / data.seekableDuration
              }));
            }}
          />

          {/* Thumbnail overlay while loading */}
          {item.thumbnail && (
            <Image
              source={{ uri: item.thumbnail }}
              style={[styles.video, { position: 'absolute', zIndex: 1 }]}
              blurRadius={isActive ? 0 : 10}
            />
          )}

          {/* Progress Bar */}
          <VideoProgressBar 
            progress={videoProgress[item.id] || 0}
            duration={1}
          />

          {/* Top Controls */}
          <View style={styles.topControlsOverlay}>
            <TouchableOpacity
              onPress={toggleGlobalPlayPause}
              style={styles.controlButton}
            >
              <Icon name={isGloballyPlaying && isActive ? "pause" : "play"} size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleGlobalMute}
              style={styles.controlButton}
            >
              <Icon name={isGloballyMuted ? "volume-x" : "volume-2"} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Content Overlay */}
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
            <View style={styles.bottomContent}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile' as never, { userId: item.channel.id } as never)}
                style={styles.channelInfo}
              >
                <Image source={{ uri: item.channel.avatar }} style={styles.channelAvatar} />
                <View style={styles.channelTextContainer}>
                  <Text style={styles.channelName}>@{item.channel.name}</Text>
                  {item.musicName && (
                    <Text style={styles.musicName}>♫ {item.musicName}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.subscribeButton}>
                  <Text style={styles.subscribeText}>Subscribe</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedLikeButton
                isLiked={!!likedShorts[item.id]}
                onPress={() => handleLikeShort(item.id, item.channel.id, item.likes)}
                likeCount={item.likes}
                disabled={!!likingShorts[item.id]}
              />
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="message-circle" size={28} color="#FFF" />
                <Text style={styles.actionText}>{item.comments}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Check out this short by ${item.channel.name}: ${item.videoUrl}`
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
              >
                <Icon name="share-2" size={28} color="#FFF" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="more-horizontal" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
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

  // Show warning if ExoPlayer is not available
  useEffect(() => {
    if (!ExoPlayerView && __DEV__) {
      console.warn('ExoPlayer not available - falling back to react-native-video');
    }
  }, []);

  // Render loading state
  if (loading && shorts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#000' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#FF4057'} />
          <Text style={[styles.loadingText, { color: colors.text?.primary || '#FFF' }]}>
            Loading shorts...
          </Text>
          {!ExoPlayerView && (
            <Text style={[styles.fallbackText, { color: colors.text?.secondary || '#AAA' }]}>
              Using fallback video player
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && shorts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#000' }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error || '#FF6B6B'} />
          <Text style={[styles.errorText, { color: colors.error || '#FF6B6B' }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchShorts(true)}
            style={[styles.retryButton, { backgroundColor: colors.primary || '#FF4057' }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
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
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialScrollIndex={0}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator 
              size="small" 
              color={colors.primary || '#FF4057'} 
              style={styles.footerLoader} 
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFF',
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 12,
    color: '#AAA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shortCardContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
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
    backgroundColor: '#FF4057',
  },
  topControlsOverlay: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  controlButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 15,
  },
  bottomContent: {
    flex: 1,
    marginRight: 16,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 12,
  },
  channelTextContainer: {
    flex: 1,
  },
  channelName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  musicName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subscribeButton: {
    backgroundColor: '#FF4057',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginLeft: 8,
  },
  subscribeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actions: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

export default TipShortsEnhanced;