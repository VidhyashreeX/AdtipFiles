import { Platform, NativeModules } from 'react-native';
import Sound from 'react-native-sound';

/**
 * Audio service for playing ringing sounds during calls
 * Uses react-native-sound to play MP3 files from assets folder
 */
class RingingAudioService {
  private static instance: RingingAudioService;
  private isRinging: boolean = false;
  private ringingSound: Sound | null = null;

  private constructor() {
    // Enable playback in silence mode (iOS)
    Sound.setCategory('Playback');
  }

  static getInstance(): RingingAudioService {
    if (!RingingAudioService.instance) {
      RingingAudioService.instance = new RingingAudioService();
    }
    return RingingAudioService.instance;
  }

  /**
   * Start playing ringing sound from MP3 file
   * Plays the ringing.mp3 file from assets folder in a loop
   */
  startRinging(): void {
    if (this.isRinging) {
      console.log('[RingingAudioService] Already ringing, ignoring start request');
      return;
    }

    console.log('[RingingAudioService] Starting ringing sound from MP3');
    this.isRinging = true;

    // Load and play the ringing sound from assets
    this.loadAndPlayRingingSound();
  }

  /**
   * Stop the ringing sound
   */
  stopRinging(): void {
    if (!this.isRinging) {
      return;
    }

    console.log('[RingingAudioService] Stopping ringing sound');
    this.isRinging = false;

    // Stop and release the sound
    if (this.ringingSound) {
      this.ringingSound.stop(() => {
        if (this.ringingSound) {
          this.ringingSound.release();
          this.ringingSound = null;
        }
      });
    }
  }

  /**
   * Check if currently ringing
   */
  isCurrentlyRinging(): boolean {
    return this.isRinging;
  }

  /**
   * Load and play the ringing sound from assets folder
   * Expects a file named 'ringing.mp3' in the assets folder
   */
  private loadAndPlayRingingSound(): void {
    // Load the ringing sound from assets folder
    // The file should be placed in android/app/src/main/res/raw/ and ios bundle
    this.ringingSound = new Sound('ringing.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('[RingingAudioService] Failed to load ringing sound:', error);
        // Fallback to system beep if MP3 fails to load
        this.playSystemBeepFallback();
        return;
      }

      console.log('[RingingAudioService] Ringing sound loaded successfully');

      // Set volume and play in loop
      if (this.ringingSound && this.isRinging) {
        this.ringingSound.setVolume(1.0);
        this.ringingSound.setNumberOfLoops(-1); // Loop indefinitely
        this.ringingSound.play((success) => {
          if (!success) {
            console.error('[RingingAudioService] Failed to play ringing sound');
            // Fallback to system beep
            this.playSystemBeepFallback();
          } else {
            console.log('[RingingAudioService] Ringing sound playing in loop');
          }
        });
      }
    });
  }

  /**
   * Fallback system beep when MP3 fails to load
   * This uses platform-specific methods to play a simple beep pattern
   */
  private playSystemBeepFallback(): void {
    console.log('[RingingAudioService] Using system beep fallback');

    // Create a simple beep pattern as fallback
    let beepCount = 0;
    const maxBeeps = 2;
    const beepInterval = 800; // 800ms between beeps
    const cycleInterval = 3000; // 3s between cycles

    const playBeepCycle = () => {
      if (!this.isRinging) return;

      const playBeep = () => {
        if (!this.isRinging || beepCount >= maxBeeps) {
          beepCount = 0;
          setTimeout(playBeepCycle, cycleInterval);
          return;
        }

        this.playSystemBeep();
        beepCount++;
        setTimeout(playBeep, beepInterval);
      };

      playBeep();
    };

    playBeepCycle();
  }

  /**
   * Play a single system beep sound
   * This uses platform-specific methods to play a simple beep
   */
  private playSystemBeep(): void {
    try {
      if (Platform.OS === 'android') {
        this.playAndroidBeep();
      } else if (Platform.OS === 'ios') {
        this.playIOSBeep();
      }
    } catch (error) {
      console.error('[RingingAudioService] Error playing system beep:', error);
    }
  }

  /**
   * Play beep sound on Android
   */
  private playAndroidBeep(): void {
    try {
      // Try to use native module if available
      const { IncomingCallModule } = NativeModules;
      if (IncomingCallModule && typeof IncomingCallModule === 'object' && IncomingCallModule.playBeep) {
        IncomingCallModule.playBeep();
      } else {
        // Fallback: log the beep (in a real implementation, you might use react-native-sound)
        console.log('[RingingAudioService] 🔊 BEEP (Android)');
      }
    } catch (error) {
      console.error('[RingingAudioService] Android beep error:', error);
    }
  }

  /**
   * Play beep sound on iOS
   */
  private playIOSBeep(): void {
    try {
      // Try to use native module if available
      const { AdtipCallKitManager } = NativeModules;
      if (AdtipCallKitManager && AdtipCallKitManager.playBeep) {
        AdtipCallKitManager.playBeep();
      } else {
        // Fallback: log the beep (in a real implementation, you might use react-native-sound)
        console.log('[RingingAudioService] 🔊 BEEP (iOS)');
      }
    } catch (error) {
      console.error('[RingingAudioService] iOS beep error:', error);
    }
  }

  /**
   * Cleanup method to ensure ringing is stopped
   */
  cleanup(): void {
    this.stopRinging();
  }
}

export default RingingAudioService;
