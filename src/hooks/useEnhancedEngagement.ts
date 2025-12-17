// Enhanced Engagement Hooks
// Provides optimistic UI updates and error handling for engagement actions

import React, { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useEngagementStore } from '../stores/engagement.store';
import { useLikePost, useFollowUser } from './api';
import { toast } from 'sonner';

export interface UseEnhancedLikeOptions {
  postId: number;
  initialIsLiked?: boolean;
  initialLikeCount?: number;
  onSuccess?: (newIsLiked: boolean, newCount: number) => void;
  onError?: (error: Error) => void;
}

export interface UseEnhancedFollowOptions {
  userId: number;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  onSuccess?: (newIsFollowing: boolean, newCount: number) => void;
  onError?: (error: Error) => void;
}

export interface UseEnhancedShareOptions {
  postId: number;
  postTitle?: string;
  postUrl?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced like hook with optimistic updates and error handling
 */
export const useEnhancedLike = (options: UseEnhancedLikeOptions) => {
  const {
    postId,
    initialIsLiked = false,
    initialLikeCount = 0,
    onSuccess,
    onError,
  } = options;

  const {
    toggleLike,
    setLikeSuccess,
    setLikeError,
    initializePostState,
    isPostLiked,
    getPostLikeCount,
    isLikeLoading,
  } = useEngagementStore();

  const likePostMutation = useLikePost();

  // Initialize state if not already done
  React.useEffect(() => {
    if (!useEngagementStore.getState().postLikeCounts.has(postId)) {
      initializePostState(postId, initialIsLiked, initialLikeCount);
    }
  }, [postId, initialIsLiked, initialLikeCount, initializePostState]);

  const handleLike = useCallback(async () => {
    const currentIsLiked = isPostLiked(postId);
    const currentCount = getPostLikeCount(postId);

    try {
      // Optimistic update
      toggleLike(postId, currentIsLiked, currentCount);

      // API call
      const result = await likePostMutation.mutateAsync({
        postId,
        isLiked: currentIsLiked,
      });

      // Success - update with server response
      const newIsLiked = !currentIsLiked;
      const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      setLikeSuccess(postId, newIsLiked, newCount);
      
      onSuccess?.(newIsLiked, newCount);

    } catch (error) {
      console.error('[EnhancedLike] Error:', error);
      
      // Revert optimistic update
      setLikeError(postId, currentIsLiked, currentCount);
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Failed to update like';
      toast.error(`Failed to ${currentIsLiked ? 'unlike' : 'like'} post: ${errorMessage}`);
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    postId,
    isPostLiked,
    getPostLikeCount,
    toggleLike,
    setLikeSuccess,
    setLikeError,
    likePostMutation,
    onSuccess,
    onError,
  ]);

  return {
    isLiked: isPostLiked(postId),
    likeCount: getPostLikeCount(postId),
    isLoading: isLikeLoading(postId),
    handleLike,
  };
};

/**
 * Enhanced follow hook with optimistic updates and error handling
 */
export const useEnhancedFollow = (options: UseEnhancedFollowOptions) => {
  const {
    userId,
    initialIsFollowing = false,
    initialFollowerCount = 0,
    onSuccess,
    onError,
  } = options;

  const {
    toggleFollow,
    setFollowSuccess,
    setFollowError,
    initializeUserState,
    isUserFollowed,
    getUserFollowerCount,
    isFollowLoading,
  } = useEngagementStore();

  const followUserMutation = useFollowUser();

  // Initialize state if not already done
  React.useEffect(() => {
    if (!useEngagementStore.getState().userFollowerCounts.has(userId)) {
      initializeUserState(userId, initialIsFollowing, initialFollowerCount);
    }
  }, [userId, initialIsFollowing, initialFollowerCount, initializeUserState]);

  const handleFollow = useCallback(async () => {
    const currentIsFollowing = isUserFollowed(userId);
    const currentCount = getUserFollowerCount(userId);

    try {
      // Optimistic update
      toggleFollow(userId, currentIsFollowing, currentCount);

      // API call
      const action = currentIsFollowing ? 'unfollow' : 'follow';
      const result = await followUserMutation.mutateAsync({
        targetUserId: userId,
        action,
      });

      // Success - update with server response
      const newIsFollowing = !currentIsFollowing;
      const newCount = newIsFollowing ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      setFollowSuccess(userId, newIsFollowing, newCount);
      
      onSuccess?.(newIsFollowing, newCount);

    } catch (error) {
      console.error('[EnhancedFollow] Error:', error);
      
      // Revert optimistic update
      setFollowError(userId, currentIsFollowing, currentCount);
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Failed to update follow status';
      toast.error(`Failed to ${currentIsFollowing ? 'unfollow' : 'follow'} user: ${errorMessage}`);
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    userId,
    isUserFollowed,
    getUserFollowerCount,
    toggleFollow,
    setFollowSuccess,
    setFollowError,
    followUserMutation,
    onSuccess,
    onError,
  ]);

  return {
    isFollowing: isUserFollowed(userId),
    followerCount: getUserFollowerCount(userId),
    isLoading: isFollowLoading(userId),
    handleFollow,
  };
};

/**
 * Enhanced share hook with loading states and error handling
 */
export const useEnhancedShare = (options: UseEnhancedShareOptions) => {
  const {
    postId,
    postTitle = 'Check out this post',
    postUrl,
    onSuccess,
    onError,
  } = options;

  const { setShareLoading, isShareLoading } = useEngagementStore();

  const handleShare = useCallback(async () => {
    try {
      setShareLoading(postId, true);

      const shareData = {
        title: postTitle,
        text: postTitle,
        url: postUrl || `${window.location.origin}/post/${postId}`,
      };

      // Try native sharing first
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        onSuccess?.();
      } else {
        // Fallback to clipboard
        const shareText = `${postTitle}\n${shareData.url}`;
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          toast.success('Link copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast.success('Link copied to clipboard!');
        }
        
        onSuccess?.();
      }

    } catch (error) {
      console.error('[EnhancedShare] Error:', error);
      
      // Don't show error if user cancelled sharing
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage = 'Failed to share content';
        toast.error(errorMessage);
        onError?.(new Error(errorMessage));
      }
    } finally {
      setShareLoading(postId, false);
    }
  }, [postId, postTitle, postUrl, setShareLoading, onSuccess, onError]);

  return {
    isLoading: isShareLoading(postId),
    handleShare,
  };
};

/**
 * Batch initialize engagement states for multiple posts/users
 */
export const useBatchInitializeEngagement = () => {
  const { initializePostState, initializeUserState } = useEngagementStore();

  const initializePosts = useCallback((posts: Array<{
    id: number;
    is_liked?: boolean;
    likeCount?: number;
    like_count?: number;
  }>) => {
    posts.forEach(post => {
      const isLiked = post.is_liked || false;
      const likeCount = post.likeCount || post.like_count || 0;
      initializePostState(post.id, isLiked, likeCount);
    });
  }, [initializePostState]);

  const initializeUsers = useCallback((users: Array<{
    id: number;
    is_following?: boolean;
    followerCount?: number;
    follower_count?: number;
  }>) => {
    users.forEach(user => {
      const isFollowing = user.is_following || false;
      const followerCount = user.followerCount || user.follower_count || 0;
      initializeUserState(user.id, isFollowing, followerCount);
    });
  }, [initializeUserState]);

  return {
    initializePosts,
    initializeUsers,
  };
};