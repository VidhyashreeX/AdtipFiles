import React, { useRef, useEffect, useState } from 'react';
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
  const [videoStream, setVideoStream] = useState<any>(null);
  const [audioStream, setAudioStream] = useState<any>(null);

  // Use VideoSDK's useParticipant hook
  const {
    displayName,
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isActiveSpeaker,
    isLocal: participantIsLocal,
  } = useParticipant(participant.id);

  useEffect(() => {
    if (webcamStream) {
      setVideoStream(webcamStream);
    } else {
      setVideoStream(null);
    }
  }, [webcamStream]);

  useEffect(() => {
    if (micStream) {
      setAudioStream(micStream);
    } else {
      setAudioStream(null);
    }
  }, [micStream]);

  const renderVideoView = () => {
    if (videoStream && webcamOn) {
      return (
        <RTCView
          streamURL={videoStream}
          objectFit="cover"
          style={styles.videoStream}
          mirror={isLocal} // Mirror local video
        />
      );
    }

    // Show placeholder when video is off
    return (
      <View style={[styles.videoPlaceholder, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {displayName ? displayName[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={[styles.participantName, { color: colors.text.primary }]}>
          {displayName || 'Unknown'}
        </Text>
        {!webcamOn && (
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>
            Camera Off
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderVideoView()}
      
      {/* Participant info overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName || 'Unknown'} {isLocal && '(You)'}
          </Text>
            {/* Audio/Video status indicators */}
          <View style={styles.statusIndicators}>
            {/* Mic status */}
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: micOn ? '#00D4AA' : '#FF3B30' }
            ]}>
              {micOn ? 
                <Mic size={12} color="#ffffff" /> : 
                <MicOff size={12} color="#ffffff" />
              }
            </View>
            
            {/* Camera status (only show for video calls) */}
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
          {/* Active speaker indicator */}
        {isActiveSpeaker && (
          <View style={styles.activeSpeakerIndicator}>
            <View style={styles.speakerPulse} />
            <Text style={styles.activeSpeakerText}>Speaking</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  videoStream: {
    flex: 1,
    backgroundColor: '#000000',
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