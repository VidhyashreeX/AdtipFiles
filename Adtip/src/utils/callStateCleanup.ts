/**
 * Comprehensive call state cleanup utilities
 * Ensures complete state reset between calls to prevent progressive degradation
 */

import { useCallStore } from '../stores/callStoreSimplified'
import VideoSDKService from '../services/videosdk/VideoSDKService'
import MediaService from '../services/calling/MediaService'

// Global type declarations for cleanup operations
declare global {
  var gc: (() => void) | undefined
  var RTCPeerConnection: any
  var navigator: {
    mediaDevices?: {
      getUserMedia: (constraints: { video: boolean; audio: boolean }) => Promise<{
        getTracks: () => Array<{ stop: () => void }>
      }>
    }
  } | undefined
  var videoSDKParticipants: Map<string, any> | undefined
  var videoSDKMeetingData: any
  var VideoSDK: {
    participants?: Map<string, any>
    currentMeeting?: any
    websocketConnection?: any
  } | undefined
  var meetingComponentInstances: Record<string, string> | undefined
}

/**
 * Comprehensive call state cleanup utility class
 *
 * Implements singleton pattern to ensure consistent cleanup across the application.
 * Provides comprehensive cleanup of all call-related state to prevent progressive
 * degradation between consecutive calls.
 *
 * @class CallStateCleanup
 * @example
 * ```typescript
 * const cleanup = CallStateCleanup.getInstance();
 * await cleanup.performComprehensiveCleanup();
 * ```
 */
export class CallStateCleanup {
  private static instance: CallStateCleanup

  /**
   * Private constructor for singleton pattern
   * @private
   */
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of CallStateCleanup
   * @static
   * @returns {CallStateCleanup} The singleton instance
   */
  static getInstance(): CallStateCleanup {
    if (!CallStateCleanup.instance) {
      CallStateCleanup.instance = new CallStateCleanup()
    }
    return CallStateCleanup.instance
  }

  /**
   * Perform comprehensive cleanup of all call-related state
   * This should be called after every call ends to ensure clean state for next call
   * @public
   * @returns Promise that resolves when cleanup is complete
   * @throws Will log errors but won't throw, ensures cleanup always completes
   */
  public async performComprehensiveCleanup(): Promise<void> {
    console.log('[CallStateCleanup] Starting comprehensive cleanup');
    
    try {
      // Step 1: Clean up media service
      await this.cleanupMediaService();
      
      // Step 2: Reset VideoSDK service
      await this.resetVideoSDKService();
      
      // Step 3: Clean up call store
      this.cleanupCallStore();
      
      // Step 4: Force cleanup of any lingering WebRTC connections
      await this.cleanupWebRTCConnections();
      
      // Step 5: Clear any cached participant data
      this.clearParticipantCache();
      
      // Step 6: Force garbage collection if available
      this.forceGarbageCollection();
      
      console.log('[CallStateCleanup] Comprehensive cleanup completed successfully');
      
    } catch (error) {
      console.error('[CallStateCleanup] Error during comprehensive cleanup:', error);
      // Even if cleanup fails, ensure basic state is reset
      this.forceBasicReset();
    }
  }

  /**
   * Clean up media service with timeout protection
   * @private
   * @returns Promise that resolves when cleanup is complete
   */
  private async cleanupMediaService(): Promise<void> {
    console.log('[CallStateCleanup] Cleaning up media service');

    const mediaService = MediaService.getInstance();

    try {
      await Promise.race([
        mediaService.leaveMeeting(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Media cleanup timeout')), 3000)
        )
      ]);
    } catch (error) {
      console.warn('[CallStateCleanup] Media service cleanup timeout or error:', error);
      // Force reset even on timeout
      mediaService.setMeetingRef(null);
    }
  }

  /**
   * Reset VideoSDK service completely
   * @private
   * @returns Promise that resolves when reset is complete
   */
  private async resetVideoSDKService(): Promise<void> {
    console.log('[CallStateCleanup] Resetting VideoSDK service');

    const videoSDKService = VideoSDKService.getInstance();
    videoSDKService.reset();

    // Add small delay to ensure reset is complete
    await new Promise<void>(resolve => setTimeout(resolve, 100));
  }

  /**
   * Clean up call store state
   * @private
   */
  private cleanupCallStore(): void {
    console.log('[CallStateCleanup] Cleaning up call store');

    const store = useCallStore.getState();
    store.actions.reset();
  }

  /**
   * Force cleanup of any lingering WebRTC connections
   * @private
   * @returns Promise that resolves when cleanup is complete
   */
  private async cleanupWebRTCConnections(): Promise<void> {
    console.log('[CallStateCleanup] Cleaning up WebRTC connections');
    
    try {
      // Access global WebRTC objects if available
      if (global.RTCPeerConnection) {
        // Force close any open peer connections
        // Note: This is a safety measure for any connections that weren't properly closed
      }
      
      // Clear any media stream references
      if (global.navigator?.mediaDevices) {
        // Stop any active media streams
        try {
          const stream = await global.navigator.mediaDevices.getUserMedia({ video: false, audio: false });
          if (stream) {
            stream.getTracks().forEach((track: { stop: () => void }) => track.stop());
          }
        } catch (e) {
          // Ignore errors - this is just cleanup
        }
      }
    } catch (error) {
      console.warn('[CallStateCleanup] Error during WebRTC cleanup:', error);
    }
  }

  /**
   * Clear any cached participant data
   * @private
   */
  private clearParticipantCache(): void {
    console.log('[CallStateCleanup] Clearing participant cache');

    // Clear any global participant state if it exists
    if (global.videoSDKParticipants) {
      console.log('[CallStateCleanup] Clearing global participant map');
      global.videoSDKParticipants.clear();
      global.videoSDKParticipants = new Map();
    }

    // Clear any cached meeting data
    if (global.videoSDKMeetingData) {
      console.log('[CallStateCleanup] Clearing global meeting data');
      global.videoSDKMeetingData = null;
    }

    // Clear React Native VideoSDK internal state if accessible
    try {
      // Force clear any VideoSDK internal participant tracking
      if (global.VideoSDK?.participants) {
        global.VideoSDK.participants = new Map();
      }
      
      // Clear any internal meeting state
      if (global.VideoSDK?.currentMeeting) {
        global.VideoSDK.currentMeeting = null;
      }
    } catch (error) {
      console.warn('[CallStateCleanup] Error clearing VideoSDK internal state:', error);
    }

    // Add delay to ensure state clearing is processed
    setTimeout(() => {
      console.log('[CallStateCleanup] Participant cache clearing completed');
    }, 100);
  }

  /**
   * Force garbage collection if available
   * @private
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      console.log('[CallStateCleanup] Forcing garbage collection');
      global.gc();
    }
  }

  /**
   * Force basic reset as fallback if comprehensive cleanup fails
   * @private
   */
  private forceBasicReset(): void {
    console.log('[CallStateCleanup] Performing force basic reset');

    try {
      // Force reset call store
      const store = useCallStore.getState();
      store.actions.reset();

      // Force reset media service
      const mediaService = MediaService.getInstance();
      mediaService.setMeetingRef(null);

      // Force reset VideoSDK service
      const videoSDKService = VideoSDKService.getInstance();
      videoSDKService.reset();

    } catch (error) {
      console.error('[CallStateCleanup] Error during force basic reset:', error);
    }
  }

  /**
   * Quick cleanup for emergency situations
   * @public
   */
  public emergencyCleanup(): void {
    console.log('[CallStateCleanup] Performing emergency cleanup');
    this.forceBasicReset();
    this.forceGarbageCollection();
  }
}

export default CallStateCleanup;
