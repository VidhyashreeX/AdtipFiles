import { useState, useEffect, useRef, useCallback } from 'react';
import { useMeeting, useParticipant, switchAudioDevice } from '@videosdk.live/react-native-sdk';
import { CallSettings, CallStatus, CallMetrics } from '../../types/videosdk';

export interface UseVideoSDKMeetingProps {
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onError?: (error: any) => void;
}

export const useVideoSDKMeeting = (props: UseVideoSDKMeetingProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [callSettings, setCallSettings] = useState<CallSettings>({
    micEnabled: false,
    webcamEnabled: false,
    speakerEnabled: true, // Speaker is on by default
  });
  const [metrics, setMetrics] = useState<CallMetrics>({
    duration: 0,
    participantCount: 0,
    networkQuality: 'good',
  });

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mMeeting = useMeeting({
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
    onParticipantJoined: () => updateParticipantCount(),
    onParticipantLeft: () => updateParticipantCount(),
    onError: (error) => {
      console.error('[VideoSDKMeeting] Meeting error:', error);
      setCallStatus('failed');
      props.onError?.(error);
    },
  });

  const { localParticipant } = mMeeting;
  const { micOn, webcamOn } = useParticipant(localParticipant?.id || '');

  useEffect(() => {
    setCallSettings(prev => ({ ...prev, micEnabled: micOn, webcamEnabled: webcamOn }));
  }, [micOn, webcamOn]);


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

  const updateParticipantCount = useCallback(() => {
    if (mMeeting.participants) {
      setMetrics(prev => ({ ...prev, participantCount: mMeeting.participants.size }));
    }
  }, [mMeeting.participants]);

  const handleToggleMic = () => {
    mMeeting.toggleMic();
  };

  const handleToggleWebcam = () => {
    mMeeting.toggleWebcam();
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !callSettings.speakerEnabled;
    switchAudioDevice(newSpeakerState ? 'SPEAKER_PHONE' : 'EARPIECE');
    setCallSettings(prev => ({ ...prev, speakerEnabled: newSpeakerState }));
  };

  const endCall = () => {
    mMeeting.leave();
  };

  useEffect(() => {
    updateParticipantCount();
  }, [mMeeting.participants, updateParticipantCount]);

  useEffect(() => {
    return () => stopDurationTimer();
  }, []);

  return {
    ...mMeeting,
    callStatus,
    callSettings,
    metrics,
    leave: endCall,
    toggleMic: handleToggleMic,
    toggleWebcam: handleToggleWebcam,
    toggleSpeaker: handleToggleSpeaker,
  };
};