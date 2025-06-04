// src/components/home/PostItem.tsx
import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Video from 'react-native-video';

interface PostItemProps {
  id: number;
  username: string;
  profileImage?: string | null;
  postImage: string | null; // Allow null for postImage
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
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
  isVisible?: boolean; // Add isVisible prop to control video playback
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
}) => {
  const {colors} = useTheme();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);
  
  // Automatically pause video when post is scrolled out of view
  useEffect(() => {
    if (!isVisible && isVideoPlaying && !isVideoPaused) {
      setIsVideoPaused(true);
    }
  }, [isVisible, isVideoPlaying, isVideoPaused]);

  return (
    <View style={[styles.container, {backgroundColor: colors.white}]}> 
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress(userId)}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{uri: profileImage}} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  {backgroundColor: colors.gray[200]},
                ]}
              />
            )}
          </View>
          <Text style={[styles.username, {color: colors.text.primary}]}> 
            {String(username)}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => onFollow(userId)}>
            <Text style={[styles.followButton, {color: colors.primary}]}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.moreOptions, {color: colors.text.primary}]}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => {
          if (media_type === 'video' && postImage) {
            setIsVideoPlaying(!isVideoPlaying);
            setIsVideoPaused(!isVideoPaused);
          } else {
            onPostPress(id);
          }
        }} 
        disabled={!postImage}
      >
        {postImage ? (
          <View style={styles.postImageContainer}>
            {media_type === 'video' && isVideoPlaying ? (
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{uri: postImage}}
                  style={styles.postImage}
                  resizeMode="cover"
                  paused={isVideoPaused}
                  muted={isVideoMuted}
                  repeat={true}
                  playInBackground={false}
                  playWhenInactive={false}
                  ignoreSilentSwitch="ignore"
                  onError={(error) => console.error('Video error:', error)}
                />
                {isVideoPaused && (
                  <TouchableOpacity 
                    style={styles.videoPlayButton}
                    onPress={() => setIsVideoPaused(false)}
                  >
                    <Icon name="play" size={32} color={colors.white} />
                  </TouchableOpacity>
                )}
                {!isVideoPaused && (
                  <View style={styles.videoControls}>
                    <TouchableOpacity
                      style={styles.videoControlButton}
                      onPress={() => setIsVideoPaused(true)}
                    >
                      <Icon name="pause" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.videoControlButton}
                      onPress={() => setIsVideoMuted(!isVideoMuted)}
                    >
                      <Icon name={isVideoMuted ? "volume-x" : "volume-2"} size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.videoControlButton}
                      onPress={() => onPostPress(id)}
                    >
                      <Icon name="maximize" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <>
                <Image
                  source={{uri: postImage}}
                  style={styles.postImage}
                  resizeMode="cover"
                />
                {media_type === 'video' && !isVideoPlaying && (
                  <View style={styles.videoIcon}>
                    <Icon name="play" size={28} color={colors.white} />
                  </View>
                )}
              </>
            )}
            {isPremium ? (
              <View style={[styles.premiumBadge, {backgroundColor: colors.secondary}]}> 
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.postImageContainer, {backgroundColor: colors.gray[100], justifyContent: 'center', alignItems: 'center'}]}>
            <Icon name="image" size={48} color={colors.gray[300]} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(id)}>
            <Icon
              name={isLiked ? 'heart' : 'heart'}
              size={24}
              color={isLiked ? colors.error : colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(id)}>
            <Icon
              name="message-circle"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(id)}>
            <Icon name="share-2" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bookmark" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.likesCount, {color: colors.text.primary}]}> 
          {String(likes)} likes
        </Text>
        <View style={styles.captionContainer}>
          <Text style={[styles.captionUsername, {color: colors.text.primary}]}> 
            {String(username)}
          </Text>
          <Text style={[styles.caption, {color: colors.text.secondary}]}> 
            {String(caption)}
          </Text>
        </View>
        {comments > 0 ? (
          <TouchableOpacity onPress={() => onComment(id)}>
            <Text style={[styles.viewComments, {color: colors.text.tertiary}]}> 
              View all {String(comments)} comments
            </Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.timestamp, {color: colors.text.tertiary}]}> 
          {String(timeAgo)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 10,
  },
  moreOptions: {
    fontSize: 16,
    fontWeight: 'bold',
    transform: [{rotate: '90deg'}],
  },
  postImageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoControls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  videoControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 5,
  },
  premiumText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  videoIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likesCount: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
    marginRight: 6,
    fontSize: 14,
  },
  caption: {
    fontSize: 14,
    flex: 1,
  },
  viewComments: {
    marginBottom: 4,
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
  },
});

// Memoize the PostItem component to prevent unnecessary re-renders
export default React.memo(
  PostItem, 
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.isLiked === nextProps.isLiked &&
      prevProps.likes === nextProps.likes &&
      prevProps.comments === nextProps.comments &&
      prevProps.isVisible === nextProps.isVisible
    );
  }
);
