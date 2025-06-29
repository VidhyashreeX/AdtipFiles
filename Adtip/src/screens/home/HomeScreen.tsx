// src/screens/home/HomeScreen.tsx - Enhanced with bulletproof navigation and data layer
import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';
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
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
// Import Lucide React Native icons
import { PlayCircle, Gamepad2, WifiOff } from 'lucide-react-native';
import CommentsBottomSheet from '../../components/commentsbottomsheet/CommentsBottomSheet';

// Enhanced Contexts & Services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useDataContext} from '../../providers/DataProvider';
import ApiService from '../../services/ApiService';
import {API_BASE_URL} from '../../constants/api';
import { usePosts, useLikeMutation, useFollowMutation, usePrefetchData } from '../../hooks/useQueries';
import { useNetInfo } from '@react-native-community/netinfo';

// Components
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';
import StoryItem from '../../components/home/StoryItem';
import CategoryItem from '../../components/home/CategoryItem';
import EarnCard from '../../components/home/EarnCard';

import ScreenTransition from '../../components/common/ScreenTransition';
import UserProfileScreen from '../profile/UserProfileScreen';

// Skeleton Components
import StoryItemSkeleton from '../../components/skeletons/StoryItemSkeleton';
import CategorySkeleton from '../../components/skeletons/CategoryItemSkeleton';
import EarnCardSkeleton from '../../components/skeletons/EarnCardSkeleton';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';

// Google Ads
import BannerAdComponent from '../../googleads/BannerAdComponent';

// Types
import {AppNavigationProps} from '../../types/navigation';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

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
interface HomeScreenProps { walletBalance?: string; }

// Helper Components
interface StoriesRowProps { 
  stories: Story[]; 
  onStoryPress: (storyId: string) => void; 
  onAddStoryPress: () => void; 
  isLoading?: boolean; 
}

const StoriesRow: React.FC<StoriesRowProps> = ({ stories, onStoryPress, onAddStoryPress, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.storiesSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.storiesContainer} 
          contentContainerStyle={styles.storiesContentContainer}
        >
          <StoryItemSkeleton isAddStory={true} />
          {Array(5).fill(0).map((_, index) => (
            <StoryItemSkeleton key={`story-skel-${index}`} />
          ))}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.storiesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer} contentContainerStyle={styles.storiesContentContainer}>
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
  isLoading?: boolean; 
}

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

interface EarnCardsRowProps { 
  onWatchAndEarn: () => void; 
  onPlayAndEarn: () => void; 
  isLoading?: boolean; 
}

const EarnCardsRow: React.FC<EarnCardsRowProps> = ({ onWatchAndEarn, onPlayAndEarn, isLoading }) => {
  const {colors} = useTheme();
  const styles = createHomeScreenStyles(colors);
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);
  
  // Define earn cards data for carousel - Only show Play & Earn for now
  const earnCardsData = [
    // Watch & Earn is commented out but not removed
    // {
    //   id: '1',
    //   title: 'Watch & Earn',
    //   description: 'Watch videos and earn rewards',
    //   iconName: 'play-circle',
    //   onPress: onWatchAndEarn,
    //   gradientColors: ['#CC0000', '#EE2400', '#FF4D00' ],
    // },
    {
      id: '2',
      title: 'Play & Earn',
      description: 'Play games and earn double rewards',
      iconName: 'gamepad-2',
      onPress: onPlayAndEarn,
      gradientColors: ['#1565C0', '#1976D2', '#0D47A1'],
    },
  ];

  // Since we only have one item now, we don't need infinite scroll
  // Just show the single Play & Earn card
  const renderEarnCard = ({ item, index }: { item: typeof earnCardsData[0], index: number }) => {
    return (
      <TouchableOpacity
        style={styles.earnCardCarouselItem}
        onPress={item.onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earnCardGradient}
        >
          <View style={styles.earnCardContent}>
            <View style={styles.earnCardTextContainer}>
              <Text style={styles.earnCardTitle}>{item.title}</Text>
              <Text style={styles.earnCardDescription}>{item.description}</Text>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']} // Gold gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.earnCardRewardBadge}
              >
                <Text style={styles.earnCardRewardText}>2x Rewards!</Text>
              </LinearGradient>
            </View>
            <View style={styles.earnCardIconContainer}>
              <Gamepad2 size={32} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.earnCardsCarouselSection}>
        <View style={styles.earnCardsCarouselSkeletonContainer}>
          <EarnCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.earnCardsCarouselSection}>
      <FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={earnCardsData}
        renderItem={renderEarnCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        snapToInterval={screenWidth}
        decelerationRate="fast"
        snapToAlignment="start"
        pagingEnabled={false}
        removeClippedSubviews={false}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        contentContainerStyle={{
          paddingHorizontal: 0,
        }}
        ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
      />
    </View>
  );
};

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; 
  }
  return newArray;
}

