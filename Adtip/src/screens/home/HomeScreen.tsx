// src/screens/home/HomeScreen.tsx
import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  ViewabilityConfig,
  ViewToken,
  Keyboard,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';

// Contexts & Services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import ApiService from '../../services/ApiService';
import {API_BASE_URL} from '../../constants/api';

// Components
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';
import StoryItem from '../../components/home/StoryItem';
import CategoryItem from '../../components/home/CategoryItem';
import EarnCard from '../../components/home/EarnCard';
import CommentScreen from './CommentScreen';
import ScreenTransition from '../../components/common/ScreenTransition'; // ADD THIS IMPORT
import UserProfileScreen from '../profile/UserProfileScreen';

// Skeleton Components
import StorySkeleton from '../../components/skeletons/StoryItemSkeleton';
import CategorySkeleton from '../../components/skeletons/CategoryItemSkeleton';
import EarnCardSkeleton from '../../components/skeletons/EarnCardSkeleton';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';

// Types
import {AppNavigationProps} from '../../types/navigation';

// Interfaces
interface Story { id: string; username: string; imageUrl: string | null; }
interface Category { id: string; name: string; }
interface Post {
  id: number; user_id: number; title: string; content: string;
  media_url: string | null; media_type: string; user_name: string;
  user_profile_image: string | null; likeCount: number; commentCount: number;
  is_promoted?: number; created_at: string; is_premium?: boolean;
  is_liked?: boolean; last_active?: string | null;
}
interface Pagination { current_page: number; total_page: number; total_count: number; }
interface HomeScreenProps { walletBalance?: string; }

// Helper Components (assuming these are defined as in your provided context)
interface StoriesRowProps { stories: Story[]; onStoryPress: (storyId: string) => void; onAddStoryPress: () => void; isLoading?: boolean; }
const StoriesRow: React.FC<StoriesRowProps> = ({ stories, onStoryPress, onAddStoryPress, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesContentContainer}>
          <StorySkeleton isAddStory={true} />
          {Array(5).fill(0).map((_, index) => <StorySkeleton key={`story-skel-${index}`} />)}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.storiesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesContentContainer}>
        <StoryItem isAddStory={true} onPress={onAddStoryPress} key="add-story" />
        {stories.map((story: Story, idx: number) => (
          <StoryItem key={`${story.id}-${idx}`} imageUrl={story.imageUrl || undefined} username={story.username ? String(story.username) : ''} onPress={() => onStoryPress(story.id)} />
        ))}
      </ScrollView>
    </View>
  );
};

// Helper: CategoriesRow Component
interface CategoriesRowProps { categories: Category[]; selectedCategory: string | null; onCategoryPress: (categoryId: string) => void; isLoading?: boolean; }
const CategoriesRow: React.FC<CategoriesRowProps> = ({ categories, selectedCategory, onCategoryPress, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContentContainer}>
          {Array(6).fill(0).map((_, index) => <CategorySkeleton key={`cat-skel-${index}`} />)}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.categoriesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContentContainer}>
        {categories.map((category: Category, idx: number) => (
          <CategoryItem key={`${category.id}-${idx}`} name={category.name ? String(category.name) : ''} selected={selectedCategory === category.id} onPress={() => onCategoryPress(category.id)} />
        ))}
      </ScrollView>
    </View>
  );
};

// Helper: EarnCardsRow Component
interface EarnCardsRowProps { onWatchAndEarn: () => void; onReferAndEarn: () => void; isLoading?: boolean; }
const EarnCardsRow: React.FC<EarnCardsRowProps> = ({ onWatchAndEarn, onReferAndEarn, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);
  if (isLoading) {
    return (
      <View style={styles.earnCardsSection}>
        <View style={styles.earnCard}><EarnCardSkeleton /></View>
        <View style={styles.earnCard}><EarnCardSkeleton /></View>
      </View>
    );
  }
  return (
    <View style={styles.earnCardsSection}>
      <View style={styles.earnCard}>
        <EarnCard
          title="Watch & Earn"
          description="Watch videos and earn rewards"
          iconName="play-circle"
          onPress={onWatchAndEarn}
        />
      </View>
      <View style={styles.earnCard}>
        <EarnCard
          title="Refer & Earn"
          description="Invite friends and earn rewards together"
          iconName="user-plus"
          onPress={onReferAndEarn}
        />
      </View>
    </View>
  );
};


