import { Platform } from 'react-native';
import { Logger } from '../utils/ProductionLogger';

/**
 * Performance metrics for killed state scenarios
 */
export interface KilledStateMetrics {
  // Timing metrics
  totalWakeUpTime: number;
  serviceInitTimes: {
    firebase: number;
    videoSDK: number;
    prewarming: number;
    deepLink: number;
    notification: number;
  };
  navigationTime: number;
  
  // Success metrics
  wakeUpSuccess: boolean;
  serviceFailures: string[];
  navigationSuccess: boolean;
  
  // Context information
  platform: string;
  appVersion: string;
  deviceInfo: {
    isLowMemory: boolean;
    networkType: string;
    batteryLevel?: number;
  };
  
  // Call specific metrics
  callType: 'voice' | 'video';
  sessionId: string;
  timestamp: number;
}

/**
 * Performance thresholds for monitoring
 */
const PERFORMANCE_THRESHOLDS = {
  // Timing thresholds (in milliseconds)
  EXCELLENT_WAKE_UP: 2000,
  GOOD_WAKE_UP: 5000,
  POOR_WAKE_UP: 10000,
  
  EXCELLENT_NAVIGATION: 1000,
  GOOD_NAVIGATION: 3000,
  POOR_NAVIGATION: 5000,
  
  // Service-specific thresholds
  FIREBASE_INIT: 3000,
  VIDEOSDK_INIT: 5000,
  DEEPLINK_INIT: 1000,
  NOTIFICATION_DISPLAY: 2000,
};

/**
 * Performance monitoring service for killed state scenarios
 * Tracks metrics and provides analytics for optimization
 */
export class KilledStatePerformanceMonitor {
  private static _instance: KilledStatePerformanceMonitor;
  private currentSession: Partial<KilledStateMetrics> | null = null;
  private sessionStartTime: number = 0;
  private metricsHistory: KilledStateMetrics[] = [];
  private maxHistorySize = 50; // Keep last 50 sessions

  private constructor() {
    Logger.info('KilledStatePerformanceMonitor', 'Performance monitor initialized');
  }

  public static getInstance(): KilledStatePerformanceMonitor {
    if (!KilledStatePerformanceMonitor._instance) {
      KilledStatePerformanceMonitor._instance = new KilledStatePerformanceMonitor();
    }
    return KilledStatePerformanceMonitor._instance;
  }

  /**
   * Start monitoring a new killed state session
   */
  public startSession(sessionId: string, callType: 'voice' | 'video'): void {
    this.sessionStartTime = Date.now();
    this.currentSession = {
      sessionId,
      callType,
      timestamp: this.sessionStartTime,
      platform: Platform.OS,
      appVersion: '1.0.0', // TODO: Get from app config
      serviceInitTimes: {
        firebase: 0,
        videoSDK: 0,
        prewarming: 0,
        deepLink: 0,
        notification: 0,
      },
      serviceFailures: [],
      deviceInfo: {
        isLowMemory: false,
        networkType: 'unknown',
      },
    };

    Logger.info('KilledStatePerformanceMonitor', '📊 Started performance monitoring session', {
      sessionId,
      callType,
    });
  }

  /**
   * Record service initialization time
   */
  public recordServiceInit(serviceName: keyof KilledStateMetrics['serviceInitTimes'], duration: number): void {
    if (!this.currentSession) {
      Logger.warn('KilledStatePerformanceMonitor', 'No active session to record service init');
      return;
    }

    this.currentSession.serviceInitTimes![serviceName] = duration;
    
    // Check if service exceeded threshold
    const threshold = this.getServiceThreshold(serviceName);
    if (duration > threshold) {
      Logger.warn('KilledStatePerformanceMonitor', `Service ${serviceName} exceeded threshold`, {
        duration,
        threshold,
        sessionId: this.currentSession.sessionId,
      });
    }

    Logger.info('KilledStatePerformanceMonitor', `📊 Recorded ${serviceName} init time`, {
      duration,
      sessionId: this.currentSession.sessionId,
    });
  }

