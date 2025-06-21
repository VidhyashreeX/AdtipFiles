import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  isActive?: boolean;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isActive = true }) => {
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse animations
      const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        );
      };

      // Rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        }),
      );

      // Start all animations
      setTimeout(() => createPulseAnimation(pulseAnim1, 0).start(), 0);
      setTimeout(() => createPulseAnimation(pulseAnim2, 1000).start(), 1000);
      setTimeout(() => createPulseAnimation(pulseAnim3, 2000).start(), 2000);
      rotateAnimation.start();

      return () => {
        pulseAnim1.stopAnimation();
        pulseAnim2.stopAnimation();
        pulseAnim3.stopAnimation();
        rotateAnim.stopAnimation();
      };
    }
  }, [isActive]);

  const pulseStyle1 = {
    transform: [
      {
        scale: pulseAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
    opacity: pulseAnim1.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.6, 0.1],
    }),
  };

  const pulseStyle2 = {
    transform: [
      {
        scale: pulseAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1.4],
        }),
      },
    ],
    opacity: pulseAnim2.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.2, 0.4, 0.05],
    }),
  };

  const pulseStyle3 = {
    transform: [
      {
        scale: pulseAnim3.interpolate({
          inputRange: [0, 1],
          outputRange: [1.0, 1.6],
        }),
      },
    ],
    opacity: pulseAnim3.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.15, 0.3, 0.02],
    }),
  };

  const rotateStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Rotating gradient background */}
      <Animated.View style={[styles.rotatingBackground, rotateStyle]} />
      
      {/* Pulsing circles */}
      <Animated.View style={[styles.pulseCircle, styles.circle1, pulseStyle1]} />
      <Animated.View style={[styles.pulseCircle, styles.circle2, pulseStyle2]} />
      <Animated.View style={[styles.pulseCircle, styles.circle3, pulseStyle3]} />
      
      {/* Static gradient overlays */}
      <View style={styles.gradientOverlay1} />
      <View style={styles.gradientOverlay2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rotatingBackground: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_WIDTH * 2,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(0, 212, 170, 0.03)',
    top: -SCREEN_WIDTH / 2,
    left: -SCREEN_WIDTH / 2,
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    top: '20%',
    left: '50%',
    marginLeft: -200,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    top: '40%',
    right: '10%',
  },
  circle3: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    bottom: '25%',
    left: '15%',
  },
  gradientOverlay1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  gradientOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
  },
});

export default AnimatedBackground;
