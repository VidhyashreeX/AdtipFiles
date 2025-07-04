import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CommentsModal, Comment } from '../reddit-comments';
import ApiService from '../../services/ApiService';

interface PostWithCommentsProps {
  postId: number;
  userId: number;
  visible: boolean;
  onClose: () => void;
  initialCommentCount?: number;
}

const PostWithComments: React.FC<PostWithCommentsProps> = ({
  postId,
  userId,
  visible,
  onClose,
  initialCommentCount = 0,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [page, setPage] = useState(1);

  // Fetch comments
  const fetchComments = useCallback(async (isRefresh = false) => {
    try {
      const currentPage = isRefresh ? 1 : page;
      
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
      }

      // Use your existing API service - adjust the endpoint as needed
      const response = await ApiService.get(`/api/posts/${postId}/comments?page=${currentPage}&limit=20`);
      
      if (response && response.data) {
        const newComments = Array.isArray(response.data) ? response.data : [];
        
        if (isRefresh) {
          setComments(newComments);
          setPage(2);
        } else {
          setComments(prev => [...prev, ...newComments]);
          setPage(prev => prev + 1);
        }
        
        setHasMore(newComments.length === 20);
        setCommentCount(response.total || newComments.length);
      } else {
        setComments([]);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, page]);

  // Load initial comments when modal opens
  useEffect(() => {
    if (visible && comments.length === 0) {
      fetchComments(true);
    }
  }, [visible, fetchComments]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchComments(true);
  }, [fetchComments]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchComments(false);
    }
  }, [loading, hasMore, fetchComments]);

  // Add comment
  const handleAddComment = useCallback(async (content: string, parentId?: number) => {
    try {
      const requestData = {
        postId,
        userId,
        comment: content,
        parentId: parentId || null,
      };

      // Use your existing API service - adjust the endpoint as needed
      const response = await ApiService.post('/api/save-user-post-comment', requestData);
      
      if (response && response.status) {
        // Add the new comment to the list
        const newComment: Comment = {
          id: response.data?.id || Date.now(),
          post_id: postId,
          user_id: userId,
          user_name: response.data?.user_name || 'You',
          content: content,
          comment: content,
          like_count: 0,
          reply_count: 0,
          is_liked: false,
          created_at: new Date().toISOString(),
          parent_id: parentId || null,
        };

        if (parentId) {
          // It's a reply - update the parent comment
          setComments(prev => prev.map(comment => 
            comment.id === parentId 
              ? { ...comment, replies: [...(comment.replies || []), newComment] }
              : comment
          ));
        } else {
          // It's a top-level comment
          setComments(prev => [newComment, ...prev]);
          setCommentCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }, [postId, userId]);

  // Like comment
  const handleLikeComment = useCallback(async (commentId: number) => {
    try {
      // Find the comment to check current like status
      const findComment = (comments: Comment[]): Comment | null => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          if (comment.replies) {
            const found = findComment(comment.replies);
            if (found) return found;
          }
        }
        return null;
      };

      const comment = findComment(comments);
      if (!comment) return;

      const newIsLiked = !comment.is_liked;

      // Update UI immediately for better UX
      const updateCommentLike = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              is_liked: newIsLiked,
              like_count: newIsLiked ? c.like_count + 1 : Math.max(0, c.like_count - 1),
            };
          }
          if (c.replies) {
            return { ...c, replies: updateCommentLike(c.replies) };
          }
          return c;
        });
      };

      setComments(updateCommentLike);

      // Use your existing API service - adjust the endpoint as needed
      await ApiService.post('/api/like-comment', {
        commentId,
        userId,
        is_liked: newIsLiked,
      });
    } catch (error: any) {
      console.error('Error liking comment:', error);
      
      // Revert the optimistic update
      const revertCommentLike = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              is_liked: !c.is_liked,
              like_count: c.is_liked ? c.like_count + 1 : Math.max(0, c.like_count - 1),
            };
          }
          if (c.replies) {
            return { ...c, replies: revertCommentLike(c.replies) };
          }
          return c;
        });
      };

      setComments(revertCommentLike);
      throw new Error('Failed to like comment');
    }
  }, [comments, userId]);

  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      // Use your existing API service - adjust the endpoint as needed
      await ApiService.post('/api/delete-comment', { commentId, userId });

      // Remove comment from UI
      const removeComment = (comments: Comment[]): Comment[] => {
        return comments.filter(c => c.id !== commentId).map(c => ({
          ...c,
          replies: c.replies ? removeComment(c.replies) : undefined,
        }));
      };

      setComments(removeComment);
      setCommentCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }, [userId]);

  return (
    <CommentsModal
      visible={visible}
      onClose={onClose}
      comments={comments}
      loading={loading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      error={error}
      userId={userId}
      onAddComment={handleAddComment}
      onLikeComment={handleLikeComment}
      onDeleteComment={handleDeleteComment}
      title="Comments"
      commentCount={commentCount}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PostWithComments;
