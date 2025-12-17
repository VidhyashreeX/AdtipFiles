// Enhanced Engagement Store
// Centralized state management for likes, follows, and shares with optimistic updates

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface EngagementState {
  // Like states
  likedPosts: Set<number>;
  postLikeCounts: Map<number, number>;
  likeLoadingStates: Set<number>;
  
  // Follow states
  followedUsers: Set<number>;
  userFollowerCounts: Map<number, number>;
  followLoadingStates: Set<number>;
  
  // Share states
  shareLoadingStates: Set<number>;
  
  // Actions
  toggleLike: (postId: number, currentIsLiked: boolean, currentCount: number) => void;
  setLikeSuccess: (postId: number, newIsLiked: boolean, newCount: number) => void;
  setLikeError: (postId: number, originalIsLiked: boolean, originalCount: number) => void;
  
  toggleFollow: (userId: number, currentIsFollowing: boolean, currentCount: number) => void;
  setFollowSuccess: (userId: number, newIsFollowing: boolean, newCount: number) => void;
  setFollowError: (userId: number, originalIsFollowing: boolean, originalCount: number) => void;
  
  setShareLoading: (postId: number, loading: boolean) => void;
  
  // Initialization
  initializePostState: (postId: number, isLiked: boolean, likeCount: number) => void;
  initializeUserState: (userId: number, isFollowing: boolean, followerCount: number) => void;
  
  // Getters
  isPostLiked: (postId: number) => boolean;
  getPostLikeCount: (postId: number) => number;
  isLikeLoading: (postId: number) => boolean;
  
  isUserFollowed: (userId: number) => boolean;
  getUserFollowerCount: (userId: number) => number;
  isFollowLoading: (userId: number) => boolean;
  
  isShareLoading: (postId: number) => boolean;
}

