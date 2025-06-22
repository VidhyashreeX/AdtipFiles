import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { appEventEmitter } from '../events/AppEventEmitter';
import CallKeepService from './CallKeepService';
import FirebaseService from './FirebaseService';
import { OtpVerifyResponse as User } from '../types/api';
import { FirebaseCallData } from './FirebaseCallService';
import FirebaseCallService from './FirebaseCallService';
import VideoSDKService from './videosdk/VideoSDKService';
import ApiService from './ApiService';
import { useVideoSDK } from '../contexts/VideoSDKContext';
import { FcmTokensRequest, FcmTokensResponse } from '../types/api';

export interface ActiveCall {
  callId: string;
  meetingId: string;
  token: string;
  callerId: string;
  callerName: string;
  callerFcmToken: string;
  recipientId: string;
  recipientName: string;
  recipientFcmToken: string;
  callType: 'voice' | 'video';
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
  isInitiator: boolean;
}

class CallService {
  private static instance: CallService;
  public activeCall: ActiveCall | null = null;
  private isInitiator: boolean = false;
  private currentUser: User | null = null;
  private firebaseService: FirebaseService;
  private videoSDKService: VideoSDKService;
  private callStateUpdateTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.videoSDKService = VideoSDKService.getInstance();
    // other initializations
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  private async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr) as User;
      this.currentUser = user;
      return user;
    }
    return null;
  }

  /**
   * Sets up a VideoSDK meeting by generating a token and creating a meeting
   * @returns Object containing the meetingId and token
   */
  private async setupVideoSDKMeeting(): Promise<{ meetingId: string, token: string }> {
    try {
      console.log('[CallService] Setting up VideoSDK meeting');
      
      // Generate a token for VideoSDK
      const tokenResponse = await this.videoSDKService.generateParticipantToken();
      if (!tokenResponse) {
        throw new Error('Failed to generate VideoSDK participant token');
      }
      
      // Create a meeting room using the token
      const meetingId = await this.videoSDKService.createMeeting(tokenResponse);
      if (!meetingId) {
        throw new Error('Failed to create VideoSDK meeting');
      }
      
      console.log('[CallService] VideoSDK meeting setup complete:', { meetingId, token: tokenResponse });
      return {
        meetingId,
        token: tokenResponse
      };
    } catch (error) {
      console.error('[CallService] Error setting up VideoSDK meeting:', error);
      throw new Error('Failed to setup call infrastructure. Please try again.');
    }
  }

  /**
   * Gets the caller's display name from AsyncStorage
   */
  private async getCallerName(): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      if (user && user.name) {
        return user.name;
      }
      // Fallback to username or other identifiers
      const userName = await AsyncStorage.getItem('userName');
      return userName || 'Anonymous';
    } catch (error) {
      console.error('[CallService] Error getting caller name:', error);
      return 'Unknown Caller';
    }
  }

  /**
   * Gets the platform of the recipient (Android/iOS)
   * Uses tokens from getBothUserTokens instead of separate API call
   */
  private async getRecipientPlatform(recipientId: string | number, tokens?: { recipientToken: string }): Promise<'ANDROID' | 'IOS'> {
    // If we already have tokens from a previous call, no need to make another API call
    if (tokens?.recipientToken) {
      // Default to ANDROID if we can't determine platform from token
      return 'ANDROID';
    }
    
    try {
      // Fallback to direct API call only if we don't have tokens yet
      const response = await ApiService.getFCMToken(recipientId.toString());
      return response?.platform || 'ANDROID';
    } catch (error) {
      console.error(`[CallService] Error getting recipient platform: ${error}`);
      return 'ANDROID'; // Default to Android if unavailable
    }
  }
  
  /**
   * Generate a simple UUID that doesn't rely on crypto.getRandomValues()
   * Used as a fallback when the standard uuid library fails
   */
  private generateSimpleUUID(): string {
    // Simple fallback UUID generator that doesn't use crypto
    const timestamp = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Notifies the rest of the app about call state changes.
   * Debounces the event to prevent rapid-fire updates.
   */
  private emitCallStateChange() {
    if (this.callStateUpdateTimer) {
      clearTimeout(this.callStateUpdateTimer);
    }
    this.callStateUpdateTimer = setTimeout(() => {
      appEventEmitter.emit('callStateChanged', { 
        isInCall: !!this.activeCall, 
        callStatus: this.activeCall?.status,
        callType: this.activeCall?.callType,
      });
      console.log('[CallService] Emitted callStateChanged event:', {
        isInCall: !!this.activeCall,
        status: this.activeCall?.status,
      });
    }, 50); // 50ms debounce
  }

  public async startOutgoingCall(recipientId: string, recipientName: string, callType: 'voice' | 'video') {
    // Prevent starting a new call if one is already active
    if (this.activeCall) {
      Alert.alert('Call In Progress', 'You are already in a call.');
      return false;
    }

    try {
      // Get current user ID and name first
      const userId = await AsyncStorage.getItem('userId');
      const callerName = await this.getCallerName();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      console.log('[CallService] Starting outgoing call:', {
        callType,
        recipientId,
        recipientName,
        callerId: userId,
        callerName
      });
      
      // Get both FCM tokens at once using the API
      const tokens = await this.getBothUserTokens(userId, recipientId);
      if (!tokens) {
        throw new Error('Failed to get FCM tokens');
      }
      
      // Create VideoSDK meeting
      const { meetingId, token } = await this.setupVideoSDKMeeting();

      // Generate a unique call ID
      let callId: string;
      try {
        callId = uuidv4();
      } catch (error) {
        console.warn('[CallService] UUID generation failed, using fallback:', error);
        callId = this.generateSimpleUUID();
      }
      
      // Set up the complete active call state at once
      this.activeCall = {
        callId,
        meetingId,
        token,
        callerId: userId,
        callerName,
        callerFcmToken: tokens.callerToken,
        recipientId,
        recipientName,
        recipientFcmToken: tokens.recipientToken,
        callType,
        status: 'dialing', // Start as 'dialing'
        isInitiator: true,
      };

      // Notify listeners of the new call state
      this.emitCallStateChange();
      
      // Prepare call data for Firebase
      const callData = {
        calleeInfo: {
          platform: await this.getRecipientPlatform(recipientId, tokens),
          token: tokens.recipientToken,
        },
        callerInfo: {
          name: callerName,
          token: tokens.callerToken,
        },
        videoSDKInfo: {
          meetingId,
          token,
        }
      };
      
      // Initiate call with Firebase
      const callResponse = await ApiService.initiateCallWithFirebase(callData);
      
      if (!callResponse.success) {
        throw new Error(callResponse.message || 'Call initiation failed');
      }
      
      // We'll let the calling component handle navigation now
      return true;
    } catch (error) {
      console.error('[CallService] Error starting outgoing call:', error);
      Alert.alert('Call Error', 'Failed to start call. Please try again.');
      // Ensure state is reset on failure
      this.resetCallState();
      return false;
    }
  }

  /**
   * Handles ending a call
   */
  public async endCall(reason?: string) {
    try {
      if (!this.activeCall) {
        console.log('[CallService] No active call to end');
        return;
      }
      
      console.log('[CallService] Ending call:', {
        callId: this.activeCall.callId,
        reason
      });

      // Step 1: Notify the UI to leave the VideoSDK meeting immediately.
      // This is crucial to stop audio/video streams on the client.
      appEventEmitter.emit('leaveActiveCall');
      
      const { meetingId, token } = this.activeCall;
      
      // Step 2: Attempt to deactivate the meeting on the backend.
      // This is fire-and-forget; we don't block the UI for it.
      this.videoSDKService.deactivateMeeting(meetingId, token).catch(err => {
        console.warn('[CallService] Non-critical error deactivating VideoSDK meeting:', err);
      });
      
      // Step 3: Immediately reset the local state.
      // The UI will react to this state change and unmount the call screen.
      this.resetCallState();
      
      return true;
    } catch (error) {
      console.error('[CallService] Error ending call:', error);
      this.resetCallState(); // Still reset state even if there's an error
      return false;
    }
  }

  /**
   * Reset call state
   */
  public resetCallState() {
    console.log('[CallService] Resetting call state.');
    this.activeCall = null;
    this.isInitiator = false;
    this.emitCallStateChange();
  }

  /**
   * Updates the status of the active call and notifies listeners.
   */
  public updateCallStatus(status: 'dialing' | 'ringing' | 'connected' | 'ended') {
    if (this.activeCall) {
      console.log(`[CallService] Updating call status from ${this.activeCall.status} to ${status}`);
      this.activeCall.status = status;
      this.emitCallStateChange();
    } else {
      console.warn(`[CallService] Attempted to update status to "${status}" but no active call.`);
    }
  }

  /**
   * Get FCM tokens for both users at once (caller and recipient)
   * @param callerId The ID of the caller (current user)
   * @param recipientId The ID of the call recipient
   * @returns Object containing both tokens or null if error
   */
  async getBothUserTokens(callerId: number | string, recipientId: number | string): Promise<{callerToken: string, recipientToken: string} | null> {
    try {
      // Convert IDs to numbers if they're strings
      const callerIdNum = typeof callerId === 'string' ? parseInt(callerId, 10) : callerId;
      const recipientIdNum = typeof recipientId === 'string' ? parseInt(recipientId, 10) : recipientId;
      
      // Create the request with both IDs - caller first, recipient second
      const request: FcmTokensRequest = {
        userIds: [callerIdNum, recipientIdNum]
      };
      
      console.log('[CallService] Getting FCM tokens for users:', request);
      
      // Call the API to get both tokens
      const response = await ApiService.post<FcmTokensResponse>(
        '/api/fcm-tokens-of-both-users',
        request
      );
      
      // Verify response structure
      if (!response.results || response.results.length !== 2) {
        console.error('[CallService] Invalid response format for FCM tokens:', response);
        return null;
      }
      
      // Find each user's token in the results
      const callerResult = response.results.find((r: { userId: number; }) => r.userId === callerIdNum);
      const recipientResult = response.results.find((r: { userId: number; }) => r.userId === recipientIdNum);
      
      if (!callerResult?.fcm_token || !recipientResult?.fcm_token) {
        console.error('[CallService] Missing FCM token in response:', {
          callerFound: !!callerResult,
          recipientFound: !!recipientResult
        });
        return null;
      }
      
      console.log('[CallService] Successfully retrieved FCM tokens');
      
      return {
        callerToken: callerResult.fcm_token,
        recipientToken: recipientResult.fcm_token
      };
    } catch (error) {
      console.error('[CallService] Error getting FCM tokens for users:', error);
      return null;
    }
  }
}

export default CallService.getInstance();