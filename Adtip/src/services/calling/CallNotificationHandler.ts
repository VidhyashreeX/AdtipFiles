// src/services/calling/CallNotificationHandler.ts

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, AndroidVisibility, AndroidCategory } from '@notifee/react-native';
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
      try {
        await this.handleCallNotification(remoteMessage);
      } catch (error) {
        console.error('[CallNotificationHandler] Error handling background message:', error);
        // Don't re-throw to prevent background task failures
      }
    });

    // Handle foreground notifications - CRITICAL: wrap in try/catch to prevent app crashes
    messaging().onMessage(async (remoteMessage) => {
      console.log('[CallNotificationHandler] Foreground message received:', remoteMessage);
      
      try {
        // BULLETPROOF: Always handle incoming messages regardless of app state
        // This ensures foreground messages never crash the app and always show notifications
        await this.handleForegroundCallMessage(remoteMessage);
      } catch (error) {
        console.error('[CallNotificationHandler] Error handling foreground message:', error);
        // CRITICAL: Never re-throw to prevent app crashes
        // Always fallback to basic notification if main handler fails
        await this.fallbackNotificationHandler(remoteMessage);
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[CallNotificationHandler] Notification opened app:', remoteMessage);
      try {
        this.handleNotificationOpen(remoteMessage);
      } catch (error) {
        console.error('[CallNotificationHandler] Error handling notification open:', error);
      }
    });

    // Handle initial notification (app was killed and opened by notification)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[CallNotificationHandler] Initial notification:', remoteMessage);
        try {
          this.handleNotificationOpen(remoteMessage);
        } catch (error) {
          console.error('[CallNotificationHandler] Error handling initial notification:', error);
        }
      }
    }).catch((error) => {
      console.error('[CallNotificationHandler] Error getting initial notification:', error);
    });    console.log('[CallNotificationHandler] FCM handlers setup complete');
  }

  /**
   * Handle foreground FCM messages with bulletproof error handling
   * CRITICAL: This method ensures that foreground FCM messages never crash the app
   * and always result in a Notifee notification for incoming calls
   */
  private async handleForegroundCallMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      console.log('[CallNotificationHandler] Processing foreground FCM message');
      
      if (!remoteMessage?.data) {
        console.log('[CallNotificationHandler] No data in foreground message');
        return;
      }

      const { data } = remoteMessage;
      
      // Check if this is an incoming call
      if (data.isIncomingCall === 'true' || data.type === 'call' || data.type === 'INCOMING_CALL') {
        console.log('[CallNotificationHandler] Incoming call detected in foreground');
        
        // CRITICAL: Always show Notifee notification for incoming calls in foreground
        // This ensures the user can answer/decline even if the app is active
        await this.showForegroundCallNotification(data);
        
        // Also handle the call through the normal flow
        await this.handleCallNotification(remoteMessage);
      } else {
        // Handle other message types normally
        await this.handleCallNotification(remoteMessage);
      }
      
    } catch (error) {
      console.error('[CallNotificationHandler] Error in handleForegroundCallMessage:', error);
      // Don't re-throw - let fallback handler take over
      throw error;
    }
  }

  /**
   * Fallback notification handler when main handler fails
   * CRITICAL: This ensures that even if everything else fails, 
   * we still show a basic notification for incoming calls
   */
  private async fallbackNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      console.log('[CallNotificationHandler] Using fallback notification handler');
      
      if (!remoteMessage?.data) {
        return;
      }

      const { data } = remoteMessage;
      
      // Only handle incoming calls in fallback
      if (data.isIncomingCall === 'true' || data.type === 'call' || data.type === 'INCOMING_CALL') {
        console.log('[CallNotificationHandler] Showing fallback notification for incoming call');
        
        // Show basic notification using Notifee
        await this.showBasicIncomingCallNotification(data);
      }
      
    } catch (fallbackError) {
      console.error('[CallNotificationHandler] Even fallback handler failed:', fallbackError);
      // Final fallback - at least log the attempt
      console.log('[CallNotificationHandler] All notification attempts failed, call may be missed');
    }
  }

  /**
   * Show foreground call notification with answer/decline actions
   * This is shown when the app is in foreground to provide native-like experience
   */
  private async showForegroundCallNotification(data: any): Promise<void> {
    try {
      console.log('[CallNotificationHandler] Showing foreground call notification');
      
      const callNotificationData = {
        callId: String(data.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
        callerName: String(data.callerName || 'Unknown Caller'),
        callType: (String(data.callType) === 'video' ? 'video' : 'voice') as 'voice' | 'video',
        callerId: String(data.callerId || 'unknown'),
        meetingId: String(data.meetingId || ''),
        token: String(data.rtcToken || data.token || ''),
        callerAvatar: data.callerAvatar ? String(data.callerAvatar) : undefined,
      };

      // Let WhatsApp Call Manager handle the notification display
      // This ensures consistent notification behavior across all scenarios
      await this.whatsAppCallManager.handleIncomingCall(callNotificationData);
      
    } catch (error) {
      console.error('[CallNotificationHandler] Error showing foreground call notification:', error);
      // Don't re-throw - let fallback handle it
      throw error;
    }
  }
  /**
   * Show basic incoming call notification as last resort
   * This is the most basic notification possible to prevent missed calls
   */
  private async showBasicIncomingCallNotification(data: any): Promise<void> {
    try {
      console.log('[CallNotificationHandler] Showing basic incoming call notification');
      
      const callerName = String(data.callerName || 'Unknown Caller');
      const callType = String(data.callType) === 'video' ? 'video' : 'voice';
      const callId = String(data.callId || `fallback_call_${Date.now()}`);
      
      // Create basic notification channel if it doesn't exist
      await notifee.createChannel({
        id: 'fallback_incoming_calls',
        name: 'Incoming Calls (Fallback)',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Show basic notification
      await notifee.displayNotification({
        id: `fallback_incoming_${callId}`,
        title: `Incoming ${callType} call`,
        body: `${callerName} is calling you`,
        data: {
          callId,
          callType,
          callerName,
          meetingId: String(data.meetingId || ''),
          token: String(data.rtcToken || data.token || ''),
          isFallback: 'true',
        },
        android: {
          channelId: 'fallback_incoming_calls',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          autoCancel: false,
          ongoing: true,
          actions: [
            {
              title: 'Decline',
              pressAction: { id: 'decline_call' },
            },
            {
              title: 'Answer',
              pressAction: { id: 'accept_call' },
            },
          ],
        },
      });
      
      console.log('[CallNotificationHandler] Basic fallback notification shown');
      
    } catch (error) {
      console.error('[CallNotificationHandler] Failed to show basic notification:', error);
      // Even this failed - nothing more we can do
    }
  }
  /**
   * Handle call notification from FCM
   */
  private async handleCallNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      console.log('[CallNotificationHandler] Processing FCM message:', JSON.stringify(remoteMessage, null, 2));
      
      if (!remoteMessage) {
        console.warn('[CallNotificationHandler] Received null/undefined remote message');
        return;
      }

      if (!remoteMessage.data) {
        console.log('[CallNotificationHandler] No data in remote message');
        return;
      }

      const { data } = remoteMessage;

      // Validate data structure
      if (typeof data !== 'object' || data === null) {
        console.warn('[CallNotificationHandler] Invalid data structure in remote message');
        return;
      }

      // Check if this is a call notification
      if (data.isIncomingCall === 'true' || data.type === 'call') {
        console.log('[CallNotificationHandler] Processing call notification:', data);
        
        try {
          // Extract call data with proper type conversion and validation
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
          
        } catch (callHandlingError) {
          console.error('[CallNotificationHandler] Error processing call notification:', callHandlingError);
          // Don't re-throw to prevent app crashes
        }      } else if (data.type === 'call_status') {
        // Handle call status updates (accepted, declined, ended)
        console.log('[CallNotificationHandler] Processing call status update:', data);
        try {
          this.handleCallStatusUpdate(data);
        } catch (statusError) {
          console.error('[CallNotificationHandler] Error processing call status update:', statusError);
        }
      } else {
        console.log('[CallNotificationHandler] Unknown notification type:', data.type);
      }

    } catch (error) {
      console.error('[CallNotificationHandler] Critical error handling call notification:', error);
      // Don't re-throw to prevent app crashes
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
