import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Animated,
  BackHandler,
  Platform,
  NativeModules,
  ActivityIndicator,
  AppState,
  Image,
  AppStateStatus,
  Vibration,
  DeviceEventEmitter,
} from 'react-native';
import { useMeeting, useParticipant } from '@videosdk.live/react-native-sdk';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeetingProvider } from '@videosdk.live/react-native-sdk';
import { useCall } from '../../contexts/CallProvider';
import { useTheme } from '../../contexts/ThemeContext';
import WhatsAppCallManager from '../../services/calling/WhatsAppCallManager';
import CallMediaManager, { MediaState } from '../../services/calling/CallMediaManager';
import CallErrorHandler from '../../services/calling/CallErrorHandler';
import CallService from '../../services/CallService';
import OngoingCallModule from '../../services/OngoingCallModule';
import { 
  Mic, MicOff, Camera, CameraOff, Phone, 
  Video, VideoOff, Speaker, Users,
  RotateCcw, MessageSquare, MoreVertical 
} from 'lucide-react-native';
import { MainNavigatorParamList } from '../../types/navigation';
import { appEventEmitter } from '../../events/AppEventEmitter';
import VideoCallInterface from '../../components/call/VideoCallInterface';
import { VideoSDKParticipantView, ParticipantView } from '../../components/videosdk';
import notifee from '@notifee/react-native';
import CallErrorBoundary from '../../components/common/CallErrorBoundary';

// Define the type for the route params
type MeetingScreenRouteProp = RouteProp<MainNavigatorParamList, 'Meeting'>;

// Define participant type
interface Participant {
  displayName?: string;
  name?: string;
  id?: string;
  isSelf?: boolean;
  micMuted?: boolean;
}

// Define call controls props
interface CallControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  callType: 'voice' | 'video';
  speakerEnabled: boolean;
  onToggleSpeaker: () => void;
  onSwitchCamera: () => void;
  onShowParticipants: () => void;
}

/**
 * Video Participant Component
 */
