import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  Linking,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/common/Header';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import ApiService from '../../services/ApiService';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import { useLocationSearch } from '../../hooks/useQueries';
import DateTimePicker from '@react-native-community/datetimepicker';
import CloudflareUploadService from '../../services/CloudflareUploadService';
import Video from 'react-native-video';
import { createThumbnail } from 'react-native-create-thumbnail';

// Define interfaces
interface PostData {
  title: string;
  content: string;
  images: any[];
  selectedCategory: any;
}

interface RouteParams {
  postData?: PostData;
}

interface PlaceSearchResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

// Define category options
const categories = [
  { id: 1, name: 'General' },
  { id: 2, name: 'Technology' },
  { id: 3, name: 'Sports' },
  { id: 4, name: 'Entertainment' },
  { id: 5, name: 'Business' },
  { id: 6, name: 'Education' },
  { id: 7, name: 'Health' },
  { id: 8, name: 'Travel' },
];

// Define gender options
const genderOptions = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 0, label: 'All Genders' },
];

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 120; // Account for labels and padding

const CreateCampaignScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { colors, isDarkMode } = useTheme();
  
  // Get post data from navigation params
  const postData = route.params?.postData;
  
  // Add a try/catch block to handle missing context
  let contentPaddingBottom = 0;
  try {
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    contentPaddingBottom = 80;
  }

  // Campaign state - matching API fields
  const [userId, setUserId] = useState<string>('');
  const [title, setTitle] = useState(postData?.title || '');
  const [content, setContent] = useState(postData?.content || '');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedMediaUri, setSelectedMediaUri] = useState<string>('');
  const [isPromoted] = useState(true); // Always true for campaigns
  const [videoCategoryId, setVideoCategoryId] = useState(postData?.selectedCategory?.id || 1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [targetMinAge, setTargetMinAge] = useState(18);
  const [targetMaxAge, setTargetMaxAge] = useState(65);
  const [payPerView, setPayPerView] = useState(2.0); // 0.5 to 5 INR range
  const [reachGoal, setReachGoal] = useState(10000);
  const [durationDays, setDurationDays] = useState(7);
  const [totalPay, setTotalPay] = useState(0); // Will be calculated
  const [platformFee, setPlatformFee] = useState(0); // Will be calculated
  const [postTargetLocations, setPostTargetLocations] = useState<string[]>([]);
  const [postTargetGenders, setPostTargetGenders] = useState<number[]>([1, 2]); // Default to all genders

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Use TanStack Query for location search with debouncing
  const {
    data: locationSearchResults = [],
    isLoading: isLocationSearching,
    error: locationSearchError
  } = useLocationSearch(debouncedLocationQuery);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());

  // Add state for video thumbnail
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');

  // Slider state
  const [isDraggingDuration, setIsDraggingDuration] = useState(false);
  const [isDraggingMinAge, setIsDraggingMinAge] = useState(false);
  const [isDraggingMaxAge, setIsDraggingMaxAge] = useState(false);
  const [isDraggingPayPerView, setIsDraggingPayPerView] = useState(false);

  // Create pan responders for sliders
  const durationPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingDuration(true);
    },
    onPanResponderMove: (_event, gestureState) => {
      const { dx } = gestureState;
      const newDuration = Math.max(1, Math.min(30, Math.round((dx / SLIDER_WIDTH) * 30) + durationDays));
      setDurationDays(newDuration);
    },
    onPanResponderRelease: () => {
      setIsDraggingDuration(false);
    },
  });

  const minAgePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingMinAge(true);
    },
    onPanResponderMove: (_event, gestureState) => {
      const { dx } = gestureState;
      const newMinAge = Math.max(18, Math.min(targetMaxAge - 1, Math.round((dx / SLIDER_WIDTH) * 62) + targetMinAge));
      setTargetMinAge(newMinAge);
    },
    onPanResponderRelease: () => {
      setIsDraggingMinAge(false);
    },
  });

  const maxAgePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingMaxAge(true);
    },
    onPanResponderMove: (_event, gestureState) => {
      const { dx } = gestureState;
      const newMaxAge = Math.max(targetMinAge + 1, Math.min(80, Math.round((dx / SLIDER_WIDTH) * 62) + targetMaxAge));
      setTargetMaxAge(newMaxAge);
    },
    onPanResponderRelease: () => {
      setIsDraggingMaxAge(false);
    },
  });

  const payPerViewPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDraggingPayPerView(true);
    },
    onPanResponderMove: (_event, gestureState) => {
      const { dx } = gestureState;
      const newPayPerView = Math.max(0.5, Math.min(5, ((dx / SLIDER_WIDTH) * 4.5) + payPerView));
      setPayPerView(Math.round(newPayPerView * 10) / 10); // Round to 1 decimal place
    },
    onPanResponderRelease: () => {
      setIsDraggingPayPerView(false);
    },
  });



  // Add location from search results
  const addLocationFromSearch = (place: PlaceSearchResult) => {
    const locationName = place.structured_formatting.main_text;
    if (!postTargetLocations.includes(locationName)) {
      setPostTargetLocations([...postTargetLocations, locationName]);
    }
    setLocationSearchQuery('');
    setDebouncedLocationQuery('');
    setShowLocationModal(false);
  };

  // Remove location from selected list
  const removeLocation = (location: string) => {
    setPostTargetLocations(postTargetLocations.filter(loc => loc !== location));
  };

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

    // Set media from post data if available
    if (postData?.images && postData.images.length > 0) {
      setSelectedMediaUri(postData.images[0].uri);
      setMediaType('image');
    }
  }, []);

  // Calculate budget when pay per view, reach goal, or duration changes
  useEffect(() => {
    const baseBudget = payPerView * reachGoal * durationDays; // Include duration days
    const calculatedPlatformFee = baseBudget * 0.10; // 10% platform fee
    const calculatedTotalPay = baseBudget + calculatedPlatformFee;
    
    setPlatformFee(calculatedPlatformFee);
    setTotalPay(calculatedTotalPay);
  }, [payPerView, reachGoal, durationDays]);

  // Update end date when duration changes
  useEffect(() => {
    const newEndDate = new Date(new Date(startDate).getTime() + durationDays * 24 * 60 * 60 * 1000);
    setEndDate(newEndDate.toISOString().split('T')[0]);
  }, [startDate, durationDays]);

  // Debounce location search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedLocationQuery(locationSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearchQuery]);

  // Handle location search errors (now with fallback data, errors are less critical)
  useEffect(() => {
    if (locationSearchError) {
      console.warn('Location search API error (using fallback data):', locationSearchError);

      // Only show error for critical issues, since we have fallback data
      if (locationSearchError.message?.includes('OVER_QUERY_LIMIT')) {
        // Show a subtle warning for quota issues
        console.warn('Google Places API quota exceeded, using fallback location data');
      } else if (locationSearchError.message?.includes('REQUEST_DENIED')) {
        // Show warning for API key issues
        console.warn('Google Places API access denied, using fallback location data');
      }
      // For other errors (timeout, network), silently use fallback data
    }
  }, [locationSearchError]);

  // Permission helper (from TipTubeUploadScreen)
  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        console.log('[CreateCampaign] Requesting Android storage permission');
        
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to select media files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Blocked',
            'Storage permission has been permanently denied. Please enable it from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('[CreateCampaign] Error requesting storage permission:', error);
      return false;
    }
  };

  // Determine media type from file extension
  const getMediaTypeFromUri = (uri: string): 'image' | 'video' => {
    const extension = uri.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    
    if (extension && videoExtensions.includes(extension)) {
      return 'video';
    } else if (extension && imageExtensions.includes(extension)) {
      return 'image';
    }
    
    // Default fallback
    return 'image';
  };

  // Pick media from gallery
  const pickMedia = async () => {
    try {
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      console.log('[CreateCampaign] Launching media picker');

      const result = await launchImageLibrary({
        mediaType: 'mixed' as MediaType,
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 1920,
        maxWidth: 1920,
        quality: 0.8,
      });

      console.log('[CreateCampaign] Media picker result:', result);

      if (result.didCancel) {
        console.log('[CreateCampaign] User cancelled media selection');
        return;
      }

      if (result.errorCode) {
        console.error('[CreateCampaign] Media picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', `Failed to select media: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const media = result.assets[0];
        console.log('[CreateCampaign] Selected media:', {
          uri: media.uri,
          type: media.type,
          fileSize: media.fileSize,
        });

        if (media.uri) {
          setSelectedMediaUri(media.uri);
          
          // Auto-detect media type based on URI or mime type
          let detectedType: 'image' | 'video' = 'image';
          
          if (media.type?.startsWith('video/')) {
            detectedType = 'video';
          } else if (media.type?.startsWith('image/')) {
            detectedType = 'image';
          } else {
            // Fallback to URI extension detection
            detectedType = getMediaTypeFromUri(media.uri);
          }
          
          setMediaType(detectedType);
          
          // Generate thumbnail for video
          if (detectedType === 'video') {
            try {
              console.log('[CreateCampaign] Generating video thumbnail for:', media.uri);
              
              const thumbnail = await createThumbnail({
                url: media.uri,
                timeStamp: 1000, // First frame at 1 second
                format: 'jpeg',
              });
              
              if (thumbnail && thumbnail.path) {
                setVideoThumbnail(thumbnail.path);
                console.log('[CreateCampaign] Video thumbnail generated:', thumbnail.path);
              } else {
                console.warn('[CreateCampaign] Thumbnail generation returned null or invalid result');
                setVideoThumbnail('');
              }
            } catch (error) {
              console.error('[CreateCampaign] Error generating video thumbnail:', error);
              setVideoThumbnail('');
              // Don't show alert here, just log the error as thumbnail is optional
            }
          } else {
            setVideoThumbnail(''); // Clear thumbnail for images
          }
          
          console.log('[CreateCampaign] Detected media type:', detectedType);
        }
      } else {
        Alert.alert('Error', 'No media selected. Please try again.');
      }
    } catch (err: any) {
      console.error('[CreateCampaign] Error picking media:', err);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  // Upload media using CloudflareUploadService
  const uploadMedia = async (mediaUri: string): Promise<string> => {
    try {
      console.log('[CreateCampaign] Starting Cloudflare upload for:', mediaUri);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const folder = mediaType === 'video' ? 'videos' : 'images';
      const fileName = `campaign_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;

      const uploadResult = await CloudflareUploadService.uploadFile(
        mediaUri,
        folder,
        fileName,
        parseInt(userId),
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('[CreateCampaign] Cloudflare upload successful:', uploadResult.url);
      return uploadResult.url;
    } catch (error) {
      console.error('[CreateCampaign] Error uploading media:', error);
      throw new Error('Failed to upload media file. Please check your connection and try again.');
    }
  };

  const handleCategorySelect = (category: typeof categories[0]) => {
    setVideoCategoryId(category.id);
    setCategoryDropdownVisible(false);
  };





  const toggleGender = (genderId: number) => {
    if (genderId === 0) { // All genders
      setPostTargetGenders([1, 2]);
    } else {
      if (postTargetGenders.includes(genderId)) {
        // Remove gender if already selected (but don't allow empty selection)
        if (postTargetGenders.length > 1) {
          setPostTargetGenders(postTargetGenders.filter(id => id !== genderId));
        }
      } else {
        setPostTargetGenders([...postTargetGenders, genderId]);
      }
    }
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(c => c.id === videoCategoryId);
    return category?.name || 'Select Category';
  };

  const handleLaunchCampaign = async () => {
    // Validate form
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a campaign title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter campaign content');
      return;
    }

    if (!selectedMediaUri) {
      Alert.alert('Error', 'Please select a media file for your campaign');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    if (postTargetLocations.length === 0) {
      Alert.alert('Error', 'Please select at least one target location');
      return;
    }

    if (postTargetGenders.length === 0) {
      Alert.alert('Error', 'Please select target genders');
      return;
    }

    if (payPerView < 0.5 || payPerView > 5) {
      Alert.alert('Error', 'Pay per view must be between ₹0.5 and ₹5.0');
      return;
    }

    if (reachGoal < 100) {
      Alert.alert('Error', 'Reach goal must be at least 100 people');
      return;
    }

    if (totalPay <= 0) {
      Alert.alert('Error', 'Total budget must be greater than ₹0');
      return;
    }

    try {
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      console.log('[CreateCampaign] Step 1: Uploading media file');
      const uploadedMediaUrl = await uploadMedia(selectedMediaUri);
      setMediaUrl(uploadedMediaUrl);

      console.log('[CreateCampaign] Step 2: Creating campaign');
      // Prepare post data according to API format
      const campaignData = {
        user_id: parseInt(userId),
        title: title.trim(),
        content: content.trim(),
        media_url: uploadedMediaUrl,
        media_type: mediaType,
        is_promoted: isPromoted,
        video_category_id: videoCategoryId,
        start_date: startDate,
        end_date: endDate,
        target_min_age: targetMinAge,
        target_max_age: targetMaxAge,
        pay_per_view: payPerView,
        reach_goal: reachGoal,
        duration_days: durationDays,
        total_pay: totalPay,
        platform_fee: platformFee,
        post_target_locations: postTargetLocations,
        post_target_genders: postTargetGenders,
      };

      console.log('Creating campaign with data:', campaignData);

      // Create campaign using API
      const response = await ApiService.post('/api/post', campaignData);

      console.log('Campaign creation response:', response);

      if (response.status && response.statusCode === 201) {
        // Show success message
        Alert.alert(
          'Success',
          'Your promoted campaign has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create campaign');
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create your campaign. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };



  const handlePreviewAd = () => {
    Alert.alert(
      'Campaign Preview', 
      `Title: ${title}\nContent: ${content}\nMedia: ${mediaType}\nPay Per View: ₹${payPerView}\nReach Goal: ${reachGoal.toLocaleString()} people\nTotal Budget: ₹${totalPay.toFixed(2)}\nDuration: ${durationDays} days`
    );
  };

  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setStartDate(formattedDate);
      }
    } else {
      // iOS handling
      if (selectedDate) {
        setTempStartDate(selectedDate);
      }
    }
  };

  const showDatePickerModal = () => {
    if (Platform.OS === 'ios') {
      // For iOS, show Alert with date picker
      setTempStartDate(new Date(startDate));
      setShowDatePicker(true);
    } else {
      // For Android, show native date picker
      setShowDatePicker(true);
    }
  };

  const confirmDateSelection = () => {
    const formattedDate = tempStartDate.toISOString().split('T')[0];
    setStartDate(formattedDate);
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setShowDatePicker(false);
    setTempStartDate(new Date(startDate)); // Reset to original date
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Create Campaign"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom + 20 }}
      >
        {/* Campaign Details Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="edit-3" size={20} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Campaign Details</Text>
          </View>
          
          {/* Media Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Campaign Media</Text>
          {selectedMediaUri ? (
            <View style={[styles.mediaPreview, { borderColor: colors.border }]}>
              {mediaType === 'image' ? (
                <Image source={{ uri: selectedMediaUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.videoPreviewContainer}>
                  {videoThumbnail ? (
                    <Image source={{ uri: videoThumbnail }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.videoPreview}>
                      <Icon name="play-circle" size={40} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.playIconOverlay}>
                    <Icon name="play-circle" size={24} color={colors.white} />
                  </View>
                </View>
              )}
              <TouchableOpacity 
                style={[styles.changeButton, { backgroundColor: colors.primary }]}
                onPress={pickMedia}
                disabled={isLoading}
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
              onPress={pickMedia}
              disabled={isLoading}
            >
              <Icon name="image" size={32} color={colors.primary} />
              <Text style={[styles.uploadButtonText, { color: colors.text.primary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Select Media
              </Text>
              <Text style={[styles.uploadButtonSubtext, { color: colors.text.secondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Choose image or video
              </Text>
            </TouchableOpacity>
          )}

          {/* Campaign Title */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Campaign Title</Text>
          <View style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter campaign title"
              placeholderTextColor={colors.text.tertiary}
              editable={!isLoading}
              maxLength={100}
            />
          </View>

          {/* Campaign Content */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Campaign Description</Text>
          <View style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB', minHeight: 100 }]}>
            <TextInput
              style={[styles.input, { color: colors.text.primary, textAlignVertical: 'top' }]}
              value={content}
              onChangeText={setContent}
              placeholder="Describe your campaign..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              editable={!isLoading}
              maxLength={500}
            />
          </View>

          {/* Category Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Category</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              { borderColor: isDarkMode ? colors.border : '#E5E7EB' },
              categoryDropdownVisible && styles.dropdownActive
            ]}
            onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
            disabled={isLoading}
          >
            <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
              {getSelectedCategoryName()}
            </Text>
            <Icon 
              name={categoryDropdownVisible ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text.tertiary} 
            />
          </TouchableOpacity>
          
          {categoryDropdownVisible && (
            <View style={[styles.dropdownMenu, { borderColor: isDarkMode ? colors.border : '#E5E7EB', backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.dropdownItem}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
                    {category.name}
                  </Text>
                  {videoCategoryId === category.id && (
                    <Icon name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Campaign Schedule Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar" size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Campaign Schedule</Text>
          </View>
          
          {/* Start Date */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Start Date</Text>
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}
            onPress={showDatePickerModal}
            disabled={isLoading}
          >
            <View style={styles.dateInputContent}>
              <Text style={[styles.dateText, { color: colors.text.primary }]}>
                {startDate}
              </Text>
              <Icon name="calendar" size={20} color={colors.text.tertiary} />
            </View>
          </TouchableOpacity>

          {/* Date Picker Modal for iOS */}
          {Platform.OS === 'ios' && showDatePicker && (
            <Modal
              transparent={true}
              animationType="fade"
              visible={showDatePicker}
              onRequestClose={cancelDateSelection}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.datePickerModal, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                  <View style={[styles.datePickerHeader, { borderBottomColor: isDarkMode ? colors.border : '#E5E7EB' }]}>
                    <Text style={[styles.datePickerTitle, { color: colors.text.primary }]}>
                      Select Start Date
                    </Text>
                  </View>
                  
                  <DateTimePicker
                    value={tempStartDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={styles.datePicker}
                    textColor={colors.text.primary}
                  />
                  
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity
                      style={[styles.datePickerButton, styles.cancelButton, { borderColor: colors.border }]}
                      onPress={cancelDateSelection}
                    >
                      <Text style={[styles.datePickerButtonText, { color: colors.text.secondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.datePickerButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                      onPress={confirmDateSelection}
                    >
                      <Text style={[styles.datePickerButtonText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>
                        OK
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Android Date Picker */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={new Date(startDate)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Duration Days - Proper Slider */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Duration: {durationDays} days</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>1 day</Text>
            <View style={styles.sliderWrapper}>
              <View style={[styles.sliderTrack, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    width: `${(durationDays / 30) * 100}%`,
                    backgroundColor: colors.primary
                  }
                ]} 
              />
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${(durationDays / 30) * 100}%`,
                    backgroundColor: '#FFFFFF',
                    borderColor: colors.primary,
                    transform: [{ translateX: -10 }]
                  }
                ]}
                {...durationPanResponder.panHandlers}
              />
            </View>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>30 days</Text>
          </View>

          {/* End Date (Read-only) */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>End Date (Calculated)</Text>
          <View style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB', backgroundColor: isDarkMode ? colors.gray[800] : '#F9FAFB' }]}>
            <TextInput
              style={[styles.input, { color: colors.text.secondary }]}
              value={endDate}
              editable={false}
            />
          </View>
        </View>

        {/* Audience Targeting Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="users" size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Audience Targeting</Text>
          </View>
          
          {/* Age Range - Proper Dual Slider */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
            Age Range: {targetMinAge} - {targetMaxAge} years
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>18 years</Text>
            <View style={styles.sliderWrapper}>
              <View style={[styles.sliderTrack, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    left: `${((targetMinAge - 18) / 62) * 100}%`, 
                    width: `${((targetMaxAge - targetMinAge) / 62) * 100}%`,
                    backgroundColor: colors.primary
                  }
                ]} 
              />
              {/* Min Age Thumb */}
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${((targetMinAge - 18) / 62) * 100}%`,
                    backgroundColor: '#FFFFFF',
                    borderColor: colors.primary,
                    transform: [{ translateX: -10 }],
                    elevation: isDraggingMinAge ? 8 : 4,
                    shadowOpacity: isDraggingMinAge ? 0.3 : 0.1,
                  }
                ]}
                {...minAgePanResponder.panHandlers}
              />
              {/* Max Age Thumb */}
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${((targetMaxAge - 18) / 62) * 100}%`,
                    backgroundColor: '#FFFFFF',
                    borderColor: colors.primary,
                    transform: [{ translateX: -10 }],
                    elevation: isDraggingMaxAge ? 8 : 4,
                    shadowOpacity: isDraggingMaxAge ? 0.3 : 0.1,
                  }
                ]}
                {...maxAgePanResponder.panHandlers}
              />
            </View>
            <Text style={[styles.sliderLabel, { color: colors.text.tertiary }]}>80 years</Text>
          </View>

          {/* Target Genders */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Target Genders</Text>
          <View style={styles.checkboxGroup}>
            {genderOptions.map(gender => (
              <TouchableOpacity
                key={gender.id}
                style={styles.checkboxOption}
                onPress={() => toggleGender(gender.id)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: isDarkMode ? colors.border : '#D1D5DB' },
                  (gender.id === 3 ? postTargetGenders.length === 2 : postTargetGenders.includes(gender.id)) && [
                    styles.checkboxSelected, 
                    { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]
                ]}>
                  {(gender.id === 3 ? postTargetGenders.length === 2 : postTargetGenders.includes(gender.id)) && (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: colors.text.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {gender.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location targeting section */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Target Locations
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Select locations where your campaign will be shown
            </Text>
            
            <TouchableOpacity 
              style={[styles.addLocationButton, { borderColor: colors.border }]}
              onPress={() => setShowLocationModal(true)}
            >
              <Icon name="map-pin" size={20} color={colors.primary} />
              <Text style={[styles.addLocationText, { color: colors.primary }]}>
                Add Location
              </Text>
            </TouchableOpacity>
            
            {postTargetLocations.length > 0 && (
              <View style={styles.selectedLocationsContainer}>
                {postTargetLocations.map((location, index) => (
                  <View key={`location-${index}`} style={[styles.locationChip, { backgroundColor: colors.card }]}>
                    <Text style={[styles.locationChipText, { color: colors.text.primary }]}>
                      {location}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeLocation(location)}
                      testID="remove-location"
                    >
                      <Icon name="x" size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Location Selection Modal */}
          <Modal
            visible={showLocationModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowLocationModal(false)}
          >
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Locations</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Icon name="x" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <View style={[styles.searchInputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}
                  pointerEvents={isLoading ? 'none' : 'auto'}
                >
                  <Icon name="search" size={20} color={colors.text.tertiary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text.primary }]}
                    placeholder="Search for cities, states, countries..."
                    placeholderTextColor={colors.text.tertiary}
                    value={locationSearchQuery}
                    onChangeText={setLocationSearchQuery}
                    autoFocus
                  />
                  {isLocationSearching && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>
              </View>

              <FlatList
                data={locationSearchResults}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchResultItem, { borderBottomColor: isDarkMode ? colors.border : '#E5E7EB' }]}
                    onPress={() => addLocationFromSearch(item)}
                  >
                    <Icon name="map-pin" size={16} color={colors.text.tertiary} />
                    <View style={styles.searchResultText}>
                      <Text style={[styles.searchResultMain, { color: colors.text.primary }]}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={[styles.searchResultSecondary, { color: colors.text.secondary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  isLocationSearching ? (
                    <View style={styles.emptySearchResults}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Searching locations...</Text>
                    </View>
                  ) : locationSearchQuery.length > 0 && debouncedLocationQuery.length >= 3 ? (
                    <View style={styles.emptySearchResults}>
                      <Icon name="map-pin" size={24} color={colors.text.tertiary} />
                      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>No locations found</Text>
                      <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 4 }}>
                        Try searching for a city, state, or country
                      </Text>
                      {locationSearchError && (
                        <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                          Using offline location data
                        </Text>
                      )}
                    </View>
                  ) : locationSearchQuery.length < 3 ? (
                    <View style={styles.emptySearchResults}>
                      <Icon name="search" size={24} color={colors.text.tertiary} />
                      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Type at least 3 characters to search</Text>
                      <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 4 }}>
                        Search for cities, states, or countries
                      </Text>
                    </View>
                  ) : null
                }
              />
            </View>
          </Modal>
        </View>

        {/* Budget Configuration Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="dollar-sign" size={20} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget Configuration</Text>
          </View>
          
          {/* Pay Per View */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Pay Per View: ₹{payPerView.toFixed(1)}</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>₹0.5</Text>
            <View style={styles.sliderWrapper}>
              <View style={[styles.sliderTrack, { backgroundColor: isDarkMode ? colors.gray[700] : '#E5E7EB' }]} />
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${((payPerView - 0.5) / 4.5) * 100}%`
                  }
                ]} 
              />
              <View 
                style={[
                  styles.sliderThumb,
                  { 
                    left: `${((payPerView - 0.5) / 4.5) * 100}%`,
                    marginLeft: -10,
                    borderColor: colors.primary,
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF'
                  }
                ]}
                {...payPerViewPanResponder.panHandlers}
              />
            </View>
            <Text style={styles.sliderLabel}>₹5.0</Text>
          </View>

          {/* Reach Goal */}
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Reach Goal (People)</Text>
          <View style={[styles.inputContainer, { borderColor: isDarkMode ? colors.border : '#E5E7EB' }]}>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={reachGoal.toString()}
              onChangeText={(text) => {
                const numericValue = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                setReachGoal(numericValue);
              }}
              placeholder="Enter target reach"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Budget Breakdown */}
          <View style={[styles.budgetBreakdown, { backgroundColor: isDarkMode ? colors.gray[800] : '#F9FAFB' }]}>
            <Text style={[styles.fieldLabel, { color: colors.text.secondary, marginBottom: 12 }]}>Budget Breakdown</Text>
            
            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary }]}>
                Pay Per View × Reach Goal × Days
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.primary }]}>
                ₹{(payPerView * reachGoal * durationDays).toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary }]}>
                Platform Fee (10%)
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.primary }]}>
                ₹{platformFee.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.budgetBreakdownRow, { borderTopWidth: 1, borderTopColor: isDarkMode ? colors.border : '#E5E7EB', paddingTop: 8, marginTop: 8 }]}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.primary, fontWeight: '600' }]}>
                Total Budget
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.primary, fontWeight: '700', fontSize: 16 }]}>
                ₹{totalPay.toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetBreakdownRow}>
              <Text style={[styles.budgetBreakdownLabel, { color: colors.text.secondary, fontSize: 12 }]}>
                Daily Average
              </Text>
              <Text style={[styles.budgetBreakdownValue, { color: colors.text.secondary, fontSize: 12 }]}>
                ₹{(totalPay / durationDays).toFixed(2)}/day
              </Text>
            </View>
          </View>
        </View>

        {/* Comprehensive Campaign Summary & Actions */}
        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Campaign Summary</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Title:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]} numberOfLines={1} ellipsizeMode="tail">
                {title || 'Not set'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Media Type:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Duration:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {durationDays} days
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Pay Per View:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                ₹{payPerView.toFixed(1)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Reach Goal:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {reachGoal.toLocaleString()} people
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Target Age:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {targetMinAge}-{targetMaxAge} years
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Target Genders:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {postTargetGenders.join(', ')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Target Locations:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.text.primary }]}>
                {postTargetLocations.length > 0 ? `${postTargetLocations.length} selected` : 'None'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemLabel, { color: colors.text.secondary }]}>Total Budget:</Text>
              <Text style={[styles.summaryItemValue, { color: colors.primary, fontWeight: '600' }]}>
                ₹{totalPay.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[styles.launchButton, { backgroundColor: colors.primary }]}
              onPress={handleLaunchCampaign}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.launchButtonText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>
                  Launch Campaign
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handlePreviewAd}
              disabled={isLoading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                Preview Ad
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Progress Section */}
        {isUploading && (
          <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Uploading Media
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.gray?.[200] }]}>
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
              <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {uploadProgress}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dropdownActive: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownMenu: {
    position: 'relative',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  
  // Media Upload Styles (from TipTubeUploadScreen)
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoPreviewContainer: {
    position: 'relative',
  },
  videoPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaTypeText: {
    marginTop: 8,
    fontSize: 14,
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
  mediaTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  mediaTypeLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  // Progress Styles (from TipTubeUploadScreen)
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
  
  // Core styles
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1F2937',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  checkboxGroup: {
    marginBottom: 16,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxText: {
    fontSize: 14,
    color: '#1F2937',
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  locationChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  locationChipSelected: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  locationChipText: {
    fontSize: 12,
    color: '#1F2937',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    minWidth: 50,
    textAlign: 'center',
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    top: 18,
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    top: 18,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    top: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  // Location search styles
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchResultText: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultMain: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultSecondary: {
    fontSize: 14,
    marginTop: 2,
  },
  emptySearchResults: {
    padding: 20,
    alignItems: 'center',
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addLocationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  // Date picker styles
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  datePickerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  datePicker: {
    height: 200,
  },
  datePickerButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Budget breakdown styles
  budgetBreakdown: {
    marginTop: 16,
    padding: 16,
    //backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  budgetBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetBreakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  budgetBreakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
  },

  // Summary styles
  summaryContainer: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },

  // Action button styles
  quickActionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  launchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Form section styles
  formSection: {
    marginBottom: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
});

export default CreateCampaignScreen;
