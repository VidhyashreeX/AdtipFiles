import { useEffect } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { FCMMessageRouter } from '../services/FCMMessageRouter';

/**
 * Hook to set up centralized FCM message routing for both call and chat messages
 * 
 * This hook replaces the conflicting FCM handlers and provides a single
 * entry point for all foreground FCM messages, routing them to appropriate
 * handlers based on message type.
 * 
 * Features:
 * - Preserves existing call FCM functionality completely
 * - Adds chat FCM handling capability
 * - Prevents handler conflicts and race conditions
 * - Maintains backward compatibility
 */
export function useFCMMessageRouter() {
  useEffect(() => {
    let router: FCMMessageRouter | null = null;
    let unsubscribeForeground: (() => void) | null = null;
    let unsubscribeNotifee: (() => void) | null = null;

    const initializeRouter = async () => {
      try {
        console.log('[useFCMMessageRouter] Initializing centralized FCM router...');
        
        // Get router instance
        router = FCMMessageRouter.getInstance();
        await router.initialize();

        // Set up single foreground FCM handler that routes to appropriate services
        unsubscribeForeground = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          try {
            console.log('[useFCMMessageRouter] Foreground FCM message received:', remoteMessage.data);
            
            // Route message to appropriate handler (call or chat)
            await router!.routeMessage(remoteMessage, 'foreground');
            console.log('[useFCMMessageRouter] Foreground message routed successfully');
          } catch (error) {
            console.error('[useFCMMessageRouter] Error routing foreground message:', error);
          }
        });

        // Set up notification action handlers (preserving call functionality)
        unsubscribeNotifee = notifee.onForegroundEvent(async ({ type, detail }) => {
          try {
            if (type === EventType.ACTION_PRESS) {
              console.log('[useFCMMessageRouter] Notification action pressed:', detail.pressAction?.id);

              // Handle call notification actions (preserving existing logic)
              const sessionId = detail.notification?.data?.sessionId as string;
              if (sessionId) {
                // Import CallController dynamically to handle call actions
                const { default: CallController } = await import('../services/calling/CallController');
                const callController = CallController.getInstance();

                switch (detail.pressAction?.id) {
                  case 'answer':
                    await callController.acceptCall();
                    break;
                  case 'decline':
                  case 'end':
                    await callController.endCall();
                    break;
                  default:
                    console.warn('[useFCMMessageRouter] Unknown notification action:', detail.pressAction?.id);
                }
              }

              // Handle chat notification actions (future enhancement)
              const conversationId = detail.notification?.data?.conversationId as string;
              if (conversationId) {
                console.log('[useFCMMessageRouter] Chat notification tapped, conversationId:', conversationId);
                // TODO: Navigate to chat screen
              }
            }
          } catch (error) {
            console.error('[useFCMMessageRouter] Error handling notification action:', error);
          }
        });

        console.log('[useFCMMessageRouter] Centralized FCM router initialized successfully');
      } catch (error) {
        console.error('[useFCMMessageRouter] Failed to initialize FCM router:', error);
      }
    };

    // Initialize router
    initializeRouter();

    // Cleanup function
    return () => {
      console.log('[useFCMMessageRouter] Cleaning up FCM router...');
      
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
      
      if (unsubscribeNotifee) {
        unsubscribeNotifee();
      }
    };
  }, []);
}

export default useFCMMessageRouter;
