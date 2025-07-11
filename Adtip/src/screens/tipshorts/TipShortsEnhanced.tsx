import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  FlatList,
  Platform,
  BackHandler,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  ViewToken,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import { Share2 } from 'lucide-react-native';

// Contexts and hooks
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useShorts } from '../../contexts/ShortsContext';
import {
  useShortsInfiniteQuery,
  useGuestShortsQuery,
  useLikeShortMutation,
  useShortsQueryActions,
  type ShortVideo as TanStackShortVideo
} from '../../hooks/useShortsQuery';
import ShortsCardSkeleton from '../../components/skeletons/ShortsCardSkeleton';
import EnhancedShortCard from './components/EnhancedShortCard';
import LoginPromptModal from '../../components/modals/LoginPromptModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use the TanStack query types
type ShortVideo = TanStackShortVideo;

type TipShortsRouteParams = {
  shorts?: ShortVideo[];
  startIndex?: number;
  shortId?: string;
};

type TipShortsRouteProp = RouteProp<{ params: TipShortsRouteParams }, 'params'>;

// Optimized Video Player Component with fixed playback logic
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

  // Fixed logic: play when active, not paused, loaded, and no error
  const shouldPlay = isActive && !isPaused && isLoaded && !hasError;

  const handleLoad = useCallback((data: any) => {
    console.log('[OptimizedVideoPlayer] Video loaded successfully for:', source.uri.split('/').pop());
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(data);
  }, [onLoad, source.uri]);

  const handleError = useCallback((error: any) => {
    console.warn('[OptimizedVideoPlayer] Video error for:', source.uri.split('/').pop(), error);
    setHasError(true);
    setIsLoaded(false);
  }, [source.uri]);

  const handleProgress = useCallback((data: any) => {
    if (isActive && onProgress) {
      onProgress(data);
    }
  }, [isActive, onProgress]);

  // Reset states when source changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [source.uri]);

  // Debug logging
  useEffect(() => {
    if (__DEV__) {
      console.log('[OptimizedVideoPlayer] State:', {
        isActive,
        isPaused,
        isLoaded,
        hasError,
        shouldPlay,
        fileName: source.uri.split('/').pop()
      });
    }
  }, [isActive, isPaused, isLoaded, hasError, shouldPlay, source.uri]);

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
      mixWithOthers="duck"
      controls={false}
      disableFocus={true}
      fullscreen={false}
      hideShutterView={true}
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
            style={{
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
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
  if (!isActive || progress <= 0) return null;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground} />
      <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
    </View>
  );
});

