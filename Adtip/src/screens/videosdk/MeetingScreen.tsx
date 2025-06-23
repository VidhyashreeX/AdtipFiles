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
  AppState,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-native-sdk';
import { useCall } from '../../contexts/CallProvider';
import { useTheme } from '../../contexts/ThemeContext';
import CallService from '../../services/CallService';
import CallErrorBoundary from '../../components/common/CallErrorBoundary';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { MainNavigatorParamList } from '../../types/navigation';
import { appEventEmitter } from '../../events/AppEventEmitter';
import OngoingCallModule from '../../services/OngoingCallModule';

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
  isMuted: boolean;
}> = ({ onEndCall, onToggleMic, onToggleCamera, micEnabled, cameraEnabled, callType, isMuted }) => {
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
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
  const { activeCall } = useCall();
  const route = useRoute<MeetingScreenRouteProp>();
  
  const [showControls, setShowControls] = useState(true);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hasAttemptedJoinRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Get route params safely
  const { callType = 'voice', recipientName = 'Participant' } = route.params || {};
  // Handle ending call - define early to avoid reference issues
  const handleEndCall = useCallback(async () => {
    if (isEndingCall) return;
    
    console.log('[MeetingView] Starting end call process');
    setIsEndingCall(true);
    
    try {
      // End the call service - this will emit leaveActiveCall event
      await CallService.endCall('User ended call');
      
      // Navigate back after a short delay to ensure cleanup
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 200);
      
    } catch (error) {
      console.error('[MeetingView] Error ending call:', error);
      // Force navigation even if there's an error
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 100);
    }
  }, [isEndingCall, navigation]);
  // Use VideoSDK meeting hooks with error handling
  let meetingHooks: any = null;
  try {
    meetingHooks = useMeeting({
      onMeetingJoined: () => {
        console.log('[MeetingView] Meeting joined successfully');
        setHasJoined(true);
        setIsJoining(false);
        setShowControls(true);
      },
      onMeetingLeft: () => {
        console.log('[MeetingView] Meeting left');
        setHasJoined(false);
        setIsJoining(false);
        // Don't automatically navigate - let handleEndCall do it
      },
      onError: (error) => {
        console.error('[MeetingView] Meeting error:', error);
        setIsJoining(false);
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
  } catch (error) {
    console.error('[MeetingView] Error initializing meeting hooks:', error);
    meetingHooks = {};
  }
  
  // Safely destructure meeting hooks with defaults
  const {
    join = null,
    leave = null,
    participants = new Map(),
    localParticipant = null,
    toggleMic = null,
    toggleWebcam = null,
  } = meetingHooks || {};
  // Initialize camera state based on call type
  useEffect(() => {
    setCameraEnabled(callType === 'video');
  }, [callType]);

  // Join the meeting ONLY ONCE when the component mounts and we have the join function
  useEffect(() => {
    if (join && !hasJoined && !isJoining && !hasAttemptedJoinRef.current) {
      hasAttemptedJoinRef.current = true;
      setIsJoining(true);
      
      try {
        console.log('[MeetingView] Attempting to join meeting (first time only)');
        join();
      } catch (error) {
        console.error('[MeetingView] Error joining meeting:', error);
        setIsJoining(false);
        Alert.alert('Call Error', 'Unable to join the call.');
        handleEndCall();
      }
    }
  }, [join]); // Only depend on join function availability, not its reference
  // Cleanup effect - leave meeting on unmount
  useEffect(() => {
    return () => {
      if (leave && hasJoined) {
        try {
          console.log('[MeetingView] Leaving meeting on unmount');
          leave();
        } catch (error) {
          console.error('[MeetingView] Error leaving meeting on unmount:', error);
        }
      }
    };
  }, [leave, hasJoined]);  // Listen for leave call events from CallService
  useEffect(() => {
    const handleLeaveCall = () => {
      console.log('[MeetingView] Received leaveActiveCall event');
      if (leave && hasJoined && !isEndingCall) {
        try {
          leave();
          setHasJoined(false);
        } catch (error) {
          console.error('[MeetingView] Error leaving meeting via event:', error);
        }
      }
    };

    appEventEmitter.on('leaveActiveCall', handleLeaveCall);
    
    return () => {
      appEventEmitter.off('leaveActiveCall', handleLeaveCall);
    };
  }, [leave, hasJoined, isEndingCall]);

  // Show ongoing call notification when backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        try {
          OngoingCallModule.startOngoingCallNotification(
            'Ongoing Call',
            `In call with ${recipientName}`
          );
        } catch (error) {
          console.error('[MeetingView] Error starting ongoing call notification:', error);
        }
      } else if (nextAppState === 'active') {
        try {
          OngoingCallModule.stopOngoingCallNotification();
        } catch (error) {
          console.error('[MeetingView] Error stopping ongoing call notification:', error);
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [recipientName]);

  // Custom back button: go to TipCallScreen, keep call running
  useEffect(() => {
    const onBackPress = () => {
      try {
        // Type-safe navigation to TipCallScreen with required param
        navigation.navigate('TipCall', { initialCallNotificationData: undefined });
        return true; // Prevent default
      } catch (error) {
        console.error('[MeetingView] Error navigating to TipCallScreen:', error);
        return false;
      }
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

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

  // Listen for mute toggled events from native notification
  useEffect(() => {
    const removeMuteListener = OngoingCallModule.onMuteToggled((muted: boolean) => {
      setIsMuted(muted);
      try {
        if (meetingHooks && meetingHooks.toggleMic) {
          // Only toggle if state differs
          if (muted !== !micEnabled) {
            meetingHooks.toggleMic();
          }
        }
      } catch (error) {
        console.error('[MeetingView] Error toggling mic from notification:', error);
      }
    });
    return removeMuteListener;
  }, [meetingHooks, micEnabled]);

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
  const callStatus = hasJoined ? (participantCount > 1 ? 'connected' : 'waiting') : (isJoining ? 'connecting' : 'initializing');

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

  if (isJoining && !hasJoined) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
        <View style={styles.endingContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text style={styles.endingText}>Joining call...</Text>
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
            }]} />            <Text style={styles.callStatus}>
              {callStatus === 'connected' ? 'Connected' : 
               callStatus === 'waiting' ? 'Waiting for others...' :
               callStatus === 'connecting' ? 'Connecting...' : 
               'Initializing...'}
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
              <Text style={styles.participantDisplayName}>{recipientName}</Text>              <Text style={styles.callStatusText}>
                {callStatus === 'connected' ? 'Call in progress' : 
                 callStatus === 'waiting' ? 'Waiting for others to join...' :
                 callStatus === 'connecting' ? 'Connecting...' : 
                 'Initializing call...'}
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
            isMuted={isMuted}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

// Defensive error boundary
const ErrorBoundary: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>MeetingScreen Error</Text>
        <Text style={{ color: 'white', marginTop: 10 }}>{error.message}</Text>
      </View>
    );
  }
  return (
    <React.Fragment>
      {React.Children.map(children, child => {
        try {
          return child;
        } catch (e) {
          setError(e as Error);
          return null;
        }
      })}
    </React.Fragment>
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
  
  // FIXED: Stabilize the parameters to prevent infinite re-renders
  const routeParams = route.params || {};
  
  // Use route params first, then fallback to activeCall - but only calculate once
  const meetingId = routeParams.meetingId || activeCall?.meetingId;
  const token = routeParams.token || activeCall?.token;
  const displayName = routeParams.displayName || activeCall?.callerName || activeCall?.recipientName || 'User';
  const callType = routeParams.callType || activeCall?.callType || 'voice';
  const isInitiator = routeParams.isInitiator ?? activeCall?.isInitiator ?? false;
  const recipientName = routeParams.recipientName || activeCall?.recipientName || activeCall?.callerName || 'Participant';

  // Only log once when component mounts or when essential params change
  useEffect(() => {
    console.log('[MeetingScreen] Initializing with params:', {
      fromRoute: !!routeParams.meetingId,
      fromActiveCall: !!activeCall?.meetingId,
      meetingId,
      token: token ? 'present' : 'missing',
      displayName,
      callType,
      isInitiator,
      recipientName
    });
  }, []); // Only run once on mount

  // Validation effect - only run when essential params actually change
  useEffect(() => {
    if (!meetingId || !token || !displayName) {
      console.error('[MeetingScreen] Missing required parameters:', {
        meetingId: !!meetingId,
        token: !!token,
        displayName: !!displayName,
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
      return;
    }
  }, [meetingId, token, displayName]); // Removed navigation from deps

  // Show loading state if parameters are missing
  if (!meetingId || !token || !displayName) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#1A1A1A' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#00D4AA'} />
          <Text style={[styles.loadingText, { color: colors.text?.primary || 'white' }]}>
            Preparing call...
          </Text>
        </View>      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <MeetingProvider
        config={{
          meetingId: meetingId || '',
          name: displayName || 'Unknown User',
          micEnabled: true,
          webcamEnabled: callType === 'video',
        }}
        token={token || ''}
        joinWithoutUserInteraction={false}
      >
        <MeetingView />
      </MeetingProvider>
    </ErrorBoundary>
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
