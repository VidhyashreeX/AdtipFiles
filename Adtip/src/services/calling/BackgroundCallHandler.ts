import { AppState, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallStore } from '../../stores/callStoreSimplified'
import { startPersistentCall } from '../../components/videosdk/PersistentMeetingManager'
import NotificationService from './NotificationService'
import CallKeepService from './CallKeepService'
import CallStateManager from './CallStateManager'
import BackgroundMediaService from './BackgroundMediaService'
import VideoSDKService from '../videosdk/VideoSDKService'
import CallBillingService from './CallBillingService'
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

      // Initialize critical services immediately for background call handling
      console.log('[BackgroundCallHandler] Pre-initializing services for background call')
      const servicesReady = await this.initializeServicesForBackgroundCall(backgroundCall)

      if (servicesReady) {
        console.log('[BackgroundCallHandler] Services pre-initialized successfully')
      } else {
        console.warn('[BackgroundCallHandler] Some services failed to pre-initialize')
      }

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

      // Show notification immediately with enhanced data
      const notificationService = NotificationService.getInstance()
      await notificationService.showIncomingCall(
        backgroundCall.sessionId,
        backgroundCall.callerName,
        backgroundCall.callType,
        false, // not concurrent call
        backgroundCall.meetingId,
        backgroundCall.token,
        backgroundCall.callerId
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

      // Step 1: Initialize all required services
      const servicesInitialized = await this.initializeServicesForBackgroundCall(this.pendingBackgroundCall)

      if (!servicesInitialized) {
        console.error('[BackgroundCallHandler] Critical services failed to initialize')
        // Still attempt to continue but with reduced functionality
        console.warn('[BackgroundCallHandler] Continuing with limited service availability')
      } else {
        console.log('[BackgroundCallHandler] All critical services initialized successfully')
      }

      // Step 2: Additional media validation for background calls
      try {
        const backgroundMediaService = BackgroundMediaService.getInstance()
        const validation = await backgroundMediaService.validateMediaSetup(this.pendingBackgroundCall.callType)
        if (!validation.isValid) {
          console.warn('[BackgroundCallHandler] Media setup validation failed:', validation.issues)
          // Try to force reinitialize
          await backgroundMediaService.forceReinitialize(this.pendingBackgroundCall.callType)
        }
      } catch (mediaError) {
        console.error('[BackgroundCallHandler] Media validation error:', mediaError)
      }

      // Step 3: Update call store status
      const store = useCallStore.getState()
      store.actions.setStatus('connecting')

      // Step 4: Prepare media configuration
      const backgroundMediaService = BackgroundMediaService.getInstance()
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
   * Create deep link for call navigation with proper credentials
   */
  private createCallDeepLink(callData: BackgroundCallData): string {
    try {
      // Enhanced deep link format for better navigation
      const baseUrl = 'adtip://call/meeting'
      const path = `${baseUrl}/${callData.sessionId}`

      // Add all necessary parameters as query string
      const params = new URLSearchParams({
        meetingId: callData.meetingId,
        token: callData.token,
        callerName: callData.callerName,
        callerId: callData.callerId,
        callType: callData.callType,
        direction: 'incoming',
        timestamp: callData.timestamp.toString(),
        source: 'notification'
      })

      const deepLink = `${path}?${params.toString()}`
      console.log('[BackgroundCallHandler] Created deep link:', deepLink)
      return deepLink
    } catch (error) {
      console.error('[BackgroundCallHandler] Error creating deep link:', error)
      // Fallback to basic navigation
      return 'adtip://call/meeting'
    }
  }

  /**
   * Initialize all required services for background call handling
   */
  private async initializeServicesForBackgroundCall(callData: BackgroundCallData): Promise<boolean> {
    try {
      console.log('[BackgroundCallHandler] Initializing services for background call:', callData.sessionId)

      const initResults = {
        videoSDK: false,
        billing: false,
        media: false,
        notifications: false
      }

      // 1. Initialize VideoSDK Service (includes WebSocket functionality)
      try {
        console.log('[BackgroundCallHandler] Initializing VideoSDK service...')
        const videoSDKService = VideoSDKService.getInstance()

        // Check if already initialized (use try-catch since isInitialized is private)
        try {
          await videoSDKService.initialize()
          console.log('[BackgroundCallHandler] VideoSDK service initialized')
        } catch (error) {
          // If already initialized, this will throw an error, which is fine
          console.log('[BackgroundCallHandler] VideoSDK service already initialized or initialization failed:', error)
        }

        // Ensure WebSocket is ready (VideoSDK handles WebSocket internally)
        if (!videoSDKService.isWebSocketHealthy()) {
          await videoSDKService.ensureWebSocketReadyForMeeting()
          console.log('[BackgroundCallHandler] VideoSDK WebSocket connection ensured')
        }

        initResults.videoSDK = true
      } catch (error) {
        console.error('[BackgroundCallHandler] VideoSDK initialization failed:', error)
      }

      // 3. Initialize Billing Service
      try {
        console.log('[BackgroundCallHandler] Initializing billing service...')
        const billingService = CallBillingService.getInstance()

        // Pre-validate billing for the call
        const minBalanceReq = billingService.getMinimumBalanceRequirements()
        const requiredBalance = callData.callType === 'voice' ? minBalanceReq.voice : minBalanceReq.video

        console.log('[BackgroundCallHandler] Billing service ready, minimum balance required:', requiredBalance)
        initResults.billing = true
      } catch (error) {
        console.error('[BackgroundCallHandler] Billing service initialization failed:', error)
      }

      // 4. Initialize Media Service
      try {
        console.log('[BackgroundCallHandler] Initializing media service...')
        const backgroundMediaService = BackgroundMediaService.getInstance()

        const mediaInitialized = await backgroundMediaService.initializeForBackgroundCall(callData.callType)
        if (mediaInitialized) {
          console.log('[BackgroundCallHandler] Media service initialized successfully')
          initResults.media = true
        } else {
          console.warn('[BackgroundCallHandler] Media service initialization failed')
        }
      } catch (error) {
        console.error('[BackgroundCallHandler] Media service initialization failed:', error)
      }

      // 5. Initialize Notification Service
      try {
        console.log('[BackgroundCallHandler] Initializing notification service...')
        NotificationService.getInstance()
        // Notification service is initialized in constructor, just verify it's ready
        console.log('[BackgroundCallHandler] Notification service ready')
        initResults.notifications = true
      } catch (error) {
        console.error('[BackgroundCallHandler] Notification service initialization failed:', error)
      }

      // Log initialization results
      const successCount = Object.values(initResults).filter(Boolean).length
      const totalServices = Object.keys(initResults).length

      console.log('[BackgroundCallHandler] Service initialization results:', {
        ...initResults,
        successRate: `${successCount}/${totalServices}`,
        allCriticalServicesReady: initResults.videoSDK && initResults.media && initResults.notifications
      })

      // Return true if critical services are ready
      return initResults.videoSDK && initResults.media && initResults.notifications
    } catch (error) {
      console.error('[BackgroundCallHandler] Error during service initialization:', error)
      return false
    }
  }

  /**
   * Navigate to call screen using deep link with killed state support
   */
  private async navigateToCallScreen(callData: BackgroundCallData): Promise<boolean> {
    try {
      console.log('[BackgroundCallHandler] Navigating to call screen for:', callData.sessionId)

      // Check if app is being launched from killed state
      const isKilledState = await this.isAppLaunchedFromKilledState()

      if (isKilledState) {
        console.log('[BackgroundCallHandler] App launched from killed state, ensuring proper initialization')
        await this.ensureAppInitializationForKilledState()
      }

      // Method 1: Try deep linking first
      const deepLink = this.createCallDeepLink(callData)
      const canOpenDeepLink = await Linking.canOpenURL(deepLink)

      if (canOpenDeepLink) {
        await Linking.openURL(deepLink)
        console.log('[BackgroundCallHandler] Successfully navigated via deep link')
        return true
      }

      // Method 2: Use persistent call as fallback
      console.log('[BackgroundCallHandler] Deep link failed, using persistent call')
      startPersistentCall({
        sessionId: callData.sessionId,
        meetingId: callData.meetingId,
        token: callData.token,
        peerName: callData.callerName,
        callType: callData.callType,
        direction: 'incoming'
      })

      // Method 3: Direct navigation as last resort with proper timing for killed state
      const navigationDelay = isKilledState ? 2000 : 500 // Longer delay for killed state
      setTimeout(async () => {
        try {
          // Ensure navigation is ready before attempting direct navigation
          await this.waitForNavigationReady(isKilledState ? 5000 : 2000)

          NavigationService.navigate('MeetingScreen', {
            sessionId: callData.sessionId,
            meetingId: callData.meetingId,
            token: callData.token,
            callerName: callData.callerName,
            callType: callData.callType
          })
          console.log('[BackgroundCallHandler] Direct navigation completed')
        } catch (navError) {
          console.error('[BackgroundCallHandler] Direct navigation failed:', navError)
        }
      }, navigationDelay)

      return true
    } catch (error) {
      console.error('[BackgroundCallHandler] Error navigating to call screen:', error)
      return false
    }
  }

  /**
   * Check if app is being launched from killed state
   */
  private async isAppLaunchedFromKilledState(): Promise<boolean> {
    try {
      // Check if this is the first time the app is being initialized
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
      const lastAppState = await AsyncStorage.getItem('lastAppState')
      const currentTime = Date.now()
      const lastActiveTime = await AsyncStorage.getItem('lastActiveTime')

      // If no last state or it's been more than 30 seconds, consider it killed state
      if (!lastAppState || !lastActiveTime) {
        return true
      }

      const timeDiff = currentTime - parseInt(lastActiveTime, 10)
      return timeDiff > 30000 // 30 seconds threshold
    } catch (error) {
      console.warn('[BackgroundCallHandler] Error checking killed state:', error)
      return true // Assume killed state on error for safety
    }
  }

  /**
   * Ensure proper app initialization for killed state scenarios
   */
  private async ensureAppInitializationForKilledState(): Promise<void> {
    try {
      console.log('[BackgroundCallHandler] Ensuring app initialization for killed state')

      // Wait for service orchestrator to complete initialization
      const { default: KilledStateServiceOrchestrator } = await import('../KilledStateServiceOrchestrator')
      const orchestrator = KilledStateServiceOrchestrator.getInstance()

      if (!orchestrator.isReady()) {
        await orchestrator.initialize()
        console.log('[BackgroundCallHandler] Service orchestrator initialized')
      }

      // Wait for navigation to be ready
      await this.waitForNavigationReady(3000)

      console.log('[BackgroundCallHandler] App initialization complete for killed state')
    } catch (error) {
      console.error('[BackgroundCallHandler] Error during killed state initialization:', error)
    }
  }

  /**
   * Wait for navigation to be ready with timeout
   */
  private async waitForNavigationReady(timeout: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()

      const checkNavigation = () => {
        const { navigationRef } = require('../../navigation/NavigationService')

        if (navigationRef.isReady()) {
          console.log('[BackgroundCallHandler] Navigation is ready')
          resolve()
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkNavigation, 100)
        } else {
          console.warn('[BackgroundCallHandler] Navigation ready timeout reached')
          resolve() // Resolve anyway to prevent hanging
        }
      }

      checkNavigation()
    })
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

      // Store app state for killed state detection
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
        await AsyncStorage.setItem('lastAppState', nextAppState)
        await AsyncStorage.setItem('lastActiveTime', Date.now().toString())
      } catch (error) {
        console.warn('[BackgroundCallHandler] Error storing app state:', error)
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
                console.log('[BackgroundCallHandler] Answering call from notification')

                // Check if app is in killed state and handle accordingly
                const isKilledState = await this.isAppLaunchedFromKilledState()

                if (isKilledState) {
                  console.log('[BackgroundCallHandler] Handling call acceptance from killed state')
                  // Ensure proper initialization before navigation
                  await this.ensureAppInitializationForKilledState()
                }

                // Navigate to call screen first
                const navigationSuccess = await this.navigateToCallScreen(this.pendingBackgroundCall)

                if (navigationSuccess) {
                  // Then use CallStateManager to handle the call acceptance
                  const stateManager = CallStateManager.getInstance()
                  await stateManager.queueAction({
                    type: 'ACCEPT_CALL',
                    sessionId: sessionId,
                    source: 'NOTIFICATION'
                  })
                } else {
                  console.error('[BackgroundCallHandler] Navigation failed, cannot accept call')
                }
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
                console.log('[BackgroundCallHandler] Answering call from background notification')

                // Check if app is in killed state and handle accordingly
                const isKilledState = await this.isAppLaunchedFromKilledState()

                if (isKilledState) {
                  console.log('[BackgroundCallHandler] Handling background call acceptance from killed state')
                  // Ensure proper initialization before navigation
                  await this.ensureAppInitializationForKilledState()
                }

                // Navigate to call screen and accept call
                const navigationSuccess = await this.navigateToCallScreen(this.pendingBackgroundCall)

                if (navigationSuccess) {
                  await this.acceptBackgroundCall()
                } else {
                  console.error('[BackgroundCallHandler] Background navigation failed, cannot accept call')
                }
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
   * Ensure all services are ready when app comes to foreground
   */
  private async ensureServicesReadyForForeground(): Promise<boolean> {
    try {
      if (!this.pendingBackgroundCall) {
        return true
      }

      console.log('[BackgroundCallHandler] Ensuring services are ready for foreground call')

      // Re-initialize services to ensure they're ready for foreground operation
      const servicesReady = await this.initializeServicesForBackgroundCall(this.pendingBackgroundCall)

      if (!servicesReady) {
        console.error('[BackgroundCallHandler] Failed to ensure services are ready for foreground')
        return false
      }

      // Additional foreground-specific initialization
      try {
        // Ensure VideoSDK is fully ready for UI interaction
        const videoSDKService = VideoSDKService.getInstance()
        // VideoSDK service is ready if we can get the instance
        console.log('[BackgroundCallHandler] VideoSDK ready for foreground interaction')

        // VideoSDK handles WebSocket internally, so we just check if it's healthy
        if (videoSDKService.isWebSocketHealthy()) {
          console.log('[BackgroundCallHandler] VideoSDK WebSocket stable for foreground operation')
        }

        console.log('[BackgroundCallHandler] All services ready for foreground call handling')
        return true
      } catch (error) {
        console.error('[BackgroundCallHandler] Error in foreground service preparation:', error)
        return false
      }
    } catch (error) {
      console.error('[BackgroundCallHandler] Error ensuring services ready for foreground:', error)
      return false
    }
  }

  /**
   * Process pending call when app comes to foreground
   */
  private async processCallWhenForeground(): Promise<void> {
    try {
      if (!this.pendingBackgroundCall) return

      console.log('[BackgroundCallHandler] Processing pending call in foreground')

      // Step 1: Ensure all services are ready for foreground operation
      const servicesReady = await this.ensureServicesReadyForForeground()
      if (!servicesReady) {
        console.error('[BackgroundCallHandler] Services not ready for foreground call, aborting')
        await this.clearPendingCall()
        return
      }

      // Step 2: Check if call is still valid (not expired)
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
