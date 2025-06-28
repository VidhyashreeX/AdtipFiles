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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService';
import { CheckCircle, Play, Calendar, Users, Eye, Bell, BellOff } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';

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
}

const ChannelScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [selectedTab, setSelectedTab] = useState<'videos' | 'shorts' | 'about'>('videos');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);
  const [shortsLoading, setShortsLoading] = useState(false);

  // Get channel ID from route params
  // Note: Despite being called 'channelId', this parameter may contain userId
  // when navigated from ProfileScreen, since the API expects userId
  const routeChannelId = (route.params as any)?.channelId || (route.params as any)?.userId;
  const isMyChannel = !routeChannelId || String(routeChannelId) === String(user?.id);
  
  // For the API call, we use the route parameter (which should contain userId for API compatibility)
  const channelId = isMyChannel ? user?.id : routeChannelId;

  const loadChannelData = useCallback(async () => {
    if (!channelId) {
      Alert.alert('Error', 'User ID not provided');
      return;
    }

    try {
      if (!refreshing) setLoading(true);

      // Get channel information using userId (the channelId parameter should now contain the userId)
      // The API expects userId, so we pass the channelId which now contains the userId
      const channelResponse = await ApiService.getChannelByUserId(channelId);
      
      if (channelResponse.status === 200 && channelResponse.data && channelResponse.data.length > 0) {
        const channel = channelResponse.data[0];
        
        const channelInfo: ChannelInfo = {
          channelId: String(channel.channelId),
          channelName: channel.channelName || 'Unknown Channel',
          description: channel.description || 'No description available',
          profileImage: channel.profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${channelId}`,
          coverImage: channel.profileCoverImage,
          totalSubscribers: Number(channel.totalSubscribers || 0),
          totalVideos: Number(channel.totalVideos || 0),
          totalViews: Number(channel.total_ads_view || 0),
          isSubscribed: Boolean(channel.isSubscribed),
          isVerified: Boolean(channel.isVerified),
          createdDate: channel.createddate || new Date().toISOString(),
          createdBy: Number(channel.createdBy || channelId),
        };

        setChannelInfo(channelInfo);
      } else {
        throw new Error('Channel not found');
      }

    } catch (error: any) {
      console.error('Error loading channel data:', error);
      Alert.alert('Error', 'Failed to load channel information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [channelId, refreshing]);

  const loadVideos = useCallback(async () => {
    if (!channelInfo || !user) return;

    try {
      setVideosLoading(true);
      
      // Load TipTube videos (videoType = 0)
      const videosResponse = await ApiService.getVideoByChannel(0, Number(channelInfo.channelId), Number(user.id));
      
      if (videosResponse.status === 200 && videosResponse.data) {
        const formattedVideos: Video[] = videosResponse.data.map((video: any) => ({
          id: String(video.id),
          name: video.name || video.title || 'Untitled Video',
          videoThumbnail: video.videoThumbnail || video.thumbnail || 'https://via.placeholder.com/320x180',
          playDuration: video.playDuration || video.duration || '0:00',
          views: Number(video.views || 0),
          createdDate: video.createdDate || video.created_at || new Date().toISOString(),
          description: video.description || '',
          videoType: 0,
          videoLink: video.videoLink || video.video_url || '',
        }));
        
        setVideos(formattedVideos);
      }
    } catch (error: any) {
      console.error('Error loading videos:', error);
    } finally {
      setVideosLoading(false);
    }
  }, [channelInfo, user]);

  const loadShorts = useCallback(async () => {
    if (!channelInfo || !user) return;

    try {
      setShortsLoading(true);
      
      // Load TipShorts videos (videoType = 1)
      const shortsResponse = await ApiService.getVideoByChannel(1, Number(channelInfo.channelId), Number(user.id));
      
      if (shortsResponse.status === 200 && shortsResponse.data) {
        const formattedShorts: Video[] = shortsResponse.data.map((video: any) => ({
          id: String(video.id),
          name: video.name || video.title || 'Untitled Short',
          videoThumbnail: video.videoThumbnail || video.thumbnail || 'https://via.placeholder.com/180x320',
          playDuration: video.playDuration || video.duration || '0:00',
          views: Number(video.views || 0),
          createdDate: video.createdDate || video.created_at || new Date().toISOString(),
          description: video.description || '',
          videoType: 1,
          videoLink: video.videoLink || video.video_url || '',
        }));
        
        setShorts(formattedShorts);
      }
    } catch (error: any) {
      console.error('Error loading shorts:', error);
    } finally {
      setShortsLoading(false);
    }
  }, [channelInfo, user]);

  useEffect(() => {
    loadChannelData();
  }, [loadChannelData]);

  useEffect(() => {
    if (channelInfo) {
      if (selectedTab === 'videos') {
        loadVideos();
      } else if (selectedTab === 'shorts') {
        loadShorts();
      }
    }
  }, [channelInfo, selectedTab, loadVideos, loadShorts]);

  const handleSubscribe = async () => {
    if (!channelInfo || !user) return;

    try {
      setIsSubscribing(true);

      const followData = {
        followingId: channelInfo.createdBy,
        followerId: Number(user.id),
        action: channelInfo.isSubscribed ? 'unfollow' : 'follow' as 'follow' | 'unfollow',
      };

      const response = await ApiService.followUser(followData);

      if (response.status) {
        setChannelInfo(prev => prev ? {
          ...prev,
          isSubscribed: !prev.isSubscribed,
          totalSubscribers: prev.isSubscribed ? 
            Math.max(0, prev.totalSubscribers - 1) : 
            prev.totalSubscribers + 1,
        } : null);
      } else {
        throw new Error(response.message || 'Failed to update subscription');
      }
    } catch (error: any) {
      console.error('Error subscribing/unsubscribing:', error);
      Alert.alert('Error', 'Failed to update subscription');
    } finally {
      setIsSubscribing(false);
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
      onPress={() => {
        if (item.videoType === 0) {
          // Navigate to TipTube video
          navigation.navigate('Video', { postId: Number(item.id) });
        } else {
          // Navigate to TipShorts
          navigation.navigate('TipShorts', { shortId: item.id });
        }
      }}
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
      onPress={() => navigation.navigate('TipShorts', { shortId: item.id })}
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
      
      <Text style={[styles.aboutDescription, { color: colors.text.secondary }]}>
        {channelInfo?.description}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Users size={24} color={colors.text.secondary} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {formatNumber(channelInfo?.totalSubscribers || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Subscribers
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
    setRefreshing(true);
    loadChannelData();
  }, [loadChannelData]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Channel" showBackButton />
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
        <Header title="Channel" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            Channel not found
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => loadChannelData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={channelInfo.channelName} showBackButton />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Channel Banner */}
        {channelInfo.coverImage && (
          <Image source={{ uri: channelInfo.coverImage }} style={styles.banner} />
        )}

        {/* Channel Header */}
        <View style={[styles.channelHeader, { backgroundColor: colors.background }]}>
          <View style={styles.channelInfoRow}>
            <Image source={{ uri: channelInfo.profileImage }} style={styles.avatar} />
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

          {/* Subscribe Button */}
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              {
                backgroundColor: channelInfo.isSubscribed ? colors.surface : colors.primary,
                borderWidth: channelInfo.isSubscribed ? 1 : 0,
                borderColor: colors.border,
              }
            ]}
            onPress={handleSubscribe}
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
                  {channelInfo.isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
              selectedTab === 'shorts' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('shorts')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'shorts' ? colors.primary : colors.text.secondary }
              ]}
            >
              Shorts
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

        {selectedTab === 'shorts' && (
          <View style={styles.tabContent}>
            {shortsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.tabLoading} />
            ) : shorts.length > 0 ? (
              <FlatList
                data={shorts}
                renderItem={renderShortItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.shortsRow}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                  No shorts available
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'about' && renderAboutTab()}
      </ScrollView>
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
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  channelHeader: {
    padding: 16,
  },
  channelInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
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
});

export default ChannelScreen;
