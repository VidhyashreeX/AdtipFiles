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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useQueries';
import { ProfileFastImage, ContentFastImage } from '../../utils/FastImageOptimizer';
import { createOptimizedFlatListProps, createKeyExtractor } from '../../utils/PerformanceUtils';
import Icon from 'react-native-vector-icons/Feather';
import { API_BASE_URL } from '../../constants/api';

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
  const insets = useSafeAreaInsets();

  // Get userId from props, route params, or current user
  const userId = propUserId || route.params?.userId || user?.id || 56768;

  // Profile data query
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refreshProfile,
  } = useProfile(userId);

  // Mock posts data for now - replace with actual query when available
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

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
      await refreshProfile();
      // Add posts refresh logic here when available
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Handle load more posts
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // Add load more logic here when available
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [hasMore, isLoadingMore]);

  // Handle post press
  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('Comments', { postId });
  }, [navigation]);

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
  const renderPostItem = useCallback(({ item }: { item: Post }) => {
    const imageUrl = item.media_type === 'video' ? item.thumbnail : item.media_url;
    
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => handlePostPress(item.id)}
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
    if (!profileData) return null;

    const profile = (profileData as ProfileData).data;
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
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.posts_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Posts
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.followers_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.following_count || 0}
            </Text>
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
  }, [profileData, userId, user?.id, colors, getFullImageUrl, handleFollow, navigation]);

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
        {renderLoadingSkeleton}
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderError}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                {posts.map((post: Post) => (
                  <View key={post.id} style={styles.postItem}>
                    {renderPostItem({ item: post })}
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
