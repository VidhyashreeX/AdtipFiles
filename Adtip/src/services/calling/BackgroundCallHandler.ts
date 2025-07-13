import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallStore } from '../../stores/callStoreSimplified'
import { startPersistentCall } from '../../components/videosdk/PersistentMeetingManager'
import NotificationService from './NotificationService'
import CallKeepService from './CallKeepService'
import CallStateManager from './CallStateManager'
import BackgroundMediaService from './BackgroundMediaService'
import * as NavigationService from '../../navigation/NavigationService'

// Safe notifee import
let notifee: any = null
let EventType: any = null
try {
  const notifeeModule = require('@notifee/react-native')
  notifee = notifeeModule.default || notifeeModule
  EventType = notifeeModule.EventType
} catch (error) {
  console.warn('[BackgroundCallHandler] Notifee not available:', error)
}

interface BackgroundCallData {
  sessionId: string
  meetingId: string
  token: string
  callerName: string
  callerId: string
  callType: 'voice' | 'video'
  timestamp: number
}

/**
 * Specialized handler for incoming calls received while app is in background
 * Ensures proper state management and navigation when app comes to foreground
 */
export class BackgroundCallHandler {
  private static instance: BackgroundCallHandler
  private pendingBackgroundCall: BackgroundCallData | null = null
  private appStateListener: any = null
  private isHandlingBackgroundCall = false

  private constructor() {
    this.setupAppStateListener()
    this.setupNotificationListeners()
  }

  public static getInstance(): BackgroundCallHandler {
    if (!BackgroundCallHandler.instance) {
      BackgroundCallHandler.instance = new BackgroundCallHandler()
    }
    return BackgroundCallHandler.instance
  }

  /**
   * Handle incoming call received while app is in background
   */
  async handleIncomingCallBackground(callData: any, remoteMessage: any): Promise<void> {
    try {
      console.log('[BackgroundCallHandler] Processing background incoming call:', callData)

      // Prevent concurrent processing
      if (this.isHandlingBackgroundCall) {
        console.log('[BackgroundCallHandler] Already handling a background call, ignoring')
        return
      }

      this.isHandlingBackgroundCall = true

      // Extract call data from FCM message
      const backgroundCall = this.extractCallData(callData, remoteMessage)
      if (!backgroundCall) {
        console.error('[BackgroundCallHandler] Failed to extract call data')
        return
      }

      // Store the call data for when app comes to foreground
      this.pendingBackgroundCall = backgroundCall
      await this.persistCallData(backgroundCall)

      // Update call store immediately (even in background)
      const store = useCallStore.getState()
      store.actions.setSession({
        sessionId: backgroundCall.sessionId,
        meetingId: backgroundCall.meetingId,
        token: backgroundCall.token,
        peerId: backgroundCall.callerId,
        peerName: backgroundCall.callerName,
        direction: 'incoming',
        type: backgroundCall.callType,
        startedAt: backgroundCall.timestamp
      })
      store.actions.setStatus('ringing')

      // Show notification immediately
      const notificationService = NotificationService.getInstance()
      await notificationService.showIncomingCall(
        backgroundCall.sessionId,
        backgroundCall.callerName,
        backgroundCall.callType
      )

      // Also show CallKeep native UI if available
      try {
        const callKeepService = CallKeepService.getInstance()
        if (callKeepService.isAvailable()) {
          await callKeepService.displayIncomingCall(
            backgroundCall.sessionId,
            backgroundCall.callerName,
            backgroundCall.callerName,
            'generic',
            backgroundCall.callType === 'video'
          )
          console.log('[BackgroundCallHandler] CallKeep incoming call displayed')
        }
      } catch (callKeepError) {
        console.warn('[BackgroundCallHandler] CallKeep display failed:', callKeepError)
      }

      // If app is already in foreground, process immediately
      if (AppState.currentState === 'active') {
        await this.processCallWhenForeground()
      }

      console.log('[BackgroundCallHandler] Background call setup complete')
    } catch (error) {
      console.error('[BackgroundCallHandler] Error handling background call:', error)
    } finally {
      this.isHandlingBackgroundCall = false
    }
  }

