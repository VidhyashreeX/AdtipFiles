// src/hooks/useQueries.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/ApiService';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '../providers/QueryProvider';
import { PostListResponse, ExploreContentResponse, ExploreItem as ApiExploreItem } from '../types/api';
import UserDataStorageService from '../services/UserDataStorageService';
import UserDataErrorHandler from '../services/UserDataErrorHandler';
import { useAuth } from '../contexts/AuthContext';

// Enhanced Types with proper interfaces
interface Post {
  id: number;
  content: string;
  media_url?: string;
  user_id: number;
  likes: number;
  comments: number;
  created_at: string;
  user_name: string;
  user_profile_image?: string;
  is_liked?: boolean;
}

interface Short {
  id: string;
  videoUrl: string;
  thumbnail: string;
  description: string;
  likes: number;
  channel: {
    id: string;
    name: string;
    avatar: string;
  };
}

// Use the API type for ExploreItem
type ExploreItem = ApiExploreItem;

interface ShortsResponse {
  status: boolean;
  data: Short[];
  hasMore: boolean;
}

interface ExploreResponse {
  status: boolean;
  data: ExploreItem[];
  hasMore: boolean;
}

interface WalletData {
  balance: any;
  premium: any;
  transactions: any;
}

interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
}

interface VideosResponse {
  status: boolean | number;
  data: any[];
  hasMore: boolean;
}

// ===== PRIORITY 1: HIGH-IMPACT APIs =====

