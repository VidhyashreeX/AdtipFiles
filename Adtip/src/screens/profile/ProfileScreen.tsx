import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useQueries';
import { useUserDataContext } from '../../contexts/UserDataContext';
import { getUserDisplayName } from '../../utils/userDataUtils';
import Header from '../../components/common/Header';
import Icon from 'react-native-vector-icons/Feather';
import ApiService from '../../services/ApiService';
import { ProfileFastImage, ContentFastImage } from '../../utils/FastImageOptimizer';
import { API_BASE_URL } from '../../constants/api';

// Helper function to normalize profile data between old and new API formats
const normalizeProfileData = (data: any, socialStats?: any) => {
  if (!data) return null;

  // If it's comprehensive user data (new API), map to old format
  if (data.emailId && data.mobile_number) {
    return {
      id: data.id,
      username: data.username || data.name,
      display_name: getUserDisplayName(data),
      name: data.name,
      bio: data.bio,
      profile_image: data.profile_image,
      posts_count: socialStats?.posts_count || 0,
      followers_count: socialStats?.followers_count || 0,
      following_count: socialStats?.following_count || 0,
      is_premium: data.is_premium,
      premium_expires_at: data.premium_expires_at,
      // Add other fields as needed
    };
  }

  // If it's old API format, return as is but merge with social stats if available
  return {
    ...data,
    posts_count: socialStats?.posts_count || data.posts_count || 0,
    followers_count: socialStats?.followers_count || data.followers_count || 0,
    following_count: socialStats?.following_count || data.following_count || 0,
  };
};

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  userId?: number;
}

interface Post {
  id: number;
  media_url?: string;
  thumbnail?: string;
  media_type?: string;
}

