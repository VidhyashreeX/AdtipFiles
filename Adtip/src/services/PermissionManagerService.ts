/**
 * PermissionManagerService - Centralized Permission Management
 * 
 * This service centralizes all permission requests to prevent:
 * - Duplicate permission prompts
 * - Inconsistent permission states
 * - Memory leaks from repeated permission checks
 * 
 * Handles: Notifee, FCM, Camera, Microphone, Phone
 */

import { Platform, Alert, Linking } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import notifee, { AuthorizationStatus as NotifeeAuthStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PermissionState {
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
  phone: boolean;
  lastChecked: number;
}

interface PermissionManagerConfig {
  cacheTimeout: number; // Cache timeout in milliseconds
  maxRetries: number;
}

class PermissionManagerService {
  private static instance: PermissionManagerService;
  private permissionState: PermissionState = {
    notifications: false,
    camera: false,
    microphone: false,
    phone: false,
    lastChecked: 0
  };
  
  private isCheckingPermissions = false;
  private isRequestingPermissions = false;
  private pendingRequests = new Set<string>();
  
  private config: PermissionManagerConfig = {
    cacheTimeout: 30000, // 30 seconds cache
    maxRetries: 3
  };

  private constructor() {}

  public static getInstance(): PermissionManagerService {
    if (!PermissionManagerService.instance) {
      PermissionManagerService.instance = new PermissionManagerService();
    }
    return PermissionManagerService.instance;
  }

  /**
   * Initialize permission manager and check all permissions
   */
  public async initialize(): Promise<void> {
    console.log('[PermissionManager] Initializing permission manager...');
    await this.checkAllPermissions();
    console.log('[PermissionManager] Permission manager initialized');
  }

  /**
   * Check all permissions with caching
   */
  public async checkAllPermissions(forceRefresh = false): Promise<PermissionState> {
    if (this.isCheckingPermissions) {
      console.log('[PermissionManager] Permission check already in progress');
      return this.permissionState;
    }

    const now = Date.now();
    const isCacheValid = !forceRefresh && (now - this.permissionState.lastChecked) < this.config.cacheTimeout;
    
    if (isCacheValid) {
      console.log('[PermissionManager] Using cached permission state');
      return this.permissionState;
    }

    this.isCheckingPermissions = true;

    try {
      console.log('[PermissionManager] Checking all permissions...');

      // Check notification permissions (both FCM and Notifee)
      const notificationPermission = await this.checkNotificationPermissions();
      
      // Check camera permission
      const cameraPermission = await this.checkCameraPermission();
      
      // Check microphone permission
      const microphonePermission = await this.checkMicrophonePermission();
      
      // Check phone permission (Android only)
      const phonePermission = await this.checkPhonePermission();

      this.permissionState = {
        notifications: notificationPermission,
        camera: cameraPermission,
        microphone: microphonePermission,
        phone: phonePermission,
        lastChecked: now
      };

      console.log('[PermissionManager] Permission check complete:', this.permissionState);
      return this.permissionState;

    } catch (error) {
      console.error('[PermissionManager] Error checking permissions:', error);
      return this.permissionState;
    } finally {
      this.isCheckingPermissions = false;
    }
  }

  /**
   * Request notification permissions (centralized)
   */
  public async requestNotificationPermissions(): Promise<boolean> {
    const permissionKey = 'notifications';

    if (this.pendingRequests.has(permissionKey)) {
      console.log('[PermissionManager] Notification permission request already in progress');
      return this.permissionState.notifications;
    }

    this.pendingRequests.add(permissionKey);

    try {
      console.log('[PermissionManager] Requesting notification permissions...');

      let granted = false;

      if (Platform.OS === 'android') {
        // Add safety check for app state and UI availability
        if (!this.isAppReadyForPermissionRequest()) {
          console.warn('[PermissionManager] App not ready for permission request, waiting...');

          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (!this.isAppReadyForPermissionRequest()) {
            console.warn('[PermissionManager] App still not ready, skipping permission request');
            return this.permissionState.notifications;
          }
        }

        // Request Notifee permissions first with error handling
        let notifeeGranted = false;
        try {
          const notifeeStatus = await notifee.requestPermission();
          notifeeGranted = notifeeStatus?.authorizationStatus === NotifeeAuthStatus.AUTHORIZED;
        } catch (notifeeError) {
          console.error('[PermissionManager] Notifee permission request failed:', notifeeError);
          // Continue with FCM permissions even if Notifee fails
        }

        // Then request FCM permissions with error handling
        let fcmGranted = false;
        try {
          const fcmStatus = await messaging().requestPermission({
            sound: true,
            alert: true,
            badge: true,
          });
          fcmGranted = fcmStatus === AuthorizationStatus.AUTHORIZED ||
                      fcmStatus === AuthorizationStatus.PROVISIONAL;
        } catch (fcmError) {
          console.error('[PermissionManager] FCM permission request failed:', fcmError);
        }

        granted = notifeeGranted && fcmGranted;
        console.log('[PermissionManager] Android notification permissions:', {
          notifee: notifeeGranted,
          fcm: fcmGranted,
          overall: granted
        });

      } else {
        // iOS - Request FCM permissions (includes notification permissions)
        const status = await messaging().requestPermission({
          sound: true,
          alert: true,
          badge: true,
          announcement: true,
          carPlay: true,
          criticalAlert: true,
          provisional: false,
        });

        granted = status === AuthorizationStatus.AUTHORIZED ||
                 status === AuthorizationStatus.PROVISIONAL;
        console.log('[PermissionManager] iOS notification permissions:', { status, granted });
      }

      // Update cache
      this.permissionState.notifications = granted;
      this.permissionState.lastChecked = Date.now();

      return granted;

    } catch (error) {
      console.error('[PermissionManager] Error requesting notification permissions:', error);
      return false;
    } finally {
      this.pendingRequests.delete(permissionKey);
    }
  }

  /**
   * Request call permissions (camera + microphone)
   */
  public async requestCallPermissions(includeCamera = true): Promise<{ camera: boolean; microphone: boolean }> {
    const permissionKey = includeCamera ? 'call_permissions_full' : 'call_permissions_audio';
    
    if (this.pendingRequests.has(permissionKey)) {
      console.log('[PermissionManager] Call permission request already in progress');
      return { 
        camera: this.permissionState.camera, 
        microphone: this.permissionState.microphone 
      };
    }

    this.pendingRequests.add(permissionKey);

    try {
      console.log('[PermissionManager] Requesting call permissions...', { includeCamera });

      if (Platform.OS === 'android') {
        const permissionsToRequest: (typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS])[] = [];
        
        // Always request microphone for calls
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        
        // Request camera only for video calls
        if (includeCamera) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }

        // Request phone permission for Android 14+
        if (Platform.Version >= 34) {
          try {
            permissionsToRequest.push('android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any);
          } catch (error) {
            console.warn('[PermissionManager] Foreground service permission not available:', error);
          }
        }

        const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        
        const microphoneGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const cameraGranted = includeCamera ? 
          (results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED) : 
          this.permissionState.camera;

        // Update cache
        this.permissionState.microphone = microphoneGranted;
        if (includeCamera) {
          this.permissionState.camera = cameraGranted;
        }
        this.permissionState.lastChecked = Date.now();

        console.log('[PermissionManager] Call permissions result:', { 
          microphone: microphoneGranted, 
          camera: cameraGranted 
        });

        return { camera: cameraGranted, microphone: microphoneGranted };

      } else {
        // iOS - Permissions are handled by the system
        // We just update our cache based on the assumption they'll be granted
        this.permissionState.microphone = true;
        if (includeCamera) {
          this.permissionState.camera = true;
        }
        this.permissionState.lastChecked = Date.now();

        return { camera: true, microphone: true };
      }

    } catch (error) {
      console.error('[PermissionManager] Error requesting call permissions:', error);
      return { camera: false, microphone: false };
    } finally {
      this.pendingRequests.delete(permissionKey);
    }
  }

  /**
   * Show permission rationale and navigate to settings
   */
  public showPermissionRationale(permissionType: 'notifications' | 'camera' | 'microphone' | 'call'): void {
    const messages = {
      notifications: {
        title: 'Notification Permission Required',
        message: 'Notification permission is required to receive incoming calls and important updates. Please enable notifications in Settings.'
      },
      camera: {
        title: 'Camera Permission Required',
        message: 'Camera permission is required for video calls. Please enable camera access in Settings.'
      },
      microphone: {
        title: 'Microphone Permission Required',
        message: 'Microphone permission is required to make and receive calls. Please enable microphone access in Settings.'
      },
      call: {
        title: 'Call Permissions Required',
        message: 'Camera and microphone permissions are required for calls. Please enable these permissions in Settings.'
      }
    };

    const config = messages[permissionType];

    Alert.alert(
      config.title,
      config.message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            Linking.openSettings().catch(error => {
              console.error('[PermissionManager] Failed to open settings:', error);
            });
          }
        }
      ]
    );
  }

  /**
   * Get current permission state
   */
  public getPermissionState(): PermissionState {
    return { ...this.permissionState };
  }

  /**
   * Check if all call permissions are granted
   */
  public hasCallPermissions(includeCamera = false): boolean {
    return this.permissionState.microphone && 
           (!includeCamera || this.permissionState.camera);
  }

  /**
   * Check if notification permissions are granted
   */
  public hasNotificationPermissions(): boolean {
    return this.permissionState.notifications;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Check if app is ready for permission requests (prevents NullPointerException)
   */
  private isAppReadyForPermissionRequest(): boolean {
    try {
      // Check if we're in a valid app state
      const { AppState } = require('react-native');
      const currentState = AppState.currentState;

      if (currentState !== 'active') {
        console.log('[PermissionManager] App not in active state:', currentState);
        return false;
      }

      // Additional safety checks for Android
      if (Platform.OS === 'android') {
        // Check if we have a valid activity context
        // This helps prevent the NullPointerException when UI is not ready
        const { DeviceEventEmitter } = require('react-native');
        if (!DeviceEventEmitter) {
          console.log('[PermissionManager] DeviceEventEmitter not available');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[PermissionManager] Error checking app readiness:', error);
      return false;
    }
  }

  private async checkNotificationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Check both Notifee and FCM permissions
        const notifeeSettings = await notifee.getNotificationSettings();
        const notifeeGranted = notifeeSettings.authorizationStatus === NotifeeAuthStatus.AUTHORIZED;
        
        const fcmStatus = await messaging().hasPermission();
        const fcmGranted = fcmStatus === AuthorizationStatus.AUTHORIZED || 
                          fcmStatus === AuthorizationStatus.PROVISIONAL;

        return notifeeGranted && fcmGranted;
      } else {
        const status = await messaging().hasPermission();
        return status === AuthorizationStatus.AUTHORIZED || 
               status === AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('[PermissionManager] Error checking notification permissions:', error);
      return false;
    }
  }

  private async checkCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      } else {
        // iOS - assume granted (will be checked at runtime)
        return true;
      }
    } catch (error) {
      console.error('[PermissionManager] Error checking camera permission:', error);
      return false;
    }
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      } else {
        // iOS - assume granted (will be checked at runtime)
        return true;
      }
    } catch (error) {
      console.error('[PermissionManager] Error checking microphone permission:', error);
      return false;
    }
  }

  private async checkPhonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 34) {
        // Check foreground service permission for Android 14+
        return await PermissionsAndroid.check('android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any);
      } else {
        return true;
      }
    } catch (error) {
      console.error('[PermissionManager] Error checking phone permission:', error);
      return false;
    }
  }

  /**
   * Reset permission cache (useful for testing or when permissions change externally)
   */
  public resetCache(): void {
    this.permissionState.lastChecked = 0;
    console.log('[PermissionManager] Permission cache reset');
  }

  /**
   * Cleanup method for service shutdown
   */
  public cleanup(): void {
    this.pendingRequests.clear();
    this.isCheckingPermissions = false;
    this.isRequestingPermissions = false;
    this.resetCache();
    console.log('[PermissionManager] Permission manager cleaned up');
  }
}

export default PermissionManagerService;
