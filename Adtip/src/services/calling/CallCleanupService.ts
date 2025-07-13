import { useCallStore } from '../../stores/callStoreSimplified'
import BackgroundMediaService from './BackgroundMediaService'
import CallKeepService from './CallKeepService'
import NotificationService from './NotificationService'
import VideoSDKService from '../videosdk/VideoSDKService'
import { endPersistentCall } from '../../components/videosdk/PersistentMeetingManager'

/**
 * Centralized service for cleaning up call resources
 * Ensures complete cleanup when calls end from any state (foreground/background)
 */
export class CallCleanupService {
  private static instance: CallCleanupService

  private constructor() {}

  public static getInstance(): CallCleanupService {
    if (!CallCleanupService.instance) {
      CallCleanupService.instance = new CallCleanupService()
    }
    return CallCleanupService.instance
  }

  /**
   * Perform complete call cleanup
   */
  async performCompleteCleanup(sessionId?: string): Promise<void> {
    console.log('[CallCleanupService] Starting complete cleanup for session:', sessionId)

    try {
      // Step 1: Clean up call store
      await this.cleanupCallStore()

      // Step 2: Clean up notifications
      await this.cleanupNotifications(sessionId)

      // Step 3: Clean up CallKeep
      await this.cleanupCallKeep(sessionId)

      // Step 4: Clean up media services
      await this.cleanupMediaServices()

      // Step 5: Clean up VideoSDK
      await this.cleanupVideoSDK()

      // Step 6: Clean up persistent call
      await this.cleanupPersistentCall()

      // Step 7: Clean up background call handler
      await this.cleanupBackgroundCallHandler()

      console.log('[CallCleanupService] Complete cleanup finished')
    } catch (error) {
      console.error('[CallCleanupService] Error during complete cleanup:', error)
    }
  }

  /**
   * Clean up call store
   */
  private async cleanupCallStore(): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up call store')
      const store = useCallStore.getState()
      store.actions.setStatus('ended')
      store.actions.reset()
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up call store:', error)
    }
  }

  /**
   * Clean up notifications
   */
  private async cleanupNotifications(sessionId?: string): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up notifications')
      const notificationService = NotificationService.getInstance()
      
      if (sessionId) {
        await notificationService.hideNotification(sessionId)
      } else {
        // Hide all call-related notifications
        await notificationService.hideAllNotifications()
      }
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up notifications:', error)
    }
  }

  /**
   * Clean up CallKeep
   */
  private async cleanupCallKeep(sessionId?: string): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up CallKeep')
      const callKeepService = CallKeepService.getInstance()
      
      if (callKeepService.isAvailable()) {
        if (sessionId) {
          await callKeepService.endCall(sessionId)
        } else {
          await callKeepService.endAllCalls()
        }
      }
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up CallKeep:', error)
    }
  }

  /**
   * Clean up media services
   */
  private async cleanupMediaServices(): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up media services')
      
      // Clean up background media service
      const backgroundMediaService = BackgroundMediaService.getInstance()
      backgroundMediaService.reset()
      
      // Clean up main media service
      const { default: MediaService } = await import('./MediaService')
      const mediaService = MediaService.getInstance()
      await mediaService.ensureCleanState()
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up media services:', error)
    }
  }

  /**
   * Clean up VideoSDK
   */
  private async cleanupVideoSDK(): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up VideoSDK')
      const videoSDKService = VideoSDKService.getInstance()
      
      // Clear active meeting session
      videoSDKService.clearActiveMeetingSession()
      
      // Reset VideoSDK state
      videoSDKService.reset()
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up VideoSDK:', error)
    }
  }

  /**
   * Clean up persistent call
   */
  private async cleanupPersistentCall(): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up persistent call')
      endPersistentCall()
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up persistent call:', error)
    }
  }

  /**
   * Clean up background call handler
   */
  private async cleanupBackgroundCallHandler(): Promise<void> {
    try {
      console.log('[CallCleanupService] Cleaning up background call handler')
      const { BackgroundCallHandler } = await import('./BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()
      
      if (handler.hasPendingCall()) {
        await handler.declineBackgroundCall()
      }
    } catch (error) {
      console.error('[CallCleanupService] Error cleaning up background call handler:', error)
    }
  }

  /**
   * Emergency cleanup - force cleanup all call resources
   */
  async emergencyCleanup(): Promise<void> {
    console.log('[CallCleanupService] Performing emergency cleanup')

    try {
      // Force cleanup everything without waiting for errors
      await Promise.allSettled([
        this.cleanupCallStore(),
        this.cleanupNotifications(),
        this.cleanupCallKeep(),
        this.cleanupMediaServices(),
        this.cleanupVideoSDK(),
        this.cleanupPersistentCall(),
        this.cleanupBackgroundCallHandler()
      ])

      console.log('[CallCleanupService] Emergency cleanup completed')
    } catch (error) {
      console.error('[CallCleanupService] Error during emergency cleanup:', error)
    }
  }

  /**
   * Cleanup specific to background call decline
   */
  async cleanupBackgroundCallDecline(sessionId: string): Promise<void> {
    console.log('[CallCleanupService] Cleaning up background call decline:', sessionId)

    try {
      // Clean up notifications
      await this.cleanupNotifications(sessionId)

      // Clean up CallKeep
      await this.cleanupCallKeep(sessionId)

      // Clean up media
      await this.cleanupMediaServices()

      // Reset call store
      await this.cleanupCallStore()

      console.log('[CallCleanupService] Background call decline cleanup completed')
    } catch (error) {
      console.error('[CallCleanupService] Error during background call decline cleanup:', error)
    }
  }

  /**
   * Cleanup specific to call acceptance
   */
  async cleanupAfterCallAcceptance(sessionId: string): Promise<void> {
    console.log('[CallCleanupService] Cleaning up after call acceptance:', sessionId)

    try {
      // Only clean up notifications, keep other resources for the active call
      const notificationService = NotificationService.getInstance()
      await notificationService.hideNotification(sessionId)

      console.log('[CallCleanupService] Call acceptance cleanup completed')
    } catch (error) {
      console.error('[CallCleanupService] Error during call acceptance cleanup:', error)
    }
  }

  /**
   * Validate cleanup completion
   */
  async validateCleanup(): Promise<{
    isClean: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      // Check call store
      const store = useCallStore.getState()
      if (store.session || store.status !== 'ended') {
        issues.push('Call store not properly reset')
      }

      // Check VideoSDK
      const videoSDKService = VideoSDKService.getInstance()
      if (videoSDKService.hasActiveMeetingSession()) {
        issues.push('VideoSDK still has active session')
      }

      // Check CallKeep
      const callKeepService = CallKeepService.getInstance()
      if (callKeepService.getCurrentCallUUID()) {
        issues.push('CallKeep still has active call')
      }

      // Check background media
      const backgroundMediaService = BackgroundMediaService.getInstance()
      if (backgroundMediaService.isMediaReady()) {
        issues.push('Background media service not reset')
      }

      return {
        isClean: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('[CallCleanupService] Error validating cleanup:', error)
      return {
        isClean: false,
        issues: ['Error validating cleanup']
      }
    }
  }
}

export default CallCleanupService
