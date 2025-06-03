// src/services/AnalyticsService.ts
import ApiService from './ApiService';
import {ENDPOINTS} from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalyticsEvent {
  eventName: string;
  data?: Record<string, any>;
  timestamp?: number;
}

const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL = 60000; // 1 minute

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private isQueueProcessing = false;
  private processingInterval: any = null;

  constructor() {
    this.initializeQueue();
  }

  /**
   * Initialize the analytics queue and set up periodic flushing
   */
  private async initializeQueue(): Promise<void> {
    try {
      // Load any saved events from storage
      const savedEventsStr = await AsyncStorage.getItem('analytics_queue');
      if (savedEventsStr) {
        this.eventQueue = JSON.parse(savedEventsStr);
      }

      // Set up periodic flushing
      this.processingInterval = setInterval(() => {
        this.flushEvents().catch(err => {
          console.error('Failed to flush analytics events:', err);
        });
      }, FLUSH_INTERVAL);
    } catch (err) {
      console.error('Failed to initialize analytics queue:', err);
    }
  }

  /**
   * Track an event in the analytics system
   * @param eventName Name of the event
   * @param data Additional data to include with the event
   */
  async trackEvent(
    eventName: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      // Add event to queue
      const event: AnalyticsEvent = {
        eventName,
        data,
        timestamp: Date.now(),
      };

      this.eventQueue.push(event);

      // Keep queue size under control
      if (this.eventQueue.length > MAX_QUEUE_SIZE) {
        this.eventQueue = this.eventQueue.slice(-MAX_QUEUE_SIZE);
      }

      // Save queue to storage
      await AsyncStorage.setItem(
        'analytics_queue',
        JSON.stringify(this.eventQueue),
      );

      // Trigger processing if not already in progress
      if (!this.isQueueProcessing && this.eventQueue.length >= 10) {
        this.flushEvents().catch(err => {
          console.error('Failed to flush events after adding new event:', err);
        });
      }
    } catch (err) {
      console.error('Failed to track analytics event:', err);
    }
  }

  /**
   * Track offerwall-related events
   * @param action The action taken (open, close, reward, etc)
   * @param data Additional data about the action
   */
  async trackOfferwallEvent(
    action: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const eventName = `offerwall_${action}`;
    await this.trackEvent(eventName, data);
  }

  /**
   * Send events to the backend if there are any in the queue
   */
  async flushEvents(): Promise<void> {
    if (this.isQueueProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isQueueProcessing = true;

    try {
      // Get events to send
      const eventsToSend = [...this.eventQueue];

      // Send events to backend
      await ApiService.post(ENDPOINTS.TRACK_ANALYTICS, {events: eventsToSend});

      // On successful send, remove these events from queue
      this.eventQueue = [];

      // Update storage with empty queue
      await AsyncStorage.setItem(
        'analytics_queue',
        JSON.stringify(this.eventQueue),
      );
    } catch (err) {
      console.error('Failed to send analytics events:', err);
      // Keep events in queue for next attempt
    } finally {
      this.isQueueProcessing = false;
    }
  }

  /**
   * Clean up when the service is no longer needed
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Flush any remaining events
    this.flushEvents().catch(err => {
      console.error('Failed to flush events during cleanup:', err);
    });
  }
}

export default new AnalyticsService();
