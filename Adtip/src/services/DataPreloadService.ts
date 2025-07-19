import { queryClient } from '../providers/QueryProvider';
import ApiService from './ApiService';
import { SHORTS_QUERY_KEY } from '../hooks/useShortsQuery';

/**
 * Service for preloading critical app data in the background
 * This improves UX by having data ready when users navigate to screens
 */
class DataPreloadService {
  private isPreloading = false;
  private preloadPromise: Promise<void> | null = null;

  /**
   * Start preloading all critical data
   * This should be called early in the app lifecycle
   */
  public async startPreloading(userId?: number, isGuest: boolean = false): Promise<void> {
    if (this.isPreloading) {
      return this.preloadPromise || Promise.resolve();
    }

    this.isPreloading = true;
    console.log('🚀 [DataPreloadService] Starting background data preload...');

    this.preloadPromise = this.executePreload(userId, isGuest);
    
    try {
      await this.preloadPromise;
      console.log('✅ [DataPreloadService] Background preload completed successfully');
    } catch (error) {
      console.warn('⚠️ [DataPreloadService] Background preload completed with some errors:', error);
    } finally {
      this.isPreloading = false;
      this.preloadPromise = null;
    }

    return this.preloadPromise;
  }

  /**
   * Execute the actual preloading logic
   */
  private async executePreload(userId?: number, isGuest: boolean = false): Promise<void> {
    const preloadTasks: Promise<any>[] = [];

    // 1. Preload Home Screen Data
    preloadTasks.push(this.preloadHomeData(userId, isGuest));

    // 2. Preload TipTube Data
    preloadTasks.push(this.preloadTipTubeData(userId, isGuest));

    // 3. Preload TipCall Data (only for authenticated users)
    if (!isGuest && userId) {
      preloadTasks.push(this.preloadTipCallData(userId));
    }

    // 4. Preload TipShorts Data
    preloadTasks.push(this.preloadTipShortsData(userId, isGuest));

    // 5. Preload User-specific Data (only for authenticated users)
    if (!isGuest && userId) {
      preloadTasks.push(this.preloadUserData(userId));
    }

    // Execute all preload tasks in parallel
    await Promise.allSettled(preloadTasks);
  }

  /**
   * Preload Home Screen data
   */
  private async preloadHomeData(userId?: number, isGuest: boolean = false): Promise<void> {
    console.log('📱 [DataPreloadService] Preloading Home data...');

    const homeTasks: Promise<any>[] = [];

    if (isGuest) {
      // Guest users - preload premium posts
      homeTasks.push(
        queryClient.prefetchQuery({
          queryKey: ['guest-posts'],
          queryFn: async () => {
            const data = await ApiService.getListPremiumPosts();
            return {
              data: data.data || [],
              pagination: {
                current_page: 1,
                total_page: 1,
                total_count: data.data?.length || 0
              }
            };
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      );
    } else if (userId) {
      // Authenticated users - preload posts and wallet data
      homeTasks.push(
        queryClient.prefetchInfiniteQuery({
          queryKey: ['posts', 0, userId], // Category 0 for all posts
          queryFn: async ({ pageParam }) => {
            const page = pageParam as number;
            return ApiService.listPosts({
              category: 0,
              page,
              limit: 10,
              loggined_user_id: userId
            });
          },
          initialPageParam: 1,
          staleTime: 2 * 60 * 1000, // 2 minutes
        })
      );

      // Preload wallet data
      homeTasks.push(
        queryClient.prefetchQuery({
          queryKey: ['wallet', 'combined', userId.toString()],
          queryFn: async () => {
            const [balance, premium, transactions] = await Promise.allSettled([
              ApiService.getWalletBalance(userId),
              ApiService.checkPremium(userId),
              ApiService.get(`/api/wallet/transactions/${userId}`)
            ]);

            return {
              balance: balance.status === 'fulfilled' ? balance.value : null,
              premium: premium.status === 'fulfilled' ? premium.value : null,
              transactions: transactions.status === 'fulfilled' ? transactions.value : null,
            };
          },
          staleTime: 30 * 1000, // 30 seconds
        })
      );
    }

    // Preload categories (for both guest and authenticated users)
    homeTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: () => ApiService.getCategories(),
        staleTime: 30 * 60 * 1000, // 30 minutes
      })
    );

    await Promise.allSettled(homeTasks);
  }

