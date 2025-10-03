// src/screens/home/HomeScreen.tsx - Enhanced with bulletproof navigation and data layer
import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  ViewabilityConfig,
  ViewToken,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import { InfiniteData } from '@tanstack/react-query';
// Import Lucide React Native icons
import { Gamepad2, WifiOff, Dices, Mail, MessageCircle, Search, CreditCard } from 'lucide-react-native';
import PostWithComments from '../../components/home/PostWithComments';
import { FeedFlatList } from '../../components/common/OptimizedFlatList';
import SurveyBanner from '../../components/home/SurveyBanner';
import { CPXResearchProvider } from '../../contexts/CPXResearchContext';
import StatusStoriesRow, { StatusUser, StatusItem } from '../../components/home/StatusStoriesRow';
import ActiveStreamsRow from '../../components/home/ActiveStreamsRow';

// Enhanced Contexts & Services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useDataContext} from '../../providers/DataProvider';
import ApiService from '../../services/ApiService';

import {HOME_ENDPOINTS} from '../../constants/apiEndpoints';
import shareService from '../../services/ShareService';
import { usePosts, useGuestPosts, useLikeMutation, useFollowMutation, useSubscriptionStatus, useCategories, useSearchUsers, useWalletBalance } from '../../hooks/useQueries';
import { useUserWallet } from '../../contexts/UserDataContext';
import { useWallet } from '../../hooks/useWallet';

import { useFCMChat } from '../../contexts/FCMChatContext';
import { useNetInfo } from '@react-native-community/netinfo';
import { formatPremiumExpiryDate } from '../../utils/dateUtils';
import PubScaleService from '../../services/PubScaleService';
import Logger from '../../utils/logger';
import VersionCheckService from '../../services/VersionCheckService';
import { checkPremiumAccess, logPremiumAccessAttempt } from '../../utils/premiumAccessUtils';

// Components
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';

import CategoryItem from '../../components/home/CategoryItem';
import EarnCard from '../../components/home/EarnCard';
import BannerCarousel from '../../components/home/BannerCarousel';
import SurveyOfferwallSection from '../../components/home/SurveyOfferwallSection';

import PremiumUpgradeAlert from '../../components/common/PremiumUpgradeAlert';
import LoginPromptModal from '../../components/modals/LoginPromptModal';
import PubScaleCreditAlert from '../../components/common/PubScaleCreditAlert';
import PremiumAccessModal from '../../components/modals/PremiumAccessModal';

import ScreenTransition from '../../components/common/ScreenTransition';
import RewardPopup from '../../components/RewardPopup';


// Skeleton Components

import CategorySkeleton from '../../components/skeletons/CategoryItemSkeleton';
import EarnCardSkeleton from '../../components/skeletons/EarnCardSkeleton';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';

// Google Ads
import BannerAdComponent from '../../googleads/BannerAdComponent';
import RectangleAdComponent from '../../googleads/RectangleAdComponent';

// Debug utilities
import { generateVideoDebugReport } from '../../utils/debugUtils';

// Types
import {AppNavigationProps} from '../../types/navigation';
import { PostListResponse } from '../../types/api';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Interfaces

interface Category { id: string; name: string; }
interface ApiCategory { category_id: number; category_name: string; }
interface Post {
  id: number; user_id: number; title: string; content: string;
  media_url: string | null; media_type: string; user_name: string;
  user_profile_image: string | null; likeCount: number; commentCount: number;
  is_promoted?: number; created_at: string; is_premium?: boolean;
  is_liked?: boolean; last_active?: string | null;
  duration_days?: number; remaining_budget?: number;
  is_promtion_post_viewed?: number;
}
// Removed walletBalance prop - HOC removed for performance optimization

// Helper Components

interface CategoriesRowProps { 
  categories: Category[]; 
  selectedCategory: string | null; 
  onCategoryPress: (categoryId: string) => void; 
  isLoading?: boolean; 
}

