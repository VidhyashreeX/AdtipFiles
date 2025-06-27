// src/hooks/useDataLayer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import ApiService from '../services/ApiService';
import { ENDPOINTS } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache manager for offline support
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
      const keys = Array.from(this.memoryCache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => this.memoryCache.delete(key));
    } else {
      this.memoryCache.clear();
    }
  }
}

// Custom hook for paginated data with offline support
export const usePaginatedData = <T>(
  endpoint: string,
  params: Record<string, any> = {},
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheKey?: string;
  } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTime = useRef(0);
  const { enabled = true, staleTime = 5 * 60 * 1000, cacheKey } = options;

  // Network status tracking
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!enabled) return;
    
    const now = Date.now();
    if (now - lastFetchTime.current < 500 && append) return; // Debounce
    
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const requestParams = { ...params, page: pageNum, limit: 10 };
      const key = cacheKey || `${endpoint}-${JSON.stringify(requestParams)}`;
      
      // Try cache first if offline
      if (!isOnline) {
        const cached = await CacheManager.get(key);
        if (cached) {
          if (append) {
            setData(prev => [...prev, ...cached.data]);
          } else {
            setData(cached.data);
          }
          return;
        }
        throw new Error('No internet connection and no cached data');
      }

      const response = await ApiService.get(endpoint, requestParams, {
        signal: abortControllerRef.current.signal
      });

      lastFetchTime.current = now;

      if (response?.data) {
        const newData = Array.isArray(response.data) ? response.data : [];
        
        // Cache the response
        await CacheManager.set(key, { data: newData }, staleTime);
        
        if (append) {
          setData(prev => [...prev, ...newData]);
        } else {
          setData(newData);
          setPage(1);
        }
        
        setHasMore(newData.length === 10); // Assuming limit is 10
        if (append) {
          setPage(prev => prev + 1);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [endpoint, params, enabled, isOnline, staleTime, cacheKey]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      fetchData(page + 1, true);
    }
  }, [fetchData, hasMore, isLoading, isLoadingMore, page]);

  const refresh = useCallback(() => {
    if (cacheKey) {
      CacheManager.clear(cacheKey);
    }
    setPage(1);
    setHasMore(true);
    fetchData(1, false);
  }, [fetchData, cacheKey]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(1, false);
    }
  }, [fetchData, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    isOnline,
  };
};

// Custom hook for single data fetch with caching
export const useCachedData = <T>(
  endpoint: string,
  params: Record<string, any> = {},
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheKey?: string;
    refetchInterval?: number;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { enabled = true, staleTime = 5 * 60 * 1000, cacheKey, refetchInterval } = options;

  // Network status tracking
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const key = cacheKey || `${endpoint}-${JSON.stringify(params)}`;
      
      // Try cache first if offline
      if (!isOnline) {
        const cached = await CacheManager.get(key);
        if (cached) {
          setData(cached);
          return;
        }
        throw new Error('No internet connection and no cached data');
      }

      const response = await ApiService.get(endpoint, params, {
        signal: abortControllerRef.current.signal
      });

      if (response) {
        // Cache the response
        await CacheManager.set(key, response, staleTime);
        setData(response);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch data');
        
        // Try to load from cache on error
        const key = cacheKey || `${endpoint}-${JSON.stringify(params)}`;
        const cached = await CacheManager.get(key);
        if (cached) {
          setData(cached);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, params, enabled, isOnline, staleTime, cacheKey]);

  const refresh = useCallback(() => {
    if (cacheKey) {
      CacheManager.clear(cacheKey);
    }
    fetchData();
  }, [fetchData, cacheKey]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh,
    isOnline,
  };
};

// Optimistic update manager
export class OptimisticUpdateManager {
  private static updates = new Map<string, any>();

  static add(key: string, update: any) {
    this.updates.set(key, update);
  }

  static remove(key: string) {
    this.updates.delete(key);
  }

  static get(key: string) {
    return this.updates.get(key);
  }

  static clear() {
    this.updates.clear();
  }
}

// Custom hook for mutations with optimistic updates
export const useMutation = <T>(
  mutationFn: (variables: T) => Promise<any>,
  options: {
    onMutate?: (variables: T) => void;
    onSuccess?: (data: any, variables: T) => void;
    onError?: (error: Error, variables: T) => void;
    onSettled?: () => void;
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: T) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call onMutate for optimistic updates
      if (options.onMutate) {
        options.onMutate(variables);
      }

      const result = await mutationFn(variables);
      
      if (options.onSuccess) {
        options.onSuccess(result, variables);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      
      if (options.onError) {
        options.onError(error, variables);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
      
      if (options.onSettled) {
        options.onSettled();
      }
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
};

export { CacheManager };
