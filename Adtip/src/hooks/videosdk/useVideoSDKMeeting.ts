import { useState, useEffect, useRef } from 'react';
import { useMeeting } from '@videosdk.live/react-native-sdk';
import { CallSettings, CallStatus, CallMetrics } from '../../types/videosdk';
import { updateCallStatus } from '../../helpers/CallHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [callId, setCallId] = useState<string>('');

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get call ID from storage or props
  useEffect(() => {
    const getCallId = async () => {
      const storedCallId = await AsyncStorage.getItem('currentCallId');
      if (storedCallId) {
        setCallId(storedCallId);
      }
    };
    getCallId();
  }, []);

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
    onMeetingJoined: async () => {
      console.log('[VideoSDKMeeting] Meeting joined successfully');
      setCallStatus('connected');
      startTimeRef.current = Date.now();
      startDurationTimer();
      
      // Update call status to 'accepted'
      await updateCallStatus('accepted', props.participantName, callId);
      
      props.onMeetingJoined?.();
    },
    onMeetingLeft: async () => {
      console.log('[VideoSDKMeeting] Meeting left');
      setCallStatus('ended');
      stopDurationTimer();
      
      // Update call status to 'ended' with duration
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await updateCallStatus('ended', props.participantName, callId, duration);
      
      // Clean up call ID
      await AsyncStorage.removeItem('currentCallId');
      
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
    onError: async (error) => {
      console.error('[VideoSDKMeeting] Meeting error:', error);
      setCallStatus('failed');
      
      // Update call status to 'missed' or 'ended' based on error
      await updateCallStatus('missed', props.participantName, callId);
      
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

  const endCall = async () => {
    // Update call status before leaving
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    await updateCallStatus('ended', props.participantName, callId, duration);
    
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
    leave: endCall, // Use enhanced endCall function
    toggleMic: handleToggleMic,
    toggleWebcam: handleToggleWebcam,
    toggleSpeaker: handleToggleSpeaker,
    startRecording,
    stopRecording,
  };
};