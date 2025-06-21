import { Platform } from 'react-native';
import messaging, { 
  FirebaseMessagingTypes, 
  AuthorizationStatus 
} from '@react-native-firebase/messaging';
import { getApps, getApp } from '@react-native-firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';
import { navigationRef } from '../navigation/NavigationService';
import FirebaseCallService from './FirebaseCallService';

export interface CallNotificationData {
  callerName: string;
  callType: string;
  channelName: string;
  rtcToken: string;
  callerRtcUid: string;
  isFromNotification: boolean;
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
      
      // Enhanced background message handling
      if (remoteMessage?.data?.isIncomingCall === 'true') {
        console.log('[FCM] Incoming call received in background');
        // Handle background call notification
        this._handleBackgroundCall(remoteMessage);
      }

      if (remoteMessage?.data?.type === 'data_sync') {
        console.log('[FCM] Data sync message received in background');
        // Handle background data sync
      }
    });
  }

  /**
   * Handle background call notifications
   */
  private _handleBackgroundCall(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    // This would integrate with CallKeep or similar service
    console.log('[FCM] Processing background call:', remoteMessage.data);
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
          await NotificationService.registerFcmToken(userId, messaging());
          console.log('[FCM] Notification setup completed successfully');
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
            this._handleNotificationNavigation(remoteMessage);
          }
        })
        .catch((error) => {
          console.warn('[FCM] Error getting initial notification:', error);
        });

      // Handle notification when app is opened from background state
      const unsubscribeOnNotificationOpenedApp = msg.onNotificationOpenedApp((remoteMessage) => {
        console.log('[FCM] App opened from background by notification:', remoteMessage);
        this._handleNotificationNavigation(remoteMessage);
      });

      // Handle foreground messages with enhanced handling
      const unsubscribeForegroundMessages = msg.onMessage(async (remoteMessage) => {
        console.log('[FCM] Foreground message received:', remoteMessage);
        
        // Enhanced foreground message handling
        if (remoteMessage?.data?.isIncomingCall === 'true') {
          console.log('[FCM] Incoming call received in foreground');
          this._handleForegroundCall(remoteMessage);
        }

        // Handle other message types
        if (remoteMessage?.data?.type === 'chat') {
          console.log('[FCM] Chat message received in foreground');
          // Handle chat message
        }
      });

      // Listen for token refresh (improved in v22.2.1)
      const unsubscribeTokenRefresh = msg.onTokenRefresh(async (token) => {
        console.log('[FCM] Token refreshed:', token);
        
        // Auto-update token on server
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await NotificationService.registerFcmToken(userId, messaging());
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
      console.warn('[FCM] Error setting up notification listeners:', error);
      return () => {};
    }
  }

  /**
   * Handle foreground call notifications
   */
  private _handleForegroundCall(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    // Show in-app call notification or directly navigate
    this._handleNotificationNavigation(remoteMessage);
  }

  /**
   * Handle notification navigation based on notification data
   */
  private _handleNotificationNavigation(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    try {
      if (remoteMessage?.data?.isIncomingCall === 'true') {
        // Enhanced call notification handling for VideoSDK
        const callData = {
          callerName: remoteMessage.data.callerName || 'Unknown',
          callType: remoteMessage.data.callType || 'voice',
          meetingId: remoteMessage.data.meetingId,
          token: remoteMessage.data.videoSDKToken,
          isFromNotification: true,
        };

        console.log('[FCM] Processing VideoSDK call notification:', {
          callerName: callData.callerName,
          callType: callData.callType,
          hasMeetingId: !!callData.meetingId,
          hasToken: !!callData.token,
        });

        // Navigate to meeting through Main navigator
        if (callData.meetingId && callData.token) {
          if (navigationRef.isReady()) {
            // Fixed navigation - go through Main navigator to Meeting screen
            navigationRef.navigate('Main', {
              screen: 'Meeting',
              params: {
                meetingId: callData.meetingId,
                token: callData.token,
                callType: callData.callType as 'voice' | 'video',
                displayName: 'Me',
                isInitiator: false,
                recipientName: callData.callerName,
              }
            });
          } else {
            // Store for delayed navigation with proper structure
            this._storeDelayedNavigation('Meeting', {
              screen: 'Meeting',
              params: {
                meetingId: callData.meetingId,
                token: callData.token,
                callType: callData.callType,
                displayName: 'Me',
                isInitiator: false,
                recipientName: callData.callerName,
              }
            });
          }
        } else {
          // Fallback to TipCall screen
          if (navigationRef.isReady()) {
            navigationRef.navigate('Main', {
              screen: 'TipCall',
              params: {
                initialCallNotificationData: callData
              }
            });
          } else {
            this._storeDelayedNavigation('TipCall', callData);
          }
        }
      }

      // Handle other notification types
      if (remoteMessage?.data?.type === 'chat') {
        // Navigate to chat screen
        if (navigationRef.isReady()) {
          navigationRef.navigate('Main', {
            screen: 'Chat',
            params: {
              chatId: remoteMessage.data.chatId
            }
          });
        }
      }
      
    } catch (error) {
      console.warn('[FCM] Error handling notification navigation:', error);
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
            navigationRef.navigate('Main', {
              screen: 'TipCall',
              params: {
                initialCallNotificationData: navigationData.data
              }
            });
          } else if (navigationData.screen === 'Meeting') {
            // Handle Meeting navigation properly
            navigationRef.navigate('Main', navigationData.data);
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
  public async hasPermission(): Promise<AuthorizationStatus> {
    try {
      return await messaging().hasPermission();
    } catch (error) {
      console.warn('[FCM] Error checking permission status:', error);
      return AuthorizationStatus.NOT_DETERMINED;
    }
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
   * Set notification categories (iOS only, v22.2.1 feature)
   */
  public async setNotificationCategories(categories: any[]): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      await messaging().setNotificationCategories(categories);
      console.log('[FCM] Notification categories set successfully');
    } catch (error) {
      console.warn('[FCM] Error setting notification categories:', error);
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
    console.log('[FCM] Service reset');
  }

  /**
   * Initiate a call with Firebase Cloud Functions integration
   */
  public async initiateCall(
    calleeToken: string,
    calleePlatform: 'ANDROID' | 'IOS',
    calleeUserId: string,
    calleeName: string,
    callerName: string,
    meetingId: string,
    videoSDKToken: string
  ): Promise<any> {
    try {
      const firebaseCallService = FirebaseCallService.getInstance();
      
      const callData = await firebaseCallService.prepareCallData(
        calleeToken,
        calleePlatform,
        calleeUserId,
        calleeName,
        callerName,
        meetingId,
        videoSDKToken
      );

      return await firebaseCallService.initiateCall(callData);
    } catch (error) {
      console.error('[FirebaseService] Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Update call status with Firebase Cloud Functions integration
   */
  public async updateCallStatus(
    type: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed',
    callerName: string,
    callId?: string,
    duration?: number
  ): Promise<any> {
    try {
      const firebaseCallService = FirebaseCallService.getInstance();
      
      const updateData = await firebaseCallService.prepareCallStatusUpdate(
        type,
        callerName,
        callId,
        duration
      );

      return await firebaseCallService.updateCallStatus(updateData);
    } catch (error) {
      console.error('[FirebaseService] Error updating call status:', error);
      throw error;
    }
  }
}

export default FirebaseService;