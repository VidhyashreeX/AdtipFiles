import { Platform } from 'react-native'; // Keeping Platform import, though not used in this file
// Import RtmEngine as the default export, and other types as named exports
import RtmEngine, {
  RtmLocalInvitation as AgoraRtmLocalInvitation,
  RtmRemoteInvitation as AgoraRtmRemoteInvitation,
  ConnectionState,
  ConnectionChangeReason,
  RtmMessage,
  LoginInfo,
  RtmLocalInvitationProps, // Import RtmLocalInvitationProps
} from 'agora-react-native-rtm';
// Remove RtmStatusCode import if it's not used or defined as such
// import RtmStatusCode from 'agora-react-native-rtm'; 
import ApiService from './ApiService'; // Assuming ApiService exists and is correctly implemented

export interface RtmTokenRequest {
  uid: string;
}

export interface RtmTokenResponse {
  token: string;
  userId: string; // Ensure your backend sends this along with the token
}

// Event types for type safety
export type RtmEventType =
  'connectionStateChanged' |
  'messageReceived' |
  'tokenExpired' |
  'error' |
  'localInvitationReceivedByPeer' |
  'localInvitationAccepted' |
  'localInvitationRefused' |
  'localInvitationCanceled' |
  'localInvitationFailure' |
  'remoteInvitationReceived' |
  'remoteInvitationAccepted' |
  'remoteInvitationRefused' |
  'remoteInvitationCanceled' |
  'remoteInvitationFailure' |
  'reloginFailed'; // Added for more specific error handling

class AgoraRtmHelper {
  private static instance: AgoraRtmHelper;
  private rtmEngine: RtmEngine | null = null;
  private APP_ID = 'ef5fbd2647c64582a64db9e47b9f9335';
  private userId: string | null = null;
  private isLoggedIn: boolean = false;
  private eventListeners: Map<RtmEventType, Set<Function>> = new Map();

