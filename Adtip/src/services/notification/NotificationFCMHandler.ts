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
   * This is a fallback handler, but should exclude chat and call messages
   */
  canHandle(message: FirebaseMessagingTypes.RemoteMessage): boolean {
    // Extract message type from data or info field
    const messageType = this.extractMessageType(message)

    // Exclude chat messages (handled by ChatFCMHandler)
    const chatMessageTypes = ['chat_message']
    if (chatMessageTypes.includes(messageType || '')) {
      return false
    }

    // Exclude call messages (handled by CallFCMHandler)
    const callMessageTypes = [
      'CALL_INITIATED', 'CALL_INITIATE',
      'CALL_ACCEPT', 'CALL_ACCEPTED',
      'CALL_END', 'CALL_ENDED',
      'CALL_REJECT', 'CALL_REJECTED'
    ]
    if (callMessageTypes.includes(messageType || '')) {
      return false
    }

    // Accept other notification messages
    return true
  }

  /**
   * Extract message type from FCM message data or info field
   */
  private extractMessageType(message: FirebaseMessagingTypes.RemoteMessage): string | null {
    // Check direct data.type
    if (message.data?.type) {
      return message.data.type as string
    }

    // Check info field (new format)
    if (message.data?.info && typeof message.data.info === 'string') {
      try {
        const parsedInfo = JSON.parse(message.data.info)
        return parsedInfo.type || null
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return null
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
