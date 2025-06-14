import ApiService from '../services/ApiService';

export interface CallInitiationResult {
  success: boolean;
  meetingId?: string;
  token?: string;
  error?: string;
}

/**
 * Initiate a VideoSDK call with proper token flow
 * @param callerId - ID of the user initiating the call
 * @param callerName - Name of the caller
 * @param recipientId - ID of the recipient
 * @param recipientName - Name of the recipient
 * @param callType - Type of call ('voice' or 'video')
 * @param region - Optional region for the meeting (defaults to 'us')
 */
export const initiateVideoSDKCall = async (
  callerId: string,
  callerName: string,
  recipientId: string,
  recipientName: string,
  callType: 'voice' | 'video',
  region: string = 'us'
): Promise<CallInitiationResult> => {
  try {
    console.log('[CallHelper] Starting VideoSDK call initiation process:', {
      callerId,
      callerName,
      recipientId,
      recipientName,
      callType,
      region
    });

    // Step 1: Generate VideoSDK token
    console.log('[CallHelper] Step 1: Generating VideoSDK token...');
    const tokenResponse = await ApiService.generateVideoSDKParticipantToken();
    
    if (!tokenResponse.success || !tokenResponse.token) {
      throw new Error('Failed to generate VideoSDK token: ' + tokenResponse.message);
    }

    console.log('[CallHelper] VideoSDK token generated successfully');

    // Step 2: Create meeting with the token
    console.log('[CallHelper] Step 2: Creating VideoSDK meeting...');
    const meetingResponse = await ApiService.createVideoSDKMeeting(
      tokenResponse.token,
      region
    );

    if (!meetingResponse.success || !meetingResponse.data?.roomId) {
      throw new Error('Failed to create VideoSDK meeting: ' + meetingResponse.message);
    }

    const meetingId = meetingResponse.data.roomId;
    console.log('[CallHelper] VideoSDK meeting created successfully:', meetingId);

    // Step 3: Send notification to recipient (optional - if you have FCM integration)
    try {
      console.log('[CallHelper] Step 3: Sending call notification to recipient...');
      // You can implement FCM notification here if needed
      // await ApiService.sendCallNotification({
      //   recipientId,
      //   callerId,
      //   callerName,
      //   meetingId,
      //   callType
      // });
    } catch (notificationError) {
      console.warn('[CallHelper] Failed to send notification, but continuing with call:', notificationError);
      // Don't fail the entire call if notification fails
    }

    return {
      success: true,
      meetingId: meetingId,
      token: tokenResponse.token, // Return the participant token for joining
    };

  } catch (error: any) {
    console.error('[CallHelper] Error in initiateVideoSDKCall:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate VideoSDK call',
    };
  }
};

/**
 * Join an existing VideoSDK meeting
 * @param meetingId - The meeting/room ID to join
 * @param participantName - Name of the participant joining
 */
export const joinVideoSDKMeeting = async (
  meetingId: string,
  participantName: string
): Promise<CallInitiationResult> => {
  try {
    console.log('[CallHelper] Joining VideoSDK meeting:', { meetingId, participantName });

    // Generate token for joining
    const tokenResponse = await ApiService.generateVideoSDKParticipantToken();
    
    if (!tokenResponse.success || !tokenResponse.token) {
      throw new Error('Failed to generate VideoSDK token for joining: ' + tokenResponse.message);
    }

    return {
      success: true,
      meetingId: meetingId,
      token: tokenResponse.token,
    };

  } catch (error: any) {
    console.error('[CallHelper] Error in joinVideoSDKMeeting:', error);
    return {
      success: false,
      error: error.message || 'Failed to join VideoSDK meeting',
    };
  }
};

/**
 * Deactivate VideoSDK room via backend
 * @param meetingId - The meeting ID to deactivate
 */
export const deactivateVideoSDKRoomViaBackend = async (
  meetingId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[CallHelper] Deactivating VideoSDK room:', meetingId);
    
    // Call your backend API to deactivate the room
    const response = await ApiService.deactivateVideoSDKRoom(meetingId);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to deactivate room');
    }

    return { success: true };
  } catch (error: any) {
    console.error('[CallHelper] Error deactivating room:', error);
    return {
      success: false,
      error: error.message || 'Failed to deactivate VideoSDK room',
    };
  }
};