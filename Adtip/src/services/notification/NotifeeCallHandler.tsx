import notifee, { EventType } from '@notifee/react-native';
import { logCall, logError } from '../../utils/ProductionLogger';
import NavigationService from '../../navigation/SimplifiedNavigationService';
import CallController from '../calling/CallController';

/**
 * Notifee Call Handler
 * 
 * Handles Notifee notification events for incoming calls
 * Provides proper navigation to meeting screen when call is answered
 */
class NotifeeCallHandler {
  private static instance: NotifeeCallHandler;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotifeeCallHandler {
    if (!NotifeeCallHandler.instance) {
      NotifeeCallHandler.instance = new NotifeeCallHandler();
    }
    return NotifeeCallHandler.instance;
  }

  /**
   * Check if handler is initialized
   */
  get isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Initialize Notifee event handlers
   * Enhanced for killed app state support
   */
  async initialize(): Promise<void> {
    try {
      console.log('[NotifeeCallHandler] Initializing notification event handlers for all app states...');

      // Always set up handlers (even if already initialized) to ensure they work in killed state
      // This is safe because Notifee handles multiple registrations gracefully

      // Handle foreground notification events
      notifee.onForegroundEvent(async ({ type, detail }) => {
        await this.handleNotificationEvent(type, detail, 'foreground');
      });

      // Handle background notification events (including killed state)
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        console.log('[NotifeeCallHandler] Background event received:', {
          type,
          actionId: detail.pressAction?.id,
          notificationId: detail.notification?.id
        });
        await this.handleNotificationEvent(type, detail, 'background');
      });