const ParticipantVideo = ({ 
  isLocal = false, 
  participant = null, 
  isLarge = false 
}: {
  isLocal?: boolean;
  participant?: Participant | null;
  isLarge?: boolean;
}) => {
  return (
    <View style={[
      styles.participantVideo, 
      isLarge ? styles.largeVideo : styles.smallVideo
    ]}>
      {/* For demo purposes, just showing a placeholder */}
      <View style={styles.videoPlaceholder}>
        {!participant ? (
          <ActivityIndicator color="#00A884" size="small" />
        ) : (
          <View style={styles.participantInitialContainer}>
            <Text style={styles.participantInitial}>
              {(participant?.displayName || participant?.name || 'U').charAt(0).toUpperCase()}
            </Text>
            {isLocal && (
              <Text style={styles.youLabel}>YOU</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Call Controls Component using Lucide React Native icons
 */
const CallControls: React.FC<CallControlsProps> = ({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  callType,
  speakerEnabled,
  onToggleSpeaker,
  onSwitchCamera,
  onShowParticipants,
}) => {
  return (
    <View style={styles.controlsContainer}>
      <View style={styles.controlRow}>
        {/* Speaker button */}
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onToggleSpeaker}
        >
          <Speaker color="#fff" size={22} style={{ opacity: speakerEnabled ? 1 : 0.5 }} />
        </TouchableOpacity>
        
        {/* Video button - only show in video calls */}
        {callType === 'video' && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={onToggleCamera}
          >
            {cameraEnabled ? (
              <Video color="#fff" size={22} />
            ) : (
              <VideoOff color="#fff" size={22} />
            )}
          </TouchableOpacity>
        )}
        
        {/* Mic button */}
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onToggleMic}
        >
          {micEnabled ? (
            <Mic color="#fff" size={22} />
          ) : (
            <MicOff color="#fff" size={22} />
          )}
        </TouchableOpacity>
        
        {/* End call button */}
        <TouchableOpacity 
          style={[styles.controlButton, styles.endCallButton]} 
          onPress={onEndCall}
        >
          <Phone color="#fff" size={22} style={{ transform: [{rotate: '135deg'}] }} />
        </TouchableOpacity>
        
        {/* Participants button */}
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onShowParticipants}
        >
          <Users color="#fff" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Define the props interface for MeetingView
 */
interface MeetingViewProps {
  meetingId: string;
  callType: 'voice' | 'video';
  token: string;
  localParticipantId: string;
  recipientName: string;
}

/**
 * The internal meeting view component - BULLETPROOF IMPLEMENTATION
 */
const MeetingView = ({ meetingId, callType, token, localParticipantId: initialLocalParticipantId, recipientName }: MeetingViewProps) => {
  const { activeCall } = useCall();
  const whatsAppCallManager = WhatsAppCallManager.getInstance(); // Get instance directly
  const callMediaManager = CallMediaManager.getInstance(); // Get instance directly 
  const callErrorHandler = CallErrorHandler.getInstance(); // Get instance directly
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
  const route = useRoute<any>(); // Type as any to resolve route.params.meetingId error

  // --- LINT FIX: Removed redundant meeting state ---
  // We use meetingHooks from useMeeting instead of a separate meeting state

  const [localParticipantId, setLocalParticipantId] = useState(initialLocalParticipantId);
  const [showControls, setShowControls] = useState(true);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'reconnecting' | 'ended'>('connecting');
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [isRecovering, setIsRecovering] = useState(false);
  
  // BULLETPROOF: Media state from centralized manager. This is the single source of truth.
  const [mediaState, setMediaState] = useState<MediaState>(
    callMediaManager.getMediaState()
  );
  
  // Destructure media state for easy access
  const { micEnabled, cameraEnabled, speakerEnabled } = mediaState;
  
  // No need for additional media initialization - the WhatsAppCallManager's initializeMediaForCall
  // has already initialized everything BEFORE navigating to MeetingScreen
  
  // BULLETPROOF: Enhanced ref management for proper cleanup
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const navigationRef = useRef(navigation);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionAttemptRef = useRef(0);
  const maxReconnectionAttempts = 3;
  const isComponentMountedRef = useRef(true);
  const lastHeartbeatRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef(Date.now());
  const errorRecoveryRef = useRef<{[key: string]: number}>({});
  const notificationSyncRef = useRef<NodeJS.Timeout | null>(null);

  // BULLETPROOF FIX: Use VideoSDK meeting hooks with error handling
  // And initialize with the correct media state from our CallMediaManager
  const meetingHooks = useMeeting({
    // The property names in useMeeting are different from our media state
    // but we ensure they match our CallMediaManager's state
    onMeetingJoined: () => {
      console.log('[MeetingView] Meeting joined successfully');
      setHasJoined(true);
      setIsJoining(false);
      setCallState('connected');
      setShowControls(true);
      
      // Connect media management to VideoSDK meeting
      whatsAppCallManager.setVideoSDKMeeting(meetingHooks);
      
      // Start call duration timer
      startCallDurationTimer();
      
      // Update call state in unified way
      updateCallState('connected');
      
      // Ensure call notification is showing
      ensureOngoingCallNotification();
      
      // Reset reconnection attempts on successful join
      reconnectionAttemptRef.current = 0;
    },
    onMeetingLeft: () => {
      console.log('[MeetingView] Meeting left');
      setHasJoined(false);
      setCallState('ended');
      
      // Clean up properly
      stopCallDurationTimer();
      
      // Update call state in unified way
      updateCallState('ended');
      
      // Note: Navigation is handled by handleEndCall, not here
    },
    onParticipantJoined: (participant: any) => {
      console.log('[MeetingView] 👤 Participant joined:', participant?.displayName || participant?.id);
      
      // The `participants` map from useMeeting is updated automatically.
      // No need to manage a separate state here.
    },
    onParticipantLeft: (participant: any) => {
      console.log('[MeetingView] 👋 Participant left:', participant?.displayName || participant?.id);
      
      // Check if we're the only one left in the call
      checkIfAloneInCall();
    },
    onError: (error: any) => {
      console.error('[MeetingView] ❌ Meeting error:', error);
      
      // Use enhanced error handler for bulletproof error management
      const callId = activeCall?.callId || route.params?.meetingId;
      callErrorHandler.handleError(error, callId, 'meeting_hook').then((recovered: boolean) => {
        if (!recovered) {
          // Categorize errors properly for better handling
          if (isFatalError(error)) {
            // Fatal errors require ending the call
            setCallState('ended');
            handleErrorRecovery(error, true);
          } else if (isNetworkError(error)) {
            // Network errors may be temporary, attempt reconnection
            setCallState('reconnecting');
            handleErrorRecovery(error, false);
          } else {
            // Other non-fatal errors, just notify
            handleErrorRecovery(error, false);
          }
        }
      }).catch((handlerError: Error) => {
        console.error('[MeetingView] Error handler failed:', handlerError);
        // Fallback to basic error handling
        if (isFatalError(error)) {
          setCallState('ended');
          handleErrorRecovery(error, true);
        } else {
          handleErrorRecovery(error, false);
        }
      });
    },
  });
  
  // Destructure meeting hooks
  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    localParticipant,
    participants, // ✅ ADD: Get the full participants map
  } = meetingHooks || {};

  // Get local participant's video stream details using useParticipant hook
  const { webcamStream, micStream } = useParticipant(localParticipant?.id || '');
  const { webcamOn, micOn } = useParticipant(localParticipant?.id);

  // ✅ BULLETPROOF FIX: Explicitly join the meeting on component mount with retry logic
  useEffect(() => {
    if (join && !hasJoined && !isJoining) {
      console.log('[MeetingView] Attempting to join meeting...');
      setIsJoining(true);
      
      const attemptJoin = async () => {
        try {
          // CRITICAL FIX: Ensure that for video calls, camera is enabled before joining
          if (callType === 'video' && !mediaState.cameraEnabled) {
            console.log('[MeetingView] Pre-enabling camera for video call before joining');
            await callMediaManager.setCameraEnabled(true);
          }
          
          // Join the meeting
          await join();
          console.log('[MeetingView] Join call successful');
          
          // CRITICAL FIX: Force media state synchronization after successful join
          if (callType === 'video') {
            // Give VideoSDK a moment to initialize
            setTimeout(() => {
              if (isComponentMountedRef.current) {
                console.log('[MeetingView] Forcing camera state after join');
                callMediaManager.forceUpdateMediaState({
                  ...mediaState,
                  cameraEnabled: true
                });
              }
            }, 500);
          }
        } catch (error) {
          console.error('[MeetingView] Join failed:', error);
          setIsJoining(false);
          
          // Retry after a short delay
          setTimeout(() => {
            if (!hasJoined && isComponentMountedRef.current) {
              console.log('[MeetingView] Retrying join...');
              setIsJoining(true);
              try {
                join();
              } catch (retryError: any) {
                console.error('[MeetingView] Retry join failed:', retryError);
                setIsJoining(false);
              }
            }
          }, 2000);
        }
      };
      
      attemptJoin();
    }

    // Ensure component mount status is tracked for cleanup
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      // Optional: leave meeting on unmount if desired
      // if (leave) {
      //   leave();
      // }
    };
  }, [join, hasJoined, isJoining]);

  // Connect VideoSDK meeting to media manager for direct control
  useEffect(() => {
    if (meetingHooks) {
      callMediaManager.setMeeting(meetingHooks);
    }
  }, [meetingHooks, callMediaManager]);

  // BULLETPROOF FIX: Synchronize meeting state with centralized media state
  // This is crucial to handle any potential state mismatch between VideoSDK and our CallMediaManager
  useEffect(() => {
    // Ensure meeting state matches our centralized media state
    if (meetingHooks && hasJoined) {
      // Synchronization now happens through the MediaManager's observer pattern
      // Logging only for debugging
      console.log(
        '[MeetingView] Media state sync check:',
        `mic: ${micOn}=${mediaState.micEnabled}`,
        `webcam: ${webcamOn}=${mediaState.cameraEnabled}`
      );
    }
  }, [hasJoined, meetingHooks, mediaState, micOn, webcamOn]);

  // New helper functions for call management
  const startCallDurationTimer = useCallback(() => {
    // Clear any existing timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    // Start a new timer that updates every second
    const startTime = Date.now();
    callTimerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(duration);
    }, 1000);
  }, []);

  const stopCallDurationTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const formatCallDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle end call - MOVED UP to fix dependency issues
  const handleEndCall = useCallback(async () => {
    if (isEndingCall) return;
    
    setIsEndingCall(true);
    setCallState('ended');
    
    try {
      console.log('[MeetingView] Ending call...');
      
      // Stop timer first
      stopCallDurationTimer();
      
      // BULLETPROOF: Clean up media manager FIRST
      await callMediaManager.cleanup('call_ended_by_user');
      
      // Leave meeting if needed
      if (leave && hasJoined) {
        await Promise.race([
          leave(),
          new Promise(resolve => setTimeout(resolve, 2000)) // Timeout for leaving
        ]);
      }
      
      // Clean up call service
      await CallService.endCall('User ended call');
      
      // Remove notification
      if (Platform.OS === 'android') {
        OngoingCallModule.stopOngoingCallNotification();
      }
      
      // Emit call ended event
      appEventEmitter.emit('callEnded', { reason: 'userEnded' });
      
      // Navigate safely after small delay to let cleanup complete
      setTimeout(() => {
        if (!navigation) return;
        
        // Safe navigation with multiple fallbacks
        try {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
            });
          }
        } catch (error) {
          console.error('[MeetingView] Navigation error:', error);
          // Final fallback
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' as keyof MainNavigatorParamList }],
          });
        }
      }, 300);
    } catch (error) {
      console.error('[MeetingView] Error ending call:', error);
      
      // Even if there's an error, try to navigate away
      setTimeout(() => {
        if (!navigation) return;
        
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
          });
        } catch (navigationError) {
          console.error('[MeetingView] Final navigation error:', navigationError);
        }
      }, 300);
    }
  }, [isEndingCall, leave, hasJoined, navigation, stopCallDurationTimer, callMediaManager]);

  const isFatalError = useCallback((error: any) => {
    const fatalErrorCodes = ['INVALID_TOKEN', 'TOKEN_EXPIRED', 'MEETING_ENDED', 'INVALID_PERMISSIONS'];
    return error?.code && fatalErrorCodes.includes(error.code);
  }, []);

  const isNetworkError = useCallback((error: any) => {
    const networkErrorCodes = ['CONNECTION_LOST', 'NETWORK_ERROR', 'RECONNECTION_FAILED'];
    return error?.code && networkErrorCodes.includes(error.code);
  }, []);

  const updateCallState = useCallback((status: 'connecting' | 'connected' | 'reconnecting' | 'ended') => {
    try {
      const whatsAppCallManager = WhatsAppCallManager.getInstance();
      const currentCall = whatsAppCallManager.getCurrentCall();
      if (currentCall) {
        // Map reconnecting to connecting for the call manager
        const mappedStatus = status === 'reconnecting' ? 'connecting' : status;
        whatsAppCallManager.updateCallStatus(mappedStatus);
      }
      
      // Emit global event so other parts of the app can react
      appEventEmitter.emit('callStateChanged', { status, callId: currentCall?.callId });
    } catch (error) {
      console.error('[MeetingView] Error updating call state:', error);
    }
  }, []);

  const handleErrorRecovery = useCallback((error: any, isFatal: boolean) => {
    const errorKey = error?.code || error?.message || 'unknown';
    const currentAttempts = errorRecoveryRef.current[errorKey] || 0;
    
    if (isFatal || currentAttempts >= 3) {
      Alert.alert(
        'Call Error',
        `There was an issue with the call: ${error?.message || 'Unknown error'}`,
        [{ text: 'End Call', onPress: () => handleEndCall() }],
        { cancelable: false }
      );
    } else {
      // For non-fatal errors, track recovery attempts
      errorRecoveryRef.current[errorKey] = currentAttempts + 1;
      console.log(`[MeetingView] Handling recoverable error (attempt ${currentAttempts + 1}/3):`, error?.message);
      
      // If it's a network error, show reconnecting UI
      if (isNetworkError(error)) {
        setCallState('reconnecting');
        setIsRecovering(true);
        
        // Auto-clear recovery state after 10 seconds
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            setIsRecovering(false);
          }
        }, 10000);
      }
    }
  }, [isNetworkError, handleEndCall]);

  const checkIfAloneInCall = useCallback(() => {
    // After a participant leaves, check if we're alone
    // If alone for more than 30 seconds, prompt to end call
    if (participants.size <= 1) {
      // Set a timer that will prompt to end call if still alone
      const aloneTimer = setTimeout(() => {
        if (participants.size <= 1 && callState === 'connected' && isComponentMountedRef.current) {
          Alert.alert(
            'Still in call',
            'You appear to be alone in this call. Would you like to end it?',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'End Call', style: 'destructive', onPress: () => handleEndCall() }
            ]
          );
        }
      }, 30000); // 30 seconds
      
      return () => clearTimeout(aloneTimer);
    }
  }, [participants, callState, handleEndCall]);

  const ensureOngoingCallNotification = useCallback(() => {
    try {
      // Update or create the ongoing call notification
      if (Platform.OS === 'android') {
        const message = `${callType === 'voice' ? 'Voice' : 'Video'} call with ${recipientName}`;
        const durationText = callState === 'connected' ? ` - ${formatCallDuration(callDuration)}` : '';
        
        OngoingCallModule.updateOngoingCallNotification(message + durationText);
      }
    } catch (error) {
      console.error('[MeetingView] Error updating call notification:', error);
    }
  }, [callType, recipientName, callState, callDuration, formatCallDuration]);

  // Network Quality Monitoring
  const monitorNetworkQuality = useCallback(() => {
    // Simple network quality simulation - replace with actual network monitoring
    const checkQuality = () => {
      if (!isComponentMountedRef.current) return;
      
      const now = Date.now();
      const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;
      
      if (timeSinceLastHeartbeat > 10000) {
        setNetworkQuality('poor');
        setCallState('reconnecting');
      } else if (timeSinceLastHeartbeat > 5000) {
        setNetworkQuality('fair');
      } else if (timeSinceLastHeartbeat > 2000) {
        setNetworkQuality('good');
      } else {
        setNetworkQuality('excellent');
      }
      
      lastHeartbeatRef.current = now;
    };
    
    const interval = setInterval(checkQuality, 2000);
    heartbeatIntervalRef.current = interval;
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, []);

  // Notification Sync Service
  const startNotificationSync = useCallback(() => {
    const syncNotifications = () => {
      if (!isComponentMountedRef.current) return;
      
      ensureOngoingCallNotification();
    };
    
    // Sync notifications every 5 seconds
    notificationSyncRef.current = setInterval(syncNotifications, 5000);
    
    return () => {
      if (notificationSyncRef.current) {
        clearInterval(notificationSyncRef.current);
        notificationSyncRef.current = null;
      }
    };
  }, [ensureOngoingCallNotification]);
  


  // Toggle mic - USE CENTRALIZED MEDIA MANAGER
  const handleToggleMic = useCallback(async () => {
    await callMediaManager.toggleMic();
  }, [callMediaManager]);

  // Toggle camera - BULLETPROOF IMPLEMENTATION WITH MULTI-LAYER APPROACH
  const handleToggleCamera = useCallback(async () => {
    console.log('[MeetingView] 📹 TOGGLE CAMERA INITIATED:', {
      currentWebcamOn: webcamOn,
      currentCameraEnabled: cameraEnabled,
      hasToggleWebcam: !!meetingHooks?.toggleWebcam,
      hasWebcamStream: !!webcamStream,
      streamId: webcamStream?.id || 'none',
      localParticipantId: localParticipant?.id,
    });
    
    try {
      // Force extra logging for debugging
      DeviceEventEmitter.emit('logEvent', {
        type: 'cameraToggle',
        action: 'start',
        webcamOn,
        cameraEnabled
      });
    
      // BULLETPROOF CAMERA TOGGLE: Coordinated approach between VideoSDK and CallMediaManager
      
      // 1. Toggle camera in our CallMediaManager first
      await callMediaManager.toggleCamera();
      console.log('[MeetingView] ✅ CallMediaManager toggleCamera completed');
      
      // 2. Direct use of VideoSDK toggleWebcam for guaranteed VideoSDK state change
      if (meetingHooks && meetingHooks.toggleWebcam) {
        console.log('[MeetingView] 🎬 Using VideoSDK toggleWebcam directly...');
        
        // Get the state we just toggled to
        const expectedCameraState = callMediaManager.getMediaState().cameraEnabled;
        
        // Only toggle VideoSDK if it's not in the expected state
        if (webcamOn !== expectedCameraState) {
          // Use timeout promise to prevent hanging if toggleWebcam doesn't resolve
          await Promise.race([
            meetingHooks.toggleWebcam(),
            new Promise(resolve => setTimeout(resolve, 2000))
          ]);
          
          console.log('[MeetingView] ✅ VideoSDK toggleWebcam completed');
        }
        
        // 3. Force update the media state to ensure UI and VideoSDK state are aligned
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            const localParticipantForUpdate = meetingHooks.localParticipant;
            const actualWebcamState = localParticipantForUpdate?.webcamOn;
            
            // Only force update if there's still a mismatch
            if (callMediaManager.getMediaState().cameraEnabled !== actualWebcamState) {
              console.log('[MeetingView] 🔄 Forcing camera state alignment');
              callMediaManager.forceUpdateMediaState({
                cameraEnabled: !!actualWebcamState
              });
            }
            
            // Log the final state
            console.log('[MeetingView] 📹 FINAL CAMERA STATE:', {
              videoSDKWebcamOn: actualWebcamState,
              mediaManagerCameraEnabled: callMediaManager.getMediaState().cameraEnabled,
              hasWebcamStream: !!webcamStream,
              streamId: webcamStream?.id || 'none'
            });
          }
        }, 500);
      } else {
        console.log('[MeetingView] ℹ️ No VideoSDK webcam control available, using CallMediaManager only');
      }
    } catch (error) {
      console.error('[MeetingView] ❌ Error toggling camera:', error);
    }
  }, [callMediaManager, meetingHooks, webcamOn, cameraEnabled, webcamStream]);

  // Toggle speaker - USE CENTRALIZED MEDIA MANAGER
  const handleToggleSpeaker = useCallback(async () => {
    await callMediaManager.toggleSpeaker();
  }, [callMediaManager]);

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

  // Other handlers
  const handleSwitchCamera = useCallback(() => {
    // Implement camera switching functionality
  }, []);

  const handleShowParticipants = useCallback(() => {
    // Implement showing participants list
  }, []);

  const handleFlipCamera = useCallback(() => {
    // Implement camera flip functionality
  }, []);

  const handleOpenChat = useCallback(() => {
    // Implement chat functionality
  }, []);

  const handleMoreOptions = useCallback(() => {
    // Implement more options functionality
  }, []);

  // Simplified media state management - rely on centralized CallMediaManager
  const handleMediaStateChange = useCallback((newState: MediaState) => {
    if (isComponentMountedRef.current) {
      setMediaState(newState);
    }
  }, []);

  // This effect will handle media state initialization in a clean way
  useEffect(() => {
    // Set up subscription to media state changes
    const unsubscribe = callMediaManager.subscribe(handleMediaStateChange);
    
    // Set initial state
    const initialState = callMediaManager.getMediaState();
    handleMediaStateChange(initialState);
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [callMediaManager, handleMediaStateChange]);

  // Enhanced App State Handling - BULLETPROOF IMPLEMENTATION
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('[MeetingView] App state changed:', nextAppState);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('[MeetingView] App came to foreground');
        
        // Re-sync call state
        const whatsAppCallManager = WhatsAppCallManager.getInstance();
        const currentCall = whatsAppCallManager.getCurrentCall();
        
        if (currentCall && currentCall.status !== 'ended') {
          // Verify meeting is still active and re-sync if needed
          if (hasJoined) {
            console.log('[MeetingView] Call still active, refreshing UI');
            ensureOngoingCallNotification();
          } else {
            console.log('[MeetingView] Call state mismatch, attempting recovery');
            // Handle potential state mismatch - maybe rejoin?
            if (join && !isJoining && !hasJoined && callState !== 'ended') {
              setIsJoining(true);
              join();
            }
          }
        } else if (callState !== 'ended') {
          // Call might have ended while we were in background
          console.log('[MeetingView] Call appears to have ended while in background');
          handleEndCall();
        }
      } else if (nextAppState.match(/inactive|background/) && appStateRef.current === 'active') {
        // App went to background
        console.log('[MeetingView] App went to background');
        // Make sure notification is showing when app is backgrounded
        ensureOngoingCallNotification();
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [hasJoined, isJoining, callState, join, handleEndCall, ensureOngoingCallNotification]);

  // Handle hardware back button on Android - BULLETPROOF
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show confirmation when trying to exit call with back button
      Alert.alert(
        'End Call?',
        'Do you want to end this call?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'End Call', style: 'destructive', onPress: handleEndCall }
        ]
      );
      return true; // Prevent default back action
    });
    
    return () => backHandler.remove();
  }, [handleEndCall]);

  // Add reconnection logic - BULLETPROOF IMPLEMENTATION
  useEffect(() => {
    let reconnectionTimer: NodeJS.Timeout | null = null;
    
    if (callState === 'reconnecting' && join && !isJoining) {
      reconnectionTimer = setTimeout(async () => {
        reconnectionAttemptRef.current += 1;
        
        if (reconnectionAttemptRef.current <= maxReconnectionAttempts) {
          console.log(`[MeetingView] Attempting reconnection (${reconnectionAttemptRef.current}/${maxReconnectionAttempts})`);
          setIsJoining(true);
          
          try {
            await join();
          } catch (error) {
            console.error('[MeetingView] Reconnection attempt failed:', error);
            setIsJoining(false);
          }
        } else {
          console.log('[MeetingView] Max reconnection attempts reached, ending call');
          Alert.alert(
            'Connection Lost',
            'Unable to reconnect to the call after multiple attempts.',
            [{ text: 'OK', onPress: () => handleEndCall() }],
            { cancelable: false }
          );
        }
      }, 2000); // Wait 2 seconds between reconnection attempts
    } else if (callState === 'connected') {
      // Reset reconnection attempts when successfully connected
      reconnectionAttemptRef.current = 0;
    }
    
    return () => {
      if (reconnectionTimer) clearTimeout(reconnectionTimer);
    };
  }, [callState, join, isJoining, handleEndCall]);

  // Initialize monitoring services - BULLETPROOF
  useEffect(() => {
    // Start network quality monitoring
    const cleanupNetworkMonitoring = monitorNetworkQuality();
    
    // Start notification sync service
    const cleanupNotificationSync = startNotificationSync();
    
    // Cleanup function
    return () => {
      cleanupNetworkMonitoring();
      cleanupNotificationSync();
      
      // Mark component as unmounted
      isComponentMountedRef.current = false;
      
      // Clear all timers
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      if (notificationSyncRef.current) {
        clearInterval(notificationSyncRef.current);
        notificationSyncRef.current = null;
      }
    };
  }, [monitorNetworkQuality, startNotificationSync]);

  // Enhanced UI for status display with network quality
  const getCallStatusText = () => {
    if (callState === 'connecting') {
      return 'Connecting...';
    } else if (callState === 'reconnecting') {
      return `Reconnecting... (${reconnectionAttemptRef.current}/${maxReconnectionAttempts})`;
    } else if (callState === 'connected') {
      const qualityText = networkQuality !== 'excellent' ? ` (${networkQuality} connection)` : '';
      return `Connected${qualityText} - ${formatCallDuration(callDuration)}`;
    } else {
      return 'Call ended';
    }
  };

  const getCallStatusColor = () => {
    if (callState === 'connected') {
      switch (networkQuality) {
        case 'excellent': return '#00D4AA';
        case 'good': return '#4CAF50';
        case 'fair': return '#FF9800';
        case 'poor': return '#F44336';
        default: return '#00D4AA';
      }
    } else if (callState === 'reconnecting') {
      return '#FF9800';
    } else {
      return '#666';
    }
  };

  // Component cleanup
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      stopCallDurationTimer();
    };
  }, [stopCallDurationTimer]);

  // Create participants array for VideoCallInterface
  const participantsForVideoInterface = useMemo(() => {
    const participants = [];
    
    // Get the first remote participant from the meeting
    const remoteParticipants = Array.from(meetingHooks?.participants?.values() || []);
    const remoteParticipant = remoteParticipants.find(p => p.id !== localParticipant?.id);
    
    // Add remote participant
    participants.push({
      id: 'remote',
      name: recipientName,
      isSelf: false,
      micMuted: false,
      webcamOn: remoteParticipant?.webcamOn || false,
      webcamStream: null, // Remote participant stream would be handled by VideoSDK
    });
    
    // Add local participant
    participants.push({
      id: 'local',
      name: 'You',
      isSelf: true,
      micMuted: !micEnabled,
      webcamOn: webcamOn,
      webcamStream: webcamStream,
    });
    
    return participants;
  }, [recipientName, micEnabled, webcamOn, webcamStream, meetingHooks?.participants, localParticipant?.id]);

  // If it's a video call, use the VideoCallInterface component with VideoSDK streams
  if (callType === 'video') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        {/* Top call info bar */}
        <View style={styles.callInfoBar}>
          <View style={styles.callInfoContent}>
            <Text style={styles.callDuration}>
              {callState === 'connecting' ? 'Connecting...' : 
               callState === 'reconnecting' ? 'Reconnecting...' : 
               formatCallDuration(callDuration)}
            </Text>
            <Text style={styles.callEndToEndText}>End-to-end encrypted call</Text>
          </View>
        </View>
        
        {/* Video participants container */}
        <View style={styles.videoContainer}>
          {/* Remote participant (main view) */}
          <View style={styles.largeVideo}>
            {Array.from(participants.values())
              .filter(p => p.id !== localParticipant?.id)
              .slice(0, 1) // Render the first remote participant
              .map(remoteParticipant => (
                <ParticipantView
                  key={remoteParticipant.id}
                  participantId={remoteParticipant.id}
                  isLocal={false}
                  style={styles.largeVideo}
                />
              ))
            }
            {/* Fallback if no remote participant is present */}
            {participants.size <= 1 && (
              <View style={styles.videoPlaceholder}>
                <View style={styles.participantInitialContainer}>
                  <Text style={styles.participantInitial}>
                    {recipientName.charAt(0).toUpperCase()}
                  </Text>
                  <Text style={styles.recipientNameText}>
                    {recipientName}
                  </Text>
                  <Text style={styles.callStatusText}>
                    {callState === 'connecting' ? 'Connecting...' : 'Waiting for participant...'}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Local participant (small self-view) */}
          <View style={styles.selfViewContainer}>
            {localParticipant ? (
              <ParticipantView
                participantId={localParticipant.id}
                isLocal={true}
                style={styles.smallVideo}
              />
            ) : (
              /* Placeholder when no localParticipant yet */
              <View style={[styles.smallVideo, { backgroundColor: '#1F2C34' }]}>
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    {callState === 'connecting' ? 'Connecting...' : 'Activating camera...'}
                  </Text>
                  {callState === 'connecting' && (
                    <ActivityIndicator size="small" color="#00D4AA" />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
        
        {/* Call controls */}
        {showControls && (
          <Animated.View style={[styles.controlsWrapper, { opacity: controlsOpacity }]}>

            <CallControls
              micEnabled={micOn}
              cameraEnabled={webcamOn}
              speakerEnabled={speakerEnabled}
              callType={callType}
              onToggleMic={handleToggleMic}
              onToggleCamera={handleToggleCamera}
              onToggleSpeaker={handleToggleSpeaker}
              onEndCall={handleEndCall}
              onSwitchCamera={handleSwitchCamera}
              onShowParticipants={handleShowParticipants}
            />
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  // WhatsApp-style UI for voice call
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Top call info bar */}
      <View style={styles.callInfoBar}>
        <View style={styles.callInfoContent}>
          <Text style={styles.callDuration}>
            {callState === 'connecting' ? 'Connecting...' : 
             callState === 'reconnecting' ? 'Reconnecting...' : 
             formatCallDuration(callDuration)}
          </Text>
          <Text style={styles.callEndToEndText}>End-to-end encrypted call</Text>
        </View>
      </View>
      
      {/* Main voice call area - tappable to toggle controls */}
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={toggleControlsVisibility}
      >
        <View style={styles.voiceCallContainer}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.recipientNameText}>{recipientName}</Text>
          <Text style={[styles.callStatusText, { color: getCallStatusColor() }]}>

            {getCallStatusText()}
          </Text>
          
          {/* Network quality indicator for poor connections */}
          {networkQuality === 'poor' && (
            <Text style={[styles.networkIndicator, { color: '#F44336' }]}>
              Poor connection - audio may be affected
            </Text>
          )}
          
          {/* Recovery indicator */}
          {isRecovering && (
            <Text style={[styles.networkIndicator, { color: '#FF9800' }]}>
              Attempting to recover connection...
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Call controls */}
      {showControls && (
        <Animated.View style={[styles.controlsWrapper, { opacity: controlsOpacity }]}>

          <CallControls
            micEnabled={micOn}
            cameraEnabled={webcamOn}
            speakerEnabled={speakerEnabled}
            callType={callType}
            onToggleMic={handleToggleMic}
            onToggleCamera={handleToggleCamera}
            onToggleSpeaker={handleToggleSpeaker}
            onEndCall={handleEndCall}
            onSwitchCamera={handleSwitchCamera}
            onShowParticipants={handleShowParticipants}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

/**
 * Main Meeting Screen component with error boundary
 */
const MeetingScreen = () => {
  const route = useRoute<MeetingScreenRouteProp>();
  const { activeCall } = useCall();
  
  // BULLETPROOF FIX: Always get the latest media state from the centralized CallMediaManager
  const callMediaManager = useRef(CallMediaManager.getInstance()).current;
  const initialMediaState = callMediaManager.getMediaState();
  
  // Use route params with fallbacks
  const meetingId = route.params?.meetingId || activeCall?.meetingId;
  const token = route.params?.token || activeCall?.token;
  const displayName = route.params?.displayName || activeCall?.callerName || 'User';
  const callType = route.params?.callType || activeCall?.callType || 'voice';
  const recipientName = route.params?.recipientName || activeCall?.recipientName || 'Participant';

  if (!meetingId || !token || !displayName) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text style={styles.loadingText}>Preparing call...</Text>
          <Text style={styles.loadingText}>
            {!meetingId ? 'Missing meeting ID' : 
             !token ? 'Missing authentication token' : 
             'Initializing call session'}
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
          micEnabled: initialMediaState.micEnabled,
          webcamEnabled: callType === 'video' ? true : initialMediaState.cameraEnabled,
          name: displayName,
          notification: {
            title: "Call in Progress",
            message: `${callType === 'video' ? 'video' : 'voice'} call with ${recipientName}`
          }
        }}
        token={token}
        joinWithoutUserInteraction={false}
      >
        <MeetingView
          meetingId={meetingId}
          callType={callType}
          token={token}
          localParticipantId={activeCall?.callerId || ""}
          recipientName={recipientName}
        />
      </MeetingProvider>
    </CallErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  callInfoBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  callInfoContent: {
    alignItems: 'center',
  },
  callDuration: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  callEndToEndText: {
    color: '#aaa',
    fontSize: 12,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantVideo: {
    overflow: 'hidden',
    backgroundColor: '#1F2C34',
  },
  largeVideo: {
    width: '100%',
    height: '100%',
  },
  smallVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selfViewContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#000', // Add this to ensure visibility during loading
    zIndex: 10, // Add this to ensure it appears on top
  },
  localVideoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
  },
  localVideoStatus: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitialContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    color: '#00A884',
    fontSize: 40,
    fontWeight: '600',
  },
  youLabel: {
    position: 'absolute',
    bottom: 8,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
  },
  voiceCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    color: '#5ACFAA',
    fontSize: 80,
    fontWeight: '600',
  },
  recipientNameText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    marginTop: 24,
  },
  callStatusText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 8,
  },
  networkIndicator: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B3B3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF4343',
  }
});

export default MeetingScreen;
