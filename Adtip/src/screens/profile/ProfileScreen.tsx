import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  PermissionsAndroid,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from '@react-native-oh-tpl/react-native-image-zoom-viewer';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

// Services
import CloudflareUploadService from '../../services/CloudflareUploadService';

// Components
import Header from '../../components/common/Header';
import LastSeen from '../../components/common/LastSeen';
import ScreenTransition from '../../components/common/ScreenTransition';
import ProfilePageSkeleton from '../../components/skeletons/ProfilePageSkeleton';
import CommentScreen from '../home/CommentScreen';
import RectangleAdComponent from '../../googleads/RectangleAdComponent';
import BannerAdComponent from '../../googleads/BannerAdComponent';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';

// Hooks
import { 
  useDynamicUserName,
  useFollowers,
  useFollowings,
  useUserPosts,
  useFollowUserMutation,
  useChannelData,
  useSubscriptionStatus,
  usePremiumStatus
} from '../../hooks/useQueries';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import ApiService from '../../services/ApiService';
import { formatPremiumExpiryDate } from '../../utils/dateUtils';

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
  Packages: undefined;
  ChoosePackages: undefined;
  Referral: undefined;
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileParams {
  userId?: number;
}

// Update the User interface to match AuthContext
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
  banner_image?: string | null;
  last_active?: string | null;
  is_online?: boolean;
  emailId?: string;
  gender?: string;
  dob?: string;
  profession?: string;
  maternal_status?: string;
  longitude?: string;
  latitude?: string;
  pincode?: string | null;
  interests?: any[];
  isSaveUserDetails?: number;
  is_first_time?: number;
}

interface Post {
  id: number;
  user_profile_image?: string | null;
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

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const { user: currentUser, logout, updateUserDetails } = useAuth();
  const { userId: routeUserId } = (route.params as ProfileParams) || {};
  const userId = routeUserId || currentUser?.id;
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

  const isOwnProfile = !userId || (currentUser && userId === parseInt(String(currentUser.id), 10));

  // Enhanced UI State with image upload functionality
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'about'>('posts');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isCommentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [userChannelId, setUserChannelId] = useState<string | null>(null);
  
