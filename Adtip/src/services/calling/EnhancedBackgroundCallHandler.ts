import AsyncStorage from '@react-native-async-storage/async-storage'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import CallKeepService from './CallKeepService'

/**
 * Enhanced Background Call Handler
 * Implements VideoSDK CallKeep integration best practices for background/killed app scenarios
 */

interface BackgroundCallData {
  sessionId: string
  meetingId: string
  token: string
  callerName: string
  callType: 'video' | 'audio'
  timestamp: number
  uuid: string
}

export class EnhancedBackgroundCallHandler {
  private static instance: EnhancedBackgroundCallHandler
  private pendingCall: BackgroundCallData | null = null
  private callKeepService: CallKeepService

  private constructor() {
    this.callKeepService = CallKeepService.getInstance()
  }

  public static getInstance(): EnhancedBackgroundCallHandler {
    if (!EnhancedBackgroundCallHandler.instance) {
      EnhancedBackgroundCallHandler.instance = new EnhancedBackgroundCallHandler()
    }
    return EnhancedBackgroundCallHandler.instance
  }

  /**
   * Initialize background call handling
   */
  async initialize(): Promise<void> {
    try {
      console.log('[EnhancedBackgroundCallHandler] Initializing...')

      // Initialize CallKeep service
      await this.callKeepService.initialize()

      // Set up CallKeep event handlers
      this.setupCallKeepEventHandlers()

      // Register headless task for killed app scenarios
      this.registerHeadlessTask()

      // Recover any pending calls
      await this.recoverPendingCalls()

      console.log('[EnhancedBackgroundCallHandler] Initialization complete')
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Handle incoming call in background/killed app state
   */
  async handleBackgroundCall(message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      console.log('[EnhancedBackgroundCallHandler] Handling background call')

      const callData = this.parseCallData(message)
      if (!callData) {
        console.error('[EnhancedBackgroundCallHandler] Invalid call data')
        return
      }

      // Store call data for recovery
      await this.storePendingCall(callData)

      // Display CallKeep native UI immediately
      if (this.callKeepService.isAvailable()) {
        const success = await this.callKeepService.displayIncomingCall(
          callData.uuid,
          callData.callerName,
          callData.callerName,
          'generic',
          callData.callType === 'video'
        )

        if (success) {
          console.log('[EnhancedBackgroundCallHandler] CallKeep UI displayed successfully')
          this.pendingCall = callData
          return
        }
      }

      // Fallback to system notification
      await this.showSystemNotification(callData)

    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error handling background call:', error)
    }
  }

  /**
   * Set up CallKeep event handlers
   */
  private setupCallKeepEventHandlers(): void {
    console.log('[EnhancedBackgroundCallHandler] CallKeep event handlers managed by CallKeepService')
    // Event handlers are now centrally managed by CallKeepService
    // This method is kept for interface compatibility
  }

  /**
   * Register headless task for killed app scenarios
   * Note: Headless task registration would be done in index.js
   */
  private registerHeadlessTask(): void {
    console.log('[EnhancedBackgroundCallHandler] Headless task setup - handled in index.js')
    // Headless task registration is handled in the main index.js file
    // This method is kept for interface compatibility
  }

  /**
   * Launch app with call data when answered from killed state
   */
  private async launchAppWithCall(callData: BackgroundCallData): Promise<void> {
    try {
      console.log('[EnhancedBackgroundCallHandler] Launching app with call data')

      // Store call data for app launch
      await AsyncStorage.setItem('pending_call_launch', JSON.stringify(callData))

      // The app will be launched automatically by CallKeep
      // The deep link will be processed when the app starts
      console.log('[EnhancedBackgroundCallHandler] Call data prepared for app launch')

    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error launching app with call:', error)
    }
  }

  /**
   * Store pending call data for recovery
   */
  private async storePendingCall(callData: BackgroundCallData): Promise<void> {
    try {
      await AsyncStorage.setItem(`pending_call_${callData.uuid}`, JSON.stringify(callData))
      await AsyncStorage.setItem('latest_pending_call', callData.uuid)
      console.log('[EnhancedBackgroundCallHandler] Call data stored:', callData.uuid)
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error storing call data:', error)
    }
  }

  /**
   * Retrieve pending call data
   */
  private async retrievePendingCall(uuid: string): Promise<BackgroundCallData | null> {
    try {
      const callDataStr = await AsyncStorage.getItem(`pending_call_${uuid}`)
      if (callDataStr) {
        return JSON.parse(callDataStr)
      }
      return null
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error retrieving call data:', error)
      return null
    }
  }

  /**
   * Clear pending call data
   */
  private async clearPendingCall(uuid: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`pending_call_${uuid}`)
      
      // Clear latest pending call if it matches
      const latestUuid = await AsyncStorage.getItem('latest_pending_call')
      if (latestUuid === uuid) {
        await AsyncStorage.removeItem('latest_pending_call')
      }
      
      console.log('[EnhancedBackgroundCallHandler] Call data cleared:', uuid)
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error clearing call data:', error)
    }
  }

  /**
   * Recover pending calls on app startup
   */
  private async recoverPendingCalls(): Promise<void> {
    try {
      const latestUuid = await AsyncStorage.getItem('latest_pending_call')
      if (latestUuid) {
        const callData = await this.retrievePendingCall(latestUuid)
        if (callData) {
          // Check if call is still valid (not too old)
          const callAge = Date.now() - callData.timestamp
          if (callAge < 60000) { // 1 minute
            console.log('[EnhancedBackgroundCallHandler] Recovering pending call:', latestUuid)
            this.pendingCall = callData
          } else {
            console.log('[EnhancedBackgroundCallHandler] Pending call too old, clearing:', latestUuid)
            await this.clearPendingCall(latestUuid)
          }
        }
      }
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error recovering pending calls:', error)
    }
  }

  /**
   * Show system notification as fallback
   */
  private async showSystemNotification(callData: BackgroundCallData): Promise<void> {
    try {
      // Import notification service dynamically
      const { default: NotificationService } = await import('./NotificationService')
      const notificationService = NotificationService.getInstance()

      await notificationService.showIncomingCall(
        callData.sessionId,
        callData.callerName,
        callData.callType as 'video' | 'voice'
      )

      console.log('[EnhancedBackgroundCallHandler] System notification displayed')
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error showing system notification:', error)
    }
  }



  /**
   * Parse call data from FCM message
   */
  private parseCallData(message: FirebaseMessagingTypes.RemoteMessage): BackgroundCallData | null {
    try {
      // Parse based on message format
      if (message.data?.info && typeof message.data.info === 'string') {
        const parsedInfo = JSON.parse(message.data.info)
        return {
          sessionId: parsedInfo.uuid || parsedInfo.sessionId,
          meetingId: parsedInfo.videoSDKInfo?.meetingId,
          token: parsedInfo.videoSDKInfo?.token,
          callerName: parsedInfo.callerInfo?.name || 'Unknown Caller',
          callType: parsedInfo.videoSDKInfo?.callType || 'video',
          timestamp: Date.now(),
          uuid: parsedInfo.uuid || `call_${Date.now()}`
        }
      }

      // Legacy format
      if (message.data) {
        return {
          sessionId: (message.data.sessionId || message.data.uuid) as string,
          meetingId: message.data.meetingId as string,
          token: message.data.token as string,
          callerName: (message.data.callerName || 'Unknown Caller') as string,
          callType: (message.data.callType || 'video') as 'video' | 'audio',
          timestamp: Date.now(),
          uuid: (message.data.uuid || `call_${Date.now()}`) as string
        }
      }

      return null
    } catch (error) {
      console.error('[EnhancedBackgroundCallHandler] Error parsing call data:', error)
      return null
    }
  }

  /**
   * Check if handler has pending call
   */
  hasPendingCall(): boolean {
    return this.pendingCall !== null
  }

  /**
   * Get pending call data
   */
  getPendingCall(): BackgroundCallData | null {
    return this.pendingCall
  }
}
