// src/screens/profile/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import PostItem from '../../components/home/PostItem';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

type ProfileParams = {
  userId?: number;
};

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const { userId } = route.params as ProfileParams || {};
  const { colors } = useTheme();
  const { user: currentUser, logout } = useAuth();
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
  
  const isOwnProfile = !userId || (currentUser && userId === parseInt(currentUser.id));
  
  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
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
        userData = currentUser;
      } else {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const result = await response.json();
        userData = result.data;
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
    if (!id) return;
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.USER_POSTS}/${id}/posts`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
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
      followers: prev.followers + (isFollowing ? -1 : 1)
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
    navigation.navigate('Comments' as never, { postId } as never);
  };
  
  const handleShare = (postId: number) => {
    // Share functionality
    console.log('Share post', postId);
  };
  
  const handlePostPress = (postId: number) => {
    // Navigate to post detail
    navigation.navigate('PostDetail' as never, { postId } as never);
  };
  
  const handleFollow = async (userId: number) => {
    // Follow functionality
    console.log('Follow user', userId);
    return Promise.resolve();
  };
  
  // Handler for sign out
  const handleSignOut = async () => {
    try {
      await logout();
      // Navigation reset is now handled in AuthContext.logout, so nothing else is needed here.
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Effects
  useEffect(() => {
    fetchUserData();
  }, [userId]);
  
  // Render functions
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBackButton={true} title="Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }
  
  if (!user && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBackButton={true} title="Profile" />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            User not found or there was an error loading the profile.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      <Header 
        showBackButton={true} 
        title={isOwnProfile ? "My Profile" : "Profile"} 
        showNotifications={isOwnProfile}
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.coverPhotoContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' }} 
              style={styles.coverPhoto} 
            />
          </View>
          
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: user.profile_image 
                    ? getFullImageUrl(user.profile_image) 
                    : 'https://via.placeholder.com/150' 
                }} 
                style={styles.avatar} 
              />
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={[styles.name, { color: colors.text.primary }]}>
                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
              </Text>
              <Text style={[styles.username, { color: colors.text.secondary }]}>
                @{user.username || `user${user.id}`}
              </Text>
              
              {user.bio && (
                <Text style={[styles.bio, { color: colors.text.secondary }]}>
                  {user.bio}
                </Text>
              )}
            </View>
            
            {isOwnProfile ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.editButton, { borderColor: colors.border.default }]} 
                  onPress={handleEditProfile}
                >
                  <Text style={{ color: colors.text.primary }}>Edit Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsButton} 
                  onPress={handleSettings}
                >
                  <Icon name="settings" size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { backgroundColor: isFollowing ? colors.gray[200] : colors.primary }
                ]}
                onPress={handleFollowToggle}
              >
                <Text style={{ 
                  color: isFollowing ? colors.text.primary : colors.white,
                  fontWeight: '600'
                }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[styles.statsContainer, { borderColor: colors.border.light }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.likes}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Likes</Text>
            </View>
          </View>
        </View>
        
        {!user.hasChannel && isOwnProfile && (
          <TouchableOpacity 
            style={[styles.createChannelButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateChannel}
          >
            <Icon name="video" size={20} color={colors.white} />
            <Text style={styles.createChannelText}>Create Your Channel</Text>
          </TouchableOpacity>
        )}
        
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border.light }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'posts' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => handleTabChange('posts')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'posts' ? colors.primary : colors.text.secondary }
            ]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'videos' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => handleTabChange('videos')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'videos' ? colors.primary : colors.text.secondary }
            ]}>
              Videos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'about' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => handleTabChange('about')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'about' ? colors.primary : colors.text.secondary }
            ]}>
              About
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'posts' && (
          <View style={styles.contentContainer}>
            {posts.length === 0 ? (
              <View style={styles.emptyContent}>
                <Icon name="image" size={50} color={colors.gray[300]} />
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={[styles.createPostButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('CreatePost' as never)}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600' }}>Create Post</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              posts.map(post => (
                <PostItem
                  key={post.id}
                  id={post.id}
                  username={post.user_name || user.name}
                  profileImage={post.user_profile_image || getFullImageUrl(user.profile_image)}
                  postImage={post.media_url}
                  caption={post.content}
                  likes={post.likeCount}
                  comments={post.commentCount}
                  timeAgo={post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                  media_type={post.media_type}
                  isPremium={post.is_premium}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onPostPress={handlePostPress}
                  onUserPress={() => {}}
                  onFollow={handleFollow}
                  userId={post.user_id || parseInt(user.id)}
                />
              ))
            )}
          </View>
        )}
        
        {activeTab === 'videos' && (
          <View style={styles.contentContainer}>
            <View style={styles.emptyContent}>
              <Icon name="video" size={50} color={colors.gray[300]} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {isOwnProfile ? "You haven't uploaded any videos yet" : "No videos yet"}
              </Text>
              {isOwnProfile && (
                <TouchableOpacity 
                  style={[styles.createPostButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('TipTubeUpload' as never)}
                >
                  <Text style={{ color: colors.white, fontWeight: '600' }}>Upload Video</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {activeTab === 'about' && (
          <View style={[styles.aboutContainer, { backgroundColor: colors.white }]}>
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>
                Personal Information
              </Text>
              <View style={styles.aboutItem}>
                <Icon name="mail" size={18} color={colors.text.tertiary} />
                <Text style={[styles.aboutText, { color: colors.text.secondary }]}>
                  {user.emailId || 'Not provided'}
                </Text>
              </View>
              <View style={styles.aboutItem}>
                <Icon name="phone" size={18} color={colors.text.tertiary} />
                <Text style={[styles.aboutText, { color: colors.text.secondary }]}>
                  {user.mobile_number || 'Not provided'}
                </Text>
              </View>
              <View style={styles.aboutItem}>
                <Icon name="map-pin" size={18} color={colors.text.tertiary} />
                <Text style={[styles.aboutText, { color: colors.text.secondary }]}>
                  {user.address || 'Not provided'}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>
                Professional Information
              </Text>
              <View style={styles.aboutItem}>
                <Icon name="briefcase" size={18} color={colors.text.tertiary} />
                <Text style={[styles.aboutText, { color: colors.text.secondary }]}>
                  {user.profession || 'Not provided'}
                </Text>
              </View>
              
              {isOwnProfile && (
                <TouchableOpacity 
                  style={[styles.editDetailsButton, { borderColor: colors.border.default }]} 
                  onPress={handleEditProfile}
                >
                  <Text style={{ color: colors.primary }}>Edit Details</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {isOwnProfile && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    marginBottom: 16,
  },
  coverPhotoContainer: {
    height: 150,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  profileInfoContainer: {
    padding: 16,
    marginTop: -40,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  nameContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  settingsButton: {
    padding: 8,
  },
  followButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  createChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createChannelText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    minHeight: 300,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  createPostButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
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
  aboutContainer: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  aboutSection: {
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aboutText: {
    marginLeft: 12,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  editDetailsButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  signOutButton: {
    margin: 24,
    padding: 14,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
