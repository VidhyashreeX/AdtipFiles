import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import ApiService from '../services/ApiService';
import { ENDPOINTS } from '../constants/api';
import { getSecureMediaUrl, getFallbackAvatarUrl } from '../utils/mediaUtils';

export interface ShortVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    subscribers: number;
  };
  views: number;
  likes: number;
  duration: string;
  createdAt: string;
  category: string;
  isPaidPromotional?: boolean;
  postedAt: string;
  description: string;
  videoUrl: string;
  comments: number;
  musicName?: string;
  isLiked?: boolean; // Add isLiked field to track like status
}

export interface PublicShot {
  id: number;
  name: string;
  category_id: number;
  video_link: string;
  video_description: string;
  total_views: number;
  total_likes: number;
  createddate: string;
  video_Thumbnail: string;
  channelName: string;
  channel_profile: string;
  channelId: number;
  total_comments: number;
  play_duration: string;
  is_paid_promotional: number;
  total_channel_followers: number;
}

export const SHORTS_QUERY_KEY = 'shorts';
export const SINGLE_SHORT_QUERY_KEY = 'single-short';
const PAGE_SIZE = 10;

async function fetchShortsPage(pageParam: number, userId: string): Promise<ShortVideo[]> {
  const apiUrl = `${ENDPOINTS.GET_SHORTS}/${userId}?page=${pageParam}&limit=${PAGE_SIZE}`;
  
  console.log(`[TanStack] Fetching shorts page ${pageParam}`);
  
  const response = await ApiService.get(apiUrl);

  if (!response || (!response.data && response.status !== 200)) {
    throw new Error('Failed to load shorts');
  }

  const publicShots: PublicShot[] = Array.isArray(response.data)
    ? response.data
    : response.data.status === 200 && Array.isArray(response.data.data)
      ? response.data.data
      : [];

  // Transform and secure URLs in parallel
  const mappedShorts: ShortVideo[] = (await Promise.all(
    publicShots.map(async (shot: PublicShot) => ({
      id: shot.id?.toString() || Math.random().toString(),
      title: shot.name || 'Untitled Short',
      thumbnail: shot.video_Thumbnail && shot.video_Thumbnail !== 'undefined'
        ? (await getSecureMediaUrl(shot.video_Thumbnail)) || null
        : null,
      channel: {
        id: shot.channelId?.toString() || 'unknownChannel',
        name: shot.channelName || 'Unknown Channel',
        avatar: shot.channel_profile && shot.channel_profile !== 'null'
          ? (await getSecureMediaUrl(shot.channel_profile)) || getFallbackAvatarUrl(shot.channelId || Math.random().toString())
          : getFallbackAvatarUrl(shot.channelId || Math.random().toString()),
        verified: false,
        subscribers: shot.total_channel_followers || 0,
      },
      views: shot.total_views || 0,
      likes: shot.total_likes || 0,
      duration: shot.play_duration || '0:00',
      createdAt: shot.createddate || new Date().toISOString(),
      category: shot.category_id?.toString() || '1',
      isPaidPromotional: shot.is_paid_promotional === 1,
      postedAt: shot.createddate || new Date().toISOString(),
      description: shot.video_description && shot.video_description !== 'undefined'
        ? shot.video_description
        : 'No description available',
      videoUrl: (await getSecureMediaUrl(shot.video_link || '')) || '',
      comments: shot.total_comments || 0,
      musicName: shot.name || 'Original Sound',
    }))
  )).filter(short => short.videoUrl && short.videoUrl.startsWith('http'));

  console.log(`[TanStack] Successfully mapped ${mappedShorts.length} shorts for page ${pageParam}`);
  
  return mappedShorts;
}

export function useShortsInfiniteQuery(userId: string = '50816') {
  return useInfiniteQuery({
    queryKey: [SHORTS_QUERY_KEY, userId],
    queryFn: ({ pageParam }) => fetchShortsPage(pageParam, userId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // If the last page has less than PAGE_SIZE items, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst',
  });
}

export function useShortsQueryActions() {
  const queryClient = useQueryClient();

  const invalidateShorts = useCallback((userId?: string) => {
    if (userId) {
      return queryClient.invalidateQueries({ 
        queryKey: [SHORTS_QUERY_KEY, userId] 
      });
    }
    return queryClient.invalidateQueries({ 
      queryKey: [SHORTS_QUERY_KEY] 
    });
  }, [queryClient]);

  const prefetchNextPage = useCallback((userId: string, currentPage: number) => {
    return queryClient.prefetchQuery({
      queryKey: [SHORTS_QUERY_KEY, userId, currentPage + 1],
      queryFn: () => fetchShortsPage(currentPage + 1, userId),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const updateShortLikes = useCallback((userId: string, shortId: string, newLikes: number) => {
    queryClient.setQueryData([SHORTS_QUERY_KEY, userId], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: ShortVideo[]) =>
          page.map((short: ShortVideo) =>
            short.id === shortId 
              ? { ...short, likes: newLikes }
              : short
          )
        ),
      };
    });
  }, [queryClient]);

  return {
    invalidateShorts,
    prefetchNextPage,
    updateShortLikes,
  };
}

// Like mutation for shorts
export function useLikeShortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      shortId, 
      userId, 
      creatorId, 
      isLiked 
    }: {
      shortId: string;
      userId: string;
      creatorId: string;
      isLiked: boolean;
    }) => {
      return ApiService.likeShortVideo({
        reelId: parseInt(shortId),
        userId: parseInt(userId),
        like: isLiked ? 1 : 0,
        reelCreatorId: parseInt(creatorId),
      });
    },
    onMutate: async ({ shortId, userId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [SHORTS_QUERY_KEY, userId] });

      // Snapshot previous value
      const previousShorts = queryClient.getQueryData([SHORTS_QUERY_KEY, userId]);

      // Optimistically update
      queryClient.setQueryData([SHORTS_QUERY_KEY, userId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: ShortVideo[]) =>
            page.map((short: ShortVideo) =>
              short.id === shortId
                ? {
                    ...short,
                    likes: short.likes + (isLiked ? 1 : -1),
                    isLiked: isLiked
                  }
                : short
            )
          ),
        };
      });

      return { previousShorts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousShorts) {
        queryClient.setQueryData([SHORTS_QUERY_KEY, variables.userId], context.previousShorts);
      }
    },
  });
}

