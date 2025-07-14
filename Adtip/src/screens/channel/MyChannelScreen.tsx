import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import { launchImageLibrary } from 'react-native-image-picker';
import Header from '../../components/common/Header';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import ApiService from '../../services/ApiService';
import { 
  ChannelInfo, 
  Video, 
  VideoListResponse, 
  FollowUserRequest,
  UpdateChannelRequest,
  ChannelAnalyticsResponse 
} from '../../types/api';
import { Play, Calendar, Users, Eye, Settings, Edit3, Upload, BarChart3 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  TabHome: undefined;
  CreateChannel: undefined;
  ChannelSettings: undefined;
  TipTubeUpload: undefined;
  TipShortsUpload: undefined;
  Analytics: { channelId: string };
  VideoPreview: { postId: string };
  EditChannel: { channelId: string };
  ContentCreatorPremium: undefined;
};

type NavigationPropType = NavigationProp<RootStackParamList>;

interface ChannelData {
  channelId: string;
  channelName: string;
  description: string;
  profileImage?: string;
  coverImage?: string;
  totalSubscribers: number;
  totalViews: number;
  totalVideos: number;
  totalEarnings: number;
  isCallEnabled?: boolean;
  createdDate: string;
}

const MyChannelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // State management
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [analytics, setAnalytics] = useState<ChannelAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'Videos' | 'Shorts' | 'Analytics' | 'About'>('Videos');
  const [isCallEnabled, setIsCallEnabled] = useState(false);
  const [isVideoCallEnabled, setIsVideoCallEnabled] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);

  // Content Creator Premium State - Using shared context
  const { 
    isContentCreatorPremium, 
    contentCreatorPremiumData, 
    refreshContentCreatorPremiumStatus,
    isLoading: contentCreatorPremiumLoading 
  } = useContentCreatorPremium();

  // Log when component mounts
  useEffect(() => {
    console.log('🏠 [MyChannelScreen] Component mounted for user:', user?.id);
  }, [user?.id]);

  // Log when content creator premium status changes
  useEffect(() => {
    console.log('🔄 [MyChannelScreen] Content creator premium status changed:', {
      isContentCreatorPremium,
      hasData: !!contentCreatorPremiumData,
      data: contentCreatorPremiumData ? {
        planName: contentCreatorPremiumData.plan_name,
        amount: contentCreatorPremiumData.amount,
        status: contentCreatorPremiumData.status
      } : null
    });
  }, [isContentCreatorPremium, contentCreatorPremiumData]);

  // Fetch channel data using ApiService
  const fetchChannelData = useCallback(async () => {
    console.log('🚀 [MyChannelScreen] Fetching channel data for user:', user?.id);
    
    if (!user?.id) {
      console.error('❌ [MyChannelScreen] User not authenticated');
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      console.log('📡 [MyChannelScreen] Making API call to getChannelByUserId...');
      const response = await ApiService.getChannelByUserId(Number(user.id));
      console.log('📥 [MyChannelScreen] Channel data API response:', {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.length
      });
      
      if (response.status === 200 && response.data && response.data.length > 0) {
        const channelData = response.data[0];
        setChannel({
          channelId: String(channelData.channelId),
          channelName: channelData.channelName,
          description: channelData.description || 'No description available',
          profileImage: channelData.profileImage,
          coverImage: channelData.profileCoverImage, // Corrected from coverImage
          totalSubscribers: Number(channelData.totalSubscribers) || 0,
          totalViews: Number(channelData.total_ads_view) || 0, // Corrected from totalViews
          totalVideos: Number((channelData.totalVideos || 0) + (channelData.totalShorts || 0) + (channelData.totalReels || 0)),
          totalEarnings: Number(channelData.total_earnings) || 0, // Corrected from hardcoded 0
          createdDate: channelData.createddate || new Date().toISOString(), // Corrected from createdDate
          isCallEnabled: channelData.isCallEnabled || false,
        });

        // Fetch videos and shorts for this channel
        await fetchChannelContent(channelData.channelId);
        await fetchChannelAnalytics(channelData.channelId);
      } else {
        setError('No channel found for this user');
      }
    } catch (err: any) {
      console.error('Error fetching channel data:', err);
      setError(err.message || 'Failed to load channel data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Fetch channel content (videos and shorts)
  const fetchChannelContent = async (channelId: string) => {
    try {      const videosResponse = await ApiService.getVideoByChannel(0, Number(channelId), Number(user?.id));
      if (videosResponse.status === 200 && videosResponse.data) {
        const allVideos = videosResponse.data;
        setVideos(allVideos.filter((video: any) => video.videoType === 0)); // TipTube videos
        
        // Fetch shorts separately
        const shortsResponse = await ApiService.getVideoByChannel(1, Number(channelId), Number(user?.id));
        if (shortsResponse.status === 200 && shortsResponse.data) {
          setShorts(shortsResponse.data);
        }
      }
    } catch (err) {
      console.error('Error fetching channel content:', err);
    }
  };

  // Fetch channel analytics
  const fetchChannelAnalytics = async (channelId: string) => {
    try {
      const analyticsResponse = await ApiService.getChannelAnalytics(channelId);
      if (analyticsResponse.status === true && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchChannelData();
  }, [fetchChannelData]);

  // Content Creator Premium Toggle Handler
  const handleTogglePremium = useCallback(() => {
    console.log('🚀 [MyChannelScreen] User clicked content creator premium toggle');
    console.log('📊 [MyChannelScreen] Current content creator premium status:', {
      isContentCreatorPremium,
      hasData: !!contentCreatorPremiumData
    });
    navigation.navigate('ContentCreatorPremium');
  }, [isContentCreatorPremium, contentCreatorPremiumData, navigation]);

  // Handle avatar change
  const handleAvatarChange = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      },
      (result) => {
        if (result.errorCode) {
          Alert.alert('Error', `Failed to pick image: ${result.errorMessage}`);
          return;
        }

        if (result.didCancel || !result.assets || result.assets.length === 0) {
          return;
        }

        const selectedImage = result.assets[0];
        if (selectedImage.uri) {
          // Here you would upload the image and update the channel
          updateChannelAvatar(selectedImage.uri);
        }
      }
    );
  };

  // Update channel avatar
  const updateChannelAvatar = async (imageUri: string) => {
    if (!channel) return;

    try {
      const formData = new FormData();
      formData.append('channelId', channel.channelId);
      formData.append('profileImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${user?.id}.jpg`,
      } as any);

      // Use update channel endpoint
      const updateData: UpdateChannelRequest = {
        id: Number(channel.channelId),
        channelName: channel.channelName,
        channelDescription: channel.description,
        profileImageURL: imageUri,
      };

      const response = await ApiService.updateChannel(updateData);
      if (response.status === 200) {
        setChannel(prev => prev ? { ...prev, profileImage: imageUri } : null);
        Alert.alert('Success', 'Profile image updated successfully');
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  // Toggle call settings
  const toggleCallSetting = async (settingType: 'call' | 'videoCall' | 'chat', value: boolean) => {
    console.log('🔄 [MyChannelScreen] Toggling call setting:', { settingType, value, channelId: channel?.channelId });
    
    if (!channel) {
      console.error('❌ [MyChannelScreen] No channel available for toggle');
      return;
    }

    try {
      console.log('📡 [MyChannelScreen] Making API call to updateChannel...');
      const updateData: UpdateChannelRequest = {
        id: Number(channel.channelId),
        channelName: channel.channelName,
        channelDescription: channel.description,
        profileImageURL: channel.profileImage || '',
      };

      const response = await ApiService.updateChannel(updateData);
      console.log('📥 [MyChannelScreen] Update channel API response:', {
        status: response.status,
        data: response.data
      });
      
      if (response.status === 200) {
        console.log('✅ [MyChannelScreen] Channel settings updated successfully');
        setChannel(prev => prev ? { ...prev, isCallEnabled: value } : null);
        
        // Update local state
        switch (settingType) {
          case 'call':
            setIsCallEnabled(value);
            break;
          case 'videoCall':
            setIsVideoCallEnabled(value);
            break;
          case 'chat':
            setIsChatEnabled(value);
            break;
        }
      } else {
        console.log('❌ [MyChannelScreen] Failed to update channel settings');
      }
    } catch (err: any) {
      console.error('❌ [MyChannelScreen] Error updating call settings:', {
        error: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  // Focus effect to refresh data
  useFocusEffect(
    useCallback(() => {
      fetchChannelData();
    }, [fetchChannelData])
  );

  // Render video item
  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => navigation.navigate('VideoPreview', { postId: item.id })}
    >
      <Image source={{ uri: item.videoThumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoOverlay}>
        <View style={styles.videoDuration}>
          <Text style={styles.videoDurationText}>{item.playDuration}</Text>
        </View>
      </View>
      <Text style={[styles.videoTitle, { color: colors.text.primary }]} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.videoStats}>
        <Text style={[styles.videoStatsText, { color: colors.textSecondary }]}>
          {item.views} views • {new Date(item.createdDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render analytics section
  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.analyticsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Channel Analytics</Text>
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={() => navigation.navigate('Analytics', { channelId: channel?.channelId || '' })}
        >
          <BarChart3 size={20} color={colors.primary} />
          <Text style={[styles.analyticsButtonText, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <Eye size={24} color={colors.primary} />
          <Text style={[styles.analyticsValue, { color: colors.text.primary }]}>
            {(channel?.totalViews || 0).toLocaleString()}
          </Text>
          <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Total Views</Text>
        </View>
        
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <Users size={24} color={colors.primary} />
          <Text style={[styles.analyticsValue, { color: colors.text.primary }]}>
            {(channel?.totalSubscribers || 0).toLocaleString()}
          </Text>
          <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Subscribers</Text>
        </View>
        
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <Play size={24} color={colors.primary} />
          <Text style={[styles.analyticsValue, { color: colors.text.primary }]}>
            {(channel?.totalVideos || 0).toLocaleString()}
          </Text>
          <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Videos</Text>
        </View>
        
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <Calendar size={24} color={colors.primary} />
          <Text style={[styles.analyticsValue, { color: colors.text.primary }]}>
            {channel ? new Date(channel.createdDate).getFullYear() : 'N/A'}
          </Text>
          <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Joined</Text>
        </View>
      </View>
    </View>
  );

  // Render about section
  const renderAbout = () => (
    <View style={styles.aboutContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
      <Text style={[styles.channelDescription, { color: colors.textSecondary }]}>
        {channel?.description || 'No description available'}
      </Text>
      
      <View style={styles.aboutStats}>
        <View style={styles.aboutStat}>
          <Text style={[styles.aboutStatLabel, { color: colors.textSecondary }]}>Joined</Text>
          <Text style={[styles.aboutStatValue, { color: colors.text.primary }]}>
            {channel ? new Date(channel.createdDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.aboutStat}>
          <Text style={[styles.aboutStatLabel, { color: colors.textSecondary }]}>Total Views</Text>
          <Text style={[styles.aboutStatValue, { color: colors.text.primary }]}>
            {(channel?.totalViews || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Call Settings */}
      <View style={styles.callSettings}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Call Settings</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Enable Voice Calls</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Allow followers to make voice calls to you
            </Text>
          </View>
          <Switch
            value={isCallEnabled}
            onValueChange={(value) => toggleCallSetting('call', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isCallEnabled ? colors.background : colors.textSecondary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Enable Video Calls</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Allow followers to make video calls to you
            </Text>
          </View>
          <Switch
            value={isVideoCallEnabled}
            onValueChange={(value) => toggleCallSetting('videoCall', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isVideoCallEnabled ? colors.background : colors.textSecondary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Enable Chat</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Allow followers to send you messages
            </Text>
          </View>
          <Switch
            value={isChatEnabled}
            onValueChange={(value) => toggleCallSetting('chat', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isChatEnabled ? colors.background : colors.textSecondary}
          />
        </View>
      </View>

      {/* Content Creator Premium Section */}
      <View style={styles.callSettings}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Content Creator Premium</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
              {isContentCreatorPremium ? 'Premium Active' : 'Upgrade to Premium'}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
              {isContentCreatorPremium 
                ? `Current plan: ${contentCreatorPremiumData?.plan_name || 'Premium Plan'}`
                : 'Get access to premium content creation features'
              }
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.premiumToggle,
              { 
                backgroundColor: isContentCreatorPremium ? '#10B981' : '#EF4444',
                opacity: contentCreatorPremiumLoading ? 0.6 : 1
              }
            ]}
            onPress={() => {
              console.log('🚀 [MyChannelScreen] User clicked content creator premium toggle');
              console.log('📊 [MyChannelScreen] Current content creator premium status:', { 
                isContentCreatorPremium, 
                hasData: !!contentCreatorPremiumData 
              });
              navigation.navigate('ContentCreatorPremium');
            }}
            disabled={contentCreatorPremiumLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.premiumToggleText}>
              {contentCreatorPremiumLoading ? '...' : (isContentCreatorPremium ? 'Active' : 'Inactive')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Videos':
        return (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.videoRow}
            contentContainerStyle={styles.videosList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Upload size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No videos uploaded yet
                </Text>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('TipTubeUpload')}
                >
                  <Text style={[styles.uploadButtonText, { color: colors.background }]}>
                    Upload Video
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        );
      case 'Shorts':
        return (
          <FlatList
            data={shorts}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.shortsRow}
            contentContainerStyle={styles.videosList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Upload size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No shorts uploaded yet
                </Text>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('TipShortsUpload')}
                >
                  <Text style={[styles.uploadButtonText, { color: colors.background }]}>
                    Upload Short
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        );
      case 'Analytics':
        return renderAnalytics();
      case 'About':
        return renderAbout();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading channel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchChannelData}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>No channel found</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateChannel')}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Create Channel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>My Channel</Text>
          <View style={styles.headerRight}>
            {/* Content Creator Premium Toggle */}
            <ContentCreatorPlanToggle onPress={handleTogglePremium} />
            <TouchableOpacity onPress={() => navigation.navigate('ChannelSettings')}>
              <Settings size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cover Image */}
        {channel.coverImage && (
          <Image source={{ uri: channel.coverImage }} style={styles.coverImage} />
        )}

        {/* Channel Info */}
        <View style={styles.channelInfo}>
          <TouchableOpacity onPress={handleAvatarChange} style={styles.avatarContainer}>
            <Image
              source={{
                uri: channel.profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.id}`,
              }}
              style={styles.avatar}
            />
            <View style={[styles.editAvatarOverlay, { backgroundColor: colors.primary }]}>
              <Edit3 size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.channelDetails}>
            <Text style={[styles.channelName, { color: colors.text.primary }]}>{channel.channelName}</Text>
            <Text style={[styles.channelStats, { color: colors.textSecondary }]}>
              {(channel.totalSubscribers || 0).toLocaleString()} subscribers • {channel.totalVideos} videos
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('EditChannel', { channelId: channel.channelId })}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Channel</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          {(['Videos', 'Shorts', 'Analytics', 'About'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPremiumToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  headerPremiumToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coverImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelDetails: {
    flex: 1,
    marginLeft: 16,
  },
  channelName: {
    fontSize: 20,
    fontWeight: '700',
  },
  channelStats: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  videosList: {
    padding: 16,
  },
  videoRow: {
    justifyContent: 'space-between',
  },
  shortsRow: {
    justifyContent: 'space-between',
  },
  videoItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  videoThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  videoDuration: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  videoStats: {
    marginTop: 4,
  },
  videoStatsText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  uploadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  aboutContainer: {
    padding: 16,
  },
  channelDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  aboutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  aboutStat: {
    flex: 1,
  },
  aboutStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  aboutStatValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  callSettings: {
    marginTop: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },

});

export default MyChannelScreen;