  // Additional state for image uploads
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Additional UI state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Array<{url: string}>>([]);

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
  } = usePremiumStatus(currentUser?.id || 0);

  // Set channel ID when data is available
  useEffect(() => {
    if (channelResponse?.data) {
      setUserChannelId(String(channelResponse.data.channelId || ''));
    }
  }, [channelResponse]);

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

  // Get user data for display - prioritize dynamic data from TanStack Query
  const displayUser = useMemo(() => {
    if (isOwnProfile && currentUser) {
      return {
        ...currentUser,
        name: dynamicUserName || currentUser.name,
      } as User;
    }
    return currentUser as User;
  }, [currentUser, dynamicUserName, isOwnProfile]);

  // Loading states
  const loading = followersLoading || followingsLoading || userPostsLoading;
  const refreshing = followUserMutation.isPending;

  // Default profile image
  const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string => {
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

  // Image upload functions
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every(permission => permission === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const selectImageFromGallery = async (type: 'avatar' | 'banner') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant storage permissions to upload images.');
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: type === 'banner' ? 800 : 800,
      maxWidth: type === 'banner' ? 1200 : 800,
      quality: 0.8 as any, // Type fix for quality
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel || !response.assets?.[0]) return;

      const asset = response.assets[0];
      if (asset.uri) {
        await handleImageUpload(asset.uri, type);
      }
    });
  };

  const handleImageUpload = async (imageUri: string, type: 'avatar' | 'banner') => {
    if (!currentUser) return;

    try {
      if (type === 'avatar') {
        setIsUploadingAvatar(true);
      } else {
        setIsUploadingBanner(true);
      }

      // Upload to Cloudflare - using a mock implementation for now
      let uploadedUrl: string | null = null;
      try {
        // Replace this with actual CloudflareUploadService.uploadImage when available
        uploadedUrl = imageUri; // Temporary - use local URI
      } catch (uploadError) {
        console.error('Upload service error:', uploadError);
        uploadedUrl = imageUri; // Fallback to local URI
      }
      
      if (uploadedUrl) {
        // Update local state immediately
        if (type === 'avatar') {
          setProfileImage(uploadedUrl);
        } else {
          setBannerImage(uploadedUrl);
        }

        // Store locally
        await AsyncStorage.setItem(`${type}_${currentUser.id}`, uploadedUrl);

        // Update user context - only update specific profile fields
        try {
          const profileUpdate = {
            [type === 'avatar' ? 'profile_image' : 'banner_image']: uploadedUrl,
          };
          await updateUserDetails(profileUpdate as any);
        } catch (updateError) {
          console.warn('User update error:', updateError);
          // Continue even if context update fails
        }

        Alert.alert('Success', `${type === 'avatar' ? 'Profile' : 'Banner'} image updated successfully!`);
      }
    } catch (error) {
      console.error(`${type} upload error:`, error);
      Alert.alert('Error', `Failed to upload ${type} image. Please try again.`);
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  };

  // Load stored images on mount and initialize from user data
  useEffect(() => {
    const loadStoredImages = async () => {
      if (!currentUser) return;

      try {
        const [storedAvatar, storedBanner] = await Promise.all([
          AsyncStorage.getItem(`avatar_${currentUser.id}`),
          AsyncStorage.getItem(`banner_${currentUser.id}`),
        ]);

        // Set stored images if available, otherwise use user data
        setProfileImage(storedAvatar || currentUser.profile_image || null);
        setBannerImage(storedBanner || currentUser.banner_image || null);
      } catch (error) {
        console.error('Error loading stored images:', error);
        // Fallback to user data
        setProfileImage(currentUser.profile_image || null);
        setBannerImage(currentUser.banner_image || null);
      }
    };

    loadStoredImages();
  }, [currentUser]);

  // Navigation handlers
  const handleEditProfile = () => navigation.navigate('EditProfile');
  const handleSettings = () => navigation.navigate('Settings');
  const handleCreateChannel = () => navigation.navigate('CreateChannel');
  const handleViewFollowers = () => navigation.navigate('FollowersList', { userId: Number(userId) });
  const handleViewFollowing = () => navigation.navigate('FollowingsList', { userId: Number(userId) });
  const handleAnalytics = () => {
    if (userChannelId) navigation.navigate('Analytics', { channelId: userChannelId });
  };
  const handleEarnings = () => navigation.navigate('Earnings');
  const handlePackages = () => navigation.navigate('Packages');
  const handleReferral = () => navigation.navigate('Referral');

  // Image viewer handlers
  const handleImagePress = (images: Post[], index: number) => {
    const imageUrls = images.map(post => ({ url: getFullImageUrl(post.media_url) }));
    setSelectedImages(imageUrls);
    setImageViewerIndex(index);
    setShowImageViewer(true);
  };

  const handleCommentsPress = (postId: number) => {
    setSelectedPostId(postId);
    setCommentsVisible(true);
  };

  // Premium functions
  const handleBuyPremium = () => navigation.navigate('ChoosePackages');
  
  const openWhatsApp = () => {
    const phoneNumber = '+917073030000';
    const message = encodeURIComponent('Hello, I need help with my premium subscription.');
    const url = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed on your device');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  // Get user initials for avatar fallback
  const getUserInitials = (): string => {
    if (!displayUser) return 'U';
    
    const name = displayUser.name || `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim();
    if (!name) return 'U';

    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Header 
          title={isOwnProfile ? "My Profile" : displayUser?.name || "Profile"}
          rightComponent={
            isOwnProfile ? (
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={styles.headerButton}>
                  <Icon name="more-vertical" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        >
          {/* Banner Section */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ 
                uri: bannerImage || getFullImageUrl(displayUser?.banner_image) || 'https://via.placeholder.com/400x200/cccccc/666666?text=Banner'
              }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.uploadBannerButton}
                onPress={() => selectImageFromGallery('banner')}
                disabled={isUploadingBanner}
              >
                {isUploadingBanner ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profileImage || displayUser?.profile_image ? (
                <Image
                  source={{ uri: profileImage || getFullImageUrl(displayUser?.profile_image) }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {getUserInitials()}
                  </Text>
                </View>
              )}
              {isOwnProfile && (
                <TouchableOpacity
                  style={styles.uploadAvatarButton}
                  onPress={() => selectImageFromGallery('avatar')}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="camera" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={[styles.userName, { color: colors.text.primary }]}>
                  {dynamicUserName || displayUser?.name || 'Unknown User'}
                </Text>
                {userNameLoading && <ActivityIndicator size="small" style={styles.nameLoader} />}
              </View>
              
              {displayUser?.bio && (
                <Text style={[styles.userBio, { color: colors.text.secondary }]}>
                  {displayUser.bio}
                </Text>
              )}
              
              {displayUser?.location && (
                <View style={styles.locationContainer}>
                  <Icon name="map-pin" size={14} color={colors.text.tertiary} />
                  <Text style={[styles.locationText, { color: colors.text.tertiary }]}>
                    {displayUser.location}
                  </Text>
                </View>
              )}

              {!isOwnProfile && displayUser?.last_active && (
                <LastSeen 
                  lastActiveTime={displayUser.last_active} 
                  isOnline={displayUser.is_online}
                />
              )}
            </View>
          </View>

          {/* Stats Section */}
          <View style={[styles.statsSection, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.statItem} onPress={handleViewFollowing}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Following</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem} onPress={handleViewFollowers}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.likes}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Likes</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditProfile}
                >
                  <Icon name="edit-2" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                
                {channelResponse?.data && (
                  <TouchableOpacity 
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={handleAnalytics}
                  >
                    <Icon name="bar-chart-2" size={16} color={colors.text.primary} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>Analytics</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { 
                    backgroundColor: isFollowing ? colors.surface : colors.primary,
                    borderColor: colors.primary,
                    borderWidth: isFollowing ? 1 : 0,
                  }
                ]}
                onPress={handleFollowToggle}
                disabled={followUserMutation.isPending}
              >
                {followUserMutation.isPending ? (
                  <ActivityIndicator size="small" color={isFollowing ? colors.primary : "#fff"} />
                ) : (
                  <>
                    <Icon 
                      name={isFollowing ? "user-minus" : "user-plus"} 
                      size={16} 
                      color={isFollowing ? colors.primary : "#fff"} 
                    />
                    <Text style={[
                      styles.followButtonText,
                      { color: isFollowing ? colors.primary : "#fff" }
                    ]}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Premium Section */}
          {isOwnProfile && (
            <View style={[styles.premiumSection, { backgroundColor: colors.surface }]}>
              {premiumLoading ? (
                <ActivityIndicator size="small" />
              ) : isPremium ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.premiumCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.premiumContent}>
                    <Icon name="crown" size={24} color="#fff" />
                    <View style={styles.premiumText}>
                      <Text style={styles.premiumTitle}>Premium Active</Text>
                      <Text style={styles.premiumExpiry}>
                        Expires: {formatPremiumExpiryDate(premiumResponse?.premium_expiry_date)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={openWhatsApp} style={styles.helpButton}>
                    <Icon name="help-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <View style={[styles.premiumOffer, { borderColor: colors.primary }]}>
                  <View style={styles.premiumOfferContent}>
                    <Icon name="star" size={24} color={colors.primary} />
                    <View style={styles.premiumOfferText}>
                      <Text style={[styles.premiumOfferTitle, { color: colors.text.primary }]}>
                        Unlock Premium Features
                      </Text>
                      <Text style={[styles.premiumOfferSubtitle, { color: colors.text.secondary }]}>
                        Get unlimited access to all features
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.buyPremiumButton, { backgroundColor: colors.primary }]}
                    onPress={handleBuyPremium}
                  >
                    <Text style={styles.buyPremiumText}>Upgrade</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Advertisement */}
          <View style={styles.adContainer}>
            <RectangleAdComponent />
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
            {(['posts', 'videos', 'about'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: colors.primary }
                ]}
                onPress={() => handleTabChange(tab)}
              >
                <Icon 
                  name={tab === 'posts' ? 'grid' : tab === 'videos' ? 'play' : 'user'}
                  size={20}
                  color={activeTab === tab ? colors.primary : colors.text.secondary}
                />
                <Text style={[
                  styles.tabText,
                  { 
                    color: activeTab === tab ? colors.primary : colors.text.secondary,
                    fontWeight: activeTab === tab ? '600' : '400'
                  }
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content based on active tab */}
          {activeTab === 'posts' && (
            <View style={styles.postsGrid}>
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postItem}
                    onPress={() => handleImagePress(posts, index)}
                  >
                    <Image
                      source={{ uri: getFullImageUrl(post.media_url) }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                    <View style={styles.postOverlay}>
                      <View style={styles.postStats}>
                        <View style={styles.postStat}>
                          <Icon name="heart" size={14} color="#fff" />
                          <Text style={styles.postStatText}>{post.likeCount || 0}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.postStat}
                          onPress={() => handleCommentsPress(post.id)}
                        >
                          <Icon name="message-circle" size={14} color="#fff" />
                          <Text style={styles.postStatText}>{post.commentCount || 0}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="image" size={48} color={colors.text.tertiary} />
                  <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                    No posts yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'videos' && (
            <View style={styles.emptyState}>
              <Icon name="video" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                No videos yet
              </Text>
            </View>
          )}

          {activeTab === 'about' && (
            <View style={styles.aboutSection}>
              <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>About</Text>
                {displayUser?.bio ? (
                  <Text style={[styles.aboutText, { color: colors.text.secondary }]}>
                    {displayUser.bio}
                  </Text>
                ) : (
                  <Text style={[styles.aboutPlaceholder, { color: colors.text.tertiary }]}>
                    No bio available
                  </Text>
                )}
                
                {(displayUser?.profession || displayUser?.location) && (
                  <View style={styles.aboutDetails}>
                    {displayUser?.profession && (
                      <View style={styles.aboutDetail}>
                        <Icon name="briefcase" size={16} color={colors.text.tertiary} />
                        <Text style={[styles.aboutDetailText, { color: colors.text.secondary }]}>
                          {displayUser.profession}
                        </Text>
                      </View>
                    )}
                    {displayUser?.location && (
                      <View style={styles.aboutDetail}>
                        <Icon name="map-pin" size={16} color={colors.text.tertiary} />
                        <Text style={[styles.aboutDetailText, { color: colors.text.secondary }]}>
                          {displayUser.location}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bottom Ad */}
          <View style={styles.bottomAdContainer}>
            <BannerAdComponent />
          </View>
        </ScrollView>

        {/* More Menu Modal */}
        {showMoreMenu && (
          <Modal
            transparent
            visible={showMoreMenu}
            animationType="fade"
            onRequestClose={() => setShowMoreMenu(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowMoreMenu(false)}
            >
              <View style={[styles.menuModal, { backgroundColor: colors.surface }]}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { handleSettings(); setShowMoreMenu(false); }}>
                  <Icon name="settings" size={20} color={colors.text.primary} />
                  <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Settings</Text>
                </TouchableOpacity>
                
                {!channelResponse?.data ? (
                  <TouchableOpacity style={styles.menuItem} onPress={() => { handleCreateChannel(); setShowMoreMenu(false); }}>
                    <Icon name="tv" size={20} color={colors.text.primary} />
                    <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Create Channel</Text>
                  </TouchableOpacity>
                ) : null}
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { handleEarnings(); setShowMoreMenu(false); }}>
                  <Icon name="dollar-sign" size={20} color={colors.text.primary} />
                  <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Earnings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { handleReferral(); setShowMoreMenu(false); }}>
                  <Icon name="users" size={20} color={colors.text.primary} />
                  <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Referrals</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { handlePackages(); setShowMoreMenu(false); }}>
                  <Icon name="package" size={20} color={colors.text.primary} />
                  <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Packages</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Image Viewer Modal */}
        {showImageViewer && selectedImages.length > 0 && (
          <Modal visible={showImageViewer} transparent onRequestClose={() => setShowImageViewer(false)}>
            <ImageViewer
              imageUrls={selectedImages}
              index={imageViewerIndex}
              onSwipeDown={() => setShowImageViewer(false)}
              enableSwipeDown
              renderHeader={() => (
                <TouchableOpacity
                  style={styles.imageViewerClose}
                  onPress={() => setShowImageViewer(false)}
                >
                  <Icon name="x" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            />
          </Modal>
        )}

        {/* Comments Modal */}
        {isCommentsVisible && selectedPostId && (
          <Modal
            visible={isCommentsVisible}
            animationType="slide"
            onRequestClose={() => setCommentsVisible(false)}
          >
            <CommentScreen
              visible={isCommentsVisible}
              postId={selectedPostId}
              onClose={() => setCommentsVisible(false)}
            />
          </Modal>
        )}
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  uploadBannerButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    padding: 16,
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  uploadAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginTop: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  nameLoader: {
    marginLeft: 8,
  },
  userBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  premiumSection: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
  },
  premiumCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumText: {
    marginLeft: 12,
    flex: 1,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  premiumExpiry: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  helpButton: {
    padding: 8,
  },
  premiumOffer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumOfferContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumOfferText: {
    marginLeft: 12,
    flex: 1,
  },
  premiumOfferTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  premiumOfferSubtitle: {
    fontSize: 12,
  },
  buyPremiumButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buyPremiumText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  postItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  postOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 4,
    justifyContent: 'flex-end',
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
  aboutSection: {
    padding: 16,
  },
  aboutCard: {
    borderRadius: 12,
    padding: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  aboutDetails: {
    gap: 12,
  },
  aboutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutDetailText: {
    fontSize: 14,
  },
  bottomAdContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    margin: 20,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
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
