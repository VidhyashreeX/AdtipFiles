import { Platform } from 'react-native'
import { CallKeepErrorHandler } from './CallKeepErrorHandler'
import { ProductionConfig } from '../../config/ProductionConfig'

// Prevent react-native-callkeep from being imported in production to avoid crashes
let RNCallKeep: any = null
try {
  // Only import in development mode
  if (__DEV__) {
    RNCallKeep = require('react-native-callkeep').default
  } else {
    console.log('[CallKeepService] 🚫 Skipping react-native-callkeep import in production to prevent crashes')
  }
} catch (error) {
  console.warn('[CallKeepService] ⚠️ Failed to import react-native-callkeep:', error)
}

// Remove the global setup call - it should be done in the service initialization

// CallKeep options interface removed - using direct object for better compatibility

/**
 * CallKeep service for handling native call UI on both iOS and Android
 * Integrates with CallStateManager for proper call state management
 * Enhanced with device-specific handling for problematic devices like Vivo
 */
export class CallKeepService {
  private static instance: CallKeepService
  private isInitialized = false
  private currentCallUUID: string | null = null
  private isVivoDevice = false
  private initializationAttempts = 0
  private maxInitializationAttempts = 3
  private callKeepAvailable = true
  private static DISABLE_CALLKEEP = true // Emergency disable flag - TEMPORARILY ENABLED TO FIX CRASH
  private static DISABLE_VIVO_CALLKEEP = true // Emergency disable for Vivo devices to prevent blank screen
  private needsManualPermissionSetup = false // Track if manual setup is needed

  private constructor() {
    this.detectVivoDevice()
  }

