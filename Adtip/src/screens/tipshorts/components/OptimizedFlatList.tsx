import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Dimensions,
  ViewToken,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { TipShortsLogger } from '../../../utils/logger';
import { type ShortVideo } from '../../../hooks/useShortsQuery';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ShortVideo>);

interface OptimizedFlatListProps {
  data: ShortVideo[];
  renderItem: ({ item, index }: { item: ShortVideo; index: number }) => React.ReactElement;
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  scrollY: Animated.SharedValue<number>;
  onScroll?: (event: any) => void;
}

// Performance-optimized FlatList for TipShorts
export const OptimizedFlatList = memo<OptimizedFlatListProps>(({
  data,
  renderItem,
  onViewableItemsChanged,
  onEndReached,
  ListFooterComponent,
  scrollY,
  onScroll,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const lastScrollTime = useRef(0);
  const scrollVelocity = useRef(0);

  // Enhanced viewability config for better performance
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 150, // Increased to prevent rapid changes
    waitForInteraction: false,
  }), []);

  // Optimized scroll handler with throttling
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Calculate scroll velocity for performance optimization
      const currentTime = Date.now();
      const timeDiff = currentTime - lastScrollTime.current;
      const scrollDiff = Math.abs(event.contentOffset.y - scrollY.value);
      
      if (timeDiff > 0) {
        scrollVelocity.current = scrollDiff / timeDiff;
      }
      
      lastScrollTime.current = currentTime;
      
      // Call custom onScroll if provided
      if (onScroll) {
        runOnJS(onScroll)(event);
      }
    },
  }, [onScroll]);

  // Memoized viewability config callback pairs
  const viewabilityConfigCallbackPairs = useMemo(() => [
    {
      viewabilityConfig,
      onViewableItemsChanged,
    },
  ], [viewabilityConfig, onViewableItemsChanged]);

  // Optimized key extractor
  const keyExtractor = useCallback((item: ShortVideo, index: number) => {
    return `short-${item.id}-${index}`;
  }, []);

  // Get item layout for better performance (fixed height)
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), []);

  // Enhanced end reached handler with throttling
  const handleEndReached = useCallback(() => {
    if (onEndReached) {
      // Throttle end reached calls to prevent excessive API calls
      const now = Date.now();
      if (now - lastScrollTime.current > 1000) { // 1 second throttle
        TipShortsLogger.debug('OptimizedFlatList: End reached, loading more content');
        onEndReached();
        lastScrollTime.current = now;
      }
    }
  }, [onEndReached]);

  // Performance optimizations based on device capabilities
  const performanceConfig = useMemo(() => {
    const isLowEndDevice = Platform.OS === 'android' && 
      (Platform.constants?.Release < '8.0' || Platform.constants?.Model?.includes('Go'));

    return {
      removeClippedSubviews: true,
      maxToRenderPerBatch: isLowEndDevice ? 2 : 3,
      windowSize: isLowEndDevice ? 3 : 5,
      initialNumToRender: isLowEndDevice ? 1 : 2,
      updateCellsBatchingPeriod: isLowEndDevice ? 100 : 50,
      getItemLayout: getItemLayout,
    };
  }, [getItemLayout]);

  return (
    <AnimatedFlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      
      // Paging and snapping
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      
      // Viewability
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      
      // End reached
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      
      // Footer
      ListFooterComponent={ListFooterComponent}
      
      // Performance optimizations
      {...performanceConfig}
      
      // Memory management
      disableVirtualization={false}
      legacyImplementation={false}
      
      // Scroll performance
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      
      // Additional optimizations
      overScrollMode="never" // Android only
      scrollsToTop={false} // iOS only
      
      style={{ flex: 1 }}
    />
  );
});

OptimizedFlatList.displayName = 'OptimizedFlatList';

// Memory management utilities
export class TipShortsMemoryManager {
  private static instance: TipShortsMemoryManager;
  private memoryWarningListeners: (() => void)[] = [];
  private isLowMemoryMode = false;

  static getInstance(): TipShortsMemoryManager {
    if (!TipShortsMemoryManager.instance) {
      TipShortsMemoryManager.instance = new TipShortsMemoryManager();
    }
    return TipShortsMemoryManager.instance;
  }

  constructor() {
    // Listen for memory warnings on iOS
    if (Platform.OS === 'ios') {
      // Note: This would require native module implementation
      // For now, we'll use a simple heuristic
      this.startMemoryMonitoring();
    }
  }

  private startMemoryMonitoring() {
    // Simple memory monitoring using performance heuristics
    setInterval(() => {
      const now = Date.now();
      const memoryPressure = this.estimateMemoryPressure();
      
      if (memoryPressure > 0.8 && !this.isLowMemoryMode) {
        TipShortsLogger.warn('High memory pressure detected, enabling low memory mode');
        this.isLowMemoryMode = true;
        this.notifyMemoryWarning();
      } else if (memoryPressure < 0.6 && this.isLowMemoryMode) {
        TipShortsLogger.debug('Memory pressure reduced, disabling low memory mode');
        this.isLowMemoryMode = false;
      }
    }, 5000); // Check every 5 seconds
  }

  private estimateMemoryPressure(): number {
    // Simple heuristic based on performance
    // In a real implementation, this would use native memory APIs
    return Math.random() * 0.5; // Placeholder
  }

  private notifyMemoryWarning() {
    this.memoryWarningListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        TipShortsLogger.error('Error in memory warning listener:', error);
      }
    });
  }

  addMemoryWarningListener(listener: () => void) {
    this.memoryWarningListeners.push(listener);
  }

  removeMemoryWarningListener(listener: () => void) {
    const index = this.memoryWarningListeners.indexOf(listener);
    if (index > -1) {
      this.memoryWarningListeners.splice(index, 1);
    }
  }

  isInLowMemoryMode(): boolean {
    return this.isLowMemoryMode;
  }

  cleanup() {
    this.memoryWarningListeners = [];
    this.isLowMemoryMode = false;
  }
}
