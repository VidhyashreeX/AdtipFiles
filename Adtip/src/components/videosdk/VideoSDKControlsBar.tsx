import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CallSettings, CallType } from '../../types/videosdk';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoSDKControlsBarProps {
  callType: CallType;
  callSettings: CallSettings;
  onToggleMic: () => void;
  onToggleWebcam: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  participantCount: number;
}

const VideoSDKControlsBar: React.FC<VideoSDKControlsBarProps> = ({
  callType,
  callSettings,
  onToggleMic,
  onToggleWebcam,
  onToggleSpeaker,
  onEndCall,
  participantCount,
}) => {
  const { colors } = useTheme();

  const ControlButton: React.FC<{
    onPress: () => void;
    isActive: boolean;
    icon: string;
    activeColor?: string;
    inactiveColor?: string;
    testID?: string;
  }> = ({ 
    onPress, 
    isActive, 
    icon, 
    activeColor, 
    inactiveColor,
    testID 
  }) => (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.controlButton,
        {
          backgroundColor: isActive 
            ? (activeColor || colors.success || '#4CAF50')
            : (inactiveColor || colors.error || '#F44336')
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.controlIcon}>{icon}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.controlsContainer, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
      {/* Main Controls Row */}
      <View style={styles.controlsRow}>
        {/* Mic Control */}
        <ControlButton
          testID="mic-button"
          onPress={onToggleMic}
          isActive={callSettings.micEnabled}
          icon={callSettings.micEnabled ? '🎤' : '🔇'}
        />

        {/* Video Control (only for video calls) */}
        {callType === 'video' && (
          <ControlButton
            testID="camera-button"
            onPress={onToggleWebcam}
            isActive={callSettings.webcamEnabled}
            icon={callSettings.webcamEnabled ? '📹' : '📷'}
          />
        )}

        {/* Speaker Control */}
        <ControlButton
          testID="speaker-button"
          onPress={onToggleSpeaker}
          isActive={callSettings.speakerEnabled}
          icon={callSettings.speakerEnabled ? '🔊' : '🔈'}
        />

        {/* End Call Button */}
        <TouchableOpacity
          testID="end-call-button"
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={[styles.participantCount, { color: colors.white || '#ffffff' }]}>
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </Text>
        
        {/* Call Type Indicator */}
        <Text style={[styles.callTypeText, { color: colors.text?.secondary || '#cccccc' }]}>
          {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30, // Extra bottom padding for safe area
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    transform: [{ scale: 1.1 }], // Make end call button slightly larger
  },
  controlIcon: {
    fontSize: 28,
  },
  callInfo: {
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  callTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VideoSDKControlsBar;