import { Platform } from 'react-native';
import RtmEngine, { 
  RtmLocalInvitation,
  RtmRemoteInvitation, 
  ConnectionState,
  ConnectionChangeReason,
  RtmMessage,
  RtmStatusCode
} from 'agora-react-native-rtm';
import ApiService from './ApiService';

export interface RtmTokenRequest {
  uid: string;
}

export interface RtmTokenResponse {
  token: string;
  userId: string;
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
  'remoteInvitationFailure';

class AgoraRtmHelper {
  private static instance: AgoraRtmHelper;
  private rtmEngine: RtmEngine | null = null;
  private APP_ID = 'ef5fbd2647c64582a64db9e47b9f9335'; // Same as RTC APP_ID
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
      console.log('[RTM] Initializing Agora RTM engine');
      this.rtmEngine = new RtmEngine();
      await this.rtmEngine.createInstance(this.APP_ID);
      
      // Set up RTM event listeners
      this.setupEventListeners();
      
      console.log('[RTM] Agora RTM engine initialized successfully');
      return this.rtmEngine;
    } catch (error) {
      console.error('[RTM] Failed to initialize Agora RTM engine:', error);
      throw error;
    }
  }

  // Set up event listeners for RTM events
  private setupEventListeners() {
    if (!this.rtmEngine) return;

    this.rtmEngine.on('ConnectionStateChanged', (newState: ConnectionState, reason: ConnectionChangeReason) => {
      console.log(`[RTM] Connection state changed to ${newState}, reason: ${reason}`);
      this.emit('connectionStateChanged', { newState, reason });
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

    this.rtmEngine.on('TokenExpired', () => {
      console.log('[RTM] Token expired');
      this.emit('tokenExpired');
    });

    this.rtmEngine.on('Error', (errorCode: number) => {
      console.error('[RTM] Error occurred:', errorCode);
      this.emit('error', errorCode);
    });
  }

  // Login to RTM service with user ID
  async login(userId: string): Promise<void> {
    if (!this.rtmEngine) {
      await this.initialize();
    }

    if (this.isLoggedIn && this.userId === userId) {
      console.log(`[RTM] Already logged in as user ${userId}`);
      return;
    }

    try {
      console.log(`[RTM] Getting RTM token for user ${userId}`);
      const rtmTokenResponse = await this.fetchRtmToken(userId);
      
      console.log(`[RTM] Logging in as user ${userId}`);
      await this.rtmEngine!.login({ token: rtmTokenResponse.token, uid: userId });
      
      this.userId = userId;
      this.isLoggedIn = true;
      console.log(`[RTM] Successfully logged in as user ${userId}`);
    } catch (error) {
      console.error('[RTM] Failed to login:', error);
      throw error;
    }
  }

  // Fetch RTM token from server
  private async fetchRtmToken(userId: string): Promise<RtmTokenResponse> {
    try {
      console.log(`[RTM] Fetching RTM token for user ${userId}`);
      // Call your API to get RTM token
      const response = await ApiService.getRtmToken({ uid: userId });
      return response;
    } catch (error) {
      console.error('[RTM] Failed to fetch RTM token:', error);
      // Return a dummy token for testing - REMOVE IN PRODUCTION!
      console.warn('[RTM] Using dummy token for development');
      return { token: 'dummy_rtm_token_for_dev', userId };
    }
  }

  // Logout from RTM service
  async logout(): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      return;
    }

    try {
      await this.rtmEngine.logout();
      this.isLoggedIn = false;
      this.userId = null;
      console.log('[RTM] Successfully logged out');
    } catch (error) {
      console.error('[RTM] Failed to logout:', error);
      throw error;
    }
  }

  // Create a call invitation
  async createCallInvitation(calleeId: string, callType: 'voice' | 'video', channelName: string, rtcToken: string): Promise<RtmLocalInvitation> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in');
    }

    try {
      console.log(`[RTM] Creating call invitation to ${calleeId}`);
      const localInvitation = await this.rtmEngine.createLocalInvitation(calleeId);
      
      // Set content with call information
      const content = JSON.stringify({
        channelName,
        callType,
        callerName: this.userId, // Use current user ID as name
        rtcToken,
        callerRtcUid: this.userId, // Use same ID for RTM and RTC
      });
      
      await localInvitation.setContent(content);
      return localInvitation;
    } catch (error) {
      console.error('[RTM] Failed to create call invitation:', error);
      throw error;
    }
  }

  // Send a call invitation
  async sendCallInvitation(localInvitation: RtmLocalInvitation): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in');
    }

    try {
      console.log('[RTM] Sending call invitation');
      await this.rtmEngine.sendLocalInvitation(localInvitation);
      console.log('[RTM] Call invitation sent successfully');
    } catch (error) {
      console.error('[RTM] Failed to send call invitation:', error);
      throw error;
    }
  }

  // Cancel a call invitation
  async cancelCallInvitation(localInvitation: RtmLocalInvitation): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in');
    }

    try {
      console.log('[RTM] Canceling call invitation');
      await this.rtmEngine.cancelLocalInvitation(localInvitation);
      console.log('[RTM] Call invitation canceled successfully');
    } catch (error) {
      console.error('[RTM] Failed to cancel call invitation:', error);
      throw error;
    }
  }

  // Accept a call invitation
  async acceptCallInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in');
    }

    try {
      console.log('[RTM] Accepting call invitation');
      await this.rtmEngine.acceptRemoteInvitation(remoteInvitation);
      console.log('[RTM] Call invitation accepted successfully');
    } catch (error) {
      console.error('[RTM] Failed to accept call invitation:', error);
      throw error;
    }
  }

  // Refuse a call invitation
  async refuseCallInvitation(remoteInvitation: RtmRemoteInvitation): Promise<void> {
    if (!this.rtmEngine || !this.isLoggedIn) {
      throw new Error('[RTM] Not logged in');
    }

    try {
      console.log('[RTM] Refusing call invitation');
      await this.rtmEngine.refuseRemoteInvitation(remoteInvitation);
      console.log('[RTM] Call invitation refused successfully');
    } catch (error) {
      console.error('[RTM] Failed to refuse call invitation:', error);
      throw error;
    }
  }

  // Release RTM engine resources
  async release(): Promise<void> {
    if (!this.rtmEngine) {
      return;
    }

    try {
      if (this.isLoggedIn) {
        await this.logout();
      }
      
      this.rtmEngine.removeAllListeners();
      this.rtmEngine.destroy();
      this.rtmEngine = null;
      this.eventListeners.clear();
      console.log('[RTM] Agora RTM engine released');
    } catch (error) {
      console.error('[RTM] Failed to release Agora RTM engine:', error);
      throw error;
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
}

export default AgoraRtmHelper;