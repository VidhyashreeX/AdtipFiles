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

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

// Types
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
}

const HomeScreen: React.FC = () => {
  // Hooks
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
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
      const token = await AsyncStorage.getItem('accessToken');
      if (!token || !user) return;

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HOME.GET_FUNDS}/${user.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }      const result = await response.json();
      if (result.status === 200) {
        setWalletAmount(result.availableBalance || '0.00');
      }
    } catch (err) {
      console.error('Error fetching wallet amount:', err);
    }
  };

  const fetchStories = async () => {
    try {
      setLoading(prev => ({ ...prev, stories: true }));
      
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HOME.LIST_POSTS}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Stories HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        // Use some posts as stories temporarily
        const storyUsers = result.data
          .slice(0, 5)
          .map((post: Post, index: number) => ({
            id: `story-${index}`,
            username: post.user_name,
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
  };

  const fetchPosts = async () => {
    try {
      setLoading(prev => ({ ...prev, posts: true }));
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token || !user) return;  // Add user check

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HOME.LIST_POSTS}?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Posts HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        const formattedPosts = result.data.map((post: any) => ({
          ...post,
          user_profile_image: getFullImageUrl(post.user_profile_image),
          media_url: getFullImageUrl(post.media_url),
          likeCount: post.likes || 0,
          commentCount: post.comments || 0,
          is_premium: !!post.is_premium
        }));
        
        setPosts(formattedPosts);
      } else {
        setPosts([]);
        setError('No posts available at the moment.');
      }
    } catch (err) {
      console.error('Posts fetch error:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWalletAmount(),
      fetchStories(),
      fetchPosts()
    ]);
    setRefreshing(false);
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
    navigation.navigate('Comments' as never, { postId } as never);
  };

  const handleShare = (postId: number) => {
    // Implement share functionality
  };

  const handlePostPress = (postId: number) => {
    // Navigate to post detail
    const post = posts.find(p => p.id === postId);
    if (post?.media_type === 'video') {
      navigation.navigate('Video' as never, { postId } as never);
    } else {
      navigation.navigate('PostDetail' as never, { postId } as never);
    }
  };

  const handleUserPress = (userId: number) => {
    // Navigate to user profile
    navigation.navigate('Profile' as never, { userId } as never);
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
    navigation.navigate('Story' as never, { storyId } as never);
  };

  const handleWatchAndEarn = () => {
    // Implement watch and earn functionality
    navigation.navigate('WatchAndEarn' as never);
  };

  const handleReferAndEarn = () => {
    // Navigate to referral screen
    navigation.navigate('Referral' as never);
  };

  const handleCreatePost = () => {
    // Navigate to create post screen
    navigation.navigate('CreatePost' as never);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    // Implement category filtering
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchWalletAmount();
      fetchPosts();
    }, [])
  );

  useEffect(() => {
    fetchStories();
    fetchWalletAmount();
    fetchPosts();
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

  const renderPosts = () => {
    if (loading.posts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (posts.length === 0) {
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

    return (
      <View style={styles.postsContainer}>
        {posts.map(post => (
          <PostItem
            key={post.id}
            id={post.id}
            username={post.user_name}
            profileImage={post.user_profile_image}
            postImage={post.media_url}
            caption={post.content}
            likes={post.likeCount}
            comments={post.commentCount}
            timeAgo={getTimeAgo(post.created_at)}
            media_type={post.media_type}
            isPremium={post.is_premium}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onPostPress={handlePostPress}
            onUserPress={handleUserPress}
            onFollow={handleFollow}
            isLiked={!!likedPosts[post.id]}
            userId={post.user_id}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showLogo={true}
        showWallet={true}
        walletAmount={walletAmount}
      />
      
      <ScrollView
        style={styles.scrollView}
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
        {renderPosts()}
      </ScrollView>
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
});

export default HomeScreen;
