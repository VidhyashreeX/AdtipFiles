import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  StatusBar,
  SafeAreaView,
  Switch,
  Modal,
  ViewToken,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { CirclePlay, Gamepad2 } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import debounce from 'lodash.debounce';

import { useTheme } from '../../contexts/ThemeContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDataContext } from '../../providers/DataProvider';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import { useVideos, useGuestVideos, useSearchVideos, usePrefetchData, useChannelData } from '../../hooks/useQueries';
import { useNetInfo } from '@react-native-community/netinfo';
import { useGuestGuard } from '../../hooks/useGuestGuard';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import ScreenTransition from '../../components/common/ScreenTransition';
import AnimatedVideoCard from './AnimatedVideoCard';
import { 
  getSecureMediaUrl, 
  getFallbackAvatarUrl, 
  getFallbackThumbnailUrl 
} from '../../utils/mediaUtils';

import ApiService from '../../services/ApiService';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PubScaleService from '../../services/PubScaleService';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import VideoCommentsModal from '../../components/tiptube/VideoCommentsModal';
import LoginPromptModal from '../../components/modals/LoginPromptModal';
import PubScaleCreditAlert from '../../components/common/PubScaleCreditAlert';
import useSimpleRewardedAd from '../../googleads/SimpleRewardedAd';
import AnalyticsPremiumAlert from '../../components/alerts/AnalyticsPremiumAlertNew';

// Get screen dimensions and create constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants - YouTube-like layout
const HORIZONTAL_PADDING = 16;
const VERTICAL_SPACING = 16;
const CARD_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16; // 16:9 aspect ratio

// Reward constants
const REWARD_INTERVAL = 5;
const NON_PREMIUM_REWARD = 0.03;
const PREMIUM_REWARD = 0.06;

// Define interfaces
interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
  isPaidPromotional: number;
  contentCreatorPlanId: number;
}

interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  thumbnailLayout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Categories
const categories = [
  { name: 'All', icon: '🌍' }, 
  { name: 'Gaming', icon: '🎮' }, 
  { name: 'Music', icon: '🎵' },
  { name: 'Education', icon: '📚' }, 
  { name: 'Sports', icon: '⚽️' }, 
  { name: 'Tech', icon: '💻' },
  { name: 'News', icon: '📰' }, 
  { name: 'Comedy', icon: '😂' },
];

const categoryToIdMap: { [key: string]: number } = {
  All: 0, Gaming: 1, Music: 2, Education: 3, Sports: 4, Tech: 5, News: 6, Comedy: 7,
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const TipTubeSearchBar = ({
  value,
  onChangeText,
  onSubmitEditing,
  onBack,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  onBack: () => void;
  colors: any;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      width: '100%',
      zIndex: 10,
    }}
  >
    <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 4 }}>
      <Icon name="arrow-left" size={24} color={colors.text.primary} />
    </TouchableOpacity>
    <TextInput
      style={{
        flex: 1,
        height: 40,
        backgroundColor: colors.cardSecondary,
        borderRadius: 20,
        paddingHorizontal: 16,
        color: colors.text.primary,
        fontSize: 16,
      }}
      placeholder="Search YouTube"
      placeholderTextColor={colors.text.secondary}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      autoFocus
      returnKeyType="search"
    />
  </View>
);

