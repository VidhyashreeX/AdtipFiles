import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import { VolumeX, Volume2, Play, Pause } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
// Removing unused import
// import ApiService from '../../services/ApiService';
import VideoCard from '../../components/tiptube/VideoCard';
import { createSecureVideoSource, getSecureMediaUrl } from '../../utils/mediaUtils';

interface VideoData {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  video_url: string | null;
  user_id: number;
  user_name: string;
  user_profile_image: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: string;
  created_at: string;
  is_premium: boolean;
  price?: number;
  // Cloudflare Stream fields
  stream_video_id?: string;
  stream_status?: 'uploading' | 'ready' | 'error' | 'inprogress';
  adaptive_manifest_url?: string;
  stream_ready_at?: string;
}

interface VideoPlayerModalProps {
  visible: boolean;
  videoData: VideoData | null;
  relatedVideos: VideoData[];
  onClose: () => void;
  onVideoSelect: (video: VideoData) => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  videoData,
  relatedVideos,
  onClose,
  onVideoSelect,
}) => {
  const {colors} = useTheme();
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);

  // Move showControlsTemporarily above useEffect to avoid use-before-define
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Reset controls visibility when video changes
  useEffect(() => {
    if (visible) {
      showControlsTemporarily();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [visible, videoData?.id, showControlsTemporarily]);

  // Load secure video source when video data changes
  useEffect(() => {
    const loadSecureVideoSource = async () => {
      if (videoData?.video_url) {
        try {
          console.log('[VideoPlayerModal] Loading secure video source for:', videoData.video_url);
          const secureSource = await createSecureVideoSource(videoData.video_url);
          setSecureVideoSource(secureSource);
          console.log('[VideoPlayerModal] Secure video source loaded:', secureSource);
        } catch (error) {
          console.error('[VideoPlayerModal] Failed to load secure video source:', error);
        }
      }
    };

    loadSecureVideoSource();
  }, [videoData?.video_url]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    showControlsTemporarily();
  };

  const handleVideoPress = () => {
    showControlsTemporarily();
  };

  // Commenting out unused function but keeping for future implementation
  // const handleSeek = (value: number) => {
  //   if (videoRef.current) {
  //     videoRef.current.seek(value);
  //   }
  //   setCurrentTime(value);
  //   showControlsTemporarily();
  // };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    showControlsTemporarily();
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    showControlsTemporarily();
  };

  // Video player progress bar
  const renderProgressBar = () => {
    const progress = duration > 0 ? currentTime / duration : 0;

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {width: `${progress * 100}%`, backgroundColor: colors.primary},
            ]}
          />
          <View
            style={[
              styles.progressBarBackground,
              {backgroundColor: colors.gray[300]},
            ]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    );
  };

  if (!videoData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {borderBottomColor: colors.gray[200]}]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, {color: colors.text.primary}]}
            numberOfLines={1}>
            {videoData.title}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView>
          <Pressable
            style={[
              styles.videoContainer,
              isFullScreen && styles.fullScreenVideo,
            ]}
            onPress={handleVideoPress}>
            {secureVideoSource ? (
              <Video
                ref={videoRef}
                source={secureVideoSource}
                paused={!isPlaying}
                muted={isMuted}
                repeat={false}
                resizeMode="contain"
                style={styles.video}
                onLoad={(data) => {
                  if (data && data.duration) {
                    setDuration(data.duration);
                  }
                }}
                onProgress={(data) => {
                  if (data && data.currentTime) {
                    setCurrentTime(data.currentTime);
                  }
                }}
                onError={(error) => {
                  console.error('[VideoPlayerModal] Video playback error:', error);
                }}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
              />
            ) : (
              <View
                style={[
                  styles.videoPlaceholder,
                  {backgroundColor: colors.gray[800]},
                ]}>
                <Text style={styles.videoPlaceholderText}>
                  Video not available
                </Text>
              </View>
            )}

            {isBuffering && (
              <View style={styles.bufferingContainer}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}

            {showControls && (
              <View style={styles.controlsOverlay}>
                <View style={styles.mainControls}>
                  <TouchableOpacity
                    onPress={handleToggleMute}
                    style={styles.controlButton}>
                    {isMuted ? (
                      <VolumeX size={24} color={colors.white} />
                    ) : (
                      <Volume2 size={24} color={colors.white} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePlayPause}
                    style={styles.playPauseButton}>
                    {isPlaying ? (
                      <Pause size={32} color={colors.white} />
                    ) : (
                      <Play size={32} color={colors.white} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleToggleFullScreen}
                    style={styles.controlButton}>
                    <Icon
                      name={isFullScreen ? 'minimize' : 'maximize'}
                      size={24}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
                {renderProgressBar()}
              </View>
            )}
          </Pressable>

          <View style={styles.videoInfoContainer}>
            <Text style={[styles.videoTitle, {color: colors.text.primary}]}>
              {videoData.title}
            </Text>

            <View style={styles.videoStats}>
              <Text style={[styles.viewCount, {color: colors.text.secondary}]}>
                {(videoData.view_count || 0).toLocaleString()} views •{' '}
                {new Date(videoData.created_at).toLocaleDateString()}
              </Text>

              <View style={styles.videoActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon
                    name="thumbs-up"
                    size={20}
                    color={colors.text.secondary}
                  />
                  <Text
                    style={[styles.actionText, {color: colors.text.secondary}]}>
                    {(videoData.like_count || 0).toLocaleString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Icon
                    name="message-square"
                    size={20}
                    color={colors.text.secondary}
                  />
                  <Text
                    style={[styles.actionText, {color: colors.text.secondary}]}>
                    {(videoData.comment_count || 0).toLocaleString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="share" size={20} color={colors.text.secondary} />
                  <Text
                    style={[styles.actionText, {color: colors.text.secondary}]}>
                    Share
                  </Text>
                </TouchableOpacity>

                {videoData.is_premium && (
                  <View
                    style={[
                      styles.premiumBadge,
                      {backgroundColor: colors.secondary},
                    ]}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}

                {videoData.price && videoData.price > 0 && (
                  <View
                    style={[
                      styles.priceBadge,
                      {backgroundColor: colors.success},
                    ]}>
                    <Text style={styles.priceText}>
                      ${videoData.price.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View
              style={[
                styles.channelContainer,
                {borderBottomColor: colors.gray[200]},
              ]}>
              <View style={styles.channelInfo}>
                {videoData.user_profile_image ? (
                  <Image
                    source={{uri: videoData.user_profile_image}}
                    style={styles.channelImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.channelImagePlaceholder,
                      {backgroundColor: colors.gray[300]},
                    ]}
                  />
                )}

                <View style={styles.channelTextContainer}>
                  <Text
                    style={[styles.channelName, {color: colors.text.primary}]}>
                    {videoData.user_name}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  {backgroundColor: colors.primary},
                ]}>
                <Text style={styles.subscribeText}>Subscribe</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.descriptionContainer}>
              <Text
                style={[styles.description, {color: colors.text.secondary}]}>
                {videoData.description || 'No description available'}
              </Text>
            </View>
          </View>

          <View style={styles.relatedVideosContainer}>
            <Text
              style={[styles.relatedVideosTitle, {color: colors.text.primary}]}>
              Related Videos
            </Text>

            <View style={styles.relatedVideosList}>
              {relatedVideos.map(video => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={String(video.title || '')}
                  thumbnailUrl={video.thumbnail_url || ''}
                  duration={String(video.duration || '0:00')}
                  username={String(video.user_name || 'User')}
                  userImageUrl={video.user_profile_image || undefined}
                  views={video.view_count || 0}
                  postedTime={String(
                    new Date(video.created_at).toLocaleDateString(),
                  )}
                  isPremium={video.is_premium}
                  onPress={() => onVideoSelect(video)}
                />
              ))}

              {relatedVideos.length === 0 && (
                <View style={styles.noRelatedContainer}>
                  <Text style={{color: colors.text.secondary}}>
                    No related videos found
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  fullScreenVideo: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 16,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 16,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  playPauseButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  progressBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  videoInfoContainer: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoStats: {
    marginBottom: 16,
  },
  viewCount: {
    fontSize: 14,
    marginBottom: 8,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  channelImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  channelTextContainer: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  subscribeText: {
    color: 'white',
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  relatedVideosContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  relatedVideosTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  relatedVideosList: {
    gap: 16,
  },
  noRelatedContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default VideoPlayerModal;
