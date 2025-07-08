import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

import { useCallStore, CallType } from '../../stores/callStoreSimplified'
import CallSignalingService from './CallSignalingService'
import MediaService from './MediaService'
import NotificationService from './NotificationService'
import VideoSDKService from '../videosdk/VideoSDKService'
import * as NavigationService from '../../navigation/NavigationService'
import ApiService from '../ApiService'

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
              // Show incoming call notification
              this.notification.showIncomingCall(
                session.sessionId,
                session.peerName,
                session.type
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
    
    // When status changes, handle navigation
    subscribe(
      state => state.status,
      (status, prevStatus) => {
        switch (status) {
          case 'connecting':
          case 'in_call': {
            // Navigate to call screen
            const session = getState().session
            if (session) {
              // Use meeting with simple parameters
              NavigationService.navigateToMeeting({
                meetingId: session.meetingId,
                token: session.token,
                callType: session.type,
                displayName: "User", // Can be retrieved from AsyncStorage
                recipientName: session.peerName,
                isInitiator: session.direction === 'outgoing'
              })
            }
            break
          }
          
          case 'ended': {
            // Navigate back ONLY if we are currently on Meeting screen
            setTimeout(() => {
              const currentRoute = NavigationService.getCurrentRoute()
              if (currentRoute?.name === 'Meeting') {
                NavigationService.navigate('Main', {
                  screen: 'TipCallSimple',
                  params: undefined as any
                })
              }
            }, 500)
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
    // TODO: Set up notifee action listeners
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
   * Clean up call resources
   */
  private async cleanup() {
    await this.media.leaveMeeting()
    const store = useCallStore.getState()
    
    // Reset after a moment to allow for any animations
    setTimeout(() => {
      store.actions.reset()
    }, 500)
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
      // Ensure VideoSDK is initialized 
      await this.videoSDK.initialize()
      
      // Generate token for VideoSDK
      const token = await this.videoSDK.generateParticipantToken()
      if (!token) throw new Error('Failed to generate VideoSDK token')
      
      // Create meeting ID
      const meetingId = await this.videoSDK.createMeeting(token)
      if (!meetingId) throw new Error('Failed to create meeting')
      
      // Get local user info
      const { userId, userName } = await this.getUserInfo()
      
      // Fetch FCM tokens separately
      const callerToken = await this.fetchFcmToken(userId)
      const recipientToken = await this.fetchFcmToken(recipientId)
      if (!callerToken || !recipientToken) throw new Error('FCM token(s) missing')
      
      // Build payload & call initiate-call API
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
      
      // Create unique session ID
      const sessionId = uuid.v4().toString()
      
      // Update store with outgoing call
      const store = useCallStore.getState()
      store.actions.setSession({
        sessionId,
        meetingId,
        token,
        peerId: recipientId,
        peerName: recipientName,
        direction: 'outgoing',
        type: callType,
        startedAt: Date.now()
      })
      store.actions.setStatus('outgoing')
      
      // Initialize media
      await this.media.initialize()
      
      // Show outgoing call notification
      this.notification.showOngoingCall(sessionId, recipientName, callType)
      
      // Navigate to meeting screen
      NavigationService.navigateToMeeting({
        meetingId,
        token,
        callType,
        displayName: userName,
        recipientName,
        isInitiator: true
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
    
    if (!session || store.status !== 'ringing') return false
    
    try {
      // Stop vibrating
      this.stopVibrate()
      
      // Hide incoming notification
      this.notification.hideNotification(session.sessionId)
      
      // Update status
      store.actions.setStatus('connecting')
      
      // Initialize media
      await this.media.initialize()
      
      // Send accept signal
      await this.signaling.sendAccept(session.peerId, session.sessionId)
      
      // Notify server of accepted call
      await this.sendCallStatusUpdate('CALL_ACCEPTED')
      
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
      await this.signaling.sendEnd(session.peerId, session.sessionId)
      
      // Notify server of missed/declined call
      await this.sendCallStatusUpdate('CALL_MISSED')
      
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
    
    if (!session) return false
    
    try {
      // Update status
      store.actions.setStatus('ended')
      
      // Send end signal
      await this.signaling.sendEnd(session.peerId, session.sessionId)
      
      // Leave meeting
      await this.media.leaveMeeting()
      
      // Notify server of ended call
      await this.sendCallStatusUpdate('CALL_ENDED')
      
      return true
    } catch (error) {
      console.error('[CallController] endCall error', error)
      return false
    }
  }
  
  /**
   * Handle incoming FCM message for call
   */
  handleFCMMessage(message: FirebaseMessagingTypes.RemoteMessage) {
    console.log('[CallController] Handling FCM message', message.data)
    // Handled by CallSignalingService FCM listener
  }

  /**
   * Get media service instance
   */
  getMediaService() {
    return this.media
  }
}

export default CallController 