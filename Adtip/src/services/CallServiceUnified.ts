import { AppState, AppStateStatus, DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../events/AppEventEmitter';
import UnifiedCallService from './calling/UnifiedCallService'; // NEW: Unified call service
import { OtpVerifyResponse as User } from '../types/api';
import VideoSDKService from './videosdk/VideoSDKService';
import ApiService from './ApiService';
import { FcmTokensRequest, FcmTokensResponse } from '../types/api';

export interface ActiveCall {
  callId?: string;
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  recipientName: string;
  callerName: string;
  callerId?: string;
  callerFcmToken?: string;
  recipientId?: string;
  recipientFcmToken?: string;
  status?: 'dialing' | 'ringing' | 'connected' | 'ended';
  timestamp?: number;
}

/**
 * CallService - Main entry point for all calling functionality
 * 
 * This service now acts as a bridge to the UnifiedCallService while maintaining
 * backward compatibility with existing code. All new features should use
 * UnifiedCallService directly.
 * 
 * @deprecated Use UnifiedCallService directly for new implementations
 */
class CallService {
  private static instance: CallService;
  public activeCall: ActiveCall | null = null;
  private isInitiator: boolean = false;
  private currentUser: User | null = null;
  private videoSDKService: VideoSDKService;
  private unifiedCallService: UnifiedCallService; // NEW: Unified call service
  private callStateUpdateTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private callStateRestoreTimer: NodeJS.Timeout | null = null;
  private persistedCallStateKey = 'ADTIP_PERSISTED_CALL_STATE';
  private isAppInBackground = false;
  private lastAppState: AppStateStatus = 'active';
  private lastAppStateChangeTime: number = 0;
  private navigationReadyPromise: Promise<void> | null = null;
  private navigationReadyResolver: (() => void) | null = null;

  private constructor() {
    this.videoSDKService = VideoSDKService.getInstance();
    this.unifiedCallService = UnifiedCallService.getInstance(); // NEW: Unified call service
    this.initializeBackgroundHandling();
    this.setupEventListeners();
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('[CallService] Initializing...');
      
      // Initialize unified call service
      const success = await this.unifiedCallService.initialize();
      
      if (success) {
        console.log('[CallService] ✅ Initialized successfully');
        return true;
      } else {
        console.error('[CallService] ❌ Failed to initialize');
        return false;
      }
    } catch (error) {
      console.error('[CallService] ❌ Initialization error:', error);
      return false;
    }
  }

  /**
   * Start an outgoing call
   */
  public async startCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video',
    callerName: string,
    callerId: string
  ): Promise<boolean> {
    try {
      console.log('[CallService] Starting call via UnifiedCallService');
      
      const callData = await this.unifiedCallService.startOutgoingCall(
        recipientId,
        recipientName,
        callType,
        callerName,
        callerId
      );
      
      if (callData) {
        // Convert to ActiveCall format for backward compatibility
        this.activeCall = {
          callId: callData.callId,
          meetingId: callData.meetingId,
          token: callData.token,
          callType: callData.callType,
          isInitiator: callData.isInitiator,
          recipientName: callData.recipientName,
          callerName: callData.callerName,
          callerId: callData.callerId,
          recipientId: callData.recipientId,
          status: callData.status as any,
          timestamp: callData.startTime
        };
        
        this.isInitiator = true;
        
        // Emit legacy events for backward compatibility
        appEventEmitter.emit('callStarted', this.activeCall);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CallService] Failed to start call:', error);
      return false;
    }
  }

  /**
   * Accept an incoming call
   */
  public async acceptCall(callId?: string): Promise<boolean> {
    try {
      console.log('[CallService] Accepting call via UnifiedCallService');
      
      await this.unifiedCallService.acceptCall(callId);
      
      // Update local state
      if (this.activeCall) {
        this.activeCall.status = 'connected';
      }
      
      // Emit legacy events
      appEventEmitter.emit('callAccepted', this.activeCall);
      
      return true;
    } catch (error) {
      console.error('[CallService] Failed to accept call:', error);
      return false;
    }
  }

  /**
   * Decline an incoming call
   */
  public async declineCall(callId?: string): Promise<boolean> {
    try {
      console.log('[CallService] Declining call via UnifiedCallService');
      
      await this.unifiedCallService.declineCall(callId);
      
      // Clear local state
      this.activeCall = null;
      this.isInitiator = false;
      
      // Emit legacy events
      appEventEmitter.emit('callDeclined', { callId });
      
      return true;
    } catch (error) {
      console.error('[CallService] Failed to decline call:', error);
      return false;
    }
  }

  /**
   * End an ongoing call
   */
  public async endCall(reason?: string): Promise<boolean> {
    try {
      console.log('[CallService] Ending call via UnifiedCallService, reason:', reason);
      
      const callId = this.activeCall?.callId;
      
      await this.unifiedCallService.endCall(callId);
      
      // Clear local state
      this.activeCall = null;
      this.isInitiator = false;
      
      // Emit legacy events
      appEventEmitter.emit('callEnded', { callId, reason });
      
      return true;
    } catch (error) {
      console.error('[CallService] Failed to end call:', error);
      return false;
    }
  }

  /**
   * Get current call state
   */
  public getCallState() {
    const unifiedState = this.unifiedCallService.getCallState();
    return {
      isInCall: unifiedState.isInCall,
      activeCall: this.activeCall,
      callStatus: unifiedState.callStatus
    };
  }

  /**
   * Set VideoSDK meeting reference
   */
  public setVideoSDKMeeting(meeting: any): void {
    this.unifiedCallService.setVideoSDKMeeting(meeting);
  }

  /**
   * Toggle microphone
   */
  public async toggleMic(): Promise<boolean> {
    return await this.unifiedCallService.toggleMic();
  }

  /**
   * Toggle camera
   */
  public async toggleCamera(): Promise<boolean> {
    return await this.unifiedCallService.toggleCamera();
  }

  /**
   * Toggle speaker
   */
  public async toggleSpeaker(): Promise<boolean> {
    return await this.unifiedCallService.toggleSpeaker();
  }

  /**
   * Get media state
   */
  public getMediaState() {
    return this.unifiedCallService.getMediaState();
  }

  /**
   * Set current user
   */
  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ===== LEGACY SUPPORT METHODS =====

  /**
   * Initialize background handling (legacy)
   */
  private initializeBackgroundHandling(): void {
    console.log('[CallService] Setting up background handling (legacy mode)');
    
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes (legacy)
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const previousAppState = this.lastAppState;
    this.lastAppState = nextAppState;
    this.lastAppStateChangeTime = Date.now();

    console.log('[CallService] App state changed:', previousAppState, '->', nextAppState);

    if (nextAppState === 'background') {
      this.isAppInBackground = true;
    } else if (nextAppState === 'active') {
      this.isAppInBackground = false;
      
      // Restore call state when app comes back to foreground
      this.restoreCallStateFromBackground();
    }
  }

  /**
   * Restore call state from background (legacy)
   */
  private async restoreCallStateFromBackground(): Promise<void> {
    try {
      const unifiedState = this.unifiedCallService.getCallState();
      
      if (unifiedState.activeCall) {
        // Convert to legacy format
        this.activeCall = {
          callId: unifiedState.activeCall.callId,
          meetingId: unifiedState.activeCall.meetingId,
          token: unifiedState.activeCall.token,
          callType: unifiedState.activeCall.callType,
          isInitiator: unifiedState.activeCall.isInitiator,
          recipientName: unifiedState.activeCall.recipientName,
          callerName: unifiedState.activeCall.callerName,
          callerId: unifiedState.activeCall.callerId,
          recipientId: unifiedState.activeCall.recipientId,
          status: unifiedState.activeCall.status as any,
          timestamp: unifiedState.activeCall.startTime
        };
        
        this.isInitiator = unifiedState.activeCall.isInitiator;
        
        console.log('[CallService] Call state restored from UnifiedCallService');
      }
    } catch (error) {
      console.error('[CallService] Failed to restore call state:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to unified call service events and convert to legacy events
    appEventEmitter.on('callStateChanged', (unifiedState) => {
      try {
        if (unifiedState.activeCall) {
          // Update local activeCall for backward compatibility
          this.activeCall = {
            callId: unifiedState.activeCall.callId,
            meetingId: unifiedState.activeCall.meetingId,
            token: unifiedState.activeCall.token,
            callType: unifiedState.activeCall.callType,
            isInitiator: unifiedState.activeCall.isInitiator,
            recipientName: unifiedState.activeCall.recipientName,
            callerName: unifiedState.activeCall.callerName,
            callerId: unifiedState.activeCall.callerId,
            recipientId: unifiedState.activeCall.recipientId,
            status: unifiedState.activeCall.status as any,
            timestamp: unifiedState.activeCall.startTime
          };
          
          this.isInitiator = unifiedState.activeCall.isInitiator;
        } else {
          this.activeCall = null;
          this.isInitiator = false;
        }
        
        // Emit legacy event
        appEventEmitter.emit('callServiceStateChanged', {
          isInCall: unifiedState.isInCall,
          activeCall: this.activeCall,
          callStatus: unifiedState.callStatus
        });
      } catch (error) {
        console.error('[CallService] Error handling unified call state change:', error);
      }
    });
  }

  /**
   * Setup foreground service event listeners (legacy)
   */
  private setupForegroundServiceEventListeners(): void {
    // Listen for end call from foreground service
    DeviceEventEmitter.addListener('endCallFromForegroundService', () => {
      console.log('[CallService] End call triggered from foreground service');
      this.endCall('ended_from_foreground_service');
    });

    // Listen for mute toggle from foreground service
    DeviceEventEmitter.addListener('toggleMuteFromForegroundService', () => {
      console.log('[CallService] Mute toggle triggered from foreground service');
      this.toggleMic();
    });
  }

  // ===== LEGACY API METHODS (for backward compatibility) =====

  /**
   * Setup a VideoSDK meeting (legacy)
   * @deprecated Use UnifiedCallService directly
   */
  private async setupVideoSDKMeeting(): Promise<{ meetingId: string, token: string }> {
    try {
      console.log('[CallService] Setting up VideoSDK meeting (legacy method)');
      
      const tokenResponse = await this.videoSDKService.generateParticipantToken();
      if (!tokenResponse) {
        throw new Error('Failed to generate VideoSDK participant token');
      }
      
      const meetingId = await this.videoSDKService.createMeeting(tokenResponse);
      if (!meetingId) {
        throw new Error('Failed to create VideoSDK meeting');
      }
      
      console.log('[CallService] VideoSDK meeting setup complete:', { meetingId, token: tokenResponse });
      return {
        meetingId,
        token: tokenResponse
      };
    } catch (error) {
      console.error('[CallService] Failed to setup VideoSDK meeting:', error);
      throw error;
    }
  }

  /**
   * Store call state persistently (legacy)
   * @deprecated UnifiedCallService handles persistence automatically
   */
  private async storeCallStatePersistently(): Promise<void> {
    try {
      if (this.activeCall) {
        await AsyncStorage.setItem(this.persistedCallStateKey, JSON.stringify({
          activeCall: this.activeCall,
          isInitiator: this.isInitiator,
          timestamp: Date.now()
        }));
        console.log('[CallService] Call state stored persistently (legacy)');
      }
    } catch (error) {
      console.error('[CallService] Failed to store call state persistently:', error);
    }
  }

  /**
   * Clear persisted call state (legacy)
   * @deprecated UnifiedCallService handles persistence automatically
   */
  private async clearPersistedCallState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.persistedCallStateKey);
      console.log('[CallService] Persisted call state cleared (legacy)');
    } catch (error) {
      console.error('[CallService] Failed to clear persisted call state:', error);
    }
  }

  // ===== CLEANUP =====

  /**
   * Cleanup and destroy the service
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('[CallService] Cleaning up service');

      // Clear timers
      if (this.callStateUpdateTimer) {
        clearTimeout(this.callStateUpdateTimer);
        this.callStateUpdateTimer = null;
      }

      if (this.callStateRestoreTimer) {
        clearTimeout(this.callStateRestoreTimer);
        this.callStateRestoreTimer = null;
      }

      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      // Clear local state
      this.activeCall = null;
      this.isInitiator = false;
      this.currentUser = null;

      // Clean up unified call service
      await this.unifiedCallService.cleanup();

      console.log('[CallService] Service cleanup completed');

    } catch (error) {
      console.error('[CallService] Failed to cleanup service:', error);
    }
  }
}

export default CallService;
