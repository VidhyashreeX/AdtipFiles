import { AppState, Platform } from 'react-native';
import { Logger } from '../utils/ProductionLogger';
import VideoSDKService from './videosdk/VideoSDKService';
import { VideoSDKPrewarmingService } from './videosdk/VideoSDKPrewarmingService';
import FirebaseService from './FirebaseService';
import DeepLinkService from './DeepLinkService';
import { KilledStatePerformanceMonitor } from './KilledStatePerformanceMonitor';
import { KilledStateErrorHandler } from './KilledStateErrorHandler';

/**
 * Service initialization status tracking
 */
interface ServiceStatus {
  name: string;
  initialized: boolean;
  initTime: number;
  error?: string;
}

/**
 * Performance metrics for killed state wake-up
 */
interface WakeUpMetrics {
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  serviceInitTimes: Record<string, number>;
  errors: string[];
  success: boolean;
}

/**
 * Service Orchestrator for managing killed state wake-up sequence
 * 
 * This service ensures all required services are properly initialized
 * in the correct order when the app is woken up from killed state by FCM.
 */
export class KilledStateServiceOrchestrator {
  private static _instance: KilledStateServiceOrchestrator;
  private isInitialized = false;
  private isWakingUp = false;
  private wakeUpPromise: Promise<boolean> | null = null;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private currentMetrics: WakeUpMetrics | null = null;
  private performanceMonitor: KilledStatePerformanceMonitor;
  private errorHandler: KilledStateErrorHandler;

  // Service initialization timeouts (in milliseconds)
  private readonly SERVICE_TIMEOUTS = {
    firebase: 5000,
    videoSDK: 8000,
    prewarming: 10000,
    deepLink: 2000,
    total: 15000
  };

  // Critical services that must be initialized for call functionality
  private readonly CRITICAL_SERVICES = [
    'firebase',
    'videoSDK',
    'deepLink'
  ];

  private constructor() {
    this.performanceMonitor = KilledStatePerformanceMonitor.getInstance();
    this.errorHandler = KilledStateErrorHandler.getInstance();
    Logger.info('KilledStateServiceOrchestrator', 'Service orchestrator created');
  }

  public static getInstance(): KilledStateServiceOrchestrator {
    if (!KilledStateServiceOrchestrator._instance) {
      KilledStateServiceOrchestrator._instance = new KilledStateServiceOrchestrator();
    }
    return KilledStateServiceOrchestrator._instance;
  }

  /**
   * Initialize the orchestrator (called once during app startup)
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      Logger.info('KilledStateServiceOrchestrator', 'Initializing service orchestrator...');
      
      // Set up app state listeners for killed state detection
      this.setupAppStateListeners();
      
      this.isInitialized = true;
      Logger.info('KilledStateServiceOrchestrator', 'Service orchestrator initialized successfully');
      return true;
    } catch (error) {
      Logger.error('KilledStateServiceOrchestrator', 'Failed to initialize orchestrator:', error);
      return false;
    }
  }

  /**
   * Wake up all required services for incoming call handling
   * This is the main entry point for killed state scenarios
   */
  public async wakeUpForIncomingCall(callData: {
    sessionId: string;
    meetingId: string;
    token: string;
    callerName: string;
    callType: 'voice' | 'video';
  }): Promise<boolean> {
    // If already waking up, return the existing promise
    if (this.isWakingUp && this.wakeUpPromise) {
      Logger.info('KilledStateServiceOrchestrator', 'Wake-up already in progress, waiting...');
      return this.wakeUpPromise;
    }

    // Start new wake-up process
    this.isWakingUp = true;
    this.wakeUpPromise = this.executeWakeUpSequence(callData);
    
    try {
      const result = await this.wakeUpPromise;
      return result;
    } finally {
      this.isWakingUp = false;
      this.wakeUpPromise = null;
    }
  }

