// src/screens/tiptube/TipTubeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import VideoCard from '../../components/tiptube/VideoCard';

// Context
import { useTheme } from '../../contexts/ThemeContext';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

// Types
interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
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

const TipTubeScreen: React.FC = () => {
  // Hooks
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // State
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories] = useState([
    { id: 'all', name: 'All' },
    { id: 'trending', name: 'Trending' },
    { id: 'new', name: 'New' },
    { id: 'popular', name: 'Popular' },
    { id: 'following', name: 'Following' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Helper functions
  const getFullUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // API calls
  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VIDEOS.GET_VIDEOS}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        const formattedVideos = result.data.map((video: any) => ({
          ...video,
          thumbnail_url: getFullUrl(video.thumbnail_url),
          video_url: getFullUrl(video.video_url),
          user_profile_image: getFullUrl(video.user_profile_image),
          like_count: video.likes || 0,
          comment_count: video.comments || 0,
          view_count: video.views || 0,
          is_premium: !!video.is_premium
        }));
        
        setVideos(formattedVideos);
        setError(null);
      } else {
        setVideos([]);
        setError('No videos available at the moment.');
      }
    } catch (err) {
      console.error('Videos fetch error:', err);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // In a real app, we would filter videos based on category
    // For now, just refetch all videos
    fetchVideos();
  };

  const handleVideoPress = (videoId: number) => {
    // Navigate to video player screen
    navigation.navigate('Video' as never, { videoId } as never);
  };

  const handleUploadPress = () => {
    // Navigate to video upload screen
    navigation.navigate('TipTubeUpload' as never);
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [])
  );

  useEffect(() => {
    fetchVideos();
  }, []);

  // Render functions
  const renderCategories = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && [styles.selectedCategory, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === category.id && { color: colors.white }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVideoItem = ({ item }: { item: Video }) => (
    <VideoCard
      id={item.id}
      title={item.title}
      thumbnailUrl={item.thumbnail_url || ''}
      duration={item.duration}
      username={item.user_name}
      userImageUrl={item.user_profile_image || undefined}
      views={item.view_count}
      postedTime={new Date(item.created_at).toLocaleDateString()}
      isPremium={item.is_premium}
      onPress={() => handleVideoPress(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="video-off" size={50} color={colors.gray[400]} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No videos available</Text>
      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.primary }]}
        onPress={handleUploadPress}
      >
        <Text style={{ color: colors.white, fontWeight: '600' }}>Upload Video</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="TipTube"
        showBackButton={false}
        showLogo={false}
      />

      {renderCategories()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={videos.length === 0 && styles.flatListEmptyContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleUploadPress}
      >
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TipTubeScreen;
