/**
 * UnifiedCallService - Bulletproof Call & Notification Manager
 * 
 * This service consolidates ALL call-related functionality:
 * - Call state management (single source of truth)
 * - Notification handling (incoming, outgoing, ongoing, ended)
 * - Media management (mic, camera, speaker)
 * - VideoSDK integration
 * - FCM integration
 * - Background/foreground synchronization
 * - Permission handling
 * 
 * Replaces: WhatsAppCallManager, CallManager, CallService, CallSyncService, 
 * CallNotificationHandler, WhatsAppCallNotificationService
 */

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
  PermissionsAndroid,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import VoipPushNotification from 'react-native-voip-push-notification';
import { switchAudioDevice } from '@videosdk.live/react-native-sdk';
import { v4 as uuid } from 'uuid';

import { appEventEmitter } from '../../events/AppEventEmitter';
import ApiService from '../ApiService';
import VideoSDKService from '../videosdk/VideoSDKService';
import BlocklistService from '../BlocklistService';
import CallMediaManager from './CallMediaManager';

// ===== TYPES =====

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'connected' | 'ending' | 'ended' | 'cleanup_pending';

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
  status: CallStatus;
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
  callerFcmToken?: string;
}

export interface CallState {
  isInCall: boolean;
  activeCall: CallData | null;
  callStatus: CallStatus;
  lastCallEndReason?: string;
}

export interface MediaState {
  micEnabled: boolean;
  cameraEnabled: boolean;
  speakerEnabled: boolean;
  isVideoCall: boolean;
}

export interface MediaTrackInfo {
  trackId: string;
  type: 'audio' | 'video';
  isActive: boolean;
  stream?: any; // MediaStream from VideoSDK
}

// ===== CONSTANTS =====

const CHANNEL_IDS = {
  INCOMING_CALLS: 'unified_incoming_calls',
  ONGOING_CALLS: 'unified_ongoing_calls',
  MISSED_CALLS: 'unified_missed_calls',
  CALL_ENDED: 'unified_call_ended'
} as const;

const STORAGE_KEYS = {
  CALL_STATE: 'UNIFIED_CALL_STATE',
  SYNC_STATE: 'UNIFIED_SYNC_STATE',
  PERMISSIONS: 'UNIFIED_CALL_PERMISSIONS'
} as const;

// ===== UNIFIED CALL SERVICE =====

class UnifiedCallService {
  private static instance: UnifiedCallService;
  private isInitialized = false;
  
  // ===== STATE MANAGEMENT =====
  private callState: CallState = {
    isInCall: false,
    activeCall: null,
    callStatus: 'idle'
  };
  
  // ===== NOTIFICATION STATE =====
  private incomingCallNotificationId: string | null = null;
  private ongoingCallNotificationId: string | null = null;
  private notificationChannelsCreated = false;
  
  // ===== MEDIA MANAGEMENT =====
  private mediaManager: CallMediaManager;
  private mediaState: MediaState = {
    micEnabled: true,
    cameraEnabled: false,
    speakerEnabled: true,
    isVideoCall: false
  };
  
  // ===== APP STATE =====
  private appState: AppStateStatus = 'active';
  private audioPermissionGranted = false;
  private videoPermissionGranted = false;
  
  // ===== SYNC & BACKGROUND =====
  private syncInterval: NodeJS.Timeout | null = null;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private lastSyncedCallId: string | null = null;
  private isSyncing = false;
  
  // ===== VIBRATION PATTERNS =====
  private readonly INCOMING_CALL_VIBRATION = [2, 1000, 1000, 2000];
  private readonly CALL_END_VIBRATION = [2, 200];
  
  // ===== CLEANUP =====
  private isCleaningUp: boolean = false;
  
  // ===== SINGLETON =====
  private constructor() {
    this.mediaManager = CallMediaManager.getInstance();
    this.setupAppStateListener();
  }

  public static getInstance(): UnifiedCallService {
    if (!UnifiedCallService.instance) {
      UnifiedCallService.instance = new UnifiedCallService();
    }
    return UnifiedCallService.instance;
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the unified call service
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[UnifiedCallService] Already initialized');
        return true;
      }

      console.log('[UnifiedCallService] Initializing unified call service...');

      // Initialize VideoSDK
      await this.initializeVideoSDK();

      // Check permissions (don't request yet)
      await this.checkPermissions();

      // Create notification channels
      await this.createNotificationChannels();

      // Setup all event listeners
      this.setupEventListeners();

      // Restore call state if app was killed
      await this.restoreCallState();

      // Start background sync
      this.startBackgroundSync();

