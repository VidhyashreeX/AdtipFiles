import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  RTCView,
  MediaStream,
  Constants,
  createCameraVideoTrack,
} from '@videosdk.live/react-native-sdk';
import { getAudioDeviceList, switchAudioDevice } from '@videosdk.live/react-native-sdk';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  Users,
  MessageCircle,
  Heart,
  Send,
  X,
} from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { MainNavigatorParamList } from '../../types/navigation';
import { logError, logInfo, logWarn } from '../../utils/ProductionLogger';
import { API_BASE_URL } from '../../constants/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type LiveStreamingScreenNavigationProp = NativeStackNavigationProp<MainNavigatorParamList, 'LiveStreaming'>;
type LiveStreamingScreenRouteProp = RouteProp<MainNavigatorParamList, 'LiveStreaming'>;

interface LiveStreamingScreenProps {
  meetingId: string;
  token: string;
  isHost: boolean;
  streamTitle: string;
  streamType: 'free' | 'influencer' | 'promotional';
}

type SafeCallResult = {
  success: boolean;
  error?: Error;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }

  return fallback;
};

const safeCallMeetingMethod = async (
  meeting: any,
  methodName: string,
  args: any[] = []
): Promise<SafeCallResult> => {
  if (!meeting || typeof meeting[methodName] !== 'function') {
    return { success: false };
  }

  try {
    const result = meeting[methodName](...args);
    if (result && typeof result.then === 'function') {
      await result;
    }
    return { success: true };
  } catch (error) {
    logError('LiveStreaming', `Failed to execute meeting.${methodName}`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(getErrorMessage(error, 'Operation failed')),
    };
  }
};

// Message Component for Live Chat
const ChatMessage: React.FC<{ 
  message: { id: string; user: string; text: string; timestamp: number };
  colors: any;
}> = ({ message, colors }) => (
  <View style={[styles.chatMessage, { backgroundColor: colors.card }]}>
    <Text style={[styles.chatUser, { color: colors.primary }]}>{message.user}</Text>
    <Text style={[styles.chatText, { color: colors.text.primary }]}>{message.text}</Text>
  </View>
);

