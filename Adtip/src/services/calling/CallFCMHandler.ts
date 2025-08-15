import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { Linking } from 'react-native'
import { FCMHandler } from '../FCMMessageRouter'
import CallUICoordinator from './CallUICoordinator'
import { useCallStore } from '../../stores/callStoreSimplified'

/**
 * Specialized FCM handler for call-related messages
 * Implements VideoSDK CallKeep integration best practices
 */
export class CallFCMHandler implements FCMHandler {
  public readonly priority = 100 // Highest priority

  private callUICoordinator: CallUICoordinator

  constructor() {
    this.callUICoordinator = CallUICoordinator.getInstance()
  }

  /**
   * Check if this handler can process the message
   * Updated to handle incoming_call and call types for killed state compatibility
   */
  canHandle(message: FirebaseMessagingTypes.RemoteMessage): boolean {
    const messageType = this.extractMessageType(message)
    const messageData = message.data || {}

    const callMessageTypes = [
      'call', 'incoming_call',  // Added for killed state compatibility
      'CALL_INITIATED', 'CALL_INITIATE',
      'CALL_ACCEPT', 'CALL_ACCEPTED',
      'CALL_END', 'CALL_ENDED',
      'CALL_REJECT', 'CALL_REJECTED'
    ]

    // Check message type
    if (messageType && callMessageTypes.includes(messageType)) {
      return true
    }

    // Also check for call-specific data fields (same as index.js and FCMMessageRouter)
    if (messageData.sessionId || messageData.callType || messageData.callerName) {
      return true
    }

    return false
  }

