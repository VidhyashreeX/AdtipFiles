// src/screens/media/VideoPreviewScreen.tsx
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import { Play, Pause } from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';

const VideoPreviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<any>(null);

  // Get video URI from route params
  // @ts-ignore
  const {postId} = route.params || {};

  // State
  const [uri, setUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!postId) {
        Alert.alert('Error', 'No video ID provided.');
        setIsLoading(false);
        return;
      }
      try {
        // This is a placeholder for your actual API call to get post details
        // You should replace this with a call to your ApiService
        // For example: const response = await ApiService.get(`/posts/${postId}`);
        // const videoUrl = response.data.videoUrl;
        
        // Using a placeholder API for demonstration
        const response = await fetch(`https://api.adtip.in/api/getpostdetails/${postId}`);
        const data = await response.json();

        if (data && data.data && data.data.media_url) {
          let videoUrl = data.data.media_url;
          if (!videoUrl.startsWith('http')) {
            videoUrl = `https://api.adtip.in${videoUrl}`;
          }
          setUri(videoUrl);
        } else {
          throw new Error('Video URL not found in API response.');
        }
      } catch (error) {
        console.error('Failed to fetch video details:', error);
        Alert.alert('Error', 'Could not load video.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
  }, [postId]);

  // Control timer ref
  const controlsTimerRef = useRef<any>(null);

  // Handle press on video to show/hide controls
  const handleVideoPress = () => {
    setShowControls(!showControls);

    if (!showControls) {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }

      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    if (!isPlaying) {
      // When resuming playback, hide controls after delay
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      Orientation.lockToPortrait();
    } else {
      Orientation.lockToLandscape();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle video progress
  const handleProgress = ({currentTime: progressCurrentTime, seekableDuration}: any) => {
    setCurrentTime(progressCurrentTime);
    if (seekableDuration) {
      setProgress(progressCurrentTime / seekableDuration);
    }
  };

  // Handle video load
  const handleLoad = ({duration: loadDuration}: any) => {
    setIsBuffering(false);
    setDuration(loadDuration);
  };

  // Handle video end
  const handleEnd = () => {
    setIsPlaying(false);
    setProgress(1);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  // Close preview
  const handleClose = () => {
    Orientation.lockToPortrait();
    navigation.goBack();
  };

  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Calculate safe area for fullscreen mode
  const safeAreaStyle = {
    paddingTop: isFullscreen ? 0 : insets.top,
    paddingBottom: isFullscreen ? 0 : insets.bottom,
    paddingLeft: isFullscreen ? 0 : insets.left,
    paddingRight: isFullscreen ? 0 : insets.right,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.containerBlack, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.containerBlack, safeAreaStyle]}>
      

      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoContainer}
        onPress={handleVideoPress}>
        {uri ? (
          <Video
            ref={videoRef}
            source={{uri: String(uri || '')}}
            style={styles.video}
            resizeMode="contain"
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={handleEnd}
            paused={!isPlaying}
            onBuffer={({isBuffering: buffering}) => setIsBuffering(buffering)}
            repeat={false}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Icon name="alert-triangle" size={48} color="#fff" />
            <Text style={styles.errorText}>Video not available</Text>
          </View>
        )}

        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Video controls */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Top controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}>
                <Icon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playPauseButton}>
                {isPlaying ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              {/* Progress bar */}
              <View style={styles.progressRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[styles.progressBar, {width: `${progress * 100}%`}]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                <View style={styles.leftActions}>
                  {/* Empty for now, could add volume etc. */}
                </View>

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    onPress={toggleFullscreen}
                    style={styles.actionButton}>
                    <Icon
                      name={isFullscreen ? 'minimize' : 'maximize'}
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerBlack: {
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
  },
  rightActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPreviewScreen;
