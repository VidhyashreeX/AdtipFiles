import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Hooks
import { 
  useDynamicUserName,
  useFollowers,
  useFollowings,
  useUserPosts,
  useFollowUserMutation,
  useChannelData,
  useSubscriptionStatus
} from '../../hooks/useQueries';

// Components
import ScreenTransition from '../../components/common/ScreenTransition';
import ProfilePageSkeleton from '../../components/skeletons/ProfilePageSkeleton';

// Constants
import { API_BASE_URL } from '../../constants/api';

interface ProfileParams {
  userId?: number;
}

interface User {
  id: number;
  name: string;
  profile_image?: string;
  banner_image?: string;
  address?: string;
  isFollowing?: boolean;
  followersCount?: number;
}

interface Post {
  id: number;
  content: string;
  media_url?: string | null;
  likeCount: number;
  commentCount: number;
}

interface Follower {
  id: string | number;
  name?: string;
  profile_image?: string | null;
  // Add other properties as needed
}

type NavigationProp = NativeStackNavigationProp<any>;

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const { user: currentUser } = useAuth();
  const { userId: routeUserId } = (route.params as ProfileParams) || {};
  const userId = routeUserId || currentUser?.id;
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const isOwnProfile = !userId || (currentUser && userId === parseInt(String(currentUser.id), 10));

  // UI State
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'about'>('posts');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // TanStack Query hooks for data fetching
  const {
    data: dynamicUserNameData,
    isLoading: userNameLoading,
  } = useDynamicUserName(userId || 0);

  const {
    data: followersData,
    isLoading: followersLoading,
    refetch: refetchFollowers,
    error: followersError,
  } = useFollowers(Number(userId) || 0);

  const {
    data: followingsData,
    isLoading: followingsLoading,
    refetch: refetchFollowings,
    error: followingsError,
  } = useFollowings(Number(userId) || 0);

  const {
    data: userPostsData,
    isLoading: userPostsLoading,
    refetch: refetchUserPosts,
    error: userPostsError,
  } = useUserPosts(Number(userId) || 0, Number(currentUser?.id) || 0);

  const {
    data: channelResponse,
    isLoading: channelLoading,
  } = useChannelData(currentUser?.id || 0);

  const {
    data: premiumResponse,
    isLoading: premiumLoading,
  } = useSubscriptionStatus(currentUser?.id || 0);

  // Follow mutation
  const followUserMutation = useFollowUserMutation();

  // Computed values from TanStack Query data
  const dynamicUserName = useMemo(() => {
    if (!dynamicUserNameData?.data?.data?.name) return null;
    return dynamicUserNameData.data.data.name;
  }, [dynamicUserNameData]);

  const followers = useMemo(() => {
    if (!followersData?.data) return [];
    return Array.isArray(followersData.data) ? followersData.data : [];
  }, [followersData]);

  const followings = useMemo(() => {
    if (!followingsData?.data) return [];
    return Array.isArray(followingsData.data) ? followingsData.data : [];
  }, [followingsData]);

  const posts = useMemo(() => {
    if (!userPostsData?.pages) return [];
    return userPostsData.pages.flatMap(page => page?.data || []);
  }, [userPostsData]);

  const stats = useMemo(() => ({
    followers: followers.length,
    following: followings.length,
    likes: posts.reduce((sum, post) => sum + (post.likeCount || 0), 0),
  }), [followers, followings, posts]);

  const isFollowing = useMemo(() => {
    if (!currentUser || !followersData?.data) return false;
    
    // Adjust this based on your actual data structure
    const followersArray = Array.isArray(followersData.data) ? followersData.data : [];
    
    // Check if the current user is in the followers list
    return followersArray.some((follower: Follower) => {
      const followerId = typeof follower.id === 'string' ? parseInt(follower.id, 10) : follower.id;
      const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      return followerId === currentUserId;
    });
  }, [followersData, currentUser]);

  const isPremium = useMemo(() => {
    return premiumResponse && !premiumResponse.is_premium_expired;
  }, [premiumResponse]);

  // Loading states
  const loading = followersLoading || followingsLoading || userPostsLoading;
  const refreshing = followUserMutation.isPending;

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string => {
    const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';
    if (!url || url === 'null' || url === 'undefined') {
      return DEFAULT_PROFILE_IMAGE;
    }
    if (url.startsWith('http') || url.startsWith('file://') || url.startsWith('content://')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Refresh handler using TanStack Query
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchFollowers(),
      refetchFollowings(),
      refetchUserPosts(),
    ]);
  }, [refetchFollowers, refetchFollowings, refetchUserPosts]);

  // Follow/Unfollow handler with optimistic updates
  const handleFollowToggle = useCallback(async () => {
    if (!currentUser) return;

    try {
      await followUserMutation.mutateAsync({
        followingId: Number(userId),
        followerId: Number(currentUser.id),
        action: isFollowing ? 'unfollow' : 'follow',
      });
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  }, [currentUser, isFollowing, followUserMutation, userId]);

  const handleTabChange = (tab: 'posts' | 'videos' | 'about') => {
    setActiveTab(tab);
  };

  // Error state
  if ((followersError || followingsError || userPostsError) && !loading) {
    return (
      <ScreenTransition>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.primary }]}>
              User not found, or no public posts yet.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={{ color: colors.primary }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    );
  }

  // Loading state
  if (loading && !currentUser) {
    return (
      <ScreenTransition>
        <ProfilePageSkeleton />
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: getFullImageUrl(currentUser?.profile_image) }}
            style={styles.profileImage}
          />
          <Text style={[styles.userName, { color: colors.text.primary }]}>
            {dynamicUserName || currentUser?.name || 'Unknown User'}
          </Text>
          {userNameLoading && <ActivityIndicator size="small" />}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{posts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.followers}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.following}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Following</Text>
          </View>
        </View>

        {/* Follow Button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, { backgroundColor: isFollowing ? colors.border : colors.primary }]}
            onPress={handleFollowToggle}
            disabled={followUserMutation.isPending}
          >
            {followUserMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          {posts.map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postItem}
              onPress={() => {
                setImageViewerIndex(index);
                setShowImageViewer(true);
              }}
            >
              <Image
                source={{ uri: getFullImageUrl(post.media_url) }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  followButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  postItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
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
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default ProfileScreen;
