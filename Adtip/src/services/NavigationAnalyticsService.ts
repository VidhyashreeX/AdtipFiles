// src/services/NavigationAnalyticsService.ts
import { NavigationState } from '@react-navigation/native';
import { Logger } from '../utils/ProductionLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NavigationEvent {
  type: 'screen_view' | 'navigation_error' | 'deep_link' | 'auth_flow' | 'performance';
  screen: string;
  timestamp: number;
  duration?: number;
  params?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NavigationMetrics {
  totalScreenViews: number;
  averageNavigationTime: number;
  errorCount: number;
  mostVisitedScreens: Record<string, number>;
  navigationErrors: string[];
  deepLinkUsage: number;
  authFlowCompletions: number;
  sessionStartTime: number;
}

class NavigationAnalyticsService {
  private static instance: NavigationAnalyticsService;
  private events: NavigationEvent[] = [];
  private currentScreen: string | null = null;
  private screenStartTime: number | null = null;
  private sessionStartTime: number = Date.now();
  private isEnabled: boolean = true;

  private constructor() {}

  static getInstance(): NavigationAnalyticsService {
    if (!NavigationAnalyticsService.instance) {
      NavigationAnalyticsService.instance = new NavigationAnalyticsService();
    }
    return NavigationAnalyticsService.instance;
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, params?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const now = Date.now();
    
    // Calculate duration for previous screen
    if (this.currentScreen && this.screenStartTime) {
      const duration = now - this.screenStartTime;
      this.addEvent({
        type: 'screen_view',
        screen: this.currentScreen,
        timestamp: this.screenStartTime,
        duration,
        params,
      });
    }

    // Set new screen
    this.currentScreen = screenName;
    this.screenStartTime = now;

    Logger.debug('NavigationAnalytics', 'Screen view tracked:', screenName);
  }

  /**
   * Track navigation error
   */
  trackNavigationError(error: string, screen?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'navigation_error',
      screen: screen || this.currentScreen || 'unknown',
      timestamp: Date.now(),
      error,
      metadata,
    });

    Logger.warn('NavigationAnalytics', 'Navigation error tracked:', error);
  }

  /**
   * Track deep link usage
   */
  trackDeepLink(url: string, screen: string, success: boolean): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'deep_link',
      screen,
      timestamp: Date.now(),
      params: { url, success },
    });

    Logger.debug('NavigationAnalytics', 'Deep link tracked:', { url, screen, success });
  }

  /**
   * Track auth flow events
   */
  trackAuthFlow(event: string, screen: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'auth_flow',
      screen,
      timestamp: Date.now(),
      params: { event },
      metadata,
    });

    Logger.debug('NavigationAnalytics', 'Auth flow tracked:', { event, screen });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, screen?: string): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'performance',
      screen: screen || this.currentScreen || 'unknown',
      timestamp: Date.now(),
      params: { metric, value },
    });

    Logger.debug('NavigationAnalytics', 'Performance tracked:', { metric, value });
  }

  /**
   * Add event to collection
   */
  private addEvent(event: NavigationEvent): void {
    this.events.push(event);

    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Persist events periodically
    if (this.events.length % 10 === 0) {
      this.persistEvents();
    }
  }

  /**
   * Get navigation metrics
   */
  getMetrics(): NavigationMetrics {
    const screenViews = this.events.filter(e => e.type === 'screen_view');
    const errors = this.events.filter(e => e.type === 'navigation_error');
    const deepLinks = this.events.filter(e => e.type === 'deep_link');
    const authFlows = this.events.filter(e => e.type === 'auth_flow' && e.params?.event === 'completed');

    // Calculate most visited screens
    const screenCounts: Record<string, number> = {};
    screenViews.forEach(event => {
      screenCounts[event.screen] = (screenCounts[event.screen] || 0) + 1;
    });

    // Calculate average navigation time
    const durations = screenViews.filter(e => e.duration).map(e => e.duration!);
    const averageNavigationTime = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    return {
      totalScreenViews: screenViews.length,
      averageNavigationTime,
      errorCount: errors.length,
      mostVisitedScreens: screenCounts,
      navigationErrors: errors.map(e => e.error || 'Unknown error'),
      deepLinkUsage: deepLinks.length,
      authFlowCompletions: authFlows.length,
      sessionStartTime: this.sessionStartTime,
    };
  }

  /**
   * Get events for a specific time range
   */
  getEvents(startTime?: number, endTime?: number): NavigationEvent[] {
    let filteredEvents = this.events;

    if (startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= startTime);
    }

    if (endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= endTime);
    }

    return filteredEvents;
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    const metrics = this.getMetrics();
    const data = {
      metrics,
      events: this.events,
      exportTime: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Persist events to storage (public method)
   */
  async persistEvents(): Promise<void> {
    try {
      const data = {
        events: this.events.slice(-100), // Keep last 100 events
        sessionStartTime: this.sessionStartTime,
      };

      await AsyncStorage.setItem('@navigation_analytics', JSON.stringify(data));
    } catch (error) {
      Logger.error('NavigationAnalytics', 'Failed to persist events:', error);
    }
  }

  /**
   * Load persisted events
   */
  async loadPersistedEvents(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@navigation_analytics');
      if (data) {
        const parsed = JSON.parse(data);
        this.events = parsed.events || [];
        // Don't restore session start time - each session should be fresh
      }
    } catch (error) {
      Logger.error('NavigationAnalytics', 'Failed to load persisted events:', error);
    }
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    this.events = [];
    this.currentScreen = null;
    this.screenStartTime = null;
    this.sessionStartTime = Date.now();

    try {
      await AsyncStorage.removeItem('@navigation_analytics');
    } catch (error) {
      Logger.error('NavigationAnalytics', 'Failed to clear persisted data:', error);
    }

    Logger.info('NavigationAnalytics', 'Analytics data cleared');
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    Logger.info('NavigationAnalytics', `Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Reset session
   */
  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.currentScreen = null;
    this.screenStartTime = null;
    Logger.debug('NavigationAnalytics', 'Session reset');
  }
}

export default NavigationAnalyticsService;
