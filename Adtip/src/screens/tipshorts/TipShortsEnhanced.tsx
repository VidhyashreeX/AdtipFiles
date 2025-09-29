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
  StyleSheet,
  ViewToken,
  Alert,
  AppState,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import {
  Gesture,
} from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

// Contexts and hooks
import { useAuth } from '../../contexts/AuthContext';
import { useShorts } from '../../contexts/ShortsContext';
import {
  useShortsInfiniteQuery,
  useGuestShortsQuery,
  useLikeShortMutation,
  useSingleShortQuery,
  SHORTS_QUERY_KEY,
  type ShortVideo as TanStackShortVideo
} from '../../hooks/useShortsQuery';
import { useQueryClient } from '@tanstack/react-query';

import EnhancedShortCard from './components/EnhancedShortCard';
import LoginPromptModal from '../../components/modals/LoginPromptModal';
import VideoCommentsModal from '../../components/tiptube/VideoCommentsModal';

import VideoErrorBoundary from '../../components/common/VideoErrorBoundary';
import ApiService from '../../services/ApiService';
import InshortsRewardPopup from '../../components/common/InshortsRewardPopup';
import { useUserPremiumStatus } from '../../contexts/UserDataContext';
import { useInshortsReward } from '../../hooks/useInshortsReward';
import { TipShortsLogger } from '../../utils/logger';
import { TipShortsAudioManager } from './components/TipShortsControls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use the TanStack query types
type ShortVideo = TanStackShortVideo;

type TipShortsRouteParams = {
  shorts?: ShortVideo[];
  startIndex?: number;
  shortId?: string;
};

type TipShortsRouteProp = RouteProp<{ params: TipShortsRouteParams }, 'params'>;

// Reward logic is now handled by useVideoRewardAd hook

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
    opacity: interpolate(pulseAnimation.value, [0, 1], [0.3, 0.8], 'clamp'),
  }));

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonVideo, animatedStyle]} />
    </View>
  );
});

ShortsSkeleton.displayName = 'ShortsSkeleton';

