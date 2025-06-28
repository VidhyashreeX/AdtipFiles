import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  useAnimatedReaction,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import CommentsHeader from './CommentsHeader';
import CommentsScrollArea, { CommentsScrollAreaRef } from './CommentsScrollArea';
import CommentsInputArea, { CommentsInputAreaRef } from './CommentsInputArea';
import { useEnhancedCommentsAnimation } from './hooks/useEnhancedCommentsAnimation';
import { useEnhancedKeyboardHandler } from './hooks/useEnhancedKeyboardHandler';
import { useCommentsData } from './hooks/useCommentsData';
import { useAuth } from '../../contexts/AuthContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 60;
const INPUT_AREA_MIN_HEIGHT = 80;
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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isClosing = useSharedValue(false);
  const [panEnabled, setPanEnabled] = useState(true);

  const {
    comments,
    loading,
    refreshing,
    hasMore,
    commentCount,
    error,
    replyingTo,
    addComment,
    addReply,
    loadMore,
    refresh,
    likeComment,
    deleteComment,
    reportComment,
    replyToComment,
    cancelReply,
  } = useCommentsData(postId, initialCommentCount);

  const {
    keyboardHeight,
    isKeyboardVisible,
    dismissKeyboard,
  } = useEnhancedKeyboardHandler();

  const {
    translateY,
    context,
    backdropOpacity,
    animateIn,
    animateOut,
    handleDrag,
  } = useEnhancedCommentsAnimation({
    maxTranslateY: MAX_TRANSLATE_Y,
    keyboardHeight,
    isKeyboardVisible,
    onClose,
  });

  const scrollAreaRef = useRef<CommentsScrollAreaRef>(null);
  const inputAreaRef = useRef<CommentsInputAreaRef>(null);
  const scrollY = useSharedValue(0);
  const isAtTop = useSharedValue(true);

  // Create a named panGesture with a reference
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only handle downward drags, and only when at the top
      if (isAtTop.value && event.translationY > 0) {
        handleDrag(event.translationY);
      }
    })
    .onEnd((event) => {
      if (isAtTop.value && event.translationY > 0) {
        handleDrag(event.translationY, event.velocityY);
      }
    })
    .enabled(panEnabled); // This is crucial - we can disable the pan gesture when needed

  useAnimatedReaction(
    () => scrollY.value,
    (scrolledY) => {
      isAtTop.value = scrolledY <= 0;
      // This is important - enable pan gesture only when at top
      runOnJS(setPanEnabled)(scrolledY <= 0);
    },
    [scrollY]
  );

  const contentHeight = useSharedValue(SCREEN_HEIGHT);

  useAnimatedReaction(
    () => {
      return SCREEN_HEIGHT - HEADER_HEIGHT - INPUT_AREA_MIN_HEIGHT - keyboardHeight.value;
    },
    (newHeight) => {
      contentHeight.value = withTiming(newHeight, { duration: 100 });
    },
    [keyboardHeight]
  );

  const handleClose = useCallback(() => {
    if (isClosing.value) return;
    isClosing.value = true;
    dismissKeyboard();
    animateOut();
  }, [animateOut, isClosing, dismissKeyboard]);

  const handleCommentSubmit = useCallback(async (text: string) => {
    try {
      if (replyingTo) {
        await addReply(text, replyingTo.id);
      } else {
        await addComment(text);
      }
      inputAreaRef.current?.clear();
      setTimeout(() => {
        scrollAreaRef.current?.scrollToBottom();
      }, 300);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [addComment, addReply, replyingTo]);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollAreaRef.current?.scrollToBottom();
    }, 300);
  }, []);

  const handleReply = useCallback((commentId: number, username: string) => {
    replyToComment(commentId, username);
    inputAreaRef.current?.focus();
  }, [replyToComment]);

  useEffect(() => {
    if (visible) {
      isClosing.value = false;
      StatusBar.setBarStyle('light-content', true);
      animateIn();
    }
  }, [visible, animateIn, isClosing]);

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAreaStyle = useAnimatedStyle(() => ({
    height: contentHeight.value,
  }));

  if (!visible) return null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.bottomSheet,
            { backgroundColor: colors.surface },
            bottomSheetStyle,
          ]}
        >
          <CommentsHeader
            onClose={handleClose}
            commentCount={commentCount}
          />
          <Animated.View style={[styles.contentArea, contentAreaStyle]}>
            <CommentsScrollArea
              ref={scrollAreaRef}
              scrollY={scrollY}
              comments={comments}
              onLike={likeComment}
              onReply={handleReply}
              onDelete={deleteComment}
              onReport={reportComment}
              currentUserId={user?.id ? Number(user.id) : undefined}
              loading={loading}
              refreshing={refreshing}
              onRefresh={refresh}
              hasMore={hasMore}
              onLoadMore={loadMore}
              error={error}
            />
          </Animated.View>
          <CommentsInputArea
            ref={inputAreaRef}
            postId={postId}
            onSubmit={handleCommentSubmit}
            onFocus={handleInputFocus}
            replyTo={replyingTo}
            onCancelReply={cancelReply}
          />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
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
    zIndex: 2,
  },
  contentArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default CommentsBottomSheet;