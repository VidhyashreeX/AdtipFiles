import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import ImageViewer from '@react-native-oh-tpl/react-native-image-zoom-viewer';

// Components
import Header from '../../components/common/Header';
import LastSeen from '../../components/common/LastSeen';
import ProfilePageSkeleton from '../../components/skeletons/ProfilePageSkeleton';
import ScreenTransition from '../../components/common/ScreenTransition';
import CommentScreen from '../home/CommentScreen';
import RectangleAdComponent from '../../googleads/RectangleAdComponent';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import ApiService from '../../services/ApiService';

// Define navigation param list
type RootStackParamList = {
  EditProfile: undefined;
  Settings: undefined;
  CreateChannel: undefined;
  FollowersList: { userId?: number };
  FollowingsList: { userId?: number };
  PostDetail: { postId: number };
  TipShorts: undefined;
  Channel: { channelId: string };
  Analytics: { channelId: string };
  Earnings: undefined;
  Packages: undefined; // Ensure this matches the target route name
  ChoosePackages: undefined; // Keep if other parts of ProfileScreen might use it, or remove if not
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define profile params type
interface ProfileParams {
  userId?: number;
}

// Define user type
interface User {
  id: string | number;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  bio?: string | null;
  address?: string;
  location?: string;
  profile_image?: string | null;
  last_active?: string | null;
  is_online?: boolean;
}

// Define post type
interface Post {
  id: number;
  user_profile_image?: string | null;
  media_url?: string | null;
  likeCount: number;
  commentCount: number;
}

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const { userId } = (route.params as ProfileParams) || {};
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  // Add a try/catch block to handle missing context
  let contentPaddingBottom = 0;
  try {
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    contentPaddingBottom = 80; // Default padding
  }

  const { user: currentUser, logout } = useAuth();
  const isOwnProfile = !userId || (currentUser && userId === parseInt(String(currentUser.id), 10));

  // State
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followings, setFollowings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'about'>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    likes: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullMenu, setShowFullMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isCommentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [userChannelId, setUserChannelId] = useState<string | null>(null);

  // Default profile image
  const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return DEFAULT_PROFILE_IMAGE;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch user data, followers, followings, and posts
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      let userData: User | null = null;
      let userApiFailed = false;

      if (isOwnProfile && currentUser) {
        userData = currentUser;
      } else {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          userApiFailed = true;
        } else {
          const result = await response.json();
          if (result.success && result.data) {
            userData = result.data;
          } else {
            userApiFailed = true;
          }
        }
      }

      // If user API failed, try to get user info from posts API
      if (!userData && userApiFailed) {
        const postsResponse = await fetch(
          `${API_BASE_URL}/api/users/${userId}/posts?page=1&limit=1&loggined_user_id=${currentUser?.id}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (postsResponse.ok) {
          const postsResult = await postsResponse.json();
          if (postsResult?.data && postsResult.data.length > 0) {
            const firstPost = postsResult.data[0];
            userData = {
              id: firstPost.user_id,
              name: firstPost.name,
              profile_image: firstPost.user_profile_image,
              address: firstPost.address,
            };
          }
        }
      }

      setUser(userData);

      // Fetch user's channel ID if this is their own profile
      if (isOwnProfile && currentUser?.id) {
        try {
          const channelResponse = await ApiService.getChannelByUserId(Number(currentUser.id));
          if (channelResponse.status === 200 && channelResponse.data && channelResponse.data.length > 0) {
            setUserChannelId(String(channelResponse.data[0].channelId));
          }
        } catch (error) {
          console.log('No channel found for user');
        }
      }

      let fetchedFollowers: any[] = [];
      let fetchedFollowings: any[] = [];

      // Fetch followers
      const followersResponse = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (followersResponse.ok) {
        const followersResult = await followersResponse.json();
        if (followersResult.status && followersResult.data) {
          fetchedFollowers = followersResult.data.map((follower: any) => ({
            ...follower,
            profile_image: getFullImageUrl(follower.profile_image),
          }));
          setFollowers(fetchedFollowers);
        } else {
          setFollowers([]);
        }
      } else {
        setFollowers([]);
      }

      // Fetch followings
      const followingsResponse = await fetch(`${API_BASE_URL}/api/follow/followings/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (followingsResponse.ok) {
        const followingsResult = await followingsResponse.json();
        if (followingsResult.status && followingsResult.data) {
          fetchedFollowings = followingsResult.data.map((following: any) => ({
            ...following,
            profile_image: getFullImageUrl(following.profile_image),
          }));
          setFollowings(fetchedFollowings);
        } else {
          setFollowings([]);
        }
      } else {
        setFollowings([]);
      }

      // Update stats with correct counts
      setStats({
        followers: fetchedFollowers.length,
        following: fetchedFollowings.length,
        likes: posts.reduce((sum, post) => sum + (post.likeCount || 0), 0),
      });

      // Fetch user posts
      await fetchUserPosts(isOwnProfile ? currentUser?.id : String(userId));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user posts
  const fetchUserPosts = async (id: string | number | undefined) => {
    if (!id) {
      setPosts([]);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/api/users/${id}/posts?page=1&limit=10&loggined_user_id=${id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error('Error response:', await response.text());
        setPosts([]);
        return;
      }

      const result = await response.json();

      if (result?.data && Array.isArray(result.data)) {
        const formattedPosts: Post[] = result.data.map((post: any) => ({
          ...post,
          user_profile_image: getFullImageUrl(post.user_profile_image),
          media_url: getFullImageUrl(post.media_url),
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        }));

        setPosts(formattedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPosts([]);
    }
  };

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleTabChange = (tab: 'posts' | 'videos' | 'about') => {
    setActiveTab(tab);
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setStats((prev) => ({
      ...prev,
      followers: prev.followers + (isFollowing ? -1 : 1),
    }));
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleCreateChannel = () => {
    navigation.navigate('CreateChannel');
  };

  const handleMyChannel = () => {
    if (userChannelId && currentUser?.id) {
      // Note: Despite the parameter name being 'channelId', we pass the userId
      // because the ChannelScreen API expects userId, not channelId
      navigation.navigate('Channel', { channelId: String(currentUser.id) });
    } else {
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel');
    }
  };

  const handleAnalytics = () => {
    if (userChannelId) {
      navigation.navigate('Analytics', { channelId: userChannelId });
    } else {
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel');
    }
  };

  const handleFollowersPress = () => {
    navigation.navigate('FollowersList', { userId: user?.id ? Number(user.id) : undefined });
  };

  const handleFollowingsPress = () => {
    navigation.navigate('FollowingsList', { userId: user?.id ? Number(user.id) : undefined });
  };

  const handlePostsPress = () => {
    navigation.navigate('Posts' as never);
  };

  const handleLike = (postId: number) => {
    // Implement like functionality
  };

  const handleComment = (postId: number) => {
    setSelectedPostId(postId);
    setCommentsVisible(true);
  };

  const closeComments = () => {
    setCommentsVisible(false);
    setSelectedPostId(null);
  };

  const handleShare = (postId: number) => {
    // Implement share functionality
  };

  const handlePostPress = (postId: number) => {
    setImageViewerIndex(postId - 1);
    setShowImageViewer(true);
  };

  const handleFollow = async (followUserId: number) => {
    console.log('Follow user', followUserId);
    return Promise.resolve();
  };

  // Menu items
  const menuItems = [
    {
      id: 'account',
      icon: 'user',
      title: 'My Account',
      subtitle: 'Account settings and preferences',
      onPress: handleSettings,
      active: false,
    },
    {
      id: 'videos',
      icon: 'play-circle',
      title: 'Watch Videos',
      subtitle: 'Earn coins by watching content',
      onPress: () => navigation.navigate('TipShorts'),
      active: false,
    },
    {
      id: 'channel',
      icon: 'tv',
      title: 'My Channel',
      subtitle: 'Manage your channel content',
      onPress: handleMyChannel,
      active: false,
    },
    {
      id: 'analytics',
      icon: 'bar-chart-2',
      title: 'Analytics',
      subtitle: 'View channel performance',
      onPress: handleAnalytics,
      active: false,
    },
    {
      id: 'earnings',
      icon: 'dollar-sign',
      title: 'My Earnings',
      subtitle: 'Track your daily rewards',
      onPress: () => navigation.navigate('Earnings'),
      active: false,
    },
    {
      id: 'premium',
      icon: 'award',
      title: 'Premium Content',
      subtitle: 'Unlock exclusive videos',
      onPress: () => navigation.navigate('Packages'), // Changed to 'Packages'
      active: true,
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: 'Privacy',
      subtitle: 'Privacy and security settings',
      onPress: () => console.log('Navigate to privacy settings'),
      active: false,
    },
    {
      id: 'support',
      icon: 'help-circle',
      title: 'Support',
      subtitle: 'Help center and contact us',
      onPress: () => console.log('Navigate to support'),
      active: false,
    },
  ];

  // Handler for sign out
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'JD';

    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (!name) return 'JD';

    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Effects
  useEffect(() => {
    fetchUserData();
  }, [userId]); // Assuming fetchUserData is memoized or stable

  // Render functions
  if (loading && !refreshing && !user) {
    return (
      <ScreenTransition animationType="scale">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header
            title={isOwnProfile ? 'Profile' : 'Profile'}
            showLogo={false}
          />
          <ProfilePageSkeleton />
        </View>
      </ScreenTransition>
    );
  }

  if (!user && !loading) {
    return (
      <ScreenTransition animationType="scale">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header
            title={isOwnProfile ? 'Profile' : 'Profile'}
            showLogo={false}
          />
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

  return (
    <ScreenTransition animationType="scale">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={isOwnProfile ? 'Profile' : user?.name || 'Profile'}
          showLogo={false}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={['#4080FF', '#9747FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientHeader}
          >
            {isOwnProfile && (
              <TouchableOpacity style={styles.cameraButton}>
                <Icon name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </LinearGradient>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#4080FF', '#9747FF']} style={styles.avatarGradient}>
              <View style={[styles.avatarWrapper, { backgroundColor: colors.card }]}>
                {user?.profile_image ? (
                  <Image
                    source={{ uri: getFullImageUrl(user.profile_image) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{getUserInitials()}</Text>
                )}
                {isOwnProfile && (
                  <TouchableOpacity style={styles.avatarCameraButton}>
                    <Icon name="camera" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>
          {/* Name, Username, Bio, Location */}
          <View style={styles.userInfoContainer}>
            <Text style={[styles.userName, { color: colors.text.primary }]}>
              {user?.name || 'John Doe'}
            </Text>
            <LastSeen
              lastActiveTime={user?.last_active || null}
              isOnline={user?.is_online || false}
              style={styles.lastSeen}
            />
            <Text style={[styles.userHandle, { color: colors.text.secondary }]}>
              @{user?.username || 'johndoe'}
            </Text>
            <Text style={[styles.userBio, { color: colors.text.secondary }]}>
              {user?.bio || '🎬 Video enthusiast earning daily rewards 💰\nWatch, Learn, Earn with every view! 🚀'}
            </Text>
            <View style={styles.locationContainer}>
              <Icon name="map-pin" size={14} color={colors.text.tertiary} />
              <Text style={[styles.locationText, { color: colors.text.tertiary }]}>
                {user?.address || user?.location || 'San Francisco, CA'}
              </Text>
            </View>
          </View>
          {/* Stats Row */}
          <View style={[styles.statsContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
            <TouchableOpacity style={styles.statItem} onPress={handlePostsPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Posts</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {(stats.followers || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Followers</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleFollowingsPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Following</Text>
            </TouchableOpacity>
          </View>
          {/* Action Buttons for Other Users */}
          {!isOwnProfile && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  marginHorizontal: 8,
                  backgroundColor: isFollowing ? colors.gray[400] : colors.primary,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
                onPress={async () => {
                  const token = await AsyncStorage.getItem('accessToken');
                  const action = isFollowing ? 'unfollow' : 'follow';
                  const payload = {
                    followingId: user?.id,
                    followerId: currentUser?.id,
                    action,
                  };
                  try {
                    const response = await fetch(`${API_BASE_URL}/api/follow-user`, {
                      method: 'POST',
                      headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(payload),
                    });
                    if (response.ok) {
                      setIsFollowing(!isFollowing);
                      setStats((prev) => ({
                        ...prev,
                        followers: prev.followers + (isFollowing ? -1 : 1),
                      }));
                    }
                  } catch (e) {
                    // Optionally show error
                  }
                }}
                activeOpacity={0.85}
              >
                <Icon name={isFollowing ? 'user-x' : 'user-plus'} size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  marginRight: 8,
                }}
                onPress={() => {/* TODO: Implement call logic */}}
                activeOpacity={0.85}
              >
                <Icon name="phone" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
                onPress={() => {/* TODO: Implement video call logic */}}
                activeOpacity={0.85}
              >
                <Icon name="video" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {/* Edit Profile & Settings Buttons */}
          {isOwnProfile && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                <Icon name="edit-2" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: isDarkMode ? colors.gray[700] : colors.gray[200] }]}
                onPress={handleSettings}
              >
                <Icon name="settings" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}
          {/* Posts Grid */}
          <View style={styles.postsContainer}>
            {posts.map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => { setImageViewerIndex(index); setShowImageViewer(true); }}
              >
                <Image source={{ uri: getFullImageUrl(post.media_url) }} style={styles.postImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
          {/* Menu Section */}
          <View style={[styles.menuContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
            <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Menu</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.85}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[styles.menuIconContainer, { backgroundColor: isDarkMode ? colors.background : colors.gray[100] }]}
                  >
                    <Icon name={item.icon} size={22} color={colors.text.secondary} />
                  </View>
                  <View style={styles.menuItemTextContainer}>
                    <Text style={[styles.menuItemTitle, { color: colors.text.primary }]}>{item.title}</Text>
                    <Text style={[styles.menuItemSubtitle, { color: colors.text.tertiary }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.menuItemRight}>
                  {item.active && <View style={styles.activeIndicator} />}
                  <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginVertical: 12 }}>
            <RectangleAdComponent />
          </View>
        </ScrollView>
        {showImageViewer && (
          <Modal visible={showImageViewer} transparent={true} onRequestClose={() => setShowImageViewer(false)}>
            <ImageViewer
              imageUrls={posts.map(post => ({ url: getFullImageUrl(post.media_url) }))}
              index={imageViewerIndex}
              enableSwipeDown
              onSwipeDown={() => setShowImageViewer(false)}
              onCancel={() => setShowImageViewer(false)}
              saveToLocalByLongPress={false}
              renderIndicator={(currentIndex, allSize) => (
                <View style={{position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center', zIndex: 10}}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>{currentIndex} / {allSize}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={{ position: 'absolute', top: 40, right: 24, zIndex: 20 }} onPress={() => setShowImageViewer(false)}>
              <Icon name="x" size={32} color="#fff" />
            </TouchableOpacity>
          </Modal>
        )}
        {selectedPostId !== null && (
          <CommentScreen
            visible={isCommentsVisible}
            postId={selectedPostId}
            onClose={closeComments}
          />
        )}
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gradientHeader: {
    height: 120,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cameraButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff22',
    borderRadius: 16,
    padding: 6,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -48,
  },
  avatarGradient: {
    padding: 3,
    borderRadius: 48,
  },
  avatarWrapper: {
    borderRadius: 45,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4080FF',
  },
  avatarCameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#4080FF',
    borderRadius: 16,
    padding: 3,
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  userHandle: {
    fontSize: 15,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  lastSeen: {
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    marginVertical: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  editProfileButton: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: '#4080FF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  postsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  postItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  menuContainer: {
    borderRadius: 20,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  menuTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: 13,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4080FF',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});

export default ProfileScreen;