import { NativeModules, NativeEventEmitter } from 'react-native';

const { IncomingCallModule } = NativeModules;

class IncomingCallService {
  private static instance: IncomingCallService;
  private eventEmitter: NativeEventEmitter;

  private constructor() {
    this.eventEmitter = new NativeEventEmitter(IncomingCallModule);
  }

  public static getInstance(): IncomingCallService {
    if (!IncomingCallService.instance) {
      IncomingCallService.instance = new IncomingCallService();
    }
    return IncomingCallService.instance;
  }

  /**
   * Listen for incoming call broadcasts from native Android
   */
  public onIncomingCall(callback: (callData: any) => void): () => void {
    const subscription = this.eventEmitter.addListener(
      'ADTIP_INCOMING_CALL_RECEIVED',
      callback
    );

    return () => subscription.remove();
  }

  /**
   * Add listener (required for React Native 0.65+)
   */
  public addListener(eventName: string): void {
    if (IncomingCallModule && IncomingCallModule.addListener) {
      IncomingCallModule.addListener(eventName);
    }
  }

  /**
   * Remove listeners (required for React Native 0.65+)
   */
  public removeListeners(count: number): void {
    if (IncomingCallModule && IncomingCallModule.removeListeners) {
      IncomingCallModule.removeListeners(count);
    }
  }
}

export default IncomingCallService;
