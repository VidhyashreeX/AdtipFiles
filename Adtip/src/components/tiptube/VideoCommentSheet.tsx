/**
 * VideoCommentSheet - Professional YouTube-style comment section
 * 
 * Features:
 * - Smooth slide-up animation from bottom
 * - Drag handle with gesture support
 * - Pagination for comments
 * - Like/reply functionality
 * - Post new comments
 * - Professional design with proper spacing
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
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Keyboard,
} from 'react-native';
import { X, Send, Heart, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { ProfileFastImage } from '../../utils/FastImageOptimizer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% of screen
const DRAG_THRESHOLD = 100; // Pixels to drag before closing

interface Comment {
  id: number;
  comment: string;
  createdBy: number;
  userName: string;
  userImage?: string;
  createdDate: string;
  likes: number;
  isLiked: boolean;
  replyCount?: number;
}

interface VideoCommentSheetProps {
  visible: boolean;
  onClose: () => void;
  videoId: number;
  onCommentAdded?: () => void;
}

const VideoCommentSheet: React.FC<VideoCommentSheetProps> = ({
  visible,
  onClose,
  videoId,
  onCommentAdded,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  // Animation refs
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(0);

  // Fetch comments from API
  const fetchComments = useCallback(async (pageNum: number = 0, refresh: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (loading) return;
    
    // Check if we should fetch more
    if (!refresh && !hasMore && pageNum > 0) return;
    
    try {
      setLoading(true);
      const limit = 20;
      
      const response = await ApiService.getCommentOfVideo(videoId, pageNum, limit);
      
      console.log('[VideoCommentSheet] Raw API response:', JSON.stringify(response, null, 2));
      
      // The API returns: { data: { status: 200, data: [...], total: '1' } }
      // So we need to access response.data.data for the actual comments array
      if (response?.data?.status === 200 && response.data.data) {
        const commentsArray = response.data.data;
        const totalCount = parseInt(response.data.total || '0', 10);
        
        console.log('[VideoCommentSheet] Processing comments:', {
          count: commentsArray.length,
          total: totalCount,
          pageNum,
          refresh
        });
        
        const newComments: Comment[] = commentsArray.map((comment: any) => ({
          id: comment.id,
          comment: comment.comment,
          createdBy: comment.createdby || comment.createdBy,
          userName: comment.userName || comment.username || 'Anonymous',
          userImage: comment.userImage || comment.user_image,
          createdDate: comment.createddate || comment.createdDate || new Date().toISOString(),
          likes: comment.likes || 0,
          isLiked: comment.isLiked || false,
          replyCount: comment.replyCount || 0,
        }));

        console.log('[VideoCommentSheet] Mapped comments:', newComments);

        if (refresh || pageNum === 0) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }

        setHasMore(commentsArray.length === limit);
        setTotalComments(totalCount);
      } else {
        console.warn('[VideoCommentSheet] Unexpected response structure:', response);
      }
    } catch (error) {
      console.error('[VideoCommentSheet] Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId]); // Only depend on videoId, not loading or hasMore

  // Load more comments (pagination)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    setPage(prevPage => {
      const nextPage = prevPage + 1;
      fetchComments(nextPage, false);
      return nextPage;
    });
  }, [loading, hasMore, fetchComments]);

  // Post new comment
  const handlePostComment = useCallback(async () => {
    if (!commentText.trim() || !user || posting) return;

    try {
      setPosting(true);
      
      console.log('[VideoCommentSheet] Posting comment:', {
        videoId,
        userId: user.id,
        comment: commentText.trim()
      });
      
      const response = await ApiService.saveVideoComment(
        videoId,
        user.id,
        commentText.trim(),
        0 // parentCommentId (0 for top-level comments)
      );
      
      console.log('[VideoCommentSheet] Comment posted successfully:', response);

      // Clear input
      setCommentText('');
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
      // Reset state and refresh comments from server to show the new comment
      setPage(0);
      setComments([]);
      setHasMore(true);
      
      // Small delay to ensure backend has processed the comment
      setTimeout(() => {
        fetchComments(0, true);
      }, 300);
      
      // Notify parent
      onCommentAdded?.();
    } catch (error) {
      console.error('[VideoCommentSheet] Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  }, [commentText, user, videoId, fetchComments, onCommentAdded, posting]);

  // Like/unlike comment
  const handleLikeComment = useCallback(async (commentId: number, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      // Optimistic update
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !currentlyLiked,
                likes: currentlyLiked ? comment.likes - 1 : comment.likes + 1,
              }
            : comment
        )
      );

      // API call
      await ApiService.saveVideoCommentLike(commentId, user.id);
    } catch (error) {
      console.error('[VideoCommentSheet] Error liking comment:', error);
      
      // Revert on error
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: currentlyLiked,
                likes: currentlyLiked ? comment.likes + 1 : comment.likes - 1,
              }
            : comment
        )
      );
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

  // Animation effects
  useEffect(() => {
    console.log('[VideoCommentSheet] Visibility changed:', visible, 'videoId:', videoId);
    
    if (visible) {
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 120,
      }).start();
      
      // Reset state and load comments when opening
      console.log('[VideoCommentSheet] Opening sheet, resetting state and fetching comments');
      setPage(0);
      setComments([]);
      setHasMore(true);
      setTotalComments(0);
      setLoading(false); // Ensure loading is false before fetching
      
      // Fetch comments after state is reset
      setTimeout(() => {
        fetchComments(0, true);
      }, 100);
    } else {
      // Slide down
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      console.log('[VideoCommentSheet] Closing sheet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, videoId]); // Run when visibility or videoId changes

  // Pan responder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          dragY.current = gestureState.dy;
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          // Close sheet
          onClose();
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 100,
          }).start();
        }
        dragY.current = 0;
      },
    })
  ).current;

  // Render individual comment
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      <ProfileFastImage
        source={item.userImage}
        style={styles.avatar}
        size={40}
      />
      
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.userName, { color: colors.text.primary }]} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text.secondary }]}>
            {formatTimeAgo(item.createdDate)}
          </Text>
        </View>
        
        <Text style={[styles.commentText, { color: colors.text.primary }]}>
          {item.comment}
        </Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeComment(item.id, item.isLiked)}
          >
            <Heart
              size={16}
              color={item.isLiked ? '#FF0000' : colors.text.secondary}
              fill={item.isLiked ? '#FF0000' : 'none'}
            />
            {item.likes > 0 && (
              <Text style={[styles.actionText, { color: colors.text.secondary }]}>
                {item.likes}
              </Text>
            )}
          </TouchableOpacity>
          
          {(item.replyCount && item.replyCount > 0) && (
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={16} color={colors.text.secondary} />
              <Text style={[styles.actionText, { color: colors.text.secondary }]}>
                {item.replyCount}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <MessageCircle size={48} color={colors.text.secondary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No comments yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
            Be the first to share your thoughts!
          </Text>
        </>
      )}
    </View>
  );

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!loading || comments.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Comment Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.text.secondary }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Comments {totalComments > 0 && `(${totalComments})`}
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
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />

          {/* Input Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[styles.inputContainer, { 
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }]}>
              {user && (
                <ProfileFastImage
                  source={user.profile_image}
                  style={styles.userAvatar}
                  size={36}
                />
              )}
              
              <TextInput
                style={[styles.input, { 
                  color: colors.text.primary,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.text.secondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                editable={!posting}
              />
              
              <TouchableOpacity
                onPress={handlePostComment}
                disabled={!commentText.trim() || posting}
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  listContent: {
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  userName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default VideoCommentSheet;
