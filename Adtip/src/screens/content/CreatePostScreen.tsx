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
  PermissionsAndroid,
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
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import { useCreatePost } from '../../hooks/useQueries';

const CreatePostScreen = () => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {user} = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isPromoted, setIsPromoted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [channelId, setChannelId] = useState<number | null>(null);
  const [isCheckingChannel, setIsCheckingChannel] = useState(false);
  
  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // TanStack Query mutation
  const createPostMutation = useCreatePost();
  
  const textInputRef = useRef<TextInput>(null);
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDarkMode);

  // Get user ID and check channel on component mount
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
    checkUserChannel();
    
    // Focus input when screen loads
    const timer = setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Check if user has a channel
  const checkUserChannel = async () => {
    if (!user?.id) return;

    try {
      setIsCheckingChannel(true);
      console.log('[CreatePost] Checking channel for user:', user.id);

      const response = await ApiService.getChannelByUserId(user.id);
      console.log('[CreatePost] Channel response:', response);

      if (response.status === 200 && response.data && response.data.length > 0) {
        const userChannelId = response.data[0].channelId;
        setChannelId(userChannelId);
        console.log('[CreatePost] Channel ID set to:', userChannelId);
      } else {
        console.log('[CreatePost] No channel found for user');
        setChannelId(null);
      }
    } catch (error) {
      console.error('[CreatePost] Error checking channel:', error);
      setChannelId(null);
    } finally {
      setIsCheckingChannel(false);
    }
  };

  // Permission handling for image picker
  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[CreatePost] Requesting Android storage permission');

        const permission = Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to select images for posts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[CreatePost] Storage permission result:', granted);

        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Storage permission is required to select images. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                // You can add logic to open app settings here if needed
              }}
            ]
          );
        }

        return granted;
      }

      // iOS permissions are handled automatically by the image picker
      return true;
    } catch (error) {
      console.error('[CreatePost] Error requesting storage permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[CreatePost] Requesting Android camera permission');

        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Required',
            message: 'This app needs access to your camera to take photos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[CreatePost] Camera permission result:', granted);

        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                // You can add logic to open app settings here if needed
              }}
            ]
          );
        }

        return granted;
      }

      // iOS permissions are handled automatically by the image picker
      return true;
    } catch (error) {
      console.error('[CreatePost] Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
      return false;
    }
  };

  // Handle image picking (now supports both images and videos)
  const handlePickImage = async () => {
    try {
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[CreatePost] Launching media picker (images and videos)');

      ImagePicker.openPicker({
        width: 1200,
        height: 1200,
        multiple: true,
        cropping: false,
        compressImageQuality: 0.8,
        // mediaType removed to allow both images and videos selection
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

          console.log('[CreatePost] Selected images:', newImages.length);
          setImages([...images, ...newImages]);
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            console.error('[CreatePost] Image picker error:', err);

            // Provide more specific error messages
            let errorMessage = 'Failed to pick image';
            if (err.code === 'E_PERMISSION_MISSING') {
              errorMessage = 'Permission denied. Please enable photo library access in settings.';
            } else if (err.code === 'E_NO_IMAGE_DATA') {
              errorMessage = 'No image data found. Please try selecting a different image.';
            } else if (err.message) {
              errorMessage = err.message;
            }

            Alert.alert('Error', errorMessage);
          }
        });
    } catch (error) {
      console.error('[CreatePost] Error in handlePickImage:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  // Handle take photo
  const handleTakePhoto = async () => {
    try {
      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }

      console.log('[CreatePost] Launching camera');

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

          console.log('[CreatePost] Photo taken successfully');
          setImages([...images, newImage]);
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            console.error('[CreatePost] Camera error:', err);

            // Provide more specific error messages
            let errorMessage = 'Failed to take photo';
            if (err.code === 'E_PERMISSION_MISSING') {
              errorMessage = 'Camera permission denied. Please enable camera access in settings.';
            } else if (err.code === 'E_NO_CAMERA') {
              errorMessage = 'Camera not available on this device.';
            } else if (err.message) {
              errorMessage = err.message;
            }

            Alert.alert('Error', errorMessage);
          }
        });
    } catch (error) {
      console.error('[CreatePost] Error in handleTakePhoto:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
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

  // Upload images and videos using CloudflareUploadService
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      console.log('[CreatePost] Starting media upload process for', images.length, 'items');
      setIsUploading(true);
      setUploadProgress(0);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const uploadedUrls: string[] = [];
      const totalImages = images.length;

      // Upload media files one by one using CloudflareUploadService
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const isVideo = img.type?.startsWith('video/');
        const mediaType = isVideo ? 'video' : 'image';
        
        console.log(`[CreatePost] Uploading ${mediaType} ${i + 1}/${totalImages}:`, img.uri);

        try {
          // Determine upload folder based on media type
          const uploadFolder = isVideo ? 'videos' : 'images';
          const fileExtension = isVideo ? '.mp4' : '.jpg';
          const fileName = img.name || `post_${mediaType}_${Date.now()}_${i}${fileExtension}`;

          // Upload single media file using CloudflareUploadService
          const uploadResult = await CloudflareUploadService.uploadFile(
            img.uri,
            uploadFolder,
            fileName,
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
            throw new Error(uploadResult.error || `Failed to upload ${mediaType} ${i + 1}`);
          }

          console.log(`[CreatePost] Successfully uploaded ${mediaType} ${i + 1}:`, uploadResult.url);
          uploadedUrls.push(uploadResult.url);

        } catch (imageError: any) {
          console.error(`[CreatePost] Error uploading media ${i + 1}:`, imageError);
          throw new Error(`Failed to upload media ${i + 1}: ${imageError.message}`);
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

  // Validation helper function
  const validatePostData = (): string | null => {
    // Check if user has a channel when uploading videos
    const hasVideo = images.some(img => img.type?.startsWith('video/'));
    if (hasVideo && !channelId) {
      Alert.alert(
        'Channel Required',
        'You need to create a channel before uploading videos. Please create a channel first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Channel', 
            onPress: () => {
              // Navigate to channel creation
              // @ts-ignore
              navigation.navigate('CreateChannel');
            }
          },
        ]
      );
      return 'Channel required for video uploads';
    }

    if (!title.trim()) return 'Please add a title to your post';
    if (title.trim().length < 3) return 'Title must be at least 3 characters long';
    if (!content.trim() && images.length === 0) return 'Please add some content or images to your post';
    if (!userId) return 'User not found. Please log in again.';
    return null;
  };

  // Handle publish post
  const handlePublish = async () => {
    // Validate form using helper function
    const validationError = validatePostData();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
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
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Format dates as MySQL datetime format
      const formatMySQLDateTime = (date: Date) => {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };

      // Detect media type based on uploaded files
      let mediaType: 'video' | 'image' | 'audio' = 'image';
      if (images.length > 0) {
        const firstMedia = images[0];
        if (firstMedia.type?.startsWith('video/')) {
          mediaType = 'video';
        } else if (firstMedia.type?.startsWith('audio/')) {
          mediaType = 'audio';
        }
      }

      const postData = {
        user_id: parseInt(userId),
        title: title.trim(),
        content: content.trim() || undefined, // Don't send empty string
        media_url: mediaUrls.length > 0 ? mediaUrls[0] : undefined, // Don't send empty string
        media_type: mediaType, // Properly detect media type from file
        is_promoted: isPromoted,
        video_category_id: selectedCategory?.id || undefined,
        start_date: formatMySQLDateTime(now),
        end_date: formatMySQLDateTime(endDate),
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

      // Enhanced error handling with specific messages
      let errorTitle = 'Post Creation Failed';
      let errorMessage = 'Failed to publish your post. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('upload')) {
        errorTitle = 'Upload Error';
        errorMessage = 'Failed to upload images. Please check your internet connection and try again.';
      } else if (error.message?.includes('Missing required fields')) {
        errorTitle = 'Validation Error';
        errorMessage = 'Please fill in all required fields.';
      } else if (error.message?.includes('Either content or media file')) {
        errorTitle = 'Content Required';
        errorMessage = 'Please add some text content or upload an image.';
      } else if (error.message?.includes('Invalid media_type')) {
        errorTitle = 'Media Type Error';
        errorMessage = 'Invalid media type. Please try uploading a different file.';
      } else if (error.message?.includes('Network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message?.includes('User not authenticated')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage, [
        {
          text: 'OK',
          style: 'default',
        },
        ...(error.message?.includes('Authentication') ? [{
          text: 'Login Again',
          onPress: () => {
            // Navigate to login screen
            navigation.navigate('Login' as never);
          },
        }] : []),
      ]);
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

            {/* Image/Video preview section */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((img, index) => {
                  const isVideo = img.type?.startsWith('video/');
                  return (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{uri: img.uri}}
                        style={styles.imagePreview}
                      />
                      {isVideo && (
                        <View style={[styles.videoIndicator, {backgroundColor: 'rgba(0,0,0,0.6)'}]}>
                          <Icon name="play-circle" size={24} color={colors.white} />
                        </View>
                      )}
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
                  );
                })}
              </View>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadProgressContainer}>
                <Text style={[styles.uploadProgressText, {color: colors.text.secondary}]}>
                  Uploading media... {Math.round(uploadProgress)}%
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
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
