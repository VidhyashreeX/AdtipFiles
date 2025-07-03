// src/services/calling/WhatsAppCallManager.ts

import notifee, { 
  AndroidImportance, 
  AndroidVisibility, 
  AndroidCategory,
  EventType,
  Event,
  Notification,
  TriggerType,
  AndroidLaunchActivityFlag,
  AndroidGroupAlertBehavior,
  AndroidBadgeIconType,
  AndroidStyle,
  AndroidAction
} from '@notifee/react-native';
import { 
  Platform, 
  DeviceEventEmitter, 
  NativeModules, 
  AppState, 
  AppStateStatus, 
  Alert,
  Vibration,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../../events/AppEventEmitter';
import ApiService from '../ApiService';
import VideoSDKService from '../videosdk/VideoSDKService';
import { navigate, navigationRef } from '../../navigation/NavigationService';
import CallMediaManager from './CallMediaManager';

// Types
export interface CallData {
  callId: string;
  meetingId: string;
  token: string;
  callerName: string;
  recipientName: string;
  callType: 'voice' | 'video';
  callerId: string;
  recipientId: string;
  callerAvatar?: string;
  recipientAvatar?: string;
  isInitiator: boolean;
  status: 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'missed' | 'declined';
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface CallNotificationData {
  callId: string;
  callerName: string;
  callType: 'voice' | 'video';
  callerId: string;
  meetingId: string;
  token: string;
  callerAvatar?: string;
}

export interface OngoingCallData {
  callId: string;
  participantName: string;
  callType: 'voice' | 'video';
  startTime: number;
  status: 'connecting' | 'connected' | 'ringing';
}

const CHANNEL_IDS = {
  INCOMING_CALLS: 'whatsapp_incoming_calls',
  ONGOING_CALLS: 'whatsapp_ongoing_calls',
  MISSED_CALLS: 'whatsapp_missed_calls',
  CALL_ENDED: 'whatsapp_call_ended'
} as const;

/**
 * WhatsApp-like Call Manager
 * Handles all calling functionality using notifee + videosdk.live
 * Works in foreground, background, and killed states
 */
class WhatsAppCallManager {
  private static instance: WhatsAppCallManager;
  private isInitialized = false;
  private currentCall: CallData | null = null;
  private incomingCallNotificationId: string | null = null;
  private ongoingCallNotificationId: string | null = null;
  private appState: AppStateStatus = 'active';
  private callStateKey = 'WHATSAPP_CALL_STATE';
  private audioPermissionGranted = false;
  private videoPermissionGranted = false;
  
  // Media manager integration
  private mediaManager: CallMediaManager;
  
  // Vibration patterns
  private readonly INCOMING_CALL_VIBRATION = [2,1000,1000, 2000];
  private readonly CALL_END_VIBRATION = [2,200];
  
  private constructor() {
    this.setupAppStateListener();
    this.mediaManager = CallMediaManager.getInstance();
  }

  public static getInstance(): WhatsAppCallManager {
    if (!WhatsAppCallManager.instance) {
      WhatsAppCallManager.instance = new WhatsAppCallManager();
    }
    return WhatsAppCallManager.instance;
  }

  /**
   * Initialize the call manager
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[WhatsAppCallManager] Already initialized');
        return true;
      }

      console.log('[WhatsAppCallManager] Initializing...');

      // ✅ FIX: Initialize VideoSDKService with the API key
      const videoSDKService = VideoSDKService.getInstance();
      if (!videoSDKService.getInitializationStatus()) {
        // IMPORTANT: Replace with your actual VideoSDK API key
        // You can set this as an environment variable: VIDEOSDK_API_KEY=your_key_here
        const videoSDKApiKey = process.env.VIDEOSDK_API_KEY || 'a4e0729c-93d5-4b86-8cf6-9c5da5b1d6ea';
        
        console.log('[WhatsAppCallManager] Initializing VideoSDK with API key:', videoSDKApiKey ? 'API key present' : 'No API key');
        
        if (!videoSDKApiKey || videoSDKApiKey === 'YOUR_VIDEOSDK_API_KEY') {
          console.error('[WhatsAppCallManager] VideoSDK API Key is not set. Using default key for development.');
        }
        
        await videoSDKService.initialize({ apiKey: videoSDKApiKey });
        console.log('[WhatsAppCallManager] VideoSDKService initialized successfully.');
      }

      // ✅ FIX: Check permissions on init, but do not request them.
      await this.checkPermissions();

      // Create notification channels
      await this.createNotificationChannels();

      // Setup event listeners
      this.setupEventListeners();

      // Restore call state if app was killed
      await this.restoreCallState();

      this.isInitialized = true;
      console.log('[WhatsAppCallManager] ✅ Initialized successfully');
      return true;

    } catch (error) {
      console.error('[WhatsAppCallManager] ❌ Initialization failed:', error);
      return false;
    }
  }
  /**
   * ✅ FIX: Checks permissions without prompting the user.
   * This is safe to call from the background.
   */
  private async checkPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        this.audioPermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        this.videoPermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        console.log(`[WhatsAppCallManager] Initial permission check: Audio=${this.audioPermissionGranted}, Video=${this.videoPermissionGranted}`);
      }
      // For iOS, permissions are handled at the point of use by the SDK.
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to check permissions:', error);
    }
  }

  /**
   * ✅ FIX: Requests necessary permissions from the user.
   * This should only be called when the app is in the foreground and an Activity is present.
   */
  public async requestPermissionsIfNeeded(callType: 'voice' | 'video'): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions at point of use.
    }

    try {
      console.log('[WhatsAppCallManager] Requesting permissions for call type:', callType);

      // 1. Notification & Foreground Service Permissions
      const notificationPermission = await notifee.requestPermission();
      console.log('[WhatsAppCallManager] Notification permission result:', notificationPermission);

      if (Platform.Version >= 34) {
        try {
          const foregroundServicePermission = await PermissionsAndroid.request('android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any);
          console.log('[WhatsAppCallManager] Foreground service permission result:', foregroundServicePermission);
        } catch (error) {
          console.warn('[WhatsAppCallManager] Foreground service permission request failed (non-critical):', error);
        }
      }

      // 2. Mic and Camera Permissions (only request what we need and don't already have)
      const permissionsToRequest: (typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS])[] = [];
      
      // Re-check current permission status before requesting
      const currentAudioPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const currentVideoPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      
      if (!currentAudioPermission) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }
      if (callType === 'video' && !currentVideoPermission) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      console.log('[WhatsAppCallManager] Permissions to request:', permissionsToRequest);

      if (permissionsToRequest.length > 0) {
        const statuses = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        console.log('[WhatsAppCallManager] Permission request results:', statuses);
        
        // Update internal state based on results
        this.audioPermissionGranted = statuses[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED || currentAudioPermission;
        this.videoPermissionGranted = statuses[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED || currentVideoPermission;
      } else {
        // No permissions to request, use current status
        this.audioPermissionGranted = currentAudioPermission;
        this.videoPermissionGranted = currentVideoPermission;
      }

      // Final validation
      if (!this.audioPermissionGranted) {
        console.error('[WhatsAppCallManager] Audio permission not granted');
        Alert.alert(
          'Permission Required', 
          'Microphone permission is required to make calls. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open settings - TODO: implement') }
          ]
        );
        return false;
      }
      
      if (callType === 'video' && !this.videoPermissionGranted) {
        console.error('[WhatsAppCallManager] Video permission not granted for video call');
        Alert.alert(
          'Permission Required', 
          'Camera permission is required for video calls. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open settings - TODO: implement') }
          ]
        );
        return false;
      }

      console.log('[WhatsAppCallManager] All required permissions granted successfully');
      return true;
    } catch (error) {
      console.error('[WhatsAppCallManager] Permission request failed:', error);
      Alert.alert('Error', 'An error occurred while requesting permissions. Please try again.');
      return false;
    }
  }

  /**
   * Create notification channels
   */
  private async createNotificationChannels(): Promise<void> {
    try {
      // Incoming calls channel
      await notifee.createChannel({
        id: CHANNEL_IDS.INCOMING_CALLS,
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: this.INCOMING_CALL_VIBRATION,
        sound: 'default',
        badge: false,
      });

      // Ongoing calls channel
      await notifee.createChannel({
        id: CHANNEL_IDS.ONGOING_CALLS,
        name: 'Ongoing Calls',
        importance: AndroidImportance.LOW,
        visibility: AndroidVisibility.PUBLIC,
        vibration: false,
        sound: 'none',
        badge: false,
      });

      // Missed calls channel
      await notifee.createChannel({
        id: CHANNEL_IDS.MISSED_CALLS,
        name: 'Missed Calls',
        importance: AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PUBLIC,
        vibration: false,
        sound: 'default',
        badge: true,
      });

      // Call ended channel
      await notifee.createChannel({
        id: CHANNEL_IDS.CALL_ENDED,
        name: 'Call Ended',
        importance: AndroidImportance.LOW,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: this.CALL_END_VIBRATION,
        sound: 'none',
        badge: false,
      });

      console.log('[WhatsAppCallManager] Notification channels created');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to create notification channels:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Notifee events
    notifee.onForegroundEvent(async ({ type, detail }) => {
      await this.handleNotificationEvent(type, detail);
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      await this.handleNotificationEvent(type, detail);
    });    // App events
    appEventEmitter.on('callStateChanged', this.handleCallStateChanged.bind(this));
    appEventEmitter.on('incomingCall', this.handleIncomingCall.bind(this));

    console.log('[WhatsAppCallManager] Event listeners setup complete');
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    let lastStateChangeTime = 0;
    let lastAppState = AppState.currentState;
    
    AppState.addEventListener('change', (nextAppState) => {
      const now = Date.now();
      
      // Throttle app state changes to prevent rapid switching
      if (now - lastStateChangeTime < 1000) {
        return; // Ignore state changes that happen within 1 second
      }
      
      // Only process if state actually changed
      if (lastAppState === nextAppState) {
        return;
      }
      
      this.appState = nextAppState;
      lastAppState = nextAppState;
      lastStateChangeTime = now;
      
      console.log('[WhatsAppCallManager] App state changed:', nextAppState);

      if (nextAppState === 'background' && this.currentCall?.status === 'connected') {
        // Show ongoing call notification when app goes to background
        this.showOngoingCallNotification();
      } else if (nextAppState === 'active') {
        // Hide ongoing call notification when app comes to foreground
        this.hideOngoingCallNotification();
      }
    });
  }

  /**
   * Handle notification events
   */
  private async handleNotificationEvent(type: EventType, detail: any): Promise<void> {
    try {
      const { notification, pressAction } = detail;
      const callId = notification?.data?.callId;
      // Handle all press actions and taps
      if ((type === EventType.ACTION_PRESS || type === EventType.PRESS) && pressAction) {
        switch (pressAction.id) {
          case 'accept_call':
            await this.acceptCall(callId);
            break;
          case 'decline_call':
            await this.declineCall(callId);
            break;
          case 'end_call':
            await this.endCall(callId);
            break;
          case 'open_call':
            if (callId && this.currentCall) {
              this.navigateToMeetingScreen(this.currentCall);
            }
            break;
          case 'mute_toggle':
            await this.toggleMute();
            break;
          case 'speaker_toggle':
            await this.toggleSpeaker();
            break;
        }
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Error handling notification event:', error);
    }
  }

  /**
   * Start outgoing call
   */
  public async startOutgoingCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video',
    callerName: string,
    callerId: string
  ): Promise<CallData | null> {
    try {
      console.log('[WhatsAppCallManager] Starting outgoing call:', {
        recipientId,
        recipientName,
        callType,
        callerName,
        callerId
      });

      // ✅ FIX: Request permissions just-in-time, ensuring an Activity is present.
      const permissionsGranted = await this.requestPermissionsIfNeeded(callType);
      if (!permissionsGranted) {
        console.log('[WhatsAppCallManager] Call aborted due to missing permissions.');
        return null;
      }
      
      // Generate VideoSDK meeting
      const videoSDKService = VideoSDKService.getInstance();
      const token = await videoSDKService.generateParticipantToken();
      
      if (!token) {
        throw new Error('Failed to generate VideoSDK token');
      }
      
      const meetingId = await videoSDKService.createMeeting(token);

      if (!token || !meetingId) {
        throw new Error('Failed to create VideoSDK meeting');
      }      // Create call data
      const callData: CallData = {
        callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meetingId,
        token,
        callerName,
        recipientName,
        callType,
        callerId,
        recipientId,
        isInitiator: true,
        status: 'calling',
        startTime: Date.now()
      };

      this.currentCall = callData;
      await this.saveCallState();

      // Send call notification to recipient using proper initiate call API
      await this.initiateCallWithRecipient(callData);

      // Show outgoing call UI
      await this.showOutgoingCallNotification(callData);

      // Initialize media for call BEFORE navigating to meeting screen
      // This ensures mic and camera are ready immediately for video calls
      this.initializeMediaForCall(callData.callId, callType === 'video');

      // Navigate to meeting screen
      this.navigateToMeetingScreen(callData);

      // Emit call state change
      appEventEmitter.emit('callStateChanged', callData);

      console.log('[WhatsAppCallManager] Outgoing call started:', callData.callId);
      return callData;

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to start outgoing call:', error);
      Alert.alert('Call Failed', 'Unable to start the call. Please try again.');
      return null;
    }
  }

  /**
   * Handle incoming call
   */
  public async handleIncomingCall(callNotificationData: CallNotificationData): Promise<void> {
    try {
      console.log('[WhatsAppCallManager] Handling incoming call:', callNotificationData);

      // Create call data
      const callData: CallData = {
        callId: callNotificationData.callId,
        meetingId: callNotificationData.meetingId,
        token: callNotificationData.token,
        callerName: callNotificationData.callerName,
        recipientName: 'Me', // Current user
        callType: callNotificationData.callType,
        callerId: callNotificationData.callerId,
        recipientId: await this.getCurrentUserId(),
        callerAvatar: callNotificationData.callerAvatar,
        isInitiator: false,
        status: 'ringing',
        startTime: Date.now()
      };      this.currentCall = callData;
      await this.saveCallState();

      // Show incoming call notification
      await this.showIncomingCallNotification(callData);

      // Start vibration
      Vibration.vibrate(this.INCOMING_CALL_VIBRATION, true);

      // DO NOT emit callStateChanged for incoming calls - this would trigger navigation to MeetingScreen
      // Instead, only emit it when the user accepts the call via acceptCall()
      // This ensures the recipient sees the notification with answer/decline options
      console.log('[WhatsAppCallManager] Incoming call notification shown - waiting for user action');

      console.log('[WhatsAppCallManager] Incoming call handled:', callData.callId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to handle incoming call:', error);
    }
  }

  /**
   * Accept incoming call
   */
  public async acceptCall(callId?: string): Promise<void> {
    try {
      const targetCall = callId ? 
        (this.currentCall?.callId === callId ? this.currentCall : null) : 
        this.currentCall;

      if (!targetCall) {
        console.warn('[WhatsAppCallManager] No call to accept');
        return;
      }

      console.log('[WhatsAppCallManager] Accepting call:', targetCall.callId);

      // Stop vibration
      Vibration.cancel();

      // Hide incoming call notification
      await this.hideIncomingCallNotification();

      // Update call status
      targetCall.status = 'connecting';
      this.currentCall = targetCall;
      await this.saveCallState();

      // Send acceptance notification to caller
      await this.sendCallStatusUpdate(targetCall, 'accepted');

      // Navigate to meeting screen
      this.navigateToMeetingScreen(targetCall);

      // Show ongoing call notification if app goes to background
      if (this.appState === 'background') {
        await this.showOngoingCallNotification();
      }

      // Emit call state change
      appEventEmitter.emit('callStateChanged', targetCall);

      console.log('[WhatsAppCallManager] Call accepted:', targetCall.callId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to accept call:', error);
    }
  }

  /**
   * Decline incoming call
   */
  public async declineCall(callId?: string): Promise<void> {
    try {
      const targetCall = callId ? 
        (this.currentCall?.callId === callId ? this.currentCall : null) : 
        this.currentCall;

      if (!targetCall) {
        console.warn('[WhatsAppCallManager] No call to decline');
        return;
      }

      console.log('[WhatsAppCallManager] Declining call:', targetCall.callId);

      // Stop vibration
      Vibration.cancel();

      // Hide incoming call notification
      await this.hideIncomingCallNotification();

      // Update call status
      targetCall.status = 'declined';
      targetCall.endTime = Date.now();

      // CRITICAL FIX: Send decline notification to caller with CALL_ENDED status
      await this.sendCallStatusUpdate(targetCall, 'declined');

      // Clear call state completely
      await this.clearCallState();

      // Emit call state change
      appEventEmitter.emit('callStateChanged', targetCall);
      appEventEmitter.emit('callEnded', targetCall);

      console.log('[WhatsAppCallManager] Call declined successfully:', targetCall.callId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to decline call:', error);
    }
  }

  /**
   * End ongoing call
   */
  public async endCall(callId?: string): Promise<void> {
    try {
      const targetCall = callId ? 
        (this.currentCall?.callId === callId ? this.currentCall : null) : 
        this.currentCall;

      if (!targetCall) {
        console.warn('[WhatsAppCallManager] No call to end');
        return;
      }

      console.log('[WhatsAppCallManager] Ending call:', targetCall.callId);

      // Stop any ongoing vibration
      Vibration.cancel();

      // Hide any active call notifications
      await this.hideIncomingCallNotification();
      await this.hideOngoingCallNotification();

      // Show call ended notification
      await this.showCallEndedNotification(targetCall);

      // CRITICAL FIX: Send end call notification to other participant with CALL_ENDED status
      await this.sendCallStatusUpdate(targetCall, 'ended');

      // Clear call state completely
      await this.clearCallState();

      // Vibrate briefly to indicate call end
      Vibration.vibrate(this.CALL_END_VIBRATION);

      // Emit call state change
      appEventEmitter.emit('callStateChanged', { ...targetCall, status: 'ended' });
      appEventEmitter.emit('callEnded', { ...targetCall, status: 'ended' });

      // Stop Notifee foreground service if running
      try {
        await notifee.stopForegroundService();
        console.log('[WhatsAppCallManager] Notifee foreground service stopped');
      } catch (serviceError) {
        console.warn('[WhatsAppCallManager] Could not stop foreground service:', serviceError);
      }

      this.currentCall = null;
      console.log('[WhatsAppCallManager] Call ended successfully');

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to end call:', error);
    }
  }

  /**
   * Show incoming call notification (full screen)
   */
  private async showIncomingCallNotification(callData: CallData): Promise<void> {
    try {
      const notificationId = `incoming_call_${callData.callId}`;
      this.incomingCallNotificationId = notificationId;      const actions: AndroidAction[] = [
        {
          title: 'Decline',
          pressAction: { id: 'decline_call' },
        },
        {
          title: 'Accept',
          pressAction: { id: 'accept_call' },
        }
      ];      // Prepare android notification config
      const androidConfig: any = {
        channelId: CHANNEL_IDS.INCOMING_CALLS,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.CALL,
        pressAction: { id: 'accept_call' },
        fullScreenAction: { id: 'accept_call' },
        actions,
        ongoing: false,
        autoCancel: false,
        color: callData.callType === 'video' ? '#007AFF' : '#34C759',
        smallIcon: 'ic_call', // Required for Android notifications
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${callData.callerName} is calling you. Tap to answer or use the action buttons.`,
        },
      };

      // Only add largeIcon if callerAvatar is a valid string URL
      if (callData.callerAvatar && typeof callData.callerAvatar === 'string' && callData.callerAvatar.trim() !== '') {
        androidConfig.largeIcon = callData.callerAvatar;
      }

      await notifee.displayNotification({
        id: notificationId,
        title: `Incoming ${callData.callType === 'video' ? 'video' : 'voice'} call`,
        body: `${callData.callerName} is calling you`,
        data: {
          callId: callData.callId,
          callType: callData.callType,
          callerName: callData.callerName,
          callerId: callData.callerId,
        },
        android: androidConfig,
      });      console.log('[WhatsAppCallManager] Incoming call notification shown:', notificationId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to show incoming call notification:', error);
      
      // Try showing a basic notification without problematic properties as fallback
      try {
        console.log('[WhatsAppCallManager] Attempting fallback notification...');
        await notifee.displayNotification({
          id: `fallback_incoming_${callData.callId}`,
          title: `Incoming ${callData.callType === 'video' ? 'video' : 'voice'} call`,
          body: `${callData.callerName} is calling you`,
          data: {
            callId: callData.callId,
            callType: callData.callType,
            callerName: callData.callerName,
            callerId: callData.callerId,
          },          android: {
            channelId: CHANNEL_IDS.INCOMING_CALLS,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            smallIcon: 'ic_call', // Required for Android notifications
            actions: [
              { title: 'Decline', pressAction: { id: 'decline_call' } },
              { title: 'Accept', pressAction: { id: 'accept_call' } }
            ],
          },
        });
        console.log('[WhatsAppCallManager] Fallback notification shown successfully');
      } catch (fallbackError) {
        console.error('[WhatsAppCallManager] Even fallback notification failed:', fallbackError);
      }
    }
  }

  /**
   * Show outgoing call notification
   * This notification is shown while the call is connecting/ringing.
   * It must be cancelled as soon as the call is connected (ongoing) or ended.
   */
  private async showOutgoingCallNotification(callData: CallData): Promise<void> {
    try {
      // Always cancel any previous outgoing call notification to avoid duplicates
      const notificationId = `outgoing_call_${callData.callId}`;
      await notifee.cancelNotification(notificationId);

      this.ongoingCallNotificationId = notificationId; // Track for cleanup

      await notifee.displayNotification({
        id: notificationId,
        title: `${callData.callType === 'video' ? 'Video' : 'Voice'} call`,
        body: `Calling ${callData.recipientName}...`,
        data: {
          callId: callData.callId,
          callType: callData.callType,
          recipientName: callData.recipientName,
        },        android: {
          channelId: CHANNEL_IDS.ONGOING_CALLS,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          color: callData.callType === 'video' ? '#007AFF' : '#34C759',
          smallIcon: 'ic_call', // Required for Android notifications
          actions: [
            {
              title: 'End Call',
              pressAction: { id: 'end_call' },
            }
          ],
        },
      });

      console.log('[WhatsAppCallManager] Outgoing call notification shown:', notificationId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to show outgoing call notification:', error);
    }
  }

  /**
   * Show ongoing call notification (when call is connected)
   * Cancels the outgoing notification before showing the ongoing one.
   */
  private async showOngoingCallNotification(): Promise<void> {
    try {
      if (!this.currentCall || this.currentCall.status !== 'connected') {
        return;
      }

      // Cancel outgoing notification if it exists
      const outgoingId = `outgoing_call_${this.currentCall.callId}`;
      await notifee.cancelNotification(outgoingId);

      // Always cancel any previous ongoing call notification to avoid duplicates
      if (this.ongoingCallNotificationId && this.ongoingCallNotificationId !== outgoingId) {
        await notifee.cancelNotification(this.ongoingCallNotificationId);
      }

      const notificationId = `ongoing_call_${this.currentCall.callId}`;
      this.ongoingCallNotificationId = notificationId;

      const participantName = this.currentCall.isInitiator ? 
        this.currentCall.recipientName : 
        this.currentCall.callerName;

      const duration = this.currentCall.startTime ? 
        Math.floor((Date.now() - this.currentCall.startTime) / 1000) : 0;

      const formattedDuration = this.formatDuration(duration);

      await notifee.displayNotification({
        id: notificationId,
        title: `${this.currentCall.callType === 'video' ? 'Video' : 'Voice'} call`,
        body: `In call with ${participantName} • ${formattedDuration}`,
        data: {
          callId: this.currentCall.callId,
          callType: this.currentCall.callType,
          participantName,
        },        android: {
          channelId: CHANNEL_IDS.ONGOING_CALLS,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          asForegroundService: true,
          smallIcon: 'ic_call', // Required for Android notifications
          color: this.currentCall.callType === 'video' ? '#007AFF' : '#34C759',
          actions: [
            {
              title: 'Mute',
              pressAction: { id: 'mute_toggle' },
            },
            {
              title: 'End',
              pressAction: { id: 'end_call' },
            },
            {
              title: 'Open',
              pressAction: { id: 'open_call' },
            }
          ],
          pressAction: { id: 'open_call' }, // Ensure tap always triggers open_call
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `Tap to return to the call with ${participantName}`,
          },
        },
      });

      console.log('[WhatsAppCallManager] Ongoing call notification shown:', notificationId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to show ongoing call notification:', error);
    }
  }

  /**
   * Show call ended notification
   */
  private async showCallEndedNotification(callData: CallData): Promise<void> {
    try {
      const notificationId = `call_ended_${callData.callId}`;
      const participantName = callData.isInitiator ? callData.recipientName : callData.callerName;
      const duration = callData.duration ? this.formatDuration(Math.floor(callData.duration / 1000)) : '0:00';

      await notifee.displayNotification({
        id: notificationId,
        title: 'Call ended',
        body: `${callData.callType === 'video' ? 'Video' : 'Voice'} call with ${participantName} • ${duration}`,
        data: {
          callId: callData.callId,          callType: callData.callType,
          participantName,
          duration: callData.duration || 0,
        },        android: {
          channelId: CHANNEL_IDS.CALL_ENDED,
          importance: AndroidImportance.LOW,          visibility: AndroidVisibility.PUBLIC,          autoCancel: true,
          color: '#8E8E93',
          smallIcon: 'ic_call', // Required for Android notifications
        },
      });

      // Auto-dismiss after 5 seconds
      setTimeout(async () => {
        try {
          await notifee.cancelNotification(notificationId);
        } catch (error) {
          console.error('[WhatsAppCallManager] Failed to auto-dismiss call ended notification:', error);
        }
      }, 5000);

      console.log('[WhatsAppCallManager] Call ended notification shown:', notificationId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to show call ended notification:', error);
    }
  }

  /**
   * Hide incoming call notification and remove all related UI
   */
  private async hideIncomingCallNotification(): Promise<void> {
    try {
      // Cancel the specific incoming call notification
      if (this.incomingCallNotificationId) {
        await notifee.cancelNotification(this.incomingCallNotificationId);
        this.incomingCallNotificationId = null;
        console.log('[WhatsAppCallManager] Incoming call notification hidden');
      }

      // Also cancel any fallback notifications that might exist
      if (this.currentCall) {
        const fallbackId = `fallback_incoming_${this.currentCall.callId}`;
        await notifee.cancelNotification(fallbackId);
      }

      // Stop vibration if still ongoing
      Vibration.cancel();

      console.log('[WhatsAppCallManager] ✅ Incoming call UI completely removed');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to hide incoming call notification:', error);
    }
  }

  /**
   * Hide ongoing call notification and stop foreground service
   * Also cancels outgoing notification for safety.
   */
  private async hideOngoingCallNotification(): Promise<void> {
    try {
      // Cancel both outgoing and ongoing notifications
      if (this.currentCall) {
        const outgoingId = `outgoing_call_${this.currentCall.callId}`;
        await notifee.cancelNotification(outgoingId);
        const ongoingId = `ongoing_call_${this.currentCall.callId}`;
        await notifee.cancelNotification(ongoingId);
      }
      this.ongoingCallNotificationId = null;
      // Always stop foreground service
      try {
        await notifee.stopForegroundService();
      } catch (e) {
        console.warn('[WhatsAppCallManager] No foreground service to stop or error stopping:', e);
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to hide ongoing call notification:', error);
    }
  }

  /**
   * Navigate to meeting screen (used for notification tap/deep link)
   * This method is called from notification pressAction and ensures navigation
   * works from foreground, background, or killed state (deep linking handled in App.tsx)
   */
  private navigateToMeetingScreen(callData: CallData): void {
    try {
      const params = {
        meetingId: callData.meetingId,
        token: callData.token,
        callType: callData.callType,
        displayName: callData.isInitiator ? callData.callerName : callData.recipientName,
        recipientName: callData.isInitiator ? callData.recipientName : callData.callerName,
        isInitiator: callData.isInitiator,
      };

      console.log('[WhatsAppCallManager] Navigating to meeting screen:', params);
      // Navigate to the Main navigator with the Meeting screen
      // Since UltraFastLoader renders MainNavigator directly, navigate directly to Meeting
      if (navigationRef.isReady()) {
        // Navigate to Meeting using nested navigation
        (navigationRef as any).navigate('Main', {
          screen: 'Meeting',
          params: params
        });
      } else {
        console.warn('[WhatsAppCallManager] Navigation not ready, cannot navigate to meeting');
      }

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to navigate to meeting screen:', error);
    }
  }

  /**
   * Open call screen from notification (legacy, now handled by navigateToMeetingScreen)
   * Kept for backward compatibility, but all navigation should use navigateToMeetingScreen
   */
  private async openCallScreen(callId: string): Promise<void> {
    try {
      if (this.currentCall && this.currentCall.callId === callId) {
        this.navigateToMeetingScreen(this.currentCall);
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to open call screen:', error);
    }
  }

  /**
   * Send call notification to other participant
   */
  private async sendCallNotification(callData: CallData): Promise<void> {
    try {
      await ApiService.sendCallNotification({
        recipientId: callData.recipientId,
        callerId: callData.callerId,
        callerName: callData.callerName,
        callType: callData.callType,
        meetingId: callData.meetingId,
        rtcToken: callData.token,
      });

      console.log('[WhatsAppCallManager] Call notification sent to recipient');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to send call notification:', error);
    }
  }

  /**
   * Initiate call with recipient using VideoSDK API
   */
  private async initiateCallWithRecipient(callData: CallData): Promise<void> {
    try {
      console.log('[WhatsAppCallManager] Initiating call with recipient:', callData.recipientId);

      // Get recipient's FCM token and platform info
      const recipientTokenInfo = await ApiService.getFCMToken(callData.recipientId, callData.callerId);
      
      if (!recipientTokenInfo) {
        console.warn('[WhatsAppCallManager] No FCM token found for recipient, using fallback notification');
        // Fallback to basic notification
        await this.sendCallNotification(callData);
        return;
      }

      // Get current user's FCM token
      const callerToken = await ApiService.getCurrentFCMToken();
      
      if (!callerToken) {
        console.warn('[WhatsAppCallManager] No FCM token for caller, using fallback notification');
        await this.sendCallNotification(callData);
        return;
      }

      // Prepare initiate call payload
      const payload = {
        calleeInfo: {
          platform: recipientTokenInfo.platform,
          token: recipientTokenInfo.token,
        },
        callerInfo: {
          name: callData.callerName,
          token: callerToken,
        },
        videoSDKInfo: {
          meetingId: callData.meetingId,
          token: callData.token,
        },
      };

      console.log('[WhatsAppCallManager] Sending initiate call request');
      const response = await ApiService.initiateCall(payload);
      
      if (response.success) {
        console.log('[WhatsAppCallManager] Call initiation successful:', response.message);
      } else {
        console.warn('[WhatsAppCallManager] Call initiation returned false, but no error thrown');
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to initiate call with recipient:', error);
      
      // Fallback to basic notification if initiate call fails
      try {
        console.log('[WhatsAppCallManager] Attempting fallback notification');
        await this.sendCallNotification(callData);
      } catch (fallbackError) {
        console.error('[WhatsAppCallManager] Fallback notification also failed:', fallbackError);
        // Don't throw here - we don't want to break the call flow
      }
    }
  }

  /**
   * Send call status update to API with proper status mapping
   */
  private async sendCallStatusUpdate(callData: CallData, status: 'accepted' | 'declined' | 'ended'): Promise<void> {
    try {
      // Get caller's FCM token and platform info
      const callerUserId = await this.getCurrentUserId();
      const tokenDetails = await ApiService.getBothUsersFCMTokens(callerUserId, callData.recipientId);
      
      // CRITICAL FIX: Map status to correct API format - both decline and end should send CALL_ENDED
      let apiStatus: 'CALL_ENDED' | 'CALL_MISSED' | 'CALL_ACCEPTED';
      switch (status) {
        case 'accepted':
          apiStatus = 'CALL_ACCEPTED';
          break;
        case 'declined':
          // FIXED: Declined calls should send CALL_ENDED status to properly terminate the call
          apiStatus = 'CALL_ENDED';
          break;
        case 'ended':
        default:
          // Ended calls should send CALL_ENDED status
          apiStatus = 'CALL_ENDED';
          break;
      }

      const payload = {
        callerInfo: {
          token: tokenDetails.callerToken || '',
          name: callData.callerName,
          platform: tokenDetails.callerPlatform,
        },
        type: apiStatus,
      };

      console.log('[WhatsAppCallManager] Sending call status update:', { 
        status, 
        apiStatus, 
        payload: { ...payload, callerInfo: { ...payload.callerInfo, token: '[REDACTED]' } }
      });

      await ApiService.updateCallStatus(payload);

      console.log('[WhatsAppCallManager] ✅ Call status update sent successfully:', status, '-> API:', apiStatus);
    } catch (error) {
      console.error('[WhatsAppCallManager] ❌ Failed to send call status update:', error);
    }
  }

  /**
   * Toggle mute
   */
  private async toggleMute(): Promise<void> {
    try {
      appEventEmitter.emit('toggleMute');
      console.log('[WhatsAppCallManager] Mute toggled');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to toggle mute:', error);
    }
  }

  /**
   * Handle call state changes
   */
  private handleCallStateChanged(callData: CallData): void {
    console.log('[WhatsAppCallManager] Call state changed:', callData.status);
    
    if (callData.status === 'connected' && this.appState === 'background') {
      this.showOngoingCallNotification();
    }
  }

  /**
   * Save call state to AsyncStorage
   */
  private async saveCallState(): Promise<void> {
    try {
      if (this.currentCall) {
        await AsyncStorage.setItem(this.callStateKey, JSON.stringify(this.currentCall));
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to save call state:', error);
    }
  }

  /**
   * Restore call state from AsyncStorage
   */
  private async restoreCallState(): Promise<void> {
    try {
      const callStateJson = await AsyncStorage.getItem(this.callStateKey);
      if (callStateJson) {
        const callData: CallData = JSON.parse(callStateJson);
        
        // Only restore if call is still active
        if (callData.status === 'connected' || callData.status === 'ringing') {
          this.currentCall = callData;
          console.log('[WhatsAppCallManager] Call state restored:', callData.callId);
          
          // Show ongoing call notification if connected
          if (callData.status === 'connected') {
            await this.showOngoingCallNotification();
          }
          
          // Emit call state change
          appEventEmitter.emit('callStateChanged', callData);
        } else {
          // Clear old call state
          await this.clearCallState();
        }
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to restore call state:', error);
    }
  }

  /**
   * Clear call state completely and cleanup all resources
   */
  private async clearCallState(): Promise<void> {
    try {
      // Clear current call
      this.currentCall = null;
      
      // Clear notification IDs
      this.incomingCallNotificationId = null;
      this.ongoingCallNotificationId = null;
      
      // Remove from persistent storage
      await AsyncStorage.removeItem(this.callStateKey);
      
      // Cancel any remaining vibrations
      Vibration.cancel();
      
      console.log('[WhatsAppCallManager] ✅ Call state completely cleared');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to clear call state:', error);
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      return userId || 'unknown';
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to get current user ID:', error);
      return 'unknown';
    }
  }

  /**
   * Format duration in MM:SS format
   */
  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get current call
   */
  public getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  /**
   * Update call status
   */
  public updateCallStatus(status: CallData['status']): void {
    if (this.currentCall) {
      this.currentCall.status = status;
      this.saveCallState();
      appEventEmitter.emit('callStateChanged', this.currentCall);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    try {
      Vibration.cancel();
      this.hideIncomingCallNotification();
      this.hideOngoingCallNotification();
      this.clearCallState();
      
      // BULLETPROOF: Ensure media cleanup
      this.mediaManager.cleanup('whatsapp_call_manager_cleanup');
      
      console.log('[WhatsAppCallManager] Cleanup completed');
    } catch (error) {
      console.error('[WhatsAppCallManager] Cleanup failed:', error);
    }
  }

  /**
   * Initialize media for call
   * BULLETPROOF FIX: Ensures that both mic and camera are initialized properly before navigation
   */
  public initializeMediaForCall(callId: string, isVideoCall: boolean): void {
    try {
      // Initialize the media manager with proper settings
      this.mediaManager.initialize(callId, isVideoCall);
      
      // BULLETPROOF FIX: For video calls, explicitly ensure camera is enabled
      // This ensures that camera is ready BEFORE navigating to the meeting screen
      if (isVideoCall) {
        // Force camera to be on immediately
        this.mediaManager.setCameraEnabled(true);
        console.log('[WhatsAppCallManager] Camera enabled for video call');
        
        // CRITICAL FIX: Ensure speaker is enabled for video calls
        this.mediaManager.setSpeakerEnabled(true);
      }
      
      // Always ensure microphone is enabled for any call type
      this.mediaManager.setMicEnabled(true);
      
      // Force a state update to ensure any subscribers are notified
      this.mediaManager.forceUpdateMediaState({
        micEnabled: true,
        cameraEnabled: isVideoCall,
        speakerEnabled: true, 
        isVideoCall
      });
      
      // Add a short delay to ensure camera has time to initialize
      setTimeout(() => {
        console.log('[WhatsAppCallManager] Double-checking camera state after initialization');
        if (isVideoCall && !this.mediaManager.getMediaState().cameraEnabled) {
          console.log('[WhatsAppCallManager] Re-enabling camera after initialization');
          this.mediaManager.setCameraEnabled(true);
        }
      }, 500);
      
      console.log('[WhatsAppCallManager] Media initialized for call:', callId, 'isVideoCall:', isVideoCall);
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to initialize media:', error);
    }
  }

  /**
   * Set VideoSDK meeting reference for media control
   */
  public setVideoSDKMeeting(meeting: any): void {
    try {
      this.mediaManager.setMeeting(meeting);
      console.log('[WhatsAppCallManager] VideoSDK meeting set for media control');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to set VideoSDK meeting:', error);
    }
  }

  /**
   * Get media manager instance
   */
  public getMediaManager(): CallMediaManager {
    return this.mediaManager;
  }

  /**
   * Toggle microphone through media manager
   */
  public async toggleMic(): Promise<boolean> {
    return await this.mediaManager.toggleMic();
  }

  /**
   * Toggle camera through media manager
   */
  public async toggleCamera(): Promise<boolean> {
    return await this.mediaManager.toggleCamera();
  }

  /**
   * Toggle speaker through media manager
   */
  public async toggleSpeaker(): Promise<boolean> {
    return await this.mediaManager.toggleSpeaker();
  }

  /**
   * Get current media state
   */
  public getMediaState() {
    return this.mediaManager.getMediaState();
  }
}

export default WhatsAppCallManager;
