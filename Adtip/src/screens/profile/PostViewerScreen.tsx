import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Pause,
} from 'lucide-react-native';
import Video from 'react-native-video';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../constants/api';
import { ProfileFastImage, ContentFastImage } from '../../utils/FastImageOptimizer';
import { getTimeAgo } from '../../utils/timeUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostViewerScreenProps {}

const PostViewerScreen: React.FC<PostViewerScreenProps> = () => {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { posts = [], initialIndex = 0, userId } = route.params || {};

  // State
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // Refs
  const pagerRef = useRef<PagerView>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentPost = posts[currentIndex];

  // Helper function for full image URLs
  const getFullImageUrl = useCallback((url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  }, []);

  // Hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  // Handle screen tap to show/hide controls
  const handleScreenTap = useCallback(() => {
    setShowControls(!showControls);
  }, [showControls]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Handle page change
  const handlePageChange = useCallback((event: any) => {
    const newIndex = event.nativeEvent.position;
    setCurrentIndex(newIndex);
    
    // Pause previous video and play current video if it's a video
    Object.keys(videoRefs.current).forEach(key => {
      const index = parseInt(key);
      const videoRef = videoRefs.current[index];
      if (videoRef) {
        if (index === newIndex && posts[index]?.media_type === 'video') {
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      }
    });
  }, [posts]);

  // Handle like
  const handleLike = useCallback((postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    // TODO: Implement API call for like/unlike
  }, []);

  // Handle comment
  const handleComment = useCallback((postId: number) => {
    // TODO: Open comments modal or navigate to comments screen
    console.log('Comment on post:', postId);
  }, []);

  // Handle share
  const handleShare = useCallback(async (postId: number) => {
    try {
      const deepLink = `https://adtip.in/post/${postId}`;
      await Share.share({
        message: `Check out this post: ${deepLink}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, []);

  // Handle save
  const handleSave = useCallback((postId: number) => {
    // TODO: Implement save/unsave functionality
    console.log('Save post:', postId);
  }, []);

  // Handle user profile press
  const handleUserPress = useCallback((userId: number) => {
    if (userId !== currentUser?.id) {
      navigation.navigate('Profile', { userId });
    }
  }, [navigation, currentUser?.id]);

  // Handle video play/pause
  const handleVideoPress = useCallback(() => {
    if (currentPost?.media_type === 'video') {
      setIsPlaying(!isPlaying);
    }
  }, [currentPost, isPlaying]);

  // Render post content
  const renderPost = useCallback((post: any, index: number) => {
    const isLiked = likedPosts.has(post.id) || post.is_liked;
    
    return (
      <View key={post.id} style={styles.postContainer}>
        {/* Media Content */}
        <TouchableOpacity 
          style={styles.mediaContainer}
          onPress={handleScreenTap}
          activeOpacity={1}
        >
          {post.media_type === 'video' ? (
            <View style={styles.videoContainer}>
              <Video
                ref={(ref) => { videoRefs.current[index] = ref; }}
                source={{ uri: getFullImageUrl(post.media_url) }}
                style={styles.media}
                resizeMode="contain"
                repeat={true}
                paused={!isPlaying || index !== currentIndex}
                muted={false}
                onError={(error) => console.error('Video error:', error)}
              />
              
              {/* Video Controls Overlay */}
              {showControls && (
                <TouchableOpacity
                  style={styles.videoControlsOverlay}
                  onPress={handleVideoPress}
                >
                  {!isPlaying && (
                    <View style={styles.playPauseButton}>
                      <Play size={40} color="white" fill="white" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ContentFastImage
              source={getFullImageUrl(post.media_url)}
              style={styles.media}
            />
          )}
        </TouchableOpacity>

        {/* Controls Overlay */}
        {showControls && (
          <>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={handleBackPress} style={styles.topBarButton}>
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.topBarCenter}>
                <TouchableOpacity 
                  onPress={() => handleUserPress(post.user_id)}
                  style={styles.userInfo}
                >
                  <ProfileFastImage
                    source={getFullImageUrl(post.user_profile_image)}
                    size={32}
                    style={styles.userAvatar}
                  />
                  <Text style={styles.username}>{post.user_name || 'User'}</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.topBarButton}>
                <MoreHorizontal size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              {/* Post Info */}
              <View style={styles.postInfo}>
                {post.content && (
                  <Text style={styles.caption} numberOfLines={2}>
                    <Text style={styles.captionUsername}>{post.user_name || 'User'}</Text>
                    {' '}{post.content}
                  </Text>
                )}
                <Text style={styles.timeAgo}>
                  {getTimeAgo(post.created_at)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={() => handleLike(post.id)}
                  style={styles.actionButton}
                >
                  <Heart 
                    size={24} 
                    color={isLiked ? '#ff3040' : 'white'} 
                    fill={isLiked ? '#ff3040' : 'transparent'}
                  />
                  <Text style={styles.actionCount}>{post.likeCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleComment(post.id)}
                  style={styles.actionButton}
                >
                  <MessageCircle size={24} color="white" />
                  <Text style={styles.actionCount}>{post.commentCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleShare(post.id)}
                  style={styles.actionButton}
                >
                  <Send size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleSave(post.id)}
                  style={styles.actionButton}
                >
                  <Bookmark size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    );
  }, [
    likedPosts, 
    showControls, 
    isPlaying, 
    currentIndex, 
    handleScreenTap, 
    handleBackPress, 
    handleUserPress, 
    handleVideoPress, 
    handleLike, 
    handleComment, 
    handleShare, 
    handleSave
  ]);

  if (!posts || posts.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text.primary }]}>
          No posts to display
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={handlePageChange}
        orientation="vertical"
      >
        {posts.map((post: any, index: number) => (
          <View key={`${post.id}-${index}`} style={styles.page}>
            {renderPost(post, index)}
          </View>
        ))}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  postContainer: {
    flex: 1,
    position: 'relative',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    padding: 20,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topBarButton: {
    padding: 8,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 8,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  postInfo: {
    marginBottom: 16,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginRight: 24,
  },
  actionCount: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});

export default PostViewerScreen;
