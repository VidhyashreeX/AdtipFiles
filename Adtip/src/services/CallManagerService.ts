import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import ApiService from './ApiService';

interface CallSession {
  callId: number;
  callerId: number;
  receiverId: number;
  callType: 'voice' | 'video';
  startTime: Date;
  maxDuration: number; // in minutes
  autoEndTimer?: NodeJS.Timeout;
  networkListener?: any;
  appStateListener?: any;
  healthCheckTimer?: NodeJS.Timeout;
}

class CallManagerService {
  private static instance: CallManagerService;
  private activeCall: CallSession | null = null;
  private isInitialized = false;

  // Maximum call duration (10 minutes as requested)
  private readonly MAX_CALL_DURATION_MINUTES = 10;
  
  // Safety check intervals
  private readonly NETWORK_CHECK_INTERVAL = 5000; // 5 seconds
  private readonly CALL_HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

  private constructor() {}

  static getInstance(): CallManagerService {
    if (!CallManagerService.instance) {
      CallManagerService.instance = new CallManagerService();
    }
    return CallManagerService.instance;
  }

  /**
   * Initialize the call manager service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[CallManagerService] Initializing call manager service...');
      
      // Set up app state monitoring
      this.setupAppStateMonitoring();
      
      this.isInitialized = true;
      console.log('[CallManagerService] ✅ Call manager service initialized successfully');
      return true;
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to initialize call manager service:', error);
      return false;
    }
  }

  /**
   * Start a voice call with comprehensive safety measures
   */
  async startVoiceCall(callerId: number, receiverId: number): Promise<any> {
    try {
      console.log('📞 [CallManagerService] Starting voice call...', { callerId, receiverId });

      // Check if there's already an active call
      if (this.activeCall) {
        console.warn('[CallManagerService] There is already an active call, ending it first');
        await this.forceEndCall();
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection available');
      }

      console.log('🌐 [CallManagerService] Network check passed, proceeding with API call');

      // Start the call via API
      console.log('📡 [CallManagerService] Making API request to /api/voice-call');
      console.log('📤 [CallManagerService] Request payload:', {
        callerId,
        receiverId,
        action: 'start'
      });

      const response = await ApiService.post('/api/voice-call', {
        callerId: callerId,
        receiverId: receiverId,
        action: 'start'
      });
      
      console.log('📥 [CallManagerService] API Response received:', JSON.stringify(response, null, 2));
      
      if (!response.status) {
        throw new Error(response.message || 'Failed to start voice call');
      }

      // Create call session
      this.activeCall = {
        callId: response.callId,
        callerId,
        receiverId,
        callType: 'voice',
        startTime: new Date(),
        maxDuration: Math.min(response.maxCallLimitTime || this.MAX_CALL_DURATION_MINUTES, this.MAX_CALL_DURATION_MINUTES)
      };

      // Set up automatic call ending
      this.setupAutoEndCall();
      
      // Set up safety monitoring
      this.setupCallSafetyMonitoring();

      console.log('✅ [CallManagerService] Voice call started successfully', {
        callId: this.activeCall.callId,
        maxDuration: this.activeCall.maxDuration,
        startTime: this.activeCall.startTime,
        callType: this.activeCall.callType
      });

      console.log('🎯 [CallManagerService] Call session created:', {
        sessionId: this.activeCall.callId,
        duration: `${this.activeCall.maxDuration} minutes`,
        autoEndTime: new Date(Date.now() + (this.activeCall.maxDuration * 60 * 1000)).toISOString()
      });

      return response;
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to start voice call:', error);
      throw error;
    }
  }

