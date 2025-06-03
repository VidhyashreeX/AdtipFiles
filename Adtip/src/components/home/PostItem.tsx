// src/components/home/PostItem.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

interface PostItemProps {
  id: number;
  username: string;
  profileImage?: string | null;
  postImage: string;
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
  userId
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={() => onUserPress(userId)}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.gray[200] }]} />
            )}
          </View>
          <Text style={[styles.username, { color: colors.text.primary }]}>{String(username)}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => onFollow(userId)}>
            <Text style={[styles.followButton, { color: colors.primary }]}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.moreOptions, { color: colors.text.primary }]}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => onPostPress(id)}>
        <View style={styles.postImageContainer}>
          <Image source={{ uri: postImage }} style={styles.postImage} resizeMode="cover" />          {isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          ) : null}          {media_type === 'video' ? (
            <View style={styles.videoIcon}>
              <Icon name="play" size={28} color={colors.white} />
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.primaryActions}>          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(id)}>
            <Icon 
              name={isLiked ? "heart" : "heart"} 
              size={24} 
              color={isLiked ? colors.error : colors.text.secondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(id)}>
            <Icon name="message-circle" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onShare(id)}>
            <Icon name="share-2" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bookmark" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.likesCount, { color: colors.text.primary }]}>{String(likes)} likes</Text>
        <View style={styles.captionContainer}>          <Text style={[styles.captionUsername, { color: colors.text.primary }]}>{String(username)}</Text>
          <Text style={[styles.caption, { color: colors.text.secondary }]}>{String(caption)}</Text>
        </View>        {comments > 0 ? (
          <TouchableOpacity onPress={() => onComment(id)}>
            <Text style={[styles.viewComments, { color: colors.text.tertiary }]}>View all {String(comments)} comments</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>{String(timeAgo)}</Text>
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
    transform: [{ rotate: '90deg' }],
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
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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

export default PostItem;
