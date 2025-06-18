import ApiService from '../services/ApiService';
import VideoSDKService from '../services/videosdk/VideoSDKService';

/**
 * Initiate a VideoSDK call with proper token flow
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
    console.log('[CallHelper] Starting VideoSDK call initiation process:', {
      recipientId,
      callType,
      participantName,
    });

    // ✅ FIXED: Add parentheses to call getInstance()
    const videoSDKService = VideoSDKService.getInstance();

    // Step 1: Generate VideoSDK participant token via backend
    console.log('[CallHelper] Step 1: Generating VideoSDK participant token...');
    const participantToken = await videoSDKService.generateParticipantToken();
    
    if (!participantToken) {
      throw new Error('Failed to generate participant token');
    }

    console.log('[CallHelper] Participant token generated successfully');

    // Step 2: Create VideoSDK meeting via backend
    console.log('[CallHelper] Step 2: Creating VideoSDK meeting...');
    const meetingId = await videoSDKService.createMeeting(participantToken);
    
    if (!meetingId) {
      throw new Error('Failed to create meeting');
    }

    console.log('[CallHelper] VideoSDK meeting created successfully:', meetingId);

    // Step 3: Return success with meeting details
    return {
      success: true,
      meetingId,
      token: participantToken,
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
 */
export const joinVideoSDKMeeting = async (
  meetingId: string,
  participantName: string = 'User'
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    console.log('[CallHelper] Joining VideoSDK meeting:', { meetingId, participantName });

    // ✅ FIXED: Add parentheses to call getInstance()
    const videoSDKService = VideoSDKService.getInstance();
    
    // Generate participant token for joining
    const participantToken = await videoSDKService.generateParticipantToken();
    
    if (!participantToken) {
      throw new Error('Failed to generate participant token for joining');
    }

    // Validate meeting exists
    const isValidMeeting = await videoSDKService.validateMeeting(meetingId, participantToken);
    
    if (!isValidMeeting) {
      throw new Error('Meeting not found or invalid');
    }

    return {
      success: true,
      token: participantToken,
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
 */
export const deactivateVideoSDKRoomViaBackend = async (
  meetingId: string
): Promise<boolean> => {
  try {
    console.log('[CallHelper] Deactivating VideoSDK room:', meetingId);

    // ✅ FIXED: Add parentheses to call getInstance()
    const videoSDKService = VideoSDKService.getInstance();
    
    // Generate token for deactivation (if required by your backend)
    const token = await videoSDKService.generateParticipantToken();
    
    if (!token) {
      console.warn('[CallHelper] No token available for deactivation, proceeding anyway');
    }

    // Deactivate via backend
    const success = await videoSDKService.deactivateMeeting(meetingId, token || '');
    
    return success;
  } catch (error: any) {
    console.error('[CallHelper] Error deactivating VideoSDK room:', error);
    return false;
  }
};