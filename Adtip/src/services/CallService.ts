import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNCallKeep from 'react-native-callkeep';
import { navigationRef, navigate } from '../navigation/NavigationService';
import ApiService from './ApiService';
import CallKeepService from './CallKeepService';
import FirebaseService from './FirebaseService';
import VideoSDKService from './videosdk/VideoSDKService';
import uuid from 'react-native-uuid';
import { FirebaseCallData } from './FirebaseCallService';
import FirebaseCallService from './FirebaseCallService';

interface ActiveCall {
  callId: string;
  meetingId: string;
  token: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  isInitiator: boolean;
  callType: 'voice' | 'video';
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
}

class CallService {
  private static instance: CallService;
  private activeCall: ActiveCall | null = null;
  private callKeepService: CallKeepService;
  private firebaseService: FirebaseService;
  private isEndingCall: boolean = false;

  private constructor() {
    this.callKeepService = CallKeepService.getInstance();
    this.firebaseService = FirebaseService.getInstance();
    this.setupListeners();
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  private setupListeners() {
    RNCallKeep.addEventListener('answerCall', this.onAnswerCall.bind(this));
    RNCallKeep.addEventListener('endCall', this.onEndCall.bind(this));
    AppState.addEventListener('change', this.onAppStateChange.bind(this));
  }

  public async initialize() {
    console.log('[CallService] Initializing...');
    const callKeepConfig = {
      ios: { appName: 'Adtip', supportsVideo: true },
      android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'ic_launcher',
        selfManaged: true,
      },
    };
    await this.callKeepService.initialize(callKeepConfig);
    console.log('[CallService] Initialized successfully.');
  }

  public async startOutgoingCall(recipientId: string, recipientName: string, callType: 'voice' | 'video') {
    if (this.activeCall) {
      Alert.alert("Already in a call", "You are already in a call.");
      return;
    }

    const callId = uuid.v4() as string;
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to make a call.");
      return;
    }

