import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ScrollView,
  Dimensions, // For responsive layout
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video'; // Assuming you have react-native-video installed
import FastImage from '@d11/react-native-fast-image'; // For better image loading

// Components
import Header from '../../components/common/Header'; // Re-use existing header

// Services
import ApiService from '../../services/ApiService'; // Re-use existing ApiService

// Context
import { useTheme } from '../../contexts/ThemeContext'; // Re-use existing ThemeContext

// Types
interface TipTubeScreenProps {
  walletBalance?: string; // Optional wallet balance coming from HOC
}

interface VideoData {
  id: number;
  title: string;
  thumbnail?: string; // Changed from thumbnail_url for consistency with web
  videoUrl?: string; // Changed from video_url for consistency with web
  duration?: number; // Changed from string to number for consistency with web (seconds)
  views: number; // Changed from view_count
  posted: string; // Changed from created_at
  channelId: number; // Changed from user_id for consistency with web
  avatar?: string; // Changed from user_profile_image for consistency with web
  creatorName: string; // Changed from user_name for consistency with web
  isVerified?: boolean; // New, from web
  price?: number; // New, from web
}

// Mimic web's category structure
const categories = [
  { name: 'All', icon: '🏠' },
  { name: 'Tech', icon: '💻' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Food', icon: '🍔' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Finance', icon: '💰' },
  { name: 'Fashion', icon: '👗' },
  { name: 'Music', icon: '🎵' },
  { name: 'Sports', icon: '🏀' },
  { name: 'Education', icon: '📚' },
];

const categoryToIdMap: { [key: string]: number } = {
  All: 0, Tech: 1, Beauty: 2, Gaming: 3, Food: 4, Travel: 5, Finance: 6, Fashion: 7, Music: 8, Sports: 9, Education: 10,
};

// Format duration utility, same as web
const formatDuration = (duration: number | string | undefined) => {
  if (duration === undefined || duration === null) { return '0:00'; }
  const totalSeconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(totalSeconds)) { return '0:00'; }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768; // Simple check for tablet-like layout

const TipTubeScreen: React.FC<TipTubeScreenProps> = ({ walletBalance }) => {
  // Hooks
  const { colors } = useTheme();
  const navigation = useNavigation();

  // State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false); // Combined initial and loadingMore
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Removed search state as it's not present in web UI provided

  const feedRef = useRef<FlatList | null>(null); // For scroll events

  // Helper function to get full URLs, adapted from original RN code
  const getFullUrl = useCallback((url: string | null | undefined) => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
      return 'https://via.placeholder.com/320x180?text=No+Preview';
    }
    if (url.startsWith('http')) {
      return url;
    }
    // For video files, use theadtip.in domain
    if (url.includes('.mp4') || url.includes('/videos/')) {
      return `https://theadtip.in${url.startsWith('/') ? '' : '/'}${url}`;
    }
    // For thumbnails and images, use the regular api.adtip.in domain
    if (
      url.includes('/uploads/') ||
      url.includes('/images/') ||
      url.includes('/thumbnails/') ||
      url.includes('/profiles/')
    ) {
      return `https://api.adtip.in${url.startsWith('/') ? '' : '/'}${url}`;
    }
    // For other resources, default to the main domain
    return `https://adtip.in${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  // Transform API video data to match VideoData interface (like web's transformVideoData)
  const transformVideoData = useCallback((apiVideo: any): VideoData => ({
    id: apiVideo.id || 0,
    title: apiVideo.name || apiVideo.title || 'Untitled Video',
    thumbnail: getFullUrl(apiVideo.video_Thumbnail || apiVideo.thumbnail_url),
    videoUrl: getFullUrl(apiVideo.video_link || apiVideo.video_url),
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || '0', 10),
    views: apiVideo.total_views || apiVideo.view_count || 0,
    posted: apiVideo.createddate || apiVideo.created_at || 'Recently',
    avatar: getFullUrl(apiVideo.channel_profile || apiVideo.user_profile_image),
    creatorName: apiVideo.channelName || apiVideo.user_name || 'Unknown Creator',
    isVerified: !!apiVideo.is_verified, // Assume a boolean field
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || apiVideo.user_id || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  }), [getFullUrl]);


  // Fetch videos (infinite scroll logic, adapted from web)
  const fetchVideos = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          userId = userData?.id?.toString();
        }
      }
      if (!userId) {
        userId = '0'; // Fallback for public videos if no user is logged in
      }

      const currentOffset = reset ? 1 : offset;
      const apiCategoryId = categoryToIdMap[selectedCategory] || 0;

      console.log(`Fetching videos: UserID=${userId}, CategoryID=${apiCategoryId}, Offset=${currentOffset}`);

      const response = await ApiService.getVideos(
        userId,
        apiCategoryId,
        currentOffset,
      );

      console.log('Raw API response (truncated):', JSON.stringify(response).substring(0, 500));

      if (response?.data && Array.isArray(response.data)) {
        const videoList = response.data.map(transformVideoData);
        // Filter out videos with invalid URLs and duplicate IDs to avoid player/key errors
        const filteredVideoList = videoList
          .filter((v: VideoData) => v.videoUrl && v.videoUrl !== getFullUrl(''))
          .filter((v: VideoData, idx: number, arr: VideoData[]) => arr.findIndex((x: VideoData) => x.id === v.id) === idx); // Remove duplicate IDs

        setVideos(prev => reset ? filteredVideoList : [...prev, ...filteredVideoList.filter((v: VideoData) => !prev.some((p: VideoData) => p.id === v.id))]);
        setHasMore(filteredVideoList.length > 0); // Assuming API returns 10 items per page if more exist
      } else {
        setVideos(reset ? [] : videos); // Keep existing videos if not a reset
        setHasMore(false);
        if (reset) { // Only show error for initial load or full refresh if no data
          setError('No videos available at the moment.');
        }
      }
    } catch (err) {
      console.error('Videos fetch error:', err);
      setHasMore(false);
      if (reset) {
        setError('Failed to load videos. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, offset, transformVideoData, videos, getFullUrl]); // Added getFullUrl to fetchVideos useCallback dependency


  // Only reset offset and fetch videos when category changes
  useEffect(() => {
    setOffset(1);
    fetchVideos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Load more on offset change
  useEffect(() => {
    if (offset > 1) {
      fetchVideos();
    }
  }, [offset, fetchVideos]);


  // Infinite scroll (onEndReached for FlatList)
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(1);
    fetchVideos(true);
  }, [fetchVideos]);

  const handleVideoPress = useCallback((video: VideoData) => {
    setCurrentVideo(video);
  }, []);

  const handleCategoryPress = useCallback((categoryName: string) => {
    if (categoryName === selectedCategory) { return; }
    setSelectedCategory(categoryName);
    setOffset(1);
  }, [selectedCategory]);

  const handleUploadPress = () => {
    navigation.navigate('TipTubeUpload' as never); // Still navigate to upload screen
  };

  // Render functions
  const renderCategories = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryItem,
              selectedCategory === category.name
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card },
            ]}
            onPress={() => handleCategoryPress(category.name)}>
            <Text style={[
              styles.categoryIcon,
              selectedCategory === category.name ? { color: colors.white } : { color: colors.text.secondary },
            ]}>
              {category.icon}
            </Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.name
                  ? { color: colors.white }
                  : { color: colors.text.primary },
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGridVideoItem = ({ item }: { item: VideoData }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.videoCard, { backgroundColor: colors.card }]}
      onPress={() => handleVideoPress(item)}
    >
      <View style={styles.thumbnailContainer}>
        {/* Placeholder for video preview on hover (not directly implementable in RN) */}
        <FastImage
          source={{ uri: item.thumbnail || 'https://via.placeholder.com/320x180?text=Video' }}
          style={styles.thumbnail}
          resizeMode={FastImage.resizeMode.cover}
        />
        {item.price && item.price > 0 && (
          <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.priceText}>₹{item.price}</Text>
          </View>
        )}
        <View style={styles.durationOverlay}>
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>
      <View style={styles.videoDetails}>
        <View style={styles.channelInfo}>
          <FastImage
            source={{ uri: item.avatar || 'https://via.placeholder.com/40x40?text=User' }}
            style={styles.channelAvatar}
            resizeMode={FastImage.resizeMode.cover}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.channelName, { color: colors.primary }]} numberOfLines={1}>
              {item.creatorName}
            </Text>
            <Text style={[styles.videoStats, { color: colors.text.secondary }]}>
              {item.views.toLocaleString()} views • {item.posted}
            </Text>
          </View>
        </View>
        <Text style={[styles.videoTitle, { color: colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRelatedVideoItem = ({ item }: { item: VideoData }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.relatedVideoCard, { backgroundColor: colors.card }]}
      onPress={() => handleVideoPress(item)}
    >
      <FastImage
        source={{ uri: item.thumbnail || 'https://via.placeholder.com/120x68?text=Video' }}
        style={styles.relatedThumbnail}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.relatedVideoDetails}>
        <Text style={[styles.relatedVideoTitle, { color: colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.relatedChannelInfo}>
          <FastImage
            source={{ uri: item.avatar || 'https://via.placeholder.com/24x24?text=User' }}
            style={styles.relatedChannelAvatar}
            resizeMode={FastImage.resizeMode.cover}
          />
          <Text style={[styles.relatedChannelName, { color: colors.text.secondary }]} numberOfLines={1}>
            {item.creatorName}
          </Text>
        </View>
        <Text style={[styles.relatedVideoStats, { color: colors.text.secondary }]}>
          {item.views.toLocaleString()} views • {item.posted}
        </Text>
      </View>
    </TouchableOpacity>
  );


  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="video-off" size={50} color={colors.gray[400]} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        No videos available
      </Text>
      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.primary }]}
        onPress={handleUploadPress}>
        <Text style={[{ color: colors.white }, styles.buttonText]}>
          Upload Video
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || !hasMore) {
      return null;
    }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="TipTube"
        showBackButton={false}
        showLogo={false}
        showWallet={true}
        walletAmount={walletBalance}
      />

      {renderCategories()}

      {currentVideo ? (
        // Main Video Player Layout
        <ScrollView style={styles.playerLayoutScroll} contentContainerStyle={styles.playerLayoutContent}>
          <View style={styles.mainVideoPlayerContainer}>
            <View style={[styles.videoPlayerWrapper, { backgroundColor: colors.black }]}>
              {currentVideo.videoUrl ? (
                <Video
                  source={{ uri: currentVideo.videoUrl }}
                  style={styles.mainVideoPlayer}
                  controls={true}
                  paused={false}
                  resizeMode="contain"
                  poster={currentVideo.thumbnail}
                  posterResizeMode="cover"
                  onError={(e) => console.log('Video error:', e)}
                />
              ) : (
                <View style={styles.videoErrorContainer}>
                  <Text style={[styles.videoErrorText, { color: colors.white }]}>Video not available</Text>
                </View>
              )}
            </View>
            <View style={styles.videoInfoContainer}>
              <Text style={[styles.currentVideoTitle, { color: colors.text.primary }]}>{currentVideo.title}</Text>
              <View style={styles.channelRow}>
                <FastImage source={{ uri: currentVideo.avatar || 'https://via.placeholder.com/40x40?text=User' }} style={styles.channelAvatarLarge} />
                <View style={styles.channelDetails}>
                  {/* Use @ts-ignore to bypass navigation type error for Channel navigation */}
                  {/* @ts-ignore */}
                  <TouchableOpacity onPress={() => navigation.navigate('Channel', { channelId: currentVideo.channelId })}>
                    <Text style={[styles.currentCreatorName, { color: colors.text.primary }]}>{currentVideo.creatorName}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.currentVideoStats, { color: colors.text.secondary }]}>
                    {currentVideo.views.toLocaleString()} views • {currentVideo.posted}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.subscribeButtonText, { color: colors.white }]}>Subscribe</Text>
                </TouchableOpacity>
              </View>
              {/* Dummy interaction buttons (Like, Dislike, Share) - no functionality here */}
              <View style={styles.interactionButtons}>
                <TouchableOpacity style={[styles.interactionButton, { backgroundColor: colors.card }]}>
                  <Icon name="thumbs-up" size={18} color={colors.text.primary} />
                  <Text style={[styles.interactionButtonText, { color: colors.text.primary }]}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.interactionButton, { backgroundColor: colors.card }]}>
                  <Icon name="thumbs-down" size={18} color={colors.text.primary} />
                  <Text style={[styles.interactionButtonText, { color: colors.text.primary }]}>Dislike</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.interactionButton, { backgroundColor: colors.card }]}>
                  <Icon name="share-2" size={18} color={colors.text.primary} />
                  <Text style={[styles.interactionButtonText, { color: colors.text.primary }]}>Share</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setCurrentVideo(null)}
                style={[styles.backToFeedButton, { backgroundColor: colors.border }]}
              >
                <Text style={[styles.backToFeedButtonText, { color: colors.text.primary }]}>Back to Feed</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Related Videos Sidebar/List */}
          <View style={styles.relatedVideosContainer}>
            <Text style={[styles.relatedVideosHeader, { color: colors.text.primary }]}>Up Next</Text>
            <FlatList
              data={videos.filter(v => v.id !== currentVideo.id)}
              renderItem={renderRelatedVideoItem}
              keyExtractor={item => `${item.id}-related`}
              scrollEnabled={false} // Nested FlatList within ScrollView
              ListFooterComponent={loading && hasMore ? <ActivityIndicator size="small" color={colors.primary} style={styles.relatedFooterLoader} /> : null}
            />
          </View>
        </ScrollView>
      ) : (
        // Default Grid View
        loading && offset === 1 && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.primary }]}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={{ color: colors.primary }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={feedRef}
            data={videos}
            renderItem={renderGridVideoItem}
            keyExtractor={item => `${item.id}`}
            numColumns={isTablet ? 3 : 2} // 2 columns for phone, 3 for tablet
            contentContainerStyle={
              videos.length === 0
                ? styles.flatListEmptyContainer
                : styles.flatListContainer
            }
            ListEmptyComponent={loading ? null : renderEmptyState}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
          />
        )
      )}

      {/* Floating Upload Button */}
      {!currentVideo && ( // Only show when not in video player view
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          onPress={handleUploadPress}>
          <Icon name="upload" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007bff', // Example border color, replace with theme color
  },
  categoryContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0', // Replace with theme color
    backgroundColor: '#ffffff', // Replace with theme color
    marginBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flexOne: {
    flex: 1,
  },
  flatListContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20, // Add padding for floating button
  },
  flatListEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCard: {
    flex: 1,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: (width / (isTablet ? 3 : 2)) - 10, // Adjust width based on columns
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    width: '100%',
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    zIndex: 10,
  },
  priceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  durationOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
  },
  videoDetails: {
    flex: 1,
    padding: 10,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  channelName: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1, // Allow text to shrink
  },
  videoStats: {
    fontSize: 11,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  uploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  relatedFooterLoader: {
    marginVertical: 10,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },

  // Styles for the video player layout
  playerLayoutScroll: {
    flex: 1,
  },
  playerLayoutContent: {
    flexGrow: 1,
    flexDirection: isTablet ? 'row' : 'column',
    padding: isTablet ? 15 : 0,
  },
  mainVideoPlayerContainer: {
    flex: isTablet ? 2 : 1, // Main video takes more space on tablet
    marginRight: isTablet ? 15 : 0,
    marginBottom: isTablet ? 0 : 15,
  },
  videoPlayerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9, // Standard video aspect ratio
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    fontSize: 16,
  },
  videoInfoContainer: {
    padding: 10,
  },
  currentVideoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  channelAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  channelDetails: {
    flex: 1,
  },
  currentCreatorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentVideoStats: {
    fontSize: 12,
  },
  subscribeButton: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interactionButtonText: {
    marginLeft: 5,
    fontWeight: '600',
  },
  backToFeedButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  backToFeedButtonText: {
    fontWeight: '600',
  },
  relatedVideosContainer: {
    flex: isTablet ? 1 : 0, // Related videos take less space on tablet
    padding: 10,
  },
  relatedVideosHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatedVideoCard: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  relatedThumbnail: {
    width: 120, // Fixed width for related videos
    height: 68, // Fixed height for related videos (16:9 aspect for 120 width)
    backgroundColor: '#ccc',
  },
  relatedVideoDetails: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  relatedVideoTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  relatedChannelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  relatedChannelAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  relatedChannelName: {
    fontSize: 11,
    flexShrink: 1,
  },
  relatedVideoStats: {
    fontSize: 10,
  },
});

export default TipTubeScreen;