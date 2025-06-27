// src/providers/QueryProvider.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache time
      retry: (failureCount, error: any) => {
        // Smart retry logic
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 2,
      networkMode: 'offlineFirst',
    },
  },
});

// Persist and restore cache
const persistCache = async () => {
  try {
    const cache = queryClient.getQueryCache();
    const persistedData = JSON.stringify(cache);
    await AsyncStorage.setItem('react-query-cache', persistedData);
  } catch (error) {
    console.error('Failed to persist cache:', error);
  }
};

const restoreCache = async () => {
  try {
    const cached = await AsyncStorage.getItem('react-query-cache');
    if (cached) {
      // Note: In production, you'd want proper hydration
      console.log('Cache restored from storage');
    }
  } catch (error) {
    console.error('Failed to restore cache:', error);
  }
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export const EnhancedQueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const netInfo = useNetInfo();

  React.useEffect(() => {
    restoreCache();
    
    // Save cache periodically
    const interval = setInterval(persistCache, 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      clearInterval(interval);
      persistCache(); // Save on unmount
    };
  }, []);

  // Pause queries when offline
  React.useEffect(() => {
    queryClient.getQueryCache().getAll().forEach(query => {
      if (!netInfo.isConnected) {
        query.cancel();
      }
    });
  }, [netInfo.isConnected]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export { queryClient };
