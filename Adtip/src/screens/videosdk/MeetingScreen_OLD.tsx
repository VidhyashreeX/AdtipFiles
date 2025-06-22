import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-native-sdk';
import { useCall } from '../../contexts/CallProvider';
import { useTheme } from '../../contexts/ThemeContext';
import CallService from '../../services/CallService';
import CallErrorBoundary from '../../components/common/CallErrorBoundary';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { MainNavigatorParamList } from '../../types/navigation';

// Define the type for the route params
type MeetingScreenRouteProp = RouteProp<MainNavigatorParamList, 'Meeting'>;

/**
 * Simple, crash-proof controls component
 */
const MeetingControls: React.FC<{
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
  callType: 'voice' | 'video';
}> = ({ onEndCall, onToggleMic, onToggleCamera, micEnabled, cameraEnabled, callType }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.controlsContainer}>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: micEnabled ? colors.primary || '#00D4AA' : '#FF4444' }]}
          onPress={onToggleMic}
        >
          <Text style={styles.controlText}>{micEnabled ? '🎤' : '🚫'}</Text>
        </TouchableOpacity>
        
        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: cameraEnabled ? colors.primary || '#00D4AA' : '#FF4444' }]}
            onPress={onToggleCamera}
          >
            <Text style={styles.controlText}>{cameraEnabled ? '📹' : '🚫'}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
        >
          <Text style={styles.controlText}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * This is the internal view for the meeting.
 * It can use VideoSDK hooks because it will be rendered inside MeetingProvider.
 */
