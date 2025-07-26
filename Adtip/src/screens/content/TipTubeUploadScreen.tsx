import React, { useState, useEffect, useCallback } from 'react';
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
  PermissionsAndroid,
  Linking,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import VideoCompressionService, { VideoCompressionOptions } from '../../services/VideoCompressionService';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import UnifiedUploadService, { UnifiedUploadProgress } from '../../services/UnifiedUploadService';
import { ForceStreamUploads } from '../../utils/ForceStreamUploads';
import { UploadConfigManager } from '../../config/UploadConfig';
import RNFS from 'react-native-fs';
import { getVideoDurationProps } from '../../utils/videoUtils';
import Video from 'react-native-video';

const { width: screenWidth } = Dimensions.get('window');

// API Interfaces
interface TipTubeUploadRequest {
  name: string;
  isShot: boolean;
  categoryId: number;
  channelId: number;
  videoLink: string;
  videoDesciption: string;
  createdby: number;
  play_duration: string;
  video_Thumbnail: string;
  is_paid_promotional?: boolean;
  promotional_price?: number;
}

interface TipTubeUploadResponse {
  status: number;
  message: string;
  data: Array<{
    id: number;
    name: string;
    isShot: boolean;
    categoryId: number;
    channelId: number;
    videoLink: string;
    videoDesciption: string;
    createdby: number;
    play_duration: string;
    video_Thumbnail: string;
    is_paid_promotional?: boolean;
    promotional_price?: number;
  }>;
}

// Video Categories
const VIDEO_CATEGORIES = [
  { id: 1, name: 'Education', icon: 'book-open' },
  { id: 2, name: 'Entertainment', icon: 'play-circle' },
  { id: 3, name: 'Technology', icon: 'smartphone' },
  { id: 4, name: 'Sports', icon: 'activity' },
  { id: 5, name: 'Music', icon: 'music' },
  { id: 6, name: 'Gaming', icon: 'gamepad-2' },
  { id: 7, name: 'Lifestyle', icon: 'heart' },
  { id: 8, name: 'News', icon: 'radio' },
];

// Quality Options
const QUALITY_OPTIONS = [
  { key: 'high', label: 'High Quality (Best)', description: '1080p • Larger file size' },
  { key: 'medium', label: 'Medium Quality (Recommended)', description: '720p • Balanced' },
  { key: 'low', label: 'Low Quality (Fast)', description: '480p • Smaller file size' },
];

const TipTubeUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('medium');

  // Media State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState('00:00:00');
  const [videoSize, setVideoSize] = useState<number>(0);
  const [originalVideoSize, setOriginalVideoSize] = useState<number>(0);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isExtractingDuration, setIsExtractingDuration] = useState(false);
  const [hiddenVideoUri, setHiddenVideoUri] = useState<string | null>(null);

  // Channel Info - dynamically fetched from API
  const [channelId, setChannelId] = useState<number | null>(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);

  // Fetch user's channel ID
  const fetchChannelId = async () => {
    if (!user?.id || channelId !== null) return;

    try {
      setIsLoadingChannel(true);
      console.log('[TipTubeUpload] Fetching channel ID for user:', user.id);

      const response = await ApiService.getChannelByUserId(user.id);
      console.log('[TipTubeUpload] Channel response:', response);

      if (response.status === 200 && response.data && response.data.length > 0) {
        const userChannelId = response.data[0].channelId;
        setChannelId(userChannelId);
        console.log('[TipTubeUpload] Channel ID set to:', userChannelId);
      } else {
        console.error('[TipTubeUpload] No channel found for user');
        Alert.alert(
          'Channel Required',
          'You need to create a channel before uploading videos. Please create a channel first.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[TipTubeUpload] Error fetching channel ID:', error);
      Alert.alert(
        'Error',
        'Failed to fetch channel information. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoadingChannel(false);
    }
  };

  // Fetch channel ID when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchChannelId();
    }
  }, [user?.id]);

  // Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isUploading || isCompressing) {
          Alert.alert(
            'Upload in Progress',
            'Are you sure you want to cancel the upload?',
            [
              { text: 'Continue Upload', style: 'cancel' },
              { text: 'Cancel Upload', style: 'destructive', onPress: () => navigation.goBack() },
            ],
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isUploading, isCompressing, navigation]),
  );

  // Permission Requests (Following TipCallScreen pattern)
  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[TipTubeUpload] Requesting Android storage permission');
        
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to select videos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        console.log('[TipTubeUpload] Android permission result:', result);

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Permission Required',
            'Storage access is required to select videos. Please try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => requestStoragePermission() },
            ],
          );
          return false;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Blocked',
            'Storage permission has been permanently denied. Please enable it from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return false;
        }
        return false;
      } else {
        // iOS - permissions handled by react-native-image-picker
        return true;
      }
    } catch (error) {
      console.error('[TipTubeUpload] Error requesting storage permission:', error);
      Alert.alert('Permission Error', 'Failed to request permission. Please try again.');
      return false;
    }
  };

  // Get video duration and size
  const getVideoInfo = async (uri: string) => {
    try {
      const stats = await RNFS.stat(uri);
      setVideoSize(stats.size);
      setOriginalVideoSize(stats.size);
      
      // Extract actual video duration
      console.log('[TipTubeUpload] Extracting video duration for:', uri);
      setIsExtractingDuration(true);
      setHiddenVideoUri(uri);
    } catch (error) {
      console.error('Error getting video info:', error);
      setVideoDuration('00:01:30'); // Default fallback
    }
  };

  // Handle video duration extraction from hidden video component
  const handleDurationExtracted = (duration: string) => {
    console.log('[TipTubeUpload] Duration extracted:', duration);
    setVideoDuration(duration);
    setIsExtractingDuration(false);
    setHiddenVideoUri(null);
  };

  // Pick video from gallery
  const pickVideo = async () => {
    try {
      setError(null);
      
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[TipTubeUpload] Launching video picker');

      const result = await launchImageLibrary({
        mediaType: 'video' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1080,
        maxWidth: 1920,
        quality: 1,
      });

      console.log('[TipTubeUpload] Video picker result:', result);

      if (result.didCancel) {
        console.log('[TipTubeUpload] User cancelled video selection');
        return;
      }

      if (result.errorCode) {
        console.error('[TipTubeUpload] Video picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select video: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log('[TipTubeUpload] Selected video:', {
          uri: video.uri,
          fileSize: video.fileSize,
          duration: video.duration,
          type: video.type,
        });

        if (video.uri) {
          setSelectedVideo(video.uri);
          await getVideoInfo(video.uri);
          
          // Auto-generate thumbnail if none selected
          if (!selectedThumbnail) {
            // You can implement thumbnail generation here
            // For now, we'll let user manually select
          }
        }
      } else {
        Alert.alert('Error', 'No video selected. Please try again.');
      }
    } catch (err: any) {
      console.error('[TipTubeUpload] Error picking video:', err);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  // Pick thumbnail for video
  const pickThumbnail = async () => {
    try {
      setError(null);
      
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[TipTubeUpload] Launching thumbnail picker');

      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 720,
        maxWidth: 1280,
        quality: 0.8,
      });

      console.log('[TipTubeUpload] Thumbnail picker result:', result);

      if (result.didCancel) {
        console.log('[TipTubeUpload] User cancelled thumbnail selection');
        return;
      }

      if (result.errorCode) {
        console.error('[TipTubeUpload] Thumbnail picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select thumbnail: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const thumbnail = result.assets[0];
        console.log('[TipTubeUpload] Selected thumbnail:', thumbnail.uri);

        if (thumbnail.uri) {
          setSelectedThumbnail(thumbnail.uri);
        }
      } else {
        Alert.alert('Error', 'No thumbnail selected. Please try again.');
      }
    } catch (error: any) {
      console.error('[TipTubeUpload] Error picking thumbnail:', error);
      Alert.alert('Error', 'Failed to select thumbnail. Please try again.');
    }
  };

  // Compress video
  const compressVideo = async (videoUri: string): Promise<string> => {
    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      console.log('[TipTubeUpload] Starting video compression for:', videoUri);

      // TEMPORARY DEBUG: Check original file before compression
      const originalStats = await RNFS.stat(videoUri);
      console.log('[TipTubeUpload] Original video stats before compression:', {
        path: videoUri,
        size: originalStats.size,
        exists: await RNFS.exists(videoUri)
      });

      // TEMPORARY DEBUG OPTIONS
      const SKIP_COMPRESSION_FOR_DEBUG = false; // Set to true to test without compression
      const USE_SIMPLE_COMPRESSION = true; // Set to true to use basic compression

      if (SKIP_COMPRESSION_FOR_DEBUG) {
        console.log('[TipTubeUpload] SKIPPING COMPRESSION FOR DEBUG - using original file');
        setCompressionProgress(100);
        setIsCompressing(false);
        return videoUri;
      }

      let compressedResult;

      if (USE_SIMPLE_COMPRESSION) {
        console.log('[TipTubeUpload] Using simple compression method');

        // Use the simplest compression method for debugging
        const simpleCompressedUri = await VideoCompressionService.simpleCompress(
          videoUri,
          (progress) => {
            console.log('[TipTubeUpload] Simple compression progress:', progress);
            setCompressionProgress(progress);
          }
        );

        // Create a result object manually
        const originalStats = await RNFS.stat(videoUri);
        const compressedStats = await RNFS.stat(simpleCompressedUri);

        compressedResult = {
          originalUri: videoUri,
          compressedUri: simpleCompressedUri,
          originalSize: originalStats.size,
          compressedSize: compressedStats.size,
          compressionRatio: originalStats.size / compressedStats.size,
          success: true,
        };
      } else {
        console.log('[TipTubeUpload] Using TipTube compression method');

        const compressionOptions: VideoCompressionOptions = {
          quality: selectedQuality,
          compressionMethod: 'auto', // Use auto compression like WhatsApp
          minimumFileSizeForCompress: 0, // Always compress
        };

        compressedResult = await VideoCompressionService.compressForTipTube(
          videoUri,
          compressionOptions,
          (progress) => {
            console.log('[TipTubeUpload] Compression progress:', progress);
            setCompressionProgress(progress);
          }
        );
      }

      setCompressionProgress(100);

      console.log('[TipTubeUpload] Video compression result:', {
        originalUri: compressedResult.originalUri,
        compressedUri: compressedResult.compressedUri,
        originalSize: compressedResult.originalSize,
        compressedSize: compressedResult.compressedSize,
        compressionRatio: compressedResult.compressionRatio,
        success: compressedResult.success,
        error: compressedResult.error
      });

      // Validate that we have a valid compressed URI
      if (!compressedResult.success || !compressedResult.compressedUri) {
        console.warn('[TipTubeUpload] Compression failed, using original video for upload');
        console.warn('[TipTubeUpload] Compression error:', compressedResult.error);

        // Fallback to original video if compression fails
        // This allows Stream upload to proceed even if compression has issues
        try {
          const stats = await RNFS.stat(videoUri);
          setVideoSize(stats.size);
          console.log('[TipTubeUpload] Using original video size:', stats.size);
          return videoUri; // Return original video URI
        } catch (statError) {
          console.error('[TipTubeUpload] Error getting original video stats:', statError);
          throw new Error('Failed to process video. Please try again.');
        }
      }

      // Update video size after compression
      const stats = await RNFS.stat(compressedResult.compressedUri);
      console.log('[TipTubeUpload] Compressed video file stats:', {
        path: compressedResult.compressedUri,
        size: stats.size,
        exists: await RNFS.exists(compressedResult.compressedUri),
        expectedSize: compressedResult.compressedSize,
        sizesMatch: stats.size === compressedResult.compressedSize
      });

      setVideoSize(stats.size);

      return compressedResult.compressedUri;
    } catch (error) {
      console.error('[TipTubeUpload] Error compressing video:', error);
      throw new Error('Failed to compress video. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Upload media files using Unified Upload Service (Stream or R2)
  const uploadMedia = async (videoUri: string, thumbnailUri: string): Promise<{ videoUrl: string; thumbnailUrl: string; streamVideoId?: string }> => {
    try {
      console.log('[TipTubeUpload] Starting unified upload (Stream/R2)');

      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Prepare upload data
      const uploadData = {
        videoUri,
        thumbnailUri,
        metadata: {
          name: title.trim(),
          description: description.trim(),
          categoryId: categoryId,
          channelId: channelId || user.id, // Use user.id as fallback if channelId is null
          userId: user.id,
          isShot: false, // This is TipTube (long-form video)
        },
      };

      // Prepare user info for upload
      const userInfo = {
        userId: user.id.toString(),
        userName: user.name || user.username || '',
        channelId: channelId?.toString() || user.id.toString(),
      };

      console.log('[TipTubeUpload] User info for upload:', userInfo);

      // Use UnifiedUploadService for intelligent upload method selection
      const uploadResult = await UnifiedUploadService.uploadTipTube(
        uploadData,
        userInfo,
        (progress: UnifiedUploadProgress) => {
          setUploadProgress(progress.percentage);

          // Show upload method in progress
          if (progress.method === 'stream') {
            console.log(`[TipTubeUpload] Stream upload: ${progress.stage} (${progress.percentage}%)`);
          } else {
            console.log(`[TipTubeUpload] R2 upload: ${progress.stage} (${progress.percentage}%)`);
          }
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      if (!uploadResult.videoUrl) {
        throw new Error('Upload completed but video URL is missing');
      }

      console.log('[TipTubeUpload] Upload successful:', {
        method: uploadResult.method,
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        streamVideoId: uploadResult.streamVideoId,
        fallbackUsed: uploadResult.fallbackUsed,
      });

      // Show success message with upload method info
      if (uploadResult.method === 'stream') {
        console.log('[TipTubeUpload] ✅ Uploaded using Cloudflare Stream (optimized for mobile)');
      } else {
        console.log('[TipTubeUpload] ✅ Uploaded using Cloudflare R2 (traditional method)');
      }

      return {
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: uploadResult.thumbnailUrl || thumbnailUri,
        streamVideoId: uploadResult.streamVideoId,
      };
    } catch (error) {
      console.error('[TipTubeUpload] Error uploading media:', error);
      throw new Error('Failed to upload media files to cloud storage. Please check your connection and try again.');
    }
  };

  // Create TipTube video
  const createTipTubeVideo = async (videoUrl: string, thumbnailUrl: string): Promise<void> => {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const requestData = {
        name: title.trim(),
        categoryId: categoryId,
        channelId: channelId || user.id, // Use user.id as fallback if channelId is null
        videoLink: videoUrl,
        videoDesciption: description.trim(),
        createdby: user.id,
        play_duration: videoDuration,
        video_Thumbnail: thumbnailUrl,
        is_paid_promotional: isPaidVideo,
        promotional_price: isPaidVideo ? parseFloat(promotionalPrice) : undefined,
      };

      console.log('[TipTubeUpload] Creating video with data:', {
        ...requestData,
        isPaidVideo,
        promotionalPrice: isPaidVideo ? promotionalPrice : 'N/A'
      });

      console.log('[TipTubeUpload] Creating TipTube video with new API:', requestData);

      const response = await ApiService.uploadTipTubeVideo(requestData);

      console.log('[TipTubeUpload] TipTube video created:', response);

      if (response.status === 200) {
        // Show different success messages for paid vs free videos
        const successMessage = isPaidVideo
          ? `Your paid video has been uploaded successfully! Price: ₹${promotionalPrice}`
          : 'Your video has been uploaded successfully.';

        Alert.alert(
          'Success!',
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create video');
      }
    } catch (error: any) {
      console.error('[TipTubeUpload] Error creating TipTube video:', error);
      throw new Error(error.message || 'Failed to create video. Please try again.');
    }
  };

  // Validation helper function
  const validateUploadData = (): string | null => {
    if (!selectedVideo) return 'Please select a video to upload.';
    if (!title.trim()) return 'Please enter a title for your video.';
    if (title.trim().length < 3) return 'Video title must be at least 3 characters long.';
    if (!selectedThumbnail) return 'Please select a thumbnail for your video.';
    if (!categoryId) return 'Please select a video category.';
    if (!channelId) return 'Channel information is required. Please wait for channel to load or try again.';
    if (!user?.id) return 'User authentication required. Please log in again.';
    if (isPaidVideo && (!promotionalPrice || parseFloat(promotionalPrice) <= 0)) {
      return 'Please enter a valid promotional price for paid video.';
    }
    if (isPaidVideo && parseFloat(promotionalPrice) > 1000) {
      return 'Promotional price cannot exceed ₹1000.';
    }
    return null;
  };

  // Main upload function
  const handleUpload = async () => {
    try {
      // Enhanced validation
      const validationError = validateUploadData();
      if (validationError) {
        Alert.alert('Validation Error', validationError);
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Step 1: Compress video
      console.log('[TipTubeUpload] Step 1: Compressing video');
      const compressedVideoUri = await compressVideo(selectedVideo!); // Non-null assertion - validated above

      // Step 2: Upload media files
      console.log('[TipTubeUpload] Step 2: Uploading media files');
      const { videoUrl, thumbnailUrl, streamVideoId } = await uploadMedia(compressedVideoUri, selectedThumbnail!);

      // Step 3: Create TipTube video record
      console.log('[TipTubeUpload] Step 3: Creating video record');
      await createTipTubeVideo(videoUrl, thumbnailUrl);

      // Cleanup compressed file
      try {
        if (compressedVideoUri !== selectedVideo) {
          await RNFS.unlink(compressedVideoUri);
        }
      } catch (cleanupError) {
        console.warn('[TipTubeUpload] Failed to cleanup compressed file:', cleanupError);
      }

    } catch (error: any) {
      console.error('[TipTubeUpload] Upload failed:', error);

      // Enhanced error handling with specific messages
      let errorTitle = 'Upload Failed';
      let errorMessage = 'Something went wrong. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('Video title is required')) {
        errorTitle = 'Validation Error';
        errorMessage = 'Please enter a title for your video.';
      } else if (error.message?.includes('Video category is required')) {
        errorTitle = 'Category Required';
        errorMessage = 'Please select a video category.';
      } else if (error.message?.includes('Channel ID is required')) {
        errorTitle = 'Channel Required';
        errorMessage = 'Please select a channel for your video.';
      } else if (error.message?.includes('User authentication required')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('promotional price') || error.message?.includes('paid_promotional')) {
        errorTitle = 'Pricing Error';
        errorMessage = 'Please enter a valid promotional price for paid videos.';
      } else if (error.message?.includes('payment') || error.message?.includes('billing')) {
        errorTitle = 'Payment Error';
        errorMessage = 'There was an issue with the payment setup for your paid video. Please try again.';
      } else if (error.message?.includes('Upload failed')) {
        errorTitle = 'Upload Error';
        errorMessage = 'Failed to upload video. Please check your internet connection and try again.';
      } else if (error.message?.includes('compression')) {
        errorTitle = 'Compression Error';
        errorMessage = 'Failed to compress video. Please try with a different video file.';
      } else if (error.message?.includes('Network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
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
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
      setCompressionProgress(0);
      setUploadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate compression ratio
  const getCompressionRatio = (): string => {
    if (originalVideoSize === 0 || videoSize === 0) return '';
    const ratio = ((originalVideoSize - videoSize) / originalVideoSize) * 100;
    return ratio > 0 ? `${ratio.toFixed(1)}% smaller` : '';
  };

  // Handle paid video toggle
  const handlePaidVideoToggle = (value: boolean) => {
    setIsPaidVideo(value);
    if (!value) {
      setPromotionalPrice('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Upload Video" 
        showSearch={false}
        showWallet={false}
        showPremium={true}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Video Selection */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Video
            </Text>
            
            {selectedVideo ? (
              <View style={[styles.mediaPreview, { borderColor: colors.border }]}>
                <View style={styles.videoPreview}>
                  <Icon name="play-circle" size={40} color={colors.primary} />
                  <Text style={[styles.videoInfo, { color: colors.text.secondary }]}>
                    {formatFileSize(originalVideoSize)}
                    {videoSize !== originalVideoSize && (
                      <Text style={{ color: colors.success }}>
                        {' → ' + formatFileSize(videoSize)}
                      </Text>
                    )}
                  </Text>
                  <Text style={[styles.videoInfo, { color: colors.text.secondary }]}>
                    Duration: {isExtractingDuration ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      videoDuration
                    )}
                  </Text>
                  {getCompressionRatio() && (
                    <Text style={[styles.compressionInfo, { color: colors.success }]}>
                      {getCompressionRatio()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={[styles.changeButton, { backgroundColor: colors.primary }]}
                  onPress={pickVideo}
                  disabled={isUploading || isCompressing}
                >
                  <Icon name="edit-2" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { 
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.card : '#F8F9FA'
                }]}
                onPress={pickVideo}
                disabled={isUploading || isCompressing}
              >
                <Icon name="video" size={32} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.text.primary }]}>
                  Select Video
                </Text>
                <Text style={[styles.uploadButtonSubtext, { color: colors.text.secondary }]}>
                  Choose from gallery
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Thumbnail Selection */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Thumbnail
            </Text>
            
            {selectedThumbnail ? (
              <View style={[styles.mediaPreview, { borderColor: colors.border }]}>
                <Image source={{ uri: selectedThumbnail }} style={styles.thumbnailPreview} />
                <TouchableOpacity 
                  style={[styles.changeButton, { backgroundColor: colors.primary }]}
                  onPress={pickThumbnail}
                  disabled={isUploading || isCompressing}
                >
                  <Icon name="edit-2" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { 
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.card : '#F8F9FA'
                }]}
                onPress={pickThumbnail}
                disabled={isUploading || isCompressing}
              >
                <Icon name="image" size={32} color={colors.primary} />
                <Text style={[styles.uploadButtonText, { color: colors.text.primary }]}>
                  Select Thumbnail
                </Text>
                <Text style={[styles.uploadButtonSubtext, { color: colors.text.secondary }]}>
                  Choose cover image
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Video Details */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Video Details
            </Text>
            
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                Title *
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                  borderColor: colors.border,
                  color: colors.text.primary 
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter video title"
                placeholderTextColor={colors.text.tertiary}
                maxLength={100}
                editable={!isUploading && !isCompressing}
              />
              <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
                {title.length}/100
              </Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                  borderColor: colors.border,
                  color: colors.text.primary 
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your video..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                editable={!isUploading && !isCompressing}
              />
              <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
                {description.length}/500
              </Text>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                Category
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
              >
                {VIDEO_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: categoryId === category.id 
                          ? colors.primary 
                          : isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                        borderColor: categoryId === category.id 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => setCategoryId(category.id)}
                    disabled={isUploading || isCompressing}
                  >
                    <Icon 
                      name={category.icon} 
                      size={16} 
                      color={categoryId === category.id ? colors.white : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      { 
                        color: categoryId === category.id 
                          ? colors.white 
                          : colors.text.primary 
                      }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quality Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                Quality
              </Text>
              <TouchableOpacity
                style={[styles.qualitySelector, { 
                  backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                  borderColor: colors.border 
                }]}
                onPress={() => setShowQualityModal(true)}
                disabled={isUploading || isCompressing}
              >
                <View style={styles.qualityInfo}>
                  <Text style={[styles.qualityText, { color: colors.text.primary }]}>
                    {QUALITY_OPTIONS.find(q => q.key === selectedQuality)?.label}
                  </Text>
                  <Text style={[styles.qualityDescription, { color: colors.text.tertiary }]}>
                    {QUALITY_OPTIONS.find(q => q.key === selectedQuality)?.description}
                  </Text>
                </View>
                <Icon name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Paid Video Setting */}
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                    Paid Video
                  </Text>
                  <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                    Enable to set a promotional price
                  </Text>
                </View>
                <Switch
                  value={isPaidVideo}
                  onValueChange={handlePaidVideoToggle}
                  trackColor={{ false: colors.gray?.[300], true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={isUploading || isCompressing}
                />
              </View>
              
              {/* Promotional Price Input */}
              {isPaidVideo && (
                <View style={styles.priceInputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text.secondary, marginTop: 16 }]}>
                    Promotional Price *
                  </Text>
                  <View style={[styles.priceInputWrapper, { 
                    backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                    borderColor: colors.border 
                  }]}>
                    <Text style={[styles.currencySymbol, { color: colors.text.secondary }]}>₹</Text>
                    <TextInput
                      style={[styles.priceInput, { color: colors.text.primary }]}
                      value={promotionalPrice}
                      onChangeText={setPromotionalPrice}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="numeric"
                      editable={!isUploading && !isCompressing}
                    />
                  </View>
                  <Text style={[styles.priceHelper, { color: colors.text.tertiary }]}>
                    Set the price viewers will pay to watch this video
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress Section */}
          {(isCompressing || isUploading) && (
            <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                {isCompressing ? 'Compressing Video' : 'Uploading'}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.gray?.[200] }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: colors.primary,
                        width: `${isCompressing ? compressionProgress : uploadProgress}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                  {isCompressing ? `${compressionProgress}%` : `${uploadProgress}%`}
                </Text>
              </View>

              {isCompressing && (
                <Text style={[styles.progressDescription, { color: colors.text.tertiary }]}>
                  Optimizing video quality for faster upload...
                </Text>
              )}
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
              <Icon name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Upload Button */}
        <View style={[styles.uploadButtonContainer, { 
          backgroundColor: colors.background,
          borderTopColor: colors.border 
        }]}>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              {
                backgroundColor: (!selectedVideo || !title.trim() || !selectedThumbnail || isUploading || isCompressing || isLoadingChannel || !channelId || (isPaidVideo && (!promotionalPrice || parseFloat(promotionalPrice) <= 0)))
                  ? colors.gray?.[400]
                  : colors.primary,
              }
            ]}
            onPress={handleUpload}
            disabled={!selectedVideo || !title.trim() || !selectedThumbnail || isUploading || isCompressing || isLoadingChannel || !channelId || (isPaidVideo && (!promotionalPrice || parseFloat(promotionalPrice) <= 0))}
          >
            {(isUploading || isCompressing || isLoadingChannel) ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="upload" size={20} color={colors.white} />
            )}
            <Text style={[styles.uploadBtnText, { color: colors.white }]}>
              {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : isLoadingChannel ? 'Loading Channel...' : 'Upload Video'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Quality Selection Modal */}
      {showQualityModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.qualityModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Select Quality
            </Text>
            
            {QUALITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.qualityOption,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => {
                  setSelectedQuality(option.key as 'high' | 'medium' | 'low');
                  setShowQualityModal(false);
                }}
              >
                <View style={styles.qualityOptionContent}>
                  <Text style={[styles.qualityOptionLabel, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.qualityOptionDescription, { color: colors.text.secondary }]}>
                    {option.description}
                  </Text>
                </View>
                {selectedQuality === option.key && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.gray?.[200] }]}
              onPress={() => setShowQualityModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hidden Video Component for Duration Extraction */}
      {hiddenVideoUri && (
        <Video
          {...getVideoDurationProps(hiddenVideoUri, handleDurationExtracted)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  
  // Media Upload Styles
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  mediaPreview: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPreview: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  videoInfo: {
    marginTop: 8,
    fontSize: 14,
  },
  compressionInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  thumbnailPreview: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  changeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Category Styles
  categoryScrollView: {
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Quality Selector
  qualitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  qualityDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Switch Styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Price Input Styles
  priceInputContainer: {
    marginTop: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  priceHelper: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Progress Styles
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  progressDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Error Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  
  // Upload Button
  uploadButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qualityModal: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  qualityOptionContent: {
    flex: 1,
  },
  qualityOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  qualityOptionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TipTubeUploadScreen;