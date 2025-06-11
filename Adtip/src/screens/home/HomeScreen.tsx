// src/screens/home/HomeScreen.tsx
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import StoryItem from '../../components/home/StoryItem';
import CategoryItem from '../../components/home/CategoryItem';
import PostItem from '../../components/home/PostItem';
import EarnCard from '../../components/home/EarnCard';
import CommentScreen from './CommentScreen'; // Add this import
import StoryItemSkeleton from '../../components/skeletons/StoryItemSkeleton';
import CategoryItemSkeleton from '../../components/skeletons/CategoryItemSkeleton';
import EarnCardSkeleton from '../../components/skeletons/EarnCardSkeleton';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';

// Services
import WalletService from '../../services/WalletService';
import ApiService from '../../services/ApiService';
import LastSeenService from '../../services/LastSeenService';

// Context
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext'; // Make sure AuthContext exports refreshUserData
import {useTabNavigator} from '../../contexts/TabNavigatorContext';

// Constants
import {API_BASE_URL} from '../../constants/api';

// Types
import { AppNavigationProps as NavigationProps } from '../../types/navigation'; // Changed to AppNavigationProps and aliased

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
  media_url: string | null; // Updated to allow null
  media_type: string;
  user_name: string;
  user_profile_image: string | null;
  likeCount: number;
  commentCount: number;
  is_promoted?: number;
  created_at: string;
  is_premium?: boolean;
  is_liked?: boolean;
  last_active?: string | null;
}

interface Comment {
  id: number;
  postId: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_profile: string | null;
}

interface Pagination {
  current_page: number;
  total_page: number;
  total_count: number;
}

// Move StoriesRow and CategoriesRow outside HomeScreen component

