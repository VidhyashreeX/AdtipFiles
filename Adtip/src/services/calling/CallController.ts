import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'

// Global type declaration for foreground service resolver
declare global {
  var resolveForegroundService: (() => void) | undefined
}

import { useCallStore, CallType } from '../../stores/callStoreSimplified'
import CallSignalingService from './CallSignalingService'
import MediaService from './MediaService'
import NotificationService from './NotificationService'
import VideoSDKService from '../videosdk/VideoSDKService'
import CallKeepService from './CallKeepService'
import * as NavigationService from '../../navigation/NavigationService'
import ApiService from '../ApiService'
import CallStateCleanup from '../../utils/callStateCleanup'
import { startPersistentCall, updatePersistentCallStatus, updatePersistentCallConfig, endPersistentCall } from '../../components/videosdk/PersistentMeetingManager'
import PermissionManagerService from '../PermissionManagerService'
import CallConfig from '../../config/CallConfig'
import CallEndModalService from './CallEndModalService'
import { logCall, logError, logWarn } from '../../utils/ProductionLogger'
import CallBillingService from './CallBillingService'
import WalletService from '../WalletService'

/**
 * CallController - Main orchestration layer for call flows
 *
 * Handles:
 * 1. Outgoing call initiation
 * 2. Incoming call handling
 * 3. Call state management via Zustand
 * 4. Notifications via NotificationService
 * 5. Media via MediaService
 * 6. Navigation coordination
 */
class CallController {
  private static _instance: CallController
  private signaling: CallSignalingService
  private media: MediaService
  private notification: NotificationService
  private videoSDK: VideoSDKService
  private callKeep: CallKeepService

  private vibrateInterval: NodeJS.Timeout | null = null
  private lastCallId?: number; // <-- Store last callId for bulletproof end call
  private pendingIncomingCall: any = null; // Store pending incoming call for concurrent call handling

  // Call timeout management for internet issues and auto-end functionality
  private callTimeoutId: NodeJS.Timeout | null = null
  private maxCallDurationMs: number = 10 * 60 * 1000 // 10 minutes
  private callStartTime: number | null = null
  private isCallTimedOut: boolean = false

  static getInstance() {
    if (!CallController._instance) CallController._instance = new CallController()
    return CallController._instance
  }

  private constructor() {
    // Initialize services
    this.signaling = CallSignalingService.getInstance()
    this.media = MediaService.getInstance()
    this.notification = NotificationService.getInstance()
    this.videoSDK = VideoSDKService.getInstance()
    this.callKeep = CallKeepService.getInstance()

    // Set up listeners
    this.setupStoreListeners()
    this.setupNotificationListeners()
  }

  /**
   * Listen to store changes and coordinate actions
   */
  private setupStoreListeners() {
    const { getState, subscribe } = useCallStore

    // When call status changes
    subscribe(
      state => state.status,
      (status, prevStatus) => {
        logCall('CallController', `Status changed: ${prevStatus} -> ${status}`)

        switch (status) {
          case 'ringing': {
            const session = getState().session
            if (session) {
              // Start vibrating
              this.startVibrate()
              // Show incoming call notification with meeting details
              this.notification.showIncomingCall(
                session.sessionId,
                session.peerName,
                session.type,
                false, // not concurrent call
                session.meetingId,
                session.token,
                session.peerId // caller ID
              )
            }
            break
          }

          case 'connecting': {
            // Stop vibrating
            this.stopVibrate()
            break
          }

          case 'in_call': {
            const session = getState().session
            if (session) {
              // Show ongoing call notification
              this.notification.showOngoingCall(
                session.sessionId,
                session.peerName,
                session.type
              )

              // Start call timeout monitoring to prevent VideoSDK charges
              this.startCallTimeout()

              // Start billing enforcement once the call is actually connected
              this.startBillingEnforcement(session).catch((err) => {
                logWarn('CallController', 'Failed to start billing enforcement', err as any)
              })
            }
            break
          }

          case 'ended': {
            // Stop vibrating
            this.stopVibrate()

            // Clear call timeout monitoring
            this.clearCallTimeout()

            // Stop billing enforcement timers
            try {
              const billingService = CallBillingService.getInstance()
              billingService.stopCallBilling()
            } catch (err) {
              logWarn('CallController', 'Failed to stop billing enforcement', err as any)
            }

            // Hide notifications
            const session = getState().session
            if (session) {
              this.notification.hideNotification(session.sessionId)
            }

            // Clean up the session
            setTimeout(() => {
              this.cleanup()
            }, 500)
            break
          }
        }
      }
    )

    // When status changes, update persistent meeting manager
    subscribe(
      state => state.status,
      (status, prevStatus) => {
        switch (status) {
          case 'connecting':
          case 'in_call': {
            // Update persistent meeting status
            updatePersistentCallStatus(status)
            break
          }

          case 'ended': {
            // End persistent call

            endPersistentCall()
            break
          }
        }
      }
    )
  }

