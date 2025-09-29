import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Phone, Video, MessageCircle, UserPlus, UserMinus, Share2 } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestGuard } from '../../hooks/useGuestGuard';
import ApiService from '../../services/ApiService';
import { ProfileFastImage } from '../../utils/FastImageOptimizer';
import { checkPremiumAccess, logPremiumAccessAttempt } from '../../utils/premiumAccessUtils';
import { useWallet } from '../../hooks/useWallet';
import CallController from '../../services/calling/CallController';
import PremiumAccessModal from '../../components/modals/PremiumAccessModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChannelProfile {
  id: number;
  name: string;
  bio?: string;
  profile_image?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified?: boolean;
  is_following?: boolean;
  online_status?: boolean;
  is_available?: boolean;
  dnd?: boolean;
}

interface RouteParams {
  channelId: string;
  channelName: string;
  avatar?: string;
  isVerified?: boolean;
  createdBy?: number;
}

const ChannelProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDarkMode } = useTheme();
  const { user, isGuest } = useAuth();
  const { requireAuth } = useGuestGuard();
  const { isPremium } = useWallet();

  const params = route.params as RouteParams;
  const channelId = params?.channelId || params?.createdBy?.toString();
  const channelName = params?.channelName;

  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<'voice_call' | 'video_call' | 'chat' | 'general'>('general');

  // Fetch channel profile
  const fetchChannelProfile = useCallback(async () => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[ChannelProfile] Fetching profile for channelId:', channelId);
      
      const response = await ApiService.get(`/getchannel/${channelId}`);
      
      if (response.data && response.data.status) {
        const channelData = response.data.data;
        setProfile({
          id: parseInt(channelId),
          name: channelData.name || channelName || 'Unknown Channel',
          bio: channelData.bio || channelData.description,
          profile_image: channelData.profile_image || channelData.avatar || params?.avatar,
          followers_count: channelData.followers_count || 0,
          following_count: channelData.following_count || 0,
          posts_count: channelData.posts_count || channelData.videos_count || 0,
          is_verified: channelData.is_verified || params?.isVerified || false,
          is_following: channelData.is_following || false,
          online_status: channelData.online_status || false,
          is_available: channelData.is_available || true,
          dnd: channelData.dnd || false,
        });
        setFollowing(channelData.is_following || false);
      } else {
        // Fallback with route params
        setProfile({
          id: parseInt(channelId),
          name: channelName || 'Unknown Channel',
          bio: 'Channel profile',
          profile_image: params?.avatar,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_verified: params?.isVerified || false,
          is_following: false,
          online_status: false,
          is_available: true,
          dnd: false,
        });
      }
    } catch (error) {
      console.error('[ChannelProfile] Error fetching profile:', error);
      // Create fallback profile
      setProfile({
        id: parseInt(channelId),
        name: channelName || 'Unknown Channel',
        bio: 'Channel profile',
        profile_image: params?.avatar,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_verified: params?.isVerified || false,
        is_following: false,
        online_status: false,
        is_available: true,
        dnd: false,
      });
    } finally {
      setLoading(false);
    }
  }, [channelId, channelName, params]);

  useEffect(() => {
    fetchChannelProfile();
  }, [fetchChannelProfile]);

  // Handle follow/unfollow
  const handleFollow = useCallback(async () => {
    if (isGuest) {
      requireAuth('follow', () => {});
      return;
    }

    if (!profile || !user?.id) return;

    try {
      const action = following ? 'unfollow' : 'follow';
      console.log(`[ChannelProfile] ${action}ing channel:`, profile.id);

      const response = await ApiService.post('/followchannel', {
        userId: user.id,
        channelId: profile.id,
        action
      });

      if (response.data && response.data.status) {
        setFollowing(!following);
        setProfile(prev => prev ? {
          ...prev,
          followers_count: following 
            ? Math.max(0, prev.followers_count - 1)
            : prev.followers_count + 1,
          is_following: !following
        } : null);
      }
    } catch (error) {
      console.error('[ChannelProfile] Error following/unfollowing:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  }, [profile, following, user?.id, isGuest, requireAuth]);

  // Handle voice call
  const handleVoiceCall = useCallback(async () => {
    if (!profile) return;

    const accessResult = checkPremiumAccess({
      feature: 'voice_call',
      isPremium,
      userId: user?.id,
    });

    logPremiumAccessAttempt(
      'voice_call',
      isPremium,
      user?.id,
      { channelId: profile.id, channelName: profile.name }
    );

    if (!accessResult.hasAccess) {
      setPremiumFeature('voice_call');
      setShowPremiumModal(true);
      return;
    }

    try {
      const callController = CallController.getInstance();
      await callController.initiateCall(
        profile.id,
        profile.name,
        'voice' as CallType
      );
    } catch (error) {
      console.error('[ChannelProfile] Voice call error:', error);
      Alert.alert('Call Failed', 'Unable to start voice call. Please try again.');
    }
  }, [profile, isPremium, user?.id]);

  // Handle video call
  const handleVideoCall = useCallback(async () => {
    if (!profile) return;

    const accessResult = checkPremiumAccess({
      feature: 'video_call',
      isPremium,
      userId: user?.id,
    });

    logPremiumAccessAttempt(
      'video_call',
      isPremium,
      user?.id,
      { channelId: profile.id, channelName: profile.name }
    );

    if (!accessResult.hasAccess) {
      setPremiumFeature('video_call');
      setShowPremiumModal(true);
      return;
    }

    try {
      const callController = CallController.getInstance();
      await callController.initiateCall(
        profile.id,
        profile.name,
        'video' as CallType
      );
    } catch (error) {
      console.error('[ChannelProfile] Video call error:', error);
      Alert.alert('Call Failed', 'Unable to start video call. Please try again.');
    }
  }, [profile, isPremium, user?.id]);

  // Handle chat navigation
  const handleChat = useCallback(() => {
    if (!profile) return;

    const accessResult = checkPremiumAccess({
      feature: 'chat',
      isPremium,
      userId: user?.id,
    });

    logPremiumAccessAttempt(
      'chat',
      isPremium,
      user?.id,
      { channelId: profile.id, channelName: profile.name }
    );

    if (!accessResult.hasAccess) {
      setPremiumFeature('chat');
      setShowPremiumModal(true);
      return;
    }

    // Navigate to chat screen
    navigation.navigate('FCMChat' as never, {
      participantId: profile.id.toString(),
      participantName: profile.name
    });
  }, [profile, isPremium, user?.id, navigation]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!profile) return;

    try {
      const shareUrl = `https://adtip.app/channel/${profile.id}`;
      const message = `Check out ${profile.name}'s channel on AdTip! ${shareUrl}`;
      
      // Use React Native's built-in Share API
      const Share = require('react-native').Share;
      await Share.share({
        message,
        url: shareUrl,
        title: `${profile.name}'s Channel`
      });
    } catch (error) {
      console.error('[ChannelProfile] Share error:', error);
    }
  }, [profile]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="chevron-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Channel Profile
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="chevron-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Channel Profile
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            Channel not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOnline = profile.online_status && profile.is_available && !profile.dnd;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="chevron-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {profile.name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Share2 size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <ProfileFastImage
              source={profile.profile_image ? { uri: profile.profile_image } : undefined}
              style={styles.avatar}
              fallbackText={profile.name.charAt(0).toUpperCase()}
            />
            {isOnline && (
              <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: colors.text.primary }]}>
                {profile.name}
              </Text>
              {profile.is_verified && (
                <Icon name="check-circle" size={20} color={colors.primary} />
              )}
            </View>

            {profile.bio && (
              <Text style={[styles.profileBio, { color: colors.text.secondary }]}>
                {profile.bio}
              </Text>
            )}

            <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.text.tertiary }]}>
              {isOnline ? 'Available for calls' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.posts_count}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Posts
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.followers_count}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {profile.following_count}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Following
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {/* Primary Action - Follow/Unfollow */}
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: following ? colors.border : colors.primary,
                borderColor: following ? colors.border : colors.primary,
              }
            ]}
            onPress={handleFollow}
            activeOpacity={0.8}
          >
            <Icon
              name={following ? "user-minus" : "user-plus"}
              size={18}
              color={following ? colors.text.primary : "#FFFFFF"}
            />
            <Text
              style={[
                styles.followButtonText,
                { color: following ? colors.text.primary : "#FFFFFF" }
              ]}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Text>
          </TouchableOpacity>

          {/* Communication Buttons */}
          <View style={styles.communicationButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDarkMode ? colors.card : colors.background,
                  borderColor: colors.border,
                  opacity: isOnline ? 1 : 0.6
                }
              ]}
              onPress={handleVoiceCall}
              activeOpacity={0.7}
              disabled={!isOnline}
            >
              <Phone size={20} color={isOnline ? colors.primary : colors.text.tertiary} />
              <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>
                Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDarkMode ? colors.card : colors.background,
                  borderColor: colors.border,
                  opacity: isOnline ? 1 : 0.6
                }
              ]}
              onPress={handleVideoCall}
              activeOpacity={0.7}
              disabled={!isOnline}
            >
              <Video size={20} color={isOnline ? colors.primary : colors.text.tertiary} />
              <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>
                Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDarkMode ? colors.card : colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={handleChat}
              activeOpacity={0.7}
            >
              <MessageCircle size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info */}
        {!isOnline && (
          <View style={[styles.offlineNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="info" size={16} color={colors.text.tertiary} />
            <Text style={[styles.offlineNoticeText, { color: colors.text.tertiary }]}>
              This user is currently offline. You can still send a message.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Premium Access Modal */}
      <PremiumAccessModal
        visible={showPremiumModal}
        feature={premiumFeature}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate('SubscriptionScreen' as never);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  profileBio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    marginHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  communicationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineNoticeText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default ChannelProfileScreen;