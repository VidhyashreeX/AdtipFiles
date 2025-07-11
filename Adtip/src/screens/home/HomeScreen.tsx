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
  Modal,
  Dimensions,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
// Import Lucide React Native icons
import { PlayCircle, Gamepad2, WifiOff, Share2 } from 'lucide-react-native';
import PostWithComments from '../../components/home/PostWithComments';

// Enhanced Contexts & Services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useDataContext} from '../../providers/DataProvider';
import ApiService from '../../services/ApiService';
import {API_BASE_URL} from '../../constants/api';
import {HOME_ENDPOINTS} from '../../constants/apiEndpoints';
import { usePosts, useLikeMutation, useFollowMutation, usePrefetchData, useSubscriptionStatus, useCategories } from '../../hooks/useQueries';
import { useNetInfo } from '@react-native-community/netinfo';
import { formatPremiumExpiryDate } from '../../utils/dateUtils';
import PubScaleService from '../../services/PubScaleService';
import VersionCheckService from '../../services/VersionCheckService';

// Components
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';
import StoryItem from '../../components/home/StoryItem';
import CategoryItem from '../../components/home/CategoryItem';
import EarnCard from '../../components/home/EarnCard';
import BannerCarousel from '../../components/home/BannerCarousel';
import PremiumPopup from '../../components/common/PremiumPopup';
import InstallToEarnPopup from '../../components/common/InstallToEarnPopup';


import ScreenTransition from '../../components/common/ScreenTransition';
import UserProfileScreen from '../profile/UserProfileScreen';

// Skeleton Components
import StoryItemSkeleton from '../../components/skeletons/StoryItemSkeleton';
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

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Interfaces
interface Story { id: string; username: string; imageUrl: string | null; }
interface Category { id: string; name: string; }
interface ApiCategory { category_id: number; category_name: string; }
interface Post {
  id: number; user_id: number; title: string; content: string;
  media_url: string | null; media_type: string; user_name: string;
  user_profile_image: string | null; likeCount: number; commentCount: number;
  is_promoted?: number; created_at: string; is_premium?: boolean;
  is_liked?: boolean; last_active?: string | null;
}
interface HomeScreenProps { walletBalance?: string; }

// Helper Components
interface StoriesRowProps { 
  stories: Story[]; 
  onStoryPress: (storyId: string) => void; 
  onAddStoryPress: () => void; 
  isLoading?: boolean; 
}

