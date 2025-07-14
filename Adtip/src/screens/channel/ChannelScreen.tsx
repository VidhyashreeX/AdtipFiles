// src/screens/channel/ChannelScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import ChannelCommunicationButtons from '../../components/channel/ChannelCommunicationButtons';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import { CheckCircle, Play, Calendar, Users, Eye, Bell, BellOff, Edit3, Camera, X } from 'lucide-react-native';
import { MainNavigatorParamList } from '../../types/navigation';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useChannelData,
  useChannelVideos,
  useUpdateChannel,
  useUserData
} from '../../hooks/useQueries';

// Utility function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const { width } = Dimensions.get('window');

interface ChannelInfo {
  channelId: string;
  channelName: string;
  description: string;
  profileImage: string;
  coverImage?: string;
  totalSubscribers: number;
  totalVideos: number;
  totalViews: number;
  isSubscribed: boolean;
  isVerified: boolean;
  createdDate: string;
  createdBy: number;
}

interface Video {
  id: string;
  name: string;
  videoThumbnail: string;
  playDuration: string;
  views: number;
  createdDate: string;
  description: string;
  videoType: number; // 0 for TipTube, 1 for TipShorts
  videoLink: string;
  is_shot: number; // 0 for video, 1 for short
}

const ChannelScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<MainNavigatorParamList>>();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    isContentCreatorPremium,
    contentCreatorPremiumData,
    isLoading: contentCreatorPremiumLoading
  } = useContentCreatorPremium();
  const [selectedTab, setSelectedTab] = useState<'videos' | 'about'>('videos');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New state for plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Get channel ID and data from route params
  const routeChannelId = (route.params as any)?.channelId || (route.params as any)?.userId;
  const passedChannelData = (route.params as any)?.channelData;
  const isMyChannel = !routeChannelId || String(routeChannelId) === String(user?.id);
  const channelId = isMyChannel ? user?.id : routeChannelId;

  // Use createdBy from passed data if available, otherwise use channelId
  const userIdForApi = passedChannelData?.createdBy || channelId;

  console.log('[ChannelScreen] Route params and channel setup:', {
    routeParams: route.params,
    routeChannelId,
    passedChannelData,
    isMyChannel,
    channelId,
    userIdForApi,
    userId: user?.id
  });

  // TanStack Query hooks
  const {
    data: channelData,
    isLoading: channelLoading,
    refetch: refetchChannel,
    error: channelError
  } = useChannelData(Number(userIdForApi));

  const {
    data: videosData,
    isLoading: videosLoading,
    refetch: refetchVideos
  } = useChannelVideos(Number(userIdForApi), Number(user?.id), 0);

  const {
    data: shortsData,
    isLoading: shortsLoading,
    refetch: refetchShorts
  } = useChannelVideos(Number(userIdForApi), Number(user?.id), 1);



  // Mutations
  const updateChannelMutation = useUpdateChannel();

  // Transform channel data
  console.log('[ChannelScreen] Channel data received:', {
    status: channelData?.status,
    dataLength: channelData?.data?.length,
    firstChannel: channelData?.data?.[0],
    passedChannelData,
    channelLoading,
    channelError
  });

  // Use passed channel data if available, otherwise use API data
  const channelInfo: ChannelInfo | null = passedChannelData ? {
    channelId: String(passedChannelData.channelId),
    channelName: passedChannelData.channelName || 'Unknown Channel',
    description: passedChannelData.description || 'No description available',
    profileImage: passedChannelData.profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${channelId}`,
    coverImage: passedChannelData.coverImage,
    totalSubscribers: Number(passedChannelData.totalSubscribers || 0),
    totalVideos: Number(passedChannelData.totalVideos || 0),
    totalViews: Number(passedChannelData.totalViews || 0),
    isSubscribed: Boolean(passedChannelData.isSubscribed || false),
    isVerified: Boolean(passedChannelData.isVerified || false),
    createdDate: passedChannelData.createdDate || new Date().toISOString(),
    createdBy: Number(passedChannelData.createdBy || channelId),
  } : channelData?.data?.[0] ? {
    channelId: String(channelData.data[0].channelId),
    channelName: channelData.data[0].channelName || 'Unknown Channel',
    description: channelData.data[0].description || 'No description available',
    profileImage: channelData.data[0].profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${channelId}`,
    coverImage: channelData.data[0].profileCoverImage,
    totalSubscribers: Number(channelData.data[0].totalSubscribers || 0),
    totalVideos: Number((channelData.data[0].totalVideos || 0) + (channelData.data[0].totalShorts || 0) + (channelData.data[0].totalReels || 0)),
    totalViews: Number(channelData.data[0].total_ads_view || 0),
    isSubscribed: Boolean(channelData.data[0].isSubscribed),
    isVerified: Boolean(channelData.data[0].isVerified),
    createdDate: channelData.data[0].createddate || new Date().toISOString(),
    createdBy: Number(channelData.data[0].createdBy || channelId),
  } : null;

  // Fetch user data for About section
  const {
    data: userData,
    isLoading: userDataLoading
  } = useUserData(Number(userIdForApi));

  // Transform videos data
  const videos: Video[] = videosData?.pages?.flatMap(page => 
    page?.data?.map((video: any) => ({
      id: String(video.id),
      name: video.name || 'Untitled Video',
      videoThumbnail: video.video_Thumbnail || 'https://via.placeholder.com/320x180',
      playDuration: video.play_duration || '0:00',
      views: Number(video.total_views || 0),
      createdDate: video.createddate || new Date().toISOString(),
      description: video.video_desciption || '',
      videoType: 0,
      videoLink: video.video_link || '',
      is_shot: video.is_shot || 0,
    })) || []
  ) || [];

  // Transform shorts data
  const shorts: Video[] = shortsData?.pages?.flatMap(page => 
    page?.data?.map((video: any) => ({
      id: String(video.id),
      name: video.name || 'Untitled Short',
      videoThumbnail: video.video_Thumbnail || 'https://via.placeholder.com/180x320',
      playDuration: video.play_duration || '0:00',
      views: Number(video.total_views || 0),
      createdDate: video.createddate || new Date().toISOString(),
      description: video.video_desciption || '',
      videoType: 1,
      videoLink: video.video_link || '',
      is_shot: video.is_shot || 1,
    })) || []
  ) || [];



  // Handle channel error
  useEffect(() => {
    if (channelError) {
      Alert.alert('Error', 'Failed to load channel information');
    }
  }, [channelError]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchChannel(),
      refetchVideos(),
      refetchShorts()
    ]);
  }, [refetchChannel, refetchVideos, refetchShorts]);

  const handleFollow = async () => {
    if (!channelInfo || !user) return;

    try {
      setIsSubscribing(true);

      const followData = {
        userId: Number(user.id),
        channelId: channelInfo.createdBy,
        follow: channelInfo.isSubscribed ? 0 : 1, // 1 for follow, 0 for unfollow
      };

      await ApiService.saveChannelFollowers(followData);

      // Refetch channel data to get updated follow status
      refetchChannel();

    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleEditChannel = () => {
    if (!channelInfo) return;
    
    setEditingChannelName(channelInfo.channelName);
    setEditingDescription(channelInfo.description);
    setEditModalVisible(true);
  };

  const handleUpdateChannel = async () => {
    if (!channelInfo || !user) return;

    try {
      setIsUpdating(true);

      const updateData = {
        id: Number(channelInfo.channelId),
        channelName: editingChannelName,
        channelDescription: editingDescription,
        profileImageURL: channelInfo.profileImage,
      };

      await updateChannelMutation.mutateAsync(updateData);
      
      // The mutation will automatically invalidate and refetch the channel data
      setEditModalVisible(false);
      Alert.alert('Success', 'Channel updated successfully');
      
    } catch (error: any) {
      console.error('Error updating channel:', error);
      Alert.alert('Error', 'Failed to update channel');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVideoPress = useCallback(async (video: Video) => {
    console.log('[ChannelScreen] Video pressed:', { id: video.id, name: video.name, is_shot: video.is_shot });
    
    try {
      // For now, treat all videos as normal videos (not paid)
      // You can add paid video logic here if needed
      await ApiService.viewNormalVideo(Number(video.id));
      
      // Create video object for VideoPlayerModal
      const videoForPlayer = {
        id: Number(video.id),
        title: video.name,
        thumbnail: video.videoThumbnail,
        videoUrl: video.videoLink,
        duration: 0, // You might want to parse this from playDuration
        views: video.views,
        posted: video.createdDate,
        avatar: channelInfo?.profileImage,
        creatorName: channelInfo?.channelName || 'Unknown',
        isVerified: channelInfo?.isVerified || false,
        channelId: channelInfo?.channelId || '',
        price: 0,
        isPaidPromotional: 0,
        contentCreatorPlanId: 0,
      };

      // Get up next videos from current content
      const currentContent = videos;
      const upNextVideos = shuffleArray(currentContent.filter((v: Video) => v.id !== video.id))
        .slice(0, 10)
        .map((v: Video) => ({
          id: Number(v.id),
          title: v.name,
          thumbnail: v.videoThumbnail,
          videoUrl: v.videoLink,
          duration: 0,
          views: v.views,
          posted: v.createdDate,
          avatar: channelInfo?.profileImage,
          creatorName: channelInfo?.channelName || 'Unknown',
          isVerified: channelInfo?.isVerified || false,
          channelId: channelInfo?.channelId || '',
          price: 0,
          isPaidPromotional: 0,
          contentCreatorPlanId: 0,
        }));

      navigation.navigate('VideoPlayerModal', {
        video: videoForPlayer,
        cardLayout: null, // Add cardLayout parameter
        upNextVideos
      });
    } catch (error) {
      console.error('[ChannelScreen] Error handling video press:', error);
      Alert.alert('Error', 'There was an issue accessing this video. Please try again later.');
    }
  }, [channelInfo, selectedTab, videos, navigation]);

  const handleImageUpload = async (type: 'profile' | 'cover') => {
    if (!channelInfo || !user) return;

    try {
      setUploadingImage(true);

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: type === 'profile' ? 500 : 1200,
        maxHeight: type === 'profile' ? 500 : 600,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedImage = result.assets[0];
      if (!selectedImage.uri) return;

      // Upload to Cloudflare
      const uploadResult = await CloudflareUploadService.uploadFile(
        selectedImage.uri,
        'images',
        `${type}_${Date.now()}.jpg`,
        Number(user.id)
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update channel with new image URL
      const updateData = {
        id: Number(channelInfo.channelId),
        channelName: channelInfo.channelName,
        channelDescription: channelInfo.description,
        profileImageURL: type === 'profile' ? uploadResult.url : channelInfo.profileImage,
        coverImageURL: type === 'cover' ? uploadResult.url : channelInfo.coverImage,
      };

      const response = await ApiService.updateChannel(updateData);

      if (response.status === 200) {
        // The image upload is handled by the mutation, no need to manually update state
        // The channel data will be refetched automatically
        Alert.alert('Success', `${type === 'profile' ? 'Profile' : 'Cover'} image updated successfully`);
      } else {
        throw new Error(response.message || 'Failed to update image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
    >
      <Image source={{ uri: item.videoThumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoDuration}>
        <Text style={styles.videoDurationText}>{item.playDuration}</Text>
      </View>
      <View style={styles.playButton}>
        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
      </View>
      <View style={styles.videoInfo}>
        <Text
          style={[styles.videoTitle, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={[styles.videoStats, { color: colors.text.secondary }]}>
          {formatNumber(item.views)} views • {formatDate(item.createdDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderShortItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.shortItem}
      onPress={() => handleVideoPress(item)}
    >
      <Image source={{ uri: item.videoThumbnail }} style={styles.shortThumbnail} />
      <View style={styles.shortDuration}>
        <Text style={styles.videoDurationText}>{item.playDuration}</Text>
      </View>
      <View style={styles.shortPlayButton}>
        <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
      </View>
      <Text
        style={[styles.shortTitle, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text style={[styles.shortViews, { color: colors.text.secondary }]}>
        {formatNumber(item.views)} views
      </Text>
    </TouchableOpacity>
  );



  const renderAboutTab = () => (
    <View style={styles.aboutContainer}>
      <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>
        About {channelInfo?.channelName}
      </Text>

      {/* Channel Description */}
      <Text style={[styles.aboutDescription, { color: colors.text.secondary }]}>
        {channelInfo?.description}
      </Text>

      {/* User Information Section */}
      {userDataLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
      ) : userData && (
        <View style={styles.userInfoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Creator Information
          </Text>

          {userData.name && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Name:</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>{userData.name}</Text>
            </View>
          )}

          {userData.address && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Location:</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>{userData.address}</Text>
            </View>
          )}

          {userData.country && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Country:</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>{userData.country}</Text>
            </View>
          )}

          {userData.bio && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Bio:</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>{userData.bio}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Users size={24} color={colors.text.secondary} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {formatNumber(channelInfo?.totalSubscribers || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Followers
          </Text>
        </View>
        <View style={styles.statItem}>
          <Play size={24} color={colors.text.secondary} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {formatNumber(channelInfo?.totalVideos || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Videos
          </Text>
        </View>
        <View style={styles.statItem}>
          <Eye size={24} color={colors.text.secondary} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {formatNumber(channelInfo?.totalViews || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total Views
          </Text>
        </View>
      </View>

      <View style={styles.joinedSection}>
        <Calendar size={16} color={colors.text.secondary} />
        <Text style={[styles.joinedDate, { color: colors.text.secondary }]}>
          Joined {formatDate(channelInfo?.createdDate || '')}
        </Text>
      </View>
    </View>
  );

  const onRefresh = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Content Creator Premium Toggle Handler
  const handleTogglePremium = useCallback(() => {
    console.log('🚀 [ChannelScreen] User clicked content creator premium toggle');
    console.log('📊 [ChannelScreen] Current content creator premium status:', {
      isContentCreatorPremium,
      hasData: !!contentCreatorPremiumData
    });
    navigation.navigate('ContentCreatorPremium');
  }, [isContentCreatorPremium, contentCreatorPremiumData, navigation]);

  if (channelLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="My Channel"
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading channel...
          </Text>
        </View>
      </View>
    );
  }

  if (!channelInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="My Channel"
          showSearch={false}
          showWallet={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            Channel not found
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => handleRefresh()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="My Channel"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          isMyChannel ? (
            <View style={styles.headerRight}>
              {/* Content Creator Premium Toggle */}
              <ContentCreatorPlanToggle onPress={handleTogglePremium} />
            </View>
          ) : null
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={channelLoading} onRefresh={onRefresh} />
        }
      >
        {/* Channel Banner */}
        <TouchableOpacity 
          style={styles.bannerContainer}
          onPress={() => isMyChannel && handleImageUpload('cover')}
          disabled={!isMyChannel || uploadingImage}
        >
          {channelInfo.coverImage && (
            <Image source={{ uri: channelInfo.coverImage }} style={styles.banner} />
          )}
          {isMyChannel && (
            <View style={styles.bannerEditOverlay}>
              <Camera size={20} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Channel Header */}
        <View style={[styles.channelHeader, { backgroundColor: colors.background }]}>
          <View style={styles.channelInfoRow}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => isMyChannel && handleImageUpload('profile')}
              disabled={!isMyChannel || uploadingImage}
            >
              <Image source={{ uri: channelInfo.profileImage }} style={styles.avatar} />
              {isMyChannel && (
                <View style={[styles.avatarEditOverlay, { backgroundColor: colors.primary }]}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.channelDetails}>
              <View style={styles.channelNameRow}>
                <Text style={[styles.channelName, { color: colors.text.primary }]}>
                  {channelInfo.channelName}
                </Text>
                {channelInfo.isVerified && (
                  <CheckCircle size={20} color={colors.primary} style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={[styles.subscriberCount, { color: colors.text.secondary }]}>
                {formatNumber(channelInfo.totalSubscribers)} subscribers • {formatNumber(channelInfo.totalVideos)} videos
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isMyChannel ? (
              <TouchableOpacity
                style={[styles.editButton, { borderColor: colors.primary }]}
                onPress={handleEditChannel}
              >
                <Edit3 size={16} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  {
                    backgroundColor: channelInfo.isSubscribed ? colors.surface : colors.primary,
                    borderWidth: channelInfo.isSubscribed ? 1 : 0,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handleFollow}
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <ActivityIndicator size="small" color={channelInfo.isSubscribed ? colors.text.primary : '#FFFFFF'} />
                ) : (
                  <>
                    {channelInfo.isSubscribed ? (
                      <BellOff size={16} color={colors.text.primary} />
                    ) : (
                      <Bell size={16} color="#FFFFFF" />
                    )}
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        { color: channelInfo.isSubscribed ? colors.text.primary : '#FFFFFF', marginLeft: 8 }
                      ]}
                    >
                      {channelInfo.isSubscribed ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Container */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>


          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'videos' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('videos')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'videos' ? colors.primary : colors.text.secondary }
              ]}
            >
              Videos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'about' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'about' ? colors.primary : colors.text.secondary }
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Communication Features */}
        <ChannelCommunicationButtons
          channelInfo={{
            channelId: channelInfo.channelId,
            channelName: channelInfo.channelName,
            createdBy: channelInfo.createdBy,
            isSubscribed: channelInfo.isSubscribed,
          }}
          isMyChannel={isMyChannel}
        />

        {/* Tab Content */}
        {selectedTab === 'videos' && (
          <View style={styles.tabContent}>
            {videosLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.tabLoading} />
            ) : videos.length > 0 ? (
              <FlatList
                data={videos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                  No videos available
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'about' && renderAboutTab()}
      </ScrollView>

      {/* Edit Channel Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Edit Channel
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Channel Name
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border
                }]}
                value={editingChannelName}
                onChangeText={setEditingChannelName}
                placeholder="Enter channel name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border
                }]}
                value={editingDescription}
                onChangeText={setEditingDescription}
                placeholder="Enter channel description"
                placeholderTextColor={colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
                disabled={isUpdating}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateChannel}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.planModalBackdrop}>
          <View style={styles.planModalContent}>
            <View style={styles.planModalHeader}>
              <Text style={styles.planModalTitle}>Content Creator Plans</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Text style={styles.planModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.planComparisonRow}>
              <View style={styles.planCardFree}>
                <Text style={styles.planCardTitleFree}>Free</Text>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>No earnings for uploads on TipTube & TipShort.</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Free Video upload only</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Earn 0.06 paisa per ad view</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Fan Call to earn 0.60 paisa <Text style={styles.planCardComing}> (coming soon)</Text></Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Fan Video to earn 1 rs/- <Text style={styles.planCardComing}> (coming soon)</Text></Text></View>
              </View>
              <View style={styles.planCardPremium}>
                <Text style={styles.planCardTitlePremium}>Premium</Text>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Earnings for uploads on TipTube & TipShort</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Free & Paid video upload</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={[styles.planCardText, styles.planCardHighlight]}>To earn upto 10000/- rs per ad view</Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Fan call to earn 4 rs/- <Text style={styles.planCardComing}> (coming soon)</Text></Text></View>
                <View style={styles.planCardItem}><Text style={styles.planCardIcon}>✔️</Text><Text style={styles.planCardText}>Fan Video to earn 8 rs/- <Text style={styles.planCardComing}> (coming soon)</Text></Text></View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  bannerEditOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelHeader: {
    padding: 16,
  },
  channelInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  subscriberCount: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  subscribeButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
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
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    minHeight: 200,
  },
  tabLoading: {
    marginTop: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  videoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
    marginRight: 12,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  playButton: {
    position: 'absolute',
    top: 24,
    left: 64,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoStats: {
    fontSize: 12,
  },
  shortsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  shortItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  shortThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  shortDuration: {
    position: 'absolute',
    bottom: 50,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortPlayButton: {
    position: 'absolute',
    top: 70,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  shortViews: {
    fontSize: 12,
  },
  aboutContainer: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  joinedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '92%',
    maxWidth: 420,
  },
  planModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009688',
  },
  planModalClose: {
    fontSize: 22,
    color: '#333',
    padding: 4,
  },
  planComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planCardFree: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 14,
    marginRight: 8,
  },
  planCardPremium: {
    flex: 1,
    backgroundColor: '#009688',
    borderRadius: 12,
    padding: 14,
    marginLeft: 8,
  },
  planCardTitleFree: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  planCardTitlePremium: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  planCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planCardIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#fff',
  },
  planCardText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  planCardComing: {
    color: '#e0f2f1',
    fontSize: 13,
  },
  planCardHighlight: {
    color: '#ffd600',
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoSection: {
    marginVertical: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },

});

export default ChannelScreen;
