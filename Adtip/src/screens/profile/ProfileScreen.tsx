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
import ApiService from '../../services/ApiService';

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

  // Image upload functions with proper permission handling
  const requestStoragePermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to select images.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Permission Required',
            'Storage access is required to select images. Please try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => requestStoragePermissions() },
            ]
          );
          return false;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Blocked',
            'Storage permission has been permanently denied. Please enable it from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
        return false;
      } catch (err) {
        console.warn('Permission request error:', err);
        Alert.alert('Permission Error', 'Failed to request permission. Please try again.');
        return false;
      }
    }
    return true; // iOS permissions handled by react-native-image-picker
  };

  const selectImageFromGallery = async (type: 'avatar' | 'banner') => {
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) {
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

      // Upload to Cloudflare using proper service
      console.log(`[ProfileScreen] Starting ${type} upload to Cloudflare...`);
      const uploadResult = await CloudflareUploadService.uploadFile(
        imageUri,
        'images',
        `${type}_${Date.now()}.jpg`,
        Number(currentUser.id)
      );
      
      console.log(`[ProfileScreen] Cloudflare upload result:`, uploadResult);

      if (uploadResult.success && uploadResult.url) {
        // Update local state immediately for UI feedback
        if (type === 'avatar') {
          setProfileImage(uploadResult.url);
        } else {
          setBannerImage(uploadResult.url);
        }

        // Store locally for persistence
        await AsyncStorage.setItem(`${type}_${currentUser.id}`, uploadResult.url);

        if (type === 'avatar') {
          // Use ApiService.saveUserDetails for profile image update
          const updateData = {
            id: Number(currentUser.id),
            name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
            firstname: currentUser.firstName || '',
            lastname: currentUser.lastName || '',
            gender: currentUser.gender || '',
            dob: currentUser.dob || "1990-01-01",
            profile_image: uploadResult.url,
            profession: currentUser.profession || '',
            maternal_status: currentUser.maternal_status || '',
            address: currentUser.address || '',
            emailId: currentUser.emailId || '',
            longitude: currentUser.longitude || "",
            latitude: currentUser.latitude || "",
            pincode: currentUser.pincode || "",
            languages: 1,
            interests: 3,
            referal_code: ""
          };

          const apiResponse = await ApiService.saveUserDetails(updateData);
          console.log(`[ProfileScreen] API response for ${type} update:`, apiResponse);
          
          if (apiResponse && (apiResponse.status === 200 || apiResponse.status === 1)) {
            // Update user context if possible
            try {
              await updateUserDetails({ profile_image: uploadResult.url } as any);
            } catch (updateError) {
              console.warn('User context update error:', updateError);
            }
            
            Alert.alert('Success', `${type === 'avatar' ? 'Profile picture' : 'Banner'} updated successfully!`);
          } else {
            Alert.alert('Update Failed', `Failed to update ${type} on server`);
          }
        } else {
          // For banner, just show success since we don't have a specific API endpoint
          Alert.alert('Success', 'Banner image updated successfully!');
        }
      } else {
        Alert.alert('Upload Failed', uploadResult.error || `Failed to upload ${type} image`);
      }
    } catch (error: any) {
      console.error(`[ProfileScreen] ${type} upload error:`, error);
      Alert.alert('Upload Failed', error.message || `Failed to upload ${type} image. Please try again.`);
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
    if (userChannelId) {
      navigation.navigate('Analytics', { channelId: userChannelId });
    } else {
      Alert.alert('No Channel', 'Please create a channel first to view analytics.');
    }
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

  // Premium Banner Component (matching HomeScreen style)
  const PremiumBanner = () => {
    if (premiumLoading || isPremium) return null;

    return (
      <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
        <LinearGradient
          colors={['#FFD700', '#FFB300']}
          style={styles.premiumBanner}
        >
          <Text style={styles.crownIcon}>👑</Text>
          <View style={styles.premiumTextContainer}>
            <Text style={styles.premiumTitle}>Premium Plans</Text>
            <Text style={styles.premiumSubtitle}>Unlock exclusive features!</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('ChoosePackages')}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Header Dropdown Menu Component (matching TipCallScreenSimple style)
  const HeaderDropdownMenu = () => {
    const menuItems = [
      { icon: 'settings', title: 'Settings', onPress: () => { handleSettings(); setShowMoreMenu(false); } },
      { icon: 'tv', title: 'Create Channel', onPress: () => { handleCreateChannel(); setShowMoreMenu(false); }, hidden: !!channelResponse?.data },
      { icon: 'bar-chart-2', title: 'Analytics', onPress: () => { handleAnalytics(); setShowMoreMenu(false); }, hidden: !channelResponse?.data },
      { icon: 'dollar-sign', title: 'Earnings', onPress: () => { handleEarnings(); setShowMoreMenu(false); } },
      { icon: 'users', title: 'Referrals', onPress: () => { handleReferral(); setShowMoreMenu(false); } },
      { icon: 'package', title: 'Packages', onPress: () => { handlePackages(); setShowMoreMenu(false); } },
    ];

    return (
      <View style={[styles.headerDropdown, { backgroundColor: colors.surface }]}>
        {menuItems.filter(item => !item.hidden).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.headerDropdownItem}
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={16} color={colors.text.primary} />
            <Text style={[styles.headerDropdownText, { color: colors.text.primary }]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
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
          title=""
          rightComponent={
            isOwnProfile ? (
              <View style={styles.headerButtonsContainer}>
                <TouchableOpacity 
                  onPress={() => setShowMoreMenu(!showMoreMenu)} 
                  style={styles.headerButton}
                >
                  <Icon name="more-vertical" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                {showMoreMenu && <HeaderDropdownMenu />}
              </View>
            ) : null
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
          onTouchStart={() => setShowMoreMenu(false)} // Close dropdown when scrolling
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

          {/* Premium Banner */}
          {isOwnProfile && <PremiumBanner />}

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
  headerButtonsContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  headerDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  headerDropdownText: {
    fontSize: 14,
    fontWeight: '500',
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
  // Premium Banner Styles (matching HomeScreen)
  premiumContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    paddingVertical: 4,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  crownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  upgradeButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 0, // Remove gap
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
