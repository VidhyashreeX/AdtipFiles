// src/services/InAppCallService.ts
import { NativeModules, DeviceEventEmitter, Platform, Alert } from 'react-native';
import notifee, { AndroidImportance, AndroidCategory, AndroidColor } from '@notifee/react-native';
// import VideoSDKService from './VideoSDKService';
// import FirebaseService from './FirebaseService';

const { IncomingCallModule, OngoingCall } = NativeModules;

export interface InAppCallConfig {
  appName: string;
  enableVideo: boolean;
  enableAudio: boolean;
  notificationChannelId?: string;
  notificationChannelName?: string;
}

export interface CallSession {
  sessionId: string;
  callType: 'voice' | 'video';
  callerName: string;
  callerId?: string;
  meetingId?: string;
  token?: string;
  isIncoming: boolean;
  status: 'ringing' | 'connected' | 'ended';
  startTime?: number;
}

class InAppCallService {
  private static instance: InAppCallService;  private isInitialized = false;
  private currentCall: CallSession | null = null;
  // private videoSDKService: VideoSDKService;
  // private firebaseService: FirebaseService;
  private eventListeners: any[] = [];

  private constructor() {
    // this.videoSDKService = VideoSDKService.getInstance();
    // this.firebaseService = FirebaseService.getInstance();
  }

  public static getInstance(): InAppCallService {
    if (!InAppCallService.instance) {
      InAppCallService.instance = new InAppCallService();
    }
    return InAppCallService.instance;
  }

