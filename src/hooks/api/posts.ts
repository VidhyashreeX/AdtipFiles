// src/hooks/api/posts.ts - React Query hooks for posts-related API calls
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ApiResponse, Post, Pagination } from '@/types';

// Query keys for consistent caching
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
  userPosts: (userId: number) => [...postKeys.all, 'user', userId] as const,
  categoryPosts: (categoryId: number) => [...postKeys.all, 'category', categoryId] as const,
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

// Fetch posts with pagination and filters
export const usePosts = (params?: {
  page?: number;
  limit?: number;
  category?: string;
  user_id?: number;
  search?: string;
}) => {
  return useInfiniteQuery({
    queryKey: postKeys.list(params || {}),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.post('/api/list-posts', {
        category: params?.category ? parseInt(params.category) : 0,
        page: pageParam as number,
        limit: params?.limit || 10,
        loggined_user_id: params?.user_id || 0
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};

// Fetch single post by ID
export const usePost = (id: number, enabled = true) => {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      // This endpoint might not exist, using a placeholder
      const response = await api.get(`/api/post/${id}`);
      return response.data.data;
    },
    enabled: enabled && !!id,
  });
};

// Fetch posts by user
export const useUserPosts = (userId: number, params?: { page?: number; limit?: number }) => {
  return useInfiniteQuery({
    queryKey: postKeys.userPosts(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/api/getrecentlyuploadedvideo/${userId}`, {
        params: { page: pageParam, limit: params?.limit || 10 }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    enabled: !!userId,
    initialPageParam: 1,
  });
};

// Create new post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: {
      title: string;
      content: string;
      media_url?: string;
      media_type?: 'video' | 'image';
      video_category_id?: number;
    }) => {
      const response = await api.post('/api/create-post', postData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Update post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Post> }) => {
      const response = await api.put(`/api/post/${id}`, data);
      return response.data;
    },
    onSuccess: (result, variables) => {
      // Update the specific post in cache
      queryClient.setQueryData(postKeys.detail(variables.id), result.data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/post/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Like/Unlike post
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await api.post('/api/save-user-post-like', {
        postId,
        userId: localStorage.getItem('UserId') || 0,
        is_liked: true
      });
      return response.data;
    },
    onSuccess: (result, postId) => {
      // Update the post's like status in cache
      queryClient.setQueryData(postKeys.detail(postId), (oldData: Post | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          is_liked: result.data?.is_liked ?? true,
          likeCount: (oldData.likeCount || 0) + 1,
        };
      });

      // Invalidate lists to update like counts
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Add comment to post
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await api.post('/api/save-user-post-comment', {
        postId,
        userId: localStorage.getItem('UserId') || 0,
        comment: content
      });
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate post details and lists to refresh comment counts
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Share post
export const useSharePost = () => {
  return useMutation({
    mutationFn: async (postId: number) => {
      // This might need to be implemented in the backend
      const response = await api.post('/api/share-post', { postId });
      return response.data;
    },
  });
};