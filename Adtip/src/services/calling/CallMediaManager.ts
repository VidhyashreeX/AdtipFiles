/**
 * CallMediaManager - Centralized Media Track Management
 * 
 * This service centralizes all media (mic/speaker/camera) management and cleanup
 * to ensure proper resource management regardless of how a call ends.
 */

import { DeviceEventEmitter, Platform } from 'react-native';
import { switchAudioDevice } from '@videosdk.live/react-native-sdk';
import { appEventEmitter } from '../../events/AppEventEmitter';

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
  private mediaState: MediaState = {
    micEnabled: true,
    cameraEnabled: false,
    speakerEnabled: true,
    isVideoCall: false,
  };
  
  private activeTracks: Map<string, MediaTrackInfo> = new Map();
  private currentMeeting: any = null; // Reference to VideoSDK meeting
  private callId: string | null = null;
  private initialized = false;
  private listeners: Array<(state: MediaState) => void> = [];
  private cleanupTimer: NodeJS.Timeout | null = null;

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
    
    this.callId = callId;
    this.initialized = true;
    
    // Set initial state
    this.mediaState = {
      micEnabled: true,
      cameraEnabled: isVideoCall,
      speakerEnabled: true,
      isVideoCall,
    };
    
    // Clear any existing cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Setup media event listeners
    this.setupMediaEventListeners();
    
    // Emit initial state
    this.notifyListeners();
    appEventEmitter.emit('mediaStateChanged', this.mediaState);
  }

  private notifyListeners = () => {
    this.listeners.forEach(listener => listener(this.mediaState));
  };

  /**
   * Set the VideoSDK meeting reference for direct control
   */
  public setMeeting(meeting: any): void {
    console.log('[CallMediaManager] Setting VideoSDK meeting reference');
    this.currentMeeting = meeting;
    // IMPORTANT: Conflicting sync logic that caused race conditions has been removed.
    // State synchronization is now handled unidirectionally from MeetingScreen.
  }

  /**
   * Passively updates the manager's state from the SDK without triggering a command back.
   * This is the primary method for keeping the manager in sync with the ground truth from the SDK.
   * @param sdkState An object containing the current media state from the VideoSDK.
   */
  public syncStateFromSDK(sdkState: { micOn: boolean; webcamOn: boolean }): void {
    const { micOn, webcamOn } = sdkState;
    const currentState = this.mediaState;

    // Check if the SDK state is different from the manager's state
    const micStateChanged = currentState.micEnabled !== micOn;
    const cameraStateChanged = currentState.cameraEnabled !== webcamOn;

    if (micStateChanged || cameraStateChanged) {
      console.log(`[CallMediaManager] Syncing state FROM SDK. Mic: ${micOn}, Cam: ${webcamOn}`);
      this.mediaState = {
        ...currentState,
        micEnabled: micOn,
        cameraEnabled: webcamOn,
      };
      this.notifyListeners();
    }
  }

  /**
   * Toggles the microphone. This is the single source for this user action.
   * It updates its own state, then tells the SDK to change.
   */
  public toggleMic = (): void => {
    if (!this.currentMeeting) return;
    // The desired new state is the opposite of the current state
    const newMicState = !this.mediaState.micEnabled;
    this.mediaState.micEnabled = newMicState;
    this.currentMeeting.toggleMic();
    console.log(`[CallMediaManager] Toggled mic. New state: ${newMicState}`);
    this.notifyListeners();
  };

  /**
   * Toggles the webcam. This is the single source for this user action.
   * It updates its own state, then tells the SDK to change.
   */
  public toggleWebcam = (): void => {
    if (!this.currentMeeting) return;
    const newWebcamState = !this.mediaState.cameraEnabled;
    this.mediaState.cameraEnabled = newWebcamState;
    this.currentMeeting.toggleWebcam();
    console.log(`[CallMediaManager] Toggled webcam. New state: ${newWebcamState}`);
    this.notifyListeners();
  };

  /**
   * Toggle speaker
   */
  public async toggleSpeaker(): Promise<boolean> {
    if (!this.initialized) {
      console.warn('[CallMediaManager] Not initialized');
      return false;
    }

    try {
      const newState = !this.mediaState.speakerEnabled;
      
      // Use VideoSDK audio device switching
      try {
        switchAudioDevice(newState ? 'SPEAKER_PHONE' : 'EARPIECE');
      } catch (audioError) {
        console.warn('[CallMediaManager] Audio device switching failed:', audioError);
        // Continue with state update even if switching fails
      }
      
      // Update state
      this.mediaState.speakerEnabled = newState;
      this.notifyListeners();
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
      
      console.log('[CallMediaManager] Speaker toggled:', newState ? 'ON' : 'OFF');
      return newState;
    } catch (error) {
      console.error('[CallMediaManager] Error toggling speaker:', error);
      return this.mediaState.speakerEnabled;
    }
  }

  /**
   * Force set mic state (for external control)
   */
  public setMicEnabled(enabled: boolean): void {
    if (!this.initialized) {
      console.warn('[CallMediaManager] Not initialized');
      return;
    }
    
    console.log('[CallMediaManager] Setting mic enabled:', enabled);
    
    if (this.mediaState.micEnabled === enabled) {
      console.log('[CallMediaManager] Mic already in desired state');
      return;
    }
    
    try {
      // Update state first
      this.mediaState.micEnabled = enabled;
      
      // Use VideoSDK meeting if available
      if (this.currentMeeting && typeof this.currentMeeting.toggleMic === 'function') {
        this.currentMeeting.toggleMic();
        console.log('[CallMediaManager] VideoSDK toggleMic called');
      } else {
        console.log('[CallMediaManager] No VideoSDK meeting available, state updated but mic not toggled');
      }
      
      // Notify listeners
      this.notifyListeners();
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
    } catch (error) {
      console.error('[CallMediaManager] Error setting mic enabled state:', error);
    }
  }

  /**
   * Set camera enabled state directly
   */
  public setCameraEnabled(enabled: boolean): void {
    if (!this.initialized) {
      console.warn('[CallMediaManager] Not initialized');
      return;
    }
    
    console.log('[CallMediaManager] Setting camera enabled:', enabled);
    
    if (this.mediaState.cameraEnabled === enabled) {
      console.log('[CallMediaManager] Camera already in desired state');
      return;
    }
    
    try {
      // Update state first
      this.mediaState.cameraEnabled = enabled;
      
      // Use VideoSDK meeting if available
      if (this.currentMeeting && typeof this.currentMeeting.toggleWebcam === 'function') {
        this.currentMeeting.toggleWebcam();
        console.log('[CallMediaManager] VideoSDK toggleWebcam called');
      } else {
        console.log('[CallMediaManager] No VideoSDK meeting available, state updated but camera not toggled');
      }
      
      // Notify listeners
      this.notifyListeners();
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
    } catch (error) {
      console.error('[CallMediaManager] Error setting camera enabled state:', error);
    }
  }

  /**
   * Force set speaker state (for external control)
   */
  public setSpeakerEnabled(enabled: boolean): void {
    if (this.mediaState.speakerEnabled !== enabled) {
      this.toggleSpeaker();
    }
  }

  /**
   * Subscribe to media state changes
   * Returns an unsubscribe function
   */
  public subscribe(listener: (state: MediaState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Get the current media state
   */
  public getMediaState(): MediaState {
    return { ...this.mediaState };
  }
  
  /**
   * Force update media state
   */
  public forceUpdateMediaState(partial: Partial<MediaState>): void {
    this.mediaState = { ...this.mediaState, ...partial };
    this.notifyListeners();
    appEventEmitter.emit('mediaStateChanged', this.mediaState);
  }
  
  /**
   * BULLETPROOF: Complete media cleanup
   * This is called when a call ends from ANY source (UI, notification, etc.)
   */
  public async cleanup(reason: string = 'call_ended'): Promise<void> {
    console.log('[CallMediaManager] Starting comprehensive media cleanup, reason:', reason);
    
    try {
      // 1. Disable all media first
      await this.disableAllMedia();
      
      // 2. Stop and clean up all tracked media streams/tracks
      await this.cleanupAllTracks();
      
      // 3. Reset audio routing to default
      await this.resetAudioRouting();
      
      // 4. Clear VideoSDK meeting reference
      this.currentMeeting = null;
      
      // 5. Reset state
      this.mediaState = {
        micEnabled: false,
        cameraEnabled: false,
        speakerEnabled: true,
        isVideoCall: false,
      };
      
      // 6. Clear call ID
      this.callId = null;
      this.initialized = false;
      
      // 7. Notify listeners of cleanup
      this.notifyListeners();
      appEventEmitter.emit('mediaCleanupCompleted', { reason });
      
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
    
    // Clear all tracked media
    this.activeTracks.clear();
    
    // Reset state
    this.mediaState = {
      micEnabled: false,
      cameraEnabled: false,
      speakerEnabled: true,
      isVideoCall: false,
    };
    
    // Clear references
    this.currentMeeting = null;
    this.callId = null;
    this.initialized = false;
    
    // Notify cleanup completed
    appEventEmitter.emit('mediaCleanupCompleted', { reason: 'force_cleanup' });
  }

  /**
   * Disable all media sources
   */
  private async disableAllMedia(): Promise<void> {
    console.log('[CallMediaManager] Disabling all media sources');
    
    // Disable mic if enabled
    if (this.mediaState.micEnabled && this.currentMeeting) {
      try {
        if (typeof this.currentMeeting.toggleMic === 'function') {
          this.currentMeeting.toggleMic(); // This will disable it
        }
      } catch (error) {
        console.warn('[CallMediaManager] Error disabling mic:', error);
      }
    }
    
    // Disable camera if enabled
    if (this.mediaState.cameraEnabled && this.currentMeeting) {
      try {
        if (typeof this.currentMeeting.toggleWebcam === 'function') {
          this.currentMeeting.toggleWebcam(); // This will disable it
        }
      } catch (error) {
        console.warn('[CallMediaManager] Error disabling camera:', error);
      }
    }
  }

  /**
   * Clean up all tracked media tracks
   */
  private async cleanupAllTracks(): Promise<void> {
    console.log('[CallMediaManager] Cleaning up all tracked media tracks:', this.activeTracks.size);
    
    const cleanupPromises: Promise<void>[] = [];
    
    for (const [trackId, trackInfo] of this.activeTracks.entries()) {
      cleanupPromises.push(
        new Promise((resolve) => {
          try {
            if (trackInfo.stream) {
              // Try different cleanup methods
              if (typeof trackInfo.stream.stop === 'function') {
                trackInfo.stream.stop();
              } else if (typeof trackInfo.stream.release === 'function') {
                trackInfo.stream.release();
              } else if (typeof trackInfo.stream.close === 'function') {
                trackInfo.stream.close();
              }
            }
            
            console.log(`[CallMediaManager] Cleaned up ${trackInfo.type} track:`, trackId);
          } catch (error) {
            console.warn(`[CallMediaManager] Error cleaning up track ${trackId}:`, error);
          } finally {
            resolve();
          }
        })
      );
    }
    
    // Wait for all cleanup operations with timeout
    try {
      await Promise.race([
        Promise.all(cleanupPromises),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
      ]);
    } catch (error) {
      console.warn('[CallMediaManager] Timeout or error during track cleanup:', error);
    }
    
    // Clear the tracks map
    this.activeTracks.clear();
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
    
    // Listen for call end from any source
    appEventEmitter.on('callEnded', (data) => {
      console.log('[CallMediaManager] Call ended event received:', data);
      
      // Schedule cleanup with small delay to allow UI to update
      this.cleanupTimer = setTimeout(() => {
        this.cleanup(data?.reason || 'call_ended');
      }, 100);
    });
  }

  /**
   * Check if media manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current call ID
   */
  public getCurrentCallId(): string | null {
    return this.callId;
  }

  /**
   * Get active tracks count
   */
  public getActiveTracksCount(): number {
    return this.activeTracks.size;
  }

  /**
   * Get active tracks summary
   */
  public getActiveTracksSummary(): { audio: number; video: number } {
    let audio = 0;
    let video = 0;
    
    for (const track of this.activeTracks.values()) {
      if (track.type === 'audio') audio++;
      else if (track.type === 'video') video++;
    }
    
    return { audio, video };
  }
}

export default CallMediaManager;
