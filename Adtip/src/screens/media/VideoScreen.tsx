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
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
//import { PubScale } from 'pubscale-sdk';

// Components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import VideoService from '../../services/VideoService';
import {ENDPOINTS} from '../../constants/api';

const {width} = Dimensions.get('window');

interface VideoProps {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    followers: number;
  };
  category: {
    id: string;
    name: string;
    color?: string;
  };
  isMonetized: boolean;
  hasEarned: boolean;
  duration: number; // in seconds
}

const VideoScreen = () => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
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
      const response = await ApiService.get(
        `${ENDPOINTS.GET_VIDEO}/${videoId}`,
      );
      setVideo(response.data);

      // Check if user has already liked the video
      if (user) {
        const likeResponse = await ApiService.get(
          `${ENDPOINTS.CHECK_LIKE}/${videoId}`,
        );
        setLiked(likeResponse.data.liked);

        // Check if user has already subscribed to the channel
        const subscribeResponse = await ApiService.get(
          `${ENDPOINTS.CHECK_SUBSCRIBE}/${response.data.user.id}`,
        );
        setSubscribed(subscribeResponse.data.subscribed);

        // Check if user has already earned from this video
        if (response.data.isMonetized) {
          setRewardShown(response.data.hasEarned);
        }
      }

      // Track video view
      ApiService.post(`${ENDPOINTS.TRACK_VIEW}/${videoId}`);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Failed to load video');
      setLoading(false);
    }
  }, [videoId, user]);

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

    try {
      const endpoint = liked
        ? `${ENDPOINTS.UNLIKE_VIDEO}/${video?.id}`
        : `${ENDPOINTS.LIKE_VIDEO}/${video?.id}`;

      await ApiService.post(endpoint);

      setLiked(!liked);
      if (video) {
        setVideo({
          ...video,
          likes: liked ? video.likes - 1 : video.likes + 1,
        });
      }
    } catch (err) {
      console.error('Error liking video:', err);
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

    if (!video || !video.user) {
      return;
    }

    try {
      const endpoint = subscribed
        ? `${ENDPOINTS.UNSUBSCRIBE}/${video.user.id}`
        : `${ENDPOINTS.SUBSCRIBE}/${video.user.id}`;

      await ApiService.post(endpoint);

      setSubscribed(!subscribed);
      if (video) {
        setVideo({
          ...video,
          user: {
            ...video.user,
            followers: subscribed
              ? video.user.followers - 1
              : video.user.followers + 1,
          },
        });
      }
    } catch (err) {
      console.error('Error subscribing:', err);
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
          title={video.title}
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
          source={{uri: localVideoPath || video.videoUrl}}
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
                <Icon
                  name={paused ? 'play' : 'pause'}
                  size={40}
                  color={colors.white}
                />
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
                  <Icon
                    name={muted ? 'volume-x' : 'volume-2'}
                    size={20}
                    color={colors.white}
                  />
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
              {video.title}
            </Text>

            <View style={styles.videoStats}>
              <Text style={[styles.statsText, {color: colors.text.secondary}]}>
                {video.views.toLocaleString()} views •{' '}
                {new Date(video.createdAt).toLocaleDateString()}
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
                  {video.likes.toLocaleString()}
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
                  <Icon name="dollar-sign" size={16} color={colors.success} />
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
                source={{uri: video.user.avatarUrl}}
                style={styles.channelImage}
              />
              <View style={styles.channelText}>
                <Text
                  style={[styles.channelName, {color: colors.text.primary}]}>
                  {video.user.name}
                </Text>
                <Text
                  style={[
                    styles.subscriberCount,
                    {color: colors.text.secondary},
                  ]}>
                  {video.user.followers.toLocaleString()} followers
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
          {video.description ? (
            <View style={styles.descriptionContainer}>
              <Text
                style={[
                  styles.descriptionText,
                  {color: colors.text.secondary},
                ]}>
                {video.description}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
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
    marginTop: 12,
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
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
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
  },
  videoInfo: {
    marginBottom: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  likedActionText: {
    fontWeight: '600',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
  subscriberCount: {
    fontSize: 14,
  },
  subscribeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  subscribedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  notSubscribedButton: {
    // backgroundColor will be set to colors.primary in component
    borderWidth: 0,
  },
  subscribeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
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
