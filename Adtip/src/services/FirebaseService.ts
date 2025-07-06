import { Platform } from 'react-native';
import messaging, { 
  FirebaseMessagingTypes, 
  AuthorizationStatus 
} from '@react-native-firebase/messaging';
import { getApps, getApp } from '@react-native-firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/NavigationService';
import { appEventEmitter } from '../events/AppEventEmitter';
import ApiService from './ApiService';
import UnifiedCallService from './calling/UnifiedCallService';

/**
 * CIRCULAR DEPENDENCY FIX:
 * Removed direct import of FirebaseCallService to break circular dependency.
 * FirebaseService no longer directly depends on FirebaseCallService.
 * All call-related communication now happens through events via appEventEmitter.
 */

export interface CallNotificationData {
  callerName: string;
  callType: string;
  channelName?: string;
  rtcToken?: string;
  callerRtcUid?: string;
  isFromNotification: boolean;
  meetingId?: string;
}

class FirebaseService {
  private static instance: FirebaseService;
  private messagingReady: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase Messaging with v22.2.1 APIs
   */
  public async initializeMessaging(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeMessaging();
    return this.initializationPromise;
  }

  private async _initializeMessaging(): Promise<boolean> {
    try {
      // Check if Firebase app is available using v22.2.1 modular API
      if (getApps().length === 0) {
        console.warn('[Firebase] No app instance found, waiting for initialization...');
        await this._waitForFirebaseApp();
        
        if (getApps().length === 0) {
          console.warn('[FCM] Firebase app instance not available. Push notification features will be disabled.');
          return false;
        }
      }

      const msg = messaging();

      // Firebase v22.2.1 - Check if messaging is supported
      try {
        await msg.hasPermission();
        console.log('[FCM] Firebase Messaging is supported');
      } catch (error) {
        console.warn('[FCM] Firebase Messaging is not supported on this platform:', error);
        return false;
      }

      // Enable auto initialization for Android (v22.2.1 method)
      if (Platform.OS === 'android') {
        await msg.setAutoInitEnabled(true);
      }

      // Register device for remote messages (required for iOS in v22.2.1)
      await msg.registerDeviceForRemoteMessages();
      
      this.messagingReady = true;

      // Set background message handler
      this._setBackgroundMessageHandler(msg);

      console.log('[FCM] Firebase messaging v22.2.1 initialized successfully.');
      return true;

    } catch (error) {
      console.warn('[FCM] Firebase Messaging initialization failed. Error:', error);
      this.messagingReady = false;
      return false;
    }
  }

  /**
   * Wait for Firebase app to be available (v22.2.1 compatible)
   */
  private async _waitForFirebaseApp(maxWaitTime: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (getApps().length === 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Set background message handler with v22.2.1 improvements
   */
  private _setBackgroundMessageHandler(msg: FirebaseMessagingTypes.Module): void {
    msg.setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message received:', remoteMessage);
      
      // ✅ FIX: Let UnifiedCallService handle all call-related FCM messages
      // This prevents conflicts and ensures consistent handling
      try {
        await UnifiedCallService.getInstance().handleFCMCallNotification(remoteMessage);
      } catch (error) {
        console.error('[FCM] Error handling FCM message in background:', error);
      }
      
      // Keep existing logic for legacy support
      const type = remoteMessage?.data?.type;

      if (type === 'INCOMING_CALL' || remoteMessage?.data?.isIncomingCall === 'true') {
        console.log('[FCM] Incoming call received in background');
        this._handleBackgroundCall(remoteMessage);
      }
      // Note: Handling accepted/declined in background is complex due to state loss.
      // This would require persisting call state.
    });
  }

  /**
   * Handle background call notifications
   */
  private _handleBackgroundCall(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    console.log('[FCM] Processing background call:', remoteMessage.data);
    if (remoteMessage.data?.callData) {
        try {
          const callData = JSON.parse(remoteMessage.data.callData as string);
          // Extract callType ONLY from videoSDKInfo.callType (as 3rd value in videoSDKInfo)
          const callType = callData.videoSDKInfo?.callType;
          appEventEmitter.emit('incomingCallFromFCM', {
            callId: callData.callInfo.callId,
            meetingId: callData.videoSDKInfo.meetingId,
            token: callData.videoSDKInfo.token,
            callerId: callData.callerInfo.userId,
            callerName: callData.callerInfo.name,
            callerFcmToken: callData.callerInfo.token,
            callType,
            isIncomingCall: true,
          });
        } catch (e) {
          console.warn('[FCM] Failed to parse callData in background:', e);
        }
    }
  }