// Wallet Balance Hook
export const useWalletBalance = (userId: string | number) => {
  return useQuery({
    queryKey: ['wallet', 'balance', userId],
    queryFn: () => ApiService.getWalletBalance(Number(userId)),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// Premium Status Hook
export const usePremiumStatus = (userId: string | number) => {
  return useQuery({
    queryKey: ['premium', 'status', userId],
    queryFn: () => ApiService.getSubscriptionStatus(Number(userId)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// Ad Passbook Hook
export const useAdPassbook = (userId: string | number) => {
  return useQuery({
    queryKey: ['adPassbook', userId],
    queryFn: () => ApiService.getAdPassbook(Number(userId)),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Subscription Status Hook
export const useSubscriptionStatus = (userId: string | number) => {
  return useQuery({
    queryKey: ['subscription', 'status', userId],
    queryFn: () => ApiService.getSubscriptionStatus(Number(userId)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Channel Data Hook
export const useChannelData = (userId: string | number) => {
  return useQuery({
    queryKey: ['channel', 'data', userId],
    queryFn: () => ApiService.getChannelByUserId(Number(userId)),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false; // Channel not found
      return failureCount < 2;
    },
  });
};

// Channel Analytics Hook
export const useChannelAnalytics = (channelId: string | number) => {
  return useQuery({
    queryKey: ['channel', 'analytics', channelId],
    queryFn: () => ApiService.getChannelAnalytics(Number(channelId)),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Withdrawal Requests Hook
export const useWithdrawalRequests = (userId: string | number) => {
  return useQuery({
    queryKey: ['withdrawals', userId],
    queryFn: () => ApiService.get(`/api/withdrawal-requests/${userId}`),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Content Creator Premium Status Hook
export const useContentPremiumStatus = (userId: string | number) => {
  return useQuery({
    queryKey: ['contentPremium', 'status', userId],
    queryFn: () => ApiService.getContentPremiumStatus(Number(userId)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===== PRIORITY 2: CONTENT MANAGEMENT & CHAT APIs =====

// Channel Videos Hook (Infinite Query)
export const useChannelVideos = (channelId: number, userId: number, videoType: number = 0) => {
  return useInfiniteQuery({
    queryKey: ['channel', 'videos', channelId, userId, videoType],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.getVideoByChannel(videoType, channelId, userId);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more videos based on response
      const hasMore = lastPage?.data?.length > 0;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!channelId && !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });
};

// Popular Content Hook
export const usePopularContent = (videoType: number, userId: number) => {
  return useQuery({
    queryKey: ['popular', 'content', videoType, userId],
    queryFn: () => ApiService.getPopularShort(videoType, userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User Posts Hook (Infinite Query)
export const useUserPosts = (userId: number, loggedUserId: number) => {
  return useInfiniteQuery({
    queryKey: ['user', 'posts', userId, loggedUserId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.getUserPosts(userId, page, 10, loggedUserId);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more posts
      const hasMore = lastPage?.data?.length === 10;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId && !!loggedUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Comprehensive User Data Hook with background refresh and AsyncStorage persistence
export const useUserData = (userId: number) => {
  const netInfo = useNetInfo();

  return useQuery({
    queryKey: ['userData', userId],
    queryFn: async () => {
      console.log('[useUserData] Fetching comprehensive user data for userId:', userId);

      try {
        const response = await ApiService.getUserData({ userid: userId });

        // Store in AsyncStorage using the dedicated storage service
        if (response.data) {
          await UserDataStorageService.storeUserData(userId, response.data);
          console.log('[useUserData] User data cached successfully');
        }

        return response.data;
      } catch (error) {
        console.error('[useUserData] Failed to fetch user data:', error);

        // Use enhanced error handler for intelligent fallback
        try {
          const fallbackData = await UserDataErrorHandler.handleUserDataError(error, userId);
          if (fallbackData) {
            console.log('[useUserData] Using fallback data from error handler');
            return fallbackData;
          }
        } catch (handlerError) {
          console.error('[useUserData] Error handler also failed:', handlerError);
          // Log the error for analytics
          UserDataErrorHandler.logError(
            UserDataErrorHandler.createUserDataError(error),
            userId,
            'useUserData'
          );
        }

        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - cache time
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchIntervalInBackground: false, // Pause when app is backgrounded
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst', // Use cache when offline
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry up to 3 times with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Categories Hook
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => ApiService.get(ENDPOINTS.GET_CATEGORIES),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
};

// Chat Messages Hook (Local Storage)
const CHAT_STORAGE_PREFIX = '@chat_';
const CHAT_EXPIRY_DAYS = 7;

function pruneOldMessages(messages: any[]): any[] {
  const now = Date.now();
  const expiry = CHAT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  console.log('🔍 [pruneOldMessages] Processing messages:', {
    totalMessages: messages.length,
    now: new Date(now).toISOString(),
    expiryDays: CHAT_EXPIRY_DAYS,
    expiryMs: expiry
  });
  
  const filtered = messages.filter(msg => {
    const msgTime = new Date(msg.createddate).getTime();
    const age = now - msgTime;
    const isRecent = age < expiry;
    
    console.log('🔍 [pruneOldMessages] Message check:', {
      id: msg.id,
      createddate: msg.createddate,
      msgTime: new Date(msgTime).toISOString(),
      age: age,
      ageInDays: age / (24 * 60 * 60 * 1000),
      isRecent: isRecent
    });
    
    return isRecent;
  });
  
  console.log('🔍 [pruneOldMessages] Filtered messages:', {
    before: messages.length,
    after: filtered.length,
    removed: messages.length - filtered.length
  });
  
  return filtered;
}

export const useChatMessages = (userId: number, chattingUserId: number) => {
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', userId, chattingUserId],
    queryFn: async () => {
      const key = `${CHAT_STORAGE_PREFIX}${userId}_${chattingUserId}`;
      console.log('🔍 [useChatMessages] Loading messages for key:', key);
      const raw = await AsyncStorage.getItem(key);
      let messages = raw ? JSON.parse(raw) : [];
      console.log('🔍 [useChatMessages] Raw messages from storage:', messages);
      console.log('🔍 [useChatMessages] Raw data type:', typeof raw, 'Raw data length:', raw?.length);
      
      // Temporarily disable pruning to test if that's causing the issue
      // messages = pruneOldMessages(messages);
      console.log('🔍 [useChatMessages] Messages after pruning (disabled):', messages);
      
      // Don't write back to storage here - this was causing issues
      // await AsyncStorage.setItem(key, JSON.stringify(messages));
      return { messages };
    },
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    enabled: !!userId && !!chattingUserId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; receiverId: number; message: string }) => {
      const key = `${CHAT_STORAGE_PREFIX}${data.userId}_${data.receiverId}`;
      console.log('🔍 [useSendChatMessage] Saving message for key:', key);
      const now = new Date().toISOString();
      const newMsg = {
        id: Date.now(),
        sender: data.userId,
        receiver: data.receiverId,
        message: data.message,
        createddate: now,
        is_seen: false,
      };
      console.log('🔍 [useSendChatMessage] New message:', newMsg);
      let messages: any[] = [];
      const raw = await AsyncStorage.getItem(key);
      if (raw) messages = JSON.parse(raw);
      console.log('🔍 [useSendChatMessage] Existing messages:', messages);
      messages.push(newMsg);
      // Temporarily disable pruning to test if that's causing the issue
      // messages = pruneOldMessages(messages);
      console.log('🔍 [useSendChatMessage] Messages after adding (pruning disabled):', messages);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      console.log('🔍 [useSendChatMessage] Message saved to storage');
      return newMsg;
    },
    onSuccess: (data, variables) => {
      console.log('🔍 [useSendChatMessage] Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.userId, variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread', variables.receiverId] });
    },
  });
};

export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, senderId }: { userId: number; senderId: number }) => {
      const key = `${CHAT_STORAGE_PREFIX}${senderId}_${userId}`;
      const raw = await AsyncStorage.getItem(key);
      let messages: any[] = raw ? JSON.parse(raw) : [];
      messages = messages.map(msg => ({ ...msg, is_seen: true }));
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      return true;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.userId, variables.senderId] });
    },
  });
};

// Unread Message Count Hook
export const useUnreadMessageCount = (userId: number) => {
  return useQuery({
    queryKey: ['chat', 'unread', userId],
    queryFn: async () => {
      // Get all chat keys for this user
      const keys = await AsyncStorage.getAllKeys();
      const userChatKeys = keys.filter(key => 
        key.startsWith(CHAT_STORAGE_PREFIX) && 
        (key.includes(`_${userId}`) || key.includes(`${userId}_`))
      );
      
      let totalUnread = 0;
      for (const key of userChatKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const messages = JSON.parse(raw);
          const unreadCount = messages.filter((msg: any) => 
            msg.receiver === userId && !msg.is_seen
          ).length;
          totalUnread += unreadCount;
        }
      }
      return totalUnread;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Followers Hook
export const useFollowers = (userId: number) => {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => ApiService.getUserFollowers(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Followings Hook
export const useFollowings = (userId: number) => {
  return useQuery({
    queryKey: ['followings', userId],
    queryFn: () => ApiService.getUserFollowings(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===== PRIORITY 2 MUTATIONS =====

// Upload TipTube Video Mutation
export const useUploadTipTubeVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.uploadTipTubeVideo(data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['channel', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'posts'] });
    },
    onError: (error) => {
      console.error('Upload TipTube video error:', error);
    },
  });
};

// Upload TipShorts Video Mutation
export const useUploadTipShortsVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.uploadTipShortsVideo(data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['channel', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['shorts'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'posts'] });
    },
    onError: (error) => {
      console.error('Upload TipShorts video error:', error);
    },
  });
};

// Create Post Mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      user_id: number;
      title: string;
      content: string; // Make content required
      media_url: string; // Make media_url required
      media_type: 'video' | 'image' | 'audio';
      is_promoted: boolean;
      video_category_id?: number;
      start_date?: string;
      end_date?: string;
      all_media_urls?: string[];
    }) => ApiService.createPost(data),
    onSuccess: (data, variables) => {
      console.log('Post created successfully:', data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      console.error('Create post error:', error);
    },
  });
};

// ===== PRIORITY 1 MUTATIONS =====

// Cancel Subscription Mutation
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => ApiService.cancelSubscription(userId),
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status', userId] });
      queryClient.invalidateQueries({ queryKey: ['premium', 'status', userId] });
      queryClient.invalidateQueries({ queryKey: ['premium', 'plans', userId] });
    },
    onError: (error) => {
      console.error('Cancel subscription error:', error);
    },
  });
};

// Cancel Content Premium Subscription Mutation
export const useCancelContentPremium = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => ApiService.cancelContentPremiumSubscription(userId),
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['contentPremium', 'status', userId] });
    },
    onError: (error) => {
      console.error('Cancel content premium error:', error);
    },
  });
};

// Update User Mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.updateUser(data),
    onSuccess: (data, variables) => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['profile', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['premium', 'status', variables.user_id] });
    },
    onError: (error) => {
      console.error('Update user error:', error);
    },
  });
};

// Save User Details Mutation with optimistic updates
export const useSaveUserDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ApiService.saveUserDetails(data),
    onMutate: async (newUserData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', newUserData.user_id] });
      await queryClient.cancelQueries({ queryKey: ['userProfile', newUserData.user_id] });

      // Snapshot previous values
      const previousProfile = queryClient.getQueryData(['profile', newUserData.user_id]);
      const previousUserProfile = queryClient.getQueryData(['userProfile', newUserData.user_id]);

      // Optimistically update profile data
      queryClient.setQueryData(['profile', newUserData.user_id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...newUserData
          }
        };
      });

      queryClient.setQueryData(['userProfile', newUserData.user_id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...newUserData
          }
        };
      });

      return { previousProfile, previousUserProfile };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', variables.user_id], context.previousProfile);
      }
      if (context?.previousUserProfile) {
        queryClient.setQueryData(['userProfile', variables.user_id], context.previousUserProfile);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['profile', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.user_id] });
    },
  });
};

