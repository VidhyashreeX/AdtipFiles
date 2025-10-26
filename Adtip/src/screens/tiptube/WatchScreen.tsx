/**
 * WatchScreen - Simple YouTube-style video watch page
 *
 * Mimics the web implementation (WatchPage.tsx):
 * - Clean, simple state management
 * - Fetches video data on mount
 * - Shows video player, description, related videos, comments
 * - No complex animations that cause re-renders
 * - Stable video playback
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Share,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Heart,
  MessageCircle,
  Send,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import TipTubeVideoPlayer from '../../components/tiptube/TipTubeVideoPlayer';
import VideoCommentSheet from '../../components/tiptube/VideoCommentSheet';
import ApiService from '../../services/ApiService';
import {API_BASE_URL} from '../../constants/api';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface Video {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  likes?: number;
  dislikes?: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
  subscribers?: number;
}

const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const formatDate = (dateString: string): string => {
  if (!dateString || dateString === 'Recently') return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const transformVideoData = (apiVideo: any): Video => ({
  id: apiVideo.id || 0,
  title: apiVideo.name || '',
  description: apiVideo.description || 'No description available',
  thumbnail:
    apiVideo.video_Thumbnail !== 'undefined'
      ? apiVideo.video_Thumbnail
      : undefined,
  videoUrl: apiVideo.video_link,
  duration: parseInt(apiVideo.play_duration || apiVideo.duration || '0', 10),
  views: apiVideo.total_views || 0,
  likes: apiVideo.likes || 0,
  dislikes: apiVideo.dislikes || 0,
  posted: apiVideo.createddate || 'Recently',
  avatar:
    apiVideo.channel_profile !== 'null' ? apiVideo.channel_profile : undefined,
  creatorName: apiVideo.channelName || 'Unknown Creator',
  isVerified: apiVideo.isVerified || false,
  channelId:
    apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
  price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  subscribers: apiVideo.subscribers || apiVideo.channelSubscribers || 0,
});

const WatchScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {colors, isDarkMode} = useTheme();

  const videoId = route.params?.videoId || route.params?.id;

  // State
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
  const [playerInteracting, setPlayerInteracting] = useState(false);

  const userId = user?.id || null;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);

      return () => {
        StatusBar.setHidden(false);
      };
    }, []),
  );

  // Fetch video data
  const fetchVideoData = useCallback(async () => {
    if (!videoId) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');

      // Fetch current video
      const videoEndpoint = `${API_BASE_URL}/api/getvideo/${videoId}/${userId || 0}`;
      const videoRes = await fetch(videoEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
      });

      // Check if response is OK
      if (!videoRes.ok) {
        console.error('Video API error:', videoRes.status, videoRes.statusText);
        navigation.goBack();
        return;
      }

      // Check if response is JSON
      const contentType = videoRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Video API returned non-JSON response:', contentType);
        navigation.goBack();
        return;
      }

      const videoData = await videoRes.json();

      if (
        videoData.status === 200 &&
        videoData.data &&
        videoData.data.length > 0
      ) {
        const video = transformVideoData(videoData.data[0]);
        setCurrentVideo(video);
        setCommentCount(videoData.data[0].comments || 0);

        // Check if user has liked this video
        if (userId) {
          checkLikeStatus(videoData.data[0].id, userId);
        }
      } else {
        console.error('Video not found');
        navigation.goBack();
        return;
      }

      // Fetch related videos
      const relatedEndpoint = token
        ? `${API_BASE_URL}/api/getvideos/${userId}/0/1`
        : `${API_BASE_URL}/api/getpublicvideos/0/1`;

      const relatedRes = await fetch(relatedEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
      });

      // Validate related videos response
      if (relatedRes.ok) {
        const relatedContentType = relatedRes.headers.get('content-type');
        if (
          relatedContentType &&
          relatedContentType.includes('application/json')
        ) {
          const relatedData = await relatedRes.json();
          const relatedList = Array.isArray(relatedData.data)
            ? relatedData.data
                .map(transformVideoData)
                .filter((v: Video) => String(v.id) !== String(videoId))
            : [];

          setRelatedVideos(relatedList.slice(0, 20));
        } else {
          console.warn('Related videos API returned non-JSON response');
        }
      } else {
        console.warn('Failed to fetch related videos:', relatedRes.status);
      }
    } catch (err) {
      console.error('Error fetching video data:', err);
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [videoId, userId, navigation]);

  // Check if user has liked the video
  const checkLikeStatus = useCallback(
    async (videoId: number, userId: number) => {
      try {
        // You can implement this if there's an API to check like status
        // For now, we'll rely on the backend response
      } catch (error) {
        console.error('[WatchScreen] Error checking like status:', error);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchVideoData();
  }, [fetchVideoData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideoData();
  }, [fetchVideoData]);

  // Action handlers
  const handleLike = useCallback(async () => {
    if (!currentVideo || !user) return;

    try {
      const newIsLiked = !isLiked;
      const likeValue = newIsLiked ? 1 : 0;

      // Optimistic update
      setIsLiked(newIsLiked);
      setCurrentVideo({
        ...currentVideo,
        likes: (currentVideo.likes || 0) + (newIsLiked ? 1 : -1),
      });

      // API call
      await ApiService.saveVideoLike(
        currentVideo.id,
        user.id,
        likeValue,
        currentVideo.channelId as number,
      );
    } catch (error) {
      console.error('[WatchScreen] Error liking video:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setCurrentVideo({
        ...currentVideo,
        likes: currentVideo.likes,
      });
      Alert.alert('Error', 'Failed to like video. Please try again.');
    }
  }, [currentVideo, user, isLiked]);

  const handleDislike = useCallback(() => {
    if (!currentVideo) return;

    const newIsDisliked = !isDisliked;
    setIsDisliked(newIsDisliked);

    if (newIsDisliked) {
      setIsLiked(false);
      setCurrentVideo({
        ...currentVideo,
        dislikes: (currentVideo.dislikes || 0) + (isDisliked ? 0 : 1),
        likes: isLiked ? (currentVideo.likes || 0) - 1 : currentVideo.likes,
      });
    } else {
      setCurrentVideo({
        ...currentVideo,
        dislikes: (currentVideo.dislikes || 0) - 1,
      });
    }
  }, [currentVideo, isLiked, isDisliked]);

  const handleSubscribe = useCallback(() => {
    setIsSubscribed(!isSubscribed);
  }, [isSubscribed]);

  const handleShare = useCallback(async () => {
    if (!currentVideo) return;

    try {
      await Share.share({
        message: `Check out this video: ${currentVideo.title}\n\nhttps://adtip.in/video/${currentVideo.id}`,
        title: currentVideo.title,
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  }, [currentVideo]);

  const handleRelatedVideoPress = useCallback(
    (video: Video) => {
      navigation.push('WatchScreen', {videoId: video.id});
    },
    [navigation],
  );

  const handlePlayerFullscreenChange = useCallback((isFull: boolean) => {
    setPlayerInteracting(false);
    setPlayerFullscreen(isFull);
  }, []);

  const handlePlayerExitFullscreen = useCallback(() => {
    setPlayerInteracting(false);
    setPlayerFullscreen(false);
  }, []);

  const styles = useMemo(
    () => createStyles(colors, isDarkMode),
    [colors, isDarkMode],
  );

  // Loading state
  if (loading && !currentVideo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  // No video state
  if (!currentVideo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Video not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      scrollEnabled={!playerFullscreen && !playerInteracting}
      refreshControl={
        <RefreshControl
          enabled={!playerFullscreen && !playerInteracting}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* Video Player */}
      <View style={styles.playerContainer}>
        {currentVideo.videoUrl && (
          <TipTubeVideoPlayer
            videoUrl={currentVideo.videoUrl}
            thumbnail={currentVideo.thumbnail}
            autoPlay={true}
            onVideoEnd={() => console.log('Video ended')}
            onVideoPlay={() => console.log('Video playing')}
            onDragClose={() => navigation.goBack()}
            onExitFullscreen={handlePlayerExitFullscreen}
            onFullscreenChange={handlePlayerFullscreenChange}
            onGestureToggle={setPlayerInteracting}
          />
        )}
      </View>

      {/* Advertisement Banner */}
      <View style={styles.adBannerContainer}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Sponsored</Text>
        </View>
        <View style={styles.adContent}>
          <View style={styles.adIconContainer}>
            <Text style={styles.adIcon}>💰</Text>
          </View>
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>WintWealth: 9-12% Fixed Returns</Text>
            <Text style={styles.adSubtitle}>Sponsored · 4.6★ FREE</Text>
          </View>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>Install</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        {/* Title */}
        <Text style={styles.title}>{currentVideo.title}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Eye size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>
              {formatViews(currentVideo.views)} views
            </Text>
          </View>
          <View style={styles.stat}>
            <Clock size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>
              {formatDate(currentVideo.posted)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleLike}
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}>
            <Heart
              size={20}
              color={isLiked ? '#FF0000' : colors.text.primary}
              fill={isLiked ? '#FF0000' : 'none'}
            />
            <Text style={[styles.actionText, isLiked && {color: '#FF0000'}]}>
              {formatViews(currentVideo.likes || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowComments(true)}
            style={styles.actionButton}>
            <MessageCircle size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>
              {commentCount > 0 ? formatViews(commentCount) : 'Comment'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Send size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Info */}
        <View style={styles.channelSection}>
          <TouchableOpacity
            style={styles.channelInfo}
            onPress={() =>
              navigation.navigate('Channel', {
                channelId: currentVideo.channelId,
              })
            }>
            <Image
              source={{
                uri: currentVideo.avatar || 'https://via.placeholder.com/40',
              }}
              style={styles.channelAvatar}
            />
            <View style={styles.channelDetails}>
              <View style={styles.channelNameRow}>
                <Text style={styles.channelName}>
                  {currentVideo.creatorName}
                </Text>
                {currentVideo.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subscribersText}>
                {formatViews(currentVideo.subscribers || 0)} subscribers
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubscribe}
            style={[
              styles.subscribeButton,
              isSubscribed && styles.subscribedButton,
            ]}>
            <Text
              style={[
                styles.subscribeButtonText,
                isSubscribed && styles.subscribedButtonText,
              ]}>
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text
            style={styles.descriptionText}
            numberOfLines={showFullDescription ? undefined : 3}>
            {currentVideo.description}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>
              {showFullDescription ? 'Show less' : 'Show more'}
            </Text>
            {showFullDescription ? (
              <ChevronUp size={16} color={colors.text.secondary} />
            ) : (
              <ChevronDown size={16} color={colors.text.secondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Related Videos */}
      <View style={styles.relatedSection}>
        <Text style={styles.relatedTitle}>Related Videos</Text>
        {relatedVideos.map(video => (
          <TouchableOpacity
            key={video.id}
            style={styles.relatedVideoCard}
            onPress={() => handleRelatedVideoPress(video)}>
            <Image
              source={{
                uri: video.thumbnail || 'https://via.placeholder.com/168x94',
              }}
              style={styles.relatedThumbnail}
            />
            <View style={styles.relatedInfo}>
              <Text style={styles.relatedVideoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.relatedChannelName}>{video.creatorName}</Text>
              <View style={styles.relatedStats}>
                <Text style={styles.relatedStatsText}>
                  {formatViews(video.views)} views
                </Text>
                <Text style={styles.relatedStatsText}>•</Text>
                <Text style={styles.relatedStatsText}>
                  {formatDate(video.posted)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Comment Sheet */}
      <VideoCommentSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        videoId={currentVideo.id}
        onCommentAdded={() => {
          setCommentCount(prev => prev + 1);
          fetchVideoData(); // Refresh to get updated comment count
        }}
      />
    </ScrollView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.text.secondary,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 16,
    },
    errorButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 24,
    },
    errorButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    playerContainer: {
      width: '100%',
      backgroundColor: '#000000',
    },
    adBannerContainer: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      padding: 12,
    },
    adBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: 8,
    },
    adBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    adContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    adIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    adIcon: {
      fontSize: 24,
    },
    adTextContainer: {
      flex: 1,
    },
    adTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    adSubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    adButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    adButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    infoContainer: {
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
      lineHeight: 22,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.text.secondary,
      fontWeight: '400',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
    },
    actionButtonActive: {
      backgroundColor: `${colors.primary}20`,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    actionTextActive: {
      color: colors.primary,
    },
    channelSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
    },
    channelInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    channelAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
    },
    channelDetails: {
      flex: 1,
    },
    channelNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    channelName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    verifiedBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifiedText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    subscribersText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    subscribeButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
    },
    subscribedButton: {
      backgroundColor: colors.cardSecondary,
    },
    subscribeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    subscribedButtonText: {
      color: colors.text.primary,
    },
    descriptionContainer: {
      backgroundColor: colors.cardSecondary,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    descriptionText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.primary,
    },
    showMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },
    showMoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    relatedSection: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderTopWidth: 8,
      borderTopColor: colors.border,
    },
    relatedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
    },
    relatedVideoCard: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 12,
    },
    relatedThumbnail: {
      width: 168,
      height: 94,
      borderRadius: 8,
      backgroundColor: colors.cardSecondary,
    },
    relatedInfo: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    relatedVideoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 18,
      marginBottom: 4,
    },
    relatedChannelName: {
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    relatedStats: {
      flexDirection: 'row',
      gap: 4,
    },
    relatedStatsText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
  });

export default WatchScreen;
