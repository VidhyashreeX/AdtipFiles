import { Logger } from '../utils/ProductionLogger';
import OptimizedAsyncStorage from './OptimizedAsyncStorage';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'render' | 'memory' | 'network' | 'startup';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  appStartupTime: number;
  averageNavigationTime: number;
  memoryUsage: {
    current: number;
    peak: number;
    average: number;
  };
  renderPerformance: {
    averageFPS: number;
    slowFrames: number;
    totalFrames: number;
  };
  networkMetrics: {
    averageResponseTime: number;
    failureRate: number;
    totalRequests: number;
  };
  timestamp: number;
}

/**
 * Performance monitoring service for tracking app performance metrics
 * Collects and analyzes performance data to identify bottlenecks
 */
class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private startupTime: number = Date.now();
  private navigationTimes: number[] = [];
  private memoryReadings: number[] = [];
  private renderMetrics = {
    frameCount: 0,
    slowFrameCount: 0,
    lastFrameTime: Date.now(),
  };
  private networkMetrics = {
    responseTimes: [] as number[],
    failures: 0,
    totalRequests: 0,
  };

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start render performance monitoring
    this.startRenderMonitoring();
    
    Logger.debug('PerformanceMonitoring', 'Performance monitoring initialized');
  }

  /**
   * Record app startup completion
   */
  recordAppStartup(): void {
    const startupTime = Date.now() - this.startupTime;
    this.recordMetric({
      id: `startup_${Date.now()}`,
      name: 'app_startup',
      value: startupTime,
      timestamp: Date.now(),
      category: 'startup',
      metadata: { startupTime }
    });
    
    Logger.performance('PerformanceMonitoring', `App startup completed in ${startupTime}ms`);
  }

  /**
   * Record navigation timing
   */
  recordNavigation(screenName: string, navigationTime: number): void {
    this.navigationTimes.push(navigationTime);
    
    this.recordMetric({
      id: `nav_${Date.now()}`,
      name: 'navigation_time',
      value: navigationTime,
      timestamp: Date.now(),
      category: 'navigation',
      metadata: { screenName }
    });

    if (navigationTime > 500) {
      Logger.warn('PerformanceMonitoring', `Slow navigation to ${screenName}: ${navigationTime}ms`);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(memoryUsage: number): void {
    this.memoryReadings.push(memoryUsage);
    
    this.recordMetric({
      id: `memory_${Date.now()}`,
      name: 'memory_usage',
      value: memoryUsage,
      timestamp: Date.now(),
      category: 'memory',
      metadata: { memoryUsage }
    });

    // Alert on high memory usage (>200MB)
    if (memoryUsage > 200 * 1024 * 1024) {
      Logger.warn('PerformanceMonitoring', `High memory usage detected: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
    }
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(url: string, responseTime: number, success: boolean): void {
    this.networkMetrics.totalRequests++;
    
    if (success) {
      this.networkMetrics.responseTimes.push(responseTime);
    } else {
      this.networkMetrics.failures++;
    }

    this.recordMetric({
      id: `network_${Date.now()}`,
      name: 'network_request',
      value: responseTime,
      timestamp: Date.now(),
      category: 'network',
      metadata: { url, success }
    });

    if (responseTime > 5000) {
      Logger.warn('PerformanceMonitoring', `Slow network request: ${url} took ${responseTime}ms`);
    }
  }

  /**
   * Record render performance
   */
  recordRenderFrame(frameTime: number): void {
    this.renderMetrics.frameCount++;
    
    // Consider frame slow if it takes more than 16.67ms (60fps threshold)
    if (frameTime > 16.67) {
      this.renderMetrics.slowFrameCount++;
    }

    this.recordMetric({
      id: `render_${Date.now()}`,
      name: 'render_frame',
      value: frameTime,
      timestamp: Date.now(),
      category: 'render',
      metadata: { frameTime }
    });
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      if (global.performance && global.performance.memory) {
        const memoryUsage = global.performance.memory.usedJSHeapSize;
        this.recordMemoryUsage(memoryUsage);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start render monitoring
   */
  private startRenderMonitoring(): void {
    // This would integrate with React Native's performance monitoring
    // For now, we'll simulate frame monitoring
    setInterval(() => {
      const currentTime = Date.now();
      const frameTime = currentTime - this.renderMetrics.lastFrameTime;
      this.renderMetrics.lastFrameTime = currentTime;
      
      if (this.renderMetrics.frameCount % 60 === 0) { // Sample every 60 frames
        this.recordRenderFrame(frameTime);
      }
    }, 16); // ~60fps monitoring
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    // Filter metrics from last 24 hours
    const recentMetrics = this.metrics.filter(m => m.timestamp > last24Hours);
    
    // Calculate averages
    const avgNavigationTime = this.navigationTimes.length > 0 
      ? this.navigationTimes.reduce((a, b) => a + b, 0) / this.navigationTimes.length 
      : 0;
    
    const avgResponseTime = this.networkMetrics.responseTimes.length > 0
      ? this.networkMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.networkMetrics.responseTimes.length
      : 0;
    
    const failureRate = this.networkMetrics.totalRequests > 0
      ? (this.networkMetrics.failures / this.networkMetrics.totalRequests) * 100
      : 0;

    const currentMemory = this.memoryReadings.length > 0 ? this.memoryReadings[this.memoryReadings.length - 1] : 0;
    const peakMemory = this.memoryReadings.length > 0 ? Math.max(...this.memoryReadings) : 0;
    const avgMemory = this.memoryReadings.length > 0 
      ? this.memoryReadings.reduce((a, b) => a + b, 0) / this.memoryReadings.length 
      : 0;

    const avgFPS = this.renderMetrics.frameCount > 0 
      ? 1000 / (16.67 * (this.renderMetrics.slowFrameCount / this.renderMetrics.frameCount))
      : 60;

    const report: PerformanceReport = {
      appStartupTime: Date.now() - this.startupTime,
      averageNavigationTime: avgNavigationTime,
      memoryUsage: {
        current: currentMemory,
        peak: peakMemory,
        average: avgMemory,
      },
      renderPerformance: {
        averageFPS: Math.min(avgFPS, 60),
        slowFrames: this.renderMetrics.slowFrameCount,
        totalFrames: this.renderMetrics.frameCount,
      },
      networkMetrics: {
        averageResponseTime: avgResponseTime,
        failureRate,
        totalRequests: this.networkMetrics.totalRequests,
      },
      timestamp: now,
    };

    // Save report to storage
    await this.saveReport(report);
    
    return report;
  }

  /**
   * Save performance report to storage
   */
  private async saveReport(report: PerformanceReport): Promise<void> {
    try {
      const reportKey = `performance_report_${report.timestamp}`;
      await OptimizedAsyncStorage.setItem(reportKey, JSON.stringify(report));
      
      // Keep only last 7 reports
      const allKeys = await OptimizedAsyncStorage.getAllKeys();
      const reportKeys = allKeys.filter(key => key.startsWith('performance_report_'))
        .sort()
        .slice(0, -7);
      
      if (reportKeys.length > 0) {
        await OptimizedAsyncStorage.multiRemove(reportKeys);
      }
      
      Logger.debug('PerformanceMonitoring', 'Performance report saved', report);
    } catch (error) {
      Logger.error('PerformanceMonitoring', 'Failed to save performance report', error);
    }
  }

  /**
   * Get performance summary for debugging
   */
  getPerformanceSummary(): string {
    const avgNav = this.navigationTimes.length > 0 
      ? Math.round(this.navigationTimes.reduce((a, b) => a + b, 0) / this.navigationTimes.length)
      : 0;
    
    const currentMemoryMB = this.memoryReadings.length > 0 
      ? Math.round(this.memoryReadings[this.memoryReadings.length - 1] / 1024 / 1024)
      : 0;
    
    const fps = this.renderMetrics.frameCount > 0 
      ? Math.round(60 * (1 - this.renderMetrics.slowFrameCount / this.renderMetrics.frameCount))
      : 60;

    return `Performance Summary:
- Startup: ${Date.now() - this.startupTime}ms
- Avg Navigation: ${avgNav}ms
- Memory: ${currentMemoryMB}MB
- FPS: ${fps}
- Network Failures: ${this.networkMetrics.failures}/${this.networkMetrics.totalRequests}`;
  }
}

export default PerformanceMonitoringService;
