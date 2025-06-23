import RNCallKeep from 'react-native-callkeep';
import { Platform } from 'react-native';
import uuid from 'react-native-uuid';

export interface CallKeepConfig {
  ios: {
    appName: string;
    maximumCallsPerCallGroup?: string;
    maximumCallGroups?: string;
    supportsVideo?: boolean;
    includesCallsInRecents?: boolean;
  };  android: {
    alertTitle: string;
    alertDescription: string;
    cancelButton: string;
    okButton: string;
    imageName?: string;
    additionalPermissions: string[];
    selfManaged?: boolean;
    foregroundService?: {
      channelId: string;
      channelName: string;
      notificationTitle: string;
      notificationIcon?: string;
    };
  };
}

class CallKeepService {
  private static instance: CallKeepService;
  private isInitialized: boolean = false;
  private config: CallKeepConfig | null = null;

  private constructor() {}

  public static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService();
    }
    return CallKeepService.instance;
  }
  /**
   * Initialize CallKeep with configuration
   */
  public async initialize(config: CallKeepConfig): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[CallKeep] Already initialized');
        return true;
      }

      this.config = config;

      // FIXED: Ensure selfManaged is false for Android to prevent self-managed phone account errors
      const androidConfig = {
        ...config.android,
        selfManaged: false, // Force to false to avoid self-managed phone account issues
        foregroundService: config.android.foregroundService || {
          channelId: 'adtip_call_channel',
          channelName: 'Adtip Call Channel',
          notificationTitle: 'Adtip is running in background',
          notificationIcon: 'ic_launcher',
        },
      };

      // Setup CallKeep
      await RNCallKeep.setup({
        ios: config.ios,
        android: androidConfig,
      });

      // FIXED: Check and request permissions properly for Android
      if (Platform.OS === 'android') {
        const hasPermissions = await this.checkAndRequestPermissions();
        if (!hasPermissions) {
          console.warn('[CallKeep] Required permissions not granted, but continuing...');
          // Don't return false, allow app to continue
        }
      }

      // Register event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[CallKeep] Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[CallKeep] Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }
  /**
   * Setup event listeners for CallKeep
   */
  private setupEventListeners(): void {
    RNCallKeep.addEventListener('didReceiveStartCallAction', this.onDidReceiveStartCallAction);
    RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction);
    RNCallKeep.addEventListener('endCall', this.onEndCallAction);
    RNCallKeep.addEventListener('didActivateAudioSession', this.onDidActivateAudioSession);
    RNCallKeep.addEventListener('didDeactivateAudioSession', this.onDidDeactivateAudioSession);
    RNCallKeep.addEventListener('didDisplayIncomingCall', this.onDidDisplayIncomingCall);
    RNCallKeep.addEventListener('didPerformSetMutedCallAction', this.onDidPerformSetMutedCallAction);
    RNCallKeep.addEventListener('didToggleHoldCallAction', this.onDidToggleHoldCallAction);
    RNCallKeep.addEventListener('didPerformDTMFAction', this.onDidPerformDTMFAction);
    RNCallKeep.addEventListener('didLoadWithEvents', this.onDidLoadWithEvents);
    
    console.log('[CallKeep] Event listeners configured');
  }

  /**
   * Start an outgoing call with auto-generated UUID if not provided
   */
  public async startOutgoingCall(
    callUUID?: string, 
    handle?: string, 
    contactName?: string, 
    hasVideo?: boolean
  ): Promise<string> {
    try {
      // ✅ FIXED: Generate UUID if not provided
      const finalCallUUID = callUUID || (uuid.v4() as string);
      const finalHandle = handle || 'Unknown Contact';
      
      console.log('[CallKeep] Starting outgoing call:', { 
        callUUID: finalCallUUID, 
        handle: finalHandle, 
        contactName, 
        hasVideo 
      });
      
      await RNCallKeep.startCall(
        finalCallUUID, 
        finalHandle, 
        contactName || finalHandle, 
        'generic', 
        hasVideo || false
      );
      
      console.log('[CallKeep] Outgoing call started successfully');
      return finalCallUUID;
    } catch (error) {
      console.error('[CallKeep] Error starting outgoing call:', error);
      throw error;
    }
  }

  /**
   * Display incoming call with auto-generated UUID if not provided
   */
  public async displayIncomingCall(
    callUUID?: string,
    handle?: string,
    localizedCallerName?: string,
    handleType?: string,
    hasVideo?: boolean
  ): Promise<string> {
    try {
      // ✅ FIXED: Generate UUID if not provided
      const finalCallUUID = callUUID || (uuid.v4() as string);
      const finalHandle = handle || 'Unknown Caller';
      
      console.log('[CallKeep] Displaying incoming call:', { 
        callUUID: finalCallUUID, 
        handle: finalHandle, 
        localizedCallerName, 
        hasVideo 
      });
      
      await RNCallKeep.displayIncomingCall(
        finalCallUUID,
        finalHandle,
        localizedCallerName || finalHandle,
        handleType as any || 'generic',
        hasVideo || false
      );
      
      console.log('[CallKeep] Incoming call displayed successfully');
      return finalCallUUID;
    } catch (error) {
      console.error('[CallKeep] Error displaying incoming call:', error);
      throw error;
    }
  }

  /**
   * Generate a new call UUID
   */
  public generateCallUUID(): string {
    return uuid.v4() as string;
  }

  /**
   * End a call
   */
  public async endCall(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeep] Ending call:', callUUID);
      
      await RNCallKeep.endCall(callUUID);
      
      console.log('[CallKeep] Call ended successfully');
    } catch (error) {
      console.error('[CallKeep] Error ending call:', error);
      throw error;
    }
  }

  /**
   * Answer a call
   */
  public async answerCall(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeep] Answering call:', callUUID);
      
      await RNCallKeep.answerIncomingCall(callUUID);
      
      console.log('[CallKeep] Call answered successfully');
    } catch (error) {
      console.error('[CallKeep] Error answering call:', error);
      throw error;
    }
  }

  /**
   * Reject a call
   */
  public async rejectCall(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeep] Rejecting call:', callUUID);
      
      await RNCallKeep.rejectCall(callUUID);
      
      console.log('[CallKeep] Call rejected successfully');
    } catch (error) {
      console.error('[CallKeep] Error rejecting call:', error);
      throw error;
    }
  }

  /**
   * Set call muted
   */
  public async setMutedCall(callUUID: string, muted: boolean): Promise<void> {
    try {
      await RNCallKeep.setMutedCall(callUUID, muted);
      console.log(`[CallKeep] Call ${muted ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('[CallKeep] Error setting muted call:', error);
      throw error;
    }
  }

  /**
   * Set call on hold
   */
  public async setOnHold(callUUID: string, hold: boolean): Promise<void> {
    try {
      await RNCallKeep.setOnHold(callUUID, hold);
      console.log(`[CallKeep] Call ${hold ? 'on hold' : 'resumed'}`);
    } catch (error) {
      console.error('[CallKeep] Error setting call on hold:', error);
      throw error;
    }
  }

  /**
   * Check if CallKeep is available
   */
  public isCallKeepAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }  /**
   * Check and request required permissions for Android
   */
  private async checkAndRequestPermissions(): Promise<boolean> {
    try {
      // Check if device has phone account configured
      const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
      if (!hasPhoneAccount) {
        console.log('[CallKeep] No phone account configured');
        return false;
      }

      // Check if app is default phone account
      const isDefaultPhoneAccount = await RNCallKeep.hasDefaultPhoneAccount();
      if (!isDefaultPhoneAccount) {
        console.log('[CallKeep] App is not default phone account');
        // Don't fail here, just log it
      }

      return true;
    } catch (error) {
      console.error('[CallKeep] Permission check failed:', error);
      return false;
    }
  }

  // Event handlers
  private onDidReceiveStartCallAction = (data: any) => {
    console.log('[CallKeep] onDidReceiveStartCallAction:', data);
    // Handle outgoing call initiation if needed
  };

  private onAnswerCallAction = async (data: any) => {
    console.log('[CallKeep] onAnswerCallAction:', data);
    // CRITICAL FIX: Handle call answer
    await this.handleCallAnswered(data.callUUID);
  };

  private onEndCallAction = async (data: any) => {
    console.log('[CallKeep] onEndCallAction:', data);
    // CRITICAL FIX: Handle call end
    await this.handleCallEnded(data.callUUID);
  };

  /**
   * CRITICAL FIX: Handle call answered event
   */
  private async handleCallAnswered(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeep] Call answered:', callUUID);
      
      // Import CallService and navigationRef dynamically to avoid circular imports
      const { default: CallService } = await import('./CallService');
      const { navigationRef } = await import('../navigation/NavigationService');
      
      const activeCall = CallService.activeCall;
      if (activeCall) {
        // Update call status
        CallService.updateCallStatus('connected');
        
        // Navigate to MeetingScreen
        if (navigationRef.isReady()) {
          navigationRef.navigate('Main', {
            screen: 'Meeting',
            params: {
              meetingId: activeCall.meetingId,
              token: activeCall.token,
              callType: activeCall.callType,
              displayName: activeCall.callerName,
              recipientName: activeCall.recipientName,
              isInitiator: false, // This is an incoming call
            },
          });
        }
      }
    } catch (error) {
      console.error('[CallKeep] Error handling call answered:', error);
    }
  }

  /**
   * CRITICAL FIX: Handle call ended event
   */
  private async handleCallEnded(callUUID: string): Promise<void> {
    try {
      console.log('[CallKeep] Call ended:', callUUID);
      
      // Import CallService dynamically to avoid circular imports
      const { default: CallService } = await import('./CallService');
      
      // End the call
      await CallService.endCall('User ended call via CallKeep');
    } catch (error) {
      console.error('[CallKeep] Error handling call ended:', error);
    }
  }

  private onDidActivateAudioSession = (data: any) => {
    console.log('[CallKeep] onDidActivateAudioSession:', data);
  };

  private onDidDeactivateAudioSession = (data: any) => {
    console.log('[CallKeep] onDidDeactivateAudioSession:', data);
  };

  private onDidDisplayIncomingCall = (data: any) => {
    console.log('[CallKeep] onDidDisplayIncomingCall:', data);
  };

  private onDidPerformSetMutedCallAction = (data: any) => {
    console.log('[CallKeep] onDidPerformSetMutedCallAction:', data);
  };

  private onDidToggleHoldCallAction = (data: any) => {
    console.log('[CallKeep] onDidToggleHoldCallAction:', data);
  };

  private onDidPerformDTMFAction = (data: any) => {
    console.log('[CallKeep] onDidPerformDTMFAction:', data);
  };

  private onDidLoadWithEvents = (data: any) => {
    console.log('[CallKeep] onDidLoadWithEvents:', data);
  };

  /**
   * Cleanup and reset service
   */
  public reset(): void {
    // Remove event listeners
    RNCallKeep.removeEventListener('didReceiveStartCallAction');
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('endCall');
    RNCallKeep.removeEventListener('didActivateAudioSession');
    RNCallKeep.removeEventListener('didDeactivateAudioSession');
    RNCallKeep.removeEventListener('didDisplayIncomingCall');
    RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
    RNCallKeep.removeEventListener('didToggleHoldCallAction');
    RNCallKeep.removeEventListener('didPerformDTMFAction');
    RNCallKeep.removeEventListener('didLoadWithEvents');

    this.isInitialized = false;
    this.config = null;
    console.log('[CallKeep] Service reset');
  }
}

// ✅ FIXED: Export the class, not the instance
export default CallKeepService;