const StoriesRow: React.FC<StoriesRowProps> = ({ stories, onStoryPress, onAddStoryPress, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.storiesSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.storiesContainer} 
          contentContainerStyle={styles.storiesContentContainer}
        >
          <StoryItemSkeleton isAddStory={true} />
          {Array(5).fill(0).map((_, index) => (
            <StoryItemSkeleton key={`story-skel-${index}`} />
          ))}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.storiesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesContentContainer}>
        <StoryItem isAddStory={true} onPress={onAddStoryPress} key="add-story" />
        {stories.map((story: Story, idx: number) => (
          <StoryItem 
            key={`${story.id}-${idx}`} 
            imageUrl={story.imageUrl || undefined} 
            username={story.username ? String(story.username) : ''} 
            onPress={() => onStoryPress(story.id)} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

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
  onPlayAndEarn: () => void; 
  onInstallToEarn: () => void; 
  isLoading?: boolean; 
}

// External Link Banner Component
interface ExternalLinkBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

const ExternalLinkBanner: React.FC<ExternalLinkBannerProps> = ({ isPremium, onUpgrade }) => {
  const { colors } = useTheme();
  const styles = createHomeScreenStyles(colors);

  const handleBannerPress = async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }

    try {
      const url = 'https://37b802eb.epicplay.in/';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the link. Please try again later.');
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      Alert.alert('Error', 'Failed to open the link. Please try again.');
    }
  };

  return (
    <View style={styles.externalLinkBannerSection}>
      <View style={styles.externalLinkBannerContainer}>
        <TouchableOpacity
          style={styles.externalLinkBanner}
          onPress={handleBannerPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isPremium ? ['#4CAF50', '#45A049'] : ['#FFD700', '#FFB300']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.externalLinkBannerGradient}
          >
            <View style={styles.externalLinkBannerContent}>
              <View style={styles.externalLinkBannerTextContainer}>
                <Text style={styles.externalLinkBannerTitle}>
                  {isPremium ? '🎮 Epic Play Games' : '🎮 Epic Play Games'}
                </Text>
                <Text style={styles.externalLinkBannerDescription}>
                  {isPremium 
                    ? 'Click to play exciting games and earn rewards!' 
                    : 'Upgrade to Premium to unlock this feature'
                  }
                </Text>
                {!isPremium && (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.externalLinkBannerUpgradeBadge}
                  >
                    <Text style={styles.externalLinkBannerUpgradeText}>Premium Only</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.externalLinkBannerIconContainer}>
                <Gamepad2 size={32} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Rush Play Games Banner Component
interface RushPlayGamesBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

const RushPlayGamesBanner: React.FC<RushPlayGamesBannerProps> = ({ isPremium, onUpgrade }) => {
  const { colors } = useTheme();
  const styles = createHomeScreenStyles(colors);

  const handleBannerPress = async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }

    try {
      const url = 'https://439096e5.rushquiz.com/';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the link. Please try again later.');
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      Alert.alert('Error', 'Failed to open the link. Please try again.');
    }
  };

  return (
    <View style={styles.rushPlayGamesBannerSection}>
      <View style={styles.rushPlayGamesBannerContainer}>
        <TouchableOpacity
          style={styles.rushPlayGamesBanner}
          onPress={handleBannerPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isPremium ? ['#9C27B0', '#7B1FA2'] : ['#FF6B35', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rushPlayGamesBannerGradient}
          >
            <View style={styles.rushPlayGamesBannerContent}>
              <View style={styles.rushPlayGamesBannerTextContainer}>
                <Text style={styles.rushPlayGamesBannerTitle}>
                  {isPremium ? '🧠 Rush Play Games' : '🧠 Rush Play Games'}
                </Text>
                <Text style={styles.rushPlayGamesBannerDescription}>
                  {isPremium 
                    ? 'Test your knowledge with exciting quiz games!' 
                    : 'Upgrade to Premium to unlock this feature'
                  }
                </Text>
                {!isPremium && (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rushPlayGamesBannerUpgradeBadge}
                  >
                    <Text style={styles.rushPlayGamesBannerUpgradeText}>Premium Only</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.rushPlayGamesBannerIconContainer}>
                <Gamepad2 size={32} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EarnCardsRow: React.FC<EarnCardsRowProps> = ({ onWatchAndEarn, onPlayAndEarn, onInstallToEarn, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);
  
  // Define earn cards data
  const earnCardsData = [
    {
      id: '2',
      title: 'Play & Earn',
      description: 'Play games and earn double rewards',
      iconName: 'gamepad-2',
      onPress: onPlayAndEarn,
      gradientColors: ['#1565C0', '#1976D2', '#0D47A1'],
    },
    {
      id: '3',
      title: 'Install to Earn',
      description: 'Complete tasks to earn rewards',
      iconName: 'gamepad-2',
      onPress: onInstallToEarn,
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
                colors={['#FFD700', '#FFA500', '#FF8C00']} // Gold gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.earnCardRewardBadge}
              >
                <Text style={styles.earnCardRewardText}>2x Rewards!</Text>
              </LinearGradient>
            </View>
            <View style={styles.earnCardIconContainer}>
              <Gamepad2 size={32} color="#FFFFFF" />
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
    </View>
  );
};

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; 
  }
  return newArray;
}

// MAIN COMPONENT - Enhanced with bulletproof navigation
const HomeScreen: React.FC<HomeScreenProps> = ({walletBalance: hocWalletBalance}) => {
  const {colors, isDarkMode} = useTheme();
  const {user, refreshUserData} = useAuth();
  const navigation = useNavigation<AppNavigationProps>();
  const {contentPaddingBottom} = useTabNavigator();
  const {clearCache, invalidateData} = useDataContext();
  const queryClient = useQueryClient();
  const styles = createHomeScreenStyles(colors);

  // UI state management (never blocks navigation)
  const [selectedCategoryState, setSelectedCategoryState] = useState<string>('0');
  
  // Fetch categories from API
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
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
  const [walletAmount] = useState(hocWalletBalance || '0.00');
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isGloballyMuted, setIsGloballyMuted] = useState(true);
  const [offerwallLoading, setOfferwallLoading] = useState(false);

  // Add premium state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumData, setPremiumData] = useState<any>(null);

  // Version check and premium popup state
  const [showPremiumPopup, setShowPremiumPopup] = useState<boolean>(false);
  const [hasCheckedVersion, setHasCheckedVersion] = useState<boolean>(false);

  // Install to earn popup state
  const [showInstallToEarnPopup, setShowInstallToEarnPopup] = useState(false);

  // Log when HomeScreen mounts
  useEffect(() => {
    console.log('🏠 [HomeScreen] Component mounted with user:', user?.id);
  }, [user?.id]);

  // Banner state
  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState<boolean>(true);

  // Enhanced data layer using React Query v5 hooks
  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage: postsLoadingMore,
    error: postsError,
    refetch: refreshPosts,
    fetchNextPage: loadMorePosts,
    hasNextPage: hasMorePosts,
  } = usePosts(
    selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0,
    user?.id
  );

  // Use TanStack Query for subscription status
  const { 
    data: subscriptionResponse, 
    isLoading: subscriptionLoading, 
    error: subscriptionError 
  } = useSubscriptionStatus(user?.id || 0);

  // Log subscription API calls and responses
  useEffect(() => {
    console.log('🔍 [HomeScreen] Subscription API Response:', {
      userId: user?.id,
      response: subscriptionResponse,
      isLoading: subscriptionLoading,
      error: subscriptionError
    });
  }, [subscriptionResponse, subscriptionLoading, subscriptionError, user?.id]);

  // Update premium state based on query result
  useEffect(() => {
    console.log('🔄 [HomeScreen] Processing subscription response:', subscriptionResponse);
    
    if (subscriptionResponse && subscriptionResponse.status && subscriptionResponse.data) {
      // User has an active subscription
      const isPremiumActive = subscriptionResponse.data.is_active === true;
      console.log('✅ [HomeScreen] User has active premium:', {
        isPremiumActive,
        planName: subscriptionResponse.data.plan_name,
        amount: subscriptionResponse.data.amount,
        billingCycle: subscriptionResponse.data.billing_cycle
      });
      setIsPremium(isPremiumActive);
      setPremiumData(isPremiumActive ? subscriptionResponse.data : null);
    } else {
      // No subscription found or inactive
      console.log('❌ [HomeScreen] No active subscription found');
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
        // Check for app updates first
        const versionCheckService = VersionCheckService.getInstance();
        const updateInfo = await versionCheckService.checkForUpdates();
        
        if (updateInfo && updateInfo.data) {
          console.log('⚠️ [HomeScreen] Update required, showing update dialog');
          versionCheckService.showUpdateDialog(updateInfo.data);
          return; // Don't show premium popup if update is required
        }

        // Check premium status and show popup if needed
        if (subscriptionResponse && !subscriptionResponse.status && !subscriptionLoading) {
          console.log('💎 [HomeScreen] No premium subscription found, showing premium popup');
          setShowPremiumPopup(true);
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

  // Show premium popup when subscription is not active
  useEffect(() => {
    if (subscriptionResponse && !subscriptionResponse.status && !subscriptionLoading && !hasCheckedVersion) {
      console.log('💎 [HomeScreen] Showing premium popup for non-premium user');
      setShowPremiumPopup(true);
    }
  }, [subscriptionResponse, subscriptionLoading, hasCheckedVersion]);

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

  // Transform posts data for compatibility
  const posts = useMemo(() => {
    return postsData?.pages?.flatMap(page => page?.data || []) || [];
  }, [postsData]);

  // Like and Follow mutations
  const likeMutation = useLikeMutation();
  const followMutation = useFollowMutation();

  // Prefetch data for better performance
  const { prefetchPosts, prefetchProfile } = usePrefetchData();

  // Network state for offline handling
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected;

  // Static data for now - can be enhanced later with API calls
  const stories: Story[] = [];



  // Optimistic mutations for instant UI feedback (now using the new hooks)
  const handleLikePost = useCallback((postId: number, isLiked: boolean) => {
    if (!user?.id) {
      console.warn('Cannot like post: User not logged in');
      return;
    }
    likeMutation.mutate({ postId, userId: user.id, isLiked });
  }, [likeMutation, user?.id]);

  const handleFollowUser = useCallback((userId: number, isFollowing: boolean) => {
    followMutation.mutate({ userId, isFollowing });
  }, [followMutation]);

  // Prefetch posts and profile data
  const handlePostPress = useCallback((postId: number, userId: number) => {
    // Navigate to post details - use 'as any' to handle navigation typing
    navigation.navigate('PostDetail' as any, { postId, userId });
    
    // Prefetch post and author profile - fix type mismatch
    prefetchPosts(postId);
    prefetchProfile(userId);
  }, [navigation, prefetchPosts, prefetchProfile]);

  // Network-aware retry logic
  const handleRetry = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }
    
    // Retry logic here
    refreshPosts();
  }, [isOnline, refreshPosts]);
  
  // Premium banner render function
  const renderPremiumBanner = useCallback(() => {
    if (subscriptionLoading) return null;
    if (!isPremium) {
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}> 
          <LinearGradient colors={['#FFD700', '#FFB300']} style={styles.premiumBanner}>
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>Earn More Now!</Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('PremiumUser' as never)} activeOpacity={0.8}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    } else {
      // Show premium active banner with expiry date
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.premiumBanner}>
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Premium Active</Text>
              <Text style={styles.premiumSubtitle}>
                {premiumData?.end_time ? `Expires: ${formatPremiumExpiryDate(premiumData.end_time)}` : 'Premium Features Unlocked'}
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('PremiumUser' as never)} activeOpacity={0.8}>
              <Text style={styles.upgradeButtonText}>Manage</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }
  }, [subscriptionLoading, isPremium, premiumData, isDarkMode, colors, navigation]);

  // Use categories from API
  const displayCategories = categories;
  const displayStories = stories || [];
  const displayPosts = posts || [];

  // Derived state for UI
  const initialLoading = postsLoading && displayPosts.length === 0;
  const isRefreshing = false; // Managed by data layer

  // Instant event handlers - never block navigation
  const getFullImageUrl = useCallback((url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

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

  const handleStoryPress = useCallback((storyId: string) => {
    console.log('Story pressed:', storyId);
    // Navigate instantly without waiting for data
    // navigation.navigate('StoryViewer', { storyId });
  }, []);

  const handleAddStoryPress = useCallback(() => {
    Alert.alert('Coming Soon', 'The Add Story feature is coming soon!');
  }, []);

  const handleWatchAndEarn = useCallback(() => {
    console.log('Watch and earn pressed');
    navigation.navigate('TipTube' as never);
  }, [navigation]);

  const handlePlayAndEarn = useCallback(() => {
    console.log('Play and earn pressed');
    navigation.navigate('PlayToEarn' as never);
  }, [navigation]);

  const handleInstallToEarn = useCallback(async () => {
    if (!isPremium) {
      setShowInstallToEarnPopup(true);
      return;
    }
    try {
      const userId = user?.id ? String(user.id) : 'anonymous-user';
      setOfferwallLoading(true);
      await PubScaleService.showOfferwall();
      console.log('Offerwall launched successfully');
    } catch (error) {
      console.error('Failed to show offerwall:', error);
      Alert.alert('Error', 'Failed to load offerwall. Please try again later.', [{ text: 'OK' }]);
    } finally {
      setOfferwallLoading(false);
    }
  }, [isPremium, user?.id]);

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
    setSelectedCommentPostId(postId);
    setCommentModalVisible(true);
  }, []);

  const handleUserProfilePress = useCallback((userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  }, []);

  const handleSearchIconPress = useCallback(() => {
    (navigation as any).navigate('Search');
  }, [navigation]);



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
          onShare={(postId: number) => {
            const deepLink = `https://adtip.in/tiptube?videoId=${postId}`;
            Share.share({ message: `Check out this video: ${deepLink}` });
          }}
          onPostPress={(postId: number) => console.log('Post pressed:', postId)}
          onUserPress={handleUserProfilePress}
          onFollow={handleUserFollow}
        />
        
        {/* Rectangle ad after every 3rd post (starting from post 2) */}
        {(index + 1) % 3 === 0 && index > 0 && (
          <View style={styles.rectangleAdContainer}>
            <RectangleAdComponent />
          </View>
        )}
      </>
    );
  }, [visiblePostIds, getTimeAgo, handlePostLike, handleCommentPress, handleUserProfilePress, handleUserFollow, styles, isGloballyMuted, handleToggleGlobalMute]);

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
      <ScreenTransition>
        <View style={[styles.container, {backgroundColor: colors.background}]}>
          <Header 
            title="" 
            onSearchSubmit={handleSearchIconPress}
          />
          <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, {paddingBottom: contentPaddingBottom}]}>
            <StoriesRow stories={[]} onStoryPress={handleStoryPress} onAddStoryPress={handleAddStoryPress} isLoading={true} />
            <CategoriesRow categories={[]} selectedCategory={null} onCategoryPress={handleCategoryPress} isLoading={true} />
                          <BannerCarousel />
            <EarnCardsRow onWatchAndEarn={handleWatchAndEarn} onPlayAndEarn={handlePlayAndEarn} onInstallToEarn={handleInstallToEarn} isLoading={true} />
            <ExternalLinkBanner isPremium={isPremium} onUpgrade={() => navigation.navigate('PremiumUser' as never)} />
            <RushPlayGamesBanner isPremium={isPremium} onUpgrade={() => navigation.navigate('PremiumUser' as never)} />
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
            onSearchSubmit={handleSearchIconPress}
          />
          <View style={styles.errorContainer}>
            <WifiOff size={48} color={colors.danger || '#FF0000'} />
            <Text style={[styles.errorTitle, {color: colors.text.primary}]}>Something went wrong</Text>
            <Text style={[styles.errorMessage, {color: colors.text.secondary}]}>
              {postsError.message || 'Failed to load posts'}
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
          <ScreenTransition>
        <View style={[styles.container, {backgroundColor: colors.background}]}>
          <Header 
            title="" 
            onSearchSubmit={handleSearchIconPress}
          />
          <FlatList
          data={displayPosts}
          renderItem={renderPostItem}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: contentPaddingBottom}]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          windowSize={15}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListHeaderComponent={() => (
            <>
              {renderPremiumBanner()}
              <StoriesRow stories={displayStories} onStoryPress={handleStoryPress} onAddStoryPress={handleAddStoryPress} />
              <CategoriesRow categories={displayCategories} selectedCategory={selectedCategoryState} onCategoryPress={handleCategoryPress} isLoading={categoriesLoading} />
              <BannerCarousel onBannerPress={handleBannerPress} />
              <EarnCardsRow onWatchAndEarn={handleWatchAndEarn} onPlayAndEarn={handlePlayAndEarn} onInstallToEarn={handleInstallToEarn} />
              <ExternalLinkBanner isPremium={isPremium} onUpgrade={() => navigation.navigate('PremiumUser' as never)} />
              <RushPlayGamesBanner isPremium={isPremium} onUpgrade={() => navigation.navigate('PremiumUser' as never)} />
              <InstallToEarnPopup
                visible={showInstallToEarnPopup}
                onClose={() => setShowInstallToEarnPopup(false)}
                onUpgrade={() => {
                  setShowInstallToEarnPopup(false);
                  navigation.navigate('PremiumUser' as never);
                }}
              />
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
            //@ts-ignore
            initialCommentCount={
              displayPosts.find(post => post.id === selectedCommentPostId)?.commentCount || 0
            }
          />
        )}

        {/* User Profile Modal */}
        <Modal
          visible={showUserProfileModal}
          animationType="slide"
          onRequestClose={() => {
            setShowUserProfileModal(false);
            setSelectedUserId(null);
          }}
        >
          {selectedUserId && (
            <UserProfileScreen
              userId={selectedUserId}
            />
          )}
        </Modal>

        {/* Premium Popup */}
        <PremiumPopup
          visible={showPremiumPopup}
          onClose={() => setShowPremiumPopup(false)}
          onUpgrade={() => {
            console.log('🚀 [HomeScreen] Premium upgrade initiated from popup');
            setShowPremiumPopup(false);
          }}
        />

      </View>
    </ScreenTransition>
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

  // Stories section
  storiesSection: {
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  storiesContainer: {
    paddingLeft: 16,
  },
  storiesContentContainer: {
    paddingRight: 16,
  },

  // Categories section
  categoriesSection: {
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // External link banner section
  externalLinkBannerSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rushPlayGamesBannerSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Rectangle ad
  rectangleAdContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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

  // Rush Play Games Banner styles
  rushPlayGamesBannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rushPlayGamesBanner: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  rushPlayGamesBannerGradient: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rushPlayGamesBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rushPlayGamesBannerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  rushPlayGamesBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rushPlayGamesBannerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  rushPlayGamesBannerUpgradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rushPlayGamesBannerUpgradeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  rushPlayGamesBannerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
