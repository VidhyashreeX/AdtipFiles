import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../constants/api';

// Make sure this interface matches what we're providing
export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_profile_image?: string | null;
  content: string;
  like_count: number;
  reply_count: number;
  is_liked: boolean;
  created_at: string;
  parent_id?: number | null;
  replies?: Comment[];
  last_active?: string | null;
}

interface CommentItemProps {
  comment: Comment;
  index: number;
  onLike: () => void;
  onReply: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  isReply?: boolean;
  showReplies?: boolean;
  onToggleReplies?: () => void;
  currentUserId?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  index,
  onLike,
  onReply,
  onDelete,
  onReport,
  isReply = false,
  showReplies = false,
  onToggleReplies,
  currentUserId,
}) => {
  const { colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  
  // Animation values
  const likeScale = useSharedValue(1);
  const likeOpacity = useSharedValue(1);
  const menuOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0.8);

  // Memoized values
  const isOwnComment = useMemo(() => 
    currentUserId === comment.user_id, [currentUserId, comment.user_id]
  );

  const timeAgo = useMemo(() => {
    const now = new Date();
    const commentTime = new Date(comment.created_at);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  }, [comment.created_at]);

  const profileImageUrl = useMemo(() => {
    if (!comment.user_profile_image || 
        comment.user_profile_image === 'null' || 
        comment.user_profile_image === 'undefined') {
      return 'https://via.placeholder.com/32x32.png?text=U';
    }
    
    if (comment.user_profile_image.startsWith('http')) {
      return comment.user_profile_image;
    }
    
    // Use your API base URL from constants
    return `${API_BASE_URL}${comment.user_profile_image}`;
  }, [comment.user_profile_image]);

  // Animated styles
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
    opacity: likeOpacity.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ scale: menuScale.value }],
  }));

  // Handlers
  const handleLike = useCallback(() => {
    // Animate like button
    likeScale.value = withSpring(1.2, { duration: 150 }, () => {
      likeScale.value = withSpring(1, { duration: 150 });
    });
    
    if (comment.is_liked) {
      likeOpacity.value = withTiming(0.6, { duration: 100 }, () => {
        likeOpacity.value = withTiming(1, { duration: 100 });
      });
    }
    
    onLike();
  }, [onLike, comment.is_liked]);

  const handleMenuToggle = useCallback(() => {
    if (showMenu) {
      menuOpacity.value = withTiming(0, { duration: 150 });
      menuScale.value = withTiming(0.8, { duration: 150 });
    } else {
      menuOpacity.value = withTiming(1, { duration: 200 });
      menuScale.value = withSpring(1, { damping: 15 });
    }
    setShowMenu(!showMenu);
  }, [showMenu]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            onDelete?.();
          }
        },
      ]
    );
  }, [onDelete]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => reportComment('spam') },
        { text: 'Inappropriate', onPress: () => reportComment('inappropriate') },
        { text: 'Harassment', onPress: () => reportComment('harassment') },
      ]
    );
  }, []);

  const reportComment = useCallback((reason: string) => {
    setShowMenu(false);
    onReport?.();
    // You can pass the reason to your API
    console.log(`Reporting comment ${comment.id} for: ${reason}`);
  }, [comment.id, onReport]);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.surface },
      isReply && styles.replyContainer
    ]}>
      {/* Main Comment Content */}
      <View style={styles.commentContent}>
        {/* Profile Image */}
        <Image
          source={{ uri: profileImageUrl }}
          style={[styles.profileImage, isReply && styles.replyProfileImage]}
        />

        {/* Comment Body */}
        <View style={styles.commentBody}>
          {/* Username and Time */}
          <View style={styles.commentHeader}>
            <Text style={[styles.username, { color: colors.text.primary }]}>
              {comment.user_name}
            </Text>
            <Text style={[styles.timeAgo, { color: colors.text.tertiary }]}>
              {timeAgo}
            </Text>
            
            {/* Menu Button */}
            <TouchableOpacity 
              onPress={handleMenuToggle}
              style={styles.menuButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Comment Text */}
          <Text style={[styles.commentText, { color: colors.text.primary }]}>
            {comment.content}
          </Text>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            {/* Like Button */}
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Animated.View style={likeAnimatedStyle}>
                <Heart
                  size={14}
                  color={comment.is_liked ? "#FF0000" : colors.text.secondary}
                  fill={comment.is_liked ? "#FF0000" : "none"}
                />
              </Animated.View>
              {comment.like_count > 0 && (
                <Text style={[styles.actionText, { color: colors.text.secondary }]}>
                  {comment.like_count}
                </Text>
              )}
            </TouchableOpacity>

            {/* Reply Button */}
            <TouchableOpacity onPress={onReply} style={styles.actionButton}>
              <MessageCircle size={14} color={colors.text.secondary} />
              <Text style={[styles.actionText, { color: colors.text.secondary }]}>
                Reply
              </Text>
            </TouchableOpacity>

            {/* View Replies Button */}
            {!isReply && comment.reply_count > 0 && (
              <TouchableOpacity onPress={onToggleReplies} style={styles.actionButton}>
                <Text style={[styles.viewRepliesText, { color: colors.text.secondary }]}>
                  {showReplies ? 'Hide' : 'View'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </Text>
                <Icon 
                  name={showReplies ? 'chevron-up' : 'chevron-down'} 
                  size={12} 
                  color={colors.text.secondary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Menu Dropdown */}
      {showMenu && (
        <Animated.View style={[
          styles.menuDropdown,
          { backgroundColor: colors.surface, borderColor: colors.border },
          menuAnimatedStyle
        ]}>
          {isOwnComment ? (
            <TouchableOpacity onPress={handleDelete} style={styles.menuItem}>
              <Icon name="trash-2" size={16} color={colors.danger || '#FF0000'} />
              <Text style={[styles.menuItemText, { color: colors.danger || '#FF0000' }]}>
                Delete
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleReport} style={styles.menuItem}>
              <Icon name="flag" size={16} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.secondary }]}>
                Report
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Replies */}
      {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply, replyIndex) => (
            <CommentItem
              key={`reply-${reply.id}-${replyIndex}`}
              comment={reply}
              index={replyIndex}
              onLike={() => console.log('Like reply:', reply.id)}
              onReply={() => console.log('Reply to reply:', reply.id)}
              isReply={true}
              currentUserId={currentUserId}
            />
          ))}
        </View>
      )}

      {/* Tap outside to close menu */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  replyContainer: {
    paddingLeft: 48,
    paddingVertical: 8,
  },
  commentContent: {
    flexDirection: 'row',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  replyProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  viewRepliesText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  repliesContainer: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E1E1E1',
    marginLeft: 22,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    marginLeft: 8,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
});

export default React.memo(CommentItem);