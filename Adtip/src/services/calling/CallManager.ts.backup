// src/services/calling/CallManager.ts

import { Platform, AppState, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../../events/AppEventEmitter';
import WhatsAppCallNotificationService from './WhatsAppCallNotificationService';
import CallService, { ActiveCall } from '../CallService';
import VideoSDKService from '../videosdk/VideoSDKService';
import ApiService from '../ApiService';
import FirebaseService from '../FirebaseService';

export interface CallData {
  callId: string;
  meetingId: string;
  token: string;
  callerName: string;
  callerId: string;
  recipientName: string;
  recipientId: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  callerAvatar?: string;
  recipientAvatar?: string;
}

export interface CallState {
  isInCall: boolean;
  activeCall: ActiveCall | null;
  callStatus: 'dialing' | 'ringing' | 'connecting' | 'connected' | 'ended' | null;
  lastCallEndReason?: string;
}

class CallManager {
  private static instance: CallManager;
  private notificationService: WhatsAppCallNotificationService;
  private callService: typeof CallService;
  private videoSDKService: VideoSDKService;
  private firebaseService: FirebaseService;
  
  private currentCallState: CallState = {
    isInCall: false,
    activeCall: null,
    callStatus: null
  };
  
  private isInitialized = false;
  private eventListeners: (() => void)[] = [];

  private constructor() {
    this.notificationService = WhatsAppCallNotificationService.getInstance();
    this.callService = CallService;
    this.videoSDKService = VideoSDKService.getInstance();
    this.firebaseService = FirebaseService.getInstance();
  }

  public static getInstance(): CallManager {
    if (!CallManager.instance) {
      CallManager.instance = new CallManager();
    }
    return CallManager.instance;
  }

  /**
   * Initialize the call manager
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[CallManager] Initializing...');      // Initialize services
      // await this.notificationService.requestPermissions();
      await this.videoSDKService.initialize();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Restore call state if any
      await this.restoreCallState();
      
      this.isInitialized = true;
      console.log('[CallManager] Initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[CallManager] Initialization failed:', error);
      return false;
    }
  }
  /**
   * Setup event listeners for call events
   */
  private setupEventListeners(): void {
    // Listen to CallService events
    const callStateListener = (data: any) => {
      this.updateCallState({
        isInCall: data.isInCall,
        activeCall: data.activeCall,
        callStatus: data.callStatus
      });
    };
    appEventEmitter.on('callStateChanged', callStateListener);

    // Listen to notification events
    const callAnsweredListener = async (data: { callId: string }) => {
      await this.handleCallAnswered(data.callId);
    };
    appEventEmitter.on('callAnswered', callAnsweredListener);

    const callDeclinedListener = async (data: { callId: string }) => {
      await this.handleCallDeclined(data.callId);
    };
    appEventEmitter.on('callDeclined', callDeclinedListener);

    const navigateToMeetingListener = (data: { callId: string }) => {
      this.handleNavigateToMeeting(data.callId);
    };
    appEventEmitter.on('navigateToMeeting', navigateToMeetingListener);

    // Store listeners for cleanup
    this.eventListeners = [
      () => appEventEmitter.removeListener('callStateChanged', callStateListener),
      () => appEventEmitter.removeListener('callAnswered', callAnsweredListener),
      () => appEventEmitter.removeListener('callDeclined', callDeclinedListener),
      () => appEventEmitter.removeListener('navigateToMeeting', navigateToMeetingListener)
    ];

    // Handle app state changes
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Update internal call state and handle side effects
   */
  private updateCallState(newState: Partial<CallState>): void {
    const prevState = { ...this.currentCallState };
    this.currentCallState = { ...this.currentCallState, ...newState };

    console.log('[CallManager] Call state updated:', {
      prev: prevState,
      new: this.currentCallState
    });

    // Handle state transitions
    this.handleCallStateTransition(prevState, this.currentCallState);
  }

  /**
   * Handle call state transitions
   */
  private handleCallStateTransition(prevState: CallState, newState: CallState): void {
    // Call started
    if (!prevState.isInCall && newState.isInCall && newState.activeCall) {
      this.onCallStarted(newState.activeCall);
    }
    
    // Call ended
    if (prevState.isInCall && !newState.isInCall) {
      this.onCallEnded(prevState.activeCall, newState.lastCallEndReason);
    }
    
    // Call status changed
    if (prevState.callStatus !== newState.callStatus && newState.activeCall) {
      this.onCallStatusChanged(newState.activeCall, newState.callStatus);
    }
  }

  /**
   * Handle call started
   */
  private onCallStarted(call: ActiveCall): void {
    console.log('[CallManager] Call started:', call);
    
    // For incoming calls, show notification
    if (!call.isInitiator) {
      this.notificationService.showIncomingCallNotification({
        callId: call.callId || call.meetingId,
        callerName: call.callerName,
        callType: call.callType,
        callerId: call.callerId || 'unknown',
        meetingId: call.meetingId,
        token: call.token,
        callerAvatar: undefined // TODO: Get from user data
      });
    }
  }

  /**
   * Handle call ended
   */
  private onCallEnded(call: ActiveCall | null, reason?: string): void {
    console.log('[CallManager] Call ended:', { call, reason });
    
    if (call) {
      const duration = call.timestamp ? Math.floor((Date.now() - call.timestamp) / 1000) : 0;
      
      // Show call ended notification if call was connected
      if (call.status === 'connected' && duration > 5) {
        const participantName = call.isInitiator ? call.recipientName : call.callerName;
        this.notificationService.showCallEndedNotification(
          participantName,
          duration,
          call.callType
        );
      }
    }

    // Clean up notifications
    this.notificationService.cancelAllCallNotifications();
  }

  /**
   * Handle call status changes
   */
  private onCallStatusChanged(call: ActiveCall, status: string | null): void {
    console.log('[CallManager] Call status changed:', { callId: call.callId, status });
    
    // Update ongoing notification for background calls
    if (status === 'connected' && AppState.currentState === 'background') {
      this.notificationService.showOngoingCallNotification({
        callId: call.callId || call.meetingId,
        participantName: call.isInitiator ? call.recipientName : call.callerName,
        callType: call.callType,
        startTime: call.timestamp || Date.now(),
        status: 'connected'
      });
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: string): void {
    console.log('[CallManager] App state changed:', nextAppState);
    
    if (nextAppState === 'background' && this.currentCallState.isInCall && this.currentCallState.activeCall) {
      // Show ongoing notification when app goes to background
      const call = this.currentCallState.activeCall;
      this.notificationService.showOngoingCallNotification({
        callId: call.callId || call.meetingId,
        participantName: call.isInitiator ? call.recipientName : call.callerName,
        callType: call.callType,
        startTime: call.timestamp || Date.now(),
        status: call.status === 'connected' ? 'connected' : 'connecting'
      });
    } else if (nextAppState === 'active') {
      // Hide ongoing notification when app comes to foreground
      this.notificationService.dismissOngoingCallNotification();
    }
  }

  /**
   * Start an outgoing call
   */
  public async startOutgoingCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video'
  ): Promise<boolean> {
    try {
      console.log('[CallManager] Starting outgoing call:', { recipientId, recipientName, callType });

      // Check if already in a call
      if (this.currentCallState.isInCall) {
        console.warn('[CallManager] Already in a call');
        return false;
      }

      // Use existing CallService method
      const success = await this.callService.startOutgoingCall(recipientId, recipientName, callType);
      
      if (success) {
        console.log('[CallManager] Outgoing call started successfully');
      } else {
        console.error('[CallManager] Failed to start outgoing call');
      }

      return success;
    } catch (error) {
      console.error('[CallManager] Error starting outgoing call:', error);
      return false;
    }
  }

  /**
   * Handle incoming call from FCM
   */
  public async handleIncomingCall(callData: CallData): Promise<void> {
    try {
      console.log('[CallManager] Handling incoming call:', callData);

      // Use existing CallService method
      await this.callService.handleIncomingCall({
        callId: callData.callId,
        meetingId: callData.meetingId,
        token: callData.token,
        callerId: callData.callerId,
        callerName: callData.callerName,
        callerFcmToken: '', // TODO: Get from callData if available
        callType: callData.callType
      });

      console.log('[CallManager] Incoming call handled successfully');
    } catch (error) {
      console.error('[CallManager] Error handling incoming call:', error);
    }
  }

  /**
   * Handle call answered from notification
   */
  private async handleCallAnswered(callId: string): Promise<void> {
    try {
      console.log('[CallManager] Call answered from notification:', callId);
      
      // Update call status
      this.callService.updateCallStatus('connected');
      
      // Dismiss incoming call notification
      await this.notificationService.dismissIncomingCallNotification();
      
      // Navigate to meeting screen
      appEventEmitter.emit('forceNavigateToMeeting', {
        activeCall: this.currentCallState.activeCall
      });
      
    } catch (error) {
      console.error('[CallManager] Error handling call answered:', error);
    }
  }

  /**
   * Handle call declined from notification
   */
  private async handleCallDeclined(callId: string): Promise<void> {
    try {
      console.log('[CallManager] Call declined from notification:', callId);
      
      // End the call
      await this.callService.endCall('declined_from_notification');
      
    } catch (error) {
      console.error('[CallManager] Error handling call declined:', error);
    }
  }

  /**
   * Handle navigate to meeting from notification
   */
  private handleNavigateToMeeting(callId: string): void {
    console.log('[CallManager] Navigate to meeting from notification:', callId);
    
    if (this.currentCallState.activeCall) {
      appEventEmitter.emit('forceNavigateToMeeting', {
        activeCall: this.currentCallState.activeCall
      });
    }
  }

  /**
   * End current call
   */
  public async endCall(reason?: string): Promise<void> {
    try {
      console.log('[CallManager] Ending call:', reason);
      
      await this.callService.endCall(reason);
      
    } catch (error) {
      console.error('[CallManager] Error ending call:', error);
    }
  }

  /**
   * Get current call state
   */
  public getCurrentCallState(): CallState {
    return { ...this.currentCallState };
  }

  /**
   * Check if currently in a call
   */
  public isInCall(): boolean {
    return this.currentCallState.isInCall;
  }

  /**
   * Get active call data
   */
  public getActiveCall(): ActiveCall | null {
    return this.currentCallState.activeCall;
  }

  /**
   * Restore call state from persistence
   */
  private async restoreCallState(): Promise<void> {
    try {
      // CallService handles its own state restoration
      // We just need to sync with it
      const activeCall = this.callService.activeCall;
      if (activeCall) {
        this.updateCallState({
          isInCall: true,
          activeCall: activeCall,
          callStatus: activeCall.status || 'connecting'
        });
      }
    } catch (error) {
      console.error('[CallManager] Error restoring call state:', error);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    console.log('[CallManager] Cleaning up...');
    
    // Remove event listeners
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.eventListeners = [];
    
    // Clean up services
    this.notificationService.cleanup();
    
    // Reset state
    this.currentCallState = {
      isInCall: false,
      activeCall: null,
      callStatus: null
    };
    
    this.isInitialized = false;
  }
}

export default CallManager;
