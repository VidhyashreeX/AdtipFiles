import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { useCommentsData } from './hooks/useCommentsData';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface CommentsContentProps {
  postId: number;
  initialCommentCount: number;
  panRef: React.RefObject<PanGestureHandler>;
}

const CommentsContent: React.FC<CommentsContentProps> = ({
  postId,
  initialCommentCount,
  panRef,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);

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

  // Handle scroll interactions with pan gesture
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Enable/disable pan gesture based on scroll position
      if (panRef.current) {
        // Only enable pan gesture when at the very top
        const shouldEnablePan = event.contentOffset.y <= 0;
        panRef.current.setNativeProps({ enabled: shouldEnablePan });
      }
    },
    onScrollBeginDrag: () => {
      // Disable pan gesture when actively scrolling
      if (panRef.current) {
        panRef.current.setNativeProps({ enabled: false });
      }
    },
    onMomentumScrollEnd: (event) => {
      // Re-enable pan gesture only when at top and scroll ended
      if (panRef.current && event.contentOffset.y <= 0) {
        panRef.current.setNativeProps({ enabled: true });
      }
    },
  });

  const renderCommentItem = useCallback(({ item, index }) => (
    <CommentItem
      comment={item}
      index={index}
      onLike={() => likeComment(item.id)}
      onReply={() => replyToComment(item.id, item.user_name)}
      onDelete={() => deleteComment(item.id)}
      onReport={() => reportComment(item.id, 'inappropriate')}
      currentUserId={user?.id ? Number(user.id) : undefined}
      showReplies={false}
      onToggleReplies={() => {
        console.log('Toggle replies for comment:', item.id);
      }}
    />
  ), [likeComment, replyToComment, deleteComment, reportComment, user?.id]);

  const renderHeader = useCallback(() => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
        {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
      </Text>
      {error && (
        <Text style={[styles.errorText, { color: colors.danger || '#FF0000' }]}>
          {error}
        </Text>
      )}
    </View>
  ), [commentCount, error, colors]);

  const renderFooter = useCallback(() => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading more comments...
        </Text>
      </View>
    );
  }, [loading, refreshing, colors.primary, colors.text.secondary]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading comments...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          No comments yet. Be the first to comment!
        </Text>
      </View>
    );
  }, [loading, colors.primary, colors.text.secondary]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const keyExtractor = useCallback((item, index) => 
    `comment-${item.id}-${index}`, []
  );

  return (
    <View style={styles.container}>
      {/* Comments List - Takes all available space */}
      <AnimatedFlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onScroll={scrollHandler}
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
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="auto"
        nestedScrollEnabled={true}
        contentContainerStyle={[
          styles.contentContainer,
          comments.length === 0 && styles.emptyContentContainer
        ]}
        style={styles.flatListStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
      
      {/* Fixed Comment Input at bottom */}
      <CommentInput
        postId={postId}
        onSubmit={replyingTo ? 
          (text) => addReply(text, replyingTo.id) : 
          addComment
        }
        replyTo={replyingTo}
        onCancelReply={cancelReply}
        onFocus={() => {
          // Scroll to bottom when input is focused
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flatListStyle: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  contentContainer: {
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 300,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CommentsContent;