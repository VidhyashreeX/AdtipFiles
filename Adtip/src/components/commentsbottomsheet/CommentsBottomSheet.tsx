import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import CommentsContent from './CommentsContent';
import CommentsHeader from './CommentsHeader';
import { useCommentsAnimation } from './hooks/useCommentsAnimation';
import { useKeyboardHandler } from './hooks/useKeyboardHandler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;

interface CommentsBottomSheetProps {
  visible: boolean;
  postId: number;
  onClose: () => void;
  initialCommentCount?: number;
}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  visible,
  postId,
  onClose,
  initialCommentCount = 0,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const panRef = useRef<PanGestureHandler>(null);
  
  // Animation hooks
  const {
    translateY,
    backdropOpacity,
    animateIn,
    animateOut,
    snapToPosition,
  } = useCommentsAnimation({
    onClose,
    maxTranslateY: MAX_TRANSLATE_Y,
  });

  const {
    keyboardHeight,
    isKeyboardVisible,
  } = useKeyboardHandler();

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content', true);
      animateIn();
    } else {
      StatusBar.setBarStyle('dark-content', true);
      animateOut();
    }
    
    return () => {
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('dark-content', true);
      }
    };
  }, [visible, animateIn, animateOut]);

  // Gesture handler for drag interactions
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      // Only allow dragging down to close
      if (event.translationY > 0) {
        const newTranslateY = context.startY + event.translationY;
        translateY.value = Math.max(newTranslateY, MAX_TRANSLATE_Y);
        
        // Update backdrop opacity based on position
        const progress = interpolate(
          translateY.value,
          [0, MAX_TRANSLATE_Y],
          [1, 0],
          Extrapolate.CLAMP
        );
        backdropOpacity.value = progress * 0.5;
      }
    },
    onEnd: (event) => {
      const shouldClose = 
        event.translationY > 150 || 
        event.velocityY > 800;
      
      if (shouldClose) {
        runOnJS(onClose)();
      } else {
        // Snap back to position
        runOnJS(snapToPosition)(MAX_TRANSLATE_Y);
      }
    },
  });

  // Animated styles
  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: translateY.value - (isKeyboardVisible.value ? keyboardHeight.value * 0.8 : 0)
        }
      ],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleBackdropPress = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Animated.View
            style={StyleSheet.absoluteFill}
            onTouchEnd={handleBackdropPress}
          />
        </Animated.View>

        {/* Bottom Sheet with Keyboard Avoiding */}
        <KeyboardAvoidingView
          style={StyleSheet.absoluteFill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <PanGestureHandler ref={panRef} onGestureEvent={gestureHandler}>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom,
                },
                bottomSheetStyle,
              ]}
            >
              <CommentsHeader 
                onClose={onClose} 
                commentCount={initialCommentCount}
              />
              <CommentsContent
                postId={postId}
                initialCommentCount={initialCommentCount}
                panRef={panRef}
              />
            </Animated.View>
          </PanGestureHandler>
        </KeyboardAvoidingView>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  bottomSheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
    flex: 1,
  },
});

export default CommentsBottomSheet;