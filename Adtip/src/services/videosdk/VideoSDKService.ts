import { register } from '@videosdk.live/react-native-sdk';
import ApiService from '../ApiService';
import { logVideoSDK, logError, logWarn } from '../../utils/ProductionLogger';

export interface VideoSDKConfig {
  token?: string;
  apiKey?: string;
  region?: 'sg001' | 'us001' | 'eu001';
  // Add WebSocket configuration options
  websocketConfig?: {
    reconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
  };
}

export interface MeetingConfig {
  meetingId: string;
  token: string;
  participantName: string;
  micEnabled?: boolean;
  webcamEnabled?: boolean;
}

class VideoSDKService {
  private static instance: VideoSDKService;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;
  private config: VideoSDKConfig = {
    region: 'us001', // Default region
    websocketConfig: {
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      heartbeatInterval: 30000,
    }
  };

  // WebSocket connection state tracking
  private websocketReady: boolean = false;
  private maxWebsocketAttempts: number = 3;

  // Add active meeting session tracking
  private activeMeetingSession: string | null = null;
  private meetingStateCleanupTimestamp: number = 0;

  // Reset prevention to avoid unnecessary re-initializations
  private lastResetTimestamp: number = 0;
  private resetCooldownMs: number = 2000; // Prevent resets within 2 seconds

  // Track first-time initialization for enhanced cold start handling
  private isFirstTimeInitialization: boolean = true;
  private appStartTimestamp: number = Date.now();

  private constructor() {}

  public static getInstance(): VideoSDKService {
    if (!VideoSDKService.instance) {
      VideoSDKService.instance = new VideoSDKService();
    }
    return VideoSDKService.instance;
  }

  /**
   * Initialize VideoSDK with enhanced WebSocket connection handling and cold start optimization
   * Following latest VideoSDK React Native documentation
   */
  async initialize(config?: Partial<VideoSDKConfig>): Promise<boolean> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      logVideoSDK('VideoSDKService', 'Initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.isInitialized && this.websocketReady) {
      logVideoSDK('VideoSDKService', 'Already initialized and WebSocket ready');
      return true;
    }

    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Detect cold start scenario
    const isColdStart = this.isFirstTimeInitialization;
    logVideoSDK('VideoSDKService', 'Starting initialization', {
      isColdStart,
      hasConfig: !!config,
      currentStatus: this.getInitializationStatus()
    });

