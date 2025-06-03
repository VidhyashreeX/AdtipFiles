// src/screens/content/TipTubeUploadScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-crop-picker';
import * as Progress from 'react-native-progress';
import {launchImageLibrary} from 'react-native-image-picker';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// Components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';

// Define the expected route parameters
type TipTubeUploadScreenParams = {
  videoSource?: {
    uri: string;
    type?: string;
    name?: string;
    size?: number;
  };
};

const TipTubeUploadScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{params: TipTubeUploadScreenParams}, 'params'>>();

  // State variables
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoSource, setVideoSource] = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isMonetized, setIsMonetized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [error, setError] = useState('');

  // Check if we have a video from route params
  useEffect(() => {
    if (route.params?.videoSource) {
      setVideoSource(route.params.videoSource);

      // Generate thumbnail from video if possible
      if (Platform.OS === 'ios') {
        // iOS-specific thumbnail generation would go here
      } else {
        // Android-specific thumbnail generation would go here
      }
    }
  }, [route.params]);

  // Pick video from gallery
  const pickVideo = async () => {
    try {
      // Check permissions first
      const permissionStatus =
        Platform.OS === 'ios'
          ? await check(PERMISSIONS.IOS.PHOTO_LIBRARY)
          : await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

      if (permissionStatus !== RESULTS.GRANTED) {
        const requestResult =
          Platform.OS === 'ios'
            ? await request(PERMISSIONS.IOS.PHOTO_LIBRARY)
            : await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'You need to grant permission to access your media library',
          );
          return;
        }
      }

      // Launch media library
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1080,
        maxWidth: 1920,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        setError(`Error picking video: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];

        // Check video duration and size
        if (video.fileSize && video.fileSize > 100 * 1024 * 1024) {
          // 100 MB limit
          Alert.alert(
            'File Too Large',
            'Please select a video smaller than 100 MB',
          );
          return;
        }

        setVideoSource({
          uri: video.uri,
          type: video.type,
          name: video.fileName,
          size: video.fileSize,
        });

        // Navigate to preview if needed
        // navigation.navigate('VideoPreview', { videoSource: video });
      }
    } catch (err) {
      console.error('Error picking video:', err);
      setError('Failed to select video');
    }
  };

  // Pick custom thumbnail
  const pickThumbnail = async () => {
    try {
      ImagePicker.openPicker({
        width: 1280,
        height: 720,
        cropping: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      }).then(image => {
        setThumbnail({
          uri:
            Platform.OS === 'ios' ? image.sourceURL || image.path : image.path,
          type: image.mime,
          name: image.path.split('/').pop(),
        });
      });
    } catch (err) {
      console.error('Error picking thumbnail:', err);
    }
  };

  // Handle select category
  const handleSelectCategory = () => {
    // @ts-ignore
    navigation.navigate('SelectCategory', {
      onSelect: (category: any) => setSelectedCategory(category),
      selectedCategory,
    });
  };

  // Handle upload
  const handleUpload = async () => {
    // Validate input
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for your video');
      return;
    }

    if (!videoSource) {
      Alert.alert('Missing Video', 'Please select a video to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError('');

      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('isPublic', isPublic ? '1' : '0');
      formData.append('isMonetized', isMonetized ? '1' : '0');

      if (selectedCategory) {
        formData.append('categoryId', selectedCategory.id);
      }

      // Append video file
      formData.append('video', {
        uri: videoSource.uri,
        type: videoSource.type || 'video/mp4',
        name: videoSource.name || 'video.mp4',
      } as any);

      // Append thumbnail if selected
      if (thumbnail) {
        formData.append('thumbnail', {
          uri: thumbnail.uri,
          type: thumbnail.type,
          name: thumbnail.name,
        } as any);
      }

      // Upload video
      await ApiService.uploadFile(
        ENDPOINTS.UPLOAD_VIDEO,
        formData,
        progress => {
          setUploadProgress(progress / 100);
        },
      );

      setIsUploading(false);
      setProcessingVideo(true);

      // Check processing status
      setTimeout(() => {
        setProcessingVideo(false);
        Alert.alert(
          'Upload Successful',
          'Your video has been uploaded and will be available once processing is complete',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }, 2000);
    } catch (e) {
      setIsUploading(false);
      setProcessingVideo(false);
      console.error('Error uploading video:', e);
      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your video. Please try again.',
      );
    }
  };

  // Render video selection button or preview
  const renderVideoSection = () => {
    if (!videoSource) {
      return (
        <TouchableOpacity
          style={[styles.uploadContainer, {borderColor: colors.border}]}
          onPress={pickVideo}>
          <Icon name="video" size={40} color={colors.primary} />
          <Text style={[styles.uploadText, {color: colors.text.secondary}]}>
            Select Video
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.videoPreviewContainer}>
        {thumbnail ? (
          <Image
            source={{uri: thumbnail.uri}}
            style={styles.thumbnailPreview}
          />
        ) : (
          <View
            style={[
              styles.videoPlaceholder,
              {backgroundColor: colors.gray[200]},
            ]}>
            <Icon name="video" size={40} color={colors.gray[400]} />
          </View>
        )}

        <View style={styles.videoInfoContainer}>
          <Text
            style={[styles.videoName, {color: colors.text.primary}]}
            numberOfLines={1}>
            {videoSource.name || 'Selected Video'}
          </Text>
          {videoSource.size && (
            <Text style={[styles.videoSize, {color: colors.text.tertiary}]}>
              {(videoSource.size / (1024 * 1024)).toFixed(2)} MB
            </Text>
          )}
        </View>

        <View style={styles.videoActionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.gray[100]}]}
            onPress={pickThumbnail}>
            <Icon name="image" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.gray[100]}]}
            onPress={pickVideo}>
            <Icon name="refresh-cw" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const uploadButtonOpacity =
    isUploading || processingVideo || !videoSource || !title.trim() ? 0.5 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Upload Video"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity
            onPress={handleUpload}
            disabled={
              isUploading || processingVideo || !videoSource || !title.trim()
            }
            style={[styles.uploadButton, {opacity: uploadButtonOpacity}]}
          >
            <Text style={[styles.uploadButtonText, {color: colors.primary}]}>
              Upload
            </Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Video upload section */}
          {renderVideoSection()}

          {error ? (
            <Text style={[styles.errorText, {color: colors.error}]}>
              {error}
            </Text>
          ) : null}

          {/* Form fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {color: colors.text.primary, borderColor: colors.border},
                ]}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                placeholder="Add a title that describes your video"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {color: colors.text.primary, borderColor: colors.border},
                ]}
                value={description}
                onChangeText={setDescription}
                maxLength={5000}
                placeholder="Tell viewers about your video"
                placeholderTextColor={colors.text.tertiary}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Category selection */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>
                Category
              </Text>
              <TouchableOpacity
                style={[styles.categoryButton, {borderColor: colors.border}]}
                onPress={handleSelectCategory}>
                {selectedCategory ? (
                  <CategoryChip category={selectedCategory} selected={true} />
                ) : (
                  <Text style={{color: colors.text.tertiary}}>
                    Select category
                  </Text>
                )}
                <Icon
                  name="chevron-right"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            {/* Visibility toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text
                  style={[styles.toggleLabel, {color: colors.text.primary}]}>
                  Public
                </Text>
                <Text
                  style={[
                    styles.toggleDescription,
                    {color: colors.text.tertiary},
                  ]}>
                  {isPublic
                    ? 'Everyone can see this video'
                    : 'Only you can see this video'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: colors.gray[300],
                  true: colors.primary + '80',
                }}
                thumbColor={isPublic ? colors.primary : colors.gray[100]}
              />
            </View>

            {/* Monetization toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text
                  style={[styles.toggleLabel, {color: colors.text.primary}]}>
                  Monetize
                </Text>
                <Text
                  style={[
                    styles.toggleDescription,
                    {color: colors.text.tertiary},
                  ]}>
                  {isMonetized
                    ? 'Earn money from this video'
                    : 'No monetization for this video'}
                </Text>
              </View>
              <Switch
                value={isMonetized}
                onValueChange={setIsMonetized}
                trackColor={{
                  false: colors.gray[300],
                  true: colors.primary + '80',
                }}
                thumbColor={isMonetized ? colors.primary : colors.gray[100]}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upload loading overlay */}
      {(isUploading || processingVideo) && (
        <View
          style={[
            styles.loadingOverlay,
            {backgroundColor: colors.background + 'E6'},
          ]}>
          <View
            style={[styles.loadingContainer, {backgroundColor: colors.card}]}>
            {isUploading ? (
              <>
                <Text
                  style={[styles.loadingText, {color: colors.text.primary}]}>
                  Uploading video...
                </Text>
                <Progress.Bar
                  progress={uploadProgress}
                  width={200}
                  color={colors.primary}
                  unfilledColor={colors.gray[200]}
                  borderWidth={0}
                  height={8}
                  style={styles.progressBar}
                />
                <Text
                  style={[styles.percentText, {color: colors.text.secondary}]}>
                  {Math.round(uploadProgress * 100)}%
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.loadingText, {color: colors.text.primary}]}>
                  Processing video...
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  uploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  videoPreviewContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    height: 100,
  },
  thumbnailPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  videoName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoSize: {
    fontSize: 14,
  },
  videoActionButtons: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 12,
  },
  percentText: {
    fontSize: 14,
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  uploadButton: {
    // Only opacity is dynamic
  },
  uploadButtonText: {
    fontWeight: '600',
  },
});

export default TipTubeUploadScreen;
