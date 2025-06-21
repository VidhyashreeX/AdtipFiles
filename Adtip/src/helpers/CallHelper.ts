import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import VideoSDKService from '../services/videosdk/VideoSDKService';
import FirebaseService from '../services/FirebaseService';
import FirebaseCallService from '../services/FirebaseCallService';
import uuid from 'react-native-uuid';

export interface CallInitiationResult {
  success: boolean;
  meetingId?: string;
  token?: string;
  error?: string;
  callId?: string;
}

export const initiateVideoSDKCall = async (
  recipientId: string,
  callType: 'voice' | 'video',
  callerName: string
): Promise<CallInitiationResult> => {
  try {
    console.log('[CallHelper] Starting VideoSDK call initiation:', {
      recipientId,
      callType,
      callerName,
    });

    // Step 1: Generate VideoSDK token
    let tokenResponse;
    try {
      tokenResponse = await ApiService.generateVideoSDKParticipantToken();
      if (!tokenResponse.success || !tokenResponse.token) {
        throw new Error(`Failed to generate VideoSDK token: ${tokenResponse.message || 'No token returned'}`);
      }
    } catch (tokenError: any) {
      console.error('[CallHelper] Token generation failed:', tokenError);
      return { 
        success: false, 
        error: `Token error: ${tokenError.message || 'Unknown token error'}` 
      };
    }

    const videoSDKToken = tokenResponse.token;
    console.log('[CallHelper] VideoSDK token generated successfully');

    // Step 2: Create meeting room
    let meetingResponse;
    try {
      meetingResponse = await ApiService.createVideoSDKMeeting(videoSDKToken);
      if (!meetingResponse.success || !meetingResponse.data?.roomId) {
        throw new Error(`Failed to create VideoSDK meeting: ${meetingResponse.message || 'No roomId returned'}`);
      }
    } catch (meetingError: any) {
      console.error('[CallHelper] Meeting creation failed:', meetingError);
      return { 
        success: false, 
        error: `Meeting error: ${meetingError.message || 'Unknown meeting error'}` 
      };
    }

    const meetingId = meetingResponse.data.roomId;
    console.log('[CallHelper] VideoSDK meeting created:', meetingId);

    // Step 3: Get FCM tokens for both users
    const currentUserId = await AsyncStorage.getItem('userId');
    if (!currentUserId) {
      throw new Error('Current user ID not found');
    }

    const recipientData = await getRecipientFcmToken(
      parseInt(currentUserId), 
      parseInt(recipientId)
    );
    
    if (!recipientData.fcmToken) {
      throw new Error('Recipient FCM token not available');
    }

    // Step 4: Initiate call via Firebase Cloud Functions
    const firebaseService = FirebaseService.getInstance();
    const callId = uuid.v4() as string;

    try {
      console.log('[CallHelper] Initiating call via Firebase Cloud Functions');
      
      const firebaseCallResult = await firebaseService.initiateCall(
        recipientData.fcmToken,
        'ANDROID', // Hardcoded as requested - TODO: Change this later
        recipientId,
        recipientData.name || 'User',
        callerName,
        meetingId,
        videoSDKToken
      );

      console.log('[CallHelper] Firebase call initiated successfully:', firebaseCallResult);

      // Step 5: Update call status to 'calling'
      await firebaseService.updateCallStatus('calling', callerName, callId);

      return {
        success: true,
        meetingId: meetingId,
        token: videoSDKToken,
        callId: callId,
      };

    } catch (firebaseError) {
      console.warn('[CallHelper] Firebase call initiation failed, using fallback:', firebaseError);
      
      // Fallback to regular API call if Firebase fails
      const fallbackResult = await initiateFallbackCall(
        recipientId,
        callType,
        meetingId,
        videoSDKToken,
        callerName
      );

      return {
        success: true,
        meetingId: meetingId,
        token: videoSDKToken,
        callId: callId,
        ...fallbackResult,
      };
    }

  } catch (error: any) {
    console.error('[CallHelper] Call initiation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate call',
    };
  }
};

/**
 * Get recipient FCM token using the new API
 */
const getRecipientFcmToken = async (callerId: number, recipientId: number) => {
  try {
    console.log('[CallHelper] Getting FCM tokens for users:', { callerId, recipientId });
    
    const response = await ApiService.getFcmTokensForUsers({
      userIds: [callerId, recipientId]
    });
    
    if (!response.results || response.results.length < 2) {
      throw new Error('Failed to get FCM tokens for both users');
    }

    // Find the recipient's token
    const recipientToken = response.results.find(result => result.userId === recipientId);
    
    if (!recipientToken || !recipientToken.status) {
      throw new Error('Recipient FCM token not found or inactive');
    }

    console.log('[CallHelper] Retrieved recipient FCM token successfully');
    
    return {
      fcmToken: recipientToken.fcm_token,
      platform: 'ANDROID' as 'ANDROID' | 'IOS', // Hardcoded as requested
      name: 'User', // You might want to get this from your contacts list or user data
    };
  } catch (error) {
    console.error('[CallHelper] Error getting recipient FCM token:', error);
    throw new Error('Failed to get recipient FCM token');
  }
};

/**
 * Update call status using Firebase Cloud Functions
 */
export const updateCallStatus = async (
  type: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed',
  callerName: string,
  callId?: string,
  duration?: number
): Promise<boolean> => {
  try {
    console.log('[CallHelper] Updating call status:', { type, callerName, callId, duration });
    
    const firebaseService = FirebaseService.getInstance();
    await firebaseService.updateCallStatus(type, callerName, callId, duration);
    
    console.log('[CallHelper] Call status updated successfully');
    return true;
  } catch (error) {
    console.error('[CallHelper] Failed to update call status:', error);
    return false;
  }
};

/**
 * Deactivate VideoSDK room via backend API
 */
export const deactivateVideoSDKRoomViaBackend = async (roomId: string): Promise<boolean> => {
  try {
    console.log('[CallHelper] Deactivating VideoSDK room via backend:', roomId);
    
    const response = await ApiService.deactivateVideoSDKRoom({ roomId });
    
    if (response.success) {
      console.log('[CallHelper] VideoSDK room deactivated successfully');
      return true;
    } else {
      console.warn('[CallHelper] Failed to deactivate VideoSDK room:', response.message);
      return false;
    }
  } catch (error) {
    console.error('[CallHelper] Error deactivating VideoSDK room:', error);
    return false;
  }
};

/**
 * Fallback call initiation if Firebase Cloud Functions fail
 */
const initiateFallbackCall = async (
  recipientId: string,
  callType: 'voice' | 'video',
  meetingId: string,
  videoSDKToken: string,
  callerName: string
) => {
  try {
    console.log('[CallHelper] Using fallback call initiation');
    
    // Use your existing API to initiate call
    const fallbackData = {
      calleeInfo: {
        platform: 'ANDROID' as 'ANDROID' | 'IOS', // Hardcoded as requested
        token: 'fallback-token', // You might need to get this differently
      },
      callerInfo: {
        name: callerName,
        token: await FirebaseService.getInstance().getFCMToken() || 'fallback-token',
      },
      videoSDKInfo: {
        meetingId: meetingId,
        token: videoSDKToken,
      },
    };

    const response = await ApiService.initiateCall(fallbackData);
    console.log('[CallHelper] Fallback call initiated:', response);
    
    return { fallbackUsed: true };
  } catch (error) {
    console.error('[CallHelper] Fallback call initiation also failed:', error);
    throw error;
  }
};