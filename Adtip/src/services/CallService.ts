import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { appEventEmitter } from '../events/AppEventEmitter';
import CallKeepService from './CallKeepService';
import FirebaseService from './FirebaseService';
import { OtpVerifyResponse as User } from '../types/api';
import { FirebaseCallData } from './FirebaseCallService';
import FirebaseCallService from './FirebaseCallService';
import VideoSDKService from './videosdk/VideoSDKService';
import ApiService from './ApiService';

export interface ActiveCall {
  callId: string;
  meetingId: string;
  token: string;
  callerId: string;
  callerName: string;
  callerFcmToken: string;
  recipientId: string;
  recipientName: string;
  recipientFcmToken: string;
  callType: 'voice' | 'video';
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
  isInitiator: boolean;
}

class CallService {
  private static instance: CallService;
  public activeCall: ActiveCall | null = null;
  private isInitiator: boolean = false;
  private currentUser: User | null = null;
  private firebaseService: FirebaseService;

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    // other initializations
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  private async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr) as User;
      this.currentUser = user;
      return user;
    }
    return null;
  }

  public async startOutgoingCall(recipientId: string, recipientName: string, callType: 'voice' | 'video') {
    if (this.activeCall) {
      Alert.alert('Call In Progress', 'You are already in another call.');
      return;
    }

    try {
      this.currentUser = await this.getCurrentUser();
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!this.currentUser || !this.currentUser.name || !accessToken) {
        throw new Error('User not authenticated or session token is missing.');
      }
      
      const recipientFcmData = await ApiService.getFCMToken(recipientId);
      if (!recipientFcmData || !recipientFcmData.token || !recipientFcmData.platform) {
        throw new Error('Could not find recipient. They may be offline.');
      }

      const videoSDKService = VideoSDKService.getInstance();
      const meetingId = await videoSDKService.createMeeting(accessToken);
      if (!meetingId) {
        throw new Error('Failed to create a secure call room.');
      }
      
      const videoSDKToken = await videoSDKService.generateParticipantToken();
      if (!videoSDKToken) {
          throw new Error("Failed to generate VideoSDK token.");
      }

      // 4. Prepare call data for Firebase
      const callId = uuidv4();
      const firebaseCallService = FirebaseCallService.getInstance();
      const callData = await firebaseCallService.prepareCallData(
        recipientFcmData.token,
        recipientFcmData.platform,
        recipientId,
        recipientName,
        this.currentUser.name,
        meetingId,
        videoSDKToken,
        { callType, callId }
      );

      // 5. Set local active call state
      this.activeCall = {
        callId: callId,
        meetingId: meetingId,
        token: videoSDKToken,
        callerId: this.currentUser.id.toString(),
        callerName: this.currentUser.name,
        callerFcmToken: callData.callerInfo.token,
        recipientId: recipientId,
        recipientName: recipientName,
        recipientFcmToken: recipientFcmData.token,
        callType: callType,
        status: 'dialing',
        isInitiator: true,
      };

      // 6. Emit event to show the call UI
      appEventEmitter.emit('CallStarted', this.activeCall);

      // 7. Initiate the call via Firebase
      await firebaseCallService.initiateCall(callData);

    } catch (error: any) {
      console.error('[CallService] Error starting outgoing call:', error);
      Alert.alert('Call Failed', error.message || 'Could not initiate the call.');
      this.resetCallState();
    }
  }

  public resetCallState() {
    this.activeCall = null;
    this.isInitiator = false;
  }
  // ... other methods
}

export default CallService.getInstance();