import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Grid, Bookmark, MoreHorizontal, Settings } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useQueries';
import { API_BASE_URL } from '../../constants/api';
import { ProfileFastImage } from '../../utils/FastImageOptimizer';
import Header from '../../components/common/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_SIZE = (SCREEN_WIDTH - 6) / 3; // 3 posts per row with 2px gaps

interface InstagramProfileScreenProps {
  userId?: number;
}

const InstagramProfileScreen: React.FC<InstagramProfileScreenProps> = ({ userId: propUserId }) => {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Get userId from props, route params, or current user
  const userId = propUserId || route.params?.userId || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  // State
  const [selectedTab, setSelectedTab] = useState<'posts' | 'saved'>('posts');
  const [refreshing, setRefreshing] = useState(false);

  // Helper function for full image URLs
  const getFullImageUrl = useCallback((url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://avatar.iran.liara.run/public';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  }, []);

  // Profile data query
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refreshProfile,
  } = useProfile(userId);

  const profile = profileData?.user;
  const posts = profileData?.posts || [];
  const postsCount = profileData?.postsCount || 0;
  const followersCount = profileData?.followersCount || 0;
  const followingCount = profileData?.followingCount || 0;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Handle post press - navigate to PostViewer
  const handlePostPress = useCallback((postIndex: number) => {
    navigation.navigate('PostViewer', {
      posts: posts,
      initialIndex: postIndex,
      userId: userId,
    });
  }, [navigation, posts, userId]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Handle settings press
  const handleSettingsPress = useCallback(() => {
    if (isOwnProfile) {
      navigation.navigate('Settings');
    }
  }, [navigation, isOwnProfile]);

  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  // Handle follow/unfollow
  const handleFollowPress = useCallback(() => {
    // TODO: Implement follow/unfollow logic
    console.log('Follow/Unfollow pressed');
  }, []);

  // Render post grid item
  const renderPostItem = useCallback((post: any, index: number) => {
    const imageUrl = post.media_type === 'video' ? post.thumbnail : post.media_url;
    
    return (
      <TouchableOpacity
        key={post.id}
        style={styles.postItem}
        onPress={() => handlePostPress(index)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: getFullImageUrl(imageUrl) }}
          style={styles.postImage}
          resizeMode="cover"
        />
        {post.media_type === 'video' && (
          <View style={styles.videoIndicator}>
            <View style={styles.playIcon} />
          </View>
        )}
        {post.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>★</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handlePostPress]);

  if (profileLoading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Header
        title={profile?.username || profile?.name || 'Profile'}
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          isOwnProfile ? (
            <TouchableOpacity onPress={handleSettingsPress} style={styles.headerButton}>
              <Settings size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerButton}>
              <MoreHorizontal size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )
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
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Profile Image and Stats */}
          <View style={styles.profileTopSection}>
            <ProfileFastImage
              source={getFullImageUrl(profile?.profile_image)}
              size={90}
              style={styles.profileImage}
            />
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                  {postsCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Posts
                </Text>
              </View>
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                  {followersCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Followers
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                  {followingCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Following
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={[styles.displayName, { color: colors.text.primary }]}>
              {profile?.name || profile?.username || 'User'}
            </Text>
            {profile?.bio && (
              <Text style={[styles.bio, { color: colors.text.secondary }]}>
                {profile.bio}
              </Text>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.actionButtonContainer}>
            {isOwnProfile ? (
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={handleEditProfile}
              >
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleFollowPress}
              >
                <Text style={[styles.actionButtonText, { color: colors.white }]}>
                  Follow
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'posts' && { borderBottomColor: colors.text.primary }
            ]}
            onPress={() => setSelectedTab('posts')}
          >
            <Grid 
              size={24} 
              color={selectedTab === 'posts' ? colors.text.primary : colors.text.secondary} 
            />
          </TouchableOpacity>
          
          {isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'saved' && { borderBottomColor: colors.text.primary }
              ]}
              onPress={() => setSelectedTab('saved')}
            >
              <Bookmark 
                size={24} 
                color={selectedTab === 'saved' ? colors.text.primary : colors.text.secondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsGrid}>
          {posts.map((post: any, index: number) => renderPostItem(post, index))}
        </View>

        {posts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Grid size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No posts yet
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    marginRight: 24,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  profileInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionButtonContainer: {
    marginBottom: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    padding: 1,
  },
  postItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  playIcon: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default InstagramProfileScreen;
