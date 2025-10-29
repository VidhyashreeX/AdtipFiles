// src/hooks/api/ads.ts - React Query hooks for advertisement/campaign API calls
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AdCampaign, ApiResponse } from '@/types';

// Query keys for consistent caching
export const adKeys = {
  all: ['ads'] as const,
  campaigns: () => [...adKeys.all, 'campaigns'] as const,
  campaign: (id: number) => [...adKeys.campaigns(), id] as const,
  userCampaigns: (userId: number) => [...adKeys.all, 'user-campaigns', userId] as const,
  adModels: () => [...adKeys.all, 'models'] as const,
  analytics: (campaignId: number) => [...adKeys.all, 'analytics', campaignId] as const,
  targeting: () => [...adKeys.all, 'targeting'] as const,
  orders: () => [...adKeys.all, 'orders'] as const,
  adOrder: (id: number) => [...adKeys.orders(), id] as const,
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

// Get ad models
export const useAdModels = () => {
  return useQuery({
    queryKey: adKeys.adModels(),
    queryFn: async () => {
      const response = await api.get('/api/getadmodels');
      return response.data.data;
    },
  });
};

// Get user's ad campaigns
export const useUserAdCampaigns = (userId?: number) => {
  const currentUserId = userId || localStorage.getItem('UserId');

  return useQuery({
    queryKey: adKeys.userCampaigns(Number(currentUserId)),
    queryFn: async () => {
      if (!currentUserId) throw new Error('User ID required');

      const response = await api.get(`/api/getalladds/${currentUserId}`);
      return response.data.data;
    },
    enabled: !!currentUserId,
  });
};

// Get specific ad campaign
export const useAdCampaign = (campaignId: number, enabled = true) => {
  return useQuery({
    queryKey: adKeys.campaign(campaignId),
    queryFn: async () => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/getaddetails/${campaignId}/${userId}`);
      return response.data.data;
    },
    enabled: enabled && !!campaignId,
  });
};

// Get targeting options
export const useTargetingOptions = () => {
  return useQuery({
    queryKey: adKeys.targeting(),
    queryFn: async () => {
      const [areasRes, professionsRes, buttonsRes] = await Promise.all([
        api.get('/api/gettargetareas'),
        api.get('/api/gettargetprofessions'),
        api.get('/api/getbuttons')
      ]);

      return {
        areas: areasRes.data.data,
        professions: professionsRes.data.data,
        buttons: buttonsRes.data.data,
      };
    },
  });
};

// Create ad campaign - Step 1
export const useCreateAdCampaignStep1 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData: Record<string, unknown>) => {
      const response = await api.post('/api/savefirstpageadmodel', campaignData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user's campaigns
      queryClient.invalidateQueries({ queryKey: adKeys.campaigns() });
    },
  });
};

// Create ad campaign - Step 2 (with media)
export const useCreateAdCampaignStep2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, mediaFile }: { data: Record<string, unknown>; mediaFile?: File }) => {
      const formData = new FormData();

      // Add all data fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Add media file if provided
      if (mediaFile) {
        formData.append('adFile', mediaFile);
      }

      const response = await api.post('/api/savesecondpageadmodel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user's campaigns
      queryClient.invalidateQueries({ queryKey: adKeys.campaigns() });
    },
  });
};

// Create ad campaign - Step 3 (final)
export const useCreateAdCampaignStep3 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData: Record<string, unknown>) => {
      const response = await api.post('/api/savethirdpageadmodel', campaignData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user's campaigns
      queryClient.invalidateQueries({ queryKey: adKeys.campaigns() });
    },
  });
};

// Get campaign analytics
export const useCampaignAnalytics = (campaignId: number, enabled = true) => {
  return useQuery({
    queryKey: adKeys.analytics(campaignId),
    queryFn: async () => {
      const response = await api.post('/api/getgraphdata', { campaignId });
      return response.data.data;
    },
    enabled: enabled && !!campaignId,
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });
};

// Get ad views and likes
export const useAdViewsAndLikes = (userId?: number, adId?: number) => {
  const currentUserId = userId || localStorage.getItem('UserId');

  return useQuery({
    queryKey: [...adKeys.analytics(Number(adId)), 'views-likes'],
    queryFn: async () => {
      if (!currentUserId || !adId) throw new Error('User ID and Ad ID required');

      const response = await api.get(`/api/getadviewsandlikes/${currentUserId}/${adId}`);
      return response.data.data;
    },
    enabled: !!currentUserId && !!adId,
  });
};

// Save ad view/like amount
export const useSaveAdViewAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { adId: number; amount: number; type: 'view' | 'like' }) => {
      const endpoint = data.type === 'view' ? '/api/saveadviewamount' : '/api/saveadlikeamount';
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate analytics for this ad
      queryClient.invalidateQueries({ queryKey: adKeys.analytics(variables.adId) });
    },
  });
};

// Get ad orders
export const useAdOrders = (params?: { page?: number; limit?: number; status?: string }) => {
  return useInfiniteQuery({
    queryKey: adKeys.orders(),
    queryFn: async ({ pageParam = 1 }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/getSellerOrders/${userId}`, {
        params: { ...params, page: pageParam, type: 'ad' }
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
    enabled: !!localStorage.getItem('UserId'),
    initialPageParam: 1,
  });
};

// Get specific ad order
export const useAdOrder = (orderId: number, enabled = true) => {
  return useQuery({
    queryKey: adKeys.adOrder(orderId),
    queryFn: async () => {
      const response = await api.get(`/api/ad-order/${orderId}`);
      return response.data.data;
    },
    enabled: enabled && !!orderId,
  });
};

// Pause/Continue campaign
export const usePauseContinueCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, action }: { campaignId: number; action: 'pause' | 'continue' }) => {
      const response = await api.post('/api/saveadpausecountinuestatus', {
        campaignId,
        status: action
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate campaign data
      queryClient.invalidateQueries({ queryKey: adKeys.campaign(variables.campaignId) });
      queryClient.invalidateQueries({ queryKey: adKeys.campaigns() });
    },
  });
};

// Block ad
export const useBlockAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { adId: number; reason?: string }) => {
      const response = await api.post('/api/adblock', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate campaigns
      queryClient.invalidateQueries({ queryKey: adKeys.campaigns() });
    },
  });
};

// Get blocked ads
export const useBlockedAds = () => {
  return useQuery({
    queryKey: [...adKeys.all, 'blocked'],
    queryFn: async () => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/getblockadbycompany/${userId}`);
      return response.data.data;
    },
    enabled: !!localStorage.getItem('UserId'),
  });
};

// Request demo
export const useRequestDemo = () => {
  return useMutation({
    mutationFn: async (demoData: Record<string, unknown>) => {
      const response = await api.post('/api/requestdemo', demoData);
      return response.data;
    },
  });
};

// Validate coupon
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async (couponData: { code: string; amount: number }) => {
      const response = await api.post('/api/validatecoupon', couponData);
      return response.data;
    },
  });
};