  /**
   * Handle call-related FCM messages
   */
  async handle(
    message: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[CallFCMHandler] Processing call message:', {
        context,
        messageType: this.extractMessageType(message),
        data: message.data
      })

      const messageType = this.extractMessageType(message)
      const callData = this.parseCallData(message)

      if (!callData) {
        console.error('[CallFCMHandler] Invalid call data in message')
        return
      }

      switch (messageType) {
        case 'call':
        case 'incoming_call':  // Handle killed state call notifications
        case 'CALL_INITIATED':
        case 'CALL_INITIATE':
          await this.handleIncomingCall(callData, context)
          break

        case 'CALL_ACCEPT':
        case 'CALL_ACCEPTED':
          await this.handleCallAccepted(callData, context)
          break

        case 'CALL_END':
        case 'CALL_ENDED':
        case 'CALL_REJECT':
        case 'CALL_REJECTED':
          await this.handleCallEnded(callData, context)
          break

        default:
          console.warn('[CallFCMHandler] Unknown call message type:', messageType)
      }

    } catch (error) {
      console.error('[CallFCMHandler] Error handling call message:', error)
      throw error
    }
  }

  /**
   * Handle incoming call using CallUICoordinator for optimal UI management
   */
  private async handleIncomingCall(callData: any, _context: string): Promise<void> {
    try {
      console.log('[CallFCMHandler] Handling incoming call with UI coordinator:', callData)

      // Create session object
      const session = {
        sessionId: callData.sessionId,
        meetingId: callData.meetingId,
        token: callData.token,
        peerId: callData.callerId || 'unknown',
        peerName: callData.callerName,
        type: callData.callType || 'video',
        direction: 'incoming' as const
      }

      // Update call store
      const store = useCallStore.getState()
      store.actions.setStatus('ringing')
      store.actions.setSession(session)

      // Inform ReliableCallManager about the session for notification action handling
      const ReliableCallManager = (await import('./ReliableCallManager')).default
      const reliableCallManager = ReliableCallManager.getInstance()
      if (reliableCallManager.isReady()) {
        // Set the current session in ReliableCallManager so it can handle notification actions
        ;(reliableCallManager as any).currentCallSession = session
        console.log('[CallFCMHandler] Informed ReliableCallManager about session:', session.sessionId)
      }

      // Initialize CallUICoordinator
      await this.callUICoordinator.initialize()

      // Use CallUICoordinator to show appropriate UI
      const success = await this.callUICoordinator.showIncomingCall({
        sessionId: callData.sessionId || callData.uuid,
        callerName: callData.callerName || 'Unknown Caller',
        callType: callData.callType || 'video',
        meetingId: callData.meetingId,
        token: callData.token
      })

      if (success) {
        console.log('[CallFCMHandler] Call UI displayed successfully via coordinator')
      } else {
        console.error('[CallFCMHandler] Failed to display call UI via coordinator')
      }

    } catch (error) {
      console.error('[CallFCMHandler] Error handling incoming call:', error)

      // Final fallback - try to show custom notification directly
      try {
        const { default: NotificationService } = await import('./NotificationService')
        const notificationService = NotificationService.getInstance()
        await notificationService.showIncomingCall(
          callData.sessionId,
          callData.callerName || 'Unknown Caller',
          callData.callType || 'video'
        )
      } catch (fallbackError) {
        console.error('[CallFCMHandler] Final fallback also failed:', fallbackError)
      }
    }
  }

  /**
   * Handle call accepted message
   */
  private async handleCallAccepted(callData: any, _context: string): Promise<void> {
    console.log('[CallFCMHandler] Call accepted by remote party')
    
    // Navigate to call screen
    const deepLink = this.createCallDeepLink(callData)
    await this.navigateToCall(deepLink)
  }

  /**
   * Handle call ended/rejected message
   */
  private async handleCallEnded(callData: any, _context: string): Promise<void> {
    console.log('[CallFCMHandler] Call ended/rejected')

    // Use CallUICoordinator to properly end call and cleanup UI
    await this.callUICoordinator.endCall(callData.sessionId || callData.uuid)

    // Clean up call state
    const store = useCallStore.getState()
    store.actions.reset()
  }

  /**
   * Create deep link for call navigation
   */
  private createCallDeepLink(callData: any): string {
    // Use the enhanced call routes for better navigation
    const baseUrl = 'adtip://call/active'
    const path = `${baseUrl}/${callData.sessionId}/${callData.meetingId}/${encodeURIComponent(callData.token)}`

    // Add additional parameters as query string
    const params = new URLSearchParams({
      callerName: callData.callerName || 'Unknown',
      callType: callData.callType || 'video'
    })

    return `${path}?${params.toString()}`
  }

  /**
   * Navigate to call screen
   */
  private async navigateToCall(deepLink: string): Promise<void> {
    try {
      console.log('[CallFCMHandler] Navigating to call:', deepLink)
      
      // Use Linking to open deep link
      const canOpen = await Linking.canOpenURL(deepLink)
      if (canOpen) {
        await Linking.openURL(deepLink)
      } else {
        console.error('[CallFCMHandler] Cannot open deep link:', deepLink)
      }
    } catch (error) {
      console.error('[CallFCMHandler] Error navigating to call:', error)
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
        console.warn('[CallFCMHandler] Failed to parse info field:', e)
      }
    }

    // Check legacy format (direct type)
    if (message.data?.type && typeof message.data.type === 'string') {
      return message.data.type
    }

    return null
  }

  /**
   * Parse call data from FCM message
   */
  private parseCallData(message: FirebaseMessagingTypes.RemoteMessage): any | null {
    try {
      // Check new format (info field)
      if (message.data?.info && typeof message.data.info === 'string') {
        const parsedInfo = JSON.parse(message.data.info)
        return {
          sessionId: parsedInfo.uuid || parsedInfo.sessionId,
          meetingId: parsedInfo.videoSDKInfo?.meetingId,
          token: parsedInfo.videoSDKInfo?.token,
          callerName: parsedInfo.callerInfo?.name,
          callerId: parsedInfo.callerInfo?.id,
          callType: parsedInfo.videoSDKInfo?.callType || 'video',
          uuid: parsedInfo.uuid
        }
      }

      // Check legacy format
      if (message.data) {
        return {
          sessionId: message.data.sessionId || message.data.uuid,
          meetingId: message.data.meetingId,
          token: message.data.token,
          callerName: message.data.callerName,
          callerId: message.data.callerId,
          callType: message.data.callType || 'video',
          uuid: message.data.uuid
        }
      }

      return null
    } catch (error) {
      console.error('[CallFCMHandler] Error parsing call data:', error)
      return null
    }
  }
}
