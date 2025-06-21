import { useCallback } from 'react';
import { useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

interface UseCommentsAnimationProps {
  maxTranslateY: number;
}

export const useCommentsAnimation = ({ maxTranslateY }: UseCommentsAnimationProps) => {
  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const springConfig = {
    damping: 25,
    mass: 0.8,
    stiffness: 200,
    overshootClamping: false,
    restSpeedThreshold: 0.1,
    restDisplacementThreshold: 0.1,
  };

  const animateIn = useCallback(() => {
    'worklet';
    translateY.value = withSpring(maxTranslateY, springConfig);
    backdropOpacity.value = withTiming(1, { duration: 300 });
  }, [maxTranslateY, springConfig]);

  const animateOut = useCallback((onFinished?: () => void) => {
    'worklet';
    translateY.value = withSpring(0, springConfig, (finished) => {
      if (finished && onFinished) {
        runOnJS(onFinished)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [springConfig]);

  const snapToPosition = useCallback((position: number) => {
    'worklet';
    translateY.value = withSpring(position, springConfig);
  }, [springConfig]);

  return {
    translateY,
    backdropOpacity,
    animateIn,
    animateOut,
    snapToPosition,
  };
};