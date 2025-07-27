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
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import Header from '../../components/common/Header';
import VideoCompressionService, { VideoCompressionOptions } from '../../services/VideoCompressionService';
import ApiService from '../../services/ApiService';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import UnifiedUploadService, { UnifiedUploadProgress } from '../../services/UnifiedUploadService';
import { ForceStreamUploads } from '../../utils/ForceStreamUploads';
import { UploadConfigManager } from '../../config/UploadConfig';
import RNFS from 'react-native-fs';
import { EventRegister } from 'react-native-event-listeners';
import { getVideoDurationProps } from '../../utils/videoUtils';
import Video from 'react-native-video';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// API Interfaces
interface TipShotUploadRequest {
  name: string;
  isShot: boolean;
  categoryId: number;
  channelId: number;
  videoLink: string;
  videoDesciption: string;
  createdby: number;
  play_duration: string;
  video_Thumbnail: string;
}

interface TipShotUploadResponse {
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
  }>;
}

// Short Video Categories
const SHORT_CATEGORIES = [
  { id: 1, name: 'Entertainment', icon: 'play-circle', color: '#FF6B6B' },
  { id: 2, name: 'Comedy', icon: 'smile', color: '#4ECDC4' },
  { id: 3, name: 'Dance', icon: 'music', color: '#45B7D1' },
  { id: 4, name: 'Tutorial', icon: 'book-open', color: '#96CEB4' },
  { id: 5, name: 'Cooking', icon: 'coffee', color: '#FECA57' },
  { id: 6, name: 'Fashion', icon: 'shopping-bag', color: '#FF9FF3' },
  { id: 7, name: 'Tech', icon: 'smartphone', color: '#54A0FF' },
  { id: 8, name: 'Lifestyle', icon: 'heart', color: '#5F27CD' },
];

// Compression Quality Options for Shorts
const COMPRESSION_OPTIONS = [
  { 
    key: 'whatsapp', 
    label: 'WhatsApp Quality', 
    description: 'Maximum compression • Best for sharing',
    bitrate: 500000, // 500 kbps
    maxSize: 10 // 10MB max
  },
  { 
    key: 'balanced', 
    label: 'Balanced Quality', 
    description: 'Good compression • Recommended',
    bitrate: 800000, // 800 kbps
    maxSize: 25 // 25MB max
  },
  { 
    key: 'high', 
    label: 'High Quality', 
    description: 'Less compression • Better quality',
    bitrate: 1200000, // 1.2 Mbps
    maxSize: 50 // 50MB max
  },
];

const TipShortsUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isContentCreatorPremium } = useContentCreatorPremium();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [selectedCompression, setSelectedCompression] = useState<'whatsapp' | 'balanced' | 'high'>('whatsapp');

  // Media State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState('00:00:30');
  const [videoSize, setVideoSize] = useState<number>(0);
  const [originalVideoSize, setOriginalVideoSize] = useState<number>(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      console.log('[TipShortsUpload] Fetching channel ID for user:', user.id);

      const response = await ApiService.getChannelByUserId(user.id);
      console.log('[TipShortsUpload] Channel response:', response);

      if (response.status === 200 && response.data && response.data.length > 0) {
        const userChannelId = response.data[0].channelId;
        setChannelId(userChannelId);
        console.log('[TipShortsUpload] Channel ID set to:', userChannelId);
      } else {
        console.error('[TipShortsUpload] No channel found for user');
        Alert.alert(
          'Channel Required',
          'You need to create a channel before uploading videos. Please create a channel first.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[TipShortsUpload] Error fetching channel ID:', error);
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
        if (isUploading || isCompressing || isRecording) {
          Alert.alert(
            isRecording ? 'Recording in Progress' : 'Upload in Progress',
            isRecording 
              ? 'Are you sure you want to stop recording?' 
              : 'Are you sure you want to cancel the upload?',
            [
              { text: isRecording ? 'Continue Recording' : 'Continue Upload', style: 'cancel' },
              { 
                text: isRecording ? 'Stop Recording' : 'Cancel Upload', 
                style: 'destructive', 
                onPress: () => navigation.goBack() 
              },
            ],
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isUploading, isCompressing, isRecording, navigation]),
  );

  // Permission Requests (Following TipCallScreen pattern)
  const requestCameraAndMicPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[TipShortsUpload] Requesting Android camera and microphone permissions');
        
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('[TipShortsUpload] Android permission results:', grants);

        const cameraGranted = grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted = grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

        if (cameraGranted && audioGranted) {
          return true;
        } else if (grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.DENIED ||
                   grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Permissions Required',
            'Camera and microphone access are required to record videos. Please try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => requestCameraAndMicPermissions() },
            ],
          );
          return false;
        } else if (grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
                   grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permissions Blocked',
            'Camera and microphone permissions have been permanently denied. Please enable them from Settings.',
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
      console.error('[TipShortsUpload] Error requesting camera and microphone permissions:', error);
      Alert.alert('Permission Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[TipShortsUpload] Requesting Android storage permission');
        
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

        console.log('[TipShortsUpload] Android storage permission result:', result);

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
      console.error('[TipShortsUpload] Error requesting storage permission:', error);
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
      console.log('[TipShortsUpload] Extracting video duration for:', uri);
      setIsExtractingDuration(true);
      setHiddenVideoUri(uri);
    } catch (error) {
      console.error('Error getting video info:', error);
      setVideoDuration('00:00:30'); // Default fallback
    }
  };

  // Handle video duration extraction from hidden video component
  const handleDurationExtracted = (duration: string) => {
    console.log('[TipShortsUpload] Duration extracted:', duration);
    setVideoDuration(duration);
    setIsExtractingDuration(false);
    setHiddenVideoUri(null);
  };

  // Generate thumbnail from video (mock implementation)
  const generateThumbnailFromVideo = async (videoUri: string): Promise<string> => {
    try {
      // This is a mock implementation
      // In a real app, you'd use a library like react-native-video-processing
      // or react-native-ffmpeg to extract a frame from the video
      console.log('[TipShortsUpload] Generating thumbnail from video:', videoUri);
      
      // For now, return the video URI as thumbnail
      // Replace this with actual thumbnail generation
      return videoUri;
    } catch (error) {
      console.error('[TipShortsUpload] Error generating thumbnail:', error);
      throw error;
    }
  };

  // Record new video (updated implementation)
  const recordNewVideo = async () => {
    try {
      setError(null);
      
      // Request permissions first
      const hasPermissions = await requestCameraAndMicPermissions();
      if (!hasPermissions) {
        return;
      }

      console.log('[TipShortsUpload] Opening camera recording screen');
      
      // Register event listener for video recorded
      const videoRecordedListener = EventRegister.addEventListener('videoRecorded', (data: { videoUri: string }) => {
        console.log('[TipShortsUpload] Video recorded:', data.videoUri);
        setSelectedVideo(data.videoUri);
        setVideoPreview(data.videoUri);
        getVideoInfo(data.videoUri);
        
        // Auto-generate thumbnail from video
        generateThumbnailFromVideo(data.videoUri)
          .then(thumbnailUri => {
            setSelectedThumbnail(thumbnailUri);
          })
          .catch(thumbnailError => {
            console.warn('[TipShortsUpload] Failed to generate thumbnail:', thumbnailError);
          });
        
        // Remove listener
        EventRegister.removeEventListener(videoRecordedListener);
      });
      
      // Navigate to camera recording screen without function params
      navigation.navigate('CameraRecording', {
        maxDuration: 60,
        aspectRatio: '9:16',
      });

    } catch (error: any) {
      console.error('[TipShortsUpload] Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  // Pick video from gallery
  const pickVideoFromGallery = async () => {
    try {
      setError(null);
      
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[TipShortsUpload] Launching video picker');

      const result = await launchImageLibrary({
        mediaType: 'video' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1920,
        maxWidth: 1080,
        quality: 1,
        videoQuality: 'high',
      });

      console.log('[TipShortsUpload] Video picker result:', result);

      if (result.didCancel) {
        console.log('[TipShortsUpload] User cancelled video selection');
        return;
      }

      if (result.errorCode) {
        console.error('[TipShortsUpload] Video picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select video: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log('[TipShortsUpload] Selected video:', {
          uri: video.uri,
          fileSize: video.fileSize,
          duration: video.duration,
          type: video.type,
        });

        if (video.uri) {
          setSelectedVideo(video.uri);
          setVideoPreview(video.uri);
          await getVideoInfo(video.uri);
          
          // Auto-generate thumbnail from video
          try {
            const thumbnailUri = await generateThumbnailFromVideo(video.uri);
            setSelectedThumbnail(thumbnailUri);
          } catch (thumbnailError) {
            console.warn('[TipShortsUpload] Failed to generate thumbnail:', thumbnailError);
            // Thumbnail generation failed, but video selection succeeded
          }
        }
      } else {
        Alert.alert('Error', 'No video selected. Please try again.');
      }
    } catch (err: any) {
      console.error('[TipShortsUpload] Error picking video:', err);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  // Pick custom thumbnail
  const pickCustomThumbnail = async () => {
    try {
      setError(null);
      
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[TipShortsUpload] Launching thumbnail picker');

      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1080,
        maxWidth: 1080,
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('[TipShortsUpload] User cancelled thumbnail selection');
        return;
      }

      if (result.errorCode) {
        console.error('[TipShortsUpload] Thumbnail picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select thumbnail: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const thumbnail = result.assets[0];
        console.log('[TipShortsUpload] Selected custom thumbnail:', thumbnail.uri);

        if (thumbnail.uri) {
          setSelectedThumbnail(thumbnail.uri);
        }
      } else {
        Alert.alert('Error', 'No thumbnail selected. Please try again.');
      }
    } catch (error: any) {
      console.error('[TipShortsUpload] Error picking custom thumbnail:', error);
      Alert.alert('Error', 'Failed to select thumbnail. Please try again.');
    }
  };

  // Compress video with WhatsApp-like compression
  const compressVideo = async (videoUri: string): Promise<string> => {
    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      console.log('[TipShortsUpload] Starting video compression');

      const compressionOption = COMPRESSION_OPTIONS.find(opt => opt.key === selectedCompression)!;
      
      const compressionOptions: VideoCompressionOptions = {
        quality: 'low', // Always use low for shorts
        maxSize: compressionOption.maxSize,
        outputFormat: 'mp4',
        compressionMethod: 'manual',
        bitrate: compressionOption.bitrate,
      };

      // Simulate compression progress
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => {
          const newProgress = prev + 15;
          if (newProgress >= 85) {
            clearInterval(progressInterval);
          }
          return Math.min(newProgress, 85);
        });
      }, 300);

      const compressedResult = await VideoCompressionService.compressForTipShorts(
        videoUri,
        compressionOptions,
        (progress) => {
          console.log('[TipShortsUpload] Compression progress:', progress);
          setCompressionProgress(progress);
        }
      );

      clearInterval(progressInterval);
      setCompressionProgress(100);

      console.log('[TipShortsUpload] Video compression result:', {
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
        throw new Error(`Video compression failed: ${compressedResult.error || 'Unknown error'}`);
      }

      // Update video size after compression
      const stats = await RNFS.stat(compressedResult.compressedUri);
      console.log('[TipShortsUpload] Compressed video file stats:', {
        path: compressedResult.compressedUri,
        size: stats.size,
        exists: await RNFS.exists(compressedResult.compressedUri),
        expectedSize: compressedResult.compressedSize,
        sizesMatch: stats.size === compressedResult.compressedSize
      });

      setVideoSize(stats.size);

      return compressedResult.compressedUri;
    } catch (error) {
      console.error('[TipShortsUpload] Error compressing video:', error);
      console.warn('[TipShortsUpload] Compression failed, using original video for upload');

      // Fallback to original video if compression fails
      // This allows Stream upload to proceed even if compression has issues
      try {
        const stats = await RNFS.stat(videoUri);
        setVideoSize(stats.size);
        console.log('[TipShortsUpload] Using original video size:', stats.size);
        return videoUri; // Return original video URI
      } catch (statError) {
        console.error('[TipShortsUpload] Error getting original video stats:', statError);
        throw new Error('Failed to process video. Please try again.');
      }
    } finally {
      setIsCompressing(false);
    }
  };

  // Upload media files using Unified Upload Service (Stream or R2)
  const uploadMedia = async (videoUri: string, thumbnailUri: string): Promise<{ videoUrl: string; thumbnailUrl: string; streamVideoId?: string }> => {
    try {
      console.log('[TipShortsUpload] Starting unified upload (Stream/R2)');

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
          isShot: true, // This is TipShorts
        },
      };

      // Prepare user info for upload
      const userInfo = {
        userId: user.id.toString(),
        userName: user.name || user.username || '',
        channelId: user.id.toString(), // TipShorts typically use user ID as channel ID
      };

      console.log('[TipShortsUpload] User info for upload:', userInfo);

      // Use UnifiedUploadService for intelligent upload method selection
      const uploadResult = await UnifiedUploadService.uploadTipShorts(
        uploadData,
        userInfo,
        (progress: UnifiedUploadProgress) => {
          setUploadProgress(progress.percentage);

          // Show upload method in progress
          if (progress.method === 'stream') {
            console.log(`[TipShortsUpload] Stream upload: ${progress.stage} (${progress.percentage}%)`);
          } else {
            console.log(`[TipShortsUpload] R2 upload: ${progress.stage} (${progress.percentage}%)`);
          }
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      if (!uploadResult.videoUrl) {
        throw new Error('Upload completed but video URL is missing');
      }

      console.log('[TipShortsUpload] Upload successful:', {
        method: uploadResult.method,
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        streamVideoId: uploadResult.streamVideoId,
        fallbackUsed: uploadResult.fallbackUsed,
      });

      // Show success message with upload method info
      if (uploadResult.method === 'stream') {
        console.log('[TipShortsUpload] ✅ Uploaded using Cloudflare Stream (optimized for mobile)');
      } else {
        console.log('[TipShortsUpload] ✅ Uploaded using Cloudflare R2 (traditional method)');
      }

      return {
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: uploadResult.thumbnailUrl || thumbnailUri,
        streamVideoId: uploadResult.streamVideoId,
      };
    } catch (error) {
      console.error('[TipShortsUpload] Error uploading media:', error);
      throw new Error('Failed to upload media files to cloud storage. Please check your connection and try again.');
    }
  };

  // Create TipShot video
  const createTipShot = async (videoUrl: string, thumbnailUrl: string): Promise<void> => {
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

      console.log('[TipShortsUpload] Creating TipShot with new API:', requestData);

      const response = await ApiService.uploadTipShortsVideo(requestData);

      console.log('[TipShortsUpload] TipShot created:', response);

      if (response.status === 200) {
        // Show different success messages for paid vs free videos
        const successMessage = isPaidVideo
          ? `Your paid short video has been uploaded successfully! Price: ₹${promotionalPrice}`
          : 'Your short video has been uploaded successfully.';

        Alert.alert(
          'Success! 🎉',
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create short video');
      }
    } catch (error: any) {
      console.error('[TipShortsUpload] Error creating TipShot:', error);
      throw new Error(error.message || 'Failed to create short video. Please try again.');
    }
  };

  // Validation helper function
  const validateUploadData = (): string | null => {
    if (!selectedVideo) return 'Please select or record a video to upload.';
    if (!title.trim()) return 'Please enter a title for your short video.';
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

  // Check all required permissions before upload
  const checkAllPermissions = async (): Promise<boolean> => {
    try {
      console.log('[TipShortsUpload] Checking all required permissions before upload');

      // Check storage permission (required for video access)
      const hasStoragePermission = await requestStoragePermission();
      if (!hasStoragePermission) {
        Alert.alert(
          'Storage Permission Required',
          'Storage access is required to upload videos. Please grant permission and try again.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // If user wants to record new video, check camera/mic permissions
      // This is optional since they might only upload existing videos
      console.log('[TipShortsUpload] All required permissions granted');
      return true;
    } catch (error) {
      console.error('[TipShortsUpload] Error checking permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to check permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  // Handle paid video toggle
  const handlePaidVideoToggle = (value: boolean) => {
    if (value && !isContentCreatorPremium) {
      // Show premium required alert
      Alert.alert(
        'Content Creator Premium Required',
        'Paid video feature is only available for Content Creator Premium users. Upgrade to unlock this feature.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade',
            onPress: () => navigation.navigate('ContentCreatorPremium' as never),
          },
        ]
      );
      return;
    }

    setIsPaidVideo(value);
    if (!value) {
      setPromotionalPrice('');
    }
  };

  // Main upload function
  const handleUpload = async () => {
    try {
      // Step 0: Check all required permissions
      console.log('[TipShortsUpload] Step 0: Checking permissions');
      const hasPermissions = await checkAllPermissions();
      if (!hasPermissions) {
        return;
      }

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
      console.log('[TipShortsUpload] Step 1: Compressing video');
      const compressedVideoUri = await compressVideo(selectedVideo!); // Non-null assertion - validated above

      // Step 2: Upload media files
      console.log('[TipShortsUpload] Step 2: Uploading media files');
      const { videoUrl, thumbnailUrl, streamVideoId } = await uploadMedia(compressedVideoUri, selectedThumbnail!);

      // Step 3: Create TipShot record
      console.log('[TipShortsUpload] Step 3: Creating short video record');
      await createTipShot(videoUrl, thumbnailUrl);

      // Cleanup compressed file
      try {
        if (compressedVideoUri !== selectedVideo) {
          await RNFS.unlink(compressedVideoUri);
        }
      } catch (cleanupError) {
        console.warn('[TipShortsUpload] Failed to cleanup compressed file:', cleanupError);
      }

    } catch (error: any) {
      console.error('[TipShortsUpload] Upload failed:', error);

      // Enhanced error handling with specific messages
      let errorTitle = 'Upload Failed';
      let errorMessage = 'Something went wrong. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('Video title is required')) {
        errorTitle = 'Validation Error';
        errorMessage = 'Please enter a title for your short video.';
      } else if (error.message?.includes('Video category is required')) {
        errorTitle = 'Category Required';
        errorMessage = 'Please select a video category.';
      } else if (error.message?.includes('Channel ID is required')) {
        errorTitle = 'Channel Required';
        errorMessage = 'Please select a channel for your video.';
      } else if (error.message?.includes('User authentication required')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('Upload failed')) {
        errorTitle = 'Upload Error';
        errorMessage = 'Failed to upload short video. Please check your internet connection and try again.';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Create Short" 
        showBackButton 
        onBackPress={() => {
          if (isUploading || isCompressing || isRecording) {
            Alert.alert(
              isRecording ? 'Recording in Progress' : 'Upload in Progress',
              isRecording 
                ? 'Are you sure you want to stop recording?' 
                : 'Are you sure you want to cancel the upload?',
              [
                { text: isRecording ? 'Continue Recording' : 'Continue Upload', style: 'cancel' },
                { 
                  text: isRecording ? 'Stop Recording' : 'Cancel Upload', 
                  style: 'destructive', 
                  onPress: () => navigation.goBack() 
                },
              ],
            );
          } else {
            navigation.goBack();
          }
        }}
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
          {/* Video Selection/Recording */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Video
            </Text>
            
            {selectedVideo ? (
              <View style={[styles.videoPreviewContainer, { borderColor: colors.border }]}>
                <View style={[styles.videoPreview, { backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA' }]}>
                  <Icon name="play-circle" size={50} color={colors.primary} />
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
                <View style={styles.videoActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={pickVideoFromGallery}
                    disabled={isUploading || isCompressing}
                  >
                    <Icon name="edit-2" size={16} color={colors.white} />
                    <Text style={[styles.actionButtonText, { color: colors.white }]}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.videoSelectionContainer}>
                <TouchableOpacity
                  style={[styles.recordButton, { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary 
                  }]}
                  onPress={recordNewVideo}
                  disabled={isUploading || isCompressing}
                >
                  <Icon name="video" size={32} color={colors.white} />
                  <Text style={[styles.recordButtonText, { color: colors.white }]}>
                    Record New
                  </Text>
                  <Text style={[styles.recordButtonSubtext, { color: colors.white }]}>
                    Tap to start recording
                  </Text>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.border }]}>
                  <Text style={[styles.dividerText, { 
                    color: colors.text.tertiary,
                    backgroundColor: colors.background 
                  }]}>
                    OR
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.galleryButton, { 
                    borderColor: colors.border,
                    backgroundColor: isDarkMode ? colors.card : '#F8F9FA'
                  }]}
                  onPress={pickVideoFromGallery}
                  disabled={isUploading || isCompressing}
                >
                  <Icon name="folder" size={32} color={colors.text.secondary} />
                  <Text style={[styles.galleryButtonText, { color: colors.text.primary }]}>
                    Choose from Gallery
                  </Text>
                  <Text style={[styles.galleryButtonSubtext, { color: colors.text.secondary }]}>
                    Select existing video
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Thumbnail Selection */}
          {selectedVideo && (
            <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Thumbnail
              </Text>
              
              {selectedThumbnail ? (
                <View style={[styles.thumbnailPreviewContainer, { borderColor: colors.border }]}>
                  <Image source={{ uri: selectedThumbnail }} style={styles.thumbnailPreview} />
                  <TouchableOpacity 
                    style={[styles.changeThumbnailButton, { backgroundColor: colors.primary }]}
                    onPress={pickCustomThumbnail}
                    disabled={isUploading || isCompressing}
                  >
                    <Icon name="edit-2" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.thumbnailButton, { 
                    borderColor: colors.border,
                    backgroundColor: isDarkMode ? colors.card : '#F8F9FA'
                  }]}
                  onPress={pickCustomThumbnail}
                  disabled={isUploading || isCompressing}
                >
                  <Icon name="image" size={24} color={colors.primary} />
                  <Text style={[styles.thumbnailButtonText, { color: colors.text.primary }]}>
                    Select Thumbnail
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Video Details */}
          {selectedVideo && (
            <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Details
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
                  placeholder="What's your short about?"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={60}
                  editable={!isUploading && !isCompressing}
                />
                <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
                  {title.length}/60
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
                  placeholder="Tell viewers about your video..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                  editable={!isUploading && !isCompressing}
                />
                <Text style={[styles.characterCount, { color: colors.text.tertiary }]}>
                  {description.length}/200
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
                  {SHORT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: categoryId === category.id 
                            ? category.color 
                            : isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                          borderColor: categoryId === category.id 
                            ? category.color 
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

              {/* Compression Quality */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Compression Quality
                </Text>
                <TouchableOpacity
                  style={[styles.compressionSelector, { 
                    backgroundColor: isDarkMode ? colors.gray?.[800] : '#F8F9FA',
                    borderColor: colors.border 
                  }]}
                  onPress={() => setShowCompressionModal(true)}
                  disabled={isUploading || isCompressing}
                >
                  <View style={styles.compressionSelectorInfo}>
                    <Text style={[styles.compressionText, { color: colors.text.primary }]}>
                      {COMPRESSION_OPTIONS.find(opt => opt.key === selectedCompression)?.label}
                    </Text>
                    <Text style={[styles.compressionDescription, { color: colors.text.tertiary }]}>
                      {COMPRESSION_OPTIONS.find(opt => opt.key === selectedCompression)?.description}
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
                      Enable to set a promotional price{'\n'}(Content Creator Premium required)
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
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }]}>
                      <Text style={[styles.currencySymbol, { color: colors.text.primary }]}>₹</Text>
                      <TextInput
                        style={[styles.priceInput, { color: colors.text.primary }]}
                        value={promotionalPrice}
                        onChangeText={setPromotionalPrice}
                        placeholder="0.00"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="numeric"
                        maxLength={6}
                        editable={!isUploading && !isCompressing}
                      />
                    </View>
                    <Text style={[styles.priceHint, { color: colors.text.tertiary }]}>
                      Maximum price: ₹1000
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Progress Section */}
          {(isCompressing || isUploading) && (
            <View style={[styles.section, { backgroundColor: isDarkMode ? colors.card : colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                {isCompressing ? 'Compressing Video' : 'Uploading Short'}
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
                  Optimizing your short for the best viewing experience...
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
        {selectedVideo && (
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
                {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : isLoadingChannel ? 'Loading Channel...' : 'Share Short'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Compression Quality Modal */}
      {showCompressionModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.compressionModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Select Compression Quality
            </Text>
            
            {COMPRESSION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.compressionOption,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => {
                  setSelectedCompression(option.key as 'whatsapp' | 'balanced' | 'high');
                  setShowCompressionModal(false);
                }}
              >
                <View style={styles.compressionOptionContent}>
                  <Text style={[styles.compressionOptionLabel, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.compressionOptionDescription, { color: colors.text.secondary }]}>
                    {option.description}
                  </Text>
                  <Text style={[styles.compressionOptionSize, { color: colors.text.tertiary }]}>
                    Max size: {option.maxSize}MB • Bitrate: {(option.bitrate / 1000).toFixed(0)}k
                  </Text>
                </View>
                {selectedCompression === option.key && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.gray?.[200] }]}
              onPress={() => setShowCompressionModal(false)}
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
  
  // Video Selection Styles
  videoSelectionContainer: {
    gap: 16,
  },
  recordButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  recordButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  galleryButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  galleryButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  
  // Video Preview Styles
  videoPreviewContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoInfo: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  compressionInfo: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  videoActions: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Thumbnail Styles
  thumbnailPreviewContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 9/16,
    maxHeight: 200,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeThumbnailButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Compression Selector
  compressionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  compressionSelectorInfo: {
    flex: 1,
  },
  compressionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  compressionDescription: {
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
  compressionModal: {
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
  compressionOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compressionOptionContent: {
    flex: 1,
  },
  compressionOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  compressionOptionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  compressionOptionSize: {
    fontSize: 11,
    marginTop: 4,
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

  // Price Input Styles
  priceInputContainer: {
    marginTop: 16,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  priceHint: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default TipShortsUploadScreen;