import { NativeModules, Platform } from 'react-native';
import PermissionsService from './PermissionsService';

const { OngoingCall } = NativeModules;

// Track permission status to avoid repeated requests
let phoneCallPermissionGranted: boolean | null = null;

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
      
      if (OngoingCall && OngoingCall.startOngoingCallNotification) {
        console.log('[OngoingCallModule] Starting ongoing call notification');
        OngoingCall.startOngoingCallNotification(title, message);
      } else {
        console.warn('[OngoingCallModule] OngoingCall native module not available');
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error starting ongoing call notification:', error);
    }
  },
  
  stopOngoingCallNotification() {
    try {
      if (OngoingCall && OngoingCall.stopOngoingCallNotification) {
        console.log('[OngoingCallModule] Stopping ongoing call notification');
        OngoingCall.stopOngoingCallNotification();
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error stopping ongoing call notification:', error);
    }
  },

  // Reset permission status (useful for testing or after permission changes)
  resetPermissionStatus() {
    phoneCallPermissionGranted = null;
  },
};

export default OngoingCallModule;