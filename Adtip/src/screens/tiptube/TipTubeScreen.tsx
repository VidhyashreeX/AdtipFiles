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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';

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

  // Refs
  const flatListRef = useRef<FlatList>(null);

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
  } = useVideos(categoryId, user?.id, searchQuery);

  // Prefetch data for better performance
  const { prefetchProfile } = usePrefetchData();

  // Fetch data whenever the screen comes into focus by invalidating the query.
  // This marks the data as stale and triggers a refetch without blocking navigation.
  useFocusEffect(
    useCallback(() => {
      console.log('[TipTubeScreen] Screen focused. Invalidating videos query to trigger refetch.');
      queryClient.invalidateQueries({ queryKey: ['videos', categoryId, user?.id, searchQuery] });
    }, [queryClient, categoryId, user?.id, searchQuery])
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
      posted: apiVideo.createddate || "Recently",
      avatar: apiVideo.channel_profile || getFallbackAvatarUrl(apiVideo.createdby || apiVideo.id),
      creatorName: apiVideo.channelName || apiVideo.channel_name || "Unknown Creator",
      isVerified: false,
      channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
      price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
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

  // Video player handler
  const openPlayer = useCallback((video: Video, layout: CardLayout) => {
    console.log('[TipTubeScreen] Opening player for video:', video.id);
    
    setSelectedVideoId(video.id);
    
    const shuffledVideos = shuffleArray(videos.filter((v: Video) => v.id !== video.id));
    
    navigation.navigate('VideoPlayerModal', {
      video,
      cardLayout: layout,
      upNextVideos: shuffledVideos.slice(0, 10)
    });
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
        onPress={(layout) => openPlayer(item, layout)}
        onPressIn={() => setPreviewingVideoId(item.id)}
        onPressOut={() => setPreviewingVideoId(null)}
        isSelected={selectedVideoId === item.id}
        isPreview={previewingVideoId === item.id}
        styles={styles}
        colors={colors}
        onNavigateToChannel={() => navigation.navigate('Channel', { channelId: item.channelId })}
        index={index}
        isYouTubeLayout={true} // Pass flag for YouTube-like layout
      />
      {/* Banner ad every 5 videos */}
      {(index + 1) % 5 === 0 && (
        <View style={{ marginVertical: 10 }}>
          <BannerAdComponent />
        </View>
      )}
    </>
  ), [openPlayer, selectedVideoId, previewingVideoId, styles, colors, navigation]);

  return (
    <ScreenTransition animationType="slide" skipAnimation={false}>
      <View style={styles.container}>
        <Header 
          title="TipTube" 
          showTipShortsIcon 
          showSearch={true}
          showWallet={false}
          onSearchQueryChange={handleSearch}
          onSearchSubmit={handleSearch}
          rightComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
});

export default React.memo(TipTubeScreen);
