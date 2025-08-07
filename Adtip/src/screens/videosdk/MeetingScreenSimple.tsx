import React, { useEffect, useRef, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated
} from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  RTCView,
  MediaStream
} from '@videosdk.live/react-native-sdk'
import { VideoSDKCallTimer } from '../../components/videosdk'
import WhatsAppStyleVideoLayout from '../../components/videosdk/WhatsAppStyleVideoLayout'
import {
  Mic, MicOff, Camera, CameraOff, Phone,
  Volume2
} from 'lucide-react-native'

import { useCallStore } from '../../stores/callStoreSimplified'
import CallController from '../../services/calling/CallController'
import { MainNavigatorParamList } from '../../types/navigation'
import VideoSDKService from '../../services/videosdk/VideoSDKService'
import { logError, logWarn, logVideoSDK, logCall } from '../../utils/ProductionLogger'
import SafeAreaEnforcer from '../../components/common/SafeAreaEnforcer'
import RingingAudioService from '../../services/audio/RingingAudioService'


// Error boundary for VideoSDK-specific errors
class VideoSDKErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    logError('VideoSDKErrorBoundary', 'VideoSDK component error caught', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Call Connection Error</Text>
          <Text style={styles.errorMessage}>
            Unable to establish video connection. Please try again.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Layout components

// Muted status display component for audio calls
const MutedStatusDisplay: React.FC<{
  localMicOn: boolean;
  remoteParticipants: any[];
}> = ({ localMicOn, remoteParticipants }) => {
  const mutedParticipants = [];

  // Check local participant
  if (!localMicOn) {
    mutedParticipants.push('You are muted');
  }

  // Check remote participants
  remoteParticipants.forEach(participant => {
    const { micOn: remoteMicOn } = useParticipant(participant.id);
    if (!remoteMicOn) {
      mutedParticipants.push(`${participant.displayName || 'Participant'} is muted`);
    }
  });

  if (mutedParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.mutedStatusContainer}>
      {mutedParticipants.map((text, index) => (
        <Text key={index} style={styles.mutedText}>
          {text}
        </Text>
      ))}
    </View>
  );
};

