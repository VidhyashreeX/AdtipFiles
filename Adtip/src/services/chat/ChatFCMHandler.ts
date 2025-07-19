import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { FCMHandler } from '../FCMMessageRouter'

/**
 * Specialized FCM handler for chat-related messages
 * Handles chat notifications without interfering with call handling
 */
export class ChatFCMHandler implements FCMHandler {
  public readonly priority = 50 // Medium priority

  /**
   * Check if this handler can process the message
   */
  canHandle(message: FirebaseMessagingTypes.RemoteMessage): boolean {
    const messageType = this.extractMessageType(message)
    
    const chatMessageTypes = [
      'chat_message'
    ]

    // Also check for notification-based chat messages
    if (message.notification?.title && !this.isCallMessage(messageType)) {
      return true
    }

    return chatMessageTypes.includes(messageType || '')
  }

  /**
   * Handle chat-related FCM messages
   */
  async handle(
    message: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[ChatFCMHandler] Processing chat message:', {
        context,
        messageType: this.extractMessageType(message),
        hasNotification: !!message.notification
      })

      // Route to existing FCMChatService
      const { default: FCMChatService } = await import('../FCMChatService')
      const chatService = FCMChatService.getInstance()

      // Check if chat service is initialized
      if (!chatService.isServiceInitialized()) {
        console.warn('[ChatFCMHandler] FCMChatService not initialized, skipping chat message')
        return
      }

      // Call the chat service's message handler
      await chatService.handleFCMMessageFromRouter(message)
      console.log('[ChatFCMHandler] Chat message processed successfully')

    } catch (error) {
      console.error('[ChatFCMHandler] Error handling chat message:', error)
      // Don't throw for chat errors to avoid breaking call functionality
    }
  }

  /**
   * Extract message type from FCM message
   */
  private extractMessageType(message: FirebaseMessagingTypes.RemoteMessage): string | null {
    // Check new format (info field)
    if (message.data?.info && typeof message.data.info === 'string') {
      try {
        const parsedInfo = JSON.parse(message.data.info)
        return parsedInfo.type || null
      } catch (e) {
        console.warn('[ChatFCMHandler] Failed to parse info field:', e)
      }
    }

    // Check legacy format (direct type)
    if (message.data?.type && typeof message.data.type === 'string') {
      return message.data.type
    }

    return null
  }

  /**
   * Check if message is call-related (to avoid conflicts)
   */
  private isCallMessage(messageType: string | null): boolean {
    if (!messageType) return false

    const callMessageTypes = [
      'CALL_INITIATED', 'CALL_INITIATE',
      'CALL_ACCEPT', 'CALL_ACCEPTED',
      'CALL_END', 'CALL_ENDED',
      'CALL_REJECT', 'CALL_REJECTED'
    ]

    return callMessageTypes.includes(messageType)
  }
}
