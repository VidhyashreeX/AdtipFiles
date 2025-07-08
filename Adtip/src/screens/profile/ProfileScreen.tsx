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
  PermissionsAndroid,
  Linking,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import ImageViewer from '@react-native-oh-tpl/react-native-image-zoom-viewer';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

// Services
import CloudflareUploadService from '../../services/CloudflareUploadService';

// Components
import Header from '../../components/common/Header';
import LastSeen from '../../components/common/LastSeen';
import ProfilePageSkeleton from '../../components/skeletons/ProfilePageSkeleton';
import ScreenTransition from '../../components/common/ScreenTransition';
import CommentScreen from '../home/CommentScreen';
import RectangleAdComponent from '../../googleads/RectangleAdComponent';
import BannerAdComponent from '../../googleads/BannerAdComponent';
import UserProfileScreen from './UserProfileScreen';

// Context
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';

// Hooks
import { useChannelData, useSubscriptionStatus } from '../../hooks/useQueries';

// Constants
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import ApiService from '../../services/ApiService';
import UserPremiumPlans from '../wallet/UserPremiumPlans';

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

// Define profile params type
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
  const { user: currentUser, logout, updateUserDetails } = useAuth();
  const { userId: routeUserId } = (route.params as ProfileParams) || {};
  const userId = routeUserId || currentUser?.id;
  console.log('[ProfileScreen] Using userId for API calls:', userId);
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
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumData, setPremiumData] = useState<any>(null);

  // Additional state for image uploads
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(user?.banner_image || null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image || null);

  // Add state for modal and selected user
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // TanStack Query hooks for channel and premium data
  const {
    data: channelResponse,
    isLoading: channelLoading,
    error: channelError,
  } = useChannelData(currentUser?.id || 0);

  const {
    data: premiumResponse,
    isLoading: premiumLoading,
    error: premiumError,
  } = useSubscriptionStatus(currentUser?.id || 0);

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

  // Local storage helper functions for banner
  const getBannerImageKey = (userId: string | number): string => {
    return `banner_image_${userId}`;
  };

  const saveBannerImageLocally = async (imageUri: string, userId: string | number): Promise<string> => {
    try {
      // Store the image URI directly in AsyncStorage for simplicity
      const key = getBannerImageKey(userId);
      await AsyncStorage.setItem(key, imageUri);
      
      console.log(`[ProfileScreen] Banner image URI saved locally: ${imageUri}`);
      return imageUri;
    } catch (error) {
      console.error('[ProfileScreen] Error saving banner image locally:', error);
      throw error;
    }
  };

  // Helper function to load profile data from local storage
  const loadProfileFromLocalStorage = async (userId: string | number): Promise<Partial<User>> => {
    try {
      const idStr = String(userId);
      
      // Load individual profile fields
      const firstName = await AsyncStorage.getItem(`profile_firstName_${idStr}`);
      const lastName = await AsyncStorage.getItem(`profile_lastName_${idStr}`);
      const name = await AsyncStorage.getItem(`profile_name_${idStr}`);
      const emailId = await AsyncStorage.getItem(`profile_email_${idStr}`);
      const address = await AsyncStorage.getItem(`profile_address_${idStr}`);
      const bio = await AsyncStorage.getItem(`profile_bio_${idStr}`);
      const gender = await AsyncStorage.getItem(`profile_gender_${idStr}`);
      const profession = await AsyncStorage.getItem(`profile_profession_${idStr}`);
      const maternal_status = await AsyncStorage.getItem(`profile_maritalStatus_${idStr}`);
      const age = await AsyncStorage.getItem(`profile_age_${idStr}`);
      
      // Load interests
      let interests: any[] = [];
      const interestsJson = await AsyncStorage.getItem(`profile_interests_${idStr}`);
      if (interestsJson) {
        try {
          interests = JSON.parse(interestsJson);
        } catch (e) {
          console.error('[ProfileScreen] Error parsing interests JSON:', e);
        }
      }
      
      return {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        name: name || undefined,
        emailId: emailId || undefined,
        address: address || undefined,
        bio: bio || undefined,
        gender: gender || undefined,
        profession: profession || undefined,
        maternal_status: maternal_status || undefined,
        interests: interests || undefined,
        // Note: age is not part of the User interface, but we load it anyway
      };
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile from local storage:', error);
      return {};
    }
  };

  const loadBannerImageFromLocal = async (userId: string | number): Promise<string | null> => {
    try {
      const key = getBannerImageKey(userId);
      const savedUri = await AsyncStorage.getItem(key);
      return savedUri;
    } catch (error) {
      console.error('[ProfileScreen] Error loading banner image from local:', error);
      return null;
    }
  };

  // Local storage helper functions for profile image
  const getProfileImageKey = (userId: string | number): string => {
    return `profile_image_${userId}`;
  };

  const saveProfileImageLocally = async (imageUri: string, userId: string | number): Promise<string> => {
    try {
      const storageKey = getProfileImageKey(userId);
      await AsyncStorage.setItem(storageKey, imageUri);
      console.log('[ProfileScreen] Profile image saved locally:', storageKey, imageUri);
      return imageUri;
    } catch (error) {
      console.error('[ProfileScreen] Error saving profile image locally:', error);
      throw error;
    }
  };

  const loadProfileImageFromLocal = async (userId: string | number): Promise<string | null> => {
    try {
      const storageKey = getProfileImageKey(userId);
      const localImageUri = await AsyncStorage.getItem(storageKey);
      console.log('[ProfileScreen] Profile image loaded from local:', storageKey, localImageUri);
      return localImageUri;
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile image from local:', error);
      return null;
    }
  };

  // Request storage permissions
  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[ProfileScreen] Requesting Android storage permission');
        
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

        console.log('[ProfileScreen] Android storage permission result:', result);

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Permission Required',
            'Storage access is required to select images. Please try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => requestStoragePermission() },
            ],
          );
          return false;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Blocked',
            'Storage permission has been permanently denied. Please enable it from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return false;
        }
        return false;
      } else {
        // iOS - permissions handled by react-native-image-picker
        return true;
      }
    } catch (error) {
      console.error('[ProfileScreen] Error requesting storage permission:', error);
      Alert.alert('Permission Error', 'Failed to request permission. Please try again.');
      return false;
    }
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
        
        // Check if we have locally stored profile data
        if (currentUser.id) {
          const localProfileData = await loadProfileFromLocalStorage(currentUser.id);
          
          // Merge with API data, preferring local data
          if (localProfileData) {
            userData = {
              ...userData,
              ...localProfileData
            } as User;
            console.log('[ProfileScreen] Loaded user data from local storage:', localProfileData);
          }
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'GET',
          headers:
            {
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
      
      // Load banner and profile images from local storage if it's own profile
      if (userData?.id && isOwnProfile) {
        const localBannerUri = await loadBannerImageFromLocal(userData.id);
        if (localBannerUri) {
          setBannerImage(localBannerUri);
        }
        
        const localProfileUri = await loadProfileImageFromLocal(userData.id);
        if (localProfileUri) {
          console.log('[ProfileScreen] Loaded profile image from local storage:', localProfileUri);
          setProfileImage(localProfileUri);
        } else if (userData.profile_image) {
          console.log('[ProfileScreen] Using profile image from user data:', userData.profile_image);
          setProfileImage(userData.profile_image);
        }
      } else if (userData?.profile_image) {
        setProfileImage(userData.profile_image);
      }

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

        // Premium status is now handled by TanStack Query hooks
      }

      let fetchedFollowers: any[] = [];
      let fetchedFollowings: any[] = [];

      // Fetch followers
      console.log('[ProfileScreen] Fetching followers for user:', userId);
      const followersResponse = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const followersResult = await followersResponse.json();
      console.log('[ProfileScreen] Followers API result:', followersResult);
      if (followersResult.status && Array.isArray(followersResult.data)) {
        fetchedFollowers = followersResult.data.map((follower: any) => ({
          ...follower,
          profile_image: getFullImageUrl(follower.profile_image),
        }));
        setFollowers(fetchedFollowers);
      } else {
        setFollowers([]);
      }

      // Fetch followings
      console.log('[ProfileScreen] Fetching followings for user:', userId);
      const followingsResponse = await fetch(`${API_BASE_URL}/api/follow/followings/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const followingsResult = await followingsResponse.json();
      console.log('[ProfileScreen] Followings API result:', followingsResult);
      if (followingsResult.status && Array.isArray(followingsResult.data)) {
        fetchedFollowings = followingsResult.data.map((following: any) => ({
          ...following,
          profile_image: getFullImageUrl(following.profile_image),
        }));
        setFollowings(fetchedFollowings);
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
      if (isOwnProfile) {
        setIsPremium(false);
      }
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
    navigation.navigate('FollowersList', {
      userId: user?.id ? Number(user.id) : undefined,
      onUserPress: handleOpenUserProfileModal,
    });
  };

  const handleFollowingsPress = () => {
    navigation.navigate('FollowingsList', {
      userId: user?.id ? Number(user.id) : undefined,
      onUserPress: handleOpenUserProfileModal,
    });
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

  // Handler to open user profile modal
  const handleOpenUserProfileModal = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  };

  // Handler to close modal
  const handleCloseUserProfileModal = () => {
    setShowUserProfileModal(false);
    setSelectedUserId(null);
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
      id: 'referral',
      icon: 'users',
      title: 'Refer & Earn',
      subtitle: 'Invite friends and earn rewards',
      onPress: () => navigation.navigate('Referral'),
      active: false,
    },
    {
      id: 'premium',
      icon: 'award',
      title: 'Premium Content',
      subtitle: 'Unlock exclusive videos',
      //@ts-ignore
      onPress: () => navigation.navigate('SubscriptionScreen'),
      active: true,
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: 'Privacy',
      subtitle: 'Privacy and security settings',
      //@ts-ignore
      onPress: () => navigation.navigate('PrivacyPolicy'),
      active: false,
    },
    {
      id: 'support',
      icon: 'help-circle',
      title: 'Support',
      subtitle: 'Help center and contact us',
      onPress: () => navigation.navigate('Support' as never),
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

  // Banner image picker function - updated for local storage only
  const pickBannerImage = async () => {
    try {
      if (!isOwnProfile || !user?.id) return;
      
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) return;

      console.log('[ProfileScreen] Launching banner image picker');

      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1080,
        maxWidth: 1920,
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('[ProfileScreen] User cancelled banner image selection');
        return;
      }

      if (result.errorCode) {
        console.error('[ProfileScreen] Banner image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select image: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        console.log('[ProfileScreen] Selected banner image:', image.uri);

        if (image.uri) {
          setIsUploadingBanner(true);
          
          try {
            // Save image URI locally (no file copying, just store the URI)
            const localUri = await saveBannerImageLocally(image.uri, user.id);
            setBannerImage(localUri);
            console.log('[ProfileScreen] Banner image updated successfully');
          } catch (error: any) {
            console.error('[ProfileScreen] Banner save error:', error);
            Alert.alert('Save Failed', error.message || 'Failed to save banner image');
          } finally {
            setIsUploadingBanner(false);
          }
        }
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Error picking banner image:', error);
      Alert.alert('Error', 'Failed to select banner image. Please try again.');
      setIsUploadingBanner(false);
    }
  };

  // Avatar image picker function - updated to use correct API
  const pickAvatarImage = async () => {
    try {
      if (!isOwnProfile || !user?.id) return;
      
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) return;

      console.log('[ProfileScreen] Launching avatar image picker');

      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1080,
        maxWidth: 1080,
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('[ProfileScreen] User cancelled avatar image selection');
        return;
      }

      if (result.errorCode) {
        console.error('[ProfileScreen] Avatar image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select image: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        console.log('[ProfileScreen] Selected avatar image:', image.uri);

        if (image.uri) {
          setIsUploadingAvatar(true);
          
          try {
            // Upload to Cloudflare
            console.log('[ProfileScreen] Starting avatar upload to Cloudflare...');
            const uploadResult = await CloudflareUploadService.uploadFile(
              image.uri,
              'images',
              `avatar_${Date.now()}.jpg`,
              Number(user.id)
            );
            console.log('[ProfileScreen] Cloudflare upload result:', uploadResult);

            if (uploadResult.success) {
              console.log('[ProfileScreen] Avatar upload successful, updating user details via API...');
              
              // Use the correct API endpoint: /api/saveuserdetails with proper request format
              const updateData = {
                id: Number(user.id),
                name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                firstname: user.firstName || '',
                lastname: user.lastName || '',
                gender: user.gender || '',
                dob: user.dob || "1990-01-01",
                profile_image: uploadResult.url, // Update profile image URL with Cloudflare URL
                profession: user.profession || '',
                maternal_status: user.maternal_status || '',
                address: user.address || '',
                emailId: user.emailId || '',
                longitude: user.longitude || "",
                latitude: user.latitude || "",
                pincode: user.pincode || "",
                languages: 1,
                interests: 3,
                referal_code: ""
              };

              // Call the API directly using ApiService
              const apiResponse = await ApiService.saveUserDetails(updateData);
              console.log('[ProfileScreen] API response for profile image update:', apiResponse);
              
              if (apiResponse && (apiResponse.status === 200 || apiResponse.status === 1)) {
                // Save the image locally for fast display
                await saveProfileImageLocally(uploadResult.url, user.id);
                
                // Update the local state to show the new image immediately
                setProfileImage(uploadResult.url);
                
                // Update the user object with new profile image
                if (updateUserDetails) {
                  const userUpdateData = { profile_image: uploadResult.url };
                  await updateUserDetails(userUpdateData);
                }
                
                Alert.alert('Success', 'Profile picture updated successfully');
              } else {
                Alert.alert('Update Failed', 'Failed to update profile picture on server');
              }
            } else {
              Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload profile picture');
            }
          } catch (error: any) {
            console.error('[ProfileScreen] Avatar upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture');
          } finally {
            setIsUploadingAvatar(false);
          }
        }
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Error picking avatar image:', error);
      Alert.alert('Error', 'Failed to select profile picture. Please try again.');
      setIsUploadingAvatar(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Initialize profile image state when user data changes
  useEffect(() => {
    if (user?.profile_image && !profileImage) {
      setProfileImage(user.profile_image);
    }
  }, [user?.profile_image]);

  // Render functions
  if (loading && !refreshing && !user) {
    return (
      <ScreenTransition animationType="scale">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header
            title=""
            showLogo={false}
            showSearch={false}
            showWallet={false}
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
            title=""
            showLogo={false}
            showSearch={false}
            showWallet={false}
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

  const renderPremiumSection = () => {
    if (!isOwnProfile) return null;

    if (premiumLoading) {
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <View style={styles.premiumLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.premiumLoadingText, { color: colors.text.secondary }]}>
              Checking premium status...
            </Text>
          </View>
        </View>
      );
    }

    // Only show if user doesn't have premium
    if (!isPremium) {
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <LinearGradient
            colors={['#FFD700', '#FFB300']}
            style={styles.noPremiumCard}
          >
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.noPremiumTextContainer}>
              <Text style={styles.noPremiumTitle}>Premium Plans</Text>
              <Text style={styles.noPremiumSubtitle}>Unlock exclusive features!</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('PremiumUser' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }

    // If user has premium, show premium card with expiry date
    return (
      <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
        <LinearGradient
          colors={['#24d05a', '#1ba84a']}
          style={styles.premiumActiveCard}
        >
          <Text style={styles.premiumActiveIcon}>✨</Text>
          <View style={styles.premiumActiveTextContainer}>
            <Text style={styles.premiumActiveTitle}>Premium Active</Text>
            <Text style={styles.premiumActiveSubtitle}>
              {premiumData?.end_time ? `Expires: ${formatPremiumExpiryDate(premiumData.end_time)}` : 'Enjoying premium benefits'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('SubscriptionScreen' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScreenTransition animationType="scale">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title=""
          showLogo={false}
          showSearch={false}
          showWallet={false}
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
            {bannerImage && (
              <Image 
                source={{ uri: bannerImage }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            )}
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.galleryButton} 
                onPress={pickBannerImage}
                disabled={isUploadingBanner}
              >
                {isUploadingBanner ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="image" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </LinearGradient>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#4080FF', '#9747FF']} style={styles.avatarGradient}>
              <View style={[styles.avatarWrapper, { backgroundColor: colors.card }]}>
                {profileImage || user?.profile_image ? (
                  <Image
                    source={{ uri: getFullImageUrl(profileImage || user?.profile_image) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{getUserInitials()}</Text>
                )}
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.avatarGalleryButton}
                    onPress={pickAvatarImage}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name="image" size={14} color="#fff" />
                    )}
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
            <Text style={[styles.userHandle, { color: colors.text.secondary }]}
              >
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
          <View style={[styles.statsContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}
          >
            <TouchableOpacity style={styles.statItem} onPress={handlePostsPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Posts</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{followers.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Followers</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleFollowingsPress}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{followings.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Following</Text>
            </TouchableOpacity>
          </View>
          
          {/* Premium Status Section - Only show for own profile */}
          {renderPremiumSection()}
          
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
          
          {/* Banner Ad above Menu */}
          <View style={styles.bannerAdContainer}>
            <BannerAdComponent />
          </View>
          
          
          {/* Menu Section */}
          <View style={[styles.menuContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}
          >
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
        
        {/* Image Viewer Modal */}
        {showImageViewer && (
          <Modal visible={showImageViewer} transparent={true} onRequestClose={() => setShowImageViewer(false)}>
            <ImageViewer
              imageUrls={posts.map(post => ({ url: getFullImageUrl(post.media_url) }))
              }
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
        
        {/* Comments Modal */}
        {selectedPostId !== null && (
          <CommentScreen
            visible={isCommentsVisible}
            postId={selectedPostId}
            onClose={closeComments}
          />
        )}

        {/* User Profile Modal */}
        <Modal
          visible={showUserProfileModal}
          animationType="slide"
          onRequestClose={handleCloseUserProfileModal}
        >
          {selectedUserId && (
            <UserProfileScreen userId={selectedUserId} />
          )}
          <TouchableOpacity onPress={handleCloseUserProfileModal} style={{position: 'absolute', top: 40, right: 20, zIndex: 10}}>
            <Icon name="x" size={32} color="#000" />
          </TouchableOpacity>
        </Modal>
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
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  galleryButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff22',
    borderRadius: 16,
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGalleryButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#4080FF',
    borderRadius: 16,
    padding: 3,
    minWidth: 20,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  bannerAdContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
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
  premiumContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    paddingVertical: 4,
  },
  premiumLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  premiumLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  noPremiumCard: {
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
  noPremiumTextContainer: {
    flex: 1,
  },
  noPremiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  noPremiumSubtitle: {
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
  premiumActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  premiumActiveIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumActiveTextContainer: {
    flex: 1,
  },
  premiumActiveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  premiumActiveSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ProfileScreen;