export interface Participant {
  id: string;
  displayName: string;
  isLocal: boolean;
  mode: 'CONFERENCE' | 'VIEWER';
  quality?: 'low' | 'med' | 'high';
}

export interface Stream {
  id: string;
  codec: string;
  kind: 'video' | 'audio' | 'share';
  track: MediaStreamTrack;
}

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
}

export interface CallMetrics {
  duration: number;
  participantCount: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export type CallType = 'voice' | 'video' | 'screen_share';

export type CallStatus = 'connecting' | 'connected' | 'disconnected' | 'failed' | 'ended';

export interface CallNotificationData {
  callerName: string;
  callType: CallType;
  channelName: string;
  rtcToken: string;
  callerRtcUid: string;
  isFromNotification: boolean;
  meetingId?: string;
}