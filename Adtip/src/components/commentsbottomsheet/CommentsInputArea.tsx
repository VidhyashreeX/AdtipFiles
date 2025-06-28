import React, { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import CommentInput, { CommentInputRef } from './CommentInput';

interface CommentsInputAreaProps {
  postId: number;
  onSubmit: (text: string) => Promise<void>;
  onFocus?: () => void;
  replyTo?: { id: number; username: string } | null;
  onCancelReply?: () => void;
}

export interface CommentsInputAreaRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

const CommentsInputArea = forwardRef<CommentsInputAreaRef, CommentsInputAreaProps>(({
  postId,
  onSubmit,
  onFocus,
  replyTo,
  onCancelReply,
}, ref) => {
  const { colors } = useTheme();
  const inputRef = useRef<CommentInputRef>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
    clear: () => {
      inputRef.current?.clear();
    },
  }));

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      }
    ]}>
      <CommentInput
        ref={inputRef}
        postId={postId}
        onSubmit={onSubmit}
        onFocus={onFocus}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    paddingTop: 8,
  },
});

CommentsInputArea.displayName = 'CommentsInputArea';

export default CommentsInputArea;