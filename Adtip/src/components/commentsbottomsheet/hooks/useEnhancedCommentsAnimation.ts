import { useCallback } from 'react';
import { useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

interface UseEnhancedCommentsAnimationProps {
  maxTranslateY: number;
  keyboardHeight: any;
  isKeyboardVisible: any;
  onClose: () => void;
}

export const useEnhancedCommentsAnimation = ({ 
  maxTranslateY, 
  keyboardHeight, 
  isKeyboardVisible,
  onClose
}: UseEnhancedCommentsAnimationProps) => {
  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

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

  const animateOut = useCallback(() => {
    'worklet';
    translateY.value = withSpring(0, springConfig, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [springConfig, onClose]);

  const handleDrag = useCallback((translationY: number, velocityY?: number) => {
    'worklet';
    const newTranslateY = context.value.y + translationY;
    
    // Prevent dragging up past the maxTranslateY
    translateY.value = Math.max(newTranslateY, maxTranslateY);

    if (velocityY !== undefined) { // onEnd
      const shouldClose = newTranslateY > maxTranslateY * 0.6 || velocityY > 500;
      if (shouldClose) {
        animateOut();
      } else {
        translateY.value = withSpring(maxTranslateY, springConfig);
      }
    }
  }, [maxTranslateY, springConfig, animateOut]);

  return {
    translateY,
    context,
    backdropOpacity,
    animateIn,
    animateOut,
    handleDrag,
  };
};