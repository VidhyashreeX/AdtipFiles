import { useState, useEffect, useCallback, useRef } from 'react';
import OptimizedAsyncStorage from '../services/OptimizedAsyncStorage';

/**
 * Hook for using optimized AsyncStorage with automatic state management
 */
export const useOptimizedAsyncStorage = <T = string>(
  key: string,
  defaultValue?: T,
  parser?: (value: string) => T,
  serializer?: (value: T) => string
) => {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  // Default parser and serializer
  const parseValue = useCallback((storedValue: string | null): T | undefined => {
    if (storedValue === null) return defaultValue;
    
    try {
      if (parser) {
        return parser(storedValue);
      }
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(storedValue) as T;
      } catch {
        return storedValue as T;
      }
    } catch (err) {
      console.warn(`[useOptimizedAsyncStorage] Error parsing value for key ${key}:`, err);
      return defaultValue;
    }
  }, [key, defaultValue, parser]);

  const serializeValue = useCallback((val: T): string => {
    if (serializer) {
      return serializer(val);
    }
    
    if (typeof val === 'string') {
      return val;
    }
    
    return JSON.stringify(val);
  }, [serializer]);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const storedValue = await OptimizedAsyncStorage.getItem(key);
        const parsedValue = parseValue(storedValue);
        
        if (isMountedRef.current) {
          setValue(parsedValue);
        }
      } catch (err) {
        console.error(`[useOptimizedAsyncStorage] Error loading value for key ${key}:`, err);
        if (isMountedRef.current) {
          setError(err as Error);
          setValue(defaultValue);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadValue();
  }, [key, defaultValue, parseValue]);

  // Update value
  const updateValue = useCallback(async (newValue: T) => {
    try {
      setError(null);
      
      const serializedValue = serializeValue(newValue);
      await OptimizedAsyncStorage.setItem(key, serializedValue);
      
      if (isMountedRef.current) {
        setValue(newValue);
      }
    } catch (err) {
      console.error(`[useOptimizedAsyncStorage] Error updating value for key ${key}:`, err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  }, [key, serializeValue]);

  // Remove value
  const removeValue = useCallback(async () => {
    try {
      setError(null);
      
      await OptimizedAsyncStorage.removeItem(key);
      
      if (isMountedRef.current) {
        setValue(defaultValue);
      }
    } catch (err) {
      console.error(`[useOptimizedAsyncStorage] Error removing value for key ${key}:`, err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  }, [key, defaultValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    value,
    setValue: updateValue,
    removeValue,
    loading,
    error,
  };
};

/**
 * Hook for batch operations with multiple keys
 */
export const useOptimizedAsyncStorageBatch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const batchGet = useCallback(async (keys: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await OptimizedAsyncStorage.multiGet(keys);
      return results;
    } catch (err) {
      console.error('[useOptimizedAsyncStorageBatch] Error in batchGet:', err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const batchSet = useCallback(async (keyValuePairs: [string, string][]) => {
    try {
      setLoading(true);
      setError(null);
      
      await OptimizedAsyncStorage.multiSet(keyValuePairs);
    } catch (err) {
      console.error('[useOptimizedAsyncStorageBatch] Error in batchSet:', err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const batchRemove = useCallback(async (keys: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      await OptimizedAsyncStorage.multiRemove(keys);
    } catch (err) {
      console.error('[useOptimizedAsyncStorageBatch] Error in batchRemove:', err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    batchGet,
    batchSet,
    batchRemove,
    loading,
    error,
  };
};

/**
 * Hook for managing user preferences with optimized storage
 */
export const useUserPreferences = <T extends Record<string, any>>(
  defaultPreferences: T
) => {
  const PREFERENCES_KEY = '@user_preferences';
  
  const {
    value: preferences,
    setValue: setPreferences,
    loading,
    error,
  } = useOptimizedAsyncStorage<T>(
    PREFERENCES_KEY,
    defaultPreferences,
    (value) => JSON.parse(value) as T,
    (value) => JSON.stringify(value)
  );

  const updatePreference = useCallback(async <K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    if (!preferences) return;
    
    const newPreferences = { ...preferences, [key]: value };
    await setPreferences(newPreferences);
  }, [preferences, setPreferences]);

  const resetPreferences = useCallback(async () => {
    await setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences: preferences || defaultPreferences,
    updatePreference,
    resetPreferences,
    loading,
    error,
  };
};

/**
 * Hook for managing app cache with TTL
 */
export const useAppCache = () => {
  const getCachedData = useCallback(async <T>(
    key: string,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T | null> => {
    try {
      const cachedItem = await OptimizedAsyncStorage.getItem(`cache_${key}`);
      if (!cachedItem) return null;

      const { data, timestamp } = JSON.parse(cachedItem);
      
      // Check if cache is expired
      if (Date.now() - timestamp > ttl) {
        await OptimizedAsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('[useAppCache] Error getting cached data:', error);
      return null;
    }
  }, []);

  const setCachedData = useCallback(async <T>(key: string, data: T) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      
      await OptimizedAsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('[useAppCache] Error setting cached data:', error);
    }
  }, []);

  const clearCache = useCallback(async (keyPattern?: string) => {
    try {
      const allKeys = await OptimizedAsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => {
        if (keyPattern) {
          return key.startsWith('cache_') && key.includes(keyPattern);
        }
        return key.startsWith('cache_');
      });
      
      if (cacheKeys.length > 0) {
        await OptimizedAsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('[useAppCache] Error clearing cache:', error);
    }
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
  };
};

export default useOptimizedAsyncStorage;