interface ProfileData {
  data: {
    username: string;
    display_name?: string;
    bio?: string;
    profile_image?: string;
    posts_count?: number;
    followers_count?: number;
    following_count?: number;
  };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId: propUserId }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Get userId from props, route params, or current user
  const userId = propUserId || route.params?.userId || user?.id || 56768;
  const isOwnProfile = userId === user?.id;

  // Enhanced profile data query - now uses comprehensive user data API for all users
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refreshProfile,
  } = useProfile(userId);

  // For current user, also get data from context for real-time updates
  const { userData: contextUserData, refetch: refetchUserData } = useUserDataContext();

  // Use context data for current user if available, otherwise use profile query data
  const currentProfileData = isOwnProfile && contextUserData ? contextUserData : profileData;

  // Separate state for social stats (followers, following, posts)
  const [socialStats, setSocialStats] = useState({
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
  });
  const [socialStatsLoading, setSocialStatsLoading] = useState(false);

  // Fetch social stats separately since they're not in the main user data API
  const fetchSocialStats = useCallback(async () => {
    if (!userId) return;

    setSocialStatsLoading(true);
    try {
      // Use actual API calls for social stats
      const [followersRes, followingRes, postsRes] = await Promise.allSettled([
        ApiService.getUserFollowers(userId),
        ApiService.getUserFollowings(userId),
        ApiService.getUserPosts(userId, 1, 1, user?.id || 0), // Get first page to count total
      ]);

      // Extract counts from API responses
      const followersCount = followersRes.status === 'fulfilled' && followersRes.value?.data
        ? Array.isArray(followersRes.value.data) ? followersRes.value.data.length : followersRes.value.total || 0
        : 0;

      const followingCount = followingRes.status === 'fulfilled' && followingRes.value?.data
        ? Array.isArray(followingRes.value.data) ? followingRes.value.data.length : followingRes.value.total || 0
        : 0;

      const postsCount = postsRes.status === 'fulfilled' && postsRes.value?.data
        ? postsRes.value.total || (Array.isArray(postsRes.value.data) ? postsRes.value.data.length : 0)
        : 0;

      setSocialStats({
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount,
      });

      console.log('[ProfileScreen] Social stats fetched:', {
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
      });
    } catch (error) {
      console.error('Failed to fetch social stats:', error);
      // Keep default values on error
      setSocialStats({
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      });
    } finally {
      setSocialStatsLoading(false);
    }
  }, [userId, user?.id]);

  // Fetch social stats when userId changes
  useEffect(() => {
    fetchSocialStats();
  }, [fetchSocialStats]);

  // Mock posts data for now - replace with actual query when available
  const [posts] = useState<Post[]>([]);
  const [postsLoading] = useState(false);
  const [isLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'saved'>('posts');

  // Helper function for full image URLs
  const getFullImageUrl = useCallback((url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh profile data
      await refreshProfile();

      // If it's the current user's profile, also refresh the user data context
      if (isOwnProfile) {
        await refetchUserData();
      }

      // Refresh social stats
      await fetchSocialStats();

      // Add posts refresh logic here when available
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile, refetchUserData, isOwnProfile, fetchSocialStats]);

  // Handle load more posts
  const handleLoadMore = useCallback(() => {
    // Add load more logic here when available
    console.log('Load more posts requested');
  }, []);

  // Handle post press - navigate to PostViewer
  const handlePostPress = useCallback((postIndex: number) => {
    navigation.navigate('PostViewer', {
      posts: posts,
      initialIndex: postIndex,
      userId: userId,
    });
  }, [navigation, posts, userId]);

  // Handle user press
  const handleUserPress = useCallback((userId: number) => {
    if (userId !== user?.id) {
      navigation.navigate('Profile', { userId });
    }
  }, [navigation, user?.id]);

  // Handle follow
  const handleFollow = useCallback(async (userId: number) => {
    try {
      // Implement follow logic here
      console.log('Follow user:', userId);
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  }, []);

  // Handle like
  const handleLike = useCallback((postId: number) => {
    // Implement like logic here
    console.log('Like post:', postId);
  }, []);

  // Handle comment
  const handleComment = useCallback((postId: number) => {
    navigation.navigate('Comments', { postId });
  }, [navigation]);

  // Handle share
  const handleShare = useCallback((postId: number) => {
    // Implement share logic here
    console.log('Share post:', postId);
  }, []);

  // Render post item
  const renderPostItem = useCallback(({ item, index }: { item: Post; index: number }) => {
    const imageUrl = item.media_type === 'video' ? item.thumbnail : item.media_url;

    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => handlePostPress(index)}
        activeOpacity={0.8}
      >
        <ContentFastImage
          source={getFullImageUrl(imageUrl)}
          style={styles.postImage}
        />
        {item.media_type === 'video' && (
          <View style={styles.videoIndicator}>
            <Icon name="play" size={16} color="#fff" />
          </View>
        )}
        {item.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>★</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handlePostPress, getFullImageUrl]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Post) => item.id.toString(), []);

  // Loading skeleton
  const renderLoadingSkeleton = useMemo(() => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
        Loading profile...
      </Text>
    </View>
  ), [colors]);

  // Error component
  const renderError = useMemo(() => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={48} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.text.secondary }]}>
        Failed to load profile
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.white }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  ), [colors, handleRefresh]);

  // Profile header component
  const renderProfileHeader = useMemo(() => {
    if (!currentProfileData) return null;

    // Handle both old API format (with .data) and new comprehensive format (direct)
    const rawProfile = currentProfileData.hasOwnProperty('data')
      ? (currentProfileData as ProfileData).data
      : currentProfileData;

    // Normalize the profile data to ensure compatibility and include social stats
    const profile = normalizeProfileData(rawProfile, socialStats);
    if (!profile) return null;

    const isOwnProfile = userId === user?.id;

    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <ProfileFastImage
            source={getFullImageUrl(profile.profile_image)}
            size={80}
            style={styles.profileImage}
          />
          <View style={styles.profileDetails}>
            <Text style={[styles.username, { color: colors.text.primary }]}>
              {profile.username}
            </Text>
            <Text style={[styles.displayName, { color: colors.text.secondary }]}>
              {profile.display_name || profile.username}
            </Text>
            {profile.bio && (
              <Text style={[styles.bio, { color: colors.text.secondary }]}>
                {profile.bio}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            {socialStatsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {profile.posts_count || 0}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Posts
            </Text>
          </View>
          <View style={styles.statItem}>
            {socialStatsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {profile.followers_count || 0}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            {socialStatsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {profile.following_count || 0}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Following
            </Text>
          </View>
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, { backgroundColor: colors.primary }]}
            onPress={() => handleFollow(userId)}
          >
            <Text style={[styles.followButtonText, { color: colors.white }]}>
              Follow
            </Text>
          </TouchableOpacity>
        )}

        {isOwnProfile && (
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.editButtonText, { color: colors.text.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [currentProfileData, socialStats, socialStatsLoading, userId, user?.id, colors, getFullImageUrl, handleFollow, navigation]);

  // Tab navigation
  const renderTabNavigation = useMemo(() => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'posts' && { borderBottomColor: colors.primary }
        ]}
        onPress={() => setSelectedTab('posts')}
      >
        <Icon 
          name="grid" 
          size={24} 
          color={selectedTab === 'posts' ? colors.primary : colors.text.secondary} 
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'saved' && { borderBottomColor: colors.primary }
        ]}
        onPress={() => setSelectedTab('saved')}
      >
        <Icon 
          name="bookmark" 
          size={24} 
          color={selectedTab === 'saved' ? colors.primary : colors.text.secondary} 
        />
      </TouchableOpacity>
    </View>
  ), [selectedTab, colors]);

  if (profileLoading && !profileData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={isOwnProfile ? "My Profile" : "Profile"}
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
        {renderLoadingSkeleton}
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={isOwnProfile ? "My Profile" : "Profile"}
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
        {renderError}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <Header
        title={isOwnProfile ? "My Profile" : "Profile"}
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
        {renderProfileHeader}
        {renderTabNavigation}
        
        {selectedTab === 'posts' && (
          <View style={styles.postsContainer}>
            {postsLoading && posts.length === 0 ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((post: Post, index: number) => (
                  <View key={post.id} style={styles.postItem}>
                    {renderPostItem({ item: post, index })}
                  </View>
                ))}
              </View>
            )}
            {isLoadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
        )}

        {selectedTab === 'saved' && (
          <View style={styles.savedContainer}>
            <Text style={[styles.savedText, { color: colors.text.secondary }]}>
              Saved posts will appear here
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    padding: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImage: {
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  postsContainer: {
    flex: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postItem: {
    width: width / 3,
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  savedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  savedText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default React.memo(ProfileScreen);