    try {
      this.callKeepService.startOutgoingCall(callId, recipientName, recipientName, callType === 'video');
      const { meetingId, token } = await this.createMeeting();

      this.activeCall = { callId, meetingId, token, callerName: currentUser.name, recipientId, recipientName, isInitiator: true, callType, status: 'dialing' };
      
      await this.notifyRecipient();
      this.navigateToMeetingScreen();

    } catch (error: any) {
      console.error('[CallService] Outgoing call failed:', error);
      Alert.alert('Call Failed', error.message || 'Could not start the call.');
      this.callKeepService.endCall(callId);
      this.resetActiveCall();
    }
  }

  /**
   * Handle an incoming call with a full info object
   */
  public handleIncomingCall(callInfo: {
    callId: string;
    meetingId: string;
    token: string;
    callerName: string;
    callType: 'voice' | 'video';
    [key: string]: any;
  }) {
    if (this.activeCall) {
      console.warn('[CallService] Busy. Declining incoming call.');
      // TODO: Optionally notify the caller that the user is busy
      return;
    }
    this.activeCall = {
      callId: callInfo.callId,
      meetingId: callInfo.meetingId,
      token: callInfo.token,
      callerName: callInfo.callerName,
      recipientId: '',
      recipientName: '',
      isInitiator: false,
      callType: callInfo.callType,
      status: 'ringing',
    };
    this.callKeepService.displayIncomingCall(
      callInfo.callId,
      callInfo.callerName,
      callInfo.callerName,
      'generic',
      callInfo.callType === 'video'
    );
  }

  private onAnswerCall({ callUUID }: { callUUID: string }) {
    if (this.activeCall && this.activeCall.callId === callUUID) {
      this.activeCall.status = 'connected';
      this.navigateToMeetingScreen();
    }
  }

  private async onEndCall({ callUUID }: { callUUID: string }) {
    if (this.isEndingCall && this.activeCall?.callId !== callUUID) {
      // If we are in the process of ending a call, but a different call UUID comes in, ignore.
      return;
    }

    if (this.activeCall && this.activeCall.callId === callUUID) {
      this.isEndingCall = true;
      const callToEnd = { ...this.activeCall }; // Capture state before resetting
      this.resetActiveCall(); // Reset state immediately to prevent re-entry

      console.log('[CallService] onEndCall triggered for call:', callToEnd.callId);

      try {
        // Notify caller if this was an incoming call that was declined (not connected)
        if (!callToEnd.isInitiator && callToEnd.status !== 'connected') {
          await this.notifyCallerDeclined(callToEnd);
        }

        // Send the final status to the backend
        await this.sendCallEndedStatus(callToEnd);

        // Navigate back to TipCallScreen after call ends
        if (navigationRef.isReady()) {
          console.log('[CallService] Navigating to TipCallScreen after call end.');
          navigationRef.navigate('TipCall' as any);
        }
      } catch (error) {
        console.error('[CallService] Error during onEndCall cleanup:', error);
      } finally {
        this.isEndingCall = false; // Reset the flag
        console.log('[CallService] Call cleanup finished for:', callUUID);
      }
    }
  }

  /**
   * Notify the caller that the call was declined
   */
  private async notifyCallerDeclined(call: ActiveCall) {
    if (!call) return;
    try {
      console.log('[CallService] Notifying caller of declined call:', call.callId);
      // This is a placeholder. Implement a service call to your backend here.
      // e.g., await FirebaseCallService.getInstance().updateCallStatus({ type: 'declined', ... })
    } catch (e) {
      console.warn('[CallService] Failed to notify caller of declined call:', e);
    }
  }

  public endCurrentCall() {
    if (this.activeCall && !this.isEndingCall) {
      this.isEndingCall = true; // Set flag to prevent re-entry
      try {
        console.log('[CallService] End current call sequence started.');
        // This will trigger the 'onEndCall' listener, which will handle the rest.
        this.callKeepService.endCall(this.activeCall.callId);
      } catch (e) {
        console.error('[CallService] Error in endCurrentCall while triggering CallKeep:', e);
        // If CallKeep fails, manually clean up
        this.onEndCall({ callUUID: this.activeCall.callId });
      } finally {
        // The flag will be reset inside onEndCall after all async operations
      }
    }
  }

  private onAppStateChange(nextAppState: any) {
    if (nextAppState === 'active' && this.activeCall && this.activeCall.status === 'connected') {
        // Potentially resync call state
    }
  }

  private async createMeeting(): Promise<{ meetingId: string; token: string }> {
    const tokenRes = await ApiService.generateVideoSDKParticipantToken();
    if (!tokenRes.success || !tokenRes.token) throw new Error('Failed to get VideoSDK token.');
    const meetingRes = await ApiService.createVideoSDKMeeting(tokenRes.token);
    if (!meetingRes.success || !meetingRes.data?.roomId) throw new Error('Failed to create VideoSDK meeting.');
    return { meetingId: meetingRes.data.roomId, token: tokenRes.token };
  }

  private async notifyRecipient() {
    if (!this.activeCall || !this.activeCall.isInitiator) return;

    const { recipientId, recipientName, callType, meetingId, token, callId, callerName } = this.activeCall;
    const currentUser = await this.getCurrentUser();
    if(!currentUser) {
      throw new Error("Current user not found. Cannot notify recipient.");
    }

    const recipientFcmRes = await ApiService.getFcmTokensForUsers({ userIds: [parseInt(currentUser.id), parseInt(recipientId)] });
    const recipientFcm = recipientFcmRes.results.find(r => r.userId === parseInt(recipientId));
    if (!recipientFcm?.fcm_token) {
      throw new Error('Recipient is not available for calls.');
    }
    
    const callData: FirebaseCallData = {
        calleeInfo: { platform: 'ANDROID', token: recipientFcm.fcm_token, userId: recipientId, name: recipientName },
        callerInfo: { name: callerName, token: await this.firebaseService.getFCMToken() || '', userId: currentUser.id, platform: Platform.OS.toUpperCase() as 'ANDROID' | 'IOS' },
        videoSDKInfo: { meetingId, token, roomId: meetingId },
        callInfo: { callType, callId }
    };

    const firebaseCallService = (await import('./FirebaseCallService')).default.getInstance();
    await firebaseCallService.initiateCall(callData);
  }

  private navigateToMeetingScreen() {
    if (!this.activeCall) return;
    const { meetingId, token, callType, callerName, isInitiator, recipientName } = this.activeCall;
    navigate('Meeting' as any, { meetingId, token, callType, displayName: isInitiator ? recipientName : callerName, isInitiator, recipientName });
  }

  private async getCurrentUser(): Promise<{ id: string; name: string } | null> {
    const userId = await AsyncStorage.getItem('userId');
    const userName = await AsyncStorage.getItem('userName');
    if (userId && userName) {
      return { id: userId, name: userName };
    }
    return null;
  }

  private resetActiveCall() {
    console.log('[CallService] Resetting active call state.');
    this.activeCall = null;
  }

  /**
   * Send call ended status to Firebase
   */
  private async sendCallEndedStatus(call: ActiveCall) {
    if (!call) return;
    try {
      const firebaseService = FirebaseCallService.getInstance();
      let callerToken = await FirebaseService.getInstance().getFCMToken();
      if (!callerToken) callerToken = '';
      const userId = await AsyncStorage.getItem('userId');

      const payload: import('./FirebaseCallService').CallStatusUpdate = {
        callerInfo: {
          token: callerToken,
          name: call.callerName,
          userId: userId || undefined,
        },
        type: 'ended',
        callId: call.callId, // Pass the callId to the backend
      };
      await firebaseService.updateCallStatus(payload);
      console.log('[CallService] Sent CALL_ENDED status to Firebase for callId:', call.callId);
    } catch (e) {
      console.warn('[CallService] Failed to send CALL_ENDED status:', e);
    }
  }
}

export default CallService; 