const CategoriesRow: React.FC<CategoriesRowProps> = ({ categories, selectedCategory, onCategoryPress, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContentContainer}>
          {Array(6).fill(0).map((_, index) => <CategorySkeleton key={`cat-skel-${index}`} />)}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.categoriesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContentContainer}>
        {categories.map((category: Category, idx: number) => (
          <CategoryItem 
            key={`${category.id}-${idx}`} 
            name={category.name ? String(category.name) : ''} 
            selected={selectedCategory === category.id} 
            onPress={() => onCategoryPress(category.id)} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface EarnCardsRowProps {
  onWatchAndEarn: () => void;
  onInstallToEarn: () => void;
  isLoading?: boolean;
}

// Survey Banner Component - Replaced Rush Play Games with CPX Research Surveys

const EarnCardsRow: React.FC<EarnCardsRowProps> = ({ onWatchAndEarn: _onWatchAndEarn, onInstallToEarn, isLoading }) => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const {isPremium} = useWallet();
  const navigation = useNavigation<AppNavigationProps>();
  const styles = createHomeScreenStyles(colors);
  
  // Premium popup state
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<'install_to_earn' | 'general'>('install_to_earn');
  
  // Define earn cards data - Only Install to Earn
  const earnCardsData = [
    {
      id: '3',
      title: 'Install to Earn upto ₹2000 per task',
      description: 'Complete tasks to earn rewards',
      iconName: 'coins',
      onPress: () => {
        // Check premium access for install to earn features
        const accessResult = checkPremiumAccess({
          feature: 'install_to_earn',
          isPremium,
          userId: user?.id,
        });

        // Log the access attempt for analytics
        logPremiumAccessAttempt(
          'install_to_earn',
          isPremium,
          user?.id,
          { taskType: 'install_to_earn' }
        );

        // If user doesn't have premium access, show upgrade modal
        if (!accessResult.hasAccess) {
          Logger.debug('EarnCardsRow', 'Non-premium user attempting install to earn access, showing premium popup')
          setPremiumFeature('install_to_earn')
          setShowPremiumPopup(true)
          return
        }

        // Proceed with the original onPress function
        onInstallToEarn();
      },
      gradientColors: ['#FF6B35', '#FF8E53', '#E55A2B'],
    },
  ];

  const renderEarnCard = (item: typeof earnCardsData[0]) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.earnCardVerticalItem}
        onPress={item.onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earnCardGradient}
        >
          <View style={styles.earnCardContent}>
            <View style={styles.earnCardTextContainer}>
              <Text style={styles.earnCardTitle}>{item.title}</Text>
              <Text style={styles.earnCardDescription}>{item.description}</Text>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.earnCardRewardBadge}
              >
                <Text style={styles.earnCardRewardText}>2x Rewards!</Text>
              </LinearGradient>
            </View>
            <View style={styles.earnCardIconContainer}>
              <CreditCard size={32} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.earnCardsCarouselSection}>
        <View style={styles.earnCardsCarouselSkeletonContainer}>
          <EarnCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.earnCardsCarouselSection}>
      {earnCardsData.map(renderEarnCard)}
      
      {/* Premium Access Modal */}
      <PremiumAccessModal
        visible={showPremiumPopup}
        feature={premiumFeature}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => {
          // Use setTimeout to avoid scheduling updates during animation
          setTimeout(() => {
            setShowPremiumPopup(false)
            navigation.navigate('PremiumUser' as never)
          }, 100)
        }}
      />
    </View>
  );
};



