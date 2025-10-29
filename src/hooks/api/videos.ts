// src/hooks/api/videos.ts - React Query hooks for videos-related API calls
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

// Query keys for consistent caching
export const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...videoKeys.lists(), filters] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: number) => [...videoKeys.details(), id] as const,
  shorts: () => [...videoKeys.all, 'shorts'] as const,
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

// Fetch videos with pagination and category filtering
export const useVideos = (params?: {
  category?: number;
  user_id?: number;
  limit?: number;
}) => {
  return useInfiniteQuery({
    queryKey: videoKeys.list(params || {}),
    queryFn: async ({ pageParam = 1 }) => {
      const usePublicApi = !localStorage.getItem("UserLoggedIn") || !params?.user_id;
      const categoryId = params?.category || 0;

      const endpoint = usePublicApi
        ? `/api/getpublicvideos/${categoryId}/${pageParam}`
        : `/api/getvideos/${params?.user_id}/${categoryId}/${pageParam}`;

      const response = await api.get(endpoint);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // Check if there are more videos based on the response
      const videoList = Array.isArray(lastPage.data) ? lastPage.data : [];
      return videoList.length > 0 ? (lastPage.currentPage || 1) + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Fetch shorts
export const useShorts = (params?: {
  user_id?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: videoKeys.shorts(),
    queryFn: async () => {
      const usePublicApi = !localStorage.getItem("UserLoggedIn") || !params?.user_id;

      const endpoint = usePublicApi
        ? `/api/getpublicshots`
        : `/api/getshots/${params?.user_id}`;

      const response = await api.get(endpoint);
      return response.data;
    },
  });
};

// Fetch shorts with infinite scroll
export const useShortsInfinite = (params?: {
  user_id?: number;
  shortId?: string; // For deep linking to specific short
}) => {
  return useInfiniteQuery({
    queryKey: videoKeys.shorts(),
    queryFn: async ({ pageParam = 1 }) => {
      const usePublicApi = !localStorage.getItem("UserLoggedIn") || !params?.user_id;
      const userId = params?.user_id || localStorage.getItem("userId") || "50816";

      // Handle deep linking to specific short
      if (params?.shortId) {
        const endpoint = `/api/getShortById/${userId}/${params.shortId}`;
        const response = await api.get(endpoint);
        return {
          ...response.data,
          isSingleShort: true, // Flag to indicate this is a single short response
        };
      }

      // Normal paginated feed
      const endpoint = usePublicApi
        ? `/api/getpublicshots`
        : `/api/getshots/${userId}`;

      const response = await api.get(endpoint);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // For single short mode, no pagination
      if (lastPage.isSingleShort) return undefined;

      // Check if there are more shorts based on the response
      const shortsList = Array.isArray(lastPage.data) ? lastPage.data : [];
      // Since the API doesn't provide pagination info, we'll simulate it
      // In a real implementation, you'd check for pagination metadata
      return shortsList.length > 0 ? undefined : undefined; // For now, no pagination
    },
    initialPageParam: 1,
  });
};

// Fetch single video by ID
export const useVideo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/video/${id}`);
      return response.data.data;
    },
    enabled: enabled && !!id,
  });
};