  /**
   * Accept the pending background call
   */
  async acceptBackgroundCall(): Promise<boolean> {
    try {
      if (!this.pendingBackgroundCall) {
        console.warn('[BackgroundCallHandler] No pending background call to accept')
        return false
      }

      console.log('[BackgroundCallHandler] Accepting background call:', this.pendingBackgroundCall.sessionId)

      // Step 1: Initialize media for background call
      const backgroundMediaService = BackgroundMediaService.getInstance()
      const mediaInitialized = await backgroundMediaService.initializeForBackgroundCall(this.pendingBackgroundCall.callType)

      if (!mediaInitialized) {
        console.error('[BackgroundCallHandler] Failed to initialize media for background call')
        // Don't fail completely, continue with call but log the issue
      }

      // Step 2: Validate media setup
      const validation = await backgroundMediaService.validateMediaSetup(this.pendingBackgroundCall.callType)
      if (!validation.isValid) {
        console.warn('[BackgroundCallHandler] Media setup validation failed:', validation.issues)
        // Try to force reinitialize
        await backgroundMediaService.forceReinitialize(this.pendingBackgroundCall.callType)
      }

      // Step 3: Update call store status
      const store = useCallStore.getState()
      store.actions.setStatus('connecting')

      // Step 4: Prepare media configuration
      const mediaConfig = await backgroundMediaService.prepareMediaForCall(this.pendingBackgroundCall.callType)
      console.log('[BackgroundCallHandler] Media config:', mediaConfig)

      // Step 5: Start persistent call (this will handle navigation)
      startPersistentCall({
        sessionId: this.pendingBackgroundCall.sessionId,
        meetingId: this.pendingBackgroundCall.meetingId,
        token: this.pendingBackgroundCall.token,
        peerName: this.pendingBackgroundCall.callerName,
        callType: this.pendingBackgroundCall.callType,
        direction: 'incoming'
      })

      // Step 6: Update CallKeep if available
      try {
        const callKeepService = CallKeepService.getInstance()
        if (callKeepService.isAvailable() && callKeepService.getCurrentCallUUID() === this.pendingBackgroundCall.sessionId) {
          // CallKeep will handle the UI, just report as connected later
          console.log('[BackgroundCallHandler] CallKeep call will be reported as connected')
        }
      } catch (callKeepError) {
        console.warn('[BackgroundCallHandler] CallKeep update failed:', callKeepError)
      }

      // Step 7: Clear pending call
      await this.clearPendingCall()

      console.log('[BackgroundCallHandler] Background call accepted successfully')
      return true
    } catch (error) {
      console.error('[BackgroundCallHandler] Error accepting background call:', error)
      return false
    }
  }

  /**
   * Decline the pending background call
   */
  async declineBackgroundCall(): Promise<boolean> {
    try {
      if (!this.pendingBackgroundCall) {
        console.warn('[BackgroundCallHandler] No pending background call to decline')
        return false
      }

      console.log('[BackgroundCallHandler] Declining background call:', this.pendingBackgroundCall.sessionId)

      // Step 1: Update call store
      const store = useCallStore.getState()
      store.actions.setStatus('ended')
      store.actions.reset()

      // Step 2: Hide notification
      const notificationService = NotificationService.getInstance()
      await notificationService.hideNotification(this.pendingBackgroundCall.sessionId)

      // Step 3: End CallKeep call if available
      try {
        const callKeepService = CallKeepService.getInstance()
        if (callKeepService.isAvailable() && callKeepService.getCurrentCallUUID() === this.pendingBackgroundCall.sessionId) {
          await callKeepService.endCall(this.pendingBackgroundCall.sessionId)
          console.log('[BackgroundCallHandler] CallKeep call ended')
        }
      } catch (callKeepError) {
        console.warn('[BackgroundCallHandler] CallKeep end failed:', callKeepError)
      }

      // Step 4: Perform comprehensive cleanup
      try {
        const { default: CallCleanupService } = await import('./CallCleanupService')
        const cleanupService = CallCleanupService.getInstance()
        await cleanupService.cleanupBackgroundCallDecline(this.pendingBackgroundCall.sessionId)
        console.log('[BackgroundCallHandler] Comprehensive cleanup completed')
      } catch (cleanupError) {
        console.warn('[BackgroundCallHandler] Comprehensive cleanup failed:', cleanupError)
      }

      // Step 5: Clear pending call
      await this.clearPendingCall()

      console.log('[BackgroundCallHandler] Background call declined successfully')
      return true
    } catch (error) {
      console.error('[BackgroundCallHandler] Error declining background call:', error)
      return false
    }
  }

