/**
 * UnifiedCallService - Phase 2 Refactored with Zustand Integration
 * 
 * This service acts as the coordinator for all call-related operations without holding state.
 * All state management is delegated to Zustand store (callStore.ts).
 * 
 * Key Features:
 * - ✅ No internal state - everything in Zustand store
 * - ✅ Direct Zustand store integration via useCallStore.getState()
 * - ✅ No appEventEmitter usage - UI reacts to Zustand changes
 * - ✅ Simplified methods focused on business logic + API calls
 * - ✅ Integration with VideoSDKService and CallMediaManager
 * - ✅ Promise-based initialization for race condition prevention
 * - ✅ CallKeep and notification management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Alert } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// Services
import VideoSDKService from '../videosdk/VideoSDKService';
import CallMediaManager from './CallMediaManager';
import CallKeepIntegrationService from './CallKeepIntegrationService';
import ApiService from '../ApiService';
import CallConfig from '../../config/CallConfig';

// Store
import useCallStore, { CallData, CallNotificationData, CallStatus } from '../../stores/callStore';

// Types
import { VideoSDKConfig, MeetingConfig } from '../videosdk/VideoSDKService';

// Utils
import * as NavigationService from '../../navigation/NavigationService';

// -------------------------
// Legacy Adapter – bridges old API to new CallController
// Keeps all old code for reference but routes runtime calls to CallController
// -------------------------
import CallController from './CallController';

export interface CallServiceConfig {
  videoSDKConfig?: VideoSDKConfig;
  enableCallKeep?: boolean;
  enableNotifications?: boolean;
}

class UnifiedCallServiceAdapter {
  private static _instance: UnifiedCallServiceAdapter;
  private controller = CallController.getInstance();

  static getInstance(): UnifiedCallServiceAdapter {
    if (!UnifiedCallServiceAdapter._instance) {
      UnifiedCallServiceAdapter._instance = new UnifiedCallServiceAdapter();
    }
    return UnifiedCallServiceAdapter._instance;
  }

  // Stub to retain old initialize signature – always resolves true as the controller auto-init's
  async initialize(): Promise<boolean> {
    return true;
  }

  getIsInitialized(): boolean {
    return true;
  }

  async startOutgoingCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video',
    _callerName?: string,
    _callerId?: string
  ) {
    await this.controller.startCall(recipientId, recipientName, callType as any);
    return null;
  }

  async acceptCall() { return this.controller.acceptCall(); }
  async declineCall() { return this.controller.declineCall(); }
  async endCall() { return this.controller.endCall(); }
  async handleIncomingFCMCall(data: any) { /* New flow handles via CallController/FCM handlers */ }
}

// Preserve original class for debugging while exporting adapter as default
export { UnifiedCallService };
export default UnifiedCallServiceAdapter;

class UnifiedCallService {
  private static instance: UnifiedCallService;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;
  private config: CallServiceConfig = {};

  // Service instances
  private videoSDKService: VideoSDKService;
  private callMediaManager: typeof CallMediaManager;
  private callKeepService: CallKeepIntegrationService;

  private constructor() {
    this.videoSDKService = VideoSDKService.getInstance();
    this.callMediaManager = CallMediaManager;
    this.callKeepService = CallKeepIntegrationService.getInstance();
  }

  public static getInstance(): UnifiedCallService {
    if (!UnifiedCallService.instance) {
      UnifiedCallService.instance = new UnifiedCallService();
    }
    return UnifiedCallService.instance;
  }

  /**
   * Initialize the unified call service and all dependencies
   */
  public async initialize(config: CallServiceConfig = {}): Promise<boolean> {
    // Prevent multiple concurrent initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      console.log('[UnifiedCallService] Already initialized');
      return true;
    }

    console.log('[UnifiedCallService] Starting initialization...');

