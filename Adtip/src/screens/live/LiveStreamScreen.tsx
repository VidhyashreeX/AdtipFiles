// src/screens/live/LiveStreamScreen.tsx - Live streaming screen with VideoSDK integration

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Video, Camera, Mic, MicOff, Users, Heart, Gift, X } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

// VideoSDK imports for live streaming
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  RTCView,
  MediaStream
} from '@videosdk.live/react-native-sdk';

// Contexts & Services
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import VideoSDKService from '../../services/videosdk/VideoSDKService';
import LiveStreamService from '../../services/LiveStreamService';
import ApiService from '../../services/ApiService';
import { Logger } from '../../utils/ProductionLogger';

// Components
import Header from '../../components/common/Header';
// Using basic loading component instead of LoadingOverlay
// import LoadingOverlay from '../../components/common/LoadingOverlay';

// Types
interface LiveStreamRoute {
  mode?: 'host' | 'viewer';
  meetingId?: string;
  streamTitle?: string;
}

interface ViewerTip {
  id: string;
  userId: number;
  userName: string;
  amount: number;
  message: string;
  timestamp: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LiveStreamScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const routeParams = (route.params as LiveStreamRoute) || {};
  const { mode = 'host', meetingId, streamTitle } = routeParams;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSetup, setStreamSetup] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState(meetingId || '');
  const [title, setTitle] = useState(streamTitle || '');
  const [isPrivateStream, setIsPrivateStream] = useState(false);
  const [streamCost, setStreamCost] = useState('10'); // Default cost per minute
  const [viewerReward, setViewerReward] = useState('2'); // Default viewer reward per minute

  // Stream state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // VideoSDK meeting state
  const [meetingConfig, setMeetingConfig] = useState<{
    meetingId: string;
    token: string;
    name: string;
    micEnabled: boolean;
    webcamEnabled: boolean;
  } | null>(null);

  // Chat & Tips
  const [chatMessage, setChatMessage] = useState('');
  const [viewers, setViewers] = useState<ViewerTip[]>([]);
  const [tips, setTips] = useState<ViewerTip[]>([]);

  const styles = createLiveStreamStyles(colors, isDarkMode, insets);

  // VideoSDK Meeting Components
  const LiveStreamMeetingView: React.FC = () => {
    const meeting = useMeeting({
      onMeetingJoined: () => {
        Logger.info('LiveStreamScreen', 'Successfully joined VideoSDK meeting for live stream');
      },
      onMeetingLeft: () => {
        Logger.info('LiveStreamScreen', 'Left VideoSDK meeting');
        setMeetingConfig(null);
        setIsStreaming(false);
      },
      onError: (error) => {
        Logger.error('LiveStreamScreen', 'VideoSDK meeting error:', error);
      },
    });

    const { leave, toggleMic, toggleWebcam, localParticipant, participants, join, enableWebcam, unmuteMic } = meeting || {};

    // Auto-join the meeting when component mounts and enable camera/mic for host
    useEffect(() => {
      if (meeting && join && !localParticipant) {
        Logger.info('LiveStreamScreen', 'Auto-joining VideoSDK meeting...');
        join();
      }
    }, [meeting, join, localParticipant]);

    // Enable camera and mic for host after joining
    useEffect(() => {
      if (isHost && localParticipant && meeting) {
        Logger.info('LiveStreamScreen', 'Enabling camera and microphone for host');
        if (!localParticipant.webcamOn && enableWebcam) {
          enableWebcam();
        }
        if (!localParticipant.micOn && unmuteMic) {
          unmuteMic();
        }
      }
    }, [isHost, localParticipant, meeting, enableWebcam, unmuteMic]);

    // Sync local VideoSDK state with UI state
    useEffect(() => {
      if (localParticipant) {
        setIsMicOn(localParticipant.micOn || false);
        setIsCameraOn(localParticipant.webcamOn || false);
      }
    }, [localParticipant?.micOn, localParticipant?.webcamOn]);

    // Update viewer count
    useEffect(() => {
      setViewerCount(participants?.size || 0);
    }, [participants]);

    return (
      <View style={styles.videoContainer}>
        {/* Local participant (host) video */}
        {localParticipant && (
          <LiveStreamParticipantView
            participantId={localParticipant.id}
            isLocal={true}
            isHost={isHost}
          />
        )}

        {/* Remote participants (viewers) - show small thumbnails */}
        <View style={styles.participantThumbnails}>
          {Array.from(participants.keys()).slice(0, 4).map((participantId) => (
            <LiveStreamParticipantView
              key={participantId}
              participantId={participantId}
              isLocal={false}
              isHost={false}
            />
          ))}
        </View>
      </View>
    );
  };

  const LiveStreamParticipantView: React.FC<{
    participantId: string;
    isLocal: boolean;
    isHost: boolean;
  }> = ({ participantId, isLocal, isHost }) => {
    const { displayName, webcamStream, webcamOn, micOn } = useParticipant(participantId);

    if (!webcamOn || !webcamStream) {
      return (
        <View style={[styles.videoPlaceholderContainer, isLocal ? styles.localVideo : styles.remoteVideo]}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.participantName}>
            {displayName || 'Unknown'}{isLocal ? ' (You)' : ''}
          </Text>
          <Text style={styles.statusText}>
            {!webcamOn ? 'Camera off' : 'No video stream'}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.videoStreamContainer, isLocal ? styles.localVideo : styles.remoteVideo]}>
        <RTCView
          streamURL={new MediaStream([webcamStream.track]).toURL()}
          objectFit="cover"
          style={StyleSheet.absoluteFillObject}
          mirror={isLocal}
          zOrder={0}
        />
        
        {/* Participant info overlay */}
        <View style={styles.participantOverlay}>
          <Text style={styles.participantName}>
            {displayName || 'Unknown'}{isLocal ? ' (You)' : ''}
          </Text>
          <View style={styles.participantControls}>
            <View style={[styles.micIndicator, { backgroundColor: micOn ? '#00D4AA' : '#FF3B30' }]}>
              <Text style={styles.micIcon}>{micOn ? '🎤' : '🔇'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Handle mic toggle with VideoSDK
  const handleMicToggle = useCallback(() => {
    // This will be called from within the MeetingProvider context
  }, []);

  // Handle camera toggle with VideoSDK
  const handleCameraToggle = useCallback(() => {
    // This will be called from within the MeetingProvider context
  }, []);

  // Enhanced controls component that works with VideoSDK
  const LiveStreamControls: React.FC = () => {
    const { toggleMic, toggleWebcam, leave, localParticipant } = useMeeting();

    const handleMicPress = useCallback(() => {
      toggleMic();
    }, [toggleMic]);

    const handleCameraPress = useCallback(() => {
      toggleWebcam();
    }, [toggleWebcam]);

    const handleEndStream = useCallback(async () => {
      try {
        setIsLoading(true);
        Logger.info('LiveStreamScreen', 'Stopping live stream...');

        // End the stream session
        if (isHost && meetingConfig?.meetingId) {
          const endResult = await LiveStreamService.endStream(user?.id!, meetingConfig.meetingId);
          if (!endResult.success) {
            Logger.error('LiveStreamScreen', 'Failed to end stream properly:', endResult.message);
          }
        }

        // Leave VideoSDK meeting
        leave();
        
        Logger.info('LiveStreamScreen', 'Live stream ended successfully');
      } catch (error) {
        Logger.error('LiveStreamScreen', 'Error stopping stream:', error);
      } finally {
        setIsLoading(false);
      }
    }, [isHost, meetingConfig, user, leave]);

    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, localParticipant?.micOn ? styles.activeControl : styles.inactiveControl]}
          onPress={handleMicPress}
        >
          {localParticipant?.micOn ? 
            <Mic size={20} color={colors.white || '#FFFFFF'} /> : 
            <MicOff size={20} color="#FF6B6B" />
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, localParticipant?.webcamOn ? styles.activeControl : styles.inactiveControl]}
          onPress={handleCameraPress}
        >
          <Camera size={20} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>

        {!isHost && (
          <TouchableOpacity
            style={[styles.controlButton, styles.tipButton]}
            onPress={() => handleSendTip(10, 'Great stream!')}
          >
            <Gift size={20} color={colors.white || '#FFFFFF'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.endButton]}
          onPress={handleEndStream}
        >
          <X size={20} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
      </View>
    );
  };

  // Memoized values
  const isHost = useMemo(() => mode === 'host', [mode]);
  const canStartStream = useMemo(() => 
    isHost && title.trim().length > 0 && (typeof balance === 'number' ? balance : parseFloat(balance.toString())) >= parseInt(streamCost), 
    [isHost, title, balance, streamCost]
  );

  // Initialize VideoSDK
  useEffect(() => {
    const initializeVideoSDK = async () => {
      try {
        setIsLoading(true);
        Logger.info('LiveStreamScreen', 'Initializing VideoSDK...');
        
        // Initialize VideoSDK service
        const videoSDKService = VideoSDKService.getInstance();
        await videoSDKService.initialize();
        
        Logger.info('LiveStreamScreen', 'VideoSDK initialized successfully');
      } catch (error) {
        Logger.error('LiveStreamScreen', 'Failed to initialize VideoSDK:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize live streaming. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideoSDK();
  }, [navigation]);

  // Start live stream - OPTIMIZED with single API call
  const handleStartStream = useCallback(async () => {
    if (!canStartStream) {
      Alert.alert(
        'Cannot Start Stream',
        `Please ensure you have sufficient balance (₹${streamCost}/min) and enter a stream title.`
      );
      return;
    }

    try {
      setIsLoading(true);
      Logger.info('LiveStreamScreen', 'Starting live stream with optimized API...');

      // Use the optimized API that returns everything in one call
      const streamResult = await LiveStreamService.startStream(user?.id!, '', {
        title: title.trim(),
        cost_per_minute: parseInt(streamCost),
        viewer_reward_per_minute: parseInt(viewerReward),
        is_private: isPrivateStream
      });

      if (!streamResult.success) {
        throw new Error(streamResult.message);
      }

      const { meeting_id, token } = streamResult.data;
      
      if (!meeting_id || !token) {
        throw new Error('Invalid response from server - missing meeting ID or token');
      }

      setCurrentMeetingId(meeting_id);

      // Ensure VideoSDK is initialized before setting meeting config
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.ensureInitialized();
      
      // Set meeting configuration for VideoSDK components
      Logger.info('LiveStreamScreen', 'Setting up meeting config for host with audio/video enabled');
      setMeetingConfig({
        meetingId: meeting_id,
        token: token,
        name: user?.name || 'Host',
        micEnabled: true,
        webcamEnabled: true
      });

      setIsStreaming(true);
      setStreamSetup(true);
      
      Logger.info('LiveStreamScreen', `Live stream started: ${meeting_id} with mic/camera active`);
      Alert.alert('Stream Started!', 'Your live stream is now active. Share the meeting ID with viewers!');

    } catch (error) {
      Logger.error('LiveStreamScreen', 'Failed to start stream:', error);
      Alert.alert(
        'Stream Error',
        'Failed to start live stream. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [canStartStream, streamCost, title, viewerReward, isPrivateStream, user]);

  // Join live stream as viewer
  const handleJoinStream = useCallback(async () => {
    if (!currentMeetingId.trim()) {
      Alert.alert('Meeting ID Required', 'Please enter a valid meeting ID to join the stream.');
      return;
    }

    try {
      setIsLoading(true);
      Logger.info('LiveStreamScreen', `Joining live stream: ${currentMeetingId}`);

      // Generate token for joining
      Logger.info('LiveStreamScreen', 'Generating token for viewer...');
      const tokenResponse = await ApiService.generateVideoSDKToken();
      
      if (!tokenResponse?.token) {
        throw new Error('Failed to generate VideoSDK token for joining');
      }

      // Set meeting configuration for VideoSDK components
      Logger.info('LiveStreamScreen', 'Setting up meeting config for viewer');
      setMeetingConfig({
        meetingId: currentMeetingId.trim(),
        token: tokenResponse.token,
        name: user?.name || 'Anonymous',
        micEnabled: false,  // Viewers start muted
        webcamEnabled: false // Viewers start with camera off
      });

      setIsStreaming(true);
      Logger.info('LiveStreamScreen', 'Successfully joined live stream with VideoSDK');

    } catch (error) {
      Logger.error('LiveStreamScreen', 'Failed to join stream:', error);
      Alert.alert(
        'Join Error',
        'Failed to join live stream. Please check the meeting ID and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentMeetingId, user]);

  // Stop stream (legacy function - now handled in LiveStreamControls)
  const handleStopStream = useCallback(async () => {
    try {
      setIsLoading(true);
      Logger.info('LiveStreamScreen', 'Stopping live stream...');

      // End the stream session
      if (isHost && meetingConfig?.meetingId) {
        const endResult = await LiveStreamService.endStream(user?.id!, meetingConfig.meetingId);
        if (!endResult.success) {
          Logger.error('LiveStreamScreen', 'Failed to end stream properly:', endResult.message);
        }
      }

      // Clear meeting config to leave meeting
      setMeetingConfig(null);
      setIsStreaming(false);
      setStreamSetup(false);
      
      // Refresh wallet balance
      await refreshBalance();
      
      Logger.info('LiveStreamScreen', 'Live stream ended successfully');
      
      if (isHost) {
        Alert.alert(
          'Stream Ended',
          `Your stream has ended. Total earnings: ₹${totalEarnings}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }

    } catch (error) {
      Logger.error('LiveStreamScreen', 'Failed to stop stream:', error);
      Alert.alert('Error', 'Failed to end stream properly. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isHost, meetingConfig, user, totalEarnings, navigation, refreshBalance]);

  // Send tip (for viewers)
  const handleSendTip = useCallback(async (amount: number, message: string = '') => {
    if (!user || isHost) return;

    try {
      const tipResult = await LiveStreamService.sendTip(user.id, currentMeetingId, {
        amount,
        message: message.trim()
      });

      if (!tipResult.success) {
        throw new Error(tipResult.message);
      }

      // Add to tips list
      const newTip: ViewerTip = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name || 'Anonymous',
        amount,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };

      setTips(prev => [newTip, ...prev.slice(0, 9)]); // Keep last 10 tips
      
      Alert.alert('Tip Sent!', `You sent ₹${amount} to the streamer.`);

    } catch (error) {
      Logger.error('LiveStreamScreen', 'Failed to send tip:', error);
      Alert.alert('Tip Failed', 'Failed to send tip. Please try again.');
    }
  }, [user, isHost, currentMeetingId]);

  // Render stream setup (for hosts)
  const renderStreamSetup = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Start Live Stream</Text>
        
        <View style={styles.setupForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stream Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter stream title..."
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cost per minute (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={streamCost}
              onChangeText={setStreamCost}
              placeholder="10"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Viewer reward per minute (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={viewerReward}
              onChangeText={setViewerReward}
              placeholder="2"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Private Stream</Text>
            <Switch
              value={isPrivateStream}
              onValueChange={setIsPrivateStream}
              trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
              thumbColor={isPrivateStream ? colors.primary : colors.gray[500]}
            />
          </View>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceText}>
              Current Balance: ₹{balance}
            </Text>
            <Text style={styles.costText}>
              Stream cost: ₹{streamCost}/min • Viewer reward: ₹{viewerReward}/min
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            !canStartStream && styles.disabledButton
          ]}
          onPress={handleStartStream}
          disabled={!canStartStream}
        >
          <Video size={24} color={colors.white || '#FFFFFF'} />
          <Text style={styles.startButtonText}>Start Stream</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Render join stream (for viewers)
  const renderJoinStream = () => (
    <View style={styles.container}>
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Join Live Stream</Text>
        
        <View style={styles.setupForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting ID *</Text>
            <TextInput
              style={styles.textInput}
              value={currentMeetingId}
              onChangeText={setCurrentMeetingId}
              placeholder="Enter meeting ID..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            !currentMeetingId.trim() && styles.disabledButton
          ]}
          onPress={handleJoinStream}
          disabled={!currentMeetingId.trim()}
        >
          <Users size={24} color={colors.white || '#FFFFFF'} />
          <Text style={styles.startButtonText}>Join Stream</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render active stream with VideoSDK integration
  const renderActiveStream = () => {
    if (!meetingConfig) {
      return (
        <View style={styles.streamContainer}>
          <View style={styles.videoContainer}>
            <Text style={styles.videoPlaceholder}>
              Setting up live stream...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.streamContainer}>
        {/* VideoSDK Meeting Provider */}
        <MeetingProvider
          token={meetingConfig.token}
          config={{
            meetingId: meetingConfig.meetingId,
            micEnabled: meetingConfig.micEnabled,
            webcamEnabled: meetingConfig.webcamEnabled,
            name: meetingConfig.name,
            notification: {
              title: isHost ? 'Live Streaming' : 'Watching Live Stream',
              message: title || 'Live Stream in Progress'
            }
          }}
        >
          {/* Stream video area with real VideoSDK components */}
          <LiveStreamMeetingView />
          
          {/* Stream info overlay */}
          <View style={styles.streamInfoOverlay}>
            <View style={styles.streamStats}>
              <View style={styles.statItem}>
                <Users size={16} color={colors.white || '#FFFFFF'} />
                <Text style={styles.statText}>{viewerCount}</Text>
              </View>
              {isHost && (
                <View style={styles.statItem}>
                  <Text style={styles.earningsText}>₹{totalEarnings}</Text>
                </View>
              )}
            </View>

            <Text style={styles.streamTitle}>{title}</Text>
          </View>

          {/* VideoSDK-integrated stream controls */}
          <LiveStreamControls />
        </MeetingProvider>

        {/* Tips list (if available) */}
        {tips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Recent Tips</Text>
            <FlatList
              data={tips}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.tipItem}>
                  <Heart size={12} color="#FF6B6B" />
                  <Text style={styles.tipText}>
                    {item.userName} sent ₹{item.amount}
                    {item.message ? `: ${item.message}` : ''}
                  </Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.tipsList}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (isStreaming) {
              Alert.alert(
                'End Stream?',
                isHost ? 'Are you sure you want to end your live stream?' : 'Are you sure you want to leave the stream?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End', style: 'destructive', onPress: handleStopStream }
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-left" size={24} color={colors.text?.primary || colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isStreaming ? (isHost ? 'Live Streaming' : 'Watching Stream') : 'Live Stream'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up live stream...</Text>
        </View>
      )}

      {!isStreaming ? (
        isHost ? renderStreamSetup() : renderJoinStream()
      ) : (
        renderActiveStream()
      )}
    </View>
  );
};

const createLiveStreamStyles = (colors: any, isDarkMode: boolean, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  setupContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    textAlign: 'center',
    marginBottom: 40,
  },
  setupForm: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    backgroundColor: colors.surface,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceInfo: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    marginBottom: 4,
  },
  costText: {
    fontSize: 14,
    color: colors.text?.secondary || colors.textSecondary || (isDarkMode ? '#CCCCCC' : '#666666'),
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: colors.gray[400],
    elevation: 0,
    shadowOpacity: 0,
  },
  startButtonText: {
    color: colors.white || '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  streamContainer: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: isDarkMode ? '#000000' : '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlaceholder: {
    color: isDarkMode ? '#FFFFFF' : '#E0E0E0',
    fontSize: 18,
    fontWeight: '600',
  },
  streamInfoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  streamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    color: colors.white || '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  earningsText: {
    color: colors.success || '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  streamTitle: {
    color: colors.white || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  activeControl: {
    backgroundColor: colors.primary,
  },
  inactiveControl: {
    backgroundColor: colors.gray[500],
  },
  tipButton: {
    backgroundColor: colors.error || '#FF6B6B',
  },
  endButton: {
    backgroundColor: colors.danger || '#F44336',
  },
  tipsContainer: {
    maxHeight: 150,
    backgroundColor: colors.surface,
    padding: 15,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    marginBottom: 10,
  },
  tipsList: {
    maxHeight: 100,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    marginLeft: 6,
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: colors.white || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text?.primary || colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
  },

  // VideoSDK-specific styles
  videoStreamContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  localVideo: {
    flex: 1,
    minHeight: screenHeight * 0.4,
  },
  remoteVideo: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  participantThumbnails: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 200,
  },
  participantOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 8,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  participantControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 10,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },
  statusText: {
    fontSize: 12,
    color: colors.text?.secondary || colors.textSecondary || (isDarkMode ? '#CCCCCC' : '#666666'),
    textAlign: 'center',
    marginTop: 4,
  },
  videoPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
  },
});

export default LiveStreamScreen;