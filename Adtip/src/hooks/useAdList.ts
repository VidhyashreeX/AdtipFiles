/**
 * useAdList Hook
 * 
 * Custom hook for fetching and managing available ads list.
 * Supports filtering by ad type, pagination, and refresh functionality.
 * 
 * Features:
 * - Fetch ads from backend API
 * - Filter by ad type (optional)
 * - Pagination support with infinite scroll
 * - Loading and error states
 * - Manual refresh capability
 * - Automatic retry on error
 * 
 * @example
 * ```tsx
 * const {
 *   ads,
 *   filteredAds,
 *   isLoading,
 *   isRefreshing,
 *   error,
 *   hasMore,
 *   refetch,
 *   loadMore,
 *   setAdTypeFilter
 * } = useAdList(userId);
 * 
 * // Display ads
 * <FlatList
 *   data={filteredAds}
 *   renderItem={({item}) => <AdCard ad={item} />}
 *   onEndReached={loadMore}
 *   onRefresh={refetch}
 *   refreshing={isRefreshing}
 * />
 * 
 * // Filter by ad type
 * setAdTypeFilter(AdModelType.SKIP);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { AdModelType, getAdModelType } from '../types/ads';

interface Ad {
  AD_ID: number;
  AD_MODEL_ID: number;
  COMPANY_ID: number;
  CAMPAIGN_NAME: string;
  campaign_name?: string;
  AD_OBJECTIVE: string;
  TITLE: string | null;
  DESCRIPTION: string | null;
  AD_FILE_URL: string | null;
  ad_media_url?: string | null;
  AD_WEBSITE_URL: string | null;
  TARGET_URL: string | null;
  AD_START_DATE: string;
  AD_END_DATE: string;
  DAILY_BUDGET: number;
  TOTAL_BUDGET: number;
  STATUS: string;
  createdAt: string;
  updatedAt: string;
  
  // Computed properties
  adType?: AdModelType;
  payoutAmount?: number;
  requiredWatchTime?: number;
  skipAfterSeconds?: number;
}

interface AdListResponse {
  ads: Ad[];
  total: number;
  page: number;
  limit: number;
}

interface UseAdListOptions {
  initialAdType?: AdModelType | null;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseAdListReturn {
  ads: Ad[];
  filteredAds: Ad[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalAds: number;
  adTypeFilter: AdModelType | null;
  
  // Actions
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  setAdTypeFilter: (adType: AdModelType | null) => void;
  clearError: () => void;
}

export const useAdList = (
  userId?: number,
  options: UseAdListOptions = {}
): UseAdListReturn => {
  const {
    initialAdType = null,
    pageSize = 20,
    autoFetch = true
  } = options;
  
  // State
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [adTypeFilter, setAdTypeFilter] = useState<AdModelType | null>(initialAdType);
  
  /**
   * Fetch ads from backend
   */
  const fetchAds = useCallback(async (
    pageNum: number = 1,
    isRefresh: boolean = false,
    isLoadMore: boolean = false
  ) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      // Get auth token
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Build API URL
      const url = `${API_BASE_URL}${API_ENDPOINTS.AD_VIEWER.GET_ALL_ADS}`;
      
      // Make API request
      const response = await axios.get<AdListResponse>(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: pageNum,
          limit: pageSize,
          status: 'active' // Only fetch active ads
        }
      });
      
      const { ads: fetchedAds, total } = response.data;
      
      // Enhance ads with computed properties
      const enhancedAds = fetchedAds.map(ad => ({
        ...ad,
        adType: getAdModelType(ad.AD_MODEL_ID),
        // Add campaign_name fallback
        campaign_name: ad.campaign_name || ad.CAMPAIGN_NAME,
        // Add media URL fallback
        ad_media_url: ad.ad_media_url || ad.AD_FILE_URL
      }));
      
      // Update state
      if (isRefresh || pageNum === 1) {
        setAds(enhancedAds);
        setPage(1);
      } else {
        // Append for load more
        setAds(prev => [...prev, ...enhancedAds]);
      }
      
      setTotalAds(total);
      setHasMore(enhancedAds.length === pageSize);
      
      if (!isRefresh && !isLoadMore) {
        setPage(pageNum);
      }
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message ||
                          err.message || 
                          'Failed to fetch ads';
      setError(errorMessage);
      console.error('Fetch ads error:', err);
      
      // If it's a network error, set hasMore to true so user can retry
      if (err.message === 'Network Error') {
        setHasMore(true);
      }
      
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [pageSize]);
  
  /**
   * Refetch ads (pull to refresh)
   */
  const refetch = useCallback(async () => {
    await fetchAds(1, true, false);
  }, [fetchAds]);
  
  /**
   * Load more ads (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || !hasMore) {
      return;
    }
    
    const nextPage = page + 1;
    await fetchAds(nextPage, false, true);
    setPage(nextPage);
  }, [isLoadingMore, isLoading, hasMore, page, fetchAds]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Filter ads by ad type
   */
  const filteredAds = useMemo(() => {
    if (!adTypeFilter) {
      return ads;
    }
    
    return ads.filter(ad => ad.adType === adTypeFilter);
  }, [ads, adTypeFilter]);
  
  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAds(1);
    }
  }, [autoFetch]); // Only run once on mount
  
  return {
    ads,
    filteredAds,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    page,
    totalAds,
    adTypeFilter,
    
    // Actions
    refetch,
    loadMore,
    setAdTypeFilter,
    clearError,
  };
};

export default useAdList;
