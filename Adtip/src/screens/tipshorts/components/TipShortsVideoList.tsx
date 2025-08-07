import React, { useRef, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ViewToken,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useTipShortsData } from './TipShortsDataProvider';
import { useTipShortsControls } from './TipShortsControls';
import { useTipShortsGesture } from './TipShortsGestureHandler';
import { useTipShortsReward } from './TipShortsRewardManager';
import { OptimizedFlatList, TipShortsMemoryManager } from './OptimizedFlatList';
import EnhancedShortCard from './EnhancedShortCard';
import VideoErrorBoundary from '../../../components/common/VideoErrorBoundary';
import { TipShortsLogger } from '../../../utils/logger';
import { type ShortVideo } from '../../../hooks/useShortsQuery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TipShortsVideoListProps {
  onLike: (shortId: string, creatorId: string, isCurrentlyLiked: boolean) => void;
  onChannelNavigation?: (channelData: { id: string; name: string; avatar?: string }) => void;
  onComment?: (shortId: string) => void;
  onFollow?: (channelId: string) => void;
  onGuestAction: (action: string) => void;
  isGuest: boolean;
  insets: any;
}

export const TipShortsVideoList: React.FC<TipShortsVideoListProps> = memo(({
  onLike,
  onChannelNavigation,
  onComment,
  onFollow,
  onGuestAction,
  isGuest,
  insets,
}) => {
  const { shorts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTipShortsData();
  const {
    activeIndex,
    setActiveIndex,
    videoProgress,
    setVideoProgress,
    showPlayPause,
    isGloballyPlaying,
    isGloballyMuted,
    toggleGlobalMute,
    handleVideoLoad,
  } = useTipShortsControls();
  const { combinedGesture, scrollY } = useTipShortsGesture();
  const { handleVideoCompletion } = useTipShortsReward();

  // Memory management
  const memoryManager = TipShortsMemoryManager.getInstance();

  // Handle memory warnings
  useEffect(() => {
    const handleMemoryWarning = () => {
      TipShortsLogger.warn('Memory warning received, optimizing performance');
      // Could implement additional memory optimizations here
    };

    memoryManager.addMemoryWarningListener(handleMemoryWarning);

    return () => {
      memoryManager.removeMemoryWarningListener(handleMemoryWarning);
    };
  }, [memoryManager]);

  // Handle viewable items change with debouncing
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const newActiveIndex = viewableItems[0].index ?? 0;
      if (newActiveIndex !== activeIndex) {
        TipShortsLogger.debug('Active video changed:', { from: activeIndex, to: newActiveIndex });
        setActiveIndex(newActiveIndex);
      }
    }
  }, [activeIndex, setActiveIndex]);

  // Optimized render item with proper memoization
  const renderItem = useCallback(({ item, index }: { item: ShortVideo; index: number }) => {
    return (
      <VideoErrorBoundary key={`short-${item.id}-${index}`}>
        <EnhancedShortCard
          item={item}
          index={index}
          isActive={index === activeIndex}
          isLiked={item.isLiked || false}
          onVideoLoad={handleVideoLoad}
          onVideoCompletion={handleVideoCompletion}
          onLike={onLike}
          combinedGesture={combinedGesture}
          showPlayPause={showPlayPause}
          videoProgress={videoProgress}
          setVideoProgress={setVideoProgress}
          isGloballyPlaying={isGloballyPlaying}
          isGloballyMuted={isGloballyMuted}
          toggleGlobalMute={toggleGlobalMute}
          insets={insets}
          isGuest={isGuest}
          onGuestAction={onGuestAction}
          onChannelNavigation={onChannelNavigation}
          onComment={onComment}
          onFollow={onFollow}
        />
      </VideoErrorBoundary>
    );
  }, [
    activeIndex,
    handleVideoLoad,
    handleVideoCompletion,
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
  ]);

  // Optimized footer component
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.footerText}>Loading more shorts...</Text>
      </View>
    );
  }, [isFetchingNextPage]);

  // Handle end reached with throttling
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isGuest) {
      TipShortsLogger.debug('Loading more shorts...');
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isGuest, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading shorts...</Text>
      </View>
    );
  }

  return (
    <OptimizedFlatList
      data={shorts}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged}
      onEndReached={onEndReached}
      ListFooterComponent={renderFooter}
      scrollY={scrollY}
      onScroll={(event) => {
        // Additional scroll handling if needed
      }}
    />
  );
});

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  footerLoader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  footerText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
});

TipShortsVideoList.displayName = 'TipShortsVideoList';
