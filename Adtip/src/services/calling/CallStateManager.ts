import { AppState } from 'react-native'
import { useCallStore } from '../../stores/callStoreSimplified'

interface CallAction {
  type: 'INCOMING_CALL' | 'ACCEPT_CALL' | 'DECLINE_CALL' | 'END_CALL'
  sessionId: string
  source: 'FCM' | 'CALLKEEP' | 'NOTIFICATION' | 'UI'
  timestamp: number
  data?: any
}

/**
 * Centralized call state manager to prevent race conditions
 * Ensures only one call action is processed at a time
 */
export class CallStateManager {
  private static instance: CallStateManager
  private actionQueue: CallAction[] = []
  private isProcessing = false
  private currentSessionId: string | null = null
  private lastActionTimestamp = 0
  private readonly DEBOUNCE_TIME = 500 // 500ms debounce

  private constructor() {}

  public static getInstance(): CallStateManager {
    if (!CallStateManager.instance) {
      CallStateManager.instance = new CallStateManager()
    }
    return CallStateManager.instance
  }

  /**
   * Queue a call action for processing
   */
  async queueAction(action: Omit<CallAction, 'timestamp'>): Promise<void> {
    const fullAction: CallAction = {
      ...action,
      timestamp: Date.now()
    }

    console.log('[CallStateManager] Queueing action:', fullAction)

    // Check for duplicate actions within debounce time
    if (this.isDuplicateAction(fullAction)) {
      console.log('[CallStateManager] Ignoring duplicate action')
      return
    }

    this.actionQueue.push(fullAction)
    this.lastActionTimestamp = fullAction.timestamp

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue()
    }
  }

  /**
   * Process the action queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.actionQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.actionQueue.length > 0) {
        const action = this.actionQueue.shift()!
        await this.processAction(action)
        
        // Small delay between actions to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('[CallStateManager] Error processing queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single call action
   */
  private async processAction(action: CallAction): Promise<void> {
    try {
      console.log('[CallStateManager] Processing action:', action)

      switch (action.type) {
        case 'INCOMING_CALL':
          await this.handleIncomingCall(action)
          break
        case 'ACCEPT_CALL':
          await this.handleAcceptCall(action)
          break
        case 'DECLINE_CALL':
          await this.handleDeclineCall(action)
          break
        case 'END_CALL':
          await this.handleEndCall(action)
          break
        default:
          console.warn('[CallStateManager] Unknown action type:', action.type)
      }
    } catch (error) {
      console.error('[CallStateManager] Error processing action:', error)
    }
  }

  /**
   * Handle incoming call action
   */
  private async handleIncomingCall(action: CallAction): Promise<void> {
    console.log('[CallStateManager] Handling incoming call:', action.sessionId)

    // Check if we already have an active call
    const store = useCallStore.getState()
    if (store.session && store.status !== 'ended') {
      console.log('[CallStateManager] Already have active call, ignoring incoming call')
      return
    }

    // Set current session
    this.currentSessionId = action.sessionId

    // Let BackgroundCallHandler handle the incoming call
    const { BackgroundCallHandler } = await import('./BackgroundCallHandler')
    const handler = BackgroundCallHandler.getInstance()
    
    if (action.data) {
      await handler.handleIncomingCallBackground(action.data.callData, action.data.remoteMessage)
    }
  }

  /**
   * Handle accept call action
   */
  private async handleAcceptCall(action: CallAction): Promise<void> {
    console.log('[CallStateManager] Handling accept call:', action.sessionId)

    // Validate session
    if (!this.isValidSession(action.sessionId)) {
      console.warn('[CallStateManager] Invalid session for accept action')
      return
    }

    // Check app state and handle accordingly
    if (AppState.currentState === 'background' || AppState.currentState === 'inactive') {
      // Background accept - use BackgroundCallHandler
      const { BackgroundCallHandler } = await import('./BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()
      
      if (handler.hasPendingCall()) {
        await handler.acceptBackgroundCall()
      }
    } else {
      // Foreground accept - use CallController
      const { default: CallController } = await import('./CallController')
      const controller = CallController.getInstance()
      await controller.acceptCall()
    }
  }

  /**
   * Handle decline call action
   */
  private async handleDeclineCall(action: CallAction): Promise<void> {
    console.log('[CallStateManager] Handling decline call:', action.sessionId)

    // Validate session
    if (!this.isValidSession(action.sessionId)) {
      console.warn('[CallStateManager] Invalid session for decline action')
      return
    }

    // Check app state and handle accordingly
    if (AppState.currentState === 'background' || AppState.currentState === 'inactive') {
      // Background decline - use BackgroundCallHandler
      const { BackgroundCallHandler } = await import('./BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()
      
      if (handler.hasPendingCall()) {
        await handler.declineBackgroundCall()
      }
    } else {
      // Foreground decline - use CallController
      const { default: CallController } = await import('./CallController')
      const controller = CallController.getInstance()
      await controller.declineCall()
    }

    // Clear current session
    this.currentSessionId = null
  }

  /**
   * Handle end call action
   */
  private async handleEndCall(action: CallAction): Promise<void> {
    console.log('[CallStateManager] Handling end call:', action.sessionId)

    // Always try to end the call regardless of session validation
    try {
      // Try BackgroundCallHandler first
      const { BackgroundCallHandler } = await import('./BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()

      if (handler.hasPendingCall()) {
        await handler.declineBackgroundCall()
      } else {
        // Use CallController
        const { default: CallController } = await import('./CallController')
        const controller = CallController.getInstance()
        await controller.endCall()
      }

      // Perform comprehensive cleanup using CallCleanupService
      const { default: CallCleanupService } = await import('./CallCleanupService')
      const cleanupService = CallCleanupService.getInstance()
      await cleanupService.performCompleteCleanup(action.sessionId)

      // Validate cleanup
      const validation = await cleanupService.validateCleanup()
      if (!validation.isClean) {
        console.warn('[CallStateManager] Cleanup validation failed:', validation.issues)
        // Perform emergency cleanup if validation fails
        await cleanupService.emergencyCleanup()
      }

    } catch (error) {
      console.error('[CallStateManager] Error ending call:', error)

      // Emergency cleanup on error
      try {
        const { default: CallCleanupService } = await import('./CallCleanupService')
        const cleanupService = CallCleanupService.getInstance()
        await cleanupService.emergencyCleanup()
      } catch (cleanupError) {
        console.error('[CallStateManager] Emergency cleanup failed:', cleanupError)
      }
    }

    // Clear current session
    this.currentSessionId = null
  }

  /**
   * Check if action is a duplicate within debounce time
   */
  private isDuplicateAction(action: CallAction): boolean {
    const timeDiff = action.timestamp - this.lastActionTimestamp
    
    // If same session and action type within debounce time, consider duplicate
    if (timeDiff < this.DEBOUNCE_TIME && 
        action.sessionId === this.currentSessionId &&
        this.actionQueue.some(queuedAction => 
          queuedAction.type === action.type && 
          queuedAction.sessionId === action.sessionId
        )) {
      return true
    }

    return false
  }

  /**
   * Validate if session is current and valid
   */
  private isValidSession(sessionId: string): boolean {
    // If no current session, any session is valid for new calls
    if (!this.currentSessionId) {
      return true
    }

    // Session must match current session
    return this.currentSessionId === sessionId
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Clear current session
   */
  clearCurrentSession(): void {
    this.currentSessionId = null
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): {
    queueLength: number
    isProcessing: boolean
    currentSessionId: string | null
  } {
    return {
      queueLength: this.actionQueue.length,
      isProcessing: this.isProcessing,
      currentSessionId: this.currentSessionId
    }
  }

  /**
   * Clear the action queue (for testing/debugging)
   */
  clearQueue(): void {
    this.actionQueue = []
    this.isProcessing = false
    this.currentSessionId = null
  }
}

export default CallStateManager