const MeetingView: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { activeCall } = useCall();
  const route = useRoute<MeetingScreenRouteProp>();
  
  const [showControls, setShowControls] = useState(true);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Get route params safely
  const { callType = 'voice', recipientName = 'Participant' } = route.params || {};

  // Use VideoSDK meeting hooks with error handling
  const meetingHooks = useMeeting({
    onMeetingJoined: () => {
      console.log('[MeetingView] Meeting joined successfully');
      setShowControls(true);
    },
    onMeetingLeft: () => {
      console.log('[MeetingView] Meeting left');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    onError: (error) => {
      console.error('[MeetingView] Meeting error:', error);
      Alert.alert('Call Error', 'There was an issue with the call. Please try again.');
      handleEndCall();
    },
    onParticipantJoined: (participant) => {
      console.log('[MeetingView] Participant joined:', participant?.displayName);
    },
    onParticipantLeft: (participant) => {
      console.log('[MeetingView] Participant left:', participant?.displayName);
    },
  });

  // Safely destructure meeting hooks
  const {
    join,
    leave,
    participants,
    localParticipant,
    toggleMic,
    toggleWebcam,
  } = meetingHooks || {};

  // Initialize camera state based on call type
  useEffect(() => {
    setCameraEnabled(callType === 'video');
  }, [callType]);

  // Join the meeting when the component mounts
  useEffect(() => {
    if (join) {
      try {
        console.log('[MeetingView] Attempting to join meeting');
        join();
      } catch (error) {
        console.error('[MeetingView] Error joining meeting:', error);
        Alert.alert('Call Error', 'Unable to join the call.');
        handleEndCall();
      }
    }
    
    return () => {
      if (leave) {
        try {
          console.log('[MeetingView] Leaving meeting on unmount');
          leave();
        } catch (error) {
          console.error('[MeetingView] Error leaving meeting:', error);
        }
      }
    };
  }, [join, leave]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleEndCall();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // Handle ending call
  const handleEndCall = useCallback(() => {
    if (isEndingCall) return;
    
    setIsEndingCall(true);
    try {
      CallService.endCall('User ended call');
    } catch (error) {
      console.error('[MeetingView] Error ending call:', error);
    }
    
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [isEndingCall, navigation]);

  // Handle mic toggle
  const handleToggleMic = useCallback(() => {
    if (toggleMic) {
      try {
        toggleMic();
        setMicEnabled(prev => !prev);
      } catch (error) {
        console.error('[MeetingView] Error toggling mic:', error);
      }
    }
  }, [toggleMic]);

  // Handle camera toggle
  const handleToggleCamera = useCallback(() => {
    if (toggleWebcam) {
      try {
        toggleWebcam();
        setCameraEnabled(prev => !prev);
      } catch (error) {
        console.error('[MeetingView] Error toggling camera:', error);
      }
    }
  }, [toggleWebcam]);

  // Toggle controls visibility
  const toggleControlsVisibility = useCallback(() => {
    const toValue = showControls ? 0 : 1;
    setShowControls(!showControls);
    
    Animated.timing(controlsOpacity, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showControls, controlsOpacity]);

  const participantCount = participants?.size || 0;
  const callStatus = participantCount > 1 ? 'connected' : 'connecting';

  if (isEndingCall) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
        <View style={styles.endingContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text style={styles.endingText}>Ending call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleEndCall}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.participantName}>{recipientName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: callStatus === 'connected' ? '#00D4AA' : '#FFB800' 
            }]} />
            <Text style={styles.callStatus}>
              {callStatus === 'connected' ? 'Connected' : 'Connecting...'}
            </Text>
            {participantCount > 1 && (
              <>
                <Text style={styles.statusSeparator}>•</Text>
                <Text style={styles.callStatus}>{participantCount} participants</Text>
              </>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Call Content */}
      <TouchableOpacity 
        style={styles.callContent} 
        activeOpacity={1} 
        onPress={toggleControlsVisibility}
      >
        {callType === 'video' ? (
          <View style={styles.videoContainer}>
            <Text style={styles.videoPlaceholder}>Video Call Interface</Text>
            <Text style={styles.videoSubtext}>Tap to show/hide controls</Text>
          </View>
        ) : (
          <View style={styles.voiceCallContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {recipientName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.participantDisplayName}>{recipientName}</Text>
              <Text style={styles.callStatusText}>
                {callStatus === 'connected' ? 'Call in progress' : 'Connecting...'}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls */}
      {showControls && (
        <Animated.View style={[styles.controlsWrapper, { opacity: controlsOpacity }]}>
          <MeetingControls
            onEndCall={handleEndCall}
            onToggleMic={handleToggleMic}
            onToggleCamera={handleToggleCamera}
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            callType={callType}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};
      return true; // Prevent default behavior (exiting app)
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  // Navigate away if the call ends from another source
  useEffect(() => {
    if (!activeCall && !isEndingCall) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [activeCall, navigation, isEndingCall]);

  const styles = createMeetingStyles(colors, isDarkMode);

  const handleEndCall = () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    CallService.endCall('User ended call');
  };
  
  const toggleControlsVisibility = () => {
    if (callStatus === 'connecting' || isEndingCall) return;
    try {
      Vibration.vibrate(10);
    } catch (error) { /* Vibration not supported */ }
    
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
        { text: 'End Call', style: 'destructive', onPress: handleEndCall },
      ]
    );
  };

  const participantArray = Array.from(participants.values());
  const remoteParticipants = participantArray.filter(p => p.id !== localParticipant?.id);

  if (!activeCall) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text style={{color: 'white', marginTop: 10}}>Ending Call...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} onTouchEnd={toggleControlsVisibility}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.header, { opacity: (callStatus === 'connecting' || showControls) ? 1 : controlsOpacity }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isEndingCall}>
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
            <View style={[styles.statusDot, { backgroundColor: isEndingCall ? '#FF3B30' : callStatus === 'connected' ? '#00D4AA' : '#FFA726' }]} />
            <Text style={styles.callStatus}>
              {isEndingCall ? 'Ending...' : callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
            </Text>
            {callStatus === 'connected' && !isEndingCall && (
              <>
                <Text style={styles.statusSeparator}>•</Text>
                <VideoSDKCallTimer />
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton} disabled={isEndingCall}>
          <MoreVertical size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {callStatus === 'connected' ? (
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
                  </View>
                  <Text style={styles.participantDisplayName}>
                    {remoteParticipants[0]?.displayName || activeCall?.recipientName || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.connectingContainer}>
          <View style={styles.connectingContent}>
            <View style={styles.connectingAvatarContainer}>
              <View style={styles.connectingAvatarPlaceholder}>
                <Text style={styles.connectingAvatarText}>{(activeCall?.recipientName || 'U')[0].toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.connectingName}>{activeCall?.recipientName || 'Unknown'}</Text>
            <View style={styles.connectingStatusContainer}>
              <ActivityIndicator size="small" color="#00D4AA" />
              <Text style={styles.connectingStatusText}>{isEndingCall ? 'Ending call...' : 'Connecting...'}</Text>
            </View>
          </View>
        </View>
      )}

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

/**
 * This is the main component exported from the file.
 * It sets up the MeetingProvider with the correct config.
 */
const MeetingScreen: React.FC = () => {
  const route = useRoute<MeetingScreenRouteProp>();
  const navigation = useNavigation();
  const { activeCall } = useCall();
  const { colors } = useTheme();
  
  // Get params from route with proper fallbacks
  const routeParams = route.params || {};
  const { 
    meetingId = activeCall?.meetingId, 
    token = activeCall?.token, 
    displayName = activeCall?.callerName || 'User', 
    callType = activeCall?.callType || 'voice', 
    isInitiator = activeCall?.isInitiator || false, 
    recipientName = activeCall?.recipientName || 'Participant'
  } = routeParams;

  // Validation effect
  useEffect(() => {
    if (!meetingId || !token || !displayName) {
      console.error('[MeetingScreen] Missing required parameters:', {
        meetingId: !!meetingId,
        token: !!token,
        displayName: !!displayName,
        routeParams,
        activeCall
      });
      
      Alert.alert(
        "Call Error", 
        "Could not join the call due to missing information.", 
        [
          { 
            text: "OK", 
            onPress: () => {
              // Try to end any active call and navigate back
              CallService.endCall('Missing parameters');
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } else {
      console.log('[MeetingScreen] Initialized with valid params:', {
        meetingId,
        token: token.substring(0, 20) + '...',
        displayName,
        callType,
        isInitiator,
        recipientName
      });
    }
  }, [meetingId, token, displayName, navigation]);

  // Show loading state if parameters are missing
  if (!meetingId || !token || !displayName) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#1A1A1A' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#00D4AA'} />          <Text style={[styles.loadingText, { color: colors.text?.primary || 'white' }]}>
            Preparing call...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CallErrorBoundary>
      <MeetingProvider
        config={{
          meetingId,
          name: displayName,
          micEnabled: true, // Mic is enabled by default
          webcamEnabled: callType === 'video', // Webcam is on for video calls
        }}
        token={token}
        joinWithoutUserInteraction={true}
      >
        <MeetingView />
      </MeetingProvider>
    </CallErrorBoundary>
  );
};

// Styles (createMeetingStyles function remains the same as in your original file)
const createMeetingStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginHorizontal: 16, alignItems: 'center' },
  participantName: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 4, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  callStatus: { fontSize: 13, color: '#ffffff', opacity: 0.8 },
  statusSeparator: { fontSize: 13, color: '#ffffff', opacity: 0.5 },
  moreButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  connectedContainer: { flex: 1 },
  videoContainer: { flex: 1, backgroundColor: '#000000', position: 'relative' },
  localVideoContainer: { position: 'absolute', top: 80, right: 16, width: 100, height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: '#1A1A1A' },
  voiceCallContainer: { flex: 1, backgroundColor: '#1A1A2E', position: 'relative', overflow: 'hidden' },
  voiceCallContent: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 10 },
  avatarContainer: { alignItems: 'center', zIndex: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 24 },
  avatarPlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 56, fontWeight: 'bold', color: '#ffffff' },
  participantDisplayName: { fontSize: 24, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  connectingContainer: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
  connectingContent: { alignItems: 'center', paddingHorizontal: 40 },
  connectingAvatarContainer: { position: 'relative', marginBottom: 32 },
  connectingAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', zIndex: 10 },
  connectingAvatarText: { fontSize: 48, fontWeight: 'bold', color: '#ffffff' },
  connectingName: { fontSize: 28, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: 16 },
  connectingStatusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  connectingStatusText: { fontSize: 16, color: '#00D4AA', fontWeight: '500' },
  controlsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 },
  endingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  endingCallText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500', marginTop: 8, textAlign: 'center' },
});

const styles = createMeetingStyles({}, false);

export default MeetingScreen;