  /**
   * Initialize WhatsApp-like calling system
   */
  public async initialize(config: InAppCallConfig): Promise<boolean> {
    if (this.isInitialized) {
      console.log('[InAppCallService] Already initialized');
      return true;
    }

    try {
      console.log('[InAppCallService] 🚀 Initializing WhatsApp-like calling system...');

      // Initialize notification channels
      await this.createNotificationChannels(config);

      // Setup event listeners for incoming calls
      this.setupEventListeners();      // Initialize VideoSDK
      // await this.videoSDKService.initialize();

      this.isInitialized = true;
      console.log('[InAppCallService] ✅ WhatsApp-like calling system initialized successfully');
      return true;

    } catch (error) {
      console.error('[InAppCallService] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create notification channels for WhatsApp-like notifications
   */
  private async createNotificationChannels(config: InAppCallConfig): Promise<void> {
    try {      // Incoming calls channel
      const incomingCallChannel = {
        id: 'adtip_incoming_calls',
        name: 'Incoming Calls',
        description: 'Notifications for incoming voice and video calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: AndroidColor.GREEN,
      };

      // Ongoing calls channel
      const ongoingCallChannel = {
        id: 'adtip_ongoing_calls',
        name: 'Ongoing Calls',
        description: 'Persistent notifications for active calls',
        importance: AndroidImportance.DEFAULT,
        sound: 'none',
        vibration: false,
      };

      await notifee.createChannel(incomingCallChannel);
      await notifee.createChannel(ongoingCallChannel);

      console.log('[InAppCallService] ✅ Notification channels created');
    } catch (error) {
      console.error('[InAppCallService] ❌ Error creating notification channels:', error);
    }
  }

  /**
   * Setup event listeners for incoming calls and call actions
   */
  private setupEventListeners(): void {
    console.log('[InAppCallService] 📡 Setting up event listeners...');

    // Listen for incoming call events from native side
    const incomingCallListener = DeviceEventEmitter.addListener(
      'ADTIP_INCOMING_CALL_RECEIVED',
      this.handleIncomingCall.bind(this)
    );

    // Listen for call action events (answer, decline, end, mute)
    const callActionListener = DeviceEventEmitter.addListener(
      'ADTIP_CALL_ACTION',
      this.handleCallAction.bind(this)
    );

    // Listen for notifee events (notification taps, actions)
    const notifeeListener = notifee.onForegroundEvent(this.handleNotificationEvent.bind(this));

    this.eventListeners.push(incomingCallListener, callActionListener, notifeeListener);

    console.log('[InAppCallService] ✅ Event listeners setup complete');
  }

  /**
   * Handle incoming call (like WhatsApp)
   */
  private async handleIncomingCall(callData: any): Promise<void> {
    try {
      console.log('[InAppCallService] 📞 Handling incoming call:', callData);

      const session: CallSession = {
        sessionId: `call_${Date.now()}`,
        callType: callData.callType || 'voice',
        callerName: callData.callerName || 'Unknown Caller',
        callerId: callData.callerId,
        meetingId: callData.meetingId,
        token: callData.token,
        isIncoming: true,
        status: 'ringing',
        startTime: Date.now(),
      };

      this.currentCall = session;

      // Show WhatsApp-like incoming call notification
      await this.showIncomingCallNotification(session);

      // Trigger React Native navigation to call screen
      DeviceEventEmitter.emit('NAVIGATE_TO_INCOMING_CALL', session);

    } catch (error) {
      console.error('[InAppCallService] ❌ Error handling incoming call:', error);
    }
  }

  /**
   * Show WhatsApp-like incoming call notification
   */
  private async showIncomingCallNotification(session: CallSession): Promise<void> {
    try {
      console.log('[InAppCallService] 🔔 Showing WhatsApp-like incoming call notification');

      const notificationId = `incoming_call_${session.sessionId}`;

      await notifee.displayNotification({
        id: notificationId,
        title: `Incoming ${session.callType} call`,
        body: session.callerName,        data: {
          sessionId: session.sessionId,
          callType: session.callType,
          meetingId: session.meetingId || '',
          token: session.token || '',
        },
        android: {
          channelId: 'adtip_incoming_calls',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.CALL,
          ongoing: true,
          autoCancel: false,
          color: AndroidColor.GREEN,
          colorized: true,
          smallIcon: 'ic_call_white_24dp',
          largeIcon: 'ic_account_circle', // User avatar placeholder
          fullScreenAction: {
            id: 'incoming_call_fullscreen',
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Answer',
              icon: 'ic_call_white_24dp',
              pressAction: {
                id: 'answer_call',
                launchActivity: 'default',
              },
            },
            {
              title: 'Decline',
              icon: 'ic_call_end_white_24dp',
              pressAction: {
                id: 'decline_call',
              },
            },
          ],
          sound: 'default',
          vibrationPattern: [1000, 1000, 1000, 1000],
        },
      });

      console.log('[InAppCallService] ✅ Incoming call notification displayed');
    } catch (error) {
      console.error('[InAppCallService] ❌ Error showing incoming call notification:', error);
    }
  }

  /**
   * Start an outgoing call (WhatsApp-like)
   */
  public async startOutgoingCall(
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video'
  ): Promise<CallSession | null> {
    try {
      console.log('[InAppCallService] 🚀 Starting outgoing call:', { recipientId, recipientName, callType });

      // Check if there's already an active call
      if (this.currentCall && this.currentCall.status !== 'ended') {
        throw new Error('Another call is already in progress');
      }      // Generate VideoSDK meeting
      // const { meetingId, token } = await this.videoSDKService.createMeeting();
      const meetingId = `meeting_${Date.now()}`;
      const token = `token_${Date.now()}`;

      const session: CallSession = {
        sessionId: `call_${Date.now()}`,
        callType,
        callerName: 'You',
        callerId: recipientId,
        meetingId,
        token,
        isIncoming: false,
        status: 'ringing',
        startTime: Date.now(),
      };

      this.currentCall = session;

      // Send call notification to recipient via Firebase
      await this.sendCallNotificationToRecipient(recipientId, recipientName, session);

      // Show ongoing call notification
      await this.showOngoingCallNotification(session);

      // Navigate to call screen
      DeviceEventEmitter.emit('NAVIGATE_TO_CALL_SCREEN', session);

      console.log('[InAppCallService] ✅ Outgoing call started successfully');
      return session;

    } catch (error) {
      console.error('[InAppCallService] ❌ Error starting outgoing call:', error);
      Alert.alert('Call Failed', 'Unable to start the call. Please try again.');
      return null;
    }
  }

  /**
   * Send call notification to recipient via Firebase
   */
  private async sendCallNotificationToRecipient(
    recipientId: string,
    recipientName: string,
    session: CallSession
  ): Promise<void> {
    try {
      const notificationData = {
        call_type: session.callType,
        callerName: 'Someone', // Replace with actual caller name
        caller_app_user_id: 'current_user_id', // Replace with actual caller ID
        meetingId: session.meetingId,
        token: session.token,
        sessionId: session.sessionId,
      };

      // await this.firebaseService.sendCallNotification(recipientId, notificationData);
      console.log('[InAppCallService] Call notification would be sent to recipient:', notificationData);
      console.log('[InAppCallService] ✅ Call notification sent to recipient');
    } catch (error) {
      console.error('[InAppCallService] ❌ Error sending call notification:', error);
    }
  }

  /**
   * Show ongoing call notification (WhatsApp-like)
   */
  private async showOngoingCallNotification(session: CallSession): Promise<void> {
    try {
      if (Platform.OS === 'android' && OngoingCall) {
        OngoingCall.startOngoingCallNotification(
          `Ongoing ${session.callType} call`,
          session.callerName
        );
      }
    } catch (error) {
      console.error('[InAppCallService] ❌ Error showing ongoing call notification:', error);
    }
  }

  /**
   * Handle call actions (answer, decline, end, mute)
   */
  private async handleCallAction(action: any): Promise<void> {
    try {
      console.log('[InAppCallService] 🎬 Handling call action:', action);

      switch (action.action) {
        case 'answer':
          await this.answerCall();
          break;
        case 'decline':
          await this.declineCall();
          break;
        case 'end':
          await this.endCall();
          break;
        case 'mute':
          await this.toggleMute();
          break;
        default:
          console.warn('[InAppCallService] Unknown call action:', action.action);
      }
    } catch (error) {
      console.error('[InAppCallService] ❌ Error handling call action:', error);
    }
  }

  /**
   * Handle notification events (taps, actions)
   */
  private async handleNotificationEvent(event: any): Promise<void> {
    try {
      console.log('[InAppCallService] 🔔 Notification event:', event);

      switch (event.detail.pressAction?.id) {
        case 'answer_call':
          await this.answerCall();
          break;
        case 'decline_call':
          await this.declineCall();
          break;
        case 'end_call':
          await this.endCall();
          break;
        case 'toggle_mute':
          await this.toggleMute();
          break;
        case 'incoming_call_fullscreen':
          // Navigate to full screen call
          if (this.currentCall) {
            DeviceEventEmitter.emit('NAVIGATE_TO_INCOMING_CALL', this.currentCall);
          }
          break;
      }
    } catch (error) {
      console.error('[InAppCallService] ❌ Error handling notification event:', error);
    }
  }

  /**
   * Answer incoming call
   */
  public async answerCall(): Promise<void> {
    try {
      if (!this.currentCall || this.currentCall.status !== 'ringing') {
        throw new Error('No ringing call to answer');
      }

      console.log('[InAppCallService] ✅ Answering call');

      this.currentCall.status = 'connected';

      // Hide incoming call notification
      await notifee.cancelNotification(`incoming_call_${this.currentCall.sessionId}`);

      // Join VideoSDK meeting
      if (this.currentCall.meetingId && this.currentCall.token) {
        await this.videoSDKService.joinMeeting(this.currentCall.meetingId, this.currentCall.token);
      }

      // Show ongoing call notification
      await this.showOngoingCallNotification(this.currentCall);

      // Navigate to call screen
      DeviceEventEmitter.emit('NAVIGATE_TO_CALL_SCREEN', this.currentCall);

    } catch (error) {
      console.error('[InAppCallService] ❌ Error answering call:', error);
    }
  }

  /**
   * Decline incoming call
   */
  public async declineCall(): Promise<void> {
    try {
      if (!this.currentCall) {
        return;
      }

      console.log('[InAppCallService] ❌ Declining call');

      // Hide incoming call notification
      await notifee.cancelNotification(`incoming_call_${this.currentCall.sessionId}`);

      // End the call session
      await this.endCall();

    } catch (error) {
      console.error('[InAppCallService] ❌ Error declining call:', error);
    }
  }

  /**
   * End current call
   */
  public async endCall(): Promise<void> {
    try {
      if (!this.currentCall) {
        return;
      }

      console.log('[InAppCallService] 🔚 Ending call');

      this.currentCall.status = 'ended';

      // Leave VideoSDK meeting
      await this.videoSDKService.leaveMeeting();

      // Hide all call notifications
      await notifee.cancelNotification(`incoming_call_${this.currentCall.sessionId}`);
      
      if (Platform.OS === 'android' && OngoingCall) {
        OngoingCall.stopOngoingCallNotification();
      }

      // Clear current call
      this.currentCall = null;

      // Navigate back to main app
      DeviceEventEmitter.emit('NAVIGATE_TO_HOME');

    } catch (error) {
      console.error('[InAppCallService] ❌ Error ending call:', error);
    }
  }

  /**
   * Toggle mute
   */
  public async toggleMute(): Promise<void> {
    try {
      console.log('[InAppCallService] 🔇 Toggling mute');
      
      // Implement mute toggle via VideoSDK
      await this.videoSDKService.toggleMute();

    } catch (error) {
      console.error('[InAppCallService] ❌ Error toggling mute:', error);
    }
  }

  /**
   * Get current call session
   */
  public getCurrentCall(): CallSession | null {
    return this.currentCall;
  }

  /**
   * Check if service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and reset service
   */
  public cleanup(): void {
    console.log('[InAppCallService] 🧹 Cleaning up...');

    // Remove all event listeners
    this.eventListeners.forEach(listener => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
    this.eventListeners = [];

    // End any active call
    if (this.currentCall) {
      this.endCall();
    }

    this.isInitialized = false;
    console.log('[InAppCallService] ✅ Cleanup completed');
  }
}

export default InAppCallService;
