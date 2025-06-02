import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Share } from 'lucide-react-native';

interface PostItemProps {
  username: string;
  profileImage?: string;
  postImage: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onPress: () => void; // Added
  onFollow: () => Promise<void>; // Added
  isPremium: boolean; // Added
  media_type: string; // Added
}

export function PostItem({
  username,
  profileImage,
  postImage,
  caption,
  likes,
  comments,
  timeAgo,
  onLike,
  onComment,
  onShare,
  onPress,
  onFollow,
  isPremium,
  media_type,
}: PostItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onPress}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder} />
            )}
          </View>
          <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onFollow}>
            <Text style={styles.followButton}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.moreOptions}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onPress}>
        <View style={styles.postImageContainer}>
          <Image source={{ uri: postImage }} style={styles.postImage} />
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.primaryActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Heart size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MessageCircle size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Share size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.likesCount}>{likes} likes</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.captionUsername}>{username}</Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.viewComments}>View all {comments} comments</Text>
        </TouchableOpacity>
        <Text style={styles.timestamp}>{timeAgo}</Text>
        {media_type && (
          <Text style={styles.mediaType}>Media Type: {media_type}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'white',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    color: '#3b82f6',
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
    height: 300,
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
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 12,
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
    color: '#6b7280',
    marginBottom: 4,
    fontSize: 14,
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 12,
  },
  mediaType: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
});