// Viewer Component - Shows host video and viewer count
const ViewerMode: React.FC<{ colors: any; streamTitle: string; streamType: string }> = ({ 
  colors, 
  streamTitle, 
  streamType 
}) => {
  const { participants, leave } = useMeeting();
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string; user: string; text: string; timestamp: number}>>([]);
  const [isWaitingForHost, setIsWaitingForHost] = useState(true);

  // Get host participants - look for non-local participants with webcam enabled
  // Since both host and viewer are in CONFERENCE mode, differentiate by webcam status
  const hosts = Array.from(participants.values()).filter(
    participant => 
      !participant.local &&
      participant.webcamOn // Host should have webcam enabled for streaming
  );

  // Debug logging for participant detection
  useEffect(() => {
    const allParticipants = Array.from(participants.values());
    console.log('[ViewerMode] Participants update:', {
      totalCount: allParticipants.length,
      hostsFound: hosts.length,
      participants: allParticipants.map(p => ({
        id: p.id,
        isLocal: p.local,
        webcamOn: p.webcamOn,
        micOn: p.micOn,
        mode: p.mode
      }))
    });
    
    // Update waiting state based on host availability
    if (hosts.length > 0) {
      setIsWaitingForHost(false);
    } else {
      // Give some time for hosts to initialize their webcam
      const timer = setTimeout(() => {
        const currentHosts = Array.from(participants.values()).filter(
          p => !p.local && p.webcamOn
        );
        if (currentHosts.length === 0) {
          setIsWaitingForHost(true);
        }
      }, 2000); // Wait 2 seconds before showing "waiting" state
      
      return () => clearTimeout(timer);
    }
  }, [participants, hosts.length]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        user: 'You',
        text: chatMessage.trim(),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  return (
    <View style={styles.viewerContainer}>
      {/* Main Video Area */}
      <View style={styles.mainVideoContainer}>
        {hosts.length > 0 && !isWaitingForHost ? (
          hosts.map(host => (
            <HostVideoView key={host.id} participantId={host.id} />
          ))
        ) : (
          <View style={[styles.noStreamContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.noStreamText, { color: colors.text.secondary }]}>
              {isWaitingForHost ? 'Waiting for host to start streaming...' : 'Loading stream...'}
            </Text>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          </View>
        )}
      </View>

      {/* Stream Info Overlay */}
      <View style={styles.streamInfoOverlay}>
        <View style={[styles.streamBadge, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}>
          <Text style={styles.liveText}>🔴 LIVE</Text>
        </View>
        <Text style={[styles.streamTitle, { color: colors.white }]} numberOfLines={1}>
          {streamTitle}
        </Text>
        <View style={[styles.viewerCount, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
          <Users size={16} color="white" />
          <Text style={[styles.viewerCountText, { color: colors.white }]}>
            {participants.size} {participants.size === 1 ? 'viewer' : 'viewers'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.viewerControls}>
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowChat(true)}
        >
          <MessageCircle size={20} color="white" />
          <Text style={[styles.chatButtonText, { color: colors.white }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.heartButton, { backgroundColor: 'rgba(255, 20, 147, 0.8)' }]}
          onPress={() => {
            // Send heart reaction
            const heartMessage = {
              id: Date.now().toString(),
              user: 'You',
              text: '❤️',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, heartMessage]);
          }}
        >
          <Heart size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.leaveButton, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}
          onPress={() => {
            Alert.alert(
              'Leave Stream',
              'Are you sure you want to leave the live stream?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', onPress: leave, style: 'destructive' },
              ]
            );
          }}
        >
          <X size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChat(false)}
      >
        <SafeAreaView style={[styles.chatModal, { backgroundColor: colors.background }]}>
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.chatTitle, { color: colors.text.primary }]}>Live Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessage message={item} colors={colors} />}
            style={styles.chatList}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.chatInput, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text.primary 
              }]}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.text.tertiary}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSendMessage}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

interface HostControlsProps {
  participantId: string;
  onToggleMic: () => Promise<void>;
  onToggleWebcam: () => Promise<void>;
  onEndStream: () => Promise<void>;
}

