import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

// Import contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Import API service
import ApiService from '../../services/ApiService';

// Define navigation param list
type RootStackParamList = {
  EditPost: { postId: number; currentTitle?: string; currentContent?: string };
  Profile: { userId?: number };
  UserProfile: { userId?: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  postId: number;
  currentTitle?: string;
  currentContent?: string;
}

const EditPostScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const { postId, currentTitle = '', currentContent = '' } = (route.params as RouteParams) || {};
  
  // State management
  const [title, setTitle] = useState(currentTitle);
  const [content, setContent] = useState(currentContent);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Validation states
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    if (!postId) {
      Alert.alert('Error', 'Post ID is required');
      navigation.goBack();
      return;
    }

    // If we don't have initial data, fetch the post
    if (!currentTitle && !currentContent) {
      fetchPostData();
    } else {
      setInitialLoading(false);
    }
  }, [postId, currentTitle, currentContent]);

  const fetchPostData = async () => {
    try {
      setInitialLoading(true);
      const response = await ApiService.getSinglePost(postId);
      
      if (response && response.data) {
        const post = Array.isArray(response.data) ? response.data[0] : response.data;
        setTitle(post.title || post.content || '');
        setContent(post.content || '');
      } else {
        Alert.alert('Error', 'Failed to load post data');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
      Alert.alert('Error', 'Failed to load post data');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setTitleError('');
    setContentError('');

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters long');
      isValid = false;
    } else if (title.trim().length > 100) {
      setTitleError('Title must be less than 100 characters');
      isValid = false;
    }

    // Validate content (optional but if provided, should meet criteria)
    if (content.trim() && content.trim().length > 500) {
      setContentError('Description must be less than 500 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        post_id: postId,
        title: title.trim(),
        content: content.trim(),
      };

      console.log('Updating post with data:', updateData);

      const response = await ApiService.updatePost(updateData);
      
      if (response.status === true || response.status === 200) {
        Alert.alert(
          'Success', 
          'Post updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update post');
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      Alert.alert('Error', error.message || 'Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges = title.trim() !== currentTitle.trim() || content.trim() !== currentContent.trim();
    
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading post...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Icon name="x" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Edit Post</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.titleInput,
                { 
                  backgroundColor: colors.surface,
                  borderColor: titleError ? colors.error : colors.border,
                  color: colors.text.primary
                }
              ]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
              placeholder="Enter post title..."
              placeholderTextColor={colors.text.tertiary}
              maxLength={100}
              multiline={false}
              editable={!loading}
            />
            {titleError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{titleError}</Text>
            ) : null}
            <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
              {title.length}/100
            </Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                { 
                  backgroundColor: colors.surface,
                  borderColor: contentError ? colors.error : colors.border,
                  color: colors.text.primary
                }
              ]}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (contentError) setContentError('');
              }}
              placeholder="Enter post description (optional)..."
              placeholderTextColor={colors.text.tertiary}
              maxLength={500}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
            {contentError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{contentError}</Text>
            ) : null}
            <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
              {content.length}/500
            </Text>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={[styles.helpText, { color: colors.text.secondary }]}>
              • Title is required and should be descriptive
            </Text>
            <Text style={[styles.helpText, { color: colors.text.secondary }]}>
              • Description is optional but can provide more context
            </Text>
            <Text style={[styles.helpText, { color: colors.text.secondary }]}>
              • Changes will be saved immediately after pressing Save
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3040',
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helpContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default EditPostScreen;
