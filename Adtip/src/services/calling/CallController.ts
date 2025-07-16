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
import * as NavigationService from '../../navigation/NavigationService'
import ApiService from '../ApiService'
import CallStateCleanup from '../../utils/callStateCleanup'
import { startPersistentCall, updatePersistentCallStatus, endPersistentCall } from '../../components/videosdk/PersistentMeetingManager'
import PermissionManagerService from '../PermissionManagerService'

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
  
  private vibrateInterval: NodeJS.Timeout | null = null

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
        console.log(`[CallController] Status changed: ${prevStatus} -> ${status}`)
        
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
                session.meetingId,
                session.token
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
            }
            break
          }
          
          case 'ended': {
            // Stop vibrating
            this.stopVibrate()
            
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
          console.warn('[CallController] No sessionId in notification data')
          return
        }

        console.log('[CallController] Notification action pressed:', detail.pressAction?.id)

        switch (detail.pressAction?.id) {
          case 'answer':
            this.acceptCall()
            break

          case 'decline':
          case 'end':
            this.endCall()
            break

          default:
            console.warn('[CallController] Unknown notification action:', detail.pressAction?.id)
        }
      }
    })

    // Also handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        const sessionId = detail.notification?.data?.sessionId as string

        if (!sessionId) return

        console.log('[CallController] Background notification action:', detail.pressAction?.id)

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
   */
  private startVibrate() {
    this.stopVibrate()
    Vibration.vibrate([1000, 500, 1000, 500], true)
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
   * Clean up call resources with comprehensive state reset
   */
  private async cleanup() {
    console.log('[CallController] Starting comprehensive cleanup');

    try {
      // Use the comprehensive cleanup utility
      const cleanupService = CallStateCleanup.getInstance();
      await cleanupService.performComprehensiveCleanup();

      console.log('[CallController] Comprehensive cleanup complete');
    } catch (error) {
      console.error('[CallController] Error during comprehensive cleanup:', error);

      // Fallback to emergency cleanup
      const cleanupService = CallStateCleanup.getInstance();
      cleanupService.emergencyCleanup();
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
      console.warn('[CallController] Failed to get peer FCM token', err)
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
      console.warn('[CallController] Failed to fetch FCM token for', userId, error)
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
      console.warn('[CallController] sendCallStatusUpdate error', err)
    }
  }
  
  /**
   * Start an outgoing call
   */
  async startCall(recipientId: string, recipientName: string, callType: CallType) {
    console.log(`[CallController] Starting ${callType} call to ${recipientName}`)

    try {
      // Validate permissions before starting call
      console.log('[CallController] Validating call permissions...')
      const permissionManager = PermissionManagerService.getInstance()
      const permissionResult = await permissionManager.requestCallPermissions(callType === 'video')

      if (!permissionResult.microphone) {
        console.error('[CallController] Microphone permission not granted')
        throw new Error('Microphone permission is required to make calls')
      }

      if (callType === 'video' && !permissionResult.camera) {
        console.error('[CallController] Camera permission not granted for video call')
        throw new Error('Camera permission is required to make video calls')
      }

      console.log('[CallController] Call permissions validated successfully:', permissionResult)

      // Ensure comprehensive cleanup before starting new call
      await this.cleanup()

      // Ensure VideoSDK is initialized
      await this.videoSDK.initialize()

      // Clear any existing meeting state to prevent conflicts
      await this.videoSDK.clearExistingMeetingState()
      
      // Generate session ID for this call
      const sessionId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Check if we can set this as the active meeting session
      if (!this.videoSDK.setActiveMeetingSession(sessionId)) {
        throw new Error('Another meeting session is already active')
      }
      
      // Generate token for VideoSDK
      const token = await this.videoSDK.generateParticipantToken()
      if (!token) throw new Error('Failed to generate VideoSDK token')
      
      // Create meeting ID with state isolation
      const meetingId = await this.videoSDK.createMeeting(token)
      if (!meetingId) throw new Error('Failed to create meeting')
      
      // Get local user info
      const { userId, userName } = await this.getUserInfo()
      
      // Fetch FCM tokens separately
      const callerToken = await this.fetchFcmToken(userId)
      const recipientToken = await this.fetchFcmToken(recipientId)
      if (!callerToken || !recipientToken) throw new Error('FCM token(s) missing')
      
      // Build payload & call initiate-call API (FCM notification)
      await ApiService.initiateCall({
        calleeInfo: {
          platform: require('react-native').Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          token: recipientToken,
        },
        callerInfo: {
          name: userName,
          token: callerToken,
        },
        videoSDKInfo: {
          meetingId,
          token,
          callType,
        },
      })

      // Call payment API to start billing and get callId
      let callId: number | undefined
      try {
        console.log(`[CallController] Starting payment tracking for ${callType} call`)
        const paymentResponse = callType === 'video'
          ? await ApiService.initiateVideoCall({
              callerId: parseInt(userId),
              receiverId: parseInt(recipientId),
              action: 'start'
            })
          : await ApiService.initiateVoiceCall({
              callerId: parseInt(userId),
              receiverId: parseInt(recipientId),
              action: 'start'
            })

        if (paymentResponse.status && paymentResponse.call_id) {
          callId = paymentResponse.call_id
          console.log(`[CallController] Payment tracking started, callId: ${callId}`)
        } else {
          console.warn('[CallController] Payment API call succeeded but no callId returned:', paymentResponse)
        }
      } catch (paymentError) {
        console.error('[CallController] Failed to start payment tracking:', paymentError)
        // Continue with call even if payment tracking fails - this prevents call failures due to payment API issues
      }

      // Update store with outgoing call (use the same sessionId from VideoSDK tracking)
      const store = useCallStore.getState()
      store.actions.setSession({
        sessionId,
        meetingId,
        token,
        peerId: recipientId,
        peerName: recipientName,
        direction: 'outgoing',
        type: callType,
        startedAt: Date.now(),
        callId // Store the callId for payment processing when ending the call
      })
      store.actions.setStatus('outgoing')
      
      // Initialize media
      await this.media.initialize()
      
      // Show outgoing call notification
      this.notification.showOngoingCall(sessionId, recipientName, callType)
      
      // For outgoing calls, immediately transition to connecting so the meeting screen can render
      store.actions.setStatus('connecting')
      
      // Start persistent call instead of navigating
      startPersistentCall({
        sessionId,
        meetingId,
        token,
        peerName: recipientName,
        callType,
        direction: 'outgoing'
      })
      
      return true
    } catch (error) {
      console.error('[CallController] startCall error', error)
      
      // Reset call state
      const store = useCallStore.getState()
      store.actions.reset()
      
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
      console.warn('[CallController] Cannot accept call - no session or not ringing')
      return false
    }

    try {
      console.log('[CallController] Accepting call:', session.sessionId)

      // Validate permissions before accepting call
      console.log('[CallController] Validating call permissions for incoming call...')
      const permissionManager = PermissionManagerService.getInstance()
      const permissionResult = await permissionManager.requestCallPermissions(session.type === 'video')

      if (!permissionResult.microphone) {
        console.error('[CallController] Microphone permission not granted for accepting call')
        // Decline the call if permissions are not granted
        await this.declineCall()
        return false
      }

      if (session.type === 'video' && !permissionResult.camera) {
        console.error('[CallController] Camera permission not granted for accepting video call')
        // Decline the call if camera permission is not granted for video call
        await this.declineCall()
        return false
      }

      console.log('[CallController] Call permissions validated for accepting call:', permissionResult)

      // Stop vibrating
      this.stopVibrate()

      // Hide incoming notification
      this.notification.hideNotification(session.sessionId)

      // Update status
      store.actions.setStatus('connecting')

      // Initialize media and join meeting
      await this.media.initialize()

      // Join the meeting if we have meeting details
      if (session.meetingId && session.token) {
        await this.media.joinMeeting(
          session.meetingId,
          session.token,
          session.peerName || 'User',
          'video' // Default to video, will be updated by the meeting screen
        )
      }

      // Send accept signal
      try {
        await this.signaling.sendAccept(session.peerId, session.sessionId)
      } catch (signalError) {
        console.error('[CallController] Failed to send accept signal:', signalError)
      }

      // Start payment tracking for accepted call (if not already started)
      if (!session.callId) {
        try {
          console.log(`[CallController] Starting payment tracking for accepted ${session.type} call`)
          const { userId } = await this.getUserInfo()

          const paymentResponse = session.type === 'video'
            ? await ApiService.initiateVideoCall({
                callerId: parseInt(session.peerId), // The original caller
                receiverId: parseInt(userId), // Current user (receiver)
                action: 'start'
              })
            : await ApiService.initiateVoiceCall({
                callerId: parseInt(session.peerId), // The original caller
                receiverId: parseInt(userId), // Current user (receiver)
                action: 'start'
              })

          if (paymentResponse.status && paymentResponse.call_id) {
            // Update session with callId
            store.actions.setSession({
              ...session,
              callId: paymentResponse.call_id
            })
            console.log(`[CallController] Payment tracking started for accepted call, callId: ${paymentResponse.call_id}`)
          } else {
            console.warn('[CallController] Payment API call succeeded but no callId returned:', paymentResponse)
          }
        } catch (paymentError) {
          console.error('[CallController] Failed to start payment tracking for accepted call:', paymentError)
          // Continue with call even if payment tracking fails
        }
      }

      // Notify server of accepted call
      try {
        await this.sendCallStatusUpdate('CALL_ACCEPTED')
      } catch (statusError) {
        console.error('[CallController] Failed to send call status update:', statusError)
      }

      // Update status to in_call
      store.actions.setStatus('in_call')

      return true
    } catch (error) {
      console.error('[CallController] acceptCall error', error)
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
        console.error('[CallController] Failed to send decline signal:', signalError)
      }

      // Notify server of missed/declined call
      try {
        await this.sendCallStatusUpdate('CALL_MISSED')
      } catch (statusError) {
        console.error('[CallController] Failed to send call status update:', statusError)
      }

      // CallManagerService removed - billing handled by CallBillingService
      console.log('ℹ️ [CallController] Missed call cleanup completed')
      
      // Update status
      store.actions.setStatus('ended')
      
      return true
    } catch (error) {
      console.error('[CallController] declineCall error', error)
      return false
    }
  }
  
  /**
   * End active call
   */
  async endCall() {
    const store = useCallStore.getState()
    const session = store.session

    if (!session) {
      console.warn('[CallController] No session found in store on endCall');
      return false;
    }

    // Debug: Log session object
    console.log('[CallController] Session object on endCall:', session);

    if (!session) return false

    try {
      // Stop vibrating
      this.stopVibrate()

      // Update status
      store.actions.setStatus('ended')
      
      // Clear active meeting session in VideoSDK service
      if (session.sessionId) {
        this.videoSDK.clearActiveMeetingSession(session.sessionId)
      }

      // Send end signal
      try {
        await this.signaling.sendEnd(session.peerId, session.sessionId)
      } catch (signalError) {
        console.error('[CallController] Failed to send end signal:', signalError)
      }

      // Leave meeting
      try {
        await this.media.leaveMeeting()
      } catch (mediaError) {
        console.error('[CallController] Failed to leave meeting:', mediaError)
      }

      // Hide notifications and stop foreground service
      try {
        this.notification.hideNotification(session.sessionId)

        // Resolve the foreground service promise first
        if (global.resolveForegroundService) {
          global.resolveForegroundService()
        }

        // Then stop the foreground service
        await notifee.stopForegroundService()
      } catch (notificationError) {
        console.error('[CallController] Failed to cleanup notifications:', notificationError)
      }

      // CallManagerService removed - billing handled by CallBillingService
      console.log('ℹ️ [CallController] Call cleanup completed')

      // Process payment for ended call
      if (session.callId && session.peerId) {
        try {
          console.log(`[CallController] Processing payment for ended ${session.type} call, callId: ${session.callId}`)
          const { userId } = await this.getUserInfo()

          const paymentResponse = session.type === 'video'
            ? await ApiService.initiateVideoCall({
                callerId: parseInt(userId),
                receiverId: parseInt(session.peerId),
                action: 'end',
                callId: session.callId
              })
            : await ApiService.initiateVoiceCall({
                callerId: parseInt(userId),
                receiverId: parseInt(session.peerId),
                action: 'end',
                callId: session.callId
              })

          if (paymentResponse.status) {
            console.log('[CallController] Payment processed successfully:', paymentResponse)
          } else {
            console.warn('[CallController] Payment processing failed:', paymentResponse)
          }
        } catch (paymentError) {
          console.error('[CallController] Failed to process payment for ended call:', paymentError)
          // Continue with call cleanup even if payment processing fails
        }
      } else {
        if (!session.callId) {
          console.warn('[CallController] No callId in session on endCall', session);
        }
        if (!session.peerId) {
          console.warn('[CallController] No peerId in session on endCall', session);
        }
        console.warn('[CallController] No callId or peerId available for payment processing - call may not have been properly tracked')
      }

      // Notify server of ended call
      try {
        await this.sendCallStatusUpdate('CALL_ENDED')
      } catch (statusError) {
        console.error('[CallController] Failed to send call status update:', statusError)
      }

      // Reset call state
      store.actions.reset()

      // Reset navigation state to prevent conflicts with next call
      const NavigationService = await import('../../navigation/NavigationService')
      NavigationService.resetMeetingNavigationState()

      // Force comprehensive cleanup to ensure state isolation
      try {
        const cleanupService = CallStateCleanup.getInstance()
        await cleanupService.performComprehensiveCleanup()
      } catch (cleanupError) {
        console.error('[CallController] Cleanup error during endCall:', cleanupError)
      }

      return true
    } catch (error) {
      console.error('[CallController] endCall error', error)

      // Force cleanup even on error to prevent state bleeding
      try {
        const store = useCallStore.getState()
        store.actions.reset()

        const NavigationService = await import('../../navigation/NavigationService')
        NavigationService.resetMeetingNavigationState()

        const cleanupService = CallStateCleanup.getInstance()
        cleanupService.emergencyCleanup()
      } catch (emergencyError) {
        console.error('[CallController] Emergency cleanup error:', emergencyError)
      }

      return false
    }
  }
  
  /**
   * Handle incoming FCM message for call
   */
  handleFCMMessage(message: FirebaseMessagingTypes.RemoteMessage) {
    console.log('[CallController] Handling FCM message', message.data)

    try {
      const data = message.data
      if (!data || !data.type) {
        console.log('[CallController] No call data in FCM message, ignoring')
        return
      }

      const messageType = data.type
      console.log('[CallController] Processing FCM message type:', messageType)

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
          console.log('[CallController] Unknown FCM message type:', messageType)
      }
    } catch (error) {
      console.error('[CallController] Error handling FCM message:', error)
      // Don't throw - just log the error to prevent app crashes
    }
  }

  /**
   * Handle incoming call FCM message
   */
  private handleIncomingCallFCM(data: any) {
    try {
      console.log('[CallController] Handling incoming call FCM:', data)

      const sessionId = data.sessionId
      const callerName = data.callerName || 'Unknown Caller'
      const callType = data.callType || 'voice'
      const meetingId = data.meetingId
      const token = data.token
      const callerId = data.callerId

      if (!sessionId || !meetingId || !token) {
        console.error('[CallController] Missing required call data in FCM message')
        return
      }

      // Update call store with incoming call
      const store = useCallStore.getState()
      store.actions.setSession({
        sessionId,
        meetingId,
        token,
        peerId: callerId,
        peerName: callerName,
        direction: 'incoming',
        type: callType as CallType,
        startedAt: Date.now()
      })
      store.actions.setStatus('ringing')

      // Show incoming call notification
      this.notification.showIncomingCall(sessionId, callerName, callType)

      // Start vibration
      this.startVibrate()

      console.log('[CallController] Incoming call FCM processed successfully')
    } catch (error) {
      console.error('[CallController] Error handling incoming call FCM:', error)
    }
  }

  /**
   * Handle call accept FCM message
   */
  private handleCallAcceptFCM(data: any) {
    try {
      console.log('[CallController] Handling call accept FCM:', data)

      const sessionId = data.sessionId
      const store = useCallStore.getState()

      if (store.session?.sessionId === sessionId) {
        store.actions.setStatus('connecting')
        console.log('[CallController] Call accept FCM processed successfully')
      }
    } catch (error) {
      console.error('[CallController] Error handling call accept FCM:', error)
    }
  }

  /**
   * Handle call end FCM message
   */
  private handleCallEndFCM(data: any) {
    try {
      console.log('[CallController] Handling call end FCM:', data)

      const sessionId = data.sessionId
      const store = useCallStore.getState()

      if (store.session?.sessionId === sessionId) {
        // Stop vibration
        this.stopVibrate()

        // Hide notifications
        this.notification.hideNotification(sessionId)

        // Update status to ended
        store.actions.setStatus('ended')

        console.log('[CallController] Call end FCM processed successfully')
      }
    } catch (error) {
      console.error('[CallController] Error handling call end FCM:', error)
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