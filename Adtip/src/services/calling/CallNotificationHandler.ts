// src/services/calling/CallNotificationHandler.ts

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../../events/AppEventEmitter';
import WhatsAppCallManager from './WhatsAppCallManager';
import { navigate } from '../../navigation/NavigationService';

/**
 * Handles FCM notifications for calls
 * Works with WhatsApp Call Manager for full WhatsApp-like experience
 */
class CallNotificationHandler {
  private static instance: CallNotificationHandler;
  private isInitialized = false;
  private whatsAppCallManager: WhatsAppCallManager;

  private constructor() {
    this.whatsAppCallManager = WhatsAppCallManager.getInstance();
  }

  public static getInstance(): CallNotificationHandler {
    if (!CallNotificationHandler.instance) {
      CallNotificationHandler.instance = new CallNotificationHandler();
    }
    return CallNotificationHandler.instance;
  }

  /**
   * Initialize call notification handling
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[CallNotificationHandler] Already initialized');
        return true;
      }

      console.log('[CallNotificationHandler] Initializing...');

      // Setup FCM message handlers
      this.setupFCMHandlers();

      this.isInitialized = true;
      console.log('[CallNotificationHandler] ✅ Initialized successfully');
      return true;

    } catch (error) {
      console.error('[CallNotificationHandler] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup FCM message handlers
   */
  private setupFCMHandlers(): void {
    // Handle background/killed app notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[CallNotificationHandler] Background message received:', remoteMessage);
      await this.handleCallNotification(remoteMessage);
    });

    // Handle foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      console.log('[CallNotificationHandler] Foreground message received:', remoteMessage);
      
      // Only handle if app is in foreground
      if (AppState.currentState === 'active') {
        await this.handleCallNotification(remoteMessage);
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[CallNotificationHandler] Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Handle initial notification (app was killed and opened by notification)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[CallNotificationHandler] Initial notification:', remoteMessage);
        this.handleNotificationOpen(remoteMessage);
      }
    });

    console.log('[CallNotificationHandler] FCM handlers setup complete');
  }

  /**
   * Handle call notification from FCM
   */
  private async handleCallNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      if (!remoteMessage.data) {
        console.log('[CallNotificationHandler] No data in remote message');
        return;
      }

      const { data } = remoteMessage;

      // Check if this is a call notification
      if (data.isIncomingCall === 'true' || data.type === 'call') {
        console.log('[CallNotificationHandler] Processing call notification:', data);        // Extract call data with proper type conversion
        const callNotificationData = {
          callId: String(data.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
          callerName: String(data.callerName || 'Unknown Caller'),
          callType: (String(data.callType) === 'video' ? 'video' : 'voice') as 'voice' | 'video',
          callerId: String(data.callerId || 'unknown'),
          meetingId: String(data.meetingId || ''),
          token: String(data.rtcToken || data.token || ''),
          callerAvatar: data.callerAvatar ? String(data.callerAvatar) : undefined,
        };

        // Validate required data
        if (!callNotificationData.meetingId || !callNotificationData.token) {
          console.error('[CallNotificationHandler] Missing required call data:', callNotificationData);
          return;
        }

        // Handle incoming call with WhatsApp Call Manager
        await this.whatsAppCallManager.handleIncomingCall(callNotificationData);

        console.log('[CallNotificationHandler] ✅ Call notification processed successfully');
      } else if (data.type === 'call_status') {
        // Handle call status updates (accepted, declined, ended)
        console.log('[CallNotificationHandler] Processing call status update:', data);
        this.handleCallStatusUpdate(data);
      }

    } catch (error) {
      console.error('[CallNotificationHandler] Error handling call notification:', error);
    }
  }

  /**
   * Handle notification that opened the app
   */
  private handleNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    try {
      if (!remoteMessage.data) return;

      const { data } = remoteMessage;

      if (data.isIncomingCall === 'true' || data.type === 'call') {
        // If user tapped on call notification, navigate to appropriate screen
        console.log('[CallNotificationHandler] User opened app from call notification');
        
        // Check if there's an active call
        const currentCall = this.whatsAppCallManager.getCurrentCall();
        if (currentCall && currentCall.status === 'connected') {
          // Navigate to meeting screen
          navigate('Main', {
            screen: 'Meeting',
            params: {
              meetingId: currentCall.meetingId,
              token: currentCall.token,
              callType: currentCall.callType,
              displayName: currentCall.isInitiator ? currentCall.callerName : currentCall.recipientName,
              recipientName: currentCall.isInitiator ? currentCall.recipientName : currentCall.callerName,
              isInitiator: currentCall.isInitiator,
            },
          });
        } else {          // Navigate to TipCall screen
          navigate('Main', {
            screen: 'TipCall',
            params: {}
          });
        }
      }

    } catch (error) {
      console.error('[CallNotificationHandler] Error handling notification open:', error);
    }
  }

  /**
   * Handle call status updates
   */
  private handleCallStatusUpdate(data: any): void {
    try {
      const { status, callId, callerId } = data;

      console.log('[CallNotificationHandler] Call status update:', { status, callId, callerId });

      // Emit app event for call status change
      appEventEmitter.emit('callStatusUpdate', {
        status,
        callId,
        callerId,
      });

      // Handle specific status updates
      switch (status) {
        case 'accepted':
          console.log('[CallNotificationHandler] Call was accepted by recipient');
          // Update call status to connected
          this.whatsAppCallManager.updateCallStatus('connected');
          break;

        case 'declined':
          console.log('[CallNotificationHandler] Call was declined by recipient');
          // End the call
          this.whatsAppCallManager.endCall(callId);
          break;

        case 'ended':
          console.log('[CallNotificationHandler] Call was ended by other participant');
          // End the call
          this.whatsAppCallManager.endCall(callId);
          break;

        case 'missed':
          console.log('[CallNotificationHandler] Call was missed');
          // Handle missed call (maybe show notification)
          break;

        default:
          console.log('[CallNotificationHandler] Unknown call status:', status);
      }

    } catch (error) {
      console.error('[CallNotificationHandler] Error handling call status update:', error);
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      return userId || 'unknown';
    } catch (error) {
      console.error('[CallNotificationHandler] Failed to get current user ID:', error);
      return 'unknown';
    }
  }

  /**
   * Check if notification is for current user
   */
  private async isNotificationForCurrentUser(recipientId: string): Promise<boolean> {
    try {
      const currentUserId = await this.getCurrentUserId();
      return currentUserId === recipientId;
    } catch (error) {
      console.error('[CallNotificationHandler] Error checking notification recipient:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    try {
      // FCM handlers are automatically cleaned up when app is destroyed
      console.log('[CallNotificationHandler] Cleanup completed');
    } catch (error) {
      console.error('[CallNotificationHandler] Cleanup failed:', error);
    }
  }
}

export default CallNotificationHandler;