// Ringing animation component for audio calls
const RingingAvatar: React.FC<{
  children: React.ReactNode;
  isRinging: boolean;
}> = ({ children, isRinging }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRinging) {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Start ring animation
      const ringAnimation = Animated.loop(
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      ringAnimation.start();

      return () => {
        pulseAnimation.stop();
        ringAnimation.stop();
      };
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    }
  }, [isRinging, pulseAnim, ringAnim]);

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0],
  });

  return (
    <View style={styles.ringingContainer}>
      {/* Outer ring animation */}
      {isRinging && (
        <Animated.View
          style={[
            styles.ringingRing,
            {
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      )}

      {/* Avatar with pulse animation */}
      <Animated.View
        style={[
          styles.ringingAvatar,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const ParticipantVideo = ({ participantId, isLocal = false }: { participantId: string; isLocal?: boolean }) => {
  const {
    displayName,
    webcamStream,
    webcamOn,
    micOn,
  } = useParticipant(participantId)

  // Ensure consistent local/remote detection
  const meeting = useMeeting()
  const actualIsLocal = meeting.localParticipant?.id === participantId

  // Use the actual local state, not the passed prop, to prevent confusion
  const finalIsLocal = actualIsLocal

  // Debug logging like your working component
  useEffect(() => {
    logCall(`[ParticipantVideo] Participant ${participantId}`, 'State:', {
      displayName,
      webcamOn,
      hasStream: !!webcamStream,
      streamId: webcamStream?.id,
      hasTrack: !!webcamStream?.track,
      isLocal: finalIsLocal,
      passedIsLocal: isLocal,
      actualIsLocal
    })
  }, [participantId, displayName, webcamOn, webcamStream, isLocal, finalIsLocal, actualIsLocal])

  // Show placeholder when no video (like your working component)
  if (!webcamOn || !webcamStream) {
    return (
      <View style={styles.videoPlaceholder}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: '#007AFF' }]}>
          <Text style={styles.avatarText}>
            {(displayName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.placeholderText}>{displayName || 'Unknown'}</Text>
        <Text style={styles.statusText}>
          {!webcamOn ? 'Camera off' : 'No video stream'}
        </Text>
      </View>
    )
  }

  // Render video using RTCView (exactly like your working component)
  return (
    <View style={styles.videoContainer}>
      <RTCView
        streamURL={new MediaStream([webcamStream.track]).toURL()}
        objectFit="cover"
        style={styles.video}
        mirror={finalIsLocal}
        zOrder={0}
      />
      <View style={styles.nameTag}>
        <Text style={styles.nameTagText}>
          {displayName || 'Unknown'}{finalIsLocal ? ' (You)' : ''}
        </Text>
      </View>
      
      {/* Status indicators */}
      <View style={styles.statusIndicators}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: micOn ? '#00D4AA' : '#FF3B30' }
        ]}>
          <Text style={styles.statusIcon}>
            {micOn ? '🎤' : '🔇'}
          </Text>
        </View>
      </View>
    </View>
  )
}

const Controls = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>()
  const { status, session, media } = useCallStore()
  const { toggleMic, toggleWebcam, leave, localParticipant, participants } = useMeeting()
  const actions = useCallStore(state => state.actions)
  const controller = CallController.getInstance()

  // Use actual VideoSDK state instead of call store state for mic/camera
  const micOn = localParticipant?.micOn ?? false
  const webcamOn = localParticipant?.webcamOn ?? false

  // Subscribe to speaker state from call store for real-time updates
  const speakerOn = media.speaker

  // Enhanced state for UI feedback
  const [isToggling, setIsToggling] = useState({ mic: false, camera: false, speaker: false })
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)

  // Animation values for button feedback
  const micButtonScale = useRef(new Animated.Value(1)).current
  const cameraButtonScale = useRef(new Animated.Value(1)).current
  const speakerButtonScale = useRef(new Animated.Value(1)).current

  // Track active speaker - simplified version since isActiveSpeaker is not available
  useEffect(() => {
    const remoteParticipants = Array.from(participants.values()).filter(p => p.id !== localParticipant?.id)

    // Find the first participant who has their mic on (simplified active speaker detection)
    const currentSpeaker = remoteParticipants.find(p => p.micOn)

    if (currentSpeaker) {
      setActiveSpeaker(currentSpeaker.id)
    } else if (localParticipant?.micOn) {
      setActiveSpeaker(localParticipant.id)
    } else {
      setActiveSpeaker(null)
    }
  }, [participants, localParticipant])

  // Enhanced button animation
  const animateButton = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleEndCall = async () => {
    try {
      logCall('MeetingScreenSimple', '🔥 HANDLE END CALL - INSTANT UI NAVIGATION');

      // Stop ringing immediately
      const ringingAudioService = RingingAudioService.getInstance()
      ringingAudioService.stopRinging()

      // Navigate immediately for instant UI response
      logCall('MeetingScreenSimple', '🔥 Navigating immediately for instant UI');
      if (navigation.canGoBack()) {
        logCall('MeetingScreenSimple', '🔥 Using navigation.goBack()');
        navigation.goBack()
      } else {
        logCall('MeetingScreenSimple', '🔥 Using navigation.reset()');
        // If can't go back, reset to TipCall screen
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              params: {
                screen: 'TipCallSimple'
              }
            }
          ],
        })
      }

      // Run endCall in background without waiting
      logCall('MeetingScreenSimple', '🔥 Starting background endCall process');
      controller.endCall().then(() => {
        logCall('MeetingScreenSimple', '🔥 Background endCall completed successfully');
      }).catch((error) => {
        logError('MeetingScreenSimple', '🔥 Background endCall error', error);
      });

      logCall('MeetingScreenSimple', '🔥 handleEndCall instant navigation completed');
    } catch (error) {
      logError('MeetingScreenSimple', '🔥 Error in handleEndCall', error);
      // Still navigate back even if there's an error
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              params: {
                screen: 'TipCallSimple'
              }
            }
          ],
        })
      }
    }
  }

  const handleToggleMic = async () => {
    if (isToggling.mic) return // Prevent double-tap

    setIsToggling(prev => ({ ...prev, mic: true }))
    animateButton(micButtonScale)

    try {
      toggleMic()
      // Update call store to match VideoSDK state
      actions.updateMedia({ mic: !micOn })
    } catch (error) {
      logError('Controls', 'Error toggling microphone', error)
    } finally {
      setTimeout(() => {
        setIsToggling(prev => ({ ...prev, mic: false }))
      }, 300)
    }
  }

  const handleToggleCamera = async () => {
    if (isToggling.camera) return // Prevent double-tap

    setIsToggling(prev => ({ ...prev, camera: true }))
    animateButton(cameraButtonScale)

    try {
      toggleWebcam()
      // Update call store to match VideoSDK state
      actions.updateMedia({ cam: !webcamOn })
    } catch (error) {
      logError('Controls', 'Error toggling camera', error)
    } finally {
      setTimeout(() => {
        setIsToggling(prev => ({ ...prev, camera: false }))
      }, 300)
    }
  }

  const handleToggleSpeaker = async () => {
    if (isToggling.speaker) return // Prevent double-tap

    setIsToggling(prev => ({ ...prev, speaker: true }))
    animateButton(speakerButtonScale)

    try {
      // TODO: implement actual speaker toggle functionality
      actions.updateMedia({ speaker: !speakerOn })
      logCall('Controls', 'Speaker toggled', { speakerOn: !speakerOn })
    } catch (error) {
      logError('Controls', 'Error toggling speaker', error)
    } finally {
      setTimeout(() => {
        setIsToggling(prev => ({ ...prev, speaker: false }))
      }, 300)
    }
  }
  
  return (
    <View style={styles.controlsContainer}>
      {/* Active Speaker Indicator */}
      {activeSpeaker && (
        <View style={styles.activeSpeakerIndicator}>
          <Text style={styles.activeSpeakerText}>
            {activeSpeaker === localParticipant?.id ? 'You are speaking' : 'Speaking...'}
          </Text>
        </View>
      )}

      <View style={styles.controlButtonsRow}>
        {/* Microphone Control */}
        <Animated.View style={{ transform: [{ scale: micButtonScale }] }}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.enhancedControlButton,
              {
                backgroundColor: micOn ? '#00D4AA' : '#FF3B30',
                opacity: isToggling.mic ? 0.7 : 1
              }
            ]}
            onPress={handleToggleMic}
            disabled={isToggling.mic}
            activeOpacity={0.8}
          >
            {micOn ? (
              <Mic size={24} color="#fff" />
            ) : (
              <MicOff size={24} color="#fff" />
            )}
            {isToggling.mic && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Camera Control (only for video calls) */}
        {session?.type === 'video' && (
          <Animated.View style={{ transform: [{ scale: cameraButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.enhancedControlButton,
                {
                  backgroundColor: webcamOn ? '#00D4AA' : '#FF3B30',
                  opacity: isToggling.camera ? 0.7 : 1
                }
              ]}
              onPress={handleToggleCamera}
              disabled={isToggling.camera}
              activeOpacity={0.8}
            >
              {webcamOn ? (
                <Camera size={24} color="#fff" />
              ) : (
                <CameraOff size={24} color="#fff" />
              )}
              {isToggling.camera && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Speaker Control */}
        <Animated.View style={{ transform: [{ scale: speakerButtonScale }] }}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.enhancedControlButton,
              {
                backgroundColor: speakerOn ? '#00D4AA' : '#333',
                opacity: isToggling.speaker ? 0.7 : 1
              }
            ]}
            onPress={handleToggleSpeaker}
            disabled={isToggling.speaker}
            activeOpacity={0.8}
          >
            <Volume2
              size={24}
              color="#fff"
              fill={speakerOn ? '#fff' : 'transparent'}
            />
            {isToggling.speaker && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.enhancedControlButton, styles.endCallButton]}
          onPress={handleEndCall}
          activeOpacity={0.8}
        >
          <Phone size={24} color="#fff" style={{ transform: [{rotate: '135deg'}] }} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Main component

const MeetingContent = () => {
  logCall('[MeetingContent]', 'Component rendering...')

  const navigation = useNavigation() // Add navigation hook
  const meeting = useMeeting()
  const { participants, localParticipant, join, leave } = meeting
  const localParticipantId = localParticipant?.id
  const localWebcamOn = localParticipant?.webcamOn ?? false
  const controller = CallController.getInstance()
  const mediaService = controller.getMediaService()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const actions = useCallStore(state => state.actions)

  // Ringing audio service for outgoing calls
  const ringingAudioService = RingingAudioService.getInstance()

  logCall('[MeetingContent]', 'Initial state:', {
    sessionId: session?.sessionId,
    status,
    meetingId: session?.meetingId,
    hasToken: !!session?.token,
    localParticipantId,
    participantCount: participants?.size || 0
  })

  // Track if this component has set the meeting reference
  const hasSetMeetingRef = useRef(false)
  const isMountedRef = useRef(true)
  
  // Enhanced validation - only proceed if session is valid and call is active
  const sessionIsValid = session?.sessionId && session?.meetingId && session?.token
  const callIsActive = status === 'in_call' || status === 'connecting' || status === 'outgoing'
  const globalComponentKey = sessionIsValid ? `meeting-${session.sessionId}` : null
  
  // Check if this MeetingContent belongs to the active component instance AND is tracked by VideoSDK
  const videoSDK = VideoSDKService.getInstance()
  const isVideoSDKSessionActive = sessionIsValid ? videoSDK.isSessionActive(session.sessionId) : false
  const isActiveInstance = globalComponentKey &&
    global.meetingComponentInstances?.[globalComponentKey] &&
    global.meetingComponentInstances[globalComponentKey] !== 'deactivated' &&
    isVideoSDKSessionActive

  // Debug logging for isActiveInstance check
  useEffect(() => {
    if (sessionIsValid && globalComponentKey) {
      logCall('[MeetingContent] Active instance check', {
        globalComponentKey,
        hasGlobalInstance: !!global.meetingComponentInstances?.[globalComponentKey],
        globalInstanceValue: global.meetingComponentInstances?.[globalComponentKey],
        isVideoSDKSessionActive,
        isActiveInstance,
        sessionId: session.sessionId
      })
    }
  }, [globalComponentKey, isVideoSDKSessionActive, isActiveInstance, session?.sessionId, sessionIsValid])
  
  // Add participant state validation ref to prevent bleeding
  const lastSessionId = useRef<string | null>(null)
  const participantStateReset = useRef(false)

  // Validate and reset participant state for new sessions
  useEffect(() => {
    if (session?.sessionId && session.sessionId !== lastSessionId.current) {
      logCall('[MeetingScreen] New session detected, validating participant state', {
        newSessionId: session.sessionId,
        lastSessionId: lastSessionId.current,
        localParticipantId,
        participantCount: participants.size
      })
      
      lastSessionId.current = session.sessionId
      participantStateReset.current = false
      
      // Force participant state validation after a brief delay
      setTimeout(() => {
        const currentParticipants = [...participants.values()]
        logCall('[MeetingScreen] Post-session-change participant validation', {
          sessionId: session.sessionId,
          localId: localParticipant?.id,
          totalParticipants: currentParticipants.length,
          participantDetails: currentParticipants.map(p => ({
            id: p.id,
            displayName: p.displayName,
            isLocal: p.id === localParticipant?.id
          }))
        })
        participantStateReset.current = true
      }, 500)
    }
  }, [session?.sessionId, localParticipant?.id, participants])

  // Save meeting reference for media service with proper cleanup
  useEffect(() => {
    if (!isMountedRef.current) return
    
    // Only set reference once per session and ensure it's the current session's meeting
    if (meeting && sessionIsValid && isActiveInstance && !hasSetMeetingRef.current) {
      logCall('[MeetingContent] Setting meeting reference for session:', session.sessionId);
      mediaService.setMeetingRef(meeting);
      hasSetMeetingRef.current = true;
    }

    return () => {
      // Only clear if this component set the reference
      if (hasSetMeetingRef.current) {
        logCall('[MeetingContent] Clearing meeting reference for session', session?.sessionId);
        mediaService.setMeetingRef(null);
        hasSetMeetingRef.current = false;
      }
    }
  }, [meeting, mediaService, sessionIsValid, isActiveInstance, session?.sessionId])
  
  // Main component lifecycle
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ==== Robust join with retry logic ====
  const joinedRef = useRef(false)
  const joinAttemptsRef = useRef(0)
  const initialLoadRef = useRef(true) // Track if this is the first load

  // Reset join state when session changes (new call) - ensure complete state isolation
  useEffect(() => {
    if (session?.sessionId) {
      logCall('[MeetingScreen] New session detected, resetting join state:', session.sessionId)

      // Complete state reset for new session
      joinedRef.current = false
      joinAttemptsRef.current = 0
      initialLoadRef.current = true
      hasSetMeetingRef.current = false

      // Clear any existing meeting reference to prevent participant state bleeding
      if (mediaService.isMeetingActive()) {
        logCall('[MeetingScreen] Clearing previous meeting reference for new session')
        mediaService.setMeetingRef(null)
      }

      // Force participant state reset to prevent mixing local/remote participants
      logCall('[MeetingScreen] Forcing participant state reset for session:', session.sessionId)
    }
  }, [session?.sessionId, mediaService])

  useEffect(() => {
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 1000
    const INITIAL_DELAY_MS = 2500 // Increased delay for first join after app load to ensure WebSocket stability

    const joinWithRetry = async () => {
      // Enhanced validation before attempting to join
      // For incoming calls, we'll be more lenient with the isActiveInstance check
      const isIncomingCall = session?.direction === 'incoming'
      const shouldAllowJoin = sessionIsValid && callIsActive && (isActiveInstance || isIncomingCall)

      if (!shouldAllowJoin) {
        logCall('[MeetingContent] Cannot join - validation failed:', {
          sessionIsValid,
          callIsActive,
          isActiveInstance,
          isIncomingCall,
          shouldAllowJoin,
          globalKey: globalComponentKey,
          registeredComponent: global.meetingComponentInstances?.[globalComponentKey || '']
        })
        return
      }

      // If this is an incoming call and VideoSDK session is not active, try to set it
      if (isIncomingCall && !isVideoSDKSessionActive && session?.sessionId) {
        logCall('[MeetingContent] Incoming call detected, setting VideoSDK session as active...')
        const videoSDK = VideoSDKService.getInstance()
        videoSDK.setActiveMeetingSession(session.sessionId)

        // Check if this was a background call and ensure media is ready
        try {
          const { default: BackgroundMediaService } = await import('../../services/calling/BackgroundMediaService')
          const backgroundMediaService = BackgroundMediaService.getInstance()

          if (!backgroundMediaService.isMediaReady()) {
            logCall('[MeetingContent] Background call detected, initializing media...')
            await backgroundMediaService.initializeForBackgroundCall(session.type)
          }
        } catch (error) {
          logWarn('MeetingContent', 'Error initializing background media', error)
        }
      }
      
      if (joinedRef.current || joinAttemptsRef.current >= MAX_ATTEMPTS) return

      joinAttemptsRef.current += 1
      logCall(`[MeetingContent] Attempt ${joinAttemptsRef.current}/${MAX_ATTEMPTS} to join meeting for session:`, session?.sessionId)

      try {
        // Ensure we have a valid meeting and session before joining
        if (!meeting || !session?.sessionId) {
          logWarn('MeetingContent', 'Cannot join - missing meeting or session')
          return
        }

        // Make sure VideoSDK is ready before each attempt with enhanced first-time handling
        const videoSDK = VideoSDKService.getInstance()
        const status = videoSDK.getInitializationStatus()
        const isFirstTimeOrColdStart = videoSDK.isFirstTimeOrColdStart()

        if (!status.initialized || !status.websocketReady || isFirstTimeOrColdStart) {
          logVideoSDK('MeetingContent', 'VideoSDK not ready or first-time/cold start, ensuring initialization', {
            status,
            isFirstTimeOrColdStart,
            initialLoad: initialLoadRef.current
          })

          // Use enhanced initialization for first-time users
          const success = await videoSDK.ensureInitialized()
          if (!success) {
            throw new Error('VideoSDK initialization failed')
          }

          // Add extra delay after initialization for stability
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // If this is the first join after app load, add extra delay and validation
        // to ensure WebSocket is fully connected and stable
        if (initialLoadRef.current) {
          logCall('[MeetingContent] First join after app load - ensuring WebSocket is ready with enhanced validation')

          // Use longer timeout for first-time users
          const websocketReady = await videoSDK.waitForWebSocketReady(15000)
          if (!websocketReady) {
            throw new Error('WebSocket failed to become ready within timeout')
          }

          // Additional delay for first-time stability
          const extraDelay = isFirstTimeOrColdStart ? INITIAL_DELAY_MS * 2 : INITIAL_DELAY_MS
          logCall(`[MeetingContent] Adding ${extraDelay}ms stability delay for first join`)
          await new Promise(resolve => setTimeout(resolve, extraDelay))

          initialLoadRef.current = false
        }

        // CRITICAL FIX: Ensure WebSocket is ready before joining to prevent first-call failures
        logCall('[MeetingContent] Ensuring WebSocket is ready before joining meeting')
        //const videoSDK = VideoSDKService.getInstance()
        const isWebSocketReady = await videoSDK.ensureWebSocketReadyForMeeting()

        if (!isWebSocketReady) {
          throw new Error('WebSocket is not ready for meeting operations')
        }

        logCall('[MeetingContent] WebSocket confirmed ready, joining meeting with ID:', session.meetingId)
        await meeting.join()
        joinedRef.current = true
        logCall('[MeetingContent] Successfully joined meeting')
        
        // For outgoing calls, transition from 'outgoing' -> 'connecting' -> 'in_call'
        // For incoming calls, transition from 'connecting' -> 'in_call'
        if (status === 'outgoing') {
          actions.setStatus('connecting')
          // Brief delay before moving to in_call
          setTimeout(() => {
            actions.setStatus('in_call')
          }, 1000)
        } else {
          actions.setStatus('in_call')
        }
      } catch (err: any) {
        logWarn('MeetingContent', `Join attempt ${joinAttemptsRef.current} failed: ${err?.message || err}`)

        // Check for WebSocket specific errors
        const errorMessage = err?.message || String(err)
        const isWebSocketError = errorMessage.includes('websocket') ||
                                errorMessage.includes('WebSocket') ||
                                errorMessage.includes('connection') ||
                                errorMessage.includes('reconnect')

        // Check for VideoSDK specific error codes
        const isVideoSDKError = err?.code && (
          err.code >= 4001 && err.code <= 5006 // VideoSDK error code range
        )

        // Retry if we still have attempts left
        if (joinAttemptsRef.current < MAX_ATTEMPTS) {
          // Enhanced retry logic with WebSocket reconnection
          if (isWebSocketError || isVideoSDKError) {
            logVideoSDK('MeetingContent', 'WebSocket/VideoSDK error detected, attempting reconnection')

            try {
              // Try to reconnect VideoSDK WebSocket
              const videoSDK = VideoSDKService.getInstance()
              const reconnected = await videoSDK.handleWebSocketReconnection(err, 1, 2)

              if (reconnected) {
                logVideoSDK('MeetingContent', 'WebSocket reconnection successful, retrying join')
                // Longer delay after reconnection to ensure stability
                setTimeout(joinWithRetry, RETRY_DELAY_MS * 3)
              } else {
                logWarn('MeetingContent', 'WebSocket reconnection failed, using extended retry delay')
                setTimeout(joinWithRetry, RETRY_DELAY_MS * 2)
              }
            } catch (reconnectError) {
              logError('MeetingContent', 'Error during WebSocket reconnection', reconnectError)
              setTimeout(joinWithRetry, RETRY_DELAY_MS * 2)
            }
          } else {
            // Standard retry for non-WebSocket errors
            const retryDelay = RETRY_DELAY_MS
            logVideoSDK('MeetingContent', `Retrying in ${retryDelay}ms`)
            setTimeout(joinWithRetry, retryDelay)
          }
        } else {
          logError('MeetingContent', 'All join attempts failed – ending call')
          actions.setStatus('ended')
        }
      }
    }

    // Only attempt to join if we have a valid session and haven't joined yet
    if (sessionIsValid && callIsActive && isActiveInstance && !joinedRef.current && meeting) {
      joinWithRetry()
    }

    // Comprehensive cleanup on unmount
    return () => {
      if (!isMountedRef.current) return
      
      logCall('[MeetingContent] Component unmounting, performing comprehensive cleanup for session:', session?.sessionId);

      // Step 1: End meeting for all participants with timeout protection
      if (joinedRef.current && meeting.end) {
        try {
          logCall('[MeetingContent] Ending meeting for all participants on cleanup');
          Promise.race([
            meeting.end(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cleanup end timeout')), 2000)
            )
          ]).then(() => {
            logCall('[MeetingContent] Successfully ended meeting for all participants on cleanup');
          }).catch((error) => {
            logWarn('MeetingContent', 'Error or timeout ending meeting on cleanup, trying leave as fallback', error);
            // Fallback to leave if end fails
            if (meeting.leave) {
              Promise.race([
                meeting.leave(),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Cleanup leave timeout')), 1000)
                )
              ]).then(() => {
                logCall('[MeetingContent] Successfully left meeting as fallback on cleanup');
              }).catch((leaveError) => {
                logWarn('MeetingContent', 'Error or timeout with leave fallback on cleanup', leaveError);
              });
            }
          });
        } catch (error) {
          logWarn('MeetingContent', 'Error ending meeting on cleanup', error);
        }
      } else if (joinedRef.current && meeting.leave) {
        // Fallback to leave if end is not available
        try {
          logCall('[MeetingContent] End method not available, using leave as fallback on cleanup');
          Promise.race([
            meeting.leave(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cleanup leave timeout')), 2000)
            )
          ]).then(() => {
            logCall('[MeetingContent] Successfully left meeting on cleanup');
          }).catch((error) => {
            logWarn('MeetingContent', 'Error or timeout leaving meeting on cleanup', error);
          });
        } catch (error) {
          logWarn('MeetingContent', 'Error leaving meeting on cleanup', error);
        }
      }

      // Step 2: Clear all refs and state
      joinedRef.current = false;
      joinAttemptsRef.current = 0;
      initialLoadRef.current = true;

      // Step 3: Clear meeting reference from media service
      if (hasSetMeetingRef.current) {
        mediaService.setMeetingRef(null);
        hasSetMeetingRef.current = false;
      }

      logCall('[MeetingContent] Component cleanup complete');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIsValid, callIsActive, isActiveInstance, meeting])

  // Monitor call status - navigation now handled by comprehensive cleanup
  useEffect(() => {
    logCall('MeetingScreenSimple', '📱 STATUS MONITOR - Current status:', { status });

    if (status === 'ended') {
      logCall('MeetingScreenSimple', '📱 CALL STATUS CHANGED TO ENDED');
      logCall('MeetingScreenSimple', '📱 Navigation handled by comprehensive cleanup process');
      // Navigation is now handled by the comprehensive cleanup process
      // triggered by VideoSDK onMeetingLeft event calling controller.endCall()
    }
  }, [status, navigation]);

  // Handle back button or hardware back - instant navigation with background cleanup
  useEffect(() => {
    const backAction = () => {
      // Stop ringing immediately
      const ringingAudioService = RingingAudioService.getInstance()
      ringingAudioService.stopRinging()

      // Navigate immediately for instant UI response
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        // If can't go back, reset to TipCall screen
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              params: {
                screen: 'TipCallSimple'
              }
            }
          ],
        })
      }

      // Run endCall in background without waiting
      controller.endCall().then(() => {
        console.log('[MeetingScreenSimple] Background endCall on back press completed');
      }).catch((error) => {
        console.error('[MeetingScreenSimple] Background endCall on back press error:', error);
      });

      return true // Prevent default back action
    }

    // Add back button handler
    const backHandler = require('react-native').BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [controller, navigation])
  
  // Get remote participants (excluding local) and ensure they are valid
  // Use a more robust check to ensure we don't mix up local and remote participants
  const allParticipants = [...participants.values()].filter(p => p && p.id && p.displayName)
  
  // Extra validation to prevent local participant from being treated as remote
  const validRemoteParticipants = allParticipants.filter(p => {
    const isNotLocal = p.id !== localParticipantId
    
    // Additional validation: check if this participant ID was ever our local ID
    // This prevents session bleeding where previous local ID appears as remote
    if (lastSessionId.current && session?.sessionId !== lastSessionId.current) {
      logCall('[MeetingScreen] Cross-session participant validation:', {
        participantId: p.id,
        currentLocalId: localParticipantId,
        sessionId: session?.sessionId,
        lastSessionId: lastSessionId.current
      })
    }
    
    return isNotLocal
  })

  // Comprehensive debug logging to track participant state issues
  logCall('[MeetingScreen] Participant debug:', {
    sessionId: session?.sessionId,
    localParticipantId,
    totalParticipants: allParticipants.length,
    validRemoteParticipants: validRemoteParticipants.length,
    participantIds: allParticipants.map(p => ({ 
      id: p.id, 
      displayName: p.displayName,
      isLocal: p.id === localParticipantId,
      webcamOn: p.webcamOn,
      micOn: p.micOn
    })),
    meetingId: session?.meetingId,
    hasSetMeetingRef: hasSetMeetingRef.current,
    participantStateReset: participantStateReset.current
  })
  
  // Use the validated remote participants
  const remoteParticipants = validRemoteParticipants

  // Ringing logic: Start ringing when connecting and no remote participants, stop when remote participant joins
  useEffect(() => {
    const isOutgoingCall = session?.direction === 'outgoing'
    const isConnecting = status === 'connecting' || status === 'outgoing'
    const hasRemoteParticipants = remoteParticipants.length > 0

    if (isOutgoingCall && isConnecting && !hasRemoteParticipants) {
      // Start ringing sound in earpiece for outgoing calls when connecting and no remote participant yet
      if (!ringingAudioService.isCurrentlyRinging()) {
        console.log('[MeetingScreen] Starting ringing sound - waiting for remote participant to join')
        ringingAudioService.startRinging()
      }
    } else {
      // Stop ringing when remote participant joins or call status changes
      if (ringingAudioService.isCurrentlyRinging()) {
        console.log('[MeetingScreen] Stopping ringing sound - remote participant joined or call status changed')
        ringingAudioService.stopRinging()
      }
    }
  }, [session?.direction, status, remoteParticipants.length, ringingAudioService])

  // Cleanup ringing on unmount
  useEffect(() => {
    return () => {
      ringingAudioService.stopRinging()
    }
  }, [ringingAudioService])

  const isVideo = session?.type === 'video'
  
  return (
    <SafeAreaEnforcer
      statusBarStyle="light"
      fullScreen={false}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
      
      {/* Header info */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {session?.peerName || 'Connecting...'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {status === 'outgoing' ? 'Calling...' :
           status === 'connecting' ? 'Connecting...' :
           status === 'in_call' ? `${session?.type} call` :
           'Call'}
        </Text>
        {/* Show timer when call is active */}
        {status === 'in_call' && (
          <View style={styles.timerContainer}>
            <VideoSDKCallTimer />
          </View>
        )}
      </View>
      
      {/* Video content for video calls */}
      {isVideo ? (
        <WhatsAppStyleVideoLayout
          localParticipantId={localParticipantId || ''}
          remoteParticipantId={remoteParticipants.length > 0 ? remoteParticipants[0].id : ''}
          localWebcamOn={localWebcamOn}
          remoteWebcamOn={remoteParticipants.length > 0 && remoteParticipants[0].webcamOn}
        />
      ) : (
        /* Audio call UI */
        <View style={styles.audioContainer}>
          <View style={styles.avatarContainer}>
            <RingingAvatar isRinging={status === 'outgoing' || status === 'connecting'}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {session?.peerName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            </RingingAvatar>
          </View>
          <Text style={styles.callStatus}>
            {status === 'outgoing' ? 'Calling...' :
             status === 'connecting' ? 'Connecting...' :
             status === 'in_call' ? 'Connected' :
             'Connecting...'}
          </Text>

          {/* Show muted status for participants */}
          {status === 'in_call' && (
            <MutedStatusDisplay
              localMicOn={micOn}
              remoteParticipants={remoteParticipants}
            />
          )}
        </View>
      )}
      
      {/* Controls */}
      <Controls />
      </View>
    </SafeAreaEnforcer>
  )
}

type MeetingScreenRouteProp = RouteProp<MainNavigatorParamList, 'Meeting'>

// Global type declarations at the top of the file
declare global {
  var meetingComponentInstances: Record<string, string> | undefined
}

// Initialize global tracking object if not exists
if (!global.meetingComponentInstances) {
  global.meetingComponentInstances = {}
}

const MeetingScreenSimple = () => {
  const route = useRoute<MeetingScreenRouteProp>()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const navigation = useNavigation()

  // Remove debugging state since we're using persistent call approach

  // Enhanced component instance tracking with stricter validation
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  const isComponentActive = useRef(false) // Start as inactive until validated
  const hasInitialized = useRef(false)
  const isMountedRef = useRef(true)
  const [videoSDKReady, setVideoSDKReady] = React.useState(false)

  // More comprehensive session validation with detailed checks
  const sessionIsValid = useMemo(() => {
    if (!session) {
      logCall('[MeetingScreenSimple] Session validation failed: no session');
      return false;
    }

    if (!session.sessionId) {
      logCall('[MeetingScreenSimple] Session validation failed: no sessionId');
      return false;
    }

    if (!session.meetingId || session.meetingId.startsWith('temp-')) {
      logCall('[MeetingScreenSimple] Session validation failed: invalid meetingId', session.meetingId);
      return false;
    }

    if (!session.token || session.token === 'temp-token') {
      logCall('[MeetingScreenSimple] Session validation failed: invalid token');
      return false;
    }

    logCall('[MeetingScreenSimple] Session validation passed', {
      sessionId: session.sessionId,
      meetingId: session.meetingId,
      hasToken: !!session.token,
      direction: session.direction,
      type: session.type
    });
    return true;
  }, [session]);

  const callIsActive = status === 'in_call' || status === 'connecting' || status === 'outgoing'

  // Initialize VideoSDK before creating MeetingProvider
  useEffect(() => {
    const initializeVideoSDK = async () => {
      if (!sessionIsValid || !callIsActive) {
        return
      }

      try {
        logVideoSDK('MeetingScreenSimple', 'Initializing VideoSDK before MeetingProvider creation')
        const videoSDK = VideoSDKService.getInstance()

        const status = videoSDK.getInitializationStatus()
        const isFirstTimeOrColdStart = videoSDK.isFirstTimeOrColdStart()

        if (!status.initialized || !status.websocketReady || isFirstTimeOrColdStart) {
          logVideoSDK('MeetingScreenSimple', 'VideoSDK not ready or first-time/cold start, ensuring initialization', {
            status,
            isFirstTimeOrColdStart
          })

          const success = await videoSDK.ensureInitialized()

          if (!success) {
            logError('MeetingScreenSimple', 'VideoSDK initialization failed', new Error('VideoSDK initialization returned false'))
            return
          }

          // Wait for WebSocket to be ready with enhanced timeout for first-time users
          const timeout = isFirstTimeOrColdStart ? 15000 : 8000
          logVideoSDK('MeetingScreenSimple', `Waiting for VideoSDK WebSocket to be ready (timeout: ${timeout}ms)...`)
          const websocketReady = await videoSDK.waitForWebSocketReady(timeout)

          if (!websocketReady) {
            logError('MeetingScreenSimple', 'WebSocket failed to become ready within timeout')
            return
          }
        }

        logVideoSDK('MeetingScreenSimple', 'VideoSDK is ready, setting videoSDKReady to true')
        setVideoSDKReady(true)
      } catch (error) {
        logError('MeetingScreenSimple', 'VideoSDK initialization error', error)
        setVideoSDKReady(false)
      }
    }

    initializeVideoSDK()
  }, [sessionIsValid, callIsActive])

  // Debug logging for state changes
  useEffect(() => {
    logCall('MeetingScreenSimple', 'State changed', {
      sessionId: session?.sessionId,
      status,
      sessionIsValid,
      callIsActive,
      videoSDKReady,
      isComponentActive: isComponentActive.current,
      hasInitialized: hasInitialized.current
    })
  }, [session?.sessionId, status, sessionIsValid, callIsActive, videoSDKReady])
  
  // Global component tracking key
  const globalComponentKey = sessionIsValid && session ? `meeting-${session.sessionId}` : null
  
  // STRICT component instance management - prevent multiple renders entirely
  useEffect(() => {
    if (!isMountedRef.current) return
    
    logCall('[MeetingScreenSimple] Component mounted with details', {
      componentId: componentId.current,
      sessionId: session?.sessionId,
      status
    })
    
    // Comprehensive validation before allowing component to become active
    if (!sessionIsValid) {
      logCall('[MeetingScreenSimple] Session invalid, not activating component', {
        sessionId: session?.sessionId,
        meetingId: session?.meetingId,
        hasToken: !!session?.token
      })
      return
    }
    
    if (!callIsActive) {
      logCall('[MeetingScreenSimple] Call not active, not activating component. Status:', status)
      return
    }
    
    if (!globalComponentKey) {
      logCall('[MeetingScreenSimple] No valid global component key, not activating')
      return
    }
    
    // Initialize global tracking if needed
    if (!global.meetingComponentInstances) {
      global.meetingComponentInstances = {}
    }
    
    // Check if another component is already handling this session
    const existingComponentId = global.meetingComponentInstances[globalComponentKey]
    if (existingComponentId && existingComponentId !== componentId.current) {
      logWarn('MeetingScreenSimple', `Another component instance already exists for session: ${session.sessionId}. Existing ID: ${existingComponentId}, Current ID: ${componentId.current}. NOT ACTIVATING`)
      isComponentActive.current = false
      return
    }
    
    // Register this component as the active instance
    global.meetingComponentInstances[globalComponentKey] = componentId.current
    isComponentActive.current = true
    hasInitialized.current = true
    
    logCall('[MeetingScreenSimple] Component activated and registered for session:', session.sessionId, 'Component ID:', componentId.current)
    
    return () => {
      if (!isMountedRef.current) return

      logCall('[MeetingScreenSimple] Component cleanup for session:', session?.sessionId, 'Component ID:', componentId.current)

      // Enhanced cleanup with state validation
      const currentSessionId = session?.sessionId;

      // Only cleanup if this component was the active one
      if (globalComponentKey && global.meetingComponentInstances?.[globalComponentKey] === componentId.current) {
        delete global.meetingComponentInstances[globalComponentKey]
        logCall('[MeetingScreenSimple] Cleaned up global component registration for session:', currentSessionId)
      }

      // Clear VideoSDK active meeting session if this component owns it
      if (currentSessionId && isComponentActive.current) {
        try {
          const videoSDK = VideoSDKService.getInstance();
          videoSDK.clearActiveMeetingSession(currentSessionId);
          logCall('[MeetingScreenSimple] Cleared VideoSDK active meeting session:', currentSessionId);
        } catch (error) {
          logError('[MeetingScreenSimple] Error clearing VideoSDK session during cleanup', error);
        }
      }

      isComponentActive.current = false
      hasInitialized.current = false
    }
  }, [sessionIsValid, callIsActive, globalComponentKey, session?.sessionId, status])
  
  // Main cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      isComponentActive.current = false
      hasInitialized.current = false
    }
  }, [])
  
  // STRICT early returns - prevent ANY rendering if conditions not met
  if (!isMountedRef.current) {
    logCall('[MeetingScreenSimple] Component unmounted, returning null')
    return null
  }
  
  if (!sessionIsValid) {
    logCall('[MeetingScreenSimple] Session not valid, showing loading')
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading call...</Text>
      </View>
    )
  }
  
  if (!callIsActive) {
    logCall('[MeetingScreenSimple] Call not active, showing loading. Status:', status)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    )
  }
  
  if (!isComponentActive.current || !hasInitialized.current) {
    logCall('MeetingScreenSimple', 'Component not active or not initialized, returning null')
    return null
  }

  // Check if VideoSDK is ready before creating MeetingProvider
  if (!videoSDKReady) {
    logVideoSDK('MeetingScreenSimple', 'VideoSDK not ready yet, showing loading...')
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1178F8" />
        <Text style={styles.loadingText}>Initializing VideoSDK...</Text>
      </View>
    )
  }

  // Only create MeetingProvider if this is the active component instance AND we have a valid session
  logCall('MeetingScreenSimple', 'Rendering active component for session', { sessionId: session.sessionId, componentId: componentId.current })

  const meetingConfig = {
    meetingId: session.meetingId,
    micEnabled: true,
    webcamEnabled: session.type === 'video',
    name: "User", // TODO: get from AsyncStorage
    notification: {
      title: `${session.type} call`,
      message: `with ${session.peerName}`
    }
  }

  logCall('MeetingScreenSimple', 'MeetingProvider config', {
    token: session.token ? 'present' : 'missing',
    config: meetingConfig
  })

  return (
    <MeetingProvider
      key={`meeting-${session.sessionId}-${componentId.current}`} // Force new provider for each session
      token={session.token}
      config={meetingConfig}
    >
      <MeetingContent />
    </MeetingProvider>
  )
}

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
    color: '#fff',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  timerContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  participantsContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteParticipant: {
    flex: 1,
  },
  localParticipant: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nameTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
  },
  nameTagText: {
    color: '#fff',
    fontSize: 12,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '600',
  },
  callStatus: {
    color: '#00D4AA',
    fontSize: 16,
    marginTop: 12,
  },
  controlsContainer: {
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
  },
  activeSpeakerIndicator: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  activeSpeakerText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  enhancedControlButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF4343',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  statusIndicators: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
  },
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Ringing animation styles
  ringingContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringingRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  ringingAvatar: {
    // This will wrap the existing avatar styles
  },
  // Muted status styles
  mutedStatusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  mutedText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
})

// Enhanced export with error boundary
const MeetingScreenSimpleWithErrorBoundary: React.FC<{ route: any }> = ({ route }) => {
  const handleVideoSDKError = (error: Error) => {
    logError('MeetingScreenSimple', 'VideoSDK error occurred, attempting recovery', error);

    // Attempt to recover by resetting VideoSDK
    try {
      const videoSDK = VideoSDKService.getInstance();
      videoSDK.reset(true); // Force reset
    } catch (resetError) {
      logError('MeetingScreenSimple', 'Failed to reset VideoSDK during error recovery', resetError);
    }
  };

  return (
    <VideoSDKErrorBoundary onError={handleVideoSDKError}>
      <MeetingScreenSimple route={route} />
    </VideoSDKErrorBoundary>
  );
};

export default MeetingScreenSimpleWithErrorBoundary