      this.isInitialized = true;
      console.log('[UnifiedCallService] ✅ Initialized successfully');
      return true;

    } catch (error) {
      console.error('[UnifiedCallService] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize VideoSDK service
   */
  private async initializeVideoSDK(): Promise<void> {
    const videoSDKService = VideoSDKService.getInstance();
    if (!videoSDKService.getInitializationStatus()) {
      const videoSDKApiKey = process.env.VIDEOSDK_API_KEY || 'a4e0729c-93d5-4b86-8cf6-9c5da5b1d6ea';
      
      console.log('[UnifiedCallService] Initializing VideoSDK with API key:', videoSDKApiKey ? 'API key present' : 'No API key');
      
      if (!videoSDKApiKey || videoSDKApiKey === 'YOUR_VIDEOSDK_API_KEY') {
        console.error('[UnifiedCallService] VideoSDK API Key is not set. Using default key for development.');
      }
      
      await videoSDKService.initialize({ apiKey: videoSDKApiKey });
      console.log('[UnifiedCallService] VideoSDK initialized successfully');
    }
  }

  // ===== PERMISSION MANAGEMENT =====

  /**
   * Check permissions without requesting
   */
  private async checkPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        this.audioPermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        this.videoPermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        
        console.log('[UnifiedCallService] Current permissions:', {
          audio: this.audioPermissionGranted,
          video: this.videoPermissionGranted
        });
      }
    } catch (error) {
      console.error('[UnifiedCallService] Error checking permissions:', error);
    }
  }

  /**
   * Request permissions (call only when app is in foreground)
   */
  public async requestPermissionsIfNeeded(callType: 'voice' | 'video'): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return true; // iOS permissions handled differently
      }

      console.log('[UnifiedCallService] Requesting permissions for:', callType);

      // Request foreground service permission for Android 14+
      if (Platform.Version >= 34) {
        try {
          const foregroundServicePermission = await PermissionsAndroid.request('android.permission.FOREGROUND_SERVICE_PHONE_CALL' as any);
          console.log('[UnifiedCallService] Foreground service permission result:', foregroundServicePermission);
        } catch (error) {
          console.warn('[UnifiedCallService] Foreground service permission request failed (non-critical):', error);
        }
      }

      // Request mic and camera permissions
      const permissionsToRequest: (typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS])[] = [];
      
      // Re-check current permission status
      const currentAudioPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const currentVideoPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      
      if (!currentAudioPermission) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }
      if (callType === 'video' && !currentVideoPermission) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      if (permissionsToRequest.length > 0) {
        const statuses = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        this.audioPermissionGranted = statuses[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED || currentAudioPermission;
        this.videoPermissionGranted = statuses[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED || currentVideoPermission;
      } else {
        this.audioPermissionGranted = currentAudioPermission;
        this.videoPermissionGranted = currentVideoPermission;
      }

      // Final validation
      if (!this.audioPermissionGranted) {
        console.error('[UnifiedCallService] Audio permission not granted');
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
        console.error('[UnifiedCallService] Video permission not granted for video call');
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

      console.log('[UnifiedCallService] ✅ All required permissions granted');
      return true;

    } catch (error) {
      console.error('[UnifiedCallService] Error requesting permissions:', error);
      Alert.alert('Error', 'An error occurred while requesting permissions. Please try again.');
      return false;
    }
  }

  // ===== NOTIFICATION MANAGEMENT =====

  /**
   * Create notification channels
   */
  private async createNotificationChannels(): Promise<void> {
    if (this.notificationChannelsCreated) return;

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

      this.notificationChannelsCreated = true;
      console.log('[UnifiedCallService] Notification channels created');
    } catch (error) {
      console.error('[UnifiedCallService] Failed to create notification channels:', error);
    }
  }

  /**
   * Show incoming call notification
   */
  private async showIncomingCallNotification(callData: CallData): Promise<void> {
    try {
      const notificationId = `incoming_call_${callData.callId}`;
      this.incomingCallNotificationId = notificationId;

      const actions: AndroidAction[] = [
        {
          title: 'Decline',
          pressAction: { id: 'decline_call' },
        },
        {
          title: 'Accept',
          pressAction: { id: 'accept_call' },
        }
      ];

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
        smallIcon: 'ic_call',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${callData.callerName} is calling you. Tap to answer or use the action buttons.`,
        },
      };

      // Add avatar if available
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
      });

      console.log('[UnifiedCallService] Incoming call notification shown:', notificationId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to show incoming call notification:', error);
      
      // Fallback notification
      try {
        await notifee.displayNotification({
          id: `fallback_incoming_${callData.callId}`,
          title: `Incoming ${callData.callType === 'video' ? 'video' : 'voice'} call`,
          body: `${callData.callerName} is calling you`,
          data: {
            callId: callData.callId,
            callType: callData.callType,
            callerName: callData.callerName,
            callerId: callData.callerId,
          },
          android: {
            channelId: CHANNEL_IDS.INCOMING_CALLS,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            smallIcon: 'ic_call',
            actions: [
              { title: 'Decline', pressAction: { id: 'decline_call' } },
              { title: 'Accept', pressAction: { id: 'accept_call' } }
            ],
          },
        });
      } catch (fallbackError) {
        console.error('[UnifiedCallService] Even fallback notification failed:', fallbackError);
      }
    }
  }

  /**
   * Show outgoing call notification
   */
  private async showOutgoingCallNotification(callData: CallData): Promise<void> {
    try {
      const notificationId = `outgoing_call_${callData.callId}`;
      await notifee.cancelNotification(notificationId);
      this.ongoingCallNotificationId = notificationId;

      await notifee.displayNotification({
        id: notificationId,
        title: `${callData.callType === 'video' ? 'Video' : 'Voice'} call`,
        body: `Calling ${callData.recipientName}...`,
        data: {
          callId: callData.callId,
          callType: callData.callType,
          recipientName: callData.recipientName,
        },
        android: {
          channelId: CHANNEL_IDS.ONGOING_CALLS,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          color: callData.callType === 'video' ? '#007AFF' : '#34C759',
          smallIcon: 'ic_call',
          actions: [
            {
              title: 'End Call',
              pressAction: { id: 'end_call' },
            }
          ],
        },
      });

      console.log('[UnifiedCallService] Outgoing call notification shown:', notificationId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to show outgoing call notification:', error);
    }
  }

  /**
   * Show ongoing call notification
   */
  private async showOngoingCallNotification(): Promise<void> {
    if (!this.callState.activeCall) return;

    try {
      // Cancel outgoing notification first
      if (this.ongoingCallNotificationId) {
        await notifee.cancelNotification(this.ongoingCallNotificationId);
      }

      const notificationId = `ongoing_call_${this.callState.activeCall.callId}`;
      this.ongoingCallNotificationId = notificationId;

      const participantName = this.callState.activeCall.isInitiator ? 
        this.callState.activeCall.recipientName : 
        this.callState.activeCall.callerName;

      const duration = this.callState.activeCall.startTime ? 
        Math.floor((Date.now() - this.callState.activeCall.startTime) / 1000) : 0;

      const formattedDuration = this.formatDuration(duration);

      await notifee.displayNotification({
        id: notificationId,
        title: `${this.callState.activeCall.callType === 'video' ? 'Video' : 'Voice'} call`,
        body: `In call with ${participantName} • ${formattedDuration}`,
        data: {
          callId: this.callState.activeCall.callId,
          callType: this.callState.activeCall.callType,
          participantName,
        },
        android: {
          channelId: CHANNEL_IDS.ONGOING_CALLS,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          asForegroundService: true,
          smallIcon: 'ic_call',
          color: this.callState.activeCall.callType === 'video' ? '#007AFF' : '#34C759',
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
          pressAction: { id: 'open_call' },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `Tap to return to the call with ${participantName}`,
          },
        },
      });

      console.log('[UnifiedCallService] Ongoing call notification shown:', notificationId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to show ongoing call notification:', error);
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
          callId: callData.callId,
          callType: callData.callType,
          participantName,
          duration: callData.duration || 0,
        },
        android: {
          channelId: CHANNEL_IDS.CALL_ENDED,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          autoCancel: true,
          color: '#8E8E93',
          smallIcon: 'ic_call',
        },
      });

      // Auto-dismiss after 5 seconds
      setTimeout(async () => {
        try {
          await notifee.cancelNotification(notificationId);
        } catch (error) {
          console.error('[UnifiedCallService] Failed to auto-dismiss call ended notification:', error);
        }
      }, 5000);

      console.log('[UnifiedCallService] Call ended notification shown:', notificationId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to show call ended notification:', error);
    }
  }

  /**
   * Hide incoming call notification
   */
  private async hideIncomingCallNotification(): Promise<void> {
    try {
      if (this.incomingCallNotificationId) {
        await notifee.cancelNotification(this.incomingCallNotificationId);
        this.incomingCallNotificationId = null;
      }
      
      // Also cancel any fallback notifications
      if (this.callState.activeCall) {
        await notifee.cancelNotification(`fallback_incoming_${this.callState.activeCall.callId}`);
      }
      
      console.log('[UnifiedCallService] Incoming call notification hidden');
    } catch (error) {
      console.error('[UnifiedCallService] Failed to hide incoming call notification:', error);
    }
  }

  /**
   * Hide ongoing call notification
   */
  private async hideOngoingCallNotification(): Promise<void> {
    try {
      if (this.ongoingCallNotificationId) {
        await notifee.cancelNotification(this.ongoingCallNotificationId);
        this.ongoingCallNotificationId = null;
      }
      
      // Also cancel any outgoing notifications
      if (this.callState.activeCall) {
        await notifee.cancelNotification(`outgoing_call_${this.callState.activeCall.callId}`);
      }
      
      console.log('[UnifiedCallService] Ongoing call notification hidden');
    } catch (error) {
      console.error('[UnifiedCallService] Failed to hide ongoing call notification:', error);
    }
  }

  // ===== EVENT LISTENERS =====

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Notifee events
    notifee.onForegroundEvent(async (event) => {
      await this.handleNotificationEvent(event.type, event.detail);
    });

    notifee.onBackgroundEvent(async (event) => {
      await this.handleNotificationEvent(event.type, event.detail);
    });

    // FCM events
    this.setupFCMHandlers();

    // VoIP events (iOS)
    this.setupVoIPHandlers();

    // App state events
    this.setupAppStateListener();

    console.log('[UnifiedCallService] All event listeners setup complete');
  }

  /**
   * Setup FCM handlers
   */
  private setupFCMHandlers(): void {
    // Background/killed app notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[UnifiedCallService] Background FCM message:', remoteMessage);
      try {
        await this.handleFCMCallNotification(remoteMessage);
      } catch (error) {
        console.error('[UnifiedCallService] Error handling background FCM message:', error);
      }
    });

    // Foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      console.log('[UnifiedCallService] Foreground FCM message:', remoteMessage);
      try {
        await this.handleFCMCallNotification(remoteMessage);
      } catch (error) {
        console.error('[UnifiedCallService] Error handling foreground FCM message:', error);
      }
    });

    // Notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[UnifiedCallService] FCM notification opened app:', remoteMessage);
      try {
        this.handleFCMNotificationOpen(remoteMessage);
      } catch (error) {
        console.error('[UnifiedCallService] Error handling FCM notification open:', error);
      }
    });

    // Initial notification (app was killed)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[UnifiedCallService] Initial FCM notification:', remoteMessage);
        try {
          this.handleFCMNotificationOpen(remoteMessage);
        } catch (error) {
          console.error('[UnifiedCallService] Error handling initial FCM notification:', error);
        }
      }
    });
  }

  /**
   * Setup VoIP handlers (iOS)
   */
  private setupVoIPHandlers(): void {
    if (Platform.OS === 'ios') {
      VoipPushNotification.addEventListener('register', (token) => {
        console.log('[UnifiedCallService] VoIP token:', token);
        // Send token to your server
      });

      VoipPushNotification.addEventListener('notification', (notification) => {
        console.log('[UnifiedCallService] VoIP notification:', notification);
        // Handle VoIP notification
      });
    }
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = this.appState;
      this.appState = nextAppState;

      console.log('[UnifiedCallService] App state changed:', previousAppState, '->', nextAppState);

      // Handle app state changes
      if (nextAppState === 'active') {
        // App came to foreground
        this.handleAppForeground();
      } else if (nextAppState === 'background') {
        // App went to background
        this.handleAppBackground();
      }
    });
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground(): void {
    console.log('[UnifiedCallService] App came to foreground');
    
    // If there's an active call, hide ongoing notification
    if (this.callState.isInCall && this.callState.activeCall) {
      this.hideOngoingCallNotification();
    }
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    console.log('[UnifiedCallService] App went to background');
    
    // If there's an active call, show ongoing notification
    if (this.callState.isInCall && this.callState.activeCall) {
      this.showOngoingCallNotification();
    }
  }

  // ===== NOTIFICATION EVENT HANDLERS =====

  /**
   * Handle notification events
   */
  private async handleNotificationEvent(type: EventType, detail: any): Promise<void> {
    try {
      const { notification, pressAction } = detail;
      const callId = notification?.data?.callId;

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
            if (callId && this.callState.activeCall) {
              this.requestNavigationToMeetingScreen(this.callState.activeCall);
            }
            break;
          case 'mute_toggle':
            await this.toggleMic();
            break;
          case 'speaker_toggle':
            await this.toggleSpeaker();
            break;
        }
      }
    } catch (error) {
      console.error('[UnifiedCallService] Error handling notification event:', error);
    }
  }

  /**
   * Handle FCM call notification
   */
  private async handleFCMCallNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    try {
      const { data } = remoteMessage;
      if (!data || !data.type) return;

      console.log('[UnifiedCallService] Processing FCM call notification:', data.type);

      if (data.type === 'CALL_INITIATION' || data.type === 'call') {
        await this.handleIncomingFCMCall(data);
      } else if (data.type === 'CALL_ACCEPTED') {
        await this.handleCallAcceptedFCM(data);
      } else if (data.type === 'CALL_ENDED') {
        await this.handleCallEndedFCM(data);
      }
    } catch (error) {
      console.error('[UnifiedCallService] Error handling FCM call notification:', error);
    }
  }

  /**
   * Handle incoming FCM call
   */
  private async handleIncomingFCMCall(data: any): Promise<void> {
    try {
      // Parse call data
      const callData = this.parseFCMCallData(data);
      if (!callData) return;

      // Check if this is actually an incoming call for current user
      const currentUserId = await this.getCurrentUserId();
      const isInitiator = String(data.isInitiator) === 'true';
      const isIncomingCall = !isInitiator || data.isIncomingCall === 'true';

      if (!isIncomingCall) {
        console.log('[UnifiedCallService] Skipping - not an incoming call for current user');
        return;
      }

      // Check if caller is blocked - suppress call completely if blocked
      const blocklistService = BlocklistService.getInstance();
      if (blocklistService.shouldBlockIncomingCall(callData.callerId)) {
        console.log('[UnifiedCallService] FCM incoming call blocked from user:', callData.callerId);
        // Silently decline the call without any UI or notifications
        await this.sendCallStatusUpdate({
          callId: callData.callId,
          meetingId: callData.meetingId,
          token: callData.token,
          callerName: callData.callerName,
          recipientName: 'Me',
          callType: callData.callType,
          callerId: callData.callerId,
          recipientId: currentUserId,
          isInitiator: false,
          status: 'ended'
        }, 'ended');
        return; // Exit early - no further processing
      }

      console.log('[UnifiedCallService] Processing incoming call:', callData.callId);

      // Create call data
      const incomingCallData: CallData = {
        callId: callData.callId,
        meetingId: callData.meetingId,
        token: callData.token,
        callerName: callData.callerName,
        recipientName: 'Me',
        callType: callData.callType,
        callerId: callData.callerId,
        recipientId: currentUserId,
        callerAvatar: callData.callerAvatar,
        isInitiator: false,
        status: 'ringing',
        startTime: Date.now()
      };

      // Update call state
      this.updateCallState({
        isInCall: true,
        activeCall: incomingCallData,
        callStatus: 'ringing'
      });

      // Show incoming call notification
      await this.showIncomingCallNotification(incomingCallData);

      // Start vibration
      Vibration.vibrate(this.INCOMING_CALL_VIBRATION, true);

      console.log('[UnifiedCallService] Incoming call processed:', incomingCallData.callId);

    } catch (error) {
      console.error('[UnifiedCallService] Error handling incoming FCM call:', error);
    }
  }

  /**
   * Handle FCM notification open
   */
  private handleFCMNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    try {
      const { data } = remoteMessage;
      if (!data) return;

      console.log('[UnifiedCallService] FCM notification opened app:', data);

      // Navigate to appropriate screen based on call state
      if (this.callState.activeCall) {
        this.requestNavigationToMeetingScreen(this.callState.activeCall);
      }
    } catch (error) {
      console.error('[UnifiedCallService] Error handling FCM notification open:', error);
    }
  }

  // ===== INCOMING CALL HANDLING =====

  /**
   * Handle incoming call (public method for external use)
   */
  public async handleIncomingCall(callNotificationData: CallNotificationData): Promise<void> {
    try {
      console.log('[UnifiedCallService] Handling incoming call:', callNotificationData);

      // Check if caller is blocked - suppress call completely if blocked
      const blocklistService = BlocklistService.getInstance();
      if (blocklistService.shouldBlockIncomingCall(callNotificationData.callerId)) {
        console.log('[UnifiedCallService] Incoming call blocked from user:', callNotificationData.callerId);
        // Silently decline the call without any UI or notifications
        await this.sendCallStatusUpdate({
          callId: callNotificationData.callId,
          meetingId: callNotificationData.meetingId,
          token: callNotificationData.token,
          callerName: callNotificationData.callerName,
          recipientName: 'Me',
          callType: callNotificationData.callType,
          callerId: callNotificationData.callerId,
          recipientId: await this.getCurrentUserId(),
          isInitiator: false,
          status: 'ended'
        }, 'ended');
        return; // Exit early - no further processing
      }

      // Check if we're already in a call
      if (this.callState.isInCall) {
        console.warn('[UnifiedCallService] Already in a call - rejecting incoming call');
        await this.sendCallStatusUpdate({
          callId: callNotificationData.callId,
          meetingId: callNotificationData.meetingId,
          token: callNotificationData.token,
          callerName: callNotificationData.callerName,
          recipientName: 'Me',
          callType: callNotificationData.callType,
          callerId: callNotificationData.callerId,
          recipientId: await this.getCurrentUserId(),
          isInitiator: false,
          status: 'ended'
        }, 'ended');
        return;
      }

      // Get current user ID
      const currentUserId = await this.getCurrentUserId();

      // Create call data
      const incomingCallData: CallData = {
        callId: callNotificationData.callId,
        meetingId: callNotificationData.meetingId,
        token: callNotificationData.token,
        callerName: callNotificationData.callerName,
        recipientName: 'Me',
        callType: callNotificationData.callType,
        callerId: callNotificationData.callerId,
        recipientId: currentUserId,
        callerAvatar: callNotificationData.callerAvatar,
        isInitiator: false,
        status: 'ringing',
        startTime: Date.now()
      };

      // Update call state
      this.updateCallState({
        isInCall: true,
        activeCall: incomingCallData,
        callStatus: 'ringing'
      });

      // Show incoming call notification
      await this.showIncomingCallNotification(incomingCallData);

      // Start vibration
      Vibration.vibrate(this.INCOMING_CALL_VIBRATION, true);

      // Emit event for UI components
      appEventEmitter.emit('incomingCall', incomingCallData);

      console.log('[UnifiedCallService] Incoming call handled successfully:', incomingCallData.callId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to handle incoming call:', error);
      
      // Clean up on error
      this.updateCallState({
        isInCall: false,
        activeCall: null,
        callStatus: 'ended'
      });
    }
  }

  // ===== CALL MANAGEMENT =====

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
      console.log('[UnifiedCallService] Starting outgoing call:', {
        recipientId,
        recipientName,
        callType,
        callerName,
        callerId
      });

      // Request permissions
      const permissionsGranted = await this.requestPermissionsIfNeeded(callType);
      if (!permissionsGranted) {
        console.log('[UnifiedCallService] Call aborted due to missing permissions');
        return null;
      }

      // Generate VideoSDK meeting
      const videoSDKService = VideoSDKService.getInstance();
      const token = await videoSDKService.generateParticipantToken();
      
      if (!token) {
        throw new Error('Failed to generate VideoSDK token');
      }
      
      const meetingId = await videoSDKService.createMeeting(token);
      if (!meetingId) {
        throw new Error('Failed to create VideoSDK meeting');
      }

      // Create call data
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
        status: 'dialing',
        startTime: Date.now()
      };

      // Update call state IMMEDIATELY and synchronously before navigation
      this.updateCallState({
        isInCall: true,
        activeCall: callData,
        callStatus: 'dialing'
      });

      // CRITICAL FIX: Force immediate event emission to ensure CallProvider syncs
      // This prevents race conditions where MeetingScreen mounts before activeCall is set
      appEventEmitter.emit('callStateChanged', this.callState);

      // Initialize media
      this.initializeMediaForCall(callData.callId, callType === 'video');

      // Send call notification to recipient
      await this.sendCallNotificationToRecipient(callData);

      // Show outgoing call notification
      await this.showOutgoingCallNotification(callData);

      // Navigate to meeting screen - this should happen after state is fully updated
      this.requestNavigationToMeetingScreen(callData);

      console.log('[UnifiedCallService] Outgoing call started:', callData.callId);
      return callData;

    } catch (error) {
      console.error('[UnifiedCallService] Failed to start outgoing call:', error);
      return null;
    }
  }

  /**
   * Accept incoming call
   */
  public async acceptCall(callId?: string): Promise<void> {
    try {
      const targetCall = callId ? 
        (this.callState.activeCall?.callId === callId ? this.callState.activeCall : null) : 
        this.callState.activeCall;

      if (!targetCall) {
        console.warn('[UnifiedCallService] No call to accept');
        return;
      }

      console.log('[UnifiedCallService] Accepting call:', targetCall.callId);

      // Stop vibration
      Vibration.cancel();

      // Hide incoming call notification
      await this.hideIncomingCallNotification();

      // Update call status
      targetCall.status = 'connecting';
      this.updateCallState({
        activeCall: targetCall,
        callStatus: 'connecting'
      });

      // Send acceptance notification to caller
      await this.sendCallStatusUpdate(targetCall, 'accepted');

      // Initialize media
      this.initializeMediaForCall(targetCall.callId, targetCall.callType === 'video');

      // Navigate to meeting screen
      this.requestNavigationToMeetingScreen(targetCall);

      // Show ongoing call notification if app goes to background
      if (this.appState === 'background') {
        await this.showOngoingCallNotification();
      }

      console.log('[UnifiedCallService] Call accepted:', targetCall.callId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to accept call:', error);
    }
  }

  /**
   * Decline incoming call
   */
  public async declineCall(callId?: string): Promise<void> {
    try {
      const targetCall = callId ? 
        (this.callState.activeCall?.callId === callId ? this.callState.activeCall : null) : 
        this.callState.activeCall;

      if (!targetCall) {
        console.warn('[UnifiedCallService] No call to decline');
        return;
      }

      console.log('[UnifiedCallService] Declining call:', targetCall.callId);

      // Stop vibration
      Vibration.cancel();

      // Hide incoming call notification
      await this.hideIncomingCallNotification();

      // Update call status
      targetCall.status = 'ended';
      targetCall.endTime = Date.now();
      if (targetCall.startTime) {
        targetCall.duration = targetCall.endTime - targetCall.startTime;
      }

      // Send decline notification to caller
      await this.sendCallStatusUpdate(targetCall, 'ended');

      // Clear call state
      this.updateCallState({
        isInCall: false,
        activeCall: null,
        callStatus: 'ended',
        lastCallEndReason: 'declined'
      });

      // Clean up media
      this.cleanupMedia();

      console.log('[UnifiedCallService] Call declined:', targetCall.callId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to decline call:', error);
    }
  }

  /**
   * End ongoing call
   */
  public async endCall(callId?: string): Promise<void> {
    let targetCall: CallData | null = null;
    
    try {
      targetCall = callId ? 
        (this.callState.activeCall?.callId === callId ? this.callState.activeCall : null) : 
        this.callState.activeCall;

      if (!targetCall) {
        // If no active call, check if we are in the process of starting one and clean up.
        if (this.callState.callStatus === 'dialing' || this.callState.callStatus === 'connecting') {
            console.warn('[UnifiedCallService] Ending call during dialing/connecting phase.');
            this.updateCallState({
                isInCall: false,
                activeCall: null,
                callStatus: 'ended',
                lastCallEndReason: 'cancelled'
            });
            this.cleanupMedia();
            await this.hideOngoingCallNotification();
            await this.hideIncomingCallNotification();
            
            // Emit events to ensure all components are notified
            appEventEmitter.emit('callStateChanged', this.callState);
        } else {
            console.warn('[UnifiedCallService] No call to end');
        }
        return;
      }

      console.log('[UnifiedCallService] Ending call:', targetCall.callId);

      // CRITICAL FIX: First, update call state to 'ended' to prevent other systems from navigating back
      console.log('[UnifiedCallService] Setting call state to ended to prevent navigation conflicts');
      targetCall.status = 'ended';
      targetCall.endTime = Date.now();
      if (targetCall.startTime) {
        targetCall.duration = targetCall.endTime - targetCall.startTime;
      }

      // Stop vibration
      Vibration.cancel();

      // Hide notifications
      await this.hideIncomingCallNotification();
      await this.hideOngoingCallNotification();

      // Send end notification to other participant
      await this.sendCallStatusUpdate(targetCall, 'ended');

      // Show call ended notification
      await this.showCallEndedNotification(targetCall);

      // Clean up media
      this.cleanupMedia();

      // CRITICAL FIX: Update call state once with all necessary changes and proper event emission
      this.updateCallState({
        isInCall: false,
        activeCall: null,
        callStatus: 'ended',
        lastCallEndReason: 'ended'
      });

      console.log('[UnifiedCallService] Call ended successfully:', targetCall.callId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to end call:', error);
      
      // BULLETPROOF: Even if there's an error, ensure call state is cleared
      try {
        this.updateCallState({
          isInCall: false,
          activeCall: null,
          callStatus: 'ended',
          lastCallEndReason: 'error'
        });
        appEventEmitter.emit('callStateChanged', this.callState);
      } catch (fallbackError) {
        console.error('[UnifiedCallService] Failed to clear call state after error:', fallbackError);
      }
    }
  }

  // ===== MEDIA MANAGEMENT =====

  /**
   * Initialize media for call
   */
  private initializeMediaForCall(callId: string, isVideoCall: boolean): void {
    try {
      console.log('[UnifiedCallService] Initializing media for call:', callId, 'isVideoCall:', isVideoCall);

      // Initialize media manager
      this.mediaManager.initialize(callId, isVideoCall);

      // Set initial media state
      this.mediaState = {
        micEnabled: true,
        cameraEnabled: isVideoCall,
        speakerEnabled: true,
        isVideoCall
      };

      // For video calls, ensure camera is enabled
      if (isVideoCall) {
        this.mediaManager.setCameraEnabled(true);
        this.mediaManager.setSpeakerEnabled(true);
      }

      // Always ensure microphone is enabled
      this.mediaManager.setMicEnabled(true);

      // Force state update
      this.mediaManager.forceUpdateMediaState(this.mediaState);

      // Emit media state change
      appEventEmitter.emit('mediaStateChanged', this.mediaState);

      console.log('[UnifiedCallService] Media initialized for call:', callId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to initialize media:', error);
    }
  }

  /**
   * Set VideoSDK meeting reference
   */
  public setVideoSDKMeeting(meeting: any): void {
    try {
      this.mediaManager.setMeeting(meeting);
      console.log('[UnifiedCallService] VideoSDK meeting set for media control');
    } catch (error) {
      console.error('[UnifiedCallService] Failed to set VideoSDK meeting:', error);
    }
  }

  /**
   * Toggle microphone
   */
  public async toggleMic(): Promise<boolean> {
    try {
      const newState = await this.mediaManager.toggleMic();
      this.mediaState.micEnabled = newState;
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
      return newState;
    } catch (error) {
      console.error('[UnifiedCallService] Failed to toggle mic:', error);
      return this.mediaState.micEnabled;
    }
  }

  /**
   * Toggle camera
   */
  public async toggleCamera(): Promise<boolean> {
    try {
      const newState = await this.mediaManager.toggleCamera();
      this.mediaState.cameraEnabled = newState;
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
      return newState;
    } catch (error) {
      console.error('[UnifiedCallService] Failed to toggle camera:', error);
      return this.mediaState.cameraEnabled;
    }
  }

  /**
   * Toggle speaker
   */
  public async toggleSpeaker(): Promise<boolean> {
    try {
      const newState = await this.mediaManager.toggleSpeaker();
      this.mediaState.speakerEnabled = newState;
      appEventEmitter.emit('mediaStateChanged', this.mediaState);
      return newState;
    } catch (error) {
      console.error('[UnifiedCallService] Failed to toggle speaker:', error);
      return this.mediaState.speakerEnabled;
    }
  }

  /**
   * Get current media state
   */
  public getMediaState(): MediaState {
    return { ...this.mediaState };
  }

  /**
   * Get current call data
   */
  public getCurrentCall(): CallData | null {
    return this.callState.activeCall;
  }

  /**
   * Get current call state
   */
  public getCallState(): CallState {
    return { ...this.callState };
  }

  /**
   * Update call status (for compatibility with existing code)
   */
  public updateCallStatus(status: CallStatus): void {
    if (this.callState.activeCall) {
      this.callState.activeCall.status = status;
      this.updateCallState({
        activeCall: this.callState.activeCall,
        callStatus: status === 'ended' ? 'ended' : status
      });
    }
  }

  /**
   * Get media manager instance
   */
  public getMediaManager(): CallMediaManager {
    return this.mediaManager;
  }

  /**
   * Clean up media resources
   */
  private cleanupMedia(): void {
    if (this.isCleaningUp) {
      console.log('[UnifiedCallService] Cleanup already in progress, skipping.');
      return;
    }
    if (this.callState.callStatus !== 'ending' && this.callState.callStatus !== 'ended') {
      console.log('[UnifiedCallService] Cleanup only allowed after call is ending or ended.');
      return;
    }
    this.isCleaningUp = true;
    try {
      console.log('[UnifiedCallService] Cleaning up media resources');
      
      // Reset media state
      this.mediaState = {
        micEnabled: true,
        cameraEnabled: false,
        speakerEnabled: true,
        isVideoCall: false
      };

      // Clean up media manager
      this.mediaManager.cleanup();

      // Emit media state change
      appEventEmitter.emit('mediaStateChanged', this.mediaState);

      console.log('[UnifiedCallService] Media cleanup completed');

    } catch (error) {
      console.error('[UnifiedCallService] Failed to cleanup media:', error);
    }
    this.isCleaningUp = false;
  }

  // ===== STATE MANAGEMENT =====

  /**
   * Update call state
   */
  private updateCallState(newState: Partial<CallState>): void {
    const previousState = { ...this.callState };
    const nextCallStatus = newState.callStatus ?? previousState.callStatus;
    if (
      previousState.callStatus &&
      nextCallStatus &&
      previousState.callStatus !== nextCallStatus &&
      !this.isValidTransition(previousState.callStatus, nextCallStatus)
    ) {
      console.warn('[UnifiedCallService] Invalid call state transition:', previousState.callStatus, '->', nextCallStatus);
      return;
    }
    this.callState = { ...this.callState, ...newState };
    console.log('[UnifiedCallService] Call state updated:', previousState, '->', this.callState);
    this.saveCallState();
    appEventEmitter.emit('callStateChanged', this.callState);
  }

  /**
   * Save call state to persistent storage
   */
  private async saveCallState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CALL_STATE, JSON.stringify(this.callState));
    } catch (error) {
      console.error('[UnifiedCallService] Failed to save call state:', error);
    }
  }

  /**
   * Restore call state from persistent storage
   */
  private async restoreCallState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEYS.CALL_STATE);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.callState = parsedState;
        console.log('[UnifiedCallService] Call state restored:', this.callState);
      }
    } catch (error) {
      console.error('[UnifiedCallService] Failed to restore call state:', error);
    }
  }

  // ===== BACKGROUND SYNC =====

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, 2000); // Sync every 2 seconds

    console.log('[UnifiedCallService] Background sync started');
  }

  /**
   * Stop background sync
   */
  private stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('[UnifiedCallService] Background sync stopped');
  }

  /**
   * Perform background sync
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      if (this.isSyncing || !this.callState.isInCall) {
        return;
      }

      this.isSyncing = true;

      // Sync call state with server if needed
      // This is where you would sync with your backend
      
      // Update ongoing call notification if in background
      if (this.appState === 'background' && this.callState.activeCall) {
        await this.showOngoingCallNotification();
      }

    } catch (error) {
      console.error('[UnifiedCallService] Background sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Trigger sync
   */
  private triggerSync(): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.performBackgroundSync();
    }, 200);
  }

  // ===== HELPER METHODS =====

  /**
   * Request navigation to meeting screen (event-based)
   */
  private requestNavigationToMeetingScreen(callData: CallData): void {
    try {
      console.log('[UnifiedCallService] Requesting navigation to meeting screen:', callData.callId);

      // CRITICAL FIX: Use event-based navigation instead of direct navigation
      // This prevents race conditions with MeetingScreen's own navigation logic
      appEventEmitter.emit('forceNavigateToMeeting', {
        activeCall: callData,
        meetingId: callData.meetingId,
        token: callData.token,
        callType: callData.callType,
        displayName: callData.isInitiator ? callData.callerName : callData.recipientName,
        isInitiator: callData.isInitiator,
        callData: callData
      });

      console.log('[UnifiedCallService] Navigation request emitted successfully');

    } catch (error) {
      console.error('[UnifiedCallService] Failed to request navigation to meeting screen:', error);
    }
  }

  /**
   * Send call notification to recipient
   */
  private async sendCallNotificationToRecipient(callData: CallData): Promise<void> {
    try {
      console.log('[UnifiedCallService] Sending call notification to recipient:', callData.recipientId);

      // Get FCM tokens for both users in a single, efficient call
      const { callerToken, recipientToken, callerPlatform, recipientPlatform } = 
        await ApiService.getBothUsersFCMTokens(callData.callerId, callData.recipientId);

      if (!recipientToken) {
        console.warn('[UnifiedCallService] No FCM token found for recipient. Aborting call.');
        Alert.alert('Could Not Reach User', 'The user you are trying to call is currently unavailable.');
        await this.endCall(callData.callId);
        return;
      }

      if (!callerToken) {
        console.warn('[UnifiedCallService] No FCM token for caller. Aborting call.');
        Alert.alert('Error', 'Your session seems to be invalid. Please log out and log back in.');
        await this.endCall(callData.callId);
        return;
      }

      // Use the initiate-call API
      await ApiService.initiateCall({
        calleeInfo: {
          platform: recipientPlatform,
          token: recipientToken,
        },
        callerInfo: {
          name: callData.callerName,
          token: callerToken,
        },
        videoSDKInfo: {
          meetingId: callData.meetingId,
          token: callData.token, // This is the VideoSDK participant token
        },
      });

      console.log('[UnifiedCallService] "initiate-call" notification sent successfully to recipient:', callData.recipientId);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to send "initiate-call" notification:', error);
      Alert.alert('Call Failed', 'Could not initiate the call. Please try again later.');
    }
  }

  /**
   * Send call status update
   */
  private async sendCallStatusUpdate(callData: CallData, status: 'accepted' | 'ended'): Promise<void> {
    try {
      console.log('[UnifiedCallService] Sending call status update:', status);

      // This would typically send an FCM message to the other participant
      // Implementation depends on your backend API
      
      // For now, we'll just log it
      console.log('[UnifiedCallService] Call status update sent:', status);

    } catch (error) {
      console.error('[UnifiedCallService] Failed to send call status update:', error);
    }
  }

  /**
   * Parse FCM call data
   */
  private parseFCMCallData(data: any): CallNotificationData | null {
    try {
      // Handle nested JSON structures
      let callData = data;
      
      if (typeof data.info === 'string') {
        try {
          callData = JSON.parse(data.info);
        } catch (error) {
          console.warn('[UnifiedCallService] Failed to parse FCM info field:', error);
        }
      }

      const callerInfo = (typeof callData.callerInfo === 'object' && callData.callerInfo !== null) 
        ? callData.callerInfo as any 
        : {};
      const videoSDKInfo = (typeof callData.videoSDKInfo === 'object' && callData.videoSDKInfo !== null) 
        ? callData.videoSDKInfo as any 
        : {};

      const parsedData: CallNotificationData = {
        callId: String(callData.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
        callerName: String(callerInfo.name || callData.callerName || 'Unknown Caller'),
        callType: (String(callData.callType || 'voice') === 'video' ? 'video' : 'voice') as 'voice' | 'video',
        callerId: String(callerInfo.userId || callData.callerId || 'unknown'),
        meetingId: String(videoSDKInfo.meetingId || callData.meetingId || ''),
        token: String(videoSDKInfo.token || callData.rtcToken || callData.token || ''),
        callerAvatar: (callerInfo.avatarUrl || callData.callerAvatar) ? String(callerInfo.avatarUrl || callData.callerAvatar) : undefined,
        callerFcmToken: String(callerInfo.token || ''),
      };

      // Validate required fields
      if (!parsedData.callId || !parsedData.callerName || !parsedData.meetingId || !parsedData.token) {
        console.error('[UnifiedCallService] Invalid call data - missing required fields:', parsedData);
        return null;
      }

      return parsedData;

    } catch (error) {
      console.error('[UnifiedCallService] Failed to parse FCM call data:', error);
      return null;
    }
  }

  /**
   * Handle call accepted FCM
   */
  private async handleCallAcceptedFCM(data: any): Promise<void> {
    try {
      console.log('[UnifiedCallService] Call accepted by recipient');
      
      if (this.callState.activeCall) {
        this.callState.activeCall.status = 'connecting';
        this.updateCallState({
          callStatus: 'connecting'
        });
      }

    } catch (error) {
      console.error('[UnifiedCallService] Error handling call accepted FCM:', error);
    }
  }

  /**
   * Handle call ended FCM
   */
  private async handleCallEndedFCM(data: any): Promise<void> {
    try {
      console.log('[UnifiedCallService] Call ended by other participant');
      
      if (this.callState.activeCall) {
        await this.endCall();
      }

    } catch (error) {
      console.error('[UnifiedCallService] Error handling call ended FCM:', error);
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      // This should get the current user's ID from your auth system
      // For now, we'll use a placeholder
      return 'current_user_id'; // Replace with actual implementation
    } catch (error) {
      console.error('[UnifiedCallService] Failed to get current user ID:', error);
      return 'unknown_user';
    }
  }

  /**
   * Format duration for display
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // ===== CLEANUP =====

  /**
   * Cleanup and destroy the service
   */
  public async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      console.log('[UnifiedCallService] Cleanup already in progress, skipping.');
      return;
    }
    if (this.callState.callStatus !== 'ending' && this.callState.callStatus !== 'ended') {
      console.log('[UnifiedCallService] Cleanup only allowed after call is ending or ended.');
      return;
    }
    this.isCleaningUp = true;
    try {
      console.log('[UnifiedCallService] Cleaning up service');

      // Stop background sync
      this.stopBackgroundSync();

      // Clear timers
      if (this.syncDebounceTimer) {
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = null;
      }

      // Clean up media
      this.cleanupMedia();

      // Clear notifications
      await this.hideIncomingCallNotification();
      await this.hideOngoingCallNotification();

      // Clear state
      this.updateCallState({
        isInCall: false,
        activeCall: null,
        callStatus: 'ended'
      });

      console.log('[UnifiedCallService] Service cleanup completed');
    } catch (error) {
      console.error('[UnifiedCallService] Failed to cleanup service:', error);
    }
    this.isCleaningUp = false;
  }

  private isValidTransition(from: CallStatus, to: CallStatus): boolean {
    const VALID_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
      idle: ['dialing', 'ringing'],
      dialing: ['connecting', 'ending', 'ended'],
      ringing: ['connecting', 'ending', 'ended'],
      connecting: ['connected', 'ending', 'ended'],
      connected: ['ending', 'ended'],
      ending: ['ended', 'cleanup_pending'],
      ended: ['idle', 'cleanup_pending'],
      cleanup_pending: ['idle'],
    };
    return VALID_TRANSITIONS[from].includes(to);
  }
}

export default UnifiedCallService;
