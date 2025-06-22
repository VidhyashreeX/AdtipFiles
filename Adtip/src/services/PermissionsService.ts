import { PermissionsAndroid, Platform, AppState } from 'react-native';

class PermissionsService {
  private static instance: PermissionsService;

  private constructor() {}

  public static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  public async checkAndRequestCallPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);

      const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';
      const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';

      if (audioGranted && cameraGranted) {
        console.log('[PermissionsService] Audio and Camera permissions granted.');
        return true;
      } else {
        console.warn('[PermissionsService] Call permissions denied.');
        return false;
      }
    } catch (error) {
      console.error('[PermissionsService] Failed to request permissions:', error);
      return false;
    }
  }  public async requestPhoneCallForegroundServicePermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version >= 34) {
      try {
        // First check if we already have the permission
        const hasPermission = await PermissionsAndroid.check(
          'android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any
        );
        
        if (hasPermission) {
          console.log('[PermissionsService] FOREGROUND_SERVICE_PHONE_CALL already granted');
          return true;
        }

        // Wait for app to be ready for permission request
        const isReady = await this.waitForPermissionReady();
        if (!isReady) {
          console.warn('[PermissionsService] App not ready for permission request, skipping');
          return false;
        }
        
        console.log('[PermissionsService] Requesting FOREGROUND_SERVICE_PHONE_CALL permission');
        const granted = await PermissionsAndroid.request(
          'android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any,
          {
            title: 'Phone Call Service Permission',
            message: 'Adtip needs permission to run calls in the background for better call experience.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[PermissionsService] FOREGROUND_SERVICE_PHONE_CALL permission result:', granted);
        return isGranted;
      } catch (e) {
        console.error('[PermissionsService] Error requesting FOREGROUND_SERVICE_PHONE_CALL:', e);
        return false;
      }
    }
    return true; // Not Android 14+ or not Android
  }

  /**
   * Check if the app is in a state where permissions can be requested
   */
  private isReadyForPermissionRequest(): boolean {
    // Check if app is in foreground
    const appState = AppState.currentState;
    if (appState !== 'active') {
      console.log('[PermissionsService] App not in active state:', appState);
      return false;
    }
    
    return true;
  }

  /**
   * Wait for the app to be ready for permission requests
   */
  private async waitForPermissionReady(maxWaitTime: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (!this.isReadyForPermissionRequest() && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return this.isReadyForPermissionRequest();
  }
}

export default PermissionsService.getInstance();