export const useEngagementStore = create<EngagementState>()(
  devtools(
    (set, get) => ({
      // Initial state
      likedPosts: new Set(),
      postLikeCounts: new Map(),
      likeLoadingStates: new Set(),
      
      followedUsers: new Set(),
      userFollowerCounts: new Map(),
      followLoadingStates: new Set(),
      
      shareLoadingStates: new Set(),

      // Like actions
      toggleLike: (postId: number, currentIsLiked: boolean, currentCount: number) => {
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          const newPostLikeCounts = new Map(state.postLikeCounts);
          const newLikeLoadingStates = new Set(state.likeLoadingStates);

          // Optimistic update
          if (currentIsLiked) {
            newLikedPosts.delete(postId);
            newPostLikeCounts.set(postId, Math.max(0, currentCount - 1));
          } else {
            newLikedPosts.add(postId);
            newPostLikeCounts.set(postId, currentCount + 1);
          }

          // Set loading state
          newLikeLoadingStates.add(postId);

          return {
            likedPosts: newLikedPosts,
            postLikeCounts: newPostLikeCounts,
            likeLoadingStates: newLikeLoadingStates,
          };
        });
      },

      setLikeSuccess: (postId: number, newIsLiked: boolean, newCount: number) => {
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          const newPostLikeCounts = new Map(state.postLikeCounts);
          const newLikeLoadingStates = new Set(state.likeLoadingStates);

          // Update with server response
          if (newIsLiked) {
            newLikedPosts.add(postId);
          } else {
            newLikedPosts.delete(postId);
          }
          newPostLikeCounts.set(postId, Math.max(0, newCount));

          // Clear loading state
          newLikeLoadingStates.delete(postId);

          return {
            likedPosts: newLikedPosts,
            postLikeCounts: newPostLikeCounts,
            likeLoadingStates: newLikeLoadingStates,
          };
        });
      },

      setLikeError: (postId: number, originalIsLiked: boolean, originalCount: number) => {
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          const newPostLikeCounts = new Map(state.postLikeCounts);
          const newLikeLoadingStates = new Set(state.likeLoadingStates);

          // Revert to original state
          if (originalIsLiked) {
            newLikedPosts.add(postId);
          } else {
            newLikedPosts.delete(postId);
          }
          newPostLikeCounts.set(postId, Math.max(0, originalCount));

          // Clear loading state
          newLikeLoadingStates.delete(postId);

          return {
            likedPosts: newLikedPosts,
            postLikeCounts: newPostLikeCounts,
            likeLoadingStates: newLikeLoadingStates,
          };
        });
      },

      // Follow actions
      toggleFollow: (userId: number, currentIsFollowing: boolean, currentCount: number) => {
        set((state) => {
          const newFollowedUsers = new Set(state.followedUsers);
          const newUserFollowerCounts = new Map(state.userFollowerCounts);
          const newFollowLoadingStates = new Set(state.followLoadingStates);

          // Optimistic update
          if (currentIsFollowing) {
            newFollowedUsers.delete(userId);
            newUserFollowerCounts.set(userId, Math.max(0, currentCount - 1));
          } else {
            newFollowedUsers.add(userId);
            newUserFollowerCounts.set(userId, currentCount + 1);
          }

          // Set loading state
          newFollowLoadingStates.add(userId);

          return {
            followedUsers: newFollowedUsers,
            userFollowerCounts: newUserFollowerCounts,
            followLoadingStates: newFollowLoadingStates,
          };
        });
      },

      setFollowSuccess: (userId: number, newIsFollowing: boolean, newCount: number) => {
        set((state) => {
          const newFollowedUsers = new Set(state.followedUsers);
          const newUserFollowerCounts = new Map(state.userFollowerCounts);
          const newFollowLoadingStates = new Set(state.followLoadingStates);

          // Update with server response
          if (newIsFollowing) {
            newFollowedUsers.add(userId);
          } else {
            newFollowedUsers.delete(userId);
          }
          newUserFollowerCounts.set(userId, Math.max(0, newCount));

          // Clear loading state
          newFollowLoadingStates.delete(userId);

          return {
            followedUsers: newFollowedUsers,
            userFollowerCounts: newUserFollowerCounts,
            followLoadingStates: newFollowLoadingStates,
          };
        });
      },

      setFollowError: (userId: number, originalIsFollowing: boolean, originalCount: number) => {
        set((state) => {
          const newFollowedUsers = new Set(state.followedUsers);
          const newUserFollowerCounts = new Map(state.userFollowerCounts);
          const newFollowLoadingStates = new Set(state.followLoadingStates);

          // Revert to original state
          if (originalIsFollowing) {
            newFollowedUsers.add(userId);
          } else {
            newFollowedUsers.delete(userId);
          }
          newUserFollowerCounts.set(userId, Math.max(0, originalCount));

          // Clear loading state
          newFollowLoadingStates.delete(userId);

          return {
            followedUsers: newFollowedUsers,
            userFollowerCounts: newUserFollowerCounts,
            followLoadingStates: newFollowLoadingStates,
          };
        });
      },

      // Share actions
      setShareLoading: (postId: number, loading: boolean) => {
        set((state) => {
          const newShareLoadingStates = new Set(state.shareLoadingStates);
          
          if (loading) {
            newShareLoadingStates.add(postId);
          } else {
            newShareLoadingStates.delete(postId);
          }

          return {
            shareLoadingStates: newShareLoadingStates,
          };
        });
      },

      // Initialization
      initializePostState: (postId: number, isLiked: boolean, likeCount: number) => {
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts);
          const newPostLikeCounts = new Map(state.postLikeCounts);

          if (isLiked) {
            newLikedPosts.add(postId);
          }
          newPostLikeCounts.set(postId, Math.max(0, likeCount));

          return {
            likedPosts: newLikedPosts,
            postLikeCounts: newPostLikeCounts,
          };
        });
      },

      initializeUserState: (userId: number, isFollowing: boolean, followerCount: number) => {
        set((state) => {
          const newFollowedUsers = new Set(state.followedUsers);
          const newUserFollowerCounts = new Map(state.userFollowerCounts);

          if (isFollowing) {
            newFollowedUsers.add(userId);
          }
          newUserFollowerCounts.set(userId, Math.max(0, followerCount));

          return {
            followedUsers: newFollowedUsers,
            userFollowerCounts: newUserFollowerCounts,
          };
        });
      },

      // Getters
      isPostLiked: (postId: number) => {
        return get().likedPosts.has(postId);
      },

      getPostLikeCount: (postId: number) => {
        return get().postLikeCounts.get(postId) || 0;
      },

      isLikeLoading: (postId: number) => {
        return get().likeLoadingStates.has(postId);
      },

      isUserFollowed: (userId: number) => {
        return get().followedUsers.has(userId);
      },

      getUserFollowerCount: (userId: number) => {
        return get().userFollowerCounts.get(userId) || 0;
      },

      isFollowLoading: (userId: number) => {
        return get().followLoadingStates.has(userId);
      },

      isShareLoading: (postId: number) => {
        return get().shareLoadingStates.has(postId);
      },
    }),
    {
      name: 'engagement-store',
    }
  )
);

// Selectors for better performance
export const usePostLikeState = (postId: number) => {
  return useEngagementStore((state) => ({
    isLiked: state.isPostLiked(postId),
    likeCount: state.getPostLikeCount(postId),
    isLoading: state.isLikeLoading(postId),
  }));
};

export const useUserFollowState = (userId: number) => {
  return useEngagementStore((state) => ({
    isFollowing: state.isUserFollowed(userId),
    followerCount: state.getUserFollowerCount(userId),
    isLoading: state.isFollowLoading(userId),
  }));
};

export const useShareState = (postId: number) => {
  return useEngagementStore((state) => ({
    isLoading: state.isShareLoading(postId),
  }));
};