import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useShortsInfiniteQuery,
  useGuestShortsQuery,
  useSingleShortQuery,
  type ShortVideo as TanStackShortVideo
} from '../../../hooks/useShortsQuery';
import { TipShortsLogger } from '../../../utils/logger';

type ShortVideo = TanStackShortVideo;

interface TipShortsDataContextType {
  shorts: ShortVideo[];
  isLoading: boolean;
  error: any;
  fetchNextPage: () => Promise<any>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<any>;
  isRefetching: boolean;
}

const TipShortsDataContext = createContext<TipShortsDataContextType | null>(null);

export const useTipShortsData = () => {
  const context = useContext(TipShortsDataContext);
  if (!context) {
    throw new Error('useTipShortsData must be used within TipShortsDataProvider');
  }
  return context;
};

interface TipShortsDataProviderProps {
  children: React.ReactNode;
  passedShorts?: ShortVideo[];
  shortId?: string;
}

export const TipShortsDataProvider: React.FC<TipShortsDataProviderProps> = ({
  children,
  passedShorts,
  shortId,
}) => {
  const { user, isGuest } = useAuth();

  // TanStack Query hooks - use different hooks based on guest mode
  const authenticatedShortsQuery = useShortsInfiniteQuery(user?.id?.toString() || '50816');
  const guestShortsQuery = useGuestShortsQuery();

  // Choose the appropriate query based on guest mode
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = isGuest ? {
    data: guestShortsQuery.data,
    isLoading: guestShortsQuery.isLoading,
    error: guestShortsQuery.error,
    fetchNextPage: () => Promise.resolve({ data: undefined, pageParam: undefined, direction: 'forward' as const }),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: guestShortsQuery.refetch,
    isRefetching: guestShortsQuery.isRefetching,
  } : authenticatedShortsQuery;

  // Single short query for deep linking
  const singleShortQuery = useSingleShortQuery(shortId ?? null, user?.id?.toString() ?? undefined);

  // Flatten data from TanStack Query with deep link handling
  const shorts: ShortVideo[] = useMemo(() => {
    let apiShorts: ShortVideo[] = [];
    
    // Get shorts from API (paginated)
    if (isGuest && data?.pages) {
      apiShorts = data.pages.flatMap(page => {
        if (Array.isArray(page)) {
          return page;
        } else if (page && typeof page === 'object' && 'data' in page) {
          return page.data || [];
        }
        return [];
      });
      apiShorts = apiShorts.slice(0, 5);
    } else if (data?.pages) {
      apiShorts = data.pages.flatMap(page => {
        if (Array.isArray(page)) {
          return page;
        } else if (page && typeof page === 'object' && 'data' in page) {
          return page.data || [];
        }
        return [];
      });
    }

    // Merge passedShorts (from navigation) with API shorts, deduplicating by id
    let mergedShorts: ShortVideo[] = [];
    if (passedShorts && passedShorts.length > 0) {
      // Remove any apiShorts that are already in passedShorts (by id)
      const passedIds = new Set(passedShorts.map(s => s.id));
      const filteredApiShorts = apiShorts.filter(s => !passedIds.has(s.id));
      mergedShorts = [...passedShorts, ...filteredApiShorts];
      // For guest users, limit to first 5 shorts
      if (isGuest) mergedShorts = mergedShorts.slice(0, 5);
    } else {
      mergedShorts = apiShorts;
    }

    // Handle deep link: if we have a specific short from deep link and it's not in the current list
    if (shortId && singleShortQuery.data && !singleShortQuery.isLoading) {
      const deepLinkedShort = singleShortQuery.data;
      const isShortInList = mergedShorts.some(short => short.id === deepLinkedShort.id);
      if (!isShortInList) {
        mergedShorts = [deepLinkedShort, ...mergedShorts];
      }
    }

    // Filter out shorts with invalid video URLs to prevent URI errors
    const validShorts = mergedShorts.filter(short => {
      const hasValidVideoUrl = short?.videoUrl &&
                              typeof short.videoUrl === 'string' &&
                              short.videoUrl.trim().length > 0 &&
                              short.videoUrl !== 'null' &&
                              short.videoUrl !== 'undefined';

      if (!hasValidVideoUrl) {
        TipShortsLogger.warn('Filtering out short with invalid videoUrl:', {
          id: short?.id,
          videoUrl: short?.videoUrl,
          title: short?.title || 'Unknown'
        });
      }

      return hasValidVideoUrl;
    });

    TipShortsLogger.debug(`Filtered ${mergedShorts.length - validShorts.length} shorts with invalid video URLs`);

    return validShorts;
  }, [data?.pages, passedShorts, isGuest, shortId, singleShortQuery.data, singleShortQuery.isLoading]);

  useEffect(() => {
    TipShortsLogger.debug('TipShortsDataProvider - shorts array:', shorts);
    TipShortsLogger.debug('TipShortsDataProvider - isGuest:', isGuest);
    TipShortsLogger.debug('TipShortsDataProvider - data structure:', data);
    TipShortsLogger.debug('TipShortsDataProvider - isLoading:', isLoading);
    TipShortsLogger.debug('TipShortsDataProvider - error:', error);
  }, [shorts, isGuest, data, isLoading, error]);

  const contextValue: TipShortsDataContextType = {
    shorts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  };

  return (
    <TipShortsDataContext.Provider value={contextValue}>
      {children}
    </TipShortsDataContext.Provider>
  );
};
