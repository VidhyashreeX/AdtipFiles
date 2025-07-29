import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert
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
import { 
  Mic, MicOff, Camera, CameraOff, Phone, 
  Speaker
} from 'lucide-react-native'

import { useCallStore, CallSession } from '../../stores/callStoreSimplified'
import CallController from '../../services/calling/CallController'
import { MainNavigatorParamList } from '../../types/navigation'
import VideoSDKService from '../../services/videosdk/VideoSDKService'

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
    console.log(`[ParticipantVideo] Participant ${participantId}:`, {
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
  const { status, session } = useCallStore()
  const { toggleMic, toggleWebcam, leave, localParticipant } = useMeeting()
  const actions = useCallStore(state => state.actions)
  const controller = CallController.getInstance()

  // Use actual VideoSDK state instead of call store state
  const micOn = localParticipant?.micOn ?? false
  const webcamOn = localParticipant?.webcamOn ?? false

  const handleEndCall = async () => {
    await controller.endCall()
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
    actions.updateMedia({ speaker: !useCallStore.getState().media.speaker })
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
        style={styles.controlButton} 
        onPress={handleToggleSpeaker}
      >
        <Speaker size={22} color="#fff" style={{ opacity: useCallStore.getState().media.speaker ? 1 : 0.5 }} />
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
  console.log('[MeetingContent] Component rendering...')

  const meeting = useMeeting()
  const { participants, localParticipant, join, leave } = meeting
  const localParticipantId = localParticipant?.id
  const controller = CallController.getInstance()
  const mediaService = controller.getMediaService()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const actions = useCallStore(state => state.actions)

  console.log('[MeetingContent] Initial state:', {
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
      console.log('[MeetingContent] Active instance check:', {
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
      console.log('[MeetingScreen] New session detected, validating participant state:', {
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
        console.log('[MeetingScreen] Post-session-change participant validation:', {
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
      console.log('[MeetingContent] Setting meeting reference for session:', session.sessionId);
      mediaService.setMeetingRef(meeting);
      hasSetMeetingRef.current = true;
    }

    return () => {
      // Only clear if this component set the reference
      if (hasSetMeetingRef.current) {
        console.log('[MeetingContent] Clearing meeting reference for session:', session?.sessionId);
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
      console.log('[MeetingScreen] New session detected, resetting join state:', session.sessionId)

      // Complete state reset for new session
      joinedRef.current = false
      joinAttemptsRef.current = 0
      initialLoadRef.current = true
      hasSetMeetingRef.current = false

      // Clear any existing meeting reference to prevent participant state bleeding
      if (mediaService.isMeetingActive()) {
        console.log('[MeetingScreen] Clearing previous meeting reference for new session')
        mediaService.setMeetingRef(null)
      }

      // Force participant state reset to prevent mixing local/remote participants
      console.log('[MeetingScreen] Forcing participant state reset for session:', session.sessionId)
    }
  }, [session?.sessionId, mediaService])

  useEffect(() => {
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 1000
    const INITIAL_DELAY_MS = 1500 // Add delay for first join after app load

    const joinWithRetry = async () => {
      // Enhanced validation before attempting to join
      // For incoming calls, we'll be more lenient with the isActiveInstance check
      const isIncomingCall = session?.direction === 'incoming'
      const shouldAllowJoin = sessionIsValid && callIsActive && (isActiveInstance || isIncomingCall)

      if (!shouldAllowJoin) {
        console.log('[MeetingContent] Cannot join - validation failed:', {
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
        console.log('[MeetingContent] Incoming call detected, setting VideoSDK session as active...')
        const videoSDK = VideoSDKService.getInstance()
        videoSDK.setActiveMeetingSession(session.sessionId)

        // Check if this was a background call and ensure media is ready
        try {
          const { default: BackgroundMediaService } = await import('../../services/calling/BackgroundMediaService')
          const backgroundMediaService = BackgroundMediaService.getInstance()

          if (!backgroundMediaService.isMediaReady()) {
            console.log('[MeetingContent] Background call detected, initializing media...')
            await backgroundMediaService.initializeForBackgroundCall(session.type)
          }
        } catch (error) {
          console.warn('[MeetingContent] Error initializing background media:', error)
        }
      }
      
      if (joinedRef.current || joinAttemptsRef.current >= MAX_ATTEMPTS) return

      joinAttemptsRef.current += 1
      console.log(`[MeetingContent] Attempt ${joinAttemptsRef.current}/${MAX_ATTEMPTS} to join meeting for session:`, session?.sessionId)

      try {
        // Ensure we have a valid meeting and session before joining
        if (!meeting || !session?.sessionId) {
          console.warn('[MeetingContent] Cannot join - missing meeting or session')
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
          console.log('[MeetingContent] First join after app load - adding extra delay for WebSocket stability')
          await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS))
          initialLoadRef.current = false
        }

        console.log('[MeetingContent] Joining meeting with ID:', session.meetingId)
        await meeting.join()
        joinedRef.current = true
        console.log('[MeetingContent] Successfully joined meeting')
        
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
        console.warn(`[MeetingContent] Join attempt ${joinAttemptsRef.current} failed`, err?.message || err)

        // Check for WebSocket specific errors
        const errorMessage = err?.message || String(err)
        const isWebSocketError = errorMessage.includes('websocket') || 
                                errorMessage.includes('WebSocket') ||
                                errorMessage.includes('connection')
        
        // For WebSocket errors, add extra delay before retry
        const retryDelay = isWebSocketError 
          ? RETRY_DELAY_MS * 2 // Double delay for WebSocket errors
          : RETRY_DELAY_MS

        // Retry if we still have attempts left
        if (joinAttemptsRef.current < MAX_ATTEMPTS) {
          console.log(`[MeetingContent] Retrying in ${retryDelay}ms${isWebSocketError ? ' (WebSocket error)' : ''}`)
          setTimeout(joinWithRetry, retryDelay)
        } else {
          console.error('[MeetingContent] All join attempts failed – ending call')
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
      
      console.log('[MeetingContent] Component unmounting, performing comprehensive cleanup for session:', session?.sessionId);

      // Step 1: Leave meeting with timeout protection
      if (joinedRef.current && meeting.leave) {
        try {
          console.log('[MeetingContent] Leaving meeting on cleanup');
          Promise.race([
            meeting.leave(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cleanup leave timeout')), 2000)
            )
          ]).then(() => {
            console.log('[MeetingContent] Successfully left meeting on cleanup');
          }).catch((error) => {
            console.warn('[MeetingContent] Error or timeout leaving meeting on cleanup:', error);
          });
        } catch (error) {
          console.warn('[MeetingContent] Error leaving meeting on cleanup:', error);
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

      console.log('[MeetingContent] Component cleanup complete');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIsValid, callIsActive, isActiveInstance, meeting])
  
  // Handle back button or hardware back
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "End Call",
        "Are you sure you want to end the call?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "End", style: "destructive", onPress: () => controller.endCall() }
        ]
      )
      return true // Prevent default back action
    }
    
    // Add back button handler
    const backHandler = require('react-native').BackHandler.addEventListener('hardwareBackPress', backAction)
    
    return () => backHandler.remove()
  }, [controller])
  
  // Get remote participants (excluding local) and ensure they are valid
  // Use a more robust check to ensure we don't mix up local and remote participants
  const allParticipants = [...participants.values()].filter(p => p && p.id && p.displayName)
  
  // Extra validation to prevent local participant from being treated as remote
  const validRemoteParticipants = allParticipants.filter(p => {
    const isNotLocal = p.id !== localParticipantId
    
    // Additional validation: check if this participant ID was ever our local ID
    // This prevents session bleeding where previous local ID appears as remote
    if (lastSessionId.current && session?.sessionId !== lastSessionId.current) {
      console.log('[MeetingScreen] Cross-session participant validation:', {
        participantId: p.id,
        currentLocalId: localParticipantId,
        sessionId: session?.sessionId,
        lastSessionId: lastSessionId.current
      })
    }
    
    return isNotLocal
  })

  // Comprehensive debug logging to track participant state issues
  console.log('[MeetingScreen] Participant debug:', {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
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
        <View style={styles.participantsContainer}>
          {/* Remote participant (big) */}
          <View style={styles.remoteParticipant}>
            {remoteParticipants.length > 0 ? (
              <ParticipantVideo participantId={remoteParticipants[0].id} isLocal={false} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.placeholderText}>
                  {status === 'outgoing' ? 'Calling...' :
                   status === 'connecting' ? 'Connecting...' :
                   'Waiting for participant...'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Local participant (small) */}
          {localParticipantId && (
            <View style={styles.localParticipant}>
              <ParticipantVideo participantId={localParticipantId} isLocal={true} />
            </View>
          )}
        </View>
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
    </SafeAreaView>
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
  
  // More comprehensive session validation
  const sessionIsValid = session?.sessionId && session?.meetingId && session?.token
  const callIsActive = status === 'in_call' || status === 'connecting' || status === 'outgoing'

  // Debug logging for state changes
  useEffect(() => {
    console.log('[MeetingScreenSimple] State changed:', {
      sessionId: session?.sessionId,
      status,
      sessionIsValid,
      callIsActive,
      isComponentActive: isComponentActive.current,
      hasInitialized: hasInitialized.current
    })
  }, [session?.sessionId, status, sessionIsValid, callIsActive])
  
  // Global component tracking key
  const globalComponentKey = sessionIsValid ? `meeting-${session.sessionId}` : null
  
  // STRICT component instance management - prevent multiple renders entirely
  useEffect(() => {
    if (!isMountedRef.current) return
    
    console.log('[MeetingScreenSimple] Component mounted with ID:', componentId.current, 'Session:', session?.sessionId, 'Status:', status)
    
    // Comprehensive validation before allowing component to become active
    if (!sessionIsValid) {
      console.log('[MeetingScreenSimple] Session invalid, not activating component:', { 
        sessionId: session?.sessionId,
        meetingId: session?.meetingId,
        hasToken: !!session?.token
      })
      return
    }
    
    if (!callIsActive) {
      console.log('[MeetingScreenSimple] Call not active, not activating component. Status:', status)
      return
    }
    
    if (!globalComponentKey) {
      console.log('[MeetingScreenSimple] No valid global component key, not activating')
      return
    }
    
    // Initialize global tracking if needed
    if (!global.meetingComponentInstances) {
      global.meetingComponentInstances = {}
    }
    
    // Check if another component is already handling this session
    const existingComponentId = global.meetingComponentInstances[globalComponentKey]
    if (existingComponentId && existingComponentId !== componentId.current) {
      console.warn('[MeetingScreenSimple] Another component instance already exists for session:', session.sessionId, 'Existing ID:', existingComponentId, 'Current ID:', componentId.current, 'NOT ACTIVATING')
      isComponentActive.current = false
      return
    }
    
    // Register this component as the active instance
    global.meetingComponentInstances[globalComponentKey] = componentId.current
    isComponentActive.current = true
    hasInitialized.current = true
    
    console.log('[MeetingScreenSimple] Component activated and registered for session:', session.sessionId, 'Component ID:', componentId.current)
    
    return () => {
      if (!isMountedRef.current) return
      
      console.log('[MeetingScreenSimple] Component cleanup for session:', session?.sessionId, 'Component ID:', componentId.current)
      
      // Only cleanup if this component was the active one
      if (globalComponentKey && global.meetingComponentInstances?.[globalComponentKey] === componentId.current) {
        delete global.meetingComponentInstances[globalComponentKey]
        console.log('[MeetingScreenSimple] Cleaned up global component registration')
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
    console.log('[MeetingScreenSimple] Component unmounted, returning null')
    return null
  }
  
  if (!sessionIsValid) {
    console.log('[MeetingScreenSimple] Session not valid, showing loading')
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading call...</Text>
      </View>
    )
  }
  
  if (!callIsActive) {
    console.log('[MeetingScreenSimple] Call not active, showing loading. Status:', status)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    )
  }
  
  if (!isComponentActive.current || !hasInitialized.current) {
    console.log('[MeetingScreenSimple] Component not active or not initialized, returning null')
    return null
  }
  
  // Only create MeetingProvider if this is the active component instance AND we have a valid session
  console.log('[MeetingScreenSimple] Rendering active component for session:', session.sessionId, 'componentId:', componentId.current)

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

  console.log('[MeetingScreenSimple] MeetingProvider config:', {
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
