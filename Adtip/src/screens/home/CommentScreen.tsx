// src/screens/home/CommentScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  Image, ActivityIndicator, Keyboard, Dimensions, 
  Animated, PanResponder, Platform, ScrollView, Modal, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const defaultProfileImage = require('../../assets/images/default_profile.png');

const API_BASE_URL = 'https://api.adtip.in';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const INITIAL_SNAP_POINT = SCREEN_HEIGHT * 0.6;
const MAX_SNAP_POINT = SCREEN_HEIGHT * 0.9;
const MIN_SNAP_POINT = SCREEN_HEIGHT * 0.4;
const DISMISS_THRESHOLD = 120;
const FIXED_BOTTOM_HEIGHT = 130;

interface Comment {
  id: number;
  postId: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_profile: string | null;
}

interface CommentScreenProps {
  visible: boolean;
  postId: number;
  onClose: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({ visible, postId, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingComment, setSendingComment] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isContentMounted, setIsContentMounted] = useState<boolean>(false);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(MAX_SNAP_POINT - INITIAL_SNAP_POINT)).current;

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => (
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 8
      ),
      onPanResponderGrant: () => {
        modalTranslateY.setOffset(modalTranslateY._value);
        modalTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentOffset = modalTranslateY._offset;
        let deltaY = gestureState.dy;
        const proposedFinalValue = currentOffset + deltaY;
        const minTranslateYValue = 0; // fully expanded
        const maxTranslateYValue = MAX_SNAP_POINT - MIN_SNAP_POINT; // fully collapsed
        if (proposedFinalValue < minTranslateYValue) {
          deltaY = minTranslateYValue - currentOffset;
        } else if (proposedFinalValue > maxTranslateYValue) {
          deltaY = maxTranslateYValue - currentOffset;
        }
        modalTranslateY.setValue(deltaY);
      },
      onPanResponderRelease: (_, gestureState) => {
        modalTranslateY.flattenOffset();
        const currentTranslateY = modalTranslateY._value;
        const currentVisibleHeight = MAX_SNAP_POINT - currentTranslateY;
        let targetVisibleHeight = INITIAL_SNAP_POINT;
        if (gestureState.dy > DISMISS_THRESHOLD && currentVisibleHeight < INITIAL_SNAP_POINT) {
          handleCloseModalWithAnimation();
          return;
        } else if (gestureState.dy < -50) {
          targetVisibleHeight = MAX_SNAP_POINT;
        } else if (gestureState.dy > 50) {
          targetVisibleHeight = currentVisibleHeight > INITIAL_SNAP_POINT ? INITIAL_SNAP_POINT : MIN_SNAP_POINT;
        } else {
          if (currentVisibleHeight < (MIN_SNAP_POINT + INITIAL_SNAP_POINT) / 2) {
            targetVisibleHeight = MIN_SNAP_POINT;
          } else if (currentVisibleHeight < (INITIAL_SNAP_POINT + MAX_SNAP_POINT) / 2) {
            targetVisibleHeight = INITIAL_SNAP_POINT;
          } else {
            targetVisibleHeight = MAX_SNAP_POINT;
          }
        }
        const targetTranslateY = MAX_SNAP_POINT - targetVisibleHeight;
        Animated.spring(modalTranslateY, {
          toValue: targetTranslateY,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setIsContentMounted(true);
      modalTranslateY.setValue(MAX_SNAP_POINT - INITIAL_SNAP_POINT);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      if (isContentMounted) {
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsContentMounted(false);
        });
      }
    }
  }, [visible]);

  const handleCloseModalWithAnimation = () => {
    if (isContentMounted) {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsContentMounted(false);
        onClose();
      });
    } else {
      onClose();
    }
  };

  // Slide up from bottom of screen
  const mainSlideUpTransform = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_SNAP_POINT, 0],
  });

  const getImageSource = (url?: string | null): any => {
    if (!url || url === 'null' || url === 'undefined') return defaultProfileImage;
    if (url.startsWith('http')) return { uri: url };
    return { uri: `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}` };
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    setComments([]);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      const result = await response.json();
      if (result.status && Array.isArray(result.data)) {
        setComments(result.data);
      } else {
        setComments([]);
      }
    } catch (error) {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !user.id) return;
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/save-user-post-comment`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, postId: postId, comment: newComment }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      const result = await response.json();
      if (result.status && result.message === 'Comment added') {
        const addedComment: Comment = {
          id: result.data?.id || Date.now(),
          postId: postId,
          user_id: user.id,
          comment: newComment,
          created_at: result.data?.created_at || new Date().toISOString(),
          updated_at: result.data?.updated_at || new Date().toISOString(),
          user_name: user.name ?? 'User',
          user_profile: user.profile_image,
        };
        setComments((prevComments) => [addedComment, ...prevComments]);
        setNewComment('');
      }
    } catch (error) {
      // silent fail
    } finally {
      setSendingComment(false);
    }
  };

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    } else if (!postId && visible) {
      setLoading(false);
      setComments([]);
    }
  }, [postId, visible]);

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={getImageSource(item.user_profile)} style={styles.avatarImage} />
      <View style={styles.commentContent}>
        <Text style={[styles.commentUserName, { color: colors.text.primary }]}>{item.user_name || 'User'}</Text>
        <Text style={[styles.commentText, { color: colors.text.primary }]}>{item.comment}</Text>
        <Text style={[styles.commentDate, { color: colors.text.secondary }]}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.likeButton}>
        <Icon name="heart" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  if (!isContentMounted && !visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseModalWithAnimation}
      animationType="none"
      statusBarTranslucent={true}
    >
      <StatusBar
        backgroundColor={visible ? "rgba(0,0,0,0.5)" : "transparent"}
        barStyle={visible ? "light-content" : (isDarkMode ? "light-content" : "dark-content")}
      />
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleCloseModalWithAnimation}
      />
      <View style={styles.modalOverlay} pointerEvents="box-none">
        {isContentMounted && (
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDarkMode ? colors.card : colors.background,
                height: MAX_SNAP_POINT,
                transform: [
                  { translateY: mainSlideUpTransform },
                  { translateY: modalTranslateY }
                ],
              }
            ]}
          >
            {/* Draggable header */}
            <View
              {...panResponder.panHandlers}
              style={[styles.dragHandleContainer, { backgroundColor: isDarkMode ? colors.card : colors.background }]}
            >
              <View style={[styles.dragHandle, { backgroundColor: colors.text.secondary + '40' }]} />
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Comments</Text>
            </View>

            {/* Comments list */}
            <View style={styles.expandableContent}>
              {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
              ) : (
                <FlatList
                  data={comments}
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.commentsListContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                        No comments yet. Be the first to comment!
                      </Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Input box always visible at bottom */}
            <View style={[
              styles.fixedBottomSection,
              {
                backgroundColor: isDarkMode ? colors.card : colors.background,
                minHeight: FIXED_BOTTOM_HEIGHT,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 8) + (Platform.OS === 'ios' ? keyboardHeight : 0)
              }
            ]}>
              <View style={styles.reactionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reactionsScrollContent}>
                  {['❤️', '👍', '🔥', '👏', '👑', '😍', '😮', '😂'].map(emoji => (
                    <TouchableOpacity key={emoji} style={styles.reactionButton}><Text style={styles.reactionEmoji}>{emoji}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={[styles.inputContainer, { borderTopColor: colors.text.secondary + '20' }]}>
                <View style={styles.inputWrapper}>
                  <Image
                    source={user?.profile_image ? getImageSource(user.profile_image) : defaultProfileImage}
                    style={styles.userAvatar}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text.primary, backgroundColor: isDarkMode ? colors.background : '#f2f2f2' }
                    ]}
                    placeholder={user ? `Add a comment as ${user.name || 'User'}...` : "Log in to comment"}
                    placeholderTextColor={colors.text.secondary}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                    editable={!!user}
                  />
                  <TouchableOpacity
                    disabled={sendingComment || !newComment.trim() || !user}
                    onPress={handleAddComment}
                    style={styles.sendButton}
                  >
                    {sendingComment ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Icon name="send" size={20} color={(!newComment.trim() || !user) ? colors.text.secondary : colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
    width: '100%',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  expandableContent: {
    flex: 1,
  },
  commentsListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  commentContent: {
    flex: 1,
    paddingRight: 10,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentDate: {
    fontSize: 12,
    marginTop: 4,
  },
  likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fixedBottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    backgroundColor: '#fff',
  },
  reactionsContainer: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reactionsScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  reactionButton: {
    marginHorizontal: 8,
    paddingVertical: 6,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  inputContainer: {
    borderTopWidth: 1, 
    paddingHorizontal: 16,
    paddingTop: 12, 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', 
    minHeight: 40,
    paddingBottom: 12, 
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8, 
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 12,
    maxHeight: 80, 
    minHeight: 40, 
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CommentScreen;