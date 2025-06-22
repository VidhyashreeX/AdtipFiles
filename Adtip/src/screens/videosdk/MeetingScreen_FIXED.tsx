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

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleEndCall();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleEndCall])
  );

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
          <ActivityIndicator size="large" color={colors.primary || '#00D4AA'} />
          <Text style={[styles.loadingText, { color: colors.text?.primary || 'white' }]}>
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
          micEnabled: true,
          webcamEnabled: callType === 'video',
        }}
        token={token}
        joinWithoutUserInteraction={true}
      >
        <MeetingView />
      </MeetingProvider>
    </CallErrorBoundary>
  );
};

// Comprehensive styles for the meeting screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  endingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
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
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  callContent: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  videoSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  voiceCallContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
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
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantDisplayName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  callStatusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF4444',
  },
  controlText: {
    fontSize: 24,
    color: 'white',
  },
});

export default MeetingScreen;