  /**
   * Setup notification permissions with v22.2.1 enhanced permission handling
   */
  public async setupNotifications(): Promise<void> {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, skipping notification setup');
      return;
    }

    try {
      // Enhanced permission request with v22.2.1
      const authStatus = await messaging().requestPermission({
        sound: true,
        alert: true,
        badge: true,
        ...(Platform.OS === 'ios' && {
          announcement: true,
          carPlay: true,
          criticalAlert: true,
          provisional: false,
        }),
      });

      const enabled = authStatus === AuthorizationStatus.AUTHORIZED || 
                     authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Notification permissions granted:', authStatus);
        
        // Register FCM token
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const fcmToken = await this.getFCMToken();
          if (fcmToken) {
            await ApiService.updateFcmToken({ userId, fcmToken });
            console.log('[FCM] Notification setup completed successfully');
          }
        }
      } else {
        console.log('[FCM] Notification permissions denied:', authStatus);
      }
    } catch (error) {
      console.warn('[FCM] Notification setup failed. Error:', error);
    }
  }

  /**
   * Setup notification listeners with v22.2.1 improvements
   */
  public setupNotificationListeners(): () => void {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, skipping notification listeners setup');
      return () => {};
    }

    try {
      const msg = messaging();

      // Handle notification when app is opened from killed state
      msg.getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log('[FCM] App opened from killed state by notification:', remoteMessage);
          }
        })
        .catch((error) => {
          console.warn('[FCM] Error getting initial notification:', error);
        });

      // Handle notification when app is opened from background state
      const unsubscribeOnNotificationOpenedApp = msg.onNotificationOpenedApp((remoteMessage) => {
        console.log('[FCM] App opened from background by notification:', remoteMessage);
      });

      // Handle foreground messages with enhanced handling
      const unsubscribeForegroundMessages = msg.onMessage(async (remoteMessage) => {
        console.log('[FCM] Foreground message received:', remoteMessage);
        
        // ✅ FIX: Let UnifiedCallService handle all call-related FCM messages
        // This prevents conflicts and ensures consistent handling
        try {
          await UnifiedCallService.getInstance().handleFCMCallNotification(remoteMessage);
        } catch (error) {
          console.error('[FCM] Error handling FCM message in FirebaseService:', error);
        }
        
        // Keep the existing logic for non-call messages (legacy support)
        const type = remoteMessage.data?.type;
        if (type === 'INCOMING_CALL' || remoteMessage?.data?.isIncomingCall === 'true') {
          console.log('[FCM] Incoming call received in foreground (legacy format)');
          // Call UnifiedCallService.handleIncomingCall
          if (remoteMessage.data?.callData) {
            try {
              const callData = JSON.parse(remoteMessage.data.callData as string);
              await UnifiedCallService.getInstance().handleIncomingCall(callData);
            } catch (e) {
              console.warn('[FCM] Failed to parse callData in foreground:', e);
            }
          }
        } else if (type === 'CALL_ACCEPTED') {
          console.log('[FCM] Call accepted event received.');
          if (remoteMessage.data?.callId) {
            await UnifiedCallService.getInstance().acceptCall(remoteMessage.data.callId as string);
          }
        } else if (type === 'CALL_DECLINED') {
          console.log('[FCM] Call declined event received.');
          if (remoteMessage.data?.callId) {
            await UnifiedCallService.getInstance().declineCall(remoteMessage.data.callId as string);
          }
        } else if (remoteMessage?.notification) {
          // TODO: Implement generic notification handler
        }
      });

      // Listen for token refresh (improved in v22.2.1)
      const unsubscribeTokenRefresh = msg.onTokenRefresh(async (token) => {
        console.log('[FCM] Token refreshed:', token);
        
        // Auto-update token on server
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await ApiService.updateFcmToken({ userId, fcmToken: token });
        }
      });

      console.log('[FCM] Notification listeners attached successfully');

      // Return cleanup function
      return () => {
        unsubscribeOnNotificationOpenedApp();
        unsubscribeForegroundMessages();
        unsubscribeTokenRefresh();
        console.log('[FCM] Notification listeners detached');
      };

    } catch (error) {
      console.warn('[FCM] Failed to set up notification listeners:', error);
      return () => {};
    }
  }

  /**
   * Execute delayed navigation if exists
   */
  public async executeDelayedNavigation(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem('delayedNavigation');
      if (storedData) {
        const navigationData = JSON.parse(storedData);
        
        // Check if data is still valid (within 5 minutes)
        if (Date.now() - navigationData.timestamp < 300000) {
          if (navigationData.screen === 'TipCall') {
            // Navigate to TipCall using nested navigation
            navigationRef.navigate('Main', {
              screen: 'TipCall',
              params: {
                initialCallNotificationData: navigationData.data
              }
            });
          } else if (navigationData.screen === 'Meeting') {
            // Navigate to Meeting using nested navigation
            navigationRef.navigate('Main', {
              screen: 'Meeting',
              params: navigationData.data
            });
          }
        }
        
        // Clean up stored data
        await AsyncStorage.removeItem('delayedNavigation');
      }
    } catch (error) {
      console.warn('[FCM] Error executing delayed navigation:', error);
    }
  }

  /**
   * Get current FCM token with v22.2.1 improvements
   */
  public async getFCMToken(): Promise<string | null> {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, cannot get FCM token');
      return null;
    }

    try {
      const token = await messaging().getToken();
      console.log('[FCM] Current FCM token:', token);
      return token || null;
    } catch (error) {
      console.warn('[FCM] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for FCM token refresh with v22.2.1 improvements
   */
  public onTokenRefresh(callback: (token: string) => void): () => void {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, cannot listen for token refresh');
      return () => {};
    }

    try {
      const unsubscribe = messaging().onTokenRefresh((token) => {
        console.log('[FCM] FCM token refreshed:', token);
        callback(token);
      });

      return unsubscribe;
    } catch (error) {
      console.warn('[FCM] Error setting up token refresh listener:', error);
      return () => {};
    }
  }

  /**
   * Check if messaging is ready
   */
  public isMessagingReady(): boolean {
    return this.messagingReady;
  }

  /**
   * Delete FCM token with v22.2.1 improvements
   */
  public async deleteToken(): Promise<void> {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, cannot delete token');
      return;
    }

    try {
      await messaging().deleteToken();
      console.log('[FCM] FCM token deleted successfully');
    } catch (error) {
      console.warn('[FCM] Error deleting FCM token:', error);
    }
  }

  /**
   * Check if app has notification permissions (v22.2.1 feature)
   */
  public async hasPermission() {
    if (!this.messagingReady) {
      console.log('[FCM] Messaging not ready, returning NOT_DETERMINED');
      return AuthorizationStatus.NOT_DETERMINED;
    }
    return await messaging().hasPermission();
  }

  /**
   * Get APNs token (iOS only, v22.2.1 feature)
   */
  public async getAPNSToken(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const apnsToken = await messaging().getAPNSToken();
      console.log('[FCM] APNs token:', apnsToken);
      return apnsToken || null;
    } catch (error) {
      console.warn('[FCM] Error getting APNs token:', error);
      return null;
    }
  }

  /**
   * Set notification categories for iOS (v22.2.1 compatible)
   */
  public async setNotificationCategories(categories: any[]): Promise<void> {
    if (Platform.OS === 'ios') {
      // await messaging().setNotificationCategories(categories);
    }
  }

  /**
   * Get current Firebase app instance (v22.2.1 compatible)
   */
  public getCurrentApp() {
    try {
      return getApp();
    } catch (error) {
      console.warn('[FCM] Error getting current app:', error);
      return null;
    }
  }

  /**
   * Get all Firebase app instances (v22.2.1 compatible)
   */
  public getAllApps() {
    return getApps();
  }

  /**
   * Reset service (for logout or cleanup)
   */
  public reset(): void {
    this.messagingReady = false;
    this.initializationPromise = null;
    console.log('[FCM] Firebase service reset');
  }

  /**
   * Send an FCM data message to invite a user to a call (bulletproof, WhatsApp-like)
   */
  public async sendCallInviteFCM(recipientId: string, callPayload: any): Promise<void> {
    try {
      // You may need to call your backend to send the FCM, or use the FCM Admin API
      // For demo, assume a backend endpoint exists: /sendCallInviteFCM
      await ApiService.post('/sendCallInviteFCM', {
        recipientId: String(recipientId),
        data: callPayload,
      });
      console.log('[FirebaseService] Sent call invite FCM:', { recipientId, callPayload });
    } catch (error) {
      console.error('[FirebaseService] Failed to send call invite FCM:', error);
      throw error;
    }
  }
}

export default FirebaseService;