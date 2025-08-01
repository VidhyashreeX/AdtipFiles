import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  useMeeting, 
  useParticipant, 
  switchAudioDevice, 
  MeetingProvider, 
  Constants
} from '@videosdk.live/react-native-sdk';
import { CallSettings, CallStatus, CallMetrics } from '../../types/videosdk';
import { logError, logWarn, logVideoSDK, logCall } from '../../utils/ProductionLogger';

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
  onToggleMic?: () => void;
  onToggleWebcam?: () => void;
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
      logCall('VideoSDKMeeting', 'Meeting joined successfully');
      setCallStatus('connected');
      startTimeRef.current = Date.now();
      startDurationTimer();
      props.onMeetingJoined?.();
      hasJoinedRef.current = true;
    },
    onMeetingLeft: () => {
      logCall('VideoSDKMeeting', 'Meeting left - cleaning up notifications');
      setCallStatus('ended');
      stopDurationTimer();
      
      // Comprehensive notification cleanup when meeting ends
      const cleanupNotifications = async () => {
        try {
          // Import notification service dynamically
          const { default: NotificationService } = await import('../../services/calling/NotificationService');
          const notificationService = NotificationService.getInstance();
          
          // Hide all call notifications
          await notificationService.hideAllNotifications();
          
          // Clear all notifications as fallback
          const notifee = await import('@notifee/react-native');
          await notifee.default.cancelAllNotifications();
          
          logCall('VideoSDKMeeting', 'Notifications cleaned up on meeting left');
        } catch (error) {
          logError('VideoSDKMeeting', 'Error cleaning up notifications on meeting left', error);
        }
      };
      
      // Execute notification cleanup
      cleanupNotifications();
      
      props.onMeetingLeft?.();
      hasJoinedRef.current = false;
    },
    onParticipantJoined: () => updateParticipantCount(),
    onParticipantLeft: () => updateParticipantCount(),
    onError: async (error) => {
      logError('VideoSDKMeeting', 'Meeting error', error);

      // Enhanced error handling for WebSocket and VideoSDK errors
      const errorMessage = error?.message || String(error)
      const errorCode = error?.code

      // Check for WebSocket reconnection errors
      const isWebSocketError = errorMessage.includes('websocket') ||
                              errorMessage.includes('WebSocket') ||
                              errorMessage.includes('connection') ||
                              errorMessage.includes('reconnect')

      // Check for VideoSDK specific error codes
      const isVideoSDKError = errorCode && (
        Number(errorCode) >= 4001 && Number(errorCode) <= 5006 // VideoSDK error code range
      )

      if (isWebSocketError || isVideoSDKError) {
        logVideoSDK('VideoSDKMeeting', 'WebSocket/VideoSDK error detected, attempting recovery');

        try {
          // Import VideoSDKService dynamically to avoid circular dependency
          const { default: VideoSDKService } = await import('../../services/videosdk/VideoSDKService');
          const videoSDK = VideoSDKService.getInstance();

          // Attempt WebSocket reconnection
          const reconnected = await videoSDK.handleWebSocketReconnection(error, 1, 2);

          if (reconnected) {
            logVideoSDK('VideoSDKMeeting', 'WebSocket reconnection successful');
            // Don't set status to failed immediately, let the meeting retry
            return;
          } else {
            logWarn('VideoSDKMeeting', 'WebSocket reconnection failed');
          }
        } catch (reconnectError) {
          logError('VideoSDKMeeting', 'Error during WebSocket reconnection', reconnectError);
        }
      }

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
      logError('VideoSDKMeeting', 'Cannot join meeting: Missing meetingId or token');
      return;
    }
    if (hasJoinedRef.current) {
      logCall('VideoSDKMeeting', 'joinMeeting already called, skipping.');
      return;
    }
    try {
      logCall('VideoSDKMeeting', 'Joining meeting:', meetingConfig.meetingId);
      if (mMeeting && typeof mMeeting.join === 'function') {
        mMeeting.join();
        hasJoinedRef.current = true;
      } else {
        logError('VideoSDKMeeting', 'join method is not available on mMeeting object', mMeeting);
        setCallStatus('failed');
        props.onError?.(new Error('Join method not available'));
      }
    } catch (error) {
      logError('VideoSDKMeeting', 'Error joining meeting', error);
      setCallStatus('failed');
      props.onError?.(error);
    }
  }, [mMeeting, meetingConfig.meetingId, meetingConfig.token, props.onError]);

  // Meeting control handlers
  const handleToggleMic = () => {
    // Remove handleToggleMic and handleToggleWebcam implementations that call mMeeting.toggleMic/toggleWebcam directly
    // Instead, expose onToggleMic and onToggleWebcam as props, and call them when toggling is requested
    // Document that all toggling must go through CallMediaManager/UnifiedCallService
  };

  const handleToggleWebcam = () => {
    // Remove handleToggleMic and handleToggleWebcam implementations that call mMeeting.toggleMic/toggleWebcam directly
    // Instead, expose onToggleMic and onToggleWebcam as props, and call them when toggling is requested
    // Document that all toggling must go through CallMediaManager/UnifiedCallService
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !callSettings.speakerEnabled;
    switchAudioDevice(newSpeakerState ? 'SPEAKER_PHONE' : 'EARPIECE');
    setCallSettings(prev => ({ ...prev, speakerEnabled: newSpeakerState }));
  };

  const endCall = () => {
    if (mMeeting && typeof mMeeting.end === 'function') {
      logCall('VideoSDKMeeting', 'Ending meeting for all participants');
      mMeeting.end();
    }
  };

  // Update participant count when participants change
  useEffect(() => {
    updateParticipantCount();
  }, [mMeeting.participants, updateParticipantCount]);
  // Cleanup on unmount ONLY - no dependencies to prevent cleanup running on state changes
  useEffect(() => {
    return () => {
      logCall('VideoSDKMeeting', 'Component unmounting - cleaning up');
      stopDurationTimer();
      // Attempt to end meeting for all participants if still connected
      if (hasJoinedRef.current && mMeeting && typeof mMeeting.end === 'function') {
        try {
          logCall('VideoSDKMeeting', 'Ending meeting for all participants on unmount');
          mMeeting.end();
        } catch (e) {
          logError('VideoSDKMeeting', 'Error ending meeting on unmount, trying leave as fallback', e);
          // Fallback to leave if end fails
          if (typeof mMeeting.leave === 'function') {
            try {
              logCall('VideoSDKMeeting', 'Using leave as fallback on unmount');
              mMeeting.leave();
            } catch (leaveError) {
              logError('VideoSDKMeeting', 'Error with leave fallback on unmount', leaveError);
            }
          }
        }
      } else if (hasJoinedRef.current && mMeeting && typeof mMeeting.leave === 'function') {
        // Fallback to leave if end is not available
        try {
          logCall('VideoSDKMeeting', 'End method not available, using leave as fallback on unmount');
          mMeeting.leave();
        } catch (e) {
          logError('VideoSDKMeeting', 'Error leaving meeting on unmount', e);
        }
      }
      // Reset hasJoinedRef
      hasJoinedRef.current = false;
    };
  }, []); // Empty dependency array - only runs on unmount

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