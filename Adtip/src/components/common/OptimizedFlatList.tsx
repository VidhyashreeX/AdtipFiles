import React, { memo, useMemo, useCallback } from 'react';
import { FlatList, FlatListProps, ListRenderItem } from 'react-native';
import { createOptimizedFlatListProps, createKeyExtractor, createFixedHeightLayout, createGridLayout } from '../../utils/PerformanceUtils';
import { Logger } from '../../utils/ProductionLogger';

// Optimization presets
export type OptimizationPreset = 'FEED' | 'GRID' | 'CHAT' | 'SEARCH' | 'USER_LIST' | 'CUSTOM';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'keyExtractor' | 'renderItem'> {
  // Required props
  data: T[];
  renderItem: ListRenderItem<T>;
  
  // Optimization props
  preset?: OptimizationPreset;
  itemHeight?: number; // For fixed height optimization
  itemWidth?: number; // For grid optimization
  idField?: string; // Field to use for key extraction (default: 'id')
  enableMemoryOptimization?: boolean;
  enableScrollOptimization?: boolean;
  
  // Custom optimization overrides
  customOptimizations?: Partial<FlatListProps<T>>;
  
  // Debug props
  debugName?: string;
  enablePerformanceLogging?: boolean;
}

/**
 * Optimized FlatList component with automatic performance optimizations
 * Applies best practices and performance configurations based on use case
 */
function OptimizedFlatList<T>({
  data,
  renderItem,
  preset = 'FEED',
  itemHeight,
  itemWidth,
  idField = 'id',
  enableMemoryOptimization = true,
  enableScrollOptimization = true,
  customOptimizations = {},
  debugName,
  enablePerformanceLogging = __DEV__,
  numColumns,
  ...restProps
}: OptimizedFlatListProps<T>) {
  
  // Create optimized key extractor
  const keyExtractor = useMemo(() => {
    return createKeyExtractor(idField);
  }, [idField]);

  // Create optimized getItemLayout if itemHeight is provided
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    if (numColumns && numColumns > 1 && itemWidth) {
      // Grid layout
      return createGridLayout(itemWidth, itemHeight, numColumns);
    } else {
      // Fixed height layout
      return createFixedHeightLayout(itemHeight);
    }
  }, [itemHeight, itemWidth, numColumns]);

  // Get base optimization props
  const baseOptimizations = useMemo(() => {
    if (preset === 'CUSTOM') {
      return {};
    }
    return createOptimizedFlatListProps(preset);
  }, [preset]);

  // Memory optimization props
  const memoryOptimizations = useMemo(() => {
    if (!enableMemoryOptimization) return {};
    
    return {
      removeClippedSubviews: true,
      maxToRenderPerBatch: preset === 'CHAT' ? 15 : 10,
      updateCellsBatchingPeriod: 50,
      windowSize: preset === 'CHAT' ? 15 : 10,
    };
  }, [enableMemoryOptimization, preset]);

  // Scroll optimization props
  const scrollOptimizations = useMemo(() => {
    if (!enableScrollOptimization) return {};
    
    return {
      scrollEventThrottle: 16,
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
    };
  }, [enableScrollOptimization]);

  // Combine all optimizations
  const optimizedProps = useMemo(() => {
    const combined = {
      ...baseOptimizations,
      ...memoryOptimizations,
      ...scrollOptimizations,
      ...customOptimizations,
      // Always include these for performance
      keyExtractor,
      getItemLayout,
    };

    // Log optimizations in development with throttling to prevent spam
    if (enablePerformanceLogging && debugName) {
      // Only log occasionally to prevent console spam
      const shouldLog = Math.random() < 0.05; // Log only 5% of the time
      if (shouldLog) {
        Logger.debug('OptimizedFlatList', `${debugName} Applied optimizations:`, {
          preset,
          itemHeight,
          numColumns,
          dataLength: data.length,
          optimizations: Object.keys(combined),
        });
      }
    }

    return combined;
  }, [
    baseOptimizations,
    memoryOptimizations,
    scrollOptimizations,
    customOptimizations,
    keyExtractor,
    getItemLayout,
    enablePerformanceLogging,
    debugName,
    preset,
    itemHeight,
    numColumns,
    data.length,
  ]);

  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback((info: any) => {
    return renderItem(info);
  }, [renderItem]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      numColumns={numColumns}
      {...optimizedProps}
      {...restProps}
    />
  );
}

// Export memoized component
export default memo(OptimizedFlatList) as <T>(props: OptimizedFlatListProps<T>) => JSX.Element;

// Export specific optimized components for common use cases
export const FeedFlatList = <T,>(props: Omit<OptimizedFlatListProps<T>, 'preset'>) => (
  <OptimizedFlatList {...props} preset="FEED" />
);

export const GridFlatList = <T,>(props: Omit<OptimizedFlatListProps<T>, 'preset'>) => (
  <OptimizedFlatList {...props} preset="GRID" />
);

export const ChatFlatList = <T,>(props: Omit<OptimizedFlatListProps<T>, 'preset'>) => (
  <OptimizedFlatList {...props} preset="CHAT" />
);

export const SearchFlatList = <T,>(props: Omit<OptimizedFlatListProps<T>, 'preset'>) => (
  <OptimizedFlatList {...props} preset="SEARCH" />
);

export const UserListFlatList = <T,>(props: Omit<OptimizedFlatListProps<T>, 'preset'>) => (
  <OptimizedFlatList {...props} preset="USER_LIST" />
);

// Hook for creating optimized render items
export const useOptimizedRenderItem = <T,>(
  renderFunction: (item: T, index: number) => JSX.Element,
  dependencies: any[] = []
) => {
  return useCallback(({ item, index }: { item: T; index: number }) => {
    return renderFunction(item, index);
  }, dependencies);
};

// Hook for creating optimized key extractors
export const useOptimizedKeyExtractor = (idField: string = 'id') => {
  return useMemo(() => createKeyExtractor(idField), [idField]);
};

// Hook for performance monitoring
export const useFlatListPerformance = (listName: string) => {
  const onScrollBeginDrag = useCallback(() => {
    if (__DEV__) {
      console.log(`[FlatListPerformance:${listName}] Scroll started`);
    }
  }, [listName]);

  const onScrollEndDrag = useCallback(() => {
    if (__DEV__) {
      console.log(`[FlatListPerformance:${listName}] Scroll ended`);
    }
  }, [listName]);

  const onEndReached = useCallback(() => {
    if (__DEV__) {
      console.log(`[FlatListPerformance:${listName}] End reached - loading more`);
    }
  }, [listName]);

  return {
    onScrollBeginDrag,
    onScrollEndDrag,
    onEndReached,
  };
};