// MAIN COMPONENT - Enhanced with bulletproof navigation
const HomeScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user, isGuest} = useAuth();
  const { totalUnreadCount } = useFCMChat();
  const { walletBalance: contextWalletBalance } = useUserWallet();

  // Use the same wallet balance source as WalletScreen
  const { data: walletBalanceData } = useWalletBalance(user?.id || 0);
  const walletBalance = walletBalanceData?.availableBalance || contextWalletBalance || 0;

  const navigation = useNavigation<AppNavigationProps>();

  // Debug wallet balance
  console.log('[HomeScreen] Wallet balance debug:', {
    contextWalletBalance,
    walletBalanceData: walletBalanceData?.availableBalance,
    finalWalletBalance: walletBalance,
    userId: user?.id,
    isGuest
  });
  const {contentPaddingBottom} = useTabNavigator();
  const {clearCache} = useDataContext();
  const queryClient = useQueryClient();
  const styles = createHomeScreenStyles(colors);

  // Enhanced user data from new system (only for authenticated users) - removed unused hooks

  // UI state management (never blocks navigation)
  const [selectedCategoryState, setSelectedCategoryState] = useState<string>('0');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Fetch categories from API
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useCategories();

  // Transform API categories to match the expected format
  const categories = useMemo(() => {
    if (!categoriesData?.data) return [];
    
    // Add "All" category as first item
    const allCategory: Category = { id: '0', name: 'All' };
    
    // Transform API categories
    const apiCategories: Category[] = categoriesData.data.map((cat: ApiCategory) => ({
      id: cat.category_id.toString(),
      name: cat.category_name
    }));
    
    return [allCategory, ...apiCategories];
  }, [categoriesData]);
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  // Removed modal states - now using direct navigation to Profile screen
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);
  const [showPubScaleCreditAlert, setShowPubScaleCreditAlert] = useState(false);

  // Add premium state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumData, setPremiumData] = useState<any>(null);

  // Version check state
  const [hasCheckedVersion, setHasCheckedVersion] = useState<boolean>(false);



  // Login prompt modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');

  // Premium upgrade alert state
  const [showPremiumUpgradeAlert, setShowPremiumUpgradeAlert] = useState(false);

  // Status Stories state
  const [statusUsers, setStatusUsers] = useState<StatusUser[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Log when HomeScreen mounts
  useEffect(() => {
    Logger.debug('HomeScreen', 'Component mounted with user:', user?.id);
  }, [user?.id]);

  // Banner state - removed unused banner variables

  // Enhanced data layer using React Query v5 hooks
  // Use guest posts for guest users, regular posts for authenticated users
  const authenticatedPostsQuery = usePosts(
    selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0,
    user?.id
  );

  const guestPostsQuery = useGuestPosts();

  // Choose the appropriate query based on guest mode
  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage: postsLoadingMore,
    error: postsError,
    refetch: refreshPosts,
    fetchNextPage: loadMorePosts,
    hasNextPage: hasMorePosts,
  } = isGuest ? {
    data: guestPostsQuery.data,
    isLoading: guestPostsQuery.isLoading,
    isFetchingNextPage: false, // Guest mode doesn't support pagination
    error: guestPostsQuery.error,
    refetch: guestPostsQuery.refetch,
    fetchNextPage: () => Promise.resolve({ data: undefined, pageParam: undefined, direction: 'forward' as const }),
    hasNextPage: false,
  } : authenticatedPostsQuery;

  // Use TanStack Query for subscription status
  const { 
    data: subscriptionResponse, 
    isLoading: subscriptionLoading, 
    error: subscriptionError 
  } = useSubscriptionStatus(user?.id || 0);

  // Log subscription API calls and responses
  useEffect(() => {
    Logger.debug('HomeScreen', 'Subscription API Response:', {
      userId: user?.id,
      response: subscriptionResponse,
      isLoading: subscriptionLoading,
      error: subscriptionError
    });
  }, [subscriptionResponse, subscriptionLoading, subscriptionError, user?.id]);

  // Update premium state based on query result
  useEffect(() => {
    Logger.debug('HomeScreen', 'Processing subscription response:', subscriptionResponse);

    if (subscriptionResponse && subscriptionResponse.status && subscriptionResponse.data) {
      // User has an active subscription
      const isPremiumActive = subscriptionResponse.data.is_active === true;
      Logger.debug('HomeScreen', 'User has active premium:', {
        isPremiumActive,
        planName: subscriptionResponse.data.plan_name,
        amount: subscriptionResponse.data.amount,
        billingCycle: subscriptionResponse.data.billing_cycle
      });
      setIsPremium(isPremiumActive);
      setPremiumData(isPremiumActive ? subscriptionResponse.data : null);
    } else {
      // No subscription found or inactive
      Logger.debug('HomeScreen', 'No active subscription found');
      setIsPremium(false);
      setPremiumData(null);
    }
  }, [subscriptionResponse]);

  // Log when premium state changes
  useEffect(() => {
    console.log('🔄 [HomeScreen] Premium state changed:', {
      isPremium,
      hasPremiumData: !!premiumData,
      premiumData: premiumData ? {
        planName: premiumData.plan_name,
        amount: premiumData.amount,
        status: premiumData.status
      } : null
    });
  }, [isPremium, premiumData]);

  // Version check on app start
  useEffect(() => {
    const checkVersionAndPremium = async () => {
      if (hasCheckedVersion) return;

      console.log('🔍 [HomeScreen] Starting version check and premium validation...');

      try {
        // Check app version for updates
        const versionService = VersionCheckService.getInstance();
        const updateResult = await versionService.checkForUpdates();

        if (updateResult && updateResult.status && updateResult.data) {
          console.log('⚠️ [HomeScreen] Update available:', updateResult.data);

          // For non-force updates, show the update dialog
          if (!updateResult.data.force_update) {
            versionService.showUpdateDialog(updateResult.data);
          }
          // Force updates are handled at the App level
        } else {
          console.log('✅ [HomeScreen] App is up to date');
        }

        // Check premium status - removed automatic popup
        if (subscriptionResponse && !subscriptionResponse.status && !subscriptionLoading) {
          console.log('💎 [HomeScreen] No premium subscription found');
        }
      } catch (error) {
        console.error('❌ [HomeScreen] Error in version check or premium validation:', error);
      } finally {
        setHasCheckedVersion(true);
      }
    };

    // Only run when user is authenticated and subscription data is loaded
    if (user?.id && !subscriptionLoading && subscriptionResponse !== undefined) {
      checkVersionAndPremium();
    }
  }, [user?.id, subscriptionResponse, subscriptionLoading, hasCheckedVersion]);

  // Removed automatic premium popup - users can upgrade manually when needed

  const isFirstRun = useRef(true);

  // Consolidated focus effect - only refresh on subsequent focuses, not first load
  useFocusEffect(
    useCallback(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      console.log('[HomeScreen] Screen focused. Invalidating queries for fresh data.');
      // Use invalidateQueries instead of direct refresh for better performance
      queryClient.invalidateQueries({
        queryKey: ['posts', selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0, user?.id],
        refetchType: 'active'
      });
    }, [queryClient, selectedCategoryState, user?.id])
  );

  // Initial data fetch on mount
  useEffect(() => {
    if (user?.id) {
      console.log('[HomeScreen] Component mounted or user changed. Initial data will be fetched by TanStack Query.');
      // TanStack Query will automatically fetch data when the component mounts
    }
  }, [user?.id]);

  // Helper function to validate media URL and detect potential loading errors
  const isValidMediaUrl = useCallback((url?: string | null): boolean => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
      return false;
    }

    const trimmedUrl = url.trim();

    // Check for common invalid patterns
    const invalidPatterns = [
      /^null$/i,
      /^undefined$/i,
      /^\s*$/,
      /^data:image\/.*;base64,$/,
      /^blob:/,
      /^file:\/\//,
      /^\/\/$/,
      /^https?:\/\/$/,
      /^https?:\/\/\s*$/,
      /error/i,
      /404/,
      /not.?found/i,
      /invalid/i,
      /broken/i,
    ];

    // Check if URL has valid format
    try {
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        new URL(trimmedUrl); // This will throw if URL is malformed
      } else if (!trimmedUrl.startsWith('/')) {
        // Relative URLs should start with /
        return false;
      }
    } catch {
      console.warn('[HomeScreen] Invalid media URL detected:', trimmedUrl);
      return false;
    }

    return !invalidPatterns.some(pattern => pattern.test(trimmedUrl));
  }, []);

  // Transform posts data for compatibility and filter out posts with invalid media
  const posts = useMemo(() => {
    let rawPosts: Post[] = [];

    if (isGuest) {
      rawPosts = (postsData as { data: Post[] })?.data || [];
    } else if (postsData && 'pages' in postsData) {
      rawPosts = (postsData as InfiniteData<PostListResponse>)?.pages?.flatMap((page: PostListResponse) => page?.data || []) || [];
    }

    // Filter out posts with invalid media URLs
    const filteredPosts = rawPosts.filter((post) => {
              // If post has media, validate the URL
        if (post.media_url && post.media_url !== 'null') {
          const isValid = isValidMediaUrl(post.media_url);
          return isValid;
        }
      // If post has no media, include it
      return true;
    });

    // Log filtering results
    const filteredCount = rawPosts.length - filteredPosts.length;

    return filteredPosts;
  }, [postsData, isGuest, isValidMediaUrl]);

  // Like and Follow mutations
  const likeMutation = useLikeMutation();
  const followMutation = useFollowMutation();



  // Network state for offline handling
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected;





  // Helper function to show login prompt for guest users
  const showLoginPromptForAction = useCallback((action: string) => {
    setLoginPromptMessage(`Login to ${action}`);
    setShowLoginPrompt(true);
  }, []);

  // Optimistic mutations for instant UI feedback (now using the new hooks)
  const handleLikePost = useCallback((postId: number, isLiked: boolean) => {
    if (isGuest) {
      showLoginPromptForAction('like posts');
      return;
    }
    if (!user?.id) {
      console.warn('Cannot like post: User not logged in');
      return;
    }
    likeMutation.mutate({ postId, userId: user.id, isLiked });
  }, [likeMutation, user?.id, isGuest, showLoginPromptForAction]);

  const handleFollowUser = useCallback((userId: number, isFollowing: boolean) => {
    if (isGuest) {
      showLoginPromptForAction('follow users');
      return;
    }
    followMutation.mutate({ userId, isFollowing });
  }, [followMutation, isGuest, showLoginPromptForAction]);

  // Removed unused handlers: handlePostPress, handleRetry
  
  // Removed renderPremiumBanner function - status section no longer needed

  // Use categories from API
  const displayCategories = categories;
  const displayPosts = posts || [];

  // Derived state for UI
  const initialLoading = postsLoading && displayPosts.length === 0;
  const isRefreshing = false; // Managed by data layer

  // Removed unused getFullImageUrl function

  const getTimeAgo = useCallback((timestamp: string) => {
    const now = new Date(); 
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategoryState(categoryId);
    // Clear cache to force refresh with new category
    clearCache(`home-posts-${user?.id || 0}`);
  }, [user?.id, clearCache]);



  const handleWatchAndEarn = useCallback(() => {
    console.log('Watch and earn pressed');
    navigation.navigate('TipTube' as never);
  }, [navigation]);



  const handleInstallToEarn = useCallback(async () => {
    // Allow all users to access PubScale - no premium restriction
    try {
      await PubScaleService.showOfferwall();
      console.log('Offerwall launched successfully');

      // Show enhanced credit alert after user returns from PubScale
      setShowPubScaleCreditAlert(true);
    } catch (error) {
      console.error('Failed to show offerwall:', error);
      Alert.alert('Error', 'Failed to load offerwall. Please try again later.', [{ text: 'OK' }]);
    }
  }, []);

  // Handle PubScale credit alert actions
  const handleViewWallet = useCallback(() => {
    navigation.navigate('Wallet' as never);
  }, [navigation]);

  const handleViewHistory = useCallback(() => {
    // Navigate to a history screen or show a placeholder
    Alert.alert(
      'Transaction History',
      'Transaction history feature will be available soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleBannerPress = useCallback((bannerId: number) => {
    switch (bannerId) {
      case 1:
        navigation.navigate('TipCall' as never);
        break;
      case 2:
        navigation.navigate('TipTube' as never);
        break;
      case 3:
        navigation.navigate('Referral' as never);
        break;
      case 4:
        navigation.navigate('ContentCreatorPremium' as never);
        break;
      case 5:
        navigation.navigate('PremiumUser' as never);
        break;
      default:
        break;
    }
  }, [navigation]);

  const handlePostLike = useCallback((postId: number) => {
    // Find current like state and optimistically update
    const post = displayPosts.find(p => p.id === postId);
    if (post) {
      handleLikePost(postId, post.is_liked || false);
    }
  }, [handleLikePost, displayPosts]);

  const handleUserFollow = useCallback(async (userId: number) => {
    // Find current follow state and optimistically update
    const post = displayPosts.find(p => p.user_id === userId);
    if (post) {
      // Assume not following if not specified
      handleFollowUser(userId, false);
    }
  }, [handleFollowUser, displayPosts]);

  const handleCommentPress = useCallback((postId: number) => {
    if (isGuest) {
      showLoginPromptForAction('comment on posts');
      return;
    }
    setSelectedCommentPostId(postId);
    setCommentModalVisible(true);
  }, [isGuest, showLoginPromptForAction]);

  const handleUserProfilePress = useCallback((userId: number) => {
    if (isGuest) {
      showLoginPromptForAction('view user profiles');
      return;
    }
    // Navigate directly to Profile screen instead of using modal
    (navigation as any).navigate('Profile', { userId });
  }, [isGuest, showLoginPromptForAction, navigation]);

  const handleSharePost = useCallback(async (postId: number) => {
    if (isGuest) {
      showLoginPromptForAction('share posts');
      return;
    }
    try {
      // Find the post to get its title/content for better sharing
      const post = posts.find(p => p.id === postId);
      const postTitle = post?.content || post?.title || 'Check out this amazing post!';

      await shareService.sharePost(postId, postTitle, {
        useUniversalLink: true,
        includeAppName: true
      });
    } catch (error) {
      console.error('[HomeScreen] Error sharing post:', error);
      // Fallback to basic share
      Share.share({ message: `Check out this post on Adtip: https://adtip.in/post/${postId}` });
    }
  }, [isGuest, showLoginPromptForAction, posts]);

  // Search handlers
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    // For now, just navigate to search screen for complex search
    (navigation as any).navigate('Search');
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    (navigation as any).navigate('Profile', { userId });
    // Clear search when navigating
    setSearchQuery('');
    setIsSearchActive(false);
    }, [navigation]);

  // Status Stories handlers
  const handleCreateStatus = useCallback(() => {
    if (isGuest) {
      showLoginPromptForAction('create status');
      return;
    }
    // Navigate to status creation screen
    (navigation as any).navigate('CreateStatus');
  }, [isGuest, showLoginPromptForAction, navigation]);

  const handleViewStatus = useCallback((userId: number, statuses: StatusItem[]) => {
    if (isGuest) {
      showLoginPromptForAction('view status');
      return;
    }
    // Navigate to status viewer screen
    (navigation as any).navigate('ViewStatus', { userId, statuses });
  }, [isGuest, showLoginPromptForAction, navigation]);

  // Fetch status stories when component mounts or user changes
  useEffect(() => {
    const fetchStatusStories = async () => {
      if (isGuest || !user?.id) {
        return;
      }
      
      setStatusLoading(true);
      try {
        const response = await ApiService.get(`/api/paid-status/feed/${user.id}`);
        if (response.status && response.data) {
          setStatusUsers(response.data);
        }
      } catch (error) {
        console.error('Error fetching status stories:', error);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatusStories();
  }, [user?.id, isGuest]);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Search users query - moved before SearchResults to fix declaration order
  const {
    data: searchUsersData,
    isLoading: searchUsersLoading,
  } = useSearchUsers(debouncedSearchQuery, 1, 20);

  // Complete header right section with all icons
  const renderHeaderRightSection = useCallback(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Search Icon */}
      <TouchableOpacity
        onPress={() => {
          setIsSearchActive(true);
        }}
        style={[styles.headerIconButton, { marginLeft: 6 }]}
        activeOpacity={0.8}
      >
        <Search size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Premium Toggle */}
      <TouchableOpacity
        style={[styles.headerIconButton, { marginLeft: 6 }]}
        onPress={() => navigation.navigate('PremiumUser' as never)}
        activeOpacity={0.8}
      >
        <View style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: isPremium ? '#4CAF50' : '#FF4444',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row'
        }}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            left: isPremium ? 22 : 2,
          }} />
        </View>
      </TouchableOpacity>

      {/* Dynamic Balance Oval */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Wallet' as never)}
        style={[styles.headerIconButton, { marginLeft: 6 }]}
        activeOpacity={0.8}
      >
        <View style={[
          styles.balanceOval,
          {
            backgroundColor: colors.primary + '20',
            borderColor: colors.primary,
            // Dynamic width based on balance - minimum 40, scales with balance
            width: Math.max(40, Math.min(80, 40 + (Number(walletBalance) / 100) * 20)),
          }
        ]}>
          <Text style={[styles.balanceText, { color: colors.primary }]} numberOfLines={1}>
            ₹{Number(walletBalance).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Inbox Icon */}
      <View style={{ position: 'relative', marginLeft: 6 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Inbox' as never)}
          style={styles.headerIconButton}
          activeOpacity={0.8}
        >
          <MessageCircle size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        {totalUnreadCount > 0 && (
          <View style={[styles.inboxBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.inboxBadgeText}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  ), [navigation, totalUnreadCount, colors, styles, isPremium, setIsSearchActive]);

  // Search results component
  const SearchResults = useMemo(() => {
    if (!isSearchActive) return null;

    const users = searchUsersData?.data?.users || [];

    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        zIndex: 1000,
        paddingTop: 60, // Account for header height
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TextInput
            style={{
              flex: 1,
              height: 40,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text.primary,
              fontSize: 16,
            }}
            placeholder="Search users..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setIsSearchActive(false);
            }}
            style={{
              padding: 8,
              marginLeft: 8,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {!debouncedSearchQuery ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Search size={48} color={colors.text.tertiary} />
            <Text style={{ color: colors.text.secondary, fontSize: 16, marginTop: 16 }}>
              Start typing to search for users
            </Text>
          </View>
        ) : searchUsersLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.text.primary, fontSize: 16 }}>No users found for "{debouncedSearchQuery}"</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleUserPress(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Image
                  source={{ uri: item.profile_image || 'https://avatar.iran.liara.run/public' }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text.primary,
                  }}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={{ flex: 1 }}
          />
        )}
      </View>
    );
  }, [isSearchActive, debouncedSearchQuery, searchUsersData, searchUsersLoading, colors, handleUserPress]);



  const handleRefresh = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMorePosts && !postsLoadingMore) {
      loadMorePosts();
    }
  }, [hasMorePosts, postsLoadingMore, loadMorePosts]);

  // Optimized viewability config
  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  }), []);

  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const currentVisibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id as number);
    setVisiblePostIds(currentVisibleIds);
  }, []);

  const handleToggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  // Rewarded posts state
  const [rewardedPosts, setRewardedPosts] = useState<Set<number>>(new Set());
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  // Function to handle view of promoted posts
  const handlePromotedPostView = useCallback(async (postId: number) => {
    if (!user?.id || rewardedPosts.has(postId)) return;
    
    // Add to rewarded posts immediately to prevent multiple calls
    setRewardedPosts(prev => new Set(prev).add(postId));
    
    try {
      const response = await ApiService.post(HOME_ENDPOINTS.VIEW_PROMOTED_POST, { 
        user_id: user.id, 
        post_id: postId 
      });
      
      if (response && response.status && response.earned_amount > 0) {
        // Show custom reward popup
        setEarnedAmount(response.earned_amount);
        setShowRewardPopup(true);
      } else if (response && response.message === 'Already rewarded for this post') {
        Alert.alert('Already Rewarded', 'You have already been rewarded for viewing this post.');
      } else if (response && response.message === 'Ad budget exhausted') {
        Alert.alert('Ad Budget Exhausted', 'No more rewards available for this ad.');
      } else if (response && response.message === 'Ad owner wallet exhausted') {
        Alert.alert('Ad Owner Wallet Exhausted', 'The ad owner has insufficient funds.');
      } else if (response && response.message === 'Promotion not active') {
        Alert.alert('Promotion Not Active', 'This promotion is not currently active.');
      } else {
        Alert.alert('No reward', 'You have already been rewarded for viewing this post.');
      }
    } catch (err) {
      console.log("PromotedPostViewFailed!!!", err);
      Alert.alert('Error', 'Could not process your view. Please try again.');
      // Remove from rewarded posts if there was an error
      setRewardedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }, [user?.id, rewardedPosts, navigation]);

  // Render post item with enhanced data handling
  const renderPostItem = useCallback(({ item, index }: { item: Post; index: number }) => {
    const isVisible = visiblePostIds.includes(item.id);
    
    return (
      <>
        {/* Sticky banner ad above first post */}
        {index === 0 && (
          <View style={styles.stickyBannerContainer}>
            <BannerAdComponent />
          </View>
        )}
        
        <PostItem
          key={`post-${item.id}-${index}`}
          id={item.id}
          username={item.user_name ? String(item.user_name) : "Unknown"}
          profileImage={item.user_profile_image}
          postImage={item.media_url}
          caption={item.content}
          likes={item.likeCount}
          comments={item.commentCount}
          timeAgo={getTimeAgo(item.created_at)}
          media_type={item.media_type}
          isPremium={item.is_premium}
          isLiked={item.is_liked}
          userId={item.user_id}
          isVisible={isVisible}
          last_active={item.last_active}
          isGloballyMuted={isGloballyMuted}
          onToggleGlobalMute={handleToggleGlobalMute}
          onLike={handlePostLike}
          onComment={handleCommentPress}
          onShare={handleSharePost}
          onPostPress={(postId: number) => console.log('Post pressed:', postId)}
          onUserPress={handleUserProfilePress}
          onFollow={handleUserFollow}
          isPromoted={item.is_promoted === 1}
          onPromotedView={item.is_promoted === 1 ? handlePromotedPostView : undefined}
          duration_days={item.duration_days}
          created_at={item.created_at}
          remaining_budget={item.remaining_budget}
          alreadyRewarded={rewardedPosts.has(item.id)}
          is_promtion_post_viewed={item.is_promtion_post_viewed}
        />
        
        {/* Rectangle ad after every 3rd post (starting from post 2) */}
        {(index + 1) % 3 === 0 && index > 0 && (
          <View style={styles.rectangleAdContainer}>
            <RectangleAdComponent />
          </View>
        )}
      </>
    );
  }, [visiblePostIds, getTimeAgo, handlePostLike, handleCommentPress, handleSharePost, handleUserProfilePress, handleUserFollow, styles, isGloballyMuted, handleToggleGlobalMute, handlePromotedPostView]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (postsLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <WifiOff size={48} color={colors.text.tertiary} />
        <Text style={[styles.emptyStateTitle, {color: colors.text.primary}]}>No posts available</Text>
        <Text style={[styles.emptyStateMessage, {color: colors.text.secondary}]}>
          {isOnline ? 'Check back later for new content!' : 'Please check your internet connection'}
        </Text>
        <TouchableOpacity style={[styles.retryButton, {backgroundColor: colors.primary}]} onPress={handleRefresh}>
          <Text style={{color: colors.white}}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }, [postsLoading, colors, isOnline, handleRefresh, styles]);

  // Render loading state
  if (initialLoading) {
    return (
      <ScreenTransition skipAnimation={true}>
        <View style={[styles.container, {backgroundColor: colors.background}]}>
          <Header
            title=""
            showLogo={false}
            rightComponent={renderHeaderRightSection()}
          />
          <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, {paddingBottom: contentPaddingBottom}]}>

            <CategoriesRow categories={[]} selectedCategory={null} onCategoryPress={handleCategoryPress} isLoading={true} />
            {/* Rearranged banner sections: Carousel (first), Survey Banner (kept), Survey Offerwalls (hidden per user request) */}
            <BannerCarousel />
            {/* <SurveyOfferwallSection /> */}
            <EarnCardsRow onWatchAndEarn={handleWatchAndEarn} onInstallToEarn={handleInstallToEarn} isLoading={true} />
            <View style={styles.skeletonContainer}>
              {Array(6).fill(0).map((_, index) => <PostItemSkeleton key={`skeleton-${index}`} />)}
            </View>
          </ScrollView>
        </View>
      </ScreenTransition>
    );
  }

  // Error state
  if (postsError) {
    return (
      <ScreenTransition>
        <View style={[styles.container, {backgroundColor: colors.background}]}>
          <Header
            title=""
            onSearchSubmit={handleSearchSubmit}
            rightComponent={renderHeaderRightSection()}
          />
          <View style={styles.errorContainer}>
            <WifiOff size={48} color={colors.danger || '#FF0000'} />
            <Text style={[styles.errorTitle, {color: colors.text.primary}]}>Something went wrong</Text>
            <Text style={[styles.errorMessage, {color: colors.text.secondary}]}>
              {postsError?.message || 'Failed to load posts'}
            </Text>
            <TouchableOpacity style={[styles.retryButton, {backgroundColor: colors.primary}]} onPress={handleRefresh}>
              <Text style={{color: colors.white}}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    );
  }

  return (
    <CPXResearchProvider>
      <ScreenTransition skipAnimation={true}>
        <View style={[styles.container, {backgroundColor: colors.background}]}>
          {/* CPX Research Component at root level for full-screen modal - using provider only */}

          <Header
            title=""
            showLogo={false}
            rightComponent={renderHeaderRightSection()}
          />
          {SearchResults}
          <FeedFlatList
          data={displayPosts}
          renderItem={renderPostItem}
          idField="id"
          debugName="HomeScreenFeed"
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: contentPaddingBottom}]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          customOptimizations={{
            removeClippedSubviews: true,
            initialNumToRender: 6,
            maxToRenderPerBatch: 5,
            windowSize: 10,
            updateCellsBatchingPeriod: 50,
          }}
          ListHeaderComponent={() => (
            <>
              {/* Status Stories Row - Hidden per user request */}
              {/* {!isGuest && (
                <StatusStoriesRow
                  statuses={statusUsers}
                  currentUserId={user?.id}
                  currentUserAvatar={user?.profile_image || undefined}
                  currentUserName={user?.username || user?.name}
                  onCreateStatus={handleCreateStatus}
                  onViewStatus={handleViewStatus}
                  isLoading={statusLoading}
                />
              )} */}

              {/* Active Live Streams Row - Show ongoing live streams 
              <ActiveStreamsRow
                onJoinStream={(meetingId, streamTitle) => {
                  // Navigate to the LiveStream tab in the TabNavigator
                  (navigation as any).navigate('LiveStream');
                }}
              />*/}

              <CategoriesRow categories={displayCategories} selectedCategory={selectedCategoryState} onCategoryPress={handleCategoryPress} isLoading={categoriesLoading} />
              {/* Rearranged banner sections: Carousel (first), Survey Banner (restored), Survey Offerwalls (hidden per user request) */}
              <BannerCarousel onBannerPress={handleBannerPress} />
              
              {/* CPX Research Survey Banner - Restored per user request */}
              <SurveyBanner
                isPremium={isPremium}
                onUpgrade={() => {
                  navigation.navigate('PremiumBenefitsScreen' as never);
                }}
                onRewardEarned={(amount: number, isPremium: boolean) => {
                  console.log('Survey banner reward earned:', amount, isPremium);
                }}
                renderCPXAtRoot={true}
              />
              
              {/* <SurveyOfferwallSection /> */}
              <EarnCardsRow onWatchAndEarn={handleWatchAndEarn} onInstallToEarn={handleInstallToEarn} />
            </>
          )}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => 
            postsLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingMoreText, {color: colors.text.secondary}]}>Loading more posts...</Text>
              </View>
            ) : null
          }
        />

        {/* Comments Modal */}
        {selectedCommentPostId && (
          <PostWithComments
            visible={commentModalVisible}
            onClose={() => {
              setCommentModalVisible(false);
              setSelectedCommentPostId(null);
            }}
            postId={selectedCommentPostId}
            userId={user?.id ? Number(user.id) : 0}
            //@ts-expect-error - PostWithComments component prop type mismatch
            initialCommentCount={
              displayPosts.find(post => post.id === selectedCommentPostId)?.commentCount || 0
            }
          />
        )}

        {/* Removed User Profile Modal - now using direct navigation */}

        {/* Removed automatic Premium Popup - users can upgrade manually when needed */}

        {/* Login Prompt Modal for Guest Users */}
        <LoginPromptModal
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message={loginPromptMessage}
        />

        {/* Enhanced PubScale Credit Alert */}
        <PubScaleCreditAlert
          visible={showPubScaleCreditAlert}
          onClose={() => setShowPubScaleCreditAlert(false)}
          onViewWallet={handleViewWallet}
          onViewHistory={handleViewHistory}
        />

        {/* Custom Reward Popup */}
        <RewardPopup
          visible={showRewardPopup}
          earnedAmount={earnedAmount}
          onClose={() => setShowRewardPopup(false)}
          onOpenWallet={() => {
            setShowRewardPopup(false);
            navigation.navigate('Wallet' as never);
          }}
          isPremium={isPremium}
          onUpgradePremium={() => {
            setShowRewardPopup(false);
            navigation.navigate('PremiumUser' as never);
          }}
        />

        {/* Debug Button for Reward Popup - Only visible in debug builds */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              setEarnedAmount(isPremium ? 10.0 : 3.0);
              setShowRewardPopup(true);
            }}
          >
            <Text style={styles.debugButtonText}>🐛</Text>
          </TouchableOpacity>
        )}

        {/* Premium Upgrade Alert for Games */}
        <PremiumUpgradeAlert
          visible={showPremiumUpgradeAlert}
          onClose={() => setShowPremiumUpgradeAlert(false)}
          onUpgrade={() => {
            setShowPremiumUpgradeAlert(false);
            navigation.navigate('PremiumUser' as never);
          }}
          title="🎮 Play Games to Earn - Premium Feature!"
          description="Upgrade to Premium to access exciting games and earn up to ₹10000! Play now and start earning rewards."
        />

      </View>
    </ScreenTransition>
    </CPXResearchProvider>
  );
};

