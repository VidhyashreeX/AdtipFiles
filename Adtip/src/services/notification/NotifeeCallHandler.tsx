import notifee, { EventType } from '@notifee/react-native';
import { Logger } from '../../utils/logger';
import NavigationService from '../../navigation/SimplifiedNavigationService';

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
   * Initialize Notifee event handlers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[NotifeeCallHandler] Already initialized');
      return;
    }

    try {
      console.log('[NotifeeCallHandler] Initializing notification event handlers...');

      // Handle foreground notification events
      notifee.onForegroundEvent(async ({ type, detail }) => {
        await this.handleNotificationEvent(type, detail, 'foreground');
      });

      // Handle background notification events
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        await this.handleNotificationEvent(type, detail, 'background');
      });

      this.isInitialized = true;
      console.log('[NotifeeCallHandler] ✅ Notification handlers initialized');

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to initialize:', error);
      throw error;
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
      console.log(`[NotifeeCallHandler] ${context} event:`, { type, actionId: detail.pressAction?.id });

      if (type === EventType.ACTION_PRESS) {
        const notificationData = detail.notification?.data;
        const actionId = detail.pressAction?.id;

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
        if (messageType !== 'incoming_call') {
          console.log('[NotifeeCallHandler] Not a call notification, ignoring');
          return;
        }

        console.log('[NotifeeCallHandler] Processing call notification action:', {
          actionId,
          sessionId,
          callerName,
          callType,
          context
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
            await this.handleDeclineCall(sessionId, context);
            break;

          default:
            console.warn('[NotifeeCallHandler] Unknown action:', actionId);
        }
      }

    } catch (error) {
      console.error('[NotifeeCallHandler] Error handling notification event:', error);
      Logger.error('NotifeeCallHandler', 'Notification event handling failed', {
        error: error.message || error,
        context
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

      // Navigate to meeting screen
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
        Logger.info('NotifeeCallHandler', '✅ Call answered - navigated to meeting', {
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
      Logger.error('NotifeeCallHandler', 'Answer call handling failed', {
        error: error.message || error,
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

      Logger.info('NotifeeCallHandler', '✅ Call declined', {
        sessionId,
        context
      });

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to handle decline call:', error);
      Logger.error('NotifeeCallHandler', 'Decline call handling failed', {
        error: error.message || error,
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
      console.log('[NotifeeCallHandler] Displaying incoming call notification:', params);

      // Create high-priority channel if not exists
      const channelId = await notifee.createChannel({
        id: 'adtip_incoming_calls',
        name: 'Incoming Calls',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
      });

      // Display notification
      await notifee.displayNotification({
        id: params.sessionId,
        title: `Incoming ${params.callType} call`,
        body: `${params.callerName} is calling...`,
        android: {
          channelId,
          importance: 4, // HIGH
          category: 'call',
          fullScreenAction: {
            id: 'answer_call',
            launchActivity: 'default',
          },
          actions: [
            {
              title: '✅ Answer',
              pressAction: { 
                id: 'answer',
                launchActivity: 'default'
              },
            },
            {
              title: '❌ Decline',
              pressAction: { id: 'decline' },
            },
          ],
          ongoing: true,
          autoCancel: false,
          sound: 'default',
          vibrationPattern: [300, 1000, 300, 1000],
          pressAction: {
            id: 'default',
            launchActivity: 'default'
          }
        },
        data: {
          sessionId: params.sessionId,
          callerName: params.callerName,
          callType: params.callType,
          meetingId: params.meetingId,
          token: params.token,
          type: 'incoming_call'
        }
      });

      Logger.info('NotifeeCallHandler', '✅ Incoming call notification displayed', params);
      return true;

    } catch (error) {
      console.error('[NotifeeCallHandler] Failed to display incoming call:', error);
      Logger.error('NotifeeCallHandler', 'Display incoming call failed', {
        error: error.message || error,
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
