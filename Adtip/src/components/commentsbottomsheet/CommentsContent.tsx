import React, { useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { useCommentsData } from './hooks/useCommentsData';

// Use the built-in Animated.FlatList
const AnimatedFlatList = Animated.FlatList;

interface CommentsContentProps {
  postId: number;
  initialCommentCount: number;
}

const CommentsContent: React.FC<CommentsContentProps> = ({
  postId,
  initialCommentCount,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const {
    comments,
    loading,
    refreshing,
    hasMore,
    commentCount,
    error,
    replyingTo,
    addComment,
    addReply,
    loadMore,
    refresh,
    likeComment,
    deleteComment,
    reportComment,
    replyToComment,
    cancelReply,
  } = useCommentsData(postId, initialCommentCount);

  const renderCommentItem = useCallback(({ item, index }) => (
    <CommentItem
      comment={item}
      index={index}
      onLike={() => likeComment(item.id)}
      onReply={() => replyToComment(item.id, item.user_name)}
      onDelete={() => deleteComment(item.id)}
      onReport={() => reportComment(item.id, 'inappropriate')}
      currentUserId={user?.id ? Number(user.id) : undefined}
    />
  ), [likeComment, replyToComment, deleteComment, reportComment, user?.id]);

  const renderFooter = useCallback(() => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, refreshing, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          No comments yet.
        </Text>
      </View>
    );
  }, [loading, error, colors]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const keyExtractor = useCallback((item) => `comment-${item.id}`, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AnimatedFlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={true}
        style={styles.flatListStyle}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // Add explicit scrolling properties
        scrollEnabled={true} 
        bounces={true}
      />
      <CommentInput
        postId={postId}
        onSubmit={replyingTo ? (text) => addReply(text, replyingTo.id) : addComment}
        replyTo={replyingTo}
        onCancelReply={cancelReply}
        onFocus={() => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListStyle: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 8,
    minHeight: '100%',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CommentsContent;