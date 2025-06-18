import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import axios from 'axios';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import ScreenTransition from '../../components/common/ScreenTransition';
import AnimatedVideoCard from './AnimatedVideoCard';

// Get screen dimensions and create constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants - YouTube-like layout
const HORIZONTAL_PADDING = 16;
const VERTICAL_SPACING = 16;
const CARD_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16; // 16:9 aspect ratio
const LOAD_MORE_THRESHOLD = 3; // Load more when 3 items from bottom

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

// Main TipTube Screen
const TipTubeScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshPage, setRefreshPage] = useState(1); // Track refresh page separately
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Memoized styles
  const styles = useMemo(() => createYouTubeStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Transform API data to Video interface
  const transformVideoData = useCallback((apiVideo: any): Video => ({
    id: apiVideo.id || 0,
    title: apiVideo.name || apiVideo.title || "Untitled Video",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link || apiVideo.videoUrl,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0,
    posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  }), []);

  // Fetch videos function
  const fetchVideos = useCallback(async (
    page: number = 1,
    categoryName: string = "All",
    searchText: string = "",
    isRefresh: boolean = false,
    isPullToRefresh: boolean = false // New parameter to distinguish pull-to-refresh
  ) => {
    if (!user?.id || isLoadingRef.current) {
      return;
    }

    // Prevent duplicate requests
    isLoadingRef.current = true;

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Set loading states
      if (isPullToRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      const categoryId = categoryToIdMap[categoryName] || 0;

      console.log('[TipTubeScreen] Fetching videos:', {
        page,
        categoryId,
        categoryName,
        searchText,
        isRefresh,
        isPullToRefresh
      });

      const response = await ApiService.getVideos(
        user.id,
        categoryId,
        page,
        searchText,
        abortController.signal
      );

      if (abortController.signal.aborted) {
        return;
      }

      if (response && (response.status === 200 || response.status === true)) {
        const videosArray = Array.isArray(response.data) ? response.data : [];
        const transformedVideos = videosArray.map(transformVideoData);

        console.log('[TipTubeScreen] Received videos:', transformedVideos.length);

        if (isPullToRefresh) {
          // Pull to refresh - prepend new videos to existing ones
          setVideos(prevVideos => [...transformedVideos, ...prevVideos]);
          setRefreshPage(page + 1); // Increment refresh page for next pull
        } else if (isRefresh || page === 1) {
          // Fresh data - replace all videos (category change, search, initial load)
          setVideos(transformedVideos);
          setCurrentPage(2); // Next page to load for infinite scroll
          setRefreshPage(1); // Reset refresh page counter
        } else {
          // Append new videos for infinite scroll
          setVideos(prevVideos => [...prevVideos, ...transformedVideos]);
          setCurrentPage(page + 1);
        }

        // Check if there are more videos to load
        setHasMore(transformedVideos.length > 0);
      } else {
        console.warn('[TipTubeScreen] API returned unsuccessful response:', response?.status);
        if (page === 1 && !isPullToRefresh) {
          setVideos([]);
        }
        setHasMore(false);
      }

    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('[TipTubeScreen] Request cancelled');
        return;
      }
      
      console.error('[TipTubeScreen] Error fetching videos:', error);
      
      if (page === 1 && !isPullToRefresh) {
        setVideos([]);
      }
      setHasMore(false);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isLoadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user?.id, transformVideoData]);

  // Pull to refresh handler - increments page number
  const handleRefresh = useCallback(() => {
    console.log('[TipTubeScreen] Pull to refresh triggered, page:', refreshPage);
    fetchVideos(refreshPage, selectedCategory, searchQuery, false, true);
  }, [fetchVideos, selectedCategory, searchQuery, refreshPage]);

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && !initialLoading && hasMore && !isLoadingRef.current) {
      console.log('[TipTubeScreen] Loading more videos, page:', currentPage);
      fetchVideos(currentPage, selectedCategory, searchQuery, false, false);
    }
  }, [loadingMore, initialLoading, hasMore, currentPage, fetchVideos, selectedCategory, searchQuery]);

  // Category change handler - resets pages
  const handleCategoryChange = useCallback((categoryName: string) => {
    console.log('[TipTubeScreen] Category changed to:', categoryName);
    setSelectedCategory(categoryName);
    setCurrentPage(1);
    setRefreshPage(1); // Reset refresh page
    setHasMore(true);
    fetchVideos(1, categoryName, searchQuery, true, false);
  }, [fetchVideos, searchQuery]);

  // Search handler - resets pages
  const handleSearch = useCallback((query: string) => {
    console.log('[TipTubeScreen] Search query:', query);
    setSearchQuery(query);
    setCurrentPage(1);
    setRefreshPage(1); // Reset refresh page
    setHasMore(true);
    fetchVideos(1, selectedCategory, query, true, false);
  }, [fetchVideos, selectedCategory]);

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
    <View style={styles.videoItemContainer}>
      <AnimatedVideoCard
        video={item}
        onPress={(layout) => openPlayer(item, layout)}
        onPressIn={() => setPreviewingVideoId(item.id)}
        onPressOut={() => setPreviewingVideoId(null)}
        isSelected={selectedVideoId === item.id}
        isPreview={previewingVideoId === item.id}
        styles={styles}
        colors={colors}
        onNavigateToChannel={() => navigation.navigate('ChannelScreen', { channelId: item.channelId })}
        index={index}
        isYouTubeLayout={true} // Pass flag for YouTube-like layout
      />
    </View>
  ), [openPlayer, selectedVideoId, previewingVideoId, styles, colors, navigation]);

  // Render footer loading indicator
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoadingText}>Loading more videos...</Text>
      </View>
    );
  }, [loadingMore, colors.primary, styles]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (initialLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos available'}
        </Text>
      </View>
    );
  }, [initialLoading, searchQuery, styles]);

  // Render skeleton loading with YouTube layout
  const renderSkeletonLoading = useCallback(() => (
    <FlatList
      data={Array(6).fill(0)}
      keyExtractor={(_, index) => `skeleton-${index}`}
      renderItem={({ index }) => (
        <Animated.View
          entering={FadeIn.delay(index * 100).duration(300)}
          style={styles.skeletonContainer}
        >
          <VideoCardSkeleton isYouTubeLayout={true} />
        </Animated.View>
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.skeletonContent}
      ListHeaderComponent={renderCategoryHeader} // Include category header in skeleton
    />
  ), [styles, renderCategoryHeader]);

  // Initial load effect
  useEffect(() => {
    if (user?.id) {
      fetchVideos(1, selectedCategory, searchQuery, true, false);
    }
  }, [user?.id]); // Only depend on user ID for initial load

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      if (user?.id && videos.length === 0) {
        fetchVideos(1, selectedCategory, searchQuery, true, false);
      }
    }, [user?.id, videos.length])
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <ScreenTransition animationType="slide" skipAnimation={false}>
      <View style={styles.container}>
        <Header 
          title="TipTube" 
          showTipShortsIcon 
          showSearch={true}
          onSearchQueryChange={handleSearch}
          onSearchSubmit={handleSearch}
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
                refreshing={refreshing}
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
  // YouTube-style video card - edge to edge thumbnail
  youtubeVideoCard: {
    backgroundColor: colors.background,
  },
  youtubeThumbnailContainer: {
    width: SCREEN_WIDTH, // Full screen width, no margins
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
    paddingHorizontal: HORIZONTAL_PADDING, // Only info section has padding
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
    marginBottom: 0, // Remove margin since skeleton handles its own spacing
  },
  skeletonContent: {
    paddingTop: 0, // Remove padding since we include category header
  },
});

export default React.memo(TipTubeScreen);