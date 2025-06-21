import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Vibration,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MeetingProvider } from '@videosdk.live/react-native-sdk';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useVideoSDKMeeting } from '../../hooks/videosdk/useVideoSDKMeeting';
import { 
  VideoSDKParticipantView, 
  VideoSDKControlsBar, 
  VideoSDKCallTimer,
  AnimatedBackground,
} from '../../components/videosdk';
import CallService from '../../services/CallService';
import VideoSDKService from '../../services/videosdk/VideoSDKService';
import OngoingCallModule from '../../services/OngoingCallModule';

interface MeetingScreenParams {
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  displayName: string;
  isInitiator?: boolean;
  recipientName?: string;
}

const MeetingScreenContent: React.FC<MeetingScreenParams> = ({
  meetingId,
  token,
  callType,
  displayName,
  isInitiator = false,
  recipientName,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [showControls, setShowControls] = useState(true);
  const [controlsOpacity] = useState(new Animated.Value(1));
  const [isEndingCall, setIsEndingCall] = useState(false);

  const onMeetingJoined = () => {
    console.log('[MeetingScreen] Successfully joined meeting');
    // Don't show notification if app is already in foreground
    if (AppState.currentState === 'background') {
      OngoingCallModule.startOngoingCallNotification(
        'Ongoing Call',
        `In call with ${recipientName || 'participant'}`
      );
    }
  };

  const onMeetingLeft = () => {
    console.log('[MeetingScreen] Left meeting, ending call via CallService and navigating back');
    OngoingCallModule.stopOngoingCallNotification();
    CallService.getInstance().endCurrentCall();
  };

  const {
    participants,
    localParticipant,
    callStatus,
    callSettings,
    metrics,
    join,
    leave,
    toggleMic,
    toggleWebcam,
    toggleSpeaker,
  } = useVideoSDKMeeting({
    onMeetingJoined: onMeetingJoined,
    onMeetingLeft: onMeetingLeft,
    onError: (error) => {
      console.error('[MeetingScreen] Meeting error:', error);
      Alert.alert('Call Error', 'Failed to connect to the call. Please try again.');
      handleEndCall();
    },
  });

  const styles = createMeetingStyles(colors, isDarkMode);

  // Auto-join when component mounts
  useEffect(() => {
    const joinMeeting = async () => {
      try {
        console.log('[MeetingScreen] Joining meeting:', meetingId);
        join();
      } catch (error) {
        console.error('[MeetingScreen] Failed to join meeting:', error);
        Alert.alert('Connection Error', 'Unable to join the call.');
        handleEndCall();
      }
    };

    joinMeeting();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        OngoingCallModule.startOngoingCallNotification(
          'Ongoing Call',
          `In call with ${recipientName || 'participant'}`
        );
      } else if (nextAppState === 'active') {
        OngoingCallModule.stopOngoingCallNotification();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // This cleanup function no longer ends the call.
    return () => {
      console.log('[MeetingScreen] Unmounting. Notification cleanup only.');
      OngoingCallModule.stopOngoingCallNotification();
      appStateSubscription.remove();
    };
  }, []);

  // Toggle controls visibility with animation and haptic feedback
  const toggleControlsVisibility = () => {
    // Only allow hiding controls when connected
    if (callStatus === 'connecting' || isEndingCall) return;
    
    try {
      Vibration.vibrate(10);
    } catch (error) {
      // Vibration not supported on some devices
    }
    
    const newShowControls = !showControls;
    setShowControls(newShowControls);
    
    Animated.timing(controlsOpacity, {
      toValue: newShowControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Auto-hide controls after 5 seconds (only when connected)
  useEffect(() => {
    if (showControls && callStatus === 'connected' && !isEndingCall) {
      const timer = setTimeout(() => {
        toggleControlsVisibility();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showControls, callStatus, isEndingCall]);

  // Enhanced end call handler
  const handleEndCall = () => {
    if (isEndingCall) {
      console.log('[MeetingScreen] End call already in progress');
      return;
    }

    setIsEndingCall(true);
    
    try {
      console.log('[MeetingScreen] Ending call initiated');
      
      // Perform all cleanup operations
      leave();
      
      // Navigate back to previous screen
      console.log('[MeetingScreen] Navigating back after call end');
      navigation.goBack();
      
    } catch (error) {
      console.error('[MeetingScreen] Error ending call:', error);
      // Still navigate back even if there's an error
      navigation.goBack();
    } finally {
      setIsEndingCall(false);
    }
  };

  // Handle end call with confirmation (for UI button)
  const handleEndCallWithConfirmation = () => {
    if (isEndingCall) return;

    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: handleEndCall
        },
      ]
    );
  };

  // Handle back button press
  const handleBackPress = () => {
    if (isEndingCall) return;
    handleEndCallWithConfirmation();
  };

  // Get participant array
  const participantArray = Array.from(participants.values());
  const remoteParticipants = participantArray.filter(p => p.id !== localParticipant?.id);

  // Render connecting content
  const renderConnectingContent = () => (
    <View style={styles.connectingContainer}>
      <View style={styles.connectingContent}>
        {/* Avatar */}
        <View style={styles.connectingAvatarContainer}>
          <View style={styles.connectingAvatarPlaceholder}>
            <Text style={styles.connectingAvatarText}>
              {(recipientName || 'U')[0].toUpperCase()}
            </Text>
          </View>
          {/* Pulsing animation rings */}
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseRing, styles.pulseRing1]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing2]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing3]} />
          </View>
        </View>
        
        <Text style={styles.connectingName}>
          {recipientName || 'Unknown'}
        </Text>
        
        <View style={styles.connectingStatusContainer}>
          <ActivityIndicator size="small" color="#00D4AA" />
          <Text style={styles.connectingStatusText}>
            {isEndingCall ? 'Ending call...' : 'Connecting...'}
          </Text>
        </View>
        
        <Text style={styles.connectingSubtext}>
          {isEndingCall 
            ? 'Please wait while we end the call'
            : 'Please wait while we connect your call'
          }
        </Text>
      </View>
    </View>
  );

  // Render connected content
  const renderConnectedContent = () => (
    <TouchableOpacity 
      style={styles.mainContent} 
      activeOpacity={1} 
      onPress={toggleControlsVisibility}
      disabled={isEndingCall}
    >
      {callType === 'video' ? (
        <View style={styles.videoContainer}>
          {/* Remote participants */}
          {remoteParticipants.map((participant) => (
            <VideoSDKParticipantView
              key={participant.id}
              participant={participant}
              isLocal={false}
              style={styles.remoteVideo}
            />
          ))}
          
          {/* Local participant (small preview) */}
          {localParticipant && callSettings.webcamEnabled && (
            <View style={styles.localVideoContainer}>
              <VideoSDKParticipantView
                participant={localParticipant}
                isLocal={true}
                style={styles.localVideo}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.voiceCallContainer}>
          {/* Animated Background */}
          <AnimatedBackground isActive={callStatus === 'connected' && !isEndingCall} />
          
          <View style={styles.voiceCallContent}>
            {/* Main avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(remoteParticipants[0]?.displayName || recipientName || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                {/* Audio indicator */}
                {remoteParticipants[0]?.micOn && !isEndingCall && (
                  <View style={styles.audioIndicator}>
                    <View style={styles.audioWave} />
                    <View style={styles.audioWave} />
                    <View style={styles.audioWave} />
                  </View>
                )}
              </View>
              
              <Text style={styles.participantDisplayName}>
                {remoteParticipants[0]?.displayName || recipientName || 'Unknown'}
              </Text>
              
              {isEndingCall && (
                <Text style={styles.endingCallText}>
                  Ending call...
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header - Always visible */}
      <Animated.View style={[
        styles.header, 
        { 
          opacity: (callStatus === 'connecting' || showControls) ? 1 : controlsOpacity,
          backgroundColor: isEndingCall ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0,0,0,0.7)'
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          disabled={isEndingCall}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {isEndingCall ? 'Ending call...' :
             callStatus === 'connecting' 
              ? (recipientName || 'Connecting...') 
              : (remoteParticipants.length > 0 ? remoteParticipants[0].displayName : recipientName || 'Connected')
            }
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: isEndingCall ? '#FF3B30' :
                             callStatus === 'connected' ? '#00D4AA' : 
                             callStatus === 'connecting' ? '#FFA726' : '#FF3B30' 
            }]} />
            <Text style={styles.callStatus}>
              {isEndingCall ? 'Ending...' :
               callStatus === 'connecting' ? 'Connecting...' : 
               callStatus === 'connected' ? 'Connected' : callStatus}
            </Text>
            {callStatus === 'connected' && !isEndingCall && (
              <>
                <Text style={styles.statusSeparator}>•</Text>
                <VideoSDKCallTimer duration={metrics.duration} />
              </>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          disabled={isEndingCall}
        >
          <MoreVertical size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content - Changes based on connection status */}
      {callStatus === 'connecting' || isEndingCall ? renderConnectingContent() : renderConnectedContent()}

      {/* Controls - Always accessible, but with different opacity */}
      <Animated.View style={[
        styles.controlsOverlay, 
        { opacity: (callStatus === 'connecting' || isEndingCall) ? 1 : controlsOpacity }
      ]}>
        <VideoSDKControlsBar
          callType={callType}
          callSettings={callSettings}
          onToggleMic={toggleMic}
          onToggleWebcam={toggleWebcam}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={handleEndCallWithConfirmation}
          participantCount={metrics.participantCount}
          isConnecting={callStatus === 'connecting' || isEndingCall}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const MeetingScreen: React.FC = () => {
  const route = useRoute();
  const params = route.params as MeetingScreenParams;

  if (!params?.meetingId || !params?.token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid meeting parameters</Text>
      </View>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: params.meetingId,
        micEnabled: true,
        webcamEnabled: params.callType === 'video',
        name: params.displayName,
      }}
      token={params.token}
    >
      <MeetingScreenContent {...params} />
    </MeetingProvider>
  );
};

const createMeetingStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  // ...existing styles...
  
  // Add ending call specific styles
  endingCallText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // ...rest of existing styles...
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 1000,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callStatus: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.8,
  },
  statusSeparator: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.5,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Connecting styles
  connectingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100, // Account for header
  },
  connectingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  connectingAvatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  connectingAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  connectingAvatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pulseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    borderRadius: 80,
  },
  pulseRing1: {
    width: 140,
    height: 140,
  },
  pulseRing2: {
    width: 160,
    height: 160,
  },
  pulseRing3: {
    width: 180,
    height: 180,
  },
  connectingName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  connectingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  connectingStatusText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '500',
  },
  connectingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Connected content styles
  mainContent: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#1A1A1A',
  },
  localVideo: {
    flex: 1,
  },
  voiceCallContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    position: 'relative',
    overflow: 'hidden',
  },
  voiceCallContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  audioIndicator: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    flexDirection: 'row',
    backgroundColor: '#00D4AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  audioWave: {
    width: 3,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    opacity: 0.8,
    marginHorizontal: 1,
  },
  participantDisplayName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default MeetingScreen;