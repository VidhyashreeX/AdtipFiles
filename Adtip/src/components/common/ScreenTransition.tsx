import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface ScreenTransitionProps {
  children: React.ReactNode;
  isActive?: boolean;
  animationType?: 'slide' | 'fade' | 'scale' | 'none';
  onEnterComplete?: () => void;
  skipAnimation?: boolean; // NEW: Skip animation for faster loading
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isActive = true,
  animationType = 'slide',
  onEnterComplete,
  skipAnimation = false,
}) => {
  const opacity = useSharedValue(isActive || skipAnimation ? 1 : 0);
  const translateY = useSharedValue(isActive || skipAnimation ? 0 : 20);
  const scale = useSharedValue(isActive || skipAnimation ? 1 : 0.95);

  // Skip animation logic for faster loading
  const shouldAnimate = useMemo(() => !skipAnimation && animationType !== 'none', [skipAnimation, animationType]);

  useEffect(() => {
    if (skipAnimation) {
      // Immediately set final values without animation
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      if (onEnterComplete) {
        onEnterComplete();
      }
      return;
    }

    if (isActive && shouldAnimate) {
      opacity.value = withTiming(1, {
        duration: 250, // Reduced from 300ms
        easing: Easing.out(Easing.quad), // Faster easing
      });
      
      translateY.value = withSpring(0, {
        damping: 25, // Increased damping for faster settling
        stiffness: 150, // Increased stiffness
        mass: 0.6, // Reduced mass
      });
      
      scale.value = withSpring(1, {
        damping: 22,
        stiffness: 130,
        mass: 0.7,
      }, (finished) => {
        if (finished && onEnterComplete) {
          runOnJS(onEnterComplete)();
        }
      });
    }
  }, [isActive, shouldAnimate, skipAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) {
      return { opacity: 1 }; // No animation, just show
    }

    switch (animationType) {
      case 'fade':
        return { opacity: opacity.value };
      case 'scale':
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };
      case 'slide':
      default:
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };
    }
  });

  if (skipAnimation) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenTransition;