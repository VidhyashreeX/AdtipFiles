import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import { Logger } from '../utils/ProductionLogger';

interface UsePerformanceMonitoringOptions {
  screenName?: string;
  trackNavigation?: boolean;
  trackRenders?: boolean;
  trackMemory?: boolean;
}

interface PerformanceHookReturn {
  recordCustomMetric: (name: string, value: number, metadata?: Record<string, any>) => void;
  getPerformanceSummary: () => string;
  renderCount: number;
}

/**
 * Hook for monitoring component and screen performance
 * Automatically tracks navigation timing, render counts, and memory usage
 */
export const usePerformanceMonitoring = (
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn => {
  const {
    screenName = 'Unknown',
    trackNavigation = true,
    trackRenders = true,
    trackMemory = false,
  } = options;

  const performanceService = PerformanceMonitoringService.getInstance();
  const renderCountRef = useRef(0);
  const navigationStartTime = useRef<number | null>(null);
  const componentMountTime = useRef(Date.now());

  // Track render count
  useEffect(() => {
    if (trackRenders) {
      renderCountRef.current += 1;
      
      // Log excessive re-renders
      if (renderCountRef.current > 20) {
        Logger.warn('PerformanceMonitoring', `High render count for ${screenName}: ${renderCountRef.current}`);
      }
    }
  });

  // Track navigation timing
  useFocusEffect(
    useCallback(() => {
      if (trackNavigation) {
        const navigationTime = Date.now() - componentMountTime.current;
        performanceService.recordNavigation(screenName, navigationTime);
        
        Logger.debug('PerformanceMonitoring', `Navigation to ${screenName}: ${navigationTime}ms`);
      }
    }, [screenName, trackNavigation, performanceService])
  );

  // Track memory usage
  useEffect(() => {
    if (trackMemory && global.performance && global.performance.memory) {
      const interval = setInterval(() => {
        const memoryUsage = global.performance.memory.usedJSHeapSize;
        performanceService.recordMemoryUsage(memoryUsage);
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [trackMemory, performanceService]);

  // Record custom metrics
  const recordCustomMetric = useCallback((
    name: string, 
    value: number, 
    metadata?: Record<string, any>
  ) => {
    Logger.debug('PerformanceMonitoring', `Custom metric ${name}: ${value}`, metadata);
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    return performanceService.getPerformanceSummary();
  }, [performanceService]);

  return {
    recordCustomMetric,
    getPerformanceSummary,
    renderCount: renderCountRef.current,
  };
};

/**
 * Hook specifically for monitoring video component performance
 */
export const useVideoPerformanceMonitoring = (videoId: string) => {
  const performanceService = PerformanceMonitoringService.getInstance();
  const loadStartTime = useRef<number | null>(null);
  const playStartTime = useRef<number | null>(null);

  const recordVideoLoad = useCallback((loadTime: number) => {
    Logger.debug('VideoPerformance', `Video ${videoId} loaded in ${loadTime}ms`);
  }, [videoId]);

  const recordVideoPlay = useCallback(() => {
    playStartTime.current = Date.now();
    Logger.debug('VideoPerformance', `Video ${videoId} started playing`);
  }, [videoId]);

  const recordVideoBuffer = useCallback((bufferTime: number) => {
    Logger.debug('VideoPerformance', `Video ${videoId} buffered for ${bufferTime}ms`);
  }, [videoId]);

  const recordVideoError = useCallback((error: string) => {
    Logger.error('VideoPerformance', `Video ${videoId} error: ${error}`);
  }, [videoId]);

  return {
    recordVideoLoad,
    recordVideoPlay,
    recordVideoBuffer,
    recordVideoError,
  };
};

/**
 * Hook for monitoring FlatList performance
 */
export const useFlatListPerformanceMonitoring = (listName: string) => {
  const scrollStartTime = useRef<number | null>(null);
  const itemRenderTimes = useRef<number[]>([]);

  const recordScrollStart = useCallback(() => {
    scrollStartTime.current = Date.now();
  }, []);

  const recordScrollEnd = useCallback(() => {
    if (scrollStartTime.current) {
      const scrollTime = Date.now() - scrollStartTime.current;
      Logger.debug('FlatListPerformance', `${listName} scroll took ${scrollTime}ms`);
      scrollStartTime.current = null;
    }
  }, [listName]);

  const recordItemRender = useCallback((renderTime: number) => {
    itemRenderTimes.current.push(renderTime);
    
    // Keep only last 100 render times
    if (itemRenderTimes.current.length > 100) {
      itemRenderTimes.current = itemRenderTimes.current.slice(-100);
    }

    // Log slow renders
    if (renderTime > 50) {
      Logger.warn('FlatListPerformance', `Slow item render in ${listName}: ${renderTime}ms`);
    }
  }, [listName]);

  const getAverageRenderTime = useCallback(() => {
    if (itemRenderTimes.current.length === 0) return 0;
    return itemRenderTimes.current.reduce((a, b) => a + b, 0) / itemRenderTimes.current.length;
  }, []);

  return {
    recordScrollStart,
    recordScrollEnd,
    recordItemRender,
    getAverageRenderTime,
  };
};

/**
 * Hook for monitoring network request performance
 */
export const useNetworkPerformanceMonitoring = () => {
  const performanceService = PerformanceMonitoringService.getInstance();

  const recordNetworkRequest = useCallback((
    url: string,
    method: string,
    responseTime: number,
    success: boolean,
    statusCode?: number
  ) => {
    performanceService.recordNetworkRequest(url, responseTime, success);
    
    Logger.network('NetworkPerformance', method, url, statusCode || 0, {
      responseTime,
      success,
    });
  }, [performanceService]);

  return {
    recordNetworkRequest,
  };
};

export default usePerformanceMonitoring;
