import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Share,
  Alert,
  Modal,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';
import { useLikeMutation, useFollowMutation } from '../../hooks/useQueries';
import { getTimeAgo } from '../../utils/timeUtils';
import PostWithComments from '../../components/home/PostWithComments';
import UserProfileScreen from './UserProfileScreen';

const { width } = Dimensions.get('window');

interface PostViewerScreenProps {}

const PostViewerScreen: React.FC<PostViewerScreenProps> = () => {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { posts: initialPosts = [], initialIndex = 0, userId, postId } = route.params || {};

  // State
  const [posts, setPosts] = useState(initialPosts); // Local state for posts to handle optimistic updates
  const [isLoadingSinglePost, setIsLoadingSinglePost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<number | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState<number[]>([]);
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  // Removed modal states - now using direct navigation to Profile screen

  // Update local posts when route params change
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Fetch single post if only postId is provided (deep link scenario)
  useEffect(() => {
    const fetchSinglePost = async () => {
      if (postId && (!initialPosts || initialPosts.length === 0)) {
        setIsLoadingSinglePost(true);
        try {
          // Use the new single post API endpoint
          const response = await fetch(`https://adtip.in/api/post/${postId}?loggined_user_id=${currentUser?.id || 0}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status && data.data && data.data.length > 0) {
              setPosts(data.data);
            } else {
              // Post not found, show error
              Alert.alert('Post Not Found', 'The post you are looking for could not be found.');
              navigation.goBack();
            }
          } else {
            throw new Error('Failed to fetch post');
          }
        } catch (error) {
          console.error('Error fetching single post:', error);
          Alert.alert('Error', 'Failed to load the post. Please try again.');
          navigation.goBack();
        } finally {
          setIsLoadingSinglePost(false);
        }
      }
    };

    fetchSinglePost();
  }, [postId, initialPosts, currentUser, navigation]);

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Mutations
  const likeMutation = useLikeMutation();
  const followMutation = useFollowMutation();

  // Scroll to initial post
  useEffect(() => {
    if (flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false
        });
      }, 100);
    }
  }, [initialIndex]);

  // Handle screen focus/blur to pause videos when screen is not active
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Optimized viewability config for video playback control
  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  }), []);

  // Handle viewable items changed for video playback control
  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    const currentVisibleIds = viewableItems
      .filter(item => item.isViewable && item.item)
      .map(viewToken => viewToken.item.id as number);
    setVisiblePostIds(currentVisibleIds);
  }, []);

  // Handle global mute toggle
  const handleToggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);



  // Helper function to show login prompt for guest users
  const showLoginPromptForAction = useCallback((action: string) => {
    Alert.alert('Login Required', `Please login to ${action}`);
  }, []);

  // Handle like with proper API call and local state update
  const handleLikePost = useCallback((postId: number, isLiked: boolean) => {
    if (!currentUser?.id) {
      showLoginPromptForAction('like posts');
      return;
    }

    // Optimistically update local state immediately
    setPosts((prevPosts: any[]) =>
      prevPosts.map((post: any) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !isLiked,
              likeCount: post.likeCount + (isLiked ? -1 : 1)
            }
          : post
      )
    );

    // Then call the mutation
    likeMutation.mutate({ postId, userId: currentUser.id, isLiked });
  }, [likeMutation, currentUser?.id, showLoginPromptForAction]);

  // Handle like (wrapper for PostItem)
  const handleLike = useCallback((postId: number) => {
    // Find current like state and pass it to the mutation
    const post = posts.find((p: any) => p.id === postId);
    if (post) {
      handleLikePost(postId, post.is_liked || false);
    }
  }, [handleLikePost, posts]);

  // Handle comment (matching HomeScreen)
  const handleComment = useCallback((postId: number) => {
    if (!currentUser?.id) {
      showLoginPromptForAction('comment on posts');
      return;
    }
    setSelectedCommentPostId(postId);
    setCommentModalVisible(true);
  }, [currentUser?.id, showLoginPromptForAction]);

  // Handle share (matching HomeScreen)
  const handleShare = useCallback(async (postId: number) => {
    if (!currentUser?.id) {
      showLoginPromptForAction('share posts');
      return;
    }
    try {
      const deepLink = `https://adtip.in/tiptube?videoId=${postId}`;
      await Share.share({ message: `Check out this video: ${deepLink}` });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [currentUser?.id, showLoginPromptForAction]);



  // Handle follow user (matching HomeScreen)
  const handleFollowUser = useCallback((userId: number, isFollowing: boolean) => {
    if (!currentUser?.id) {
      showLoginPromptForAction('follow users');
      return;
    }
    followMutation.mutate({ userId, isFollowing });
  }, [followMutation, currentUser?.id, showLoginPromptForAction]);

  // Handle user follow (wrapper for PostItem)
  const handleUserFollowWrapper = useCallback(async (userId: number) => {
    // Find current follow state and optimistically update
    const post = posts.find((p: any) => p.user_id === userId);
    if (post) {
      // Assume not following if not specified
      handleFollowUser(userId, false);
    }
  }, [handleFollowUser, posts]);

  // Handle user profile press (matching HomeScreen)
  const handleUserProfilePress = useCallback((userId: number) => {
    if (!currentUser?.id) {
      showLoginPromptForAction('view user profiles');
      return;
    }
    // Navigate directly to Profile screen instead of using modal
    (navigation as any).navigate('Profile', { userId });
  }, [currentUser?.id, showLoginPromptForAction, navigation]);

  // Get time ago helper
  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }, []);

  // Render post item using PostItem component with proper visibility tracking
  const renderPostItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // Determine if this post is visible and screen is focused
    const isVisible = visiblePostIds.includes(item.id) && isScreenFocused;

    return (
      <PostItem
        key={`post-${item.id}-${index}`}
        id={item.id}
        username={item.user_name ? String(item.user_name) : "Unknown"}
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
        isGloballyMuted={isGloballyMuted}
        onToggleGlobalMute={handleToggleGlobalMute}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onPostPress={(postId: number) => console.log('Post pressed:', postId)}
        onUserPress={handleUserProfilePress}
        onFollow={handleUserFollowWrapper}
      />
    );
  }, [visiblePostIds, isScreenFocused, isGloballyMuted, getTimeAgo, handleLike, handleComment, handleShare, handleUserProfilePress, handleUserFollowWrapper, handleToggleGlobalMute]);



  if (isLoadingSinglePost) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Loading Post..."
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 8 }}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.primary }]}>
            Loading post...
          </Text>
        </View>
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Posts"
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 8 }}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.primary }]}>
            No posts to display
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Posts"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item, index) => `post-${item.id}-${index}`}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        initialScrollIndex={initialIndex}
        getItemLayout={(_data, index) => ({
          length: 600, // Approximate height of a post
          offset: 600 * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />

      {/* Comments Modal */}
      {selectedCommentPostId && (
        <PostWithComments
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedCommentPostId(null);
          }}
          postId={selectedCommentPostId}
          userId={currentUser?.id ? Number(currentUser.id) : 0}
          //@ts-ignore
          initialCommentCount={
            posts.find((post: any) => post.id === selectedCommentPostId)?.commentCount || 0
          }
        />
      )}

      {/* Removed User Profile Modal - now using direct navigation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PostViewerScreen;