const HostControls: React.FC<HostControlsProps> = ({
  participantId,
  onToggleMic,
  onToggleWebcam,
  onEndStream,
}) => {
  const { micOn, webcamOn } = useParticipant(participantId);
  const [micLoading, setMicLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleToggleMic = useCallback(async () => {
    if (micLoading) {
      return;
    }

    setMicLoading(true);
    try {
      await onToggleMic();
    } catch (error) {
      logError('LiveStreaming', 'Failed to toggle microphone', error);
      Alert.alert('Microphone Error', getErrorMessage(error, 'Unable to toggle microphone.'));
    } finally {
      setMicLoading(false);
    }
  }, [micLoading, onToggleMic]);

  const handleToggleWebcam = useCallback(async () => {
    if (cameraLoading) {
      return;
    }

    setCameraLoading(true);
    try {
      await onToggleWebcam();
    } catch (error) {
      logError('LiveStreaming', 'Failed to toggle camera', error);
      Alert.alert('Camera Error', getErrorMessage(error, 'Unable to toggle camera.'));
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading, onToggleWebcam]);

  const handleEndStream = useCallback(() => {
    if (ending) {
      return;
    }

    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end the live stream? This will disconnect all viewers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            try {
              await onEndStream();
            } catch (error) {
              logError('LiveStreaming', 'Failed to end live stream', error);
              Alert.alert('End Stream Error', getErrorMessage(error, 'Unable to end the live stream.'));
            } finally {
              setEnding(false);
            }
          },
        },
      ]
    );
  }, [ending, onEndStream]);

  return (
    <View style={styles.hostControls}>
      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: micOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.8)' },
        ]}
        onPress={handleToggleMic}
        disabled={micLoading}
      >
        {micLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : micOn ? (
          <Mic size={24} color="white" />
        ) : (
          <MicOff size={24} color="white" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: webcamOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.8)' },
        ]}
        onPress={handleToggleWebcam}
        disabled={cameraLoading}
      >
        {cameraLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : webcamOn ? (
          <Camera size={24} color="white" />
        ) : (
          <CameraOff size={24} color="white" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.endStreamButton, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}
        onPress={handleEndStream}
        disabled={ending}
      >
        {ending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <PhoneOff size={24} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
};

interface HostModeProps {
  colors: any;
  streamTitle: string;
  streamType: string;
  onToggleMic: () => Promise<void>;
  onToggleWebcam: () => Promise<void>;
  onEndStream: () => Promise<void>;
}

// Host Component - Shows host video with controls
const HostMode: React.FC<HostModeProps> = ({
  colors,
  streamTitle,
  streamType,
  onToggleMic,
  onToggleWebcam,
  onEndStream,
}) => {
  const { participants, localParticipant } = useMeeting();
  const [viewerCount, setViewerCount] = useState(0);

  // Track viewer count properly using participants Map
  useEffect(() => {
    if (participants && localParticipant) {
      const participantsArray = Array.from(participants.values());
      // Filter for actual viewers only, excluding the local participant (host)
      const viewers = participantsArray.filter(
        (p) => {
          // Exclude local participant (the host)
          const isLocalHost = p.id === localParticipant.id;
          // Include only viewers (VIEWER or RECV_ONLY mode)
          const isViewer = p.mode === Constants.modes.VIEWER || p.mode === 'RECV_ONLY';
          return !isLocalHost && isViewer;
        }
      );
      setViewerCount(viewers.length);
      logInfo('LiveStreaming', `Viewer count updated: ${viewers.length}`, {
        totalParticipants: participantsArray.length,
        localParticipantId: localParticipant.id,
        viewerIds: viewers.map(v => v.id)
      });
    }
  }, [participants, localParticipant]);

  if (!localParticipant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'black' }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.white }]}>Preparing your live stream...</Text>
      </View>
    );
  }
  const streamTypeLabel = streamType === 'influencer'
    ? 'Influencer Stream'
    : streamType === 'promotional'
      ? 'Promotional Stream'
      : 'Free Stream';

  return (
    <View style={styles.hostContainer}>
      {/* Main Video Area */}
      <View style={styles.hostVideoContainer}>
        <HostVideoView participantId={localParticipant.id} />
      </View>

      {/* Stream Info */}
      <View style={styles.streamInfoOverlay}>
        <View style={[styles.streamBadge, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}>
          <Text style={styles.liveText}>🔴 LIVE</Text>
        </View>
        <Text style={[styles.streamTitle, { color: colors.white }]} numberOfLines={1}>
          {streamTitle}
        </Text>
        <Text style={[styles.streamTypeSubtitle, { color: colors.white }]} numberOfLines={1}>
          {streamTypeLabel}
        </Text>
        <View style={[styles.viewerCount, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
          <Users size={16} color="white" />
          <Text style={[styles.viewerCountText, { color: colors.white }]}>
            {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
          </Text>
        </View>
      </View>

      <HostControls
        participantId={localParticipant.id}
        onToggleMic={onToggleMic}
        onToggleWebcam={onToggleWebcam}
        onEndStream={onEndStream}
      />
    </View>
  );
};

// Host Video View Component
const HostVideoView: React.FC<{ participantId: string }> = ({ participantId }) => {
  const { webcamStream, webcamOn } = useParticipant(participantId);

  const streamURL = useMemo(() => {
    if (webcamOn && webcamStream?.track) {
      return new MediaStream([webcamStream.track]).toURL();
    }
    return undefined;
  }, [webcamOn, webcamStream?.track]);

  if (webcamOn && streamURL) {
    return (
      <RTCView
        streamURL={streamURL}
        objectFit="cover"
        mirror
        style={styles.videoView}
      />
    );
  }

  return (
    <View style={styles.noVideoView}>
      <Camera size={48} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.noVideoText}>Camera Off</Text>
    </View>
  );
};

// Main Live Streaming Container
const LiveStreamContainer: React.FC<{
  meetingId: string;
  token: string;
  isHost: boolean;
  streamTitle: string;
  streamType: string;
}> = ({ meetingId, token, isHost, streamTitle, streamType }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const navigation = useNavigation();
  const meetingRef = useRef<any>(null);
  const hasInitializedDevices = useRef(false);
  const hasCalledJoin = useRef(false);

  const cleanupDevices = useCallback(async () => {
    const currentMeeting = meetingRef.current;
    if (!currentMeeting) {
      logInfo('LiveStreaming', 'No meeting to cleanup');
      return;
    }

    logInfo('LiveStreaming', 'Cleaning up devices...');

    try {
      // Mute mic
      const localParticipant = currentMeeting.localParticipant;
      if (localParticipant?.micOn) {
        await safeCallMeetingMethod(currentMeeting, 'muteMic');
      }

      // Disable webcam
      if (localParticipant?.webcamOn) {
        await safeCallMeetingMethod(currentMeeting, 'disableWebcam');
      }

      logInfo('LiveStreaming', 'Devices cleaned up successfully');
    } catch (error) {
      logError('LiveStreaming', 'Error during device cleanup', error);
    }
  }, []);

  // Memoize all event handlers to prevent re-registration
  const participantsSeenRef = useRef(new Set<string>());
  
  const handleParticipantJoined = useCallback((participant: any) => {
    // Prevent duplicate logs for the same participant
    if (participantsSeenRef.current.has(participant.id)) {
      return;
    }
    participantsSeenRef.current.add(participant.id);
    
    logInfo('LiveStreaming', 'Participant joined', {
      id: participant.id,
      mode: participant.mode,
      displayName: participant.displayName,
      isLocal: participant.local,
      webcamOn: participant.webcamOn,
      micOn: participant.micOn
    });

    // If this is a host with webcam enabled joining, update viewer state
    if (!participant.local && participant.webcamOn && !isHost) {
      logInfo('LiveStreaming', 'Host with video detected, viewers should see stream now');
    }
  }, [isHost]);  const handleParticipantLeft = useCallback((participant: any) => {
    logInfo('LiveStreaming', 'Participant left', { id: participant.id });
  }, []);

  const handleMeetingJoined = useCallback(async () => {
    // ✅ Prevent multiple calls - check if already joined
    if (joined) {
      logWarn('LiveStreaming', 'onMeetingJoined called but already joined, ignoring duplicate event');
      return;
    }
    
    // Prevent multiple initializations using ref instead of state
    if (hasInitializedDevices.current) {
      logWarn('LiveStreaming', 'onMeetingJoined called but already initialized, ignoring duplicate event');
      return;
    }

    logInfo('LiveStreaming', `Successfully joined live stream meeting as ${isHost ? 'host' : 'viewer'}`, {
      meetingId: meetingId, // ✅ Use the meetingId prop, not meeting.id
      localParticipantId: meetingRef.current?.localParticipant?.id
    });
    
    // Mark as joined immediately to prevent race conditions
    setJoined(true);
    
    // For hosts, configure audio and verify devices are enabled after joining
    if (isHost) {
      setIsInitializing(true);
      hasInitializedDevices.current = true;
      
      try {
        const currentMeeting = meetingRef.current;
        if (currentMeeting) {
          logInfo('LiveStreaming', 'Configuring host audio and verifying devices...');
          
          // Small delay to ensure meeting is fully initialized
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Configure audio output to prevent echo
          // For hosts in live streaming, we should use EARPIECE or WIRED_HEADSET
          // to prevent hearing their own voice through speakers
          try {
            const audioDevices = await getAudioDeviceList();
            logInfo('LiveStreaming', 'Available audio devices:', audioDevices);
            
            // Prefer WIRED_HEADSET or EARPIECE over SPEAKER_PHONE
            if (audioDevices.includes('WIRED_HEADSET')) {
              await switchAudioDevice('WIRED_HEADSET');
              logInfo('LiveStreaming', 'Audio switched to WIRED_HEADSET');
            } else if (audioDevices.includes('BLUETOOTH')) {
              await switchAudioDevice('BLUETOOTH');
              logInfo('LiveStreaming', 'Audio switched to BLUETOOTH');
            } else if (audioDevices.includes('EARPIECE')) {
              await switchAudioDevice('EARPIECE');
              logInfo('LiveStreaming', 'Audio switched to EARPIECE');
            } else {
              // Fallback to speaker but log warning
              logWarn('LiveStreaming', 'No earpiece/headset found, using SPEAKER_PHONE (may cause echo)');
            }
          } catch (audioError) {
            logWarn('LiveStreaming', 'Failed to configure audio device', audioError);
          }
          
          // Verify and ensure webcam is enabled (should already be enabled from MeetingProvider config)
          if (!currentMeeting.localParticipant?.webcamOn) {
            const webcamResult = await safeCallMeetingMethod(currentMeeting, 'enableWebcam');
            if (webcamResult.success) {
              logInfo('LiveStreaming', '✅ Host webcam re-enabled successfully');
            } else {
              logWarn('LiveStreaming', 'Failed to re-enable webcam', webcamResult.error);
            }
          } else {
            logInfo('LiveStreaming', '✅ Host webcam already enabled');
          }
          
          // Verify and ensure mic is enabled
          if (currentMeeting.localParticipant?.micOn === false) {
            const micResult = await safeCallMeetingMethod(currentMeeting, 'unmuteMic');
            if (micResult.success) {
              logInfo('LiveStreaming', '✅ Host microphone re-enabled successfully');
            } else {
              logWarn('LiveStreaming', 'Failed to re-enable mic', micResult.error);
            }
          } else {
            logInfo('LiveStreaming', '✅ Host microphone already enabled');
          }
          
          logInfo('LiveStreaming', 'Host devices initialized successfully');
        }
      } catch (error) {
        logError('LiveStreaming', 'Error initializing host devices', error);
      } finally {
        setIsInitializing(false);
      }
    }
  }, [isHost, joined, meetingId]); // ✅ Add joined and meetingId to dependencies

  const handleMeetingLeft = useCallback(async () => {
    logInfo('LiveStreaming', 'Meeting left, cleaning up...');
    participantsSeenRef.current.clear(); // ✅ Clear participants tracking
    await cleanupDevices();
    // Navigate to LiveStream tab
    (navigation as any).navigate('TabHome', { screen: 'LiveStream' });
  }, [cleanupDevices, navigation]);

  const handleMeetingError = useCallback(async (error: any) => {
    logError('LiveStreaming', 'Meeting error', error);
    await cleanupDevices();
    Alert.alert('Stream Error', error?.message || 'An error occurred during the stream');
    // Navigate to LiveStream tab
    (navigation as any).navigate('TabHome', { screen: 'LiveStream' });
  }, [cleanupDevices, navigation]);

  const meeting = useMeeting({
    onParticipantJoined: handleParticipantJoined,
    onParticipantLeft: handleParticipantLeft,
    onMeetingJoined: handleMeetingJoined,
    onMeetingLeft: handleMeetingLeft,
    onError: handleMeetingError,
  });

  const { join, leave, end } = meeting;

  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  useEffect(() => {
    // Auto-join when component mounts - only once
    // Use ref to prevent multiple join calls even if component re-renders
    if (!joined && !hasCalledJoin.current && join && typeof join === 'function') {
      // Mark as called immediately to prevent race conditions
      hasCalledJoin.current = true;
      
      const timer = setTimeout(() => {
        // Final check before joining
        if (!joined) {
          logInfo('LiveStreaming', 'Auto-joining meeting (first time only)...');
          join();
        } else {
          logWarn('LiveStreaming', 'Skipped join - already joined');
        }
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [joined, join]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      logInfo('LiveStreaming', 'Component unmounting, cleaning up...');
      // Reset join flag for potential remounts
      hasCalledJoin.current = false;
      hasInitializedDevices.current = false;
      participantsSeenRef.current.clear();
      cleanupDevices().catch((error) => {
        logError('LiveStreaming', 'Failed to cleanup devices on unmount', error);
      });
    };
  }, [cleanupDevices]);

  const safeToggleMic = useCallback(async () => {
    const currentMeeting = meetingRef.current;
    if (!currentMeeting) {
      logError('LiveStreaming', 'Meeting not initialized for mic toggle');
      return;
    }

    try {
      // Use toggleMic directly - it handles the state internally
      // This is the recommended approach from VideoSDK docs
      logInfo('LiveStreaming', 'Toggling microphone...');
      
      const result = await safeCallMeetingMethod(currentMeeting, 'toggleMic');
      if (result.success) {
        const newState = currentMeeting.localParticipant?.micOn;
        logInfo('LiveStreaming', `Mic toggled successfully. New state: ${newState ? 'ON' : 'OFF'}`);
      } else {
        throw result.error || new Error('Failed to toggle mic');
      }
    } catch (error) {
      logError('LiveStreaming', 'Error toggling mic', error);
      Alert.alert('Microphone Error', 'Failed to toggle microphone');
    }
  }, []);

  const safeToggleWebcam = useCallback(async () => {
    const currentMeeting = meetingRef.current;
    if (!currentMeeting) {
      logError('LiveStreaming', 'Meeting not initialized for webcam toggle');
      return;
    }

    try {
      // Use toggleWebcam directly - it handles the state internally
      // This is the recommended approach from VideoSDK docs
      logInfo('LiveStreaming', 'Toggling webcam...');
      
      const result = await safeCallMeetingMethod(currentMeeting, 'toggleWebcam');
      if (result.success) {
        const newState = currentMeeting.localParticipant?.webcamOn;
        logInfo('LiveStreaming', `Webcam toggled successfully. New state: ${newState ? 'ON' : 'OFF'}`);
      } else {
        throw result.error || new Error('Failed to toggle webcam');
      }
    } catch (error) {
      logError('LiveStreaming', 'Error toggling webcam', error);
      Alert.alert('Camera Error', 'Failed to toggle camera');
    }
  }, []);

  const handleHostEndStream = useCallback(async () => {
    const currentMeeting = meetingRef.current;
    if (!currentMeeting) {
      logError('LiveStreaming', 'Meeting not initialized for ending stream');
      // Navigate to LiveStream tab
      (navigation as any).navigate('TabHome', { screen: 'LiveStream' });
      return;
    }

    try {
      logInfo('LiveStreaming', 'Ending live stream...');
      
      // Call backend API to end stream and update database
      if (user?.id && meetingId) {
        try {
          // Get auth token
          const token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token');
          
          const apiUrl = `${API_BASE_URL}/api/live-stream/end`;
          const requestBody = {
            user_id: user.id,
            meeting_id: meetingId,
          };

          // Log the API request
          logInfo('LiveStreaming', `[API REQUEST] POST ${apiUrl}`, {
            body: requestBody,
            hasToken: !!token,
          });

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(requestBody),
          });

          // Log response status
          logInfo('LiveStreaming', `[API RESPONSE] Status: ${response.status} ${response.statusText}`);

          // Try to parse response
          const responseText = await response.text();
          logInfo('LiveStreaming', '[API RESPONSE] Raw response:', responseText.substring(0, 200));

          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            logError('LiveStreaming', 'Failed to parse API response as JSON', parseError);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
          }

          // Log parsed result
          logInfo('LiveStreaming', '[API RESPONSE] Parsed result:', result);

          if (response.ok && result.success) {
            logInfo('LiveStreaming', '✅ Stream ended successfully on backend', result.data);
          } else {
            logWarn('LiveStreaming', `⚠️ Failed to end stream on backend: ${result.message || 'Unknown error'}`, {
              status: response.status,
              statusText: response.statusText,
              result,
            });
          }
        } catch (apiError) {
          logError('LiveStreaming', '❌ API error ending stream', apiError);
          logError('LiveStreaming', 'Error details:', {
            message: apiError instanceof Error ? apiError.message : String(apiError),
            name: apiError instanceof Error ? apiError.name : 'Unknown',
          });
          // Continue with VideoSDK cleanup even if API fails
        }
      } else {
        logWarn('LiveStreaming', 'Cannot call end stream API: missing user.id or meetingId', {
          hasUser: !!user,
          userId: user?.id,
          meetingId,
        });
      }
      
      // Cleanup devices first
      await cleanupDevices();
      
      // End the meeting (this will trigger onMeetingLeft)
      const result = await safeCallMeetingMethod(currentMeeting, 'end');
      if (!result.success) {
        logWarn('LiveStreaming', 'End meeting failed, trying leave...', result.error);
        
        // Fallback to leave
        const leaveResult = await safeCallMeetingMethod(currentMeeting, 'leave');
        if (!leaveResult.success) {
          throw leaveResult.error || new Error('Failed to end the live stream');
        }
      }
      
      logInfo('LiveStreaming', 'Live stream ended successfully');
      // Navigate to LiveStream tab
      (navigation as any).navigate('TabHome', { screen: 'LiveStream' });
    } catch (error) {
      logError('LiveStreaming', 'Error ending stream', error);
      Alert.alert('Error', 'Failed to end the stream properly');
      // Force navigation to LiveStream tab even on error
      (navigation as any).navigate('TabHome', { screen: 'LiveStream' });
    }
  }, [cleanupDevices, navigation]);

  if (!joined || (isHost && isInitializing)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>
          {!joined 
            ? (isHost ? 'Starting your live stream...' : 'Joining live stream...')
            : 'Initializing camera and microphone...'
          }
        </Text>
      </View>
    );
  }

  return isHost ? (
    <HostMode
      colors={colors}
      streamTitle={streamTitle}
      streamType={streamType}
      onToggleMic={safeToggleMic}
      onToggleWebcam={safeToggleWebcam}
      onEndStream={handleHostEndStream}
    />
  ) : (
    <ViewerMode colors={colors} streamTitle={streamTitle} streamType={streamType} />
  );
};

