import notifee, { EventType } from '@notifee/react-native';
import { AppState, Linking } from 'react-native';
import VoipPushNotification from 'react-native-voip-push-notification';
import { v4 as uuid } from 'uuid';

import { navigate } from '../../navigation/NavigationService';
import ApiService from '../ApiService';
import InAppCallService from '../InAppCallService';

class CallService {
  private static instance: CallService;
  private currentCallId: string | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  private setupEventListeners() {
    // --- VOIP Push Notification Event Listeners ---
    VoipPushNotification.addEventListener('register', (token) => {
      // --- Send token to your server ---
      console.log('VoipPushNotification token:', token);
      // ApiService.updateFcmToken({ fcmToken: token });
    });

    VoipPushNotification.addEventListener('notification', (notification) => {
      const { callId, callerName } = notification as any;
      this.currentCallId = callId;
      // --- Handle incoming call notification ---
      // InAppCallService.displayIncomingCall(callId, callerName, 'video');
    });

    // --- Notifee Event Listeners for foreground notifications ---
    notifee.onForegroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;
      if (!notification || !notification.id) return;

      if (type === EventType.ACTION_PRESS && pressAction?.id === 'accept') {
        this.acceptCall(notification.id);
        await notifee.cancelNotification(notification.id);
      }

      if (type === EventType.ACTION_PRESS && pressAction?.id === 'decline') {
        this.rejectCall(notification.id);
        await notifee.cancelNotification(notification.id);
      }
    });

    // --- AppState listener to handle app coming to foreground ---
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // --- App is in the foreground, check for active calls ---
        if (this.currentCallId) {
          // --- Potentially navigate to call screen ---
        }
      }
    });
  }

  public async startCall(recipientId: string, type: 'video' | 'voice') {
    const callId = uuid();
    this.currentCallId = callId;

    try {
      // This needs to be adjusted based on the actual ApiService.initiateCall implementation
      /* const { meetingId, token } = await ApiService.initiateCall({
        calleeInfo: { platform: 'android', token: 'recipient-fcm-token' }, // Placeholder
        callerInfo: { name: 'Your Name', token: 'caller-fcm-token' }, // Placeholder
        videoSDKInfo: { meetingId: '', token: '' }, // This will be filled by the backend
      }); */

      // --- Navigate to the call screen ---
      /* navigate('Meeting', {
        meetingId,
        token,
        callType: type,
        displayName: 'You',
        isInitiator: true,
      }); */
    } catch (error) {
      console.error('Failed to start call:', error);
      this.currentCallId = null;
    }
  }

  public async acceptCall(callId: string) {
    this.currentCallId = callId;
    try {
      // @ts-ignore
      // const { meetingId, token, callerName } = await ApiService.acceptCall({ callId });
      // --- Navigate to meeting screen ---
      /* navigate('Meeting', {
        meetingId,
        token,
        callType: 'video', // Or determine from payload
        displayName: callerName,
        isInitiator: false,
      }); */
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  }

  public async rejectCall(callId: string) {
    if (this.currentCallId === callId) {
      this.currentCallId = null;
    }
    try {
      // @ts-ignore
      // await ApiService.rejectCall({ callId });
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }

  public endCall() {
    if (this.currentCallId) {
      // --- Logic to end the call via VideoSDK and notify server ---
      // @ts-ignore
      // ApiService.endCall({ callId: this.currentCallId });
      this.currentCallId = null;
    }
  }
}

export default CallService.getInstance();