interface StoriesRowProps {
  stories: Story[];
  onStoryPress: (storyId: string) => void;
  onAddStoryPress: () => void;
}
const StoriesRow: React.FC<StoriesRowProps> = ({
  stories,
  onStoryPress,
  onAddStoryPress,
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  return (
    <View style={styles.storiesSection}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContentContainer}>
        <StoryItem
          isAddStory={true}
          onPress={onAddStoryPress}
          key="add-story"
        />
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
const CategoriesRow: React.FC<CategoriesRowProps> = ({
  categories,
  selectedCategory,
  onCategoryPress,
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  return (
    <View style={styles.categoriesSection}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContentContainer}>
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

// Utility function to shuffle an array (add this at the top of the file or import from utils)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const HomeScreen: React.FC<HomeScreenProps> = ({walletBalance}) => {
  // Hooks
  const {colors} = useTheme();
  // Destructure refreshUserData from useAuth
  const {user, refreshUserData} = useAuth(); 
  const navigation = useNavigation<NavigationProps>();
  const {contentPaddingBottom} = useTabNavigator();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryState, setSelectedCategoryState] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_page: 1,
    total_count: 0,
  });
  const [categories] = useState<Category[]>([
    {id: '1', name: 'All'},
    {id: '2', name: 'Recent'},
    {id: '3', name: 'Popular'},
    {id: '4', name: 'Following'},
    {id: '5', name: 'Technology'},
    {id: '6', name: 'Fashion'},
    {id: '7', name: 'Business'},
    {id: '8', name: 'Sports'},
  ]);
  
  const [loading, setLoading] = useState({
    stories: true,
    categories: false,
    posts: false, // Changed from true to false so fetchPosts will run on initial render
    loadingMore: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});  const [_walletAmount, setWalletAmount] = useState('0.00');
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial full skeleton

  // Viewability configuration
  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% of it is in viewport
    minimumViewTime: 300, // Must be visible for 300ms before triggering callback
  }).current;

  // Track which posts are currently visible
  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const visibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id);
    setVisiblePostIds(visibleIds);
  }).current;

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
    const diffInMinutes = Math.floor(
      (now.getTime() - postTime.getTime()) / (1000 * 60),
    );

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
      if (!user) {
        return;
      }
      const balance = await WalletService.getWalletBalance(user.id);
      setWalletAmount(balance || '0.00');
    } catch (err) {
      console.error('Error fetching wallet amount:', err);
      const cachedBalance =
        (await AsyncStorage.getItem('@wallet_balance')) || '0.00';
      setWalletAmount(cachedBalance);
    }
  };

  // Only fetch stories once, after posts are loaded
  const fetchStories = async () => {
    try {
      setLoading(prev => ({...prev, stories: true}));
      if (posts.length > 0) {
        const storyUsers = posts.slice(0, 5).map((post: Post, index: number) => ({
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
      setLoading(prev => ({...prev, stories: false}));
    }
  };

  // Only fetch posts if not already loading or at end
  const fetchPosts = async (page = 1, loadMore = false) => {
    if (!user) { 
      setInitialLoading(false); // Ensure loading stops if no user
      return; 
    }
    if (loading.posts || loading.loadingMore) { return; }
    if (loadMore && (pagination.current_page >= pagination.total_page)) { return; }
    try {
      if (loadMore) {
        setLoading(prev => ({...prev, loadingMore: true}));
      } else {
        setLoading(prev => ({...prev, posts: true}));
        setError(null);
      }
      const requestData = {
        category: selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0,
        page: page,
        limit: 10,
        loggined_user_id: Number(user.id),
      };
      const result = await ApiService.listPosts(requestData);
      if (result?.data && Array.isArray(result.data)) {
        let formattedPosts = result.data.map((rawPost: any) => ({
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
          is_liked: !!rawPost.is_liked,
          last_active: rawPost.last_active || null,
        }));

        if (result.pagination) {
          setPagination(result.pagination);
        } else if (loadMore) {
          setPagination(prev => ({...prev, current_page: page}));
        }

        if (loadMore) {
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.id));
            const newPosts = formattedPosts.filter(post => !existingIds.has(post.id));
            return [...prevPosts, ...newPosts];
          });
        } else {
          // Shuffle posts on initial load or refresh
          setPosts(shuffleArray(formattedPosts));
        }

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
        setLoading(prev => ({...prev, loadingMore: false}));
      } else {
        setLoading(prev => ({...prev, posts: false}));
      }
      setInitialLoading(false); // Set initial loading to false after first fetch attempt
    }
  };
  
  // Only fetch posts if not already loading or at end
  const fetchPostsV2 = async (page = 1, loadMore = false) => {
    if (!user) { return; }
    if (loading.posts || loading.loadingMore) { return; }
    if (loadMore && (pagination.current_page >= pagination.total_page)) { return; }
    try {
      if (loadMore) {
        setLoading(prev => ({...prev, loadingMore: true}));
      } else {
        setLoading(prev => ({...prev, posts: true}));
        setError(null);
      }
      const requestData = {
        category: selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0,
        page: page,
        limit: 10,
        loggined_user_id: Number(user.id),
      };
      const result = await ApiService.listPosts(requestData);
      if (result?.data && Array.isArray(result.data)) {
        let formattedPosts = result.data.map((rawPost: any) => ({
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
          is_liked: !!rawPost.is_liked,
          last_active: rawPost.last_active || null,
        }));

        if (result.pagination) {
          setPagination(result.pagination);
        } else if (loadMore) {
          setPagination(prev => ({...prev, current_page: page}));
        }

        if (loadMore) {
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.id));
            const newPosts = formattedPosts.filter(post => !existingIds.has(post.id));
            return [...prevPosts, ...newPosts];
          });
        } else {
          // Shuffle posts on initial load or refresh
          setPosts(shuffleArray(formattedPosts));
        }

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
        setLoading(prev => ({...prev, loadingMore: false}));
      } else {
        setLoading(prev => ({...prev, posts: false}));
      }
      setInitialLoading(false); // Set initial loading to false after first fetch attempt
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null); 
    // setInitialLoading(true); // Optional: if you want skeleton on pull-to-refresh of empty list

    try {
      if (user && typeof refreshUserData === 'function') {
        await refreshUserData();
      }
      setPagination({current_page: 1, total_page: 1, total_count: 0});
      // setPosts([]); // Clearing posts is now handled by fetchPosts before setting shuffled data
      // setStories([]); // Stories will update based on shuffled posts

      await Promise.all([
        fetchWalletAmount(), 
        fetchPosts(1, false), // This will now fetch and shuffle
      ]);
      
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh content. Please try again.');
    } finally {
      setRefreshing(false); 
      // initialLoading will be set to false by fetchPosts
    }
  };

  const handleLoadMore = () => {
    // Prevent multiple simultaneous requests or unnecessary requests
    if (loading.loadingMore || loading.posts || refreshing) {
      return;
    }

    // Don't load more if we're already at the last page
    if (pagination.current_page >= pagination.total_page) {
      console.log('Already at the last page');
      return;
    }

    // Don't load if we have no posts or are in an error state
    if (posts.length === 0 || error) {
      return;
    }

    // Only trigger if we have posts already (to avoid double fetching on empty state)
    if (posts.length > 0) {
      console.log('Loading more posts, page:', pagination.current_page + 1);
      fetchPosts(pagination.current_page + 1, true);
    }
  };

  const handleLike = async (postId: number) => {
    if (!user?.id) {
      console.warn('User not authenticated, cannot like post');
      return;
    }

    const previousLikedState = likedPosts[postId] || false;
    const newLikedState = !previousLikedState;

    // Optimistically update the UI
    setLikedPosts(prev => ({
      ...prev,
      [postId]: newLikedState,
    }));

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {...post, likeCount: post.likeCount + (newLikedState ? 1 : -1)}
          : post,
      ),
    );

    try {
      console.log('Sending like request:', { userId: user.id, postId, is_liked: newLikedState });
      
      const response = await ApiService.likePost({
        userId: user.id,
        postId: postId,
        is_liked: newLikedState,
      });
      
      console.log('Like API response:', response);
      
      // Handle the actual API response structure
      if (response.status === true && response.is_liked === newLikedState) {
        // Success - UI is already updated optimistically
        console.log('Post like status updated successfully');
      } else if (response.status === false) {
        // API returned failure status
        throw new Error(response.message || 'API request failed');
      } else {
        // Unexpected response structure
        console.warn('Unexpected API response structure, but treating as success');
      }
      
    } catch (error: any) {
      console.error('Error updating like status:', error);
      
      // Rollback UI changes on error
      setLikedPosts(prev => ({
        ...prev,
        [postId]: previousLikedState,
      }));

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {...post, likeCount: post.likeCount + (previousLikedState ? 1 : -1)}
            : post,
        ),
      );

      setError(`Failed to ${newLikedState ? 'like' : 'unlike'} post. Please try again.`);
    }
  };

  const handleComment = (postId: number) => {
    setSelectedCommentPostId(postId);
    setCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setCommentModalVisible(false);
    setTimeout(() => setSelectedCommentPostId(null), 300); // Wait for animation to finish
  };

  const handleShare = (_postId: number) => {
    // Implement share functionality
  };

  const handlePostPress = (postId: number) => {
    // Navigate to post detail
    const post = posts.find(p => p.id === postId);
    if (post?.media_type === 'video') {
      navigation.navigate('Video', {postId});
    } else {
      navigation.navigate('PostDetail', {postId});
    }
  };

  const handleUserPress = (_userId: number) => {
    // Navigate to user profile
    navigation.navigate('Profile', {userId: _userId});
  };

  const handleFollow = async (_userIdToFollow: number) => {
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
    navigation.navigate('Story', {storyId});
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
    const newCategory = categoryId === selectedCategoryState ? null : categoryId;
    setSelectedCategoryState(newCategory);

    // Reset pagination and reload posts with the new category filter
    setPagination({current_page: 1, total_page: 1, total_count: 0});
    setPosts([]); // Clear posts to show loading state

    // The fetch will be triggered by the useEffect that depends on selectedCategory
  };
  // Effects
  // Remove useFocusEffect for posts/wallet fetch, use useEffect for initial load and category change
  useEffect(() => {
    if (!user) {
      setInitialLoading(false); // Stop initial loading if no user
      return;
    }
    
    // Start tracking user presence when home screen loads
    LastSeenService.startTracking();
    
    // Fetch wallet and posts on mount or when user/category changes
    const fetchInitialData = async () => {
      setInitialLoading(true); // Set initial loading true before fetching
      await fetchWalletAmount();
      await fetchPosts(1, false); // This will set initialLoading to false in its finally block
    };
    fetchInitialData();
    
    // Clean up when component unmounts
    return () => {
      // We don't stop tracking here because user might navigate to other screens
      // LastSeenService.stopTracking() is called in AuthContext logout and cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedCategoryState]);

  // Only fetch stories after posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      fetchStories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length]); // Only run when posts.length changes, not on every post change

  // Skeleton rendering for the entire initial screen
  const renderInitialSkeleton = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.postsContainerStyle, {paddingBottom: contentPaddingBottom}]}
    >
      {/* Stories Skeleton */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesContentContainer}>
          <StoryItemSkeleton isAddStory={true} />
          {Array(5).fill(0).map((_, i) => <StoryItemSkeleton key={`story_sk_${i}`} />)}
        </ScrollView>
      </View>
      {/* Categories Skeleton */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContentContainer}>
          {Array(5).fill(0).map((_, i) => <CategoryItemSkeleton key={`cat_sk_${i}`} />)}
        </ScrollView>
      </View>
      {/* Earn Cards Skeleton */}
      <View style={styles.earnCardsSection}>
        <EarnCardSkeleton />
        <EarnCardSkeleton />
      </View>
      {/* Posts Skeleton */}
      {Array(3).fill(0).map((_, i) => <PostItemSkeleton key={`post_sk_${i}`} />)}
    </ScrollView>
  );

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
      selectedCategory={selectedCategoryState}
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
  // Removed unused renderPost function
  const renderFooter = () => {
    if (!loading.loadingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };  // Render a single post item
  const renderPostItem = ({item}: {item: Post}) => {
    const isVisible = visiblePostIds.includes(item.id);
    
    return (
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
        isVisible={isVisible}
        last_active={item.last_active} // Add this line
      />
    );
  };

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
          {error ? (
            <Text style={[styles.emptyText, {color: colors.text.secondary}]}>{error}</Text>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Icon name="inbox" size={50} color={colors.gray[400]} />
        <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No posts yet</Text>
      </View>
    );
  };
  // Main render
  if (initialLoading && !refreshing) { // Show full skeleton on initial load
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Home"
          showLogo={true}
          showWallet={true}
          // walletAmount can be undefined or a placeholder during skeleton
        />
        {renderInitialSkeleton()}
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Home"
        showLogo={true}
        showWallet={true}
        walletAmount={walletBalance ? walletBalance.toString() : undefined}
      />
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item, index) => `post-${item.id}-${index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4} // Trigger at 40% from the end
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={ // Modified to not show ActivityIndicator if initialLoading was true
          !loading.posts && !refreshing ? ( // Only show empty/error if not actively loading posts
            error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.emptyText, {color: colors.text.secondary}]}>{error}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={50} color={colors.gray?.[400] || '#A0AEC0'} />
                <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No posts yet</Text>
              </View>
            )
          ) : null // Return null if loading.posts is true (FlatList's own loader or refresh control will show)
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]} // For Android
            tintColor={colors.primary} // For iOS
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={[styles.postsContainerStyle, {paddingBottom: contentPaddingBottom}]}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        onScrollBeginDrag={() => {
          // Reset any error state on user scroll
          if (error) {
            setError(null);
          }
        }}
        onMomentumScrollBegin={() => {
          // Reset loading state when user starts scrolling
          if (loading.loadingMore) {
            setLoading(prev => ({...prev, loadingMore: false}));
          }
        }}
      />
      {/* Comments Modal Overlay */}
      {commentModalVisible && selectedCommentPostId !== null && (
        <CommentScreen
          visible={commentModalVisible}
          postId={selectedCommentPostId}
          onClose={handleCloseCommentModal}
        />
      )}
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
    // borderBottomWidth: 1, // Optional for skeleton
    // borderBottomColor: '#EEEEEE', // Optional for skeleton
  },
  storiesContainer: {
    paddingLeft: 16,
  },
  storiesContentContainer: {
    paddingRight: 16,
  },
  categoriesSection: {
    paddingVertical: 12,
  },
  categoriesContainer: {
    paddingLeft: 16,
    paddingRight: 8, // Ensure this matches original
  },
  categoriesContentContainer: { // Added for consistency
    paddingRight: 8,
  },
  earnCardsSection: {
    padding: 16,
  },
  postsContainerStyle: { // Used by both FlatList and Skeleton ScrollView
    paddingTop: 8,
  },
  loadingContainer: { // For FlatList's ListEmptyComponent when loading.posts is true
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Give some space for the error message
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Give some space for the empty message
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 12,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default HomeScreen;