// Skeleton Loading Component
const ShortsSkeleton = memo(() => {
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

// Main TipShorts Enhanced Component with TanStack Query
const TipShortsEnhanced = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<TipShortsRouteProp>();
  const { user, isGuest } = useAuth();
  const { 
    isGloballyMuted, 
    isGloballyPlaying, 
    toggleGlobalPlayPause, 
    toggleGlobalMute,
    setGlobalPlayState 
  } = useShorts();
  const insets = useSafeAreaInsets();

  // Safe parameter destructuring to prevent undefined access
  const { shorts: passedShorts, startIndex = 0, shortId } = route.params || {};

  // Debug logging for route params
  useEffect(() => {
    if (__DEV__) {
      console.log('[TipShortsEnhanced] Route params:', {
        passedShorts: passedShorts?.length || 0,
        startIndex,
        shortId,
        hasParams: !!route.params
      });
      
      // Additional deep link logging
      if (shortId) {
        console.log('[TipShortsEnhanced] Deep link detected for shortId:', shortId);
      }
    }
  }, [route.params, passedShorts, startIndex, shortId]);

  // TanStack Query hooks - use different hooks based on guest mode
  const authenticatedShortsQuery = useShortsInfiniteQuery(user?.id?.toString() || '50816');
  const guestShortsQuery = useGuestShortsQuery();

  // Choose the appropriate query based on guest mode
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = isGuest ? {
    data: guestShortsQuery.data,
    isLoading: guestShortsQuery.isLoading,
    error: guestShortsQuery.error,
    fetchNextPage: () => Promise.resolve({ data: undefined, pageParam: undefined, direction: 'forward' as const }),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: guestShortsQuery.refetch,
    isRefetching: guestShortsQuery.isRefetching,
  } : authenticatedShortsQuery;

  const likeMutation = useLikeShortMutation();
  const { updateShortLikes } = useShortsQueryActions();

  // Local states
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [showPlayPause, setShowPlayPause] = useState(false);
  const playPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Login prompt modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);

  // Flatten data from TanStack Query
  const shorts: ShortVideo[] = useMemo(() => {
    if (passedShorts && passedShorts.length > 0) {
      // For guest users, limit to first 5 shorts even if more are passed
      return isGuest ? passedShorts.slice(0, 5) : passedShorts;
    }

    let allShorts: ShortVideo[] = [];

    // Handle guest mode data structure
    if (isGuest && data?.pages) {
      allShorts = data.pages.flatMap(page => page.data || []);
      // Limit guest users to first 5 shorts
      return allShorts.slice(0, 5);
    }

    // Handle authenticated user data structure
    allShorts = data?.pages?.flat() || [];
    return allShorts;
  }, [data?.pages, passedShorts, isGuest]);

  useEffect(() => {
    console.log('[TipShortsEnhanced] shorts array:', shorts);
    console.log('[TipShortsEnhanced] isGuest:', isGuest);
    console.log('[TipShortsEnhanced] data structure:', data);
    console.log('[TipShortsEnhanced] isLoading:', isLoading);
    console.log('[TipShortsEnhanced] error:', error);
  }, [shorts, isGuest, data, isLoading, error]);

  // Viewability config for video control
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Reduced threshold for better responsiveness
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;

  // Handle viewability changes
  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const mostVisibleItem = viewableItems.find(item => item.isViewable);
    if (mostVisibleItem && mostVisibleItem.index !== null) {
      const newActiveIndex = mostVisibleItem.index;

      // Debug logging for guest mode
      if (isGuest && __DEV__) {
        console.log('[TipShortsEnhanced] Guest mode - viewable item changed:', {
          newActiveIndex,
          currentActiveIndex: activeIndex,
          totalShorts: shorts.length,
          isAtLimit: newActiveIndex >= 5
        });
      }

      // For guest users, prevent viewing beyond the 5th video (index 4)
      if (isGuest && newActiveIndex >= 5) {
        console.log('[TipShortsEnhanced] Guest user reached limit, showing login prompt');
        showLoginPromptForAction('watch more shorts');
        // Scroll back to the 4th video (index 4)
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: 4,
            animated: true,
          });
        }
        return;
      }

      if (newActiveIndex !== activeIndex) {
        console.log('[TipShortsEnhanced] Updating activeIndex from', activeIndex, 'to', newActiveIndex);
        setActiveIndex(newActiveIndex);
      }
    }
  }).current;

  // Handle video load
  const handleVideoLoad = useCallback((videoId: string) => {
    console.log('[TipShorts] Video loaded:', videoId);
  }, []);

  // Optimized scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Helper function to show login prompt for guest users
  const showLoginPromptForAction = useCallback((action: string) => {
    setLoginPromptMessage(`Login to ${action}`);
    setShowLoginPrompt(true);
  }, []);

  // Handle like with TanStack Query mutation
  const handleLikeShort = useCallback(async (shortId: string, creatorId: string, isCurrentlyLiked: boolean) => {
    if (isGuest) {
      showLoginPromptForAction('like shorts');
      return;
    }
    if (!user?.id) return;

    try {
      await likeMutation.mutateAsync({
        shortId,
        userId: user.id.toString(),
        creatorId,
        isLiked: !isCurrentlyLiked,
      });
    } catch (error) {
      console.error('Error liking short:', error);
    }
  }, [user?.id, isGuest, likeMutation, showLoginPromptForAction]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setActiveIndex(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
    refetch();
  }, [refetch]);

  // Enhanced tap gesture
  const handleTapGesture = useCallback(() => {
    toggleGlobalPlayPause();
    if (playPauseTimeoutRef.current) clearTimeout(playPauseTimeoutRef.current);
    setShowPlayPause(true);
    playPauseTimeoutRef.current = setTimeout(() => {
      setShowPlayPause(false);
    }, 800);
  }, [toggleGlobalPlayPause]);

  const handleDoubleTapGesture = useCallback(() => {
    const currentShort = shorts[activeIndex];
    if (currentShort) {
      // We need to track the current like state properly
      // For now, assume false until we implement proper like state tracking
      handleLikeShort(
        currentShort.id, 
        currentShort.channel.id, 
        false // This should be the actual current like state
      );
    }
  }, [shorts, activeIndex, handleLikeShort]);

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(handleTapGesture)();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTapGesture)();
    });

  const combinedGesture = Gesture.Exclusive(doubleTapGesture, tapGesture);

  // End reached handler
  const handleEndReached = useCallback(() => {
    // For guest users, don't load more content beyond 5 videos
    if (isGuest) {
      showLoginPromptForAction('watch more shorts');
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isGuest, showLoginPromptForAction]);

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

  // Set initial play state and handle cleanup
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setGlobalPlayState(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setGlobalPlayState(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      if (playPauseTimeoutRef.current) {
        clearTimeout(playPauseTimeoutRef.current);
      }
    };
  }, [navigation, setGlobalPlayState]);

  // Implement scroll to specific short for deep linking
  const scrollToShort = useCallback((id: string) => {
    if (!id || !shorts || shorts.length === 0 || !flatListRef.current) {
      console.warn('[TipShortsEnhanced] Cannot scroll to short: missing data or refs');
      return;
    }

    const index = shorts.findIndex(s => s.id === id);
    if (index !== -1) {
      console.log(`[TipShortsEnhanced] Scrolling to short ${id} at index ${index}`);
      setActiveIndex(index);
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true, // Changed to true for better UX
        });
      } catch (error) {
        console.warn('[TipShortsEnhanced] Error scrolling to index:', error);
        // Fallback to offset-based scrolling
        flatListRef.current.scrollToOffset({
          offset: index * SCREEN_HEIGHT,
          animated: true, // Changed to true for better UX
        });
      }
    } else {
      console.warn(`[TipShortsEnhanced] Deep linked short with id ${id} not found in the current list.`);
      // If the specific short isn't in the current list, we could potentially
      // implement a search or fetch specific short functionality here
    }
  }, [shorts]);

  // Enhanced deep link handling with better timing
  useEffect(() => {
    if (shortId && shorts.length > 0) {
      // Add a small delay to ensure the list is fully rendered
      const timer = setTimeout(() => {
        scrollToShort(shortId);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shortId, scrollToShort, shorts.length]);

  // Defensive: If shorts is empty after deep link, trigger a refetch
  useEffect(() => {
    if ((!shorts || shorts.length === 0) && !isLoading && !error) {
      console.log('[TipShortsEnhanced] No shorts available, triggering refetch');
      refetch();
    }
  }, [shorts, isLoading, error, refetch]);

  // Render loading state
  if (isLoading && shorts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <FlatList
          data={Array(3).fill(null)}
          keyExtractor={(_, index) => `skeleton-${index}`}
          renderItem={() => <ShortsSkeleton />}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
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
          <Icon name="wifi-off" size={48} color="#FF3040" />
          <Text style={styles.errorText}>
            Failed to load shorts. Please check your connection.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
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
            onVideoLoad={handleVideoLoad}
            onLike={handleLikeShort}
            combinedGesture={combinedGesture}
            showPlayPause={showPlayPause}
            videoProgress={videoProgress}
            setVideoProgress={setVideoProgress}
            isGloballyPlaying={isGloballyPlaying}
            isGloballyMuted={isGloballyMuted}
            toggleGlobalMute={toggleGlobalMute}
            insets={insets}
            isGuest={isGuest}
            onGuestAction={showLoginPromptForAction}
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
        initialScrollIndex={startIndex}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF3040" />
            </View>
          ) : null
        }
      />

      {/* Guest Mode Short Count Indicator */}
      {isGuest && shorts.length > 0 && (
        <View style={styles.guestCountIndicator}>
          <Text style={styles.guestCountText}>
            {activeIndex + 1} of {Math.min(shorts.length, 5)}
          </Text>
        </View>
      )}

      {/* Debug info (remove in production) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Active: {activeIndex + 1}/{shorts.length} | Loading: {isLoading.toString()}
          </Text>
        </View>
      )}

      {/* Login Prompt Modal for Guest Users */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Skeleton Loading Styles
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

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF3040',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  },

  // Action Button Styles
  actionButton: {
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 60,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Footer Loader
  footerLoader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  // Guest Count Indicator
  guestCountIndicator: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  guestCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Debug Info
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  debugText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default TipShortsEnhanced;