// Main TipShorts Enhanced Component with TanStack Query
const TipShortsEnhanced = () => {
  // const { colors } = useTheme(); // Unused for now
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<TipShortsRouteProp>();
  const isFocused = useIsFocused(); // ✅ ADDED: Use the hook to track screen focus.
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const {
    isGloballyMuted,
    isGloballyPlaying,
    toggleGlobalPlayPause,
    toggleGlobalMute,
    setGlobalPlayState
  } = useShorts();
  const insets = useSafeAreaInsets();

  // Get premium status using the same logic as the header toggle
  const { isPremium } = useUserPremiumStatus();
  
  // Use the Inshorts reward hook
  const {
    shortsCount,
    showInshortsRewardPopup,
    earnedAmount,
    handleShortViewed,
    handleInshortsRewardAction,
    closeInshortsRewardPopup,
  } = useInshortsReward({
    isGuest,
    userId: user?.id,
  });

  // Debug Inshorts reward state changes and manage audio when popup appears
  useEffect(() => {
    console.log('🎁 [TipShortsEnhanced] Inshorts reward state changed:', {
      shortsCount,
      showInshortsRewardPopup,
      earnedAmount,
      isPremium,
      userId: user?.id,
      isGuest
    });

    // Pause audio when reward popup appears, resume when it disappears
    if (showInshortsRewardPopup) {
      TipShortsLogger.debug('Inshorts reward popup appeared - pausing audio');
      setGlobalPlayState(false);
    } else {
      // Only resume if screen is focused and app is active
      if (isFocused && AppState.currentState === 'active') {
        TipShortsLogger.debug('Inshorts reward popup dismissed - resuming audio');
        setGlobalPlayState(true);
      }
    }
  }, [shortsCount, showInshortsRewardPopup, earnedAmount, isPremium, user?.id, isGuest, setGlobalPlayState, isFocused]);

  // Safe parameter destructuring to prevent undefined access
  const { shorts: passedShorts, startIndex = 0, shortId } = route.params || {};

  // Debug logging for route params
  useEffect(() => {
    if (__DEV__) {
      TipShortsLogger.debug('Route params:', {
        passedShorts: passedShorts?.length || 0,
        startIndex,
        shortId,
        hasParams: !!route.params
      });

      // Additional deep link logging
      if (shortId) {
        TipShortsLogger.debug('Deep link detected for shortId:', shortId);
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

  // Single short query for deep linking
  const singleShortQuery = useSingleShortQuery(shortId ?? null, user?.id?.toString() ?? undefined);

  const likeMutation = useLikeShortMutation();
  // const { updateShortLikes } = useShortsQueryActions(); // Unused for now

  // Local states
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [showPlayPause, setShowPlayPause] = useState(false);
  const playPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Login prompt modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentShortId, setSelectedCommentShortId] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);

  // Flatten data from TanStack Query with deep link handling
  const shorts: ShortVideo[] = useMemo(() => {
    let apiShorts: ShortVideo[] = [];
    // Get shorts from API (paginated)
    if (isGuest && data?.pages) {
      apiShorts = data.pages.flatMap(page => {
        if (Array.isArray(page)) {
          return page;
        } else if (page && typeof page === 'object' && 'data' in page) {
          return page.data || [];
        }
        return [];
      });
      apiShorts = apiShorts.slice(0, 5);
    } else if (data?.pages) {
      apiShorts = data.pages.flatMap(page => {
        if (Array.isArray(page)) {
          return page;
        } else if (page && typeof page === 'object' && 'data' in page) {
          return page.data || [];
        }
        return [];
      });
    }

    // Merge passedShorts (from navigation) with API shorts, deduplicating by id
    let mergedShorts: ShortVideo[] = [];
    if (passedShorts && passedShorts.length > 0) {
      // Remove any apiShorts that are already in passedShorts (by id)
      const passedIds = new Set(passedShorts.map(s => s.id));
      const filteredApiShorts = apiShorts.filter(s => !passedIds.has(s.id));
      mergedShorts = [...passedShorts, ...filteredApiShorts];
      // For guest users, limit to first 5 shorts
      if (isGuest) mergedShorts = mergedShorts.slice(0, 5);
    } else {
      mergedShorts = apiShorts;
    }

    // Handle deep link: if we have a specific short from deep link and it's not in the current list
    if (shortId && singleShortQuery.data && !singleShortQuery.isLoading) {
      const deepLinkedShort = singleShortQuery.data;
      const isShortInList = mergedShorts.some(short => short.id === deepLinkedShort.id);
      if (!isShortInList) {
        mergedShorts = [deepLinkedShort, ...mergedShorts];
      }
    }

    // Filter out shorts with invalid video URLs to prevent URI errors
    const validShorts = mergedShorts.filter(short => {
      const hasValidVideoUrl = short?.videoUrl &&
                              typeof short.videoUrl === 'string' &&
                              short.videoUrl.trim().length > 0 &&
                              short.videoUrl !== 'null' &&
                              short.videoUrl !== 'undefined';

      if (!hasValidVideoUrl) {
        TipShortsLogger.warn('Filtering out short with invalid videoUrl:', {
          id: short?.id,
          videoUrl: short?.videoUrl,
          title: short?.title || 'Unknown'
        });
      }

      return hasValidVideoUrl;
    });

    TipShortsLogger.debug(`Filtered ${mergedShorts.length - validShorts.length} shorts with invalid video URLs`);

    return validShorts;
  }, [data?.pages, passedShorts, isGuest, shortId, singleShortQuery.data, singleShortQuery.isLoading]);

  useEffect(() => {
    TipShortsLogger.debug('shorts array:', shorts);
    TipShortsLogger.debug('isGuest:', isGuest);
    TipShortsLogger.debug('data structure:', data);
    TipShortsLogger.debug('isLoading:', isLoading);
    TipShortsLogger.debug('error:', error);
  }, [shorts, isGuest, data, isLoading, error]);

  // Handle video view for Inshorts reward system
  const handleVideoView = useCallback(() => {
    TipShortsLogger.debug('Video completed, triggering Inshorts reward check');
    handleShortViewed();
  }, [handleShortViewed]);

  // Enhanced viewability config for strict video control
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Higher threshold for stricter control
    minimumViewTime: 100, // Small delay to prevent rapid changes
    waitForInteraction: false,
  }).current;

  // Debounced state update to prevent rapid changes during scrolling
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveIndexRef = useRef(activeIndex);

  const debouncedSetActiveIndex = useCallback((newIndex: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (newIndex !== lastActiveIndexRef.current) {
        TipShortsLogger.debug(`Debounced activeIndex update from ${lastActiveIndexRef.current} to ${newIndex}`);
        setActiveIndex(newIndex);
        lastActiveIndexRef.current = newIndex;
        handleShortViewed();
      }
    }, 150); // 150ms debounce delay
  }, [handleShortViewed]);

  // Enhanced viewability change handler with debouncing
  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const mostVisibleItem = viewableItems.find(item => item.isViewable);
    if (mostVisibleItem && mostVisibleItem.index !== null) {
      const newActiveIndex = mostVisibleItem.index;

      // Debug logging for guest mode
      if (isGuest && __DEV__) {
        TipShortsLogger.debug('Guest mode - viewable item changed:', {
          newActiveIndex,
          currentActiveIndex: activeIndex,
          totalShorts: shorts.length,
          isAtLimit: newActiveIndex >= 5
        });
      }

      // For guest users, prevent viewing beyond the 5th video (index 4)
      if (isGuest && newActiveIndex >= 5) {
        TipShortsLogger.debug('Guest user reached limit, showing login prompt');
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

      // Use debounced update to prevent rapid state changes
      debouncedSetActiveIndex(newActiveIndex);
    }
  }).current;

  // Handle video load
  const handleVideoLoad = useCallback((videoId: string) => {
    TipShortsLogger.debug('Video loaded:', videoId);
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
      TipShortsLogger.error('Error liking short:', error);
    }
  }, [user?.id, isGuest, likeMutation, showLoginPromptForAction]);

  // Handle channel navigation
  const handleChannelNavigation = useCallback((channelData: { id: string; name: string; avatar?: string }) => {
    if (isGuest) {
      showLoginPromptForAction('view channels');
      return;
    }
    
    // Pause all videos before navigating to channel
    const audioManager = TipShortsAudioManager.getInstance();
    audioManager.pauseAllVideos();
    
    navigation.navigate('Channel', {
      channelId: channelData.id,
      channelData: {
        channelId: channelData.id,
        channelName: channelData.name,
        profileImage: channelData.avatar || 'https://avatar.iran.liara.run/public',
        isVerified: false
      }
    });
  }, [isGuest, navigation, showLoginPromptForAction]);

  // Handle comment functionality
  const handleCommentShort = useCallback((shortId: string) => {
    if (isGuest) {
      showLoginPromptForAction('comment on shorts');
      return;
    }
    setSelectedCommentShortId(shortId);
    setCommentModalVisible(true);
  }, [isGuest, showLoginPromptForAction]);

  // Handle comment added - update comment count in shorts data
  const handleCommentAdded = useCallback(() => {
    if (!selectedCommentShortId || !user?.id) return;

    // Update the shorts data to increment comment count
    queryClient.setQueryData([SHORTS_QUERY_KEY, user.id.toString()], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any[]) =>
          page.map((short: any) =>
            short.id === selectedCommentShortId
              ? { ...short, comments: short.comments + 1 }
              : short
          )
        ),
      };
    });
  }, [selectedCommentShortId, user?.id, queryClient]);

  // Handle follow functionality
  const handleFollowChannel = useCallback(async (channelId: string) => {
    if (isGuest) {
      showLoginPromptForAction('follow users');
      return;
    }
    if (!user?.id) return;

    try {
      // Call follow API, ensure channelId and userId are numbers
      const response = await ApiService.saveChannelFollowers({
        channelId: Number(channelId),
        userId: Number(user.id),
        follow: 1 // 1 to follow, 0 to unfollow
      });
      TipShortsLogger.debug('Follow response:', response);

      // Show success message based on response
      if (response?.message) {
        TipShortsLogger.debug('Follow action completed:', response.message);
        // You can add a toast notification here if needed
      }
    } catch (error) {
      TipShortsLogger.error('Error following channel:', error);
      // Show error message to user
      Alert.alert('Error', 'Failed to follow channel. Please try again.');
    }
  }, [user?.id, isGuest, showLoginPromptForAction]);

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

  // ✅ REPLACED: Use `useIsFocused` for reliable playback control.
  useEffect(() => {
    if (isFocused) {
      TipShortsLogger.debug('Screen is focused - resuming playback.');
      setGlobalPlayState(true);
    } else {
      TipShortsLogger.debug('Screen is NOT focused - pausing playback.');
      setGlobalPlayState(false);
    }
  }, [isFocused, setGlobalPlayState]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      TipShortsLogger.debug('App state changed to:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        TipShortsLogger.debug('App backgrounded - pausing audio');
        setGlobalPlayState(false);
      } else if (nextAppState === 'active' && isFocused) {
        // Only resume if the app is active AND this screen is focused.
        TipShortsLogger.debug('App foregrounded and screen focused - resuming audio');
        setGlobalPlayState(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isFocused, setGlobalPlayState]);

  // Cleanup effect to ensure audio stops when component unmounts
  useEffect(() => {
    return () => {
      TipShortsLogger.debug('Component unmounting - stopping all audio');
      // Clear any pending debounced updates
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setGlobalPlayState(false);
    };
  }, [setGlobalPlayState]);


  // Implement scroll to specific short for deep linking
  const scrollToShort = useCallback((id: string) => {
    if (!id || !shorts || shorts.length === 0 || !flatListRef.current) {
      TipShortsLogger.warn('Cannot scroll to short: missing data or refs');
      return;
    }

    const index = shorts.findIndex(s => s.id === id);
    if (index !== -1) {
      TipShortsLogger.debug(`Scrolling to short ${id} at index ${index}`);
      setActiveIndex(index);
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true, // Changed to true for better UX
        });
      } catch (error) {
        TipShortsLogger.warn('Error scrolling to index:', error);
        // Fallback to offset-based scrolling
        flatListRef.current.scrollToOffset({
          offset: index * SCREEN_HEIGHT,
          animated: true, // Changed to true for better UX
        });
      }
    } else {
      TipShortsLogger.warn(`Short with id ${id} not found in the current list.`);
      // This should not happen anymore since we prepend deep-linked shorts to the list
    }
  }, [shorts]);

  // Enhanced deep link handling with better timing
  useEffect(() => {
    if (shortId && shorts.length > 0) {
      // Check if the deep-linked short is in the list
      const shortIndex = shorts.findIndex(s => s.id === shortId);

      if (shortIndex !== -1) {
        // If found, scroll to it with a small delay to ensure the list is fully rendered
        const timer = setTimeout(() => {
          TipShortsLogger.debug(`Deep link found at index ${shortIndex}, scrolling to short ${shortId}`);
          scrollToShort(shortId);
        }, 100);

        return () => clearTimeout(timer);
      } else if (singleShortQuery.isLoading) {
        // Still loading the specific short, wait for it
        TipShortsLogger.debug('Still loading deep-linked short, waiting...');
      } else if (singleShortQuery.error) {
        TipShortsLogger.warn('Failed to load deep-linked short:', singleShortQuery.error);
      }
    }
  }, [shortId, scrollToShort, shorts.length, shorts, singleShortQuery.isLoading, singleShortQuery.error]);

  // Defensive: If shorts is empty after deep link, trigger a refetch
  useEffect(() => {
    if ((!shorts || shorts.length === 0) && !isLoading && !error) {
      TipShortsLogger.debug('No shorts available, triggering refetch');
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
          <VideoErrorBoundary
            key={`video-error-boundary-${item.id}`}
            onError={(error, errorInfo) => {
              TipShortsLogger.error(`Video error for short ${item.id}:`, error);
              TipShortsLogger.error('Error info:', errorInfo);
            }}
          >
            <EnhancedShortCard
              item={item}
              index={index}
              isActive={index === activeIndex}
              isLiked={item.isLiked || false} // Pass isLiked status from item data
              onVideoLoad={handleVideoLoad}
              onVideoCompletion={handleVideoView}
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
            onChannelNavigation={handleChannelNavigation}
            onComment={handleCommentShort}
            onFollow={handleFollowChannel}
          />
          </VideoErrorBoundary>
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
          {/* Test button for reward ads */}
          <TouchableOpacity
            onPress={() => {
              TipShortsLogger.debug('Manual reward ad trigger');
              showRewardAd();
            }}
            style={{
              backgroundColor: '#FF3040',
              padding: 8,
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12 }}>Test Reward Ad</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Login Prompt Modal for Guest Users */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
      />

      {/* Comments Modal */}
      {selectedCommentShortId && (
        <VideoCommentsModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedCommentShortId(null);
          }}
          videoId={parseInt(selectedCommentShortId)}
          userId={user?.id ? Number(user.id) : 0}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Inshorts Reward Popup */}
      <InshortsRewardPopup
        visible={showInshortsRewardPopup}
        onClose={closeInshortsRewardPopup}
        isPremium={isPremium}
        earnedAmount={earnedAmount}
        onAction={handleInshortsRewardAction}
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

  // Reward Popup Styles
  rewardPopup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  rewardPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardPopupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rewardPopupSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardPopupInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
  },
  rewardPopupButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  rewardPopupButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#FF6B35',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  developmentModeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TipShortsEnhanced;