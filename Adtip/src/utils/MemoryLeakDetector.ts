// src/utils/MemoryLeakDetector.ts - Memory leak detection and prevention utilities

import { AppState, AppStateStatus, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Logger } from './ProductionLogger';

interface MemorySnapshot {
  timestamp: number;
  jsHeapSizeUsed?: number;
  jsHeapSizeTotal?: number;
  jsHeapSizeLimit?: number;
  componentCount: number;
  listenerCount: number;
}

interface LeakWarning {
  type: 'COMPONENT' | 'LISTENER' | 'TIMER' | 'MEMORY';
  message: string;
  count: number;
  threshold: number;
}

class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private snapshots: MemorySnapshot[] = [];
  private componentCount = 0;
  private listenerCount = 0;
  private timerCount = 0;
  private intervalId?: NodeJS.Timeout;
  private isMonitoring = false;
  private listeners: Array<(warnings: LeakWarning[]) => void> = [];

  // Thresholds for memory leak detection
  private readonly COMPONENT_THRESHOLD = 100;
  private readonly LISTENER_THRESHOLD = 50;
  private readonly TIMER_THRESHOLD = 20;
  private readonly MEMORY_GROWTH_THRESHOLD = 10; // MB
  private readonly SNAPSHOT_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.initialize();
  }

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  private initialize(): void {
    // Monitor app state changes
    const subscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start monitoring if in development mode
    if (__DEV__) {
      this.startMonitoring();
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      this.takeSnapshot('APP_ACTIVE');
    } else if (nextAppState === 'background') {
      this.takeSnapshot('APP_BACKGROUND');
    }
  };

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.takeSnapshot('PERIODIC');
      this.analyzeMemoryLeaks();
    }, this.SNAPSHOT_INTERVAL);

    Logger.info('MemoryLeakDetector', 'Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    Logger.info('MemoryLeakDetector', 'Memory monitoring stopped');
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(reason: string): void {
    try {
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        componentCount: this.componentCount,
        listenerCount: this.listenerCount,
      };

      // Add JS heap info if available (mainly for debugging)
      if (global.performance && (global.performance as any).memory) {
        const memory = (global.performance as any).memory;
        snapshot.jsHeapSizeUsed = memory.usedJSHeapSize;
        snapshot.jsHeapSizeTotal = memory.totalJSHeapSize;
        snapshot.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      }

      this.snapshots.push(snapshot);

      // Keep only last 20 snapshots
      if (this.snapshots.length > 20) {
        this.snapshots = this.snapshots.slice(-20);
      }

      Logger.debug('MemoryLeakDetector', `Snapshot taken (${reason}):`, snapshot);
    } catch (error) {
      Logger.error('MemoryLeakDetector', 'Failed to take snapshot:', error);
    }
  }

  /**
   * Analyze memory leaks
   */
  private analyzeMemoryLeaks(): void {
    if (this.snapshots.length < 2) return;

    const warnings: LeakWarning[] = [];
    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    // Check component count growth
    if (latest.componentCount > this.COMPONENT_THRESHOLD) {
      warnings.push({
        type: 'COMPONENT',
        message: `High component count detected: ${latest.componentCount}`,
        count: latest.componentCount,
        threshold: this.COMPONENT_THRESHOLD,
      });
    }

    // Check listener count growth
    if (latest.listenerCount > this.LISTENER_THRESHOLD) {
      warnings.push({
        type: 'LISTENER',
        message: `High event listener count detected: ${latest.listenerCount}`,
        count: latest.listenerCount,
        threshold: this.LISTENER_THRESHOLD,
      });
    }

    // Check timer count
    if (this.timerCount > this.TIMER_THRESHOLD) {
      warnings.push({
        type: 'TIMER',
        message: `High timer count detected: ${this.timerCount}`,
        count: this.timerCount,
        threshold: this.TIMER_THRESHOLD,
      });
    }

    // Check memory growth
    if (latest.jsHeapSizeUsed && previous.jsHeapSizeUsed) {
      const memoryGrowth = (latest.jsHeapSizeUsed - previous.jsHeapSizeUsed) / (1024 * 1024);
      if (memoryGrowth > this.MEMORY_GROWTH_THRESHOLD) {
        warnings.push({
          type: 'MEMORY',
          message: `Memory growth detected: ${memoryGrowth.toFixed(2)}MB`,
          count: Math.round(memoryGrowth),
          threshold: this.MEMORY_GROWTH_THRESHOLD,
        });
      }
    }

    // Notify listeners if there are warnings
    if (warnings.length > 0) {
      this.notifyListeners(warnings);
    }
  }

  /**
   * Register component mount/unmount
   */
  registerComponent(componentName: string): () => void {
    this.componentCount++;
    Logger.debug('MemoryLeakDetector', `Component mounted: ${componentName} (total: ${this.componentCount})`);

    return () => {
      this.componentCount = Math.max(0, this.componentCount - 1);
      Logger.debug('MemoryLeakDetector', `Component unmounted: ${componentName} (total: ${this.componentCount})`);
    };
  }

  /**
   * Register event listener
   */
  registerListener(): () => void {
    this.listenerCount++;
    
    return () => {
      this.listenerCount = Math.max(0, this.listenerCount - 1);
    };
  }

  /**
   * Register timer
   */
  registerTimer(): () => void {
    this.timerCount++;
    
    return () => {
      this.timerCount = Math.max(0, this.timerCount - 1);
    };
  }

  /**
   * Add warning listener
   */
  addWarningListener(listener: (warnings: LeakWarning[]) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(warnings: LeakWarning[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(warnings);
      } catch (error) {
        Logger.error('MemoryLeakDetector', 'Error in warning listener:', error);
      }
    });
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    componentCount: number;
    listenerCount: number;
    timerCount: number;
    snapshots: MemorySnapshot[];
    isMonitoring: boolean;
  } {
    return {
      componentCount: this.componentCount,
      listenerCount: this.listenerCount,
      timerCount: this.timerCount,
      snapshots: [...this.snapshots],
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      try {
        global.gc();
        Logger.info('MemoryLeakDetector', 'Garbage collection forced');
        this.takeSnapshot('GC_FORCED');
      } catch (error) {
        Logger.error('MemoryLeakDetector', 'Failed to force garbage collection:', error);
      }
    } else {
      Logger.warn('MemoryLeakDetector', 'Garbage collection not available');
    }
  }

  /**
   * Cleanup detector
   */
  cleanup(): void {
    this.stopMonitoring();
    this.listeners = [];
    this.snapshots = [];
  }
}

