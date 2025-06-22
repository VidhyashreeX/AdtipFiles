import { NativeModules, Platform, AppState, DeviceEventEmitter } from 'react-native';

// Import VideoSDK Foreground Service
let ForegroundService: any = null;
try {
  if (Platform.OS === 'android') {
    const { VideoSDKForegroundService } = NativeModules;
    ForegroundService = VideoSDKForegroundService;
  }
} catch (error) {
  console.warn('[VideoSDKForegroundService] Foreground service not available:', error);
}

export interface CallState {
  isInCall: boolean;
  callType: 'voice' | 'video';
  meetingId: string;
  participantName: string;
  callDuration: number;
  isConnected: boolean;
  participantCount: number;
}

class VideoSDKForegroundService {
  private static instance: VideoSDKForegroundService;
  private isServiceRunning: boolean = false;
  private callState: CallState | null = null;
  private callTimer: NodeJS.Timeout | null = null;
  private callStartTime: number = 0;
  private appStateSubscription: any = null;

  private constructor() {
    this.setupAppStateListener();
    this.setupEventListeners();
  }

  public static getInstance(): VideoSDKForegroundService {
    if (!VideoSDKForegroundService.instance) {
      VideoSDKForegroundService.instance = new VideoSDKForegroundService();
    }
    return VideoSDKForegroundService.instance;
  }

  /**
   * BULLETPROOF: Setup app state listener for foreground/background transitions
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[VideoSDKForegroundService] App state changed:', nextAppState);
      
      if (nextAppState === 'background' && this.callState?.isInCall) {
        this.ensureForegroundService();
      } else if (nextAppState === 'active' && this.isServiceRunning) {
        // Keep service running even in foreground for consistency
        this.updateForegroundService();
      }
    });
  }

  /**
   * BULLETPROOF: Setup event listeners for call events
   */
  private setupEventListeners(): void {
    // Listen for VideoSDK meeting events
    DeviceEventEmitter.addListener('onMeetingJoined', this.handleMeetingJoined.bind(this));
    DeviceEventEmitter.addListener('onMeetingLeft', this.handleMeetingLeft.bind(this));
    DeviceEventEmitter.addListener('onParticipantJoined', this.handleParticipantJoined.bind(this));
    DeviceEventEmitter.addListener('onParticipantLeft', this.handleParticipantLeft.bind(this));
    
    // Listen for service action events (from notification actions)
    DeviceEventEmitter.addListener('onForegroundServiceAction', this.handleServiceAction.bind(this));
  }

