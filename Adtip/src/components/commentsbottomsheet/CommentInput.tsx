import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommentInputProps {
  postId: number;
  onSubmit: (text: string) => Promise<void>;
  onFocus?: () => void;
  replyTo?: { id: number; username: string } | null;
  onCancelReply?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  onSubmit,
  onFocus,
  replyTo,
  onCancelReply,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const inputHeight = useSharedValue(40);
  const sendButtonScale = useSharedValue(0);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
      inputRef.current?.blur();
      
      // Animate send button out
      sendButtonScale.value = withSpring(0);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, onSubmit]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
    
    // Animate input expansion
    const newHeight = Math.min(text.split('\n').length * 20 + 20, 120);
    inputHeight.value = withTiming(newHeight);
    if (text.trim()) {
      sendButtonScale.value = withSpring(1);
    }
  }, [onFocus, text]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    inputHeight.value = withTiming(40);
    if (!text.trim()) {
      sendButtonScale.value = withSpring(0);
    }
  }, [text]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    
    // Auto-expand input based on content
    const lines = newText.split('\n').length;
    const newHeight = Math.min(Math.max(lines * 20 + 20, 40), 120);
    inputHeight.value = withTiming(newHeight);
    
    // Show/hide send button
    if (newText.trim() && sendButtonScale.value === 0) {
      sendButtonScale.value = withSpring(1);
    } else if (!newText.trim() && sendButtonScale.value === 1) {
      sendButtonScale.value = withSpring(0);
    }
  }, []);

  // Animated styles
  const inputContainerStyle = useAnimatedStyle(() => ({
    minHeight: inputHeight.value,
  }));

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: sendButtonScale.value,
  }));

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        // Don't add insets.bottom here - let parent handle it
      }
    ]}>
      {replyTo && (
        <View style={[styles.replyIndicator, { backgroundColor: colors.background }]}>
          <Text style={[styles.replyText, { color: colors.text.secondary }]}>
            Replying to @{replyTo.username}
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReply}>
            <Icon name="x" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <Animated.View style={[styles.inputWrapper, inputContainerStyle]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                color: colors.text.primary,
                backgroundColor: colors.background,
                borderColor: isFocused ? colors.primary : colors.border,
              },
            ]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.text.tertiary}
            value={text}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="top"
          />
        </Animated.View>

        <Animated.View style={[styles.sendButton, sendButtonStyle]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            style={[
              styles.sendButtonTouchable,
              { backgroundColor: colors.primary },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E1E1E1',
    paddingBottom: 8, // Small fixed padding instead of safe area
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  replyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cancelReply: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  textInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
    maxHeight: 120,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonTouchable: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentInput;