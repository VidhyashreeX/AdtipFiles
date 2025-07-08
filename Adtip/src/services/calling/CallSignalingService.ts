import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import ApiService from '../ApiService'
import { useCallStore } from '../../stores/callStoreSimplified'
import { CallType } from '../../stores/callStoreSimplified'

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
    this.registerFCMListener()
  }

  // Listen to foreground FCM messages
  private registerFCMListener() {
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
      // TODO: implement proper endpoint in ApiService
      await (ApiService as any).sendCallSignal?.(recipientId, payload)
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