import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, // Change to PhoneOff for end call
  Users
} from 'lucide-react-native';
import { CallSettings, CallType } from '../../types/videosdk';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoSDKControlsBarProps {
  callType: 'voice' | 'video';
  callSettings: {
    micEnabled: boolean;
    webcamEnabled: boolean;
    speakerEnabled: boolean;
  };
  onToggleMic: () => void;
  onToggleWebcam: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  participantCount: number;
  isConnecting?: boolean;
}

const VideoSDKControlsBar: React.FC<VideoSDKControlsBarProps> = ({
  callType,
  callSettings,
  onToggleMic,
  onToggleWebcam,
  onToggleSpeaker,
  onEndCall,
  participantCount,
  isConnecting = false,
}) => {
  const { colors } = useTheme();

  const ControlButton: React.FC<{
    onPress: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    isEndCall?: boolean;
    testID?: string;
  }> = ({ 
    onPress, 
    isActive, 
    icon, 
    isEndCall = false,
    testID 
  }) => (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.controlButton,
        isEndCall ? styles.endCallButton : {
          backgroundColor: isActive 
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(255,255,255,0.1)'
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Mic Button - Always available */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callSettings.micEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(220,53,69,0.9)' },
              isConnecting && styles.connectingButton,
            ]}
            onPress={onToggleMic}
            disabled={isConnecting}
            activeOpacity={0.7}
          >
            <View style={styles.controlButtonInner}>
              {callSettings.micEnabled ? (
                <Mic size={24} color="#ffffff" />
              ) : (
                <MicOff size={24} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>

          {/* Video Button - Only for video calls */}
          {callType === 'video' && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: callSettings.webcamEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(220,53,69,0.9)' },
                isConnecting && styles.connectingButton,
              ]}
              onPress={onToggleWebcam}
              disabled={isConnecting}
              activeOpacity={0.7}
            >
              <View style={styles.controlButtonInner}>
                {callSettings.webcamEnabled ? (
                  <Video size={24} color="#ffffff" />
                ) : (
                  <VideoOff size={24} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Speaker Button - Only for voice calls */}
          {callType === 'voice' && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: callSettings.speakerEnabled ? 'rgba(0,212,170,0.9)' : 'rgba(255,255,255,0.2)' },
                isConnecting && styles.connectingButton,
              ]}
              onPress={onToggleSpeaker}
              disabled={isConnecting}
              activeOpacity={0.7}
            >
              <View style={styles.controlButtonInner}>
                {callSettings.speakerEnabled ? (
                  <Volume2 size={24} color="#ffffff" />
                ) : (
                  <VolumeX size={24} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* End Call Button - Always available and prominent */}
          <TouchableOpacity
            style={[styles.endCallButton, isConnecting && styles.endCallButtonConnecting]}
            onPress={onEndCall}
            activeOpacity={0.8}
          >
            <View style={styles.endCallButtonInner}>
              <PhoneOff size={28} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Participants Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: 'rgba(255,255,255,0.2)' },
              isConnecting && styles.connectingButton,
            ]}
            disabled={isConnecting}
            activeOpacity={0.7}
          >
            <View style={styles.controlButtonInner}>
              <Users size={22} color="#ffffff" />
              {participantCount > 1 && (
                <View style={styles.participantBadge}>
                  <Text style={styles.participantCount}>{participantCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 34, // Extra bottom padding for safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  endCallButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
  },
  participantBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  participantCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Connecting state styles
  connectingButton: {
    opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  endCallButtonConnecting: {
    // Keep end call button fully visible during connecting
    opacity: 1,
    backgroundColor: '#FF3B30',
  },
});

export default VideoSDKControlsBar;