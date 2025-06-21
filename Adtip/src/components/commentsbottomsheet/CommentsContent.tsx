import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { useCommentsData } from './hooks/useCommentsData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedFlatList = Animated.FlatList;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(SCREEN_HEIGHT - 150);

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

  // Setup keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Calculate content height based on keyboard visibility
  useEffect(() => {
    if (keyboardVisible) {
      setContentHeight(SCREEN_HEIGHT - 150 - keyboardHeight);
    } else {
      setContentHeight(SCREEN_HEIGHT - 150);
    }
  }, [keyboardVisible, keyboardHeight]);

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
          Be the first to comment.
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

  const handleCommentSubmit = useCallback(async (text: string) => {
    try {
      await addComment(text);
      // Scroll to bottom after comment is added
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [addComment]);

  const handleInputFocus = useCallback(() => {
    // Scroll to bottom when input is focused
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.listContainer, { height: contentHeight }]}>
        <AnimatedFlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={keyExtractor}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
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
          contentContainerStyle={[
            styles.contentContainer,
            comments.length === 0 && styles.emptyContentContainer
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          scrollEnabled={true}
          bounces={true}
          removeClippedSubviews={false}
        />
      </View>
      
      <CommentInput
        postId={postId}
        onSubmit={replyingTo ? (text) => addReply(text, replyingTo.id) : handleCommentSubmit}
        replyTo={replyingTo}
        onCancelReply={cancelReply}
        onFocus={handleInputFocus}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  listContainer: {
    flex: 1,
  },
  flatListStyle: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 8,
    minHeight: 100,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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