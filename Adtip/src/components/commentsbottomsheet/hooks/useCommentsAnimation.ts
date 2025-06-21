import { useCallback } from 'react';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface UseCommentsAnimationProps {
  onClose: () => void;
  maxTranslateY: number;
}

export const useCommentsAnimation = ({ 
  onClose, 
  maxTranslateY 
}: UseCommentsAnimationProps) => {
  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const springConfig = {
    damping: 30,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restSpeedThreshold: 0.01,
    restDisplacementThreshold: 0.01,
  };

  const animateIn = useCallback(() => {
    console.log('[CommentsAnimation] Animating in');
    translateY.value = 0;
    translateY.value = withSpring(maxTranslateY, springConfig);
    backdropOpacity.value = withTiming(0.5, { duration: 300 });
  }, [maxTranslateY, springConfig]);

  const animateOut = useCallback(() => {
    console.log('[CommentsAnimation] Animating out');
    translateY.value = withSpring(0, springConfig);
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [springConfig]);

  const snapToPosition = useCallback((position: number) => {
    console.log('[CommentsAnimation] Snapping to position:', position);
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