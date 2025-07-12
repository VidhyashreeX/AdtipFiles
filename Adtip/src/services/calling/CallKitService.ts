import { NativeModules, NativeEventEmitter, Platform } from 'react-native'
import { CallType } from '../../stores/callStoreSimplified'

const { AdtipCallKitManager } = NativeModules

interface CallKitCallData {
  sessionId: string
  callerName: string
  callType: CallType
  meetingId?: string
  token?: string
}

class CallKitService {
  private static _instance: CallKitService
  private eventEmitter: NativeEventEmitter | null = null
  private listeners: Array<() => void> = []

  static getInstance() {
    if (!CallKitService._instance) CallKitService._instance = new CallKitService()
    return CallKitService._instance
  }

  private constructor() {
    if (Platform.OS === 'ios' && AdtipCallKitManager) {
      this.eventEmitter = new NativeEventEmitter(AdtipCallKitManager)
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    if (!this.eventEmitter) return

    // Listen for CallKit events
    const incomingCallListener = this.eventEmitter.addListener(
      'CallKitIncomingCall',
      this.handleIncomingCall
    )

    const callAnsweredListener = this.eventEmitter.addListener(
      'CallKitCallAnswered',
      this.handleCallAnswered
    )

    const callDeclinedListener = this.eventEmitter.addListener(
      'CallKitCallDeclined',
      this.handleCallDeclined
    )

    const callEndedListener = this.eventEmitter.addListener(
      'CallKitCallEnded',
      this.handleCallEnded
    )

    this.listeners = [
      () => incomingCallListener.remove(),
      () => callAnsweredListener.remove(),
      () => callDeclinedListener.remove(),
      () => callEndedListener.remove(),
    ]
  }

  private handleIncomingCall = (callData: CallKitCallData) => {
    console.log('[CallKitService] Incoming call received:', callData)
    // This will be handled by the main call controller
  }

  private handleCallAnswered = (callData: CallKitCallData) => {
    console.log('[CallKitService] Call answered via CallKit:', callData)
    // Trigger call acceptance in the main app
    this.notifyCallAction('ANSWER', callData)
  }

  private handleCallDeclined = (callData: CallKitCallData) => {
    console.log('[CallKitService] Call declined via CallKit:', callData)
    // Trigger call decline in the main app
    this.notifyCallAction('DECLINE', callData)
  }

  private handleCallEnded = (callData: CallKitCallData) => {
    console.log('[CallKitService] Call ended via CallKit:', callData)
    // Trigger call end in the main app
    this.notifyCallAction('END', callData)
  }

  private notifyCallAction(action: 'ANSWER' | 'DECLINE' | 'END', callData: CallKitCallData) {
    // Import CallController dynamically to avoid circular dependencies
    import('./CallController').then(({ default: CallController }) => {
      const controller = CallController.getInstance()
      
      switch (action) {
        case 'ANSWER':
          controller.acceptCall()
          break
        case 'DECLINE':
        case 'END':
          controller.endCall()
          break
      }
    }).catch(error => {
      console.error('[CallKitService] Error importing CallController:', error)
    })
  }

  /**
   * Display incoming call in CallKit (iOS only)
   */
  async displayIncomingCall(callData: CallKitCallData): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AdtipCallKitManager) {
      console.log('[CallKitService] CallKit not available on this platform')
      return false
    }

    try {
      console.log('[CallKitService] Displaying incoming call in CallKit:', callData.callerName)
      await AdtipCallKitManager.displayIncomingCall(callData)
      return true
    } catch (error) {
      console.error('[CallKitService] Failed to display incoming call:', error)
      return false
    }
  }

  /**
   * End call in CallKit (iOS only)
   */
  async endCall(sessionId: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AdtipCallKitManager) {
      return false
    }

    try {
      console.log('[CallKitService] Ending call in CallKit:', sessionId)
      await AdtipCallKitManager.endCall(sessionId)
      return true
    } catch (error) {
      console.error('[CallKitService] Failed to end call:', error)
      return false
    }
  }

  /**
   * Start outgoing call in CallKit (iOS only)
   */
  async startOutgoingCall(callData: CallKitCallData): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AdtipCallKitManager) {
      return false
    }

    try {
      console.log('[CallKitService] Starting outgoing call in CallKit:', callData.callerName)
      await AdtipCallKitManager.startOutgoingCall(callData)
      return true
    } catch (error) {
      console.error('[CallKitService] Failed to start outgoing call:', error)
      return false
    }
  }

  /**
   * Update call state in CallKit (iOS only)
   */
  async updateCallState(sessionId: string, state: 'connecting' | 'connected' | 'ended'): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AdtipCallKitManager) {
      return false
    }

    try {
      console.log('[CallKitService] Updating call state in CallKit:', state)
      await AdtipCallKitManager.updateCallState(sessionId, state)
      return true
    } catch (error) {
      console.error('[CallKitService] Failed to update call state:', error)
      return false
    }
  }

  /**
   * Set call as connected in CallKit (iOS only)
   */
  async setCallConnected(sessionId: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AdtipCallKitManager) {
      return false
    }

    try {
      console.log('[CallKitService] Setting call as connected in CallKit:', sessionId)
      await AdtipCallKitManager.setCallConnected(sessionId)
      return true
    } catch (error) {
      console.error('[CallKitService] Failed to set call as connected:', error)
      return false
    }
  }

  /**
   * Check if CallKit is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' && !!AdtipCallKitManager
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    this.listeners.forEach(removeListener => removeListener())
    this.listeners = []
  }
}

export default CallKitService
