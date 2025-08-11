import React, { useEffect, useMemo, useRef } from 'react';
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

  // Track if component is mounted to prevent animations during initial render
  const isMounted = useRef(false);
  const hasCompletedInitialAnimation = useRef(false);

  // Skip animation logic for faster loading
  const shouldAnimate = useMemo(() => !skipAnimation && animationType !== 'none', [skipAnimation, animationType]);

  // Stable callback reference to prevent useInsertionEffect warnings
  const stableOnEnterComplete = useRef(onEnterComplete);
  stableOnEnterComplete.current = onEnterComplete;

  useEffect(() => {
    // Mark as mounted after first render
    isMounted.current = true;

    if (skipAnimation) {
      // Immediately set final values without animation
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      if (stableOnEnterComplete.current && !hasCompletedInitialAnimation.current) {
        hasCompletedInitialAnimation.current = true;
        // Use setImmediate to avoid scheduling updates during render
        setImmediate(() => {
          stableOnEnterComplete.current?.();
        });
      }
      return;
    }

    if (isActive && shouldAnimate && isMounted.current) {
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
        if (finished && stableOnEnterComplete.current && !hasCompletedInitialAnimation.current) {
          hasCompletedInitialAnimation.current = true;
          // Use runOnJS properly to avoid useInsertionEffect warnings
          runOnJS(() => {
            // Schedule callback for next frame to avoid scheduling updates during render
            setImmediate(() => {
              stableOnEnterComplete.current?.();
            });
          })();
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