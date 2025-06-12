import ApiService from '../services/ApiService';
// TIP_CALLS_ENDPOINTS is used by ApiService, not directly here anymore for VideoSDK room/token creation
// import { TIP_CALLS_ENDPOINTS } from '../constants/apiEndpoints';
import { VideoSDKCallRequest } from '../screens/tipcall/TipCallScreen'; // Ensure this type is correctly defined and imported

// VideoSDK API constants are no longer needed here as calls go through your backend.
// const VIDEOSDK_API_AUTH_TOKEN = 'YOUR_VIDEOSDK_API_KEY_OR_AUTH_TOKEN_FOR_SERVER_SIDE_API_CALLS';
// const VIDEOSDK_API_ENDPOINT = 'https://api.videosdk.live/v2';
// const DEFAULT_VIDEOSDK_PARTICIPANT_TOKEN = 'YOUR_VALID_DEFAULT_VIDEOSDK_PARTICIPANT_TOKEN';


/**
 * Creates a new VideoSDK meeting room by calling your backend.
 * @param region Optional region for the meeting.
 * @returns {Promise<string>} The meeting ID.
 */
export const createVideoSDKMeetingRoomViaBackend = async (region?: string): Promise<string> => {
  try {
    console.log('[CallHelper] Creating VideoSDK meeting room via backend...');
    const response = await ApiService.createVideoSDKMeeting({ region: region || 'sg' }); // Default to 'sg' or make it configurable
    if (response.success && response.data && response.data.roomId) {
      console.log('[CallHelper] VideoSDK Meeting room created via backend:', response.data.roomId);
      return response.data.roomId;
    } else {
      throw new Error(response.message || 'Failed to create VideoSDK meeting room via backend.');
    }
  } catch (error) {
    console.error('[CallHelper] Error in createVideoSDKMeetingRoomViaBackend:', error);
    throw error instanceof Error ? error : new Error('Failed to create VideoSDK meeting room');
  }
};

/**
 * Generates a VideoSDK participant token by calling your backend.
 * @param participantName Optional: A display name for the participant, if your backend uses it.
 * @param meetingId Optional: The meeting ID, if token generation is meeting-specific on your backend.
 * @returns {Promise<string>} The VideoSDK participant token.
 */
export const generateVideoSDKParticipantTokenViaBackend = async (participantName?: string, meetingId?: string): Promise<string> => {
  try {
    console.log(`[CallHelper] Generating VideoSDK participant token via backend. Participant: ${participantName}, Meeting: ${meetingId}`);
    // Pass necessary info to your backend if it customizes token generation
    const response = await ApiService.generateVideoSDKParticipantToken({
      // participantName, // Uncomment if your backend uses this
      // meetingId,       // Uncomment if your backend uses this
    });
    if (response.success && response.token) {
      return response.token;
    } else {
      throw new Error(response.message || 'Failed to generate participant token from backend.');
    }
  } catch (error) {
    console.error('[CallHelper] Error in generateVideoSDKParticipantTokenViaBackend:', error);
    throw error instanceof Error ? error : new Error('Failed to generate VideoSDK participant token');
  }
};

/**
 * Deactivates a VideoSDK meeting room by calling your backend.
 * @param roomId The ID of the room to deactivate.
 * @returns {Promise<boolean>} True if deactivation was successful.
 */
export const deactivateVideoSDKRoomViaBackend = async (roomId: string): Promise<boolean> => {
  try {
    console.log(`[CallHelper] Deactivating VideoSDK room ${roomId} via backend...`);
    const response = await ApiService.deactivateVideoSDKRoom({ roomId });
    return response.success;
  } catch (error) {
    console.error('[CallHelper] Error in deactivateVideoSDKRoomViaBackend:', error);
    return false;
  }
};

/**
 * Validates a VideoSDK meeting room by calling your backend.
 * @param roomId The ID of the room to validate.
 * @returns {Promise<boolean>} True if the meeting is valid.
 */
export const validateVideoSDKMeetingViaBackend = async (roomId: string): Promise<boolean> => {
    try {
        console.log(`[CallHelper] Validating VideoSDK room ${roomId} via backend...`);
        const response = await ApiService.validateVideoSDKMeeting({ roomId });
        // Assuming response.data.valid exists if success is true
        return response.success && !!(response.data?.valid);
    } catch (error) {
        console.error('[CallHelper] Error in validateVideoSDKMeetingViaBackend:', error);
        return false;
    }
};


/**
 * Notifies the recipient about an incoming call via the backend.
 * The backend is responsible for sending an FCM notification.
 * @param callerAppUserId App-specific user ID of the caller.
 * @param callerName Display name of the caller.
 * @param recipientAppUserId App-specific user ID of the recipient.
 * @param callType Type of call ('voice' or 'video').
 * @param meetingId VideoSDK meeting ID.
 * @param videoSDKTokenForCallee A valid VideoSDK token for the callee to join the meeting.
 * @returns {Promise<boolean>} True if notification was successfully sent to the backend.
 */
export const notifyRecipientViaBackend = async (
  callerAppUserId: string,
  callerName: string,
  recipientAppUserId: string,
  callType: 'voice' | 'video',
  meetingId: string,
  videoSDKTokenForCallee: string // This token is generated for the callee
): Promise<boolean> => {
  try {
    console.log(`[CallHelper] Notifying recipient ${recipientAppUserId} about call from ${callerName} for meeting ${meetingId}`);
    
    const payload: VideoSDKCallRequest = { // VideoSDKCallRequest is defined in TipCallScreen.tsx
      callerId: callerAppUserId,
      receiverId: recipientAppUserId,
      action: 'start', 
      callType: callType === 'video' ? 'video-call' : 'audio-call',
      meetingId: meetingId,
      customData: { // This structure must match what your backend /api/call expects for FCM
        videosdk_token: videoSDKTokenForCallee, // Token for the callee
        caller_name: callerName,
        // caller_app_user_id: callerAppUserId, // Already part of main payload as callerId
        // call_type: callType, // Already part of main payload
      }
    };
    
    // ApiService.handleCall is an existing method, ensure its backend implementation
    // correctly processes these fields to construct and send an FCM.
    const response = await ApiService.handleCall(payload); 
    
    console.log('[CallHelper] Backend notification response:', response);
    // Assuming response.status is a boolean or similar truthy/falsy value indicating success
    return !!response.status; // Or response.success if that's the structure
  } catch (error) {
    console.error('[CallHelper] Error in notifyRecipientViaBackend:', error);
    return false;
  }
};

/**
 * Orchestrates the process of initiating a VideoSDK call using backend services.
 * 1. Creates a VideoSDK meeting room via backend.
 * 2. Generates tokens for both caller and callee via backend.
 * 3. Notifies the recipient via the backend.
 * @returns Object containing success status, meetingId, and caller's token, or an error message.
 */
export const initiateVideoSDKCall = async (
  callerAppUserId: string,
  callerName: string,
  recipientAppUserId: string,
  recipientName: string, // Added for callee token generation if needed by backend
  callType: 'voice' | 'video'
): Promise<{ success: boolean; meetingId?: string; token?: string; error?: string }> => {
  try {
    // Step 1: Create a VideoSDK meeting room via your backend
    const meetingId = await createVideoSDKMeetingRoomViaBackend('sg'); // Example region

    // Step 2: Generate a token for the CALLER to join this meeting via your backend
    // Pass caller's name or ID if your backend uses it for token generation context
    const callerToken = await generateVideoSDKParticipantTokenViaBackend(callerName, meetingId);

    // Step 3: Generate a token for the CALLEE to join this meeting via your backend
    // Pass recipient's name or ID for token generation context
    const calleeToken = await generateVideoSDKParticipantTokenViaBackend(recipientName, meetingId);

    // Step 4: Notify the recipient via backend, sending meetingId and callee's token
    const notificationSent = await notifyRecipientViaBackend(
      callerAppUserId,
      callerName,
      recipientAppUserId,
      callType,
      meetingId,
      calleeToken // This token is for the callee, sent in FCM
    );

    if (!notificationSent) {
      // Attempt to deactivate room if notification failed, to avoid orphaned rooms
      await deactivateVideoSDKRoomViaBackend(meetingId);
      throw new Error('Failed to send call notification to recipient via backend.');
    }

    // Return meetingId and caller's token so the caller can join
    return { success: true, meetingId, token: callerToken };
  } catch (error: any) {
    console.error('[CallHelper] Error initiating VideoSDK call:', error);
    return { success: false, error: error.message || 'Unknown error during call initiation.' };
  }
};

// ... (Keep Agora related conceptual examples if still relevant for other parts of the app, or remove if fully VideoSDK)
/**
 * Example (Conceptual for Agora):
 * export const getAgoraRtcToken = async (channelName: string, uid: number) => {
 *   // const response = await ApiService.getAgoraTokenForCaller({ uid, channelName });
 *   // return response.token;
 * };
 * export const getAgoraRtmToken = async (uid: string) => {
 *   // const response = await ApiService.getAgoraRtmToken({ uid });
 *   // return response.token;
 * };
 */