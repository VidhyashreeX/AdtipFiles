// src/components/home/PostItem.tsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import { Heart, MessageCircle, Share2, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  createSecureImageSource, 
  createSecureVideoSource, 
  testVideoUrl, 
  validateAndFixVideoUrl 
} from '../../utils/mediaUtils';

const {width} = Dimensions.get('window');

interface PostItemProps {
  id: number;
  username: string;
  profileImage?: string | null;
  postImage: string | null;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  created_at?: string;
  media_type?: string;
  isPremium?: boolean;
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onShare: (id: number) => void;
  onPostPress: (id: number) => void;
  onUserPress: (userId: number) => void;
  onFollow: (userId: number) => Promise<void>;
  isLiked?: boolean;
  userId: number;
  isVisible?: boolean;
  last_active?: string | null;
}

// Function to calculate relative time
const calculateRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
};

const PostItem: React.FC<PostItemProps> = ({
  id,
  username,
  profileImage,
  postImage,
  caption,
  likes,
  comments,
  timeAgo,
  created_at,
  media_type,
  isPremium = false,
  onLike,
  onComment,
  onShare,
  onPostPress,
  onUserPress,
  onFollow,
  isLiked = false,
  userId,
  isVisible = false,
  last_active,
}) => {
  const {colors, isDarkMode} = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);
  const [secureProfileImage, setSecureProfileImage] = useState<any>(null);
  const [securePostImage, setSecurePostImage] = useState<any>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);
  const [videoUrlTested, setVideoUrlTested] = useState(false);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);

  // Defensive: Ensure all text props are strings or numbers
  const safeUsername = typeof username === 'string' || typeof username === 'number' ? String(username) : '';
  const safeCaption = typeof caption === 'string' || typeof caption === 'number' ? String(caption) : '';
  const safeTimeAgo = created_at ? calculateRelativeTime(created_at) : (typeof timeAgo === 'string' || typeof timeAgo === 'number' ? String(timeAgo) : '');
  const safeLastActive = typeof last_active === 'string' || typeof last_active === 'number' ? String(last_active) : '';

  if (typeof username !== 'string' && typeof username !== 'number') {
    console.warn('PostItem: username is not a string/number', username);
  }
  if (typeof caption !== 'string' && typeof caption !== 'number') {
    console.warn('PostItem: caption is not a string/number', caption);
  }
  if (typeof timeAgo !== 'string' && typeof timeAgo !== 'number') {
    console.warn('PostItem: timeAgo is not a string/number', timeAgo);
  }
  if (last_active && typeof last_active !== 'string' && typeof last_active !== 'number') {
    console.warn('PostItem: last_active is not a string/number', last_active);
  }

  // Enhanced video URL testing and validation
  const testAndValidateVideoUrl = useCallback(async (url: string | null) => {
    if (!url || videoUrlTested) return;
    
    console.log(`[PostItem ${id}] Testing video URL:`, url);
    setOriginalVideoUrl(url);
    
    const testResult = await testVideoUrl(url);
    setVideoUrlTested(true);
    
    console.log(`[PostItem ${id}] Video URL test result:`, testResult);
    
    if (!testResult.isValid) {
      console.error(`[PostItem ${id}] Video URL failed validation:`, {
        originalUrl: url,
        error: testResult.error,
        status: testResult.status
      });
      setVideoError(true);
    }
  }, [id, videoUrlTested]);

  // Load secure media sources with enhanced error handling
  useEffect(() => {
    const loadSecureMedia = async () => {
      try {
        // Load secure profile image
        if (profileImage) {
          const secureProfile = await createSecureImageSource(profileImage);
          setSecureProfileImage(secureProfile);
        }

        // Load secure post media
        if (postImage) {
          if (media_type === 'video') {
            console.log(`[PostItem ${id}] Loading video:`, postImage);
            
            // Test the video URL first
            await testAndValidateVideoUrl(postImage);
            
            // Create secure video source
            const secureVideo = await createSecureVideoSource(postImage);
            console.log(`[PostItem ${id}] Created secure video source:`, {
              hasUri: !!secureVideo.uri,
              uri: secureVideo.uri,
              hasHeaders: !!(secureVideo as any).headers
            });
            setSecureVideoSource(secureVideo);
          } else {
            const secureImage = await createSecureImageSource(postImage);
            setSecurePostImage(secureImage);
          }
        }
      } catch (error) {
        console.error(`[PostItem ${id}] Failed to load secure media:`, error);
        if (media_type === 'video') {
          setVideoError(true);
        }
      }
    };

    loadSecureMedia();
  }, [profileImage, postImage, media_type, id, testAndValidateVideoUrl]);

  // Enhanced Video Playback Logic - INSTANT play/pause on visibility change
  useEffect(() => {
    if (media_type === 'video') {
      if (isVisible && !wasManuallyPaused && !videoError) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [isVisible, wasManuallyPaused, media_type, videoError]);

  const togglePlayPause = useCallback(() => {
    if (media_type === 'video' && !videoError) {
      setIsPlaying(prev => !prev);
      setWasManuallyPaused(!isPlaying);
    }
  }, [media_type, videoError, isPlaying]);

  const toggleMute = useCallback(() => {
    if (media_type === 'video') {
      setIsMuted(prev => !prev);
    }
  }, [media_type]);

  const handleVideoLoadStart = useCallback(() => {
    console.log(`[PostItem ${id}] Video load started`);
    setVideoLoading(true);
  }, [id]);

  const handleVideoLoad = useCallback((data: any) => {
    console.log(`[PostItem ${id}] Video loaded successfully:`, {
      duration: data.duration,
      naturalSize: data.naturalSize
    });
    setVideoDuration(data.duration);
    setVideoLoading(false);
    setVideoError(false);
  }, [id]);

  const handleVideoProgress = useCallback((progress: any) => {
    setVideoProgress(progress.currentTime);
  }, []);

  const handleVideoEnd = useCallback(() => {
    console.log(`[PostItem ${id}] Video playback ended`);
    setIsPlaying(false);
    setWasManuallyPaused(false);
  }, [id]);

  const handleVideoError = useCallback((error: any) => {
    console.error(`[PostItem ${id}] Video playback error:`, {
      error: error,
      originalUrl: originalVideoUrl,
      secureVideoSource: secureVideoSource
    });
    
    setVideoError(true);
    setIsPlaying(false);
    setVideoLoading(false);
    setWasManuallyPaused(false);
  }, [id, originalVideoUrl, secureVideoSource]);

  const handleLikePress = () => {
    onLike(id);
  };

  const handleCommentPress = () => {
    onComment(id);
  };

  const handleSharePress = () => {
    onShare(id);
  };

  const handlePostPress = () => {
    onPostPress(id);
  };

  const handleUserPress = () => {
    onUserPress(userId);
  };

  const handleFollowPress = async () => {
    await onFollow(userId);
  };

  try {
    return (
      <View style={[styles.postContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* User Info Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
            <Image
              source={secureProfileImage || {
                uri: 'https://via.placeholder.com/40x40.png?text=U',
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={[styles.username, {color: colors.text.primary}]}>
                {safeUsername}
              </Text>
              {safeLastActive.trim() && (
                <Text style={[styles.lastActive, {color: colors.text.secondary}]}>
                  Active {safeLastActive}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFollowPress} style={styles.followIconButton}>
            <UserPlus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Media Content (Image or Video) */}
        <TouchableOpacity onPress={handlePostPress} activeOpacity={1}>
          <View style={styles.mediaContainer}>
            {media_type === 'image' && postImage && securePostImage && (
              <Image
                source={securePostImage}
                style={styles.postMedia}
                resizeMode="cover"
              />
            )}

            {media_type === 'video' && postImage && secureVideoSource && !videoError && (
              <TouchableWithoutFeedback onPress={togglePlayPause}>
                <View style={styles.videoPlayerContainer}>
                  <Video
                    source={secureVideoSource}
                    style={styles.postMedia}
                    resizeMode="cover"
                    repeat={true}
                    paused={!isPlaying} // Instant pause/play response
                    muted={isMuted}
                    onLoadStart={handleVideoLoadStart}
                    onLoad={handleVideoLoad}
                    onProgress={handleVideoProgress}
                    onEnd={handleVideoEnd}
                    onError={handleVideoError}
                    bufferConfig={{
                      minBufferMs: 2000,
                      maxBufferMs: 8000,
                      bufferForPlaybackMs: 500,
                      bufferForPlaybackAfterRebufferMs: 1000,
                    }}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    mixWithOthers="duck"
                  />
                  {videoLoading && (
                    <View style={styles.videoOverlay}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
                        Loading video...
                      </Text>
                    </View>
                  )}
                  {(showControls || !isPlaying || !isVisible) && !videoLoading && (
                    <TouchableOpacity onPress={togglePlayPause} style={styles.videoControlOverlay}>
                      <Icon 
                        name={isPlaying && isVisible ? 'pause-circle' : 'play-circle'} 
                        size={50} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  )}
                  {(showControls || !isPlaying) && !videoLoading && isVisible && (
                    <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                      <Icon name={isMuted ? 'volume-x' : 'volume-2'} size={24} color="white" />
                    </TouchableOpacity>
                  )}
                  {!isVisible && (
                    <View style={styles.outOfViewOverlay}>
                      <Text style={styles.outOfViewText}>Video paused</Text>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
            
            {media_type === 'video' && videoError && (
              <View style={styles.errorMedia}>
                <Icon name="alert-triangle" size={50} color={colors.danger || '#FF0000'} />
                <Text style={[styles.errorText, {color: colors.text.secondary}]}>
                  No media found
                </Text>
              </View>
            )}
            
            {!postImage && (
              <View style={[styles.placeholderMedia, { backgroundColor: colors.surface }]}>
                <Icon name="image" size={50} color={colors.text.tertiary || '#CCCCCC'} />
                <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>No media</Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Actions (Like, Comment, Share) */}
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
              <Heart 
                size={24} 
                color={isLiked ? "#FF0000" : (isDarkMode ? colors.text.primary : "#1A1A1A")} 
                fill={isLiked ? "#FF0000" : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCommentPress} style={styles.actionButton}>
              <MessageCircle size={24} color={isDarkMode ? colors.text.primary : "#1A1A1A"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSharePress} style={styles.actionButton}>
              <Share2 size={24} color={isDarkMode ? colors.text.primary : "#1A1A1A"} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.likesCount, {color: colors.text.primary}]}>
          {`${likes} ${likes === 1 ? 'like' : 'likes'}`}
        </Text>
        {safeCaption.trim() && (
          <Text style={[styles.caption, {color: colors.text.primary}]}>
            <Text style={styles.captionUsername}>{safeUsername}</Text>
            {` ${safeCaption.trim()}`}
          </Text>
        )}
        {comments > 0 && (
          <TouchableOpacity onPress={handleCommentPress}>
            <Text style={[styles.commentsCount, {color: colors.text.secondary}]}>
              View all {comments} comments
            </Text>
          </TouchableOpacity>
        )}
        {safeTimeAgo.trim() && (
          <Text style={[styles.timeAgo, {color: colors.text.secondary}]}>
            {safeTimeAgo}
          </Text>
        )}
      </View>
    );
  } catch (err) {
    console.error('Error rendering PostItem:', err);
    return <Text style={{color: 'red'}}>Error rendering post</Text>;
  }
};

// Add new styles for the enhanced error handling
const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1A1A1A',
  },
  lastActive: {
    fontSize: 12,
    marginTop: 2,
    color: '#666666',
  },
  followIconButton: {
    padding: 4,
  },
  mediaContainer: {
    width: '100%',
    height: width,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMedia: {
    width: '100%',
    height: '100%',
  },
  videoPlayerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  videoControlOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  outOfViewOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfViewText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  errorMedia: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    color: '#FFFFFF',
  },
  placeholderMedia: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#CCCCCC',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  likesCount: {
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsCount: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

export default PostItem;
