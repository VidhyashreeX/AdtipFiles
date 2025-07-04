import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import CommentsList from './CommentsList';
import { Comment } from '../../types/Comment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  error: string | null;
  userId: number;
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  title?: string;
  commentCount?: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  comments,
  loading,
  refreshing,
  onRefresh,
  hasMore,
  onLoadMore,
  error,
  userId,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  title = "Comments",
  commentCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const [modalHeight] = useState(SCREEN_HEIGHT * 0.8);
  
  const translateY = useRef(new Animated.Value(modalHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: modalHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalHeight, translateY, backdropOpacity]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        onClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
      animationType="none"
    >
      <StatusBar 
        backgroundColor={isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)"} 
        barStyle={isDarkMode ? "light-content" : "light-content"} 
      />
      
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Modal Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              height: modalHeight,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {title} {commentCount > 0 && `(${commentCount})`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.content}>
            <CommentsList
              comments={comments}
              loading={loading}
              refreshing={refreshing}
              onRefresh={onRefresh}
              hasMore={hasMore}
              onLoadMore={onLoadMore}
              error={error}
              userId={userId}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
              onDeleteComment={onDeleteComment}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1B',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});

export default CommentsModal;
