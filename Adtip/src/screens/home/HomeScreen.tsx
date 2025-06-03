// src/screens/home/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import StoryItem from '../../components/home/StoryItem';
import CategoryItem from '../../components/home/CategoryItem';
import PostItem from '../../components/home/PostItem';
import EarnCard from '../../components/home/EarnCard';

// Services
import WalletService from '../../services/WalletService';
import ApiService from '../../services/ApiService';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

// Types
import { NavigationProps } from '../../types/navigation';

interface HomeScreenProps {
  walletBalance?: string; // Optional wallet balance coming from HOC
}

interface Story {
  id: string;
  username: string;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  user_name: string;
  user_profile_image: string | null;
  likeCount: number;
  commentCount: number;
  is_promoted?: number;
  created_at: string;
  is_premium: boolean;
  is_liked?: boolean;
}

interface Pagination {
  current_page: number;
  total_page: number;
  total_count: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ walletBalance }) => {
  // Hooks
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProps>();
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_page: 1,
    total_count: 0
  });
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'All' },
    { id: '2', name: 'Recent' },
    { id: '3', name: 'Popular' },
    { id: '4', name: 'Following' },
    { id: '5', name: 'Technology' },
    { id: '6', name: 'Fashion' },
    { id: '7', name: 'Business' },
    { id: '8', name: 'Sports' }
  ]);
  const [loading, setLoading] = useState({
    stories: true,
    categories: false,
    posts: true,
    loadingMore: false
  });
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<{ [key: number]: boolean }>({});
  const [walletAmount, setWalletAmount] = useState('0.00');

  // Helper functions
  const getFullImageUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  };
  // API calls
  const fetchWalletAmount = async () => {
    try {
      if (!user) return;
      
      // Use WalletService which uses the proper endpoint format
      const balance = await WalletService.getWalletBalance(user.id);
      setWalletAmount(balance || '0.00');
    } catch (err) {
      console.error('Error fetching wallet amount:', err);
      // Use cached value if available
      const cachedBalance = await AsyncStorage.getItem('@wallet_balance') || '0.00';
      setWalletAmount(cachedBalance);
    }
  };
  const fetchStories = async () => {
    try {
      setLoading(prev => ({ ...prev, stories: true }));
      
      // For now, use first 5 posts as stories if available
      if (posts.length > 0) {
        const storyUsers = posts
          .slice(0, 5)
          .map((post, index) => ({
            id: `story-${index}`,
            username: post.user_name || 'User',
            imageUrl: getFullImageUrl(post.user_profile_image),
          }));
          
        setStories(storyUsers);
        setLoading(prev => ({ ...prev, stories: false }));
        return;
      }
        // Otherwise try to fetch them
      if (!user) {
        setLoading(prev => ({ ...prev, stories: false }));
        return;
      }

      // Use ApiService.listPosts with proper parameters for stories
      const requestData = {
        category: 0,
        page: 1,
        limit: 5,
        loggined_user_id: Number(user.id) // Convert string ID to number
      };
      
      const result = await ApiService.listPosts(requestData);
      if (result?.data && Array.isArray(result.data)) {
        // Use some posts as stories temporarily
        const storyUsers = result.data
          .slice(0, 5)
          .map((post: Post, index: number) => ({
            id: `story-${index}`,
            username: post.user_name || 'User',
            imageUrl: getFullImageUrl(post.user_profile_image),
          }));
          
        setStories(storyUsers);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.error('Stories fetch error:', err);
      setError('Failed to load stories. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, stories: false }));
    }
  };  const fetchPosts = async (page = 1, loadMore = false) => {
    try {
      if (loadMore) {
        setLoading(prev => ({ ...prev, loadingMore: true }));
      } else {
        setLoading(prev => ({ ...prev, posts: true }));
      }
      
      if (!user) return;
        // Use ApiService.listPosts to make the POST request with proper parameters
      const requestData = {
        category: selectedCategory ? parseInt(selectedCategory) : 0,
        page: page,
        limit: 10,
        loggined_user_id: Number(user.id) // Convert string ID to number to match API type
      };
      
      const result = await ApiService.listPosts(requestData);
      
      if (result?.data && Array.isArray(result.data)) {
        const formattedPosts = result.data.map((post: any) => ({
          ...post,
          user_profile_image: getFullImageUrl(post.user_profile_image),
          media_url: getFullImageUrl(post.media_url),
          // Use API's likeCount and commentCount directly
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          is_premium: !!post.is_premium,
          // Add a created_at field if it doesn't exist
          created_at: post.created_at || new Date().toISOString()
        }));
        
        // Update pagination info
        if (result.pagination) {
          setPagination(result.pagination);
        }
        
        // Append or replace posts based on loadMore flag
        setPosts(prevPosts => 
          loadMore ? [...prevPosts, ...formattedPosts] : formattedPosts
        );
          // Pre-populate liked posts state
        const newLikedPosts: {[key: number]: boolean} = {};
        formattedPosts.forEach((post: Post) => {
          if (post.is_liked) {
            newLikedPosts[post.id] = true;
          }
        });
        setLikedPosts(prev => ({...prev, ...newLikedPosts}));
      } else {
        if (!loadMore) {
          setPosts([]);
          setError('No posts available at the moment.');
        }
      }
    } catch (err) {
      console.error('Posts fetch error:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      if (loadMore) {
        setLoading(prev => ({ ...prev, loadingMore: false }));
      } else {
        setLoading(prev => ({ ...prev, posts: false }));
      }
    }
  };
  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchPosts(1, false);
    await fetchWalletAmount();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (loading.loadingMore) return; // Prevent multiple simultaneous requests
    if (pagination.current_page < pagination.total_page) {
      fetchPosts(pagination.current_page + 1, true);
    }
  };

  const handleLike = (postId: number) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
    
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likeCount: post.likeCount + (likedPosts[postId] ? -1 : 1) }
          : post
      )
    );

    // TODO: Implement API call to like/unlike post
  };

  const handleComment = (postId: number) => {
    // Navigate to comment screen
    navigation.navigate('Comments', { postId });
  };

  const handleShare = (postId: number) => {
    // Implement share functionality
  };

  const handlePostPress = (postId: number) => {
    // Navigate to post detail
    const post = posts.find(p => p.id === postId);
    if (post?.media_type === 'video') {
      navigation.navigate('Video', { postId });
    } else {
      navigation.navigate('PostDetail', { postId });
    }
  };

  const handleUserPress = (userId: number) => {
    // Navigate to user profile
    navigation.navigate('Profile', { userId });
  };

  const handleFollow = async (userId: number) => {
    // Implement follow functionality
    return new Promise<void>(resolve => {
      // TODO: Implement API call to follow user
      setTimeout(() => {
        resolve();
      }, 500);
    });
  };

  const handleStoryPress = (storyId: string) => {
    // Navigate to story view
    navigation.navigate('Story', { storyId });
  };

  const handleWatchAndEarn = () => {
    // Implement watch and earn functionality
    navigation.navigate('WatchAndEarn');
  };

  const handleReferAndEarn = () => {
    // Navigate to referral screen
    navigation.navigate('Referral');
  };

  const handleCreatePost = () => {
    // Navigate to create post screen
    navigation.navigate('CreatePost');
  };
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    // TODO: Implement category filtering
    // Reset pagination and fetch posts with selected category
    // setPagination({ current_page: 1, total_page: 1, total_count: 0 });
    // fetchPosts(1, false, categoryId);
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchWalletAmount();
      fetchPosts(1, false);
    }, [])
  );

  useEffect(() => {
    if (posts.length > 0) {
      fetchStories();
    }
  }, [posts]);

  useEffect(() => {
    fetchWalletAmount();
    fetchPosts(1, false);
  }, []);

  // Render functions
  const renderStories = () => (
    <View style={styles.storiesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
        <StoryItem isAddStory={true} onPress={handleCreatePost} />
        {stories.map((story) => (
          <StoryItem
            key={story.id}
            imageUrl={story.imageUrl || undefined}
            username={story.username}
            onPress={() => handleStoryPress(story.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            name={category.name}
            selected={selectedCategory === category.id}
            onPress={() => handleCategoryPress(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderEarnCards = () => (
    <View style={styles.earnCardsSection}>
      <EarnCard
        title="Watch & Earn"
        description="Watch videos and earn rewards"
        iconName="play-circle"
        onPress={handleWatchAndEarn}
      />
      <EarnCard
        title="Refer & Earn"
        description="Invite friends and earn rewards together"
        iconName="user-plus"
        onPress={handleReferAndEarn}
      />
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostItem
      id={item.id}
      username={item.user_name}
      profileImage={item.user_profile_image}
      postImage={item.media_url}
      caption={item.content}
      likes={item.likeCount}
      comments={item.commentCount}
      timeAgo={getTimeAgo(item.created_at)}
      media_type={item.media_type}
      isPremium={item.is_premium}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPostPress={handlePostPress}
      onUserPress={handleUserPress}
      onFollow={handleFollow}
      isLiked={!!likedPosts[item.id]}
      userId={item.user_id}
    />
  );
  const renderFooter = () => {
    if (!loading.loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };
  // Render a single post item
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostItem
      id={item.id}
      username={item.user_name}
      profileImage={item.user_profile_image}
      postImage={item.media_url}
      caption={item.content}
      likes={item.likeCount}
      comments={item.commentCount}
      timeAgo={getTimeAgo(item.created_at)}
      media_type={item.media_type}
      isPremium={item.is_premium}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPostPress={handlePostPress}
      onUserPress={handleUserPress}
      onFollow={handleFollow}
      isLiked={!!likedPosts[item.id]}
      userId={item.user_id}
    />
  );

  const renderPosts = () => {
    if (loading.posts && !refreshing && posts.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error && posts.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (posts.length === 0 && !loading.posts) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={50} color={colors.gray[400]} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No posts yet</Text>
          <TouchableOpacity style={[styles.createPostButton, { backgroundColor: colors.primary }]} onPress={handleCreatePost}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Create Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    );
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      <Header
        showLogo={true}
        showWallet={true}
        walletAmount={walletBalance}
      />
      
      <View style={styles.scrollView}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {renderStories()}
          {renderCategories()}
          {renderEarnCards()}
          <View style={styles.postsContainer}>
            {renderPosts()}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  storiesSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  storiesContainer: {
    paddingLeft: 16,
  },
  categoriesSection: {
    paddingVertical: 12,
  },
  categoriesContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  earnCardsSection: {
    padding: 16,
  },
  postsContainer: {
    paddingTop: 8,
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 12,
  },
  createPostButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default HomeScreen;
