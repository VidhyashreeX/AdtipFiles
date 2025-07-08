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
import { ParticipantView } from '../../components/videosdk'
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

  // Debug logging like your working component
  useEffect(() => {
    console.log(`[ParticipantVideo] Participant ${participantId}:`, {
      displayName,
      webcamOn,
      hasStream: !!webcamStream,
      streamId: webcamStream?.id,
      hasTrack: !!webcamStream?.track,
      isLocal
    })
  }, [participantId, displayName, webcamOn, webcamStream, isLocal])

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
        mirror={isLocal}
        zOrder={0}
      />
      <View style={styles.nameTag}>
        <Text style={styles.nameTagText}>
          {displayName || 'Unknown'} {isLocal && '(You)'}
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
  const { toggleMic, toggleWebcam, leave } = useMeeting()
  const { mic, cam } = useCallStore(state => state.media)
  const actions = useCallStore(state => state.actions)
  const controller = CallController.getInstance()
  
  const handleEndCall = async () => {
    await controller.endCall()
  }
  
  const handleToggleMic = () => {
    toggleMic()
    actions.updateMedia({ mic: !mic })
  }
  
  const handleToggleCamera = () => {
    toggleWebcam()
    actions.updateMedia({ cam: !cam })
  }
  
  const handleToggleSpeaker = () => {
    // TODO: implement speaker toggle
    actions.updateMedia({ speaker: !useCallStore.getState().media.speaker })
  }
  
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity 
        style={styles.controlButton} 
        onPress={handleToggleMic}
      >
        {mic ? (
          <Mic size={22} color="#fff" />
        ) : (
          <MicOff size={22} color="#fff" />
        )}
      </TouchableOpacity>
      
      {session?.type === 'video' && (
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleToggleCamera}
        >
          {cam ? (
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
  const meeting = useMeeting()
  const { participants, localParticipant, join, leave } = meeting
  const localParticipantId = localParticipant?.id
  const controller = CallController.getInstance()
  const mediaService = controller.getMediaService()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const actions = useCallStore(state => state.actions)
  
  // Save meeting reference for media service
  useEffect(() => {
    mediaService.setMeetingRef(meeting)
    return () => {
      mediaService.setMeetingRef(null)
    }
  }, [meeting, mediaService])
  
  // ==== Robust join with retry logic ====
  const joinedRef = useRef(false)
  const joinAttemptsRef = useRef(0)
  const initialLoadRef = useRef(true) // Track if this is the first load

  useEffect(() => {
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 1000
    const INITIAL_DELAY_MS = 1500 // Add delay for first join after app load

    const joinWithRetry = async () => {
      if (joinedRef.current || joinAttemptsRef.current >= MAX_ATTEMPTS) return

      joinAttemptsRef.current += 1
      console.log(`[MeetingScreen] Attempt ${joinAttemptsRef.current}/${MAX_ATTEMPTS} to join meeting…`)

      try {
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
          console.log('[MeetingScreen] First join after app load - adding extra delay for WebSocket stability')
          await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS))
          initialLoadRef.current = false
        }

        await meeting.join()
        joinedRef.current = true
        console.log('[MeetingScreen] Successfully joined meeting')
        actions.setStatus('in_call')
      } catch (err: any) {
        console.warn(`[MeetingScreen] Join attempt ${joinAttemptsRef.current} failed`, err?.message || err)

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
          console.log(`[MeetingScreen] Retrying in ${retryDelay}ms${isWebSocketError ? ' (WebSocket error)' : ''}`)
          setTimeout(joinWithRetry, retryDelay)
        } else {
          console.error('[MeetingScreen] All join attempts failed – ending call')
          actions.setStatus('ended')
        }
      }
    }

    // Trigger the first join attempt
    joinWithRetry()

    // Cleanup on unmount
    return () => {
      if (joinedRef.current && meeting.leave) {
        try { meeting.leave() } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
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
  const remoteParticipants = [...participants.values()].filter(
    p => p && p.id && p.displayName && p.id !== localParticipantId
  )
  
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
          {session?.type} call
        </Text>
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
                <Text style={styles.placeholderText}>Connecting...</Text>
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
          <Text style={styles.callStatus}>Connected</Text>
        </View>
      )}
      
      {/* Controls */}
      <Controls />
    </SafeAreaView>
  )
}

type MeetingScreenRouteProp = RouteProp<MainNavigatorParamList, 'Meeting'>

const MeetingScreenSimple = () => {
  const route = useRoute<MeetingScreenRouteProp>()
  const session = useCallStore(state => state.session)
  const status = useCallStore(state => state.status)
  const navigation = useNavigation()
  
  // Note: Navigation after call end is handled by CallController and App.tsx
  // Removed automatic navigation from here to prevent conflicts
  
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading call...</Text>
      </View>
    )
  }
  
  return (
    <MeetingProvider
      token={session.token}
      config={{
        meetingId: session.meetingId,
        micEnabled: true,
        webcamEnabled: session.type === 'video',
        name: "User", // TODO: get from AsyncStorage
        notification: {
          title: `${session.type} call`,
          message: `with ${session.peerName}`
        }
      }}
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
