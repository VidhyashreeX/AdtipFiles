import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import CommentsContent from './CommentsContent';
import CommentsHeader from './CommentsHeader';
import { useCommentsAnimation } from './hooks/useCommentsAnimation';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP_OFFSET = Platform.OS === 'ios' ? 100 : 80;
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + TOP_OFFSET;

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
  const isClosing = useSharedValue(false);

  const {
    translateY,
    backdropOpacity,
    animateIn,
    animateOut,
    snapToPosition,
  } = useCommentsAnimation({
    maxTranslateY: MAX_TRANSLATE_Y,
  });

  const handleClose = useCallback(() => {
    if (isClosing.value) return;
    isClosing.value = true;
    Keyboard.dismiss();
    // Animate out, and only call onClose when the animation is finished.
    // This prevents the component from unmounting mid-animation, fixing the lag.
    animateOut(() => {
      onClose();
    });
  }, [animateOut, onClose, isClosing]);

  useEffect(() => {
    if (visible) {
      isClosing.value = false;
      StatusBar.setBarStyle('light-content', true);
      animateIn();
    }
  }, [visible, animateIn, isClosing]);

  // Create the pan gesture using Gesture.Pan()
  const headerPanGesture = Gesture.Pan()
    .onStart(() => {
      // No-op
    })
    .onUpdate((event) => {
      // Only allow dragging down to close when pan is enabled
      if (event.translationY > 0) {
        translateY.value = MAX_TRANSLATE_Y + event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 150 || event.velocityY > 800;
      if (shouldClose) {
        runOnJS(handleClose)();
      } else {
        runOnJS(snapToPosition)(MAX_TRANSLATE_Y);
      }
    });

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(translateY.value < 0 ? 1 : 0, { duration: 300 }),
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSheet,
          { backgroundColor: colors.surface },
          bottomSheetStyle,
        ]}
      >
        {/* Only apply the pan gesture to the header */}
        <GestureDetector gesture={headerPanGesture}>
          <View>
            <CommentsHeader
              onClose={handleClose}
              commentCount={initialCommentCount}
            />
          </View>
        </GestureDetector>

        <CommentsContent
          postId={postId}
          initialCommentCount={initialCommentCount}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  bottomSheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 25,
    flexDirection: 'column',
    zIndex: 1000,
  },
});

export default CommentsBottomSheet;