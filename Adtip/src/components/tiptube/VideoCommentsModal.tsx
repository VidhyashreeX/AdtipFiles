import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommentsModal } from '../reddit-comments';
import { useComments, useCommentCount, useAddComment, useLikeComment, useDeleteComment } from '../../hooks/useComments';

interface VideoCommentsModalProps {
  videoId: number;
  userId: number;
  visible: boolean;
  onClose: () => void;
}

const VideoCommentsModal: React.FC<VideoCommentsModalProps> = ({
  videoId,
  userId,
  visible,
  onClose,
}) => {
  // Use TanStack Query hooks
  const {
    data: commentsData,
    isLoading,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error,
    refetch,
  } = useComments({ videoId, userId });

  const { data: commentCount = 0 } = useCommentCount({ videoId });

  // Mutations
  const addCommentMutation = useAddComment();
  const likeCommentMutation = useLikeComment();
  const deleteCommentMutation = useDeleteComment();

  // Flatten all comments from all pages
  const comments = commentsData?.pages.flatMap(page => page.data) || [];

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handle add comment
  const handleAddComment = async (content: string, parentId?: number) => {
    try {
      await addCommentMutation.mutateAsync({
        videoId,
        userId,
        content,
        parentId,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId: number) => {
    try {
      // Find the comment to check current like status
      const findComment = (comments: any[]): any => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          if (comment.replies) {
            const found = findComment(comment.replies);
            if (found) return found;
          }
        }
        return null;
      };

      const comment = findComment(comments);
      if (!comment) return;

      await likeCommentMutation.mutateAsync({
        commentId,
        userId,
        isLiked: comment.is_liked,
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteCommentMutation.mutateAsync({
        commentId,
        userId,
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  return (
    <CommentsModal
      visible={visible}
      onClose={onClose}
      comments={comments}
      loading={isLoading}
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      hasMore={hasNextPage}
      onLoadMore={handleLoadMore}
      error={error ? 'Failed to load comments' : null}
      userId={userId}
      onAddComment={handleAddComment}
      onLikeComment={handleLikeComment}
      onDeleteComment={handleDeleteComment}
      title="Comments"
      commentCount={commentCount}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default VideoCommentsModal;
