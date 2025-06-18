// src/screens/content/TipShortsUploadScreen.tsx
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
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {launchCamera} from 'react-native-image-picker';
import * as Progress from 'react-native-progress';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// Components
import Header from '../../components/common/Header';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import VideoCompressionService from '../../services/VideoCompressionService';
import {ENDPOINTS} from '../../constants/api';

const RECORDING_MAX_DURATION = 60; // Max 60 seconds for shorts

import { RootStackParamList } from '../../types/navigation';

const TipShortsUploadScreen = () => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TipShortsUploadScreen'>>();

  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDarkMode);

  // State
  const [videoSource, setVideoSource] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [addMusic, setAddMusic] = useState(false);
  const [addEffect, setAddEffect] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [selectedEffect, setSelectedEffect] = useState<any>(null);
  const [compressedVideoUri, setCompressedVideoUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Check if there's a video from route params
  useEffect(() => {
    if (route.params?.videoSource) {
      setVideoSource(route.params.videoSource);
    }
  }, [route.params]);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const cameraPermission =
        Platform.OS === 'ios'
          ? await request(PERMISSIONS.IOS.CAMERA)
          : await request(PERMISSIONS.ANDROID.CAMERA);

      const microphonePermission =
        Platform.OS === 'ios'
          ? await request(PERMISSIONS.IOS.MICROPHONE)
          : await request(PERMISSIONS.ANDROID.RECORD_AUDIO);

      if (
        cameraPermission !== RESULTS.GRANTED ||
        microphonePermission !== RESULTS.GRANTED
      ) {
        Alert.alert(
          'Permission Required',
          'Camera and microphone permissions are required to record videos.',
          [{text: 'OK'}],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  // Start recording video
  const startRecording = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      return;
    }

    try {
      setIsRecording(true);
      setRecordingDuration(0);

      const durationTimer = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= RECORDING_MAX_DURATION) {
            clearInterval(durationTimer);
            stopRecording();
            return RECORDING_MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

      const result = await launchCamera({
        mediaType: 'video',
        durationLimit: RECORDING_MAX_DURATION,
        videoQuality: 'high',
        presentationStyle: 'fullScreen',
        saveToPhotos: true,
      });

      clearInterval(durationTimer);
      setIsRecording(false);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to record video');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        setVideoSource({
          uri: video.uri,
          type: video.type,
          name: video.fileName,
          duration: video.duration,
        });

        // Compress the recorded video
        await compressRecordedVideo(video.uri!);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  // Stop recording video
  const stopRecording = () => {
    // This would communicate with the camera to stop recording
    // but the native camera handling will be done by the image-picker library
    console.log('Stopping recording');
  };

  // Reset recording
  const resetRecording = () => {
    setVideoSource(null);
    setCaption('');
    setAddMusic(false);
    setAddEffect(false);
    setSelectedMusic(null);
    setSelectedEffect(null);
  };

  // Open music selection
  const handleOpenMusicSelection = () => {
    // @ts-ignore
    navigation.navigate('MusicSelector', {
      onSelect: (music: any) => setSelectedMusic(music),
    });
  };

  // Open effects selection
  const handleOpenEffectsSelection = () => {
    // @ts-ignore
    navigation.navigate('EffectsSelector', {
      onSelect: (effect: any) => setSelectedEffect(effect),
    });
  };

  // Compress recorded video for shorts
  const compressRecordedVideo = async (uri: string) => {
    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      // Mock progress updates
      VideoCompressionService.onCompressionProgress(setCompressionProgress);

      // Compress video for TipShorts (optimized for short videos)
      const compressedUri = await VideoCompressionService.compressForTipShorts(uri, {
        quality: 'medium',
        maxSize: 25, // 25MB max for shorts
      });

      setCompressedVideoUri(compressedUri);
      setIsCompressing(false);

      // Optional: Show compression success
      console.log('Short video compressed successfully');
    } catch (error) {
      console.error('Error compressing short video:', error);
      setIsCompressing(false);
      Alert.alert('Compression Error', 'Failed to compress video. You can still publish the original.');
    }
  };

  // Publish short
  const handlePublish = async () => {
    if (!videoSource) {
      Alert.alert('Missing Video', 'Please record a video first');
      return;
    }

    try {
      setIsPublishing(true);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append('caption', caption);

      if (selectedMusic) {
        formData.append('music_id', selectedMusic.id);
      }

      if (selectedEffect) {
        formData.append('effect_id', selectedEffect.id);
      }

      // Use compressed video if available, otherwise use original
      const videoUri = compressedVideoUri || videoSource.uri;
      
      // Append video
      formData.append('video', {
        uri: videoUri,
        type: videoSource.type || 'video/mp4',
        name: videoSource.name || 'short.mp4',
      } as any);

      // Upload video
      await ApiService.uploadFile(
        ENDPOINTS.UPLOAD_SHORT,
        formData,
        progress => {
          setUploadProgress(progress / 100);
        },
      );

      // Processing after upload
      setIsPublishing(false);
      setIsProcessing(true);

      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false);

        // Cleanup compressed file if it exists
        if (compressedVideoUri) {
          VideoCompressionService.cleanupTempFiles([compressedVideoUri]);
        }

        Alert.alert(
          'Upload Successful',
          'Your short has been uploaded and will be available soon',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }, 2000);
    } catch (error) {
      console.error('Error publishing short:', error);
      setIsPublishing(false);
      setIsProcessing(false);

      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your short. Please try again.',
      );
    }
  };

  // Render recording UI or preview based on state
  const renderContent = () => {
    if (!videoSource) {
      return (
        <View
          style={[styles.recordingContainer, {backgroundColor: colors.black}]}>
          {/* Camera placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Icon name="video" size={40} color={colors.white} />
            <Text style={styles.placeholderText}>
              Press the button below to record a short
            </Text>
          </View>

          {/* Recording controls */}
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}>
              {isRecording && <View style={styles.recordingInner} />}
            </TouchableOpacity>

            {isRecording && (
              <View style={styles.durationContainer}>
                <Icon name="circle" color={colors.error} size={8} />
                <Text style={styles.durationText}>
                  {Math.floor(recordingDuration / 60)}:
                  {recordingDuration % 60 < 10 ? '0' : ''}
                  {recordingDuration % 60}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Video preview UI
    return (
      <ScrollView style={styles.flex1}>
        <View style={styles.previewContainer}>
          {/* Video thumbnail */}
          <View style={styles.videoPreview}>
            <Image
              source={{uri: videoSource.uri}}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.playButton}
              onPress={() =>
                // @ts-ignore
                navigation.navigate('VideoPreview', {uri: videoSource.uri})
              }>
              <Icon name="play" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Caption input */}
          <View
            style={[styles.captionContainer, {backgroundColor: colors.card}]}>
            <TextInput
              style={[styles.captionInput, {color: colors.text.primary}]}
              placeholder="Write a caption..."
              placeholderTextColor={colors.text.tertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={150}
            />
            <Text style={[styles.captionCount, {color: colors.text.tertiary}]}>
              {caption.length}/150
            </Text>
          </View>

          {/* Options */}
          <View
            style={[styles.optionsContainer, {backgroundColor: colors.card}]}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Icon name="music" size={20} color={colors.primary} />
                <Text style={[styles.optionText, {color: colors.text.primary}]}>
                  Add Music
                </Text>
              </View>
              <TouchableOpacity onPress={handleOpenMusicSelection}>
                {selectedMusic ? (
                  <Text style={{color: colors.primary}}>
                    {selectedMusic.title}
                  </Text>
                ) : (
                  <Switch
                    value={addMusic}
                    onValueChange={value => {
                      setAddMusic(value);
                      if (value) {
                        handleOpenMusicSelection();
                      } else {
                        setSelectedMusic(null);
                      }
                    }}
                    trackColor={{
                      false: colors.gray[300],
                      true: colors.primary + '80',
                    }}
                    thumbColor={addMusic ? colors.primary : colors.gray[100]}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Icon name="star" size={20} color={colors.primary} />
                <Text style={[styles.optionText, {color: colors.text.primary}]}>
                  Add Effects
                </Text>
              </View>
              <TouchableOpacity onPress={handleOpenEffectsSelection}>
                {selectedEffect ? (
                  <Text style={{color: colors.primary}}>
                    {selectedEffect.name}
                  </Text>
                ) : (
                  <Switch
                    value={addEffect}
                    onValueChange={value => {
                      setAddEffect(value);
                      if (value) {
                        handleOpenEffectsSelection();
                      } else {
                        setSelectedEffect(null);
                      }
                    }}
                    trackColor={{
                      false: colors.gray[300],
                      true: colors.primary + '80',
                    }}
                    thumbColor={addEffect ? colors.primary : colors.gray[100]}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.resetButton, {backgroundColor: colors.gray[100]}]}
              onPress={resetRecording}>
              <Text style={[{color: colors.text.secondary}, styles.semibold]}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.publishButton, {backgroundColor: colors.primary}]}
              onPress={handlePublish}
              disabled={isPublishing || isProcessing}>
              {isPublishing || isProcessing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[{color: colors.white}, styles.semibold]}>
                  Publish
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex1, {backgroundColor: videoSource ? colors.background : colors.black}]}>
      <Header
        title="Create Short"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon
              name="arrow-left"
              size={24}
              color={videoSource ? colors.text.primary : colors.white}
            />
          </TouchableOpacity>
        }
      />

      {renderContent()}

      {/* Compression loading overlay */}
      {isCompressing && (
        <View
          style={[
            styles.loadingOverlay,
            {backgroundColor: colors.background + 'E6'},
          ]}>
          <View
            style={[styles.loadingContainer, {backgroundColor: colors.card}]}>
            <Text
              style={[styles.loadingText, {color: colors.text.primary}]}>
              Compressing short...
            </Text>
            <Progress.Bar
              progress={compressionProgress / 100}
              width={200}
              color={colors.primary}
              unfilledColor={colors.gray[200]}
              borderWidth={0}
              height={8}
              style={styles.progressBar}
            />
            <Text
              style={[styles.percentText, {color: colors.text.secondary}]}>
              {Math.round(compressionProgress)}%
            </Text>
          </View>
        </View>
      )}

      {/* Upload loading overlay */}
      {(isPublishing || isProcessing) && (
        <View
          style={[
            styles.loadingOverlay,
            {backgroundColor: colors.background + 'E6'},
          ]}>
          <View
            style={[styles.loadingContainer, {backgroundColor: colors.card}]}>
            {isPublishing ? (
              <>
                <Text
                  style={[styles.loadingText, {color: colors.text.primary}]}>
                  Uploading short...
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
                  Processing short...
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  recordingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.text.primary,
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recordingControls: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingActive: {
    borderColor: '#ff4040',
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#ff4040',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  previewContainer: {
    padding: 16,
  },
  videoPreview: {
    width: '100%',
    height: Dimensions.get('window').height * 0.4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -24}, {translateY: -24}],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captionInput: {
    padding: 0,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    color: colors.text.primary,
  },
  captionCount: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
    color: colors.text.secondary,
  },
  optionsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: colors.text.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  publishButton: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 250,
    backgroundColor: colors.card,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.text.primary,
  },
  progressBar: {
    marginVertical: 12,
  },
  percentText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  flex1: {
    flex: 1,
  },
  semibold: {
    fontWeight: '500',
  },
});

export default TipShortsUploadScreen;
