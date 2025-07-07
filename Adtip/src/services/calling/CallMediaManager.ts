/**
 * CallMediaManager - Phase 2 Refactored with Zustand Integration
 * 
 * This service manages all media (mic/speaker/camera) operations without holding state.
 * All state management is delegated to Zustand store (callStore.ts).
 * 
 * Key Features:
 * - ✅ No internal state - everything in Zustand store
 * - ✅ Direct Zustand store integration via useCallStore.getState()
 * - ✅ Simplified methods focused on media control + VideoSDK interaction
 * - ✅ Proper cleanup and resource management
 * - ✅ Race condition prevention through atomic operations
 */

import { DeviceEventEmitter, Platform } from 'react-native';
import { switchAudioDevice } from '@videosdk.live/react-native-sdk';
import { useCallStore } from '../../stores/callStore';

export interface MediaState {
  micEnabled: boolean;
  cameraEnabled: boolean;
  speakerEnabled: boolean;
  isVideoCall: boolean;
}

export interface MediaTrackInfo {
  trackId: string;
  type: 'audio' | 'video';
  isActive: boolean;
  stream?: any; // MediaStream from VideoSDK
}

class CallMediaManager {
  private static instance: CallMediaManager;
  private currentMeeting: any = null; // Reference to VideoSDK meeting
  private cleanupTimer: NodeJS.Timeout | null = null;
  private storeUnsubscribe: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): CallMediaManager {
    if (!CallMediaManager.instance) {
      CallMediaManager.instance = new CallMediaManager();
    }
    return CallMediaManager.instance;
  }

  /**
   * Initialize media manager for a call
   */
  public initialize(callId: string, isVideoCall: boolean = false): void {
    console.log('[CallMediaManager] Initializing for call:', callId);
    
    // Set initial state in Zustand store
    const store = useCallStore.getState();
    store.setMediaState({
      micEnabled: true,
      cameraEnabled: isVideoCall,
      speakerEnabled: true,
      isVideoCall,
    });
    
    // Clear any existing cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Setup media event listeners
    this.setupMediaEventListeners();
    
    console.log('[CallMediaManager] ✅ Initialized successfully');
  }

  /**
   * Set the VideoSDK meeting reference for direct control
   */
  public setMeeting(meeting: any): void {
    console.log('[CallMediaManager] Setting VideoSDK meeting reference');
    this.currentMeeting = meeting;
  }

  /**
   * Passively updates the manager's state from the SDK without triggering a command back.
   * This is the primary method for keeping the manager in sync with the ground truth from the SDK.
   */
  public syncStateFromSDK(sdkState: { micOn: boolean; webcamOn: boolean }): void {
    const { micOn, webcamOn } = sdkState;
    const store = useCallStore.getState();
    const currentState = store.mediaState;

    // Check if the SDK state is different from the store state
    const micStateChanged = currentState.micEnabled !== micOn;
    const cameraStateChanged = currentState.cameraEnabled !== webcamOn;

    if (micStateChanged || cameraStateChanged) {
      console.log(`[CallMediaManager] Syncing state FROM SDK. Mic: ${micOn}, Cam: ${webcamOn}`);
      store.setMediaState({
        micEnabled: micOn,
        cameraEnabled: webcamOn,
      });
    }
  }

  /**
   * Toggle microphone
   */
  public toggleMic(): void {
    if (!this.currentMeeting) {
      console.warn('[CallMediaManager] No meeting reference available');
      return;
    }
    
    const store = useCallStore.getState();
    const newMicState = !store.mediaState.micEnabled;
    
    // Update store first
    store.setMediaState({ micEnabled: newMicState });
    
    // Then update SDK
    this.currentMeeting.toggleMic();
    console.log(`[CallMediaManager] Toggled mic. New state: ${newMicState}`);
  }

  /**
   * Toggle camera/webcam
   */
  public toggleWebcam(): void {
    if (!this.currentMeeting) {
      console.warn('[CallMediaManager] No meeting reference available');
      return;
    }
    
    const store = useCallStore.getState();
    const newWebcamState = !store.mediaState.cameraEnabled;
    
    // Update store first
    store.setMediaState({ cameraEnabled: newWebcamState });
    
    // Then update SDK
    this.currentMeeting.toggleWebcam();
    console.log(`[CallMediaManager] Toggled webcam. New state: ${newWebcamState}`);
  }

  /**
   * Toggle speaker
   */
  public async toggleSpeaker(): Promise<boolean> {
    const store = useCallStore.getState();
    
    // Check if media manager is initialized (no call is active)
    if (!store.isInCall) {
      console.warn('[CallMediaManager] No active call');
      return false;
    }

    try {
      const newState = !store.mediaState.speakerEnabled;
      
      // Use VideoSDK audio device switching
      try {
        switchAudioDevice(newState ? 'SPEAKER_PHONE' : 'EARPIECE');
      } catch (audioError) {
        console.warn('[CallMediaManager] Audio device switching failed:', audioError);
        // Continue with state update even if switching fails
      }
      
      // Update store
      store.setMediaState({ speakerEnabled: newState });
      
      console.log('[CallMediaManager] Speaker toggled:', newState ? 'ON' : 'OFF');
      return newState;
    } catch (error) {
      console.error('[CallMediaManager] Error toggling speaker:', error);
      const store = useCallStore.getState();
      return store.mediaState.speakerEnabled;
    }
  }

  /**
   * Set microphone state directly
   */
  public setMicEnabled(enabled: boolean): void {
    const store = useCallStore.getState();
    
    if (!store.isInCall) {
      console.warn('[CallMediaManager] No active call');
      return;
    }
    
    console.log('[CallMediaManager] Setting mic enabled:', enabled);
    
    if (store.mediaState.micEnabled === enabled) {
      console.log('[CallMediaManager] Mic already in desired state');
      return;
    }
    
    try {
      // Update store first
      store.setMediaState({ micEnabled: enabled });
      
      // Use VideoSDK meeting if available
      if (this.currentMeeting && typeof this.currentMeeting.toggleMic === 'function') {
        this.currentMeeting.toggleMic();
        console.log('[CallMediaManager] VideoSDK toggleMic called');
      } else {
        console.log('[CallMediaManager] No VideoSDK meeting available, state updated but mic not toggled');
      }
    } catch (error) {
      console.error('[CallMediaManager] Error setting mic enabled state:', error);
    }
  }

  /**
   * Set camera state directly
   */
  public setCameraEnabled(enabled: boolean): void {
    const store = useCallStore.getState();
    
    if (!store.isInCall) {
      console.warn('[CallMediaManager] No active call');
      return;
    }
    
    console.log('[CallMediaManager] Setting camera enabled:', enabled);
    
    if (store.mediaState.cameraEnabled === enabled) {
      console.log('[CallMediaManager] Camera already in desired state');
      return;
    }
    
    try {
      // Update store first
      store.setMediaState({ cameraEnabled: enabled });
      
      // Use VideoSDK meeting if available
      if (this.currentMeeting && typeof this.currentMeeting.toggleWebcam === 'function') {
        this.currentMeeting.toggleWebcam();
        console.log('[CallMediaManager] VideoSDK toggleWebcam called');
      } else {
        console.log('[CallMediaManager] No VideoSDK meeting available, state updated but camera not toggled');
      }
    } catch (error) {
      console.error('[CallMediaManager] Error setting camera enabled state:', error);
    }
  }

  /**
   * Set speaker state directly
   */
  public setSpeakerEnabled(enabled: boolean): void {
    const store = useCallStore.getState();
    if (store.mediaState.speakerEnabled !== enabled) {
      this.toggleSpeaker();
    }
  }

  /**
   * Get the current media state from store
   */
  public getMediaState(): MediaState {
    const store = useCallStore.getState();
    return { ...store.mediaState };
  }
  
  /**
   * Force update media state in store
   */
  public forceUpdateMediaState(partial: Partial<MediaState>): void {
    const store = useCallStore.getState();
    store.setMediaState(partial);
  }

  /**
   * Complete media cleanup with VideoSDK coordination
   */
  public async cleanup(reason: string = 'call_ended'): Promise<void> {
    console.log('[CallMediaManager] Starting media cleanup, reason:', reason);
    
    try {
      // Ensure VideoSDK meeting is properly left first
      if (this.currentMeeting && typeof this.currentMeeting.leave === 'function') {
        console.log('[CallMediaManager] Ensuring VideoSDK meeting is left before cleanup');
        try {
          await Promise.race([
            this.currentMeeting.leave(),
            new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
          ]);
          console.log('[CallMediaManager] VideoSDK meeting left successfully');
        } catch (error) {
          console.warn('[CallMediaManager] Error leaving VideoSDK meeting:', error);
        }
      }

      // Wait for VideoSDK to fully disconnect
      await new Promise(resolve => setTimeout(resolve, 300));

      // Disable all media first
      await this.disableAllMedia();
      
      // Reset audio routing to default
      await this.resetAudioRouting();
      
      // Clear VideoSDK meeting reference
      this.currentMeeting = null;
      
      // Reset state in Zustand store
      const store = useCallStore.getState();
      store.setMediaState({
        micEnabled: false,
        cameraEnabled: false,
        speakerEnabled: true,
        isVideoCall: false,
      });
      
      // Unsubscribe from store
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      
      console.log('[CallMediaManager] ✅ Media cleanup completed successfully');
      
    } catch (error) {
      console.error('[CallMediaManager] ❌ Error during media cleanup:', error);
      
      // Force cleanup even if errors occurred
      this.forceCleanup();
    }
  }

  /**
   * Force cleanup in case of errors
   */
  private forceCleanup(): void {
    console.log('[CallMediaManager] Performing force cleanup');
    
    // Reset state in Zustand store
    const store = useCallStore.getState();
    store.setMediaState({
      micEnabled: false,
      cameraEnabled: false,
      speakerEnabled: true,
      isVideoCall: false,
    });
    
    // Clear references
    this.currentMeeting = null;
    
    // Unsubscribe from store
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
  }
  
  /**
   * Public method to force cleanup if needed
   */
  public forceCleanupIfNeeded(): void {
    const store = useCallStore.getState();
    
    // Only perform force cleanup if we have lingering state that might affect next calls
    if (this.currentMeeting || store.mediaState.cameraEnabled) {
      console.log('[CallMediaManager] Detected lingering state, performing failsafe cleanup');
      this.forceCleanup();
      return;
    }
    console.log('[CallMediaManager] No lingering state detected, skipping failsafe cleanup');
  }

  /**
   * Disable all media sources with proper VideoSDK coordination
   */
  private async disableAllMedia(): Promise<void> {
    console.log('[CallMediaManager] Disabling all media sources');
    
    const store = useCallStore.getState();
    
    // Disable mic if enabled
    if (store.mediaState.micEnabled && this.currentMeeting) {
      try {
        if (typeof this.currentMeeting.toggleMic === 'function') {
          this.currentMeeting.toggleMic(); // This will disable it
          console.log('[CallMediaManager] Microphone disabled via VideoSDK');
        }
      } catch (error) {
        console.warn('[CallMediaManager] Error disabling mic:', error);
      }
    }
    
    // Disable camera if enabled
    if (store.mediaState.cameraEnabled && this.currentMeeting) {
      try {
        if (typeof this.currentMeeting.toggleWebcam === 'function') {
          this.currentMeeting.toggleWebcam(); // This will disable it
          console.log('[CallMediaManager] Camera disabled via VideoSDK');
        }
      } catch (error) {
        console.warn('[CallMediaManager] Error disabling camera:', error);
      }
    }

    // Wait for media to be fully disabled
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Reset audio routing to default
   */
  private async resetAudioRouting(): Promise<void> {
    console.log('[CallMediaManager] Resetting audio routing');
    
    try {
      // Reset to earpiece/default audio routing
      switchAudioDevice('EARPIECE');
    } catch (error) {
      console.warn('[CallMediaManager] Error resetting audio routing:', error);
      // This is non-critical, continue cleanup
    }
  }

  /**
   * Setup media event listeners
   */
  private setupMediaEventListeners(): void {
    // Listen for external media control (from notifications, etc.)
    DeviceEventEmitter.addListener('toggleMuteFromForegroundService', () => {
      console.log('[CallMediaManager] External mute toggle requested');
      this.toggleMic();
    });
    
    // Subscribe to call status changes for cleanup when call ends
    this.storeUnsubscribe = useCallStore.subscribe(
      (state) => {
        if (state.callStatus === 'ended' || state.callStatus === 'cleanup_pending') {
          console.log('[CallMediaManager] Call ended via state change:', state.callStatus);
          
          // Schedule cleanup with small delay to allow UI to update
          this.cleanupTimer = setTimeout(() => {
            this.cleanup(state.callStatus === 'cleanup_pending' ? 'call_ended' : 'call_ended');
          }, 100);
        }
      }
    );
  }

  /**
   * Check if media manager is initialized (based on call state)
   */
  public isInitialized(): boolean {
    const store = useCallStore.getState();
    return store.isInCall;
  }

  /**
   * Get current call ID from store
   */
  public getCurrentCallId(): string | null {
    const store = useCallStore.getState();
    return store.activeCall?.callId || null;
  }

  // ===== DEPRECATED METHODS (kept for compatibility) =====

  /**
   * Subscribe to media state changes (deprecated - use Zustand store directly)
   */
  public subscribe(listener: (state: MediaState) => void): () => void {
    console.warn('[CallMediaManager] subscribe() is deprecated. Use Zustand store directly: useCallStore()');
    // Return empty unsubscribe function for compatibility
    return () => {};
  }

  /**
   * Get active tracks count (deprecated - simplified implementation)
   */
  public getActiveTracksCount(): number {
    const store = useCallStore.getState();
    return store.isInCall ? (store.mediaState.isVideoCall ? 2 : 1) : 0;
  }

  /**
   * Get active tracks summary (deprecated - simplified implementation)
   */
  public getActiveTracksSummary(): { audio: number; video: number } {
    const store = useCallStore.getState();
    if (!store.isInCall) {
      return { audio: 0, video: 0 };
    }
    
    return {
      audio: store.mediaState.micEnabled ? 1 : 0,
      video: store.mediaState.cameraEnabled ? 1 : 0,
    };
  }
}

export default CallMediaManager;
