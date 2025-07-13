import { AppState, Platform } from 'react-native'
import VideoSDKService from '../videosdk/VideoSDKService'
import PermissionManagerService from '../PermissionManagerService'

// Safe permissions import
let request: any = null
let PERMISSIONS: any = null
let RESULTS: any = null
try {
  const permissionsModule = require('react-native-permissions')
  request = permissionsModule.request
  PERMISSIONS = permissionsModule.PERMISSIONS
  RESULTS = permissionsModule.RESULTS
} catch (error) {
  console.warn('[BackgroundMediaService] react-native-permissions not available:', error)
}

/**
 * Specialized media service for handling camera/microphone initialization
 * when calls are answered from background state
 */
export class BackgroundMediaService {
  private static instance: BackgroundMediaService
  private isInitialized = false
  private permissionsGranted = false

  private constructor() {}

  public static getInstance(): BackgroundMediaService {
    if (!BackgroundMediaService.instance) {
      BackgroundMediaService.instance = new BackgroundMediaService()
    }
    return BackgroundMediaService.instance
  }

  /**
   * Initialize media services for background call acceptance
   */
  async initializeForBackgroundCall(callType: 'voice' | 'video'): Promise<boolean> {
    try {
      console.log('[BackgroundMediaService] Initializing for background call:', callType)

      // Step 1: Request permissions first
      const permissionsGranted = await this.requestMediaPermissions(callType)
      if (!permissionsGranted) {
        console.error('[BackgroundMediaService] Media permissions not granted')
        return false
      }

      // Step 2: Initialize VideoSDK service
      const videoSDKService = VideoSDKService.getInstance()
      if (!videoSDKService.getInitializationStatus()) {
        console.log('[BackgroundMediaService] Initializing VideoSDK...')
        const initialized = await videoSDKService.initialize()
        if (!initialized) {
          console.error('[BackgroundMediaService] VideoSDK initialization failed')
          return false
        }
      }

      // Step 3: Wait for app to become active if it's not already
      if (AppState.currentState !== 'active') {
        console.log('[BackgroundMediaService] Waiting for app to become active...')
        await this.waitForAppActive()
      }

      // Step 4: Additional delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      this.isInitialized = true
      console.log('[BackgroundMediaService] Background media initialization complete')
      return true
    } catch (error) {
      console.error('[BackgroundMediaService] Error initializing for background call:', error)
      return false
    }
  }

  /**
   * Request media permissions based on call type
   */
  private async requestMediaPermissions(callType: 'voice' | 'video'): Promise<boolean> {
    try {
      console.log('[BackgroundMediaService] Requesting media permissions for:', callType)

      const permissionManager = PermissionManagerService.getInstance()

      // Always request microphone permission
      const micResult = await permissionManager.requestMicrophonePermission()
      if (!micResult.granted) {
        console.error('[BackgroundMediaService] Microphone permission denied')
        return false
      }

      // Request camera permission for video calls
      if (callType === 'video') {
        const cameraResult = await permissionManager.requestCameraPermission()
        if (!cameraResult.granted) {
          console.warn('[BackgroundMediaService] Camera permission denied, falling back to voice call')
          // Don't fail completely, just continue as voice call
        }
      }

      this.permissionsGranted = true
      console.log('[BackgroundMediaService] Media permissions granted')
      return true
    } catch (error) {
      console.error('[BackgroundMediaService] Error requesting media permissions:', error)
      return false
    }
  }

  /**
   * Wait for app to become active
   */
  private async waitForAppActive(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (AppState.currentState === 'active') {
        resolve()
        return
      }

      const timeoutId = setTimeout(() => {
        listener.remove()
        reject(new Error('Timeout waiting for app to become active'))
      }, timeout)

      const listener = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          clearTimeout(timeoutId)
          listener.remove()
          resolve()
        }
      })
    })
  }

  /**
   * Prepare media for specific call type
   */
  async prepareMediaForCall(callType: 'voice' | 'video'): Promise<{
    micEnabled: boolean
    cameraEnabled: boolean
  }> {
    try {
      console.log('[BackgroundMediaService] Preparing media for call type:', callType)

      // Ensure permissions are granted
      if (!this.permissionsGranted) {
        const permissionsGranted = await this.requestMediaPermissions(callType)
        if (!permissionsGranted) {
          return { micEnabled: false, cameraEnabled: false }
        }
      }

      // For voice calls, only enable microphone
      if (callType === 'voice') {
        return { micEnabled: true, cameraEnabled: false }
      }

      // For video calls, enable both if permissions are available
      const permissionManager = PermissionManagerService.getInstance()
      const cameraResult = await permissionManager.checkCameraPermission()
      
      return {
        micEnabled: true,
        cameraEnabled: cameraResult.granted
      }
    } catch (error) {
      console.error('[BackgroundMediaService] Error preparing media for call:', error)
      return { micEnabled: false, cameraEnabled: false }
    }
  }

  /**
   * Check if media is ready for background call
   */
  isMediaReady(): boolean {
    return this.isInitialized && this.permissionsGranted
  }

  /**
   * Reset media state
   */
  reset(): void {
    this.isInitialized = false
    this.permissionsGranted = false
  }

  /**
   * Handle app state changes for media management
   */
  handleAppStateChange(nextAppState: string): void {
    console.log('[BackgroundMediaService] App state changed to:', nextAppState)
    
    if (nextAppState === 'background') {
      // App went to background, prepare for potential background call
      console.log('[BackgroundMediaService] App backgrounded, media state preserved')
    } else if (nextAppState === 'active') {
      // App came to foreground, ensure media is ready
      console.log('[BackgroundMediaService] App foregrounded, media should be ready')
    }
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus(): Promise<{
    microphone: boolean
    camera: boolean
  }> {
    try {
      const permissionManager = PermissionManagerService.getInstance()
      
      const micResult = await permissionManager.checkMicrophonePermission()
      const cameraResult = await permissionManager.checkCameraPermission()
      
      return {
        microphone: micResult.granted,
        camera: cameraResult.granted
      }
    } catch (error) {
      console.error('[BackgroundMediaService] Error checking permission status:', error)
      return { microphone: false, camera: false }
    }
  }

  /**
   * Validate media setup before call
   */
  async validateMediaSetup(callType: 'voice' | 'video'): Promise<{
    isValid: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      // Check VideoSDK initialization
      const videoSDKService = VideoSDKService.getInstance()
      if (!videoSDKService.getInitializationStatus()) {
        issues.push('VideoSDK not initialized')
      }

      // Check permissions
      const permissions = await this.getPermissionStatus()
      if (!permissions.microphone) {
        issues.push('Microphone permission not granted')
      }

      if (callType === 'video' && !permissions.camera) {
        issues.push('Camera permission not granted for video call')
      }

      // Check app state
      if (AppState.currentState !== 'active') {
        issues.push('App not in active state')
      }

      return {
        isValid: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('[BackgroundMediaService] Error validating media setup:', error)
      return {
        isValid: false,
        issues: ['Error validating media setup']
      }
    }
  }

  /**
   * Force media reinitialization
   */
  async forceReinitialize(callType: 'voice' | 'video'): Promise<boolean> {
    console.log('[BackgroundMediaService] Force reinitializing media...')
    
    this.reset()
    return await this.initializeForBackgroundCall(callType)
  }
}

export default BackgroundMediaService
