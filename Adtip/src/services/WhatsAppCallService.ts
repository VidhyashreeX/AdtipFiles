// src/services/WhatsAppCallService.ts
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import notifee, { AndroidImportance, AndroidVisibility, EventType, AndroidCategory, AndroidLaunchActivityFlag } from '@notifee/react-native';
import { appEventEmitter } from '../events/AppEventEmitter';

const { WhatsAppCallModule } = NativeModules;

export interface WhatsAppCallConfig {
  // No complex configuration needed like CallKeep
  channelId: string;
  channelName: string;
  enableVibration: boolean;
  enableSound: boolean;
}

export interface CallData {
  callId: string;
  callerName: string;
  callType: 'voice' | 'video';
  meetingId?: string;
  token?: string;
  callerId?: string;
  recipientId?: string;
}

/**
 * WhatsApp-like calling service
 * Uses Notifee for notifications + VideoSDK for media
 * No Android Telecom integration
 */
class WhatsAppCallService {
  private static instance: WhatsAppCallService;
  private isInitialized = false;
  private currentCallId: string | null = null;
  private config: WhatsAppCallConfig | null = null;

  private constructor() {}

  public static getInstance(): WhatsAppCallService {
    if (!WhatsAppCallService.instance) {
      WhatsAppCallService.instance = new WhatsAppCallService();
    }
    return WhatsAppCallService.instance;
  }

