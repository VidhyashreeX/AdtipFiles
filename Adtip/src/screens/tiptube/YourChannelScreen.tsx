import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Star, Edit, BarChart3, Upload, MoreVertical, Trash2, Edit3 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import ApiService from '../../services/ApiService';
import {
  ChannelInfo,
  Video,
  VideoListResponse
} from '../../types/api';
import {
  getSecureMediaUrl,
  getFallbackAvatarUrl,
  getFallbackThumbnailUrl
} from '../../utils/mediaUtils';
import ComingSoonModal from '../../components/modals/ComingSoonModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 videos per row
const VIDEO_CARD_HEIGHT = VIDEO_CARD_WIDTH * 0.6; // 16:10 aspect ratio

const YourChannelScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isContentCreatorPremium, contentCreatorPremiumData } = useContentCreatorPremium();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Home');

  // State for channel data
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  const styles = createStyles(colors, isDarkMode, insets.top);

  const tabs = ['Home', 'InShorts', 'Products'];

  // Fetch channel data using ApiService (same pattern as MyChannelScreen)
  const fetchChannelData = useCallback(async () => {
    console.log('🚀 [YourChannelScreen] Fetching channel data for user:', user?.id);

    if (!user?.id) {
      console.error('❌ [YourChannelScreen] User not authenticated');
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      console.log('📡 [YourChannelScreen] Making API call to getChannelByUserId...');
      const response = await ApiService.getChannelByUserId(Number(user.id));
      console.log('📥 [YourChannelScreen] Channel data API response:', {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.length
      });

      if (response.status === 200 && response.data && response.data.length > 0) {
        const channelData = response.data[0];
        console.log('✅ [YourChannelScreen] Channel data found:', channelData);

        setChannel({
          channelId: String(channelData.channelId),
          channelName: channelData.channelName,
          description: channelData.description || '',
          profileImage: channelData.profileImage ? await getSecureMediaUrl(channelData.profileImage) : getFallbackAvatarUrl(user.id),
          totalSubscribers: Number(channelData.totalSubscribers) || 0,
          totalVideos: Number(channelData.totalVideos) || 0,
          totalViews: Number(channelData.total_ads_view) || 0,
          isSubscribed: false,
          isVerified: false,
          createdDate: channelData.createddate || new Date().toISOString(),
          createdBy: channelData.createdby || Number(user.id),
          isCallEnabled: channelData.isCallEnabled || false,
        });

        // Fetch videos and shorts for this channel
        await fetchChannelContent(channelData.channelId);
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
    try {
      console.log('🎥 [YourChannelScreen] Fetching videos for channel:', channelId);

      // Use correct videoType: 0 for videos (is_shot=0), 1 for shorts (is_shot=1)
      const videosResponse = await ApiService.getVideoByChannel(0, Number(channelId), Number(user?.id));
      console.log('📹 [YourChannelScreen] Videos response:', {
        status: videosResponse.status,
        dataLength: videosResponse.data?.length,
        data: videosResponse.data
      });

      if (videosResponse.status === 200 && videosResponse.data) {
        setVideos(videosResponse.data);
      } else {
        setVideos([]);
      }

      // Fetch shorts separately
      console.log('🎬 [YourChannelScreen] Fetching shorts for channel:', channelId);
      const shortsResponse = await ApiService.getVideoByChannel(1, Number(channelId), Number(user?.id));
      console.log('🎬 [YourChannelScreen] Shorts response:', {
        status: shortsResponse.status,
        dataLength: shortsResponse.data?.length,
        data: shortsResponse.data
      });

      if (shortsResponse.status === 200 && shortsResponse.data) {
        setShorts(shortsResponse.data);
      } else {
        setShorts([]);
      }
    } catch (err) {
      console.error('Error fetching channel content:', err);
      setVideos([]);
      setShorts([]);
    }
  };

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchChannelData();
  }, [fetchChannelData]);

  // Load data on component mount
  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleVideoManagement = () => {
    // Navigate to TipTube upload screen
    navigation.navigate('TipTubeUpload' as never);
  };

  const handleEditChannel = () => {
    // Navigate to edit channel screen with channelId
    if (channel?.channelId) {
      navigation.navigate('EditChannel' as never, { channelId: channel.channelId });
    } else {
      console.warn('[YourChannelScreen] No channelId available for editing');
      // Show error or redirect to create channel
      navigation.navigate('CreateChannel' as never);
    }
  };

  const handleAnalytics = () => {
    // Navigate to analytics screen with proper channelId
    if (channel?.channelId) {
      navigation.navigate('Analytics' as never, { channelId: channel.channelId });
    } else {
      console.warn('[YourChannelScreen] No channelId available for analytics');
      // Show error or redirect to create channel
      navigation.navigate('CreateChannel' as never);
    }
  };

  const handlePaidVideoAnalytics = () => {
    // Navigate to analytics screen with proper channelId (same as regular analytics)
    if (channel?.channelId) {
      navigation.navigate('Analytics' as never, { channelId: channel.channelId });
    } else {
      console.warn('[YourChannelScreen] No channelId available for paid video analytics');
      // If no channel found, redirect to create channel
      navigation.navigate('CreateChannel' as never);
    }
  };

  // Content Creator Premium Toggle Handler
  const handleTogglePremium = useCallback(() => {
    console.log('🚀 [YourChannelScreen] User clicked content creator premium toggle');
    console.log('📊 [YourChannelScreen] Current content creator premium status:', {
      isContentCreatorPremium,
      hasData: !!contentCreatorPremiumData
    });
    navigation.navigate('ContentCreatorPremium' as never);
  }, [isContentCreatorPremium, contentCreatorPremiumData, navigation]);

  // Separate component for video card to properly use hooks
  const VideoCard = React.memo(({
    item,
    onPress,
    onEdit,
    onDelete
  }: {
    item: Video;
    onPress: (item: Video) => void;
    onEdit: (item: Video) => void;
    onDelete: (item: Video) => void;
  }) => {
    const fallbackUrl = React.useMemo(() => getFallbackThumbnailUrl(item.id), [item.id]);
    const [thumbnailUrl, setThumbnailUrl] = React.useState<string>(fallbackUrl);
    const [showOptions, setShowOptions] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
      const loadThumbnail = async () => {
        if (item.videoThumbnail) {
          setIsLoading(true);
          try {
            const secureUrl = await getSecureMediaUrl(item.videoThumbnail);
            if (secureUrl) {
              setThumbnailUrl(secureUrl);
            } else {
              // If getSecureMediaUrl returns undefined, use fallback
              setThumbnailUrl(fallbackUrl);
            }
          } catch (error) {
            console.warn('[YourChannelScreen] Failed to load video thumbnail:', error);
            // Reset to fallback URL on error
            setThumbnailUrl(fallbackUrl);
          } finally {
            setIsLoading(false);
          }
        } else {
          // No thumbnail URL provided, use fallback
          setThumbnailUrl(fallbackUrl);
        }
      };

      loadThumbnail();
    }, [item.videoThumbnail, fallbackUrl]);

    const handleOptionsPress = () => {
      Alert.alert(
        'Video Options',
        `What would you like to do with "${item.name}"?`,
        [
          {
            text: 'Edit',
            onPress: () => onEdit(item),
            style: 'default',
          },
          {
            text: 'Delete',
            onPress: () => onDelete(item),
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        style={styles.videoCard}
        activeOpacity={0.9}
        onPress={() => onPress(item)}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.videoThumbnail}
          resizeMode="cover"
          onError={(error) => {
            console.warn('[YourChannelScreen] Image load error for video', item.id, ':', error.nativeEvent?.error);
            // Fallback to placeholder on error, only if not already using fallback
            if (thumbnailUrl !== fallbackUrl) {
              setThumbnailUrl(fallbackUrl);
            }
          }}
        />
        <View style={styles.videoDurationOverlay}>
          <Text style={styles.videoDurationText}>{item.playDuration || '0:00'}</Text>
        </View>

        {/* Video Options Button */}
        <TouchableOpacity
          style={styles.videoOptionsButton}
          onPress={handleOptionsPress}
          activeOpacity={0.8}
        >
          <MoreVertical size={16} color={colors.background} />
        </TouchableOpacity>

        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.videoViews}>
            {formatViewCount(item.views || 0)} views
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  const handleVideoPress = async (item: Video) => {
    console.log('[YourChannelScreen] Video pressed:', { id: item.id, title: item.name, isPaid: item.isPaidPromotional });

    try {
      // --- IMPLEMENT SAME LOGIC AS TipTubeScreen: Three cases for paid/normal videos ---
      if (item.isPaidPromotional === 1) {
        if (item.hasContentCreatorPremium === 1) {
          // Case 1: Paid video, owner has content creator premium
          const response = await ApiService.viewSubscriptionPaidVideo(Number(item.id));
          if (response.status === true) {
            const videoUrl = response.data?.video_link || item.videoLink;
            const videoForPlayer = {
              id: Number(item.id),
              title: item.name,
              thumbnail: item.videoThumbnail,
              videoUrl,
              duration: 0,
              views: item.views || 0,
              posted: item.createdDate,
              avatar: '', // Will be populated by channel data
              creatorName: 'Your Channel',
              isVerified: false,
              channelId: String(item.channelId || ''),
              price: item.promotionalPrice || 0,
              isPaidPromotional: item.isPaidPromotional || 0,
              contentCreatorPlanId: 0,
            };

            navigation.navigate('VideoPlayerModal' as never, {
              video: videoForPlayer,
              cardLayout: null,
              upNextVideos: []
            });
          } else {
            Alert.alert(
              'Insufficient Balance',
              'You do not have enough balance to watch this video.'
            );
          }
        } else {
          // Case 2: Paid video, owner does NOT have content creator premium
          const response = await ApiService.viewPaidVideoNoPremium(Number(item.id));
          if (response.status === true) {
            const videoUrl = response.data?.video_link || item.videoLink;
            const videoForPlayer = {
              id: Number(item.id),
              title: item.name,
              thumbnail: item.videoThumbnail,
              videoUrl,
              duration: 0,
              views: item.views || 0,
              posted: item.createdDate,
              avatar: '', // Will be populated by channel data
              creatorName: 'Your Channel',
              isVerified: false,
              channelId: String(item.channelId || ''),
              price: item.promotionalPrice || 0,
              isPaidPromotional: item.isPaidPromotional || 0,
              contentCreatorPlanId: 0,
            };

            navigation.navigate('VideoPlayerModal' as never, {
              video: videoForPlayer,
              cardLayout: null,
              upNextVideos: []
            });
          } else {
            Alert.alert(
              'Insufficient Balance',
              'You do not have enough balance to watch this video.'
            );
          }
        }
      } else {
        // Case 3: Normal video
        await ApiService.viewNormalVideo(Number(item.id));

        const videoForPlayer = {
          id: Number(item.id),
          title: item.name,
          thumbnail: item.videoThumbnail,
          videoUrl: item.videoLink,
          duration: 0,
          views: item.views || 0,
          posted: item.createdDate,
          avatar: '', // Will be populated by channel data
          creatorName: 'Your Channel',
          isVerified: false,
          channelId: String(item.channelId || ''),
          price: 0,
          isPaidPromotional: 0,
          contentCreatorPlanId: 0,
        };

        navigation.navigate('VideoPlayerModal' as never, {
          video: videoForPlayer,
          cardLayout: null,
          upNextVideos: []
        });
      }
    } catch (error) {
      console.error('[YourChannelScreen] Error handling video press:', error);
      Alert.alert('Error', 'There was an issue accessing this video. Please try again later.');
    }
  };

  const handleEditVideo = (item: Video) => {
    console.log('Edit video:', item.name);
    // Navigate to edit video screen or show edit modal
    // For now, show a placeholder alert
    Alert.alert(
      'Edit Video',
      `Edit functionality for "${item.name}" will be implemented soon.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteVideo = (item: Video) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [YourChannelScreen] Deleting video:', item.id);

              // Call the delete API
              const response = await ApiService.deleteVideo(item.id);

              if (response.status === 200 || response.status === true) {
                console.log('✅ [YourChannelScreen] Video deleted successfully');

                // Remove the video from local state
                setVideos(prevVideos => prevVideos.filter(video => video.id !== item.id));
                setShorts(prevShorts => prevShorts.filter(short => short.id !== item.id));

                Alert.alert('Success', 'Video deleted successfully');
              } else {
                console.error('❌ [YourChannelScreen] Failed to delete video:', response);
                Alert.alert('Error', 'Failed to delete video. Please try again.');
              }
            } catch (error) {
              console.error('❌ [YourChannelScreen] Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete video. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderVideoCard = ({ item }: { item: Video }) => (
    <VideoCard
      item={item}
      onPress={handleVideoPress}
      onEdit={handleEditVideo}
      onDelete={handleDeleteVideo}
    />
  );



  // Get current tab data
  const getCurrentTabData = () => {
    switch (selectedTab) {
      case 'Home':
        return videos;
      case 'InShorts':
        return shorts;
      case 'Products':
      default:
        return [];
    }
  };

  // Render header component for FlatList
  const renderListHeader = () => (
    <View>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: channel?.profileImage || getFallbackAvatarUrl(user?.id),
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>
          {channel?.channelName || user?.name || 'Your Channel'}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {channel?.totalVideos || videos.length || 0}
            </Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatViewCount(channel?.totalSubscribers || 0)}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        {/* Video Management Button */}
        <TouchableOpacity
          style={styles.videoManagementButton}
          onPress={handleVideoManagement}
          activeOpacity={0.8}
        >
          <Text style={styles.videoManagementText}>Upload Videos</Text>
        </TouchableOpacity>

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.actionIcon} onPress={handleEditChannel}>
            <Star size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={handleEditChannel}>
            <Edit size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={handleAnalytics}>
            <BarChart3 size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Paid Video Analytics Button */}
        <TouchableOpacity
          style={[styles.paidAnalyticsButton, { backgroundColor: colors.primary }]}
          onPress={handlePaidVideoAnalytics}
          activeOpacity={0.8}
        >
          <BarChart3 size={16} color={colors.background} />
          <Text style={[styles.paidAnalyticsText, { color: colors.background }]}>
            Paid Video Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.selectedTab,
            ]}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.selectedTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading content...
          </Text>
        </View>
      );
    }

    switch (selectedTab) {
      case 'Home':
        return (
          <View style={styles.emptyState}>
            <Upload size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No videos uploaded yet
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('TipTubeUpload' as never)}
            >
              <Text style={[styles.uploadButtonText, { color: colors.background }]}>
                Upload Video
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'InShorts':
        return (
          <View style={styles.emptyState}>
            <Upload size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No shorts uploaded yet
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('TipShortsUpload' as never)}
            >
              <Text style={[styles.uploadButtonText, { color: colors.background }]}>
                Upload Short
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'Products':
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              Products feature coming soon
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const currentData = getCurrentTabData();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title="Your Tiptube Channel"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        rightComponent={
          <ContentCreatorPlanToggle onPress={handleTogglePremium} />
        }
      />

      <FlatList
        data={currentData}
        renderItem={renderVideoCard}
        keyExtractor={(item) => `${selectedTab}-${item.id}`}
        numColumns={2}
        ItemSeparatorComponent={() => <View style={styles.videoSeparator} />}
        columnWrapperStyle={currentData.length > 0 ? styles.videoRow : undefined}
        contentContainerStyle={styles.videoGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        title="Coming Soon"
        feature="Paid Video Analytics"
        description="Get detailed insights into your paid video performance, revenue tracking, and audience analytics. This premium feature will be available soon!"
      />
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerToggle: {
      width: 40,
      alignItems: 'flex-end',
    },
    toggleContainer: {
      width: 32,
      height: 18,
      position: 'relative',
    },
    toggleTrack: {
      width: '100%',
      height: '100%',
      backgroundColor: '#ff4444',
      borderRadius: 9,
    },
    toggleThumb: {
      position: 'absolute',
      right: 2,
      top: 2,
      width: 14,
      height: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 7,
    },
    content: {
      flex: 1,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    statItem: {
      alignItems: 'center',
      marginHorizontal: 24,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
    },
    videoManagementButton: {
      backgroundColor: '#00C853',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      marginBottom: 16,
    },
    videoManagementText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    actionIcons: {
      flexDirection: 'row',
      gap: 16,
    },
    actionIcon: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    selectedTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#00C853',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    selectedTabText: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    videoGrid: {
      padding: 16,
    },
    videoRow: {
      justifyContent: 'space-between',
    },
    videoSeparator: {
      height: 16,
    },
    videoCard: {
      width: VIDEO_CARD_WIDTH,
      backgroundColor: colors.cardSecondary,
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoThumbnail: {
      width: '100%',
      height: VIDEO_CARD_HEIGHT,
      backgroundColor: colors.border,
    },
    videoDurationOverlay: {
      position: 'absolute',
      bottom: VIDEO_CARD_HEIGHT - 20,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    videoDurationText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    videoOptionsButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 12,
      padding: 4,
      zIndex: 1,
    },
    videoInfo: {
      padding: 8,
    },
    videoTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: 4,
    },
    videoViews: {
      fontSize: 11,
      color: colors.text.tertiary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: 16,
      marginTop: 12,
      textAlign: 'center',
    },
    uploadButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    uploadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    paidAnalyticsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    paidAnalyticsText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

export default YourChannelScreen;