  /**
   * Check if there's a pending background call
   */
  hasPendingCall(): boolean {
    return this.pendingBackgroundCall !== null
  }

  /**
   * Get pending call data
   */
  getPendingCall(): BackgroundCallData | null {
    return this.pendingBackgroundCall
  }

  /**
   * Setup app state listener to handle foreground transitions
   */
  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && this.pendingBackgroundCall) {
        console.log('[BackgroundCallHandler] App came to foreground with pending call')
        await this.processCallWhenForeground()
      }
    })
  }

  /**
   * Setup notification listeners for background call actions
   */
  private setupNotificationListeners(): void {
    if (!notifee || !EventType) {
      console.warn('[BackgroundCallHandler] Notifee not available, skipping notification listeners')
      return
    }

    try {
      // Handle foreground notification events
      notifee.onForegroundEvent(async ({ type, detail }: any) => {
        if (type === EventType.ACTION_PRESS && this.pendingBackgroundCall) {
          const sessionId = detail.notification?.data?.sessionId as string

          if (sessionId === this.pendingBackgroundCall.sessionId) {
            console.log('[BackgroundCallHandler] Notification action pressed:', detail.pressAction?.id)

            switch (detail.pressAction?.id) {
              case 'answer':
                // Use CallStateManager to prevent race conditions
                const stateManager = CallStateManager.getInstance()
                await stateManager.queueAction({
                  type: 'ACCEPT_CALL',
                  sessionId: sessionId,
                  source: 'NOTIFICATION'
                })
                break
              case 'decline':
              case 'end':
                // Use CallStateManager to prevent race conditions
                const stateManagerDecline = CallStateManager.getInstance()
                await stateManagerDecline.queueAction({
                  type: 'DECLINE_CALL',
                  sessionId: sessionId,
                  source: 'NOTIFICATION'
                })
                break
            }
          }
        }
      })

      // Handle background notification events
      notifee.onBackgroundEvent(async ({ type, detail }: any) => {
        if (type === EventType.ACTION_PRESS && this.pendingBackgroundCall) {
          const sessionId = detail.notification?.data?.sessionId as string

          if (sessionId === this.pendingBackgroundCall.sessionId) {
            console.log('[BackgroundCallHandler] Background notification action pressed:', detail.pressAction?.id)

            switch (detail.pressAction?.id) {
              case 'answer':
                await this.acceptBackgroundCall()
                break
              case 'decline':
              case 'end':
                await this.declineBackgroundCall()
                break
            }
          }
        }
      })
    } catch (error) {
      console.warn('[BackgroundCallHandler] Error setting up notification listeners:', error)
    }
  }

  /**
   * Process pending call when app comes to foreground
   */
  private async processCallWhenForeground(): Promise<void> {
    try {
      if (!this.pendingBackgroundCall) return

      console.log('[BackgroundCallHandler] Processing pending call in foreground')

      // Check if call is still valid (not expired)
      const callAge = Date.now() - this.pendingBackgroundCall.timestamp
      const MAX_CALL_AGE = 60000 // 1 minute

      if (callAge > MAX_CALL_AGE) {
        console.log('[BackgroundCallHandler] Pending call expired, clearing')
        await this.clearPendingCall()
        return
      }

      // Ensure call store is properly set
      const store = useCallStore.getState()
      if (!store.session || store.session.sessionId !== this.pendingBackgroundCall.sessionId) {
        store.actions.setSession({
          sessionId: this.pendingBackgroundCall.sessionId,
          meetingId: this.pendingBackgroundCall.meetingId,
          token: this.pendingBackgroundCall.token,
          peerId: this.pendingBackgroundCall.callerId,
          peerName: this.pendingBackgroundCall.callerName,
          direction: 'incoming',
          type: this.pendingBackgroundCall.callType,
          startedAt: this.pendingBackgroundCall.timestamp
        })
        store.actions.setStatus('ringing')
      }

      console.log('[BackgroundCallHandler] Foreground processing complete')
    } catch (error) {
      console.error('[BackgroundCallHandler] Error processing call in foreground:', error)
    }
  }

  /**
   * Extract call data from FCM message
   */
  private extractCallData(callData: any, remoteMessage: any): BackgroundCallData | null {
    try {
      // Handle both new format (info field) and legacy format
      let data = callData
      if (remoteMessage.data?.info && typeof remoteMessage.data.info === 'string') {
        try {
          data = JSON.parse(remoteMessage.data.info)
        } catch (e) {
          console.warn('[BackgroundCallHandler] Failed to parse info field, using direct data')
          data = remoteMessage.data
        }
      }

      // Extract required fields
      const sessionId = data.uuid || data.sessionId || `session-${Date.now()}`
      const meetingId = data.videoSDKInfo?.meetingId || data.meetingId
      const token = data.videoSDKInfo?.token || data.token
      const callerName = data.callerInfo?.name || data.callerName || 'Unknown Caller'
      const callerId = data.callerInfo?.token || data.callerId || 'unknown-caller'
      const callType = data.videoSDKInfo?.callType || data.callType || 'voice'

      if (!sessionId || !meetingId || !token) {
        console.error('[BackgroundCallHandler] Missing required call data:', {
          sessionId: !!sessionId,
          meetingId: !!meetingId,
          token: !!token
        })
        return null
      }

      return {
        sessionId,
        meetingId,
        token,
        callerName,
        callerId,
        callType: callType as 'voice' | 'video',
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('[BackgroundCallHandler] Error extracting call data:', error)
      return null
    }
  }

  /**
   * Persist call data to AsyncStorage
   */
  private async persistCallData(callData: BackgroundCallData): Promise<void> {
    try {
      await AsyncStorage.setItem('pendingBackgroundCall', JSON.stringify(callData))
    } catch (error) {
      console.error('[BackgroundCallHandler] Error persisting call data:', error)
    }
  }

  /**
   * Clear pending call data
   */
  private async clearPendingCall(): Promise<void> {
    try {
      this.pendingBackgroundCall = null
      await AsyncStorage.removeItem('pendingBackgroundCall')
    } catch (error) {
      console.error('[BackgroundCallHandler] Error clearing pending call:', error)
    }
  }

  /**
   * Load pending call from storage (called on app start)
   */
  async loadPendingCall(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('pendingBackgroundCall')
      if (stored) {
        const callData = JSON.parse(stored)
        
        // Check if call is still valid
        const callAge = Date.now() - callData.timestamp
        const MAX_CALL_AGE = 60000 // 1 minute

        if (callAge <= MAX_CALL_AGE) {
          this.pendingBackgroundCall = callData
          console.log('[BackgroundCallHandler] Loaded pending call from storage')
        } else {
          console.log('[BackgroundCallHandler] Stored call expired, clearing')
          await this.clearPendingCall()
        }
      }
    } catch (error) {
      console.error('[BackgroundCallHandler] Error loading pending call:', error)
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.appStateListener) {
      this.appStateListener.remove()
      this.appStateListener = null
    }
  }
}
