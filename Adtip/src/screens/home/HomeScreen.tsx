// src/screens/home/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  RefreshControl, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent
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
  media_url: string | null;  // Updated to allow null
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
  };  const fetchStories = async () => {
    try {
      setLoading(prev => ({ ...prev, stories: true }));
      
      // For now, use first 5 posts as stories if available
      if (posts.length > 0) {
        const storyUsers = posts
          .slice(0, 5)
          .map((post: Post, index: number) => ({
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
      // Guard conditions: prevent unnecessary API calls
      if ((loadMore && pagination.current_page >= pagination.total_page) || 
          (loadMore && loading.loadingMore) ||
          (!loadMore && loading.posts) ||
          !user) {
        console.log(`Skipping fetch: ${loadMore ? 'loadMore' : 'initial'} at page ${page}`);
        return;
      }
      
      // Update loading state before API call
      if (loadMore) {
        setLoading(prev => ({ ...prev, loadingMore: true }));
      } else {
        setLoading(prev => ({ ...prev, posts: true }));
        setError(null); // Clear any previous errors when doing a fresh fetch
      }
            
      // Prepare request data with proper types
      const requestData = {
        category: selectedCategory ? parseInt(selectedCategory) : 0,
        page: page,
        limit: 10, // Consistent page size
        loggined_user_id: Number(user.id) // Convert string ID to number to match API type
      };
      
      console.log(`Fetching posts: page ${page}, loadMore: ${loadMore}, category: ${requestData.category}`);
      const result = await ApiService.listPosts(requestData);
        if (result?.data && Array.isArray(result.data)) {
        // TypeScript cast to ensure we're handling the right data structure
        const formattedPosts = result.data.map((rawPost: any) => ({
          id: rawPost.id,
          user_id: rawPost.user_id,
          title: rawPost.title || '',
          content: rawPost.content || '',
          media_url: getFullImageUrl(rawPost.media_url),
          media_type: rawPost.media_type || 'image',
          user_name: rawPost.user_name || 'User',
          user_profile_image: getFullImageUrl(rawPost.user_profile_image),
          likeCount: rawPost.likeCount || rawPost.like_count || 0,
          commentCount: rawPost.commentCount || rawPost.comment_count || 0,
          is_promoted: rawPost.is_promoted || 0,
          created_at: rawPost.created_at || new Date().toISOString(),
          is_premium: !!rawPost.is_premium,
          is_liked: !!rawPost.is_liked
        }));        // Update pagination info
        if (result.pagination) {
          setPagination(result.pagination);
        } else {
          // If no pagination info, update the current page at least
          if (loadMore) {
            setPagination(prev => ({
              ...prev,
              current_page: page
            }));
          }
        }
        
        // Append or replace posts based on loadMore flag
        // Make sure we're not adding duplicate posts by checking IDs
        if (loadMore) {
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.id));
            const newPosts = formattedPosts.filter(post => !existingIds.has(post.id));
            return [...prevPosts, ...newPosts];
          });
        } else {
          setPosts(formattedPosts);
        }
        
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
    // Prevent multiple simultaneous requests or unnecessary requests
    if (loading.loadingMore || loading.posts || refreshing) return;
    
    // Don't load more if we're already at the last page
    if (pagination.current_page >= pagination.total_page) {
      console.log("Already at the last page");
      return;
    }
    
    // Don't load if we have no posts or are in an error state
    if (posts.length === 0 || error) {
      return;
    }
    
    // Only trigger if we have posts already (to avoid double fetching on empty state)
    if (posts.length > 0) {
      console.log("Loading more posts, page:", pagination.current_page + 1);
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
  };  const handleCategoryPress = (categoryId: string) => {
    const newCategory = categoryId === selectedCategory ? null : categoryId;
    setSelectedCategory(newCategory);
    
    // Reset pagination and reload posts with the new category filter
    setPagination({ current_page: 1, total_page: 1, total_count: 0 });
    setPosts([]); // Clear posts to show loading state
    
    // The fetch will be triggered by the useEffect that depends on selectedCategory
  };
  // Effects
  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        await fetchWalletAmount();
        await fetchPosts(1, false);
      };
      
      fetchInitialData();
      
      // Cleanup function to handle component unmounting
      return () => {
        // Cancel any pending requests if needed
      };
    }, [user?.id, selectedCategory]) // Re-run when user or selected category changes
  );

  useEffect(() => {
    if (posts.length > 0) {
      fetchStories();
    }
  }, [posts.length]); // Only run when posts.length changes, not on every post change

  // Initial data fetch on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchWalletAmount();
      await fetchPosts(1, false);
    };
    
    initializeData();
  }, []);

  // Custom scrollable components with useNativeDriver for better performance
  interface StoriesRowProps {
    stories: Story[];
    onStoryPress: (storyId: string) => void;
    onAddStoryPress: () => void;
  }
    const StoriesRow: React.FC<StoriesRowProps> = ({ stories, onStoryPress, onAddStoryPress }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    return (
      <View style={styles.storiesSection}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
          contentContainerStyle={{ paddingRight: 16 }}
        >
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
  }
  const CategoriesRow: React.FC<CategoriesRowProps> = ({ categories, selectedCategory, onCategoryPress }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    return (
      <View style={styles.categoriesSection}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={{ paddingRight: 8 }}
        >
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

  // Render functions
  const renderStories = () => (
    <StoriesRow
      stories={stories}
      onStoryPress={handleStoryPress}
      onAddStoryPress={handleCreatePost}
    />
  );

  const renderCategories = () => (
    <CategoriesRow
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryPress={handleCategoryPress}
    />
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
      postImage={item.media_url || ''}  // Provide empty string when null
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
  };  // Render a single post item
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostItem
      id={item.id}
      username={item.user_name}
      profileImage={item.user_profile_image || ''}  // Provide empty string when null
      postImage={item.media_url || ''}  // Provide empty string when null
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

  // Render header content for FlatList
  const renderListHeader = () => (
    <>
      {renderStories()}
      {renderCategories()}
      {renderEarnCards()}
    </>
  );

  // Render empty/error/loading state for FlatList
  const renderListEmpty = () => {
    if (loading.posts && !refreshing) {
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
    return (
      <View style={styles.emptyContainer}>
        <Icon name="inbox" size={50} color={colors.gray[400]} />
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No posts yet</Text>
        <TouchableOpacity style={[styles.createPostButton, { backgroundColor: colors.primary }]} onPress={handleCreatePost}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  };  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      <Header
        showLogo={true}
        showWallet={true}
        walletAmount={walletBalance ? walletBalance.toString() : undefined}
      />
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item, index) => `post-${item.id}-${index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}  // Trigger at 40% from the end
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.postsContainerStyle}
        maintainVisibleContentPosition={{ 
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }}
        onScrollBeginDrag={() => {
          // Reset any error state on user scroll
          if (error) setError(null);
        }}
        onMomentumScrollBegin={() => {
          // Reset loading state when user starts scrolling
          if (loading.loadingMore) {
            setLoading(prev => ({ ...prev, loadingMore: false }));
          }
        }}
      />
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
    // flex: 1, // Removed flex:1 as it restricts scrolling
  },
  postsContainerStyle: {
    paddingTop: 8,
    paddingBottom: 16, // Added padding at the bottom for better UX
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
