import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import notifee, { AndroidImportance, EventType } from '@notifee/react-native'
import { AppState } from 'react-native'
import { useCallStore, CallType, CallSession } from '../../stores/callStoreSimplified'
import CallStateCleanup from '../../utils/callStateCleanup'
import { startPersistentCall } from '../../components/videosdk/PersistentMeetingManager'
import CallKeepService from './CallKeepService'

/**
 * ReliableCallManager - Single source of truth for all call handling
 * 
 * This manager consolidates all FCM call handling into one reliable service
 * that prevents crashes and ensures proper state management.
 */
class ReliableCallManager {
  private static _instance: ReliableCallManager
  private isInitialized = false
  private fcmUnsubscribe: (() => void) | null = null
  private notifeeUnsubscribe: (() => void) | null = null
  private appStateSubscription: any = null
  private currentCallSession: CallSession | null = null
  private processingMessage = false
  private callKeepService: CallKeepService

  // Notification channels - using same channel as chat notifications for consistency
  private readonly INCOMING_CHANNEL = 'chat_messages'
  private readonly ONGOING_CHANNEL = 'reliable-ongoing-calls'

  static getInstance(): ReliableCallManager {
    if (!ReliableCallManager._instance) {
      ReliableCallManager._instance = new ReliableCallManager()
    }
    return ReliableCallManager._instance
  }

  private constructor() {
    // Private constructor for singleton
    this.callKeepService = CallKeepService.getInstance()
  }

  /**
   * Initialize the reliable call manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ReliableCallManager] Already initialized')
      return
    }

    try {
      console.log('[ReliableCallManager] Initializing...')

      // CALLKEEP DISABLED - Skip CallKeep initialization to fix Vivo device issues
      console.log('[ReliableCallManager] 🚫 CallKeep DISABLED - Using custom UI only')

      // DISABLED CODE BELOW
      /*
      // Initialize CallKeepService for native call UI - MANDATORY for optimal call experience
      try {
        console.log('[ReliableCallManager] Initializing CallKeepService (required for native call UI)...')
        const initResult = await this.callKeepService.initialize()

        if (initResult) {
          console.log('[ReliableCallManager] ✅ CallKeepService initialized successfully - native call UI available')
        } else {
          console.warn('[ReliableCallManager] ⚠️ CallKeepService initialization failed - checking status...')

          const status = this.callKeepService.getCallKeepStatus()
          if (status.needsPermissions) {
            console.warn('[ReliableCallManager] 📱 Phone account permissions required for optimal call experience')
            console.warn('[ReliableCallManager] 💡 User should enable in Settings > Apps > Adtip > Phone Account')

            // Show user-friendly guidance
            this.showCallKeepPermissionGuidance()

            // Show alert immediately to help user enable CallKeep
            setTimeout(() => {
              this.callKeepService.showPhoneAccountGuidanceAlert().catch(error => {
                console.warn('[ReliableCallManager] Could not show guidance alert:', error)
              })
            }, 1000) // Reduced delay to show alert sooner
          }
        }
      } catch (callKeepError) {
        console.error('[ReliableCallManager] ❌ CallKeepService initialization error:', callKeepError)
        console.warn('[ReliableCallManager] 📱 Will use custom notifications - functionality preserved')
      }
      */ // END OF DISABLED CALLKEEP CODE

      // Create notification channels first
      await this.createNotificationChannels()

      // Set up FCM listeners
      await this.setupFCMListeners()

      // Set up notification action listeners
      this.setupNotificationListeners()

      // Set up app state listeners
      this.setupAppStateListeners()

