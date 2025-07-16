// src/screens/media/VideoScreen.tsx
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee, VolumeX, Volume2, Play, Pause } from 'lucide-react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
//import { PubScale } from 'pubscale-sdk';

// Components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';
import { createSecureVideoSource } from '../../utils/mediaUtils';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import VideoService from '../../services/VideoService';
import {ENDPOINTS} from '../../constants/api';

const {width} = Dimensions.get('window');

interface VideoProps {
  id: string | number;
  title?: string;
  name?: string; // Alternative title field
  description?: string;
  videoDesciption?: string; // Alternative description field
  videoUrl?: string;
  videoLink?: string; // Alternative video URL field
  thumbnailUrl?: string;
  video_Thumbnail?: string; // Alternative thumbnail field
  views?: number;
  likes?: number;
  createdAt?: string;
  createdby?: number;
  userId?: number;
  channelId?: number;
  channelName?: string;
  channel_profile?: string;
  total_followers?: number;
  user?: {
    id: string | number;
    name: string;
    avatarUrl?: string;
    followers?: number;
  };
  channel?: {
    id: string | number;
    name: string;
    followers?: number;
  };
  category?: {
    id: string | number;
    name: string;
    color?: string;
  };
  isMonetized?: boolean;
  hasEarned?: boolean;
  duration?: number; // in seconds
  play_duration?: string; // Alternative duration field
  followers?: number; // For channel followers
}

