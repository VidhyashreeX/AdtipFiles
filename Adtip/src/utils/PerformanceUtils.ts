/**
 * Performance Utilities
 * 
 * Simple performance optimization utilities for React Native apps
 */

import React from 'react';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Debounce hook for expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for frequent operations
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (lastRun.current && now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (now - lastRun.current));
      }
    },
    [callback, delay]
  ) as T;
};

/**
 * Background task scheduler
 */
export class BackgroundTaskScheduler {
  private static tasks = new Map<string, () => void>();
  private static isProcessing = false;

  static scheduleTask(id: string, task: () => void) {
    this.tasks.set(id, task);

    if (!this.isProcessing) {
      this.processTasks();
    }
  }

  private static async processTasks() {
    this.isProcessing = true;

    // Wait for interactions to complete
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve();
      });
    });

    // Process tasks in batches
    const taskEntries = Array.from(this.tasks.entries());
    this.tasks.clear();

    for (const [id, task] of taskEntries) {
      try {
        task();
      } catch (error) {
        console.error(`Background task ${id} failed:`, error);
      }

      // Yield to main thread every few tasks
      if (taskEntries.indexOf([id, task]) % 5 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }

    this.isProcessing = false;

    // Process any new tasks that were added
    if (this.tasks.size > 0) {
      this.processTasks();
    }
  }

  static cancelTask(id: string) {
    this.tasks.delete(id);
  }

  static clearAllTasks() {
    this.tasks.clear();
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static memoryUsage = new Map<string, number>();

  static trackMemoryUsage(key: string, usage: number) {
    this.memoryUsage.set(key, usage);
  }

  static getMemoryUsage(key: string): number {
    return this.memoryUsage.get(key) || 0;
  }

  static getTotalMemoryUsage(): number {
    return Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);
  }

  static clearMemoryUsage() {
    this.memoryUsage.clear();
  }

  static logMemoryUsage() {
    console.log('=== MEMORY USAGE ===');
    this.memoryUsage.forEach((usage, key) => {
      console.log(`${key}: ${usage}MB`);
    });
    console.log(`Total: ${this.getTotalMemoryUsage()}MB`);
    console.log('=== END MEMORY USAGE ===');
  }
}

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = Date.now();
    const renderTime = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    console.log(`[${componentName}] Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
  });

  return {
    renderCount: renderCount.current,
    getRenderTime: () => Date.now() - lastRenderTime.current,
  };
};

/**
 * Optimized callback creator
 */
export const createOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[] = []
): T => {
  return useCallback(callback, dependencies);
};

/**
 * Optimized value creator
 */
export const createOptimizedValue = <T>(value: T, dependencies: any[] = []): T => {
  return useMemo(() => value, dependencies);
};

/**
 * Batch update utility
 */
export const useBatchUpdate = () => {
  const updates = useRef<(() => void)[]>([]);
  const isBatching = useRef(false);

  const batchUpdate = useCallback((update: () => void) => {
    updates.current.push(update);

    if (!isBatching.current) {
      isBatching.current = true;
      
      // Process updates in next tick
      setTimeout(() => {
        const currentUpdates = [...updates.current];
        updates.current = [];
        isBatching.current = false;

        // Apply all updates
        currentUpdates.forEach(update => update());
      }, 0);
    }
  }, []);

  return batchUpdate;
};

/**
 * Optimized state setter
 */
export const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);
  const batchUpdate = useBatchUpdate();

  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    batchUpdate(() => {
      setState(newValue);
    });
  }, [batchUpdate]);

  return [state, setOptimizedState] as const;
};

/**
 * Simple performance optimization HOC
 */
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.memo(Component);
};

/**
 * FlatList optimization configurations
 */
export const FlatListConfigs = {
  GRID: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 6,
    windowSize: 10,
    initialNumToRender: 12,
    updateCellsBatchingPeriod: 50,
    scrollEventThrottle: 16,
  },
  FEED: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    windowSize: 8,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 50,
    scrollEventThrottle: 16,
  },
  CHAT: {
    removeClippedSubviews: false,
    maxToRenderPerBatch: 15,
    windowSize: 15,
    initialNumToRender: 25,
    updateCellsBatchingPeriod: 50,
    scrollEventThrottle: 16,
  },
  SEARCH: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 8,
    windowSize: 12,
    initialNumToRender: 15,
    updateCellsBatchingPeriod: 50,
    scrollEventThrottle: 16,
  },
  USER_LIST: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 20,
    updateCellsBatchingPeriod: 50,
    scrollEventThrottle: 16,
  },
};

/**
 * Create optimized FlatList props
 */
export const createOptimizedFlatListProps = <T>(
  configType: keyof typeof FlatListConfigs,
  customProps?: any
) => {
  const baseConfig = FlatListConfigs[configType];
  
  return {
    ...baseConfig,
    ...customProps,
  };
};

/**
 * Optimized key extractor
 */
export const createKeyExtractor = (idField: string = 'id') => {
  return (item: any, index: number) => {
    if (item && item[idField] !== undefined && item[idField] !== null) {
      return item[idField].toString();
    }
    return `item-${index}-${Date.now()}`;
  };
};

/**
 * Optimized getItemLayout for fixed height items
 */
export const createFixedHeightLayout = (itemHeight: number) => {
  return (data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });
};

/**
 * Optimized getItemLayout for grid items
 */
export const createGridLayout = (itemWidth: number, itemHeight: number, numColumns: number) => {
  return (data: any, index: number) => {
    const rowIndex = Math.floor(index / numColumns);
    return {
      length: itemHeight,
      offset: itemHeight * rowIndex,
      index,
    };
  };
}; 