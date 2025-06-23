import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import PermissionsService from './PermissionsService';

const { OngoingCall } = NativeModules;

// Track permission status to avoid repeated requests
let phoneCallPermissionGranted: boolean | null = null;

const LINKING_ERROR =
  `The package 'OngoingCallModule' doesn't seem to be linked. Make sure:
\n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const OngoingCallNative = NativeModules.OngoingCallModule || {};
const eventEmitter = new NativeEventEmitter(OngoingCallNative);

const OngoingCallModule = {
  async startOngoingCallNotification(title: string, message: string) {
    try {
      // Request permission for Android 14+ (only if not already checked)
      if (Platform.OS === 'android' && Platform.Version >= 34 && phoneCallPermissionGranted === null) {
        console.log('[OngoingCallModule] First time checking FOREGROUND_SERVICE_PHONE_CALL permission');
        phoneCallPermissionGranted = await PermissionsService.requestPhoneCallForegroundServicePermission();
        
        if (!phoneCallPermissionGranted) {
          console.warn('[OngoingCallModule] FOREGROUND_SERVICE_PHONE_CALL permission denied. Using regular notification.');
        }
      }
      
      if (Platform.OS === 'android' && OngoingCallNative.startOngoingCallNotification) {
        console.log('[OngoingCallModule] Starting ongoing call notification');
        OngoingCallNative.startOngoingCallNotification(title, message);
      } else {
        console.warn('[OngoingCallModule] OngoingCall native module not available');
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error starting ongoing call notification:', error);
    }
  },
  
  updateOngoingCallNotification(message: string) {
    try {
      if (Platform.OS === 'android' && OngoingCallNative.updateOngoingCallNotification) {
        console.log('[OngoingCallModule] Updating ongoing call notification');
        OngoingCallNative.updateOngoingCallNotification(message);
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error updating ongoing call notification:', error);
    }
  },

  stopOngoingCallNotification() {
    try {
      if (Platform.OS === 'android' && OngoingCallNative.stopOngoingCallNotification) {
        console.log('[OngoingCallModule] Stopping ongoing call notification');
        OngoingCallNative.stopOngoingCallNotification();
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error stopping ongoing call notification:', error);
    }
  },

  // Reset permission status (useful for testing or after permission changes)
  resetPermissionStatus() {
    phoneCallPermissionGranted = null;
  },

  /**
   * Listen for mute toggled events from native notification
   */
  onMuteToggled(callback: (isMuted: boolean) => void): () => void {
    const subscription = eventEmitter.addListener('MuteToggled', callback);
    return () => subscription.remove();
  },
};

export default OngoingCallModule;