/**
 * TipTubeVideoPlayer - Simple, stable video player component
 * 
 * Similar to web's TiptubePlayer, this component:
 * - Uses React.memo to prevent unnecessary re-renders
 * - Has minimal state and dependencies
 * - Focuses on playing video without complex logic
 * - Stable controls and playback experience
 */

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
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
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Feather';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react-native';
import Orientation from 'react-native-orientation-locker';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  // Exit fullscreen callback
  const exitFullscreen = useCallback(() => {
    // Immediately update state and UI
    setIsFullscreen(false);
    Orientation.lockToPortrait();
    StatusBar.setHidden(false);
    onExitFullscreen?.();
  }, [onExitFullscreen]);

  // Lock orientation to portrait when component unmounts or loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        Orientation.lockToPortrait();
        StatusBar.setHidden(false);
      };
    }, [])
  );

  // Handle Android back button in fullscreen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullscreen) {
        exitFullscreen();
        return true;
      }
      return false;
    });

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
    setDuration(data.duration);
    setLoading(false);
    setError(null);
  }, []);

  const handleProgress = useCallback((data: OnProgressData) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  }, [isSeeking]);

  const handleEnd = useCallback(() => {
    console.log('[TipTubeVideoPlayer] Video ended');
    setPaused(true);
    setShowControls(true);
    onVideoEnd?.();
  }, [onVideoEnd]);

  const handleError = useCallback((error: any) => {
    console.error('[TipTubeVideoPlayer] Video error:', error);
    
    // Handle specific ExoPlayer errors
    if (error?.error?.errorCode === '1001' || error?.error?.errorString?.includes('Current Activity is null')) {
      console.log('[TipTubeVideoPlayer] Activity context error, will retry on next render');
      setLoading(false);
      return;
    }
    
    setError('Failed to load video. Please try again.');
    setLoading(false);
  }, []);

  // Control handlers
  const togglePlayPause = useCallback(() => {
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
  }, [paused, onVideoPlay, onVideoPause, resetHideControlsTimer]);

  // Toggle fullscreen with automatic rotation
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      Orientation.lockToLandscape();
      StatusBar.setHidden(true);
      setIsFullscreen(true);
    }
  }, [isFullscreen, exitFullscreen]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleSeek = useCallback((value: number) => {
    setCurrentTime(value);
    setIsSeeking(true);
  }, []);

  const handleSeekComplete = useCallback((value: number) => {
    videoRef.current?.seek(value);
    setIsSeeking(false);
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleTapVideo = useCallback(() => {
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  // PanResponder for drag-to-close (only in non-fullscreen)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isFullscreen,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isFullscreen && gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isFullscreen && gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isFullscreen) {
          if (gestureState.dy > 150 && gestureState.vy > 0.5) {
            Animated.timing(dragY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onDragClose?.();
            });
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;

  // Prepare video source with better error handling
  const videoSource = {
    uri: videoUrl,
    headers: {
      'Accept': 'video/*',
    },
  };

  const containerStyle = isFullscreen
    ? styles.fullscreenContainer
    : [styles.container, style];

  const videoStyle = isFullscreen
    ? styles.fullscreenVideo
    : styles.video;

  const animatedContainerStyle = !isFullscreen
    ? {
        transform: [{ translateY: dragY }],
        opacity: dragY.interpolate({
          inputRange: [0, SCREEN_HEIGHT],
          outputRange: [1, 0],
        }),
      }
    : {};

  return (
    <Animated.View style={[containerStyle, animatedContainerStyle]} {...(!isFullscreen ? panResponder.panHandlers : {})}>
      {/* Video Player */}
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleTapVideo}
        style={styles.videoContainer}
      >
        <Video
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
          poster={thumbnail}
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

        {/* Controls Overlay */}
        {showControls && !loading && !error && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity 
                onPress={toggleMute}
                style={styles.controlButton}
              >
                {isMuted ? (
                  <VolumeX size={24} color="#FFFFFF" />
                ) : (
                  <Volume2 size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity 
                onPress={toggleFullscreen}
                style={styles.controlButton}
              >
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
              style={styles.centerPlayButton}
            >
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
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
    transform: [{ translateX: -40 }, { translateY: -40 }],
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
});

// Memoize to prevent unnecessary re-renders
export default memo(TipTubeVideoPlayer, (prevProps, nextProps) => {
  // Only re-render if videoUrl changes
  return prevProps.videoUrl === nextProps.videoUrl;
});