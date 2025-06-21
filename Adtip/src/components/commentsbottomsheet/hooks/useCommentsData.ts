import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../../services/ApiService';
import { useAuth } from '../../../contexts/AuthContext';
import { Comment } from '../CommentItem';
import {
  GetCommentsRequest,
  GetCommentsResponse,
  SaveCommentRequest,
  SaveCommentResponse,
  LikeCommentRequest,
  DeleteCommentRequest,
  ReportCommentRequest,
} from '../../../types/api';

interface UseCommentsDataReturn {
  comments: Comment[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  commentCount: number;
  error: string | null;
  replyingTo: { id: number; username: string } | null;
  addComment: (text: string) => Promise<void>;
  addReply: (text: string, parentId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  likeComment: (commentId: number) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  reportComment: (commentId: number, reason: string) => Promise<void>;
  replyToComment: (commentId: number, username: string) => void;
  cancelReply: () => void;
}

export const useCommentsData = (
  postId: number,
  initialCommentCount: number = 0
): UseCommentsDataReturn => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch comments from API
  const fetchComments = useCallback(async (
    page: number = 1,
    isRefresh: boolean = false,
    isLoadMore: boolean = false
  ): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isLoadMore) {
        setLoading(true);
      }

      setError(null);

      const requestData: GetCommentsRequest = {
        postId: postId,
        userId: Number(user.id),
        page: page,
        limit: 20,
      };

      console.log('[useCommentsData] Fetching comments:', requestData);

      const response: GetCommentsResponse = await ApiService.getPostComments(requestData);

      console.log('[useCommentsData] Received comments response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        pagination: response.pagination
      });

