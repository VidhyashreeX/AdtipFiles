// src/services/calling/WhatsAppCallNotificationService.ts

import notifee, { 
  AndroidImportance, 
  AndroidVisibility, 
  AndroidCategory,
  EventType,
  Event,
  Notification,
  TriggerType
} from '@notifee/react-native';
import { Platform, DeviceEventEmitter, NativeModules, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CallService from '../CallService';
import { appEventEmitter } from '../../events/AppEventEmitter';

interface CallNotificationData {
  callId: string;
  callerName: string;
  callType: 'voice' | 'video';
  callerId: string;
  meetingId: string;
  token: string;
  callerAvatar?: string;
}

interface OngoingCallData {
  callId: string;
  participantName: string;
  callType: 'voice' | 'video';
  startTime: number;
  status: 'connecting' | 'connected' | 'ringing';
}

class WhatsAppCallNotificationService {
  private static instance: WhatsAppCallNotificationService;
  private currentIncomingCallId: string | null = null;
  private currentOngoingCallId: string | null = null;
  private channelCreated = false;
  private isInitialized = false;

  private constructor() {
    this.initializeNotifee();
  }

  public static getInstance(): WhatsAppCallNotificationService {
    if (!WhatsAppCallNotificationService.instance) {
      WhatsAppCallNotificationService.instance = new WhatsAppCallNotificationService();
    }
    return WhatsAppCallNotificationService.instance;
  }

  /**
   * Initialize notifee and setup channels
   */
  private async initializeNotifee(): Promise<void> {
    try {
      console.log('[WhatsAppCallNotification] Initializing notifee...');
      
      // Request permissions
      await this.requestPermissions();
      
      // Create notification channels
      await this.createNotificationChannels();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('[WhatsAppCallNotification] Initialized successfully');
    } catch (error) {
      console.error('[WhatsAppCallNotification] Initialization failed:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      
      // For Android 13+, request specific permissions
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await notifee.requestPermission({
          alert: true,
          badge: true,
          sound: true,
        });
      }
      
      console.log('[WhatsAppCallNotification] Permission status:', settings.authorizationStatus);
      return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
    } catch (error) {
      console.error('[WhatsAppCallNotification] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Create notification channels for different call types
   */
  private async createNotificationChannels(): Promise<void> {
    if (this.channelCreated) return;

    try {
      // Incoming call channel (highest priority)
      await notifee.createChannel({
        id: 'incoming_calls',
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        bypassDnd: true,
      });      // Ongoing call channel (for foreground service)
      await notifee.createChannel({
        id: 'ongoing_calls',
        name: 'Ongoing Calls',
        importance: AndroidImportance.LOW,
        sound: 'none',
        vibration: false,
      });

      // Call ended channel
      await notifee.createChannel({
        id: 'call_ended',
        name: 'Call Status',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
        vibration: false,
      });

      this.channelCreated = true;
      console.log('[WhatsAppCallNotification] Notification channels created');
    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to create channels:', error);
    }
  }

  /**
   * Setup notifee event listeners
   */
  private setupEventListeners(): void {
    // Listen for notification events
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      console.log('[WhatsAppCallNotification] Foreground event:', type, detail);
      
      if (detail.notification?.data) {
        await this.handleNotificationEvent(type, detail.notification.data);
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      console.log('[WhatsAppCallNotification] Background event:', type, detail);
      
      if (detail.notification?.data) {
        await this.handleNotificationEvent(type, detail.notification.data);
      }
    });

    // Listen for app state changes to manage ongoing notifications
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle notification events (answer, decline, etc.)
   */
  private async handleNotificationEvent(eventType: EventType, data: any): Promise<void> {
    const { callId, action } = data;
    
    try {
      switch (eventType) {
        case EventType.ACTION_PRESS:
          if (action === 'answer') {            console.log('[WhatsAppCallNotification] Call answered from notification');
            await this.dismissIncomingCallNotification();
            
            // Update call status and navigate to meeting
            const callService = CallService;
            callService.updateCallStatus('connected');
            
            // Emit answer event
            appEventEmitter.emit('callAnswered', { callId });
            
          } else if (action === 'decline') {            console.log('[WhatsAppCallNotification] Call declined from notification');
            await this.dismissIncomingCallNotification();
            
            // End the call
            const callService = CallService;
            await callService.endCall('declined_from_notification');
            
            // Emit decline event
            appEventEmitter.emit('callDeclined', { callId });
          }
          break;
          
        case EventType.PRESS:
          // Handle notification tap (for ongoing calls)
          if (data.callType === 'ongoing') {
            console.log('[WhatsAppCallNotification] Ongoing call notification tapped');
            // Navigate back to meeting screen
            appEventEmitter.emit('navigateToMeeting', { callId });
          }
          break;
      }
    } catch (error) {
      console.error('[WhatsAppCallNotification] Error handling notification event:', error);
    }
  }

  /**
   * Handle app state changes
   */  private handleAppStateChange(nextAppState: string): void {
    const callService = CallService;
    
    if (nextAppState === 'background' && callService.activeCall) {
      // App went to background during a call - show ongoing notification
      this.showOngoingCallNotification({
        callId: callService.activeCall.callId || 'unknown',
        participantName: callService.activeCall.isInitiator 
          ? callService.activeCall.recipientName 
          : callService.activeCall.callerName,
        callType: callService.activeCall.callType,
        startTime: callService.activeCall.timestamp || Date.now(),
        status: callService.activeCall.status === 'connected' ? 'connected' : 'connecting'
      });
    } else if (nextAppState === 'active') {
      // App came to foreground - dismiss ongoing notification
      this.dismissOngoingCallNotification();
    }
  }

  /**
   * Show WhatsApp-like incoming call notification
   */
  public async showIncomingCallNotification(data: CallNotificationData): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeNotifee();
    }

    try {
      console.log('[WhatsAppCallNotification] Showing incoming call notification:', data);

      // Dismiss any existing incoming call notification
      await this.dismissIncomingCallNotification();

      const callTypeText = data.callType === 'video' ? 'Video' : 'Voice';
      
      // Create full-screen notification for incoming call
      await notifee.displayNotification({
        title: `Incoming ${callTypeText} Call`,
        body: `${data.callerName} is calling you`,
        data: {
          callId: data.callId,
          callType: data.callType,
          callerId: data.callerId,
          meetingId: data.meetingId,
          token: data.token,
          notificationType: 'incoming_call'
        },
        android: {
          channelId: 'incoming_calls',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          fullScreenAction: {
            id: 'incoming_call_fullscreen',
          },
          pressAction: {
            id: 'open_call',
          },
          actions: [            {
              title: '📞 Answer',
              pressAction: {
                id: 'answer',
              },
            },
            {
              title: '❌ Decline',
              pressAction: {
                id: 'decline',
              },
            },          ],
          style: {
            type: 1, // BIG_TEXT_STYLE
            text: `${data.callerName} is calling you. Tap to answer or decline.`,
          },
          smallIcon: 'ic_call', // Required for Android notifications
          largeIcon: data.callerAvatar || undefined,
          sound: 'default',
          vibrationPattern: [0, 300, 500, 300, 500],
          autoCancel: false,
          ongoing: true,
          colorized: true,
          color: '#4CAF50', // Green for calls
        },
        ios: {
          categoryId: 'call',
          sound: 'default',
          critical: true,
          interruptionLevel: 'critical',
        },
      });

      this.currentIncomingCallId = data.callId;
      
      // Auto-dismiss after 30 seconds if not answered
      setTimeout(async () => {
        if (this.currentIncomingCallId === data.callId) {
          await this.dismissIncomingCallNotification();
          console.log('[WhatsAppCallNotification] Auto-dismissed incoming call notification');
        }
      }, 30000);

    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to show incoming call notification:', error);
    }
  }

  /**
   * Show ongoing call notification (when app is in background)
   */
  public async showOngoingCallNotification(data: OngoingCallData): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeNotifee();
    }

    try {
      console.log('[WhatsAppCallNotification] Showing ongoing call notification:', data);

      const duration = Math.floor((Date.now() - data.startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const callTypeText = data.callType === 'video' ? 'Video' : 'Voice';
      const statusText = data.status === 'connected' ? durationText : 'Connecting...';

      await notifee.displayNotification({
        title: `${callTypeText} Call - ${statusText}`,
        body: `In call with ${data.participantName}`,
        data: {
          callId: data.callId,
          callType: 'ongoing',
          notificationType: 'ongoing_call'
        },
        android: {
          channelId: 'ongoing_calls',
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          colorized: true,
          color: '#00D4AA', // VideoSDK brand color
          smallIcon: 'ic_call',
          actions: [
            {
              title: '🔇 Mute',
              pressAction: {
                id: 'toggle_mute',
              },
            },
            {
              title: '📞 End Call',
              pressAction: {
                id: 'end_call',
              },
            },
          ],
          pressAction: {
            id: 'open_call',
          },
        },
        ios: {
          categoryId: 'ongoing_call',
        },
      });

      this.currentOngoingCallId = data.callId;

      // Update notification every second for duration
      if (data.status === 'connected') {
        this.startOngoingCallTimer(data);
      }

    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to show ongoing call notification:', error);
    }
  }

  /**
   * Start timer to update ongoing call notification
   */
  private startOngoingCallTimer(data: OngoingCallData): void {
    const updateInterval = setInterval(async () => {
      if (this.currentOngoingCallId !== data.callId || AppState.currentState === 'active') {
        clearInterval(updateInterval);
        return;
      }

      // Update notification with new duration
      await this.showOngoingCallNotification({
        ...data,
        status: 'connected'
      });
    }, 1000);
  }

  /**
   * Show call ended notification
   */
  public async showCallEndedNotification(callerName: string, duration: number, callType: 'voice' | 'video'): Promise<void> {
    try {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = duration > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '';
      
      const callTypeText = callType === 'video' ? 'Video' : 'Voice';
      const bodyText = duration > 0 ? `Call duration: ${durationText}` : 'Call ended';

      await notifee.displayNotification({
        title: `${callTypeText} Call Ended`,
        body: `${callerName} - ${bodyText}`,        android: {
          channelId: 'call_ended',
          importance: AndroidImportance.DEFAULT,
          autoCancel: true,
          color: '#FF6B6B',
          smallIcon: 'ic_call', // Required for Android notifications
        },
        ios: {
          categoryId: 'call_ended',
        },
      });

    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to show call ended notification:', error);
    }
  }

  /**
   * Dismiss incoming call notification
   */
  public async dismissIncomingCallNotification(): Promise<void> {
    try {
      if (this.currentIncomingCallId) {
        await notifee.cancelNotification(this.currentIncomingCallId);
        this.currentIncomingCallId = null;
        console.log('[WhatsAppCallNotification] Incoming call notification dismissed');
      }
    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to dismiss incoming call notification:', error);
    }
  }

  /**
   * Dismiss ongoing call notification
   */
  public async dismissOngoingCallNotification(): Promise<void> {
    try {
      if (this.currentOngoingCallId) {
        await notifee.cancelNotification(this.currentOngoingCallId);
        this.currentOngoingCallId = null;
        console.log('[WhatsAppCallNotification] Ongoing call notification dismissed');
      }
    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to dismiss ongoing call notification:', error);
    }
  }

  /**
   * Cancel all call-related notifications
   */
  public async cancelAllCallNotifications(): Promise<void> {
    try {
      await this.dismissIncomingCallNotification();
      await this.dismissOngoingCallNotification();
        // Cancel any remaining notifications from call channels
      const notifications = await notifee.getDisplayedNotifications();
      for (const notification of notifications) {
        if (notification.id) {
          await notifee.cancelNotification(notification.id);
        }
      }
      
      console.log('[WhatsAppCallNotification] All call notifications cancelled');
    } catch (error) {
      console.error('[WhatsAppCallNotification] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Check if service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    this.cancelAllCallNotifications();
    this.currentIncomingCallId = null;
    this.currentOngoingCallId = null;
  }
}

export default WhatsAppCallNotificationService;
