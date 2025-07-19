import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Heart, MessageCircle, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Comment } from '../../types/Comment';

interface CommentItemProps {
  comment: Comment;
  userId: number;
  onReply?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onLike?: (commentId: number) => void;
  depth?: number;
  maxDepth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  userId,
  onReply,
  onDelete,
  onLike,
  depth = 0,
  maxDepth = 5,
}) => {
  const { colors } = useTheme();
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = useCallback(() => {
    if (onLike) {
      onLike(comment.id);
    }
  }, [comment.id, onLike]);

  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(comment);
    }
  }, [comment, onReply]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(comment.id);
    }
  }, [comment.id, onDelete]);

  const toggleReplies = useCallback(() => {
    setShowReplies(!showReplies);
  }, [showReplies]);

  const isOwnComment = userId === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canShowReplies = hasReplies && depth < maxDepth;

  // Get display values with fallbacks for different API responses
  const displayName = comment.user_name || comment.commentator_name || 'Anonymous';
  const displayContent = comment.content || comment.comment || '';
  const displayLikeCount = comment.like_count || comment.total_comment_like || 0;
  const profileImage = comment.user_profile_image || comment.commentator_image;

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.surface },
      depth > 0 && styles.replyContainer
    ]}>
      {/* Indentation line for nested comments */}
      {depth > 0 && (
        <View style={[styles.indentLine, { backgroundColor: colors.border, marginLeft: depth * 15 }]} />
      )}
      
      <View style={styles.commentContent}>
        {/* Profile Image */}
        <Image
          source={{ 
            uri: profileImage || 'https://avatar.iran.liara.run/public' 
          }}
          style={[styles.profileImage, depth > 0 && styles.replyProfileImage]}
        />

        {/* Comment Body */}
        <View style={styles.commentBody}>
          {/* Username */}
          <Text style={[styles.username, { color: colors.text.primary }]}>{displayName}</Text>
          
          {/* Comment Content */}
          <Text style={[styles.content, { color: colors.text.secondary }]}>{displayContent}</Text>
          
          {/* Actions */}
          <View style={styles.footer}>
            <Pressable onPress={handleLike} style={styles.actionButton}>
              <Heart 
                size={14} 
                color={comment.is_liked ? colors.primary : colors.text.tertiary} 
                fill={comment.is_liked ? colors.primary : "transparent"}
              />
              {displayLikeCount > 0 && (
                <Text style={[styles.actionText, { color: colors.text.tertiary }]}>{displayLikeCount}</Text>
              )}
            </Pressable>
            
            <Pressable onPress={handleReply} style={styles.actionButton}>
              <MessageCircle size={14} color={colors.text.tertiary} />
              <Text style={[styles.actionText, { color: colors.text.tertiary }]}>Reply</Text>
            </Pressable>
            
            {canShowReplies && (
              <Pressable onPress={toggleReplies} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: colors.text.tertiary }]}>
                  {showReplies ? 'Hide replies' : `Show ${comment.replies?.length} replies`}
                </Text>
              </Pressable>
            )}
            
            {isOwnComment && (
              <Pressable onPress={handleDelete} style={styles.actionButton}>
                <Trash2 size={14} color={colors.text.tertiary} />
                <Text style={[styles.actionText, { color: colors.text.tertiary }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Nested Replies */}
      {showReplies && canShowReplies && (
        <View style={styles.repliesContainer}>
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userId={userId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  replyContainer: {
    marginLeft: 20,
    borderLeftWidth: 1,
    paddingLeft: 10,
  },
  indentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
  },
  commentContent: {
    flexDirection: 'row',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  replyProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentBody: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
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
  },
  repliesContainer: {
    marginTop: 8,
  },
});

export default CommentItem;
