import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface VideoSDKCallTimerProps {
  duration: number; // Duration in seconds
}

const VideoSDKCallTimer: React.FC<VideoSDKCallTimerProps> = ({ duration }) => {
  const { colors } = useTheme();

  const formatDuration = (seconds: number): string => {
    if (seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timerText, { color: colors.white || '#ffffff' }]}>
        {formatDuration(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace', // Use monospace for consistent digit spacing
  },
});

export default VideoSDKCallTimer;