  /**
   * Execute the complete wake-up sequence
   */
  private async executeWakeUpSequence(callData: {
    sessionId: string;
    meetingId: string;
    token: string;
    callerName: string;
    callType: 'voice' | 'video';
  }): Promise<boolean> {
    const startTime = Date.now();
    
    // Initialize metrics tracking
    this.currentMetrics = {
      startTime,
      serviceInitTimes: {},
      errors: [],
      success: false
    };

    Logger.info('KilledStateServiceOrchestrator', '🚀 Starting killed state wake-up sequence', {
      sessionId: callData.sessionId,
      callType: callData.callType,
      callerName: callData.callerName
    });

    // Start performance monitoring
    this.performanceMonitor.startSession(callData.sessionId, callData.callType);

    try {
      // Step 1: Initialize Firebase Service (highest priority)
      const firebaseSuccess = await this.initializeFirebaseService();
      if (!firebaseSuccess) {
        throw new Error('Firebase service initialization failed');
      }

      // Step 2: Initialize VideoSDK Service (critical for calls)
      const videoSDKSuccess = await this.initializeVideoSDKService();
      if (!videoSDKSuccess) {
        throw new Error('VideoSDK service initialization failed');
      }

      // Step 3: Start VideoSDK pre-warming (parallel, non-blocking)
      this.startVideoSDKPrewarming();

      // Step 4: Initialize DeepLink Service
      const deepLinkSuccess = await this.initializeDeepLinkService();
      if (!deepLinkSuccess) {
        throw new Error('DeepLink service initialization failed');
      }

      // Step 5: Verify all critical services are ready
      const allServicesReady = await this.verifyCriticalServices();
      if (!allServicesReady) {
        throw new Error('Not all critical services are ready');
      }

      // Step 6: Wait for VideoSDK WebSocket readiness (with timeout)
      await this.waitForVideoSDKReadiness();

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      this.currentMetrics.endTime = endTime;
      this.currentMetrics.totalDuration = totalDuration;
      this.currentMetrics.success = true;

      Logger.info('KilledStateServiceOrchestrator', '✅ Wake-up sequence completed successfully', {
        duration: totalDuration,
        sessionId: callData.sessionId
      });

      // Complete performance monitoring session
      const finalMetrics = this.performanceMonitor.completeSession(true);

      // Log performance metrics
      this.logPerformanceMetrics();

      return true;

    } catch (error) {
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      this.currentMetrics!.endTime = endTime;
      this.currentMetrics!.totalDuration = totalDuration;
      this.currentMetrics!.errors.push(error instanceof Error ? error.message : String(error));

      Logger.error('KilledStateServiceOrchestrator', '❌ Wake-up sequence failed', {
        error,
        duration: totalDuration,
        sessionId: callData.sessionId
      });

      // Complete performance monitoring session with failure
      const finalMetrics = this.performanceMonitor.completeSession(false);

      // Log failure metrics
      this.logPerformanceMetrics();

      return false;
    }
  }