  public static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService()
    }
    return CallKeepService.instance
  }

  /**
   * Detect if the device is a Vivo device which requires special handling
   * Uses available React Native APIs and fallback detection methods
   */
  private detectVivoDevice(): void {
    try {
      // For Android devices, we can check system properties or use heuristics
      if (Platform.OS === 'android') {
        // Check if we can access any device info through global objects
        const userAgent = (global as any)?.navigator?.userAgent?.toLowerCase() || ''
        const buildInfo = (global as any)?.Build || {}

        // Check for Vivo indicators in available data
        this.isVivoDevice = userAgent.includes('vivo') ||
                           userAgent.includes('bbk') ||
                           JSON.stringify(buildInfo).toLowerCase().includes('vivo')

        // Additional heuristic: Vivo devices often have specific behavior patterns
        // We'll enable safe mode for any device that might be problematic
        if (!this.isVivoDevice) {
          // Enable safe mode for devices with aggressive battery optimization
          this.isVivoDevice = true // Default to safe mode for better compatibility
        }
      }

      if (this.isVivoDevice) {
        console.log('[CallKeepService] 📱 Potentially problematic device detected - using enhanced compatibility mode')
      }
    } catch (error) {
      console.warn('[CallKeepService] ⚠️ Could not detect device type:', error)
      // Default to safe mode for better compatibility
      this.isVivoDevice = true
    }
  }

  /**
   * Initialize CallKeep with proper configuration - completely non-blocking
   * Enhanced with device-specific handling for problematic devices
   * NOTE: This should only be called from useCallKeepInitializer hook when user is authenticated
   */
  async initialize(): Promise<boolean> {
    const errorHandler = CallKeepErrorHandler.getInstance()
    const productionConfig = ProductionConfig.getInstance()
    
    // Check if RNCallKeep is available
    if (!RNCallKeep) {
      console.log('[CallKeepService] 🚫 CallKeep library not available - skipping initialization')
      this.isInitialized = true
      this.callKeepAvailable = false
      return false
    }
    
    // Check production configuration
    if (productionConfig.isCallKeepDisabled()) {
      console.log('[CallKeepService] 🚫 CallKeep disabled via production configuration')
      this.isInitialized = true
      this.callKeepAvailable = false
      return false
    }
    
    // Emergency disable check
    if (CallKeepService.DISABLE_CALLKEEP) {
      console.log('[CallKeepService] 🚫 CallKeep disabled via emergency flag')
      this.isInitialized = true
      this.callKeepAvailable = false
      return false
    }

    // Emergency Vivo disable check to prevent blank screen
    if (this.isVivoDevice && CallKeepService.DISABLE_VIVO_CALLKEEP) {
      console.log('[CallKeepService] 🚫 CallKeep disabled for Vivo device to prevent blank screen')
      console.log('[CallKeepService] 💡 App will use custom call UI instead of native CallKeep')
      this.isInitialized = true
      this.callKeepAvailable = false
      return false
    }

    if (this.isInitialized) {
      console.log('[CallKeepService] ✅ Already initialized, available:', this.callKeepAvailable)
      return this.callKeepAvailable
    }

    this.initializationAttempts++

    try {
      console.log(`[CallKeepService] 🔄 Initializing CallKeep (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})...`)
      console.log(`[CallKeepService] 📱 Platform: ${Platform.OS}, Device: ${this.isVivoDevice ? 'Vivo (problematic)' : 'Standard'}`)

      // Check if CallKeep is available first
      if (!RNCallKeep) {
        console.warn('[CallKeepService] ⚠️ CallKeep module not available')
        this.isInitialized = true
        this.callKeepAvailable = false
        return false
      }

      // Simplified setup options based on VideoSDK recommendations
      const options = {
        ios: {
          appName: 'Adtip',
          supportsVideo: true,
          maximumCallGroups: '1',
          maximumCallsPerCallGroup: '1',
          includesCallsInRecents: true,
          imageName: 'ic_launcher',
          handleType: 'generic'
        },
        android: {
          alertTitle: 'Phone Account Permission Required',
          alertDescription: 'Adtip needs access to your phone accounts to provide native call experience',
          cancelButton: 'Cancel',
          okButton: 'Allow',
          imageName: 'ic_launcher',
          additionalPermissions: [],
          selfManaged: false, // Keep false for better compatibility as per VideoSDK guide
          foregroundService: {
            channelId: 'com.adtip.calling',
            channelName: 'Adtip Calling Service',
            notificationTitle: 'Adtip is handling a call',
            notificationIcon: 'ic_launcher'
          }
        }
      }

      console.log('[CallKeepService] 🔧 Setting up CallKeep with options:', JSON.stringify(options, null, 2))

      // For Vivo devices, use timeout protection to prevent hanging
      if (this.isVivoDevice) {
        console.log('[CallKeepService] ⚠️ Vivo device detected - using timeout protection')

        const setupPromise = RNCallKeep.setup(options)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Vivo CallKeep setup timeout - preventing blank screen')), 3000)
        )

        try {
          await Promise.race([setupPromise, timeoutPromise])
          console.log('[CallKeepService] ✅ CallKeep setup complete (Vivo with timeout)')
        } catch (error) {
          if (error instanceof Error && error.message.includes('timeout')) {
            console.warn('[CallKeepService] ⚠️ Vivo CallKeep setup timed out - disabling to prevent blank screen')
            this.isInitialized = true
            this.callKeepAvailable = false
            return false
          }
          throw error
        }
      } else {
        // Standard setup for non-Vivo devices
        await RNCallKeep.setup(options)
        console.log('[CallKeepService] ✅ CallKeep setup complete')
      }

      // Set availability for Android
      if (Platform.OS === 'android') {
        await RNCallKeep.setAvailable(true)
        console.log('[CallKeepService] ✅ CallKeep availability set to true')
      }

      // Enhanced permission handling with user guidance
      if (Platform.OS === 'android') {
        try {
          const hasPermissions = await this.checkPermissions()
          console.log('[CallKeepService] 📋 Permission check result:', hasPermissions)

          if (!hasPermissions) {
            console.log('[CallKeepService] 📱 Phone account not found, attempting to register...')

            // First, try to register the phone account
            const registrationResult = await this.registerPhoneAccountWithGuidance()
            console.log('[CallKeepService] 📋 Phone account registration result:', registrationResult)

            // Check again after registration
            const hasPermissionsAfterRegistration = await this.checkPermissions()
            console.log('[CallKeepService] 📋 Permission check after registration:', hasPermissionsAfterRegistration)

            if (!hasPermissionsAfterRegistration) {
              console.warn('[CallKeepService] ⚠️ CallKeep phone account not enabled')
              console.warn('[CallKeepService] 💡 User needs to manually enable phone account in Android settings')
              console.warn('[CallKeepService] 📱 Path: Settings > Apps > Adtip > Phone Account > Enable')

              // Store that we need manual permission setup
              this.needsManualPermissionSetup = true
            } else {
              console.log('[CallKeepService] ✅ CallKeep permissions granted successfully')
            }
          } else {
            console.log('[CallKeepService] ✅ CallKeep permissions already granted')
          }
        } catch (permissionError) {
          console.warn('[CallKeepService] ⚠️ Permission handling error (non-critical):', permissionError)
          console.warn('[CallKeepService] 💡 This may require manual setup in Android settings')
          this.needsManualPermissionSetup = true
        }
      }

      // Setup event listeners in a non-blocking way
      setImmediate(() => {
        try {
          this.setupEventListeners()
          console.log('[CallKeepService] ✅ Event listeners setup complete')
        } catch (error) {
          console.warn('[CallKeepService] ⚠️ Event listeners setup failed:', error)
        }
      })

      this.isInitialized = true
      this.callKeepAvailable = true
      console.log('[CallKeepService] ✅ CallKeep initialization successful')
      return true

    } catch (error) {
      console.error(`[CallKeepService] ❌ Initialization failed (attempt ${this.initializationAttempts}):`, error)
      console.error('[CallKeepService] 📊 Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        platform: Platform.OS,
        isVivoDevice: this.isVivoDevice,
        attempt: this.initializationAttempts
      })

      // Retry logic - simplified
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        console.log(`[CallKeepService] 🔄 Retrying initialization in 2 seconds... (${this.initializationAttempts}/${this.maxInitializationAttempts})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return this.initialize()
      }

      // Max attempts reached - mark as initialized but unavailable
      console.warn('[CallKeepService] 🚫 CallKeep unavailable after max attempts - app will continue without native call UI')
      this.isInitialized = true
      this.callKeepAvailable = false
      return false
    }
  }

  /**
   * Check if CallKeep permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot check permissions')
        return false
      }
      if (Platform.OS === 'android') {
        return await RNCallKeep.hasPhoneAccount()
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot request permissions')
        return false
      }
      if (Platform.OS === 'android') {
        console.log('[CallKeepService] Requesting CallKeep permissions...')

        // Register phone account to request permissions
        await RNCallKeep.registerPhoneAccount({
          ios: {
            appName: 'Adtip'
          },
          android: {
            alertTitle: 'Phone Account Permission Required',
            alertDescription: 'Adtip needs access to your phone accounts to provide native call experience',
            cancelButton: 'Cancel',
            okButton: 'Allow',
            additionalPermissions: []
          }
        })

        // Wait a moment for the permission dialog to be processed
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if permissions were granted
        const hasPermissions = await RNCallKeep.hasPhoneAccount()
        console.log('[CallKeepService] Permission request result:', hasPermissions)
        return hasPermissions
      }
      return true // iOS doesn't need explicit permission request
    } catch (error) {
      console.error('[CallKeepService] Error requesting permissions:', error)
      return false
    }
  }

  /**
   * Register phone account with enhanced guidance and error handling
   */
  async registerPhoneAccountWithGuidance(): Promise<boolean> {
    try {
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot register phone account')
        return false
      }
      console.log('[CallKeepService] 📱 Registering phone account with user guidance...')

      // Register phone account to request permissions
      await RNCallKeep.registerPhoneAccount({
        ios: {
          appName: 'Adtip'
        },
        android: {
          alertTitle: 'Phone Account Permission Required',
          alertDescription: 'Adtip needs access to your phone accounts to provide native call experience. This allows incoming calls to show in your phone\'s native interface.',
          cancelButton: 'Cancel',
          okButton: 'Allow',
          additionalPermissions: []
        }
      })

      // Wait a moment for the permission dialog to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check if permissions were granted
      const hasPermissions = await RNCallKeep.hasPhoneAccount()
      console.log('[CallKeepService] 📋 Phone account registration result:', hasPermissions)

      if (!hasPermissions) {
        console.warn('[CallKeepService] 📱 Phone account not automatically enabled')
        console.warn('[CallKeepService] 💡 User may need to manually enable in Android Settings')
        console.warn('[CallKeepService] 🔧 Steps: Settings > Apps > Adtip > Phone Account > Toggle ON')
      }

      return hasPermissions
    } catch (error) {
      console.error('[CallKeepService] ❌ Phone account registration failed:', error)
      return false
    }
  }

  /**
   * Check if manual permission setup is needed
   */
  needsManualSetup(): boolean {
    return this.needsManualPermissionSetup
  }

  /**
   * Get user-friendly guidance for enabling CallKeep permissions
   */
  getPermissionGuidance(): string {
    if (Platform.OS === 'android') {
      return 'To enable native call interface:\n\n' +
             '1. Open Android Settings\n' +
             '2. Go to Apps > Adtip\n' +
             '3. Tap "Phone Account"\n' +
             '4. Toggle ON to enable\n\n' +
             'This allows incoming calls to show in your phone\'s native interface.'
    }
    return 'CallKeep permissions are handled automatically on iOS.'
  }

  /**
   * Emergency method to enable CallKeep on Vivo devices for testing
   * WARNING: This may cause blank screen issues
   */
  static enableVivoCallKeepForTesting(): void {
    console.warn('[CallKeepService] ⚠️ ENABLING CallKeep on Vivo device for testing - may cause blank screen!')
    CallKeepService.DISABLE_VIVO_CALLKEEP = false
  }

  /**
   * Re-disable CallKeep on Vivo devices
   */
  static disableVivoCallKeep(): void {
    console.log('[CallKeepService] 🚫 Disabling CallKeep on Vivo device to prevent blank screen')
    CallKeepService.DISABLE_VIVO_CALLKEEP = true
  }

  /**
   * Check if CallKeep has the necessary permissions to function
   */
  async hasRequiredPermissions(): Promise<boolean> {
    if (!this.isInitialized) {
      return false
    }
    return await this.checkPermissions()
  }

  /**
   * Display incoming call in native UI
   * Enhanced with availability checking and graceful degradation
   */
  async displayIncomingCall(
    uuid: string,
    handle: string,
    localizedCallerName: string,
    handleType: 'generic' | 'number' | 'email' = 'generic',
    hasVideo: boolean = false
  ): Promise<boolean> {
    const errorHandler = CallKeepErrorHandler.getInstance()
    
    try {
      if (!this.isInitialized || !this.callKeepAvailable || !RNCallKeep) {
        console.warn('[CallKeepService] CallKeep not available, cannot display incoming call')
        return false
      }

      console.log('[CallKeepService] Displaying incoming call:', {
        uuid,
        handle,
        localizedCallerName,
        hasVideo,
        isVivoDevice: this.isVivoDevice
      })

      this.currentCallUUID = uuid

      // For Vivo devices, use additional error handling
      if (this.isVivoDevice) {
        const displayPromise = RNCallKeep.displayIncomingCall(
          uuid,
          handle,
          localizedCallerName,
          handleType,
          hasVideo
        )

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Display call timeout')), 2000)
        )

        await Promise.race([displayPromise, timeoutPromise])
      } else {
        await RNCallKeep.displayIncomingCall(
          uuid,
          handle,
          localizedCallerName,
          handleType,
          hasVideo
        )
      }

      return true
    } catch (error) {
      // Use error handler to prevent crashes in production
      const shouldContinue = errorHandler.handleMethodError(error, 'displayIncomingCall', 'CallKeepService')
      
      if (!shouldContinue) {
        // Disable CallKeep if error handler says to stop
        this.callKeepAvailable = false
        console.warn('[CallKeepService] 🚫 CallKeep disabled due to error handler recommendation')
        return false
      }

      console.error('[CallKeepService] Error displaying incoming call:', error)

      // Mark CallKeep as unavailable if it consistently fails
      if (this.isVivoDevice) {
        this.callKeepAvailable = false
        console.warn('[CallKeepService] 🚫 Disabling CallKeep due to repeated failures on this device')
      }

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
      if (!this.isInitialized || !RNCallKeep) {
        console.warn('[CallKeepService] Not initialized or RNCallKeep not available, cannot start call')
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot report connected call')
        return
      }
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot end call')
        return
      }
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot end all calls')
        return
      }
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot set call on hold')
        return
      }
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
      if (!RNCallKeep) {
        console.warn('[CallKeepService] RNCallKeep not available, cannot report call ended')
        return
      }
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
   * Check if CallKeep is available and functioning
   * Enhanced to return actual availability status
   */
  isAvailable(): boolean {
    return this.isInitialized && this.callKeepAvailable && RNCallKeep !== null
  }

  /**
   * Get device compatibility information
   */
  getDeviceInfo(): { isVivoDevice: boolean; callKeepAvailable: boolean; isInitialized: boolean; isDisabled: boolean } {
    return {
      isVivoDevice: this.isVivoDevice,
      callKeepAvailable: this.callKeepAvailable,
      isInitialized: this.isInitialized,
      isDisabled: CallKeepService.DISABLE_CALLKEEP
    }
  }

  /**
   * Emergency disable/enable CallKeep (for troubleshooting)
   */
  static setCallKeepEnabled(enabled: boolean): void {
    CallKeepService.DISABLE_CALLKEEP = !enabled
    console.log(`[CallKeepService] CallKeep ${enabled ? 'enabled' : 'disabled'} via emergency flag`)
  }

  /**
   * Setup CallKeep event listeners with enhanced VideoSDK integration
   */
  private setupEventListeners(): void {
    if (!RNCallKeep) {
      console.log('[CallKeepService] 🚫 RNCallKeep not available, skipping event listener setup')
      return
    }

    console.log('[CallKeepService] Setting up enhanced event listeners for VideoSDK integration')

    try {
      // Core call events
      RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction)
      RNCallKeep.addEventListener('endCall', this.onEndCallAction)

      // Call state events
      RNCallKeep.addEventListener('didDisplayIncomingCall', this.onIncomingCallDisplayed)
      RNCallKeep.addEventListener('didPerformSetMutedCallAction', this.onToggleMute)
      RNCallKeep.addEventListener('didToggleHoldCallAction', this.onToggleHold)
      RNCallKeep.addEventListener('didPerformDTMFAction', this.onDTMFAction)

      // Enhanced events for better integration
      RNCallKeep.addEventListener('didActivateAudioSession', this.onAudioSessionActivated)
      RNCallKeep.addEventListener('didDeactivateAudioSession', this.onAudioSessionDeactivated)
      RNCallKeep.addEventListener('didChangeAudioRoute', this.onAudioRouteChanged)

      // Connection events
      RNCallKeep.addEventListener('didReceiveStartCallAction', this.onStartCallAction)
      RNCallKeep.addEventListener('didLoadWithEvents', this.onLoadWithEvents)
      
      // Audio session activated
      RNCallKeep.addEventListener('didActivateAudioSession', this.onAudioSessionActivated)
      
      // Audio session deactivated
      RNCallKeep.addEventListener('didDeactivateAudioSession', this.onAudioSessionDeactivated)
    } catch (error) {
      console.warn('[CallKeepService] ⚠️ Failed to setup event listeners:', error)
    }
  }

  /**
   * Handle answer call action from CallKeep with enhanced VideoSDK integration
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

      // Trigger deep link navigation for call acceptance
      await this.handleCallAcceptance(callUUID)
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
   * Handle audio route changes
   */
  private onAudioRouteChanged = (args: { output: string; reason?: number; handle?: string; callUUID?: string }) => {
    console.log('[CallKeepService] Audio route changed:', args.output, 'for call:', args.callUUID)
  }

  /**
   * Handle start call action (outgoing calls)
   */
  private onStartCallAction = (args: { handle: string; callUUID?: string; name?: string }) => {
    console.log('[CallKeepService] Start call action:', args.callUUID, args.handle)
  }

  /**
   * Handle load with events (app startup with pending calls)
   */
  private onLoadWithEvents = (events: any[]) => {
    console.log('[CallKeepService] Load with events:', events)
  }

  /**
   * Handle call acceptance with deep linking
   */
  private async handleCallAcceptance(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeepService] Handling call acceptance for:', callUUID)

      // Try to retrieve call data from AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage')
      const callDataStr = await AsyncStorage.default.getItem(`pending_call_${callUUID}`)

      if (callDataStr) {
        const callData = JSON.parse(callDataStr)

        // Create deep link for navigation
        const deepLink = this.createCallDeepLink(callData)

        // Navigate using Linking
        const { Linking } = await import('react-native')
        await Linking.openURL(deepLink)

        console.log('[CallKeepService] Call acceptance navigation triggered')
      } else {
        console.warn('[CallKeepService] No call data found for UUID:', callUUID)
      }
    } catch (error) {
      console.error('[CallKeepService] Error handling call acceptance:', error)
    }
  }

  /**
   * Create deep link for call navigation
   */
  private createCallDeepLink(callData: any): string {
    const baseUrl = 'adtip://call/active'
    const path = `${baseUrl}/${callData.sessionId}/${callData.meetingId}/${encodeURIComponent(callData.token)}`

    const params = new URLSearchParams({
      callerName: callData.callerName || 'Unknown',
      callType: callData.callType || 'video'
    })

    return `${path}?${params.toString()}`
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    console.log('[CallKeepService] Cleaning up event listeners')

    if (!RNCallKeep) return

    // Core events
    RNCallKeep.removeEventListener('answerCall')
    RNCallKeep.removeEventListener('endCall')
    RNCallKeep.removeEventListener('didDisplayIncomingCall')
    RNCallKeep.removeEventListener('didPerformSetMutedCallAction')
    RNCallKeep.removeEventListener('didToggleHoldCallAction')
    RNCallKeep.removeEventListener('didPerformDTMFAction')

    // Enhanced events
    RNCallKeep.removeEventListener('didActivateAudioSession')
    RNCallKeep.removeEventListener('didDeactivateAudioSession')
    RNCallKeep.removeEventListener('didChangeAudioRoute')
    RNCallKeep.removeEventListener('didReceiveStartCallAction')
    RNCallKeep.removeEventListener('didLoadWithEvents')
  }
}

export default CallKeepService