  /**
   * Preload TipTube Screen data
   */
  private async preloadTipTubeData(userId?: number, isGuest: boolean = false): Promise<void> {
    console.log('🎥 [DataPreloadService] Preloading TipTube data...');

    const tipTubeTasks: Promise<any>[] = [];

    // Preload videos with multiple categories
    const videoCategories = ['all', 'trending', 'latest'];
    videoCategories.forEach(category => {
      tipTubeTasks.push(
        queryClient.prefetchInfiniteQuery({
          queryKey: ['videos', category, userId || 0],
          queryFn: async ({ pageParam }) => {
            const page = pageParam as number;
            return ApiService.getVideos({
              page,
              limit: 10,
              user_id: userId || 0,
              category
            });
          },
          initialPageParam: 1,
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      );
    });

    // Preload video categories
    tipTubeTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['video-categories'],
        queryFn: () => ApiService.getVideoCategories(),
        staleTime: 30 * 60 * 1000, // 30 minutes
      })
    );

    await Promise.allSettled(tipTubeTasks);
  }

  /**
   * Preload TipCall Screen data (authenticated users only)
   */
  private async preloadTipCallData(userId: number): Promise<void> {
    console.log('📞 [DataPreloadService] Preloading TipCall data...');

    const tipCallTasks: Promise<any>[] = [];

    // Preload users/contacts
    tipCallTasks.push(
      queryClient.prefetchInfiniteQuery({
        queryKey: ['users', userId],
        queryFn: async ({ pageParam }) => {
          const page = pageParam as number;
          return ApiService.getUsers({
            page,
            limit: 20,
            loggined_user_id: userId,
            id: 0,
            language: [],
            interest: [],
            user_id: null,
            search_by_name: '',
            sortBy: {}
          });
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    );

    // Preload unread message counts
    tipCallTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['unread-counts', userId],
        queryFn: () => ApiService.getUnreadMessageCounts(userId),
        staleTime: 30 * 1000, // 30 seconds
      })
    );

    await Promise.allSettled(tipCallTasks);
  }

  /**
   * Preload TipShorts Screen data
   */
  private async preloadTipShortsData(userId?: number, isGuest: boolean = false): Promise<void> {
    console.log('🎬 [DataPreloadService] Preloading TipShorts data...');

    const tipShortsTasks: Promise<any>[] = [];

    if (isGuest) {
      // Guest users - preload guest shorts
      tipShortsTasks.push(
        queryClient.prefetchQuery({
          queryKey: [SHORTS_QUERY_KEY, 'guest'],
          queryFn: () => ApiService.getGuestShorts(),
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      );
    } else if (userId) {
      // Authenticated users - preload shorts
      tipShortsTasks.push(
        queryClient.prefetchInfiniteQuery({
          queryKey: [SHORTS_QUERY_KEY, userId],
          queryFn: async ({ pageParam }) => {
            const page = pageParam as number;
            return ApiService.getShorts({
              page,
              limit: 10,
              user_id: userId
            });
          },
          initialPageParam: 1,
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      );
    }

    await Promise.allSettled(tipShortsTasks);
  }

  /**
   * Preload user-specific data (authenticated users only)
   */
  private async preloadUserData(userId: number): Promise<void> {
    console.log('👤 [DataPreloadService] Preloading user data...');

    const userTasks: Promise<any>[] = [];

    // Preload user profile
    userTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['profile', userId],
        queryFn: () => ApiService.get(`/api/user/${userId}`),
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    );

    // Preload subscription status
    userTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['subscription-status', userId],
        queryFn: () => ApiService.checkPremium(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    );

    // Preload channel data
    userTasks.push(
      queryClient.prefetchQuery({
        queryKey: ['channel', userId],
        queryFn: () => ApiService.getChannelByUserId(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    );

    await Promise.allSettled(userTasks);
  }

  /**
   * Clear all preloaded data
   */
  public clearPreloadedData(): void {
    console.log('🗑️ [DataPreloadService] Clearing preloaded data...');
    queryClient.clear();
  }

  /**
   * Check if preloading is currently in progress
   */
  public isCurrentlyPreloading(): boolean {
    return this.isPreloading;
  }

  /**
   * Preload specific screen data on demand
   */
  public async preloadScreenData(screenName: string, userId?: number, isGuest: boolean = false): Promise<void> {
    console.log(`🎯 [DataPreloadService] Preloading data for ${screenName}...`);

    switch (screenName) {
      case 'Home':
        await this.preloadHomeData(userId, isGuest);
        break;
      case 'TipTube':
        await this.preloadTipTubeData(userId, isGuest);
        break;
      case 'TipCall':
        if (!isGuest && userId) {
          await this.preloadTipCallData(userId);
        }
        break;
      case 'TipShorts':
        await this.preloadTipShortsData(userId, isGuest);
        break;
      default:
        console.warn(`[DataPreloadService] Unknown screen: ${screenName}`);
    }
  }
}

// Export singleton instance
export default new DataPreloadService();
