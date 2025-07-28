// src/services/NavigationPerformanceMonitor.ts
import { Logger } from '../utils/ProductionLogger';

// ✅ PERFORMANCE METRICS INTERFACE
export interface NavigationMetrics {
  screenName: string;
  navigationTime: number;
  renderTime: number;
  totalTime: number;
  timestamp: number;
  fromScreen?: string;
  navigationType: 'push' | 'replace' | 'reset' | 'goBack';
  params?: any;
}

export interface PerformanceStats {
  averageNavigationTime: number;
  averageRenderTime: number;
  averageTotalTime: number;
  slowestNavigation: NavigationMetrics | null;
  fastestNavigation: NavigationMetrics | null;
  totalNavigations: number;
  errorCount: number;
  memoryUsage?: number;
}

// ✅ PERFORMANCE THRESHOLDS
const PERFORMANCE_THRESHOLDS = {
  NAVIGATION_WARNING: 300,    // 300ms
  NAVIGATION_ERROR: 1000,     // 1000ms
  RENDER_WARNING: 200,        // 200ms
  RENDER_ERROR: 500,          // 500ms
  TOTAL_WARNING: 500,         // 500ms
  TOTAL_ERROR: 1500,          // 1500ms
  MEMORY_WARNING: 100 * 1024 * 1024, // 100MB
  MEMORY_ERROR: 200 * 1024 * 1024,   // 200MB
} as const;