  /**
   * Initialize Firebase Service with timeout
   */
  private async initializeFirebaseService(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      Logger.info('KilledStateServiceOrchestrator', '🔥 Initializing Firebase service...');
      
      const firebaseService = FirebaseService.getInstance();
      
      // Use Promise.race for timeout handling
      const initPromise = firebaseService.initializeMessaging();
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase initialization timeout')), this.SERVICE_TIMEOUTS.firebase);
      });

      const success = await Promise.race([initPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      this.updateServiceStatus('firebase', true, duration);
      this.currentMetrics!.serviceInitTimes.firebase = duration;
      this.performanceMonitor.recordServiceInit('firebase', duration);

      Logger.info('KilledStateServiceOrchestrator', '✅ Firebase service initialized', { duration });
      return success;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.updateServiceStatus('firebase', false, duration, errorMessage);
      this.currentMetrics!.serviceInitTimes.firebase = duration;
      this.currentMetrics!.errors.push(`Firebase: ${errorMessage}`);
      this.performanceMonitor.recordServiceInit('firebase', duration);
      this.performanceMonitor.recordServiceFailure('firebase', errorMessage);

      // Attempt error recovery
      const errorContext = this.errorHandler.createErrorContext(
        this.currentMetrics!.sessionId || 'unknown',
        'firebase',
        'initialization'
      );

      const recoverySuccess = await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(errorMessage),
        errorContext,
        async () => {
          // Retry Firebase initialization
          const firebaseService = FirebaseService.getInstance();
          return firebaseService.initializeMessaging();
        }
      );

      if (recoverySuccess) {
        Logger.info('KilledStateServiceOrchestrator', '✅ Firebase service recovered after error');
        const recoveryDuration = Date.now() - startTime;
        this.updateServiceStatus('firebase', true, recoveryDuration);
        this.performanceMonitor.recordServiceInit('firebase', recoveryDuration);
        return true;
      }

      Logger.error('KilledStateServiceOrchestrator', '❌ Firebase service initialization failed after recovery attempts', { error, duration });
      return false;
    }
  }

  /**
   * Initialize VideoSDK Service with timeout
   */
  private async initializeVideoSDKService(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      Logger.info('KilledStateServiceOrchestrator', '📹 Initializing VideoSDK service...');
      
      const videoSDKService = VideoSDKService.getInstance();
      
      // Use Promise.race for timeout handling
      const initPromise = videoSDKService.ensureInitialized();
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('VideoSDK initialization timeout')), this.SERVICE_TIMEOUTS.videoSDK);
      });

      const success = await Promise.race([initPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      this.updateServiceStatus('videoSDK', success, duration);
      this.currentMetrics!.serviceInitTimes.videoSDK = duration;
      this.performanceMonitor.recordServiceInit('videoSDK', duration);

      Logger.info('KilledStateServiceOrchestrator', '✅ VideoSDK service initialized', { duration, success });
      return success;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.updateServiceStatus('videoSDK', false, duration, errorMessage);
      this.currentMetrics!.serviceInitTimes.videoSDK = duration;
      this.currentMetrics!.errors.push(`VideoSDK: ${errorMessage}`);
      this.performanceMonitor.recordServiceInit('videoSDK', duration);
      this.performanceMonitor.recordServiceFailure('videoSDK', errorMessage);

      Logger.error('KilledStateServiceOrchestrator', '❌ VideoSDK service initialization failed', { error, duration });
      return false;
    }
  }

  /**
   * Start VideoSDK pre-warming (non-blocking)
   */
  private startVideoSDKPrewarming(): void {
    const startTime = Date.now();
    
    Logger.info('KilledStateServiceOrchestrator', '🔥 Starting VideoSDK pre-warming...');
    
    // Start pre-warming in background (don't await)
    VideoSDKPrewarmingService.getInstance().startPrewarming()
      .then((success) => {
        const duration = Date.now() - startTime;
        this.updateServiceStatus('prewarming', success, duration);
        this.currentMetrics!.serviceInitTimes.prewarming = duration;
        
        Logger.info('KilledStateServiceOrchestrator', '✅ VideoSDK pre-warming completed', { duration, success });
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.updateServiceStatus('prewarming', false, duration, errorMessage);
        this.currentMetrics!.serviceInitTimes.prewarming = duration;
        this.currentMetrics!.errors.push(`Prewarming: ${errorMessage}`);
        
        Logger.warn('KilledStateServiceOrchestrator', '⚠️ VideoSDK pre-warming failed (non-critical)', { error, duration });
      });
  }

  /**
   * Initialize DeepLink Service with timeout
   */
  private async initializeDeepLinkService(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      Logger.info('KilledStateServiceOrchestrator', '🔗 Initializing DeepLink service...');
      
      const deepLinkService = DeepLinkService.getInstance();
      
      // DeepLink service initialization is synchronous, but we add timeout for consistency
      const initPromise = Promise.resolve(deepLinkService.initialize());
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('DeepLink initialization timeout')), this.SERVICE_TIMEOUTS.deepLink);
      });

      const success = await Promise.race([initPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      this.updateServiceStatus('deepLink', success, duration);
      this.currentMetrics!.serviceInitTimes.deepLink = duration;

      Logger.info('KilledStateServiceOrchestrator', '✅ DeepLink service initialized', { duration });
      return success;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.updateServiceStatus('deepLink', false, duration, errorMessage);
      this.currentMetrics!.serviceInitTimes.deepLink = duration;
      this.currentMetrics!.errors.push(`DeepLink: ${errorMessage}`);

      Logger.error('KilledStateServiceOrchestrator', '❌ DeepLink service initialization failed', { error, duration });
      return false;
    }
  }

  /**
   * Verify all critical services are ready
   */
  private async verifyCriticalServices(): Promise<boolean> {
    Logger.info('KilledStateServiceOrchestrator', '🔍 Verifying critical services...');
    
    const failedServices: string[] = [];
    
    for (const serviceName of this.CRITICAL_SERVICES) {
      const status = this.serviceStatuses.get(serviceName);
      if (!status || !status.initialized) {
        failedServices.push(serviceName);
      }
    }

    if (failedServices.length > 0) {
      Logger.error('KilledStateServiceOrchestrator', '❌ Critical services not ready', { failedServices });
      return false;
    }

    Logger.info('KilledStateServiceOrchestrator', '✅ All critical services verified');
    return true;
  }

  /**
   * Wait for VideoSDK WebSocket readiness with timeout
   */
  private async waitForVideoSDKReadiness(): Promise<void> {
    Logger.info('KilledStateServiceOrchestrator', '⏳ Waiting for VideoSDK WebSocket readiness...');
    
    const startTime = Date.now();
    const timeout = 5000; // 5 seconds timeout
    
    return new Promise((resolve, reject) => {
      const checkReadiness = () => {
        const videoSDKService = VideoSDKService.getInstance();
        const status = videoSDKService.getInitializationStatus();
        
        if (status.initialized && status.websocketReady) {
          const duration = Date.now() - startTime;
          Logger.info('KilledStateServiceOrchestrator', '✅ VideoSDK WebSocket ready', { duration });
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          Logger.warn('KilledStateServiceOrchestrator', '⚠️ VideoSDK WebSocket readiness timeout (proceeding anyway)');
          resolve(); // Don't reject, just proceed
          return;
        }

        // Check again in 100ms
        setTimeout(checkReadiness, 100);
      };

      checkReadiness();
    });
  }

  /**
   * Update service status tracking
   */
  private updateServiceStatus(name: string, initialized: boolean, initTime: number, error?: string): void {
    this.serviceStatuses.set(name, {
      name,
      initialized,
      initTime,
      error
    });
  }

  /**
   * Set up app state listeners for killed state detection
   */
  private setupAppStateListeners(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Logger.info('KilledStateServiceOrchestrator', 'App became active - potential killed state recovery');
      }
    });
  }

  /**
   * Log performance metrics for monitoring
   */
  private logPerformanceMetrics(): void {
    if (!this.currentMetrics) return;

    const metrics = {
      platform: Platform.OS,
      totalDuration: this.currentMetrics.totalDuration,
      success: this.currentMetrics.success,
      serviceInitTimes: this.currentMetrics.serviceInitTimes,
      errorCount: this.currentMetrics.errors.length,
      errors: this.currentMetrics.errors
    };

    Logger.info('KilledStateServiceOrchestrator', '📊 Wake-up performance metrics', metrics);

    // TODO: Send metrics to analytics service
    // AnalyticsService.trackKilledStateWakeUp(metrics);
  }

  /**
   * Get current service statuses (for debugging)
   */
  public getServiceStatuses(): Map<string, ServiceStatus> {
    return new Map(this.serviceStatuses);
  }

  /**
   * Check if orchestrator is ready
   */
  public isReady(): boolean {
    return this.isInitialized && !this.isWakingUp;
  }

  /**
   * Get current wake-up metrics (for debugging)
   */
  public getCurrentMetrics(): WakeUpMetrics | null {
    return this.currentMetrics;
  }
}

export default KilledStateServiceOrchestrator;
