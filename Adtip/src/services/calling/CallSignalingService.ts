import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import ApiService from '../ApiService'
import { useCallStore } from '../../stores/callStoreSimplified'
import { CallType } from '../../stores/callStoreSimplified'
import CallConfig from '../../config/CallConfig'
import { startPersistentCall } from '../../components/videosdk/PersistentMeetingManager'

// Shape of messages exchanged via FCM
interface CallSignalPayload {
  type: 'CALL_INITIATE' | 'CALL_ACCEPT' | 'CALL_END'
  meetingId: string
  token: string
  sessionId: string
  callerId: string
  callerName: string
  calleeId: string
  calleeName: string
  callType: CallType
}

class CallSignalingService {
  private static _instance: CallSignalingService

  static getInstance() {
    if (!CallSignalingService._instance) CallSignalingService._instance = new CallSignalingService()
    return CallSignalingService._instance
  }

  private constructor() {
    // Only register FCM listener if enabled in config
    if (CallConfig.shouldEnableService('signaling')) {
      this.registerFCMListener()
    } else {
      console.log('[CallSignalingService] Disabled by configuration - skipping FCM listener setup')
    }
  }

  // FCM messages are now handled by ReliableCallManager
  private registerFCMListener() {
    console.log('[CallSignalingService] FCM listener disabled - using ReliableCallManager')
    // messaging().onMessage(this.onMessage)
    // background handler is registered in index.js of RN app
  }

  private onMessage = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      console.log('[CallSignalingService] FCM message received:', remoteMessage.data)

      const data = remoteMessage.data
      if (!data || !data.type) {
        console.log('[CallSignalingService] No call data in message, ignoring')
        return
      }

      const payload = data as unknown as CallSignalPayload
      console.log('[CallSignalingService] Processing call signal:', payload.type)

      // Validate required fields
      if (!payload.sessionId) {
        console.error('[CallSignalingService] Missing sessionId in FCM message')
        return
      }

      const store = useCallStore.getState()
      const actions = store.actions

