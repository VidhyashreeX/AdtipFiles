// src/components/home/PostItem.tsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, VolumeX, Volume2, AlertTriangle, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  createSecureImageSource, 
  createSecureVideoSource, 
  testVideoUrl, 
  validateAndFixVideoUrl 
} from '../../utils/mediaUtils';
import { ProfileFastImage, ContentFastImage } from '../../utils/FastImageOptimizer';

const {width} = Dimensions.get('window');

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

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
  isGloballyMuted?: boolean;
  onToggleGlobalMute?: () => void;
  onPromotedView?: (postId: number) => void;
  isPromoted?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({
  id,
  username,
  profileImage,
  postImage,
  caption,
  likes,
  comments,
  timeAgo,
  media_type = 'image',
  isPremium = false,
  onLike,
  onComment,
  onShare,
  onPostPress,
  onUserPress,
  onFollow,
  isLiked = false,
  userId,
  isVisible = true,
  last_active,
  isGloballyMuted = false,
  onToggleGlobalMute,
  onPromotedView,
  isPromoted = false,
}) => {
  const { colors } = useTheme();
  const [secureProfileImage, setSecureProfileImage] = useState<any>(null);
  const [securePostImage, setSecurePostImage] = useState<any>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);

  // Enhanced video URL testing and validation
  const testAndValidateVideoUrl = useCallback(async (url: string) => {
    try {
      const isValid = await testVideoUrl(url);
      if (!isValid) {
        const fixedUrl = await validateAndFixVideoUrl(url);
        if (fixedUrl) {
          console.log(`[PostItem ${id}] Fixed video URL:`, fixedUrl);
          return fixedUrl;
        }
      }
      return url;
    } catch (error) {
      console.error(`[PostItem ${id}] Video URL validation error:`, error);
      return url;
    }
  }, [id]);

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

  // For image: reward after 5 seconds of being visible
  useEffect(() => {
    let timer: any;
    if (media_type === 'image' && isPromoted && isVisible && !hasRewarded && onPromotedView) {
      timer = setTimeout(() => {
        setHasRewarded(true);
        onPromotedView(id);
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(timer);
  }, [media_type, isPromoted, isVisible, hasRewarded, onPromotedView, id]);

  const handlePostPress = useCallback(() => {
    onPostPress(id);
  }, [onPostPress, id]);

  const handleUserPress = useCallback(() => {
    onUserPress(userId);
  }, [onUserPress, userId]);

  const handleLike = useCallback(() => {
    onLike(id);
  }, [onLike, id]);

  const handleComment = useCallback(() => {
    onComment(id);
  }, [onComment, id]);

  const handleShare = useCallback(() => {
    onShare(id);
  }, [onShare, id]);

  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      await onFollow(userId);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  }, [onFollow, userId, isFollowing, followLoading]);

  const togglePlayPause = useCallback(() => {
    if (media_type === 'video') {
      setWasManuallyPaused(!isPlaying);
      setIsPlaying(!isPlaying);
    }
  }, [media_type, isPlaying]);

  const handleVideoLoadStart = useCallback(() => {
    setVideoLoading(true);
    setVideoError(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setVideoLoading(false);
    setVideoError(false);
  }, []);

  const handleVideoProgress = useCallback(() => {
    // Video is playing successfully
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (isPromoted && !hasRewarded && onPromotedView) {
      setHasRewarded(true);
      onPromotedView(id);
    }
    // Video ended, could restart or show replay button
  }, [isPromoted, hasRewarded, onPromotedView, id]);

  const handleVideoError = useCallback((error: any) => {
    console.error(`[PostItem ${id}] Video error:`, error);
    setVideoLoading(false);
    setVideoError(true);
  }, [id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <ProfileFastImage
            source={profileImage}
            size={32}
            style={styles.profileImage}
          />
          <Text style={[styles.username, { color: colors.text.primary }]}>
            {username}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {}} style={styles.moreButton}>
          <MoreHorizontal size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      <TouchableOpacity onPress={handlePostPress} activeOpacity={1}>
        <View style={styles.mediaContainer}>
          {media_type === 'image' && postImage && (
            <ContentFastImage
              source={postImage}
              style={styles.postMedia}
            />
          )}

          {media_type === 'video' && postImage && !videoError && (
            <TouchableWithoutFeedback onPress={togglePlayPause}>
              <View style={styles.videoPlayerContainer}>
                <Video
                  source={secureVideoSource}
                  style={styles.postMedia}
                  resizeMode="cover"
                  repeat={true}
                  paused={!isPlaying} // Instant pause/play response
                  muted={isGloballyMuted}
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
                {!videoLoading && !isPlaying && (
                  <View style={styles.playButton}>
                    <Play size={40} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          )}

          {media_type === 'video' && videoError && (
            <View style={styles.videoErrorContainer}>
              <AlertTriangle size={50} color={colors.text.tertiary || '#CCCCCC'} />
              <Text style={[styles.errorText, {color: colors.text.secondary}]}>
                Video unavailable
              </Text>
            </View>
          )}

          {!postImage && media_type === 'image' && (
            <View style={styles.noImageContainer}>
              <ImageIcon size={50} color={colors.text.tertiary || '#CCCCCC'} />
              <Text style={[styles.noImageText, {color: colors.text.secondary}]}>
                No image available
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Heart
              size={24}
              color={isLiked ? '#FF3040' : colors.text.primary}
              fill={isLiked ? '#FF3040' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
            <MessageCircle size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Send size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/*<TouchableOpacity onPress={() => {}} style={styles.bookmarkButton}>
          <Bookmark size={24} color={colors.text.primary} />
        </TouchableOpacity>*/}
      </View>

      {/* Likes Count */}
      {likes > 0 && (
        <View style={styles.likesContainer}>
          <Text style={[styles.likesText, { color: colors.text.primary }]}>
            {likes === 1 ? '1 like' : `${formatNumber(likes)} likes`}
          </Text>
        </View>
      )}

      {/* Caption */}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: colors.text.primary }]}>
            <Text style={[styles.captionUsername, { color: colors.text.primary }]}>
              {username}{' '}
            </Text>
            {caption}
          </Text>
        </View>
      )}

      {/* Comments Link */}
      {comments > 0 && (
        <TouchableOpacity onPress={handleComment} style={styles.commentsContainer}>
          <Text style={[styles.commentsText, { color: colors.text.secondary }]}>
            View all {comments} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time Ago */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text.secondary }]}>
          {timeAgo}
        </Text>
      </View>

      {/* Premium Badge */}
      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumText}>Premium</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  header: {
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
    marginRight: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    position: 'relative',
  },
  postMedia: {
    width: '100%',
    height: width, // Square aspect ratio like Instagram
  },
  videoPlayerContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  videoErrorContainer: {
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  noImageContainer: {
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  bookmarkButton: {
    // No additional styling needed
  },
  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  commentsText: {
    fontSize: 14,
  },
  timeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default React.memo(PostItem);
