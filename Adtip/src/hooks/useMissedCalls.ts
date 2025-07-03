import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import ApiService from '../services/ApiService';
import { ApiResponse, Contact } from '../types/api';

interface UseMissedCallsOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export const useMissedCalls = (
  userId?: string,
  options: UseMissedCallsOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const query = useInfiniteQuery({
    queryKey: ['missed-calls', userId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) {
        throw new Error('User ID is required to fetch missed calls');
      }

      console.log('[useMissedCalls] Fetching missed calls:', {
        userId,
        page: pageParam,
        limit: 20,
      });

      try {
        const response = await ApiService.getMissedCalls(userId, pageParam, 20);
        
        console.log('[useMissedCalls] API Response:', {
          status: response.status,
          dataLength: response.data?.length || 0,
          hasData: !!response.data,
        });

        return {
          data: response.data || [],
          pagination: response.pagination || {
            page: pageParam,
            limit: 20,
            totalRecords: 0,
          },
          hasNextPage: response.pagination ? 
            pageParam < Math.ceil((response.pagination.totalRecords || 0) / 20) : 
            false,
        };
      } catch (error) {
        console.error('[useMissedCalls] Error fetching missed calls:', error);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      
      const { page = 1, limit = 20, totalRecords = 0 } = lastPage.pagination;
      const totalPages = Math.ceil(totalRecords / limit);
      
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: enabled && !!userId,
    staleTime,
    gcTime: cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Calculate total missed calls count across all pages
  const totalMissedCallsCount = useMemo(() => {
    if (!query.data?.pages) return 0;
    
    // Get the total from the first page's pagination, or sum all pages
    const firstPage = query.data.pages[0];
    if (firstPage?.pagination?.totalRecords) {
      return firstPage.pagination.totalRecords;
    }
    
    // Fallback: sum all loaded pages
    return query.data.pages.reduce((total, page) => total + (page.data?.length || 0), 0);
  }, [query.data?.pages]);

  return {
    ...query,
    totalMissedCallsCount,
  };
};

// Hook specifically for getting missed calls count (lightweight)
export const useMissedCallsCount = (userId?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['missed-calls-count', userId],
    queryFn: async (): Promise<{ count: number }> => {
      if (!userId) return { count: 0 };

      try {
        // Fetch only first page to get total count
        const response = await ApiService.getMissedCalls(userId, 1, 1);
        return {
          count: response.pagination?.totalRecords || response.data?.length || 0,
        };
      } catch (error) {
        console.error('[useMissedCallsCount] Error:', error);
        return { count: 0 };
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (replaced cacheTime)
    retry: 1,
  });

  return {
    count: data?.count || 0,
    isLoading,
    error,
  };
};