  /**
   * BULLETPROOF: Start foreground service with complete call information
   */
  public async startForegroundService(callData: {
    meetingId: string;
    callType: 'voice' | 'video';
    participantName: string;
    callerName: string;
    isInitiator: boolean;
  }): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        console.log('[VideoSDKForegroundService] iOS does not require foreground service');
        return true;
      }

      if (!ForegroundService) {
        console.warn('[VideoSDKForegroundService] Native foreground service not available');
        return false;
      }

      console.log('[VideoSDKForegroundService] Starting foreground service for call:', callData);

      // Initialize call state
      this.callState = {
        isInCall: true,
        callType: callData.callType,
        meetingId: callData.meetingId,
        participantName: callData.participantName,
        callDuration: 0,
        isConnected: false,
        participantCount: callData.isInitiator ? 1 : 2,
      };

      this.callStartTime = Date.now();
      this.startCallTimer();

      // Start the VideoSDK foreground service
      const serviceConfig = {
        channelId: 'adtip_call_channel',
        channelName: 'Adtip Call Notifications',
        notificationTitle: `${callData.callType === 'video' ? 'Video' : 'Voice'} Call`,
        notificationText: `In call with ${callData.participantName}`,
        notificationIcon: 'ic_launcher', // Use your app icon
        enableOngoingFlag: true,
        actions: [
          {
            id: 'end_call',
            title: 'End Call',
            icon: 'ic_call_end',
          },
          {
            id: 'mute_call',
            title: 'Mute',
            icon: 'ic_mic_off',
          },
        ],
      };

      await ForegroundService.startForegroundService(serviceConfig);
      this.isServiceRunning = true;

      console.log('[VideoSDKForegroundService] Foreground service started successfully');
      return true;
    } catch (error) {
      console.error('[VideoSDKForegroundService] Failed to start foreground service:', error);
      return false;
    }
  }

  /**
   * BULLETPROOF: Update foreground service with current call information
   */
  public async updateForegroundService(updateData?: Partial<CallState>): Promise<void> {
    try {
      if (!this.isServiceRunning || !this.callState || Platform.OS !== 'android') {
        return;
      }

      if (updateData) {
        this.callState = { ...this.callState, ...updateData };
      }

      const formattedDuration = this.formatCallDuration(this.callState.callDuration);
      const statusText = this.callState.isConnected 
        ? `Connected • ${formattedDuration} • ${this.callState.participantCount} participant${this.callState.participantCount > 1 ? 's' : ''}`
        : 'Connecting...';

      const updateConfig = {
        notificationTitle: `${this.callState.callType === 'video' ? 'Video' : 'Voice'} Call`,
        notificationText: `${this.callState.participantName} • ${statusText}`,
      };

      if (ForegroundService?.updateForegroundService) {
        await ForegroundService.updateForegroundService(updateConfig);
      }
    } catch (error) {
      console.error('[VideoSDKForegroundService] Failed to update foreground service:', error);
    }
  }

  /**
   * BULLETPROOF: Stop foreground service and cleanup
   */
  public async stopForegroundService(): Promise<void> {
    try {
      console.log('[VideoSDKForegroundService] Stopping foreground service');

      if (Platform.OS === 'android' && ForegroundService && this.isServiceRunning) {
        await ForegroundService.stopForegroundService();
      }

      this.isServiceRunning = false;
      this.callState = null;
      this.stopCallTimer();

      console.log('[VideoSDKForegroundService] Foreground service stopped successfully');
    } catch (error) {
      console.error('[VideoSDKForegroundService] Failed to stop foreground service:', error);
    }
  }

  /**
   * BULLETPROOF: Ensure foreground service is running when it should be
   */
  private async ensureForegroundService(): Promise<void> {
    if (!this.isServiceRunning && this.callState?.isInCall) {
      console.log('[VideoSDKForegroundService] Ensuring foreground service is running');
      
      const callData = {
        meetingId: this.callState.meetingId,
        callType: this.callState.callType,
        participantName: this.callState.participantName,
        callerName: this.callState.participantName,
        isInitiator: true,
      };
      
      await this.startForegroundService(callData);
    }
  }

  /**
   * BULLETPROOF: Handle VideoSDK meeting joined event
   */
  private handleMeetingJoined(data: any): void {
    console.log('[VideoSDKForegroundService] Meeting joined:', data);
    
    if (this.callState) {
      this.callState.isConnected = true;
      this.updateForegroundService();
    }
  }

  /**
   * BULLETPROOF: Handle VideoSDK meeting left event
   */
  private handleMeetingLeft(data: any): void {
    console.log('[VideoSDKForegroundService] Meeting left:', data);
    this.stopForegroundService();
  }

  /**
   * BULLETPROOF: Handle participant joined event
   */
  private handleParticipantJoined(data: any): void {
    console.log('[VideoSDKForegroundService] Participant joined:', data);
    
    if (this.callState) {
      this.callState.participantCount += 1;
      this.updateForegroundService();
    }
  }

  /**
   * BULLETPROOF: Handle participant left event
   */
  private handleParticipantLeft(data: any): void {
    console.log('[VideoSDKForegroundService] Participant left:', data);
    
    if (this.callState) {
      this.callState.participantCount = Math.max(1, this.callState.participantCount - 1);
      this.updateForegroundService();
    }
  }

  /**
   * BULLETPROOF: Handle service action events (notification button presses)
   */
  private handleServiceAction(data: { actionId: string }): void {
    console.log('[VideoSDKForegroundService] Service action received:', data);

    switch (data.actionId) {
      case 'end_call':
        this.handleEndCallAction();
        break;
      case 'mute_call':
        this.handleMuteCallAction();
        break;
      default:
        console.warn('[VideoSDKForegroundService] Unknown action:', data.actionId);
    }
  }

  /**
   * BULLETPROOF: Handle end call action from notification
   */
  private handleEndCallAction(): void {
    console.log('[VideoSDKForegroundService] End call action triggered');
    
    // Emit event to app to handle call ending
    DeviceEventEmitter.emit('endCallFromForegroundService');
    
    // Stop foreground service
    this.stopForegroundService();
  }

  /**
   * BULLETPROOF: Handle mute call action from notification
   */
  private handleMuteCallAction(): void {
    console.log('[VideoSDKForegroundService] Mute call action triggered');
    
    // Emit event to app to handle mute toggle
    DeviceEventEmitter.emit('toggleMuteFromForegroundService');
  }

  /**
   * BULLETPROOF: Start call duration timer
   */
  private startCallTimer(): void {
    this.stopCallTimer(); // Ensure no duplicate timers
    
    this.callTimer = setInterval(() => {
      if (this.callState) {
        this.callState.callDuration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.updateForegroundService();
      }
    }, 1000);
  }

  /**
   * BULLETPROOF: Stop call duration timer
   */
  private stopCallTimer(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  /**
   * BULLETPROOF: Format call duration for display
   */
  private formatCallDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * BULLETPROOF: Get current call state
   */
  public getCallState(): CallState | null {
    return this.callState;
  }

  /**
   * BULLETPROOF: Check if service is running
   */
  public isServiceActive(): boolean {
    return this.isServiceRunning;
  }

  /**
   * BULLETPROOF: Cleanup and destroy service
   */
  public destroy(): void {
    console.log('[VideoSDKForegroundService] Destroying service');
    
    this.stopForegroundService();
    this.stopCallTimer();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    // Remove all event listeners
    DeviceEventEmitter.removeAllListeners('onMeetingJoined');
    DeviceEventEmitter.removeAllListeners('onMeetingLeft');
    DeviceEventEmitter.removeAllListeners('onParticipantJoined');
    DeviceEventEmitter.removeAllListeners('onParticipantLeft');
    DeviceEventEmitter.removeAllListeners('onForegroundServiceAction');
  }
}

export default VideoSDKForegroundService;
