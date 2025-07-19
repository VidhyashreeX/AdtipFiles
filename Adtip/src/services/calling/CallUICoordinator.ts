import { Platform } from 'react-native'
import CallKeepService from './CallKeepService'
import NotificationService from './NotificationService'

/**
 * CallUICoordinator - Manages coordination between CallKeep native UI and custom call UI
 * Ensures no interference between different call UI systems
 */

interface CallUIOptions {
  sessionId: string
  callerName: string
  callType: 'video' | 'audio'
  meetingId?: string
  token?: string
  forceCustomUI?: boolean
}

interface CallUIState {
  isCallKeepActive: boolean
  isCustomUIActive: boolean
  activeSessionId: string | null
  uiType: 'callkeep' | 'custom' | 'none'
}

export class CallUICoordinator {
  private static instance: CallUICoordinator
  private callKeepService: CallKeepService
  private notificationService: NotificationService
  private currentState: CallUIState

  private constructor() {
    this.callKeepService = CallKeepService.getInstance()
    this.notificationService = NotificationService.getInstance()
    this.currentState = {
      isCallKeepActive: false,
      isCustomUIActive: false,
      activeSessionId: null,
      uiType: 'none'
    }
  }

  public static getInstance(): CallUICoordinator {
    if (!CallUICoordinator.instance) {
      CallUICoordinator.instance = new CallUICoordinator()
    }
    return CallUICoordinator.instance
  }

  /**
   * Initialize the coordinator
   */
  async initialize(): Promise<void> {
    try {
      console.log('[CallUICoordinator] Initializing...')
      
      // Initialize CallKeep service
      await this.callKeepService.initialize()
      
      console.log('[CallUICoordinator] Initialization complete')
    } catch (error) {
      console.error('[CallUICoordinator] Initialization failed:', error)
    }
  }

  /**
   * Show incoming call UI with proper coordination
   */
  async showIncomingCall(options: CallUIOptions): Promise<boolean> {
    try {
      console.log('[CallUICoordinator] Showing incoming call:', options)

      // Reset any previous state
      await this.resetUIState()

      // Determine which UI to use
      const shouldUseCallKeep = await this.shouldUseCallKeep(options)

      if (shouldUseCallKeep) {
        return await this.showCallKeepUI(options)
      } else {
        return await this.showCustomUI(options)
      }
    } catch (error) {
      console.error('[CallUICoordinator] Error showing incoming call:', error)
      // Fallback to custom UI
      return await this.showCustomUI(options)
    }
  }

  /**
   * Determine if CallKeep should be used
   */
  private async shouldUseCallKeep(options: CallUIOptions): Promise<boolean> {
    // Force custom UI if requested
    if (options.forceCustomUI) {
      console.log('[CallUICoordinator] Forcing custom UI as requested')
      return false
    }

    // Check if CallKeep is available and initialized
    if (!this.callKeepService.isAvailable()) {
      console.log('[CallUICoordinator] CallKeep not available, using custom UI')
      return false
    }

    // Check platform-specific conditions
    if (Platform.OS === 'android') {
      // Check if permissions are granted
      const hasPermissions = await this.callKeepService.checkPermissions()
      if (!hasPermissions) {
        console.log('[CallUICoordinator] CallKeep permissions not granted, using custom UI')
        return false
      }
    }

    console.log('[CallUICoordinator] Using CallKeep native UI')
    return true
  }

  /**
   * Show CallKeep native UI
   */
  private async showCallKeepUI(options: CallUIOptions): Promise<boolean> {
    try {
      console.log('[CallUICoordinator] Displaying CallKeep UI')

      const success = await this.callKeepService.displayIncomingCall(
        options.sessionId,
        options.callerName,
        options.callerName,
        'generic',
        options.callType === 'video'
      )

      if (success) {
        this.currentState = {
          isCallKeepActive: true,
          isCustomUIActive: false,
          activeSessionId: options.sessionId,
          uiType: 'callkeep'
        }
        console.log('[CallUICoordinator] CallKeep UI displayed successfully')
        return true
      } else {
        console.warn('[CallUICoordinator] CallKeep UI failed, falling back to custom UI')
        return await this.showCustomUI(options)
      }
    } catch (error) {
      console.error('[CallUICoordinator] Error showing CallKeep UI:', error)
      return await this.showCustomUI(options)
    }
  }

  /**
   * Show custom notification UI
   */
  private async showCustomUI(options: CallUIOptions): Promise<boolean> {
    try {
      console.log('[CallUICoordinator] Displaying custom UI')

      await this.notificationService.showIncomingCall(
        options.sessionId,
        options.callerName,
        options.callType === 'audio' ? 'voice' : 'video',
        options.meetingId,
        options.token
      )

      this.currentState = {
        isCallKeepActive: false,
        isCustomUIActive: true,
        activeSessionId: options.sessionId,
        uiType: 'custom'
      }

      console.log('[CallUICoordinator] Custom UI displayed successfully')
      return true
    } catch (error) {
      console.error('[CallUICoordinator] Error showing custom UI:', error)
      return false
    }
  }

  /**
   * End call and cleanup UI
   */
  async endCall(sessionId?: string): Promise<void> {
    try {
      console.log('[CallUICoordinator] Ending call:', sessionId)

      const targetSessionId = sessionId || this.currentState.activeSessionId

      if (!targetSessionId) {
        console.warn('[CallUICoordinator] No active session to end')
        return
      }

      // End CallKeep call if active
      if (this.currentState.isCallKeepActive) {
        this.callKeepService.endCall(targetSessionId)
      }

      // Clear custom notifications
      if (this.currentState.isCustomUIActive) {
        await this.notificationService.clearIncomingCall(targetSessionId)
      }

      // Reset state
      await this.resetUIState()

      console.log('[CallUICoordinator] Call ended and UI cleaned up')
    } catch (error) {
      console.error('[CallUICoordinator] Error ending call:', error)
    }
  }

  /**
   * Reset UI state
   */
  private async resetUIState(): Promise<void> {
    this.currentState = {
      isCallKeepActive: false,
      isCustomUIActive: false,
      activeSessionId: null,
      uiType: 'none'
    }
  }

  /**
   * Get current UI state
   */
  getCurrentState(): CallUIState {
    return { ...this.currentState }
  }

  /**
   * Check if CallKeep is currently handling a call
   */
  isCallKeepActive(): boolean {
    return this.currentState.isCallKeepActive
  }

  /**
   * Check if custom UI is currently active
   */
  isCustomUIActive(): boolean {
    return this.currentState.isCustomUIActive
  }

  /**
   * Get active session ID
   */
  getActiveSessionId(): string | null {
    return this.currentState.activeSessionId
  }

  /**
   * Force switch to custom UI (for testing or fallback)
   */
  async forceCustomUI(options: CallUIOptions): Promise<boolean> {
    console.log('[CallUICoordinator] Forcing custom UI')
    
    // End any active CallKeep call
    if (this.currentState.isCallKeepActive && this.currentState.activeSessionId) {
      this.callKeepService.endCall(this.currentState.activeSessionId)
    }

    // Show custom UI
    return await this.showCustomUI(options)
  }

  /**
   * Request CallKeep permissions if needed
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await this.callKeepService.requestPermissions()
      }
      return true // iOS doesn't need explicit permission request
    } catch (error) {
      console.error('[CallUICoordinator] Error requesting permissions:', error)
      return false
    }
  }
}

export default CallUICoordinator