    this.initializationPromise = this.performInitialization(config);
    return this.initializationPromise;
  }

  private async performInitialization(config: CallServiceConfig): Promise<boolean> {
    try {
      this.config = { ...this.config, ...config };

      // 1. Initialize VideoSDK Service
      console.log('[UnifiedCallService] Initializing VideoSDK service...');
      const videoSDKSuccess = await this.videoSDKService.initialize(config.videoSDKConfig);
      if (!videoSDKSuccess) {
        throw new Error('VideoSDK initialization failed');
      }

      // 2. Initialize CallKeep if enabled
      if (config.enableCallKeep !== false) {
        console.log('[UnifiedCallService] Initializing CallKeep service...');
        try {
          await this.callKeepService.initialize();
          console.log('[UnifiedCallService] CallKeep initialized successfully');
        } catch (error) {
          console.warn('[UnifiedCallService] CallKeep initialization failed, continuing without it:', error);
        }
      }

      // 3. Setup FCM message handling (only if enabled)
      if (config.enableNotifications !== false && CallConfig.shouldEnableService('unified')) {
        this.setupFCMHandling();
      } else {
        console.log('[UnifiedCallService] FCM handling disabled by configuration');
      }

      // 4. Mark service as initialized and update store
      this.isInitialized = true;
      const store = useCallStore.getState();
      store.actions.setServiceInitialized(true);

      console.log('[UnifiedCallService] ✅ Initialization complete');
      return true;

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Initialization failed:', error);
      this.isInitialized = false;
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setServiceInitialized(false);
      store.actions.setError(`Service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return false;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Ensure service is initialized (defensive programming)
   */
  public async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    return this.initialize();
  }

  /**
   * Check if service is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Start an outgoing call
   */
  public async startOutgoingCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video',
    callerName?: string,
    callerId?: string
  ): Promise<CallData | null> {
    try {
      // Ensure service is initialized
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        throw new Error('Service not initialized');
      }

      console.log('[UnifiedCallService] Starting outgoing call:', {
        recipientId,
        recipientName,
        callType,
        callerName,
        callerId
      });

      // Get current user info
      const currentUserId = callerId || await this.getCurrentUserId();
      const currentUserName = callerName || await this.getCurrentUserName();

      // Generate VideoSDK meeting
      const token = await this.videoSDKService.generateParticipantToken();
      if (!token) {
        throw new Error('Failed to generate VideoSDK token');
      }

      const meetingId = await this.videoSDKService.createMeeting(token);
      if (!meetingId) {
        throw new Error('Failed to create VideoSDK meeting');
      }

      // Create call data with unique IDs to prevent confusion
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Add uniqueness to caller and recipient IDs for VideoSDK to differentiate participants
      // This prevents the same participant ID from appearing as both local and remote
      const uniqueCallerId = `${currentUserId}_${Date.now()}_caller`;
      const uniqueRecipientId = `${recipientId}_${Date.now()}_recipient`;
      
      const callData: CallData = {
        callId,
        meetingId,
        token,
        callerName: currentUserName,
        recipientName,
        callType,
        callerId: uniqueCallerId, // Use unique caller ID
        recipientId: uniqueRecipientId, // Use unique recipient ID
        isInitiator: true,
        status: 'dialing',
        startTime: Date.now(),
        timestamp: Date.now()
      };

      console.log('[UnifiedCallService] Generated unique participant IDs:', {
        originalCallerId: currentUserId,
        originalRecipientId: recipientId,
        uniqueCallerId: callData.callerId,
        uniqueRecipientId: callData.recipientId
      });

      // ✅ Clean up any lingering state from previous calls
      this.callMediaManager.forceCleanupIfNeeded();

      // Update Zustand store (no internal state)
      const store = useCallStore.getState();
      store.actions.startOutgoingCall(callData);

      // Initialize media manager with call ID and local participant ID
      this.callMediaManager.initialize(callId, callType === 'video', callData.callerId);

      // Send FCM notification to recipient
      await this.sendCallNotificationToRecipient(callData);

      // Show outgoing call notification
      await this.showOutgoingCallNotification(callData);

      // Navigate to meeting screen
      setTimeout(() => {
        NavigationService.navigateToMeeting({
          meetingId,
          token,
          callType,
          displayName: currentUserName,
          recipientName,
          isInitiator: true,
          callData,
          localParticipantId: callData.callerId // Pass local participant ID
        });
      }, 500);

      console.log('[UnifiedCallService] ✅ Outgoing call started successfully');
      return callData;

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to start outgoing call:', error);
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setError(`Failed to start call: ${error instanceof Error ? error.message : String(error)}`);
      store.actions.setCallStatus('ended');
      
      return null;
    }
  }

  /**
   * Handle incoming FCM call notification
   */
  public async handleIncomingFCMCall(data: any): Promise<void> {
    try {
      // Ensure service is initialized
      const initialized = await this.ensureInitialized();
      if (!initialized) {
        console.error('[UnifiedCallService] Cannot handle incoming call - service not initialized');
        return;
      }

      console.log('[UnifiedCallService] Handling incoming FCM call:', data);

      // Parse FCM call data
      const callData = this.parseFCMCallData(data);
      if (!callData) {
        console.error('[UnifiedCallService] Failed to parse FCM call data');
        return;
      }

      // Get current user info for recipient name
      const currentUserId = await this.getCurrentUserId();
      const currentUserName = await this.getCurrentUserName();

      // Create unique participant IDs to prevent confusion
      const uniqueCallerId = `${callData.callerId}_${Date.now()}_caller`;
      const uniqueRecipientId = `${currentUserId}_${Date.now()}_recipient`;

      console.log('[UnifiedCallService] Generated unique participant IDs for incoming call:', {
        originalCallerId: callData.callerId,
        originalRecipientId: currentUserId,
        uniqueCallerId,
        uniqueRecipientId
      });
      
      // ✅ Clean up any lingering state from previous calls
      this.callMediaManager.forceCleanupIfNeeded();

      // Create incoming call data with unique IDs
      const incomingCallData: CallData = {
        callId: callData.callId,
        meetingId: callData.meetingId,
        token: callData.token,
        callerName: callData.callerName,
        recipientName: currentUserName,
        callType: callData.callType,
        callerId: uniqueCallerId, // Use unique caller ID
        recipientId: uniqueRecipientId, // Use unique recipient ID
        callerAvatar: callData.callerAvatar,
        callerFcmToken: callData.callerFcmToken,
        isInitiator: false,
        status: 'ringing' as CallStatus,
        timestamp: Date.now()
      };

      // Update Zustand store
      const store = useCallStore.getState();
      store.actions.setIncomingCall(incomingCallData);

      // Initialize media manager with call ID and local participant ID
      this.callMediaManager.initialize(incomingCallData.callId, callData.callType === 'video', incomingCallData.recipientId);

      // Try CallKeep first, fallback to notification
      const callKeepSuccess = await this.tryCallKeepIncomingCall(incomingCallData);
      if (!callKeepSuccess) {
        await this.showIncomingCallNotification(incomingCallData);
      }

      // Start vibration
      Vibration.vibrate([1000, 500, 1000, 500], true);

      console.log('[UnifiedCallService] ✅ Incoming call handled successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to handle incoming FCM call:', error);
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setError(`Failed to handle incoming call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Accept an incoming call
   */
  public async acceptCall(callId?: string): Promise<void> {
    try {
      console.log('[UnifiedCallService] Accepting call:', callId);

      // Get call from store
      const store = useCallStore.getState();
      const activeCall = store.activeCall;

      if (!activeCall) {
        console.error('[UnifiedCallService] No active call to accept');
        return;
      }

      // Stop vibration
      Vibration.cancel();

      // Update store status
      store.actions.acceptCall();

      // Hide incoming call notification
      await this.hideIncomingCallNotification();
      
      // Get local participant ID from CallMediaManager or use recipientId
      const localParticipantId = CallMediaManager.getLocalParticipantId() || activeCall.recipientId;
      console.log('[UnifiedCallService] Using local participant ID for incoming call:', localParticipantId);

      // Navigate to meeting screen with local participant ID
      NavigationService.navigateToMeeting({
        meetingId: activeCall.meetingId,
        token: activeCall.token,
        callType: activeCall.callType,
        displayName: activeCall.recipientName,
        recipientName: activeCall.callerName,
        isInitiator: false,
        localParticipantId: localParticipantId
      });

      // Send call status update
      await this.sendCallStatusUpdate(activeCall, 'CALL_ACCEPTED');

      console.log('[UnifiedCallService] ✅ Call accepted successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to accept call:', error);
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setError(`Failed to accept call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decline an incoming call
   */
  public async declineCall(reason?: string): Promise<void> {
    try {
      console.log('[UnifiedCallService] Declining call:', reason);

      // Get call from store
      const store = useCallStore.getState();
      const activeCall = store.activeCall;

      if (!activeCall) {
        console.error('[UnifiedCallService] No active call to decline');
        return;
      }

      // Stop vibration
      Vibration.cancel();

      // Update store status
      store.actions.declineCall(reason);

      // Hide incoming call notification
      await this.hideIncomingCallNotification();

      // Send call status update
      await this.sendCallStatusUpdate(activeCall, 'CALL_ENDED');

      // Cleanup media
      await this.callMediaManager.cleanup('call_declined');

      console.log('[UnifiedCallService] ✅ Call declined successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to decline call:', error);
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setError(`Failed to decline call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * End an active call
   */
  public async endCall(reason?: string): Promise<void> {
    try {
      console.log('[UnifiedCallService] Ending call:', reason);

      // Get call from store
      const store = useCallStore.getState();
      const activeCall = store.activeCall;

      if (!activeCall) {
        console.log('[UnifiedCallService] No active call to end');
        return;
      }

      // Stop vibration
      Vibration.cancel();

      // Update store status
      store.actions.endCall(reason);

      // Hide all call notifications
      await this.hideAllCallNotifications();

      // Send call status update
      await this.sendCallStatusUpdate(activeCall, 'CALL_ENDED');

      // Cleanup media
      await this.callMediaManager.cleanup('call_ended');

      // Navigate back to TipCall screen
      setTimeout(() => {
        if (NavigationService.isNavigationReady()) {
          NavigationService.navigate('Main', { 
            screen: 'TipCall', 
            params: {} 
          });
        }
      }, 1000);

      console.log('[UnifiedCallService] ✅ Call ended successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to end call:', error);
      
      // Update store with error
      const store = useCallStore.getState();
      store.actions.setError(`Failed to end call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle FCM call notification message
   */
  public async handleFCMCallNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    // Check if simplified flow is active - if so, skip to prevent duplicates
    if (CallConfig.isSimplifiedFlow()) {
      console.log('[UnifiedCallService] Skipping FCM handling - simplified flow active');
      return;
    }

    try {
      const { data } = remoteMessage;
      if (!data) return;

      console.log('[UnifiedCallService] Processing FCM call notification:', data);

      // Parse the info field to get actual call type
      let callType = data.type;
      let parsedInfo = null;

      if (typeof data.info === 'string') {
        try {
          parsedInfo = JSON.parse(data.info);
          callType = parsedInfo.type || data.type;
          console.log('[UnifiedCallService] Parsed info field, call type:', callType);
        } catch (error) {
          console.warn('[UnifiedCallService] Failed to parse FCM info field:', error);
        }
      }

      if (callType === 'CALL_INITIATED' || callType === 'CALL_INITIATION' || callType === 'call') {
        console.log('[UnifiedCallService] Processing incoming call initiation');
        await this.handleIncomingFCMCall(parsedInfo || data);
      } else if (callType === 'CALL_ACCEPTED') {
        console.log('[UnifiedCallService] Call accepted by recipient');
        const store = useCallStore.getState();
        const activeCall = store.activeCall;

        // Only update the call status if we actually have an active call in progress
        if (activeCall) {
          // If the payload contains a meetingId (recommended) verify it matches our current call
          const receivedMeetingId = (parsedInfo && parsedInfo.meetingId) || data.meetingId;

          if (!receivedMeetingId || receivedMeetingId === activeCall.meetingId) {
            // Safe to mark the call as connecting – the CALLEE has accepted our outgoing call
            store.actions.setCallStatus('connecting');
          } else {
            console.warn('[UnifiedCallService] Ignoring CALL_ACCEPTED for a non-matching or inactive call', {
              receivedMeetingId,
              activeMeetingId: activeCall.meetingId,
            });
          }
        } else {
          // No active call – most likely this is a late/delayed message for a call that has already ended.
          console.warn('[UnifiedCallService] Ignoring CALL_ACCEPTED – no active call present');
        }
      } else if (callType === 'CALL_ENDED') {
        console.log('[UnifiedCallService] Call ended by remote party');
        await this.endCall('ended_by_remote');
      }

    } catch (error) {
      console.error('[UnifiedCallService] Error handling FCM call notification:', error);
    }
  }

  /**
   * Set VideoSDK meeting reference for media management
   */
  public setVideoSDKMeeting(meeting: any): void {
    this.callMediaManager.setMeeting(meeting);
  }

  /**
   * Toggle microphone
   */
  public toggleMic(): void {
    this.callMediaManager.toggleMic();
  }

  /**
   * Toggle camera/webcam
   */
  public toggleCamera(): void {
    this.callMediaManager.toggleWebcam();
  }

  /**
   * Toggle speaker
   */
  public async toggleSpeaker(): Promise<boolean> {
    return this.callMediaManager.toggleSpeaker();
  }

  /**
   * Get current call from store
   */
  public getCurrentCall(): CallData | null {
    const store = useCallStore.getState();
    return store.activeCall;
  }

  /**
   * Get current call status from store
   */
  public getCallStatus(): CallStatus {
    const store = useCallStore.getState();
    return store.callStatus;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Setup FCM message handling
   */
  private setupFCMHandling(): void {
    console.log('[UnifiedCallService] Setting up FCM handling...');

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('[UnifiedCallService] FCM foreground message received');
      await this.handleFCMCallNotification(remoteMessage);
    });

    // Note: Background message handler should be set in index.js
    console.log('[UnifiedCallService] FCM handling setup complete');
  }

  /**
   * Parse FCM call data
   */
  private parseFCMCallData(data: any): CallNotificationData | null {
    try {
      console.log('[UnifiedCallService] Parsing FCM call data:', data);

      // Handle nested JSON structures
      let callData = data;
      if (typeof data.info === 'string') {
        try {
          callData = JSON.parse(data.info);
          console.log('[UnifiedCallService] Successfully parsed info field:', callData);
        } catch (error) {
          console.warn('[UnifiedCallService] Failed to parse FCM info field:', error);
        }
      }

      const callerInfo = (typeof callData.callerInfo === 'object' && callData.callerInfo !== null) 
        ? callData.callerInfo 
        : {};
      const videoSDKInfo = (typeof callData.videoSDKInfo === 'object' && callData.videoSDKInfo !== null) 
        ? callData.videoSDKInfo 
        : {};

      // Use uuid as callId if available, otherwise generate one
      const callId = String(callData.uuid || callData.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

      // Extract call type properly
      let callType = 'voice'; // Default
      if (videoSDKInfo.callType) {
        callType = String(videoSDKInfo.callType).toLowerCase();
      } else if (callData.callType) {
        callType = String(callData.callType).toLowerCase();
      }
      
      // Normalize to 'video' or 'voice'
      const normalizedCallType = (callType === 'video' || callType === 'VIDEO') ? 'video' : 'voice';

      const parsedData: CallNotificationData = {
        callId,
        callerName: String(callerInfo.name || callData.callerName || 'Unknown Caller'),
        callType: normalizedCallType as 'voice' | 'video',
        callerId: String(callerInfo.userId || callData.callerId || 'unknown'),
        meetingId: String(videoSDKInfo.meetingId || callData.meetingId || ''),
        token: String(videoSDKInfo.token || callData.token || ''),
        callerAvatar: callerInfo.avatarUrl || callData.callerAvatar,
        callerFcmToken: String(callerInfo.token || ''),
      };

      console.log('[UnifiedCallService] Parsed call data:', parsedData);

      // Validate required fields
      if (!parsedData.meetingId || !parsedData.token) {
        console.error('[UnifiedCallService] Missing required fields in parsed data');
        return null;
      }

      return parsedData;

    } catch (error) {
      console.error('[UnifiedCallService] Error parsing FCM call data:', error);
      return null;
    }
  }

  /**
   * Send FCM notification to call recipient
   */
  private async sendCallNotificationToRecipient(callData: CallData): Promise<void> {
    try {
      console.log('[UnifiedCallService] Sending call notification to recipient');

      // Get recipient FCM token
      const recipientTokenData = await ApiService.getFCMToken(callData.recipientId, callData.callerId);
      if (!recipientTokenData?.token) {
        throw new Error('Failed to get recipient FCM token');
      }

      // Get caller FCM token
      const callerTokenData = await ApiService.getFCMToken(callData.callerId);
      
      // Send initiate call request
      const payload = {
        calleeInfo: {
          platform: 'ANDROID' as const,
          token: recipientTokenData.token,
        },
        callerInfo: {
          name: callData.callerName,
          token: callerTokenData?.token || '',
        },
        videoSDKInfo: {
          meetingId: callData.meetingId,
          token: callData.token,
          callType: callData.callType,
        },
      };

      await ApiService.initiateCall(payload);
      console.log('[UnifiedCallService] ✅ Call notification sent successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to send call notification:', error);
      throw error;
    }
  }

  /**
   * Send call status update
   */
  private async sendCallStatusUpdate(callData: CallData, status: 'CALL_ENDED' | 'CALL_MISSED' | 'CALL_ACCEPTED'): Promise<void> {
    try {
      console.log('[UnifiedCallService] Sending call status update:', status);

      // Get caller FCM token
      const callerTokenData = await ApiService.getFCMToken(callData.callerId);
      if (!callerTokenData?.token) {
        console.warn('[UnifiedCallService] No caller FCM token found for status update');
        return;
      }

      const payload = {
        callerInfo: {
          token: callerTokenData.token,
          name: callData.callerName,
          platform: 'ANDROID' as const,
        },
        type: status,
      };

      await ApiService.updateCallStatus(payload);
      console.log('[UnifiedCallService] ✅ Call status update sent successfully');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to send call status update:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Try to use CallKeep for incoming call
   */
  private async tryCallKeepIncomingCall(callData: CallData): Promise<boolean> {
    try {
      if (!this.callKeepService.getIsInitialized()) {
        return false;
      }

      await this.callKeepService.displayIncomingCall(
        callData.callId,
        callData.callerName,
        callData.callType === 'video',
        callData.callerId
      );

      console.log('[UnifiedCallService] ✅ CallKeep incoming call displayed');
      return true;

    } catch (error) {
      console.warn('[UnifiedCallService] CallKeep failed, will use notification:', error);
      return false;
    }
  }

  /**
   * Show incoming call notification
   */
  private async showIncomingCallNotification(callData: CallData): Promise<void> {
    // Check if simplified flow is active - if so, skip to prevent duplicates
    if (CallConfig.isSimplifiedFlow()) {
      console.log('[UnifiedCallService] Skipping notification - simplified flow active');
      return;
    }

    try {
      console.log('[UnifiedCallService] Showing incoming call notification');

      const channelId = 'incoming-calls';
      
      // Create notification channel
      await notifee.createChannel({
        id: channelId,
        name: 'Incoming Calls',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
      });

      // Display notification
      const notificationId = await notifee.displayNotification({
        title: `Incoming ${callData.callType} call`,
        body: `${callData.callerName} is calling you`,
        android: {
          channelId,
          importance: 4, // HIGH
          category: 'call' as any,
          fullScreenAction: {
            id: 'full-screen-call',
          },
          actions: [
            {
              title: 'Accept',
              pressAction: {
                id: 'accept-call',
              },
            },
            {
              title: 'Decline',
              pressAction: {
                id: 'decline-call',
              },
            },
          ],
        },
        data: {
          callId: callData.callId,
          callType: callData.callType,
          callerName: callData.callerName,
        },
      });

      // Store notification ID
      const store = useCallStore.getState();
      store.actions.setIncomingCallNotificationId(notificationId);

      console.log('[UnifiedCallService] ✅ Incoming call notification displayed');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to show incoming call notification:', error);
    }
  }

  /**
   * Show outgoing call notification
   */
  private async showOutgoingCallNotification(callData: CallData): Promise<void> {
    // Check if simplified flow is active - if so, skip to prevent duplicates
    if (CallConfig.isSimplifiedFlow()) {
      console.log('[UnifiedCallService] Skipping outgoing notification - simplified flow active');
      return;
    }

    try {
      console.log('[UnifiedCallService] Showing outgoing call notification');

      const channelId = 'ongoing-calls';
      
      // Create notification channel
      await notifee.createChannel({
        id: channelId,
        name: 'Ongoing Calls',
        importance: 3, // DEFAULT
      });

      // Display notification
      const notificationId = await notifee.displayNotification({
        title: `${callData.callType} call`,
        body: `Calling ${callData.recipientName}...`,
        android: {
          channelId,
          ongoing: true,
          actions: [
            {
              title: 'End Call',
              pressAction: {
                id: 'end-call',
              },
            },
          ],
        },
        data: {
          callId: callData.callId,
          callType: callData.callType,
          recipientName: callData.recipientName,
        },
      });

      // Store notification ID
      const store = useCallStore.getState();
      store.actions.setOngoingCallNotificationId(notificationId);

      console.log('[UnifiedCallService] ✅ Outgoing call notification displayed');

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Failed to show outgoing call notification:', error);
    }
  }

  /**
   * Hide incoming call notification
   */
  private async hideIncomingCallNotification(): Promise<void> {
    try {
      const store = useCallStore.getState();
      const notificationId = store.incomingCallNotificationId;
      
      if (notificationId) {
        await notifee.cancelNotification(notificationId);
        store.actions.setIncomingCallNotificationId(null);
        console.log('[UnifiedCallService] Incoming call notification hidden');
      }
    } catch (error) {
      console.error('[UnifiedCallService] Error hiding incoming call notification:', error);
    }
  }

  /**
   * Hide all call notifications
   */
  private async hideAllCallNotifications(): Promise<void> {
    try {
      const store = useCallStore.getState();
      
      // Hide incoming call notification
      if (store.incomingCallNotificationId) {
        await notifee.cancelNotification(store.incomingCallNotificationId);
        store.actions.setIncomingCallNotificationId(null);
      }
      
      // Hide ongoing call notification
      if (store.ongoingCallNotificationId) {
        await notifee.cancelNotification(store.ongoingCallNotificationId);
        store.actions.setOngoingCallNotificationId(null);
      }
      
      console.log('[UnifiedCallService] All call notifications hidden');
    } catch (error) {
      console.error('[UnifiedCallService] Error hiding call notifications:', error);
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      return userId || 'unknown_user';
    } catch (error) {
      console.error('[UnifiedCallService] Error getting current user ID:', error);
      return 'unknown_user';
    }
  }

  /**
   * Get current user name
   */
  private async getCurrentUserName(): Promise<string> {
    try {
      const userName = await AsyncStorage.getItem('userName');
      return userName || 'Unknown User';
    } catch (error) {
      console.error('[UnifiedCallService] Error getting current user name:', error);
      return 'Unknown User';
    }
  }

  /**
   * Reset service (for logout or cleanup)
   */
  public reset(): void {
    console.log('[UnifiedCallService] Resetting service');
    
    this.isInitialized = false;
    this.initializationPromise = null;
    this.config = {};
    
    // Reset dependent services
    this.videoSDKService.reset();
    this.callMediaManager.forceCleanupIfNeeded();
    
    // Reset store
    const store = useCallStore.getState();
    store.actions.cleanup();
    store.actions.setServiceInitialized(false);
    
    console.log('[UnifiedCallService] Service reset complete');
  }

  /**
   * Get service configuration
   */
  public getConfig(): CallServiceConfig {
    return { ...this.config };
  }
}

