import { useState, useEffect, useRef } from 'react';
import { useMeeting } from '@videosdk.live/react-native-sdk';
import { CallSettings, CallStatus, CallMetrics } from '../../types/videosdk';

export interface UseVideoSDKMeetingProps {
  meetingId: string;
  token: string;
  participantName: string;
  micEnabled?: boolean;
  webcamEnabled?: boolean;
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onError?: (error: any) => void;
}

export const useVideoSDKMeeting = (props: UseVideoSDKMeetingProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [callSettings, setCallSettings] = useState<CallSettings>({
    micEnabled: props.micEnabled ?? false,
    webcamEnabled: props.webcamEnabled ?? false,
    speakerEnabled: true,
  });
  const [metrics, setMetrics] = useState<CallMetrics>({
    duration: 0,
    participantCount: 0,
    networkQuality: 'good',
  });

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    meetingId,
    participants,
    localParticipant,
    join,
    leave,
    toggleMic,
    toggleWebcam,
    startRecording,
    stopRecording,
    activeSpeakerId,
    activePresenterId,
  } = useMeeting({
    meetingId: props.meetingId,
    token: props.token,
    name: props.participantName,
    micEnabled: props.micEnabled,
    webcamEnabled: props.webcamEnabled,
    onMeetingJoined: () => {
      console.log('[VideoSDKMeeting] Meeting joined successfully');
      setCallStatus('connected');
      startTimeRef.current = Date.now();
      startDurationTimer();
      props.onMeetingJoined?.();
    },
    onMeetingLeft: () => {
      console.log('[VideoSDKMeeting] Meeting left');
      setCallStatus('ended');
      stopDurationTimer();
      props.onMeetingLeft?.();
    },
    onParticipantJoined: (participant) => {
      console.log('[VideoSDKMeeting] Participant joined:', participant.displayName);
      updateParticipantCount();
    },
    onParticipantLeft: (participant) => {
      console.log('[VideoSDKMeeting] Participant left:', participant.displayName);
      updateParticipantCount();
    },
    onError: (error) => {
      console.error('[VideoSDKMeeting] Meeting error:', error);
      setCallStatus('failed');
      props.onError?.(error);
    },
  });

  const startDurationTimer = () => {
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setMetrics(prev => ({ ...prev, duration }));
      }
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateParticipantCount = () => {
    setMetrics(prev => ({ ...prev, participantCount: participants.size }));
  };

  const handleToggleMic = () => {
    toggleMic();
    setCallSettings(prev => ({ ...prev, micEnabled: !prev.micEnabled }));
  };

  const handleToggleWebcam = () => {
    toggleWebcam();
    setCallSettings(prev => ({ ...prev, webcamEnabled: !prev.webcamEnabled }));
  };

  const handleToggleSpeaker = () => {
    setCallSettings(prev => ({ ...prev, speakerEnabled: !prev.speakerEnabled }));
  };

  const endCall = () => {
    leave();
  };

  useEffect(() => {
    updateParticipantCount();
  }, [participants]);

  useEffect(() => {
    return () => {
      stopDurationTimer();
    };
  }, []);

  return {
    // Meeting data
    meetingId,
    participants,
    localParticipant,
    activeSpeakerId,
    activePresenterId,
    
    // Call state
    callStatus,
    callSettings,
    metrics,
    
    // Actions
    join,
    leave: endCall,
    toggleMic: handleToggleMic,
    toggleWebcam: handleToggleWebcam,
    toggleSpeaker: handleToggleSpeaker,
    startRecording,
    stopRecording,
  };
};