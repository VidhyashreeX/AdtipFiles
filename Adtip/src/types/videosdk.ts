// import { MediaStream } from "@videosdk.live/react-native-sdk";
// import { MediaStreamTrack } from 'react-native-webrtc';

export interface Participant {
  id: string;
  displayName: string;
  isLocal: boolean;
  mode: 'CONFERENCE' | 'VIEWER';
  quality?: 'low' | 'med' | 'high';
  micOn: boolean;
  webcamOn: boolean;
  // streams: Stream[];
}

// Temporarily commenting out due to missing webrtc types
// export interface Stream {
//   streamId: string;
//   track: MediaStreamTrack;
//   kind: 'video' | 'audio';
// }

export interface Meeting {
  id: string;
  participants: Map<string, Participant>;
  localParticipant: Participant;
  activeSpeakerId?: string;
  activePresenterId?: string;
}

export interface CallSettings {
  micEnabled: boolean;
  webcamEnabled: boolean;
  speakerEnabled: boolean;
  screenShareEnabled?: boolean;
  participantCount: number;
  networkQuality: 'good' | 'bad' | 'poor' | 'unknown';
}

export interface CallMetrics {
  duration: number;
  participantCount: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export type CallType = 'voice' | 'video' | 'screen_share';

export type CallStatus = 'connecting' | 'connected' | 'ended' | 'failed' | 'disconnected' | 'dialing';

export interface CallNotificationData {
  callerName: string;
  callType: CallType;
  channelName: string;
  rtcToken: string;
  callerRtcUid: string;
  isFromNotification: boolean;
  meetingId?: string;
}

export interface VideoSDKInfo {
  meetingId: string;
  token: string;
  callType: CallType;
}