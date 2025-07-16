import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { Play } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../hooks/useWallet';
import { API_BASE_URL } from '../../constants/api';
import ImageViewer from '@react-native-oh-tpl/react-native-image-zoom-viewer';
import ApiService from '../../services/ApiService';
import BlocklistService from '../../services/BlocklistService';
import CallController from '../../services/calling/CallController';
import CallBillingService from '../../services/calling/CallBillingService';
import { CallType } from '../../stores/callStoreSimplified';
import Header from '../../components/common/Header';
import { ProfileFastImage } from '../../utils/FastImageOptimizer';
import VideoThumbnail from '../../components/common/VideoThumbnail';

const AVATAR_SIZE = 80; // Reduced to match ProfileScreen
const GRID_SPACING = 1;
const { width } = Dimensions.get('window');

interface UserProfileScreenProps {
  userId: number;
}

interface Post {
  id: number;
  media_url?: string | null;
  media_type?: string;
  is_premium?: boolean;
  content?: string;
  likeCount?: number;
  commentCount?: number;
  created_at?: string;
  is_liked?: boolean;
  user_id?: number;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = (props) => {
  const { colors, isDarkMode } = useTheme();
  const { user: currentUser } = useAuth();
  const { balance, isPremium } = useWallet();
  const navigation = useNavigation();
  const route = useRoute();
  const userIdFromParams = route.params && typeof route.params === 'object' && 'userId' in route.params ? Number(route.params.userId) : undefined;
  // Fix NaN issue: if userIdFromParams is undefined (own profile), use currentUser.id
  const [userId, setUserId] = useState<number>(
    userIdFromParams && !isNaN(userIdFromParams)
      ? userIdFromParams
      : props.userId && !isNaN(props.userId)
        ? props.userId
        : currentUser?.id ?? 0
  );
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Removed modal states - now using separate screen navigation
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  // Removed followersList and followingList - now handled in separate screen
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'posts'>('posts'); // Instagram-style tab navigation


  const blocklistService = BlocklistService.getInstance();
  const callController = CallController.getInstance();
  const billingService = CallBillingService.getInstance();





  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    // Handle userId updates from navigation params
    if (userIdFromParams && !isNaN(userIdFromParams) && userIdFromParams !== userId) {
      setUserId(userIdFromParams);
    } else if (!userIdFromParams && currentUser?.id && userId !== currentUser.id) {
      // If no userId in params (own profile), use currentUser.id
      setUserId(currentUser.id);
    }
  }, [userIdFromParams, currentUser?.id, userId]);

  // Handle call initiation with billing check (from TipCallScreenSimple)
  const handleStartCall = useCallback(
    async (callType: CallType) => {
      if (!currentUser || !user?.name) {
        Alert.alert("Error", "User or recipient information is missing.");
        return;
      }

      // Check if user is blocked
      if (isBlocked) {
        Alert.alert("Cannot Call", "You cannot call a blocked user.");
        return;
      }

      try {
        // Convert balance to number for calculations
        const numericBalance = parseFloat(balance || '0')
        
        // Check minimum balance requirement
        if (numericBalance < 1) {
          Alert.alert(
            'Insufficient Balance',
            'You need at least ₹1 to make a call. Please add money to your wallet.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Funds', onPress: () => navigation.navigate('AddFundsScreen' as never) }
            ]
          )
          return
        }

        // Calculate billing info to show user
        const billingInfo = await billingService.calculateCallBilling(
          currentUser.id?.toString() || '',
          callType,
          numericBalance,
          isPremium
        )

        const maxMinutes = Math.floor(billingInfo.maxDurationSeconds / 60)
        const rateText = billingService.formatCurrency(billingInfo.ratePerMinute)

        // Show confirmation dialog with billing information
        Alert.alert(
          `${callType === 'video' ? 'Video' : 'Voice'} Call`,
          `Rate: ${rateText}/min${isPremium ? ' (Premium)' : ''}\nMax Duration: ${maxMinutes} minutes\nCurrent Balance: ${billingService.formatCurrency(numericBalance)}\n\nProceed with the call?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call Now',
              onPress: async () => {
                const success = await callController.startCall(
                  userId.toString(),
                  user.name,
                  callType
                )
                
                if (!success) {
                  Alert.alert(
                    'Call Failed',
                    'Unable to start the call. The user may be unavailable.'
                  )
                }
              }
            }
          ]
        )
      } catch (error) {
        console.error('[UserProfile] Start call error:', error)
        Alert.alert('Call Error', 'An unexpected error occurred while starting the call. Please try again.')
      }
    },
    [callController, billingService, balance, isPremium, currentUser, user, userId, isBlocked, navigation]
  );

  // Handle chat navigation (from TipCallScreenSimple)
  const handleChatNavigation = useCallback(() => {
    if (!user) return;
    
    // Check if user is blocked
    if (isBlocked) {
      Alert.alert("Cannot Message", "You cannot message a blocked user.");
      return;
    }

    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Messaging is available for Premium users only. Please upgrade to Premium to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumScreen' as never) }
        ]
      )
      return
    }

    // Create contact object similar to TipCallScreenSimple
    const contact = {
      id: userId,
      name: user.name,
      profile_image: user.profile_image,
      emailId: user.emailId,
      online_status: user.online_status,
      last_seen: user.last_seen,
      is_available: user.is_available,
      dnd: user.dnd
    }

    // @ts-ignore
    navigation.navigate('Chat', { user: contact })

    // Mark messages as read in background
    if (currentUser?.id && unreadCount > 0) {
      ApiService.markMessagesAsRead(currentUser.id, userId).finally(() => {
        setUnreadCount(0)
      })
    }
  }, [user, isBlocked, isPremium, navigation, currentUser?.id, unreadCount, userId]);

  // Fetch unread message count for this specific user
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await ApiService.getUnreadMessageCount(currentUser.id);
      if (response?.data?.unread_count > 0) {
        // In a real implementation, you'd get user-specific unread count
        // For now, we'll simulate it
        setUnreadCount(Math.floor(Math.random() * 5));
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [currentUser?.id]);

  // Block/Unblock user functionality
  const handleBlockUser = useCallback(async () => {
    if (!user?.name || !userId) return;
    
    const action = isBlocked ? 'unblock' : 'block';
    const userName = user.name || 'Unknown User';
    
    Alert.alert(
      `${action === 'block' ? 'Block' : 'Unblock'} User`,
      `Are you sure you want to ${action} ${userName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: action === 'block' ? 'Block' : 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              if (action === 'block') {
                await blocklistService.blockUser(userId.toString(), userName);
                setIsBlocked(true);
                Alert.alert('Success', `${userName} has been blocked.`);
              } else {
                await blocklistService.unblockUser(userId.toString());
                setIsBlocked(false);
                Alert.alert('Success', `${userName} has been unblocked.`);
              }
            } catch (error) {
              console.error('[UserProfile] Failed to block/unblock user:', error);
              Alert.alert('Error', `Failed to ${action} user. Please try again.`);
            }
          },
        },
      ]
    );
  }, [user?.name, userId, isBlocked, blocklistService]);

  // Check if user is blocked on profile load
  const checkBlockStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      await blocklistService.initialize(); // Ensure blocklist is initialized
      const blocked = blocklistService.isUserBlocked(userId.toString());
      setIsBlocked(blocked);
    } catch (error) {
      console.error('[UserProfile] Failed to check block status:', error);
    }
  }, [userId, blocklistService]);

  const getFullImageUrl = (url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Use the new consolidated API for better performance
      const response = await ApiService.getConsolidatedProfile(userId, currentUser?.id);

      if (response?.data) {
        const profileData = response.data;

        // Set user info
        setUser({
          name: profileData.user.name,
          profile_image: profileData.user.profile_image,
          bio: profileData.user.bio,
          emailId: profileData.user.emailId,
          online_status: profileData.user.online_status,
          last_seen: profileData.user.last_seen,
          is_available: profileData.user.is_available,
          dnd: profileData.user.dnd,
        });

        // Set posts with proper image URLs
        const postsData: Post[] = (profileData.posts || []).map((p: any) => ({
          id: p.id,
          media_url: getFullImageUrl(p.media_url),
          media_type: p.media_type,
          is_premium: p.is_premium,
          content: p.content,
          likeCount: p.likeCount || p.like_count,
          commentCount: p.commentCount || p.comment_count,
          created_at: p.created_at,
          is_liked: p.is_liked,
          user_id: p.user_id,
        }));
        setPosts(postsData);

        // Set social stats
        setFollowersCount(profileData.social_stats.followers_count);
        setFollowingCount(profileData.social_stats.following_count);

        // Followers and followings lists are now handled in separate screen

        // Set following status
        setIsFollowing(profileData.is_following || false);

        // Set blocked status
        setIsBlocked(profileData.is_blocked || false);
      }
    } catch (error) {
      console.error('[UserProfile] Error fetching consolidated profile:', error);
      // Fallback to individual API calls if consolidated API fails
      try {
        const postsResponse = await ApiService.getUserPosts(userId, 1, 100, currentUser?.id || 0);
        if (postsResponse?.data) {
          const postsData: Post[] = postsResponse.data.map((p: any) => ({
            id: p.id,
            media_url: getFullImageUrl(p.media_url),
            media_type: p.media_type,
            is_premium: p.is_premium,
          }));
          setPosts(postsData);

          if (postsResponse.data.length > 0) {
            setUser({
              name: postsResponse.data[0].name,
              profile_image: postsResponse.data[0].user_profile_image,
            });
          }
        }

        // Get followers and followings as fallback
        const [followersResponse, followingsResponse] = await Promise.allSettled([
          ApiService.getUserFollowers(userId),
          ApiService.getUserFollowings(userId)
        ]);

        if (followersResponse.status === 'fulfilled' && followersResponse.value?.data) {
          const followers = followersResponse.value.data;
          setFollowersCount(followers.length);
          // Followers list now handled in separate screen
          setIsFollowing(currentUser?.id ? followers.some((f: any) => f.id === currentUser.id) : false);
        }

        if (followingsResponse.status === 'fulfilled' && followingsResponse.value?.data) {
          const followings = followingsResponse.value.data;
          setFollowingCount(followings.length);
          // Following list now handled in separate screen
        }
      } catch (fallbackError) {
        console.error('[UserProfile] Fallback API calls also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    checkBlockStatus();
  }, [checkBlockStatus]);

  // Removed fetchFollowersList and fetchFollowingList - now handled in separate screen

  const handleFollowToggle = async () => {
    if (!currentUser?.id) return;
    const token = await AsyncStorage.getItem('accessToken');
    const action = isFollowing ? 'unfollow' : 'follow';
    const payload = {
      followingId: userId,
      followerId: currentUser.id,
      action,
    };
    try {
      await fetch(`${API_BASE_URL}/api/follow-user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => prev + (isFollowing ? -1 : 1));
      // Followers list refresh now handled in separate screen
    } catch (e) {}
  };

  // Navigate to followers/following screen
  const handleFollowersPress = useCallback(() => {
    (navigation as any).navigate('FollowersFollowing', {
      userId,
      initialTab: 'followers',
      userName: user?.name
    });
  }, [navigation, userId, user?.name]);

  const handleFollowingPress = useCallback(() => {
    (navigation as any).navigate('FollowersFollowing', {
      userId,
      initialTab: 'following',
      userName: user?.name
    });
  }, [navigation, userId, user?.name]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserProfile();
    fetchUnreadCount();
  }, [fetchUserProfile, fetchUnreadCount]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Check if user is available for calls
  const isUserAvailable = user?.is_available && !user?.dnd && user?.online_status;

  // --- UI ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <Header
        title="Profile"
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

      {/* Main Content with FlatList */}
      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileInfo}>
                <ProfileFastImage
                  source={getFullImageUrl(user?.profile_image)}
                  size={AVATAR_SIZE}
                  style={styles.profileImage}
                />
                <View style={styles.profileDetails}>
                  <Text style={[styles.username, { color: colors.text.primary }]}>
                    {user?.name || 'User'}
                  </Text>
                  {user?.bio && (
                    <Text style={[styles.bio, { color: colors.text.secondary }]}>
                      {user.bio}
                    </Text>
                  )}
                </View>
              </View>

              {/* Stats Container */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                    {posts.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Posts
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={handleFollowersPress}
                >
                  <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                    {followersCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={handleFollowingPress}
                >
                  <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                    {followingCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Following
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Follow Button */}
              {!isOwnProfile && (
                <TouchableOpacity
                  style={[styles.followButton, { backgroundColor: isFollowing ? colors.gray[400] : colors.primary }]}
                  onPress={handleFollowToggle}
                >
                  <Text style={[styles.followButtonText, { color: colors.white }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons Section */}
            {!isOwnProfile && (
              <View style={styles.actionButtonsContainer}>
                {/* Call Buttons Row */}
                <View style={styles.callButtonsRow}>
                  {/* Video Call Button */}
                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      {
                        opacity: isBlocked ? 0.5 : 1
                      }
                    ]}
                    onPress={() => handleStartCall('video')}
                    activeOpacity={0.6}
                    disabled={isBlocked}
                  >
                    <Icon name="video" size={20} color={isBlocked ? colors.text.secondary : colors.text.primary} />
                  </TouchableOpacity>

                  {/* Voice Call Button */}
                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      {
                        opacity: isBlocked ? 0.5 : 1
                      }
                    ]}
                    onPress={() => handleStartCall('voice')}
                    activeOpacity={0.6}
                    disabled={isBlocked}
                  >
                    <Icon name="phone" size={20} color={isBlocked ? colors.text.secondary : colors.text.primary} />
                  </TouchableOpacity>

                  {/* Chat Button */}
                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      {
                        position: 'relative',
                        opacity: isBlocked ? 0.5 : 1
                      }
                    ]}
                    onPress={handleChatNavigation}
                    activeOpacity={0.6}
                    disabled={isBlocked}
                  >
                    <Icon name="message-circle" size={20} color={isBlocked ? colors.text.secondary : colors.text.primary} />
                    {/* Unread messages indicator */}
                    {unreadCount > 0 && !isBlocked && (
                      <View style={styles.unreadDot}>
                        <Text style={styles.unreadCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Block/Unblock Button */}
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleBlockUser}
                    activeOpacity={0.6}
                  >
                    <Icon name={isBlocked ? "user-check" : "user-x"} size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Availability Status Text */}
                <View style={styles.availabilityContainer}>
                  <Text style={[
                    styles.availabilityText,
                    { color: isUserAvailable ? colors.success : colors.text.secondary }
                  ]}>
                    {isUserAvailable ? '🟢 Available for calls' : '⚫ Currently unavailable'}
                  </Text>
                </View>
              </View>
            )}

            {/* Tab Navigation */}
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
            </View>
          </View>
        )}
        renderItem={({ item: post, index }) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postItem}
            onPress={() => {
              (navigation as any).navigate('PostViewer', {
                posts: posts,
                initialIndex: index,
                userId: userId,
              });
            }}
          >
            {post.media_type === 'video' ? (
              <VideoThumbnail
                videoUrl={getFullImageUrl(post.media_url)}
                style={styles.postImage}
                resizeMode="cover"
                thumbnailTime={1}
              />
            ) : (
              <Image
                source={{ uri: getFullImageUrl(post.media_url) }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
            {post.media_type === 'video' && (
              <View style={styles.videoIndicator}>
                <Play size={16} color="#fff" />
              </View>
            )}
            {post.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>★</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No posts yet.
            </Text>
          </View>
        )}
        contentContainerStyle={styles.postsGrid}
      />

      {/* Removed followers/following modals - now using separate screen */}
      {/* Image Viewer Modal */}
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
                <Text style={{color: colors.white, fontWeight: 'bold'}}>{currentIndex} / {allSize}</Text>
              </View>
            )}
          />
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 24, zIndex: 20 }} onPress={() => setShowImageViewer(false)}>
            <Icon name="x" size={32} color={colors.white} />
          </TouchableOpacity>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    marginBottom: 16,
  },
  callButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    position: 'relative',
  },
  availabilityContainer: {
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
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
    paddingHorizontal: GRID_SPACING / 2,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: GRID_SPACING / 2,
    maxWidth: (width - GRID_SPACING * 4) / 3, // Ensure proper 3-column layout
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    margin: 24,
    borderRadius: 18,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    alignSelf: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
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
});

// Removed UserListModal - functionality moved to separate FollowersFollowingScreen

export default UserProfileScreen;