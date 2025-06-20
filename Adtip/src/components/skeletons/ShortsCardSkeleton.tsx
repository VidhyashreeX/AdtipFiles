import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ShortsCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const createPulseStyle = (delay: number = 0) => {
    return useAnimatedStyle(() => {
      const opacity = interpolate(
        pulseAnimation.value,
        [0, 1],
        [0.3, 0.8],
        Extrapolate.CLAMP
      );
      
      return {
        opacity: withTiming(opacity, { duration: 100 + delay }),
      };
    });
  };

  return (
    <View style={styles.container}>
      {/* Main video area skeleton */}
      <Animated.View style={[styles.videoArea, createPulseStyle(0)]} />
      
      {/* Bottom overlay skeleton */}
      <View style={styles.overlay}>
        <View style={styles.leftContent}>
          {/* Channel info skeleton */}
          <View style={styles.channelInfo}>
            <Animated.View style={[styles.avatar, createPulseStyle(100)]} />
            <View style={styles.channelDetails}>
              <Animated.View style={[styles.channelName, createPulseStyle(200)]} />
              <Animated.View style={[styles.musicName, createPulseStyle(300)]} />
            </View>
            <Animated.View style={[styles.followButton, createPulseStyle(400)]} />
          </View>
          
          {/* Description skeleton */}
          <Animated.View style={[styles.descriptionLine1, createPulseStyle(500)]} />
          <Animated.View style={[styles.descriptionLine2, createPulseStyle(600)]} />
        </View>

        {/* Action buttons skeleton */}
        <View style={styles.rightActions}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={styles.actionButton}>
              <Animated.View style={[styles.actionIcon, createPulseStyle(700 + index * 100)]} />
              <Animated.View style={[styles.actionText, createPulseStyle(800 + index * 100)]} />
            </View>
          ))}
        </View>
      </View>

      {/* Progress bar skeleton */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground} />
        <Animated.View style={[styles.progressFill, createPulseStyle(1200)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoArea: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    marginRight: 12,
  },
  channelDetails: {
    flex: 1,
  },
  channelName: {
    width: '60%',
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 4,
  },
  musicName: {
    width: '40%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  followButton: {
    width: 70,
    height: 32,
    backgroundColor: '#333',
    borderRadius: 16,
  },
  descriptionLine1: {
    width: '90%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 7,
    marginBottom: 6,
  },
  descriptionLine2: {
    width: '70%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 7,
  },
  rightActions: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    marginBottom: 4,
  },
  actionText: {
    width: 32,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30%',
    height: '100%',
    backgroundColor: '#333',
  },
});

export default ShortsCardSkeleton;