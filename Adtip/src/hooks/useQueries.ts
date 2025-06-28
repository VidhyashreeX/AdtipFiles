// src/hooks/useQueries.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/ApiService';
import { ENDPOINTS } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '../providers/QueryProvider';
import { PostListResponse } from '../types/api';

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

interface ExploreItem {
  id: string;
  type: 'post' | 'short';
  imageUrl: string;
  caption: string;
}

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

// Enhanced Cache manager with better type safety
class CacheManager {
  private static memoryCache = new Map<string, { data: any; timestamp: number; expiry: number }>();

  static async set(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const item = { data, timestamp: Date.now(), expiry: Date.now() + ttl };
    this.memoryCache.set(key, item);
    
    try {
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expiry > Date.now()) {
      return memoryItem.data;
    }

    // Check AsyncStorage
    try {
      const storedItem = await AsyncStorage.getItem(`cache:${key}`);
      if (storedItem) {
        const item = JSON.parse(storedItem);
        if (item.expiry > Date.now()) {
          this.memoryCache.set(key, item);
          return item.data;
        }
      }
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
    }

    return null;
  }

  static clear(pattern?: string) {
    if (pattern) {
      // Clear specific pattern
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
      // Clear from AsyncStorage
      AsyncStorage.getAllKeys().then(keys => {
        const cacheKeys = keys.filter(key => key.startsWith('cache:') && key.includes(pattern));
        AsyncStorage.multiRemove(cacheKeys);
      });
    } else {
      // Clear all
      this.memoryCache.clear();
      AsyncStorage.getAllKeys().then(keys => {
        const cacheKeys = keys.filter(key => key.startsWith('cache:'));
        AsyncStorage.multiRemove(cacheKeys);
      });
    }
  }
}