// React hooks for memory leak detection

/**
 * Hook to register component lifecycle for memory tracking
 */
export const useMemoryTracking = (componentName: string): void => {
  const detector = MemoryLeakDetector.getInstance();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cleanupRef.current = detector.registerComponent(componentName);
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [componentName, detector]);
};

/**
 * Hook to safely manage event listeners with memory leak detection
 */
export const useSafeEventListener = (
  eventEmitter: NativeEventEmitter | typeof DeviceEventEmitter,
  eventName: string,
  callback: (event: any) => void,
  deps: React.DependencyList = []
): void => {
  const detector = MemoryLeakDetector.getInstance();
  const cleanupRefs = useRef<Array<() => void>>([]);

  const safeCallback = useCallback(callback, deps);

  useEffect(() => {
    // Register listener with detector
    const detectorCleanup = detector.registerListener();
    
    // Add event listener
    const subscription = eventEmitter.addListener(eventName, safeCallback);
    
    cleanupRefs.current.push(detectorCleanup);
    
    return () => {
      subscription.remove();
      cleanupRefs.current.forEach(cleanup => cleanup());
      cleanupRefs.current = [];
    };
  }, [eventEmitter, eventName, safeCallback, detector]);
};

/**
 * Hook to safely manage timers with memory leak detection
 */
export const useSafeTimer = (
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = []
): void => {
  const detector = MemoryLeakDetector.getInstance();
  const cleanupRef = useRef<(() => void) | null>(null);

  const safeCallback = useCallback(callback, deps);

  useEffect(() => {
    if (delay === null) return;

    // Register timer with detector
    const detectorCleanup = detector.registerTimer();
    cleanupRef.current = detectorCleanup;

    const timerId = setInterval(safeCallback, delay);

    return () => {
      clearInterval(timerId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [safeCallback, delay, detector]);
};

/**
 * Hook to monitor memory warnings
 */
export const useMemoryWarnings = (): {
  warnings: LeakWarning[];
  clearWarnings: () => void;
  forceGC: () => void;
  getStats: () => any;
} => {
  const detector = MemoryLeakDetector.getInstance();
  const [warnings, setWarnings] = useState<LeakWarning[]>([]);

  useEffect(() => {
    const removeListener = detector.addWarningListener(setWarnings);
    return removeListener;
  }, [detector]);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  const forceGC = useCallback(() => {
    detector.forceGarbageCollection();
  }, [detector]);

  const getStats = useCallback(() => {
    return detector.getMemoryStats();
  }, [detector]);

  return {
    warnings,
    clearWarnings,
    forceGC,
    getStats,
  };
};

export default MemoryLeakDetector;
export type { MemorySnapshot, LeakWarning };