      this.isInitialized = true
      console.log('[ReliableCallManager] Initialization complete')

    } catch (error) {
      console.error('[ReliableCallManager] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    console.log('[ReliableCallManager] Destroying...')

    // Unsubscribe from all listeners
    if (this.fcmUnsubscribe) {
      this.fcmUnsubscribe()
      this.fcmUnsubscribe = null
    }

    if (this.notifeeUnsubscribe) {
      this.notifeeUnsubscribe()
      this.notifeeUnsubscribe = null
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove()
      this.appStateSubscription = null
    }

    // Clear current session
    this.currentCallSession = null
    this.processingMessage = false
    this.isInitialized = false

    console.log('[ReliableCallManager] Destroyed')
  }

  /**
   * Create notification channels with proper configuration
   */
  private async createNotificationChannels(): Promise<void> {
    try {
      await notifee.createChannel({
        id: this.INCOMING_CHANNEL,
        name: 'Chat Messages', // Match chat notification channel name
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500], // Match chat notification pattern
        lights: true,
        lightColor: '#00D4AA',
        badge: true,
      })

      await notifee.createChannel({
        id: this.ONGOING_CHANNEL,
        name: 'Ongoing Calls',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
        vibration: false,
      })

      console.log('[ReliableCallManager] Notification channels created')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to create notification channels:', error)
    }
  }

  /**
   * Set up FCM message listeners with proper error handling
   * Note: Foreground handler is now managed by FCMMessageRouter to prevent conflicts
   */
  private async setupFCMListeners(): Promise<void> {
    try {
      // Foreground message handler is now managed by FCMMessageRouter
      // This prevents conflicts with chat FCM handling
      // Messages will be routed to this service via FCMMessageRouter

      // Background message handler is set in index.js
      console.log('[ReliableCallManager] FCM listeners delegated to FCMMessageRouter')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to set up FCM listeners:', error)
    }
  }

  /**
   * Handle FCM messages with comprehensive error handling
   */
  async handleFCMMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background' = 'foreground'
  ): Promise<void> {
    // Prevent concurrent message processing
    if (this.processingMessage) {
      console.log('[ReliableCallManager] Already processing a message, queuing...')
      setTimeout(() => this.handleFCMMessage(remoteMessage, context), 100)
      return
    }

    this.processingMessage = true

    try {
      console.log(`[ReliableCallManager] Handling FCM message (${context}):`, remoteMessage.data)

      const data = remoteMessage.data
      if (!data) {
        console.log('[ReliableCallManager] No data in FCM message, ignoring')
        return
      }

      // Parse the actual message format - data is nested in 'info' field as JSON string
      let parsedData: any = null
      let messageType: string | null = null

      // Check if data has 'info' field (actual format)
      if (data.info && typeof data.info === 'string') {
        try {
          parsedData = JSON.parse(data.info)
          messageType = parsedData.type
          console.log('[ReliableCallManager] Parsed info field:', parsedData)
        } catch (parseError) {
          console.error('[ReliableCallManager] Failed to parse info field:', parseError)
          return
        }
      }
      // Fallback to direct type field (legacy format)
      else if (data.type) {
        parsedData = data
        messageType = typeof data.type === 'string' ? data.type : String(data.type)
      }
      else {
        console.log('[ReliableCallManager] No call data found in FCM message, ignoring')
        return
      }

      if (!messageType) {
        console.log('[ReliableCallManager] No message type found, ignoring')
        return
      }

      console.log('[ReliableCallManager] Processing message type:', messageType)

      switch (messageType) {
        case 'CALL_INITIATED': // Note: actual format uses 'CALL_INITIATED'
        case 'CALL_INITIATE':  // Legacy format
          await this.handleIncomingCall(parsedData)
          break
        case 'CALL_ACCEPT':
        case 'CALL_ACCEPTED':
          await this.handleCallAccept(parsedData)
          break
        case 'CALL_END':
        case 'CALL_ENDED':
          await this.handleCallEnd(parsedData)
          break
        default:
          console.log('[ReliableCallManager] Unknown FCM message type:', messageType)
      }

    } catch (error) {
      console.error('[ReliableCallManager] Error handling FCM message:', error)
      // Don't throw - just log to prevent app crashes
    } finally {
      this.processingMessage = false
    }
  }

  /**
   * Set up notification action listeners
   */
  private setupNotificationListeners(): void {
    try {
      this.notifeeUnsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          await this.handleNotificationAction(detail)
        }
      })

      // Also handle background events
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          await this.handleNotificationAction(detail)
        }
      })

      console.log('[ReliableCallManager] Notification listeners set up')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to set up notification listeners:', error)
    }
  }

  /**
   * Set up app state listeners for proper cleanup
   */
  private setupAppStateListeners(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[ReliableCallManager] App state changed to:', nextAppState)

      if (nextAppState === 'background' && this.currentCallSession) {
        // Ensure ongoing call notification is shown when app goes to background
        this.showOngoingCallNotification()
      }
    })
  }

  /**
   * Handle incoming call FCM message
   */
  private async handleIncomingCall(data: any): Promise<void> {
    try {
      console.log('[ReliableCallManager] Handling incoming call:', data)

      // Extract data from the actual FCM message structure
      const callerInfo = data.callerInfo || {}
      const videoSDKInfo = data.videoSDKInfo || {}

      // Use UUID as sessionId, or fallback to meetingId
      const sessionId = data.uuid || videoSDKInfo.meetingId || `session-${Date.now()}`
      const callerName = callerInfo.name || 'Unknown Caller'
      const callType = videoSDKInfo.callType || 'voice'
      const meetingId = videoSDKInfo.meetingId
      const token = videoSDKInfo.token
      const callerId = callerInfo.token || 'unknown-caller' // Using FCM token as caller ID

      console.log('[ReliableCallManager] Extracted call data:', {
        sessionId,
        callerName,
        callType,
        meetingId,
        token: token ? 'present' : 'missing',
        callerId
      })

      if (!meetingId || !token) {
        console.error('[ReliableCallManager] Missing required VideoSDK data (meetingId or token)')
        return
      }

      // Create call session
      const session: CallSession = {
        sessionId,
        meetingId,
        token,
        peerId: callerId,
        peerName: callerName,
        direction: 'incoming',
        type: callType as CallType,
        startedAt: Date.now()
      }

      // Store current session
      this.currentCallSession = session

      // IMPORTANT: Set this session as active in VideoSDK service for incoming calls
      const VideoSDKService = await import('../../services/videosdk/VideoSDKService')
      const videoSDK = VideoSDKService.default.getInstance()

      console.log('[ReliableCallManager] Setting VideoSDK session as active for incoming call...')
      const sessionSetResult = videoSDK.setActiveMeetingSession(session.sessionId)
      if (!sessionSetResult) {
        console.error('[ReliableCallManager] Failed to set VideoSDK session as active - another session may be active')
        // Clear any existing session and try again
        await videoSDK.clearExistingMeetingState()
        videoSDK.setActiveMeetingSession(session.sessionId)
      }

      // Update call store safely
      console.log('[ReliableCallManager] Setting call status to ringing...')
      await this.updateCallStore(session, 'ringing')

      // Show incoming call notification
      await this.showIncomingCallNotification(session)

      console.log('[ReliableCallManager] Incoming call processed successfully')
      console.log('[ReliableCallManager] Current session stored:', {
        sessionId: session.sessionId,
        callerName: session.peerName,
        callType: session.type,
        meetingId: session.meetingId
      })
    } catch (error) {
      console.error('[ReliableCallManager] Error handling incoming call:', error)
    }
  }

  /**
   * Handle call accept FCM message
   */
  private async handleCallAccept(data: any): Promise<void> {
    try {
      console.log('[ReliableCallManager] Handling call accept:', data)

      const sessionId = data.sessionId
      if (this.currentCallSession?.sessionId === sessionId && this.currentCallSession) {
        await this.updateCallStore(this.currentCallSession, 'connecting')
        await this.hideIncomingCallNotification(sessionId)
      }

      console.log('[ReliableCallManager] Call accept processed successfully')
    } catch (error) {
      console.error('[ReliableCallManager] Error handling call accept:', error)
    }
  }

  /**
   * Handle call end FCM message
   */
  private async handleCallEnd(data: any): Promise<void> {
    try {
      console.log('[ReliableCallManager] Handling call end:', data)

      const sessionId = data.sessionId
      if (this.currentCallSession?.sessionId === sessionId) {
        await this.endCall()
      }

      console.log('[ReliableCallManager] Call end processed successfully')
    } catch (error) {
      console.error('[ReliableCallManager] Error handling call end:', error)
    }
  }

  /**
   * Handle notification action presses
   */
  private async handleNotificationAction(detail: any): Promise<void> {
    try {
      const sessionId = detail.notification?.data?.sessionId as string
      if (!sessionId) {
        console.warn('[ReliableCallManager] No sessionId in notification data')
        return
      }

      console.log('[ReliableCallManager] Notification action pressed:', detail.pressAction?.id)
      console.log('[ReliableCallManager] Current session:', this.currentCallSession?.sessionId)
      console.log('[ReliableCallManager] Notification sessionId:', sessionId)

      // Try to recover session from call store if not available
      if (!this.currentCallSession) {
        console.log('[ReliableCallManager] No current session, trying to recover from call store')
        const { useCallStore } = await import('../../stores/callStoreSimplified')
        const store = useCallStore.getState()

        if (store.session && store.session.sessionId === sessionId) {
          console.log('[ReliableCallManager] Recovered session from call store')
          this.currentCallSession = store.session
        } else {
          console.warn('[ReliableCallManager] Could not recover session, proceeding anyway for end action')
          // For end actions, we can proceed even without session
          if (detail.pressAction?.id === 'end' || detail.pressAction?.id === 'decline') {
            console.log('[ReliableCallManager] Proceeding with end action without session')
          } else {
            return
          }
        }
      }

      // Verify this action is for the current call (skip check for end actions if no session)
      if (this.currentCallSession && this.currentCallSession.sessionId !== sessionId) {
        console.warn('[ReliableCallManager] Notification action for different session, ignoring')
        return
      }

      switch (detail.pressAction?.id) {
        case 'answer':
          console.log('[ReliableCallManager] Processing answer action...')
          await this.acceptCall()
          break
        case 'decline':
        case 'end':
          console.log('[ReliableCallManager] Processing decline/end action...')
          await this.endCall()
          break
        default:
          console.warn('[ReliableCallManager] Unknown notification action:', detail.pressAction?.id)
      }
    } catch (error) {
      console.error('[ReliableCallManager] Error handling notification action:', error)
    }
  }

  /**
   * Update call store with thread safety
   */
  private async updateCallStore(session: CallSession, status: string): Promise<void> {
    try {
      console.log('[ReliableCallManager] Updating call store...', {
        sessionId: session.sessionId,
        newStatus: status,
        currentSession: this.currentCallSession?.sessionId
      })

      // Update store immediately on main thread
      const store = useCallStore.getState()
      const currentState = store

      console.log('[ReliableCallManager] Current store state before update:', {
        currentSessionId: currentState.session?.sessionId,
        currentStatus: currentState.status
      })

      store.actions.setSession(session)
      store.actions.setStatus(status as any)

      // Verify the update
      const updatedState = useCallStore.getState()
      console.log('[ReliableCallManager] Store state after update:', {
        sessionId: updatedState.session?.sessionId,
        status: updatedState.status,
        meetingId: updatedState.session?.meetingId,
        token: updatedState.session?.token ? 'present' : 'missing'
      })

      // Add a small delay to ensure React has time to process the state change
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      console.error('[ReliableCallManager] Error updating call store:', error)
    }
  }

  /**
   * Show incoming call notification with CallKeep native UI first, then fallback to Notifee
   */
  private async showIncomingCallNotification(session: CallSession): Promise<void> {
    try {
      console.log('[ReliableCallManager] Showing incoming call notification')

      // Try CallKeep native UI first
      if (this.callKeepService.isAvailable()) {
        console.log('[ReliableCallManager] Attempting to show CallKeep native UI')
        const callKeepSuccess = await this.callKeepService.displayIncomingCall(
          session.sessionId,
          session.peerName,
          session.peerName,
          'generic',
          session.type === 'video'
        )

        if (callKeepSuccess) {
          console.log('[ReliableCallManager] CallKeep native UI displayed successfully')
          return // CallKeep handled the call, no need for Notifee
        } else {
          console.warn('[ReliableCallManager] CallKeep failed, falling back to Notifee notification')
        }
      } else {
        console.log('[ReliableCallManager] 📱 CallKeep not available - using custom notification UI')
        console.log('[ReliableCallManager] 💡 This provides the same functionality with custom notifications')
      }

      // Fallback to Notifee notification
      await notifee.displayNotification({
        id: session.sessionId,
        title: `Incoming ${session.type} call`,
        body: session.peerName,
        android: {
          channelId: this.INCOMING_CHANNEL,
          category: 'call' as any,
          fullScreenAction: { id: 'default' },
          actions: [
            { title: 'Answer', pressAction: { id: 'answer' } },
            { title: 'Decline', pressAction: { id: 'decline' } },
            { title: 'End', pressAction: { id: 'end' } },
          ],
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          sound: 'default',
          vibrationPattern: [300, 500], // Match chat notification pattern
          ongoing: true,
          autoCancel: false,
          // Use same icon as chat notifications to generate same Firebase logs
          smallIcon: 'ic_notification',
          color: '#FF6B35', // Match chat notification color
        },
        data: {
          sessionId: session.sessionId,
          callerName: session.peerName,
          type: session.type,
          callType: session.type,
          meetingId: session.meetingId,
          token: session.token,
          messageType: 'incoming_call'
        },
      })

      console.log('[ReliableCallManager] Notifee notification displayed')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to show incoming call notification:', error)
      // Try fallback notification
      await this.showFallbackNotification(session)
    }
  }

  /**
   * Show fallback notification if main notification fails
   */
  private async showFallbackNotification(session: CallSession): Promise<void> {
    try {
      await notifee.displayNotification({
        id: session.sessionId + '_fallback',
        title: 'Incoming Call',
        body: `${session.peerName} is calling`,
        android: {
          channelId: this.INCOMING_CHANNEL,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500], // Match chat notification pattern
          // Use same icon as chat notifications to generate same Firebase logs
          smallIcon: 'ic_notification',
          color: '#FF6B35', // Match chat notification color
        },
        data: { sessionId: session.sessionId },
      })
      console.log('[ReliableCallManager] Fallback notification displayed')
    } catch (error) {
      console.error('[ReliableCallManager] Fallback notification also failed:', error)
    }
  }

  /**
   * Show ongoing call notification
   */
  private async showOngoingCallNotification(): Promise<void> {
    if (!this.currentCallSession) return

    try {
      await notifee.displayNotification({
        id: this.currentCallSession.sessionId + '_ongoing',
        title: `${this.currentCallSession.type} call`,
        body: `Talking with ${this.currentCallSession.peerName}`,
        android: {
          channelId: this.ONGOING_CHANNEL,
          ongoing: true,
          actions: [{ title: 'End', pressAction: { id: 'end' } }],
        },
        data: { sessionId: this.currentCallSession.sessionId },
      })
      console.log('[ReliableCallManager] Ongoing call notification displayed')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to show ongoing call notification:', error)
    }
  }

  /**
   * Hide incoming call notification (both CallKeep and Notifee)
   */
  private async hideIncomingCallNotification(sessionId: string): Promise<void> {
    try {
      // Hide CallKeep call if active
      if (this.callKeepService.getCurrentCallUUID() === sessionId) {
        await this.callKeepService.endCall(sessionId)
        console.log('[ReliableCallManager] CallKeep call ended')
      }

      // Hide Notifee notifications
      await notifee.cancelNotification(sessionId)
      await notifee.cancelNotification(sessionId + '_fallback')
      console.log('[ReliableCallManager] Incoming call notification hidden')
    } catch (error) {
      console.error('[ReliableCallManager] Failed to hide notification:', error)
    }
  }

  /**
   * Accept incoming call - Use the same approach as outgoing calls
   */
  async acceptCall(): Promise<boolean> {
    if (!this.currentCallSession) {
      console.warn('[ReliableCallManager] No current call session to accept')
      return false
    }

    try {
      console.log('[ReliableCallManager] Accepting call:', this.currentCallSession.sessionId)

      // Step 1: Update status to connecting (same as outgoing calls)
      console.log('[ReliableCallManager] Updating call status to connecting...')
      await this.updateCallStore(this.currentCallSession, 'connecting')

      // Step 2: Hide incoming call notification
      console.log('[ReliableCallManager] Hiding incoming call notification...')
      await this.hideIncomingCallNotification(this.currentCallSession.sessionId)

      // Step 3: Start persistent call (EXACTLY like outgoing calls do)
      console.log('[ReliableCallManager] Starting persistent call...')
      startPersistentCall({
        sessionId: this.currentCallSession.sessionId,
        meetingId: this.currentCallSession.meetingId,
        token: this.currentCallSession.token,
        peerName: this.currentCallSession.peerName,
        callType: this.currentCallSession.type,
        direction: 'incoming'
      })

      console.log('[ReliableCallManager] Call accepted successfully using persistent call')
      return true
    } catch (error) {
      console.error('[ReliableCallManager] Error accepting call:', error)
      return false
    }
  }

  /**
   * End current call
   */
  async endCall(): Promise<boolean> {
    try {
      console.log('[ReliableCallManager] Ending call')

      if (this.currentCallSession) {
        // Hide all notifications for this call
        await this.hideIncomingCallNotification(this.currentCallSession.sessionId)
        await notifee.cancelNotification(this.currentCallSession.sessionId + '_ongoing')
      }

      // Reset call store
      setTimeout(() => {
        const store = useCallStore.getState()
        store.actions.reset()
      }, 0)

      // Perform comprehensive cleanup
      const cleanupService = CallStateCleanup.getInstance()
      await cleanupService.performComprehensiveCleanup()

      // Clear current session
      this.currentCallSession = null

      console.log('[ReliableCallManager] Call ended successfully')
      return true
    } catch (error) {
      console.error('[ReliableCallManager] Error ending call:', error)
      return false
    }
  }

  /**
   * Get current call session
   */
  getCurrentSession(): CallSession | null {
    return this.currentCallSession
  }

  /**
   * Check if manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Show guidance for enabling CallKeep permissions
   */
  private showCallKeepPermissionGuidance(): void {
    console.log('[ReliableCallManager] 📋 CallKeep Permission Guidance:')
    console.log('[ReliableCallManager] 📱 To enable native call interface:')
    console.log('[ReliableCallManager] 1️⃣ Open Android Settings')
    console.log('[ReliableCallManager] 2️⃣ Go to Apps > Adtip')
    console.log('[ReliableCallManager] 3️⃣ Tap "Phone Account"')
    console.log('[ReliableCallManager] 4️⃣ Toggle ON to enable')
    console.log('[ReliableCallManager] ✨ This enables native phone app call interface')
    console.log('[ReliableCallManager] 💡 App works perfectly without this - just uses custom notifications')
  }
}

export default ReliableCallManager
