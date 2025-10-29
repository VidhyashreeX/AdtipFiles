// src/hooks/api/users.ts - React Query hooks for user-related API calls
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, ApiResponse } from '@/types';

// Query keys for consistent caching
export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: (id: number) => [...userKeys.all, 'profile', id] as const,
  wallet: (id: number) => [...userKeys.all, 'wallet', id] as const,
  followers: (id: number) => [...userKeys.all, 'followers', id] as const,
  following: (id: number) => [...userKeys.all, 'following', id] as const,
  channel: (id: number) => [...userKeys.all, 'channel', id] as const,
  analytics: (id: number) => [...userKeys.all, 'analytics', id] as const,
  videos: (id: number) => [...userKeys.all, 'videos', id] as const,
  shorts: (id: number) => [...userKeys.all, 'shorts', id] as const,
};

// API base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get current user profile
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get<ApiResponse<User>>(`/api/user/${userId}`);
      return response.data.data;
    },
    enabled: !!localStorage.getItem('UserId'),
  });
};

// Get user profile by ID
export const useUserProfile = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User>>(`/api/user/${userId}`);
      return response.data.data;
    },
    enabled: enabled && !!userId,
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.put<ApiResponse<User>>(`/api/user/${userId}`, userData);
      return response.data;
    },
    onSuccess: (result) => {
      // Update current user in cache
      queryClient.setQueryData(userKeys.current(), result.data);
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Get user wallet balance
export const useWalletBalance = (userId?: number) => {
  const currentUserId = userId || localStorage.getItem('UserId');

  return useQuery({
    queryKey: userKeys.wallet(Number(currentUserId)),
    queryFn: async () => {
      if (!currentUserId) throw new Error('User ID required');

      const response = await api.get<ApiResponse<{ balance: number; availableBalance: string }>>(`/api/wallet/${currentUserId}`);
      return response.data.data;
    },
    enabled: !!currentUserId,
  });
};

// Get user followers
export const useUserFollowers = (userId: number, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: userKeys.followers(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User[]>>(`/api/user/${userId}/followers`, {
        params: { page: params?.page || 1, limit: params?.limit || 20 }
      });
      return response.data;
    },
    enabled: !!userId,
  });
};

// Get users that the user is following
export const useUserFollowing = (userId: number, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: userKeys.following(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User[]>>(`/api/user/${userId}/following`, {
        params: { page: params?.page || 1, limit: params?.limit || 20 }
      });
      return response.data;
    },
    enabled: !!userId,
  });
};

// Follow/Unfollow user
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: number; action: 'follow' | 'unfollow' }) => {
      const currentUserId = localStorage.getItem('UserId');
      if (!currentUserId) throw new Error('User not logged in');

      const response = await api.post<ApiResponse<{ isFollowing: boolean }>>(`/api/user/${action}`, {
        userId: currentUserId,
        targetUserId
      });
      return response.data;
    },
    onSuccess: (_, { targetUserId }) => {
      // Invalidate followers/following queries
      queryClient.invalidateQueries({ queryKey: userKeys.followers(targetUserId) });
      queryClient.invalidateQueries({ queryKey: userKeys.following(Number(localStorage.getItem('UserId'))) });
    },
  });
};

// Get user channel data
export const useUserChannel = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.channel(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/api/user/${userId}/channel`);
      return response.data.data;
    },
    enabled: enabled && !!userId,
  });
};

// Get user analytics/stats
export const useUserAnalytics = (channelId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.analytics(channelId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/api/analytics/${channelId}`);
      return response.data.data;
    },
    enabled: enabled && !!channelId,
  });
};

// Get user videos
export const useUserVideos = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.videos(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/api/content/user/${userId}/videos`);
      return response.data.data || [];
    },
    enabled: enabled && !!userId,
  });
};

// Get user shorts
export const useUserShorts = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.shorts(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/api/content/user/${userId}/shorts`);
      return response.data.data || [];
    },
    enabled: enabled && !!userId,
  });
};

// Update user preferences (interests, languages, etc.)
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: {
      interests?: number[];
      languages?: number[];
      bio?: string;
      profession?: string;
    }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.put<ApiResponse<User>>(`/api/user/${userId}/preferences`, preferences);
      return response.data;
    },
    onSuccess: (result) => {
      // Update current user in cache
      queryClient.setQueryData(userKeys.current(), result.data);
    },
  });
};

// Upload profile image
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.post<ApiResponse<{ imageUrl: string }>>(`/api/user/${userId}/upload-profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (result) => {
      // Update current user profile image in cache
      queryClient.setQueryData(userKeys.current(), (oldData: User | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          profile_image: result.data.imageUrl,
        };
      });
    },
  });
};