// MAIN COMPONENT - Enhanced with bulletproof navigation
const HomeScreen: React.FC<HomeScreenProps> = ({walletBalance: hocWalletBalance}) => {
  const {colors, isDarkMode} = useTheme();
  const {user, refreshUserData} = useAuth();
  const navigation = useNavigation<AppNavigationProps>();
  const {contentPaddingBottom} = useTabNavigator();
  const {clearCache, invalidateData} = useDataContext();
  const queryClient = useQueryClient();
  const styles = createHomeScreenStyles(colors);

  // UI state management (never blocks navigation)
  const [selectedCategoryState, setSelectedCategoryState] = useState<string>('0');
  const [staticCategories] = useState<Category[]>([
    {id: '0', name: 'All'}, {id: '1', name: 'Recent'}, {id: '2', name: 'Popular'}, {id: '3', name: 'Following'},
    {id: '4', name: 'Technology'}, {id: '5', name: 'Fashion'}, {id: '6', name: 'Business'}, {id: '7', name: 'Sports'},
  ]);
  const [walletAmount] = useState(hocWalletBalance || '0.00');
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Enhanced data layer using React Query v5 hooks
  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage: postsLoadingMore,
    error: postsError,
    refetch: refreshPosts,
    fetchNextPage: loadMorePosts,
    hasNextPage: hasMorePosts,
  } = usePosts(
    selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0,
    user?.id
  );

  // Fetch data whenever the screen comes into focus by invalidating and forcing refetch
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused. Invalidating and refetching posts.');
      // Invalidate and force refetch
      queryClient.invalidateQueries({ 
        queryKey: ['posts', selectedCategoryState ? parseInt(selectedCategoryState, 10) : 0, user?.id],
        refetchType: 'active' // Force active queries to refetch
      });
    }, [queryClient, selectedCategoryState, user?.id])
  );

  // Transform posts data for compatibility
  const posts = useMemo(() => {
    return postsData?.pages?.flatMap(page => page?.data || []) || [];
  }, [postsData]);

  // Like and Follow mutations
  const likeMutation = useLikeMutation();
  const followMutation = useFollowMutation();

  // Prefetch data for better performance
  const { prefetchPosts, prefetchProfile } = usePrefetchData();

  // Network state for offline handling
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected;

  // Static data for now - can be enhanced later with API calls
  const categories = staticCategories;
  const stories: Story[] = [];

  // Optimistic mutations for instant UI feedback (now using the new hooks)
  const handleLikePost = useCallback((postId: number, isLiked: boolean) => {
    if (!user?.id) {
      console.warn('Cannot like post: User not logged in');
      return;
    }
    likeMutation.mutate({ postId, userId: user.id, isLiked });
  }, [likeMutation, user?.id]);

  const handleFollowUser = useCallback((userId: number, isFollowing: boolean) => {
    followMutation.mutate({ userId, isFollowing });
  }, [followMutation]);

  // Use categories from API or fallback to static ones
  const displayCategories = categories || staticCategories;
  const displayStories = stories || [];
  const displayPosts = posts || [];

  // Derived state for UI
  const initialLoading = postsLoading && displayPosts.length === 0;
  const isRefreshing = false; // Managed by data layer

  // Instant event handlers - never block navigation
  const getFullImageUrl = useCallback((url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  const getTimeAgo = useCallback((timestamp: string) => {
    const now = new Date(); 
    const postTime = new Date(timestamp);
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

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategoryState(categoryId);
    // Clear cache to force refresh with new category
    clearCache(`home-posts-${user?.id || 0}`);
  }, [user?.id, clearCache]);

  const handleStoryPress = useCallback((storyId: string) => {
    console.log('Story pressed:', storyId);
    // Navigate instantly without waiting for data
    // navigation.navigate('StoryViewer', { storyId });
  }, []);

  const handleAddStoryPress = useCallback(() => {
    console.log('Add story pressed');
    // Navigate instantly
    // navigation.navigate('StoryCreator');
  }, []);

  const handleWatchAndEarn = useCallback(() => {
    console.log('Watch and earn pressed');
    navigation.navigate('TipTube' as never);
  }, [navigation]);

  const handlePlayAndEarn = useCallback(() => {
    console.log('Play and earn pressed');
    navigation.navigate('PlayToEarn' as never);
  }, [navigation]);

  const handlePostLike = useCallback((postId: number) => {
    // Find current like state and optimistically update
    const post = displayPosts.find(p => p.id === postId);
    if (post) {
      handleLikePost(postId, post.is_liked || false);
    }
  }, [handleLikePost, displayPosts]);

  const handleUserFollow = useCallback(async (userId: number) => {
    // Find current follow state and optimistically update
    const post = displayPosts.find(p => p.user_id === userId);
    if (post) {
      // Assume not following if not specified
      handleFollowUser(userId, false);
    }
  }, [handleFollowUser, displayPosts]);

  const handleCommentPress = useCallback((postId: number) => {
    setSelectedCommentPostId(postId);
    setCommentModalVisible(true);
  }, []);

  const handleUserProfilePress = useCallback((userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMorePosts && !postsLoadingMore) {
      loadMorePosts();
    }
  }, [hasMorePosts, postsLoadingMore, loadMorePosts]);

  // Optimized viewability config
  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  }), []);

  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const currentVisibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id as number);
    setVisiblePostIds(currentVisibleIds);
  }, []);

  // Render post item with enhanced data handling
  const renderPostItem = useCallback(({ item, index }: { item: Post; index: number }) => {
    const isVisible = visiblePostIds.includes(item.id);
    
    return (
      <>
        {/* Sticky banner ad above first post */}
        {index === 0 && (
          <View style={styles.stickyBannerContainer}>
            <BannerAdComponent />
          </View>
        )}
        
        <PostItem
          key={`post-${item.id}-${index}`}
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
          isLiked={item.is_liked}
          userId={item.user_id}
          isVisible={isVisible}
          last_active={item.last_active}
          onLike={handlePostLike}
          onComment={handleCommentPress}
          onShare={(postId: number) => console.log('Share post:', postId)}
          onPostPress={(postId: number) => console.log('Post pressed:', postId)}
          onUserPress={handleUserProfilePress}
          onFollow={handleUserFollow}
        />
        
        {/* Banner ad every 3 posts */}
        {(index + 1) % 3 === 0 && (
          <View style={styles.adSpacingContainer}>
            <BannerAdComponent />
          </View>
        )}
      </>
    );
  }, [visiblePostIds, handlePostLike, handleCommentPress, handleUserProfilePress, handleUserFollow, getTimeAgo]);

  // Header component that scrolls with the list
  const renderScrollableHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <StoriesRow 
        stories={displayStories}
        onStoryPress={handleStoryPress}
        onAddStoryPress={handleAddStoryPress}
        isLoading={initialLoading}
      />
      
      <CategoriesRow 
        categories={displayCategories}
        selectedCategory={selectedCategoryState}
        onCategoryPress={handleCategoryPress}
        isLoading={initialLoading}
      />
      
      <EarnCardsRow 
        onWatchAndEarn={handleWatchAndEarn}
        onPlayAndEarn={handlePlayAndEarn}
        isLoading={initialLoading}
      />
    </View>
  ), [
    styles.headerContainer, 
    displayStories, 
    handleStoryPress, 
    handleAddStoryPress, 
    initialLoading, 
    displayCategories, 
    selectedCategoryState, 
    handleCategoryPress, 
    handleWatchAndEarn, 
    handlePlayAndEarn
  ]);

  // Footer component
  const renderFooter = useCallback(() => {
    if (postsLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Loading more posts...
          </Text>
        </View>
      );
    }
    
    if (!hasMorePosts && displayPosts.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            You've reached the end!
          </Text>
        </View>
      );
    }
    
    return null;
  }, [postsLoadingMore, hasMorePosts, displayPosts.length, colors.primary, colors.textSecondary, styles.footerLoader, styles.footerText, styles.footerEnd]);

  // Main render with enhanced error handling
  if (postsError && displayPosts.length === 0) {
    return (
      <ScreenTransition>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <WifiOff size={48} color={colors.textSecondary} />
            <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
              {isOnline ? 'Something went wrong' : 'You\'re offline'}
            </Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              {isOnline ? 'Failed to load posts. Please try again.' : 'Posts will load when you\'re back online.'}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    );
  }

  // Loading state with skeletons
  if (initialLoading) {
    return (
      <ScreenTransition>
        <View style={styles.container}>
          <View style={styles.skeletonContainer}>
            {Array(3).fill(0).map((_, index) => (
              <PostItemSkeleton key={`skeleton-${index}`} />
            ))}
          </View>
        </View>
      </ScreenTransition>
    );
  }

  // Main content
  return (
    <ScreenTransition>
      <View style={styles.container}>
        <Header 
          title="Home" 
          showWallet={true}
          walletAmount={walletAmount}
          showSearch={true}
        />
        <FlatList
          data={displayPosts}
          renderItem={renderPostItem}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          ListHeaderComponent={renderScrollableHeader}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          getItemLayout={undefined} // Let FlatList calculate
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: contentPaddingBottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Comments Bottom Sheet */}
        {selectedCommentPostId && (
          <CommentsBottomSheet
            visible={commentModalVisible}
            postId={selectedCommentPostId}
            onClose={() => setCommentModalVisible(false)}
            initialCommentCount={
              displayPosts.find(post => post.id === selectedCommentPostId)?.commentCount || 0
            }
          />
        )}

        {/* User Profile Modal */}
        <Modal
          visible={showUserProfileModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowUserProfileModal(false)}
        >
          {selectedUserId && (
            <UserProfileScreen userId={selectedUserId} />
          )}
        </Modal>
      </View>
    </ScreenTransition>
  );
};

// Styles
const createHomeScreenStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: colors.background,
  },
  stickyBannerContainer: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  adSpacingContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderBottomColor: colors.border,
  },
  storiesSection: {
    paddingVertical: 16,
  },
  storiesContainer: {
    paddingHorizontal: 16,
  },
  storiesContentContainer: {
    gap: 12,
  },
  categoriesSection: {
    paddingVertical: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoriesContentContainer: {
    gap: 8,
  },
  earnCardsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  earnCard: {
    flex: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  footerEnd: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  earnCardsCarouselSkeletonContainer: {
    paddingHorizontal: 8,
  },
  earnCardsCarouselSection: {
    paddingVertical: 16,
  },
  earnCardsCarouselContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  earnCardCarouselItem: {
    width: screenWidth - 16, // Full width minus minimal padding
    height: 120,
    borderRadius: 16,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  earnCardGradient: {
    flex: 1,
    borderRadius: 16,
  },
  earnCardContent: {
    padding: 20,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnCardTextContainer: {
    flex: 1,
  },
  earnCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  earnCardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  earnCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnCardRewardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#B8860B', // Dark gold border
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  earnCardRewardText: {
    color: '#000000', // Black text for better contrast
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.3)', // Light shadow for depth
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default HomeScreen;
