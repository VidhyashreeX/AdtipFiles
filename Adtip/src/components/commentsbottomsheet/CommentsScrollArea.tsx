import React, { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import Animated, { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import CommentItem, { Comment } from './CommentItem';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Comment>);

interface CommentsScrollAreaProps {
  comments: Comment[];
  onLike: (commentId: number) => void;
  onReply: (commentId: number, username: string) => void;
  onDelete: (commentId: number) => void;
  onReport: (commentId: number, reason: string) => void;
  currentUserId?: number;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  error: string | null;
  scrollY: SharedValue<number>;
}

export interface CommentsScrollAreaRef {
  scrollToBottom: () => void;
  scrollToTop: () => void;
}

const CommentsScrollArea = forwardRef<CommentsScrollAreaRef, CommentsScrollAreaProps>(({
  comments,
  onLike,
  onReply,
  onDelete,
  onReport,
  currentUserId,
  loading,
  refreshing,
  onRefresh,
  hasMore,
  onLoadMore,
  error,
  scrollY,
}, ref) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (comments.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    },
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
  }));

  const renderCommentItem = useCallback(({ item, index }: { item: Comment; index: number }) => (
    <CommentItem
      comment={item}
      index={index}
      onLike={() => onLike(item.id)}
      onReply={() => onReply(item.id, item.user_name)}
      onDelete={() => onDelete(item.id)}
      onReport={() => onReport(item.id, 'inappropriate')}
      currentUserId={currentUserId}
    />
  ), [onLike, onReply, onDelete, onReport, currentUserId]);

  const renderFooter = useCallback(() => {
    if (!hasMore || !loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, refreshing, hasMore, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading && !refreshing) {
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
          Be the first to comment.
        </Text>
      </View>
    );
  }, [loading, refreshing, error, colors]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const keyExtractor = useCallback((item: Comment) => `comment-${item.id}`, []);

  return (
    <AnimatedFlatList
      ref={flatListRef}
      data={comments}
      renderItem={renderCommentItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={true}
      style={styles.flatListStyle}
      contentContainerStyle={[
        styles.contentContainer,
        comments.length === 0 && styles.emptyContentContainer,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      scrollEnabled={true} // Re-enable native scrolling
      simultaneousHandlers={[]} // Allow this to work with the parent gesture detector
    />
  );
});

const styles = StyleSheet.create({
  flatListStyle: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

CommentsScrollArea.displayName = 'CommentsScrollArea';

export default CommentsScrollArea;