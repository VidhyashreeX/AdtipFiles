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
  private isCleaningUp = false;
  private readonly TAG = 'CallMediaManager';
  private currentCallId: string | null = null; // Track current call ID
  private currentLocalParticipantId: string | null = null; // Track local participant ID to prevent ID confusion

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
  public initialize(callId: string, isVideoCall: boolean = false, localParticipantId: string | null = null): void {
    console.log('[CallMediaManager] Initializing for call:', callId);
    
    // ✅ Reset any existing state first to prevent state bleeding between calls
    this.resetState();
    
    // Store the current call ID
    this.currentCallId = callId;
    
    // Store the local participant ID if provided
    if (localParticipantId) {
      this.currentLocalParticipantId = localParticipantId;
      console.log(`[CallMediaManager] Setting local participant ID: ${localParticipantId}`);
    }
    
    // Set initial state in Zustand store
    const store = useCallStore.getState();
    store.actions.setMediaState({
      micEnabled: true,
      cameraEnabled: isVideoCall,
      speakerEnabled: true,
      isVideoCall,
    });
    
    // Setup media event listeners
    this.setupMediaEventListeners();
    
    console.log('[CallMediaManager] ✅ Initialized successfully');
  }

  /**
   * Reset internal state to prevent state bleeding between calls
   */
  private resetState(): void {
    console.log('[CallMediaManager] Resetting internal state');
    
    // Clear references and state
    this.currentCallId = null;
    this.currentLocalParticipantId = null;
    
    // Clear any existing cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Unsubscribe from store listeners
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    
    // Reset isCleaningUp flag
    this.isCleaningUp = false;
  }

  /**
   * Set the VideoSDK meeting reference for direct control
   */
  public setMeeting(meeting: any): void {
    // Check if meeting has already been set, to avoid duplicate references
    if (this.currentMeeting === meeting) {
      console.log('[CallMediaManager] Meeting reference already set, skipping');
      return;
    }
    
    console.log('[CallMediaManager] Setting VideoSDK meeting reference');
    this.currentMeeting = meeting;
  }

  /**
   * Get the current local participant ID
   */
  public getLocalParticipantId(): string | null {
    return this.currentLocalParticipantId;
  }

  /**
   * Set the local participant ID - useful for participant ID consistency
   */
  public setLocalParticipantId(participantId: string): void {
    if (this.currentLocalParticipantId !== participantId) {
      console.log(`[CallMediaManager] Updating local participant ID from ${this.currentLocalParticipantId} to ${participantId}`);
      this.currentLocalParticipantId = participantId;
    }
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
      store.actions.setMediaState({
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
    store.actions.setMediaState({ micEnabled: newMicState });
    
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
    store.actions.setMediaState({ cameraEnabled: newWebcamState });
    
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
      store.actions.setMediaState({ speakerEnabled: newState });
      
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
      store.actions.setMediaState({ micEnabled: enabled });
      
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
      store.actions.setMediaState({ cameraEnabled: enabled });
      
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
    store.actions.setMediaState(partial);
  }

  /**
   * Complete media cleanup with VideoSDK coordination
   */
  public async cleanup(reason: string = 'call_ended'): Promise<void> {
    if (this.isCleaningUp) {
      console.log(`[${this.TAG}] Cleanup already in progress. Ignoring new request: ${reason}`);
      return;
    }

    console.log(`[${this.TAG}] Starting media cleanup, reason:`, reason);
    this.isCleaningUp = true;
    
    // Store the meeting reference locally and immediately clear the instance variable
    // to prevent any new operations during cleanup
    const meeting = this.currentMeeting;
    this.currentMeeting = null;
    
    let leaveError = null;

    try {
      const store = useCallStore.getState();
      if (store.callStatus !== 'idle' && store.callStatus !== 'ended') {
        store.actions.setCallStatus('ending');
      }

      // First, disable all media using the SDK.
      if (meeting) {
        await this.disableAllMedia(meeting);

        // Now, leave the VideoSDK meeting with a timeout.
        if (typeof meeting.leave === 'function') {
          try {
            console.log(`[${this.TAG}] Leaving VideoSDK meeting...`);
            await Promise.race([
              meeting.leave(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Leave timeout')), 3000))
            ]);
            console.log(`[${this.TAG}] VideoSDK meeting left successfully`);
          } catch (error) {
            leaveError = error;
            console.warn(`[${this.TAG}] Error leaving VideoSDK meeting:`, error);
          }
        } else {
          console.log(`[${this.TAG}] No active meeting to leave.`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`[${this.TAG}] Critical error during cleanup:`, error);
    } finally {
      // Ensure meeting reference is cleared
      this.currentMeeting = null;
      
      try {
        await this.resetAudioRouting();
      } catch (e) {
        console.warn(`[${this.TAG}] Error resetting audio routing:`, e);
      }

      try {
        const store = useCallStore.getState();
        store.actions.setMediaState({
          micEnabled: false,
          cameraEnabled: false,
          speakerEnabled: true,
          isVideoCall: false,
        });
      } catch (e) {
        console.warn(`[${this.TAG}] Error resetting Zustand media state:`, e);
      }

      // Clean up all listeners
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      
      // ✅ Reset internal state to prevent bleeding into next call
      this.resetState();
      
      console.log(`[${this.TAG}] ✅ Media cleanup finished.`);
    }
  }
  
  /**
   * Public method to force cleanup if needed
   */
  public forceCleanupIfNeeded(): void {
    const store = useCallStore.getState();
    
    // Only perform force cleanup if we have lingering state that might affect next calls
    if (this.currentMeeting || store.mediaState.cameraEnabled || 
        store.mediaState.micEnabled || this.currentCallId || this.isCleaningUp) {
      console.log('[CallMediaManager] Detected lingering state, performing failsafe cleanup');
      this.cleanup('failsafe_cleanup');
      return;
    }
    console.log('[CallMediaManager] No lingering state detected, skipping failsafe cleanup');
  }

  /**
   * Disable all media sources with proper VideoSDK coordination
   */
  private async disableAllMedia(meeting: any): Promise<void> {
    console.log(`[${this.TAG}] Disabling all media sources...`);
    const store = useCallStore.getState();
    const { micEnabled: wasMicEnabled, cameraEnabled: wasCameraEnabled } = store.mediaState;

    if (wasMicEnabled || wasCameraEnabled) {
      // Update the store state first
      store.actions.setMediaState({
        micEnabled: false,
        cameraEnabled: false,
      });
    }

    if (!meeting) {
      console.log(`[${this.TAG}] No meeting object provided to disable media via SDK.`);
      return;
    }

    // Add a small delay to allow state updates to propagate
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      if (wasMicEnabled && typeof meeting.toggleMic === 'function') {
        meeting.toggleMic();
        console.log(`[${this.TAG}] Mic disabled via SDK.`);
      }
    } catch (error) {
      console.warn(`[${this.TAG}] Error disabling mic via SDK:`, error);
    }
    
    try {
      if (wasCameraEnabled && typeof meeting.toggleWebcam === 'function') {
        meeting.toggleWebcam();
        console.log(`[${this.TAG}] Camera disabled via SDK.`);
      }
    } catch (error) {
      console.warn(`[${this.TAG}] Error disabling camera via SDK:`, error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`[${this.TAG}] Media sources disabled.`);
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
      (state, prevState) => {
        // Only trigger cleanup when the call status CHANGES to ended/cleanup_pending
        // This prevents multiple cleanups when the status hasn't actually changed
        if ((state.callStatus === 'ended' || state.callStatus === 'cleanup_pending') && 
            prevState?.callStatus !== state.callStatus) {
          console.log('[CallMediaManager] Call ended via state change:', state.callStatus);
          
          // Cancel any previous cleanup timer to prevent duplicates
          if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
          }
          
          // Schedule cleanup with slightly longer delay to ensure proper coordination
          this.cleanupTimer = setTimeout(() => {
            this.cleanup(state.callStatus === 'cleanup_pending' ? 'call_ended_by_store' : 'call_ended_by_store');
          }, 300); // Increased to 300ms to ensure all operations are completed
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
   * Get current call ID from store or internal state
   */
  public getCurrentCallId(): string | null {
    // First check internal state
    if (this.currentCallId) {
      return this.currentCallId;
    }
    
    // Fall back to store
    const store = useCallStore.getState();
    return store.activeCall?.callId || null;
  }

  /**
   * Subscribe to media state changes
   */
  public subscribe(listener: (state: MediaState) => void): () => void {
    const store = useCallStore;
    return store.subscribe(
      (state) => listener(state.mediaState)
    );
  }
  
  /**
   * Get a summary of active media tracks
   */
  public getActiveTracksCount(): number {
    const state = useCallStore.getState().mediaState;
    let count = 0;
    if (state.micEnabled) count++;
    if (state.cameraEnabled) count++;
    return count;
  }

  public getActiveTracksSummary(): { audio: number; video: number } {
    const state = useCallStore.getState().mediaState;
    return {
      audio: state.micEnabled ? 1 : 0,
      video: state.cameraEnabled ? 1 : 0,
    };
  }
}

export default CallMediaManager.getInstance();