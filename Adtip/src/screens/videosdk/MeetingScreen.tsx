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
import { useNavigation } from '@react-navigation/native';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-native-sdk';
import { useCall } from '../../contexts/CallProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  VideoSDKParticipantView, 
  VideoSDKControlsBar, 
  VideoSDKCallTimer,
  AnimatedBackground,
} from '../../components/videosdk';
import CallService from '../../services/CallService';
import { appEventEmitter } from '../../events/AppEventEmitter';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';

const MeetingScreenContent: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { activeCall } = useCall();
  
  const [showControls, setShowControls] = useState(true);
  const [controlsOpacity] = useState(new Animated.Value(1));
  const [isEndingCall, setIsEndingCall] = useState(false);

  const {
    participants,
    localParticipant,
    join,
    leave,
    toggleMic,
    toggleWebcam,
    meetingId,
  } = useMeeting({});

  const micEnabled = localParticipant?.micOn;
  const webcamEnabled = localParticipant?.webcamOn;
  const callStatus = participants.size > 0 ? 'connected' : 'connecting';

  useEffect(() => {
    join();
  }, [join]);
  
  useEffect(() => {
    const handleLeaveCall = () => {
      leave();
    };
    appEventEmitter.on('leaveActiveCall', handleLeaveCall);
    return () => {
      appEventEmitter.off('leaveActiveCall', handleLeaveCall);
    };
  }, [leave]);

  useEffect(() => {
    if (!activeCall && !isEndingCall) {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }
  }, [activeCall, navigation, isEndingCall]);

  const styles = createMeetingStyles(colors, isDarkMode);

  const handleEndCall = () => {
    if (isEndingCall) {
      return;
    }
    setIsEndingCall(true);
    CallService.endCall('User ended call');
  };
  
  const toggleControlsVisibility = () => {
    if (callStatus === 'connecting' || isEndingCall) return;
    
    try {
      Vibration.vibrate(10);
    } catch (error) {
      // Vibration not supported
    }
    
    const newShowControls = !showControls;
    setShowControls(newShowControls);
    
    Animated.timing(controlsOpacity, {
      toValue: newShowControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (showControls && callStatus === 'connected' && !isEndingCall) {
      const timer = setTimeout(() => {
        toggleControlsVisibility();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showControls, callStatus, isEndingCall]);

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
          onPress: handleEndCall,
        },
      ]
    );
  };

  const participantArray = Array.from(participants.values());
  const remoteParticipants = participantArray.filter(p => p.id !== localParticipant?.id);

  const renderConnectingContent = () => (
    <View style={styles.connectingContainer}>
      <View style={styles.connectingContent}>
        {/* Avatar */}
        <View style={styles.connectingAvatarContainer}>
          <View style={styles.connectingAvatarPlaceholder}>
            <Text style={styles.connectingAvatarText}>
              {(activeCall?.recipientName || 'U')[0].toUpperCase()}
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
          {activeCall?.recipientName || 'Unknown'}
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

  const renderConnectedContent = () => (
    <View style={styles.connectedContainer}>
      {activeCall?.callType === 'video' ? (
        <View style={styles.videoContainer}>
          {remoteParticipants.map((participant) => (
            <VideoSDKParticipantView key={participant.id} participant={participant} isLocal={false} />
          ))}
          {localParticipant && webcamEnabled && (
            <View style={styles.localVideoContainer}>
              <VideoSDKParticipantView participant={localParticipant} isLocal={true} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.voiceCallContainer}>
          <AnimatedBackground isActive={callStatus === 'connected' && !isEndingCall} />
          <View style={styles.voiceCallContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(remoteParticipants[0]?.displayName || activeCall?.recipientName || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                {remoteParticipants[0]?.micOn && !isEndingCall && (
                  <View style={styles.audioIndicator}>
                    <View style={styles.audioWave} />
                    <View style={styles.audioWave} />
                    <View style={styles.audioWave} />
                  </View>
                )}
              </View>
              <Text style={styles.participantDisplayName}>
                {remoteParticipants[0]?.displayName || activeCall?.recipientName || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} onTouchEnd={toggleControlsVisibility}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[
        styles.header, 
        { 
          opacity: (callStatus === 'connecting' || showControls) ? 1 : controlsOpacity,
          backgroundColor: isEndingCall ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0,0,0,0.7)'
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleEndCallWithConfirmation}
          disabled={isEndingCall}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {isEndingCall ? 'Ending call...' :
             callStatus === 'connecting' 
              ? (activeCall?.recipientName || 'Connecting...') 
              : (remoteParticipants.length > 0 ? remoteParticipants[0].displayName : (activeCall?.recipientName || 'Connected'))
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
                <VideoSDKCallTimer />
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

      {callStatus === 'connected' ? renderConnectedContent() : renderConnectingContent()}

      {isEndingCall && (
        <View style={styles.endingOverlay}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.endingCallText}>Ending call...</Text>
        </View>
      )}

      {!isEndingCall && (
        <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
          <VideoSDKControlsBar
            callType={activeCall?.callType || 'voice'}
            micEnabled={micEnabled}
            webcamEnabled={webcamEnabled}
            toggleMic={toggleMic}
            toggleWebcam={toggleWebcam}
            onEndCall={handleEndCallWithConfirmation}
            isConnecting={callStatus === 'connecting'}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const MeetingScreen: React.FC = () => {
  const { activeCall } = useCall();

  if (!activeCall) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#FFFFFF" size="large" />
        </SafeAreaView>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: activeCall.meetingId,
        micEnabled: activeCall.callType === 'voice',
        webcamEnabled: activeCall.callType === 'video',
        name: activeCall.displayName,
      }}
      token={activeCall.token}
    >
      <MeetingScreenContent />
    </MeetingProvider>
  );
};

const createMeetingStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
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
  connectedContainer: {
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
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  endingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  endingCallText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MeetingScreen;