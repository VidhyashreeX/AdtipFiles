import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  RTCView,
  MediaStream,
  Constants,
} from '@videosdk.live/react-native-sdk';
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
import { logError, logInfo } from '../../utils/ProductionLogger';

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

  // Get host participants (SEND_AND_RECV mode)
  const hosts = Array.from(participants.values()).filter(
    participant => participant.mode === Constants.modes.SEND_AND_RECV
  );

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
        {hosts.length > 0 ? (
          hosts.map(host => (
            <HostVideoView key={host.id} participantId={host.id} />
          ))
        ) : (
          <View style={[styles.noStreamContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.noStreamText, { color: colors.text.secondary }]}>
              Waiting for host to start streaming...
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

// Host Component - Shows host video with controls
const HostMode: React.FC<{ colors: any; streamTitle: string; streamType: string }> = ({ 
  colors, 
  streamTitle, 
  streamType 
}) => {
  const { 
    participants, 
    localParticipant, 
    toggleMic, 
    toggleWebcam, 
    leave 
  } = useMeeting();
  
  const [micOn, setMicOn] = useState(true);
  const [webcamOn, setWebcamOn] = useState(true);

  const handleToggleMic = () => {
    toggleMic();
    setMicOn(prev => !prev);
  };

  const handleToggleWebcam = () => {
    toggleWebcam();
    setWebcamOn(prev => !prev);
  };

  const handleEndStream = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end the live stream? This will disconnect all viewers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Stream', onPress: leave, style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.hostContainer}>
      {/* Main Video Area */}
      <View style={styles.hostVideoContainer}>
        {localParticipant && (
          <HostVideoView participantId={localParticipant.id} />
        )}
      </View>

      {/* Stream Info */}
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
            {participants.size - 1} {participants.size - 1 === 1 ? 'viewer' : 'viewers'}
          </Text>
        </View>
      </View>

      {/* Host Controls */}
      <View style={styles.hostControls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: micOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.8)' }
          ]}
          onPress={handleToggleMic}
        >
          {micOn ? <Mic size={24} color="white" /> : <MicOff size={24} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: webcamOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.8)' }
          ]}
          onPress={handleToggleWebcam}
        >
          {webcamOn ? <Camera size={24} color="white" /> : <CameraOff size={24} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.endStreamButton, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}
          onPress={handleEndStream}
        >
          <PhoneOff size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Host Video View Component
const HostVideoView: React.FC<{ participantId: string }> = ({ participantId }) => {
  const { webcamStream, webcamOn } = useParticipant(participantId);

  return webcamOn && webcamStream ? (
    <RTCView
      streamURL={new MediaStream([webcamStream?.track]).toURL()}
      objectFit="cover"
      style={styles.videoView}
    />
  ) : (
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
  const navigation = useNavigation();

  const { join } = useMeeting({
    onMeetingJoined: () => {
      setJoined(true);
      logInfo('LiveStreaming', `Joined live stream as ${isHost ? 'host' : 'viewer'}`);
    },
    onMeetingLeft: () => {
      navigation.goBack();
      logInfo('LiveStreaming', 'Left live stream');
    },
    onError: (error: any) => {
      logError('LiveStreaming', 'Meeting error', error);
      Alert.alert('Error', error.message || 'An error occurred');
    },
  });

  useEffect(() => {
    // Auto-join when component mounts
    const timer = setTimeout(() => {
      join();
    }, 100);

    return () => clearTimeout(timer);
  }, [join]);

  if (!joined) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>
          {isHost ? 'Starting your live stream...' : 'Joining live stream...'}
        </Text>
      </View>
    );
  }

  return isHost ? (
    <HostMode colors={colors} streamTitle={streamTitle} streamType={streamType} />
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

  if (!meetingId || !token) {
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

  const mode = isHost ? Constants.modes.SEND_AND_RECV : Constants.modes.RECV_ONLY;

  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: isHost,
        webcamEnabled: isHost,
        name: user?.name || (isHost ? 'Host' : 'Viewer'),
        mode: mode as "SEND_AND_RECV" | "RECV_ONLY",
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