// Main Screen Component
const LiveStreamingScreen: React.FC = () => {
  const navigation = useNavigation<LiveStreamingScreenNavigationProp>();
  const route = useRoute<LiveStreamingScreenRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const {
    meetingId,
    token,
    isHost = false,
    streamTitle = 'Live Stream',
    streamType = 'free'
  } = route.params || {};

  // Log the received parameters for debugging
  console.log('[LiveStreamingScreen] Initializing with params:', {
    meetingId,
    token: token ? `${token.substring(0, 20)}...` : 'undefined',
    isHost,
    streamTitle,
    streamType
  });

  if (!meetingId || !token) {
    console.error('[LiveStreamingScreen] Invalid parameters:', { meetingId, token: !!token });
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text.primary }]}>
          Invalid stream parameters. Please try again.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Use CONFERENCE mode for both hosts and viewers to enable proper video streaming
  // Host will have webcam/mic enabled, viewer will have them disabled
  const mode = Constants.modes.CONFERENCE;

  return (
    <MeetingProvider
      config={{
        meetingId,
        // For hosts, start with devices enabled; for viewers, disabled
        micEnabled: isHost,
        webcamEnabled: isHost,
        name: user?.name || (isHost ? 'Host' : 'Viewer'),
        mode: mode as any,
        // Disable multistream for better performance in live streaming
        multiStream: false,
      }}
      token={token}
    >
      <SafeAreaView style={styles.container}>
        <LiveStreamContainer
          meetingId={meetingId}
          token={token}
          isHost={isHost}
          streamTitle={streamTitle}
          streamType={streamType}
        />
      </SafeAreaView>
    </MeetingProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Viewer Mode Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  mainVideoContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  noStreamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStreamText: {
    fontSize: 18,
    textAlign: 'center',
  },
  
  // Host Mode Styles
  hostContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  hostVideoContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  
  // Video View Styles
  videoView: {
    flex: 1,
    backgroundColor: 'black',
  },
  noVideoView: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 12,
  },
  
  // Stream Info Overlay
  streamInfoOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  streamBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  streamTypeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.85,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Viewer Controls
  viewerControls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Host Controls
  hostControls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endStreamButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Chat Modal Styles
  chatModal: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessage: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
  },
  chatUser: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chatText: {
    fontSize: 14,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveStreamingScreen;