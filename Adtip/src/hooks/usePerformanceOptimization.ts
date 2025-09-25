// src/hooks/usePerformanceOptimization.ts - Comprehensive performance optimization hook

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus, InteractionManager } from 'react-native';
import { useMemoryTracking, useMemoryWarnings, useSafeTimer } from '../utils/MemoryLeakDetector';
import { useImagePreloader } from '../components/common/OptimizedImage';
import { useModulePreloader } from '../services/LazyLoadingService';
import StartupOptimizationService from '../services/StartupOptimizationService';
import { Logger } from '../utils/ProductionLogger';

interface PerformanceConfig {
  enableMemoryTracking: boolean;
  enableImagePreloading: boolean;
  enableModulePreloading: boolean;
  enableStartupOptimization: boolean;
  componentName?: string;
  preloadImages?: string[];
  preloadModules?: string[];
  memoryWarningThreshold?: number;
}

interface PerformanceMetrics {
  memoryWarnings: number;
  cacheHitRate: number;
  moduleLoadTime: number;
  startupTime: number;
  componentMountTime: number;
}

/**
 * Comprehensive performance optimization hook
 */
export const usePerformanceOptimization = (config: PerformanceConfig) => {
  const componentMountTime = useRef(Date.now());
  const startupService = StartupOptimizationService.getInstance();
  const isAppReady = useRef(false);

  // Memory tracking
  const componentName = config.componentName || 'UnnamedComponent';
  useMemoryTracking(componentName);

  // Memory warnings
  const { warnings, clearWarnings, forceGC, getStats } = useMemoryWarnings();

  // Image preloading
  const { preloadImages, getCacheMetrics, clearCache } = useImagePreloader();

  // Module preloading
  const { preloadModules, getStats: getModuleStats } = useModulePreloader();

  // Performance metrics state
  const performanceMetrics = useMemo<PerformanceMetrics>(() => {
    const cacheMetrics = getCacheMetrics();
    const moduleStats = getModuleStats();
    const startupMetrics = startupService.getStartupMetrics();
    const mountTime = Date.now() - componentMountTime.current;

    return {
      memoryWarnings: warnings.length,
      cacheHitRate: cacheMetrics.hitRate || 0,
      moduleLoadTime: moduleStats.averageLoadTime || 0,
      startupTime: startupMetrics.totalStartupTime || 0,
      componentMountTime: mountTime,
    };
  }, [warnings.length, getCacheMetrics, getModuleStats, startupService]);

  // Initialize performance optimization on mount
  useEffect(() => {
    let isMounted = true;

    const initializeOptimizations = async () => {
      try {
        // Initialize startup optimization
        if (config.enableStartupOptimization) {
          await startupService.initialize();
          
          if (isMounted && !isAppReady.current) {
            startupService.markFirstScreenRendered();
            
            // Mark app ready after a short delay to allow for component settling
            InteractionManager.runAfterInteractions(() => {
              if (isMounted && !isAppReady.current) {
                startupService.markAppReady();
                isAppReady.current = true;
              }
            });
          }
        }

        // Preload images
        if (config.enableImagePreloading && config.preloadImages?.length) {
          InteractionManager.runAfterInteractions(async () => {
            if (isMounted) {
              try {
                await preloadImages(config.preloadImages!);
                Logger.debug('usePerformanceOptimization', 'Image preloading completed');
              } catch (error) {
                Logger.error('usePerformanceOptimization', 'Image preloading failed:', error);
              }
            }
          });
        }

        // Preload modules
        if (config.enableModulePreloading && config.preloadModules?.length) {
          InteractionManager.runAfterInteractions(async () => {
            if (isMounted) {
              try {
                await preloadModules(config.preloadModules!);
                Logger.debug('usePerformanceOptimization', 'Module preloading completed');
              } catch (error) {
                Logger.error('usePerformanceOptimization', 'Module preloading failed:', error);
              }
            }
          });
        }

      } catch (error) {
        Logger.error('usePerformanceOptimization', 'Initialization failed:', error);
      }
    };

    initializeOptimizations();

    return () => {
      isMounted = false;
    };
  }, [
    config.enableStartupOptimization,
    config.enableImagePreloading,
    config.enableModulePreloading,
    config.preloadImages,
    config.preloadModules,
    startupService,
    preloadImages,
    preloadModules,
  ]);

  // Handle memory warnings
  useEffect(() => {
    if (warnings.length > (config.memoryWarningThreshold || 3)) {
      Logger.warn('usePerformanceOptimization', `High memory warnings (${warnings.length}) detected for ${componentName}`);
      
      // Auto-clear warnings and attempt garbage collection
      setTimeout(() => {
        clearWarnings();
        forceGC();
      }, 1000);
    }
  }, [warnings.length, componentName, config.memoryWarningThreshold, clearWarnings, forceGC]);

  // App state change handler for optimization opportunities
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // App going to background - good time to clean up
      clearWarnings();
      Logger.debug('usePerformanceOptimization', 'App backgrounded - performance cleanup triggered');
    } else if (nextAppState === 'active') {
      // App coming to foreground - good time to preload
      InteractionManager.runAfterInteractions(() => {
        if (config.enableImagePreloading && config.preloadImages?.length) {
          preloadImages(config.preloadImages).catch(error => {
            Logger.error('usePerformanceOptimization', 'Background image preloading failed:', error);
          });
        }
      });
    }
  }, [config.enableImagePreloading, config.preloadImages, preloadImages, clearWarnings]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Performance monitoring timer
  useSafeTimer(() => {
    const memoryStats = getStats();
    
    if (__DEV__ && memoryStats.componentCount > 100) {
      Logger.warn('usePerformanceOptimization', `High component count detected: ${memoryStats.componentCount}`);
    }
  }, config.enableMemoryTracking ? 30000 : null, [config.enableMemoryTracking, getStats]); // Every 30 seconds

  // Performance optimization methods
  const optimizationMethods = useMemo(() => ({
    /**
     * Force garbage collection
     */
    forceGarbageCollection: () => {
      forceGC();
      Logger.info('usePerformanceOptimization', 'Manual garbage collection triggered');
    },

    /**
     * Clear all caches
     */
    clearAllCaches: async () => {
      try {
        await clearCache();
        await startupService.clearOptimizationCache();
        clearWarnings();
        Logger.info('usePerformanceOptimization', 'All caches cleared');
      } catch (error) {
        Logger.error('usePerformanceOptimization', 'Failed to clear caches:', error);
      }
    },

    /**
     * Run immediate optimization
     */
    runImmediateOptimization: async () => {
      try {
        await startupService.runOptimizationNow();
        
        if (config.preloadImages?.length) {
          await preloadImages(config.preloadImages);
        }
        
        if (config.preloadModules?.length) {
          await preloadModules(config.preloadModules);
        }
        
        Logger.info('usePerformanceOptimization', 'Immediate optimization completed');
      } catch (error) {
        Logger.error('usePerformanceOptimization', 'Immediate optimization failed:', error);
      }
    },

    /**
     * Get comprehensive performance report
     */
    getPerformanceReport: () => {
      const memoryStats = getStats();
      const cacheMetrics = getCacheMetrics();
      const moduleStats = getModuleStats();
      const startupStats = startupService.getOptimizationStats();

      return {
        componentName,
        metrics: performanceMetrics,
        memory: memoryStats,
        cache: cacheMetrics,
        modules: moduleStats,
        startup: startupStats,
        warnings: warnings,
        timestamp: Date.now(),
      };
    },

    /**
     * Update preload configuration
     */
    updatePreloadConfig: (newImages?: string[], newModules?: string[]) => {
      if (newImages) {
        startupService.addImagesToPreload(newImages);
      }
      if (newModules) {
        startupService.addModulesToPreload(newModules);
      }
    },
  }), [
    forceGC,
    clearCache,
    clearWarnings,
    startupService,
    config.preloadImages,
    config.preloadModules,
    preloadImages,
    preloadModules,
    componentName,
    performanceMetrics,
    getStats,
    getCacheMetrics,
    getModuleStats,
    warnings,
  ]);

  return {
    // Performance metrics
    metrics: performanceMetrics,
    warnings,

    // Optimization methods
    ...optimizationMethods,

    // Configuration
    isOptimized: config.enableMemoryTracking && config.enableImagePreloading && config.enableModulePreloading,
  };
};

/**
 * Quick performance optimization hook for simple use cases
 */
export const useQuickPerformanceOptimization = (componentName: string) => {
  return usePerformanceOptimization({
    enableMemoryTracking: true,
    enableImagePreloading: false,
    enableModulePreloading: false,
    enableStartupOptimization: false,
    componentName,
  });
};

/**
 * Advanced performance optimization hook for complex screens
 */
export const useAdvancedPerformanceOptimization = (
  componentName: string,
  preloadImages?: string[],
  preloadModules?: string[]
) => {
  return usePerformanceOptimization({
    enableMemoryTracking: true,
    enableImagePreloading: true,
    enableModulePreloading: true,
    enableStartupOptimization: true,
    componentName,
    preloadImages,
    preloadModules,
    memoryWarningThreshold: 5,
  });
};

export default usePerformanceOptimization;