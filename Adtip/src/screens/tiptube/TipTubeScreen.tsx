// src/screens/tiptube/TipTubeScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import VideoCard from '../../components/tiptube/VideoCard';

// Services
import ApiService from '../../services/ApiService';

// Context
import {useTheme} from '../../contexts/ThemeContext';

// Types
interface TipTubeScreenProps {
  walletBalance?: string; // Optional wallet balance coming from HOC
}

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  video_url: string | null;
  user_id: number;
  user_name: string;
  user_profile_image: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: string;
  created_at: string;
  is_premium: boolean;
}

interface CategoryMap {
  [key: string]: number;
}

const TipTubeScreen: React.FC<TipTubeScreenProps> = ({walletBalance}) => {
  // Hooks
  const {colors} = useTheme();
  const navigation = useNavigation();

  // State
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    loadingMore: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories] = useState([
    {id: 'all', name: 'All'},
    {id: 'trending', name: 'Trending'},
    {id: 'new', name: 'New'},
    {id: 'popular', name: 'Popular'},
    {id: 'following', name: 'Following'},
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  // Category mapping for API
  const categoryMap = React.useMemo<CategoryMap>(
    () => ({
      all: 0,
      trending: 1,
      new: 2,
      popular: 3,
      following: 4,
    }),
    [],
  );
  // Helper functions
  const getFullUrl = useCallback((url: string) => {
    if (!url || url === 'null' || url === 'undefined') {
      // Return a placeholder image instead of null
      return 'https://via.placeholder.com/320x180?text=No+Preview';
    }

    // If it's already a complete URL, return it
    if (url.startsWith('http')) {
      return url;
    }

    // Handle different types of relative paths

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
  // API calls
  const fetchVideos = useCallback(
    async (categoryId = '0', page = 1, loadMore = false) => {
      try {
        // Try to get userId from multiple possible sources
        let userId = await AsyncStorage.getItem('userId');

        // If userId is not found, try to get it from the user object in AsyncStorage
        if (!userId) {
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            userId = userData?.id?.toString();
          }
        }

        // Even if we don't have a userId, we'll try to fetch public videos
        if (!userId) {
          console.log('No user ID found, will attempt to fetch public videos');
          // Using '0' as a fallback ID to get public/general videos
          userId = '0';
        }

        if (loadMore) {
          setLoading(prev => ({...prev, loadingMore: true}));
        } else {
          setLoading(prev => ({...prev, initial: true}));
        }

        console.log(
          `Fetching videos: category=${categoryId}, page=${page}, userId=${userId}`,
        );

        // Get videos using ApiService
        const response = await ApiService.getVideos(
          userId,
          parseInt(categoryId, 10),
          page,
        );

        // Debug log the raw response
        console.log(
          'Raw API response:',
          JSON.stringify(response).substring(0, 500) + '...',
        );

        if (response?.data && Array.isArray(response.data)) {
          // Log the first item to debug
          if (response.data.length > 0) {
            console.log('First video item:', JSON.stringify(response.data[0]));
          }

          const formattedVideos = response.data.map((video: any) => {
            // Log any problematic items
            if (!video.thumbnail_url && !video.video_url) {
              console.log('Video missing media URLs:', video.id);
            }

            return {
              ...video,
              thumbnail_url: getFullUrl(
                video.thumbnail_url || video.video_thumbnail,
              ), // Try alternate property
              video_url: getFullUrl(video.video_url || video.video_link), // Try alternate property
              user_profile_image: getFullUrl(
                video.user_profile_image || video.channel_profile,
              ),
              like_count: video.likes || video.like_count || 0,
              comment_count: video.comments || video.comment_count || 0,
              view_count: video.views || video.view_count || 0,
              is_premium: !!video.is_premium,
              title: video.title || video.name || 'Untitled Video', // Try alternate property
              user_name:
                video.user_name || video.channelName || 'Unknown Creator',
              duration: video.duration || '0:00',
            };
          });

          // If loading more, append to existing videos
          if (loadMore) {
            setVideos(prev => [...prev, ...formattedVideos]);
          } else {
            setVideos(formattedVideos);
          }

          // Check if we have more videos to load (assuming 10 is the page size)
          setHasMoreVideos(formattedVideos.length > 0);
          setError(null);
        } else {
          if (!loadMore) {
            // Only set empty videos if this is an initial load
            setVideos([]);
            setError('No videos available at the moment.');
          }

          setHasMoreVideos(false);
        }
      } catch (err) {
        console.error('Videos fetch error:', err);
        if (!loadMore) {
          setError('Failed to load videos. Please try again later.');
        }
      } finally {
        if (loadMore) {
          setLoading(prev => ({...prev, loadingMore: false}));
        } else {
          setLoading(prev => ({...prev, initial: false}));
        }
        setRefreshing(false);
      }
    },
    [getFullUrl],
  );

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    const apiCategoryId = categoryMap[selectedCategory].toString();
    fetchVideos(apiCategoryId, 1);
  };
  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      return;
    }

    setSelectedCategory(categoryId);
    setCurrentPage(1);

    // Convert category name to API category ID
    const apiCategoryId = categoryMap[categoryId].toString();
    console.log(
      `Switching to category: ${categoryId} (API ID: ${apiCategoryId})`,
    );

    fetchVideos(apiCategoryId, 1);
  };
  const handleVideoPress = (videoId: number) => {
    // @ts-ignore - Navigation typing issues
    navigation.navigate('Video', {videoId});
  };

  const handleUploadPress = () => {
    navigation.navigate('TipTubeUpload' as never);
  };
  const handleLoadMore = () => {
    if (loading.loadingMore || !hasMoreVideos) {
      return;
    }

    const nextPage = currentPage + 1;
    const apiCategoryId = categoryMap[selectedCategory].toString();

    console.log(`Loading more videos, page ${nextPage}`);
    setCurrentPage(nextPage);
    fetchVideos(apiCategoryId, nextPage, true);
  };
  // Effects
  useFocusEffect(
    useCallback(() => {
      const apiCategoryId = categoryMap[selectedCategory].toString();
      fetchVideos(apiCategoryId, 1);
    }, [categoryMap, selectedCategory, fetchVideos]),
  );
  useEffect(() => {
    const apiCategoryId = categoryMap[selectedCategory].toString();
    fetchVideos(apiCategoryId, 1);
  }, [categoryMap, selectedCategory, fetchVideos]);

  // Render functions
  const renderCategories = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id
                ? {...styles.selectedCategory, backgroundColor: colors.primary}
                : undefined,
            ]}
            onPress={() => handleCategoryPress(category.id)}>
            {' '}
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id
                  ? {color: colors.white}
                  : undefined,
              ]}>
              {String(category.name)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVideoItem = ({item}: {item: Video}) => (
    <VideoCard
      id={item.id}
      title={String(item.title || item.description || 'Untitled Video')}
      thumbnailUrl={
        item.thumbnail_url || 'https://via.placeholder.com/320x180?text=Video'
      }
      duration={String(item.duration || '0:00')}
      username={String(item.user_name || 'User')}
      userImageUrl={
        item.user_profile_image || 'https://via.placeholder.com/40x40?text=User'
      }
      views={item.view_count || 0}
      postedTime={String(
        item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : new Date().toLocaleDateString(),
      )}
      isPremium={item.is_premium}
      onPress={() => handleVideoPress(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="video-off" size={50} color={colors.gray[400]} />
      <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
        {String('No videos available')}
      </Text>
      <TouchableOpacity
        style={[styles.uploadButton, {backgroundColor: colors.primary}]}
        onPress={handleUploadPress}>
        {' '}
        <Text style={[{color: colors.white}, styles.buttonText]}>
          {String('Upload Video')}
        </Text>
      </TouchableOpacity>
    </View>
  );
  const renderFooter = () => {
    if (!loading.loadingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="TipTube"
        showBackButton={false}
        showLogo={false}
        showWallet={true}
        walletAmount={walletBalance}
      />

      {renderCategories()}

      {loading.initial && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.primary}]}>
            {String(error)}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{color: colors.primary}}>{String('Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={
            videos.length === 0
              ? styles.flatListEmptyContainer
              : styles.flatListContainer
          }
          ListEmptyComponent={renderEmptyState}
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
      )}

      <TouchableOpacity
        style={[styles.floatingButton, {backgroundColor: colors.primary}]}
        onPress={handleUploadPress}>
        <Icon name="upload" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: '#f1f5f9',
  },
  selectedCategory: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 12,
  },
  uploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 12,
  },
  flatListEmptyContainer: {
    flexGrow: 1,
  },
  flatListContainer: {
    paddingBottom: 80, // Add padding to avoid floating button overlap
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default TipTubeScreen;
