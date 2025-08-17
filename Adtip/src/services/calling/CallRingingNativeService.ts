/**
 * CallRingingNativeService - Bridge to native call ringing functionality
 * 
 * This service provides access to device default ringtone and proper vibration
 * through the native CallRingingService on Android and similar functionality on iOS
 */

import { NativeModules, Platform } from 'react-native';

interface CallRingingModuleInterface {
  startRinging(callerName: string, sessionId: string): Promise<boolean>;
  stopRinging(): Promise<boolean>;
  isRingingServiceAvailable(): Promise<boolean>;
}

class CallRingingNativeService {
  private static instance: CallRingingNativeService;
  private nativeModule: CallRingingModuleInterface | null = null;
  private isRinging: boolean = false;
  private currentSessionId: string | null = null;

  private constructor() {
    this.initializeNativeModule();
  }

  public static getInstance(): CallRingingNativeService {
    if (!CallRingingNativeService.instance) {
      CallRingingNativeService.instance = new CallRingingNativeService();
    }
    return CallRingingNativeService.instance;
  }

  /**
   * Initialize the native module
   */
  private initializeNativeModule(): void {
    try {
      if (Platform.OS === 'android') {
        this.nativeModule = NativeModules.CallRingingModule;
        if (!this.nativeModule) {
          console.warn('[CallRingingNativeService] CallRingingModule not found in NativeModules');
        }
      } else {
        // For iOS, we could implement a similar native module or use existing CallKit functionality
        console.log('[CallRingingNativeService] iOS platform - using fallback implementation');
      }
    } catch (error) {
      console.error('[CallRingingNativeService] Error initializing native module:', error);
    }
  }

  /**
   * Check if native ringing service is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      if (!this.nativeModule) {
        return false;
      }
      return await this.nativeModule.isRingingServiceAvailable();
    } catch (error) {
      console.error('[CallRingingNativeService] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Start ringing with device default ringtone and vibration
   */
  public async startRinging(callerName: string, sessionId: string): Promise<boolean> {
    try {
      console.log('[CallRingingNativeService] Starting ringing for:', callerName, sessionId);

      // Stop any existing ringing first
      if (this.isRinging) {
        await this.stopRinging();
      }

      if (!this.nativeModule) {
        console.warn('[CallRingingNativeService] Native module not available, using fallback');
        return this.startFallbackRinging(callerName, sessionId);
      }

      const success = await this.nativeModule.startRinging(callerName, sessionId);
      
      if (success) {
        this.isRinging = true;
        this.currentSessionId = sessionId;
        console.log('[CallRingingNativeService] Native ringing started successfully');
      } else {
        console.warn('[CallRingingNativeService] Native ringing failed, using fallback');
        return this.startFallbackRinging(callerName, sessionId);
      }

      return success;
    } catch (error) {
      console.error('[CallRingingNativeService] Error starting ringing:', error);
      return this.startFallbackRinging(callerName, sessionId);
    }
  }

  /**
   * Stop ringing
   */
  public async stopRinging(): Promise<boolean> {
    try {
      console.log('[CallRingingNativeService] Stopping ringing');

      if (!this.isRinging) {
        console.log('[CallRingingNativeService] Not currently ringing, nothing to stop');
        return true;
      }

      let success = true;

      if (this.nativeModule) {
        try {
          success = await this.nativeModule.stopRinging();
          console.log('[CallRingingNativeService] Native ringing stopped:', success);
        } catch (error) {
          console.error('[CallRingingNativeService] Error stopping native ringing:', error);
          success = false;
        }
      }

      // Always stop fallback ringing as well
      this.stopFallbackRinging();

      this.isRinging = false;
      this.currentSessionId = null;

      return success;
    } catch (error) {
      console.error('[CallRingingNativeService] Error stopping ringing:', error);
      return false;
    }
  }

  /**
   * Check if currently ringing
   */
  public isCurrentlyRinging(): boolean {
    return this.isRinging;
  }

  /**
   * Get current session ID if ringing
   */
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Fallback ringing implementation using React Native Vibration
   */
  private async startFallbackRinging(callerName: string, sessionId: string): Promise<boolean> {
    try {
      console.log('[CallRingingNativeService] Starting fallback ringing');
      
      // Use React Native Vibration for fallback
      const { Vibration } = await import('react-native');
      
      // Start continuous vibration pattern for incoming calls
      Vibration.vibrate([1000, 500, 1000, 500], true);
      
      this.isRinging = true;
      this.currentSessionId = sessionId;
      
      console.log('[CallRingingNativeService] Fallback ringing started');
      return true;
    } catch (error) {
      console.error('[CallRingingNativeService] Error starting fallback ringing:', error);
      return false;
    }
  }

  /**
   * Stop fallback ringing
   */
  private stopFallbackRinging(): void {
    try {
      console.log('[CallRingingNativeService] Stopping fallback ringing');
      
      // Stop vibration
      import('react-native').then(({ Vibration }) => {
        Vibration.cancel();
      });
      
      console.log('[CallRingingNativeService] Fallback ringing stopped');
    } catch (error) {
      console.error('[CallRingingNativeService] Error stopping fallback ringing:', error);
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    console.log('[CallRingingNativeService] Cleaning up');
    this.stopRinging();
  }
}

export default CallRingingNativeService;