// Enhanced Posts hook with React Query v5 compatibility
export const usePosts = (category: number = 0, userId?: number) => {
  const netInfo = useNetInfo();

  return useInfiniteQuery({
    queryKey: ['posts', category, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const cacheKey = `posts-${category}-${page}-${userId}`;
      
      // Try offline cache first
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const data = await ApiService.listPosts({
        category,
        page,
        limit: 10,
        loggined_user_id: userId || 0
      });

      // Cache the response
      await CacheManager.set(cacheKey, data);
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
  const netInfo = useNetInfo();

  return useInfiniteQuery({
    queryKey: ['shorts', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const cacheKey = `shorts-${page}-${userId}`;
      
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const response = await ApiService.get(`${ENDPOINTS.GET_SHORTS}/${userId}?page=${page}&limit=20`);
      
      // Cache the response
      await CacheManager.set(cacheKey, response);
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
  const netInfo = useNetInfo();

  return useInfiniteQuery({
    queryKey: ['explore', userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const cacheKey = `explore-${page}-${userId}`;
      
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const response = await fetch('https://api.adtip.in/api/explore', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          page,
          limit: 15,
          loggined_user_id: userId || 0,
        }),
      });

      const data = await response.json();
      
      // Cache the response
      await CacheManager.set(cacheKey, data);
      return data as ExploreResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ExploreResponse, allPages) => {
      const hasMore = lastPage?.data?.length === 15;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes for explore
  });
};

// Enhanced Wallet data hook
export const useWalletData = (userId?: string) => {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: async (): Promise<WalletData> => {
      const cacheKey = `wallet-${userId}`;
      
      // Always try to get fresh data for wallet
      try {
        const [balance, premium, transactions] = await Promise.allSettled([
          ApiService.get(`/api/wallet/balance/${userId}`),
          ApiService.get(`/api/wallet/premium/${userId}`),
          ApiService.get(`/api/wallet/transactions/${userId}`)
        ]);

        const result: WalletData = {
          balance: balance.status === 'fulfilled' ? balance.value : null,
          premium: premium.status === 'fulfilled' ? premium.value : null,
          transactions: transactions.status === 'fulfilled' ? transactions.value : null,
        };

        // Cache wallet data for offline use
        await CacheManager.set(cacheKey, result, 60000); // 1 minute cache
        return result;
      } catch (error) {
        // Fallback to cache on error
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for wallet
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Enhanced Profile data hook
export const useProfile = (userId?: number) => {
  const netInfo = useNetInfo();

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const cacheKey = `profile-${userId}`;
      
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const response = await ApiService.get(`/api/user/${userId}`);
      
      // Cache profile data
      await CacheManager.set(cacheKey, response, 10 * 60 * 1000); // 10 minutes
      return response;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Enhanced Hook for prefetching data
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
      getNextPageParam: (lastPage: PostListResponse) => {
        if (lastPage?.pagination?.current_page < lastPage?.pagination?.total_page) {
          return lastPage.pagination.current_page + 1;
        }
        return undefined;
      },
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

// Enhanced Users hook for TipCall screen
export const useUsers = (filters: {
  languageFilter: number;
  categoryFilter: number;
  searchQuery?: string;
}, userId?: number) => {
  const netInfo = useNetInfo();

  return useInfiniteQuery({
    queryKey: ['users', filters, userId],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const cacheKey = `users-${JSON.stringify(filters)}-${page}-${userId}`;
      
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const requestData = {
        id: 0,
        page,
        limit: 50,
        language: filters.languageFilter === 0 ? [] : [filters.languageFilter],
        interest: filters.categoryFilter === 0 ? [] : [filters.categoryFilter],
        user_id: null,
        search_by_name: filters.searchQuery || "",
        loggined_user_id: userId || 0,
        sortBy: {}
      };

      const response = await ApiService.getAllUsersList(requestData);
      
      // Transform response to match expected format
      const transformedResponse = {
        status: Boolean(response?.status),
        data: Array.isArray(response?.data) ? response.data : [],
        hasMore: response?.data?.length >= 50, // Has more if we got full page
        pagination: {
          current_page: page,
          total_page: response?.data?.length >= 50 ? page + 1 : page,
        }
      };

      // Cache the response
      await CacheManager.set(cacheKey, transformedResponse);
      return transformedResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage?.data?.length >= 50;
      return hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes for users
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

// Enhanced Videos hook for TipTube
export const useVideos = (categoryId: number = 0, userId?: number, searchQuery?: string) => {
  const netInfo = useNetInfo();

  return useInfiniteQuery({
    queryKey: ['videos', categoryId, userId, searchQuery],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const cacheKey = `videos-${categoryId}-${page}-${userId}-${searchQuery || ''}`;
      
      if (!netInfo.isConnected) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) return cached;
        throw new Error('No internet connection and no cached data');
      }

      const response = await ApiService.getVideos(
        userId || 0,
        categoryId,
        page,
        searchQuery,
        undefined // signal will be handled by React Query
      );
      
      console.log('[useVideos] API Response:', {
        response: response,
        responseData: response?.data,
        hasNestedData: !!response?.data?.data,
        directDataLength: Array.isArray(response?.data) ? response.data.length : 'not array',
        nestedDataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'not array'
      });
      
      // Transform response to match expected format
      // The API returns { data: { data: [videos], status: 200, message: "..." } }
      const apiData = response?.data || response; // Handle both nested and direct response
      const videosArray = Array.isArray(apiData) ? apiData : (apiData?.data || []);
      
      console.log('[useVideos] Extracted videos array:', {
        videosArray: videosArray,
        length: videosArray.length,
        firstVideo: videosArray[0]
      });
      
      const transformedResponse = {
        status: response.status === 200 || apiData?.status === 200 || true,
        data: videosArray,
        hasMore: videosArray.length > 0,
        pagination: {
          current_page: page,
          total_page: videosArray.length > 0 ? page + 1 : page,
        }
      };

      // Cache the response
      await CacheManager.set(cacheKey, transformedResponse);
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

// Export cache manager and query client
export { CacheManager, queryClient };