// Guest Shorts hook for unauthenticated users
export const useGuestShortsQuery = () => {
  return useQuery({
    queryKey: ['guest-shorts'],
    queryFn: async () => {
      console.log('[useGuestShortsQuery] Fetching guest shorts...');

      // Call the guest API that doesn't require authentication
      const data = await ApiService.getPublicShots();

      console.log('[useGuestShortsQuery] Raw API response:', data);

      // Transform PublicShot[] to ShortVideo[] format with proper null checks
      const transformedShorts: ShortVideo[] = (data.data || [])
        .filter((shot: PublicShot) => {
          const isValid = shot && shot.id && shot.channelId && shot.video_link;
          if (!isValid) {
            console.warn('[useGuestShortsQuery] Filtering out invalid shot:', shot);
          }
          return isValid;
        })
        .map((shot: PublicShot) => {
          const transformed = {
            id: shot.id?.toString() || 'unknown',
            title: shot.name || 'Untitled Short',
            thumbnail: shot.video_Thumbnail || null,
            channel: {
              id: shot.channelId?.toString() || 'unknown',
              name: shot.channelName || 'Unknown Channel',
              avatar: shot.channel_profile || getFallbackAvatarUrl(shot.channelId || 0),
              verified: false,
              subscribers: shot.total_channel_followers || 0,
            },
            views: shot.total_views || 0,
            likes: shot.total_likes || 0,
            duration: shot.play_duration || '0:00',
            createdAt: shot.createddate || new Date().toISOString(),
            category: shot.category_id?.toString() || '0',
            isPaidPromotional: shot.is_paid_promotional === 1,
            postedAt: shot.createddate || new Date().toISOString(),
            description: shot.video_description || '',
            videoUrl: shot.video_link || '',
            comments: shot.total_comments || 0,
            musicName: undefined,
          };

          console.log('[useGuestShortsQuery] Transformed short:', {
            id: transformed.id,
            title: transformed.title,
            videoUrl: transformed.videoUrl,
            channelName: transformed.channel.name
          });

          return transformed;
        });

      console.log('[useGuestShortsQuery] Total transformed shorts:', transformedShorts.length);

      return {
        pages: [{
          data: transformedShorts,
          nextCursor: null,
        }],
        pageParams: [null],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
};

// Hook to fetch a single short by ID (for deep linking)
export const useSingleShortQuery = (shortId: string | null, userId?: string) => {
  return useQuery({
    queryKey: [SINGLE_SHORT_QUERY_KEY, shortId, userId],
    queryFn: async () => {
      if (!shortId) {
        throw new Error('Short ID is required');
      }

      console.log('[useSingleShortQuery] Fetching short by ID:', shortId, 'for user:', userId);

      try {
        // Use the getShortById endpoint
        const response = await ApiService.get(`/api/getShortById/${userId || '0'}/${shortId}`);

        if (response.status === 200 && response.data && response.data.length > 0) {
          const rawShort = response.data[0];

          // Transform the raw data to match ShortVideo interface
          const transformedShort: ShortVideo = {
            id: rawShort.id.toString(),
            title: rawShort.name || '',
            thumbnail: rawShort.video_Thumbnail ? getSecureMediaUrl(rawShort.video_Thumbnail) : null,
            channel: {
              id: rawShort.channelId?.toString() || '',
              name: rawShort.channelName || 'Unknown Channel',
              avatar: rawShort.channel_profile ? getSecureMediaUrl(rawShort.channel_profile) : getFallbackAvatarUrl(),
              verified: false,
              subscribers: rawShort.total_channel_followers || 0,
            },
            views: rawShort.total_views || 0,
            likes: rawShort.total_likes || 0,
            duration: rawShort.play_duration || '0:00',
            createdAt: rawShort.createddate || new Date().toISOString(),
            category: rawShort.category_id?.toString() || 'general',
            isPaidPromotional: rawShort.is_paid_promotional === 1,
            postedAt: rawShort.createddate || new Date().toISOString(),
            description: rawShort.video_desciption || '',
            videoUrl: rawShort.video_link ? getSecureMediaUrl(rawShort.video_link) : '',
            comments: rawShort.total_comments || 0,
            isLiked: rawShort.is_like === 1,
          };

          console.log('[useSingleShortQuery] Transformed short:', transformedShort);
          return transformedShort;
        } else {
          throw new Error('Short not found');
        }
      } catch (error) {
        console.error('[useSingleShortQuery] Failed to fetch short:', error);
        throw error;
      }
    },
    enabled: !!shortId, // Only run query if shortId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