  /**
   * Initialize WhatsApp-like calling (much simpler than CallKeep)
   */
  public async initialize(config: WhatsAppCallConfig): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[WhatsAppCallService] Already initialized');
        return true;
      }

      this.config = config;

      // Create notification channel with Notifee
      await this.createNotificationChannel();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[WhatsAppCallService] ✅ Initialized successfully');
      return true;

    } catch (error) {
      console.error('[WhatsAppCallService] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create notification channel for calls
   */
  private async createNotificationChannel(): Promise<void> {
    if (!this.config) return;

    try {
      await notifee.createChannel({
        id: this.config.channelId,
        name: this.config.channelName,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: this.config.enableVibration,
        sound: this.config.enableSound ? 'default' : undefined,
      });

      console.log('[WhatsAppCallService] Notification channel created');
    } catch (error) {
      console.error('[WhatsAppCallService] Failed to create notification channel:', error);
    }
  }

  /**
   * Setup event listeners for call events
   */
  private setupEventListeners(): void {
    // Listen to native call events
    DeviceEventEmitter.addListener('onCallStateChanged', this.handleCallStateChanged);
    DeviceEventEmitter.addListener('onCallAnswered', this.handleCallAnswered);
    DeviceEventEmitter.addListener('onCallDeclined', this.handleCallDeclined);
    DeviceEventEmitter.addListener('onCallEnded', this.handleCallEnded);
    DeviceEventEmitter.addListener('onMuteToggled', this.handleMuteToggled);
    DeviceEventEmitter.addListener('onSpeakerToggled', this.handleSpeakerToggled);    // Listen to Notifee events
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        this.handleNotificationAction(detail.pressAction?.id || '', detail.notification?.data);
      }
    });

    console.log('[WhatsAppCallService] Event listeners setup complete');
  }

  /**
   * Show incoming call notification + UI
   */
  public async showIncomingCall(callData: CallData): Promise<string> {
    try {
      const callId = callData.callId || uuidv4();
      this.currentCallId = callId;

      console.log('[WhatsAppCallService] Showing incoming call:', callId);

      // Show native incoming call UI (full screen)
      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.showIncomingCall({
          callId,
          callerName: callData.callerName,
          callType: callData.callType,
        });
      }

      // Also show notification for when screen is off
      await this.showIncomingCallNotification(callData);

      return callId;
    } catch (error) {
      console.error('[WhatsAppCallService] Error showing incoming call:', error);
      throw error;
    }
  }

  /**
   * Start outgoing call
   */
  public async startOutgoingCall(callData: CallData): Promise<string> {
    try {
      const callId = callData.callId || uuidv4();
      this.currentCallId = callId;

      console.log('[WhatsAppCallService] Starting outgoing call:', callId);

      // Start native outgoing call service
      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.startOutgoingCall({
          callId,
          callerName: callData.callerName,
          callType: callData.callType,
        });
      }

      // Show outgoing call notification
      await this.showOutgoingCallNotification(callData);

      return callId;
    } catch (error) {
      console.error('[WhatsAppCallService] Error starting outgoing call:', error);
      throw error;
    }
  }

  /**
   * Answer call
   */
  public async answerCall(callId?: string): Promise<void> {
    const targetCallId = callId || this.currentCallId;
    if (!targetCallId) return;

    try {
      console.log('[WhatsAppCallService] Answering call:', targetCallId);

      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.answerCall(targetCallId);
      }

      // Emit event to app
      appEventEmitter.emit('callAnswered', { callId: targetCallId });
    } catch (error) {
      console.error('[WhatsAppCallService] Error answering call:', error);
      throw error;
    }
  }

  /**
   * Decline call
   */
  public async declineCall(callId?: string): Promise<void> {
    const targetCallId = callId || this.currentCallId;
    if (!targetCallId) return;

    try {
      console.log('[WhatsAppCallService] Declining call:', targetCallId);

      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.declineCall(targetCallId);
      }

      // Clear current call
      this.currentCallId = null;

      // Emit event to app
      appEventEmitter.emit('callDeclined', { callId: targetCallId });
    } catch (error) {
      console.error('[WhatsAppCallService] Error declining call:', error);
      throw error;
    }
  }

  /**
   * End call
   */
  public async endCall(callId?: string): Promise<void> {
    const targetCallId = callId || this.currentCallId;
    if (!targetCallId) return;

    try {
      console.log('[WhatsAppCallService] Ending call:', targetCallId);

      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.endCall(targetCallId);
      }

      // Clear current call
      this.currentCallId = null;

      // Clear notifications
      await notifee.cancelAllNotifications();

      // Emit event to app
      appEventEmitter.emit('callEnded', { callId: targetCallId });
    } catch (error) {
      console.error('[WhatsAppCallService] Error ending call:', error);
      throw error;
    }
  }

  /**
   * Set call muted
   */
  public async setMuted(muted: boolean, callId?: string): Promise<void> {
    const targetCallId = callId || this.currentCallId;
    if (!targetCallId) return;

    try {
      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.setMuted(targetCallId, muted);
      }

      // Emit event to app
      appEventEmitter.emit('callMuteChanged', { callId: targetCallId, muted });
    } catch (error) {
      console.error('[WhatsAppCallService] Error setting mute:', error);
      throw error;
    }
  }

  /**
   * Set speaker mode
   */
  public async setSpeaker(speaker: boolean, callId?: string): Promise<void> {
    const targetCallId = callId || this.currentCallId;
    if (!targetCallId) return;

    try {
      if (Platform.OS === 'android' && WhatsAppCallModule) {
        await WhatsAppCallModule.setSpeaker(targetCallId, speaker);
      }

      // Emit event to app
      appEventEmitter.emit('callSpeakerChanged', { callId: targetCallId, speaker });
    } catch (error) {
      console.error('[WhatsAppCallService] Error setting speaker:', error);
      throw error;
    }
  }

  /**
   * Show incoming call notification (Notifee)
   */
  private async showIncomingCallNotification(callData: CallData): Promise<void> {
    if (!this.config) return;

    try {
      await notifee.displayNotification({
        id: `call_${callData.callId}`,
        title: `Incoming ${callData.callType} call`,
        body: `${callData.callerName} is calling you`,
        data: {
          callId: callData.callId,
          type: 'incoming_call',
        },        android: {
          channelId: this.config.channelId,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.CALL,
          visibility: AndroidVisibility.PUBLIC,
          ongoing: true,
          autoCancel: false,
          fullScreenAction: {
            id: 'open_call',
            launchActivity: 'com.adtip.app.adtip_app.IncomingCallActivity',
            launchActivityFlags: [AndroidLaunchActivityFlag.NEW_TASK, AndroidLaunchActivityFlag.CLEAR_TOP],
          },
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: 'answer_call',
                launchActivity: 'default',
              },
            },
            {
              title: 'Decline',
              pressAction: {
                id: 'decline_call',
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('[WhatsAppCallService] Error showing incoming call notification:', error);
    }
  }

  /**
   * Show outgoing call notification (Notifee)
   */
  private async showOutgoingCallNotification(callData: CallData): Promise<void> {
    if (!this.config) return;

    try {
      await notifee.displayNotification({
        id: `call_${callData.callId}`,
        title: `Outgoing ${callData.callType} call`,
        body: `Calling ${callData.callerName}...`,
        data: {
          callId: callData.callId,
          type: 'outgoing_call',
        },        android: {
          channelId: this.config.channelId,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          actions: [
            {
              title: 'End Call',
              pressAction: {
                id: 'end_call',
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('[WhatsAppCallService] Error showing outgoing call notification:', error);
    }
  }

  /**
   * Handle notification actions
   */
  private async handleNotificationAction(actionId: string, data: any): Promise<void> {
    const callId = data?.callId;
    
    console.log('[WhatsAppCallService] Notification action:', actionId, 'for call:', callId);

    switch (actionId) {
      case 'answer_call':
        await this.answerCall(callId);
        break;
      case 'decline_call':
        await this.declineCall(callId);
        break;
      case 'end_call':
        await this.endCall(callId);
        break;
    }
  }

  // Event handlers for native events
  private handleCallStateChanged = (data: any) => {
    console.log('[WhatsAppCallService] Call state changed:', data);
    appEventEmitter.emit('callStateChanged', data);
  };

  private handleCallAnswered = (data: any) => {
    console.log('[WhatsAppCallService] Call answered:', data);
    appEventEmitter.emit('callAnswered', data);
  };

  private handleCallDeclined = (data: any) => {
    console.log('[WhatsAppCallService] Call declined:', data);
    this.currentCallId = null;
    appEventEmitter.emit('callDeclined', data);
  };

  private handleCallEnded = (data: any) => {
    console.log('[WhatsAppCallService] Call ended:', data);
    this.currentCallId = null;
    appEventEmitter.emit('callEnded', data);
  };

  private handleMuteToggled = (data: any) => {
    console.log('[WhatsAppCallService] Mute toggled:', data);
    appEventEmitter.emit('callMuteChanged', data);
  };

  private handleSpeakerToggled = (data: any) => {
    console.log('[WhatsAppCallService] Speaker toggled:', data);
    appEventEmitter.emit('callSpeakerChanged', data);
  };

  /**
   * Get current call ID
   */
  public getCurrentCallId(): string | null {
    return this.currentCallId;
  }

  /**
   * Check if service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    console.log('[WhatsAppCallService] Cleaning up...');
    
    // Remove event listeners
    DeviceEventEmitter.removeAllListeners('onCallStateChanged');
    DeviceEventEmitter.removeAllListeners('onCallAnswered');
    DeviceEventEmitter.removeAllListeners('onCallDeclined');
    DeviceEventEmitter.removeAllListeners('onCallEnded');
    DeviceEventEmitter.removeAllListeners('onMuteToggled');
    DeviceEventEmitter.removeAllListeners('onSpeakerToggled');

    this.currentCallId = null;
    this.isInitialized = false;
    
    console.log('[WhatsAppCallService] ✅ Cleanup completed');
  }
}

export default WhatsAppCallService;
