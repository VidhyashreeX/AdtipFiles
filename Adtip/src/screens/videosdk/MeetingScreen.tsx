/**
 * IMPORTANT: For optimal performance and to prevent race conditions,
 * ensure UnifiedCallService.getInstance().initialize() is called
 * in your main App component and awaited before rendering the main app.
 * 
 * Example App.tsx pattern:
 * 
 * const App = () => {
 *   const [isInitialized, setIsInitialized] = useState(false);
 *   
 *   useEffect(() => {
 *     const initServices = async () => {
 *       const success = await UnifiedCallService.getInstance().initialize();
 *       setIsInitialized(success);
 *     };
 *     initServices();
 *   }, []);
 *   
 *   if (!isInitialized) {
 *     return <LoadingScreen />;
 *   }
 *   
 *   return <MainNavigator />;
 * };
 */

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
import { useCall, ActiveCall } from '../../contexts/CallProvider';
import { useTheme } from '../../contexts/ThemeContext';
import UnifiedCallService from '../../services/calling/UnifiedCallService';
import CallMediaManager, { MediaState } from '../../services/calling/CallMediaManager';
import { 
  Mic, MicOff, Camera, CameraOff, Phone, 
  Video, VideoOff, Speaker, Users
} from 'lucide-react-native';
import { MainNavigatorParamList } from '../../types/navigation';
import { appEventEmitter } from '../../events/AppEventEmitter';
import { VideoSDKParticipantView, ParticipantView } from '../../components/videosdk';
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
  isConnecting?: boolean;
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
  isConnecting = false,
}) => {
  return (
    <View style={styles.controlsContainer}>
      <View style={styles.controlRow}>
        {/* Speaker button */}
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onToggleSpeaker}
          disabled={isConnecting}
        >
          <Speaker color={isConnecting ? "#666" : "#fff"} size={22} style={{ opacity: speakerEnabled ? 1 : 0.5 }} />
        </TouchableOpacity>
        
        {/* Video button - only show in video calls */}
        {callType === 'video' && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={onToggleCamera}
            disabled={isConnecting}
          >
            {cameraEnabled ? (
              <Video color={isConnecting ? "#666" : "#fff"} size={22} />
            ) : (
              <VideoOff color={isConnecting ? "#666" : "#fff"} size={22} />
            )}
          </TouchableOpacity>
        )}
        
        {/* Mic button */}
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onToggleMic}
          disabled={isConnecting}
        >
          {micEnabled ? (
            <Mic color={isConnecting ? "#666" : "#fff"} size={22} />
          ) : (
            <MicOff color={isConnecting ? "#666" : "#fff"} size={22} />
          )}
        </TouchableOpacity>
        
        {/* End call button - ALWAYS ENABLED */}
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
          disabled={isConnecting}
        >
          <Users color={isConnecting ? "#666" : "#fff"} size={22} />
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
  console.log('[MeetingView] 🎬 MEETING VIEW INITIALIZED:');
  console.log('[MeetingView] 📋 Props received:', {
    meetingId,
    callType,
    token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    localParticipantId: initialLocalParticipantId,
    recipientName
  });
  
  const { activeCall: currentActiveCall } = useCall(); // Rename to avoid confusion
  const unifiedCallService = UnifiedCallService.getInstance(); // Get instance directly
  const callMediaManager = CallMediaManager.getInstance(); // Get instance directly 
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
  const route = useRoute<any>(); // Type as any to resolve route.params.meetingId error

  console.log('[MeetingView] 📋 Current active call from context:', {
    hasActiveCall: !!currentActiveCall,
    activeCallType: currentActiveCall?.callType,
    activeCallId: currentActiveCall?.callId
  });

  // --- LINT FIX: Removed redundant meeting state ---
  // We use meetingHooks from useMeeting instead of a separate meeting state

  // LATCH THE INITIAL CALL DATA FROM ROUTE PARAMS OR UNIFIEDCALLSERVICE
  const latchedCallDataRef = useRef<{
    meetingId: string;
    callType: 'voice' | 'video';
    token: string;
    recipientName: string;
  } | null>(null);

  // Initialize latched call data on first render
  if (!latchedCallDataRef.current) {
    // Try UnifiedCallService first as it's the source of truth
    const unifiedCall = unifiedCallService.getCurrentCall();
    console.log('[MeetingView] 📋 UnifiedCallService current call:', {
      hasUnifiedCall: !!unifiedCall,
      unifiedCallType: unifiedCall?.callType,
      unifiedCallId: unifiedCall?.callId,
      unifiedMeetingId: unifiedCall?.meetingId
    });
    
    if (unifiedCall && unifiedCall.meetingId === meetingId) {
      latchedCallDataRef.current = {
        meetingId: unifiedCall.meetingId,
        callType: unifiedCall.callType,
        token: unifiedCall.token,
        recipientName: unifiedCall.isInitiator ? unifiedCall.recipientName : unifiedCall.callerName
      };
      console.log('[MeetingView] ✅ Using UnifiedCallService data for latched call:', latchedCallDataRef.current);
    } else {
      // Fallback to props (from route params)
      latchedCallDataRef.current = { meetingId, callType, token, recipientName };
      console.log('[MeetingView] ⚠️ Using props/route data for latched call:', latchedCallDataRef.current);
    }
  }

  console.log('[MeetingView] 🎯 FINAL LATCHED CALL DATA:', {
    latchedCallType: latchedCallDataRef.current?.callType,
    latchedMeetingId: latchedCallDataRef.current?.meetingId,
    latchedRecipientName: latchedCallDataRef.current?.recipientName
  });

  const [localParticipantId, setLocalParticipantId] = useState(initialLocalParticipantId);
  const [showControls, setShowControls] = useState(true);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isInitializingService, setIsInitializingService] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'reconnecting' | 'ended'>('connecting');
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [isRecovering, setIsRecovering] = useState(false);
  const connectedRecentlyRef = useRef(false); // Grace period after connecting
  
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
  const hasAttemptedJoinRef = useRef(false);
  const isLeavingRef = useRef(false);

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
      
      // CRITICAL FIX: Start grace period to ignore null activeCall for a short time
      connectedRecentlyRef.current = true;
      setTimeout(() => {
        connectedRecentlyRef.current = false;
      }, 2000); // 2-second grace period after joining
      
      // Connect media management to VideoSDK meeting
      unifiedCallService.setVideoSDKMeeting(meetingHooks);
      
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
      setCallState('ended');
      // If the error is fatal (e.g., websocket error, join failure), end the call
      if (isFatalError(error)) {
        console.log('[MeetingView] Fatal VideoSDK error detected, ending call.');
        UnifiedCallService.getInstance().endCall();
      }
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

  // ✅ CRITICAL FIX: Add listener for cleanup completion to ensure proper coordination
  useEffect(() => {
    const handleCleanupComplete = (event: { timestamp: number; error?: string }) => {
      console.log('[MeetingView] Received callMediaCleanupComplete event from UnifiedCallService:', event);
      
      // If there was an error during cleanup, log it but don't fail the component
      if (event.error) {
        console.warn('[MeetingView] Media cleanup completed with error:', event.error);
      } else {
        console.log('[MeetingView] Media cleanup completed successfully');
      }
      
      // Ensure component state is properly reset for next call
      if (isComponentMountedRef.current) {
        setIsJoining(false);
        setIsInitializingService(false);
        setIsEndingCall(false);
      }
    };

    appEventEmitter.on('callMediaCleanupComplete', handleCleanupComplete);

    return () => {
      appEventEmitter.off('callMediaCleanupComplete', handleCleanupComplete);
    };
  }, []);

  // NEW: Add a listener for the 'leaveCurrentCall' event from the service.
  useEffect(() => {
    const handleLeaveRequest = (event: { callId: string }) => {
      console.log('[MeetingView] Received leaveCurrentCall event from service.');
      if (leave && !isLeavingRef.current) {
        console.log('[MeetingView] Executing leave() from event listener.');
        isLeavingRef.current = true;
        leave();
      }
    };

    appEventEmitter.on('leaveCurrentCall', handleLeaveRequest);

    return () => {
      appEventEmitter.off('leaveCurrentCall', handleLeaveRequest);
    };
  }, [leave]); // FIX: Add `leave` as a dependency


  // BULLETPROOF FIX: Explicitly join the meeting on component mount with retry logic
  useEffect(() => {
    if (join && !hasJoined && !isJoining && !hasAttemptedJoinRef.current) {
      hasAttemptedJoinRef.current = true;
      setIsJoining(true);
      (async () => {
        try {
          // ✅ CRITICAL: Ensure UnifiedCallService is fully initialized before joining
          console.log('[MeetingView] Ensuring UnifiedCallService is initialized before joining...');
          setIsInitializingService(true);
          const isServiceReady = await unifiedCallService.ensureInitialized();
          setIsInitializingService(false);
          
          if (!isServiceReady) {
            console.error('[MeetingView] UnifiedCallService initialization failed, aborting join');
            Alert.alert(
              'Service Error',
              'Call service failed to initialize. Please restart the app and try again.',
              [{ text: 'OK', onPress: () => setIsJoining(false) }],
              { cancelable: false }
            );
            return;
          }
          console.log('[MeetingView] ✅ UnifiedCallService is ready, proceeding with join');

          // CRITICAL FIX: Ensure that for video calls, camera is enabled before joining
          if (callType === 'video') {
            if (!mediaState.cameraEnabled) {
              console.log('[MeetingView] Pre-enabling camera for video call before joining');
              await callMediaManager.setCameraEnabled(true);
            }
            // Verify camera is enabled
            const verifiedState = callMediaManager.getMediaState();
            if (!verifiedState.cameraEnabled) {
              console.error('[MeetingView] ERROR: Camera could not be enabled before join. Aborting join.');
              Alert.alert(
                'Camera Error',
                'Unable to enable camera for video call. Please check camera permissions and try again.',
                [{ text: 'OK', onPress: () => setIsJoining(false) }],
                { cancelable: false }
              );
              return;
            }
          }

          // Add a small delay to ensure VideoSDK is fully ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await join();
          console.log('[MeetingView] Join call successful');
          if (callType === 'video') {
            setTimeout(() => {
              if (isComponentMountedRef.current) {
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
          setIsInitializingService(false);
          // Retry after a short delay, but only if not unmounting
          setTimeout(() => {
            if (!hasJoined && isComponentMountedRef.current && !isLeavingRef.current) {
              hasAttemptedJoinRef.current = false;
            }
          }, 2000);
        }
      })();
    }
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
    };
  }, [join, hasJoined, isJoining]);

  // Connect VideoSDK meeting to media manager for direct control
  useEffect(() => {
    if (meetingHooks) {
      callMediaManager.setMeeting(meetingHooks);
    }
  }, [meetingHooks, callMediaManager]);

  // BULLETPROOF FIX: Synchronize CallMediaManager state FROM VideoSDK state.
  // This is the core of the fix. It ensures that the SDK is the source of truth
  // and our centralized manager passively updates itself to match.
  useEffect(() => {
    if (hasJoined) {
      // The `micOn` and `webcamOn` from useParticipant are the ground truth.
      // We sync our manager with this truth whenever it changes.
      callMediaManager.syncStateFromSDK({ micOn, webcamOn });
    }
  }, [hasJoined, micOn, webcamOn, callMediaManager]);

  /*
  //Removed due to end call issues
  // BULLETPROOF FIX: Listen for activeCall changes to prevent navigation loops
  // BUT make it less aggressive - only exit if we don't have latched data to work with
  useEffect(() => {
    // CRITICAL RACE CONDITION FIX: Only handle external termination if we actually had an active call
    // and don't have sufficient latched data to continue
    if (!currentActiveCall && !isEndingCall && isComponentMountedRef.current) {
      // BULLETPROOF FIX: Check if we have latched call data to continue with
      const hasLatchedData = latchedCallDataRef.current && 
                           latchedCallDataRef.current.meetingId && 
                           latchedCallDataRef.current.token;
      
      if (hasLatchedData) {
        console.log('[MeetingView] ActiveCall is null but we have latched data, continuing with meeting');
        return;
      }
      
      // CRITICAL FIX: Check grace period to prevent premature termination
      if (connectedRecentlyRef.current) {
        console.log('[MeetingView] Ignoring null activeCall during post-connection grace period');
        return;
      }
      
      console.log('[MeetingView] ActiveCall became null and no latched data, call ended externally by UnifiedCallService');
      
      // CRITICAL: Set a flag to prevent any further navigation attempts
      setIsEndingCall(true);
      
      // Leave VideoSDK meeting silently without triggering additional navigation
      if (leave) {
        console.log('[MeetingView] Leaving VideoSDK meeting due to external call end');
        try {
          leave();
        } catch (error) {
          console.error('[MeetingView] Error leaving meeting:', error);
        }
      }
      
      // CRITICAL FIX: Navigate immediately without waiting for hasJoined condition
      setTimeout(() => {
        if (!navigation || !isComponentMountedRef.current) return;
        
        try {
          const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
          if (currentRoute === 'Meeting') {
            console.log('[MeetingView] Navigating away from MeetingScreen due to external call end');
            
            // BULLETPROOF NAVIGATION: Try multiple fallback methods
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
              });
            }
          } else {
            console.log('[MeetingView] Already navigated away from Meeting screen');
          }
        } catch (error) {
          console.error('[MeetingView] Navigation error in activeCall cleanup:', error);
          // Final fallback - force reset to a known good state
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
            });
          } catch (finalError) {
            console.error('[MeetingView] Final navigation fallback failed:', finalError);
          }
        }
      }, 200); // Increased delay to allow UnifiedCallService to complete its operations
    }
  }, [currentActiveCall, isEndingCall, navigation, leave]);
  */
  // ✅ CRITICAL FIX: Enhanced call state change listener with proper coordination
  useEffect(() => {
    const handleCallStateChange = (event: { status: string; callId: string }) => {
      // Only act if the event is for the current call
      const currentCallId = latchedCallDataRef.current?.meetingId;
      if (!currentCallId) return;

      if (event.status === 'ended' && isComponentMountedRef.current) {
        console.log('[MeetingView] Call ended event received from UnifiedCallService. Navigating away.');
        setCallState('ended');
        
        // ✅ CRITICAL FIX: Prevent multiple navigation attempts
        if (!isEndingCall) {
          setIsEndingCall(true);
          
          // ✅ CRITICAL FIX: Wait for VideoSDK to fully leave before navigating
          setTimeout(() => {
            if (!navigation || !isComponentMountedRef.current) return;
            
            try {
              const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
              if (currentRoute === 'Meeting') {
                console.log('[MeetingView] Navigating away due to callStateChanged event.');
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
                  });
                }
              }
            } catch (error) {
              console.error('[MeetingView] Navigation error in call state change:', error);
              // Fallback navigation
              try {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
                });
              } catch (fallbackError) {
                console.error('[MeetingView] Fallback navigation also failed:', fallbackError);
              }
            }
          }, 1500); // Increased delay to 1.5 seconds to ensure proper cleanup and prevent race conditions
        }
      }
    };

    // Listen for call state changes from UnifiedCallService
    appEventEmitter.on('callStateChanged', handleCallStateChange);
    
    return () => {
      appEventEmitter.off('callStateChanged', handleCallStateChange);
    };
  }, [navigation]); // Removed isEndingCall dependency to prevent blocking

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

  // ✅ CRITICAL FIX: Enhanced handleEndCall with proper coordination
  const handleEndCall = useCallback(async () => {
    console.log('[MeetingView] handleEndCall triggered. isEndingCall:', isEndingCall);

    if (isEndingCall) {
      console.log('[MeetingView] Call is already ending. Ignoring subsequent trigger.');
      return;
    }

    setIsEndingCall(true); // Set state immediately to prevent re-entry
    console.log('[MeetingView] setIsEndingCall(true) called, calling UnifiedCallService.endCall()');

    try {
      // ✅ CRITICAL FIX: Call UnifiedCallService.endCall() and let it handle everything
      await UnifiedCallService.getInstance().endCall();
      console.log('[MeetingView] UnifiedCallService.endCall() resolved');
      // Navigation is now handled by the `callStateChanged` event listener with proper timing
    } catch (error) {
      console.error('[MeetingView] Error during handleEndCall -> unifiedCallService.endCall():', error);
      setIsEndingCall(false); 
    }
  }, [isEndingCall]);

  // Helper to determine if error is fatal
  const isFatalError = useCallback((error: any) => {
    // Customize this logic as needed for your error objects
    const fatalErrorCodes = [
      'INVALID_TOKEN', 'TOKEN_EXPIRED', 'MEETING_ENDED', 'INVALID_PERMISSIONS', 'WEBSOCKET_ERROR', 'CONNECTION_ERROR', 'JOIN_FAILED', 'SOCKET_DISCONNECTED', 'SOCKET_ERROR', 'NETWORK_ERROR', 'SERVER_ERROR'
    ];
    // Check for code or message
    if (error?.code && fatalErrorCodes.includes(error.code)) return true;
    if (typeof error?.message === 'string') {
      return fatalErrorCodes.some(code => error.message.toUpperCase().includes(code));
    }
    return false;
  }, []);

  const isNetworkError = useCallback((error: any) => {
    const networkErrorCodes = ['CONNECTION_LOST', 'RECONNECTION_FAILED'];
    return error?.code && networkErrorCodes.includes(error.code);
  }, []);

  const updateCallState = useCallback((status: 'connecting' | 'connected' | 'reconnecting' | 'ended') => {
    try {
      const unifiedCallService = UnifiedCallService.getInstance();
      const currentCall = unifiedCallService.getCurrentCall();
      if (currentCall) {
        // Map reconnecting to connecting for the call manager
        const mappedStatus = status === 'reconnecting' ? 'connecting' : status;
        unifiedCallService.updateCallStatus(mappedStatus);
      }
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
      // NOTE: Notification management is now handled by UnifiedCallService
      // which provides a centralized and coordinated approach
      // The ongoing call notification is automatically managed by UnifiedCallService
      console.log('[MeetingView] Notification sync handled by UnifiedCallService');
    } catch (error) {
      console.error('[MeetingView] Error syncing notification:', error);
    }
  }, []);

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
    // The UI action is simple: just tell the manager what to do.
    await callMediaManager.toggleMic();
  }, [callMediaManager]);

  // Toggle camera - SIMPLIFIED & RELIABLE IMPLEMENTATION
  const handleToggleCamera = useCallback(async () => {
    // The UI action is simple: just tell the manager what to do.
    // The manager is responsible for interacting with the SDK.
    // The UI will update automatically when the SDK state changes,
    // which is detected by the `syncStateFromSDK` useEffect hook.
    await callMediaManager.toggleWebcam();
  }, [callMediaManager]);

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
      
      // CRITICAL FIX: Don't handle app state changes if call is already ending
      if (isEndingCall) {
        console.log('[MeetingView] Call is ending, ignoring app state change to prevent race condition');
        return;
      }
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('[MeetingView] App came to foreground');
        
        // Re-sync call state
        const unifiedCallService = UnifiedCallService.getInstance();
        const currentCall = unifiedCallService.getCurrentCall();
        
        if (currentCall && currentCall.status !== 'ended') {
          // Verify meeting is still active and re-sync if needed
          if (hasJoined) {
            console.log('[MeetingView] Call still active, refreshing UI');
            ensureOngoingCallNotification();
          } else {
            console.log('[MeetingView] Call state mismatch, attempting recovery');
            // Handle potential state mismatch - maybe rejoin?
            if (join && !isJoining && !hasJoined && callState !== 'ended' && !isEndingCall) {
              setIsJoining(true);
              join();
            }
          }
        } else if (callState !== 'ended' && !isEndingCall) {
          // NOTE: Removed aggressive call ending logic that was causing race conditions
          // Let UnifiedCallService handle call state management
          console.log('[MeetingView] Call state sync - letting UnifiedCallService handle it');
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
  }, [hasJoined, isJoining, callState, join, handleEndCall, ensureOngoingCallNotification, isEndingCall]);

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

  // BULLETPROOF: Safety navigation timer - ensure user never gets stuck on meeting screen
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout | null = null;
    
    // If call state is 'ended' for more than 2 seconds, force navigation back
    if (callState === 'ended' && !isEndingCall) {
      safetyTimer = setTimeout(() => {
        if (!navigation || !isComponentMountedRef.current) return;
        
        try {
          const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
          if (currentRoute === 'Meeting') {
            console.log('[MeetingView] Safety timer triggered - forcing navigation back to TipCall');
            
            // Set ending call flag to prevent multiple navigation attempts
            setIsEndingCall(true);
            
            navigation.reset({
              index: 0,
              routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
            });
          }
        } catch (error) {
          console.error('[MeetingView] Safety timer navigation error:', error);
          // Fallback - try to go back
          try {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          } catch (fallbackError) {
            console.error('[MeetingView] Safety timer fallback also failed:', fallbackError);
          }
        }
      }, 2000); // Reduced to 2 seconds for faster recovery
    }
    
    return () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
      }
    };
  }, [callState, navigation]);

  // Enhanced UI for status display with network quality
  const getCallStatusText = () => {
    if (isInitializingService) {
      return 'Initializing call service...';
    } else if (callState === 'connecting') {
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
    if (isInitializingService) {
      return '#FF9800'; // Orange for initialization
    } else if (callState === 'connected') {
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

  // ✅ CRITICAL FIX: Enhanced component cleanup with proper VideoSDK coordination
  const cleanupRef = useRef(false);
  useEffect(() => {
    if (cleanupRef.current) return;
    if (callState !== 'ended') return;
    cleanupRef.current = true;
    
    console.log('[MeetingView] Component unmounting, performing comprehensive cleanup');
    isComponentMountedRef.current = false;
    isLeavingRef.current = true;
    
    // ✅ CRITICAL FIX: Stop timers first
    stopCallDurationTimer();
    
    // ✅ CRITICAL FIX: Leave VideoSDK meeting with proper timeout
    if (hasJoined && leave && !isEndingCall) {
      Promise.race([
        leave(),
        new Promise(resolve => setTimeout(resolve, 2000)) // Increased timeout
      ]).then(() => {
        console.log('[MeetingView] VideoSDK meeting left successfully during cleanup');
      }).catch((error) => {
        console.error('[MeetingView] Error leaving meeting during cleanup:', error);
      });
    }
    
    // ✅ CRITICAL FIX: Clear all timers
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
    
    // ✅ CRITICAL FIX: Notify UnifiedCallService of component unmount
    try {
      const unifiedCallService = UnifiedCallService.getInstance();
      const currentCall = unifiedCallService.getCurrentCall();
      if (currentCall && currentCall.status !== 'ended') {
        appEventEmitter.emit('meetingScreenUnmounting', { callId: currentCall.callId });
      }
      // Failsafe: ensure full cleanup on unmount
      unifiedCallService.cleanup();
    } catch (error) {
      console.error('[MeetingView] Error during final cleanup:', error);
    }
  }, [stopCallDurationTimer, hasJoined, leave, isEndingCall]);

  // After meeting is joined, force VideoSDK state to match app state
  //Removed to fix race condition where VideoSDK state was not in sync with app state
  /*
  useEffect(() => {
    if (hasJoined && meetingHooks && localParticipant) {
      setTimeout(() => {
        if (mediaState.cameraEnabled !== webcamOn && meetingHooks.toggleWebcam) {
          meetingHooks.toggleWebcam();
        }
        if (mediaState.micEnabled !== micOn && meetingHooks.toggleMic) {
          meetingHooks.toggleMic();
        }
      }, 200);
    }
  }, [hasJoined, meetingHooks, localParticipant, mediaState, webcamOn, micOn]);
  */
  // 1. Pre-initialize camera before join for video calls
  useEffect(() => {
    if (callType === 'video' && !mediaState.cameraEnabled) {
      console.log('[MeetingView] Pre-initializing camera before join');
      callMediaManager.setCameraEnabled(true);
    }
    // Optionally, test camera access here (dummy activation)
  }, []);

  // 2. Add robust logging for camera/mic state before and after join
  useEffect(() => {
    console.log('[MeetingView] Pre-join state:', {
      cameraEnabled: mediaState.cameraEnabled,
      micEnabled: mediaState.micEnabled,
      webcamOn,
      micOn
    });
  }, [mediaState, webcamOn, micOn]);

  // If it's a video call, render the video interface with VideoSDK streams
  if (callType === 'video') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        {/* Top call info bar */}
        <View style={styles.callInfoBar}>        <View style={styles.callInfoContent}>
          <Text style={styles.callDuration}>
            {isInitializingService ? 'Initializing...' :
             callState === 'connecting' ? 'Connecting...' : 
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
                    {isInitializingService ? 'Initializing call service...' :
                     callState === 'connecting' ? 'Connecting...' : 'Waiting for participant...'}
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
                    {isInitializingService ? 'Initializing...' :
                     callState === 'connecting' ? 'Connecting...' : 'Activating camera...'}
                  </Text>
                  {(callState === 'connecting' || isInitializingService) && (
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
              isConnecting={isJoining || callState === 'connecting' || isInitializingService}
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
            {isInitializingService ? 'Initializing...' :
             callState === 'connecting' ? 'Connecting...' : 
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
            isConnecting={isJoining || callState === 'connecting' || isInitializingService}
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
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();

  console.log('[MeetingScreen] 🎬 MEETING SCREEN COMPONENT MOUNTED:');
  console.log('[MeetingScreen] 📋 Route params:', {
    meetingId: route.params?.meetingId,
    callType: route.params?.callType,
    displayName: route.params?.displayName,
    isInitiator: route.params?.isInitiator,
    recipientName: route.params?.recipientName,
    hasToken: !!route.params?.token
  });
  console.log('[MeetingScreen] 📋 Active call from context:', {
    hasActiveCall: !!activeCall,
    activeCallType: activeCall?.callType,
    activeCallId: activeCall?.callId
  });

  // CRITICAL FIX: Sticky call context - latch the call on mount and never clear it during the session
  const latchedCallRef = useRef<ActiveCall | null>(null);
  const hasInitializedRef = useRef(false);

  // Only initialize the latched call once when the component first mounts
  if (!hasInitializedRef.current) {
    hasInitializedRef.current = true;
    
    console.log('[MeetingScreen] 🔄 Initializing latched call data...');
    
    // Priority 1: Route params (most immediate source of truth on navigation)
    if (route.params?.meetingId && route.params?.token) {
      latchedCallRef.current = {
        callId: `route_${Date.now()}`, // Generate ID since not in route params
        meetingId: route.params.meetingId,
        token: route.params.token,
        callerName: route.params.displayName || 'User',
        recipientName: route.params.recipientName || 'Participant',
        callType: route.params.callType || 'voice',
        callerId: '', // Not available in route params
        recipientId: '', // Not available in route params
        isInitiator: route.params.isInitiator ?? true,
        status: 'connecting',
        timestamp: Date.now()
      } as ActiveCall;
      console.log('[MeetingScreen] ✅ Latched call from route params:', {
        callType: latchedCallRef.current.callType,
        meetingId: latchedCallRef.current.meetingId,
        isInitiator: latchedCallRef.current.isInitiator
      });
    } 
    // Priority 2: Current activeCall from context
    else if (activeCall) {
      latchedCallRef.current = activeCall;
      console.log('[MeetingScreen] ✅ Latched call from context:', {
        callType: latchedCallRef.current.callType,
        callId: latchedCallRef.current.callId
      });
    }
    // Priority 3: UnifiedCallService as last resort
    else {
      const unifiedCallService = UnifiedCallService.getInstance();
      const currentCall = unifiedCallService.getCurrentCall();
      if (currentCall) {
        latchedCallRef.current = {
          callId: currentCall.callId,
          meetingId: currentCall.meetingId,
          token: currentCall.token,
          callerName: currentCall.callerName,
          recipientName: currentCall.recipientName,
          callType: currentCall.callType,
          callerId: currentCall.callerId,
          recipientId: currentCall.recipientId,
          isInitiator: currentCall.isInitiator,
          status: 'connecting',
          timestamp: Date.now()
        } as ActiveCall;
        console.log('[MeetingScreen] Latched call from UnifiedCallService:', latchedCallRef.current);
      }
    }
  }

  // Use latched call for all call-related logic - this prevents race conditions
  const latchedCall = latchedCallRef.current;

  // Use route params with fallbacks and dynamic updates
  const meetingId = route.params?.meetingId || latchedCall?.meetingId;
  const token = route.params?.token || latchedCall?.token;
  const displayName = route.params?.displayName || latchedCall?.callerName || 'User';
  const callType = route.params?.callType || latchedCall?.callType || 'voice';

  // BULLETPROOF recipient name handling with better fallbacks
  const [recipientName, setRecipientName] = useState(() => {
    const name = route.params?.recipientName || latchedCall?.recipientName;
    return name && name.trim() !== '' ? name : 'Participant';
  });

  // Update recipient name when latchedCall changes
  useEffect(() => {
    const routeName = route.params?.recipientName;
    const callName = latchedCall?.recipientName;
    let updatedRecipientName = 'Participant';
    if (routeName && routeName.trim() !== '') {
      updatedRecipientName = routeName;
    } else if (callName && callName.trim() !== '') {
      updatedRecipientName = callName;
    } else if (latchedCall?.callerName && latchedCall.callerName.trim() !== '') {
      updatedRecipientName = latchedCall.callerName;
    }
    if (updatedRecipientName !== recipientName && updatedRecipientName.trim() !== '') {
      setRecipientName(updatedRecipientName);
    }
  }, [latchedCall?.recipientName, latchedCall?.callerName, route.params?.recipientName, recipientName]);

  // Only navigate away if a true end event is received
  useEffect(() => {
    console.log('[MeetingScreen] activeCall changed:', activeCall, 'latchedCall:', latchedCall);
    // Navigate away if the call is truly ended or activeCall is null
    if (
      (!activeCall) ||
      (activeCall && ['ended', 'missed', 'declined'].includes(activeCall.status))
    ) {
      console.log('[MeetingScreen] Detected call end or activeCall is null. Navigating away from Meeting screen.');
      
      // ✅ CRITICAL FIX: Add delay to prevent race conditions with navigation
      setTimeout(() => {
        if (!navigation) return;
        try {
          const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
          if (currentRoute === 'Meeting') {
            console.log('[MeetingScreen] Navigation reset to TipCall.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
            });
          }
        } catch (error) {
          // Fallback navigation
          try {
            console.log('[MeetingScreen] Fallback navigation reset to TipCall.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'TipCall' as keyof MainNavigatorParamList }],
            });
          } catch (finalError) {
            console.error('[MeetingScreen] Final navigation fallback failed:', finalError);
          }
        }
      }, 1500); // Increased delay to prevent race conditions
    }
  }, [activeCall, latchedCall, navigation]);

  if (!meetingId || !token || !displayName) {
    // Add a failsafe to check the latched call one last time
    if (latchedCallRef.current && latchedCallRef.current.meetingId && latchedCallRef.current.token) {
      // We have latched data, use it to prevent showing loading screen
      const latchedMeetingId = latchedCallRef.current.meetingId;
      const latchedToken = latchedCallRef.current.token;
      const latchedDisplayName = latchedCallRef.current.callerName || 'User';
      const latchedCallType = latchedCallRef.current.callType || 'voice';
      const latchedRecipientName = latchedCallRef.current.recipientName || 'Participant';
      
      console.log('[MeetingScreen] Using latched data to prevent loading screen:', {
        meetingId: latchedMeetingId,
        displayName: latchedDisplayName,
        callType: latchedCallType
      });
      
      return (
        <CallErrorBoundary>
          <MeetingProvider
            config={{
              meetingId: latchedMeetingId,
              micEnabled: CallMediaManager.getInstance().getMediaState().micEnabled,
              webcamEnabled: latchedCallType === 'video' ? true : CallMediaManager.getInstance().getMediaState().cameraEnabled,
              name: latchedDisplayName,
              notification: {
                title: 'Adtip Call',
                message: 'You are in a call.',
              },
            }}
            token={latchedToken}>
            <MeetingView
              meetingId={latchedMeetingId}
              callType={latchedCallType}
              token={latchedToken}
              localParticipantId=""
              recipientName={latchedRecipientName}
            />
          </MeetingProvider>
        </CallErrorBoundary>
      );
    } else {
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
  }

  return (
    <CallErrorBoundary>
      <MeetingProvider
        config={{
          meetingId,
          micEnabled: CallMediaManager.getInstance().getMediaState().micEnabled,
          webcamEnabled: callType === 'video' ? true : CallMediaManager.getInstance().getMediaState().cameraEnabled,
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
          localParticipantId={latchedCall?.callerId || ""}
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
