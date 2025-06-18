import { AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import messaging from '@react-native-firebase/messaging';

class NotificationService {
  /**
   * Request notification permissions with v22.2.1 enhanced options
   */
  static async requestPermissions(messagingInstance?: any): Promise<boolean> {
    try {
      const msg = messagingInstance || messaging();
      
      // Enhanced permission request for v22.2.1 - fixed platform-specific options
      const permissionOptions = {
        sound: true,
        alert: true,
        badge: true,
        ...(Platform.OS === 'ios' && {
          announcement: true,
          carPlay: true,
          criticalAlert: true,
          provisional: false,
        }),
      };

      const authStatus = await msg.requestPermission(permissionOptions);

      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED || 
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[NotificationService] Authorization status:', authStatus);
        return true;
      }
      console.log('[NotificationService] User declined permissions');
      return false;
    } catch (error) {
      console.error('[NotificationService] Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM token with v22.2.1 improvements
   */
  static async getFcmToken(messagingInstance?: any): Promise<string | null> {
    try {
      const msg = messagingInstance || messaging();
      
      // Enhanced token retrieval - removed web-only vapidKey
      const fcmToken = await msg.getToken();
      
      if (fcmToken) {
        console.log('[NotificationService] FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('[NotificationService] Failed to get FCM token:', error);
    }
    return null;
  }

  /**
   * Register FCM token with server
   */
  static async registerFcmToken(userId: string, messagingInstance?: any): Promise<boolean> {
    try {
      const fcmToken = await this.getFcmToken(messagingInstance);
      if (fcmToken) {
        await ApiService.updateFcmToken({
          userId,
          fcmToken
        });
        console.log('[NotificationService] FCM token registered with server');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NotificationService] Failed to register FCM token:', error);
      return false;
    }
  }

  /**
   * Check current permission status (v22.2.1 feature)
   */
  static async checkPermissionStatus(): Promise<AuthorizationStatus> {
    try {
      const status = await messaging().hasPermission();
      console.log('[NotificationService] Current permission status:', status);
      return status;
    } catch (error) {
      console.error('[NotificationService] Failed to check permission status:', error);
      return AuthorizationStatus.NOT_DETERMINED;
    }
  }

  /**
   * Get APNs token (iOS only)
   */
  static async getAPNSToken(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const apnsToken = await messaging().getAPNSToken();
      console.log('[NotificationService] APNs token:', apnsToken);
      return apnsToken;
    } catch (error) {
      console.error('[NotificationService] Failed to get APNs token:', error);
      return null;
    }
  }

  /**
   * Delete FCM token
   */
  static async deleteFcmToken(): Promise<boolean> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem('fcmToken');
      console.log('[NotificationService] FCM token deleted successfully');
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to delete FCM token:', error);
      return false;
    }
  }

  /**
   * Setup notification categories for iOS (v22.2.1 compatible)
   */
  static async setupNotificationCategories(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      const categories = [
        {
          id: 'call',
          actions: [
            {
              id: 'accept',
              title: 'Accept',
              options: {
                foreground: true,
              },
            },
            {
              id: 'decline',
              title: 'Decline',
              options: {
                destructive: true,
              },
            },
          ],
        },
        {
          id: 'message',
          actions: [
            {
              id: 'reply',
              title: 'Reply',
              options: {
                foreground: true,
              },
            },
            {
              id: 'mark_read',
              title: 'Mark as Read',
            },
          ],
        },
      ];

      await messaging().setNotificationCategories(categories);
      console.log('[NotificationService] Notification categories set successfully');
    } catch (error) {
      console.error('[NotificationService] Failed to set notification categories:', error);
    }
  }

  /**
   * Extract call notification data
   */
  static extractCallData(remoteMessage: any) {
    if (!remoteMessage || !remoteMessage.data) return null;
    
    const { callType, callerId, callerName, channelName } = remoteMessage.data;
    
    if (callType && callerId && channelName) {
      return {
        callType: callType === 'video-call' ? 'video' : 'voice',
        callerId,
        callerName: callerName || 'Unknown',
        channelName
      };
    }
    
    return null;
  }
  
  /**
   * Update call status
   */
  static async updateCallStatus(callerId: string, receiverId: string, status: string, callType: string): Promise<boolean> {
    try {
      await ApiService.handleCall({
        callerId,
        receiverId,
        action: status,
        callType: callType === 'video' ? 'video-call' : 'audio-call',
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to update call status:', error);
      return false;
    }
  }
}

export default NotificationService;