      if (response.success && response.data) {
        const newComments = response.data;
        
        if (isRefresh || page === 1) {
          setComments(newComments);
          setCurrentPage(1);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }

        if (response.pagination) {
          setHasMore(page < response.pagination.total_pages);
          setCommentCount(response.pagination.total_count);
          setCurrentPage(page);
        } else {
          setHasMore(newComments.length === 20); // Assuming 20 per page
        }

        console.log('[useCommentsData] Comments loaded successfully:', {
          count: newComments.length,
          totalCount: response.pagination?.total_count || newComments.length,
          hasMore: page < (response.pagination?.total_pages || 1),
        });
      } else {
        throw new Error(response.message || 'Failed to fetch comments');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useCommentsData] Error fetching comments:', err);
        setError(err.message || 'Failed to load comments');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, user?.id]);

  // Add comment
  const addComment = useCallback(async (text: string): Promise<void> => {
    try {
      if (!user?.id || !text.trim()) return;

      const requestData: SaveCommentRequest = {
        postId: postId,
        userId: Number(user.id),
        content: text.trim(),
        parentId: replyingTo?.id || null,
      };

      console.log('[useCommentsData] Adding comment:', requestData);

      const response: SaveCommentResponse = await ApiService.saveComment(requestData);

      if (response.success && response.data) {
        const newComment: Comment = {
          id: response.data.id,
          post_id: response.data.post_id,
          user_id: response.data.user_id,
          user_name: response.data.user_name,
          user_profile_image: response.data.user_profile_image,
          content: response.data.content,
          like_count: response.data.like_count,
          reply_count: response.data.reply_count,
          is_liked: response.data.is_liked,
          created_at: response.data.created_at,
          parent_id: response.data.parent_id,
        };

        if (replyingTo) {
          // Add reply to existing comment
          setComments(prev =>
            prev.map(comment =>
              comment.id === replyingTo.id
                ? {
                    ...comment,
                    reply_count: comment.reply_count + 1,
                    replies: [...(comment.replies || []), newComment]
                  }
                : comment
            )
          );
          setReplyingTo(null);
        } else {
          // Add new comment to the top
          setComments(prev => [newComment, ...prev]);
          setCommentCount(prev => prev + 1);
        }

        console.log('[useCommentsData] Comment added successfully');
      } else {
        throw new Error(response.message || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('[useCommentsData] Error adding comment:', err);
      Alert.alert('Error', err.message || 'Failed to add comment');
      throw err;
    }
  }, [postId, user?.id, replyingTo]);

  // Add reply (alias for addComment with reply context)
  const addReply = useCallback(async (text: string, parentId: number): Promise<void> => {
    const parentComment = comments.find(c => c.id === parentId);
    if (parentComment) {
      setReplyingTo({ id: parentId, username: parentComment.user_name });
      await addComment(text);
    }
  }, [comments, addComment]);

  // Load more comments
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    await fetchComments(currentPage + 1, false, true);
  }, [hasMore, loading, currentPage, fetchComments]);

  // Refresh comments
  const refresh = useCallback(async (): Promise<void> => {
    await fetchComments(1, true, false);
  }, [fetchComments]);

  // Like/unlike comment
  const likeComment = useCallback(async (commentId: number): Promise<void> => {
    try {
      if (!user?.id) return;

      // Find the comment to determine current like status
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const newLikeStatus = !comment.is_liked;

      // Optimistic update
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                is_liked: newLikeStatus,
                like_count: newLikeStatus 
                  ? c.like_count + 1 
                  : c.like_count - 1
              }
            : c
        )
      );

      const requestData: LikeCommentRequest = {
        userId: Number(user.id),
        commentId: commentId,
        is_liked: newLikeStatus,
      };

      console.log('[useCommentsData] Liking comment:', requestData);

      const response = await ApiService.likeComment(requestData);

      if (!response.success) {
        // Revert optimistic update on failure
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? {
                  ...c,
                  is_liked: !newLikeStatus,
                  like_count: !newLikeStatus 
                    ? c.like_count + 1 
                    : c.like_count - 1
                }
              : c
          )
        );
        throw new Error(response.message || 'Failed to like comment');
      }

      console.log('[useCommentsData] Comment liked successfully');
    } catch (err: any) {
      console.error('[useCommentsData] Error liking comment:', err);
      // Revert optimistic update on error
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                is_liked: !c.is_liked,
                like_count: !c.is_liked 
                  ? c.like_count + 1 
                  : c.like_count - 1
              }
            : c
        )
      );
    }
  }, [user?.id, comments]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: number): Promise<void> => {
    try {
      if (!user?.id) return;

      const requestData: DeleteCommentRequest = {
        userId: Number(user.id),
        commentId: commentId,
      };

      console.log('[useCommentsData] Deleting comment:', requestData);

      const response = await ApiService.deleteComment(requestData);

      if (response.success) {
        // Remove comment from state
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentCount(prev => prev - 1);
        console.log('[useCommentsData] Comment deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (err: any) {
      console.error('[useCommentsData] Error deleting comment:', err);
      Alert.alert('Error', err.message || 'Failed to delete comment');
    }
  }, [user?.id]);

  // Report comment
  const reportComment = useCallback(async (commentId: number, reason: string): Promise<void> => {
    try {
      if (!user?.id) return;

      const requestData: ReportCommentRequest = {
        userId: Number(user.id),
        commentId: commentId,
        reason: reason,
      };

      console.log('[useCommentsData] Reporting comment:', requestData);

      const response = await ApiService.reportComment(requestData);

      if (response.success) {
        Alert.alert('Success', 'Comment reported successfully');
        console.log('[useCommentsData] Comment reported successfully');
      } else {
        throw new Error(response.message || 'Failed to report comment');
      }
    } catch (err: any) {
      console.error('[useCommentsData] Error reporting comment:', err);
      Alert.alert('Error', err.message || 'Failed to report comment');
    }
  }, [user?.id]);

  // Reply to comment
  const replyToComment = useCallback((commentId: number, username: string): void => {
    setReplyingTo({ id: commentId, username });
  }, []);

  // Cancel reply
  const cancelReply = useCallback((): void => {
    setReplyingTo(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (postId && user?.id) {
      fetchComments(1);
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchComments, postId, user?.id]);

  return {
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
  };
};