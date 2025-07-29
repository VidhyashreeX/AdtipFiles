import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator
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
import { ParticipantView, VideoSDKCallTimer } from '../../components/videosdk'
import WhatsAppStyleVideoLayout from '../../components/videosdk/WhatsAppStyleVideoLayout'
import {
  Mic, MicOff, Camera, CameraOff, Phone,
  Volume2
} from 'lucide-react-native'

import { useCallStore, CallSession } from '../../stores/callStoreSimplified'
import CallController from '../../services/calling/CallController'
import { MainNavigatorParamList } from '../../types/navigation'
import VideoSDKService from '../../services/videosdk/VideoSDKService'
import { logError, logWarn, logVideoSDK, logCall } from '../../utils/ProductionLogger'
import SafeAreaEnforcer from '../../components/common/SafeAreaEnforcer'
import { useSafeAreaStyle } from '../../utils/SafeAreaUtils'

// Layout components

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
    logCall(`[ParticipantVideo] Participant ${participantId}:`, {
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
  const { toggleMic, toggleWebcam, leave, localParticipant } = useMeeting()
  const actions = useCallStore(state => state.actions)
  const controller = CallController.getInstance()

  // Use actual VideoSDK state instead of call store state for mic/camera
  const micOn = localParticipant?.micOn ?? false
  const webcamOn = localParticipant?.webcamOn ?? false

  // Subscribe to speaker state from call store for real-time updates
  const speakerOn = media.speaker

  const handleEndCall = async () => {
    try {
      await controller.endCall()
      // Navigate back to TipCall screen after ending call
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
    } catch (error) {
      logError('MeetingScreenSimple', 'Error ending call', error);
      // Still navigate back even if endCall fails
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
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
    }
  }

  const handleToggleMic = () => {
    toggleMic()
    // Update call store to match VideoSDK state
    actions.updateMedia({ mic: !micOn })
  }

  const handleToggleCamera = () => {
    toggleWebcam()
    // Update call store to match VideoSDK state
    actions.updateMedia({ cam: !webcamOn })
  }
  
  const handleToggleSpeaker = () => {
    // TODO: implement speaker toggle
    actions.updateMedia({ speaker: !speakerOn })
  }
  
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: micOn ? '#00D4AA' : '#FF3B30' }
        ]}
        onPress={handleToggleMic}
      >
        {micOn ? (
          <Mic size={22} color="#fff" />
        ) : (
          <MicOff size={22} color="#fff" />
        )}
      </TouchableOpacity>

      {session?.type === 'video' && (
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: webcamOn ? '#00D4AA' : '#FF3B30' }
          ]}
          onPress={handleToggleCamera}
        >
          {webcamOn ? (
            <Camera size={22} color="#fff" />
          ) : (
            <CameraOff size={22} color="#fff" />
          )}
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: speakerOn ? '#00D4AA' : '#333' }
        ]}
        onPress={handleToggleSpeaker}
      >
        <Volume2
          size={22}
          color="#fff"
          fill={speakerOn ? '#fff' : 'transparent'}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, styles.endCallButton]} 
        onPress={handleEndCall}
      >
        <Phone size={22} color="#fff" style={{ transform: [{rotate: '135deg'}] }} />
      </TouchableOpacity>
    </View>
  )
}

// Main component

const MeetingContent = () => {
  logCall('[MeetingContent] Component rendering...')

  const meeting = useMeeting()
  const { participants, localParticipant, join, leave } = meeting
  const localParticipantId = localParticipant?.id
  const controller = CallController.getInstance()
  const mediaService = controller.getMediaService()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const actions = useCallStore(state => state.actions)

  logCall('[MeetingContent] Initial state:', {
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
      logCall('[MeetingContent] Active instance check:', {
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
      logCall('[MeetingScreen] New session detected, validating participant state:', {
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
        logCall('[MeetingScreen] Post-session-change participant validation:', {
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
        logCall('[MeetingContent] Clearing meeting reference for session:', session?.sessionId);
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

        // Make sure VideoSDK is ready before each attempt
        const videoSDK = VideoSDKService.getInstance()
        if (!videoSDK.getInitializationStatus()) {
          await videoSDK.initialize()
          // Add extra delay after initialization
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // If this is the first join after app load, add extra delay
        // to ensure WebSocket is fully connected
        if (initialLoadRef.current) {
          logCall('[MeetingContent] First join after app load - ensuring WebSocket is ready')
          await videoSDK.waitForWebSocketReady()
          await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS))
          initialLoadRef.current = false
        }

        logCall('[MeetingContent] Joining meeting with ID:', session.meetingId)
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

      // Step 1: Leave meeting with timeout protection
      if (joinedRef.current && meeting.leave) {
        try {
          logCall('[MeetingContent] Leaving meeting on cleanup');
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
  
  // Handle back button or hardware back - direct call end without confirmation
  useEffect(() => {
    const backAction = () => {
      // End call immediately without confirmation dialog
      controller.endCall().then(() => {
        // Navigate back to TipCall screen after ending call
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
      }).catch((error) => {
        logError('MeetingScreenSimple', 'Error ending call on back press', error);
        // Still navigate back even if endCall fails
        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
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
      })
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {session?.peerName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          <Text style={styles.callStatus}>
            {status === 'outgoing' ? 'Calling...' :
             status === 'connecting' ? 'Connecting...' :
             status === 'in_call' ? 'Connected' :
             'Connecting...'}
          </Text>
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
  
  // More comprehensive session validation
  const sessionIsValid = session?.sessionId && session?.meetingId && session?.token
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

        if (!videoSDK.getInitializationStatus().initialized) {
          logVideoSDK('MeetingScreenSimple', 'VideoSDK not initialized, initializing now...')
          const success = await videoSDK.initialize()

          if (!success) {
            logError('MeetingScreenSimple', 'VideoSDK initialization failed', new Error('VideoSDK initialization returned false'))
            return
          }

          // Wait for WebSocket to be ready
          logVideoSDK('MeetingScreenSimple', 'Waiting for VideoSDK WebSocket to be ready...')
          await videoSDK.waitForWebSocketReady()
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
  const globalComponentKey = sessionIsValid ? `meeting-${session.sessionId}` : null
  
  // STRICT component instance management - prevent multiple renders entirely
  useEffect(() => {
    if (!isMountedRef.current) return
    
    logCall('[MeetingScreenSimple] Component mounted with ID:', componentId.current, 'Session:', session?.sessionId, 'Status:', status)
    
    // Comprehensive validation before allowing component to become active
    if (!sessionIsValid) {
      logCall('[MeetingScreenSimple] Session invalid, not activating component:', { 
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
      
      // Only cleanup if this component was the active one
      if (globalComponentKey && global.meetingComponentInstances?.[globalComponentKey] === componentId.current) {
        delete global.meetingComponentInstances[globalComponentKey]
        logCall('[MeetingScreenSimple] Cleaned up global component registration')
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
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
})

export default MeetingScreenSimple
