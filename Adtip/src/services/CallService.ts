import { Alert, AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { appEventEmitter } from '../events/AppEventEmitter';
import CallKeepService from './CallKeepService';
import FirebaseService from './FirebaseService';
import { OtpVerifyResponse as User } from '../types/api';
import { FirebaseCallData } from './FirebaseCallService';
import FirebaseCallService from './FirebaseCallService';
import VideoSDKService from './videosdk/VideoSDKService';
import VideoSDKForegroundService from './VideoSDKForegroundService';
import ApiService from './ApiService';
import { FcmTokensRequest, FcmTokensResponse } from '../types/api';
import { getCurrentRoute, navigate } from '../navigation/NavigationService';

export interface ActiveCall {
  callId?: string;
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  recipientName: string;
  callerName: string;
  callerId?: string;
  callerFcmToken?: string;
  recipientId?: string;
  recipientFcmToken?: string;
  status?: 'dialing' | 'ringing' | 'connected' | 'ended';
  timestamp?: number;
}

class CallService {
  private static instance: CallService;
  public activeCall: ActiveCall | null = null;
  private isInitiator: boolean = false;
  private currentUser: User | null = null;
  private firebaseService: FirebaseService;
  private videoSDKService: VideoSDKService;
  private foregroundService: VideoSDKForegroundService;
  private callStateUpdateTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private callStateRestoreTimer: NodeJS.Timeout | null = null;
  private persistedCallStateKey = 'ADTIP_PERSISTED_CALL_STATE';
  private isAppInBackground = false;
  private navigationReadyPromise: Promise<void> | null = null;
  private navigationReadyResolver: (() => void) | null = null;

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.videoSDKService = VideoSDKService.getInstance();
    this.foregroundService = VideoSDKForegroundService.getInstance();
    this.initializeBackgroundHandling();
    this.setupForegroundServiceEventListeners();
    this.initializeNavigationReadyPromise();
    this.restoreCallStateFromPersistence();
  }
  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  /**
   * Initialize background/foreground handling
   */
  private initializeBackgroundHandling() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Initialize navigation ready promise
   */
  private initializeNavigationReadyPromise() {
    this.navigationReadyPromise = new Promise((resolve) => {
      this.navigationReadyResolver = resolve;
    });
  }

  /**
   * Call this when navigation is ready
   */
  public setNavigationReady() {
    if (this.navigationReadyResolver) {
      this.navigationReadyResolver();
      this.navigationReadyResolver = null;
    }
  }

  /**
   * Handle app state changes (background/foreground)
   */
  private handleAppStateChange(nextAppState: AppStateStatus) {
    const wasInBackground = this.isAppInBackground;
    this.isAppInBackground = nextAppState === 'background';
    
    console.log('[CallService] App state changed:', {
      previousState: wasInBackground ? 'background' : 'foreground',
      newState: nextAppState,
      hasActiveCall: !!this.activeCall
    });

    // When app comes back to foreground, restore call state if needed
    if (wasInBackground && nextAppState === 'active') {
      this.handleForegroundTransition();
    }
  }

  /**
   * Handle app coming back to foreground
   */
  private async handleForegroundTransition() {
    console.log('[CallService] Handling foreground transition');
    
    // Restore call state from persistence if not already present
    if (!this.activeCall) {
      await this.restoreCallStateFromPersistence();
    }

    // Ensure navigation is triggered if we have an active call
    if (this.activeCall) {
      console.log('[CallService] Restoring call navigation after foreground transition');
      this.emitCallStateChange();
      
      // Trigger navigation after a brief delay to ensure UI is ready
      setTimeout(() => {
        this.ensureNavigationToMeeting();
      }, 100);
    }
  }

  /**
   * Persist call state to AsyncStorage
   */
  private async persistCallState() {
    try {
      if (this.activeCall) {
        const callStateData = {
          ...this.activeCall,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(this.persistedCallStateKey, JSON.stringify(callStateData));
        console.log('[CallService] Call state persisted');
      } else {
        await AsyncStorage.removeItem(this.persistedCallStateKey);
        console.log('[CallService] Call state cleared from persistence');
      }
    } catch (error) {
      console.error('[CallService] Error persisting call state:', error);
    }
  }

  /**
   * Restore call state from AsyncStorage
   */
  private async restoreCallStateFromPersistence() {
    try {
      const persistedData = await AsyncStorage.getItem(this.persistedCallStateKey);
      if (persistedData) {
        const callState = JSON.parse(persistedData) as ActiveCall & { timestamp: number };
        
        // Only restore if the call is recent (within 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (callState.timestamp && callState.timestamp > fiveMinutesAgo) {
          console.log('[CallService] Restoring call state from persistence:', callState);
          this.activeCall = callState;
          this.emitCallStateChange();
          return true;
        } else {
          console.log('[CallService] Persisted call state is too old, ignoring');
          await AsyncStorage.removeItem(this.persistedCallStateKey);
        }
      }
    } catch (error) {
      console.error('[CallService] Error restoring call state:', error);
    }
    return false;
  }

  /**
   * Ensure navigation to meeting screen happens
   */
  private async ensureNavigationToMeeting() {
    if (!this.activeCall) return;
    
    // Wait for navigation to be ready
    if (this.navigationReadyPromise) {
      await this.navigationReadyPromise;
    }
    
    // Emit a special navigation event
    appEventEmitter.emit('forceNavigateToMeeting', {
      activeCall: this.activeCall
    });
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
   * Debounces the event to prevent rapid-fire updates and persists state.
   */
  private emitCallStateChange() {
    if (this.callStateUpdateTimer) {
      clearTimeout(this.callStateUpdateTimer);
    }
    
    this.callStateUpdateTimer = setTimeout(async () => {
      // Persist call state for background recovery
      await this.persistCallState();
      
      const eventData = { 
        isInCall: !!this.activeCall, 
        callStatus: this.activeCall?.status,
        callType: this.activeCall?.callType,
        activeCall: this.activeCall
      };
      
      appEventEmitter.emit('callStateChanged', eventData);
      console.log('[CallService] Emitted callStateChanged event:', {
        isInCall: eventData.isInCall,
        status: eventData.callStatus,
        hasActiveCall: !!eventData.activeCall
      });

      // Also emit a navigation-specific event for more reliable navigation
      if (this.activeCall) {
        setTimeout(() => {
          this.ensureNavigationToMeeting();
        }, 50);
      }
    }, 50); // 50ms debounce
  }  public async startOutgoingCall(recipientId: string, recipientName: string, callType: 'voice' | 'video'): Promise<boolean> {
    // Prevent starting a new call if one is already active
    if (this.activeCall) {
      Alert.alert('Call In Progress', 'You are already in a call.');
      return false;
    }

    try {
      console.log('[CallService] Starting outgoing call:', {
        callType,
        recipientId,
        recipientName
      });

      // Get current user ID and name first
      const userId = await AsyncStorage.getItem('userId');
      const callerName = await this.getCallerName();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!recipientId || !recipientName) {
        throw new Error('Recipient information is missing');
      }
      
      console.log('[CallService] User validation passed:', {
        callerId: userId,
        callerName,
        recipientId,
        recipientName
      });
      
      // Get both FCM tokens at once using the API
      const tokens = await this.getBothUserTokens(userId, recipientId);
      if (!tokens) {
        throw new Error('Failed to get FCM tokens');
      }
      
      console.log('[CallService] FCM tokens retrieved successfully');
      
      // Create VideoSDK meeting
      const { meetingId, token } = await this.setupVideoSDKMeeting();
      console.log('[CallService] VideoSDK meeting created:', { meetingId, hasToken: !!token });

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
        status: 'dialing',
        isInitiator: true,
        timestamp: Date.now()
      };

      console.log('[CallService] Active call state created:', {
        callId,
        meetingId,
        callType,
        isInitiator: true,
        hasToken: !!token
      });      // Immediately persist the call state for background recovery
      await this.persistCallState();
      
      // BULLETPROOF: Start VideoSDK foreground service for the call
      await this.startForegroundServiceForCall();
      
      // Notify listeners of the new call state
      this.emitCallStateChange();
      
      console.log('[CallService] Call state emitted, preparing Firebase call');
      
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
      // Initiate call with Firebase (this can be async in the background)
      ApiService.initiateCallWithFirebase(callData)
        .then((callResponse) => {
          if (!callResponse.success) {
            console.error('[CallService] Firebase call initiation failed:', callResponse.message);
            // Don't fail the entire call for Firebase issues
          } else {
            console.log('[CallService] Firebase call initiated successfully');
          }
        })
        .catch((error) => {
          console.error('[CallService] Firebase call initiation error:', error);
          // Don't fail the entire call for Firebase issues
        });
      
      // Ensure navigation happens after a brief delay
      setTimeout(() => {
        console.log('[CallService] Ensuring navigation to meeting screen');
        this.ensureNavigationToMeeting();
      }, 100);
      
      console.log('[CallService] Call setup completed successfully');
      return true;
    } catch (error: any) {
      console.error('[CallService] Error starting outgoing call:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to start call. Please try again.';
      if (error.message.includes('not authenticated')) {
        errorMessage = 'Please log in again to make calls.';
      } else if (error.message.includes('FCM tokens')) {
        errorMessage = 'Unable to connect to recipient. Please try again.';
      } else if (error.message.includes('VideoSDK')) {
        errorMessage = 'Call service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('Recipient information')) {
        errorMessage = 'Invalid recipient information. Please try again.';
      }
      
      Alert.alert('Call Error', errorMessage);
      
      // Ensure state is reset on failure
      await this.resetCallState();
      return false;
    }
  }  /**
   * Handles ending a call with proper cleanup and navigation
   */
  public async endCall(reason?: string) {
    try {
      if (!this.activeCall) {
        console.log('[CallService] No active call to end');
        return true;
      }
      
      console.log('[CallService] Ending call:', {
        callId: this.activeCall.callId,
        reason
      });

      const { meetingId, token } = this.activeCall;
      
      // Step 1: Immediately reset the local state to prevent multiple end calls
      const callToEnd = this.activeCall;
      this.activeCall = null;
      
      // Step 2: Emit leave event for any active VideoSDK meeting
      appEventEmitter.emit('leaveActiveCall');
      
      // Step 3: Clean up VideoSDK meeting on the backend (fire-and-forget)
      if (meetingId && token) {
        this.videoSDKService.deactivateMeeting(meetingId, token).catch(err => {
          console.warn('[CallService] Non-critical error deactivating VideoSDK meeting:', err);
        });
      }
      
      // Step 4: Clean up CallKeep if available
      try {
        const callKeepService = CallKeepService.getInstance();
        if (callKeepService.isCallKeepAvailable()) {
          // End any active CallKeep calls
          const callUUID = callKeepService.generateCallUUID();
          await callKeepService.endCall(callUUID).catch(() => {
            // Ignore errors - CallKeep might not have an active call
          });
        }
      } catch (error) {
        console.warn('[CallService] CallKeep cleanup error (non-critical):', error);
      }
        // Step 5: Stop VideoSDK foreground service
      await this.stopForegroundServiceForCall();
      
      // Step 6: Reset local state and persistence
      await this.resetCallState();
      
      // Step 7: Navigate back to previous screen if currently on Meeting screen
      setTimeout(() => {
        const currentRoute = getCurrentRoute();        if (currentRoute?.name === 'Meeting') {
          console.log('[CallService] Navigating away from Meeting screen after call end');
          navigate('Main', { screen: 'TipCall', params: {} });
        }
      }, 100);
      
      console.log('[CallService] Call ended successfully');
      return true;
    } catch (error) {
      console.error('[CallService] Error ending call:', error);
      // Force reset state even if there's an error
      this.activeCall = null;
      await this.resetCallState();
      
      // Still attempt navigation cleanup
      setTimeout(() => {
        const currentRoute = getCurrentRoute();        if (currentRoute?.name === 'Meeting') {
          navigate('Main', { screen: 'TipCall', params: {} });
        }
      }, 100);      
      return false;
    }
  }

  /**
   * Reset call state and clean up resources
   */
  public async resetCallState() {
    console.log('[CallService] Resetting call state.');
    
    // Clear all timers
    if (this.callStateUpdateTimer) {
      clearTimeout(this.callStateUpdateTimer);
      this.callStateUpdateTimer = null;
    }
    
    if (this.callStateRestoreTimer) {
      clearTimeout(this.callStateRestoreTimer);
      this.callStateRestoreTimer = null;
    }
    
    // Clear active call
    this.activeCall = null;
    this.isInitiator = false;
    
    // Clear persisted state
    await this.persistCallState();
    
    // Emit state change
    this.emitCallStateChange();
  }
  /**
   * Cleanup resources when service is destroyed
   */
  public cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.callStateUpdateTimer) {
      clearTimeout(this.callStateUpdateTimer);
    }
    
    if (this.callStateRestoreTimer) {
      clearTimeout(this.callStateRestoreTimer);
    }
    
    // BULLETPROOF: Cleanup VideoSDK foreground service
    this.foregroundService.destroy();
    
    // Remove foreground service event listeners
    DeviceEventEmitter.removeAllListeners('endCallFromForegroundService');
    DeviceEventEmitter.removeAllListeners('toggleMuteFromForegroundService');
  }
  /**
   * Updates the status of the active call and notifies listeners.
   */
  public updateCallStatus(status: 'dialing' | 'ringing' | 'connected' | 'ended') {
    if (this.activeCall) {
      console.log(`[CallService] Updating call status from ${this.activeCall.status} to ${status}`);
      this.activeCall.status = status;
      
      // BULLETPROOF: Update foreground service with new status
      this.updateForegroundServiceStatus(status);
      
      this.emitCallStateChange();
    } else {
      console.warn(`[CallService] Attempted to update status to "${status}" but no active call.`);
    }
  }

  /**
   * CRITICAL FIX: Handle incoming call from FCM notification
   */
  public async handleIncomingCall(callData: {
    callId: string;
    meetingId: string;
    token: string;
    callerId: string;
    callerName: string;
    callerFcmToken: string;
    callType: 'voice' | 'video';
  }): Promise<void> {
    try {
      console.log('[CallService] Handling incoming call:', callData);
      
      // Get current user info
      const userId = await AsyncStorage.getItem('userId');
      const currentUserName = await this.getCallerName();
      
      if (!userId) {
        console.error('[CallService] No authenticated user for incoming call');
        return;
      }
      
      // Set up incoming call state
      this.activeCall = {
        callId: callData.callId,
        meetingId: callData.meetingId,
        token: callData.token,
        callType: callData.callType,
        isInitiator: false, // This is an incoming call
        recipientName: currentUserName, // Local user is the recipient
        callerName: callData.callerName, // Remote user is the caller
        callerId: callData.callerId,
        callerFcmToken: callData.callerFcmToken,
        recipientId: userId,
        status: 'ringing',
        timestamp: Date.now()
      };
      
      // Persist state immediately
      await this.persistCallState();
      
      // Emit state change
      this.emitCallStateChange();
      
      // CRITICAL FIX: Trigger native call experience
      await this.triggerNativeIncomingCall(callData);
      
      console.log('[CallService] Incoming call setup complete');
    } catch (error) {
      console.error('[CallService] Error handling incoming call:', error);
      await this.resetCallState();
    }
  }

  /**
   * CRITICAL FIX: Trigger native incoming call UI
   */
  private async triggerNativeIncomingCall(callData: any): Promise<void> {
    try {
      // Import services dynamically to avoid circular imports
      const [
        { default: CallKeepService },
        { default: NotificationService }
      ] = await Promise.all([
        import('./CallKeepService'),
        import('./NotificationService')
      ]);
      
      const callKeepService = CallKeepService.getInstance();
      
      // Generate UUID for the call
      const callUUID = callKeepService.generateCallUUID();
      
      // Display native incoming call screen using CallKeep
      await callKeepService.displayIncomingCall(
        callUUID,
        callData.callerId,
        callData.callerName,
        'generic',
        callData.callType === 'video'
      );
      
      // Also display rich notification using notifee
      await NotificationService.displayIncomingCallNotification(
        callData.callId,
        callData.callerName,
        callData.callType
      );
      
      console.log('[CallService] Native incoming call UI triggered');
    } catch (error) {
      console.error('[CallService] Error triggering native incoming call:', error);
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

  /**
   * BULLETPROOF: Setup event listeners for VideoSDK foreground service
   */
  private setupForegroundServiceEventListeners(): void {
    // Listen for end call from foreground service
    DeviceEventEmitter.addListener('endCallFromForegroundService', () => {
      console.log('[CallService] End call triggered from foreground service');
      this.endCall('ended_from_foreground_service');
    });

    // Listen for mute toggle from foreground service
    DeviceEventEmitter.addListener('toggleMuteFromForegroundService', () => {
      console.log('[CallService] Mute toggle triggered from foreground service');
      // Emit event for meeting screen to handle mute toggle
      appEventEmitter.emit('toggleMuteFromService');
    });
  }

  /**
   * BULLETPROOF: Start foreground service when call begins
   */
  private async startForegroundServiceForCall(): Promise<void> {
    if (!this.activeCall) return;

    try {
      const callData = {
        meetingId: this.activeCall.meetingId,
        callType: this.activeCall.callType,
        participantName: this.activeCall.recipientName,
        callerName: this.activeCall.callerName,
        isInitiator: this.activeCall.isInitiator,
      };

      const started = await this.foregroundService.startForegroundService(callData);
      
      if (started) {
        console.log('[CallService] VideoSDK foreground service started for call');
      } else {
        console.warn('[CallService] Failed to start VideoSDK foreground service');
      }
    } catch (error) {
      console.error('[CallService] Error starting VideoSDK foreground service:', error);
    }
  }

  /**
   * BULLETPROOF: Update foreground service with call status
   */
  private async updateForegroundServiceStatus(status: string, participantCount?: number): Promise<void> {
    if (!this.activeCall || !this.foregroundService.isServiceActive()) return;

    try {
      const updateData = {
        isConnected: status === 'connected',
        participantCount: participantCount || 1,
      };

      await this.foregroundService.updateForegroundService(updateData);
      console.log('[CallService] VideoSDK foreground service updated:', updateData);
    } catch (error) {
      console.error('[CallService] Error updating VideoSDK foreground service:', error);
    }
  }

  /**
   * BULLETPROOF: Stop foreground service when call ends
   */
  private async stopForegroundServiceForCall(): Promise<void> {
    try {
      await this.foregroundService.stopForegroundService();
      console.log('[CallService] VideoSDK foreground service stopped');
    } catch (error) {
      console.error('[CallService] Error stopping VideoSDK foreground service:', error);
    }
  }
}

export default CallService.getInstance();