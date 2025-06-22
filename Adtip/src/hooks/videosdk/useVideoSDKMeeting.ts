import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  useMeeting, 
  useParticipant, 
  switchAudioDevice, 
  MeetingProvider, 
  Constants
} from '@videosdk.live/react-native-sdk';
import { CallSettings, CallStatus, CallMetrics } from '../../types/videosdk';

export interface UseVideoSDKMeetingProps {
  // Add required configuration properties
  meetingId?: string;
  token?: string;
  displayName?: string;
  micEnabled?: boolean;
  webcamEnabled?: boolean;
  // Event handlers
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onError?: (error: any) => void;
}

export const useVideoSDKMeeting = (props: UseVideoSDKMeetingProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [callSettings, setCallSettings] = useState<CallSettings>({
    micEnabled: props.micEnabled ?? false,
    webcamEnabled: props.webcamEnabled ?? false,
    speakerEnabled: true, // Speaker is on by default
    participantCount: 0,
    networkQuality: 'good',
  });
  const [metrics, setMetrics] = useState<CallMetrics>({
    duration: 0,
    participantCount: 0,
    networkQuality: 'good',
  });
  const [meetingConfig, setMeetingConfig] = useState({
    meetingId: props.meetingId || '',
    token: props.token || '',
    displayName: props.displayName || 'User',
    micEnabled: props.micEnabled ?? false,
    webcamEnabled: props.webcamEnabled ?? false,
  });

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef<boolean>(false);

  // Set up meeting configuration
  const mMeeting = useMeeting({
    onMeetingJoined: () => {
      console.log('[VideoSDKMeeting] Meeting joined successfully');
      setCallStatus('connected');
      startTimeRef.current = Date.now();
      startDurationTimer();
      props.onMeetingJoined?.();
      hasJoinedRef.current = true;
    },
    onMeetingLeft: () => {
      console.log('[VideoSDKMeeting] Meeting left');
      setCallStatus('ended');
      stopDurationTimer();
      props.onMeetingLeft?.();
      hasJoinedRef.current = false;
    },
    onParticipantJoined: () => updateParticipantCount(),
    onParticipantLeft: () => updateParticipantCount(),
    onError: (error) => {
      console.error('[VideoSDKMeeting] Meeting error:', error);
      setCallStatus('failed');
      props.onError?.(error);
    },
  });

  // Get local participant state
  const { localParticipant } = mMeeting;
  const participantInfo = useParticipant(localParticipant?.id ?? '');
  const micOn = localParticipant ? participantInfo.micOn : false;
  const webcamOn = localParticipant ? participantInfo.webcamOn : false;

  // Update settings when mic/webcam state changes
  useEffect(() => {
    setCallSettings(prev => ({ ...prev, micEnabled: micOn, webcamEnabled: webcamOn }));
  }, [micOn, webcamOn]);

  // Helper functions for timer management
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

  // Update participant count
  const updateParticipantCount = useCallback(() => {
    if (mMeeting.participants) {
      setMetrics(prev => ({ ...prev, participantCount: mMeeting.participants.size }));
    }
  }, [mMeeting.participants]);

  // Define helper functions for meeting controls
  // IMPORTANT: Join function implementation
  const joinMeeting = useCallback(() => {
    if (!meetingConfig.meetingId || !meetingConfig.token) {
      console.error('[VideoSDKMeeting] Cannot join meeting: Missing meetingId or token');
      return;
    }
    if (hasJoinedRef.current) {
      console.log('[VideoSDKMeeting] joinMeeting already called, skipping.');
      return;
    }
    try {
      console.log('[VideoSDKMeeting] Joining meeting:', meetingConfig.meetingId);
      if (mMeeting && typeof mMeeting.join === 'function') {
        mMeeting.join();
        hasJoinedRef.current = true;
      } else {
        console.error('[VideoSDKMeeting] join method is not available on mMeeting object:', mMeeting);
        setCallStatus('failed');
        props.onError?.(new Error('Join method not available'));
      }
    } catch (error) {
      console.error('[VideoSDKMeeting] Error joining meeting:', error);
      setCallStatus('failed');
      props.onError?.(error);
    }
  }, [mMeeting, meetingConfig.meetingId, meetingConfig.token, props.onError]);

  // Meeting control handlers
  const handleToggleMic = () => {
    if (mMeeting && typeof mMeeting.toggleMic === 'function') {
      mMeeting.toggleMic();
    }
  };

  const handleToggleWebcam = () => {
    if (mMeeting && typeof mMeeting.toggleWebcam === 'function') {
      mMeeting.toggleWebcam();
    }
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !callSettings.speakerEnabled;
    switchAudioDevice(newSpeakerState ? 'SPEAKER_PHONE' : 'EARPIECE');
    setCallSettings(prev => ({ ...prev, speakerEnabled: newSpeakerState }));
  };

  const endCall = () => {
    if (mMeeting && typeof mMeeting.leave === 'function') {
      mMeeting.leave();
    }
  };

  // Update participant count when participants change
  useEffect(() => {
    updateParticipantCount();
  }, [mMeeting.participants, updateParticipantCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      // Attempt to leave meeting if still connected
      if (hasJoinedRef.current && mMeeting && typeof mMeeting.leave === 'function') {
        try {
          mMeeting.leave();
        } catch (e) {
          console.error('[VideoSDKMeeting] Error leaving meeting on unmount:', e);
        }
      }
      // Attempt to disable mic/webcam if possible
      if (mMeeting && typeof mMeeting.toggleMic === 'function' && micOn) {
        try { mMeeting.toggleMic(); } catch (e) { /* ignore */ }
      }
      if (mMeeting && typeof mMeeting.toggleWebcam === 'function' && webcamOn) {
        try { mMeeting.toggleWebcam(); } catch (e) { /* ignore */ }
      }
      // Optionally, reset hasJoinedRef
      hasJoinedRef.current = false;
    };
  }, [mMeeting, micOn, webcamOn]);

  // Update config if props change
  useEffect(() => {
    if (props.meetingId && props.token && props.displayName) {
      setMeetingConfig({
        meetingId: props.meetingId,
        token: props.token,
        displayName: props.displayName,
        micEnabled: props.micEnabled ?? false,
        webcamEnabled: props.webcamEnabled ?? false,
      });
    }
  }, [props.meetingId, props.token, props.displayName, props.micEnabled, props.webcamEnabled]);

  return {
    // Meeting state
    participants: mMeeting.participants || new Map(),
    localParticipant,
    callStatus,
    callSettings,
    metrics,
    
    // Critical - properly expose the join function
    join: joinMeeting, 
    
    // Meeting controls
    leave: endCall,
    toggleMic: handleToggleMic,
    toggleWebcam: handleToggleWebcam,
    toggleSpeaker: handleToggleSpeaker,
    
    // Meeting config
    meetingId: meetingConfig.meetingId,
    token: meetingConfig.token,
    
    // Raw meeting object for advanced usage
    rawMeeting: mMeeting,
  };
};