// ✅ NAVIGATION PERFORMANCE MONITOR
class NavigationPerformanceMonitor {
  private metrics: NavigationMetrics[] = [];
  private activeNavigations = new Map<string, { startTime: number; fromScreen?: string }>();
  private isEnabled = __DEV__; // Only enable in development by default
  private maxMetricsCount = 100; // Keep last 100 metrics
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceObserver();
  }

  // ✅ INITIALIZATION
  private initializePerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('navigation')) {
              this.handlePerformanceEntry(entry);
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        Logger.warn('NavigationPerformanceMonitor', 'PerformanceObserver not available', error);
      }
    }
  }

  // ✅ NAVIGATION TRACKING
  startNavigation(screenName: string, navigationType: NavigationMetrics['navigationType'], fromScreen?: string) {
    if (!this.isEnabled) return;

    const navigationId = `${screenName}-${Date.now()}`;
    this.activeNavigations.set(navigationId, {
      startTime: performance.now(),
      fromScreen,
    });

    // Mark navigation start
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`navigation-start-${screenName}`);
    }

    Logger.debug('NavigationPerformanceMonitor', `Started tracking navigation to ${screenName}`);
    return navigationId;
  }

  endNavigation(
    navigationId: string, 
    screenName: string, 
    navigationType: NavigationMetrics['navigationType'],
    params?: any
  ) {
    if (!this.isEnabled || !navigationId) return;

    const activeNav = this.activeNavigations.get(navigationId);
    if (!activeNav) {
      Logger.warn('NavigationPerformanceMonitor', `No active navigation found for ${navigationId}`);
      return;
    }

    const endTime = performance.now();
    const totalTime = endTime - activeNav.startTime;

    // Mark navigation end
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`navigation-end-${screenName}`);
      performance.measure(
        `navigation-${screenName}`,
        `navigation-start-${screenName}`,
        `navigation-end-${screenName}`
      );
    }

    // Create metrics
    const metrics: NavigationMetrics = {
      screenName,
      navigationTime: totalTime,
      renderTime: 0, // Will be updated by render tracking
      totalTime,
      timestamp: Date.now(),
      fromScreen: activeNav.fromScreen,
      navigationType,
      params: this.sanitizeParams(params),
    };

    this.addMetrics(metrics);
    this.activeNavigations.delete(navigationId);
    this.checkPerformanceThresholds(metrics);

    Logger.debug('NavigationPerformanceMonitor', `Navigation to ${screenName} completed in ${totalTime.toFixed(2)}ms`);
  }

  // ✅ RENDER TRACKING
  trackRenderTime(screenName: string, renderTime: number) {
    if (!this.isEnabled) return;

    // Find the most recent navigation to this screen
    const recentMetrics = this.metrics
      .filter(m => m.screenName === screenName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (recentMetrics && Date.now() - recentMetrics.timestamp < 5000) {
      recentMetrics.renderTime = renderTime;
      recentMetrics.totalTime = recentMetrics.navigationTime + renderTime;
      this.checkPerformanceThresholds(recentMetrics);
    }
  }

  // ✅ ERROR TRACKING
  trackNavigationError(screenName: string, _error: Error, navigationType: NavigationMetrics['navigationType']) {
    if (!this.isEnabled) return;

    const errorMetrics: NavigationMetrics = {
      screenName,
      navigationTime: -1,
      renderTime: -1,
      totalTime: -1,
      timestamp: Date.now(),
      navigationType,
      params: { error: error.message },
    };

    this.addMetrics(errorMetrics);
    Logger.error('NavigationPerformanceMonitor', `Navigation error to ${screenName}`, error);
  }

  // ✅ METRICS MANAGEMENT
  private addMetrics(metrics: NavigationMetrics) {
    this.metrics.push(metrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount);
    }
  }

  private sanitizeParams(params: any): any {
    if (!params) return undefined;

    try {
      // Remove sensitive data and limit size
      const sanitized = JSON.parse(JSON.stringify(params));
      const str = JSON.stringify(sanitized);
      
      if (str.length > 1000) {
        return { _truncated: true, _size: str.length };
      }
      
      return sanitized;
    } catch {
      return { error: 'Failed to sanitize params' };
    }
  }

  // ✅ PERFORMANCE ANALYSIS
  getPerformanceStats(): PerformanceStats {
    const validMetrics = this.metrics.filter(m => m.totalTime >= 0);
    
    if (validMetrics.length === 0) {
      return {
        averageNavigationTime: 0,
        averageRenderTime: 0,
        averageTotalTime: 0,
        slowestNavigation: null,
        fastestNavigation: null,
        totalNavigations: 0,
        errorCount: this.metrics.filter(m => m.totalTime < 0).length,
      };
    }

    const navigationTimes = validMetrics.map(m => m.navigationTime);
    const renderTimes = validMetrics.map(m => m.renderTime);
    const totalTimes = validMetrics.map(m => m.totalTime);

    const stats: PerformanceStats = {
      averageNavigationTime: navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length,
      averageRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      averageTotalTime: totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length,
      slowestNavigation: validMetrics.reduce((prev, current) => 
        (prev.totalTime > current.totalTime) ? prev : current
      ),
      fastestNavigation: validMetrics.reduce((prev, current) => 
        (prev.totalTime < current.totalTime) ? prev : current
      ),
      totalNavigations: validMetrics.length,
      errorCount: this.metrics.filter(m => m.totalTime < 0).length,
    };

    // Add memory usage if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      stats.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    return stats;
  }

  getMetricsByScreen(screenName: string): NavigationMetrics[] {
    return this.metrics.filter(m => m.screenName === screenName);
  }

  getSlowNavigations(threshold = PERFORMANCE_THRESHOLDS.NAVIGATION_WARNING): NavigationMetrics[] {
    return this.metrics.filter(m => m.totalTime > threshold);
  }

  // ✅ PERFORMANCE ALERTS
  private checkPerformanceThresholds(metrics: NavigationMetrics) {
    const { screenName, navigationTime, renderTime, totalTime } = metrics;

    // Check navigation time
    if (navigationTime > PERFORMANCE_THRESHOLDS.NAVIGATION_ERROR) {
      Logger.error('NavigationPerformanceMonitor', `Slow navigation to ${screenName}: ${navigationTime.toFixed(2)}ms`);
    } else if (navigationTime > PERFORMANCE_THRESHOLDS.NAVIGATION_WARNING) {
      Logger.warn('NavigationPerformanceMonitor', `Slow navigation to ${screenName}: ${navigationTime.toFixed(2)}ms`);
    }

    // Check render time
    if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_ERROR) {
      Logger.error('NavigationPerformanceMonitor', `Slow render for ${screenName}: ${renderTime.toFixed(2)}ms`);
    } else if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_WARNING) {
      Logger.warn('NavigationPerformanceMonitor', `Slow render for ${screenName}: ${renderTime.toFixed(2)}ms`);
    }

    // Check total time
    if (totalTime > PERFORMANCE_THRESHOLDS.TOTAL_ERROR) {
      Logger.error('NavigationPerformanceMonitor', `Slow total time for ${screenName}: ${totalTime.toFixed(2)}ms`);
    } else if (totalTime > PERFORMANCE_THRESHOLDS.TOTAL_WARNING) {
      Logger.warn('NavigationPerformanceMonitor', `Slow total time for ${screenName}: ${totalTime.toFixed(2)}ms`);
    }

    // Check memory usage
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memoryUsage = (performance as any).memory.usedJSHeapSize;
      
      if (memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_ERROR) {
        Logger.error('NavigationPerformanceMonitor', `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      } else if (memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
        Logger.warn('NavigationPerformanceMonitor', `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }

  // ✅ PERFORMANCE ENTRY HANDLER
  private handlePerformanceEntry(entry: PerformanceEntry) {
    Logger.debug('NavigationPerformanceMonitor', `Performance entry: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
  }

  // ✅ REPORTING
  generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const slowNavigations = this.getSlowNavigations();

    return `
Navigation Performance Report
============================
Total Navigations: ${stats.totalNavigations}
Errors: ${stats.errorCount}
Average Navigation Time: ${stats.averageNavigationTime.toFixed(2)}ms
Average Render Time: ${stats.averageRenderTime.toFixed(2)}ms
Average Total Time: ${stats.averageTotalTime.toFixed(2)}ms

Slowest Navigation: ${stats.slowestNavigation?.screenName} (${stats.slowestNavigation?.totalTime.toFixed(2)}ms)
Fastest Navigation: ${stats.fastestNavigation?.screenName} (${stats.fastestNavigation?.totalTime.toFixed(2)}ms)

Slow Navigations (>${PERFORMANCE_THRESHOLDS.NAVIGATION_WARNING}ms):
${slowNavigations.map(m => `- ${m.screenName}: ${m.totalTime.toFixed(2)}ms`).join('\n')}

${stats.memoryUsage ? `Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB` : ''}
    `.trim();
  }

  // ✅ CONFIGURATION
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setMaxMetricsCount(count: number) {
    this.maxMetricsCount = Math.max(10, count);
  }

  // ✅ CLEANUP
  clearMetrics() {
    this.metrics = [];
    this.activeNavigations.clear();
  }

  destroy() {
    this.clearMetrics();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// ✅ SINGLETON INSTANCE
export const navigationPerformanceMonitor = new NavigationPerformanceMonitor();

export default NavigationPerformanceMonitor;
