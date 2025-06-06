// src/screens/home/CommentScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Import the local default profile image using require for React Native compatibility
const defaultProfileImage = require('../../assets/images/default_profile.png');

// Constants
const API_BASE_URL = 'https://api.adtip.in';

// Define the Comment interface
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

// Define the route prop type for this screen
type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Comments'>;

const CommentScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const route = useRoute<CommentsScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { postId } = route.params;
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingComment, setSendingComment] = useState<boolean>(false);

  // Helper function for full image URLs
  const getImageSource = (url?: string | null): any => {
    if (!url || url === 'null' || url === 'undefined') {
      return defaultProfileImage; // Use local image as default
    }
    if (url.startsWith('http')) {
      return { uri: url };
    }
    const fullUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    return { uri: fullUrl };
  };

  // Fetch comments from API
  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching comments: ${response.status} - ${errorText}`);
        throw new Error('Failed to fetch comments');
      }

      const result = await response.json();
      if (result.status && result.message === 'Post comment lists' && Array.isArray(result.data)) {
        setComments(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      Alert.alert('Error', 'Failed to load comments.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !user.id) {
      Alert.alert('Error', 'Comment cannot be empty or user not logged in.');
      return;
    }

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
        body: JSON.stringify({
          userId: user.id,
          postId: postId,
          comment: newComment,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error adding comment: ${response.status} - ${errorText}`);
        throw new Error('Failed to add comment');
      }

      const result = await response.json();
      if (result.status && result.message === 'Comment added') {
        const userProfileImage = user.profile_image;
        console.log(`Adding comment with profile image: ${userProfileImage || 'default'}`);
        const addedComment: Comment = {
          id: Date.now(),
          postId: postId,
          user_id: user.id,
          comment: newComment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: user.name ?? 'Anonymous',
          user_profile: userProfileImage,
        };
        setComments((prevComments) => [...prevComments, addedComment]);
        setNewComment('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment.');
    } finally {
      setSendingComment(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Render each comment item
  const renderCommentItem = ({ item }: { item: Comment }) => {
    const imageSource = getImageSource(item.user_profile);
    console.log(`Rendering image for user ${item.user_name}: ${JSON.stringify(imageSource)}`);

    return (
      <View style={styles.commentItem}>
        <Image
          source={imageSource}
          style={styles.avatarImage}
          onLoad={() => console.log(`Image loaded successfully for ${item.user_name}`)}
          onError={(error) => console.error(`Failed to load image for ${item.user_name}`, error.nativeEvent.error)}
        />
        <View style={styles.commentContent}>
          <Text style={[styles.commentUserName, { color: colors.text.primary }]}>
            {item.user_name || 'Unknown'}
          </Text>
          <Text style={[styles.commentText, { color: colors.text.primary }]}>
            {item.comment}
          </Text>
          <Text style={[styles.commentDate, { color: colors.text.secondary }]}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Comments</Text>
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.noComments, { color: colors.text.secondary }]}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          }
        />
      )}

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.commentInput, { borderColor: colors.gray[300], color: colors.text.primary }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text.secondary}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={sendingComment || !newComment.trim()}
          style={styles.sendButton}
        >
          <Icon
            name="send"
            size={24}
            color={sendingComment || !newComment.trim() ? colors.gray[400] : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noComments: {
    fontSize: 16,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
});

export default CommentScreen;