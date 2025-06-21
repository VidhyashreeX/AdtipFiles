import { PermissionsAndroid, Platform } from 'react-native';

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
  }
}

export default PermissionsService.getInstance();
