import { Platform } from 'react-native'

// Safe CallKeep import
let RNCallKeep: any = null
try {
  RNCallKeep = require('react-native-callkeep')
} catch (error) {
  console.warn('[CallKeepService] react-native-callkeep not available:', error)
}

interface CallKeepOptions {
  ios: {
    appName: string
    supportsVideo: boolean
    maximumCallGroups: number
    maximumCallsPerCallGroup: number
    includesCallsInRecents: boolean
  }
  android: {
    alertTitle: string
    alertDescription: string
    cancelButton: string
    okButton: string
    imageName: string
    additionalPermissions: string[]
    selfManaged: boolean
  }
}

/**
 * CallKeep service for handling native call UI on both iOS and Android
 * Integrates with CallStateManager for proper call state management
 */
export class CallKeepService {
  private static instance: CallKeepService
  private isInitialized = false
  private currentCallUUID: string | null = null

  private constructor() {}

  public static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService()
    }
    return CallKeepService.instance
  }

  /**
   * Initialize CallKeep with proper configuration
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('[CallKeepService] Already initialized')
      return true
    }

    try {
      console.log('[CallKeepService] 🔄 Initializing CallKeep...')

      // Check if CallKeep is available first
      if (!RNCallKeep) {
        console.warn('[CallKeepService] ⚠️ CallKeep not available')
        return false
      }

      const options: CallKeepOptions = {
        ios: {
          appName: 'Adtip',
          supportsVideo: true,
          maximumCallGroups: 1,
          maximumCallsPerCallGroup: 1,
          includesCallsInRecents: true
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Cancel',
          okButton: 'OK',
          imageName: 'phone_account_icon',
          additionalPermissions: [],
          selfManaged: false
        }
      }

      // Setup CallKeep with timeout
      const setupPromise = RNCallKeep.setup(options)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CallKeep setup timeout')), 7000)
      )

      await Promise.race([setupPromise, timeoutPromise])
      console.log('[CallKeepService] ✅ CallKeep setup complete')

      // Check permissions with timeout
      const permissionPromise = this.checkPermissions()
      const permissionTimeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => {
          console.warn('[CallKeepService] ⚠️ Permission check timeout, assuming false')
          resolve(false)
        }, 2000)
      )

      const hasPermissions = await Promise.race([permissionPromise, permissionTimeoutPromise])
      if (!hasPermissions) {
        console.warn('[CallKeepService] ⚠️ CallKeep permissions not granted (continuing anyway)')
        // Don't fail initialization for permission issues
      }

      // Setup event listeners
      this.setupEventListeners()

      this.isInitialized = true
      console.log('[CallKeepService] ✅ Initialization complete')
      return true
    } catch (error) {
      console.error('[CallKeepService] ❌ Initialization failed (non-critical):', error)
      // Mark as initialized even if setup failed to prevent blocking app
      this.isInitialized = true
      return false
    }
  }

  /**
   * Check if CallKeep permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await RNCallKeep.checkPhoneAccountPermission()
      }
      return true // iOS doesn't need explicit permission check
    } catch (error) {
      console.error('[CallKeepService] Error checking permissions:', error)
      return false
    }
  }

  /**
   * Request CallKeep permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await RNCallKeep.requestPhoneAccountPermission()
      }
      return true // iOS doesn't need explicit permission request
    } catch (error) {
      console.error('[CallKeepService] Error requesting permissions:', error)
      return false
    }
  }

  /**
   * Display incoming call in native UI
   */
  async displayIncomingCall(
    uuid: string,
    handle: string,
    localizedCallerName: string,
    handleType: 'generic' | 'number' | 'email' = 'generic',
    hasVideo: boolean = false
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepService] Not initialized, cannot display incoming call')
        return false
      }

      console.log('[CallKeepService] Displaying incoming call:', {
        uuid,
        handle,
        localizedCallerName,
        hasVideo
      })

      this.currentCallUUID = uuid

      await RNCallKeep.displayIncomingCall(
        uuid,
        handle,
        localizedCallerName,
        handleType,
        hasVideo
      )

      return true
    } catch (error) {
      console.error('[CallKeepService] Error displaying incoming call:', error)
      return false
    }
  }

  /**
   * Start an outgoing call
   */
  async startCall(
    uuid: string,
    handle: string,
    contactIdentifier?: string,
    handleType: 'generic' | 'number' | 'email' = 'generic',
    hasVideo: boolean = false
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepService] Not initialized, cannot start call')
        return false
      }

      console.log('[CallKeepService] Starting outgoing call:', {
        uuid,
        handle,
        hasVideo
      })

      this.currentCallUUID = uuid

      await RNCallKeep.startCall(uuid, handle, contactIdentifier, handleType, hasVideo)
      return true
    } catch (error) {
      console.error('[CallKeepService] Error starting call:', error)
      return false
    }
  }

  /**
   * Report call as connected
   */
  async reportConnectedOutgoingCall(uuid: string): Promise<void> {
    try {
      await RNCallKeep.reportConnectedOutgoingCallWithUUID(uuid)
      console.log('[CallKeepService] Reported outgoing call as connected:', uuid)
    } catch (error) {
      console.error('[CallKeepService] Error reporting connected call:', error)
    }
  }

  /**
   * End call
   */
  async endCall(uuid: string): Promise<void> {
    try {
      await RNCallKeep.endCall(uuid)
      if (this.currentCallUUID === uuid) {
        this.currentCallUUID = null
      }
      console.log('[CallKeepService] Ended call:', uuid)
    } catch (error) {
      console.error('[CallKeepService] Error ending call:', error)
    }
  }

  /**
   * End all calls
   */
  async endAllCalls(): Promise<void> {
    try {
      await RNCallKeep.endAllCalls()
      this.currentCallUUID = null
      console.log('[CallKeepService] Ended all calls')
    } catch (error) {
      console.error('[CallKeepService] Error ending all calls:', error)
    }
  }

  /**
   * Set call on hold
   */
  async setOnHold(uuid: string, shouldHold: boolean): Promise<void> {
    try {
      await RNCallKeep.setOnHold(uuid, shouldHold)
      console.log('[CallKeepService] Set call on hold:', uuid, shouldHold)
    } catch (error) {
      console.error('[CallKeepService] Error setting call on hold:', error)
    }
  }

  /**
   * Report call ended
   */
  async reportEndCallWithUUID(uuid: string, reason: number = 1): Promise<void> {
    try {
      await RNCallKeep.reportEndCallWithUUID(uuid, reason)
      if (this.currentCallUUID === uuid) {
        this.currentCallUUID = null
      }
      console.log('[CallKeepService] Reported call ended:', uuid)
    } catch (error) {
      console.error('[CallKeepService] Error reporting call ended:', error)
    }
  }

  /**
   * Get current call UUID
   */
  getCurrentCallUUID(): string | null {
    return this.currentCallUUID
  }

  /**
   * Check if CallKeep is available
   */
  isAvailable(): boolean {
    return this.isInitialized
  }

  /**
   * Setup CallKeep event listeners
   */
  private setupEventListeners(): void {
    console.log('[CallKeepService] Setting up event listeners')

    // Answer call event
    RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction)
    
    // End call event
    RNCallKeep.addEventListener('endCall', this.onEndCallAction)
    
    // Incoming call displayed event
    RNCallKeep.addEventListener('didDisplayIncomingCall', this.onIncomingCallDisplayed)
    
    // Call timed out event
    RNCallKeep.addEventListener('didPerformSetMutedCallAction', this.onToggleMute)
    
    // Hold call event
    RNCallKeep.addEventListener('didToggleHoldCallAction', this.onToggleHold)
    
    // DTMF event
    RNCallKeep.addEventListener('didPerformDTMFAction', this.onDTMFAction)
    
    // Audio session activated
    RNCallKeep.addEventListener('didActivateAudioSession', this.onAudioSessionActivated)
    
    // Audio session deactivated
    RNCallKeep.addEventListener('didDeactivateAudioSession', this.onAudioSessionDeactivated)
  }

  /**
   * Handle answer call action from CallKeep
   */
  private onAnswerCallAction = async ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeepService] Answer call action:', callUUID)

    try {
      // Use CallStateManager to prevent race conditions
      const { default: CallStateManager } = await import('./CallStateManager')
      const stateManager = CallStateManager.getInstance()

      await stateManager.queueAction({
        type: 'ACCEPT_CALL',
        sessionId: callUUID,
        source: 'CALLKEEP'
      })
    } catch (error) {
      console.error('[CallKeepService] Error handling answer call action:', error)
    }
  }

  /**
   * Handle end call action from CallKeep
   */
  private onEndCallAction = async ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeepService] End call action:', callUUID)

    try {
      // Use CallStateManager to prevent race conditions
      const { default: CallStateManager } = await import('./CallStateManager')
      const stateManager = CallStateManager.getInstance()

      await stateManager.queueAction({
        type: 'END_CALL',
        sessionId: callUUID,
        source: 'CALLKEEP'
      })
    } catch (error) {
      console.error('[CallKeepService] Error handling end call action:', error)
    }
  }

  /**
   * Handle incoming call displayed event
   */
  private onIncomingCallDisplayed = ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeepService] Incoming call displayed:', callUUID)
  }

  /**
   * Handle toggle mute action
   */
  private onToggleMute = ({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
    console.log('[CallKeepService] Toggle mute:', callUUID, muted)
    // TODO: Implement mute functionality
  }

  /**
   * Handle toggle hold action
   */
  private onToggleHold = ({ hold, callUUID }: { hold: boolean; callUUID: string }) => {
    console.log('[CallKeepService] Toggle hold:', callUUID, hold)
    // TODO: Implement hold functionality
  }

  /**
   * Handle DTMF action
   */
  private onDTMFAction = ({ digits, callUUID }: { digits: string; callUUID: string }) => {
    console.log('[CallKeepService] DTMF action:', callUUID, digits)
    // TODO: Implement DTMF functionality
  }

  /**
   * Handle audio session activated
   */
  private onAudioSessionActivated = () => {
    console.log('[CallKeepService] Audio session activated')
  }

  /**
   * Handle audio session deactivated
   */
  private onAudioSessionDeactivated = () => {
    console.log('[CallKeepService] Audio session deactivated')
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    console.log('[CallKeepService] Cleaning up event listeners')
    
    RNCallKeep.removeEventListener('answerCall')
    RNCallKeep.removeEventListener('endCall')
    RNCallKeep.removeEventListener('didDisplayIncomingCall')
    RNCallKeep.removeEventListener('didPerformSetMutedCallAction')
    RNCallKeep.removeEventListener('didToggleHoldCallAction')
    RNCallKeep.removeEventListener('didPerformDTMFAction')
    RNCallKeep.removeEventListener('didActivateAudioSession')
    RNCallKeep.removeEventListener('didDeactivateAudioSession')
  }
}

export default CallKeepService
