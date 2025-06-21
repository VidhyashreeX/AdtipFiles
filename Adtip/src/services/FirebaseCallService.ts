import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FCM_SERVER_URL } from '../constants/api';
import FirebaseService from './FirebaseService';

export interface FirebaseCallData {
  callerInfo: {
    name: string;
    token: string;
    userId?: string;
    platform?: 'ANDROID' | 'IOS';
  };
  calleeInfo: {
    platform: 'ANDROID' | 'IOS';
    token: string;
    userId?: string;
    name?: string;
  };
  videoSDKInfo: {
    meetingId: string;
    token: string;
    roomId?: string;
  };
  callInfo: {
    callType: 'voice' | 'video';
    callId: string;
  };
}

export interface CallStatusUpdate {
  callerInfo: {
    name: string;
    token: string;
    userId?: string;
  };
  type: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed';
  callId?: string;
  duration?: number;
}

class FirebaseCallService {
  private static instance: FirebaseCallService;

  private constructor() {}

  public static getInstance(): FirebaseCallService {
    if (!FirebaseCallService.instance) {
      FirebaseCallService.instance = new FirebaseCallService();
    }
    return FirebaseCallService.instance;
  }

  /**
   * Initiate a call using Firebase Cloud Functions
   */
  public async initiateCall(callData: FirebaseCallData): Promise<any> {
    try {
      console.log('[FirebaseCallService] Initiating call:', {
        callerName: callData.callerInfo.name,
        calleePlatform: callData.calleeInfo.platform,
        meetingId: callData.videoSDKInfo.meetingId,
        hasCallerToken: !!callData.callerInfo.token,
        hasCalleeToken: !!callData.calleeInfo.token,
        hasVideoSDKToken: !!callData.videoSDKInfo.token,
      });

      const response = await fetch(`${FCM_SERVER_URL}/api/call/initiate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          callerInfo: callData.callerInfo,
          calleeInfo: callData.calleeInfo,
          videoSDKInfo: callData.videoSDKInfo,
        }),
      });

      const data = await response.json();
      console.log('[FirebaseCallService] Initiate call response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate call');
      }

      return data;
    } catch (error: any) {
      console.error('[FirebaseCallService] Initiate call error:', error);
      throw new Error(error.message || 'Failed to initiate call');
    }
  }

  /**
   * Update call status using Firebase Cloud Functions
   */
  public async updateCallStatus(updateData: CallStatusUpdate): Promise<any> {
    try {
      console.log('[FirebaseCallService] Updating call status:', {
        type: updateData.type,
        callerName: updateData.callerInfo.name,
        hasToken: !!updateData.callerInfo.token,
      });

      const response = await fetch(`${FCM_SERVER_URL}/api/call/update-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          callerInfo: updateData.callerInfo,
          type: updateData.type,
          callId: updateData.callId,
          duration: updateData.duration,
        }),
      });

      const data = await response.json();
      console.log('[FirebaseCallService] Update call status response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update call status');
      }

      return data;
    } catch (error: any) {
      console.error('[FirebaseCallService] Update call status error:', error);
      throw new Error(error.message || 'Failed to update call status');
    }
  }

  /**
   * Helper method to prepare call data with current user info
   */
  public async prepareCallData(
    calleeToken: string,
    calleePlatform: 'ANDROID' | 'IOS',
    calleeUserId: string,
    calleeName: string,
    callerName: string,
    meetingId: string,
    videoSDKToken: string,
    callInfo: { callType: 'voice' | 'video'; callId: string }
  ): Promise<FirebaseCallData> {
    try {
      const firebaseService = FirebaseService.getInstance();
      const callerToken = await firebaseService.getFCMToken();
      const userId = await AsyncStorage.getItem('userId');

      if (!callerToken) {
        throw new Error('Caller FCM token not available');
      }

      return {
        callerInfo: {
          name: callerName,
          token: callerToken,
          userId: userId || undefined,
          platform: Platform.OS.toUpperCase() as 'ANDROID' | 'IOS',
        },
        calleeInfo: {
          platform: calleePlatform, // This will be 'ANDROID' as hardcoded
          token: calleeToken,
          userId: calleeUserId,
          name: calleeName,
        },
        videoSDKInfo: {
          meetingId: meetingId,
          token: videoSDKToken,
        },
        callInfo: callInfo,
      };
    } catch (error) {
      console.error('[FirebaseCallService] Error preparing call data:', error);
      throw error;
    }
  }

  /**
   * Helper method to prepare call status update data
   */
  public async prepareCallStatusUpdate(
    type: CallStatusUpdate['type'],
    callerName: string,
    callId?: string,
    duration?: number
  ): Promise<CallStatusUpdate> {
    try {
      const firebaseService = FirebaseService.getInstance();
      const callerToken = await firebaseService.getFCMToken();
      const userId = await AsyncStorage.getItem('userId');

      if (!callerToken) {
        throw new Error('Caller FCM token not available');
      }

      return {
        callerInfo: {
          name: callerName,
          token: callerToken,
          userId: userId || undefined,
        },
        type: type,
        callId: callId,
        duration: duration,
      };
    } catch (error) {
      console.error('[FirebaseCallService] Error preparing call status update:', error);
      throw error;
    }
  }
}

export default FirebaseCallService;