      switch (payload.type) {
        case 'CALL_INITIATE': {
          try {
            console.log('[CallSignalingService] Incoming call initiated:', payload.callerName)

            // Validate required fields for incoming call
            if (!payload.meetingId || !payload.token || !payload.callerId) {
              console.error('[CallSignalingService] Missing required fields for CALL_INITIATE:', {
                meetingId: !!payload.meetingId,
                token: !!payload.token,
                callerId: !!payload.callerId
              })
              return
            }

            // Set session state
            actions.setSession({
              sessionId: payload.sessionId,
              meetingId: payload.meetingId,
              token: payload.token,
              peerId: payload.callerId,
              peerName: payload.callerName || 'Unknown Caller',
              direction: 'incoming',
              type: payload.callType || 'voice',
              startedAt: Date.now()
            })
            actions.setStatus('ringing')

            // Start persistent call for incoming calls with error handling
            try {
              startPersistentCall({
                sessionId: payload.sessionId,
                meetingId: payload.meetingId,
                token: payload.token,
                peerName: payload.callerName || 'Unknown Caller',
                callType: payload.callType || 'voice',
                direction: 'incoming'
              })
              console.log('[CallSignalingService] Incoming call session created and persistent call started')
            } catch (persistentCallError) {
              console.error('[CallSignalingService] Error starting persistent call:', persistentCallError)
              // Set status to error so UI can handle it
              actions.setStatus('ended')
            }
            break
          } catch (initiateError) {
            console.error('[CallSignalingService] Error handling CALL_INITIATE:', initiateError)
          }
          break
        }
        case 'CALL_ACCEPT': {
          try {
            if (store.session?.sessionId !== payload.sessionId) {
              console.log('[CallSignalingService] CALL_ACCEPT sessionId mismatch, ignoring')
              return
            }
            actions.setStatus('connecting')
            console.log('[CallSignalingService] Call accepted, status set to connecting')
          } catch (acceptError) {
            console.error('[CallSignalingService] Error handling CALL_ACCEPT:', acceptError)
          }
          break
        }

        case 'PARTICIPANT_READY': {
          try {
            console.log('[CallSignalingService] Remote participant is ready to join meeting')
            // This signal indicates the remote participant is ready to join the VideoSDK meeting
            // Trigger the actual VideoSDK meeting join
            const currentSession = store.session
            if (currentSession && currentSession.meetingId && currentSession.token) {
              console.log('[CallSignalingService] Triggering delayed VideoSDK meeting join')
              const mediaService = (await import('./MediaService')).default.getInstance()
              await mediaService.joinMeetingDirectly(
                currentSession.meetingId,
                currentSession.token,
                currentSession.peerName || 'User',
                currentSession.type
              )
            }
          } catch (readyError) {
            console.error('[CallSignalingService] Error handling PARTICIPANT_READY:', readyError)
          }
          break
        }
        case 'CALL_END': {
          try {
            if (store.session?.sessionId !== payload.sessionId) {
              console.log('[CallSignalingService] CALL_END sessionId mismatch, ignoring')
              return
            }
            actions.setStatus('ended')
            console.log('[CallSignalingService] Call ended, status set to ended')
          } catch (endError) {
            console.error('[CallSignalingService] Error handling CALL_END:', endError)
          }
          break
        }
        default:
          console.warn('[CallSignalingService] Unknown call signal type:', payload.type)
      }
    } catch (error) {
      console.error('[CallSignalingService] Critical error in FCM message processing:', error)
      // Don't throw - just log to prevent app crashes
    }
  }

  // Send a signal via backend -> FCM push
  private async sendSignal(recipientId: string, payload: Partial<CallSignalPayload>) {
    try {
      // Use the implemented ApiService.sendCallSignal method
      await ApiService.sendCallSignal(recipientId, payload)
    } catch (err) {
      console.warn('[CallSignalingService] sendSignal error', err)

      // Enhanced error handling for signaling failures
      if (err instanceof Error) {
        if (err.message.includes('No FCM token found')) {
          console.warn('[CallSignalingService] FCM token not found for recipient, they may be offline or have uninstalled the app');
        } else if (err.message.includes('User not found')) {
          console.warn('[CallSignalingService] Recipient user not found, they may have deleted their account');
        } else if (err.message.includes('Request failed with status code 404')) {
          console.warn('[CallSignalingService] Recipient not found on server');
        } else {
          console.warn('[CallSignalingService] Unknown signaling error:', err.message);
        }
      }

      // Don't throw - let the calling code handle the failure gracefully
    }
  }

  async initiateCall(recipientId: string, recipientName: string, payload: CallSignalPayload) {
    await this.sendSignal(recipientId, payload)
  }

  async sendAccept(recipientId: string, sessionId: string) {
    try {
      console.log('[CallSignalingService] Sending CALL_ACCEPT signal:', { recipientId, sessionId })
      await this.sendSignal(recipientId, {
        type: 'CALL_ACCEPT',
        sessionId,
        // Add additional fields to ensure proper FCM message structure
        callType: 'voice', // Default, will be overridden by actual call type
        meetingId: 'accepted',
        token: 'accepted'
      })
      console.log('[CallSignalingService] CALL_ACCEPT signal sent successfully')
    } catch (error) {
      console.error('[CallSignalingService] Error sending CALL_ACCEPT signal:', error)
      // Don't throw - just log to prevent app crashes
    }
  }

  async sendParticipantReady(recipientId: string, sessionId: string) {
    try {
      console.log('[CallSignalingService] Sending PARTICIPANT_READY signal:', { recipientId, sessionId })
      await this.sendSignal(recipientId, {
        type: 'PARTICIPANT_READY',
        sessionId,
        // Add additional fields to ensure proper FCM message structure
        callType: 'voice', // Default, will be overridden by actual call type
        meetingId: 'ready',
        token: 'ready'
      })
      console.log('[CallSignalingService] PARTICIPANT_READY signal sent successfully')
    } catch (error) {
      console.error('[CallSignalingService] Error sending PARTICIPANT_READY signal:', error)
      // Don't throw - just log to prevent app crashes
    }
  }

  async sendEnd(recipientId: string, sessionId: string) {
    try {
      console.log('[CallSignalingService] Sending CALL_END signal:', { recipientId, sessionId })
      await this.sendSignal(recipientId, {
        type: 'CALL_END',
        sessionId,
        // Add additional fields to ensure proper FCM message structure
        callType: 'voice', // Default, will be overridden by actual call type
        meetingId: 'ended',
        token: 'ended'
      })
      console.log('[CallSignalingService] CALL_END signal sent successfully')
    } catch (error) {
      console.error('[CallSignalingService] Error sending CALL_END signal:', error)
      // Don't throw - just log to prevent app crashes
    }
  }
}

export default CallSignalingService 