import { Platform } from 'react-native';

export interface AdEvent {
  adType: 'banner' | 'interstitial' | 'rewarded' | 'native' | 'app_open' | 'rectangle';
  eventType: 'loaded' | 'failed' | 'opened' | 'closed' | 'clicked' | 'impression' | 'earned_reward';
  timestamp: number;
  platform: string;
  adUnitId?: string;
  error?: any;
  reward?: any;
}

class AdTracker {
  private events: AdEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events

  /**
   * Track an ad event
   */
  trackEvent(
    adType: AdEvent['adType'],
    eventType: AdEvent['eventType'],
    adUnitId?: string,
    error?: any,
    reward?: any
  ) {
    const event: AdEvent = {
      adType,
      eventType,
      timestamp: Date.now(),
      platform: Platform.OS,
      adUnitId,
      error,
      reward,
    };

    this.events.push(event);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log the event
    console.log(`[AdTracker] ${adType} - ${eventType}`, {
      timestamp: new Date(event.timestamp).toISOString(),
      platform: event.platform,
      adUnitId: event.adUnitId,
      error: event.error,
      reward: event.reward,
    });

    // You can send this data to your analytics service
    this.sendToAnalytics(event);
  }

  /**
   * Get all tracked events
   */
  getEvents(): AdEvent[] {
    return [...this.events];
  }

  /**
   * Get events by ad type
   */
  getEventsByAdType(adType: AdEvent['adType']): AdEvent[] {
    return this.events.filter(event => event.adType === adType);
  }

  /**
   * Get events by event type
   */
  getEventsByEventType(eventType: AdEvent['eventType']): AdEvent[] {
    return this.events.filter(event => event.eventType === eventType);
  }

  /**
   * Get ad performance metrics
   */
  getAdMetrics(adType?: AdEvent['adType']) {
    const filteredEvents = adType 
      ? this.events.filter(event => event.adType === adType)
      : this.events;

    const totalLoaded = filteredEvents.filter(event => event.eventType === 'loaded').length;
    const totalFailed = filteredEvents.filter(event => event.eventType === 'failed').length;
    const totalOpened = filteredEvents.filter(event => event.eventType === 'opened').length;
    const totalClicked = filteredEvents.filter(event => event.eventType === 'clicked').length;
    const totalImpressions = filteredEvents.filter(event => event.eventType === 'impression').length;
    const totalRewards = filteredEvents.filter(event => event.eventType === 'earned_reward').length;

    const loadSuccessRate = totalLoaded + totalFailed > 0 
      ? (totalLoaded / (totalLoaded + totalFailed)) * 100 
      : 0;

    const clickThroughRate = totalImpressions > 0 
      ? (totalClicked / totalImpressions) * 100 
      : 0;

    return {
      totalLoaded,
      totalFailed,
      totalOpened,
      totalClicked,
      totalImpressions,
      totalRewards,
      loadSuccessRate: Math.round(loadSuccessRate * 100) / 100,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    };
  }

  /**
   * Clear all tracked events
   */
  clearEvents() {
    this.events = [];
    console.log('[AdTracker] All events cleared');
  }

  /**
   * Send event data to analytics service
   * Replace this with your actual analytics implementation
   */
  private sendToAnalytics(event: AdEvent) {
    // Example: Send to Firebase Analytics, Google Analytics, etc.
    // analytics().logEvent('ad_event', {
    //   ad_type: event.adType,
    //   event_type: event.eventType,
    //   platform: event.platform,
    //   ad_unit_id: event.adUnitId,
    // });
  }

  /**
   * Get events from a specific time range
   */
  getEventsInTimeRange(startTime: number, endTime: number): AdEvent[] {
    return this.events.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

// Create a singleton instance
export const adTracker = new AdTracker();

// Helper functions for easy tracking
export const trackAdLoaded = (adType: AdEvent['adType'], adUnitId?: string) => {
  adTracker.trackEvent(adType, 'loaded', adUnitId);
};

export const trackAdFailed = (adType: AdEvent['adType'], error: any, adUnitId?: string) => {
  adTracker.trackEvent(adType, 'failed', adUnitId, error);
};

export const trackAdOpened = (adType: AdEvent['adType'], adUnitId?: string) => {
  adTracker.trackEvent(adType, 'opened', adUnitId);
};

export const trackAdClosed = (adType: AdEvent['adType'], adUnitId?: string) => {
  adTracker.trackEvent(adType, 'closed', adUnitId);
};

export const trackAdClicked = (adType: AdEvent['adType'], adUnitId?: string) => {
  adTracker.trackEvent(adType, 'clicked', adUnitId);
};

export const trackAdImpression = (adType: AdEvent['adType'], adUnitId?: string) => {
  adTracker.trackEvent(adType, 'impression', adUnitId);
};

export const trackAdReward = (adType: AdEvent['adType'], reward: any, adUnitId?: string) => {
  adTracker.trackEvent(adType, 'earned_reward', adUnitId, undefined, reward);
};

export default adTracker; 