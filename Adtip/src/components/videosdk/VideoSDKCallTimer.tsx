import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface VideoSDKCallTimerProps {
  // Add props here if needed in the future
}

const VideoSDKCallTimer: React.FC<VideoSDKCallTimerProps> = () => {
  const { colors } = useTheme();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prevDuration => prevDuration + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
      <Clock size={14} color="rgba(255,255,255,0.8)" />
      <Text style={styles.timerText}>
        {formatDuration(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    fontVariant: ['tabular-nums'], // Monospace numbers for consistent width
  },
});

export default VideoSDKCallTimer;