import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { RTCView, MediaStream } from '@videosdk.live/react-native-sdk';
import { useParticipant } from '@videosdk.live/react-native-sdk';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticipantViewProps {
  participantId: string;
  isLocal?: boolean;
  style?: ViewStyle;
}

// ParticipantView component following VideoSDK documentation pattern
const ParticipantView: React.FC<ParticipantViewProps> = ({
  participantId,
  isLocal = false,
  style,
}) => {
  const { colors } = useTheme();

  // Access participant data directly from the hook following VideoSDK pattern
  const {
    displayName,
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isActiveSpeaker,
  } = useParticipant(participantId);

  // Enhanced debugging and error handling following VideoSDK pattern
  React.useEffect(() => {
    const participantInfo = {
      id: participantId,
      displayName: displayName || 'Unknown',
      isLocal,
      webcamOn,
      micOn,
      hasWebcamStream: !!webcamStream,
      streamId: webcamStream?.id || 'none',
      hasTrack: !!webcamStream?.track,
      isActiveSpeaker,
    };
    
    console.log(`[ParticipantView] 🎥 PARTICIPANT STATE UPDATE:`, participantInfo);
    
    if (webcamStream) {
      console.log(`[ParticipantView] 📹 STREAM DETAILS:`, {
        streamId: webcamStream.id,
        track: webcamStream.track,
        trackKind: webcamStream.track?.kind,
        trackEnabled: webcamStream.track?.enabled,
        trackMuted: webcamStream.track?.muted,
        trackReadyState: webcamStream.track?.readyState,
        participantId: participantId,
        isLocal,
      });
      
      // Log track events for debugging (with proper typing)
      if (webcamStream.track) {
        const track = webcamStream.track as any; // Type assertion for event listeners
        const logTrackEvent = (event: string) => {
          console.log(`[ParticipantView] 🎬 TRACK EVENT ${event} for ${displayName || participantId}:`, {
            kind: track.kind,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });
        };
        
        try {
          // Safely add event listeners if they exist
          if (typeof track.addEventListener === 'function') {
            track.addEventListener('ended', () => logTrackEvent('ENDED'));
            track.addEventListener('mute', () => logTrackEvent('MUTE'));
            track.addEventListener('unmute', () => logTrackEvent('UNMUTE'));
          }
        } catch (error) {
          console.log(`[ParticipantView] Could not add track event listeners:`, error);
        }
      }
    }
    
    if (webcamOn && webcamStream && webcamStream.track) {
      console.log(`[ParticipantView] ✅ SHOULD RENDER VIDEO for ${displayName || participantId}:`, {
        streamId: webcamStream.id,
        isLocal,
        webcamOn,
        hasTrack: !!webcamStream.track
      });
    } else {
      console.log(`[ParticipantView] ❌ CANNOT RENDER VIDEO for ${displayName || participantId}:`, {
        webcamOn,
        hasStream: !!webcamStream,
        streamId: webcamStream?.id || 'none',
        reason: !webcamOn ? 'Camera off' : !webcamStream ? 'No stream' : !webcamStream.track ? 'No track' : 'Unknown'
      });
    }
  }, [webcamStream, webcamOn, micOn, displayName, participantId, isLocal, isActiveSpeaker]);
  
  // Render video or placeholder based on webcam state following VideoSDK pattern
  const renderContent = () => {
    // Following VideoSDK documentation pattern: render video if webcam is on and stream exists
    if (webcamOn && webcamStream) {
      console.log(`[ParticipantView] 🎥 RENDERING VIDEO for ${displayName || participantId}:`, {
        streamId: webcamStream.id,
        isLocal,
        webcamOn,
        hasTrack: !!webcamStream.track,
        trackEnabled: webcamStream.track?.enabled,
        trackMuted: webcamStream.track?.muted,
        trackReadyState: webcamStream.track?.readyState,
      });
      
      // Using VideoSDK documentation pattern: RTCView with MediaStream exactly as documented
      return (
        <RTCView
          streamURL={new MediaStream([webcamStream.track]).toURL()}
          objectFit="cover"
          style={styles.videoStream}
          mirror={isLocal}
          zOrder={0}
        />
      );
    }

    // Show placeholder when video is off or no stream (VideoSDK pattern)
    const noVideoReason = !webcamOn 
      ? 'Camera disabled' 
      : !webcamStream 
      ? 'No stream available' 
      : !webcamStream.track 
      ? 'No track available' 
      : 'Unknown issue';
      
    console.log(`[ParticipantView] 📋 SHOWING PLACEHOLDER for ${displayName || participantId}: ${noVideoReason}`);

    return (
      <View style={[styles.videoPlaceholder, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(displayName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.participantName, { color: colors.text.primary }]}>
          {displayName || 'Unknown'}
        </Text>
        <Text style={[styles.statusText, { color: colors.text.secondary }]}>
          {noVideoReason}
        </Text>
        
        {/* Debug info in development */}
        {__DEV__ && (
          <View style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 4,
          }}>
            <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
              ID: {participantId?.substring(0, 8)}...
            </Text>
            <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
              Webcam: {webcamOn ? 'ON' : 'OFF'}
            </Text>
            <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
              Stream: {webcamStream ? 'YES' : 'NO'}
            </Text>
            {webcamStream && (
              <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
                Has Track: {webcamStream.track ? 'YES' : 'NO'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
      
      {/* Info overlay - only show when video is playing */}
      {webcamOn && webcamStream && (
        <View style={styles.infoOverlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName || 'Unknown'} {isLocal && '(You)'}
            </Text>
            <View style={styles.statusIndicators}>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: micOn ? '#00D4AA' : '#FF3B30' }
              ]}>
                {micOn ? 
                  <Mic size={12} color="#ffffff" /> : 
                  <MicOff size={12} color="#ffffff" />
                }
              </View>
              
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: webcamOn ? '#00D4AA' : '#FF3B30' }
              ]}>
                {webcamOn ? 
                  <Video size={12} color="#ffffff" /> : 
                  <VideoOff size={12} color="#ffffff" />
                }
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoStream: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent', // Changed from black for debugging
    minWidth: 100, // Ensure minimum dimensions
    minHeight: 100,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  statusIndicators: {
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
  activeSpeakerIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.9)',
    gap: 4,
  },
  speakerPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  activeSpeakerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ParticipantView;