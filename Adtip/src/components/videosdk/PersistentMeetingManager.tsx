import React, { useEffect, useRef, useState, useCallback } from 'react'
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
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  RTCView,
  MediaStream
} from '@videosdk.live/react-native-sdk'
import {
  Mic, MicOff, Camera, CameraOff, Phone,
  Volume2
} from 'lucide-react-native'

import { useCallStore, CallSession } from '../../stores/callStoreSimplified'
import CallController from '../../services/calling/CallController'
import VideoSDKService from '../../services/videosdk/VideoSDKService'
import { logCall, logError, logWarn } from '../../utils/ProductionLogger'

interface MeetingConfig {
  sessionId: string
  meetingId: string
  token: string
  peerName: string
  callType: 'video' | 'voice'
  direction: 'incoming' | 'outgoing'
}

// Persistent Participant Video Component
const PersistentParticipantVideo = ({ participantId, isLocal = false }: { participantId: string; isLocal?: boolean }) => {
  const {
    displayName,
    webcamStream,
    webcamOn,
    micOn,
  } = useParticipant(participantId)

  const meeting = useMeeting()
  const actualIsLocal = meeting?.localParticipant?.id === participantId
  const finalIsLocal = actualIsLocal

  // Show placeholder when no video
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
          {displayName || 'Unknown'} {finalIsLocal && '(You)'}
        </Text>
      </View>
      
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

// Persistent Controls Component
const PersistentControls = ({ config }: { config: MeetingConfig | null }) => {
  const { toggleMic, toggleWebcam, localParticipant } = useMeeting()
  const { media } = useCallStore()
  const actions = useCallStore(state => state.actions)
  const controller = CallController.getInstance()

  const micOn = localParticipant?.micOn ?? false
  const webcamOn = localParticipant?.webcamOn ?? false
  const speakerOn = media.speaker

  const handleEndCall = async () => {
    // Stop media streams before ending call
    try {
      logCall('PersistentControls', 'Stopping media streams before ending call')
      
      // Turn off camera and mic before ending call
      if (webcamOn) {
        toggleWebcam()
      }
      if (micOn) {
        toggleMic()
      }
      
      // Small delay to ensure media stops before ending call
      setTimeout(async () => {
        await controller.endCall()
      }, 200)
    } catch (error) {
      logWarn('PersistentControls', 'Error stopping media, ending call anyway', error)
      await controller.endCall()
    }
  }

  const handleToggleMic = () => {
    toggleMic()
    actions.updateMedia({ mic: !micOn })
  }

  const handleToggleCamera = () => {
    toggleWebcam()
    actions.updateMedia({ cam: !webcamOn })
  }
  
  const handleToggleSpeaker = () => {
    actions.updateMedia({ speaker: !speakerOn })
  }
  
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleToggleMic}
      >
        {micOn ? (
          <Mic size={22} color="#fff" />
        ) : (
          <MicOff size={22} color="#fff" />
        )}
      </TouchableOpacity>

      {config?.callType === 'video' && (
        <TouchableOpacity
          style={styles.controlButton}
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

// Persistent Meeting Content Component
const PersistentMeetingContent = React.forwardRef<any, { config: MeetingConfig | null; status: string; meeting?: any }>(
  ({ config, status, meeting: providedMeeting }, ref) => {
  // Only use useMeeting() if no meeting is provided (i.e., when we have real credentials)
  const meetingFromHook = providedMeeting === undefined ? useMeeting() : null
  const meeting = providedMeeting || meetingFromHook
  const { participants, localParticipant, join } = meeting || {}
  const localParticipantId = localParticipant?.id
  const controller = CallController.getInstance()
  const mediaService = controller.getMediaService()
  const actions = useCallStore(state => state.actions)

  // Persistent refs
  const hasSetMeetingRef = useRef(false)
  const joinedRef = useRef(false)
  const joinAttemptsRef = useRef(0)
  const currentSessionRef = useRef<string | null>(null)

  // Reset function for new calls
  const resetForNewCall = useCallback((newConfig: MeetingConfig) => {
    logCall('PersistentMeetingContent', 'Resetting for new call', { sessionId: newConfig.sessionId })
    
    // Stop all media streams before reset
    if (meeting && joinedRef.current) {
      logCall('PersistentMeetingContent', 'Stopping all media streams before reset')
      try {
        // Turn off camera and mic completely using correct VideoSDK methods
        if (meeting.localParticipant?.webcamOn) {
          meeting.toggleWebcam()
        }
        if (meeting.localParticipant?.micOn) {
          meeting.toggleMic()
        }
        
        // Leave the meeting to fully release resources
        meeting.leave()
      } catch (error) {
        logWarn('PersistentMeetingContent', 'Error stopping media during reset', error)
      }
    }
    
    // Clear previous meeting reference
    if (hasSetMeetingRef.current) {
      mediaService.setMeetingRef(null)
      hasSetMeetingRef.current = false
    }
    
    // Reset join state
    joinedRef.current = false
    joinAttemptsRef.current = 0
    currentSessionRef.current = newConfig.sessionId
    
    logCall('[PersistentMeetingContent] Reset complete for session:', newConfig.sessionId)
  }, [mediaService, meeting])

  // Expose reset function via ref
  React.useImperativeHandle(ref, () => ({
    resetForNewCall
  }), [resetForNewCall])

  // Set meeting reference
  useEffect(() => {
    if (meeting && config && !hasSetMeetingRef.current) {
      logCall('[PersistentMeetingContent] Setting meeting reference for session:', config.sessionId)
      mediaService.setMeetingRef(meeting)
      hasSetMeetingRef.current = true
    }
  }, [meeting, mediaService, config])

  // Reset join state when config changes (for meetingId updates)
  useEffect(() => {
    if (config && currentSessionRef.current !== config.sessionId) {
      logCall('[PersistentMeetingContent] Session changed, resetting join state', {
        oldSession: currentSessionRef.current,
        newSession: config.sessionId,
        meetingId: config.meetingId
      });

      // Reset join state for new session
      joinedRef.current = false;
      joinAttemptsRef.current = 0;
      hasSetMeetingRef.current = false;
      currentSessionRef.current = config.sessionId;
    }

    // Also reset join state when meetingId changes from temp to real
    if (config && config.meetingId && !config.meetingId.startsWith('temp-') &&
        config.token !== 'temp-token' && joinedRef.current === false) {
      logCall('[PersistentMeetingContent] Real meetingId and token received, ready to join', {
        meetingId: config.meetingId,
        hasRealToken: config.token !== 'temp-token'
      });

      // Reset attempts to allow fresh join with real credentials
      joinAttemptsRef.current = 0;
    }
  }, [config?.sessionId, config?.meetingId, config?.token]);

  // Join meeting logic - now only called with real credentials
  useEffect(() => {
    if (!config || !meeting || joinedRef.current) return

    const joinMeeting = async () => {
      if (joinAttemptsRef.current >= 3) return

      joinAttemptsRef.current += 1
      logCall(`[PersistentMeetingContent] Join attempt ${joinAttemptsRef.current} for session:`, config.sessionId)

      try {
        logCall('[PersistentMeetingContent] Joining meeting with ID:', config.meetingId)
        await meeting.join()
        joinedRef.current = true
        logCall('[PersistentMeetingContent] Successfully joined meeting', config.meetingId)
        
        // Update status based on call direction
        if (status === 'outgoing') {
          actions.setStatus('connecting')
          setTimeout(() => actions.setStatus('in_call'), 1000)
        } else {
          actions.setStatus('in_call')
        }
      } catch (err: any) {
        const errorMessage = err?.message || String(err)
        logWarn('PersistentMeetingContent', `Join attempt ${joinAttemptsRef.current} failed`, { error: errorMessage })

        // Check for WebSocket specific errors
        const isWebSocketError = errorMessage.includes('websocket') ||
                                errorMessage.includes('WebSocket') ||
                                errorMessage.includes('connection') ||
                                errorMessage.includes('reconnect')

        // Check for VideoSDK specific error codes
        const isVideoSDKError = err?.code && (
          err.code >= 4001 && err.code <= 5006 // VideoSDK error code range
        )

        if (joinAttemptsRef.current < 3) {
          // Enhanced retry logic with WebSocket reconnection
          if (isWebSocketError || isVideoSDKError) {
            logCall('PersistentMeetingContent', 'WebSocket/VideoSDK error detected, attempting reconnection')

            try {
              // Ensure VideoSDK is properly initialized before reconnection
              const videoSDK = VideoSDKService.getInstance()

              // Check if VideoSDK needs re-initialization
              const status = videoSDK.getInitializationStatus()
              if (!status.initialized || !status.websocketReady) {
                logCall('PersistentMeetingContent', 'Re-initializing VideoSDK before reconnection')
                await videoSDK.initialize()
              }

              // Attempt WebSocket reconnection with enhanced error handling
              const reconnected = await videoSDK.handleWebSocketReconnection(err, 1, 3)

              if (reconnected && videoSDK.isWebSocketHealthy()) {
                logCall('PersistentMeetingContent', 'WebSocket reconnection successful, retrying join')
                // Longer delay after reconnection to ensure stability
                setTimeout(joinMeeting, 3000)
              } else {
                logWarn('PersistentMeetingContent', 'WebSocket reconnection failed, using extended retry')
                setTimeout(joinMeeting, 2500)
              }
            } catch (reconnectError) {
              logError('PersistentMeetingContent', 'Error during WebSocket reconnection', reconnectError)
              // Fallback to standard retry with progressive delay
              const retryDelay = 1500 * joinAttemptsRef.current
              setTimeout(joinMeeting, retryDelay)
            }
          } else {
            // Standard retry for non-WebSocket errors
            setTimeout(joinMeeting, 1000)
          }
        } else {
          logError('PersistentMeetingContent', 'All join attempts failed', { finalError: errorMessage })
          actions.setStatus('ended')
        }
      }
    }

    joinMeeting()
  }, [config, meeting, status, actions])

  if (!config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading call...</Text>
      </View>
    )
  }

  // Handle case where meeting is null (waiting for real credentials)
  if (!meeting) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {config?.peerName || 'Connecting...'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Preparing call...
          </Text>
        </View>

        {/* Loading state */}
        <View style={styles.participantsContainer}>
          <View style={styles.videoPlaceholder}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.placeholderText}>
              Preparing call...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Get participants (with null checks)
  const allParticipants = participants ? [...participants.values()].filter(p => p && p.id && p.displayName) : []
  const remoteParticipants = allParticipants.filter(p => p.id !== localParticipantId)
  const isVideo = config.callType === 'video'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {config.peerName || 'Connecting...'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {status === 'outgoing' ? 'Calling...' : 
           status === 'connecting' ? 'Connecting...' :
           status === 'in_call' ? `${config.callType} call` :
           'Call'}
        </Text>
      </View>
      
      {/* Video/Audio Content */}
      {isVideo ? (
        <View style={styles.participantsContainer}>
          <View style={styles.remoteParticipant}>
            {remoteParticipants.length > 0 ? (
              <PersistentParticipantVideo participantId={remoteParticipants[0].id} isLocal={false} />
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
          
          {localParticipantId && (
            <View style={styles.localParticipant}>
              <PersistentParticipantVideo participantId={localParticipantId} isLocal={true} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.audioContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {config.peerName?.[0]?.toUpperCase() || '?'}
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
      
      <PersistentControls config={config} />
    </SafeAreaView>
  )
})

// Global singleton state
interface PersistentMeetingState {
  currentConfig: MeetingConfig | null
  status: string
  isVisible: boolean
}

let globalState: PersistentMeetingState = {
  currentConfig: null,
  status: 'idle', 
  isVisible: false
}

let globalStateSetters: {
  setCurrentConfig: (config: MeetingConfig | null) => void
  setStatus: (status: string) => void
  setIsVisible: (visible: boolean) => void
  resetCall: () => void
} | null = null

// Main Persistent Meeting Manager
const PersistentMeetingManager: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<MeetingConfig | null>(globalState.currentConfig)
  const [status, setStatus] = useState<string>(globalState.status)
  const [isVisible, setIsVisible] = useState<boolean>(globalState.isVisible)
  const meetingContentRef = useRef<any>(null)

  // Set up global setters
  useEffect(() => {
    globalStateSetters = {
      setCurrentConfig: (config) => {
        globalState.currentConfig = config
        setCurrentConfig(config)
      },
      setStatus: (newStatus) => {
        globalState.status = newStatus
        setStatus(newStatus)
      },
      setIsVisible: (visible) => {
        globalState.isVisible = visible
        setIsVisible(visible)
      },
      resetCall: () => {
        logCall('PersistentMeetingManager', 'Resetting call state')
        
        // Stop all media streams completely before reset
        if (meetingContentRef.current?.resetForNewCall && globalState.currentConfig) {
          meetingContentRef.current.resetForNewCall(globalState.currentConfig)
        }
        
        // Additional cleanup: Force stop any remaining media streams
        setTimeout(() => {
          try {
            // In React Native, VideoSDK handles media cleanup internally
            // Just ensure CallController media service is properly reset
            const controller = CallController.getInstance()
            const mediaService = controller.getMediaService()
            mediaService.setMeetingRef(null)
            logCall('PersistentMeetingManager', 'Additional media cleanup completed')
          } catch (error) {
            logWarn('PersistentMeetingManager', 'Additional media cleanup error', error)
          }
        }, 100)
        
        globalState.currentConfig = null
        globalState.status = 'idle'
        globalState.isVisible = false
        setCurrentConfig(null)
        setStatus('idle')
        setIsVisible(false)
      }
    }
  }, [])

  if (!isVisible || !currentConfig) {
    return null
  }

  // CRITICAL FIX: Only create MeetingProvider when we have REAL credentials
  // This prevents WebSocket reconnection errors caused by multiple MeetingProvider recreations
  const hasRealCredentials = currentConfig.token !== 'temp-token' &&
                            !currentConfig.meetingId.startsWith('temp-');

  if (!hasRealCredentials) {
    logCall('[PersistentMeetingManager] Waiting for real credentials before creating MeetingProvider', {
      meetingId: currentConfig.meetingId,
      token: currentConfig.token,
      sessionId: currentConfig.sessionId
    });

    // Show connecting state without MeetingProvider to prevent WebSocket issues
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <PersistentMeetingContent
          config={currentConfig}
          status={status}
          meeting={null} // Explicitly null - don't use useMeeting hook
        />
      </View>
    );
  }

  // Use stable key based only on sessionId since we now only create once with real credentials
  const meetingProviderKey = `persistent-meeting-${currentConfig.sessionId}`;
  logCall('[PersistentMeetingManager] Creating MeetingProvider with real credentials', {
    key: meetingProviderKey,
    meetingId: currentConfig.meetingId,
    token: currentConfig.token ? 'present' : 'missing',
    sessionId: currentConfig.sessionId
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MeetingProvider
        key={meetingProviderKey}
        token={currentConfig.token}
        config={{
          meetingId: currentConfig.meetingId,
          micEnabled: true,
          webcamEnabled: currentConfig.callType === 'video',
          name: currentConfig.peerName || "User",
          // Standard notification configuration
          notification: {
            title: `${currentConfig.callType} call`,
            message: `with ${currentConfig.peerName}`
          }
        }}
      >
        <PersistentMeetingContent
          ref={meetingContentRef}
          config={currentConfig}
          status={status}
        />
      </MeetingProvider>
    </View>
  )
}

// Export singleton access functions
export const startPersistentCall = (config: MeetingConfig) => {
  try {
    logCall('[PersistentMeetingManager] Starting new call:', config.sessionId)

    // Validate config
    if (!config.sessionId || !config.meetingId || !config.token) {
      logError('[PersistentMeetingManager] Invalid config provided:', JSON.stringify({
        sessionId: !!config.sessionId,
        meetingId: !!config.meetingId,
        token: !!config.token
      }))
      throw new Error('Invalid meeting configuration')
    }

    // Reset previous call if any
    if (globalState.currentConfig && globalStateSetters) {
      try {
        globalStateSetters.resetCall()
      } catch (resetError) {
        logWarn('[PersistentMeetingManager] Error resetting previous call:', String(resetError))
      }
    }

    if (globalStateSetters) {
      globalStateSetters.setCurrentConfig(config)
      globalStateSetters.setStatus(config.direction === 'outgoing' ? 'connecting' : 'connecting')
      globalStateSetters.setIsVisible(true)
      logCall('[PersistentMeetingManager] Persistent call started successfully', config.sessionId)
    } else {
      logError('[PersistentMeetingManager] Global state setters not available', 'Missing global state')
      throw new Error('Persistent meeting manager not initialized')
    }
  } catch (error) {
    logError('[PersistentMeetingManager] Error starting persistent call:', String(error))

    // Try to update call store to indicate error
    try {
      const { useCallStore } = require('../../stores/callStoreSimplified')
      const store = useCallStore.getState()
      store.actions.setStatus('ended')
    } catch (storeError) {
      logError('[PersistentMeetingManager] Error updating call store on failure:', String(storeError))
    }

    throw error
  }
}

export const updatePersistentCallStatus = (status: string) => {
  if (globalStateSetters) {
    globalStateSetters.setStatus(status)
  }
}

export const updatePersistentCallConfig = (updates: {
  sessionId?: string;
  meetingId?: string;
  token?: string;
  status?: string;
}) => {
  if (globalStateSetters && globalState.currentConfig) {
    logCall('[PersistentMeetingManager] Updating call config:', {
      currentMeetingId: globalState.currentConfig.meetingId,
      newMeetingId: updates.meetingId,
      currentToken: globalState.currentConfig.token ? 'present' : 'missing',
      newToken: updates.token ? 'present' : 'missing',
      status: updates.status
    });

    // Update the config with new values
    const updatedConfig = {
      ...globalState.currentConfig,
      ...updates
    };

    globalStateSetters.setCurrentConfig(updatedConfig);

    if (updates.status) {
      globalStateSetters.setStatus(updates.status);
    }

    logCall('[PersistentMeetingManager] Call config updated successfully', {
      finalMeetingId: updatedConfig.meetingId,
      finalToken: updatedConfig.token ? 'present' : 'missing'
    });
  } else {
    logWarn('[PersistentMeetingManager] Cannot update config - missing setters or config');
  }
}

export const endPersistentCall = () => {
  if (globalStateSetters) {
    globalStateSetters.resetCall()
  }
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

export default PersistentMeetingManager
