import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  AppState,
} from 'react-native';
import {
  useMeeting,
  useParticipant,
  MeetingProvider,
  RTCView,
  MediaStream,
  usePubSub,
} from '@videosdk.live/react-native-sdk';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { styles as importedStyles, layoutStyles, localFallbackColors } from './TipCallScreenStyles';
import { deactivateVideoSDKRoomViaBackend } from '../../helpers/CallHelper';
import CallKeepService from '../../services/CallKeepService';

// Define navigation stack param list (subset for this screen)
type RootStackParamList = {
  Meeting: {
    meetingId: string;
    token: string;
    callType: 'voice' | 'video';
    displayName: string;
    isInitiator?: boolean;
    recipientName?: string;
  };
  TipCall: { initialCallNotificationData?: any } | undefined;
};

type MeetingScreenRouteProp = RouteProp<RootStackParamList, 'Meeting'>;
type MeetingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define meeting states (since Constants.MeetingStates doesn't exist)
const MEETING_STATES = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  FAILED: 'FAILED',
  DISCONNECTED: 'DISCONNECTED',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED',
} as const;

// Define recording states
const RECORDING_STATES = {
  RECORDING_STARTING: 'RECORDING_STARTING',
  RECORDING_STARTED: 'RECORDING_STARTED',
  RECORDING_STOPPING: 'RECORDING_STOPPING',
  RECORDING_STOPPED: 'RECORDING_STOPPED',
  RECORDING_FAILED: 'RECORDING_FAILED',
} as const;

// ParticipantView component
const ParticipantView: React.FC<{
  participantId: string;
  isActiveSpeaker?: boolean;
}> = ({ participantId, isActiveSpeaker = false }) => {
  const {
    webcamStream,
    webcamOn,
    isLocal,
    displayName,
    micOn,
    screenShareStream,
    screenShareOn,
  } = useParticipant(participantId);

  const streamUrl = useMemo(() => {
    if (screenShareOn && screenShareStream?.track) {
      try {
        return new MediaStream([screenShareStream.track]).toURL();
      } catch (error) {
        console.error('Error creating screen share stream URL:', error);
        return null;
      }
    }
    
    if (webcamStream?.track && webcamOn) {
      try {
        return new MediaStream([webcamStream.track]).toURL();
      } catch (error) {
        console.error('Error creating webcam stream URL:', error);
        return null;
      }
    }
    
    return null;
  }, [webcamStream, webcamOn, screenShareStream, screenShareOn]);

  return (
    <View
      style={[
        localStyles.participantContainer,
        isActiveSpeaker && localStyles.activeSpeakerBorder,
      ]}
    >
      {streamUrl ? (
        <RTCView
          streamURL={streamUrl}
          objectFit="cover"
          style={localStyles.participantVideo}
          mirror={isLocal && !screenShareOn}
          zOrder={isActiveSpeaker ? 1 : 0}
        />
      ) : (
        <View style={localStyles.noVideoContainer}>
          <Icon name="user" size={48} color="white" />
          <Text style={localStyles.noMediaText}>
            {isLocal ? 'You' : displayName || 'Participant'}
          </Text>
        </View>
      )}
      
      <View style={localStyles.participantInfo}>
        <View style={localStyles.micIndicator}>
          <Icon
            name={micOn ? 'mic' : 'mic-off'}
            size={16}
            color={micOn ? 'green' : 'red'}
          />
        </View>
        
        {screenShareOn && (
          <View style={localStyles.screenShareIndicator}>
            <Icon name="cast" size={16} color="blue" />
          </View>
        )}
        
        {isActiveSpeaker && (
          <View style={localStyles.activeSpeakerIndicator}>
            <Icon name="volume-2" size={16} color="yellow" />
          </View>
        )}
        
        <Text style={localStyles.participantName}>
          {isLocal ? 'You' : displayName || 'Participant'}
        </Text>
      </View>
    </View>
  );
};