  /**
   * Start a video call with comprehensive safety measures
   */
  async startVideoCall(callerId: number, receiverId: number): Promise<any> {
    try {
      console.log('📹 [CallManagerService] Starting video call...', { callerId, receiverId });

      // Check if there's already an active call
      if (this.activeCall) {
        console.warn('[CallManagerService] There is already an active call, ending it first');
        await this.forceEndCall();
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection available');
      }

      console.log('🌐 [CallManagerService] Network check passed, proceeding with API call');

      // Start the call via API
      console.log('📡 [CallManagerService] Making API request to /api/video-call');
      console.log('📤 [CallManagerService] Request payload:', {
        callerId,
        receiverId,
        action: 'start'
      });

      const response = await ApiService.post('/api/video-call', {
        callerId: callerId,
        receiverId: receiverId,
        action: 'start'
      });
      
      console.log('📥 [CallManagerService] API Response received:', JSON.stringify(response, null, 2));
      
      if (!response.status) {
        throw new Error(response.message || 'Failed to start video call');
      }

      // Create call session
      this.activeCall = {
        callId: response.callId,
        callerId,
        receiverId,
        callType: 'video',
        startTime: new Date(),
        maxDuration: Math.min(response.maxCallLimitTime || this.MAX_CALL_DURATION_MINUTES, this.MAX_CALL_DURATION_MINUTES)
      };

      // Set up automatic call ending
      this.setupAutoEndCall();
      
      // Set up safety monitoring
      this.setupCallSafetyMonitoring();

      console.log('✅ [CallManagerService] Video call started successfully', {
        callId: this.activeCall.callId,
        maxDuration: this.activeCall.maxDuration,
        startTime: this.activeCall.startTime,
        callType: this.activeCall.callType
      });

      console.log('🎯 [CallManagerService] Call session created:', {
        sessionId: this.activeCall.callId,
        duration: `${this.activeCall.maxDuration} minutes`,
        autoEndTime: new Date(Date.now() + (this.activeCall.maxDuration * 60 * 1000)).toISOString()
      });

      return response;
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to start video call:', error);
      throw error;
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<any> {
    if (!this.activeCall) {
      console.warn('[CallManagerService] No active call to end');
      return { status: false, message: 'No active call' };
    }

    try {
      console.log('📞 [CallManagerService] Ending call...', {
        callId: this.activeCall.callId,
        callType: this.activeCall.callType
      });

      // End call via API
      const response = this.activeCall.callType === 'voice'
        ? await ApiService.post('/api/voice-call', {
            callerId: this.activeCall.callerId,
            receiverId: this.activeCall.receiverId,
            action: 'end',
            callId: this.activeCall.callId
          })
        : await ApiService.post('/api/video-call', {
            callerId: this.activeCall.callerId,
            receiverId: this.activeCall.receiverId,
            action: 'end',
            callId: this.activeCall.callId
          });

      // Clean up call session
      this.clearCallTimers();
      this.activeCall = null;

      console.log('✅ [CallManagerService] Call ended successfully');
      return response;
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to end call:', error);
      throw error;
    }
  }

  /**
   * Force end call (for safety measures)
   */
  async forceEndCall(): Promise<void> {
    if (!this.activeCall) return;

    try {
      console.log('🚨 [CallManagerService] Force ending call for safety...');
      
      // End call via API
      await ApiService.post(`/api/${this.activeCall.callType}-call`, {
        callerId: this.activeCall.callerId,
        receiverId: this.activeCall.receiverId,
        action: 'end',
        callId: this.activeCall.callId,
        reason: 'force_end'
      });

      // Clean up
      this.clearCallTimers();
      this.activeCall = null;
      
      console.log('✅ [CallManagerService] Call force ended successfully');
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to force end call:', error);
      
      // Even if API fails, clean up locally to prevent infinite billing
      console.log('🛡️ [CallManagerService] Emergency cleanup - clearing timers and session');
      this.clearCallTimers();
      this.activeCall = null;
    }
  }

  /**
   * Emergency end call - used when UI call ends but CallManagerService is still active
   */
  async emergencyEndCall(): Promise<void> {
    if (!this.activeCall) {
      console.log('ℹ️ [CallManagerService] No active call to emergency end');
      return;
    }

    try {
      console.log('🚨 [CallManagerService] Emergency ending call - UI ended but service still active...');
      
      // Try to end via API first
      try {
        await ApiService.post(`/api/${this.activeCall.callType}-call`, {
          callerId: this.activeCall.callerId,
          receiverId: this.activeCall.receiverId,
          action: 'end',
          callId: this.activeCall.callId,
          reason: 'emergency_end'
        });
        console.log('✅ [CallManagerService] Emergency API call successful');
      } catch (apiError) {
        console.warn('[CallManagerService] Emergency API call failed, proceeding with local cleanup:', apiError);
      }

      // Always clean up locally
      this.clearCallTimers();
      this.activeCall = null;
      
      console.log('✅ [CallManagerService] Emergency call end completed');
    } catch (error) {
      console.error('[CallManagerService] ❌ Critical error in emergency end call:', error);
      
      // Final fallback - force cleanup
      this.clearCallTimers();
      this.activeCall = null;
    }
  }

  /**
   * Record a missed call
   */
  async recordMissedCall(callerId: number, receiverId: number, callType: 'voice' | 'video'): Promise<any> {
    try {
      console.log('📞 [CallManagerService] Recording missed call...', { callerId, receiverId, callType });

      const response = await ApiService.post(`/api/${callType}-call`, {
        callerId: callerId,
        receiverId: receiverId,
        action: 'missed'
      });

      console.log('✅ [CallManagerService] Missed call recorded successfully');
      return response;
    } catch (error) {
      console.error('[CallManagerService] ❌ Failed to record missed call:', error);
      throw error;
    }
  }

  /**
   * Get the currently active call
   */
  getActiveCall(): CallSession | null {
    return this.activeCall;
  }

  /**
   * Check if there's an active call
   */
  hasActiveCall(): boolean {
    return this.activeCall !== null;
  }

  /**
   * Get remaining call time in seconds
   */
  getRemainingCallTime(): number {
    if (!this.activeCall) return 0;
    
    const elapsed = (Date.now() - this.activeCall.startTime.getTime()) / 1000;
    const remaining = (this.activeCall.maxDuration * 60) - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Set up automatic call ending
   */
  private setupAutoEndCall(): void {
    if (!this.activeCall) return;

    const durationMs = this.activeCall.maxDuration * 60 * 1000;
    
    this.activeCall.autoEndTimer = setTimeout(async () => {
      console.log('⏰ [CallManagerService] Auto-ending call after maximum duration');
      await this.forceEndCall();
    }, durationMs);

    console.log('⏰ [CallManagerService] Auto-end timer set for', this.activeCall.maxDuration, 'minutes');
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!this.activeCall) return;

    this.activeCall.networkListener = NetInfo.addEventListener(async (state) => {
      if (!state.isConnected && this.activeCall) {
        console.log('🌐 [CallManagerService] Network disconnected, ending call for safety');
        await this.forceEndCall();
      }
    });
  }

  /**
   * Set up app state monitoring
   */
  private setupAppStateMonitoring(): void {
    // This would monitor app state changes (background/foreground)
    // Implementation depends on your app state management
    console.log('[CallManagerService] App state monitoring set up');
  }

  /**
   * Set up comprehensive call safety monitoring
   */
  private setupCallSafetyMonitoring(): void {
    if (!this.activeCall) return;

    // Set up network monitoring
    this.setupNetworkMonitoring();

    // Set up periodic health checks
    this.activeCall.healthCheckTimer = setInterval(async () => {
      if (!this.activeCall) return;

      const remainingTime = this.getRemainingCallTime();
      
      // Check if call has exceeded maximum duration
      if (remainingTime <= 0) {
        console.log('⏰ [CallManagerService] Call exceeded maximum duration, ending...');
        await this.forceEndCall();
        return;
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('🌐 [CallManagerService] Network lost during call, ending for safety...');
        await this.forceEndCall();
        return;
      }

      console.log('💚 [CallManagerService] Call health check passed, remaining time:', Math.floor(remainingTime / 60), 'minutes');
    }, this.CALL_HEALTH_CHECK_INTERVAL);

    console.log('🛡️ [CallManagerService] Call safety monitoring activated');
  }

  /**
   * Clear all call timers
   */
  private clearCallTimers(): void {
    if (this.activeCall?.autoEndTimer) {
      clearTimeout(this.activeCall.autoEndTimer);
    }
    
    if (this.activeCall?.healthCheckTimer) {
      clearInterval(this.activeCall.healthCheckTimer);
    }

    if (this.activeCall?.networkListener) {
      this.activeCall.networkListener();
    }

    if (this.activeCall?.appStateListener) {
      this.activeCall.appStateListener();
    }
  }

  /**
   * Clean up the service
   */
  cleanup(): void {
    console.log('[CallManagerService] Cleaning up call manager service...');
    
    if (this.activeCall) {
      this.forceEndCall();
    }
    
    this.clearCallTimers();
    this.activeCall = null;
    this.isInitialized = false;
    
    console.log('[CallManagerService] ✅ Cleanup completed');
  }
}

export default CallManagerService; 