function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; }
  return newArray;
}

const HomeScreen: React.FC<HomeScreenProps> = ({walletBalance: hocWalletBalance}) => {
  const {colors, isDarkMode} = useTheme();
  const {user, refreshUserData} = useAuth();
  const navigation = useNavigation<AppNavigationProps>();
  const {contentPaddingBottom} = useTabNavigator();
  const styles = createHomeScreenStyles(colors);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryState, setSelectedCategoryState] = useState<string | null>('0');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ current_page: 1, total_page: 1, total_count: 0 });
  const [staticCategories] = useState<Category[]>([
    {id: '0', name: 'All'}, {id: '1', name: 'Recent'}, {id: '2', name: 'Popular'}, {id: '3', name: 'Following'},
    {id: '4', name: 'Technology'}, {id: '5', name: 'Fashion'}, {id: '6', name: 'Business'}, {id: '7', name: 'Sports'},
  ]);
  const [loading, setLoading] = useState({ posts: false, loadingMore: false });
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<{[key: number]: boolean}>({});
  const [walletAmount] = useState(hocWalletBalance || '0.00');
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const postsAbortControllerRef = useRef<AbortController | null>(null);
  const likeAbortControllerRef = useRef<AbortController | null>(null);

  // Optimized viewability config for instant video control
  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50, // Reduced for faster triggering
    minimumViewTime: 100, // Much shorter for instant response
    waitForInteraction: false,
  }), []);

  // Instant visibility tracking
  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const currentVisibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id as number);

    // Update visible posts instantly
    setVisiblePostIds(currentVisibleIds);
  }, []);

  const getFullImageUrl = useCallback((url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  const getTimeAgo = useCallback((timestamp: string) => {
    const now = new Date(); const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }, []);
  
  const deriveStoriesFromPosts = useCallback((currentPosts: Post[]) => {
    if (currentPosts.length > 0) {
      const storyUsers = currentPosts.slice(0, 10).map((post: Post, index: number) => ({
        id: `story-${post.id}-${index}`, username: post.user_name || 'User',
        imageUrl: getFullImageUrl(post.user_profile_image),
      }));
      setStories(storyUsers);
    } else {
      setStories([]);
    }
  }, [getFullImageUrl]);

  const fetchPosts = useCallback(async (page = 1, loadMore = false, signal?: AbortSignal) => {
    if (!user?.id) {
      if (!signal?.aborted && !loadMore && !refreshing) setInitialLoading(false);
      return;
    }
    if (!loadMore && !refreshing && loading.posts) {
        console.log('[HomeScreen PostsFetch] Skipped: Already loading initial posts and not refreshing.');
        return;
    }
    if (loadMore && loading.loadingMore) {
        console.log('[HomeScreen PostsFetch] Skipped: Already loading more.');
        return;
    }
    if (loadMore && (pagination.current_page >= pagination.total_page && pagination.total_page > 0 && posts.length >= pagination.total_count && pagination.total_count > 0)) {
        console.log('[HomeScreen PostsFetch] Skipped (loadMore): No more pages.');
        setLoading(prev => ({...prev, loadingMore: false}));
        return;
    }
    const loggedInUserId = Number(user.id);
    if (isNaN(loggedInUserId)) {
      console.error("[HomeScreen PostsFetch] Invalid user ID:", user.id);
      if (!signal?.aborted) {
        if (!loadMore) { setError("User information is invalid. Cannot load posts."); setInitialLoading(false); setPosts([]); deriveStoriesFromPosts([]); }
        if (loadMore) setLoading(prev => ({...prev, loadingMore: false}));
      }
      return;
    }
    try {
      if (loadMore) setLoading(prev => ({...prev, loadingMore: true}));
      else if (!refreshing) setLoading(prev => ({...prev, posts: true}));
      
      const requestData = { category: selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0, page: page, limit: 10, loggined_user_id: loggedInUserId };
      const result = await ApiService.listPosts(requestData, {signal});

      if (signal?.aborted) {
        console.log('[HomeScreen PostsFetch] Aborted by signal.');
        return;
      }
      if (result && result.message === 'Request canceled by client') {
        console.log('[HomeScreen PostsFetch] ApiService reported client cancellation.');
        if (loadMore) setLoading(prev => ({...prev, loadingMore: false}));
        else { setLoading(prev => ({...prev, posts: false})); if (!refreshing) setInitialLoading(false); }
        return;
      }
      if (result?.data && Array.isArray(result.data)) {
        const formattedPosts = result.data.map((rawPost: any) => ({
          id: rawPost.id, user_id: rawPost.user_id, title: rawPost.title || '', content: rawPost.content || '',
          media_url: getFullImageUrl(rawPost.media_url), media_type: rawPost.media_type || 'image',
          user_name: rawPost.user_name || 'User', user_profile_image: getFullImageUrl(rawPost.user_profile_image),
          likeCount: rawPost.likeCount || rawPost.like_count || 0, commentCount: rawPost.commentCount || rawPost.comment_count || 0,
          is_promoted: rawPost.is_promoted || 0, created_at: rawPost.created_at || new Date().toISOString(),
          is_premium: !!rawPost.is_premium, is_liked: !!rawPost.is_liked, last_active: rawPost.last_active || null,
        }));
        if (loadMore) setPosts(prevPosts => shuffleArray([...prevPosts, ...formattedPosts]));
        else { setPosts(shuffleArray(formattedPosts)); deriveStoriesFromPosts(formattedPosts); }
        if (result.pagination) setPagination(result.pagination);
        const newLikedPosts: {[key: number]: boolean} = {};
        formattedPosts.forEach((post: Post) => { newLikedPosts[post.id] = !!post.is_liked; });
        setLikedPosts(prev => ({...prev, ...newLikedPosts}));
      } else if (!loadMore) { setPosts([]); deriveStoriesFromPosts([]); }
      const responseStatus = (result as any)?.status; const responseMessage = (result as any)?.message;
      if (!loadMore && responseMessage && responseStatus === false && result.message !== 'Request canceled by client') setError(responseMessage);
      else if (!loadMore) setError(null);
    } catch (err: any) {
      if (!axios.isCancel(err) && err.name !== 'AbortError') { 
        console.error('Posts fetch error (catch block):', err);
        if (!signal?.aborted && !loadMore) setError('Failed to load posts.'); 
      } else {
        console.log('[HomeScreen PostsFetch] Canceled/aborted during API call (caught).');
      }
    } finally {
      if (!signal?.aborted) {
        if (loadMore) setLoading(prev => ({...prev, loadingMore: false}));
        else { setLoading(prev => ({...prev, posts: false})); if (!refreshing) setInitialLoading(false); }
      }
    }
  }, [
    user?.id,
    selectedCategoryState,
    getFullImageUrl,
    deriveStoriesFromPosts,
    refreshing
  ]);


  useEffect(() => {
    if (!user) { setInitialLoading(false); setPosts([]); setStories([]); setPagination({ current_page: 1, total_page: 1, total_count: 0 }); return; }
    postsAbortControllerRef.current?.abort();
    postsAbortControllerRef.current = new AbortController();
    const postsSignal = postsAbortControllerRef.current.signal;
    setInitialLoading(true); setError(null); setPosts([]); setStories([]); setPagination(prev => ({ ...prev, current_page: 1, total_page: 1, total_count: 0 }));
    const fetchInitialData = async () => {
      if (!postsSignal.aborted) await fetchPosts(1, false, postsSignal);
      else { setInitialLoading(false); setLoading(prev => ({...prev, posts: false}));}
    };
    fetchInitialData();
    return () => { postsAbortControllerRef.current?.abort(); };
  }, [user?.id, selectedCategoryState, fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Focused.');
      return () => {
        console.log('[HomeScreen] Unfocused/Unmounted (useFocusEffect cleanup): Aborting API calls.');
        postsAbortControllerRef.current?.abort();
        likeAbortControllerRef.current?.abort();
      };
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    if (!user?.id) { setRefreshing(false); return; }
    console.log('[HomeScreen] Refresh triggered.');
    setRefreshing(true);
    setError(null);
    // Abort previous post and like fetches
    postsAbortControllerRef.current?.abort();
    likeAbortControllerRef.current?.abort();

    // Create new controller for this refresh operation
    const currentPostsCtrl = new AbortController();
    postsAbortControllerRef.current = currentPostsCtrl;
    const postsSignal = currentPostsCtrl.signal;

    try {
      if (typeof refreshUserData === 'function') await refreshUserData();
      // Reset pagination for refresh
      setPagination({current_page: 1, total_page: 1, total_count: 0});
      // Fetch posts for page 1. fetchPosts will handle its own loading.posts state.
      // initialLoading is not set to true here, as 'refreshing' state indicates the loading type.
      await fetchPosts(1, false, postsSignal);
    } catch (err: any) {
      if (!axios.isCancel(err) && err.name !== 'AbortError') {
        console.error('Error during refresh (handleRefresh catch):', err);
        setError('Failed to refresh content.');
      } else {
         console.log('[HomeScreen Refresh] A fetch during refresh was canceled/aborted.');
      }
    } finally {
      // Ensure refreshing is set to false only if the signal for *this* refresh operation wasn't aborted.
      // If it was aborted (e.g., by unmount), then another process is in control.
      if (!postsSignal.aborted) {
          setRefreshing(false);
      }
    }
  }, [user?.id, refreshUserData, fetchPosts]); // fetchPosts is a dependency

  const handleLoadMore = useCallback(() => {
    // Guards use current state values. These states are not dependencies of this useCallback.
    if (loading.loadingMore || (loading.posts && !refreshing) || refreshing || initialLoading || posts.length === 0 || error) {
        // ... (optional logging for why it's returning)
        return;
    }
    if (pagination.current_page >= pagination.total_page && pagination.total_page > 0 && posts.length >= pagination.total_count && pagination.total_count > 0) {
        return;
    }

    console.log('[HomeScreen] Load more posts, page:', pagination.current_page + 1);
    // Ensure there's a fresh controller if the previous one was used and potentially aborted
    if (!postsAbortControllerRef.current || postsAbortControllerRef.current.signal.aborted) {
      postsAbortControllerRef.current = new AbortController();
    }
    const signal = postsAbortControllerRef.current.signal;
    fetchPosts(pagination.current_page + 1, true, signal);
  }, [
    fetchPosts, // If fetchPosts definition changes, we need a new handleLoadMore
    // States used in guards are read from closure:
    // loading.loadingMore, loading.posts, refreshing, initialLoading, posts.length, error,
    // pagination.current_page, pagination.total_page, pagination.total_count
    // To satisfy exhaustive-deps, you might list them, but be wary of cycles.
    pagination.current_page, // Used to calculate next page for fetchPosts
    pagination.total_page,   // Used in guard
    pagination.total_count,  // Used in guard
    initialLoading,          // Used in guard
    refreshing,              // Used in guard
    error,                   // Used in guard
    posts.length,            // Used in guard
    loading.loadingMore,     // Used in guard
    loading.posts            // Used in guard
  ]);

  const handleLike = useCallback(async (postId: number) => {
    if (!user?.id) return;
    likeAbortControllerRef.current?.abort();
    likeAbortControllerRef.current = new AbortController();
    const signal = likeAbortControllerRef.current.signal;

    const previousLikedState = likedPosts[postId] || false;
    const newLikedState = !previousLikedState;

    setLikedPosts(prev => ({...prev, [postId]: newLikedState}));
    setPosts(prevPosts => prevPosts.map(post => post.id === postId ? {...post, likeCount: post.likeCount + (newLikedState ? 1 : -1), is_liked: newLikedState} : post));

    try {
      const response = await ApiService.likePost({ userId: Number(user.id), postId: postId, is_liked: newLikedState }, {signal});
      if (signal.aborted) { console.log('[LikePost] Aborted.'); return; }
      if (!response.status || response.is_liked !== newLikedState) {
        // Revert UI on failed API call
        setLikedPosts(prev => ({...prev, [postId]: previousLikedState}));
        setPosts(prevPosts => prevPosts.map(post => post.id === postId ? {...post, likeCount: post.likeCount + (previousLikedState ? 1 : -1), is_liked: previousLikedState} : post));
      }
    } catch (err: any) {
      if (!axios.isCancel(err) && err.name !== 'AbortError') {
        console.error('Like post error:', err);
        // Revert UI on error
        setLikedPosts(prev => ({...prev, [postId]: previousLikedState}));
        setPosts(prevPosts => prevPosts.map(post => post.id === postId ? {...post, likeCount: post.likeCount + (previousLikedState ? 1 : -1), is_liked: previousLikedState} : post));
      } else {
        console.log('[LikePost] Canceled/aborted.');
      }
    }
  }, [user?.id, likedPosts]);

  const handleCreatePost = () => navigation.navigate('Main', { screen: 'CreatePost' });
  const handleWatchAndEarn = () => navigation.navigate('Main', { screen: 'TipShorts' }); // Changed from 'WatchToEarn' to 'TipShorts'
  const handleReferAndEarn = () => navigation.navigate('Main', { screen: 'Referral' }); // This was already correct
  const handleStoryPress = (storyId: string) => console.log('Story pressed:', storyId);
  const handleCategoryPress = (categoryId: string) => { if (selectedCategoryState !== categoryId) setSelectedCategoryState(categoryId); };
  const handleComment = (postId: number) => { setSelectedCommentPostId(postId); setCommentModalVisible(true); };
  const handleCloseCommentModal = () => { setCommentModalVisible(false); setSelectedCommentPostId(null); };
  const handleShare = (postId: number) => console.log('Share post:', postId);
  const handlePostPress = (postId: number) => console.log('Post pressed:', postId);
  const handleUserPress = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  };
  const handleFollow = async (userId: number) => { console.log('Follow user:', userId); };

  const renderListHeader = () => (
    <>
      <StoriesRow stories={stories} onStoryPress={handleStoryPress} onAddStoryPress={handleCreatePost} isLoading={initialLoading && posts.length === 0 && !error} />
      <CategoriesRow categories={staticCategories} selectedCategory={selectedCategoryState} onCategoryPress={handleCategoryPress} isLoading={initialLoading && posts.length === 0 && !error} />
      <EarnCardsRow onWatchAndEarn={handleWatchAndEarn} onReferAndEarn={handleReferAndEarn} isLoading={initialLoading && posts.length === 0 && !error} />
    </>
  );

  const renderPostItem = ({item}: {item: Post}) => (
    <PostItem id={item.id} username={item.user_name} profileImage={getFullImageUrl(item.user_profile_image)}
      postImage={getFullImageUrl(item.media_url)} caption={item.content} likes={item.likeCount}
      comments={item.commentCount} timeAgo={getTimeAgo(item.created_at)} media_type={item.media_type}
      isPremium={item.is_premium} onLike={() => handleLike(item.id)} onComment={() => handleComment(item.id)}
      onShare={() => handleShare(item.id)} onPostPress={() => handlePostPress(item.id)}
      onUserPress={() => handleUserPress(item.user_id)} onFollow={() => handleFollow(item.user_id)}
      isLiked={!!likedPosts[item.id]} userId={item.user_id}
      isVisible={visiblePostIds.includes(item.id)} last_active={item.last_active}
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

  const renderListEmpty = () => {
    if (initialLoading || (loading.posts && !refreshing)) return null; // Show nothing if still in initial/posts loading phase
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-triangle" size={48} color={colors.error} />
          <Text style={[styles.emptyText, {color: colors.text.secondary}]}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.emptyText, {color: colors.primary}]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No posts yet.</Text>
          <Text style={[styles.emptyText, {color: colors.text.tertiary, fontSize: 14}]}>
            Follow some users or check back later!
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderInitialSkeletonView = () => (
    <ScreenTransition animationType="slide">
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Home" showLogo={false} showWallet={true} walletAmount={walletAmount} />
        <ScrollView
          style={[styles.scrollView, {backgroundColor: colors.background}]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.postsContainerStyle, {paddingBottom: contentPaddingBottom}]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          <StoriesRow stories={[]} onStoryPress={() => {}} onAddStoryPress={() => {}} isLoading={true} />
          <CategoriesRow categories={staticCategories} selectedCategory={null} onCategoryPress={() => {}} isLoading={true} />
          <EarnCardsRow onWatchAndEarn={() => {}} onReferAndEarn={() => {}} isLoading={true} />
          {Array(3).fill(0).map((_, index) => <PostItemSkeleton key={`post-skel-${index}`} />)}
        </ScrollView>
      </View>
    </ScreenTransition>
  );

  // For debugging, log the value just before render
  // console.log('ViewabilityConfig before FlatList render:', viewabilityConfig);
  // console.log('Type of viewabilityConfig:', typeof viewabilityConfig);

  if (initialLoading && !refreshing && !error) {
    return renderInitialSkeletonView();
  }

  return (
    <ScreenTransition animationType="slide">
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Home" showLogo={false} showWallet={true} walletAmount={walletAmount} />
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderListEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={21}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          contentContainerStyle={[styles.postsContainerStyle, {paddingBottom: contentPaddingBottom}]}
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          style={[styles.scrollView, {backgroundColor: colors.background}]}
        />
        {commentModalVisible && selectedCommentPostId !== null && (
          <CommentScreen visible={commentModalVisible} postId={selectedCommentPostId} onClose={handleCloseCommentModal} />
        )}
        {showUserProfileModal && selectedUserId && (
          <Modal
            visible={showUserProfileModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowUserProfileModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <View style={{ flex: 1, marginTop: 40, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                <UserProfileScreen userId={selectedUserId} />
                <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }} onPress={() => setShowUserProfileModal(false)}>
                  <Icon name="x" size={28} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ScreenTransition>
  );
};

// Update your styles function to ensure proper background colors
const createHomeScreenStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: colors.background, // Ensure this is set
  },
  scrollView: { 
    flex: 1,
    backgroundColor: colors.background, // Ensure this is set
  },
  storiesSection: { 
    paddingVertical: 12, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background, // Add explicit background
  },
  storiesContainer: { 
    paddingLeft: 16,
    backgroundColor: colors.background, // Add explicit background
  },
  storiesContentContainer: { 
    paddingRight: 16,
  },
  categoriesSection: { 
    paddingVertical: 12, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background, // Add explicit background
  },
  categoriesContainer: { 
    paddingLeft: 16,
    backgroundColor: colors.background, // Add explicit background
  },
  categoriesContentContainer: { 
    paddingRight: 16,
  },
  earnCardsSection: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background, // Add explicit background
  },
  earnCard: {
    width: '100%',
    marginBottom: 12,
  },
  postsContainerStyle: { 
    paddingTop: 0,
    backgroundColor: colors.background, // Add explicit background
  },
  loadingContainer: { 
    flex: 1, 
    padding: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: colors.background, // Add explicit background
  },
  errorContainer: { 
    flex: 1, 
    padding: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: 200,
    backgroundColor: colors.background, // Add explicit background
  },
  emptyContainer: { 
    flex: 1, 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: 200,
    backgroundColor: colors.background, // Add explicit background
  },
  emptyText: { 
    fontSize: 16, 
    marginVertical: 12, 
    textAlign: 'center',
    color: colors.text.secondary, // Ensure text color is theme-aware
  },
  footerLoader: { 
    paddingVertical: 20, 
    alignItems: 'center',
    backgroundColor: colors.background, // Add explicit background
  },
});

export default HomeScreen;
