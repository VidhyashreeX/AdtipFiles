import ApiService, { InitiateCallRequest } from '../services/ApiService';
import VideoSDKService from '../services/videosdk/VideoSDKService';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Enhanced VideoSDK call initiation with proper backend coordination
 */
export const initiateVideoSDKCall = async (
  recipientId: string,
  callType: 'voice' | 'video',
  participantName: string = 'User'
): Promise<{
  success: boolean;
  meetingId?: string;
  token?: string;
  error?: string;
}> => {
  try {
    console.log('[CallHelper] Starting enhanced VideoSDK call initiation:', {
      recipientId,
      callType,
      participantName,
    });

    const videoSDKService = VideoSDKService.getInstance();

    // Step 1: Generate VideoSDK participant token
    console.log('[CallHelper] Step 1: Generating VideoSDK participant token...');
    const participantToken = await videoSDKService.generateParticipantToken();
    if (!participantToken) {
      throw new Error('Failed to generate VideoSDK participant token');
    }

    // Step 2: Create VideoSDK meeting
    console.log('[CallHelper] Step 2: Creating VideoSDK meeting...');
    const meetingId = await videoSDKService.createMeeting(participantToken);
    if (!meetingId) {
      throw new Error('Failed to create VideoSDK meeting');
    }

    // Step 3: Get FCM tokens for both caller and callee
    console.log('[CallHelper] Step 3: Getting FCM tokens...');
    const callerFCMToken = await ApiService.getCurrentFCMToken();
    if (!callerFCMToken) {
      throw new Error('Failed to get caller FCM token');
    }

    // Get callee FCM token (you need to implement this)
    const calleeFCMToken = await getCalleeFCMToken(recipientId);
    if (!calleeFCMToken) {
      throw new Error('Failed to get callee FCM token');
    }

    // Step 4: Prepare initiate call request
    const initiateCallRequest: InitiateCallRequest = {
      calleeInfo: {
        platform: Platform.OS.toUpperCase() as 'ANDROID' | 'IOS',
        token: calleeFCMToken,
      },
      callerInfo: {
        name: participantName,
        token: callerFCMToken,
      },
      videoSDKInfo: {
        meetingId: meetingId,
        token: participantToken,
      },
    };

    // Step 5: Send initiate call request to backend
    console.log('[CallHelper] Step 5: Sending initiate call request...');
    const response = await ApiService.initiateCall(initiateCallRequest);

    if (!response.success) {
      throw new Error(response.message || 'Failed to initiate call');
    }

    console.log('[CallHelper] Call initiated successfully:', {
      meetingId,
      hasToken: !!participantToken,
    });

    return {
      success: true,
      meetingId,
      token: participantToken,
    };

  } catch (error: any) {
    console.error('[CallHelper] Error in enhanced VideoSDK call initiation:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate VideoSDK call',
    };
  }
};

/**
 * Helper function to get callee FCM token
 * IMPORTANT: You need to implement this method based on your user API
 */
const getCalleeFCMToken = async (recipientId: string): Promise<string | null> => {
  try {
    console.log('[CallHelper] Getting FCM token for recipient:', recipientId);
    
    // TODO: Replace this with your actual API call to get user's FCM token
    // Example implementation:
    /*
    const userDetails = await ApiService.getUserDetails(recipientId);
    return userDetails.fcmToken;
    */
    
    // For now, return a placeholder token - you MUST implement this
    console.warn('[CallHelper] getCalleeFCMToken not implemented - using placeholder');
    return 'placeholder_token_' + recipientId; // Remove this line when you implement the real API call
    
  } catch (error) {
    console.error('[CallHelper] Error getting callee FCM token:', error);
    return null;
  }
};

/**
 * Join an existing VideoSDK meeting
 */
export const joinVideoSDKMeeting = async (
  meetingId: string,
  token: string,
  participantName: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    console.log('[CallHelper] Joining VideoSDK meeting:', {
      meetingId,
      hasToken: !!token,
      participantName,
    });

    const videoSDKService = VideoSDKService.getInstance();
    
    // Validate meeting before joining
    const isValid = await videoSDKService.validateMeeting(meetingId, token);
    if (!isValid) {
      throw new Error('Meeting is not valid or has expired');
    }

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('[CallHelper] Error joining VideoSDK meeting:', error);
    return {
      success: false,
      error: error.message || 'Failed to join meeting',
    };
  }
};

/**
 * Deactivate VideoSDK room via backend
 */
export const deactivateVideoSDKRoomViaBackend = async (
  meetingId: string,
  token: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    console.log('[CallHelper] Deactivating VideoSDK room:', meetingId);

    const videoSDKService = VideoSDKService.getInstance();
    const success = await videoSDKService.deactivateMeeting(meetingId, token);

    if (!success) {
      throw new Error('Failed to deactivate meeting room');
    }

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('[CallHelper] Error deactivating VideoSDK room:', error);
    return {
      success: false,
      error: error.message || 'Failed to deactivate room',
    };
  }
};