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

  // Listen to foreground FCM messages
  private registerFCMListener() {
    console.log('[CallSignalingService] Registering FCM listener (legacy)')
    messaging().onMessage(this.onMessage)
    // background handler is registered in index.js of RN app
  }

  private onMessage = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const data = remoteMessage.data
    if (!data || !data.type) return
    const payload = data as unknown as CallSignalPayload

    const store = useCallStore.getState()
    const actions = store.actions

    switch (payload.type) {
      case 'CALL_INITIATE': {
        actions.setSession({
          sessionId: payload.sessionId,
          meetingId: payload.meetingId,
          token: payload.token,
          peerId: payload.callerId,
          peerName: payload.callerName,
          direction: 'incoming',
          type: payload.callType,
        })
        actions.setStatus('ringing')
        
        // Start persistent call for incoming calls
        startPersistentCall({
          sessionId: payload.sessionId,
          meetingId: payload.meetingId,
          token: payload.token,
          peerName: payload.callerName,
          callType: payload.callType,
          direction: 'incoming'
        })
        break
      }
      case 'CALL_ACCEPT': {
        if (store.session?.sessionId !== payload.sessionId) return
        actions.setStatus('connecting')
        break
      }
      case 'CALL_END': {
        if (store.session?.sessionId !== payload.sessionId) return
        actions.setStatus('ended')
        break
      }
    }
  }

  // Send a signal via backend -> FCM push
  private async sendSignal(recipientId: string, payload: Partial<CallSignalPayload>) {
    try {
      // Use the implemented ApiService.sendCallSignal method
      await ApiService.sendCallSignal(recipientId, payload)
    } catch (err) {
      console.warn('[CallSignalingService] sendSignal error', err)
    }
  }

  async initiateCall(recipientId: string, recipientName: string, payload: CallSignalPayload) {
    await this.sendSignal(recipientId, payload)
  }

  async sendAccept(recipientId: string, sessionId: string) {
    await this.sendSignal(recipientId, { type: 'CALL_ACCEPT', sessionId })
  }

  async sendEnd(recipientId: string, sessionId: string) {
    await this.sendSignal(recipientId, { type: 'CALL_END', sessionId })
  }
}

export default CallSignalingService 