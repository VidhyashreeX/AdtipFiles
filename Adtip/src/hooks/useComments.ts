// src/hooks/useComments.ts
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/ApiService';
import { Comment } from '../types/Comment';

interface CommentParams {
  postId?: number;
  videoId?: number;
  userId: number;
}

interface AddCommentParams {
  postId?: number;
  videoId?: number;
  userId: number;
  content: string;
  parentId?: number;
}

interface LikeCommentParams {
  commentId: number;
  userId: number;
  isLiked: boolean;
}

interface DeleteCommentParams {
  commentId: number;
  userId: number;
}

// Deduplicate comments based on their ID to handle duplicate API responses
const deduplicateComments = (comments: any[]): any[] => {
  if (!Array.isArray(comments) || comments.length === 0) {
    return comments;
  }

  const seenIds = new Map<number, any>();
  const deduplicatedComments: any[] = [];

  for (const comment of comments) {
    const commentId = comment.id || comment.comment_id;

    // Only process comments with valid IDs
    if (commentId && typeof commentId === 'number' && !seenIds.has(commentId)) {
      seenIds.set(commentId, comment);
      deduplicatedComments.push(comment);
    } else if (!commentId) {
      // Keep comments without IDs (shouldn't happen but safety first)
      console.warn('[useComments] Comment without valid ID found:', comment);
      deduplicatedComments.push(comment);
    }
  }

  console.log('[useComments] Deduplication stats:', {
    original: comments.length,
    deduplicated: deduplicatedComments.length,
    duplicatesRemoved: comments.length - deduplicatedComments.length,
  });

  return deduplicatedComments;
};

// Transform API response to our Comment interface
const transformComment = (apiComment: any): Comment => ({
  id: apiComment.id || apiComment.comment_id,
  post_id: apiComment.post_id,
  video_id: apiComment.video_id,
  user_id: apiComment.user_id || apiComment.commentator_id,
  user_name: apiComment.user_name || apiComment.commentator_name,
  user_profile_image: apiComment.user_profile_image || apiComment.commentator_image,
  content: apiComment.content || apiComment.comment,
  comment: apiComment.comment || apiComment.content,
  like_count: apiComment.like_count || apiComment.total_comment_like || 0,
  reply_count: apiComment.reply_count || 0,
  is_liked: Boolean(apiComment.is_liked),
  created_at: apiComment.created_at,
  parent_id: apiComment.parent_id || apiComment.parent_comment_id || null,
  replies: apiComment.replies ? apiComment.replies.map(transformComment) : undefined,
});