  /**
   * Record service failure
   */
  public recordServiceFailure(serviceName: string, error: string): void {
    if (!this.currentSession) {
      Logger.warn('KilledStatePerformanceMonitor', 'No active session to record service failure');
      return;
    }

    this.currentSession.serviceFailures!.push(`${serviceName}: ${error}`);
    
    Logger.warn('KilledStatePerformanceMonitor', `📊 Recorded service failure`, {
      serviceName,
      error,
      sessionId: this.currentSession.sessionId,
    });
  }

  /**
   * Record navigation completion
   */
  public recordNavigation(success: boolean, duration: number): void {
    if (!this.currentSession) {
      Logger.warn('KilledStatePerformanceMonitor', 'No active session to record navigation');
      return;
    }

    this.currentSession.navigationSuccess = success;
    this.currentSession.navigationTime = duration;

    Logger.info('KilledStatePerformanceMonitor', '📊 Recorded navigation completion', {
      success,
      duration,
      sessionId: this.currentSession.sessionId,
    });
  }

  /**
   * Complete the current session and calculate final metrics
   */
  public completeSession(wakeUpSuccess: boolean): KilledStateMetrics | null {
    if (!this.currentSession) {
      Logger.warn('KilledStatePerformanceMonitor', 'No active session to complete');
      return null;
    }

    const totalWakeUpTime = Date.now() - this.sessionStartTime;
    
    const finalMetrics: KilledStateMetrics = {
      ...this.currentSession,
      totalWakeUpTime,
      wakeUpSuccess,
      navigationSuccess: this.currentSession.navigationSuccess ?? false,
      navigationTime: this.currentSession.navigationTime ?? 0,
    } as KilledStateMetrics;

    // Add to history
    this.metricsHistory.push(finalMetrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift(); // Remove oldest entry
    }

    // Log performance summary
    this.logPerformanceSummary(finalMetrics);

    // Reset current session
    this.currentSession = null;
    this.sessionStartTime = 0;

    Logger.info('KilledStatePerformanceMonitor', '📊 Session completed', {
      sessionId: finalMetrics.sessionId,
      totalTime: totalWakeUpTime,
      success: wakeUpSuccess,
    });

    return finalMetrics;
  }

