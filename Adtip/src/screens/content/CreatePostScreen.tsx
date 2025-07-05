// src/screens/content/CreatePostScreen.tsx
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import { useCreatePost } from '../../hooks/useQueries';

const CreatePostScreen = () => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isPromoted, setIsPromoted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // TanStack Query mutation
  const createPostMutation = useCreatePost();
  
  const textInputRef = useRef<TextInput>(null);
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDarkMode);

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    
    getUserId();
    
    // Focus input when screen loads
    const timer = setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Handle image picking
  const handlePickImage = () => {
    ImagePicker.openPicker({
      width: 1200,
      height: 1200,
      multiple: true,
      cropping: false,
      compressImageQuality: 0.8,
      mediaType: 'photo',
      maxFiles: 5 - images.length,
    })
      .then(selectedImages => {
        // Limit to 5 images total
        if (images.length + selectedImages.length > 5) {
          Alert.alert('Limit Exceeded', 'You can upload maximum 5 images');
          return;
        }

        const newImages = selectedImages.map(img => ({
          uri: Platform.OS === 'ios' ? img.sourceURL || img.path : img.path,
          type: img.mime,
          name: img.path.split('/').pop(),
          width: img.width,
          height: img.height,
        }));

        setImages([...images, ...newImages]);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Failed to pick image');
          console.error(err);
        }
      });
  };

  // Handle take photo
  const handleTakePhoto = () => {
    ImagePicker.openCamera({
      width: 1200,
      height: 1200,
      cropping: false,
      compressImageQuality: 0.8,
    })
      .then(image => {
        if (images.length >= 5) {
          Alert.alert('Limit Exceeded', 'You can upload maximum 5 images');
          return;
        }

        const newImage = {
          uri:
            Platform.OS === 'ios' ? image.sourceURL || image.path : image.path,
          type: image.mime,
          name: image.path.split('/').pop(),
          width: image.width,
          height: image.height,
        };

        setImages([...images, newImage]);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Failed to take photo');
          console.error(err);
        }
      });
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // Handle select category
  const handleSelectCategory = () => {
    // @ts-ignore
    navigation.navigate('SelectCategory', {
      onSelect: (category: any) => setSelectedCategory(category),
      selectedCategory,
    });
  };

  // Handle promoted post toggle
  const handlePromotedToggle = (value: boolean) => {
    if (value) {
      // If user wants to create promoted post, navigate to campaign creation
      Alert.alert(
        'Create Promoted Post',
        'You will be redirected to create a campaign for your promoted post.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              // Fix: Change 'CreateCampaignScreen' to 'CreateCampaign'
              //@ts-ignore
              navigation.navigate('CreateCampaign' as never, {
                postData: {
                  title: title.trim(),
                  content: content.trim(),
                  images,
                  selectedCategory,
                },
              });
            },
          },
        ]
      );
    } else {
      setIsPromoted(value);
    }
  };

  // Upload images using CloudflareUploadService
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      console.log('[CreatePost] Starting image upload process for', images.length, 'images');
      setIsUploading(true);
      setUploadProgress(0);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const uploadedUrls: string[] = [];
      const totalImages = images.length;

      // Upload images one by one using CloudflareUploadService
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log(`[CreatePost] Uploading image ${i + 1}/${totalImages}:`, img.uri);

        try {
          // Upload single image using CloudflareUploadService
          const uploadResult = await CloudflareUploadService.uploadFile(
            img.uri,
            'images', // Upload to images folder
            img.name || `post_image_${Date.now()}_${i}.jpg`,
            parseInt(userId),
            (progress) => {
              // Calculate overall progress
              const currentImageProgress = (i / totalImages) * 100;
              const thisImageProgress = (progress.percentage / totalImages);
              const totalProgress = currentImageProgress + thisImageProgress;
              setUploadProgress(Math.min(totalProgress, 100));
            }
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload image ${i + 1}`);
          }

          console.log(`[CreatePost] Successfully uploaded image ${i + 1}:`, uploadResult.url);
          uploadedUrls.push(uploadResult.url);

        } catch (imageError: any) {
          console.error(`[CreatePost] Error uploading image ${i + 1}:`, imageError);
          throw new Error(`Failed to upload image ${i + 1}: ${imageError.message}`);
        }
      }

      console.log('[CreatePost] All images uploaded successfully:', uploadedUrls);
      setUploadProgress(100);
      return uploadedUrls;
      
    } catch (error: any) {
      console.error('[CreatePost] Error in uploadImages function:', error);
      throw new Error(`Failed to upload images: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle publish post
  const handlePublish = async () => {
    // Validate form
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title to your post');
      return;
    }

    if (!content.trim() && images.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    try {
      // Upload images first if any
      let mediaUrls: string[] = [];
      if (images.length > 0) {
        console.log('[CreatePost] Uploading images...');
        mediaUrls = await uploadImages();
        console.log('[CreatePost] Images uploaded successfully:', mediaUrls);
      }

      // Prepare post data
      const postData = {
        user_id: parseInt(userId),
        title: title.trim(),
        content: content.trim(),
        media_url: mediaUrls.length > 0 ? mediaUrls[0] : '', // Use first image as primary media
        media_type: mediaUrls.length > 0 ? 'image' : 'text' as 'video' | 'image' | 'text',
        is_promoted: isPromoted,
        video_category_id: selectedCategory?.id || 1, // Default category if none selected
        start_date: new Date().toISOString().split('T')[0], // Today's date
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        // Add all uploaded image URLs as additional data if needed
        all_media_urls: mediaUrls, // This can be used if the API supports multiple images
      };

      console.log('[CreatePost] Creating post with data:', postData);

      // Create post using TanStack Query mutation
      await createPostMutation.mutateAsync(postData);

      // Show success message
      Alert.alert(
        'Success',
        isPromoted 
          ? 'Your promoted post has been created successfully!' 
          : 'Your post has been published successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[CreatePost] Error creating post:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to publish your post. Please try again.';
      
      if (error.message?.includes('upload')) {
        errorMessage = 'Failed to upload images. Please check your internet connection and try again.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('User not authenticated')) {
        errorMessage = 'Please log in again to continue.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const isDisabled = createPostMutation.isPending || isUploading || !title.trim() || (!content.trim() && images.length === 0);
  const publishOpacity = isDisabled ? 0.5 : 1;

  return (
    <SafeAreaView style={[{backgroundColor: colors.background}, styles.container]}>
      <Header
        title="Create Post"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isDisabled}
            style={{ opacity: publishOpacity }}>
            {createPostMutation.isPending || isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[{color: colors.primary}, styles.publishText]}>
                Publish
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView style={styles.container}>
          <View style={styles.editorContainer}>
            {/* Title Input */}
            <TextInput
              style={[styles.titleInput, {color: colors.text.primary, borderColor: colors.border}]}
              placeholder="Add a title..."
              placeholderTextColor={colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!createPostMutation.isPending && !isUploading}
            />

            {/* Content Input */}
            <TextInput
              ref={textInputRef}
              style={[styles.contentInput, {color: colors.text.primary}]}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor={colors.text.tertiary}
              value={content}
              onChangeText={setContent}
              maxLength={2000}
              editable={!createPostMutation.isPending && !isUploading}
            />

            {/* Image preview section */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{uri: img.uri}}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeImageBtn,
                        {backgroundColor: colors.error},
                      ]}
                      onPress={() => handleRemoveImage(index)}
                      disabled={createPostMutation.isPending || isUploading}>
                      <Icon name="x" size={12} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadProgressContainer}>
                <Text style={[styles.uploadProgressText, {color: colors.text.secondary}]}>
                  Uploading images... {Math.round(uploadProgress)}%
                </Text>
                <View style={[styles.progressBar, {backgroundColor: colors.gray?.[200]}]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: colors.primary,
                        width: `${uploadProgress}%`
                      }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Category section */}
            {selectedCategory && (
              <View style={styles.categoryContainer}>
                <CategoryChip
                  category={selectedCategory}
                  selected={true}
                  onPress={handleSelectCategory}
                />
                <TouchableOpacity 
                  onPress={() => setSelectedCategory(null)}
                  disabled={createPostMutation.isPending || isUploading}>
                  <Icon name="x" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Character count */}
            <View style={styles.metaInfo}>
              <Text style={[styles.charCount, {color: colors.text.tertiary}]}>
                Title: {title.length}/100
              </Text>
              <Text style={[styles.charCount, {color: colors.text.tertiary}]}>
                Content: {content.length}/2000
              </Text>
            </View>

            {/* Promoted Post Section */}
            <View style={[styles.promotedSection, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.promotedHeader}>
                <Icon name="trending-up" size={20} color={colors.primary} />
                <Text style={[styles.promotedTitle, {color: colors.text.primary}]}>
                  Promoted Post
                </Text>
              </View>
              <Text style={[styles.promotedDescription, {color: colors.text.secondary}]}>
                Reach more people by promoting your post
              </Text>
              <View style={styles.promotedToggle}>
                <Text style={[styles.promotedToggleText, {color: colors.text.primary}]}>
                  {isPromoted ? 'Promoted' : 'Regular Post'}
                </Text>
                <Switch
                  value={isPromoted}
                  onValueChange={handlePromotedToggle}
                  trackColor={{
                    false: isDarkMode ? colors.gray?.[700] : colors.gray?.[300],
                    true: colors.primary + '40',
                  }}
                  thumbColor={isPromoted ? colors.primary : colors.gray?.[500]}
                  disabled={createPostMutation.isPending || isUploading}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View style={[styles.actionBar, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImage}
            disabled={createPostMutation.isPending || isUploading}>
            <Icon name="image" size={22} color={createPostMutation.isPending || isUploading ? colors.text.tertiary : colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={createPostMutation.isPending || isUploading}>
            <Icon name="camera" size={22} color={createPostMutation.isPending || isUploading ? colors.text.tertiary : colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSelectCategory}
            disabled={createPostMutation.isPending || isUploading}>
            <Icon name="tag" size={22} color={createPostMutation.isPending || isUploading ? colors.text.tertiary : colors.primary} />
          </TouchableOpacity>

          <View style={styles.imageCountWrapper}>
            <Text style={[styles.imageCountText, {color: colors.text.secondary}]}>
              {images.length}/5 images
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editorContainer: {
    padding: 16,
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 16,
    color: colors.text.primary,
  },
  contentInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    color: colors.text.primary,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  imageWrapper: {
    margin: 4,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  uploadProgressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  uploadProgressText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  metaInfo: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  promotedSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  promotedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promotedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.text.primary,
  },
  promotedDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  promotedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promotedToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  imageCountWrapper: {
    marginLeft: 'auto',
    justifyContent: 'center',
  },
  imageCountText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  publishText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primary,
  },
});

export default CreatePostScreen;