// Hook for fetching comments (both posts and videos)
export const useComments = ({ postId, videoId, userId }: CommentParams) => {
  const queryKey = postId ? ['comments', 'post', postId] : ['comments', 'video', videoId];
  
  return useInfiniteQuery({
    queryKey: [...queryKey, userId],
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      
      let response;
      if (postId) {
        // Fetch post comments
        response = await ApiService.get(`/api/posts/${postId}/comments?page=${page}&limit=20`);
      } else if (videoId) {
        // Fetch video comments
        response = await ApiService.getCommentsOfVideos(userId, videoId);
      } else {
        throw new Error('Either postId or videoId must be provided');
      }

      // Transform the response with deduplication for video comments
      let comments: Comment[] = [];
      if (Array.isArray(response.data)) {
        if (videoId) {
          // Apply deduplication for video comments to handle duplicate API responses
          const deduplicatedData = deduplicateComments(response.data);
          comments = deduplicatedData.map(transformComment);
        } else {
          // For post comments, use existing logic (no deduplication needed)
          comments = response.data.map(transformComment);
        }
      }

      return {
        data: comments,
        page,
        hasMore: comments.length === 20,
        total: response.total || comments.length,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId && (!!postId || !!videoId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching comment count
export const useCommentCount = ({ postId, videoId }: { postId?: number; videoId?: number }) => {
  const queryKey = postId ? ['commentCount', 'post', postId] : ['commentCount', 'video', videoId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      let response;
      if (postId) {
        response = await ApiService.get(`/api/posts/${postId}/comments/count`);
      } else if (videoId) {
        response = await ApiService.getCommentOfVideo(videoId, 1, 1);
      } else {
        throw new Error('Either postId or videoId must be provided');
      }
      
      return response.total || 0;
    },
    enabled: !!(postId || videoId),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutation for adding comments
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, videoId, userId, content, parentId }: AddCommentParams) => {
      let response;
      
      if (postId) {
        // Add post comment
        response = await ApiService.post('/api/save-user-post-comment', {
          postId,
          userId,
          comment: content,
          parentId: parentId || null,
        });
      } else if (videoId) {
        // Add video comment
        response = await ApiService.saveVideoComment(videoId, userId, content, parentId);
      } else {
        throw new Error('Either postId or videoId must be provided');
      }

      // Handle response based on whether it's a post or video comment
      let commentData;
      if (videoId && response.message === "Comment Added" && Array.isArray(response.data)) {
        // Video comment response format
        commentData = response.data[0];
      } else {
        // Post comment response format or fallback
        commentData = response.data;
      }

      return {
        ...response,
        newComment: {
          id: commentData?.id || Date.now(),
          post_id: postId,
          video_id: videoId,
          user_id: userId,
          user_name: commentData?.user_name || 'You',
          content: content,
          comment: content,
          like_count: 0,
          reply_count: 0,
          is_liked: false,
          created_at: new Date().toISOString(),
          parent_id: parentId || null,
        } as Comment,
      };
    },
    onMutate: async ({ postId, videoId, userId, content, parentId }) => {
      // Cancel outgoing refetches
      const queryKey = postId ? ['comments', 'post', postId] : ['comments', 'video', videoId];
      await queryClient.cancelQueries({ queryKey: [...queryKey, userId] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData([...queryKey, userId]);

      // Create optimistic comment
      const optimisticComment: Comment = {
        id: Date.now(), // Temporary ID
        post_id: postId,
        video_id: videoId,
        user_id: userId,
        user_name: 'You',
        content: content,
        comment: content,
        like_count: 0,
        reply_count: 0,
        is_liked: false,
        created_at: new Date().toISOString(),
        parent_id: parentId || null,
      };

      // Optimistically update the cache
      queryClient.setQueryData([...queryKey, userId], (old: any) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page: any, pageIndex: number) => {
          if (pageIndex === 0) {
            // Add to first page if it's a top-level comment
            if (!parentId) {
              return {
                ...page,
                data: [optimisticComment, ...page.data],
              };
            }
            // For replies, find the parent and add to its replies
            return {
              ...page,
              data: page.data.map((comment: Comment) => 
                comment.id === parentId
                  ? { 
                      ...comment, 
                      replies: [...(comment.replies || []), optimisticComment],
                      reply_count: comment.reply_count + 1,
                    }
                  : comment
              ),
            };
          }
          return page;
        });

        return { ...old, pages: updatedPages };
      });

      // Update comment count
      const countKey = postId ? ['commentCount', 'post', postId] : ['commentCount', 'video', videoId];
      queryClient.setQueryData(countKey, (old: number = 0) => old + 1);

      return { previousComments, optimisticComment };
    },
    onSuccess: (data, variables) => {
      // Update the optimistic comment with real data
      const queryKey = variables.postId 
        ? ['comments', 'post', variables.postId] 
        : ['comments', 'video', variables.videoId];
      
      queryClient.setQueryData([...queryKey, variables.userId], (old: any) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((comment: Comment) => 
            comment.id === data.optimisticComment?.id
              ? { ...data.newComment, id: data.data?.id || comment.id }
              : comment
          ),
        }));

        return { ...old, pages: updatedPages };
      });
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousComments) {
        const queryKey = variables.postId 
          ? ['comments', 'post', variables.postId] 
          : ['comments', 'video', variables.videoId];
        queryClient.setQueryData([...queryKey, variables.userId], context.previousComments);
        
        // Rollback comment count
        const countKey = variables.postId 
          ? ['commentCount', 'post', variables.postId] 
          : ['commentCount', 'video', variables.videoId];
        queryClient.setQueryData(countKey, (old: number = 1) => Math.max(0, old - 1));
      }
    },
  });
};

// Mutation for liking comments
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, userId, isLiked }: LikeCommentParams) => {
      // Use the existing API service
      return await ApiService.post('/api/like-comment', {
        commentId,
        userId,
        is_liked: !isLiked,
      });
    },
    onMutate: async ({ commentId, isLiked }) => {
      // Update all comment queries that might contain this comment
      const queryCache = queryClient.getQueryCache();
      const commentQueries = queryCache.getAll().filter(query => 
        query.queryKey[0] === 'comments'
      );

      const previousData = new Map();

      commentQueries.forEach(query => {
        const data = query.state.data;
        if (data) {
          previousData.set(query.queryKey, data);
          
          queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;

            const updateCommentLike = (comments: Comment[]): Comment[] => {
              return comments.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    is_liked: !isLiked,
                    like_count: isLiked ? Math.max(0, comment.like_count - 1) : comment.like_count + 1,
                  };
                }
                if (comment.replies) {
                  return { ...comment, replies: updateCommentLike(comment.replies) };
                }
                return comment;
              });
            };

            const updatedPages = old.pages.map((page: any) => ({
              ...page,
              data: updateCommentLike(page.data),
            }));

            return { ...old, pages: updatedPages };
          });
        }
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback all optimistic updates
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// Mutation for deleting comments
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, userId }: DeleteCommentParams) => {
      return await ApiService.post('/api/delete-comment', { commentId, userId });
    },
    onMutate: async ({ commentId }) => {
      // Update all comment queries
      const queryCache = queryClient.getQueryCache();
      const commentQueries = queryCache.getAll().filter(query => 
        query.queryKey[0] === 'comments'
      );

      const previousData = new Map();

      commentQueries.forEach(query => {
        const data = query.state.data;
        if (data) {
          previousData.set(query.queryKey, data);
          
          queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;

            const removeComment = (comments: Comment[]): Comment[] => {
              return comments.filter(comment => comment.id !== commentId).map(comment => ({
                ...comment,
                replies: comment.replies ? removeComment(comment.replies) : undefined,
              }));
            };

            const updatedPages = old.pages.map((page: any) => ({
              ...page,
              data: removeComment(page.data),
            }));

            return { ...old, pages: updatedPages };
          });
        }
      });

      // Update comment counts
      const countQueries = queryCache.getAll().filter(query => 
        query.queryKey[0] === 'commentCount'
      );
      
      countQueries.forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: number = 1) => Math.max(0, old - 1));
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};
