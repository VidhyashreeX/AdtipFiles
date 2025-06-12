import RNCallKeep from 'react-native-callkeep';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CallKeepOptions {
  ios: {
    appName: string;
    supportsVideo: boolean;
    maximumCallGroups?: number;
    maximumCallsPerCallGroup?: number;
  };
  android: {
    alertTitle: string;
    alertDescription: string;
    cancelButton: string;
    okButton: string;
    imageName?: string;
    additionalPermissions?: string[];
    selfManaged?: boolean;
  };
}

class CallKeepService {
  private static instance: CallKeepService;
  private isInitialized = false;
  private currentCallId: string | null = null;
  
  static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService();
    }
    return CallKeepService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const options: CallKeepOptions = {
      ios: {
        appName: 'Adtip',
        supportsVideo: true,
        maximumCallGroups: 1,
        maximumCallsPerCallGroup: 1,
      },
      android: {
        alertTitle: 'Permissions Required',
        alertDescription: 'This application needs to access your phone accounts to make calls.',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'phone_account_icon',
        additionalPermissions: [],
        selfManaged: true,
      }
    };

    try {
      await RNCallKeep.setup(options);
      await this.setupEventListeners();
      this.isInitialized = true;
      console.log('[CallKeep] Service initialized successfully');
    } catch (error) {
      console.error('[CallKeep] Initialization error:', error);
      throw error;
    }
  }

  private async setupEventListeners(): Promise<void> {
    // Answer call event
    RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction);
    
    // End call event
    RNCallKeep.addEventListener('endCall', this.onEndCallAction);
    
    // Reject call event (Android)
    RNCallKeep.addEventListener('didRejectCall', this.onRejectCallAction);
    
    // Call activated event
    RNCallKeep.addEventListener('didActivateAudioSession', this.onAudioSessionActivated);
    
    // Call deactivated event
    RNCallKeep.addEventListener('didDeactivateAudioSession', this.onAudioSessionDeactivated);
    
    // Toggle mute event
    RNCallKeep.addEventListener('didToggleHoldCallAction', this.onToggleHold);
    
    // DTMF tone event
    RNCallKeep.addEventListener('didPerformDTMFAction', this.onDTMFAction);
    
    // Permissions event (Android)
    RNCallKeep.addEventListener('didChangeAudioRoute', this.onAudioRouteChange);

    console.log('[CallKeep] Event listeners setup complete');
  }

  // Event handlers
  private onAnswerCallAction = async ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeep] Answer call action:', callUUID);
    
    try {
      // Get stored call data
      const callDataStr = await AsyncStorage.getItem(`call_data_${callUUID}`);
      if (!callDataStr) {
        console.error('[CallKeep] No call data found for UUID:', callUUID);
        return;
      }

      const callData = JSON.parse(callDataStr);
      
      // Start the call (navigate to meeting screen)
      this.handleIncomingCallAnswer(callData);
      
      // Mark call as connected in CallKeep
      RNCallKeep.setCurrentCallActive(callUUID);
      
    } catch (error) {
      console.error('[CallKeep] Error handling answer call:', error);
      RNCallKeep.endCall(callUUID);
    }
  };

  private onEndCallAction = async ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeep] End call action:', callUUID);
    
    try {
      // Clean up call data
      await AsyncStorage.removeItem(`call_data_${callUUID}`);
      
      // Handle call end logic
      this.handleCallEnd(callUUID);
      
      // Reset current call
      if (this.currentCallId === callUUID) {
        this.currentCallId = null;
      }
      
    } catch (error) {
      console.error('[CallKeep] Error handling end call:', error);
    }
  };

  private onRejectCallAction = async ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeep] Reject call action:', callUUID);
    
    try {
      // Get call data to send rejection to backend
      const callDataStr = await AsyncStorage.getItem(`call_data_${callUUID}`);
      if (callDataStr) {
        const callData = JSON.parse(callDataStr);
        await this.sendCallRejection(callData);
      }
      
      // Clean up
      await AsyncStorage.removeItem(`call_data_${callUUID}`);
      this.currentCallId = null;
      
    } catch (error) {
      console.error('[CallKeep] Error handling reject call:', error);
    }
  };

  private onAudioSessionActivated = () => {
    console.log('[CallKeep] Audio session activated');
  };

  private onAudioSessionDeactivated = () => {
    console.log('[CallKeep] Audio session deactivated');
  };

  private onToggleHold = ({ callUUID, hold }: { callUUID: string; hold: boolean }) => {
    console.log('[CallKeep] Toggle hold:', callUUID, hold);
  };

  private onDTMFAction = ({ callUUID, digits }: { callUUID: string; digits: string }) => {
    console.log('[CallKeep] DTMF action:', callUUID, digits);
  };

  private onAudioRouteChange = ({ output }: { output: string }) => {
    console.log('[CallKeep] Audio route changed to:', output);
  };

  // Public methods
  async displayIncomingCall(
    callId: string,
    callerName: string,
    callType: 'voice' | 'video',
    callData: any
  ): Promise<void> {
    try {
      console.log('[CallKeep] Displaying incoming call:', { callId, callerName, callType });

      // Store call data for later use
      await AsyncStorage.setItem(`call_data_${callId}`, JSON.stringify(callData));
      
      // Set current call ID
      this.currentCallId = callId;

      // Display the incoming call
      RNCallKeep.displayIncomingCall(
        callId,
        callerName,
        callerName, // localizedCallerName
        'generic', // handleType
        callType === 'video' // hasVideo
      );

      console.log('[CallKeep] Incoming call displayed successfully');
      
    } catch (error) {
      console.error('[CallKeep] Error displaying incoming call:', error);
      throw error;
    }
  }

  async startOutgoingCall(
    callId: string,
    recipientName: string,
    callType: 'voice' | 'video'
  ): Promise<void> {
    try {
      console.log('[CallKeep] Starting outgoing call:', { callId, recipientName, callType });

      this.currentCallId = callId;

      RNCallKeep.startCall(
        callId,
        recipientName,
        recipientName, // localizedCallerName
        'generic', // handleType
        callType === 'video' // hasVideo
      );

      console.log('[CallKeep] Outgoing call started successfully');
      
    } catch (error) {
      console.error('[CallKeep] Error starting outgoing call:', error);
      throw error;
    }
  }

  async endCall(callId?: string): Promise<void> {
    try {
      const targetCallId = callId || this.currentCallId;
      if (!targetCallId) {
        console.warn('[CallKeep] No call ID to end');
        return;
      }

      console.log('[CallKeep] Ending call:', targetCallId);
      
      RNCallKeep.endCall(targetCallId);
      
      // Clean up
      await AsyncStorage.removeItem(`call_data_${targetCallId}`);
      if (this.currentCallId === targetCallId) {
        this.currentCallId = null;
      }
      
    } catch (error) {
      console.error('[CallKeep] Error ending call:', error);
    }
  }

  async setCallConnected(callId?: string): Promise<void> {
    try {
      const targetCallId = callId || this.currentCallId;
      if (!targetCallId) return;

      RNCallKeep.setCurrentCallActive(targetCallId);
      console.log('[CallKeep] Call marked as connected:', targetCallId);
      
    } catch (error) {
      console.error('[CallKeep] Error setting call connected:', error);
    }
  }

  async updateDisplay(callId: string, displayName: string): Promise<void> {
    try {
      RNCallKeep.updateDisplay(callId, displayName, displayName);
    } catch (error) {
      console.error('[CallKeep] Error updating display:', error);
    }
  }

  getCurrentCallId(): string | null {
    return this.currentCallId;
  }

  // Navigation callbacks - these will be set by the app
  private handleIncomingCallAnswer: (callData: any) => void = () => {};
  private handleCallEnd: (callId: string) => void = () => {};
  private sendCallRejection: (callData: any) => Promise<void> = async () => {};

  setCallbacks(callbacks: {
    onIncomingCallAnswer: (callData: any) => void;
    onCallEnd: (callId: string) => void;
    onCallRejection: (callData: any) => Promise<void>;
  }): void {
    this.handleIncomingCallAnswer = callbacks.onIncomingCallAnswer;
    this.handleCallEnd = callbacks.onCallEnd;
    this.sendCallRejection = callbacks.onCallRejection;
  }

  cleanup(): void {
    // Remove event listeners
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('endCall');
    RNCallKeep.removeEventListener('didRejectCall');
    RNCallKeep.removeEventListener('didActivateAudioSession');
    RNCallKeep.removeEventListener('didDeactivateAudioSession');
    RNCallKeep.removeEventListener('didToggleHoldCallAction');
    RNCallKeep.removeEventListener('didPerformDTMFAction');
    RNCallKeep.removeEventListener('didChangeAudioRoute');
    
    this.isInitialized = false;
    this.currentCallId = null;
    
    console.log('[CallKeep] Service cleaned up');
  }
}

export default CallKeepService;