// Main TipTube Screen - Enhanced with React Query v5 data layer
const TipTubeScreen = () => {
  const queryClient = useQueryClient();
  const { isDarkMode, colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const { user, isGuest } = useAuth();
  const { clearCache } = useDataContext();
  const { requireAuth } = useGuestGuard();
  const navigation = useNavigation<any>();
  const netInfo = useNetInfo();
  const route = useRoute();
  const videoId: string | undefined = (route.params && typeof route.params === 'object' && 'videoId' in route.params) ? String((route.params as any).videoId) : undefined;

  // UI state management (decoupled from navigation)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTipTubeSearchActive, setIsTipTubeSearchActive] = useState(false);
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [userChannelId, setUserChannelId] = useState<string | null>(null);
  const [openPlayer, setOpenPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [showChannelVideos, setShowChannelVideos] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Login prompt modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');

  // PubScale state
  const [offerwallLoading, setOfferwallLoading] = useState(false);
  const [showPubScaleCreditAlert, setShowPubScaleCreditAlert] = useState(false);

  // Analytics premium alert state
  const [showAnalyticsPremiumAlert, setShowAnalyticsPremiumAlert] = useState(false);

  // Content Creator Premium State - Using shared context
  const { 
    isContentCreatorPremium, 
    contentCreatorPremiumData, 
    refreshContentCreatorPremiumStatus,
    isLoading: contentCreatorPremiumLoading 
  } = useContentCreatorPremium();

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const isFirstRun = useRef(true);

  // Enhanced data layer using React Query v5
  const categoryId = categoryToIdMap[selectedCategory] || 0;
  
  // Use different hooks based on guest mode and search state
  const authenticatedVideosQuery = searchQuery && searchQuery.trim()
    ? useSearchVideos(searchQuery.trim(), user?.id)
    : useVideos(categoryId, user?.id, undefined, showChannelVideos);

  const guestVideosQuery = useGuestVideos();

  // Choose the appropriate query based on guest mode
  const {
    data: videosData,
    isLoading: videosLoading,
    isFetchingNextPage: videosLoadingMore,
    error: videosError,
    refetch: refreshVideos,
    fetchNextPage: loadMoreVideos,
    hasNextPage: hasMoreVideos,
  } = isGuest ? {
    data: guestVideosQuery.data,
    isLoading: guestVideosQuery.isLoading,
    isFetchingNextPage: false, // Guest mode doesn't support pagination
    error: guestVideosQuery.error,
    refetch: guestVideosQuery.refetch,
    fetchNextPage: () => Promise.resolve({ data: undefined, pageParam: undefined, direction: 'forward' as const }),
    hasNextPage: false,
  } : authenticatedVideosQuery;

  // Prefetch data for better performance
  const { prefetchProfile } = usePrefetchData();

  // Define or use existing fetch logic
  const fetchVideoById = async (id: string | number) => {
    // Implement logic to fetch and set the video by id
    // If you already have this logic, use it here
  };
  const fetchFeed = async () => {
    // Implement logic to fetch the feed
    // If you already have this logic, use it here
  };

  // Fetch data on initial mount
  useEffect(() => {
    if (videoId) {
      fetchVideoById(videoId).then(() => {
        fetchFeed();
      });
    } else {
      fetchFeed();
    }
  }, [videoId]);

  // Refetch data on subsequent screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      
      console.log('[TipTubeScreen] Screen focused. Refetching videos.');
      refreshVideos();
    }, [refreshVideos])
  );

  // Use TanStack Query hook for channel data instead of manual API call
  const {
    data: channelData,
    isLoading: channelLoading,
  } = useChannelData(user?.id || 0);

  // Update userChannelId when channel data changes
  useEffect(() => {
    console.log('[TipTubeScreen] Channel data changed:', {
      status: channelData?.status,
      dataLength: channelData?.data?.length,
      channelId: channelData?.data?.[0]?.channelId,
      fullData: channelData?.data?.[0]
    });

    if (channelData?.status === 200 && channelData?.data?.length > 0) {
      const newChannelId = String(channelData.data[0].channelId);
      console.log('[TipTubeScreen] Setting userChannelId to:', newChannelId);
      setUserChannelId(newChannelId);
    } else {
      console.log('[TipTubeScreen] No valid channel data found');
      setUserChannelId(null);
    }
  }, [channelData]);

  // Fetch comments for a video


  // Helper function to show login prompt for guest users
  const showLoginPromptForAction = useCallback((action: string) => {
    setLoginPromptMessage(`Login to ${action}`);
    setShowLoginPrompt(true);
  }, []);

  // Toggle comments section
  const toggleComments = useCallback((videoId: number) => {
    if (isGuest) {
      showLoginPromptForAction('view and add comments');
      return;
    }
    setShowComments(!showComments);
  }, [showComments, isGuest, showLoginPromptForAction]);

  // Handle liking a video
  const handleLikeVideo = useCallback(async (video: Video) => {
    if (isGuest) {
      showLoginPromptForAction('like videos');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to like videos.');
      return;
    }
    const isLiked = likedVideos.has(video.id);
    try {
      await ApiService.saveVideoLike(video.id, user.id, isLiked ? 0 : 1, Number(video.channelId));
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(video.id);
        } else {
          newSet.add(video.id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('[TipTubeScreen] Error liking video:', error);
      Alert.alert('Error', 'Failed to like the video. Please try again.');
    }
  }, [user?.id, isGuest, likedVideos, showLoginPromptForAction]);

  // Handle adding a comment




  // Function to calculate relative time
  const calculateRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  };

  // Transform videos data for compatibility and proper typing
  const videos = useMemo(() => {
    let allVideos: any[] = [];

    if (isGuest) {
      // Guest mode: videosData is a single response object
      allVideos = (videosData as any)?.data || [];
    } else {
      // Authenticated mode: videosData has pages for infinite query
      if (videosData && 'pages' in videosData) {
        allVideos = (videosData as any).pages?.flatMap((page: any) => page?.data || []) || [];
      } else {
        allVideos = (videosData as any)?.data || [];
      }
    }

    console.log('[TipTubeScreen] Raw videos data:', {
      isGuest,
      pagesCount: isGuest ? 1 : ((videosData as any)?.pages?.length || 0),
      firstPage: isGuest ? (videosData as any)?.data?.slice(0, 2) : (videosData as any)?.pages?.[0]?.data?.slice(0, 2),
      allVideosCount: allVideos.length
    });
    
    // Transform API videos to Video interface format
    const transformedVideos = allVideos.map((apiVideo: any) => ({
      id: apiVideo.id || 0,
      title: apiVideo.name || apiVideo.title || "Untitled Video",
      thumbnail: apiVideo.video_Thumbnail || getFallbackThumbnailUrl(apiVideo.id),
      videoUrl: apiVideo.video_link || apiVideo.videoUrl || '',
      duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
      views: apiVideo.total_views || 0,
      posted: apiVideo.createddate ? calculateRelativeTime(apiVideo.createddate) : "Recently",
      avatar: apiVideo.channel_profile || getFallbackAvatarUrl(apiVideo.createdby || apiVideo.id),
      creatorName: apiVideo.channelName || apiVideo.channel_name || "Unknown Creator",
      isVerified: false,
      channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
      price: apiVideo.promotional_price ? parseFloat(apiVideo.promotional_price) : 0,
      isPaidPromotional: apiVideo.is_paid_promotional || 0,
      contentCreatorPlanId: apiVideo.content_creator_plan_id || 0
    }));
    
    console.log('[TipTubeScreen] Transformed videos:', {
      count: transformedVideos.length,
      firstVideo: transformedVideos[0]
    });
    
    return transformedVideos;
  }, [videosData, isGuest]);

  // Network state for offline handling
  const isOnline = netInfo.isConnected;

  // Derived state for UI
  const initialLoading = videosLoading && videos.length === 0;
  const loadingMore = videosLoadingMore;
  const hasMore = hasMoreVideos;

  // Memoized styles
  const styles = useMemo(() => createYouTubeStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Enhanced event handlers using React Query
  const handleRefresh = useCallback(() => {
    console.log('[TipTubeScreen] Pull to refresh triggered');
    refreshVideos();
  }, [refreshVideos]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      console.log('[TipTubeScreen] Loading more videos');
      loadMoreVideos();
    }
  }, [loadingMore, hasMore, loadMoreVideos]);

  const handleCategoryChange = useCallback((categoryName: string) => {
    console.log('[TipTubeScreen] Category changed to:', categoryName);
    setSelectedCategory(categoryName);
    // Clear search when changing categories
    setSearchQuery('');
    // Clear cache for better UX on category change
    clearCache(`videos-${categoryToIdMap[selectedCategory]}`);
  }, [selectedCategory, clearCache]);



  const handleTipTubeSearch = useCallback((query: string) => {
    console.log('[TipTubeScreen] TipTube search submitted:', query);
    setSearchQuery(query);
    setIsTipTubeSearchActive(false);
    // Clear cache to force fresh search results
    if (query.trim()) {
      console.log('[TipTubeScreen] Using search API for query:', query.trim());
      clearCache(`searchVideos-${query.trim()}`);
    } else {
      console.log('[TipTubeScreen] Using regular videos API');
      clearCache(`videos-${categoryId}`);
    }
  }, [categoryId, clearCache]);

  const handleTipTubeSearchChange = useCallback((query: string) => {
    console.log('[TipTubeScreen] TipTube search query changed:', query);
    setSearchQuery(query || '');
  }, []);

  const handleTipTubeSearchSubmit = useCallback(() => {
    if (searchQuery && searchQuery.trim()) {
      handleTipTubeSearch(searchQuery.trim());
    }
  }, [searchQuery, handleTipTubeSearch]);

  const handleMyChannel = useCallback(() => {
    console.log('[TipTubeScreen] handleMyChannel called:', {
      isGuest,
      userChannelId,
      userId: user?.id,
      hasUserChannelId: !!userChannelId,
      hasUserId: !!user?.id
    });

    if (isGuest) {
      showLoginPromptForAction('access your channel');
      return;
    }
    if (userChannelId && user?.id) {
      // Note: Despite the parameter name being 'channelId', we pass the userId
      // because the ChannelScreen API expects userId, not channelId
      console.log('[TipTubeScreen] Navigating to Channel with userId:', String(user.id));
      navigation.navigate('Channel', { channelId: String(user.id) });
    } else {
      // If no channel found, redirect to create channel
      console.log('[TipTubeScreen] No channel found, redirecting to CreateChannel');
      navigation.navigate('CreateChannel');
    }
  }, [userChannelId, user?.id, isGuest, navigation, showLoginPromptForAction]);

  const handleNavigateToChannel = useCallback((channelData: {
    channelId: string;
    channelName: string;
    avatar?: string;
    isVerified?: boolean;
    createdBy?: number;
  }) => {
    if (isGuest) {
      showLoginPromptForAction('view channels');
      return;
    }
    navigation.navigate('Channel', {
      channelId: channelData.channelId,
      channelData: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        profileImage: channelData.avatar,
        isVerified: channelData.isVerified || false,
        createdBy: channelData.createdBy
      }
    });
  }, [isGuest, navigation, showLoginPromptForAction]);

  const handleAnalytics = useCallback(() => {
    // Check if user is in guest mode
    if (isGuest) {
      showLoginPromptForAction('access analytics');
      return;
    }

    // Check if user has content creator premium
    if (!isContentCreatorPremium) {
      setShowAnalyticsPremiumAlert(true);
      return;
    }

    if (userChannelId) {
      navigation.navigate('Analytics', { channelId: userChannelId });
    } else {
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel');
    }
  }, [userChannelId, navigation, isGuest, showLoginPromptForAction, isContentCreatorPremium]);

  const handleNavigateToTipShorts = useCallback(() => {
    navigation.navigate('TipShorts');
  }, [navigation]);

  // Handle analytics premium alert actions
  const handleAnalyticsPremiumUpgrade = useCallback(() => {
    setShowAnalyticsPremiumAlert(false);
    navigation.navigate('ContentCreatorPremium');
  }, [navigation]);

  const handleAnalyticsPremiumGoBack = useCallback(() => {
    setShowAnalyticsPremiumAlert(false);
  }, []);

  // PubScale handlers
  const handleInstallToEarn = useCallback(async () => {
    // Allow all users to access PubScale - no premium restriction
    try {
      setOfferwallLoading(true);
      await PubScaleService.showOfferwall();
      console.log('Offerwall launched successfully');

      // Show enhanced credit alert after user returns from PubScale
      setShowPubScaleCreditAlert(true);
    } catch (error) {
      console.error('Failed to show offerwall:', error);
      Alert.alert('Error', 'Failed to load offerwall. Please try again later.', [{ text: 'OK' }]);
    } finally {
      setOfferwallLoading(false);
    }
  }, []);

  // Handle PubScale credit alert actions
  const handleViewWallet = useCallback(() => {
    navigation.navigate('Wallet' as never);
  }, [navigation]);

  const handleViewHistory = useCallback(() => {
    navigation.navigate('Wallet' as never);
  }, [navigation]);

  // Reward ads state
  const isPremium = user && typeof user.is_premium === 'boolean' ? user.is_premium : false;
  const [videoCount, setVideoCount] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [isDevelopmentMode] = useState(__DEV__); // Development mode flag

  // Handle video view for reward ads (triggered on scroll/view, not completion)
  const handleVideoView = useCallback(() => {
    setVideoCount(prev => {
      const newCount = prev + 1;
      console.log(`🎬 [TipTube] Video viewed. Count: ${newCount}`);
      // Only show reward ad after exactly 5th video
      if (newCount === 5) {
        console.log('🎁 [TipTube] 5th video reached! Showing reward ad...');
        // Check if we have ads available
        const hasAds = videos.length > 0;
        if (hasAds) {
          // Show reward ad immediately
          showRewardAd();
        } else {
          console.log('⚠️ [TipTube] No ads available, skipping reward');
        }
        // Reset counter after showing reward
        return 0;
      }
      return newCount;
    });
  }, [videos.length]);

  // Show reward ad
  const showRewardAd = useCallback(() => {
    console.log('🎁 [TipTube] Showing reward ad...');
    
    // Determine reward amount based on premium status
    const rewardAmount = isPremium ? 0.06 : 0.03;
    setEarnedAmount(rewardAmount);
    
    // In development mode, just show popup without API call
    if (isDevelopmentMode) {
      console.log('🔧 [TipTube] Development mode: Showing popup without API call');
      setShowRewardPopup(true);
      return;
    }
    
    // In production, show actual reward ad
    // For now, simulate reward ad completion
    console.log('🎁 [TipTube] Production mode: Would show actual reward ad');
    setShowRewardPopup(true);
  }, [isPremium, isDevelopmentMode]);

  // Handle reward popup actions
  const handleRewardPopupAction = useCallback(async (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => {
    console.log(`🎁 [TipTube] Reward popup action: ${action}`);
    
    if (action === 'upgrade') {
      // Navigate to premium upgrade
      navigation.navigate('Packages' as never);
    } else if (action === 'gotit') {
      // Close popup
      setShowRewardPopup(false);
    } else if (action === 'wallet') {
      // Navigate to wallet
      navigation.navigate('Wallet');
    }
    
    // In production mode, credit wallet
    if (!isDevelopmentMode) {
      try {
        console.log('💰 [TipTube] Crediting wallet with amount:', earnedAmount);
        const response = await fetch(`${API_BASE_URL}/wallet/credit-ad-reward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            amount: earnedAmount,
            source: 'tiptube_reward'
          })
        });
        
        const result = await response.json();
        if (result.status) {
          console.log('✅ [TipTube] Wallet credited successfully');
          // Update wallet balance in context if needed
        } else {
          console.log('❌ [TipTube] Failed to credit wallet:', result.message);
        }
      } catch (error) {
        console.error('❌ [TipTube] Error crediting wallet:', error);
      }
    } else {
      console.log('🔧 [TipTube] Development mode: Skipping wallet credit');
    }
  }, [earnedAmount, isDevelopmentMode, navigation]);

  // Handle video press with view API calls
  const handleVideoPress = useCallback(async (video: Video) => {
    console.log('[TipTubeScreen] Video pressed:', { id: video.id, title: video.title, isPaid: video.isPaidPromotional });

    // Check if user is in guest mode
    if (isGuest) {
      showLoginPromptForAction('watch videos');
      return;
    }

    setSelectedVideoId(video.id);
    try {
      if (video.isPaidPromotional && video.contentCreatorPlanId > 0) {
        // Paid video: call viewPaidVideo
        const response = await ApiService.viewPaidVideo(video.id);
        if (response.status === true) {
          // Use the video_link from the response if present
          const videoUrl = response.data?.video_link || video.videoUrl;
          navigation.navigate('VideoPlayerModal', {
            video: { ...video, videoUrl },
            upNextVideos: shuffleArray(videos.filter((v: Video) => v.id !== video.id)).slice(0, 10)
          });
          handleVideoView(); // Increment video count on view change
        } else {
          Alert.alert(
            'Insufficient Balance',
            'You do not have enough balance to watch this video.'
          );
        }
      } else {
        // Normal video: call viewNormalVideo and navigate
        await ApiService.viewNormalVideo(video.id);
        navigation.navigate('VideoPlayerModal', {
          video,
          upNextVideos: shuffleArray(videos.filter((v: Video) => v.id !== video.id)).slice(0, 10)
        });
        handleVideoView(); // Increment video count on view change
      }
      
      // Simulate video completion after a delay (for reward ads)
      setTimeout(() => {
        handleVideoView();
      }, 5000); // Simulate 5 seconds of video watching
      
    } catch (error) {
      console.error('[TipTubeScreen] Error handling video press:', error);
      Alert.alert('Error', 'There was an issue accessing this video. Please try again later.');
    }
  }, [videos, navigation, isGuest, showLoginPromptForAction, handleVideoView]);

  // Render helper functions
  const renderSkeletonLoading = useCallback(() => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonContent}>
        {Array.from({ length: 6 }, (_, index) => (
          <VideoCardSkeleton key={`skeleton-${index}`} isYouTubeLayout={true} />
        ))}
      </View>
    </View>
  ), [styles]);

  const renderFooter = useCallback(() => {
    if (!hasMore && videos.length > 0) {
      return (
        <View style={styles.footerLoading}>
          <Text style={styles.footerLoadingText}>No more videos</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoadingText}>Loading more videos...</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, videos.length, loadingMore, styles, colors.primary]);

  const renderEmptyState = useCallback(() => {
    if (initialLoading) return null;

    const hasSearchQuery = searchQuery && searchQuery.trim();

    return (
      <View style={styles.emptyContainer}>
        <Icon 
          name={hasSearchQuery ? "search" : "video"} 
          size={48} 
          color={colors.text.tertiary} 
        />
        <Text style={styles.emptyText}>
          {videosError && !isOnline 
            ? 'You\'re offline. Videos will load when you\'re back online.'
            : videosError 
            ? 'Failed to load videos. Please try again.'
            : hasSearchQuery
            ? `No videos found for "${searchQuery.trim()}"`
            : 'No videos available'}
        </Text>
        {hasSearchQuery && (
          <Text style={[styles.emptyText, {color: colors.text.tertiary, fontSize: 14, marginTop: 8}]}>
            Try searching with different keywords
          </Text>
        )}
      </View>
    );
  }, [initialLoading, videosError, isOnline, searchQuery, styles, colors.text.tertiary]);

  // Render EarnCardsRow component
  const renderEarnCardsRow = useCallback(() => {
    const earnCardsData = [
      {
        id: '3',
        title: 'Install to Earn',
        description: 'Complete tasks to earn rewards',
        iconName: 'gamepad-2',
        onPress: handleInstallToEarn,
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

    return (
      <View style={styles.earnCardsCarouselSection}>
        {earnCardsData.map(renderEarnCard)}
      </View>
    );
  }, [handleInstallToEarn, styles]);

  // Render category header
  const renderCategoryHeader = useCallback(() => (
    <View>
      {/* Install to Earn PubScale Banner */}
      {renderEarnCardsRow()}

      <View style={styles.categoryContainer}>
        {searchQuery && searchQuery.trim() && (
          <View style={styles.searchIndicator}>
            <Icon name="search" size={16} color={colors.primary} />
            <Text style={[styles.searchIndicatorText, {color: colors.primary}]}>
              Search results for "{searchQuery.trim()}"
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.categoryScrollContent}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(index * 30).duration(200)}>
              <TouchableOpacity
                onPress={() => handleCategoryChange(item.name)}
                style={[
                  styles.categoryButton,
                  selectedCategory === item.name && styles.selectedCategoryButton
                ]}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === item.name && styles.selectedCategoryButtonText
                ]}>
                  {item.icon || ''}{item.icon ? ' ' : ''}{item.name || ''}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </View>
    </View>
  ), [selectedCategory, styles, handleCategoryChange, searchQuery, colors.primary, colors.text.secondary]);

  // Render video item - YouTube style
  const renderVideoItem = useCallback(({ item, index }: { item: Video; index: number }) => (
    <>
      <AnimatedVideoCard
        video={item}
        onPress={(layout) => handleVideoPress(item)}
        onPressIn={() => setPreviewingVideoId(item.id)}
        onPressOut={() => setPreviewingVideoId(null)}
        isSelected={selectedVideoId === item.id}
        isPreview={previewingVideoId === item.id}
        styles={styles}
        colors={colors}
        onNavigateToChannel={() => handleNavigateToChannel({
          channelId: String(item.channelId),
          channelName: item.creatorName,
          avatar: item.avatar,
          isVerified: item.isVerified,
          createdBy: typeof item.channelId === 'number' ? item.channelId : parseInt(String(item.channelId))
        })}
        index={index}
        isYouTubeLayout={true} // Pass flag for YouTube-like layout
        onToggleComments={() => {
          setSelectedVideoId(item.id);
          toggleComments(item.id);
        }}
      />
    </>
  ), [handleVideoPress, selectedVideoId, previewingVideoId, styles, colors, handleNavigateToChannel, toggleComments]);

  // Prevent autoplay for paid videos
  useEffect(() => {
    if (openPlayer && selectedVideoId) {
      const selectedVideo = videos.find(v => v.id === selectedVideoId);
      if (selectedVideo && selectedVideo.isPaidPromotional && selectedVideo.contentCreatorPlanId > 0) {
        // Do not autoplay paid videos, wait for user confirmation
        console.log('[TipTubeScreen] Paid video selected, preventing autoplay until confirmation');
        setOpenPlayer(false);
      }
    }
  }, [selectedVideoId, openPlayer, videos]);

  // Content Creator Premium Toggle Handler
  const handleTogglePremium = () => {
    requireAuth('premium', () => {
      console.log('🚀 [TipTubeScreen] User clicked content creator premium toggle');
      console.log('📊 [TipTubeScreen] Current content creator premium status:', {
        isContentCreatorPremium,
        hasData: !!contentCreatorPremiumData
      });
      navigation.navigate('ContentCreatorPremium');
    });
  };

  // Add state for live search query (separate from committed searchQuery)
  const [liveSearchQuery, setLiveSearchQuery] = useState("");

  // Debounced setter for live search
  const debouncedSetLiveSearchQuery = useMemo(() => debounce((q: string) => setLiveSearchQuery(q), 300), []);

  // Live search hook (only when search bar is expanded)
  const {
    data: liveSearchData,
    isLoading: liveSearchLoading,
    error: liveSearchError,
  } = useSearchVideos(liveSearchQuery.trim(), user?.id);

  // Transform live search results
  const liveSearchVideos = useMemo(() => {
    const allVideos = liveSearchData?.pages?.flatMap(page => page?.data || []) || [];
    return allVideos.map((apiVideo: any) => ({
      id: apiVideo.id || 0,
      title: apiVideo.name || apiVideo.title || "Untitled Video",
      thumbnail: apiVideo.video_Thumbnail || getFallbackThumbnailUrl(apiVideo.id),
      videoUrl: apiVideo.video_link || apiVideo.videoUrl || '',
      duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
      views: apiVideo.total_views || 0,
      posted: apiVideo.createddate ? calculateRelativeTime(apiVideo.createddate) : "Recently",
      avatar: apiVideo.channel_profile || getFallbackAvatarUrl(apiVideo.createdby || apiVideo.id),
      creatorName: apiVideo.channelName || apiVideo.channel_name || "Unknown Creator",
      isVerified: false,
      channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
      price: apiVideo.promotional_price ? parseFloat(apiVideo.promotional_price) : 0,
      isPaidPromotional: apiVideo.is_paid_promotional || 0,
      contentCreatorPlanId: apiVideo.content_creator_plan_id || 0
    }));
  }, [liveSearchData]);

  // Handler for search bar text change (live update)
  const handleTipTubeLiveSearchChange = useCallback((text: string) => {
    debouncedSetLiveSearchQuery(text);
    setSearchQuery(text); // keep searchQuery in sync for submit
  }, [debouncedSetLiveSearchQuery]);

  // Handler for tapping a video in live search
  const handleLiveSearchVideoPress = useCallback(async (video: Video) => {
    setIsTipTubeSearchActive(false);
    setSearchQuery("");
    setLiveSearchQuery("");
    await handleVideoPress(video);
  }, [handleVideoPress]);

  // Handler for back arrow in search bar (reset live search)
  const handleSearchBack = useCallback(() => {
    setIsTipTubeSearchActive(false);
    setSearchQuery("");
    setLiveSearchQuery("");
  }, []);

  if (isTipTubeSearchActive) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TipTubeSearchBar
          value={searchQuery}
          onChangeText={handleTipTubeLiveSearchChange}
          onSubmitEditing={handleTipTubeSearchSubmit}
          onBack={handleSearchBack}
          colors={colors}
        />
        <FlatList
          data={liveSearchQuery.trim() ? liveSearchVideos : []}
          keyExtractor={(item) => `live-search-video-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleLiveSearchVideoPress(item)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Image source={{ uri: item.thumbnail }} style={{ width: 64, height: 36, borderRadius: 4, marginRight: 12, backgroundColor: colors.border }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: '500', fontSize: 15 }} numberOfLines={2}>{item.title}</Text>
                <Text style={{ color: colors.text.secondary, fontSize: 13 }}>{item.creatorName}</Text>
              </View>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, marginLeft: 8 }}>{item.views} views</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={liveSearchQuery.trim() && !liveSearchLoading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Icon name="search" size={32} color={colors.text.tertiary} />
              <Text style={{ color: colors.text.secondary, marginTop: 8 }}>No results found</Text>
            </View>
          ) : null}
          ListFooterComponent={liveSearchLoading ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  return (
    <ScreenTransition animationType="slide" skipAnimation={false}>
      <View style={styles.container}>
        <Header 
          title="" 
          showTipShortsIcon={true}
          showSearch={false}
          showWallet={false}
          centerComponent={undefined}
          rightComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* TipShorts Navigation Icon */}
              <TouchableOpacity
                onPress={handleNavigateToTipShorts}
                style={[styles.headerIconButton, { marginRight: 8 }]}
                activeOpacity={0.7}
              >
                <CirclePlay size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {/* Content Creator Plan Toggle */}
              <ContentCreatorPlanToggle onPress={handleTogglePremium} />
              {/* Analytics Icon */}
              <TouchableOpacity
                onPress={handleAnalytics}
                style={[styles.headerIconButton, { marginRight: 8 }]}
                activeOpacity={0.7}
              >
                <Icon name="bar-chart-2" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {/* Channel Icon */}
              <TouchableOpacity
                onPress={handleMyChannel}
                style={[styles.headerIconButton, { marginRight: 8 }]}
                activeOpacity={0.7}
              >
                <Icon name="tv" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {/* TipTube Search Icon */}
              <TouchableOpacity 
                onPress={() => setIsTipTubeSearchActive(true)} 
                style={styles.headerIconButton}
                activeOpacity={0.7}
              >
                <Icon name="search" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          }
        />
        
        {initialLoading ? (
          renderSkeletonLoading()
        ) : (
          <FlatList
            ref={flatListRef}
            data={videos}
            keyExtractor={(item) => `video-${item.id}`}
            renderItem={renderVideoItem}
            ListHeaderComponent={renderCategoryHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={false} // Managed by React Query
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                title="Pull to refresh"
                titleColor={colors.text.secondary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3} // Load more when 30% from bottom
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={6}
            getItemLayout={(data, index) => ({
              length: 280, // Approximate item height
              offset: 280 * index,
              index,
            })}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: contentPaddingBottom + 20 }
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Reddit-style Video Comments Modal */}
        {selectedVideoId && (
          <VideoCommentsModal
            visible={showComments}
            onClose={() => setShowComments(false)}
            videoId={selectedVideoId}
            userId={user?.id ? Number(user.id) : 0}
          />
        )}

        {/* Login Prompt Modal for Guest Users */}
        <LoginPromptModal
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message={loginPromptMessage}
        />

        {/* PubScale Credit Alert */}
        <PubScaleCreditAlert
          visible={showPubScaleCreditAlert}
          onClose={() => setShowPubScaleCreditAlert(false)}
          onViewWallet={handleViewWallet}
          onViewHistory={handleViewHistory}
        />

        {/* Analytics Premium Alert */}
        <AnalyticsPremiumAlert
          visible={showAnalyticsPremiumAlert}
          onClose={() => setShowAnalyticsPremiumAlert(false)}
          onUpgrade={handleAnalyticsPremiumUpgrade}
          onGoBack={handleAnalyticsPremiumGoBack}
        />

        {/* Reward Popup */}
        {showRewardPopup && (
          <View style={styles.rewardPopup}>
            <View style={styles.rewardPopupContent}>
              {isPremium ? (
                // Premium user popup
                <>
                  <Text style={styles.rewardPopupTitle}>🎉 Congratulations!</Text>
                  <Text style={styles.rewardPopupSubtitle}>
                    You have earned ₹{earnedAmount.toFixed(2)} paise
                  </Text>
                  
                  <View style={styles.rewardPopupButtons}>
                    <TouchableOpacity 
                      style={[styles.rewardPopupButton, styles.primaryButton]}
                      onPress={() => handleRewardPopupAction('gotit')}
                    >
                      <Text style={styles.primaryButtonText}>Got it, thanks</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.rewardPopupButton, styles.secondaryButton]}
                      onPress={() => handleRewardPopupAction('wallet')}
                    >
                      <Text style={styles.secondaryButtonText}>Open wallet</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // Non-premium user popup
                <>
                  <Text style={styles.rewardPopupTitle}>Hurry! You earned ₹{earnedAmount.toFixed(2)} paise</Text>
                  <Text style={styles.rewardPopupSubtitle}>
                    Congratulations you have earned ₹{earnedAmount.toFixed(2)} paise, you can earn upto ₹10 per ad.
                  </Text>
                  <Text style={styles.rewardPopupInfo}>
                    Upgrade to premium now.. let's earning now
                  </Text>
                  
                  <View style={styles.rewardPopupButtons}>
                    <TouchableOpacity 
                      style={[styles.rewardPopupButton, styles.primaryButton]}
                      onPress={() => handleRewardPopupAction('gotit')}
                    >
                      <Text style={styles.primaryButtonText}>Got it, thanks</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.rewardPopupButton, styles.secondaryButton]}
                      onPress={() => handleRewardPopupAction('wallet')}
                    >
                      <Text style={styles.secondaryButtonText}>Open wallet</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.rewardPopupButton, styles.upgradeButton]}
                      onPress={() => handleRewardPopupAction('upgrade')}
                    >
                      <Text style={styles.upgradeButtonText}>Upgrade premium now</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              {isDevelopmentMode && (
                <Text style={styles.developmentModeText}>
                  🔧 Development Mode: No wallet credit
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Test button for reward ads (DEV only) */}
        {__DEV__ === true && (
          <TouchableOpacity 
            onPress={() => {
              console.log('[TipTube] Manual reward ad trigger');
              handleVideoView();
            }}
            style={{
              position: 'absolute',
              top: 100,
              right: 20,
              backgroundColor: '#FF3040',
              padding: 12,
              borderRadius: 8,
              zIndex: 1000,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Reward Ad</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenTransition>
  );
};

// YouTube-style layout styles
const createYouTubeStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },

  categoryContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 8,
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  tipTubeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  tipTubeSearchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.cardSecondary,
  },
  tipTubeSearchClearButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  selectedCategoryButtonText: {
    color: colors.white,
  },
  videoItemContainer: {
    backgroundColor: colors.background,
    marginBottom: VERTICAL_SPACING,
  },
  youtubeVideoCard: {
    backgroundColor: colors.background,
  },
  youtubeThumbnailContainer: {
    width: SCREEN_WIDTH,
    height: THUMBNAIL_HEIGHT,
    backgroundColor: colors.border,
  },
  youtubeThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  youtubeDurationOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youtubeDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  youtubePriceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  youtubePriceBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  youtubeVideoInfo: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 16,
  },
  youtubeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  youtubeVideoDetails: {
    flex: 1,
  },
  youtubeVideoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 4,
  },
  youtubeChannelName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  youtubeVideoStats: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skeletonContent: {
    paddingTop: 0,
    width: '100%', // Ensure full width
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 15,
    maxHeight: 300,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentatorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentatorName: {
    fontWeight: 'bold',
  },
  commentText: {
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  commentActionText: {
    marginRight: 15,
    color: '#888',
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#888',
    padding: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  commentSendButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  commentSendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 12,
  },
  channelToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.cardSecondary,
    borderRadius: 16,
  },
  channelToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: 6,
  },
  channelToggleSwitch: {
    width: 32,
    height: 18,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  planModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '92%',
    maxWidth: 420,
  },
  planModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  planModalClose: {
    fontSize: 22,
    color: colors.text.secondary,
    padding: 4,
  },
  planComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planCardFree: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 14,
    marginRight: 8,
  },
  planCardPremium: {
    flex: 1,
    backgroundColor: '#009688',
    borderRadius: 12,
    padding: 14,
    marginLeft: 8,
  },
  planCardTitleFree: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  planCardTitlePremium: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  planCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planCardIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#fff',
  },
  planCardText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  planCardComing: {
    color: '#e0f2f1',
    fontSize: 13,
  },
  planCardHighlight: {
    color: '#ffd600',
    fontWeight: 'bold',
  },
  rewardPopup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  rewardPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardPopupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rewardPopupSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardPopupInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
  },
  rewardPopupButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  rewardPopupButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#FF6B35',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  developmentModeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  // EarnCardsRow styles
  earnCardsCarouselSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  earnCardVerticalItem: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  earnCardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  earnCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earnCardTextContainer: {
    flex: 1,
    marginRight: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  earnCardRewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  earnCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(TipTubeScreen);
