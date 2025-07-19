import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { AppState } from 'react-native'
import { FCMHandler } from '../FCMMessageRouter'

/**
 * Specialized FCM handler for general notification messages
 * Handles all non-call, non-chat notifications
 */
export class NotificationFCMHandler implements FCMHandler {
  public readonly priority = 10 // Lowest priority (fallback)

  /**
   * Check if this handler can process the message
   * This is a fallback handler, so it accepts any message not handled by others
   */
  canHandle(message: FirebaseMessagingTypes.RemoteMessage): boolean {
    // This handler accepts any message as a fallback
    // It should be registered last in the priority order
    return true
  }

  /**
   * Handle general notification messages
   */
  async handle(
    message: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[NotificationFCMHandler] Processing general notification:', {
        context,
        hasNotification: !!message.notification,
        data: message.data
      })

      // Handle based on context
      if (context === 'foreground' && AppState.currentState === 'active') {
        await this.handleForegroundNotification(message)
      } else {
        await this.handleBackgroundNotification(message)
      }

      console.log('[NotificationFCMHandler] General notification processed successfully')

    } catch (error) {
      console.error('[NotificationFCMHandler] Error handling notification:', error)
      // Don't throw to prevent app crashes
    }
  }

  /**
   * Handle notification when app is in foreground
   */
  private async handleForegroundNotification(message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      // Show in-app notification or toast
      if (message.notification) {
        console.log('[NotificationFCMHandler] Showing foreground notification:', message.notification.title)
        
        // You can implement your in-app notification system here
        // For example, using a toast library or custom notification component
        
        // Example: Show toast notification
        // Toast.show({
        //   type: 'info',
        //   text1: message.notification.title,
        //   text2: message.notification.body,
        // })
      }
    } catch (error) {
      console.error('[NotificationFCMHandler] Error showing foreground notification:', error)
    }
  }

  /**
   * Handle notification when app is in background
   */
  private async handleBackgroundNotification(message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      console.log('[NotificationFCMHandler] Processing background notification')
      
      // Background notifications are typically handled by the system
      // Additional processing can be added here if needed
      
      // Example: Update badge count, store notification data, etc.
      if (message.data) {
        // Process notification data
        console.log('[NotificationFCMHandler] Processing notification data:', message.data)
      }
      
    } catch (error) {
      console.error('[NotificationFCMHandler] Error processing background notification:', error)
    }
  }


}