  // Singleton pattern
  static getInstance(): AgoraRtmHelper {
    if (!AgoraRtmHelper.instance) {
      AgoraRtmHelper.instance = new AgoraRtmHelper();
    }
    return AgoraRtmHelper.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  // Initialize the RTM engine
  async initialize(): Promise<RtmEngine> {
    if (this.rtmEngine) {
      return this.rtmEngine;
    }

    try {
      console.log('[RTM] Initializing Agora RTM engine (new RtmEngine() -> createClient())');
      console.log('[RTM DEBUG] RtmEngine import:', RtmEngine);
      console.log('[RTM DEBUG] typeof RtmEngine:', typeof RtmEngine);

      if (typeof RtmEngine === 'function') { // Check if RtmEngine is a class constructor
        this.rtmEngine = new RtmEngine();
        console.log('[RTM DEBUG] RtmEngine instance created:', this.rtmEngine);
        if (this.rtmEngine && typeof this.rtmEngine.createClient === 'function') {
          console.log('[RTM DEBUG] rtmEngine.createClient IS a function. Calling it.');
          await this.rtmEngine.createClient(this.APP_ID);
        } else {
          console.error('[RTM DEBUG] rtmEngine.createClient is NOT a function on the instance.');
          console.error('[RTM DEBUG] RtmEngine instance value:', this.rtmEngine);
          throw new Error('RtmEngine instance does not have createClient method. The RTM module might not be loaded correctly.');
        }
      } else {
        console.error('[RTM DEBUG] RtmEngine is NOT a constructor or RtmEngine is not as expected.');
        console.error('[RTM DEBUG] RtmEngine value:', RtmEngine);
        throw new Error('RtmEngine is not a constructor. The RTM module might not be loaded correctly.');
      }
      
      // Set up RTM event listeners
      this.setupEventListeners();

      console.log('[RTM] Agora RTM engine initialized successfully');
      return this.rtmEngine;
    } catch (error) {
      console.error('[RTM] Failed to initialize Agora RTM engine:', error);
      this.rtmEngine = null;
      throw error;
    }
  }

  // Set up event listeners for RTM events
  private setupEventListeners() {
    if (!this.rtmEngine) {
      console.warn('[RTM] RTM Engine is null. Cannot set up event listeners.');
      return;
    }

    this.rtmEngine.on('ConnectionStateChanged', (newState: ConnectionState, reason: ConnectionChangeReason) => {
      console.log(`[RTM] Connection state changed to ${newState}, reason: ${reason}`);
      this.emit('connectionStateChanged', { newState, reason });

      // Optionally, update isLoggedIn based on connection state
      if (newState === ConnectionState.CONNECTED) {
        this.isLoggedIn = true;
      } else if (newState === ConnectionState.DISCONNECTED || newState === ConnectionState.ABORTED) {
        this.isLoggedIn = false;
        // userId should only be cleared if it's a forced logout or unrecoverable error
        // For transient disconnections, keep userId to allow re-login.
      }
    });

    this.rtmEngine.on('MessageReceived', (peerId: string, message: RtmMessage) => {
      console.log(`[RTM] Message received from ${peerId}:`, message);
      this.emit('messageReceived', { peerId, message });
    });

    this.rtmEngine.on('LocalInvitationReceivedByPeer', (localInvitation: RtmLocalInvitation) => {
      console.log('[RTM] Local invitation received by peer:', localInvitation);
      this.emit('localInvitationReceivedByPeer', localInvitation);
    });

    this.rtmEngine.on('LocalInvitationAccepted', (localInvitation: RtmLocalInvitation) => {
      console.log('[RTM] Local invitation accepted:', localInvitation);
      this.emit('localInvitationAccepted', localInvitation);
    });

    this.rtmEngine.on('LocalInvitationRefused', (localInvitation: RtmLocalInvitation) => {
      console.log('[RTM] Local invitation refused:', localInvitation);
      this.emit('localInvitationRefused', localInvitation);
    });

    this.rtmEngine.on('LocalInvitationCanceled', (localInvitation: RtmLocalInvitation) => {
      console.log('[RTM] Local invitation canceled:', localInvitation);
      this.emit('localInvitationCanceled', localInvitation);
    });

    this.rtmEngine.on('LocalInvitationFailure', (localInvitation: RtmLocalInvitation, errorCode: number) => {
      console.log('[RTM] Local invitation failure:', localInvitation, errorCode);
      this.emit('localInvitationFailure', { localInvitation, errorCode });
    });

    this.rtmEngine.on('RemoteInvitationReceived', (remoteInvitation: RtmRemoteInvitation) => {
      console.log('[RTM] Remote invitation received:', remoteInvitation);
      this.emit('remoteInvitationReceived', remoteInvitation);
    });

    this.rtmEngine.on('RemoteInvitationAccepted', (remoteInvitation: RtmRemoteInvitation) => {
      console.log('[RTM] Remote invitation accepted:', remoteInvitation);
      this.emit('remoteInvitationAccepted', remoteInvitation);
    });

    this.rtmEngine.on('RemoteInvitationRefused', (remoteInvitation: RtmRemoteInvitation) => {
      console.log('[RTM] Remote invitation refused:', remoteInvitation);
      this.emit('remoteInvitationRefused', remoteInvitation);
    });

    this.rtmEngine.on('RemoteInvitationCanceled', (remoteInvitation: RtmRemoteInvitation) => {
      console.log('[RTM] Remote invitation canceled:', remoteInvitation);
      this.emit('remoteInvitationCanceled', remoteInvitation);
    });

    this.rtmEngine.on('RemoteInvitationFailure', (remoteInvitation: RtmRemoteInvitation, errorCode: number) => {
      console.log('[RTM] Remote invitation failure:', remoteInvitation, errorCode);
      this.emit('remoteInvitationFailure', { remoteInvitation, errorCode });
    });

    // IMPROVED: Handle TokenExpired with automatic re-login attempt
    this.rtmEngine.on('TokenExpired', async () => {
      console.warn('[RTM] RTM Token expired! Attempting to re-login...');
      this.emit('tokenExpired'); // Notify any listeners that token has expired

      if (this.userId) { // Only attempt to re-login if we have a known user ID
        try {
          // Fetch a new token and re-login with the same user ID
          // The `login` method already handles fetching a new token
          await this.login(this.userId);
          console.log('[RTM] Successfully re-logged in after token expiration.');
        } catch (error) {
          console.error('[RTM] Failed to re-login after token expiration:', error);
          this.emit('reloginFailed', error); // Emit specific event for UI/App logic
          // Consider forced logout or UI intervention if re-login consistently fails
        }
      } else {
        console.error('[RTM] Token expired but userId is null. Cannot re-login automatically.');
        // This scenario indicates a logic error if a token expires but user ID is lost.
      }
    });

    this.rtmEngine.on('Error', (errorCode: number) => {
      console.error(`[RTM] SDK Error occurred: ${errorCode}`);
      this.emit('error', errorCode);
    });
  }

  // Login to RTM service with user ID
  async login(userId: string): Promise<void> {
    if (!this.rtmEngine) {
      console.log('[RTM] RTM engine not initialized, attempting to initialize now.');
      await this.initialize(); // This will throw if initialization fails
      if (!this.rtmEngine) { // Should not be reached if initialize throws
        throw new Error('RTM engine failed to initialize and is null after attempt.');
      }
    }

    if (this.isLoggedIn && this.userId === userId) {
      console.log(`[RTM] Already logged in as user ${userId}`);
      return;
    }

    try {
      const rtmTokenResponse = await this.fetchRtmToken(userId);
      if (!rtmTokenResponse || !rtmTokenResponse.token || !rtmTokenResponse.userId) {
        throw new Error('Failed to obtain a valid RTM token or userId from server.');
      }
      
      const uidForLogin = userId; // Or rtmTokenResponse.userId based on your backend
      const loginOpts: LoginInfo = { uid: uidForLogin, token: rtmTokenResponse.token };

      console.log(`[RTM] Attempting to login to RTM service as UID: ${loginOpts.uid} with token: ${loginOpts.token ? loginOpts.token.substring(0, 10) + '...' : 'N/A'}`);
      await this.rtmEngine.login(loginOpts);

      this.userId = uidForLogin;
      this.isLoggedIn = true;
      console.log(`[RTM] Successfully logged in as user ${uidForLogin}`);
    } catch (error) {
      console.error(`[RTM] Login failed for user ${userId}.`);
      const specificMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('[RTM] Login error details:', specificMessage);
      // Provide more specific advice based on the Agora RTM error codes
      // Note: Error codes for `agora-react-native-rtm` typically come directly from the native SDKs.
      // You might need to map them to specific RTM SDK error codes if needed.
      if (specificMessage.includes('LOGIN_ERR_INVALID_ARGUMENT')) {
        console.error('[RTM] LOGIN_ERR_INVALID_ARGUMENT: The token or UID format is incorrect, or one is missing when expected.');
      } else if (specificMessage.includes('LOGIN_ERR_INVALID_TOKEN')) {
        console.error('[RTM] LOGIN_ERR_INVALID_TOKEN: The RTM token itself is invalid or expired. Verify token generation on your server.');
      } else if (specificMessage.includes('LOGIN_ERR_REJECTED')) {
        console.error('[RTM] LOGIN_ERR_REJECTED: Login was rejected by the server, often due to authentication issues or invalid App ID.');
      } else if (specificMessage.includes('LOGIN_ERR_TIMEOUT')) {
        console.error('[RTM] LOGIN_ERR_TIMEOUT: Login attempt timed out, likely a network issue.');
      }
      this.isLoggedIn = false; // Ensure isLoggedIn is false on login failure
      throw error;
    }
  }

  // Fetch RTM token from server
  private async fetchRtmToken(userId: string): Promise<RtmTokenResponse> {
    try {
      console.log(`[RTM] Fetching RTM token from server for user ${userId}`);
      const response = await ApiService.getRtmToken({ uid: userId });
      console.log('[RTM] Exact RTM Token Server Response:', JSON.stringify(response, null, 2));

      if (!response || typeof response.token !== 'string' || response.token.trim() === '') {
        console.error('[RTM] Invalid or empty token received from server:', response);
        throw new Error('Received invalid or empty token from server.');
      }
      // OPTIONAL: Verify if response.userId matches the requested userId.
      // This can be a strong check if your backend strictly ties tokens to the requested UID.
      if (response.userId !== userId) {
         console.warn(`[RTM] Token fetched for UID ${response.userId} but requested for ${userId}. Using requested UID for login.`);
         // Depending on your server logic, you might want to use response.userId instead of input userId
         // for login, or throw an error if they must match.
      }
      return response;
    } catch (error) {
      console.error(`[RTM] CRITICAL ERROR during fetchRtmToken for user ${userId}:`, error);
      // Log underlying HTTP error details if available
      if (error instanceof Error && (error as any).response && (error as any).response.data) {
        console.error('[RTM] fetchRtmToken underlying HTTP error data:', JSON.stringify((error as any).response.data, null, 2));
      } else if (error instanceof Error && (error as any).response) {
        console.error('[RTM] fetchRtmToken underlying HTTP error response:', JSON.stringify((error as any).response, null, 2));
      }
      // Re-throw a more specific error to prevent login with a bad/dummy token
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch a valid RTM token for ${userId}: ${errorMessage}`);
    }
  }

  // Logout from RTM service
  async logout(): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      console.log('[RTM] Not logged in or engine not initialized, skipping logout.');
      return;
    }

    try {
      await this.rtmEngine.logout();
      this.isLoggedIn = false;
      this.userId = null; // Clear userId on successful logout
      console.log('[RTM] Successfully logged out');
    } catch (error) {
      console.error('[RTM] Failed to logout:', error);
      throw error;
    }
  }

  // New method to initiate and send call invitation using props
  async initiateAndSendCallInvitation(
    calleeId: string,
    callType: 'voice' | 'video',
    channelName: string, // This will be used as RTM channelId and in content
    rtcToken: string,
    callerRtcUid: number
  ): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in. Cannot send call invitation.');
    }
    if (!this.userId) {
      throw new Error('[RTM] Current RTM userId is not set. Cannot send invitation.');
    }

    try {
      const content = JSON.stringify({
        channelName, // RTC channel name
        callType,
        callerName: this.userId, // Caller's RTM ID (or name)
        rtcToken,
        callerRtcUid,
      });

      const invitationProps: RtmLocalInvitationProps = {
        uid: calleeId,
        channelId: channelName, // Using RTC channelName as RTM invitation channelId
        content: content,
      };

      console.log('[RTM] Sending call invitation with props:', invitationProps);
      await this.rtmEngine.sendLocalInvitation(invitationProps);
      console.log('[RTM] Call invitation sent successfully via props.');
    } catch (error) {
      console.error('[RTM] Failed to send call invitation via props:', error);
      throw error;
    }
  }

  // Update cancelCallInvitation to use props
  async cancelCallInvitation(props: RtmLocalInvitationProps): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      // Allow cancellation even if not logged in, as the invitation might be outstanding.
      // However, the SDK might require login for cancellation. Test this behavior.
      // For now, let's assume it might work or fail gracefully if not logged in.
      console.warn('[RTM] Attempting to cancel call invitation while potentially not logged in.');
      if (!this.rtmEngine) throw new Error ('[RTM] RTM Engine not available. Cannot cancel call invitation.');
    }
     if (!props.uid || !props.content || !props.channelId) {
      throw new Error('[RTM] Callee ID, content, and channel ID are required to cancel invitation by props.');
    }


    try {
      console.log('[RTM] Canceling call invitation with props:', props);
      await this.rtmEngine.cancelLocalInvitation(props);
      console.log('[RTM] Call invitation canceled successfully via props');
    } catch (error) {
      console.error('[RTM] Failed to cancel call invitation via props:', error);
      throw error;
    }
  }

  // Add this method
  async acceptCallInvitation(remoteInvitation: AgoraRtmRemoteInvitation): Promise<void> {
    if (!this.rtmEngine) {
      throw new Error('[RTM] RTM engine not initialized. Cannot accept invitation.');
    }
    try {
      console.log('[RTM] Accepting remote invitation:', remoteInvitation);
      await this.rtmEngine.acceptRemoteInvitation(remoteInvitation);
      console.log('[RTM] Remote invitation accepted successfully.');
    } catch (error) {
      console.error('[RTM] Failed to accept remote invitation:', error);
      throw error;
    }
  }

  // Add this method
  async refuseCallInvitation(remoteInvitation: AgoraRtmRemoteInvitation): Promise<void> {
    if (!this.rtmEngine) {
      throw new Error('[RTM] RTM engine not initialized. Cannot refuse invitation.');
    }
    try {
      console.log('[RTM] Refusing remote invitation:', remoteInvitation);
      await this.rtmEngine.refuseRemoteInvitation(remoteInvitation);
      console.log('[RTM] Remote invitation refused successfully.');
    } catch (error) {
      console.error('[RTM] Failed to refuse remote invitation:', error);
      throw error;
    }
  }

  // Release RTM engine resources
  async release(): Promise<void> {
    if (!this.rtmEngine) {
      console.log('[RTM] RTM engine not initialized, no need to release.');
      return;
    }

    try {
      // Ensure logout before destroying the engine
      if (this.isLoggedIn) {
        await this.logout();
      }

      this.rtmEngine.removeAllListeners(); // Call on the instance
      // For agora-react-native-rtm@1.5.1, use destroy method
      await this.rtmEngine.destroy(); // Call on the instance
      
      this.rtmEngine = null;
      this.eventListeners.clear();
      console.log('[RTM] Agora RTM engine released');
    } catch (error) {
      console.error('[RTM] Failed to release Agora RTM engine:', error);
      // Don't throw error during cleanup
      this.rtmEngine = null;
    }
  }

  // Event emitter methods
  on(event: RtmEventType, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: RtmEventType, listener: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(listener);
    }
  }

  private emit(event: RtmEventType, ...args: any[]): void {
    if (this.eventListeners.has(event)) {
      for (const listener of this.eventListeners.get(event)!) {
        listener(...args);
      }
    }
  }

  // Getter for isLoggedIn state
  getIsLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  // Getter for current userId
  getCurrentUserId(): string | null {
    return this.userId;
  }
}

export default AgoraRtmHelper;

// Export the types directly so they can be imported by other modules
export type RtmLocalInvitation = AgoraRtmLocalInvitation;
export type RtmRemoteInvitation = AgoraRtmRemoteInvitation;
export type { RtmLocalInvitationProps }; // Export the props type