const VideoScreen = () => {
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDarkMode);
  const videoRef = useRef<any>(null);

  // Get video from route params
  // @ts-ignore
  const videoId = route.params?.videoId;

  // State variables
  const [video, setVideo] = useState<VideoProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [muted, setMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [rewardShown, setRewardShown] = useState(false);
  const [watchTimeTracked, setWatchTimeTracked] = useState(false);
  const [localVideoPath, setLocalVideoPath] = useState<string | null>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);

  // Control timer
  const controlsTimer = useRef<any>(null);

  // Fetch video data
  const fetchVideoDetails = useCallback(async () => {
    if (!videoId) {
      setError('Video ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[VideoScreen] Fetching video details for videoId:', videoId, 'userId:', user?.id || 0);

      // Pass userId as query parameter for the new endpoint
      const response = await ApiService.get(
        `${ENDPOINTS.GET_VIDEO}/${videoId}`,
        { userId: user?.id || 0 }
      );

      console.log('[VideoScreen] API response:', response);

      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        setVideo(response.data[0]); // Take first video from array
      } else if (response && response.data && !Array.isArray(response.data)) {
        setVideo(response.data); // Single video object
      } else {
        throw new Error('Video not found or invalid response format');
      }

      // Check if user has already liked the video and other interactions
      if (user) {
        try {
          // Check if user has liked this video using getUserVideoViewLikeDetails
          const likeDetailsResponse = await ApiService.get(
            `/api/getUserVideoViewLikeDetails/${user.id}/1`
          );

          if (likeDetailsResponse.data && Array.isArray(likeDetailsResponse.data)) {
            const videoLikeInfo = likeDetailsResponse.data.find(
              (item: any) => item.videoId === Number(videoId) || item.reelId === Number(videoId)
            );
            if (videoLikeInfo) {
              setLiked(videoLikeInfo.is_like === 1);
            }
          }

          // Check if user follows the channel (if video has channel info)
          if (response.data.channelId) {
            const followedChannelsResponse = await ApiService.get(
              `/api/getlistoffollowedchannelbyuser/${user.id}`
            );

            if (followedChannelsResponse.data && Array.isArray(followedChannelsResponse.data)) {
              const isFollowingChannel = followedChannelsResponse.data.some(
                (channel: any) => channel.channelId === response.data.channelId
              );
              setSubscribed(isFollowingChannel);
            }
          }

          // Check if user has already earned from this video
          if (response.data.isMonetized) {
            setRewardShown(response.data.hasEarned);
          }
        } catch (error) {
          console.log('[VideoScreen] Error checking user interactions:', error);
          // Don't show error to user, just log it
        }
      }

      // Track video view using the existing viewNormalVideo method
      try {
        await ApiService.viewNormalVideo(Number(videoId));
        console.log('[VideoScreen] Video view tracked successfully');
      } catch (error) {
        console.log('[VideoScreen] Error tracking video view:', error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Failed to load video');
      setLoading(false);
    }
  }, [videoId, user]);

  // Load secure video source when video data is available
  useEffect(() => {
    const loadSecureVideoSource = async () => {
      if (video?.videoUrl && !localVideoPath) {
        try {
          console.log('[VideoScreen] Loading secure video source for:', video.videoUrl);
          const secureSource = await createSecureVideoSource(video.videoUrl);
          setSecureVideoSource(secureSource);
          console.log('[VideoScreen] Secure video source loaded:', secureSource);
        } catch (error) {
          console.error('[VideoScreen] Failed to load secure video source:', error);
        }
      }
    };

    loadSecureVideoSource();
  }, [video?.videoUrl, localVideoPath]);

  // Cache video for better playback
  const cacheVideo = useCallback(async () => {
    try {
      if (video?.videoUrl) {
        const cachedPath = await VideoService.cacheVideo(video.videoUrl);
        setLocalVideoPath(cachedPath);
      }
    } catch (err) {
      console.error('Error caching video:', err);
    }
  }, [video]);

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId, fetchVideoDetails]);

  // Handle orientation changes
  useEffect(() => {
    if (isFullscreen) {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }

    return () => {
      Orientation.lockToPortrait();
    };
  }, [isFullscreen]);

  // Handle controls visibility
  useEffect(() => {
    if (showControls) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }

      controlsTimer.current = setTimeout(() => {
        if (!paused) {
          setShowControls(false);
        }
      }, 3000);
    }

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [showControls, paused]);

  useEffect(() => {
    if (video?.videoUrl) {
      cacheVideo();
    }
  }, [video, cacheVideo]);

  const handleTogglePlay = () => {
    setPaused(!paused);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleScreenTouch = () => {
    setShowControls(!showControls);
  };

  const handleProgress = (data: any) => {
    setProgress(data.currentTime / data.seekableDuration);
    setCurrentTime(data.currentTime);

    // Track watch time for monetization
    if (video?.isMonetized && !watchTimeTracked && !video.hasEarned) {
      // If user has watched 75% of the video, track for reward
      if (data.currentTime / data.seekableDuration > 0.75) {
        trackWatchTime();
      }
    }
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
    setIsBuffering(false);
  };

  const handleEnd = () => {
    setPaused(true);
    setProgress(1);
    setCurrentTime(duration);
    setShowControls(true);
  };

  const trackWatchTime = async () => {
    if (!video || watchTimeTracked) {
      return;
    }

    try {
      setWatchTimeTracked(true);
      if (video.isMonetized && !video.hasEarned) {
        // Commented out PubScale integration - June 2, 2025
        /*
        // Show reward after 80% of video watched
        const reward = await PubScale.showRewardedAd({
          placement: 'video_watch_reward',
          onClose: (didReceiveReward) => {
            if (didReceiveReward) {
              // Assign reward to user
              ApiService.post(`${ENDPOINTS.EARN_REWARD}/${video.id}`);
              setRewardShown(true);
              setRewardAmount(5); // Example reward amount

              // Show reward notification
              Alert.alert(
                'Reward Earned!',
                `You earned ${rewardAmount} coins for watching this video!`
              );
            }
          }
        });
        */

        // Temporary: Show message that rewards are disabled
        Alert.alert(
          'Rewards Temporarily Disabled',
          'Video rewards are currently being updated. Please check back later!',
        );
      }
    } catch (err) {
      console.error('Error showing reward:', err);
    }
  };

  const handleLikeVideo = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like this video');
      return;
    }

    if (!video?.id) {
      Alert.alert('Error', 'Video information not available');
      return;
    }

    try {
      // Use the same method as VideoPlayerModalScreen and TipTubeScreen
      await ApiService.saveVideoLike(
        Number(video.id),
        Number(user.id),
        liked ? 0 : 1, // Toggle like status
        Number(video.createdby || video.userId || user.id) // Use video creator ID
      );

      setLiked(!liked);
      if (video) {
        setVideo({
          ...video,
          likes: liked ? (video.likes || 0) - 1 : (video.likes || 0) + 1,
        });
      }
    } catch (err) {
      console.error('Error liking video:', err);
      Alert.alert('Error', 'Failed to like video. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to subscribe to this channel',
      );
      return;
    }

    if (!video || !video.channelId) {
      Alert.alert('Error', 'Channel information not available');
      return;
    }

    try {
      // Use the existing saveChannelFollowers endpoint
      await ApiService.saveChannelFollowers({
        userId: Number(user.id),
        channelId: Number(video.channelId),
        follow: subscribed ? 0 : 1, // Toggle subscription status
      });

      setSubscribed(!subscribed);

      // Update video data if it has follower count
      if (video && video.followers !== undefined) {
        setVideo({
          ...video,
          followers: subscribed ? video.followers - 1 : video.followers + 1,
        });
      }
    } catch (err) {
      console.error('Error subscribing to channel:', err);
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!video) {
      return;
    }

    try {
      await Share.share({
        message: `Check out this video "${video.title}" on Adtip: https://adtip.app/video/${video.id}`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Video"
          leftComponent={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
            Loading video...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !video) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Video"
          leftComponent={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-triangle" size={48} color={colors.error} />
          <Text style={[styles.errorText, {color: colors.text.primary}]}>
            {error || 'Video not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchVideoDetails}>
            <Text style={{color: colors.white}}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const containerStyles = [
    styles.container,
    isFullscreen ? styles.fullscreenContainer : { backgroundColor: colors.background },
  ];

  const videoContainerStyles = [
    styles.videoContainer,
    isFullscreen ? styles.fullscreenVideo : { height: (width * 9) / 16 },
  ];

  return (
    <SafeAreaView style={containerStyles}>
      {!isFullscreen && (
        <Header
          title={video.title || video.name || 'Video'}
          leftComponent={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={1}
        onPress={handleScreenTouch}
        style={videoContainerStyles}>
        <Video
          ref={videoRef}
          source={localVideoPath ? {uri: localVideoPath} : (secureVideoSource || {uri: video?.videoUrl || video?.videoLink || ''})}
          style={styles.videoPlayer}
          resizeMode="contain"
          paused={paused}
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={handleEnd}
          onBuffer={({ isBuffering: buffering }) => setIsBuffering(buffering)}
          muted={muted}
          repeat={false}
          playInBackground={false}
          playWhenInactive={false}
        />

        {/* Video controls */}
        {showControls && (
          <View style={styles.controls}>
            {/* Top bar */}
            <View style={styles.topControls}>
              {isFullscreen && (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={24} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={handleTogglePlay}>
                {paused ? (
                  <Play size={40} color={colors.white} />
                ) : (
                  <Pause size={40} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <View style={styles.timeControls}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.seekThumb,
                      {
                        left: `${progress * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.actionControls}>
                <TouchableOpacity onPress={() => setMuted(!muted)}>
                  {muted ? (
                    <VolumeX size={20} color={colors.white} />
                  ) : (
                    <Volume2 size={20} color={colors.white} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleToggleFullscreen}>
                  <Icon
                    name={isFullscreen ? 'minimize' : 'maximize'}
                    size={20}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Buffering indicator */}
        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
      </TouchableOpacity>

      {!isFullscreen && (
        <ScrollView style={styles.content}>
          {/* Video information */}
          <View style={styles.videoInfo}>
            <Text style={[styles.videoTitle, {color: colors.text.primary}]}>
              {video.title || video.name || 'Untitled Video'}
            </Text>

            <View style={styles.videoStats}>
              <Text style={[styles.statsText, {color: colors.text.secondary}]}>
                {(video.views || 0).toLocaleString()} views
                {video.createdAt && ` • ${new Date(video.createdAt).toLocaleDateString()}`}
              </Text>

              {video.category && (
                <CategoryChip category={video.category} small />
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLikeVideo}>
                <Icon
                  name={liked ? 'thumbs-up' : 'thumbs-up'}
                  size={20}
                  color={liked ? colors.primary : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.actionText,
                    liked && styles.likedActionText,
                    { color: liked ? colors.primary : colors.text.secondary },
                  ]}>
                  {(video.likes || 0).toLocaleString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}>
                <Icon name="share-2" size={20} color={colors.text.secondary} />
                <Text
                  style={[styles.actionText, {color: colors.text.secondary}]}>
                  Share
                </Text>
              </TouchableOpacity>

              {rewardShown && (
                <View style={styles.rewardContainer}>
                  <IndianRupee size={16} color={colors.success} />
                  <Text style={[styles.rewardText, {color: colors.success}]}>
                    {rewardShown ? 'Coins earned' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Channel information */}
          <View style={[styles.channelContainer, {borderColor: colors.border}]}>
            <View style={styles.channelInfo}>
              <Image
                source={{uri: video.user?.avatarUrl || video.channel_profile || 'https://via.placeholder.com/40'}}
                style={styles.channelImage}
              />
              <View style={styles.channelText}>
                <Text
                  style={[styles.channelName, {color: colors.text.primary}]}>
                  {video.user?.name || video.channelName || 'Unknown Channel'}
                </Text>
                <Text
                  style={[
                    styles.subscriberCount,
                    {color: colors.text.secondary},
                  ]}>
                  {((video.user?.followers || video.total_followers || video.followers || 0)).toLocaleString()} followers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                subscribed ? styles.subscribedButton : styles.notSubscribedButton,
                !subscribed && {backgroundColor: colors.primary},
                {borderColor: colors.border},
              ]}
              onPress={handleSubscribe}>
              <Text
                style={[
                  styles.subscribeText,
                  {color: subscribed ? colors.text.primary : colors.white},
                ]}>
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Video description */}
          {(video.description || video.videoDesciption) ? (
            <View style={styles.descriptionContainer}>
              <Text
                style={[
                  styles.descriptionText,
                  {color: colors.text.secondary},
                ]}>
                {video.description || video.videoDesciption}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
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
    fontSize: 16,
    color: colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    color: colors.text.primary,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  centerControls: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 2,
  },
  seekThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    padding: 16,
  },  videoInfo: {
    marginBottom: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: isDarkMode ? colors.border : 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 12,
  },  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.primary,
  },
  likedActionText: {
    fontWeight: '600',
    color: colors.primary,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: isDarkMode ? '#2ecc71' : '#27ae60',
  },  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  channelText: {
    marginLeft: 12,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  subscriberCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },  subscribeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  subscribedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notSubscribedButton: {
    // backgroundColor will be set to colors.primary in component
    borderWidth: 0,
  },
  subscribeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
  },
  fullscreenContainer: {
    backgroundColor: '#000',
    paddingTop: 0,
  },
  fullscreenVideo: {
    height: '100%',
  },
});

export default VideoScreen;
