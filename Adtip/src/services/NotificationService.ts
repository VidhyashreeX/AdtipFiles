import { AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import messaging from '@react-native-firebase/messaging';

class NotificationService {
  static async requestPermissions() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED || 
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
      console.log('User declined permissions');
      return false;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  static async getFcmToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error);
    }
    return null;
  }

  static async registerFcmToken(userId, messagingInstance) {
    try {
      const fcmToken = await this.getFcmToken(messagingInstance);
      if (fcmToken) {
        await ApiService.updateFcmToken({
          userId,
          fcmToken
        });
        console.log('FCM token registered with server');
        return true;
      }
    } catch (error) {
      console.error('Failed to register FCM token with server:', error);
    }
    return false;
  }

  // For handling call notification data
  static extractCallData(remoteMessage) {
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
  
  static async updateCallStatus(callerId, receiverId, status, callType, messagingInstance) {
    try {
      await ApiService.handleCall({
        callerId,
        receiverId,
        action: status,
        callType: callType === 'video' ? 'video-call' : 'audio-call',
      });
      return true;
    } catch (error) {
      console.error('Failed to update call status:', error);
      return false;
    }
  }
}

export default NotificationService;