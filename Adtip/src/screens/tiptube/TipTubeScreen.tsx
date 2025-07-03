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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import RazorpayCheckout from 'react-native-razorpay';

import { useTheme } from '../../contexts/ThemeContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDataContext } from '../../providers/DataProvider';
import { useVideos, usePrefetchData } from '../../hooks/useQueries';
import { useNetInfo } from '@react-native-community/netinfo';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import ScreenTransition from '../../components/common/ScreenTransition';
import AnimatedVideoCard from './AnimatedVideoCard';
import { 
  getSecureMediaUrl, 
  getFallbackAvatarUrl, 
  getFallbackThumbnailUrl 
} from '../../utils/mediaUtils';
import BannerAdComponent from '../../googleads/BannerAdComponent';
import ApiService from '../../services/ApiService';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';

// Get screen dimensions and create constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants - YouTube-like layout
const HORIZONTAL_PADDING = 16;
const VERTICAL_SPACING = 16;
const CARD_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16; // 16:9 aspect ratio

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

// Main TipTube Screen - Enhanced with React Query v5 data layer
const TipTubeScreen = () => {
  const queryClient = useQueryClient();
  const { isDarkMode, colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const { user } = useAuth();
  const { clearCache } = useDataContext();
  const navigation = useNavigation<any>();
  const netInfo = useNetInfo();

  // UI state management (decoupled from navigation)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [userChannelId, setUserChannelId] = useState<string | null>(null);
  const [openPlayer, setOpenPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>('');
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [showChannelVideos, setShowChannelVideos] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Content Creator Plan State
  const [creatorPlans, setCreatorPlans] = useState<any[]>([]);
  const [selectedCreatorPlan, setSelectedCreatorPlan] = useState<any>(null);
  const [creatorPlanStatus, setCreatorPlanStatus] = useState<any>(null);
  const [showCreatorPremium, setShowCreatorPremium] = useState(false);
  const [creatorPlanLoading, setCreatorPlanLoading] = useState(false);
  const [showCreatorPlanModal, setShowCreatorPlanModal] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const isFirstRun = useRef(true);

  // Enhanced data layer using React Query v5
  const categoryId = categoryToIdMap[selectedCategory] || 0;
  const {
    data: videosData,
    isLoading: videosLoading,
    isFetchingNextPage: videosLoadingMore,
    error: videosError,
    refetch: refreshVideos,
    fetchNextPage: loadMoreVideos,
    hasNextPage: hasMoreVideos,
  } = useVideos(categoryId, user?.id, searchQuery, showChannelVideos);

  // Prefetch data for better performance
  const { prefetchProfile } = usePrefetchData();

  // Fetch data on initial mount
  useEffect(() => {
    console.log('[TipTubeScreen] Component mounted. Triggering initial fetch.');
    refreshVideos();
  }, []); // Runs only once

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

  // Fetch user's channel ID
  useFocusEffect(
    useCallback(() => {
      const fetchUserChannel = async () => {
        if (user?.id) {
          try {
            const channelResponse = await ApiService.getChannelByUserId(Number(user.id));
            if (channelResponse.status === 200 && channelResponse.data && channelResponse.data.length > 0) {
              setUserChannelId(String(channelResponse.data[0].channelId));
            }
          } catch (error) {
            console.log('No channel found for user');
          }
        }
      };

      fetchUserChannel();
    }, [user?.id])
  );

  // Fetch comments for a video
  const fetchComments = useCallback(async (videoId: number) => {
    if (!user?.id) return;
    try {
      const commentCountResponse = await ApiService.getCommentOfVideo(videoId, 1, 10);
      setCommentCount(commentCountResponse.total || 0);
      
      const commentsResponse = await ApiService.getCommentsOfVideos(user.id, videoId);
      setComments(commentsResponse.data || []);
    } catch (error) {
      console.error('[TipTubeScreen] Error fetching comments:', error);
    }
  }, [user?.id]);

  // Toggle comments section
  const toggleComments = useCallback((videoId: number) => {
    setShowComments(!showComments);
    if (!showComments && videoId) {
      fetchComments(videoId);
    }
  }, [showComments, fetchComments]);

  // Handle liking a video
  const handleLikeVideo = useCallback(async (video: Video) => {
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
  }, [user?.id, likedVideos]);

  // Handle adding a comment
  const handleAddComment = useCallback(async (videoId: number) => {
    if (!user?.id || !newComment.trim()) {
      Alert.alert('Error', 'You must be logged in and enter a comment to post.');
      return;
    }
    try {
      await ApiService.saveVideoComment(videoId, user.id, newComment);
      setNewComment('');
      fetchComments(videoId);
    } catch (error) {
      console.error('[TipTubeScreen] Error adding comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  }, [user?.id, newComment, fetchComments]);

  // Handle liking a comment
  const handleLikeComment = useCallback(async (commentId: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to like comments.');
      return;
    }
    try {
      await ApiService.saveVideoCommentLike(commentId, user.id);
    } catch (error) {
      console.error('[TipTubeScreen] Error liking comment:', error);
      Alert.alert('Error', 'Failed to like the comment. Please try again.');
    }
  }, [user?.id]);

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
    const allVideos = videosData?.pages?.flatMap(page => page?.data || []) || [];
    
    console.log('[TipTubeScreen] Raw videos data:', {
      pagesCount: videosData?.pages?.length || 0,
      firstPage: videosData?.pages?.[0]?.data?.slice(0, 2), // Log first 2 videos from first page
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
  }, [videosData]);

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
    // Clear cache for better UX on category change
    clearCache(`videos-${categoryToIdMap[selectedCategory]}`);
  }, [selectedCategory, clearCache]);

  const handleSearch = useCallback((query: string) => {
    console.log('[TipTubeScreen] Search query:', query);
    setSearchQuery(query);
    // Clear cache to force fresh search results
    clearCache(`videos-${categoryId}`);
  }, [categoryId, clearCache]);

  const handleMyChannel = useCallback(() => {
    if (userChannelId && user?.id) {
      // Note: Despite the parameter name being 'channelId', we pass the userId
      // because the ChannelScreen API expects userId, not channelId
      navigation.navigate('Channel', { channelId: String(user.id) });
    } else {
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel');
    }
  }, [userChannelId, user?.id, navigation]);

  const handleAnalytics = useCallback(() => {
    if (userChannelId) {
      navigation.navigate('Analytics', { channelId: userChannelId });
    } else {
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel');
    }
  }, [userChannelId, navigation]);

  // Handle video press with view API calls
  const handleVideoPress = useCallback(async (video: Video) => {
    console.log('[TipTubeScreen] Video pressed:', { id: video.id, title: video.title, isPaid: video.isPaidPromotional });
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
      }
    } catch (error) {
      console.error('[TipTubeScreen] Error handling video press:', error);
      Alert.alert('Error', 'There was an issue accessing this video. Please try again later.');
    }
  }, [videos, navigation]);

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

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {videosError && !isOnline 
            ? 'You\'re offline. Videos will load when you\'re back online.'
            : videosError 
            ? 'Failed to load videos. Please try again.'
            : searchQuery
            ? `No videos found for "${searchQuery}"`
            : 'No videos available'}
        </Text>
      </View>
    );
  }, [initialLoading, videosError, isOnline, searchQuery, styles]);

  // Render category header
  const renderCategoryHeader = useCallback(() => (
    <View style={styles.categoryContainer}>
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
                {item.icon} {item.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  ), [selectedCategory, styles, handleCategoryChange]);

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
        onNavigateToChannel={() => navigation.navigate('Channel', { channelId: item.channelId })}
        index={index}
        isYouTubeLayout={true} // Pass flag for YouTube-like layout
        onToggleComments={() => {
          setSelectedVideoId(item.id);
          toggleComments(item.id);
        }}
      />
      {/* Banner ad every 3 videos */}
      {(index + 1) % 3 === 0 && (
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
      )}
    </>
  ), [handleVideoPress, selectedVideoId, previewingVideoId, styles, colors, navigation, toggleComments]);

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

  // Render comments section
  const renderCommentsSection = useCallback(() => {
    if (!showComments || !selectedVideoId) return null;
    return (
      <View style={styles.commentsContainer}>
        <Text style={styles.commentsTitle}>Comments ({commentCount})</Text>
        {comments.length > 0 ? (
          comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <Image 
                source={{ uri: comment.commentator_image || 'https://via.placeholder.com/40?text=User' }} 
                style={styles.commentatorImage} 
              />
              <View style={styles.commentContent}>
                <Text style={styles.commentatorName}>{comment.commentator_name || 'Anonymous'}</Text>
                <Text style={styles.commentText}>{comment.comment}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity onPress={() => handleLikeComment(comment.id)}>
                    <Text style={styles.commentActionText}>Like ({comment.total_comment_like || 0})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noCommentsText}>No comments yet.</Text>
        )}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
          />
          <TouchableOpacity onPress={() => {
            if (selectedVideoId !== null) {
              handleAddComment(Number(selectedVideoId));
            }
          }} style={styles.commentSendButton}>
            <Text style={styles.commentSendButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [showComments, selectedVideoId, comments, commentCount, newComment, handleAddComment, handleLikeComment]);

  // Fetch plans and user plan status
  useEffect(() => {
    const fetchPlans = async () => {
      setCreatorPlanLoading(true);
      try {
        const res = await ApiService.get('/content-creator-plans');
        if (res.status) setCreatorPlans(res.data);
      } catch (e) {}
      setCreatorPlanLoading(false);
    };
    const fetchStatus = async () => {
      try {
        const res = await ApiService.get(`/content-creator/plan-status/${user?.id}`);
        if (res.status) setCreatorPlanStatus(res.plan);
        else setCreatorPlanStatus(null);
      } catch (e) {}
    };
    fetchPlans();
    fetchStatus();
  }, [user?.id]);

  const handleCreatorPayment = async () => {
    if (!selectedCreatorPlan) return Alert.alert('Select a plan');
    setCreatorPlanLoading(true);
    try {
      // Fetch Razorpay key from backend
      const keyRes = await ApiService.getRazorpayDetails();
      const razorpayKey = keyRes.api_key;
      const res = await ApiService.post('/content-creator/subscribe', { plan_id: selectedCreatorPlan.id });
      if (res.status && res.order) {
        const order = res.order;
        const options = {
          description: selectedCreatorPlan.description,
          image: '',
          currency: order.currency,
          key: razorpayKey,
          amount: order.amount,
          name: 'Content Creator Plan',
          order_id: order.id,
          prefill: {
            email: user?.emailId || '',
            contact: '',
            name: user?.name || '',
          },
          theme: { color: '#00C853' },
        };
        RazorpayCheckout.open(options)
          .then(async (paymentData: any) => {
            await ApiService.post('/content-creator/payment-callback', paymentData);
            const statusRes = await ApiService.get(`/content-creator/plan-status/${user?.id}`);
            if (statusRes.status) setCreatorPlanStatus(statusRes.plan);
            setShowCreatorPlanModal(false);
            Alert.alert('Success', 'Plan activated!');
          })
          .catch((err: any) => {
            Alert.alert('Payment Failed', err?.description || 'Try again');
          });
      } else {
        Alert.alert('Error', res.message || 'Could not create order');
      }
    } catch (e) {
      Alert.alert('Error', 'Payment failed');
    }
    setCreatorPlanLoading(false);
  };

  // Remove modal and plan UI from TipTubeScreen
  // When toggling to premium, navigate to ContentCreatorSubscriptionScreen
  const handleTogglePremium = (value: boolean) => {
    setShowCreatorPremium(value);
    if (value) {
      navigation.navigate('ContentCreatorSubscriptionScreen');
    }
  };

  return (
    <ScreenTransition animationType="slide" skipAnimation={false}>
      <View style={styles.container}>
        <Header 
          title="" 
          showTipShortsIcon={true}
          showSearch={true}
          showWallet={false}
          onSearchQueryChange={handleSearch}
          onSearchSubmit={handleSearch}
          rightComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Content Creator Plan Toggle */}
              <ContentCreatorPlanToggle onPress={() => handleTogglePremium(true)} />
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
              {/* Search Icon */}
              <TouchableOpacity 
                onPress={() => {/* This will be handled by Header's internal search logic */}} 
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
        {renderCommentsSection()}
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
  adContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderBottomColor: colors.border,
  },
  categoryContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    paddingBottom: 4,
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
});

export default React.memo(TipTubeScreen);
