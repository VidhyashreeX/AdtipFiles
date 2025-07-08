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
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../constants/api';
import ImageViewer from '@react-native-oh-tpl/react-native-image-zoom-viewer';
import UnifiedCallService from '../../services/calling/UnifiedCallService';
import ApiService from '../../services/ApiService';

const AVATAR_SIZE = 96;
const GRID_SPACING = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_IMAGE_SIZE = (SCREEN_WIDTH - GRID_SPACING * 4) / 3;

interface UserProfileScreenProps {
  userId: number;
  onClose?: () => void;
}

interface Post {
  id: number;
  media_url?: string | null;
  media_type?: string;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = (props) => {
  const { colors, isDarkMode } = useTheme();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const userIdFromParams = route.params && typeof route.params === 'object' && 'userId' in route.params ? Number(route.params.userId) : undefined;
  const [userId, setUserId] = useState<number>(userIdFromParams ?? props.userId ?? 0);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { onClose } = props;

  // When closing the main modal, also close all nested modals
  const handleClose = useCallback(() => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    setShowImageViewer(false);
    if (onClose) onClose();
  }, [onClose]);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userIdFromParams && userIdFromParams !== userId) {
      setUserId(userIdFromParams);
    }
  }, [userIdFromParams]);

  // Imported functionality from TipCallScreen
  const handleStartCall = useCallback(async (callType: 'voice' | 'video') => {
    if (!currentUser || !user?.name) {
      Alert.alert("Error", "User or recipient information is missing.");
      return;
    }

    // Prevent multiple rapid call attempts using Zustand store
    const { useCallStore } = require('../../stores/callStore');
    const currentCallStatus = useCallStore.getState().callStatus;
    if (currentCallStatus !== 'idle' && currentCallStatus !== 'ended') {
      Alert.alert("Call In Progress", "You are already in a call.");
      return;
    }

    try {
      console.log('[UserProfile] Starting WhatsApp-like call to:', user.name, 'Type:', callType);
      
      // Initialize Unified Call Service if not already done
      const unifiedCallService = UnifiedCallService.getInstance();
      const initialized = await unifiedCallService.initialize();
      
      if (!initialized) {
        Alert.alert("Call Error", "Unable to initialize calling system. Please try again.");
        return;
      }
      
      // Start the call with Unified Call Service
      const callData = await unifiedCallService.startOutgoingCall(
        userId.toString(),
        user.name,
        callType,
        currentUser.name || 'User',
        currentUser.id.toString()
      );
      
      if (callData) {
        console.log('[UserProfile] WhatsApp-like call initiated successfully:', callData.callId);
        // Navigation will be handled automatically by WhatsApp Call Manager
      } else {
        console.error('[UserProfile] WhatsApp Call Manager failed to start the call.');
        Alert.alert('Call Failed', 'Unable to start the call. Please check your connection and try again.');
      }
    } catch (error) {
      console.error('[UserProfile] Error in handleStartCall:', error);
      Alert.alert('Call Error', 'An unexpected error occurred while starting the call. Please try again.');
    }
  }, [currentUser, user, userId]);

  const handleChatNavigation = useCallback(async () => {
    if (!user) return;
    
    // Mark messages as read when opening chat
    if (currentUser?.id && unreadCount > 0) {
      try {
        await ApiService.markMessagesAsRead(currentUser.id, userId);
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
    
    // Navigate to chat with the user data structure expected by Chat screen
    //@ts-ignore
    navigation.navigate('Chat', { 
      user: {
        id: userId,
        name: user.name,
        profile_image: user.profile_image,
        emailId: user.emailId,
        online_status: user.online_status,
        last_seen: user.last_seen,
        is_available: user.is_available,
        dnd: user.dnd
      }
    });
  }, [navigation, user, currentUser?.id, unreadCount, userId]);

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
      const token = await AsyncStorage.getItem('accessToken');
      // Get posts (and user info from first post)
      const postsRes = await fetch(`${API_BASE_URL}/api/users/${userId}/posts?page=1&limit=100&loggined_user_id=${currentUser?.id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      let userInfo = null;
      let postsData: Post[] = [];
      if (postsRes.ok) {
        const postsJson = await postsRes.json();
        if (postsJson.data && postsJson.data.length > 0) {
          postsData = postsJson.data.map((p: any) => ({
            id: p.id,
            media_url: getFullImageUrl(p.media_url),
            media_type: p.media_type,
          }));
          userInfo = {
            name: postsJson.data[0].name,
            profile_image: postsJson.data[0].user_profile_image,
          };
        }
      }
      setPosts(postsData);
      setUser(userInfo);
      // Get followers
      const followersRes = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      let isUserFollowing = false;
      let followersArr: any[] = [];
      if (followersRes.ok) {
        const followersJson = await followersRes.json();
        followersArr = followersJson.data || [];
        setFollowersCount(followersArr.length);
        setFollowersList(followersArr);
        if (followersArr && currentUser?.id) {
          isUserFollowing = followersArr.some((f: any) => f.id === currentUser.id);
        }
      }
      setIsFollowing(isUserFollowing);
      // Get followings
      const followingsRes = await fetch(`${API_BASE_URL}/api/follow/followings/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      let followingArr: any[] = [];
      if (followingsRes.ok) {
        const followingsJson = await followingsRes.json();
        followingArr = followingsJson.data || [];
        setFollowingCount(followingArr.length);
        setFollowingList(followingArr);
      }
    } catch (e) {
      // Optionally handle error
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

  // Fetch followers/following list on modal open
  const fetchFollowersList = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      setFollowersList(json.data || []);
      setFollowersCount((json.data || []).length);
    }
    setLoading(false);
  };
  const fetchFollowingList = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/follow/followings/${userId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      setFollowingList(json.data || []);
      setFollowingCount((json.data || []).length);
    }
    setLoading(false);
  };

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
      fetchFollowersList(); // Refresh followers list
    } catch (e) {}
  };

  // Followers/Following modal recursive navigation
  const handleUserPressInModal = (id: number) => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    setTimeout(() => setUserId(id), 300);
  };

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Bar */}
      <View style={{ height: 120, backgroundColor: 'transparent' }} />
      <LinearGradient colors={['#4080FF', '#9747FF']} style={styles.gradientBar} />
      {/* Avatar (overlapping gradient) */}
      <View style={{ alignItems: 'center', position: 'absolute', top: 60, left: 0, right: 0, zIndex: 2 }}>
        <Image source={{ uri: getFullImageUrl(user?.profile_image) }} style={[styles.avatar, { borderColor: colors.card, backgroundColor: colors.skeleton.background }]} />
      </View>
      {/* Name and Stats */}
      <View style={{ alignItems: 'center', marginTop: 60 + AVATAR_SIZE / 2 + 8 }}>
        <Text style={{ color: colors.text.primary, fontWeight: 'bold', fontSize: 22, marginBottom: 6 }}>{user?.name || 'User'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
          <TouchableOpacity style={styles.statItem} onPress={() => { fetchFollowersList(); setShowFollowersModal(true); }}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{followersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]} >Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => { fetchFollowingList(); setShowFollowingModal(true); }}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{posts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Posts</Text>
          </View>
        </View>
        {/* Follow/Unfollow Button (not for own profile) */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              alignSelf: 'center',
              backgroundColor: isFollowing ? colors.gray[400] : colors.primary,
              borderRadius: 20,
              paddingHorizontal: 28,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: colors.black,
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handleFollowToggle}
            activeOpacity={0.85}
          >
            <Icon name={isFollowing ? 'user-x' : 'user-plus'} size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Call/Video Call/Chat Buttons - Updated to always show buttons */}
      {!isOwnProfile && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 8 }}>
          {/* Video Call Button */}
          <TouchableOpacity 
            style={[
              styles.callButton, 
              { 
                backgroundColor: colors.primary
              }
            ]} 
            onPress={() => handleStartCall('video')}
            activeOpacity={0.8}
          >
            <Icon name="video" size={22} color={colors.white} />
          </TouchableOpacity>
          
          {/* Voice Call Button */}
          <TouchableOpacity 
            style={[
              styles.callButton, 
              { 
                backgroundColor: colors.success
              }
            ]} 
            onPress={() => handleStartCall('voice')}
            activeOpacity={0.8}
          >
            <Icon name="phone" size={22} color={colors.white} />
          </TouchableOpacity>
          
          {/* Chat Button */}
          <TouchableOpacity 
            style={[
              styles.callButton, 
              { 
                backgroundColor: colors.info || '#3B82F6',
                position: 'relative'
              }
            ]} 
            onPress={handleChatNavigation}
            activeOpacity={0.8}
          >
            <Icon name="message-circle" size={22} color={colors.white} />
            {/* Unread messages indicator */}
            {unreadCount > 0 && (
              <View style={styles.unreadDot}>
                <Text style={styles.unreadCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Availability Status Text */}
      {!isOwnProfile && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={[
            styles.availabilityText, 
            { color: isUserAvailable ? colors.success : colors.text.secondary }
          ]}>
            {isUserAvailable ? '🟢 Available for calls' : '⚫ Currently unavailable'}
          </Text>
        </View>
      )}
      
      {/* Posts Grid */}
      <FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: GRID_SPACING, paddingBottom: 24 }}
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => { setImageViewerIndex(index); setShowImageViewer(true); }}>
            <Image source={{ uri: getFullImageUrl(item.media_url) }} style={[styles.gridImage, { backgroundColor: colors.skeleton.background }]} resizeMode="cover" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: colors.text.secondary, alignSelf: 'center', marginTop: 32 }}>No posts yet.</Text>}
        removeClippedSubviews={false}
      />
      {/* Followers Modal */}
      <Modal visible={showFollowersModal} transparent animationType="slide" onRequestClose={() => setShowFollowersModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(15,23,42,0.7)' : 'rgba(0,0,0,0.3)' }] }>
          <View style={[styles.modalContent, { backgroundColor: colors.card }] }>
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 8 }} onPress={() => setShowFollowersModal(false)}>
              <Icon name="x" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Followers</Text>
            <UserListModal users={followersList} currentUserId={currentUser?.id || 0} onUserPress={handleUserPressInModal} />
          </View>
        </View>
      </Modal>
      {/* Following Modal */}
      <Modal visible={showFollowingModal} transparent animationType="slide" onRequestClose={() => setShowFollowingModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(15,23,42,0.7)' : 'rgba(0,0,0,0.3)' }] }>
          <View style={[styles.modalContent, { backgroundColor: colors.card }] }>
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 8 }} onPress={() => setShowFollowingModal(false)}>
              <Icon name="x" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Following</Text>
            <UserListModal users={followingList} currentUserId={currentUser?.id || 0} onUserPress={handleUserPressInModal} />
          </View>
        </View>
      </Modal>
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
      {/* Main close button for the parent modal, if needed */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 24, zIndex: 20 }} onPress={handleClose}>
        <Icon name="x" size={32} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    marginBottom: 0,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 18,
  },
  statLabel: {
    fontSize: 13,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  gridImage: {
    width: GRID_IMAGE_SIZE,
    height: GRID_IMAGE_SIZE,
    borderRadius: 10,
    margin: GRID_SPACING,
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
  // New styles for chat functionality
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700', // Gold color
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
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

const UserListModal = ({ users, currentUserId, onUserPress }: { users: any[], currentUserId: number, onUserPress: (id: number) => void }) => {
  const { colors, isDarkMode } = useTheme();
  const [followState, setFollowState] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    const state: { [id: number]: boolean } = {};
    users.forEach((u: any) => { state[u.id] = !!u.is_followed; });
    setFollowState(state);
  }, [users]);

  const handleFollowToggle = async (targetId: number, isFollowed: boolean) => {
    setFollowState(prev => ({ ...prev, [targetId]: !isFollowed }));
    await fetch(`${API_BASE_URL}/api/follow-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        followingId: targetId,
        followerId: currentUserId,
        action: isFollowed ? 'unfollow' : 'follow',
      }),
    });
  };

  if (!users.length) return <Text style={{ color: colors.text.secondary, alignSelf: 'center', marginTop: 32 }}>No users found.</Text>;

  return (
    <ScrollView style={{ maxHeight: 320 }}>
      {users.map((u: any) => (
        <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 }}>
          <TouchableOpacity onPress={() => onUserPress(u.id)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Image source={{ uri: u.profile_image || 'https://via.placeholder.com/150' }} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 12, backgroundColor: colors.skeleton.background, borderWidth: 1, borderColor: colors.border }} />
            <Text style={{ color: colors.text.primary, fontWeight: '500', fontSize: 16 }}>{u.name || 'User'}</Text>
          </TouchableOpacity>
          {u.id !== currentUserId && (
            <TouchableOpacity
              style={{ backgroundColor: followState[u.id] ? colors.gray[400] : colors.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6, marginLeft: 8 }}
              onPress={() => handleFollowToggle(u.id, followState[u.id])}
            >
              <Text style={{ color: colors.white, fontWeight: '600' }}>{followState[u.id] ? 'Unfollow' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default UserProfileScreen;