// Create home screen styles
const createHomeScreenStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },



  // Categories section
  categoriesSection: {
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  categoriesContainer: {
    paddingLeft: 16,
  },
  categoriesContentContainer: {
    paddingRight: 16,
  },

  // Earn cards carousel section
  earnCardsCarouselSection: {
    backgroundColor: colors.surface,
  },
  // External link banner section
  externalLinkBannerSection: {
    backgroundColor: colors.surface,
  },
  earnCardsCarouselSkeletonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  earnCardCarouselItem: {
    width: screenWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  earnCardVerticalItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  earnCardGradient: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earnCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earnCardTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  earnCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earnCardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  earnCardRewardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  earnCardRewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  earnCardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Skeleton container
  skeletonContainer: {
    padding: 16,
  },

  // Banner ad
  stickyBannerContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
  },

  // Rectangle ad
  rectangleAdContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
  },

  // Loading and error states
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  // Premium banner styles
  premiumContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    paddingVertical: 4,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  crownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  upgradeButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },

  // External Link Banner styles
  externalLinkBannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  externalLinkBanner: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  externalLinkBannerGradient: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  externalLinkBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  externalLinkBannerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  externalLinkBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  externalLinkBannerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  externalLinkBannerUpgradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  externalLinkBannerUpgradeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  externalLinkBannerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },


  headerIconButton: {
    padding: 8,
    borderRadius: 20,
  },
  balanceOval: {
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 40,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inboxBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  inboxBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Modern Banner Styles
  modernBannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modernBannerItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modernBannerGradient: {
    padding: 20,
    minHeight: 120,
  },
  modernBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernBannerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  modernBannerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modernBannerBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modernBannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modernBannerDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 22,
  },
  modernBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  modernBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modernBannerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBannerAppIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBannerAppIconText: {
    fontSize: 30,
  },
  debugButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  debugButtonText: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default HomeScreen;
