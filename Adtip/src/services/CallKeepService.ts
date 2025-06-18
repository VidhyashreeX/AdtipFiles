import RNCallKeep from 'react-native-callkeep';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

class CallKeepService {
  private static instance: CallKeepService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService();
    }
    return CallKeepService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const options = {
        ios: {
          appName: 'AdTip',
          maximumCallGroups: 1,
          maximumCallsPerCallGroup: 1,
          supportsVideo: true,
          includesCallsInRecents: true,
          imageName: 'sim_icon', // Your app icon name
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Cancel',
          okButton: 'OK',
          imageName: 'sim_icon',
          additionalPermissions: [],
          selfManaged: false,
        },
      };

      await RNCallKeep.setup(options);
      this.setupEventListeners();
      this.initialized = true;
      
      console.log('[CallKeep] Service initialized successfully');
    } catch (error) {
      console.error('[CallKeep] Initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    RNCallKeep.addEventListener('answerCall', this.onAnswerCallAction);
    RNCallKeep.addEventListener('endCall', this.onEndCallAction);
    RNCallKeep.addEventListener('didPerformSetMutedCallAction', this.onToggleMute);
    RNCallKeep.addEventListener('didPerformDTMFAction', this.onDTMFAction);
    RNCallKeep.addEventListener('didReceiveStartCallAction', this.onStartCallAction);
    RNCallKeep.addEventListener('didToggleHoldCallAction', this.onToggleHold);
  }

  private onAnswerCallAction = ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeep] Answer call action:', callUUID);
    // Handle answer call
  };

  private onEndCallAction = ({ callUUID }: { callUUID: string }) => {
    console.log('[CallKeep] End call action:', callUUID);
    // Handle end call
  };

  private onToggleMute = ({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
    console.log('[CallKeep] Toggle mute:', muted, callUUID);
    // Handle mute toggle
  };

  private onDTMFAction = ({ digits, callUUID }: { digits: string; callUUID: string }) => {
    console.log('[CallKeep] DTMF action:', digits, callUUID);
    // Handle DTMF
  };

  private onStartCallAction = ({ handle, callUUID }: { handle: string; callUUID: string }) => {
    console.log('[CallKeep] Start call action:', handle, callUUID);
    // Handle start call
  };

  private onToggleHold = ({ hold, callUUID }: { hold: boolean; callUUID: string }) => {
    console.log('[CallKeep] Toggle hold:', hold, callUUID);
    // Handle hold toggle
  };

  public displayIncomingCall(uuid: string, handle: string, localizedCallerName: string, handleType: string = 'generic', hasVideo: boolean = false): void {
    RNCallKeep.displayIncomingCall(uuid, handle, localizedCallerName, handleType, hasVideo);
  }

  public endCall(uuid: string): void {
    RNCallKeep.endCall(uuid);
  }

  public endAllCalls(): void {
    RNCallKeep.endAllCalls();
  }

  public setMutedCall(uuid: string, muted: boolean): void {
    RNCallKeep.setMutedCall(uuid, muted);
  }

  public cleanup(): void {
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('endCall');
    RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
    RNCallKeep.removeEventListener('didPerformDTMFAction');
    RNCallKeep.removeEventListener('didReceiveStartCallAction');
    RNCallKeep.removeEventListener('didToggleHoldCallAction');
    
    this.initialized = false;
    console.log('[CallKeep] Service cleaned up');
  }
}

export default CallKeepService;