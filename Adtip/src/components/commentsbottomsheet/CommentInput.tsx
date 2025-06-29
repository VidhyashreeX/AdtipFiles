import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
  Image,
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
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../constants/api';

interface CommentInputProps {
  postId: number;
  onSubmit: (text: string) => Promise<void>;
  onFocus?: () => void;
  onBlur?: () => void;
  replyTo?: { id: number; username: string } | null;
  onCancelReply?: () => void;
}

export interface CommentInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getText: () => string;
  setText: (text: string) => void;
}

const CommentInput = forwardRef<CommentInputRef, CommentInputProps>(({
  postId,
  onSubmit,
  onFocus,
  onBlur,
  replyTo,
  onCancelReply,
}, ref) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputHeight = useSharedValue(40);
  const sendButtonScale = useSharedValue(0);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
    clear: () => {
      setText('');
      sendButtonScale.value = withSpring(0);
    },
    getText: () => text,
    setText: (newText: string) => {
      setText(newText);
      if (newText.trim() && sendButtonScale.value === 0) {
        sendButtonScale.value = withSpring(1);
      } else if (!newText.trim() && sendButtonScale.value === 1) {
        sendButtonScale.value = withSpring(0);
      }
    },
  }));

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onSubmit(text.trim());
      setText('');
      sendButtonScale.value = withSpring(0);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, onSubmit, sendButtonScale]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    if (newText.trim() && sendButtonScale.value === 0) {
      sendButtonScale.value = withSpring(1);
    } else if (!newText.trim() && sendButtonScale.value === 1) {
      sendButtonScale.value = withSpring(0);
    }
  }, [sendButtonScale]);

  const inputContainerStyle = useAnimatedStyle(() => ({
    minHeight: inputHeight.value,
  }));

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: sendButtonScale.value,
  }));

  const getProfileImage = () => {
    if (!user?.profile_image || user.profile_image === 'null') {
      return require('../../assets/images/default-avatar.png');
    }
    
    if (user.profile_image.startsWith('http')) {
      return { uri: user.profile_image };
    }
    
    return { uri: `${API_BASE_URL}${user.profile_image}` };
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        paddingBottom: Math.max(insets.bottom, 8) 
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
      
      <View style={styles.inputRow}>
        <Image 
          source={getProfileImage()} 
          style={styles.avatar}
        />
        
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
            onContentSizeChange={(e) => {
              const newHeight = Math.max(40, Math.min(e.nativeEvent.contentSize.height, 120));
              inputHeight.value = withTiming(newHeight, { duration: 100 });
            }}
            multiline
            maxLength={500}
          />
        </Animated.View>
        
        <Animated.View style={[styles.sendButtonContainer, sendButtonStyle]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
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
});

CommentInput.displayName = 'CommentInput';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E1E1',
    width: '100%',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyText: {
    fontSize: 14,
  },
  cancelReply: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  textInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    borderWidth: 1,
    maxHeight: 120,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentInput;