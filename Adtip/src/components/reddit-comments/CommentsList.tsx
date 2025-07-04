import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
  Keyboard,
  Alert,
} from 'react-native';
import { X, ArrowUp } from 'lucide-react-native';
import CommentItem from './Comment';
import { Comment } from '../../types/Comment';

interface CommentsListProps {
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
}

const CommentsList: React.FC<CommentsListProps> = ({
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
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<TextInput>(null);

  const submitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      await onAddComment(newComment.trim(), replyTo?.id);
      setNewComment('');
      setReplyTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, replyTo, onAddComment]);

  const handleReply = useCallback((comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    }
  }, [onDeleteComment]);

  const handleLikeComment = useCallback(async (commentId: number) => {
    try {
      await onLikeComment(commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
    }
  }, [onLikeComment]);

  const renderCommentItem = useCallback(({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      userId={userId}
      onReply={handleReply}
      onDelete={handleDeleteComment}
      onLike={handleLikeComment}
    />
  ), [userId, handleReply, handleDeleteComment, handleLikeComment]);

  const renderFooter = useCallback(() => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0080ff" />
      </View>
    );
  }, [loading, refreshing]);

  const renderEmpty = useCallback(() => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0080ff" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No comments yet. Be the first to comment!
        </Text>
      </View>
    );
  }, [loading, refreshing, error]);

  return (
    <View style={styles.container}>
      {/* Comment input */}
      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Replying to <Text style={styles.username}>{replyTo.user_name || replyTo.commentator_name}</Text>
            </Text>
            <Pressable onPress={cancelReply}>
              <X size={16} color="gray" />
            </Pressable>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            multiline
            maxLength={500}
          />
          
          <Pressable 
            onPress={submitComment}
            disabled={submitting || !newComment.trim()}
            style={[
              styles.submitButton,
              (!newComment.trim() || submitting) && styles.disabledButton
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ArrowUp size={20} color="white" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Comments list */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCommentItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#787C7E',
  },
  username: {
    fontWeight: 'bold',
    color: '#1A1A1B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#FF4500',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#787C7E',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
});

export default CommentsList;
