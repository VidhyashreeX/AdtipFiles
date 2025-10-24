/**
 * CommentBottomSheet - YouTube-style sliding comment panel
 * Slides up from bottom showing comments for a video
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { ProfileFastImage } from '../../utils/FastImageOptimizer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMMENT_PANEL_HEIGHT = SCREEN_HEIGHT * 0.75; // Slide up to 75% to show video at top

interface Comment {
  id: number;
  comment: string;
  createdBy: number;
  userName: string;
  userImage?: string;
  createdDate: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface CommentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  videoId: number;
  commentCount: number;
  onCommentAdded?: () => void;
}

const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  visible,
  onClose,
  videoId,
  commentCount,
  onCommentAdded,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Fetch comments
  const fetchComments = useCallback(async (pageNum: number = 0) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const limit = 20;
      const response = await ApiService.getCommentOfVideo(videoId, pageNum, limit);
      
      if (response.status === 200 && response.data) {
        const newComments = response.data.map((comment: any) => ({
          id: comment.id,
          comment: comment.comment,
          createdBy: comment.createdby || comment.createdBy,
          userName: comment.userName || comment.username || 'Anonymous',
          userImage: comment.userImage || comment.user_image,
          createdDate: comment.createddate || comment.createdDate,
          likes: comment.likes || 0,
          isLiked: comment.isLiked || false,
        }));

        if (pageNum === 0) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }

        setHasMore(newComments.length === limit);
      }
    } catch (error) {
      console.error('[CommentSheet] Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId, loading]);

  // Load more comments
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  }, [page, loading, hasMore, fetchComments]);

  // Post comment
  const handlePostComment = useCallback(async () => {
    if (!commentText.trim() || !user) return;

    try {
      setPosting(true);
      await ApiService.saveVideoComment(
        videoId,
        user.id,
        commentText.trim(),
        0 // parentCommentId
      );

      setCommentText('');
      setPage(0);
      fetchComments(0);
      onCommentAdded?.();
    } catch (error) {
      console.error('[CommentSheet] Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  }, [commentText, user, videoId, fetchComments, onCommentAdded]);

  // Like comment
  const handleLikeComment = useCallback(async (commentId: number) => {
    if (!user) return;

    try {
      await ApiService.saveVideoCommentLike(commentId, user.id);
      
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              }
            : comment
        )
      );
    } catch (error) {
      console.error('[CommentSheet] Error liking comment:', error);
    }
  }, [user]);

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  // Animations
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
      fetchComments(0);
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Pan responder for drag to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Render comment item
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <ProfileFastImage
        source={item.userImage}
        style={styles.commentAvatar}
        size={36}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUser, { color: colors.text.primary }]}>
            {item.userName}
          </Text>
          <Text style={[styles.commentTime, { color: colors.text.secondary }]}>
            {formatTimeAgo(item.createdDate)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text.primary }]}>
          {item.comment}
        </Text>
        <TouchableOpacity
          onPress={() => handleLikeComment(item.id)}
          style={styles.commentLikeButton}
        >
          <Heart
            size={16}
            color={item.isLiked ? '#FF0000' : colors.text.secondary}
            fill={item.isLiked ? '#FF0000' : 'none'}
          />
          {item.likes > 0 && (
            <Text style={[styles.commentLikes, { color: colors.text.secondary }]}>
              {item.likes}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.background, transform: [{ translateY }] },
          ]}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Comments {commentCount > 0 && `(${commentCount})`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.commentsList}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              loading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              loading && comments.length > 0 ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              ) : null
            }
          />

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
              <ProfileFastImage
                source={user?.profile_image}
                style={styles.userAvatar}
                size={32}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.text.secondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handlePostComment}
                disabled={!commentText.trim() || posting}
                style={[
                  styles.sendButton,
                  (!commentText.trim() || posting) && styles.sendButtonDisabled,
                ]}
              >
                {posting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    height: COMMENT_PANEL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 12,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  commentLikes: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: 16,
  },
});

export default CommentBottomSheet;