// VideoGrid component
const VideoGrid: React.FC<{
  participants: Map<string, any>;
  activeSpeakerId: string | null;
}> = ({ participants, activeSpeakerId }) => {
  const participantArray = Array.from(participants.keys());

  if (participantArray.length === 0) {
    return (
      <View style={localStyles.noVideoContainer}>
        <Text style={localStyles.noMediaText}>Waiting for participants...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles?.videoGridContainer || localStyles.videoGridContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {participantArray.map((participantId) => (
          <ParticipantView
            key={participantId}
            participantId={participantId}
            isActiveSpeaker={activeSpeakerId === participantId}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// MeetingContainer component
const MeetingContainerInternal: React.FC<{
  onEndCallInternal: () => void;
  callType: 'voice' | 'video';
  meetingIdPassed: string;
}> = ({ onEndCallInternal, callType, meetingIdPassed }) => {
  const [joined, setJoined] = useState<"IDLE" | "JOINING" | "JOINED">("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [meetingConnectionState, setMeetingConnectionState] = useState<string>("IDLE");
  const [recordingState, setRecordingState] = useState<string>("RECORDING_STOPPED");
  const [networkQuality, setNetworkQuality] = useState<{
    [participantId: string]: { quality: number };
  }>({});
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    participants,
    localMicOn,
    localWebcamOn,
    localScreenShareOn,
    startRecording,
    stopRecording,
  } = useMeeting({
    onMeetingJoined: () => {
      console.log('[MeetingScreen] Event: onMeetingJoined');
      setJoined("JOINED");
      setMeetingConnectionState(MEETING_STATES.CONNECTED);
      setError(null);
      setReconnectAttempts(0);
      setIsReconnecting(false);
      
      // Notify CallKeep that call is connected
      try {
        const callKeepService = CallKeepService.getInstance();
        callKeepService.setCallConnected();
      } catch (callKeepError) {
        console.error('[MeetingScreen] CallKeep error:', callKeepError);
      }
    },
    onMeetingLeft: () => {
      console.log('[MeetingScreen] Event: onMeetingLeft');
      setMeetingConnectionState(MEETING_STATES.DISCONNECTED);
      setIsReconnecting(false);
      onEndCallInternal();
    },
    onParticipantJoined: (participant) => {
      console.log('[MeetingScreen] Event: onParticipantJoined - ID:', participant.id);
    },
    onParticipantLeft: (participant) => {
      console.log('[MeetingScreen] Event: onParticipantLeft - ID:', participant.id);
    },
    onSpeakerChanged: (speakerId) => {
      console.log('[MeetingScreen] Event: onSpeakerChanged - ID:', speakerId);
      setActiveSpeakerId(speakerId);
    },
    onError: (errorData) => {
      console.error('[MeetingScreen] Event: onError - Code:', errorData.code, 'Message:', errorData.message);
      
      // Handle WebSocket connection errors
      if (errorData.message && errorData.message.toLowerCase().includes('websocket')) {
        console.log('[MeetingScreen] WebSocket error detected, attempting to handle gracefully');
        setError(`Connection issue: ${errorData.message}`);
        setIsReconnecting(true);
        
        // Don't immediately fail - try to reconnect
        if (reconnectAttempts < 3) {
          console.log(`[MeetingScreen] Attempting reconnect ${reconnectAttempts + 1}/3`);
          setReconnectAttempts(prev => prev + 1);
          
          // Delay reconnect attempt
          setTimeout(() => {
            if (joined !== "JOINED") {
              console.log('[MeetingScreen] Retrying connection...');
              joinMeeting();
            }
          }, 2000 * (reconnectAttempts + 1)); // Exponential backoff
        } else {
          console.log('[MeetingScreen] Max reconnect attempts reached');
          setMeetingConnectionState(MEETING_STATES.FAILED);
          setIsReconnecting(false);
          Alert.alert(
            "Connection Failed", 
            "Unable to establish stable connection. Please try again.",
            [
              { text: "Retry", onPress: () => {
                setReconnectAttempts(0);
                setError(null);
                joinMeeting();
              }},
              { text: "End Call", onPress: onEndCallInternal }
            ]
          );
        }
      } else {
        // Handle other errors normally
        setError(`Error: ${errorData.message} (Code: ${errorData.code})`);
        setMeetingConnectionState(MEETING_STATES.FAILED);
        setIsReconnecting(false);
        Alert.alert("Meeting Error", errorData.message);
      }
    },
    onMeetingStateChanged: (data) => {
      console.log('[MeetingScreen] Event: onMeetingStateChanged - New State:', data.state);
      setMeetingConnectionState(data.state);
      
      // Handle different connection states
      switch (data.state) {
        case MEETING_STATES.CONNECTING:
          console.log('[MeetingScreen] Meeting is connecting...');
          setError(null);
          break;
          
        case MEETING_STATES.CONNECTED:
          console.log('[MeetingScreen] Meeting connected successfully');
          setError(null);
          setReconnectAttempts(0);
          setIsReconnecting(false);
          break;
          
        case MEETING_STATES.FAILED:
          console.log('[MeetingScreen] Meeting connection failed');
          setError("Meeting connection failed.");
          setIsReconnecting(false);
          break;
          
        case MEETING_STATES.DISCONNECTED:
          console.log('[MeetingScreen] Meeting disconnected');
          setError("Meeting disconnected.");
          setIsReconnecting(false);
          break;
          
        default:
          console.log(`[MeetingScreen] Unknown meeting state: ${data.state}`);
      }
    },
    onRecordingStateChanged: (data) => {
      console.log('[MeetingScreen] Event: onRecordingStateChanged - New State:', data.status);
      setRecordingState(data.status);
      
      if (data.status === RECORDING_STATES.RECORDING_STARTED) {
        Alert.alert("Recording", "Recording has started.");
      } else if (data.status === RECORDING_STATES.RECORDING_STOPPED) {
        Alert.alert("Recording", "Recording has stopped.");
      } else if (data.status === RECORDING_STATES.RECORDING_FAILED) {
        Alert.alert("Recording Error", "Recording failed");
      }
    },
    // Add connection management callbacks
    onWebcamRequested: (data) => {
      console.log('[MeetingScreen] Webcam requested:', data);
    },
    onMicRequested: (data) => {
      console.log('[MeetingScreen] Mic requested:', data);
    },
  });

  // Handle app state changes to manage connection
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log(`[MeetingScreen] App state changed to: ${nextAppState}`);
      
      if (nextAppState === 'active' && joined === "JOINED") {
        // App became active, check connection
        console.log('[MeetingScreen] App became active, checking meeting connection');
      } else if (nextAppState === 'background' && joined === "JOINED") {
        // App went to background during call
        console.log('[MeetingScreen] App went to background during call');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [joined]);

  const { publish: publishNetworkQuality } = usePubSub("NETWORK_QUALITY", {
    onMessageReceived: (message) => {
      try {
        if (message && message.senderId && message.message && typeof message.message === 'object') {
          const quality = message.message.quality || 5;
          setNetworkQuality(prev => ({
            ...prev,
            [message.senderId]: { quality }
          }));
        }
      } catch (error) {
        console.error('[MeetingScreen] Error processing network quality message:', error);
      }
    },
    onError: (error) => {
      console.error('[MeetingScreen] PubSub error:', error);
    },
  });

  const checkNetworkQuality = useCallback(() => {
    const qualities = Object.values(networkQuality).map(q => q.quality);
    const averageQuality = qualities.length > 0 ? 
      Math.round(qualities.reduce((sum, q) => sum + q, 0) / qualities.length) : 5;
    
    const qualityText = averageQuality >= 4 ? 'Excellent' :
                       averageQuality >= 3 ? 'Good' :
                       averageQuality >= 2 ? 'Fair' : 'Poor';
    
    return { score: averageQuality, text: qualityText };
  }, [networkQuality]);

  const joinMeeting = useCallback(() => {
    if (joined === "IDLE" || meetingConnectionState === MEETING_STATES.FAILED || meetingConnectionState === MEETING_STATES.DISCONNECTED) {
      console.log('[MeetingScreen] Joining meeting...');
      setJoined("JOINING");
      setError(null);
      setMeetingConnectionState(MEETING_STATES.CONNECTING);
      setIsReconnecting(false);
      
      try {
        join();
      } catch (joinError) {
        console.error('[MeetingScreen] Error joining meeting:', joinError);
        setError('Failed to join meeting');
        setMeetingConnectionState(MEETING_STATES.FAILED);
        setJoined("IDLE");
      }
    }
  }, [join, joined, meetingConnectionState]);

  const leaveMeetingAndNotify = useCallback(() => {
    console.log('[MeetingScreen] Leaving meeting...');
    setIsReconnecting(false);
    try {
      leave();
    } catch (leaveError) {
      console.error('[MeetingScreen] Error leaving meeting:', leaveError);
      // Still call onEndCallInternal even if leave fails
      onEndCallInternal();
    }
  }, [leave, onEndCallInternal]);

  const handleMicToggle = useCallback(() => {
    try {
      toggleMic();
    } catch (error) {
      console.error('[MeetingScreen] Error toggling mic:', error);
      Alert.alert('Error', 'Failed to toggle microphone');
    }
  }, [toggleMic]);

  const handleCameraToggle = useCallback(() => {
    try {
      toggleWebcam();
    } catch (error) {
      console.error('[MeetingScreen] Error toggling camera:', error);
      Alert.alert('Error', 'Failed to toggle camera');
    }
  }, [toggleWebcam]);

  const handleScreenShareToggle = useCallback(() => {
    try {
      toggleScreenShare();
    } catch (error) {
      console.error('[MeetingScreen] Error toggling screen share:', error);
      Alert.alert('Error', 'Failed to toggle screen share');
    }
  }, [toggleScreenShare]);

  const handleStartRecording = useCallback(() => {
    if (startRecording) {
      try {
        startRecording();
      } catch (error) {
        console.error('[MeetingScreen] Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording.');
      }
    } else {
      Alert.alert('Feature Not Available', 'Recording is not available.');
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    if (stopRecording) {
      try {
        stopRecording();
      } catch (error) {
        console.error('[MeetingScreen] Error stopping recording:', error);
        Alert.alert('Error', 'Failed to stop recording.');
      }
    }
  }, [stopRecording]);

  // Auto-join meeting on mount with error handling
  useEffect(() => {
    let joinTimeout: NodeJS.Timeout;
    
    const attemptJoin = () => {
      console.log('[MeetingScreen] Attempting to join meeting on mount');
      joinMeeting();
      
      // Set a timeout to detect if join is taking too long
      joinTimeout = setTimeout(() => {
        if (joined === "JOINING") {
          console.log('[MeetingScreen] Join attempt timed out');
          setError('Connection timeout - please try again');
          setJoined("IDLE");
          setMeetingConnectionState(MEETING_STATES.FAILED);
        }
      }, 30000); // 30 second timeout
    };
    
    attemptJoin();
    
    return () => {
      if (joinTimeout) {
        clearTimeout(joinTimeout);
      }
      
      if (joined === "JOINED" || joined === "JOINING") {
        console.log('[MeetingScreen] Leaving meeting on component unmount...');
        try {
          leave();
        } catch (error) {
          console.error('[MeetingScreen] Error leaving on unmount:', error);
        }
      }
    };
  }, []); // Empty dependency array for mount only

  const networkInfo = checkNetworkQuality();

  // Error state with reconnection info
  if (error && joined !== "JOINED") {
    return (
      <SafeAreaView style={localStyles.callOverlay}>
        <View style={localStyles.errorContainer}>
          <Text style={localStyles.errorText}>Meeting Error: {error}</Text>
          <Text style={localStyles.errorText}>Connection State: {meetingConnectionState}</Text>
          
          {isReconnecting && (
            <>
              <ActivityIndicator size="small" color="orange" style={{ marginVertical: 10 }} />
              <Text style={localStyles.joiningText}>
                Reconnecting... (Attempt {reconnectAttempts}/3)
              </Text>
            </>
          )}
          
          {!isReconnecting && (meetingConnectionState === MEETING_STATES.FAILED || meetingConnectionState === MEETING_STATES.DISCONNECTED) && (
            <TouchableOpacity style={localStyles.retryButton} onPress={joinMeeting}>
              <Text style={localStyles.retryButtonText}>Retry Join</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[localStyles.endCallButton, { marginTop: 10 }]} onPress={onEndCallInternal}>
            <Text style={localStyles.endCallButtonText}>End Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Connecting/Joining state with reconnection info
  if (joined !== "JOINED") {
    return (
      <SafeAreaView style={localStyles.callOverlay}>
        <View style={localStyles.joiningContainer}>
          <ActivityIndicator size="large" color={localFallbackColors.primary} />
          <Text style={localStyles.joiningText}>
            {isReconnecting ? "Reconnecting..." :
             meetingConnectionState === MEETING_STATES.CONNECTING ? "Connecting to meeting..." : 
             meetingConnectionState === MEETING_STATES.FAILED ? "Failed to connect." : 
             "Preparing to join..."}
          </Text>
          <Text style={localStyles.joiningText}>Status: {meetingConnectionState}</Text>
          
          {isReconnecting && (
            <Text style={localStyles.joiningText}>
              Attempt {reconnectAttempts}/3
            </Text>
          )}
          
          {error && <Text style={localStyles.errorTextSmall}>{error}</Text>}
          
          {(meetingConnectionState === MEETING_STATES.FAILED && joined !== "JOINED" && !isReconnecting) && (
            <TouchableOpacity style={[localStyles.retryButton, { marginTop: 20 }]} onPress={joinMeeting}>
              <Text style={localStyles.retryButtonText}>Retry Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main meeting UI
  return (
    <SafeAreaView style={localStyles.callOverlay}>
      {/* Status Bar */}
      <View style={localStyles.statusBar}>
        <Text style={localStyles.callStatusText}>
          {callType === 'video' ? 'Video' : 'Voice'} Call | ID: {meetingIdPassed}
        </Text>
        <Text style={[
          localStyles.connectionStatus,
          meetingConnectionState === MEETING_STATES.CONNECTED ? localStyles.connected : 
          meetingConnectionState === MEETING_STATES.CONNECTING ? localStyles.connecting : 
          localStyles.disconnected
        ]}>
          Connection: {meetingConnectionState}
        </Text>
        
        {activeSpeakerId && participants.get(activeSpeakerId) && (
          <Text style={localStyles.activeSpeakerText}>
            Speaker: {participants.get(activeSpeakerId)?.displayName}
          </Text>
        )}
        
        <Text style={localStyles.networkQualityText}>
          Avg. Network: {networkInfo.text} ({networkInfo.score}/5)
        </Text>
        
        {(recordingState !== RECORDING_STATES.RECORDING_STOPPED && 
          recordingState !== 'RECORDING_STOPPED') && (
          <Text style={localStyles.recordingStatusText}>Recording: {recordingState}</Text>
        )}
        
        {error && <Text style={localStyles.errorTextSmall}>{error}</Text>}
      </View>

      {/* Video Container */}
      {callType === 'video' && (
        <View style={localStyles.videoContainer}>
          <VideoGrid participants={participants} activeSpeakerId={activeSpeakerId} />
        </View>
      )}

      {/* Call Controls */}
      <View style={localStyles.callControls}>
        <TouchableOpacity
          style={[localStyles.controlButton, { backgroundColor: localMicOn ? 'rgba(255,255,255,0.2)' : 'red' }]}
          onPress={handleMicToggle}
        >
          <Icon name={localMicOn ? "mic" : "mic-off"} size={20} color="white" />
        </TouchableOpacity>

        {callType === 'video' && (
          <>
            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: localWebcamOn ? 'rgba(255,255,255,0.2)' : 'red' }]}
              onPress={handleCameraToggle}
            >
              <Icon name={localWebcamOn ? "video" : "video-off"} size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: localScreenShareOn ? 'green' : 'rgba(255,255,255,0.2)' }]}
              onPress={handleScreenShareToggle}
            >
              <Icon name={localScreenShareOn ? "cast" : "share-2"} size={18} color="white" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={localStyles.endCallButton} onPress={leaveMeetingAndNotify}>
          <Icon name="phone-off" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Recording Controls */}
      {(startRecording || stopRecording) && (
        <View style={localStyles.recordingControls}>
          {startRecording && (recordingState === RECORDING_STATES.RECORDING_STOPPED || recordingState === 'RECORDING_STOPPED') && (
            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: 'blue' }]}
              onPress={handleStartRecording}
            >
              <Icon name="play-circle" size={20} color="white" />
              <Text style={localStyles.controlButtonTextSmall}>Rec</Text>
            </TouchableOpacity>
          )}
          
          {stopRecording && (recordingState === RECORDING_STATES.RECORDING_STARTED || recordingState === RECORDING_STATES.RECORDING_STARTING) && (
            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: 'orange' }]}
              onPress={handleStopRecording}
            >
              <Icon name="stop-circle" size={20} color="white" />
              <Text style={localStyles.controlButtonTextSmall}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

// Main MeetingScreen component
const MeetingScreen: React.FC = () => {
  const route = useRoute<MeetingScreenRouteProp>();
  const navigation = useNavigation<MeetingNavigationProp>();
  const { meetingId, token, callType, displayName, isInitiator } = route.params;

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          
          if (
            granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            Alert.alert(
              "Permissions Required",
              "Camera and Microphone permissions are needed for video calls."
            );
          }
        } catch (err) {
          console.warn('[MeetingScreen] Permission request error:', err);
        }
      }
    };
    
    requestPermissions();
  }, []);

  const handleEndCall = useCallback(async () => {
    console.log(`[MeetingScreen] Call ended for meeting: ${meetingId}. Is initiator: ${isInitiator}`);
    
    // End CallKeep call
    const callKeepService = CallKeepService.getInstance();
    await callKeepService.endCall();
    
    // Deactivate room when call ends
    if (meetingId) {
      try {
        const deactivated = await deactivateVideoSDKRoomViaBackend(meetingId);
        console.log(`[MeetingScreen] Room deactivation status for ${meetingId}:`, deactivated);
      } catch (error) {
        console.error('[MeetingScreen] Error deactivating room:', error);
      }
    }
    
    // Navigate back
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'TipCall' }],
      });
    }
  }, [navigation, meetingId, isInitiator]);

  // Validation
  if (!token || !meetingId) {
    return (
      <SafeAreaView style={localStyles.callOverlay}>
        <View style={localStyles.joiningContainer}>
          <Icon name="alert-circle" size={48} color={localFallbackColors.danger} />
          <Text style={localStyles.joiningText}>Error: Missing Meeting ID or Token.</Text>
          <TouchableOpacity style={localStyles.endCallButton} onPress={() => navigation.goBack()}>
            <Text style={localStyles.endCallButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: callType === 'video',
        name: displayName || 'Participant',
        participantId: Math.random().toString(36).substring(7),
      }}
      token={token}
      joinWithoutUserInteraction={false}
    >
      <MeetingContainerInternal
        onEndCallInternal={handleEndCall}
        callType={callType}
        meetingIdPassed={meetingId}
      />
    </MeetingProvider>
  );
};

// Local styles combining imported styles
const localStyles = StyleSheet.create({
  ...importedStyles,
  // Add any missing styles that might be needed
  videoGridContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  controlButtonTextSmall: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  connecting: {
    color: 'orange',
  },
  errorTextSmall: {
    color: localFallbackColors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  callOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  statusBar: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  callStatusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  connectionStatus: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  connected: {
    color: 'green',
  },
  disconnected: {
    color: 'red',
  },
  activeSpeakerText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  networkQualityText: {
    color: 'lightblue',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  recordingStatusText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 15,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joiningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  joiningText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: localFallbackColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  endCallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantContainer: {
    flex: 1,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    minHeight: 150,
  },
  activeSpeakerBorder: {
    borderWidth: 3,
    borderColor: 'yellow',
  },
  participantVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  noMediaText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  participantInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  micIndicator: {
    marginRight: 4,
  },
  screenShareIndicator: {
    marginRight: 4,
  },
  activeSpeakerIndicator: {
    marginRight: 4,
  },
  participantName: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
});

export default MeetingScreen;