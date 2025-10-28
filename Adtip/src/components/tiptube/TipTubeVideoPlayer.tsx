/**
 * TipTubeVideoPlayer - Simple, stable video player component
 *
 * Similar to web's TiptubePlayer, this component:
 * - Uses React.memo to prevent unnecessary re-renders
 * - Has minimal state and dependencies
 * - Focuses on playing video without complex logic
 * - Stable controls and playback experience
 */

import React, {useState, useRef, useCallback, useEffect, memo} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Text,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
  BackHandler,
} from 'react-native';
import Video, {VideoRef, OnLoadData, OnProgressData} from 'react-native-video';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Feather';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import Orientation from 'react-native-orientation-locker';
import { VideoAdResponse } from '../../services/ApiService';
import VideoAdRewardService from '../../services/VideoAdRewardService';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const setStatusBarHidden = (hidden: boolean) => {
  if (Platform.OS === 'ios') {
    StatusBar.setHidden(hidden, 'fade');
  } else {
    StatusBar.setHidden(hidden);
  }
};

interface TipTubeVideoPlayerProps {
  videoUrl: string;
  thumbnail?: string;
  onVideoEnd?: () => void;
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
  autoPlay?: boolean;
  style?: any;
  onExitFullscreen?: () => void;
  onDragClose?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onGestureToggle?: (active: boolean) => void;
  // Ad-related props
  isAdPlaying?: boolean;
  adData?: VideoAdResponse | null;
  onAdComplete?: () => void;
  onAdSkip?: () => void;
  onAdClick?: () => void;
  onAdEvent?: (eventName: keyof VideoAdResponse['trackingUrls']) => void;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TipTubeVideoPlayer: React.FC<TipTubeVideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  onVideoEnd,
  onVideoPlay,
  onVideoPause,
  autoPlay = false,
  style,
  onExitFullscreen,
  onDragClose,
  onFullscreenChange,
  onGestureToggle,
  // Ad props
  isAdPlaying = false,
  adData = null,
  onAdComplete,
  onAdSkip,
  onAdClick,
  onAdEvent,
}) => {
  const videoRef = useRef<VideoRef>(null);

  // Simple state management
  const [paused, setPaused] = useState(!autoPlay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Ad-specific state
  const [adDuration, setAdDuration] = useState(0);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [trackedEvents, setTrackedEvents] = useState<Set<string>>(new Set());

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const previousFullscreen = useRef(false);
  const isDraggingToClose = useRef(false);
  const notifyParentGesture = useCallback(
    (active: boolean) => {
      onGestureToggle?.(active);
    },
    [onGestureToggle],
  );

  // CRITICAL: Ensure ad plays automatically when ad starts
  useEffect(() => {
    if (isAdPlaying && adData) {
      console.log('[TipTubeVideoPlayer] 🎬 Starting ad playback, setting paused=false');
      setPaused(false);
      setTrackedEvents(new Set()); // Reset tracked events for new ad
      setAdCurrentTime(0);
      setAdDuration(adData.creative.duration || 0);
      setError(null); // Clear any previous errors
      setLoading(true); // Show loading while ad loads
    } else if (!isAdPlaying) {
      // When ad finishes, reset states for content video
      console.log('[TipTubeVideoPlayer] 📺 Transitioning to content video');
      setAdCurrentTime(0);
      setAdDuration(0);
      setTrackedEvents(new Set());
      setError(null);
      setLoading(true);
    }
  }, [isAdPlaying, adData]);

  useEffect(() => {
    return () => {
      notifyParentGesture(false);
      setStatusBarHidden(false);
      // Ensure we return to portrait on unmount
      Orientation.lockToPortrait();
    };
  }, [notifyParentGesture]);

  // Exit fullscreen callback
  const exitFullscreen = useCallback(() => {
    // Rotate first for smooth transition
    Orientation.lockToPortrait();
    setTimeout(() => {
      setIsFullscreen(false);
      setStatusBarHidden(false);
    }, 100);
  }, []);

  // Handle Android back button in fullscreen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFullscreen) {
          exitFullscreen();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [isFullscreen, exitFullscreen]);
  // Auto-hide controls after 3 seconds
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    if (!paused) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [paused]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  // Video event handlers
  const handleLoad = useCallback((data: OnLoadData) => {
    console.log('[TipTubeVideoPlayer] Video loaded:', data);
    
    if (isAdPlaying) {
      // Ad video loaded
      setAdDuration(data.duration);
      setAdCurrentTime(0);
      setTrackedEvents(new Set(['impression']));
      setLoading(false);
      
      // Track impression and start events
      if (onAdEvent) {
        onAdEvent('impression');
        onAdEvent('start');
      }
    } else {
      // Content video loaded
      setDuration(data.duration);
      setCurrentTime(0);
      setLoading(false);
      setError(null);
    }
  }, [isAdPlaying, onAdEvent]);

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      if (isAdPlaying) {
        // Track ad progress
        setAdCurrentTime(data.currentTime);
        
        // Fire quartile tracking events
        if (adDuration > 0 && onAdEvent) {
          const percent = (data.currentTime / adDuration) * 100;
          
          if (percent >= 25 && !trackedEvents.has('firstQuartile')) {
            onAdEvent('firstQuartile');
            setTrackedEvents(prev => new Set(prev).add('firstQuartile'));
          }
          
          if (percent >= 50 && !trackedEvents.has('midpoint')) {
            onAdEvent('midpoint');
            setTrackedEvents(prev => new Set(prev).add('midpoint'));
          }
          
          if (percent >= 75 && !trackedEvents.has('thirdQuartile')) {
            onAdEvent('thirdQuartile');
            setTrackedEvents(prev => new Set(prev).add('thirdQuartile'));
          }
        }
      } else {
        // Content video progress
        if (!isSeeking) {
          setCurrentTime(data.currentTime);
        }
      }
    },
    [isSeeking, isAdPlaying, adDuration, trackedEvents, onAdEvent],
  );

  /**
   * Helper function to credit ad rewards
   */
  const creditAdReward = useCallback(async (watchDuration: number, wasSkipped: boolean = false) => {
    if (!adData || !adData.campaignId || !adData.creative.id) {
      console.log('[TipTubeVideoPlayer] ⚠️ Cannot credit reward - missing ad data');
      return;
    }

    try {
      console.log('[TipTubeVideoPlayer] 💰 Attempting to credit ad reward...');
      console.log('[TipTubeVideoPlayer]   Campaign ID:', adData.campaignId);
      console.log('[TipTubeVideoPlayer]   Creative ID:', adData.creative.id);
      console.log('[TipTubeVideoPlayer]   Watch Duration:', watchDuration, 'seconds');
      console.log('[TipTubeVideoPlayer]   Was Skipped:', wasSkipped);

      // Get user ID from storage
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        console.log('[TipTubeVideoPlayer] ❌ No user data found, skipping reward credit');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData.id || userData.userId;

      if (!userId) {
        console.log('[TipTubeVideoPlayer] ❌ No user ID found, skipping reward credit');
        return;
      }

      console.log('[TipTubeVideoPlayer]   User ID:', userId);

      // For skipped ads, only credit if they watched past the skip offset
      if (wasSkipped && watchDuration < adData.skipOffset) {
        console.log('[TipTubeVideoPlayer] ❌ User skipped before skip offset, no reward');
        return;
      }

      console.log('[TipTubeVideoPlayer] 📡 Calling credit-reward API...');
      const response = await VideoAdRewardService.creditReward(
        userId,
        adData.campaignId,
        adData.creative.id,
        watchDuration,
        adData.sessionId
      );

      console.log('[TipTubeVideoPlayer] ✅ Credit-reward API response:', response);

      if (response.status === 200 && response.data.credited) {
        console.log('[TipTubeVideoPlayer] 🎉 Reward credited successfully! Amount:', response.data.rewardAmount);
        Toast.show({
          type: 'success',
          text1: '🎉 Reward Earned!',
          text2: `You earned ₹${response.data.rewardAmount} for watching this ad!`,
          visibilityTime: 4000,
        });
      } else {
        console.log('[TipTubeVideoPlayer] ⚠️ Reward not credited. Response:', response);
      }
    } catch (error: any) {
      // Don't interrupt playback for reward errors
      console.error('[TipTubeVideoPlayer] ❌ Failed to credit ad reward:', error);
      console.error('[TipTubeVideoPlayer]    Error details:', JSON.stringify(error, null, 2));
      if (error?.message && !error.message.includes('already been rewarded')) {
        console.warn('[TipTubeVideoPlayer] Reward credit error:', error.message);
      }
    }
  }, [adData]);

  const handleEnd = useCallback(async () => {
    console.log('[TipTubeVideoPlayer] 🎬 Video ended, isAdPlaying:', isAdPlaying);
    
    if (isAdPlaying) {
      // Ad finished - track completion and credit reward
      console.log('[TipTubeVideoPlayer] 🎬 Ad completed, transitioning to content video');
      if (onAdEvent) {
        onAdEvent('complete');
      }

      // Credit reward
      const watchDuration = adCurrentTime > 0 ? adCurrentTime : adDuration;
      console.log('[TipTubeVideoPlayer] 💰 Crediting ad reward with duration:', watchDuration);
      await creditAdReward(watchDuration, false);

      // This will trigger the parent to set isAdPlaying=false, causing content video to load
      onAdComplete?.();
    } else {
      // Content video ended
      console.log('[TipTubeVideoPlayer] 📺 Content video completed');
      setPaused(true);
      setShowControls(true);
      onVideoEnd?.();
    }
  }, [isAdPlaying, onAdEvent, onAdComplete, onVideoEnd, adCurrentTime, adDuration, creditAdReward]);

  const handleError = useCallback((error: any) => {
    console.error('[TipTubeVideoPlayer] Video error:', error);
    console.error('[TipTubeVideoPlayer] Error details:', JSON.stringify(error, null, 2));
    console.error('[TipTubeVideoPlayer] Current video source:', isAdPlaying ? 'AD' : 'CONTENT');
    console.error('[TipTubeVideoPlayer] Current URI:', isAdPlaying && adData ? adData.creative.url : videoUrl);

    // Handle specific ExoPlayer errors
    if (
      error?.error?.errorCode === '1001' ||
      error?.error?.errorString?.includes('Current Activity is null')
    ) {
      console.log(
        '[TipTubeVideoPlayer] Activity context error, will retry on next render',
      );
      setLoading(false);
      return;
    }

    setError('Failed to load video. Please try again.');
    setLoading(false);
    
    // If ad fails, skip it and play content
    if (isAdPlaying) {
      console.log('[TipTubeVideoPlayer] Ad failed to load, skipping to content video');
      if (onAdEvent) {
        onAdEvent('error');
      }
      onAdComplete?.();
    }
  }, [isAdPlaying, adData, videoUrl, onAdEvent, onAdComplete]);

  // Control handlers
  const togglePlayPause = useCallback(() => {
    // Don't allow pausing ads manually (unless through ad click)
    if (isAdPlaying) {
      return;
    }
    
    const newPausedState = !paused;
    setPaused(newPausedState);

    if (newPausedState) {
      onVideoPause?.();
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    } else {
      onVideoPlay?.();
      resetHideControlsTimer();
    }
  }, [paused, isAdPlaying, onVideoPlay, onVideoPause, resetHideControlsTimer]);

  // Toggle fullscreen with automatic rotation
  const toggleFullscreen = useCallback(() => {
    const newFullscreen = !isFullscreen;

    if (newFullscreen) {
      // Entering fullscreen: update state and rotate simultaneously
      setIsFullscreen(true);
      setStatusBarHidden(true);
      Orientation.lockToLandscape();
    } else {
      // Exiting fullscreen: rotate first for smooth transition
      Orientation.lockToPortrait();
      // Small delay for orientation to settle before UI update
      setTimeout(() => {
        setIsFullscreen(false);
        setStatusBarHidden(false);
      }, 100);
    }
  }, [isFullscreen]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleSeek = useCallback((value: number) => {
    setCurrentTime(value);
    setIsSeeking(true);
  }, []);

  const handleSeekComplete = useCallback(
    (value: number) => {
      videoRef.current?.seek(value);
      setIsSeeking(false);
      resetHideControlsTimer();
    },
    [resetHideControlsTimer],
  );

  const handleTapVideo = useCallback(() => {
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  // Handle fullscreen state changes
  useEffect(() => {
    // Reset drag position and show controls
    dragY.setValue(0);
    setShowControls(true);

    if (isFullscreen) {
      resetHideControlsTimer();
    }

    if (previousFullscreen.current !== isFullscreen) {
      onFullscreenChange?.(isFullscreen);
      if (previousFullscreen.current && !isFullscreen) {
        onExitFullscreen?.();
      }
    }

    previousFullscreen.current = isFullscreen;
  }, [
    isFullscreen,
    dragY,
    onExitFullscreen,
    onFullscreenChange,
    resetHideControlsTimer,
  ]);

  // PanResponder for drag-to-close (only in non-fullscreen)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isFullscreen,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!isFullscreen && gestureState.dy > 10) {
          if (!isDraggingToClose.current) {
            isDraggingToClose.current = true;
            notifyParentGesture(true);
          }
          return true;
        }
        return false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isFullscreen && gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isFullscreen && isDraggingToClose.current) {
          if (gestureState.dy > 150 && gestureState.vy > 0.5) {
            Animated.timing(dragY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              isDraggingToClose.current = false;
              notifyParentGesture(false);
              onDragClose?.();
            });
            return;
          }

          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start(() => {
            isDraggingToClose.current = false;
            notifyParentGesture(false);
          });
          return;
        }

        if (isDraggingToClose.current) {
          isDraggingToClose.current = false;
          notifyParentGesture(false);
        }
      },
      onPanResponderTerminate: () => {
        if (isDraggingToClose.current) {
          isDraggingToClose.current = false;
          notifyParentGesture(false);
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    }),
  ).current;

  // Prepare video source - play ad first, then content video
  const currentVideoUrl = isAdPlaying && adData ? adData.creative.url : videoUrl;
  const videoSource = {
    uri: currentVideoUrl,
    headers: {
      Accept: 'video/*',
    },
  };

  console.log('[TipTubeVideoPlayer] Current video source:', {
    isAdPlaying,
    hasAdData: !!adData,
    currentUrl: currentVideoUrl,
    adUrl: adData?.creative?.url,
    contentUrl: videoUrl
  });

  // Debug logging for video playback
  useEffect(() => {
    if (isAdPlaying && adData) {
      console.log('[TipTubeVideoPlayer] 🎬 AD PLAYBACK DEBUG:');
      console.log('[TipTubeVideoPlayer]   Playing ad video directly in main player');
      console.log('[TipTubeVideoPlayer]   Ad URL:', adData.creative.url);
      console.log('[TipTubeVideoPlayer]   Ad duration:', adData.creative.duration, 'seconds');
      console.log('[TipTubeVideoPlayer]   Is skippable:', adData.isSkippable);
      console.log('[TipTubeVideoPlayer]   Skip after:', adData.skipOffset, 'seconds');
      console.log('[TipTubeVideoPlayer]   Paused state:', paused);
    } else if (!isAdPlaying) {
      console.log('[TipTubeVideoPlayer] 📺 CONTENT PLAYBACK DEBUG:');
      console.log('[TipTubeVideoPlayer]   Playing content video in main player');
      console.log('[TipTubeVideoPlayer]   Content URL:', videoUrl);
      console.log('[TipTubeVideoPlayer]   Paused state:', paused);
    }
  }, [isAdPlaying, adData, videoUrl, paused]);

  const containerStyle = isFullscreen
    ? styles.fullscreenContainer
    : [styles.container, style];

  const videoStyle = isFullscreen ? styles.fullscreenVideo : styles.video;

  const animatedContainerStyle = !isFullscreen
    ? {
        transform: [{translateY: dragY}],
        opacity: dragY.interpolate({
          inputRange: [0, SCREEN_HEIGHT],
          outputRange: [1, 0],
        }),
      }
    : {};

  return (
    <Animated.View
      style={[containerStyle, animatedContainerStyle]}
      {...(!isFullscreen ? panResponder.panHandlers : {})}>
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTapVideo}
        style={styles.videoContainer}>
        <Video
          key={isAdPlaying ? 'ad' : 'content'} // Force reload when switching between ad and content
          ref={videoRef}
          source={videoSource}
          style={videoStyle}
          paused={paused}
          muted={isMuted}
          resizeMode="contain"
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          poster={isAdPlaying && adData ? adData.creative.thumbnail : thumbnail}
          posterResizeMode="cover"
          repeat={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
          controls={false}
          fullscreen={isFullscreen}
          onLoadStart={() => {
            console.log('[TipTubeVideoPlayer] Video load started');
            setLoading(true);
          }}
          onBuffer={({isBuffering}) => {
            console.log('[TipTubeVideoPlayer] Buffering:', isBuffering);
          }}
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D9FF" />
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Controls Overlay - Hide during ads, show during content */}
        {showControls && !loading && !error && !isAdPlaying && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                onPress={toggleMute}
                style={styles.controlButton}>
                {isMuted ? (
                  <VolumeX size={24} color="#FFFFFF" />
                ) : (
                  <Volume2 size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity
                onPress={toggleFullscreen}
                style={styles.controlButton}>
                {isFullscreen ? (
                  <Minimize size={24} color="#FFFFFF" />
                ) : (
                  <Maximize size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Center Play/Pause Button */}
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.centerPlayButton}>
              {paused ? (
                <Play size={48} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Pause size={48} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={currentTime}
                  onValueChange={handleSeek}
                  onSlidingComplete={handleSeekComplete}
                  minimumTrackTintColor="#00D9FF"
                  maximumTrackTintColor="#FFFFFF40"
                  thumbTintColor="#00D9FF"
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ad Controls Overlay - Simple skip button and ad info */}
        {isAdPlaying && adData && (
          <View style={styles.adControlsOverlay}>
            {/* Ad Info */}
            <View style={styles.adInfoContainer}>
              <Text style={styles.adInfoText}>
                {adData.isSkippable && adCurrentTime >= adData.skipOffset
                  ? `Ad • ${Math.max(0, Math.ceil(adDuration - adCurrentTime))}s`
                  : adData.isSkippable
                  ? `Ad • Skip in ${Math.max(0, Math.ceil(adData.skipOffset - adCurrentTime))}s`
                  : `Ad • ${Math.max(0, Math.ceil(adDuration - adCurrentTime))}s`}
              </Text>
            </View>

            {/* Skip Button */}
            {adData.isSkippable && adCurrentTime >= adData.skipOffset && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={async () => {
                  console.log('[TipTubeVideoPlayer] ⏭️ User clicked Skip Ad button');
                  console.log('[TipTubeVideoPlayer]   Current time:', adCurrentTime);
                  console.log('[TipTubeVideoPlayer]   Skip offset:', adData.skipOffset);
                  
                  if (onAdEvent) {
                    onAdEvent('skip');
                  }
                  // Credit reward for skipped ad (if they watched past skip offset)
                  console.log('[TipTubeVideoPlayer] 💰 Crediting reward for skipped ad...');
                  await creditAdReward(adCurrentTime, true);
                  onAdSkip?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip Ad</Text>
              </TouchableOpacity>
            )}

            {/* Visit Advertiser Button */}
            <TouchableOpacity
              style={styles.visitButton}
              onPress={() => {
                // Pause the ad when user clicks to visit advertiser
                setPaused(true);
                onAdClick?.();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.visitButtonText}>Visit Advertiser</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 9999,
    elevation: 9999,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spacer: {
    flex: 1,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -40}, {translateY: -40}],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressSlider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  // Ad Controls Styles
  adControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 20,
  },
  adInfoContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 12,
  },
  adInfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  skipButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  visitButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 168, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  visitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Memoize to prevent unnecessary re-renders
export default memo(TipTubeVideoPlayer, (prevProps, nextProps) => {
  // Re-render if videoUrl, isAdPlaying, or adData changes
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.isAdPlaying === nextProps.isAdPlaying &&
    prevProps.adData === nextProps.adData
  );
});
