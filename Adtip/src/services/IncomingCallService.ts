import { NativeModules, NativeEventEmitter } from 'react-native';

// Check if IncomingCallModule exists to prevent crashes
const { IncomingCallModule } = NativeModules;
const isModuleAvailable = IncomingCallModule && typeof IncomingCallModule === 'object';

class IncomingCallService {
  private static instance: IncomingCallService;
  private eventEmitter: NativeEventEmitter | null = null;

  private constructor() {
    if (isModuleAvailable) {
      try {
        this.eventEmitter = new NativeEventEmitter(IncomingCallModule);
      } catch (error) {
        console.warn('[IncomingCallService] Failed to create event emitter:', error);
        this.eventEmitter = null;
      }
    } else {
      console.warn('[IncomingCallService] IncomingCallModule not available, using fallback mode');
    }
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
    if (!this.eventEmitter) {
      console.warn('[IncomingCallService] Event emitter not available, returning no-op unsubscribe');
      return () => {}; // Return no-op unsubscribe function
    }

    try {
      const subscription = this.eventEmitter.addListener(
        'ADTIP_INCOMING_CALL_RECEIVED',
        callback
      );

      return () => subscription.remove();
    } catch (error) {
      console.warn('[IncomingCallService] Failed to add incoming call listener:', error);
      return () => {}; // Return no-op unsubscribe function
    }
  }

  /**
   * Add listener (required for React Native 0.65+)
   */
  public addListener(eventName: string): void {
    if (isModuleAvailable && IncomingCallModule && IncomingCallModule.addListener) {
      try {
        IncomingCallModule.addListener(eventName);
      } catch (error) {
        console.warn('[IncomingCallService] Failed to add listener:', error);
      }
    }
  }

  /**
   * Remove listeners (required for React Native 0.65+)
   */
  public removeListeners(count: number): void {
    if (isModuleAvailable && IncomingCallModule && IncomingCallModule.removeListeners) {
      try {
        IncomingCallModule.removeListeners(count);
      } catch (error) {
        console.warn('[IncomingCallService] Failed to remove listeners:', error);
      }
    }
  }

  /**
   * Listen for answer/decline actions from native Android
   */
  public onCallAction(callback: (event: { action: 'ANSWER' | 'DECLINE', sessionId: string }) => void): () => void {
    if (!this.eventEmitter) {
      console.warn('[IncomingCallService] Event emitter not available, returning no-op unsubscribe');
      return () => {}; // Return no-op unsubscribe function
    }

    try {
      const subscription = this.eventEmitter.addListener(
        'onCallAction',
        callback
      );
      return () => subscription.remove();
    } catch (error) {
      console.warn('[IncomingCallService] Failed to add call action listener:', error);
      return () => {}; // Return no-op unsubscribe function
    }
  }
}

export default IncomingCallService;