// Update Channel Mutation
export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.updateChannel(data),
    onSuccess: (data, variables) => {
      // Invalidate channel-related queries
      queryClient.invalidateQueries({ queryKey: ['channel', 'data', variables.createdBy] });
      queryClient.invalidateQueries({ queryKey: ['channel', 'analytics', variables.id] });
    },
    onError: (error) => {
      console.error('Update channel error:', error);
    },
  });
};

// Save Channel Mutation
export const useSaveChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.saveMyChannel(data),
    onSuccess: (data, variables) => {
      // Invalidate channel-related queries
      queryClient.invalidateQueries({ queryKey: ['channel', 'data', variables.createdBy] });
    },
    onError: (error) => {
      console.error('Save channel error:', error);
    },
  });
};

// ===== ENHANCED WALLET DATA HOOK (COMBINED) =====

// Enhanced Wallet data hook with all wallet-related data
export const useWalletData = (userId?: string) => {
  return useQuery({
    queryKey: ['wallet', 'combined', userId],
    queryFn: async (): Promise<WalletData> => {
      // React Query's networkMode handles offline cases.
      const [balance, premium, transactions] = await Promise.allSettled([
        ApiService.getWalletBalance(Number(userId)),
        ApiService.checkPremium(Number(userId)),
        ApiService.get(`/api/wallet/transactions/${userId}`)
      ]);

      const result: WalletData = {
        balance: balance.status === 'fulfilled' ? balance.value : null,
        premium: premium.status === 'fulfilled' ? premium.value : null,
        transactions: transactions.status === 'fulfilled' ? transactions.value : null,
      };

      return result;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for wallet
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Guest Posts hook for unauthenticated users
export const useGuestPosts = () => {
  return useQuery({
    queryKey: ['guest-posts'],
    queryFn: async () => {
      // Call the guest API that doesn't require authentication
      const data = await ApiService.getListPremiumPosts();

      // Transform to match expected format
      return {
        data: data.data || [],
        pagination: {
          current_page: 1,
          total_page: 1,
          total_count: data.data?.length || 0
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Guest Videos hook for unauthenticated users
export const useGuestVideos = () => {
  return useQuery({
    queryKey: ['guest-videos'],
    queryFn: async () => {
      // Call the guest API that doesn't require authentication
      const data = await ApiService.getPublicVideos(0, 1); // categoryId=0, offset=1

      // Transform to match expected format
      return {
        data: data.data || [],
        pagination: {
          current_page: 1,
          total_page: 1,
          total_count: data.data?.length || 0
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Guest Shorts hook for unauthenticated users
export const useGuestShorts = () => {
  return useQuery({
    queryKey: ['guest-shorts'],
    queryFn: async () => {
      // Call the guest API that doesn't require authentication
      const data = await ApiService.getPublicShots();

      // Transform to match expected format
      return {
        data: data.data || [],
        pagination: {
          current_page: 1,
          total_page: 1,
          total_count: data.data?.length || 0
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Enhanced Posts hook with React Query v5 compatibility
export const usePosts = (category: number = 0, userId?: number) => {
  return useInfiniteQuery({
    queryKey: ['posts', category, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;

      // Directly call the ApiService. React Query handles offline logic.
      const data = await ApiService.listPosts({
        category,
        page,
        limit: 10,
        loggined_user_id: userId || 0
      });

      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PostListResponse) => {
      if (lastPage?.pagination?.current_page < lastPage?.pagination?.total_page) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes for posts
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Enhanced Shorts hook
export const useShorts = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: ['shorts', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      // Directly call ApiService. React Query handles offline logic.
      const response = await ApiService.get(`${ENDPOINTS.GET_SHORTS}/${userId}?page=${page}&limit=20`);
      return response as ShortsResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ShortsResponse, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes for shorts
    refetchOnMount: false,
  });
};

// Enhanced Explore content hook
export const useExplore = (userId?: number) => {
  return useInfiniteQuery({
    queryKey: ['explore', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      // Use ApiService for consistent auth and error handling.
      const data = await ApiService.getExploreContent({
        page,
        limit: 10,
        loggined_user_id: userId || 0,
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.pagination?.current_page < lastPage?.pagination?.total_page) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes for explore
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Enhanced Profile data hook - uses comprehensive user data API
export const useProfile = (userId?: number) => {
  const { user } = useAuth();
  const isCurrentUser = userId === user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      try {
        // Use comprehensive user data API for better data
        const response = await ApiService.getUserData({ userid: userId });
        return response.data;
      } catch (error) {
        console.error('[useProfile] Failed to fetch comprehensive user data, falling back to old API:', error);
        // Fallback to old API if comprehensive API fails
        const fallbackResponse = await ApiService.get(`/api/user/${userId}`);
        return fallbackResponse;
      }
    },
    enabled: !!userId,
    staleTime: isCurrentUser ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min for current user, 10 min for others
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Enhanced Like mutation with optimistic updates
export const useLikeMutation = () => {
  const queryClientInstance = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: number; userId: number; isLiked: boolean }) => {
      return ApiService.likePost({
        userId: userId,
        postId: postId,
        is_liked: !isLiked // Toggle the like state
      });
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClientInstance.cancelQueries({ queryKey: ['posts'] });

      // Snapshot previous value
      const previousPosts = queryClientInstance.getQueriesData({ queryKey: ['posts'] });

      // Optimistically update
      queryClientInstance.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            data: page.data?.map((post: any) => 
              post.id === postId 
                ? { 
                    ...post, 
                    likeCount: post.likeCount + (isLiked ? -1 : 1), 
                    is_liked: !isLiked 
                  }
                : post
            )
          }))
        };
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClientInstance.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClientInstance.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Enhanced Follow mutation
export const useFollowMutation = () => {
  const queryClientInstance = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: number; isFollowing: boolean }) => {
      return ApiService.post('/api/follow-user', {
        user_id: userId,
        action: isFollowing ? 'unfollow' : 'follow'
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClientInstance.invalidateQueries({ queryKey: ['profile'] });
      queryClientInstance.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// User Profile Data Hook (for ProfileScreen)
export const useUserProfile = (userId: number | string) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const response = await ApiService.get(`/api/users/${userId}`);
      return response;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Dynamic User Name Hook
export const useDynamicUserName = (userId: number | string) => {
  return useQuery({
    queryKey: ['dynamicUserName', userId],
    queryFn: async () => {
      const response = await ApiService.post('/api/get-user-name', {
        userid: userId
      });
      return response;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Enhanced Follow User Mutation with optimistic updates
export const useFollowUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followingId, followerId, action }: {
      followingId: number;
      followerId: number;
      action: 'follow' | 'unfollow'
    }) => {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow-user`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ followingId, followerId, action }),
      });
      return response.json();
    },
    onMutate: async ({ followingId, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userProfile', followingId] });
      await queryClient.cancelQueries({ queryKey: ['followers', followingId] });

      // Snapshot previous values
      const previousProfile = queryClient.getQueryData(['userProfile', followingId]);
      const previousFollowers = queryClient.getQueryData(['followers', followingId]);

      // Optimistically update profile
      queryClient.setQueryData(['userProfile', followingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isFollowing: action === 'follow',
            followersCount: action === 'follow'
              ? (old.data?.followersCount || 0) + 1
              : Math.max(0, (old.data?.followersCount || 0) - 1)
          }
        };
      });

      return { previousProfile, previousFollowers };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile', variables.followingId], context.previousProfile);
      }
      if (context?.previousFollowers) {
        queryClient.setQueryData(['followers', variables.followingId], context.previousFollowers);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['followers', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['followings', variables.followerId] });
    },
  });
};

// Prefetch data for better performance
export const usePrefetchData = () => {
  const prefetchPosts = (category: number, userId?: number) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: ['posts', category, userId],
      queryFn: async ({ pageParam }) => {
        const page = pageParam as number;
        return ApiService.listPosts({
          category,
          page,
          limit: 10,
          loggined_user_id: userId || 0
        });
      },
      initialPageParam: 1,
    });
  };

  const prefetchProfile = (userId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['profile', userId],
      queryFn: () => ApiService.get(`/api/user/${userId}`),
    });
  };

  return { prefetchPosts, prefetchProfile };
};

// Enhanced Users hook with filters
export const useUsers = (filters: {
  languageFilter: number;
  categoryFilter: number;
  searchQuery?: string;
}, userId?: number) => {
  return useInfiniteQuery({
    queryKey: ['users', filters, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.getUsers({
        id: 0,
        page,
        limit: 20,
        language: filters.languageFilter === 0 ? [] : [filters.languageFilter],
        interest: filters.categoryFilter === 0 ? [] : [filters.categoryFilter],
        user_id: null,
        search_by_name: filters.searchQuery || "",
        loggined_user_id: userId || 0,
        sortBy: {}
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages based on total records
      const totalRecords = lastPage?.pagination?.totalRecords || 0;
      const currentPage = lastPage?.pagination?.page || 1;
      const limit = lastPage?.pagination?.limit || 20;
      const hasMore = currentPage * limit < totalRecords;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Enhanced Videos hook for TipTube
export const useVideos = (categoryId: number = 0, userId?: number, searchQuery?: string, showChannelVideos?: boolean) => {
  return useInfiniteQuery({
    queryKey: ['videos', categoryId, userId, searchQuery, showChannelVideos],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;

      // If showChannelVideos is true, we need to get videos from user's channel
      let response;
      if (showChannelVideos && userId) {
        // Get videos from user's channel
        response = await ApiService.getVideoByChannel(0, userId, userId); // 0 for all video types
      } else {
        // Get all videos as before
        response = await ApiService.getVideos(
          userId || 0,
          categoryId,
          page,
          searchQuery,
          undefined // signal will be handled by React Query
        );
      }
      
      // Transform response to match expected format
      // The API returns { data: { data: [videos], status: 200, message: "..." } }
      const apiData = response?.data || response; // Handle both nested and direct response
      const videosArray = Array.isArray(apiData) ? apiData : (apiData?.data || []);
      
      const transformedResponse = {
        status: response.status === 200 || apiData?.status === 200 || true,
        data: videosArray,
        hasMore: videosArray.length > 0,
        pagination: {
          current_page: page,
          total_page: videosArray.length > 0 ? page + 1 : page,
        }
      };

      return transformedResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length > 0;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: true,
    staleTime: 3 * 60 * 1000, // 3 minutes for videos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Search videos hook for TipTube
export const useSearchVideos = (searchQuery: string, userId?: number) => {
  return useInfiniteQuery({
    queryKey: ['searchVideos', searchQuery, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      
      if (!searchQuery.trim()) {
        console.log('[useSearchVideos] Empty search query, returning empty results');
        return {
          status: 200,
          data: [],
          hasMore: false,
          pagination: {
            current_page: page,
            total_page: page,
          }
        };
      }

      console.log('[useSearchVideos] Searching for:', searchQuery.trim(), 'page:', page);
      const response = await ApiService.searchVideos(searchQuery.trim(), page);
      console.log('[useSearchVideos] Search response:', {
        status: response.status,
        dataLength: response?.data?.length || 0,
        firstVideo: response?.data?.[0]?.name
      });
      
      // Transform response to match expected format
      const videosArray = response?.data || [];
      
      const transformedResponse = {
        status: response.status === 200 || true,
        data: videosArray,
        hasMore: videosArray.length > 0,
        pagination: {
          current_page: page,
          total_page: videosArray.length > 0 ? page + 1 : page,
        }
      };

      return transformedResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length > 0;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!searchQuery.trim() && searchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Export cache manager and query client
export { queryClient };

// ===== PRIORITY 3: REMAINING APIs =====

// Analytics APIs
export const useUserAnalytics = (userId: number) => {
  return useQuery({
    queryKey: ['analytics', 'user', userId],
    queryFn: () => ApiService.get(`/api/analytics/user/${userId}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useContentAnalytics = (contentId: number) => {
  return useQuery({
    queryKey: ['analytics', 'content', contentId],
    queryFn: () => ApiService.get(`/api/analytics/content/${contentId}`),
    enabled: !!contentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useChannelAnalyticsData = (channelId: number) => {
  return useQuery({
    queryKey: ['analytics', 'channel', channelId],
    queryFn: () => ApiService.getChannelAnalytics(channelId),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search APIs
export const useUserSearch = (searchQuery: string, filters: any, userId: number) => {
  return useInfiniteQuery({
    queryKey: ['search', 'users', searchQuery, filters, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.getUsers({
        id: 0,
        page,
        limit: 20,
        language: filters?.language || [],
        interest: filters?.interest || [],
        user_id: null,
        search_by_name: searchQuery,
        loggined_user_id: userId,
        sortBy: {}
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!searchQuery && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  });
};

export const useContentSearch = (searchQuery: string, filters: any, userId: number) => {
  return useInfiniteQuery({
    queryKey: ['search', 'content', searchQuery, filters, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.get(`/api/search/content?query=${searchQuery}&page=${page}&limit=20&userId=${userId}`, filters);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!searchQuery && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  });
};

// Notification APIs
export const useNotifications = (userId: number) => {
  return useInfiniteQuery({
    queryKey: ['notifications', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.getSentNotifications(userId);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: true,
  });
};

export const useUnreadNotificationCount = (userId: number) => {
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => ApiService.get(`/api/notifications/unread/${userId}`),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Settings APIs
export const useUserSettings = (userId: number) => {
  return useQuery({
    queryKey: ['settings', userId],
    queryFn: () => ApiService.get(`/api/settings/user/${userId}`),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAppSettings = () => {
  return useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => ApiService.get('/api/settings/app'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Blocklist APIs
export const useBlockedUsers = (userId: number) => {
  return useQuery({
    queryKey: ['blocklist', userId],
    queryFn: () => ApiService.get(`/api/blocklist/${userId}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Report APIs
export const useReportReasons = () => {
  return useQuery({
    queryKey: ['report', 'reasons'],
    queryFn: () => ApiService.get('/api/report/reasons'),
    staleTime: 60 * 60 * 1000, // 1 hour - rarely changes
  });
};

// Game APIs
export const useGames = (userId: number) => {
  return useQuery({
    queryKey: ['games', userId],
    queryFn: () => ApiService.get(`/api/games/${userId}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGameLeaderboard = (gameId: number) => {
  return useQuery({
    queryKey: ['games', 'leaderboard', gameId],
    queryFn: () => ApiService.get(`/api/games/leaderboard/${gameId}`),
    enabled: !!gameId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Shop APIs
export const useShopProducts = (category?: string) => {
  return useInfiniteQuery({
    queryKey: ['shop', 'products', category],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.get(`/api/shop/products?category=${category}&page=${page}&limit=20`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
  });
};

export const useShopCategories = () => {
  return useQuery({
    queryKey: ['shop', 'categories'],
    queryFn: () => ApiService.get('/api/shop/categories'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Order APIs
export const useUserOrders = (userId: number) => {
  return useInfiniteQuery({
    queryKey: ['orders', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.get(`/api/orders/${userId}?page=${page}&limit=10`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 10;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Support APIs
export const useSupportTickets = (userId: number) => {
  return useInfiniteQuery({
    queryKey: ['support', 'tickets', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.get(`/api/support/tickets/${userId}?page=${page}&limit=10`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 10;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  });
};

export const useSupportCategories = () => {
  return useQuery({
    queryKey: ['support', 'categories'],
    queryFn: () => ApiService.get('/api/support/categories'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Referral APIs
export const useReferralData = (userId: number) => {
  return useQuery({
    queryKey: ['referral', userId],
    queryFn: () => ApiService.getReferralDetails(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReferralHistory = (userId: number) => {
  return useInfiniteQuery({
    queryKey: ['referral', 'history', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      return ApiService.get(`/api/referral/history/${userId}?page=${page}&limit=20`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length === 20;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// ===== PRIORITY 3 MUTATIONS =====

// Analytics Mutations
export const useUpdateAnalytics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.post('/api/analytics/update', data),
    onSuccess: (data, variables) => {
      // Invalidate related analytics queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => {
      console.error('Update analytics error:', error);
    },
  });
};

// Search Mutations
export const useSaveSearchHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; query: string; type: string }) => 
      ApiService.post('/api/search/history', data),
    onSuccess: (data, variables) => {
      // Invalidate search history queries
      queryClient.invalidateQueries({ queryKey: ['search', 'history', variables.userId] });
    },
    onError: (error) => {
      console.error('Save search history error:', error);
    },
  });
};

// Notification Mutations
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: number; notificationId: number }) => 
      ApiService.post(`/api/notifications/${notificationId}/read`, { userId }),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', 'unread', variables.userId] 
      });
    },
    onError: (error) => {
      console.error('Mark notification as read error:', error);
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => ApiService.post(`/api/notifications/mark-all-read/${userId}`),
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', 'unread', userId] 
      });
    },
    onError: (error) => {
      console.error('Mark all notifications as read error:', error);
    },
  });
};

// Settings Mutations
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.post('/api/settings/user/update', data),
    onSuccess: (data, variables) => {
      // Invalidate settings queries
      queryClient.invalidateQueries({ 
        queryKey: ['settings', variables.user_id] 
      });
    },
    onError: (error) => {
      console.error('Update user settings error:', error);
    },
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.post('/api/settings/app/update', data),
    onSuccess: (data, variables) => {
      // Invalidate app settings queries
      queryClient.invalidateQueries({ queryKey: ['settings', 'app'] });
    },
    onError: (error) => {
      console.error('Update app settings error:', error);
    },
  });
};

// Blocklist Mutations
export const useBlockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; blockedUserId: number }) => 
      ApiService.post('/api/blocklist/block', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['blocklist', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
    },
    onError: (error) => {
      console.error('Block user error:', error);
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; blockedUserId: number }) => 
      ApiService.post('/api/blocklist/unblock', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['blocklist', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
    },
    onError: (error) => {
      console.error('Unblock user error:', error);
    },
  });
};

// Report Mutations
export const useReportContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; contentId: number; reason: string; description?: string }) => 
      ApiService.post('/api/report/content', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      console.error('Report content error:', error);
    },
  });
};

export const useReportUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; reportedUserId: number; reason: string; description?: string }) => 
      ApiService.post('/api/report/user', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      console.error('Report user error:', error);
    },
  });
};

// Game Mutations
export const useSaveGameScore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; gameId: number; score: number }) => 
      ApiService.post('/api/games/save-score', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['games', 'leaderboard', variables.gameId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['games', variables.userId] 
      });
    },
    onError: (error) => {
      console.error('Save game score error:', error);
    },
  });
};

// Shop Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.post('/api/shop/orders/create', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['orders', variables.user_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['wallet', 'balance', variables.user_id] 
      });
    },
    onError: (error) => {
      console.error('Create order error:', error);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; orderId: number }) => 
      ApiService.post('/api/shop/orders/cancel', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['orders', variables.userId] 
      });
    },
    onError: (error) => {
      console.error('Cancel order error:', error);
    },
  });
};

// Support Mutations
export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.post('/api/support/tickets/create', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['support', 'tickets', variables.user_id] 
      });
    },
    onError: (error) => {
      console.error('Create support ticket error:', error);
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.put('/api/support/tickets/update', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['support', 'tickets', variables.user_id] 
      });
    },
    onError: (error) => {
      console.error('Update support ticket error:', error);
    },
  });
};

// Referral Mutations
export const useGenerateReferralCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => ApiService.post(`/api/referral/generate-code/${userId}`),
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['referral', userId] 
      });
    },
    onError: (error) => {
      console.error('Generate referral code error:', error);
    },
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: number; referralCode: string }) => 
      ApiService.post('/api/referral/apply-code', data),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['referral', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['wallet', 'balance', variables.userId] 
      });
    },
    onError: (error) => {
      console.error('Apply referral code error:', error);
    },
  });
};

// Search Users Hook
export const useSearchUsers = (searchQuery: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['search', 'users', searchQuery, page, limit],
    queryFn: () => ApiService.searchUsersByName(searchQuery, page, limit),
    enabled: !!searchQuery && searchQuery.trim().length >= 2, // Only search if query is 2+ characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// Fallback location data for when API is unavailable
const getFallbackLocationData = (searchQuery: string) => {
  const commonLocations = [
    { name: 'Mumbai', country: 'India' },
    { name: 'Delhi', country: 'India' },
    { name: 'Bangalore', country: 'India' },
    { name: 'Chennai', country: 'India' },
    { name: 'Kolkata', country: 'India' },
    { name: 'Hyderabad', country: 'India' },
    { name: 'Pune', country: 'India' },
    { name: 'Ahmedabad', country: 'India' },
    { name: 'Jaipur', country: 'India' },
    { name: 'Lucknow', country: 'India' },
    { name: 'New York', country: 'USA' },
    { name: 'Los Angeles', country: 'USA' },
    { name: 'London', country: 'UK' },
    { name: 'Paris', country: 'France' },
    { name: 'Tokyo', country: 'Japan' },
    { name: 'Sydney', country: 'Australia' },
    { name: 'Toronto', country: 'Canada' },
    { name: 'Dubai', country: 'UAE' },
    { name: 'Singapore', country: 'Singapore' },
    { name: 'Bangkok', country: 'Thailand' },
  ];

  const query = searchQuery.toLowerCase();
  return commonLocations
    .filter(location =>
      location.name.toLowerCase().includes(query) ||
      location.country.toLowerCase().includes(query)
    )
    .slice(0, 5) // Limit to 5 results
    .map((location, index) => ({
      place_id: `fallback_${location.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
      description: `${location.name}, ${location.country}`,
      structured_formatting: {
        main_text: location.name,
        secondary_text: location.country,
      },
      types: ['locality', 'political'],
      terms: [
        { offset: 0, value: location.name },
        { offset: location.name.length + 2, value: location.country },
      ],
    }));
};

// Google Places Search Hook for Location Autocomplete
export const useLocationSearch = (searchQuery: string) => {
  return useQuery({
    queryKey: ['location', 'search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) {
        return [];
      }

      try {
        // Import Google Maps configuration
        const { buildPlacesAutocompleteUrl, validatePlacesResponse, GOOGLE_MAPS_CONFIG } = await import('../config/googleMapsConfig');

        const url = buildPlacesAutocompleteUrl(searchQuery);

        // Create AbortController for timeout (React Native compatible)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, GOOGLE_MAPS_CONFIG.REQUEST_TIMEOUT);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          // Clear timeout on successful response
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const validatedResponse = validatePlacesResponse(data);

          return validatedResponse.predictions || [];
        } catch (error) {
          // Clear timeout on error
          clearTimeout(timeoutId);

          // Handle abort error specifically
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout - please check your internet connection');
          }

          throw error;
        }
      } catch (error) {
        // If Google Places API fails, return fallback data
        console.warn('Google Places API failed, using fallback data:', error);
        return getFallbackLocationData(searchQuery);
      }
    },
    enabled: !!searchQuery && searchQuery.trim().length >= 3, // Only search if query is 3+ characters
    staleTime: 10 * 60 * 1000, // 10 minutes - location data doesn't change often
    retry: (failureCount, error: any) => {
      // Don't retry on API quota errors or timeouts - use fallback instead
      if (error?.message?.includes('OVER_QUERY_LIMIT')) return false;
      if (error?.message?.includes('REQUEST_DENIED')) return false;
      if (error?.message?.includes('Request timeout')) return false;
      return failureCount < 1; // Only retry once before falling back
    },
  });
};