  /**
   * Listen to notification interactions
   */
  private setupNotificationListeners() {
    // Set up notifee action listeners for answer/decline/end
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        const sessionId = detail.notification?.data?.sessionId as string

        if (!sessionId) {
          logWarn('CallController', 'No sessionId in notification data')
          return
        }

        logCall('CallController', 'Notification action pressed', { action: detail.pressAction?.id })

        switch (detail.pressAction?.id) {
          case 'answer':
            this.acceptCall()
            break

          case 'decline':
          case 'end':
            this.endCall()
            break

          default:
            logWarn('CallController', 'Unknown notification action', { action: detail.pressAction?.id })
        }
      }
    })

    // Also handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        const sessionId = detail.notification?.data?.sessionId as string

        if (!sessionId) return

        logCall('CallController', 'Background notification action', { action: detail.pressAction?.id })

        switch (detail.pressAction?.id) {
          case 'answer':
            await this.acceptCall()
            break

          case 'decline':
          case 'end':
            await this.endCall()
            break
        }
      }
    })
  }

  /**
   * Start phone vibration
   * @param isConcurrentCall - Use different pattern for concurrent calls
   */
  private startVibrate(isConcurrentCall: boolean = false) {
    this.stopVibrate()
    if (isConcurrentCall) {
      // Shorter, more urgent pattern for concurrent calls
      Vibration.vibrate([500, 200, 500, 200, 500, 200], true)
    } else {
      // Normal incoming call pattern
      Vibration.vibrate([1000, 500, 1000, 500], true)
    }
  }

  /**
   * Stop phone vibration
   */
  private stopVibrate() {
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval)
      this.vibrateInterval = null
    }
    Vibration.cancel()
  }

  /**
   * Start call timeout monitoring
   */
  private startCallTimeout() {
    this.clearCallTimeout()
    this.callStartTime = Date.now()
    this.isCallTimedOut = false

    logCall('CallController', `Starting call timeout monitoring (${this.maxCallDurationMs / 60000} minutes)`)

    this.callTimeoutId = setTimeout(async () => {
      if (!this.isCallTimedOut) {
        this.isCallTimedOut = true
        logCall('CallController', '⚠️ Call timeout reached - auto-ending call to prevent VideoSDK charges')

        try {
          await this.endCall()
          logCall('CallController', '✅ Call auto-ended successfully due to timeout')
        } catch (error) {
          logError('CallController', '❌ Failed to auto-end call on timeout', error)
        }
      }
    }, this.maxCallDurationMs)
  }

  /**
   * Clear call timeout monitoring
   */
  private clearCallTimeout() {
    if (this.callTimeoutId) {
      clearTimeout(this.callTimeoutId)
      this.callTimeoutId = null
    }
    this.callStartTime = null
    this.isCallTimedOut = false
  }

  /**
   * Get remaining call time in seconds
   */
  private getRemainingCallTime(): number {
    if (!this.callStartTime || this.isCallTimedOut) {
      return 0
    }
    const elapsed = Date.now() - this.callStartTime
    const remaining = this.maxCallDurationMs - elapsed
    return Math.max(0, Math.floor(remaining / 1000))
  }

  /**
   * Emergency recovery for critical errors
   */
  public async emergencyRecovery(error: Error): Promise<void> {
    logError('CallController', 'Performing emergency recovery due to critical error', error);

    try {
      // Force cleanup of all call state
      const cleanupService = CallStateCleanup.getInstance();
      cleanupService.emergencyCleanup();

      // Reset VideoSDK with force
      const videoSDK = VideoSDKService.getInstance();
      videoSDK.reset(true);

      // Reset store state
      const { actions } = useCallStore.getState();
      actions.reset();

      logCall('CallController', 'Emergency recovery completed');
    } catch (recoveryError) {
      logError('CallController', 'Emergency recovery failed', recoveryError);
    }
  }

  /**
   * Clean up call resources with comprehensive state reset
   */
  private async cleanup() {
    logCall('CallController', 'Starting comprehensive cleanup');

    try {
      // Get current session for validation
      const store = useCallStore.getState();
      const currentSession = store.session;

      // Validate session before cleanup to prevent conflicts
      if (currentSession) {
        logCall('CallController', 'Cleaning up session:', currentSession.sessionId);

        // Clear active meeting session in VideoSDK service first
        this.videoSDK.clearActiveMeetingSession(currentSession.sessionId);
      }

      // Use the comprehensive cleanup utility
      const cleanupService = CallStateCleanup.getInstance();
      await cleanupService.performComprehensiveCleanup();

      // Ensure store is reset after cleanup
      const { actions } = useCallStore.getState();
      actions.reset();

      logCall('CallController', 'Comprehensive cleanup complete');
    } catch (error) {
      logError('CallController', 'Error during comprehensive cleanup', error);

      // Fallback to emergency cleanup
      const cleanupService = CallStateCleanup.getInstance();
      cleanupService.emergencyCleanup();

      // Force store reset even on error
      try {
        const { actions } = useCallStore.getState();
        actions.reset();
      } catch (storeError) {
        logError('CallController', 'Failed to reset store during emergency cleanup', storeError);
      }
    }
  }

  /**
   * Get user info from storage
   */
  private async getUserInfo() {
    const userId = await AsyncStorage.getItem('userId') || '0'
    const userName = await AsyncStorage.getItem('userName') || 'Unknown User'
    return { userId, userName }
  }

  /**
   * Get token for peer's FCM
   */
  private async getPeerFCMToken(peerId: string) {
    try {
      const response = await ApiService.getFCMToken(peerId)
      return response?.token
    } catch (err) {
      logWarn('CallController', 'Failed to get peer FCM token', err)
      return null
    }
  }

  /**
   * Helper to fetch FCM token for a given user id
   */
  private async fetchFcmToken(userId: string) {
    try {
      const res = await ApiService.getFCMToken(userId)
      return res?.token || null
    } catch (error) {
      logWarn('CallController', 'Failed to fetch FCM token', { userId, error })
      return null
    }
  }

  /**
   * Helper to send call status update via ApiService
   */
  private async sendCallStatusUpdate(type: 'CALL_ENDED' | 'CALL_MISSED' | 'CALL_ACCEPTED') {
    try {
      const { userId, userName } = await this.getUserInfo()
      const callerToken = await this.fetchFcmToken(userId)
      if (!callerToken) throw new Error('Caller FCM token not found')

      await ApiService.updateCallStatus({
        callerInfo: {
          token: callerToken,
          name: userName,
          platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
        },
        type,
      })
    } catch (err) {
      logWarn('CallController', 'sendCallStatusUpdate error', err)
    }
  }

  /**
   * Start an outgoing call
   */
  async startCall(recipientId: string, recipientName: string, callType: CallType) {
    logCall('CallController', `Starting ${callType} call to ${recipientName}`)

    try {
      // Validate permissions before starting call
      logCall('CallController', 'Validating call permissions...')
      const permissionManager = PermissionManagerService.getInstance()
      const permissionResult = await permissionManager.requestCallPermissions(callType === 'video')

      if (!permissionResult.microphone) {
        logError('CallController', 'Microphone permission not granted')
        throw new Error('Microphone permission is required to make calls')
      }

      if (callType === 'video' && !permissionResult.camera) {
        logError('CallController', 'Camera permission not granted for video call')
        throw new Error('Camera permission is required to make video calls')
      }

      logCall('CallController', 'Call permissions validated successfully', permissionResult)

      // Ensure comprehensive cleanup before starting new call
      await this.cleanup()

      // Ensure VideoSDK is initialized
      await this.videoSDK.initialize()

      // Clear any existing meeting state to prevent conflicts
      await this.videoSDK.clearExistingMeetingState()

      // Get local user info
      const { userId, userName } = await this.getUserInfo()

      // Use consolidated API that combines token generation, meeting creation, and call initiation
      logCall('CallController', 'Making consolidated call API request', {
        callerId: parseInt(userId),
        receiverId: parseInt(recipientId),
        callType,
        platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        timestamp: new Date().toISOString()
      });

      const consolidatedResponse = await ApiService.initiateConsolidatedCall({
        callerId: parseInt(userId),
        receiverId: parseInt(recipientId),
        callType,
        platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
      });

      logCall('CallController', 'Consolidated call API response received', {
        success: consolidatedResponse.success,
        callId: consolidatedResponse.data.callId,
        meetingId: consolidatedResponse.data.meetingId,
        sessionId: consolidatedResponse.data.sessionId,
        timestamp: new Date().toISOString()
      });

      if (!consolidatedResponse.success) {
        throw new Error(consolidatedResponse.message || 'Failed to initiate call');
      }

      // Extract data from consolidated response
      const {
        callId,
        meetingId,
        token,
        sessionId: backendSessionId,
        channelName,
        maxDuration
      } = consolidatedResponse.data;

      // Store callId for later use
      this.lastCallId = callId;

      // Set the backend sessionId as the active meeting session
      if (!this.videoSDK.setActiveMeetingSession(backendSessionId)) {
        throw new Error('Another meeting session is already active')
      }

      logCall('CallController', 'Consolidated API completed successfully - token generated, meeting created, FCM sent, payment tracked');

      // Update store with outgoing call (use sessionId from consolidated API response)
      const { actions } = useCallStore.getState()
      actions.setSession({
        sessionId: backendSessionId, // Use sessionId from backend for consistency
        meetingId,
        token,
        peerId: recipientId,
        peerName: recipientName,
        direction: 'outgoing',
        type: callType,
        startedAt: Date.now(),
        callId // Store the callId for payment processing when ending the call
      })
      actions.setStatus('outgoing')

      // Initialize media
      await this.media.initialize()

      // Show outgoing call notification
      this.notification.showOngoingCall(backendSessionId, recipientName, callType)

      // For outgoing calls, immediately transition to connecting so the meeting screen can render
      actions.setStatus('connecting')

      // Start persistent call instead of navigating
      startPersistentCall({
        sessionId: backendSessionId,
        meetingId,
        token,
        peerName: recipientName,
        callType,
        direction: 'outgoing'
      })

      return true
    } catch (error) {
      logError('CallController', 'startCall error', error)

      // Reset call state
      const { actions } = useCallStore.getState()
      actions.reset()

      return false
    }
  }

  /**
   * Start an outgoing call with optimized performance (TanStack Query version)
   * Navigates immediately and handles API calls asynchronously
   */
  async startCallOptimized(recipientId: string, recipientName: string, callType: CallType): Promise<boolean> {
    try {
      logCall('CallController', 'Starting optimized call flow', { recipientId, recipientName, callType });

      // Set flag to prevent AppOpenAdManager interference during critical call initiation
      try {
        const { setCallInitiationInProgress } = require('../../utils/CallInitiationFlag');
        setCallInitiationInProgress(true);
      } catch (error) {
        // Ignore import errors - flag is optional
        logCall('CallController', 'Could not set call initiation flag (non-critical):', error);
      }

      // Validate permissions before starting call
      const permissionManager = PermissionManagerService.getInstance()
      const permissionResult = await permissionManager.requestCallPermissions(callType === 'video')

      if (!permissionResult.microphone) {
        logError('CallController', 'Microphone permission not granted');
        throw new Error('Microphone permission is required to make calls')
      }

      if (callType === 'video' && !permissionResult.camera) {
        logError('CallController', 'Camera permission not granted for video call');
        throw new Error('Camera permission is required to make video calls')
      }

      // Ensure comprehensive cleanup before starting new call
      await this.cleanup()
      await this.videoSDK.initialize()
      await this.videoSDK.clearExistingMeetingState()

      // Get local user info
      const { userId, userName } = await this.getUserInfo()

      // Generate session ID for this call
      const backendSessionId = uuid.v4() as string
      logCall('CallController', 'Generated session ID', { sessionId: backendSessionId });

      // OPTIMIZATION: Navigate immediately with temporary session data
      const { actions } = useCallStore.getState()
      actions.setSession({
        sessionId: backendSessionId,
        meetingId: 'temp-' + backendSessionId, // Temporary meeting ID
        token: 'temp-token', // Temporary token
        peerId: recipientId,
        peerName: recipientName,
        direction: 'outgoing',
        type: callType,
        startedAt: Date.now(),
        callId: undefined // Will be set when API responds
      })

      // Set status to outgoing
      actions.setStatus('outgoing')

      // Check configuration for UI preference
      let usingCallKeep = false
      const forceCustomUI = CallConfig.shouldForceCustomUI();
      const enableCallKeep = CallConfig.shouldUseCallKeep();

      logCall('CallController', 'UI Configuration:', {
        forceCustomUI,
        enableCallKeep,
        callKeepAvailable: this.callKeep.isAvailable()
      });

      if (!forceCustomUI && enableCallKeep) {
        try {
          // Check if CallKeep is available and initialized
          if (this.callKeep.isAvailable()) {
            logCall('CallController', 'Using CallKeep for native outgoing call UI');

            // Start the call through CallKeep - this shows native call UI
            const callKeepStarted = await this.callKeep.startCall(
              backendSessionId,
              recipientName,
              recipientName, // contactIdentifier
              'generic',
              callType === 'video'
            )

            if (callKeepStarted) {
              usingCallKeep = true
              logCall('CallController', 'CallKeep outgoing call started successfully');

              // Set status to connecting since CallKeep is handling the UI
              actions.setStatus('connecting')
            } else {
              logCall('CallController', 'CallKeep startCall failed, falling back to custom UI');
            }
          } else {
            logCall('CallController', 'CallKeep not available, using custom call UI');
          }
        } catch (callKeepError) {
          logCall('CallController', 'CallKeep integration failed, using custom UI:', callKeepError);
        }
      } else {
        logCall('CallController', 'Custom UI forced by configuration - skipping CallKeep entirely');
      }

      // If CallKeep is not being used, show custom UI
      if (!usingCallKeep) {
        // Transition to connecting for custom UI
        actions.setStatus('connecting')
        
        // Initialize media
        await this.media.initialize()

        // Show outgoing call notification
        this.notification.showOngoingCall(backendSessionId, recipientName, callType)

        // Start persistent call with temporary data - this will show the meeting screen immediately
        startPersistentCall({
          sessionId: backendSessionId,
          meetingId: 'temp-' + backendSessionId,
          token: 'temp-token',
          peerName: recipientName,
          callType,
          direction: 'outgoing'
        })
      }

      // ASYNC: Make API call in background and update session when ready
      this.handleAsyncCallInitiation(userId, recipientId, callType, backendSessionId)

      // Clear the flag after initial setup is complete (after a short delay)
      setTimeout(() => {
        try {
          const { setCallInitiationInProgress } = require('../../utils/CallInitiationFlag');
          setCallInitiationInProgress(false);
        } catch (error) {
          // Ignore import errors
        }
      }, 3000); // 3 seconds should be enough for initial setup

      return true
    } catch (error) {
      logError('CallController', 'startCallOptimized error', error);

      // Clear the flag on error
      try {
        const { setCallInitiationInProgress } = require('../../utils/CallInitiationFlag');
        setCallInitiationInProgress(false);
      } catch (importError) {
        // Ignore import errors
      }

      // Reset call state
      const { actions } = useCallStore.getState()
      actions.reset()

      return false
    }
  }

  /**
   * Handle API call initiation asynchronously
   * Updates session data when API responds or fails gracefully
   */
  private async handleAsyncCallInitiation(
    userId: string,
    recipientId: string,
    callType: CallType,
    sessionId: string
  ): Promise<void> {
    try {
      logCall('CallController', 'Making async consolidated call API request', {
        callerId: parseInt(userId),
        receiverId: parseInt(recipientId),
        callType,
        platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
      });

      const consolidatedResponse = await ApiService.initiateConsolidatedCall({
        callerId: parseInt(userId),
        receiverId: parseInt(recipientId),
        callType,
        platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        sessionId: sessionId
      });

      logCall('CallController', 'Async consolidated call API response', {
        success: consolidatedResponse.success,
        sessionId: consolidatedResponse.data?.sessionId,
        meetingId: consolidatedResponse.data?.meetingId
      });

      if (!consolidatedResponse.success || !consolidatedResponse.data) {
        logError('CallController', 'Consolidated call API failed', new Error(consolidatedResponse.message));

        // API failed - exit meeting screen with failed status
        const { actions } = useCallStore.getState()
        actions.setStatus('failed')

        // End the persistent call
        setTimeout(() => {
          endPersistentCall()
          const { actions: resetActions } = useCallStore.getState()
          resetActions.reset()
        }, 2000) // Show failed status for 2 seconds before cleanup

        return
      }

      const {
        sessionId: apiSessionId,
        meetingId,
        token,
        callId: backendCallId
      } = consolidatedResponse.data

      logCall('CallController', 'Updating session with real API data', {
        apiSessionId,
        meetingId,
        backendCallId
      });

      // Update call store with real session info
      const store = useCallStore.getState()
      const currentSession = store.session

      // Enhanced session validation with detailed logging
      if (!currentSession) {
        logWarn('CallController', 'No current session found when updating with API data', {
          expectedSessionId: sessionId,
          currentSession: null
        });
        return;
      }

      if (currentSession.sessionId !== sessionId) {
        logWarn('CallController', 'Session ID mismatch when updating with API data', {
          expectedSessionId: sessionId,
          currentSessionId: currentSession.sessionId,
          sessionDirection: currentSession.direction,
          sessionType: currentSession.type
        });
        return;
      }

      // Validate that we're not overwriting a different call
      if (currentSession.direction === 'incoming' && currentSession.peerId !== undefined) {
        logWarn('CallController', 'Attempting to update incoming call session with outgoing call data', {
          sessionId,
          currentDirection: currentSession.direction,
          currentPeerId: currentSession.peerId
        });
        return;
      }

      // Update the session with real data
      const { actions } = useCallStore.getState()
      actions.setSession({
        ...currentSession,
        meetingId,
        token,
        callId: backendCallId
      })

      // Update persistent call with real meeting data
      updatePersistentCallConfig({
        sessionId,
        meetingId,
        token,
        status: 'connected'
      })

      logCall('CallController', 'Session updated successfully with real API data', {
        sessionId,
        meetingId,
        hasToken: !!token,
        callId: backendCallId
      });

      // Clear the call initiation flag now that API call is complete
      try {
        const { setCallInitiationInProgress } = require('../../utils/CallInitiationFlag');
        setCallInitiationInProgress(false);
      } catch (importError) {
        // Ignore import errors
      }

    } catch (error) {
      logError('CallController', 'Async call initiation error', error);

      // Clear the call initiation flag on error
      try {
        const { setCallInitiationInProgress } = require('../../utils/CallInitiationFlag');
        setCallInitiationInProgress(false);
      } catch (importError) {
        // Ignore import errors
      }

      // API error - exit meeting screen with failed status
      const { actions } = useCallStore.getState()
      actions.setStatus('failed')

      // End the persistent call
      setTimeout(() => {
        endPersistentCall()
        const { actions: resetActions } = useCallStore.getState()
        resetActions.reset()
      }, 2000) // Show failed status for 2 seconds before cleanup
    }
  }

  /**
   * Accept concurrent incoming call (ends current call)
   */
  async acceptConcurrentCall(): Promise<boolean> {
    logCall('CallController', 'Accepting concurrent call - ending current call first')

    try {
      // End current call first
      await this.endCall()

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))

      // Accept the pending call
      if (this.pendingIncomingCall) {
        const { actions } = useCallStore.getState()
        actions.setSession(this.pendingIncomingCall)
        actions.setStatus('ringing')

        // Clear pending call
        this.pendingIncomingCall = null

        // Now accept the new call
        return await this.acceptCall()
      }

      return false
    } catch (error) {
      logError('CallController', 'Error accepting concurrent call', error)
      return false
    }
  }

  /**
   * Accept incoming call
   */
  async acceptCall() {
    const store = useCallStore.getState()
    const session = store.session

    if (!session || store.status !== 'ringing') {
      logWarn('CallController', 'Cannot accept call - no session or not ringing')
      return false
    }

    try {
      logCall('CallController', 'Accepting call', { sessionId: session.sessionId })

      // Validate permissions before accepting call
      logCall('CallController', 'Validating call permissions for incoming call...')
      const permissionManager = PermissionManagerService.getInstance()
      const permissionResult = await permissionManager.requestCallPermissions(session.type === 'video')

      if (!permissionResult.microphone) {
        logError('CallController', 'Microphone permission not granted for accepting call')
        // Decline the call if permissions are not granted
        await this.declineCall()
        return false
      }

      if (session.type === 'video' && !permissionResult.camera) {
        logError('CallController', 'Camera permission not granted for accepting video call')
        // Decline the call if camera permission is not granted for video call
        await this.declineCall()
        return false
      }

      logCall('CallController', 'Call permissions validated for accepting call', permissionResult)

      // Stop vibrating immediately when call is accepted
      this.stopVibrate()

      // Hide incoming notification immediately
      this.notification.hideNotification(session.sessionId)

      // Update status to connecting (not in_call yet)
      const { actions } = useCallStore.getState()
      actions.setStatus('connecting')

      // Initialize media but don't join meeting yet
      await this.media.initialize()

      // Navigate to meeting screen but don't join VideoSDK meeting yet
      // The meeting screen will handle the delayed join logic
      if (session.meetingId && session.token) {
        await this.media.navigateToMeetingWithoutJoining(
          session.meetingId,
          session.token,
          session.peerName || 'User',
          'video' // Default to video, will be updated by the meeting screen
        )
      }

      // Send accept signal to the other party
      try {
        await this.signaling.sendAccept(session.peerId, session.sessionId)
        logCall('CallController', 'Accept signal sent successfully')
      } catch (signalError) {
        logError('CallController', 'Failed to send accept signal', signalError)
      }

      // Use consolidated API to accept the call (payment tracking is handled automatically)
      if (session.callId) {
        try {
          logCall('CallController', `Accepting ${session.type} call using consolidated API`)
          const { userId } = await this.getUserInfo()

          await ApiService.updateConsolidatedCallStatus({
            callId: session.callId,
            action: 'accept',
            userId: parseInt(userId)
          })

          logCall('CallController', `Call accepted successfully via consolidated API`)
        } catch (acceptError) {
          logError('CallController', 'Failed to accept call via consolidated API', acceptError)
          // Continue with call even if acceptance API fails - this is non-critical
        }
      }

      // Notify server of accepted call
      try {
        await this.sendCallStatusUpdate('CALL_ACCEPTED')
        logCall('CallController', 'Call status update sent successfully')
      } catch (statusError) {
        logError('CallController', 'Failed to send call status update', statusError)
      }

      // Send PARTICIPANT_READY signal to indicate we're ready to join the VideoSDK meeting
      try {
        await this.signaling.sendParticipantReady(session.peerId, session.sessionId)
        logCall('CallController', 'PARTICIPANT_READY signal sent successfully')
      } catch (readyError) {
        logError('CallController', 'Failed to send PARTICIPANT_READY signal', readyError)
      }

      // Update status to in_call only after everything is set up
      actions.setStatus('in_call')

      return true
    } catch (error) {
      logError('CallController', 'acceptCall error', error)
      // If accept fails, ensure we clean up
      await this.declineCall()
      return false
    }
  }

  /**
   * Decline incoming call
   */
  async declineCall() {
    const store = useCallStore.getState()
    const session = store.session

    if (!session || store.status !== 'ringing') return false

    try {
      // Stop vibrating
      this.stopVibrate()

      // Hide incoming notification
      this.notification.hideNotification(session.sessionId)

      // Send end signal
      try {
        await this.signaling.sendEnd(session.peerId, session.sessionId)
      } catch (signalError) {
        logError('CallController', 'Failed to send decline signal', signalError)
      }

      // Notify server of missed/declined call using consolidated API
      if (session.callId) {
        try {
          const { userId } = await this.getUserInfo()
          await ApiService.updateConsolidatedCallStatus({
            callId: session.callId,
            action: 'missed',
            userId: parseInt(userId)
          })
          logCall('CallController', 'Call declined successfully via consolidated API')
        } catch (statusError) {
          logError('CallController', 'Failed to decline call via consolidated API', statusError)
        }
      }

      // CallManagerService removed - billing handled by CallBillingService
      logCall('CallController', 'Missed call cleanup completed')

      // Update status
      const { actions } = useCallStore.getState()
      actions.setStatus('ended')

      // Reject CallKeep call if it was active
      try {
        if (session.callId && this.callKeep.isAvailable()) {
          logCall('CallController', 'Rejecting CallKeep call');
          const RNCallKeep = require('react-native-callkeep').default;
          RNCallKeep.rejectCall(session.callId);
        }
      } catch (callKeepError) {
        logWarn('CallController', 'Failed to reject CallKeep call', callKeepError);
      }

      return true
    } catch (error) {
      logError('CallController', 'declineCall error', error)
      return false
    }
  }

  // Flag to prevent duplicate endCall operations
  private isEndingCall = false;

  /**
   * End active call
   */
  async endCall() {
    // Prevent duplicate endCall operations
    if (this.isEndingCall) {
      logCall('CallController', 'endCall already in progress, skipping duplicate call');
      return true;
    }

    this.isEndingCall = true;

    // Clear call timeout monitoring immediately
    this.clearCallTimeout()

    try {
      const store = useCallStore.getState()
      let session = store.session

      if (!session) {
        logWarn('CallController', 'No session found in store on endCall');
        return false;
      }

      // Debug: Log session object
      logCall('CallController', 'Session object on endCall', session);

      // Use lastCallId if available, otherwise session.callId
      const callIdToUse = this.lastCallId || session.callId;
      if (!callIdToUse) {
        logWarn('CallController', 'No callId available for end call', session);
      } else {
        // Call the end API (voice or video)
        const { userId } = await this.getUserInfo();

        try {
          // Always use the original caller and receiver from when call started
          // For outgoing calls: current user is caller, peer is receiver
          // For incoming calls: peer is caller, current user is receiver
          const isOutgoingCall = session.direction === 'outgoing';
          const originalCallerId = isOutgoingCall ? parseInt(userId) : parseInt(session.peerId);
          const originalReceiverId = isOutgoingCall ? parseInt(session.peerId) : parseInt(userId);

        const payload = {
          callerId: originalCallerId,
          receiverId: originalReceiverId,
          action: 'end' as const,
          callId: callIdToUse
        };

        logCall('CallController', 'Calling end API with payload', {
          payload,
          callType: session.type,
          direction: session.direction,
          originalCallerId,
          originalReceiverId,
          callId: callIdToUse
        });

        // Use consolidated status API for both voice and video calls to ensure proper wallet deduction
        logCall('CallController', `Making ${session.type} call end API call using consolidated status endpoint...`);
        await ApiService.updateConsolidatedCallStatus({
          callId: callIdToUse,
          action: 'end',
          userId: parseInt(userId),
          duration: session.duration || 0
        });
        logCall('CallController', `${session.type} call end API called successfully via consolidated status endpoint`);

        logCall('CallController', 'End call API completed successfully');
      } catch (err) {
        logError('CallController', 'End call API error', {
          error: err,
          payload: {
            callerId: session.direction === 'outgoing' ? parseInt(userId) : parseInt(session.peerId),
            receiverId: session.direction === 'outgoing' ? parseInt(session.peerId) : parseInt(userId),
            action: 'end',
            callId: callIdToUse
          },
          sessionType: session.type,
          sessionDirection: session.direction
        });
      }
    }
    } catch (sessionError) {
      logError('CallController', 'Error handling session during endCall', sessionError);
    }

    // CRITICAL FIX: End VideoSDK meeting FIRST before any cleanup
    try {
      logCall('CallController', '🚀 ENDING VIDEOSDK MEETING BEFORE CLEANUP');

      // Get the meeting object before any cleanup happens
      let meetingObject = this.media.getMeetingObject();

      logCall('CallController', '🚀 Meeting object from MediaService:', {
        exists: !!meetingObject,
        hasEnd: !!(meetingObject && typeof meetingObject.end === 'function'),
        hasLeave: !!(meetingObject && typeof meetingObject.leave === 'function')
      });

      if (meetingObject && typeof meetingObject.end === 'function') {
        logCall('CallController', '🚀 CALLING meeting.end() to end meeting for all participants');
        try {
          meetingObject.end();
          logCall('CallController', '🚀 meeting.end() called successfully');
        } catch (endError) {
          logError('CallController', '🚀 Error calling meeting.end()', endError);
          // Try leave as fallback
          if (typeof meetingObject.leave === 'function') {
            logCall('CallController', '🚀 Fallback: calling meeting.leave()');
            meetingObject.leave();
          }
        }
      } else {
        logCall('CallController', '🚀 No meeting object available from MediaService to end');
      }

      // Small delay to allow VideoSDK events to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (meetingEndError) {
      logError('CallController', '🚀 Error ending VideoSDK meeting', meetingEndError);
    }

    // Proceed with comprehensive UI cleanup after ending meeting
    try {
      // Stop vibrating immediately
      this.stopVibrate()

      // Get current session for cleanup operations
      const currentStore = useCallStore.getState();
      const currentSession = currentStore.session;

      // Update status to ended immediately
      logCall('CallController', '🚀 SETTING CALL STATUS TO ENDED');
      const { actions: endActions } = useCallStore.getState();
      endActions.setStatus('ended');
      logCall('CallController', '🚀 Call status set to ended, current status:', useCallStore.getState().status);

      // End CallKeep call if it was active
      try {
        if (currentSession?.callId && this.callKeep.isAvailable()) {
          logCall('CallController', 'Ending CallKeep call');
          const RNCallKeep = require('react-native-callkeep').default;
          RNCallKeep.endCall(currentSession.callId);
        }
      } catch (callKeepError) {
        logWarn('CallController', 'Failed to end CallKeep call', callKeepError);
      }

      // Clear active meeting session in VideoSDK service
      if (currentSession && currentSession.sessionId) {
        this.videoSDK.clearActiveMeetingSession(currentSession.sessionId)
      }

      // Send end signal to the other party with retry
      try {
        if (currentSession && currentSession.peerId && currentSession.sessionId) {
          logCall('CallController', 'Sending end signal to peer');
          await this.signaling.sendEnd(currentSession.peerId, currentSession.sessionId)
          logCall('CallController', 'End signal sent successfully');
        }
      } catch (signalError) {
        logError('CallController', 'Failed to send end signal', signalError)
        // Retry sending end signal once
        try {
          if (currentSession && currentSession.peerId && currentSession.sessionId) {
            logCall('CallController', 'Retrying end signal to peer');
            await this.signaling.sendEnd(currentSession.peerId, currentSession.sessionId)
            logCall('CallController', 'End signal retry successful');
          }
        } catch (retryError) {
          logError('CallController', 'End signal retry also failed', retryError)
        }
      }

      // Meeting already ended above, just clean up media service
      try {
        logCall('CallController', '🚀 CLEANING UP MEDIA SERVICE (meeting already ended)');
        await this.media.leaveMeeting()
        logCall('CallController', '🚀 MEDIA SERVICE CLEANUP COMPLETED');
      } catch (mediaError) {
        logError('CallController', '🚀 FAILED TO CLEANUP MEDIA SERVICE', mediaError)
      }

      // Comprehensive notification cleanup
      try {
        if (currentSession && currentSession.sessionId) {
          logCall('CallController', 'Hiding notifications');
          this.notification.hideNotification(currentSession.sessionId)
        }

        // Stop foreground service
        if (global.resolveForegroundService) {
          global.resolveForegroundService()
        }
        await notifee.stopForegroundService()

        // Clear all call-related notifications as fallback
        await notifee.cancelAllNotifications()

        logCall('CallController', 'Notification cleanup completed');
      } catch (notificationError) {
        logError('CallController', 'Failed to cleanup notifications', notificationError)
      }

      logCall('CallController', 'Call cleanup completed')

      // Show call end modal with billing information
      try {
        if (currentSession && currentSession.duration && currentSession.duration > 0) {
          const callEndModalService = CallEndModalService.getInstance();
          const isCallInitiator = currentSession.direction === 'outgoing';

          // Show modal with proper billing calculation
          await callEndModalService.showCallEndModalWithProperBilling(
            currentSession.type,
            isCallInitiator,
            currentSession.duration,
            isCallInitiator ? undefined : currentSession.peerName, // callerName (if we received)
            isCallInitiator ? currentSession.peerName : undefined, // receiverName (if we made)
            false // TODO: Get actual premium status
          );

          logCall('CallController', 'Call end modal triggered successfully');
        }
      } catch (modalError) {
        logError('CallController', 'Error showing call end modal', modalError);
      }

    } catch (cleanupError) {
      logError('CallController', 'Error during call cleanup', cleanupError)
    } finally {
      // Reset the flag to allow future endCall operations
      this.isEndingCall = false;
    }
    return true;
  }

  /**
   * Begin billing enforcement using current session state
   */
  async startBillingEnforcement(session: ReturnType<typeof useCallStore.getState>['session']): Promise<void> {
    try {
      if (!session) return
      const { userId } = await this.getUserInfo()
      const [balanceStr, premiumStatus] = await Promise.all([
        WalletService.getWalletBalance(userId),
        WalletService.checkPremiumStatus(userId),
      ])
      const numericBalance = parseFloat(balanceStr || '0')
      const isPremium = !!premiumStatus?.isPremium
      const billingService = CallBillingService.getInstance()
      await billingService.startCallBilling(
        session.sessionId,
        userId,
        session.type,
        numericBalance,
        isPremium
      )
    } catch (err) {
      throw err
    }
  }

  /**
   * Handle incoming FCM message for call
   */
  handleFCMMessage(message: FirebaseMessagingTypes.RemoteMessage) {
    logCall('CallController', 'Handling FCM message', message.data)

    try {
      const data = message.data
      if (!data || !data.type) {
        logCall('CallController', 'No call data in FCM message, ignoring')
        return
      }

      const messageType = data.type
      logCall('CallController', 'Processing FCM message type', { messageType })

      switch (messageType) {
        case 'CALL_INITIATE':
          this.handleIncomingCallFCM(data)
          break
        case 'CALL_ACCEPT':
          this.handleCallAcceptFCM(data)
          break
        case 'CALL_END':
          this.handleCallEndFCM(data)
          break
        default:
          logCall('CallController', 'Unknown FCM message type', { messageType })
      }
    } catch (error) {
      logError('CallController', 'Error handling FCM message', error)
      // Don't throw - just log the error to prevent app crashes
    }
  }

  /**
   * Handle incoming call FCM message
   */
  private handleIncomingCallFCM(data: any) {
    try {
      logCall('CallController', 'Handling incoming call FCM', data)

      const sessionId = data.sessionId
      const callerName = data.callerName || 'Unknown Caller'
      const callType = data.callType || 'voice'
      const meetingId = data.meetingId
      const token = data.token
      const callerId = data.callerId
      const allowsConcurrentCalls = data.allowsConcurrentCalls === "true"

      if (!sessionId || !meetingId || !token) {
        logError('CallController', 'Missing required call data in FCM message')
        return
      }

      // Check if there's already an active call
      const store = useCallStore.getState()
      const currentStatus = store.status
      const hasActiveCall = ['connecting', 'in_call'].includes(currentStatus)

      if (hasActiveCall && allowsConcurrentCalls) {
        logCall('CallController', 'Incoming call while already in active call - concurrent calls supported')
        // Store the incoming call data for potential acceptance
        // The user can choose to accept (ending current call), decline, or ignore
        this.pendingIncomingCall = {
          sessionId,
          meetingId,
          token,
          peerId: callerId,
          peerName: callerName,
          direction: 'incoming',
          type: callType as CallType,
          startedAt: Date.now()
        }

        // Show incoming call notification with concurrent call context
        this.notification.showIncomingCall(sessionId, callerName, callType, true, undefined, undefined, callerId) // true indicates concurrent call

        // Use a different vibration pattern for concurrent calls
        this.startVibrate(true) // true for concurrent call pattern

        logCall('CallController', 'Concurrent incoming call stored and notification shown')
        return
      }

      // Normal incoming call handling (no active call or concurrent calls not supported)
      const { actions } = useCallStore.getState()
      actions.setSession({
        sessionId,
        meetingId,
        token,
        peerId: callerId,
        peerName: callerName,
        direction: 'incoming',
        type: callType as CallType,
        startedAt: Date.now()
      })
      actions.setStatus('ringing')

      // Show incoming call notification
      this.notification.showIncomingCall(sessionId, callerName, callType, false, meetingId, token, callerId)

      // Start vibration
      this.startVibrate()

      logCall('CallController', 'Incoming call FCM processed successfully')
    } catch (error) {
      logError('CallController', 'Error handling incoming call FCM', error)
    }
  }

  /**
   * Handle call accept FCM message
   */
  private handleCallAcceptFCM(data: any) {
    try {
      logCall('CallController', 'Handling call accept FCM', data)

      const sessionId = data.sessionId
      const store = useCallStore.getState()

      if (store.session?.sessionId === sessionId) {
        const { actions } = useCallStore.getState()
        actions.setStatus('connecting')
        logCall('CallController', 'Call accept FCM processed successfully')
      }
    } catch (error) {
      logError('CallController', 'Error handling call accept FCM', error)
    }
  }

  /**
   * Handle call end FCM message
   */
  private handleCallEndFCM(data: any) {
    try {
      logCall('CallController', 'Handling call end FCM', data)

      const sessionId = data.sessionId
      const store = useCallStore.getState()

      if (store.session?.sessionId === sessionId) {
        // Stop vibration
        this.stopVibrate()

        // Hide notifications
        this.notification.hideNotification(sessionId)

        // Update status to ended
        const { actions } = useCallStore.getState()
        actions.setStatus('ended')

        logCall('CallController', 'Call end FCM processed successfully')
      }
    } catch (error) {
      logError('CallController', 'Error handling call end FCM', error)
    }
  }

  /**
   * Get media service instance
   */
  getMediaService() {
    return this.media
  }
}

export default CallController