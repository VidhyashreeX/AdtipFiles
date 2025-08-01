/**
 * VideoSDK Pre-warming Service
 * 
 * This service implements background WebSocket connection pre-warming for VideoSDK
 * to eliminate first-time connection errors by establishing and validating the
 * WebSocket connection before users attempt their first real call.
 * 
 * Features:
 * - Silent dummy meeting creation and cleanup
 * - WebSocket connection validation and caching
 * - Intelligent timing to avoid impacting app performance
 * - Error handling that doesn't affect normal app operation
 * - Resource usage optimization with idle period detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import  VideoSDKService  from './VideoSDKService';
import { logVideoSDK, logWarn, logError } from '../../utils/ProductionLogger';

interface PrewarmingConfig {
  enabled: boolean;
  maxAttempts: number;
  attemptDelay: number;
  validationTimeout: number;
  cacheExpiryHours: number;
  idleThresholdMinutes: number;
  startupDelayMs: number;
}

interface PrewarmingState {
  isPrewarmed: boolean;
  lastPrewarmTime: number;
  lastAppLaunchTime: number;
  prewarmingInProgress: boolean;
  failureCount: number;
  lastFailureTime: number;
}



export class VideoSDKPrewarmingService {
  private static instance: VideoSDKPrewarmingService;
  private config: PrewarmingConfig;
  private state: PrewarmingState;
  private videoSDKService: VideoSDKService;
  private appStateSubscription: any;
  private prewarmingPromise: Promise<boolean> | null = null;

  // Storage keys
  private static readonly STORAGE_KEY_STATE = 'videosdk_prewarming_state';
  private static readonly STORAGE_KEY_CONFIG = 'videosdk_prewarming_config';

  private constructor() {
    this.config = {
      enabled: true,
      maxAttempts: 3,
      attemptDelay: 2000,
      validationTimeout: 10000,
      cacheExpiryHours: 6, // Pre-warming expires after 6 hours
      idleThresholdMinutes: 30, // Re-prewarm after 30 minutes of inactivity
      startupDelayMs: 1000 // Wait 1 second after app start before pre-warming (reduced for testing)
    };

    this.state = {
      isPrewarmed: false,
      lastPrewarmTime: 0,
      lastAppLaunchTime: Date.now(),
      prewarmingInProgress: false,
      failureCount: 0,
      lastFailureTime: 0
    };

    this.videoSDKService = VideoSDKService.getInstance();
    this.setupAppStateListener();
  }

  public static getInstance(): VideoSDKPrewarmingService {
    if (!VideoSDKPrewarmingService.instance) {
      VideoSDKPrewarmingService.instance = new VideoSDKPrewarmingService();
    }
    return VideoSDKPrewarmingService.instance;
  }

  /**
   * Initialize the pre-warming service
   * This should be called during app startup
   */
  public async initialize(): Promise<void> {
    try {
      logVideoSDK('PrewarmingService', 'Initializing VideoSDK pre-warming service');

      // Load saved state and config
      await this.loadState();
      await this.loadConfig();

      // Update last app launch time
      this.state.lastAppLaunchTime = Date.now();
      await this.saveState();

      logVideoSDK('PrewarmingService', 'Pre-warming service initialized', {
        config: this.config,
        state: this.state
      });
    } catch (error) {
      logError('PrewarmingService', 'Failed to initialize pre-warming service', error);
    }
  }

  /**
   * Start the pre-warming process
   * This runs in the background and doesn't block app startup
   */
  public async startPrewarming(): Promise<boolean> {
    logVideoSDK('PrewarmingService', '🔥 STARTING PRE-WARMING PROCESS');

    // If already pre-warming, return the existing promise
    if (this.prewarmingPromise) {
      logVideoSDK('PrewarmingService', 'Pre-warming already in progress, waiting for completion');
      return this.prewarmingPromise;
    }

    // Check if pre-warming is needed
    const shouldPrewarm = this.shouldPrewarm();
    logVideoSDK('PrewarmingService', '🔥 PRE-WARMING DECISION', { shouldPrewarm, currentState: this.state });

    if (!shouldPrewarm) {
      logVideoSDK('PrewarmingService', 'Pre-warming not needed at this time');
      return true;
    }

    // Start pre-warming process
    logVideoSDK('PrewarmingService', '🔥 EXECUTING PRE-WARMING PROCESS');
    this.prewarmingPromise = this.executePrewarming();
    const result = await this.prewarmingPromise;
    this.prewarmingPromise = null;

    logVideoSDK('PrewarmingService', '🔥 PRE-WARMING PROCESS COMPLETED', { success: result });
    return result;
  }

  /**
   * Check if the WebSocket connection is pre-warmed and ready
   */
  public isPrewarmed(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Check if pre-warming is still valid (not expired)
    const now = Date.now();
    const expiryTime = this.state.lastPrewarmTime + (this.config.cacheExpiryHours * 60 * 60 * 1000);
    
    return this.state.isPrewarmed && now < expiryTime;
  }

  /**
   * Get the current pre-warming status
   */
  public getStatus(): {
    isPrewarmed: boolean;
    inProgress: boolean;
    lastPrewarmTime: number;
    failureCount: number;
    config: PrewarmingConfig;
  } {
    return {
      isPrewarmed: this.isPrewarmed(),
      inProgress: this.state.prewarmingInProgress,
      lastPrewarmTime: this.state.lastPrewarmTime,
      failureCount: this.state.failureCount,
      config: { ...this.config }
    };
  }

  /**
   * Update pre-warming configuration
   */
  public async updateConfig(newConfig: Partial<PrewarmingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    logVideoSDK('PrewarmingService', 'Configuration updated', this.config);
  }

  /**
   * Force invalidate pre-warming cache
   * This will trigger a new pre-warming cycle on next check
   */
  public async invalidateCache(): Promise<void> {
    this.state.isPrewarmed = false;
    this.state.lastPrewarmTime = 0;
    await this.saveState();
    logVideoSDK('PrewarmingService', 'Pre-warming cache invalidated');
  }

  /**
   * Force start pre-warming immediately (for testing/debugging)
   */
  public async forceStartPrewarming(): Promise<boolean> {
    logVideoSDK('PrewarmingService', '🔥 FORCE STARTING PRE-WARMING (BYPASSING CONDITIONS)');

    // Temporarily disable conditions
    const originalEnabled = this.config.enabled;
    const originalInProgress = this.state.prewarmingInProgress;

    this.config.enabled = true;
    this.state.prewarmingInProgress = false;
    this.state.isPrewarmed = false;
    this.state.lastPrewarmTime = 0;
    this.state.lastAppLaunchTime = 0; // Force bypass startup delay

    try {
      const result = await this.startPrewarming();
      logVideoSDK('PrewarmingService', '🔥 FORCE PRE-WARMING COMPLETED', { success: result });
      return result;
    } finally {
      // Restore original settings
      this.config.enabled = originalEnabled;
      this.state.prewarmingInProgress = originalInProgress;
    }
  }

  /**
   * Cleanup resources and stop the service
   */
  public cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Cleanup is now handled by the CallController.endCall() in the dummy call flow

    logVideoSDK('PrewarmingService', 'Pre-warming service cleaned up');
  }

  /**
   * Determine if pre-warming should be performed
   */
  private shouldPrewarm(): boolean {
    const now = Date.now();
    const timeSinceAppLaunch = now - this.state.lastAppLaunchTime;
    const timeSinceLastFailure = now - this.state.lastFailureTime;
    const backoffTime = Math.min(this.state.failureCount * 60000, 300000); // Max 5 minutes backoff
    const isAlreadyPrewarmed = this.isPrewarmed();

    logVideoSDK('PrewarmingService', '🔥 EVALUATING PRE-WARMING CONDITIONS', {
      enabled: this.config.enabled,
      prewarmingInProgress: this.state.prewarmingInProgress,
      isAlreadyPrewarmed,
      failureCount: this.state.failureCount,
      timeSinceLastFailure,
      backoffTime,
      timeSinceAppLaunch,
      requiredStartupDelay: this.config.startupDelayMs,
      lastPrewarmTime: this.state.lastPrewarmTime,
      cacheExpiryHours: this.config.cacheExpiryHours
    });

    if (!this.config.enabled) {
      logVideoSDK('PrewarmingService', '🔥 Pre-warming disabled in config');
      return false;
    }

    if (this.state.prewarmingInProgress) {
      logVideoSDK('PrewarmingService', '🔥 Pre-warming already in progress');
      return false;
    }

    // Check if already pre-warmed and not expired
    if (isAlreadyPrewarmed) {
      logVideoSDK('PrewarmingService', '🔥 Already pre-warmed and cache is valid');
      return false;
    }

    // Check failure rate limiting
    if (this.state.failureCount > 0 && timeSinceLastFailure < backoffTime) {
      logVideoSDK('PrewarmingService', '🔥 Pre-warming skipped due to recent failures', {
        failureCount: this.state.failureCount,
        timeSinceLastFailure,
        backoffTime
      });
      return false;
    }

    // Check if enough time has passed since app launch
    if (timeSinceAppLaunch < this.config.startupDelayMs) {
      logVideoSDK('PrewarmingService', '🔥 Pre-warming delayed to avoid impacting app startup', {
        timeSinceAppLaunch,
        requiredDelay: this.config.startupDelayMs,
        remainingWait: this.config.startupDelayMs - timeSinceAppLaunch
      });
      return false;
    }

    logVideoSDK('PrewarmingService', '🔥 PRE-WARMING SHOULD BE PERFORMED - ALL CONDITIONS MET');
    return true;
  }

  /**
   * Execute the actual pre-warming process
   */
  private async executePrewarming(): Promise<boolean> {
    this.state.prewarmingInProgress = true;
    await this.saveState();

    try {
      logVideoSDK('PrewarmingService', 'Starting WebSocket pre-warming process');

      // Step 1: Ensure VideoSDK service is initialized
      await this.ensureVideoSDKInitialized();

      // Step 2: Create and validate dummy meeting
      const success = await this.createAndValidateDummyMeeting();

      if (success) {
        // Step 3: Mark as pre-warmed
        this.state.isPrewarmed = true;
        this.state.lastPrewarmTime = Date.now();
        this.state.failureCount = 0;
        this.state.lastFailureTime = 0;

        logVideoSDK('PrewarmingService', 'WebSocket pre-warming completed successfully');
      } else {
        // Handle failure
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();
        logWarn('PrewarmingService', 'WebSocket pre-warming failed', {
          failureCount: this.state.failureCount
        });
      }

      this.state.prewarmingInProgress = false;
      await this.saveState();

      return success;
    } catch (error) {
      this.state.prewarmingInProgress = false;
      this.state.failureCount++;
      this.state.lastFailureTime = Date.now();
      await this.saveState();

      logError('PrewarmingService', 'Pre-warming process failed with error', error);
      return false;
    }
  }

  /**
   * Ensure VideoSDK service is properly initialized with enhanced pre-warming
   */
  private async ensureVideoSDKInitialized(): Promise<void> {
    const status = this.videoSDKService.getInitializationStatus();

    if (!status.initialized || !status.websocketReady) {
      logVideoSDK('PrewarmingService', 'VideoSDK not ready, performing enhanced initialization for pre-warming');

      // Force a complete re-initialization to ensure WebSocket is properly established
      await this.performEnhancedVideoSDKInitialization();
    } else {
      logVideoSDK('PrewarmingService', 'VideoSDK already initialized, performing connectivity verification');

      // Even if initialized, verify the WebSocket is actually working
      const isHealthy = await this.verifyVideoSDKHealth();
      if (!isHealthy) {
        logWarn('PrewarmingService', 'VideoSDK health check failed, re-initializing');
        await this.performEnhancedVideoSDKInitialization();
      }
    }

    logVideoSDK('PrewarmingService', 'VideoSDK is ready for pre-warming with verified connectivity');
  }

  /**
   * Perform enhanced VideoSDK initialization that mirrors real call setup
   */
  private async performEnhancedVideoSDKInitialization(): Promise<void> {
    try {
      logVideoSDK('PrewarmingService', 'Performing enhanced VideoSDK initialization');

      // Step 1: Force VideoSDK re-registration (this is what establishes the WebSocket)
      await this.forceVideoSDKReregistration();

      // Step 2: Initialize VideoSDK service with enhanced validation
      const success = await this.videoSDKService.ensureInitialized();
      if (!success) {
        throw new Error('Enhanced VideoSDK initialization failed');
      }

      // Step 3: Wait for WebSocket with extended timeout
      const websocketReady = await this.videoSDKService.waitForWebSocketReady(this.config.validationTimeout);
      if (!websocketReady) {
        throw new Error('VideoSDK WebSocket failed to become ready during enhanced initialization');
      }

      // Step 4: Perform additional connectivity verification
      await this.verifyVideoSDKHealth();

      logVideoSDK('PrewarmingService', 'Enhanced VideoSDK initialization completed successfully');
    } catch (error) {
      logError('PrewarmingService', 'Enhanced VideoSDK initialization failed', error);
      throw error;
    }
  }

  /**
   * Force VideoSDK re-registration to establish fresh WebSocket connection
   */
  private async forceVideoSDKReregistration(): Promise<void> {
    try {
      logVideoSDK('PrewarmingService', 'Forcing VideoSDK re-registration for fresh WebSocket connection');

      // Import and call the register function directly
      const { register } = await import('@videosdk.live/react-native-sdk');
      await register();

      // Add a delay to allow WebSocket establishment
      await new Promise(resolve => setTimeout(resolve, 2000));

      logVideoSDK('PrewarmingService', 'VideoSDK re-registration completed');
    } catch (error) {
      logError('PrewarmingService', 'VideoSDK re-registration failed', error);
      throw error;
    }
  }

  /**
   * Verify VideoSDK health and WebSocket connectivity
   */
  private async verifyVideoSDKHealth(): Promise<boolean> {
    try {
      logVideoSDK('PrewarmingService', 'Verifying VideoSDK health and connectivity');

      // Test 1: Check service status
      const status = this.videoSDKService.getInitializationStatus();
      if (!status.initialized || !status.websocketReady) {
        logWarn('PrewarmingService', 'VideoSDK service status check failed', status);
        return false;
      }

      // Test 2: Test WebSocket readiness
      const websocketReady = await this.videoSDKService.waitForWebSocketReady(3000);
      if (!websocketReady) {
        logWarn('PrewarmingService', 'VideoSDK WebSocket readiness check failed');
        return false;
      }

      logVideoSDK('PrewarmingService', 'VideoSDK health verification passed');
      return true;
    } catch (error) {
      logWarn('PrewarmingService', 'VideoSDK health verification failed', error);
      return false;
    }
  }

  /**
   * Create and validate a dummy call for WebSocket pre-warming
   * This triggers the actual startCall flow used by TipCallScreenSimple
   */
  private async createAndValidateDummyMeeting(): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = this.config.maxAttempts;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        logVideoSDK('PrewarmingService', `🔥 Starting dummy call for pre-warming (attempt ${attempts}/${maxAttempts})`);

        // Step 1: Trigger actual startCall flow with dummy data
        const callSuccess = await this.triggerDummyCall();

        if (callSuccess) {
          logVideoSDK('PrewarmingService', '🔥 Dummy call pre-warming successful - WebSocket is pre-warmed');
          return true;
        } else {
          logWarn('PrewarmingService', `🔥 Dummy call pre-warming failed on attempt ${attempts}`);
        }

      } catch (error) {
        logWarn('PrewarmingService', `🔥 Dummy call pre-warming failed on attempt ${attempts}:`, error);
      }

      // Wait before next attempt
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.attemptDelay));
      }
    }

    logError('PrewarmingService', `🔥 Failed to complete dummy call pre-warming after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Trigger a silent dummy call that exercises VideoSDK initialization without showing UI
   * This performs the core VideoSDK operations without triggering navigation or UI
   */
  private async triggerDummyCall(): Promise<boolean> {
    try {
      logVideoSDK('PrewarmingService', '🔥 Triggering silent dummy call for WebSocket pre-warming');

      // Step 1: Initialize VideoSDK service directly (same as CallController does)
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.initialize();
      await videoSDKService.clearExistingMeetingState();

      // Step 2: Generate token and create meeting (same API calls as real calls)
      const ApiServiceModule = await import('../ApiService');
      const ApiService = ApiServiceModule.default;

      logVideoSDK('PrewarmingService', '🔥 Generating VideoSDK token for dummy call');
      const tokenResponse = await ApiService.generateVideoSDKToken();
      if (!tokenResponse?.token) {
        throw new Error('Failed to generate VideoSDK token for pre-warming');
      }

      logVideoSDK('PrewarmingService', '🔥 Creating dummy meeting');
      const meetingResponse = await ApiService.createVideoSDKMeeting(tokenResponse.token, 'us001');
      if (!meetingResponse?.data?.roomId) {
        throw new Error('Failed to create dummy meeting for pre-warming');
      }

      const meetingId = meetingResponse.data.roomId;
      const token = tokenResponse.token;

      logVideoSDK('PrewarmingService', '🔥 Dummy meeting created', { meetingId });

      // Step 3: Create meeting config (same as real calls)
      const meetingConfig = videoSDKService.createMeetingConfig(
        meetingId,
        token,
        'PrewarmTest',
        { micEnabled: false, webcamEnabled: false }
      );

      logVideoSDK('PrewarmingService', '🔥 Testing VideoSDK WebSocket connectivity');

      // Step 4: Test actual VideoSDK WebSocket by importing and testing the SDK
      const webSocketTest = await this.testVideoSDKWebSocketWithMeeting(meetingConfig);

      if (webSocketTest) {
        logVideoSDK('PrewarmingService', '🔥 Silent dummy call pre-warming successful - WebSocket established');
        return true;
      } else {
        logWarn('PrewarmingService', '🔥 Silent dummy call WebSocket test failed');
        return false;
      }

    } catch (error) {
      logError('PrewarmingService', '🔥 Silent dummy call failed', error);
      return false;
    }
  }

  /**
   * Test VideoSDK WebSocket connectivity using a meeting configuration
   * This tests the actual WebSocket connection without showing UI
   */
  private async testVideoSDKWebSocketWithMeeting(_meetingConfig: any): Promise<boolean> {
    try {
      logVideoSDK('PrewarmingService', '🔥 Testing VideoSDK WebSocket with meeting config');

      // Import VideoSDK and test WebSocket connectivity
      const videoSDKModule = await import('@videosdk.live/react-native-sdk');
      const { register } = videoSDKModule;

      // Force VideoSDK re-registration to establish fresh WebSocket
      await register();

      // Wait for WebSocket to establish
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test that VideoSDK service reports WebSocket as ready
      const videoSDKService = VideoSDKService.getInstance();
      const isReady = await videoSDKService.waitForWebSocketReady(5000);

      if (isReady) {
        logVideoSDK('PrewarmingService', '🔥 VideoSDK WebSocket test successful');
        return true;
      } else {
        logWarn('PrewarmingService', '🔥 VideoSDK WebSocket test failed - not ready');
        return false;
      }

    } catch (error) {
      logWarn('PrewarmingService', '🔥 VideoSDK WebSocket test failed with error', error);
      return false;
    }
  }





  /**
   * Setup app state listener for intelligent pre-warming
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  /**
   * Handle app state changes for intelligent pre-warming
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    logVideoSDK('PrewarmingService', 'App state changed', { nextAppState });

    if (nextAppState === 'active') {
      // App became active - check if we need to re-prewarm after idle period
      const now = Date.now();
      const timeSinceLastPrewarm = now - this.state.lastPrewarmTime;
      const idleThreshold = this.config.idleThresholdMinutes * 60 * 1000;

      if (timeSinceLastPrewarm > idleThreshold) {
        logVideoSDK('PrewarmingService', 'App active after idle period - scheduling pre-warming');

        // Schedule pre-warming with a delay to avoid impacting app resume performance
        setTimeout(() => {
          this.startPrewarming().catch(error => {
            logWarn('PrewarmingService', 'Scheduled pre-warming failed', error);
          });
        }, this.config.startupDelayMs);
      }
    }
  }

  /**
   * Load pre-warming state from storage
   */
  private async loadState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem(VideoSDKPrewarmingService.STORAGE_KEY_STATE);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.state = { ...this.state, ...parsedState };
        logVideoSDK('PrewarmingService', 'Loaded state from storage', this.state);
      }
    } catch (error) {
      logWarn('PrewarmingService', 'Failed to load state from storage', error);
    }
  }

  /**
   * Save pre-warming state to storage
   */
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        VideoSDKPrewarmingService.STORAGE_KEY_STATE,
        JSON.stringify(this.state)
      );
    } catch (error) {
      logWarn('PrewarmingService', 'Failed to save state to storage', error);
    }
  }

  /**
   * Load pre-warming configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem(VideoSDKPrewarmingService.STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsedConfig };
        logVideoSDK('PrewarmingService', 'Loaded config from storage', this.config);
      }
    } catch (error) {
      logWarn('PrewarmingService', 'Failed to load config from storage', error);
    }
  }

  /**
   * Save pre-warming configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        VideoSDKPrewarmingService.STORAGE_KEY_CONFIG,
        JSON.stringify(this.config)
      );
    } catch (error) {
      logWarn('PrewarmingService', 'Failed to save config to storage', error);
    }
  }
}