  /**
   * Get performance analytics for the last N sessions
   */
  public getAnalytics(sessionCount: number = 10): {
    averageWakeUpTime: number;
    successRate: number;
    commonFailures: string[];
    performanceGrade: 'excellent' | 'good' | 'poor';
    recommendations: string[];
  } {
    const recentSessions = this.metricsHistory.slice(-sessionCount);
    
    if (recentSessions.length === 0) {
      return {
        averageWakeUpTime: 0,
        successRate: 0,
        commonFailures: [],
        performanceGrade: 'poor',
        recommendations: ['No data available'],
      };
    }

    const averageWakeUpTime = recentSessions.reduce((sum, session) => sum + session.totalWakeUpTime, 0) / recentSessions.length;
    const successRate = recentSessions.filter(session => session.wakeUpSuccess).length / recentSessions.length;
    
    // Collect all failures
    const allFailures = recentSessions.flatMap(session => session.serviceFailures);
    const failureCounts = allFailures.reduce((counts, failure) => {
      counts[failure] = (counts[failure] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const commonFailures = Object.entries(failureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([failure]) => failure);

    // Determine performance grade
    let performanceGrade: 'excellent' | 'good' | 'poor';
    if (averageWakeUpTime <= PERFORMANCE_THRESHOLDS.EXCELLENT_WAKE_UP && successRate >= 0.95) {
      performanceGrade = 'excellent';
    } else if (averageWakeUpTime <= PERFORMANCE_THRESHOLDS.GOOD_WAKE_UP && successRate >= 0.85) {
      performanceGrade = 'good';
    } else {
      performanceGrade = 'poor';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentSessions, averageWakeUpTime, successRate);

    return {
      averageWakeUpTime,
      successRate,
      commonFailures,
      performanceGrade,
      recommendations,
    };
  }

  /**
   * Get service-specific threshold
   */
  private getServiceThreshold(serviceName: keyof KilledStateMetrics['serviceInitTimes']): number {
    switch (serviceName) {
      case 'firebase':
        return PERFORMANCE_THRESHOLDS.FIREBASE_INIT;
      case 'videoSDK':
        return PERFORMANCE_THRESHOLDS.VIDEOSDK_INIT;
      case 'deepLink':
        return PERFORMANCE_THRESHOLDS.DEEPLINK_INIT;
      case 'notification':
        return PERFORMANCE_THRESHOLDS.NOTIFICATION_DISPLAY;
      default:
        return 5000; // Default threshold
    }
  }

  /**
   * Log performance summary for a completed session
   */
  private logPerformanceSummary(metrics: KilledStateMetrics): void {
    const grade = this.getSessionGrade(metrics);
    
    Logger.info('KilledStatePerformanceMonitor', `📊 Session Performance Summary [${grade.toUpperCase()}]`, {
      sessionId: metrics.sessionId,
      totalTime: metrics.totalWakeUpTime,
      success: metrics.wakeUpSuccess,
      serviceInitTimes: metrics.serviceInitTimes,
      failures: metrics.serviceFailures,
      platform: metrics.platform,
    });

    // Log warnings for poor performance
    if (grade === 'poor') {
      Logger.warn('KilledStatePerformanceMonitor', '⚠️ Poor performance detected', {
        sessionId: metrics.sessionId,
        issues: this.identifyPerformanceIssues(metrics),
      });
    }
  }

  /**
   * Get performance grade for a single session
   */
  private getSessionGrade(metrics: KilledStateMetrics): 'excellent' | 'good' | 'poor' {
    if (!metrics.wakeUpSuccess) return 'poor';
    
    if (metrics.totalWakeUpTime <= PERFORMANCE_THRESHOLDS.EXCELLENT_WAKE_UP) {
      return 'excellent';
    } else if (metrics.totalWakeUpTime <= PERFORMANCE_THRESHOLDS.GOOD_WAKE_UP) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  /**
   * Identify specific performance issues
   */
  private identifyPerformanceIssues(metrics: KilledStateMetrics): string[] {
    const issues: string[] = [];

    if (metrics.totalWakeUpTime > PERFORMANCE_THRESHOLDS.POOR_WAKE_UP) {
      issues.push('Total wake-up time exceeded threshold');
    }

    Object.entries(metrics.serviceInitTimes).forEach(([service, time]) => {
      const threshold = this.getServiceThreshold(service as keyof KilledStateMetrics['serviceInitTimes']);
      if (time > threshold) {
        issues.push(`${service} initialization slow`);
      }
    });

    if (metrics.serviceFailures.length > 0) {
      issues.push('Service failures detected');
    }

    if (!metrics.navigationSuccess) {
      issues.push('Navigation failed');
    }

    return issues;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(sessions: KilledStateMetrics[], avgTime: number, successRate: number): string[] {
    const recommendations: string[] = [];

    if (avgTime > PERFORMANCE_THRESHOLDS.GOOD_WAKE_UP) {
      recommendations.push('Consider optimizing service initialization order');
    }

    if (successRate < 0.9) {
      recommendations.push('Improve error handling and fallback mechanisms');
    }

    // Analyze service-specific issues
    const avgServiceTimes = sessions.reduce((acc, session) => {
      Object.entries(session.serviceInitTimes).forEach(([service, time]) => {
        acc[service] = (acc[service] || 0) + time;
      });
      return acc;
    }, {} as Record<string, number>);

    Object.entries(avgServiceTimes).forEach(([service, totalTime]) => {
      const avgTime = totalTime / sessions.length;
      const threshold = this.getServiceThreshold(service as keyof KilledStateMetrics['serviceInitTimes']);
      
      if (avgTime > threshold) {
        recommendations.push(`Optimize ${service} initialization`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable thresholds');
    }

    return recommendations;
  }

  /**
   * Export metrics for external analytics
   */
  public exportMetrics(): KilledStateMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  public clearHistory(): void {
    this.metricsHistory = [];
    Logger.info('KilledStatePerformanceMonitor', 'Metrics history cleared');
  }
}

export default KilledStatePerformanceMonitor;
