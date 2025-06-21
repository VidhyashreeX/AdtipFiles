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
  callerId: string;
  callerName: string;
  callerFcmToken?: string; // The person who started the call
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
      console.log('[CallService] Starting outgoing call...');
      const { meetingId, token } = await this.createMeeting();
      
      //this.callKeepService.startOutgoingCall(callId, recipientName, recipientName, callType === 'video');

      this.activeCall = { 
        callId, 
        meetingId, 
        token, 
        callerId: currentUser.id,
        callerName: currentUser.name, 
        recipientId, 
        recipientName, 
        isInitiator: true, 
        callType, 
        status: 'dialing' 
      };
      
      await this.notifyRecipientOfNewCall();
      this.navigateToMeetingScreen();
      console.log('[CallService] Outgoing call initiated. Waiting for recipient to answer.');

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
    callerId: string;
    callerName: string;
    callerFcmToken: string;
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
      callerId: callInfo.callerId,
      callerName: callInfo.callerName,
      callerFcmToken: callInfo.callerFcmToken,
      recipientId: '', // This device is the recipient
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

  private async onAnswerCall({ callUUID }: { callUUID: string }) {
    if (this.activeCall && this.activeCall.callId === callUUID && !this.activeCall.isInitiator) {
      this.activeCall.status = 'connected';
      
      // Notify the original caller that we have accepted the call.
      await this.notifyCallStatusUpdate('accepted', this.activeCall);

      this.navigateToMeetingScreen();
    }
  }

  public handleCallAccepted(callId: string) {
    if (this.activeCall && this.activeCall.callId === callId && this.activeCall.isInitiator) {
      this.activeCall.status = 'connected';
      RNCallKeep.reportConnectedOutgoingCallWithUUID(callId);
      this.navigateToMeetingScreen();
    }
  }

  public handleCallDeclined(callId: string) {
    if (this.activeCall && this.activeCall.callId === callId) {
      this.endCurrentCall(); // end call without notifying, because decline notification is separate
      if(this.activeCall.isInitiator) {
        Alert.alert("Call Declined", "The other user is busy or declined the call.");
      }
    }
  }

  private async onEndCall({ callUUID }: { callUUID: string }) {
    if (this.isEndingCall || !this.activeCall || this.activeCall.callId !== callUUID) {
      return;
    }
    this.isEndingCall = true;

    const callToEnd = { ...this.activeCall };
    console.log('[CallService] onEndCall triggered for call:', callToEnd.callId);

    // Reset state immediately to prevent re-entry
    this.resetActiveCall(); 

    try {
      if (callToEnd.status !== 'connected' && !callToEnd.isInitiator) {
        // Recipient ended a ringing call (i.e., declined)
        await this.notifyCallStatusUpdate('declined', callToEnd);
      } else if (callToEnd.status === 'connected') {
        // Anyone ended a connected call
        await this.notifyCallStatusUpdate('ended', callToEnd);
      }

      // Navigate back to TipCallScreen after call ends
      if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name === 'Meeting') {
        console.log('[CallService] Navigating to TipCallScreen after call end.');
        navigationRef.navigate('TipCall' as any);
      }
    } catch (error) {
      console.error('[CallService] Error during onEndCall cleanup:', error);
    } finally {
      this.isEndingCall = false;
      console.log('[CallService] Call cleanup finished for:', callUUID);
    }
  }

  private async notifyCallStatusUpdate(status: 'accepted' | 'declined' | 'ended', call: ActiveCall) {
    if (!call) return;
    
    try {
        const firebaseCallService = (await import('./FirebaseCallService')).default.getInstance();
        
        const updateData = {
            type: status,
            callId: call.callId,
            // The FCM function needs to know who to notify.
            targetFcmToken: call.callerFcmToken,
        };

        await firebaseCallService.updateCallStatus(updateData as any); 

    } catch (error) {
        console.error('[CallService] Failed to notify call status update:', error);
    }
  }
  
  /**
   * Notify the caller that the call was declined
   */
  private async notifyCallerDeclined(call: ActiveCall) {
    await this.notifyCallStatusUpdate('declined', call);
  }

  public endCurrentCall() {
    if (this.activeCall && !this.isEndingCall) {
      const callId = this.activeCall.callId; 
      console.log('[CallService] End current call sequence started for', callId);
      this.callKeepService.endCall(callId); // This will trigger onEndCall
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

  private async notifyRecipientOfNewCall() {
    if (!this.activeCall || !this.activeCall.isInitiator) return;

    const { recipientId, recipientName, callType, meetingId, token, callId, callerName, callerId } = this.activeCall;
    
    const recipientFcmRes = await ApiService.getFcmTokensForUsers({ userIds: [parseInt(callerId), parseInt(recipientId)] });
    const recipientFcm = recipientFcmRes.results.find(r => r.userId === parseInt(recipientId));
    if (!recipientFcm?.fcm_token) {
      throw new Error('Recipient is not available for calls.');
    }
    
    const myFcmToken = await this.firebaseService.getFCMToken();

    const callData = {
      // Data about the person being called
      calleeInfo: { platform: 'ANDROID', token: recipientFcm.fcm_token, userId: recipientId, name: recipientName },
      // Data about the person making the call
      callerInfo: { name: callerName, token: myFcmToken || '', userId: callerId, platform: Platform.OS.toUpperCase() as 'ANDROID' | 'IOS' },
      // VideoSDK meeting info
      videoSDKInfo: { meetingId, token, roomId: meetingId },
      // General call info
      callInfo: { callType, callId }
    };

    const firebaseCallService = (await import('./FirebaseCallService')).default.getInstance();
    await firebaseCallService.initiateCall(callData as FirebaseCallData);
  }

  private navigateToMeetingScreen() {
    if (!this.activeCall) return;
    const { meetingId, token, callType, callerName, isInitiator, recipientName } = this.activeCall;
    
    const displayName = isInitiator ? callerName : recipientName;
    const targetRecipientName = isInitiator ? recipientName : callerName;

    console.log('[CallService] Navigating to MeetingScreen with params:', {
      meetingId,
      token: '...', // Token hidden for logs
      callType,
      displayName,
      isInitiator,
      recipientName: targetRecipientName
    });

    navigate('Meeting', {
      meetingId,
      token,
      callType,
      displayName,
      isInitiator,
      recipientName: targetRecipientName
    });
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
}

export default CallService; 