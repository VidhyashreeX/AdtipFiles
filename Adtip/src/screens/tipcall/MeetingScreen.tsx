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
} from 'react-native';
import {
  useMeeting,
  useParticipant,
  MeetingProvider,
  RTCView,
  MediaStream,
  Constants,
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
  const [audioDevices, setAudioDevices] = useState<any[]>([]);
  const [videoDevices, setVideoDevices] = useState<any[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(null);
  const [meetingConnectionState, setMeetingConnectionState] = useState<string>("IDLE");
  const [recordingState, setRecordingState] = useState<string>("IDLE");
  const [hlsState, setHlsState] = useState<string>("IDLE");
  const [networkQuality, setNetworkQuality] = useState<{
    [participantId: string]: { quality: number };
  }>({});

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
    meetingId: currentMeetingIdFromSDK,
    getAudioDevices,
    getVideoDevices,
    changeAudioDevice,
    changeVideoDevice,
    startRecording,
    stopRecording,
    setQuality,
  } = useMeeting({
    onMeetingJoined: () => {
      console.log('[MeetingScreen] Event: onMeetingJoined');
      setJoined("JOINED");
      setMeetingConnectionState(Constants.MeetingStates.CONNECTED);
      setError(null);
      loadDevices();
      
      // Notify CallKeep that call is connected
      const callKeepService = CallKeepService.getInstance();
      callKeepService.setCallConnected();
    },
    onMeetingLeft: () => {
      console.log('[MeetingScreen] Event: onMeetingLeft');
      setMeetingConnectionState(Constants.MeetingStates.DISCONNECTED);
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
      setError(`Error: ${errorData.message} (Code: ${errorData.code})`);
      setMeetingConnectionState(Constants.MeetingStates.FAILED);
      
      // Handle specific error types
      switch (errorData.code) {
        case Constants.ErrorCodes.ERR_INVALID_TOKEN:
          Alert.alert("Error", "Invalid token. Please try rejoining.");
          break;
        case Constants.ErrorCodes.ERR_MEETING_NOT_JOINED:
          Alert.alert("Error", "You are not joined in the meeting. Please try rejoining.");
          break;
        case Constants.ErrorCodes.ERR_NO_INTERNET:
          Alert.alert("Network Error", "No internet connection. Please check your network and try again.");
          break;
        default:
          Alert.alert("Meeting Error", errorData.message);
      }
    },
    onMeetingStateChanged: (state) => {
      console.log('[MeetingScreen] Event: onMeetingStateChanged - New State:', state);
      setMeetingConnectionState(state);
      if (state === Constants.MeetingStates.FAILED || state === Constants.MeetingStates.DISCONNECTED) {
        setError(state === Constants.MeetingStates.FAILED ? "Meeting connection failed." : "Meeting disconnected.");
      }
    },
    onRecordingStateChanged: (data) => {
      console.log('[MeetingScreen] Event: onRecordingStateChanged - New State:', data.status);
      setRecordingState(data.status);
      
      if (data.status === Constants.RecordingStates.RECORDING_STARTED) {
        Alert.alert("Recording", "Recording has started.");
      } else if (data.status === Constants.RecordingStates.RECORDING_STOPPED) {
        Alert.alert("Recording", "Recording has stopped.");
      } else if (data.status === Constants.RecordingStates.RECORDING_FAILED) {
        Alert.alert("Recording Error", `Recording failed: ${data.error?.message || 'Unknown error'}`);
      }
    },
    onHlsStateChanged: (data) => {
      console.log('[MeetingScreen] Event: onHlsStateChanged - New State:', data.status);
      setHlsState(data.status);
    },
    onMicStreamEnabled: () => {
      console.log('[MeetingScreen] Event: onMicStreamEnabled (Local Mic ON)');
    },
    onMicStreamDisabled: () => {
      console.log('[MeetingScreen] Event: onMicStreamDisabled (Local Mic OFF)');
    },
    onWebcamStreamEnabled: () => {
      console.log('[MeetingScreen] Event: onWebcamStreamEnabled (Local Webcam ON)');
    },
    onWebcamStreamDisabled: () => {
      console.log('[MeetingScreen] Event: onWebcamStreamDisabled (Local Webcam OFF)');
    },
    onScreenShareStreamEnabled: () => {
      console.log('[MeetingScreen] Event: onScreenShareStreamEnabled (Local Screen Share ON)');
    },
    onScreenShareStreamDisabled: () => {
      console.log('[MeetingScreen] Event: onScreenShareStreamDisabled (Local Screen Share OFF)');
    },
  });

  const { publish: publishNetworkQuality } = usePubSub("NETWORK_QUALITY", {
    onMessageReceived: (message) => {
      try {
        if (message && message.senderId && message.message && typeof message.message.quality === 'number') {
          setNetworkQuality(prev => ({
            ...prev,
            [message.senderId]: { quality: message.message.quality }
          }));
        }
      } catch (error) {
        console.error('[MeetingScreen] Error processing network quality message:', error);
      }
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

  const loadDevices = useCallback(async () => {
    try {
      if (getAudioDevices && getVideoDevices) {
        console.log('[MeetingScreen] Loading available devices...');
        const audio = await getAudioDevices();
        const video = await getVideoDevices();
        
        setAudioDevices(audio || []);
        setVideoDevices(video || []);
        
        if (audio && audio.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audio[0].deviceId);
        }
        if (video && video.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(video[0].deviceId);
        }
      }
    } catch (error) {
      console.error('[MeetingScreen] Error loading devices:', error);
    }
  }, [getAudioDevices, getVideoDevices, selectedAudioDevice, selectedVideoDevice]);

  const joinMeeting = useCallback(() => {
    if (joined === "IDLE" || meetingConnectionState === Constants.MeetingStates.FAILED || meetingConnectionState === Constants.MeetingStates.DISCONNECTED) {
      console.log('[MeetingScreen] Joining meeting...');
      setJoined("JOINING");
      setError(null);
      setMeetingConnectionState(Constants.MeetingStates.CONNECTING);
      join();
    }
  }, [join, joined, meetingConnectionState]);

  const leaveMeetingAndNotify = useCallback(() => {
    console.log('[MeetingScreen] Leaving meeting...');
    leave();
  }, [leave]);

  const handleAudioDeviceChange = useCallback(async (deviceId: string) => {
    try {
      if (changeAudioDevice) {
        await changeAudioDevice(deviceId);
        setSelectedAudioDevice(deviceId);
        console.log('[MeetingScreen] Audio device changed to:', deviceId);
      }
    } catch (error) {
      console.error('[MeetingScreen] Error changing audio device:', error);
      Alert.alert('Audio Device Error', 'Failed to change audio device.');
    }
  }, [changeAudioDevice]);

  const handleVideoDeviceChange = useCallback(async (deviceId: string) => {
    try {
      if (changeVideoDevice) {
        await changeVideoDevice(deviceId);
        setSelectedVideoDevice(deviceId);
        console.log('[MeetingScreen] Video device changed to:', deviceId);
      }
    } catch (error) {
      console.error('[MeetingScreen] Error changing video device:', error);
      Alert.alert('Video Device Error', 'Failed to change video device.');
    }
  }, [changeVideoDevice]);

  const handleStartRecording = useCallback(async () => {
    if (!startRecording) {
      Alert.alert('Feature Not Available', 'Recording is not available.');
      return;
    }
    
    try {
      const recordingConfig = {
        layout: { type: 'GRID', priority: 'SPEAKER', gridSize: 4 },
        theme: 'DARK',
        mode: callType === 'video' ? Constants.RecordingModes.VIDEO_AND_AUDIO : Constants.RecordingModes.AUDIO,
        quality: Constants.RecordingQuality.HIGH,
      };
      await startRecording(undefined, recordingConfig);
    } catch (error) {
      console.error('[MeetingScreen] Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  }, [startRecording, callType]);

  const handleStopRecording = useCallback(async () => {
    if (!stopRecording) {
      return;
    }
    
    try {
      await stopRecording();
    } catch (error) {
      console.error('[MeetingScreen] Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  }, [stopRecording]);

  const adjustVideoQuality = useCallback(async (qualityPreset: "low" | "medium" | "high" | null) => {
    if (setQuality) {
      try {
        console.log(`[MeetingScreen] Attempting to set quality to: ${qualityPreset}`);
        await setQuality(qualityPreset);
        Alert.alert("Video Quality", `Video quality set to ${qualityPreset || 'auto'}.`);
      } catch (error) {
        console.error("[MeetingScreen] Error setting video quality:", error);
        Alert.alert("Error", "Could not set video quality.");
      }
    } else {
      console.warn("[MeetingScreen] setQuality function is not available.");
    }
  }, [setQuality]);

  // Auto-join meeting on mount
  useEffect(() => {
    joinMeeting();
    
    return () => {
      if (joined === "JOINED" || joined === "JOINING") {
        console.log('[MeetingScreen] Leaving meeting on component unmount...');
        leave();
      }
    };
  }, [joinMeeting, leave, joined]);

  // Load devices after joining
  useEffect(() => {
    if (joined === "JOINED") {
      loadDevices();
    }
  }, [joined, loadDevices]);

  const networkInfo = checkNetworkQuality();

  // Error state
  if (error && joined !== "JOINED") {
    return (
      <SafeAreaView style={localStyles.callOverlay}>
        <View style={localStyles.errorContainer}>
          <Text style={localStyles.errorText}>Meeting Error: {error}</Text>
          <Text style={localStyles.errorText}>Connection State: {meetingConnectionState}</Text>
          
          {(meetingConnectionState === Constants.MeetingStates.FAILED || meetingConnectionState === Constants.MeetingStates.DISCONNECTED) && (
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

  // Connecting/Joining state
  if (joined !== "JOINED") {
    return (
      <SafeAreaView style={localStyles.callOverlay}>
        <View style={localStyles.joiningContainer}>
          <ActivityIndicator size="large" color={localFallbackColors.primary} />
          <Text style={localStyles.joiningText}>
            {meetingConnectionState === Constants.MeetingStates.CONNECTING ? "Connecting to meeting..." : 
             meetingConnectionState === Constants.MeetingStates.FAILED ? "Failed to connect." : 
             "Preparing to join..."}
          </Text>
          <Text style={localStyles.joiningText}>Status: {meetingConnectionState}</Text>
          {error && <Text style={localStyles.errorTextSmall}>{error}</Text>}
          
          {(meetingConnectionState === Constants.MeetingStates.FAILED && joined !== "JOINED") && (
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
          meetingConnectionState === Constants.MeetingStates.CONNECTED ? localStyles.connected : 
          meetingConnectionState === Constants.MeetingStates.CONNECTING ? localStyles.connecting : 
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
        
        {(recordingState !== Constants.RecordingStates.RECORDING_IDLE && 
          recordingState !== Constants.RecordingStates.RECORDING_STOPPED) && (
          <Text style={localStyles.recordingStatusText}>Recording: {recordingState}</Text>
        )}
        
        {(hlsState !== Constants.HlsStates.HLS_IDLE && 
          hlsState !== Constants.HlsStates.HLS_STOPPED) && (
          <Text style={localStyles.hlsStatusText}>HLS: {hlsState}</Text>
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
          onPress={toggleMic}
        >
          <Icon name={localMicOn ? "mic" : "mic-off"} size={20} color="white" />
        </TouchableOpacity>

        {callType === 'video' && (
          <>
            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: localWebcamOn ? 'rgba(255,255,255,0.2)' : 'red' }]}
              onPress={toggleWebcam}
            >
              <Icon name={localWebcamOn ? "video" : "video-off"} size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.controlButton, { backgroundColor: localScreenShareOn ? 'green' : 'rgba(255,255,255,0.2)' }]}
              onPress={toggleScreenShare}
            >
              <Icon name={localScreenShareOn ? "cast" : "share-2"} size={18} color="white" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={localStyles.endCallButton} onPress={leaveMeetingAndNotify}>
          <Icon name="phone-off" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Advanced Controls */}
      <View style={localStyles.advancedControls}>
        {/* Video Quality Controls */}
        {callType === 'video' && setQuality && (
          <View style={localStyles.deviceSelector}>
            <Text style={localStyles.deviceSelectorLabel}>Video Quality:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(["low", "medium", "high", null] as Array<"low" | "medium" | "high" | null>).map((q) => (
                <TouchableOpacity
                  key={q || 'auto'}
                  style={localStyles.deviceButton}
                  onPress={() => adjustVideoQuality(q)}
                >
                  <Text style={localStyles.deviceButtonText}>
                    {q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Auto'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Audio Device Selector */}
        {audioDevices.length > 1 && changeAudioDevice && (
          <View style={localStyles.deviceSelector}>
            <Text style={localStyles.deviceSelectorLabel}>Audio In:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {audioDevices.map((device) => (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[
                    localStyles.deviceButton,
                    selectedAudioDevice === device.deviceId && localStyles.selectedDeviceButton
                  ]}
                  onPress={() => handleAudioDeviceChange(device.deviceId)}
                >
                  <Text style={localStyles.deviceButtonText}>
                    {device.label || `Audio ${device.deviceId.slice(0, 5)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Video Device Selector */}
        {callType === 'video' && videoDevices.length > 1 && changeVideoDevice && (
          <View style={localStyles.deviceSelector}>
            <Text style={localStyles.deviceSelectorLabel}>Camera:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videoDevices.map((device) => (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[
                    localStyles.deviceButton,
                    selectedVideoDevice === device.deviceId && localStyles.selectedDeviceButton
                  ]}
                  onPress={() => handleVideoDeviceChange(device.deviceId)}
                >
                  <Text style={localStyles.deviceButtonText}>
                    {device.label || `Cam ${device.deviceId.slice(0, 5)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recording Controls */}
        {(startRecording || stopRecording) && (
          <View style={localStyles.recordingControls}>
            {startRecording && (recordingState === Constants.RecordingStates.RECORDING_IDLE || recordingState === Constants.RecordingStates.RECORDING_STOPPED) && (
              <TouchableOpacity
                style={[localStyles.controlButton, { backgroundColor: 'blue' }]}
                onPress={handleStartRecording}
              >
                <Icon name="play-circle" size={20} color="white" />
                <Text style={localStyles.controlButtonTextSmall}>Rec</Text>
              </TouchableOpacity>
            )}
            
            {stopRecording && (recordingState === Constants.RecordingStates.RECORDING_STARTED || recordingState === Constants.RecordingStates.RECORDING_STARTING) && (
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
      </View>
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
        console.log(`[MeetingScreen] Room deactivation status for ${meetingId}: ${deactivated}`);
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
      joinWithoutCameraAndMic={false}
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
  deviceSelector: {
    marginBottom: 10,
  },
  deviceSelectorLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },
  deviceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  selectedDeviceButton: {
    backgroundColor: localFallbackColors.primary,
  },
  deviceButtonText: {
    color: 'white',
    fontSize: 12,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
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
  hlsStatusText: {
    color: 'blue',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MeetingScreen;