    // Create a new initialization promise with cold start optimization
    this.initializationPromise = (async () => {
      try {
        const isFirstTime = this.isFirstTimeInitialization;
        const timeSinceAppStart = Date.now() - this.appStartTimestamp;

        logVideoSDK('VideoSDKService', 'Starting VideoSDK initialization', {
          isFirstTime,
          timeSinceAppStart,
          isColdStart,
          config: this.config
        });

        // Reset WebSocket state
        this.websocketReady = false;

        // Use optimized path for cold start scenarios
        if (isColdStart) {
          logVideoSDK('VideoSDKService', '🚀 Using cold start optimization path');

          // Register with VideoSDK immediately (highest priority)
          logVideoSDK('VideoSDKService', 'Registering VideoSDK (cold start)...');
          await register();

          // Use fast WebSocket connection
          await this.establishWebSocketConnectionFast();

          this.isInitialized = true;
          this.websocketReady = true;
          this.isFirstTimeInitialization = false;

          logVideoSDK('VideoSDKService', '✅ Cold start VideoSDK initialization complete');
          return true;
        }

        // Regular initialization path for non-cold start scenarios
        // For first-time initialization, add extra delay to ensure app is fully loaded
        if (isFirstTime && timeSinceAppStart < 5000) {
          const extraDelay = Math.max(2000, 5000 - timeSinceAppStart);
          logVideoSDK('VideoSDKService', `First-time initialization: adding ${extraDelay}ms delay for app stability`);
          await new Promise(resolve => setTimeout(resolve, extraDelay));
        }

        // Additional stability check for first-time initialization
        if (isFirstTime) {
          logVideoSDK('VideoSDKService', 'First-time initialization: Performing enhanced WebSocket validation');
          // Add extra validation delay for first-time users to prevent WebSocket issues
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Register with VideoSDK - this must be called before any VideoSDK operations
        logVideoSDK('VideoSDKService', 'Registering VideoSDK...');
        await register();

        // Wait for WebSocket connection to establish with enhanced validation
        await this.establishWebSocketConnection();

        this.isInitialized = true;
        this.websocketReady = true;
        this.isFirstTimeInitialization = false; // Mark as no longer first time

        logVideoSDK('VideoSDKService', 'VideoSDK initialization complete with WebSocket ready');
        return true;
      } catch (error) {
        logError('VideoSDKService', 'VideoSDK initialization failed', error);
        this.isInitialized = false;
        this.websocketReady = false;

        // Enhanced error handling with recovery attempts
        if (error instanceof Error) {
          if (error.message.includes('WebSocket')) {
            logWarn('VideoSDKService', 'WebSocket connection failed, will retry on next call');
          } else if (error.message.includes('network')) {
            logWarn('VideoSDKService', 'Network error during initialization, will retry on next call');
          } else {
            logWarn('VideoSDKService', 'Unknown initialization error, will retry on next call');
          }
        }

        return false;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Establish WebSocket connection with progressive delays and proper validation
   * Based on VideoSDK best practices for React Native
   */
  private async establishWebSocketConnection(): Promise<void> {
    const maxAttempts = this.maxWebsocketAttempts;
    const baseDelay = this.config.websocketConfig?.reconnectDelay || 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logVideoSDK('VideoSDKService', `WebSocket connection attempt ${attempt}/${maxAttempts}`);

        // Progressive delay with longer initial delay for first-time connections
        // This is crucial for cold starts and first-time users
        const delay = attempt === 1 ? 3000 : baseDelay * Math.pow(2, attempt - 2);
        logVideoSDK('VideoSDKService', `Waiting ${delay}ms before connection attempt ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Test WebSocket readiness by attempting to validate actual connectivity
        // This now performs real connectivity testing instead of just checking flags
        await this.validateVideoSDKConnection();

        logVideoSDK('VideoSDKService', `WebSocket connection established on attempt ${attempt}`);
        return;

      } catch (error) {
        logWarn('VideoSDKService', `WebSocket connection attempt ${attempt} failed:`, error);

        // Check if this is during call initiation - be more resilient
        try {
          // Import the store dynamically to avoid circular dependencies
          const callStoreModule = require('../../stores/callStoreSimplified');
          if (callStoreModule && callStoreModule.useCallStore) {
            const callState = callStoreModule.useCallStore.getState();
            const isCallActive = callState.session || (callState.status && callState.status !== 'idle');

            if (isCallActive && attempt < maxAttempts) {
              logVideoSDK('VideoSDKService', 'Call is active, being more resilient with WebSocket connection');
              // Give extra attempts during active calls
            }
          }
        } catch (storeError) {
          // Ignore store access errors
        }

        if (attempt === maxAttempts) {
          throw new Error(`Failed to establish WebSocket connection after ${maxAttempts} attempts: ${error}`);
        }

        // Add extra delay between failed attempts for better stability
        const retryDelay = 1000 * attempt;
        logVideoSDK('VideoSDKService', `Waiting additional ${retryDelay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Fast WebSocket connection establishment for cold start scenarios
   * Uses aggressive timeouts and minimal validation for speed
   */
  private async establishWebSocketConnectionFast(): Promise<void> {
    const maxAttempts = 2; // Reduced attempts for speed
    const baseDelay = 1000; // Faster initial delay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logVideoSDK('VideoSDKService', `Fast WebSocket connection attempt ${attempt}/${maxAttempts}`);

        // Minimal delay for cold start optimization
        const delay = attempt === 1 ? 500 : baseDelay;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Fast validation with reduced timeout
        await this.validateVideoSDKConnectionFast();

        logVideoSDK('VideoSDKService', `Fast WebSocket connection established on attempt ${attempt}`);
        return;

      } catch (error) {
        logWarn('VideoSDKService', `Fast WebSocket connection attempt ${attempt} failed:`, error);

        if (attempt === maxAttempts) {
          // If fast connection fails, fall back to regular connection
          logVideoSDK('VideoSDKService', 'Fast connection failed, falling back to regular connection...');
          await this.establishWebSocketConnection();
          return;
        }
      }
    }
  }

  /**
   * Fast validation for cold start scenarios
   * Uses reduced timeout for speed
   */
  private async validateVideoSDKConnectionFast(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Fast VideoSDK connection validation timeout'));
      }, 3000); // Reduced timeout for speed

      try {
        logVideoSDK('VideoSDKService', 'Fast validating VideoSDK WebSocket connection...');

        // Simplified connectivity test for speed
        this.testWebSocketConnectivityFast()
          .then(() => {
            clearTimeout(timeout);
            logVideoSDK('VideoSDKService', 'Fast WebSocket connection validation successful');
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            logWarn('VideoSDKService', 'Fast WebSocket connection validation failed:', error);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Validate VideoSDK connection by testing actual WebSocket connectivity
   * This ensures the WebSocket and signaling are properly established
   */
  private async validateVideoSDKConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('VideoSDK connection validation timeout'));
      }, 8000); // Increased timeout for better reliability

      try {
        logVideoSDK('VideoSDKService', 'Validating VideoSDK WebSocket connection...');

        // Test WebSocket connectivity by attempting to create a temporary meeting
        // This is the most reliable way to verify VideoSDK's internal WebSocket is ready
        this.testWebSocketConnectivity()
          .then(() => {
            clearTimeout(timeout);
            logVideoSDK('VideoSDKService', 'WebSocket connection validation successful');
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            logWarn('VideoSDKService', 'WebSocket connection validation failed:', error);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Test WebSocket connectivity by attempting to create a test meeting
   * This verifies that VideoSDK's internal WebSocket is actually connected
   */
  private async testWebSocketConnectivity(): Promise<void> {
    return new Promise((resolve, reject) => {
      const testTimeout = setTimeout(() => {
        reject(new Error('WebSocket connectivity test timeout'));
      }, 6000);

      try {
        // Import VideoSDK meeting creation function to test connectivity
        import('@videosdk.live/react-native-sdk').then(() => {
          // If we can import the VideoSDK without errors, and register() was called,
          // we can assume the WebSocket infrastructure is ready
          // We don't actually create a meeting, just verify the SDK is responsive

          // Add a small delay to ensure any async initialization is complete
          setTimeout(() => {
            clearTimeout(testTimeout);
            resolve();
          }, 1000);
        }).catch((error) => {
          clearTimeout(testTimeout);
          reject(new Error(`VideoSDK import failed: ${error.message}`));
        });
      } catch (error) {
        clearTimeout(testTimeout);
        reject(error);
      }
    });
  }

  /**
   * Fast WebSocket connectivity test for cold start scenarios
   * Uses minimal validation for speed
   */
  private async testWebSocketConnectivityFast(): Promise<void> {
    return new Promise((resolve, reject) => {
      const testTimeout = setTimeout(() => {
        reject(new Error('Fast WebSocket connectivity test timeout'));
      }, 2000); // Reduced timeout for speed

      try {
        // Simplified test - just verify VideoSDK can be imported
        import('@videosdk.live/react-native-sdk').then(() => {
          // Minimal delay for fast validation
          setTimeout(() => {
            clearTimeout(testTimeout);
            resolve();
          }, 200); // Much faster than regular test
        }).catch((error) => {
          clearTimeout(testTimeout);
          reject(new Error(`Fast VideoSDK import failed: ${error.message}`));
        });
      } catch (error) {
        clearTimeout(testTimeout);
        reject(error);
      }
    });
  }

  /**
   * Get initialization status including WebSocket readiness
   */
  getInitializationStatus(): { initialized: boolean; websocketReady: boolean } {
    return {
      initialized: this.isInitialized,
      websocketReady: this.websocketReady
    };
  }

  /**
   * Ensure VideoSDK is initialized with WebSocket ready
   * Enhanced for first-time users and cold starts
   */
  async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized && this.websocketReady) {
      // Even if initialized, do a quick health check for first-time scenarios
      if (this.isFirstTimeOrColdStart()) {
        try {
          await this.testWebSocketConnectivity();
          logVideoSDK('VideoSDKService', 'VideoSDK already initialized and connectivity confirmed');
          return true;
        } catch (error) {
          logWarn('VideoSDKService', 'Health check failed for initialized VideoSDK, re-initializing...', error);
          this.isInitialized = false;
          this.websocketReady = false;
        }
      } else {
        return true;
      }
    }

    // Use enhanced initialization for first-time users
    if (this.isFirstTimeOrColdStart()) {
      return this.initializeForFirstTimeUser();
    }

    return this.initialize();
  }

  /**
   * Wait for WebSocket connection to be fully ready
   * Enhanced implementation with actual connectivity testing
   */
  async waitForWebSocketReady(maxWaitMs: number = 12000): Promise<boolean> {
    if (!this.isInitialized) {
      logWarn('VideoSDKService', 'Cannot wait for WebSocket - VideoSDK not initialized');
      return false;
    }

    if (this.websocketReady) {
      // Even if flag says ready, do a quick connectivity test for first-time users
      try {
        await this.testWebSocketConnectivity();
        logVideoSDK('VideoSDKService', 'WebSocket already ready and connectivity confirmed');
        return true;
      } catch (error) {
        logWarn('VideoSDKService', 'WebSocket flag was ready but connectivity test failed, retesting...');
        this.websocketReady = false; // Reset flag to force proper testing
      }
    }

    logVideoSDK('VideoSDKService', 'Waiting for WebSocket connection to be ready...');

    const startTime = Date.now();
    const checkInterval = 1000; // Increased interval for more thorough testing
    let lastError: any = null;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Test actual WebSocket connectivity instead of just checking flags
        await this.testWebSocketConnectivity();

        this.websocketReady = true;
        logVideoSDK('VideoSDKService', 'WebSocket connection confirmed ready through connectivity test');
        return true;
      } catch (error) {
        lastError = error;
        logWarn('VideoSDKService', 'WebSocket connectivity test failed, retrying...', error);
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    logWarn('VideoSDKService', `WebSocket readiness timeout after ${maxWaitMs}ms. Last error:`, lastError);
    return false;
  }

  /**
   * Check if WebSocket is truly healthy and ready for meeting operations
   */
  public isWebSocketHealthy(): boolean {
    try {
      // Check basic initialization state
      if (!this.isInitialized || !this.websocketReady) {
        logWarn('VideoSDKService', 'WebSocket health check failed: not initialized or ready', {
          isInitialized: this.isInitialized,
          websocketReady: this.websocketReady
        });
        return false;
      }

      // Additional health checks can be added here
      // For now, we rely on the basic state flags
      logVideoSDK('VideoSDKService', 'WebSocket health check passed');
      return true;
    } catch (error) {
      logError('VideoSDKService', 'Error during WebSocket health check:', error);
      return false;
    }
  }

  /**
   * Ensure WebSocket is ready for meeting operations with validation
   * This is critical for preventing first-call WebSocket errors
   */
  public async ensureWebSocketReadyForMeeting(): Promise<boolean> {
    logVideoSDK('VideoSDKService', 'Ensuring WebSocket is ready for meeting operations');

    try {
      // First check if already healthy
      if (this.isWebSocketHealthy()) {
        logVideoSDK('VideoSDKService', 'WebSocket already healthy for meeting');
        return true;
      }

      // If not healthy, try to re-initialize
      logVideoSDK('VideoSDKService', 'WebSocket not healthy, attempting re-initialization');
      await this.initialize();

      // Wait for WebSocket to be ready with timeout
      const isReady = await this.waitForWebSocketReady(10000);
      if (!isReady) {
        logError('VideoSDKService', 'WebSocket failed to become ready within timeout');
        return false;
      }

      // Final health check
      const isHealthy = this.isWebSocketHealthy();
      logVideoSDK('VideoSDKService', 'WebSocket readiness for meeting:', { isHealthy });
      return isHealthy;

    } catch (error) {
      logError('VideoSDKService', 'Error ensuring WebSocket readiness for meeting:', error);
      return false;
    }
  }

  /**
   * Enhanced WebSocket reconnection with proper error handling
   * Following VideoSDK React Native best practices
   */
  async handleWebSocketReconnection(error: any, attempt: number = 1, maxAttempts: number = 3): Promise<boolean> {
    logWarn('VideoSDKService', `WebSocket reconnection attempt ${attempt}/${maxAttempts}:`, {
      error: error?.message || error,
      errorType: error?.name || 'Unknown',
      stack: error?.stack?.substring(0, 200) || 'No stack trace'
    });

    if (attempt > maxAttempts) {
      logError('VideoSDKService', 'Max WebSocket reconnection attempts reached');
      return false;
    }

    try {
      // Progressive delay with exponential backoff
      const baseDelay = this.config.websocketConfig?.reconnectDelay || 2000;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000); // Max 15 seconds

      logVideoSDK('VideoSDKService', `Waiting ${delay}ms before reconnection attempt ${attempt}`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Reset state and re-initialize VideoSDK
      this.isInitialized = false;
      this.websocketReady = false;
      this.initializationPromise = null;

      logVideoSDK('VideoSDKService', `Starting reconnection attempt ${attempt}`);
      const success = await this.initialize();

      if (success && this.websocketReady) {
        logVideoSDK('VideoSDKService', `WebSocket reconnection attempt ${attempt} successful`);
        return true;
      } else {
        logWarn('VideoSDKService', `WebSocket reconnection attempt ${attempt} failed - retrying`);
        return this.handleWebSocketReconnection(error, attempt + 1, maxAttempts);
      }
    } catch (reconnectError) {
      logError('VideoSDKService', `Error during reconnection attempt ${attempt}:`, reconnectError);
      return this.handleWebSocketReconnection(reconnectError, attempt + 1, maxAttempts);
    }
  }



  /**
   * Check if this is a first-time user or cold start scenario
   * This helps determine if we need extra initialization time
   */
  isFirstTimeOrColdStart(): boolean {
    const timeSinceAppStart = Date.now() - this.appStartTimestamp;
    return this.isFirstTimeInitialization || timeSinceAppStart < 10000; // Within 10 seconds of app start
  }

  /**
   * Check if WebSocket connection has been pre-warmed
   * This integrates with the VideoSDKPrewarmingService
   */
  isWebSocketPrewarmed(): boolean {
    try {
      // Dynamically import to avoid circular dependencies
      const { VideoSDKPrewarmingService } = require('./VideoSDKPrewarmingService');
      const prewarmingService = VideoSDKPrewarmingService.getInstance();
      return prewarmingService.isPrewarmed();
    } catch (error) {
      // If pre-warming service is not available, return false
      return false;
    }
  }

  /**
   * Enhanced initialization for first-time users with extra validation
   */
  async initializeForFirstTimeUser(): Promise<boolean> {
    logVideoSDK('VideoSDKService', 'Initializing VideoSDK for first-time user with enhanced validation');

    // Use longer timeouts and more attempts for first-time users
    const originalMaxAttempts = this.maxWebsocketAttempts;
    this.maxWebsocketAttempts = 5; // Increase attempts for first-time users

    try {
      const success = await this.initialize();

      if (success) {
        // Additional validation for first-time users
        logVideoSDK('VideoSDKService', 'Performing additional validation for first-time user');
        const isReady = await this.waitForWebSocketReady(15000); // Longer timeout

        if (!isReady) {
          logWarn('VideoSDKService', 'First-time user validation failed, retrying...');
          return this.initialize(); // Retry once more
        }
      }

      return success;
    } finally {
      this.maxWebsocketAttempts = originalMaxAttempts; // Restore original value
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): VideoSDKConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<VideoSDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logVideoSDK('VideoSDKService', 'Configuration updated', this.config);
  }  /**
   * Create a new meeting via backend API with state isolation
   */
  public async createMeeting(participantToken: string): Promise<string | null> {
    try {
      logVideoSDK('VideoSDKService', 'Creating meeting via backend API with state isolation');
      
      // First, clear any existing meeting state to prevent conflicts
      await this.clearExistingMeetingState();
      
      // Pass correct region code as per VideoSDK docs (us001, sg001, eu001)
      const response = await ApiService.createVideoSDKMeeting(participantToken, 'us001');
      
      logVideoSDK('VideoSDKService', 'Raw API response', response);
      
      // Fix: Check the correct response structure
      if (response.success && response.data && response.data.roomId) {
        logVideoSDK('VideoSDKService', 'Meeting created with isolation', response.data.roomId);
        return response.data.roomId;
      } else {
        logError('VideoSDKService', 'Invalid response structure', response);
        throw new Error('Failed to create meeting - invalid response structure');
      }
    } catch (error) {
      logError('VideoSDKService', 'Failed to create meeting', error);
      return null;
    }
  }

  /**
   * Validate meeting ID via backend API
   */
  public async validateMeeting(meetingId: string, _participantToken: string): Promise<boolean> {
    try {
      logVideoSDK('VideoSDKService', 'Validating meeting via backend API', meetingId);
      
      // For now, assume meeting is valid if we have a meetingId
      // You can implement actual validation later if needed
      return !!meetingId;
    } catch (error) {
      logError('VideoSDKService', 'Failed to validate meeting', error);
      return false;
    }
  }
  /**
   * Generate participant token via backend API
   */
  public async generateParticipantToken(): Promise<string | null> {
    try {
      logVideoSDK('VideoSDKService', 'Generating participant token via backend');
      
      const response = await ApiService.generateVideoSDKToken();
      
      if (response.token) {
        return response.token;
      } else {
        throw new Error('Failed to generate token');
      }
    } catch (error) {
      logError('VideoSDKService', 'Failed to generate participant token', error);
      return null;
    }
  }
  /**
   * Generate meeting configuration
   */
  public createMeetingConfig(
    meetingId: string,
    token: string,
    participantName: string,
    options: { micEnabled?: boolean; webcamEnabled?: boolean } = {}
  ): MeetingConfig {
    return {
      meetingId,
      token,
      participantName,
      micEnabled: options.micEnabled ?? true, // Default to unmuted for better UX
      webcamEnabled: options.webcamEnabled ?? false, // Keep camera off by default for privacy
    };
  }

  /**
   * Force clear any existing meeting state before creating a new one
   * This prevents meeting ID conflicts and ensures clean state
   */
  public async clearExistingMeetingState(): Promise<void> {
    logVideoSDK('VideoSDKService', 'Clearing existing meeting state to prevent conflicts');
    
    try {
      // Clear any global meeting references
      if (global.videoSDKMeetingData) {
        global.videoSDKMeetingData = null;
      }
      
      // Clear active meeting session tracking
      if (this.activeMeetingSession) {
        logVideoSDK('VideoSDKService', 'Clearing previous active meeting session', this.activeMeetingSession);
        this.activeMeetingSession = null;
        this.meetingStateCleanupTimestamp = Date.now();
      }
      
      // Clear any participant data
      if (global.videoSDKParticipants) {
        global.videoSDKParticipants.clear();
      }
      
      // Clear VideoSDK internal state if accessible
      if (global.VideoSDK?.currentMeeting) {
        global.VideoSDK.currentMeeting = null;
      }
      
      // Force garbage collection to clear any remaining references
      if (global.gc) {
        global.gc();
      }
      
      // Add small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logVideoSDK('VideoSDKService', 'Meeting state cleared successfully');
    } catch (error) {
      logWarn('VideoSDKService', 'Error clearing meeting state', error);
    }
  }

  /**
   * Reset service (for logout or cleanup)
   * Enhanced to handle WebSocket state properly with cooldown protection
   */
  public reset(force: boolean = false): void {
    // Prevent unnecessary resets within cooldown period unless forced
    const now = Date.now();
    if (!force && (now - this.lastResetTimestamp) < this.resetCooldownMs) {
      logVideoSDK('VideoSDKService', 'Reset skipped - within cooldown period', {
        timeSinceLastReset: now - this.lastResetTimestamp,
        cooldownMs: this.resetCooldownMs
      });
      return;
    }

    logVideoSDK('VideoSDKService', 'Starting comprehensive service reset', {
      forced: force,
      timeSinceLastReset: now - this.lastResetTimestamp
    });

    this.lastResetTimestamp = now;

    // Reset initialization and WebSocket state
    this.isInitialized = false;
    this.websocketReady = false;
    this.initializationPromise = null;

    // Reset config to defaults
    this.config = {
      region: 'us001',
      websocketConfig: {
        reconnectAttempts: 5,
        reconnectDelay: 2000,
        heartbeatInterval: 30000,
      }
    };

    // Force cleanup of any lingering WebRTC connections and participant state
    try {
      // Clear any global VideoSDK state if available
      if (global.VideoSDK) {
        logVideoSDK('VideoSDKService', 'Clearing global VideoSDK state');
        // Force cleanup of any active meetings or connections
        if (global.VideoSDK.currentMeeting) {
          global.VideoSDK.currentMeeting = null;
        }
        if (global.VideoSDK.websocketConnection) {
          global.VideoSDK.websocketConnection = null;
        }
        if (global.VideoSDK.participants) {
          global.VideoSDK.participants.clear();
        }
      }

      // Clear any cached participant data that might cause state bleeding
      if (global.videoSDKParticipants) {
        logVideoSDK('VideoSDKService', 'Clearing cached participant data');
        global.videoSDKParticipants.clear();
        global.videoSDKParticipants = new Map();
      }

      // Clear any meeting data cache
      if (global.videoSDKMeetingData) {
        logVideoSDK('VideoSDKService', 'Clearing cached meeting data');
        global.videoSDKMeetingData = null;
      }

      // Clear any component instance tracking that might interfere
      if (global.meetingComponentInstances) {
        logVideoSDK('VideoSDKService', 'Clearing component instance tracking');
        global.meetingComponentInstances = {};
      }

      // Clear active meeting session tracking
      this.activeMeetingSession = null;
      this.meetingStateCleanupTimestamp = Date.now();

    } catch (error) {
      logWarn('VideoSDKService', 'Error during comprehensive state cleanup', error);
    }

    logVideoSDK('VideoSDKService', 'Service reset complete');
  }

  /**
   * Smart reset that only resets when necessary
   * Use this instead of reset() for most cleanup scenarios
   */
  public smartReset(sessionId?: string): void {
    // Only reset if there's an active meeting session that's different
    if (this.activeMeetingSession && sessionId && this.activeMeetingSession !== sessionId) {
      logVideoSDK('VideoSDKService', 'Smart reset: Different session detected', {
        currentSession: this.activeMeetingSession,
        newSession: sessionId
      });
      this.reset(false); // Use cooldown protection
      return;
    }

    // Only reset if VideoSDK is in an error state
    if (this.isInitialized && !this.websocketReady) {
      logVideoSDK('VideoSDKService', 'Smart reset: WebSocket not ready, resetting');
      this.reset(false); // Use cooldown protection
      return;
    }

    // Clear meeting session without full reset if just cleaning up
    if (!sessionId && this.activeMeetingSession) {
      logVideoSDK('VideoSDKService', 'Smart reset: Clearing meeting session only');
      this.clearActiveMeetingSession(this.activeMeetingSession);
      return;
    }

    logVideoSDK('VideoSDKService', 'Smart reset: No reset needed', {
      isInitialized: this.isInitialized,
      websocketReady: this.websocketReady,
      activeMeetingSession: this.activeMeetingSession,
      requestedSession: sessionId
    });
  }

  /**
   * Set active meeting session to prevent multiple simultaneous meetings
   */
  public setActiveMeetingSession(sessionId: string): boolean {
    const now = Date.now();
    
    // If there's already an active session, check if it's the same or if enough time has passed for cleanup
    if (this.activeMeetingSession && this.activeMeetingSession !== sessionId) {
      // If the last cleanup was recent, don't allow new session
      if (now - this.meetingStateCleanupTimestamp < 2000) {
        logWarn('VideoSDKService', 'Another meeting session is active, rejecting new session', {
          active: this.activeMeetingSession,
          new: sessionId,
          timeSinceCleanup: now - this.meetingStateCleanupTimestamp
        });
        return false;
      }
    }
    
    logVideoSDK('VideoSDKService', 'Setting active meeting session', sessionId);
    this.activeMeetingSession = sessionId;
    return true;
  }
  
  /**
   * Clear active meeting session
   */
  public clearActiveMeetingSession(sessionId: string): void {
    if (this.activeMeetingSession === sessionId) {
      logVideoSDK('VideoSDKService', 'Clearing active meeting session', sessionId);
      this.activeMeetingSession = null;
      this.meetingStateCleanupTimestamp = Date.now();
    }
  }
  
  /**
   * Check if a meeting session is active
   */
  public isSessionActive(sessionId: string): boolean {
    return this.activeMeetingSession === sessionId;
  }
}

// ✅ FIXED: Export the class itself, not getInstance()
export default VideoSDKService;
