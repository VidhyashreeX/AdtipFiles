import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { RTCView } from '@videosdk.live/react-native-sdk';
import { useParticipant } from '@videosdk.live/react-native-sdk';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoSDKParticipantViewProps {
  participant: any; // VideoSDK participant object
  isLocal: boolean;
  style?: ViewStyle;
}

const VideoSDKParticipantView: React.FC<VideoSDKParticipantViewProps> = ({
  participant,
  isLocal,
  style,
}) => {
  const { colors } = useTheme();

  // Access participant data directly from the hook - no intermediate state
  const {
    displayName,
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isActiveSpeaker,
  } = useParticipant(participant.id);

  // FIX 5: ULTRA-DETAILED DEBUG LOGGING for RTCView issues
  React.useEffect(() => {
    const participantInfo = {
      id: participant.id,
      displayName: displayName || 'Unknown',
      isLocal,
      webcamOn,
      micOn,
      hasWebcamStream: !!webcamStream,
      streamId: webcamStream?.id || 'none',
      hasTrack: !!webcamStream?.track,
      isActiveSpeaker,
    };
    
    console.log(`[VideoSDKParticipantView] 🎥 PARTICIPANT STATE UPDATE:`, participantInfo);
    
    if (webcamStream) {
      console.log(`[VideoSDKParticipantView] 📹 STREAM DETAILS:`, {
        streamId: webcamStream.id,
        track: webcamStream.track,
        trackKind: webcamStream.track?.kind,
        trackEnabled: webcamStream.track?.enabled,
        trackMuted: webcamStream.track?.muted,
        trackReadyState: webcamStream.track?.readyState,
        participantId: participant.id,
        isLocal,
      });
      
      // Log track events for debugging (with proper typing)
      if (webcamStream.track) {
        const track = webcamStream.track as any; // Type assertion for event listeners
        const logTrackEvent = (event: string) => {
          console.log(`[VideoSDKParticipantView] 🎬 TRACK EVENT ${event} for ${displayName || participant.id}:`, {
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
          console.log(`[VideoSDKParticipantView] Could not add track event listeners:`, error);
        }
      }
    }
    
    if (webcamOn && webcamStream && webcamStream.id) {
      console.log(`[VideoSDKParticipantView] ✅ SHOULD RENDER RTCView for ${displayName || participant.id}:`, {
        streamId: webcamStream.id,
        isLocal,
        webcamOn,
        hasTrack: !!webcamStream.track
      });
    } else {
      console.log(`[VideoSDKParticipantView] ❌ CANNOT RENDER RTCView for ${displayName || participant.id}:`, {
        webcamOn,
        hasStream: !!webcamStream,
        streamId: webcamStream?.id || 'none',
        reason: !webcamOn ? 'Camera off' : !webcamStream ? 'No stream' : !webcamStream.id ? 'No stream ID' : 'Unknown'
      });
    }
  }, [webcamStream, webcamOn, micOn, displayName, participant.id, isLocal, isActiveSpeaker]);
  
  // Render video or placeholder based on webcam state
  const renderContent = () => {
    // ✅ FIX 5: ULTRA-ENHANCED video rendering with comprehensive debugging and error handling
    if (webcamOn && webcamStream && webcamStream.id) {
      console.log(`[VideoSDKParticipantView] 🎥 RENDERING RTCView for ${displayName || participant.id}:`, {
        streamId: webcamStream.id,
        isLocal,
        webcamOn,
        hasTrack: !!webcamStream.track,
        trackEnabled: webcamStream.track?.enabled,
        trackMuted: webcamStream.track?.muted,
        trackReadyState: webcamStream.track?.readyState,
        streamURL: webcamStream.id,
        mirror: isLocal,
        objectFit: 'cover',
        zOrder: 0,
      });
      
      return (
        <View style={styles.container}>
          <RTCView
            streamURL={webcamStream.id}
            objectFit="cover"
            style={styles.videoStream}
            mirror={isLocal}
            zOrder={0}
          />
          
          {/* Debug overlay for troubleshooting */}
          {__DEV__ && (
            <View style={{
              position: 'absolute',
              top: 5,
              left: 5,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 4,
              borderRadius: 4,
            }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                Stream: {webcamStream.id.substring(0, 8)}...
              </Text>
              <Text style={{ color: 'white', fontSize: 10 }}>
                Track: {webcamStream.track?.enabled ? '✅' : '❌'}
              </Text>
              <Text style={{ color: 'white', fontSize: 10 }}>
                Ready: {webcamStream.track?.readyState || 'unknown'}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Show detailed placeholder for debugging
    const noVideoReason = !webcamOn 
      ? 'Camera disabled' 
      : !webcamStream 
      ? 'No stream available' 
      : !webcamStream.id 
      ? 'Stream has no ID' 
      : 'Unknown issue';
      
    console.log(`[VideoSDKParticipantView] 📋 SHOWING PLACEHOLDER for ${displayName || participant.id}: ${noVideoReason}`);

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
              ID: {participant.id?.substring(0, 8)}...
            </Text>
            <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
              Webcam: {webcamOn ? 'ON' : 'OFF'}
            </Text>
            <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
              Stream: {webcamStream ? 'YES' : 'NO'}
            </Text>
            {webcamStream && (
              <Text style={[{ fontSize: 10 }, { color: colors.text.secondary }]}>
                Stream ID: {webcamStream.id ? 'YES' : 'NO'}
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
      
      {/* Info overlay */}
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

export default VideoSDKParticipantView;