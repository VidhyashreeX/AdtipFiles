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
import { navigate } from '../../navigation/NavigationService';

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
  
  // Vibration patterns
  private readonly INCOMING_CALL_VIBRATION = [2,1000,1000, 2000];
  private readonly CALL_END_VIBRATION = [2,200];
  
  private constructor() {
    this.setupAppStateListener();
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

      // Request permissions
      await this.requestPermissions();

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
   * Request necessary permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      // Request notification permissions
      const notificationSettings = await notifee.requestPermission();
      console.log('[WhatsAppCallManager] Notification permission:', notificationSettings.authorizationStatus);

      // Request audio/video permissions for Android
      if (Platform.OS === 'android') {
        const audioPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to make voice calls.',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to make video calls.',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        this.audioPermissionGranted = audioPermission === PermissionsAndroid.RESULTS.GRANTED;
        this.videoPermissionGranted = cameraPermission === PermissionsAndroid.RESULTS.GRANTED;

        console.log('[WhatsAppCallManager] Audio permission:', this.audioPermissionGranted);
        console.log('[WhatsAppCallManager] Video permission:', this.videoPermissionGranted);
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Permission request failed:', error);
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
    AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;
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

      if (type === EventType.ACTION_PRESS && pressAction) {
        const callId = notification?.data?.callId;
        
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
            await this.openCallScreen(callId);
            break;
          case 'mute_toggle':
            await this.toggleMute();
            break;
          case 'speaker_toggle':
            await this.toggleSpeaker();
            break;
        }
      }

      if (type === EventType.PRESS) {
        // Handle notification tap
        const callId = notification?.data?.callId;
        if (callId && this.currentCall) {
          await this.openCallScreen(callId);
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

      // Check permissions
      if (callType === 'video' && !this.videoPermissionGranted) {
        Alert.alert('Permission Required', 'Camera permission is required for video calls');
        return null;
      }

      if (!this.audioPermissionGranted) {
        Alert.alert('Permission Required', 'Microphone permission is required for calls');
        return null;
      }      // Generate VideoSDK meeting
      const videoSDKService = VideoSDKService.getInstance();
      const token = await videoSDKService.generateParticipantToken();
      
      if (!token) {
        throw new Error('Failed to generate VideoSDK token');
      }
      
      const meetingId = await videoSDKService.createMeeting(token);

      if (!token || !meetingId) {
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
        status: 'calling',
        startTime: Date.now()
      };

      this.currentCall = callData;
      await this.saveCallState();

      // Send call notification to recipient
      await this.sendCallNotification(callData);

      // Show outgoing call UI
      await this.showOutgoingCallNotification(callData);

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
      };

      this.currentCall = callData;
      await this.saveCallState();

      // Show incoming call notification
      await this.showIncomingCallNotification(callData);

      // Start vibration
      Vibration.vibrate(this.INCOMING_CALL_VIBRATION, true);

      // Emit call state change
      appEventEmitter.emit('callStateChanged', callData);

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

      // Send decline notification to caller
      await this.sendCallStatusUpdate(targetCall, 'declined');

      // Clear call state
      await this.clearCallState();

      // Emit call state change
      appEventEmitter.emit('callStateChanged', targetCall);
      appEventEmitter.emit('callEnded', targetCall);

      console.log('[WhatsAppCallManager] Call declined:', targetCall.callId);

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

      // Update call status
      targetCall.status = 'ended';
      targetCall.endTime = Date.now();
      targetCall.duration = targetCall.endTime - (targetCall.startTime || 0);

      // Hide all call notifications
      await this.hideIncomingCallNotification();
      await this.hideOngoingCallNotification();

      // Show call ended notification
      await this.showCallEndedNotification(targetCall);

      // Send end call notification to other participant
      await this.sendCallStatusUpdate(targetCall, 'ended');

      // Clear call state
      await this.clearCallState();

      // Vibrate briefly to indicate call end
      Vibration.vibrate(this.CALL_END_VIBRATION);

      // Emit call state change
      appEventEmitter.emit('callStateChanged', targetCall);
      appEventEmitter.emit('callEnded', targetCall);

      console.log('[WhatsAppCallManager] Call ended:', targetCall.callId);

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
      ];

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
        android: {
          channelId: CHANNEL_IDS.INCOMING_CALLS,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,
          pressAction: { id: 'accept_call' },
          fullScreenAction: { id: 'accept_call' },
          actions,
          ongoing: false,          autoCancel: false,
          color: callData.callType === 'video' ? '#007AFF' : '#34C759',
          largeIcon: callData.callerAvatar || undefined,          style: {
            type: AndroidStyle.BIGTEXT,
            text: `${callData.callerName} is calling you. Tap to answer or use the action buttons.`,
          },
        },
      });

      console.log('[WhatsAppCallManager] Incoming call notification shown:', notificationId);

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to show incoming call notification:', error);
    }
  }

  /**
   * Show outgoing call notification
   */
  private async showOutgoingCallNotification(callData: CallData): Promise<void> {
    try {
      const notificationId = `outgoing_call_${callData.callId}`;

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
          category: AndroidCategory.CALL,          ongoing: true,
          autoCancel: false,          color: callData.callType === 'video' ? '#007AFF' : '#34C759',actions: [
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
   * Show ongoing call notification (when app is in background)
   */
  private async showOngoingCallNotification(): Promise<void> {
    try {
      if (!this.currentCall || this.currentCall.status !== 'connected') {
        return;
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
        },
        android: {
          channelId: CHANNEL_IDS.ONGOING_CALLS,
          importance: AndroidImportance.LOW,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.CALL,          ongoing: true,          autoCancel: false,
          color: this.currentCall.callType === 'video' ? '#007AFF' : '#34C759',actions: [
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
        },
        android: {
          channelId: CHANNEL_IDS.CALL_ENDED,
          importance: AndroidImportance.LOW,          visibility: AndroidVisibility.PUBLIC,          autoCancel: true,
          color: '#8E8E93',
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
   * Hide incoming call notification
   */
  private async hideIncomingCallNotification(): Promise<void> {
    try {
      if (this.incomingCallNotificationId) {
        await notifee.cancelNotification(this.incomingCallNotificationId);
        this.incomingCallNotificationId = null;
        console.log('[WhatsAppCallManager] Incoming call notification hidden');
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to hide incoming call notification:', error);
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
        console.log('[WhatsAppCallManager] Ongoing call notification hidden');
      }
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to hide ongoing call notification:', error);
    }
  }

  /**
   * Navigate to meeting screen
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
      
      navigate('Main', {
        screen: 'Meeting',
        params
      });

    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to navigate to meeting screen:', error);
    }
  }

  /**
   * Open call screen from notification
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
   * Send call status update
   */
  private async sendCallStatusUpdate(callData: CallData, status: 'accepted' | 'declined' | 'ended'): Promise<void> {
    try {
      await ApiService.handleCall({
        callerId: callData.callerId,
        receiverId: callData.recipientId,
        action: status,
        callType: callData.callType === 'video' ? 'video-call' : 'audio-call',
        duration: callData.duration ? Math.floor(callData.duration / 1000) : undefined,
        meetingId: callData.meetingId,
      });

      console.log('[WhatsAppCallManager] Call status update sent:', status);
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to send call status update:', error);
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
   * Toggle speaker
   */
  private async toggleSpeaker(): Promise<void> {
    try {
      appEventEmitter.emit('toggleSpeaker');
      console.log('[WhatsAppCallManager] Speaker toggled');
    } catch (error) {
      console.error('[WhatsAppCallManager] Failed to toggle speaker:', error);
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
   * Clear call state
   */
  private async clearCallState(): Promise<void> {
    try {
      this.currentCall = null;
      await AsyncStorage.removeItem(this.callStateKey);
      console.log('[WhatsAppCallManager] Call state cleared');
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
      console.log('[WhatsAppCallManager] Cleanup completed');
    } catch (error) {
      console.error('[WhatsAppCallManager] Cleanup failed:', error);
    }
  }
}

export default WhatsAppCallManager;
