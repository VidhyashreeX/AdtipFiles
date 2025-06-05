// src/screens/profile/ProfileScreen.tsx
import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import LastSeen from '../../components/common/LastSeen';

// Context
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';

// Constants
import {API_BASE_URL, API_ENDPOINTS} from '../../constants/api';

// Define profile params type
interface ProfileParams {
  userId?: number;
}

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const {userId} = (route.params as ProfileParams) || {};
  const {colors, isDarkMode} = useTheme();
  
  // Add a try/catch block to handle missing context
  let contentPaddingBottom = 0;
  try {
    // Try to use the TabNavigator context
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    // Fallback to a reasonable value if context is not available
    contentPaddingBottom = 80; // Default padding that should work in most cases
  }
  
  const {user: currentUser, logout} = useAuth();
  const navigation = useNavigation();

  // State
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'about'>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    followers: Math.floor(Math.random() * 1000),
    following: Math.floor(Math.random() * 500),
    likes: Math.floor(Math.random() * 10000),
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullMenu, setShowFullMenu] = useState(false);

  const isOwnProfile =
    !userId || (currentUser && userId === parseInt(currentUser.id, 10));

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string | undefined => {
    if (!url || url === 'null' || url === 'undefined') {
      return undefined;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      let userData: any;

      if (isOwnProfile && currentUser) {
        // Use current user data for own profile
        userData = currentUser;
      } else {        // Fetch other user profile data
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(
          `${API_BASE_URL}/api/users/${userId}`,
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
          setUser(null);
          setLoading(false);
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          userData = result.data;
        } else {
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setUser(userData);

      // Fetch user posts
      await fetchUserPosts(isOwnProfile ? currentUser?.id : userId);
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
        `${API_BASE_URL}${API_ENDPOINTS.PROFILE.USER_POSTS}/${id}/posts`,
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
        const formattedPosts = result.data.map((post: any) => ({
          ...post,
          user_profile_image: getFullImageUrl(post.user_profile_image),
          media_url: getFullImageUrl(post.media_url),
          likeCount: post.likes || 0,
          commentCount: post.comments || 0,
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
    // Update follower count
    setStats(prev => ({
      ...prev,
      followers: prev.followers + (isFollowing ? -1 : 1),
    }));

    // API call would go here in real implementation
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleCreateChannel = () => {
    navigation.navigate('CreateChannel' as never);
  };

  // Post interaction handlers
  const handleLike = (postId: number) => {
    // Like post functionality
    console.log('Like post', postId);
  };

  const handleComment = (postId: number) => {
    // Navigate to comment screen
    // @ts-ignore
    navigation.navigate('Comments', {postId});
  };

  const handleShare = (postId: number) => {
    // Share functionality
    console.log('Share post', postId);
  };

  const handlePostPress = (postId: number) => {
    // Navigate to post detail
    // @ts-ignore
    navigation.navigate('PostDetail', {postId});
  };

  const handleFollow = async (followUserId: number) => {
    // Follow functionality
    console.log('Follow user', followUserId);
    return Promise.resolve();
  };

  // Menu items based on design
  const menuItems = [
    {
      id: 'account',
      icon: 'user',
      title: 'My Account',
      subtitle: 'Account settings and preferences',
      onPress: handleSettings,
      active: false,
    },    {
      id: 'videos',
      icon: 'play-circle',
      title: 'Watch Videos',
      subtitle: 'Earn coins by watching content',
      onPress: () => navigation.navigate('TipShorts' as never),
      active: false,
    },    {
      id: 'earnings',
      icon: 'dollar-sign',
      title: 'My Earnings',
      subtitle: 'Track your daily rewards',
      onPress: () => navigation.navigate('Earnings' as never),
      active: false,
    },
    {
      id: 'premium',
      icon: 'award',
      title: 'Premium Content',
      subtitle: 'Unlock exclusive videos',
      onPress: () => console.log('Navigate to premium content'),
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
      // Navigation reset is now handled in AuthContext.logout, so nothing else is needed here.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Render functions
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title={isOwnProfile ? 'Profile' : 'Profile'} showLogo={true} showNotifications={isOwnProfile || false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!user && !loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title={isOwnProfile ? 'Profile' : 'Profile'} showLogo={true} showNotifications={isOwnProfile || false} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.primary}]}>User not found or there was an error loading the profile.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{color: colors.primary}}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header 
        title={isOwnProfile ? 'Profile' : user?.name || 'Profile'} 
        showLogo={true} // Always show logo, regardless of profile type
        showBackButton={!isOwnProfile}
        showNotifications={isOwnProfile || false} 
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
        </LinearGradient>        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#4080FF', '#9747FF']}
            style={styles.avatarGradient}
          >
            <View style={[styles.avatarWrapper, {backgroundColor: colors.card}]}>
              {user?.profile_image ? (
                <Image source={{ uri: getFullImageUrl(user.profile_image) }} style={styles.avatarImage} />
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
        </View>        {/* Name, Username, Bio, Location */}
        <View style={styles.userInfoContainer}>
          <Text style={[styles.userName, {color: colors.text.primary}]}>
            {user?.name || 'John Doe'}
          </Text>
          
          <LastSeen 
            lastActiveTime={user.last_active}
            isOnline={user.is_online}
            style={styles.lastSeen}
          />
          
          <Text style={[styles.userHandle, {color: colors.text.secondary}]}>@{user?.username || 'johndoe'}</Text>
          <Text style={[styles.userBio, {color: colors.text.secondary}]}>
            {user?.bio || '🎬 Video enthusiast earning daily rewards 💰\nWatch, Learn, Earn with every view! 🚀'}
          </Text>
          <View style={styles.locationContainer}>
            <Icon name="map-pin" size={14} color={colors.text.tertiary} />
            <Text style={[styles.locationText, {color: colors.text.tertiary}]}>
              {user?.address || user?.location || 'San Francisco, CA'}
            </Text>
          </View>
        </View>        {/* Stats Row */}
        <View style={[styles.statsContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.text.primary}]}>{posts.length || 128}</Text>
            <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>Posts</Text>
          </View>
          <View style={[styles.statDivider, {backgroundColor: colors.borderLight}]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.text.primary}]}>{stats.followers?.toLocaleString() || '2.5K'}</Text>
            <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>Followers</Text>
          </View>
          <View style={[styles.statDivider, {backgroundColor: colors.borderLight}]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.text.primary}]}>{stats.following || 892}</Text>
            <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>Following</Text>
          </View>
        </View>        {/* Edit Profile & Settings Buttons */}
        {isOwnProfile && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Icon name="edit-2" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingsButton, {backgroundColor: isDarkMode ? colors.gray[700] : colors.gray[200]}]}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Icon name="settings" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Section */}
        <View style={[styles.menuContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <Text style={[styles.menuTitle, {color: colors.text.primary}]}>Menu</Text>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: isDarkMode ? colors.background : colors.gray[100]}]}>
                  <Icon name={item.icon} size={22} color={colors.text.secondary} />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemTitle, {color: colors.text.primary}]}>{item.title}</Text>
                  <Text style={[styles.menuItemSubtitle, {color: colors.text.tertiary}]}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.active && <View style={styles.activeIndicator} />}
                <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