      this.isInitialized = true;
      console.log('[NotifeeCallHandler] ✅ Notification handlers initialized for all app states');

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to initialize:', error);
      // Don't throw in killed state scenarios - just log and continue
      console.warn('[NotifeeCallHandler] Continuing despite initialization error to prevent app crashes');
    }
  }

  /**
   * Handle notification events (both foreground and background)
   */
  private async handleNotificationEvent(
    type: EventType,
    detail: any,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log(`[NotifeeCallHandler] ${context} event:`, {
        type,
        actionId: detail.pressAction?.id,
        notificationId: detail.notification?.id,
        hasData: !!detail.notification?.data
      });

      // Handle both ACTION_PRESS and PRESS events for maximum compatibility
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const notificationData = detail.notification?.data;
        const actionId = detail.pressAction?.id || 'default';

        if (!notificationData) {
          console.warn('[NotifeeCallHandler] No notification data found');
          return;
        }

        const {
          sessionId,
          callerName,
          callType,
          meetingId,
          token,
          type: messageType
        } = notificationData;

        // Only handle call-related notifications
        // Check multiple possible indicators for call notifications
        const isCallNotification = messageType === 'incoming_call' ||
                                   notificationData.type === 'incoming_call' ||
                                   notificationData.callType ||
                                   notificationData.sessionId ||
                                   notificationData.meetingId;

        if (!isCallNotification) {
          console.log('[NotifeeCallHandler] Not a call notification, ignoring. Data:', notificationData);
          return;
        }

        console.log('[NotifeeCallHandler] Processing call notification action:', {
          actionId,
          sessionId,
          callerName,
          callType,
          context,
          eventType: type
        });

        switch (actionId) {
          case 'answer':
          case 'answer_call':
          case 'default':
            await this.handleAnswerCall({
              sessionId,
              callerName,
              callType,
              meetingId,
              token,
              context
            });
            break;

          case 'decline':
          case 'end':
            await this.handleDeclineCall(sessionId, context);
            break;

          default:
            console.warn('[NotifeeCallHandler] Unknown action:', actionId);
        }
      }

    } catch (error) {
      console.error('[NotifeeCallHandler] Error handling notification event:', error);
      logError('NotifeeCallHandler', 'Notification event handling failed', {
        error: error instanceof Error ? error.message : String(error),
        context,
        eventType: type
      });
    }
  }

  /**
   * Handle answer call action
   */
  private async handleAnswerCall(params: {
    sessionId: string;
    callerName: string;
    callType: string;
    meetingId?: string;
    token?: string;
    context: 'foreground' | 'background';
  }): Promise<void> {
    try {
      console.log('[NotifeeCallHandler] Handling answer call:', params);

      // Dismiss the notification
      await notifee.cancelNotification(params.sessionId);

      // Use provided meeting details or generate fallback
      const meetingId = params.meetingId || `meeting-${Date.now()}`;
      const token = params.token || `token-${Date.now()}`;

      // Initialize session in call store for proper call acceptance
      const { useCallStore } = await import('../../stores/callStoreSimplified');
      const store = useCallStore.getState();

      console.log('[NotifeeCallHandler] Current call store state:', {
        hasSession: !!store.session,
        currentSessionId: store.session?.sessionId,
        targetSessionId: params.sessionId,
        status: store.status
      });

      if (!store.session || store.session.sessionId !== params.sessionId) {
        console.log('[NotifeeCallHandler] Initializing session for call acceptance');
        store.actions.setSession({
          sessionId: params.sessionId,
          meetingId,
          token,
          peerId: 'unknown',
          peerName: params.callerName,
          direction: 'incoming',
          type: params.callType === 'video' ? 'video' : 'voice',
          startedAt: Date.now()
        });

        // Set status to ringing so acceptCall() can work
        store.actions.setStatus('ringing');
        console.log('[NotifeeCallHandler] Session initialized and status set to ringing');
      }

      // Try to accept the call through CallController
      try {
        const callController = CallController.getInstance();
        const callAccepted = await callController.acceptCall();
        console.log('[NotifeeCallHandler] CallController.acceptCall() result:', callAccepted);
      } catch (acceptError) {
        console.warn('[NotifeeCallHandler] CallController.acceptCall() failed, proceeding with navigation:', acceptError);
      }

      // Navigate to meeting screen regardless of CallController result
      const navigationSuccess = NavigationService.navigateToMeeting({
        meetingId,
        token,
        displayName: 'User', // This should be the current user's name
        callType: params.callType === 'video' ? 'video' : 'voice',
        isInitiator: false, // This is an incoming call
        recipientName: params.callerName,
        callData: {
          sessionId: params.sessionId,
          direction: 'incoming',
          type: params.callType,
          callerName: params.callerName
        }
      });

      if (navigationSuccess) {
        logCall('NotifeeCallHandler', '✅ Call answered - navigated to meeting', {
          sessionId: params.sessionId,
          callerName: params.callerName,
          callType: params.callType,
          context: params.context
        });
      } else {
        throw new Error('Navigation to meeting screen failed');
      }

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to handle answer call:', error);
      logError('NotifeeCallHandler', 'Answer call handling failed', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: params.sessionId
      });
    }
  }

  /**
   * Handle decline call action
   */
  private async handleDeclineCall(sessionId: string, context: string): Promise<void> {
    try {
      console.log('[NotifeeCallHandler] Handling decline call:', { sessionId, context });

      // Dismiss the notification
      await notifee.cancelNotification(sessionId);

      logCall('NotifeeCallHandler', '✅ Call declined', {
        sessionId,
        context
      });

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to handle decline call:', error);
      logError('NotifeeCallHandler', 'Decline call handling failed', {
        error: error instanceof Error ? error.message : String(error),
        sessionId
      });
    }
  }

  /**
   * Create and display incoming call notification
   */
  async displayIncomingCall(params: {
    sessionId: string;
    callerName: string;
    callType: 'voice' | 'video';
    meetingId?: string;
    token?: string;
  }): Promise<boolean> {
    try {
      console.log('[NotifeeCallHandler] 🔔 DISPLAYING INCOMING CALL NOTIFICATION:', params);

      // Check if Notifee is available
      if (!notifee) {
        console.error('[NotifeeCallHandler] ❌ Notifee is not available');
        return false;
      }

      // Check notification permissions
      const settings = await notifee.getNotificationSettings();
      console.log('[NotifeeCallHandler] 🔔 Notification settings:', settings);

      if (settings.authorizationStatus !== 1) { // AUTHORIZED = 1
        console.warn('[NotifeeCallHandler] ⚠️ Notifications not authorized:', settings.authorizationStatus);
      }

      // Use the same channel ID as chat notifications to match Firebase messaging behavior
      const channelId = 'chat_messages';

      // Ensure channel exists (defensive programming) - using same config as chat notifications
      console.log('[NotifeeCallHandler] 🔔 Creating/verifying channel:', channelId);
      const createdChannelId = await notifee.createChannel({
        id: channelId,
        name: 'Chat Messages',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500], // Match chat notification pattern
        lights: true,
        lightColor: '#00D4AA',
        badge: true, // Match chat notification config
      });
      console.log('[NotifeeCallHandler] 🔔 Channel created/verified:', createdChannelId);

      // Display notification
      console.log('[NotifeeCallHandler] 🔔 About to display notification with data:', {
        id: params.sessionId,
        channelId,
        title: `Incoming ${params.callType} call`,
        body: `${params.callerName} is calling...`
      });

      const notificationResult = await notifee.displayNotification({
        id: params.sessionId,
        title: `Incoming ${params.callType} call`,
        body: `${params.callerName} is calling...`,
        android: {
          channelId,
          importance: 4, // HIGH
          category: 'call' as any,
          fullScreenAction: {
            id: 'answer_call',
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: 'answer',
                launchActivity: 'default'
              },
            },
            {
              title: 'Decline',
              pressAction: { id: 'decline' },
            },
            {
              title: 'End',
              pressAction: { id: 'end' },
            },
          ],
          ongoing: true,
          autoCancel: false,
          sound: 'default',
          vibrationPattern: [300, 500], // Match chat notification pattern
          pressAction: {
            id: 'default',
            launchActivity: 'default'
          },
          // Use same icon as chat notifications to generate same Firebase logs
          smallIcon: 'ic_notification',
          color: '#FF6B35' // Match chat notification color
        },
        data: {
          sessionId: params.sessionId,
          callerName: params.callerName,
          callType: params.callType,
          type: params.callType,
          meetingId: params.meetingId || '',
          token: params.token || '',
          messageType: 'incoming_call'
        }
      });

      console.log('[NotifeeCallHandler] 🔔 ✅ INCOMING CALL NOTIFICATION DISPLAYED SUCCESSFULLY:', notificationResult);
      logCall('NotifeeCallHandler', '✅ Incoming call notification displayed', params);
      return true;

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to display incoming call:', error);
      logError('NotifeeCallHandler', 'Display incoming call failed', {
        error: error instanceof Error ? error.message : String(error),
        ...params
      });
      return false;
    }
  }

  /**
   * Cancel all call notifications
   */
  async cancelAllCallNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('[NotifeeCallHandler] All call notifications cancelled');
    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to cancel notifications:', error);
    }
  }
}

export default NotifeeCallHandler;
