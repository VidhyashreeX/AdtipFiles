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
import { navigateToTipCall } from '../../navigation/NavigationService';

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
  const hasRemoteParticipantRef = useRef<boolean>(false);
  const participantLeftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up meeting configuration
  logCall('VideoSDKMeeting', '⚙️ SETTING UP VIDEOSDK MEETING WITH EVENT HANDLERS');
  const mMeeting = useMeeting({
    onMeetingJoined: () => {
      logCall('VideoSDKMeeting', '🟢 MEETING JOINED EVENT FIRED');
      logCall('VideoSDKMeeting', 'Meeting joined successfully');
      setCallStatus('connected');
      // Don't start timer yet - wait for remote participant to join
      props.onMeetingJoined?.();
      hasJoinedRef.current = true;
      logCall('VideoSDKMeeting', '✅ Meeting joined setup complete', {
        hasJoinedRef: hasJoinedRef.current,
        callStatus: 'connected',
        note: 'Timer will start when remote participant joins'
      });
    },
    onMeetingLeft: () => {
      logCall('VideoSDKMeeting', '🔴 MEETING LEFT EVENT FIRED - CRITICAL DIAGNOSTIC');
      logCall('VideoSDKMeeting', '🔴 Meeting left - cleaning up notifications and navigating away');
      logCall('VideoSDKMeeting', '🔴 Current state before cleanup:', {
        hasJoinedRef: hasJoinedRef.current,
        callStatus: 'about to be ended',
        participantCount: mMeeting?.participants ? Object.keys(mMeeting.participants).length : 0
      });

      setCallStatus('ended');
      stopDurationTimer();
      hasRemoteParticipantRef.current = false; // Reset for next call

      // Comprehensive notification cleanup when meeting ends
      const cleanupNotifications = async () => {
        try {
          logCall('VideoSDKMeeting', '🔴 Starting notification cleanup');
          // Import notification service dynamically
          const { default: NotificationService } = await import('../../services/calling/NotificationService');
          const notificationService = NotificationService.getInstance();

          // Hide all call notifications
          await notificationService.hideAllNotifications();

          // Clear all notifications as fallback
          const notifee = await import('@notifee/react-native');
          await notifee.default.cancelAllNotifications();

          logCall('VideoSDKMeeting', '🔴 Notifications cleaned up on meeting left');
        } catch (error) {
          logError('VideoSDKMeeting', '🔴 Error cleaning up notifications on meeting left', error);
        }
      };

      // Execute notification cleanup
      cleanupNotifications();

      // Automatically navigate back to TipCall screen when meeting ends
      // This ensures that when one participant ends the call, all participants are taken back to the main screen
      logCall('VideoSDKMeeting', '🔴 Setting up auto-navigation timeout');
      setTimeout(() => {
        try {
          logCall('VideoSDKMeeting', '🔴 EXECUTING AUTO-NAVIGATION back to TipCall screen after meeting ended');
          navigateToTipCall();
          logCall('VideoSDKMeeting', '🔴 Auto-navigation call completed');
        } catch (error) {
          logError('VideoSDKMeeting', '🔴 Error auto-navigating after meeting left', error);
        }
      }, 500); // Small delay to ensure cleanup completes

      logCall('VideoSDKMeeting', '🔴 Calling props.onMeetingLeft callback');
      props.onMeetingLeft?.();
      hasJoinedRef.current = false;
      logCall('VideoSDKMeeting', '🔴 MEETING LEFT EVENT PROCESSING COMPLETE');
    },
    onParticipantJoined: (participant) => {
      logCall('VideoSDKMeeting', '🟢 PARTICIPANT JOINED EVENT FIRED', {
        participantId: participant?.id,
        displayName: participant?.displayName,
        localParticipantId: mMeeting?.localParticipant?.id
      });

      // Check if this is a remote participant (not the local participant)
      const isRemoteParticipant = participant?.id !== mMeeting?.localParticipant?.id;

      if (isRemoteParticipant) {
        logCall('VideoSDKMeeting', '🎯 Remote participant joined - stopping ringing');

        // Stop ringing for outgoing calls when remote participant joins
        if (props.onRemoteParticipantJoined) {
          props.onRemoteParticipantJoined(participant);
        }

        // Start timer when first remote participant joins
        if (!hasRemoteParticipantRef.current) {
          logCall('VideoSDKMeeting', '⏱️ Starting call timer - first remote participant joined');
          startTimeRef.current = Date.now();
          startDurationTimer();
          hasRemoteParticipantRef.current = true;
        }
      } else {
        logCall('VideoSDKMeeting', '👤 Local participant joined (self)');
      }

      updateParticipantCount();
      logCall('VideoSDKMeeting', '🟢 Participant joined processing complete');
    },
    onParticipantLeft: (participant) => {
      logCall('VideoSDKMeeting', '🟡 PARTICIPANT LEFT EVENT FIRED - CRITICAL DIAGNOSTIC', {
        participantId: participant?.id,
        displayName: participant?.displayName
      });
      updateParticipantCount();

      // Clear any existing timeout
      if (participantLeftTimeoutRef.current) {
        clearTimeout(participantLeftTimeoutRef.current);
        participantLeftTimeoutRef.current = null;
      }

      // Check if this was the other participant in a 1-on-1 call
      // If so, we should end the meeting for the remaining participant
      logCall('VideoSDKMeeting', '🟡 Setting up participant count check timeout');
      participantLeftTimeoutRef.current = setTimeout(() => {
        const currentParticipants = mMeeting?.participants;
        const participantCount = currentParticipants ? Object.keys(currentParticipants).length : 0;

        logCall('VideoSDKMeeting', '🟡 PARTICIPANT COUNT CHECK AFTER PARTICIPANT LEFT', {
          participantCount,
          hasJoined: hasJoinedRef.current,
          currentParticipants: currentParticipants ? Object.keys(currentParticipants) : [],
          meetingExists: !!mMeeting
        });

        // If only 1 participant remains (the local participant) and we're in an active call
        if (participantCount <= 1 && hasJoinedRef.current) {
          logCall('VideoSDKMeeting', '🟡 ONLY LOCAL PARTICIPANT REMAINS - ENDING MEETING FOR ALL');
          try {
            if (mMeeting && typeof mMeeting.end === 'function') {
              logCall('VideoSDKMeeting', '🟡 Calling mMeeting.end() to end meeting for all participants');
              mMeeting.end();
              logCall('VideoSDKMeeting', '🟡 mMeeting.end() call completed');
            } else if (mMeeting && typeof mMeeting.leave === 'function') {
              logCall('VideoSDKMeeting', '🟡 end() not available, calling mMeeting.leave() as fallback');
              mMeeting.leave();
              logCall('VideoSDKMeeting', '🟡 mMeeting.leave() call completed');
            } else {
              logError('VideoSDKMeeting', '🟡 Neither end() nor leave() methods available on meeting object');
            }
          } catch (error) {
            logError('VideoSDKMeeting', '🟡 Error ending meeting when last participant left', error);
          }
        } else {
          logCall('VideoSDKMeeting', '🟡 Not ending meeting - multiple participants still present or not joined', {
            participantCount,
            hasJoined: hasJoinedRef.current
          });
        }

        // Clear the timeout reference
        participantLeftTimeoutRef.current = null;
      }, 1000); // Small delay to ensure participant count is updated

      logCall('VideoSDKMeeting', '🟡 PARTICIPANT LEFT EVENT PROCESSING COMPLETE');
    },
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

  // Critical diagnostic: Log meeting object state
  useEffect(() => {
    logCall('VideoSDKMeeting', '🔍 MEETING OBJECT DIAGNOSTIC:', {
      meetingExists: !!mMeeting,
      meetingId: mMeeting?.meetingId,
      localParticipantId: mMeeting?.localParticipant?.id,
      participantCount: mMeeting?.participants ? Object.keys(mMeeting.participants).length : 0,
      hasEndMethod: !!(mMeeting && typeof mMeeting.end === 'function'),
      hasLeaveMethod: !!(mMeeting && typeof mMeeting.leave === 'function'),
      participants: mMeeting?.participants ? Object.keys(mMeeting.participants) : []
    });

    // Test if we can manually trigger events to see if the handlers work
    if (mMeeting) {
      logCall('VideoSDKMeeting', '🔍 Testing event handler registration...');

      // Add a small delay then test if we can access the meeting methods
      setTimeout(() => {
        logCall('VideoSDKMeeting', '🔍 DELAYED MEETING METHOD CHECK:', {
          canCallEnd: !!(mMeeting.end && typeof mMeeting.end === 'function'),
          canCallLeave: !!(mMeeting.leave && typeof mMeeting.leave === 'function'),
          meetingState: mMeeting.meetingId ? 'active' : 'inactive'
        });
      }, 1000);
    }
  }, [mMeeting, mMeeting?.participants]);

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

        // Update duration in call store
        const { useCallStore } = require('../../stores/callStoreSimplified');
        const { actions } = useCallStore.getState();
        actions.updateDuration(duration);
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
    logCall('VideoSDKMeeting', '🔥 END CALL METHOD CALLED - PERSON A ENDING CALL');
    logCall('VideoSDKMeeting', '🔥 Current meeting state:', {
      meetingExists: !!mMeeting,
      hasEndMethod: !!(mMeeting && typeof mMeeting.end === 'function'),
      hasJoined: hasJoinedRef.current,
      participantCount: mMeeting?.participants ? Object.keys(mMeeting.participants).length : 0,
      participants: mMeeting?.participants ? Object.keys(mMeeting.participants) : []
    });

    if (mMeeting && typeof mMeeting.end === 'function') {
      logCall('VideoSDKMeeting', '🔥 CALLING mMeeting.end() - This should trigger onMeetingLeft for all participants');
      try {
        mMeeting.end();
        logCall('VideoSDKMeeting', '🔥 mMeeting.end() call completed successfully');
      } catch (error) {
        logError('VideoSDKMeeting', '🔥 Error calling mMeeting.end()', error);
      }
    } else {
      logError('VideoSDKMeeting', '🔥 Cannot end call - meeting object or end method not available', {
        meetingExists: !!mMeeting,
        endMethodExists: !!(mMeeting && typeof mMeeting.end === 'function')
      });
    }
  };

  // Expose meeting object for external access (e.g., CallController)
  const getMeetingObject = () => {
    return mMeeting;
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
      hasRemoteParticipantRef.current = false; // Reset for next call

      // Clear participant left timeout
      if (participantLeftTimeoutRef.current) {
        clearTimeout(participantLeftTimeoutRef.current);
        participantLeftTimeoutRef.current = null;
      }

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
    getMeetingObject,
  };
};