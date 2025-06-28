import { AppState, AppStateStatus, DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../events/AppEventEmitter';
import WhatsAppCallManager from './calling/WhatsAppCallManager'; // NEW: WhatsApp-like calling
import WhatsAppCallNotificationService from './calling/WhatsAppCallNotificationService'; // NEW: Enhanced notifications
import { OtpVerifyResponse as User } from '../types/api';
import VideoSDKService from './videosdk/VideoSDKService';
import ApiService from './ApiService';
import { FcmTokensRequest, FcmTokensResponse } from '../types/api';

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
  private videoSDKService: VideoSDKService;
  private whatsAppCallManager: WhatsAppCallManager; // NEW: WhatsApp-like calling
  private whatsAppNotificationService: WhatsAppCallNotificationService; // NEW: Enhanced notifications
  private callStateUpdateTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private callStateRestoreTimer: NodeJS.Timeout | null = null;
  private persistedCallStateKey = 'ADTIP_PERSISTED_CALL_STATE';
  private isAppInBackground = false;
  private lastAppState: AppStateStatus = 'active';
  private lastAppStateChangeTime: number = 0;
  private navigationReadyPromise: Promise<void> | null = null;
  private navigationReadyResolver: (() => void) | null = null;

  private constructor() {
    this.videoSDKService = VideoSDKService.getInstance();
    this.whatsAppCallManager = WhatsAppCallManager.getInstance(); // NEW: WhatsApp-like calling
    this.whatsAppNotificationService = WhatsAppCallNotificationService.getInstance(); // NEW: Enhanced notifications
    this.initializeBackgroundHandling();
    this.setupForegroundServiceEventListeners();
    this.setupFCMEventListeners(); // NEW: Setup FCM event listeners
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
    
    // Throttle app state changes to prevent rapid switching
    const now = Date.now();
    if (this.lastAppStateChangeTime && now - this.lastAppStateChangeTime < 1000) {
      return; // Ignore state changes that happen within 1 second
    }
    
    // Only process if state actually changed
    if (this.lastAppState === nextAppState) {
      return;
    }
    
    this.isAppInBackground = nextAppState === 'background';
    this.lastAppState = nextAppState;
    this.lastAppStateChangeTime = now;
    
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
   * Uses the new getBothUsersFCMTokens API instead of separate API call
   */
  private async getRecipientPlatform(recipientId: string | number, tokens?: { recipientToken: string }): Promise<'ANDROID' | 'IOS'> {
    // If we already have tokens from a previous call, no need to make another API call
    if (tokens?.recipientToken) {
      // Default to ANDROID if we can't determine platform from token
      return 'ANDROID';
    }
    
    try {
      // Get current user ID for efficient batch call
      const currentUser = await this.getCurrentUser();
      const callerUserId = currentUser?.id?.toString() || '0';
      
      // Use the new efficient batch API
      const tokenDetails = await ApiService.getBothUsersFCMTokens(callerUserId, recipientId.toString());
      return tokenDetails.recipientPlatform;
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
  }

  /**
   * Bulletproof outgoing call flow: generate token, create meeting, initiate call, set state, navigate
   */
  public async startOutgoingCall(recipientId: string, recipientName: string, callType: 'voice' | 'video'): Promise<boolean> {
    try {
      // 1. Generate VideoSDK token
      const { token } = await ApiService.generateVideoSDKToken();
      if (!token) throw new Error('Failed to generate VideoSDK token');

      // 2. Create VideoSDK meeting
      const { roomId: meetingId } = await ApiService.createVideoSDKMeeting(token);
      if (!meetingId) throw new Error('Failed to create VideoSDK meeting');

      // 3. Initiate call via Cloud Function
      const callerFcmToken = this.currentUser?.fcm_token || '';
      const payload = {
        calleeInfo: { platform: 'ANDROID', token: String(recipientId) },
        callerInfo: { name: this.currentUser?.name || 'User', token: callerFcmToken },
        videoSDKInfo: { meetingId, token },
      };
      await ApiService.initiateCall(payload);

      // 4. Set active call state
      this.activeCall = {
        meetingId,
        token,
        callType,
        isInitiator: true,
        recipientName,
        callerName: this.currentUser?.name || 'User',
        callerId: this.currentUser?.id ? String(this.currentUser.id) : undefined,
        callerFcmToken: callerFcmToken, // Store the same FCM token used for initiation
        recipientId: String(recipientId),
        status: 'dialing',
        timestamp: Date.now(),
      };
      this.emitCallStateChange();
      // 5. Navigation handled by App.tsx effect
      return true;
    } catch (error) {
      console.error('[CallService] Outgoing call error:', error);
      await this.resetCallState();
      return false;
    }
  }

  /**
   * Bulletproof incoming call handler: set active call state from native/FCM event, emit, navigate
   */
  public handleIncomingCallFromNative(event: { meetingId: string, token: string, callType: 'voice' | 'video', callerName: string, callerId: string, recipientName: string, recipientId: string }): void {
    this.activeCall = {
      meetingId: event.meetingId,
      token: event.token,
      callType: event.callType,
      isInitiator: false,
      recipientName: event.recipientName,
      callerName: event.callerName,
      callerId: event.callerId,
      callerFcmToken: this.currentUser?.fcm_token || '', // Store current user's FCM token for later use
      recipientId: event.recipientId,
      status: 'ringing',
      timestamp: Date.now(),
    };
    this.emitCallStateChange();
    // Navigation handled by App.tsx effect
  }

  /**
   * Bulletproof call end: update status, leave/deactivate VideoSDK, clean up state
   */
  public async endCall(reason?: string) {
    try {
      if (!this.activeCall) return;
      
      console.log('[CallService] Ending call:', reason);

      // End call through WhatsApp Call Manager to synchronize all states
      await this.whatsAppCallManager.endCall();

      // Update call status on backend
      let fcmToken = this.activeCall.callerFcmToken || this.currentUser?.fcm_token;
      let userName = this.activeCall.callerName || this.currentUser?.name;
      
      console.log('[CallService] Updating call status with:', {
        token: fcmToken ? 'present' : 'missing',
        name: userName ? userName : 'missing',
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        usingStoredToken: !!this.activeCall.callerFcmToken,
        tokenSource: this.activeCall.callerFcmToken ? 'activeCall' : 'currentUser',
        isInitiator: this.activeCall.isInitiator
      });
      
      if (!fcmToken || !userName) {
        console.warn('[CallService] Missing required fields for updateCallStatus:', {
          fcmToken: !!fcmToken,
          userName: !!userName,
          storedToken: !!this.activeCall.callerFcmToken,
          currentUserToken: !!this.currentUser?.fcm_token
        });
        // Try to get current user data if missing
        if (!this.currentUser) {
          const refreshedUser = await this.getCurrentUser();
          // Update the variables after getting user data
          fcmToken = this.activeCall.callerFcmToken || refreshedUser?.fcm_token;
          userName = this.activeCall.callerName || refreshedUser?.name;
        }
      }
      
      // Final validation before API call
      if (!fcmToken || !userName) {
        console.error('[CallService] Still missing required fields after retry:', {
          fcmToken: !!fcmToken,
          userName: !!userName,
          fcmTokenValue: fcmToken ? 'present' : 'missing',
          userNameValue: userName || 'missing'
        });
        throw new Error('Missing required fields for updateCallStatus API call');
      }
      
      const updatePayload = {
        callerInfo: {
          token: fcmToken,
          name: userName,
          platform: (Platform.OS === 'ios' ? 'IOS' : 'ANDROID') as 'ANDROID' | 'IOS',
        },
        type: 'CALL_ENDED' as const,
      };
      
      console.log('[CallService] Sending updateCallStatus with payload:', JSON.stringify(updatePayload, null, 2));
      
      await ApiService.updateCallStatus(updatePayload);

      // Emit event for any listening components
      appEventEmitter.emit('leaveActiveCall');

      // Reset local state
      await this.resetCallState();
      
      console.log('[CallService] Call ended successfully');
    } catch (error) {
      console.error('[CallService] endCall error:', error);
      await this.resetCallState();
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

      // Prevent handling if a call is already active
      if (this.activeCall) {
        console.warn('[CallService] Ignoring incoming call because another call is already active.');
        return;
      }
      
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
        callerFcmToken: callData.callerFcmToken, // The token of the person calling us
        recipientId: userId,
        status: 'ringing',
        timestamp: Date.now()
      };
      
      // Persist state immediately
      await this.persistCallState();
      
      // Emit state change to update UI (e.g., CallProvider)
      this.emitCallStateChange();
      
      // CRITICAL: Trigger native call experience
      await this.triggerNativeIncomingCall(callData);
      
      console.log('[CallService] Incoming call setup complete');
    } catch (error) {
      console.error('[CallService] Error handling incoming call:', error);
      await this.resetCallState();
    }
  }

  /**
   * WHATSAPP-LIKE: Trigger native incoming call UI (no telecom)
   */
  private async triggerNativeIncomingCall(callData: any): Promise<void> {
    try {
      // Use WhatsApp-like calling service
      const whatsAppCallManager = this.whatsAppCallManager;
      
      // Show WhatsApp-like incoming call (no telecom integration)
      await whatsAppCallManager.handleIncomingCall({
        callId: callData.callId,
        callerName: callData.callerName,
        callType: callData.callType,
        meetingId: callData.meetingId,
        token: callData.token,
        callerId: String(callData.callerId), // Convert to string
      });
      
      console.log('[CallService] WhatsApp-like incoming call UI triggered');
    } catch (error) {
      console.error('[CallService] Error triggering WhatsApp-like incoming call:', error);
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
   * Setup FCM event listeners to handle events from FirebaseService
   */
  private setupFCMEventListeners() {
    // Listen for incoming call events from FCM
    appEventEmitter.on('incomingCallFromFCM', (callData: {
      callId: string;
      meetingId: string;
      token: string;
      callerId: string;
      callerName: string;
      callerFcmToken: string;
      callType: 'voice' | 'video';
    }) => {
      console.log('[CallService] Received incoming call from FCM:', callData);
      this.handleIncomingCall(callData);
    });

    // Listen for call accepted events from FCM
    appEventEmitter.on('callAcceptedFromFCM', (callId: string) => {
      console.log('[CallService] Received call accepted from FCM:', callId);
      // Handle call accepted logic if needed
      if (this.activeCall && this.activeCall.callId === callId) {
        this.activeCall.status = 'connected';
        this.emitCallStateChange();
      }
    });

    // Listen for call declined events from FCM
    appEventEmitter.on('callDeclinedFromFCM', (callId: string) => {
      console.log('[CallService] Received call declined from FCM:', callId);
      // Handle call declined logic if needed
      if (this.activeCall && this.activeCall.callId === callId) {
        this.endCall('Call declined by recipient');
      }
    });
  }
}

export default CallService.getInstance();