import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  BackHandler,
  Animated,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCameraDevice,
  CameraPermissionStatus,
  AudioPermissionStatus,
  VideoFile,
  RecordVideoOptions,
  CameraDevice,
  TakePhotoOptions,
  PhotoFile,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { EventRegister } from 'react-native-event-listeners';
import RNFS from 'react-native-fs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CameraRecordingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDarkMode } = useTheme();
  
  const { maxDuration = 60, aspectRatio = '9:16' } = route.params || {};

  // Camera refs and state
  const cameraRef = useRef<Camera>(null);
  
  // Device state
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  
  // Permissions and initialization
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('not-determined');
  const [microphonePermission, setMicrophonePermission] = useState<AudioPermissionStatus>('not-determined');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initRetries, setInitRetries] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera settings
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [zoom, setZoom] = useState(0);

  // Animation values
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Get current device
  const device: CameraDevice | undefined = cameraPosition === 'back' ? backDevice : frontDevice;

  // Timer ref for recording duration
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const initializationTimer = useRef<NodeJS.Timeout | null>(null);

  // Debug function to log device info
  const logDeviceInfo = useCallback(() => {
    console.log('[CameraRecording] Device Debug Info:', {
      cameraPosition,
      backDevice: backDevice ? {
        id: backDevice.id,
        name: backDevice.name,
        hasFlash: backDevice.hasFlash,
        hasTorch: backDevice.hasTorch,
        position: backDevice.position,
      } : 'null',
      frontDevice: frontDevice ? {
        id: frontDevice.id,
        name: frontDevice.name,
        hasFlash: frontDevice.hasFlash,
        hasTorch: frontDevice.hasTorch,
        position: frontDevice.position,
      } : 'null',
      selectedDevice: device ? {
        id: device.id,
        name: device.name,
        position: device.position,
      } : 'null',
      isInitializing,
      isInitialized,
      initRetries,
      permissions: {
        camera: cameraPermission,
        microphone: microphonePermission,
      },
      isCameraReady: !isInitializing && isInitialized && device != null,
    });
  }, [
    cameraPosition, backDevice, frontDevice, device, 
    isInitializing, isInitialized, initRetries, 
    cameraPermission, microphonePermission
  ]);

  // Forcibly retry camera initialization
  const retryInitialization = useCallback(() => {
    console.log('[CameraRecording] Retrying camera initialization');
    setIsInitializing(true);
    setIsInitialized(false);
    setInitRetries(prev => prev + 1);
    
    // Clear any existing timer
    if (initializationTimer.current) {
      clearTimeout(initializationTimer.current);
    }
    
    // Schedule a new initialization attempt
    initializationTimer.current = setTimeout(() => {
      initializeCamera();
    }, 500);
  }, []);

  // Check and request permissions
  const checkAndRequestPermissions = useCallback(async () => {
    try {
      console.log('[CameraRecording] Checking camera permissions');
      
      // Get current permission status
      const cameraStatus = await Camera.getCameraPermissionStatus();
      const microphoneStatus = await Camera.getMicrophonePermissionStatus();
      
      console.log('[CameraRecording] Current permissions:', {
        camera: cameraStatus,
        microphone: microphoneStatus,
      });

      setCameraPermission(cameraStatus);
      setMicrophonePermission(microphoneStatus);

      // Request permissions if needed
      if (cameraStatus === 'not-determined') {
        const newCameraStatus = await Camera.requestCameraPermission();
        setCameraPermission(newCameraStatus);
      }

      if (microphoneStatus === 'not-determined') {
        const newMicrophoneStatus = await Camera.requestMicrophonePermission();
        setMicrophonePermission(newMicrophoneStatus);
      }

      // Check final status
      const finalCameraStatus = await Camera.getCameraPermissionStatus();
      const finalMicrophoneStatus = await Camera.getMicrophonePermissionStatus();

      console.log('[CameraRecording] Final permissions:', {
        camera: finalCameraStatus,
        microphone: finalMicrophoneStatus,
      });

      if (finalCameraStatus === 'denied' || finalMicrophoneStatus === 'denied') {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone access are required to record videos. Please grant permissions.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Try Again', onPress: checkAndRequestPermissions },
          ],
        );
        return false;
      }

      if (finalCameraStatus === 'restricted' || finalMicrophoneStatus === 'restricted') {
        Alert.alert(
          'Permissions Restricted',
          'Camera and microphone permissions are restricted. Please enable them in Settings.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      return finalCameraStatus === 'authorized' && finalMicrophoneStatus === 'authorized';
    } catch (error) {
      console.error('[CameraRecording] Error checking permissions:', error);
      Alert.alert('Permission Error', 'Failed to check permissions. Please try again.');
      return false;
    }
  }, [navigation]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Check permissions first
      const hasPermissions = await checkAndRequestPermissions();
      if (!hasPermissions) {
        setIsInitializing(false);
        return;
      }
      
      // Wait for devices to be available
      if (!backDevice && !frontDevice) {
        console.log('[CameraRecording] No camera devices available yet, waiting...');
        
        // Give it some time, then set initialized if devices become available
        setTimeout(() => {
          if (backDevice || frontDevice) {
            console.log('[CameraRecording] Devices available after timeout');
            setIsInitialized(true);
          } else {
            console.log('[CameraRecording] Devices still not available after timeout');
            // Auto-retry up to 3 times
            if (initRetries < 3) {
              retryInitialization();
            } else {
              console.log('[CameraRecording] Max retries reached, camera may not be supported');
            }
          }
          setIsInitializing(false);
        }, 2000);
        
        return;
      }
      
      // Set appropriate default camera
      if (!backDevice && frontDevice) {
        console.log('[CameraRecording] Only front camera available, switching to front');
        setCameraPosition('front');
      }
      
      console.log('[CameraRecording] Camera initialized successfully');
      setIsInitialized(true);
      setIsInitializing(false);
      
    } catch (error) {
      console.error('[CameraRecording] Error initializing camera:', error);
      setIsInitializing(false);
      
      // Auto-retry on failure
      if (initRetries < 3) {
        setTimeout(retryInitialization, 1000);
      } else {
        Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
      }
    }
  }, [checkAndRequestPermissions, backDevice, frontDevice, initRetries, retryInitialization]);
  
  // Initialize on mount
  useEffect(() => {
    initializeCamera();
    
    return () => {
      // Clean up timers
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current);
      }
    };
  }, [initializeCamera]);
  
  // Log device changes
  useEffect(() => {
    if (!isInitializing && (backDevice || frontDevice)) {
      logDeviceInfo();
    }
  }, [backDevice, frontDevice, isInitializing, logDeviceInfo]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isRecording) {
          Alert.alert(
            'Recording in Progress',
            'Are you sure you want to stop recording and go back?',
            [
              { text: 'Continue Recording', style: 'cancel' },
              { text: 'Stop & Go Back', style: 'destructive', onPress: () => stopRecording(true) },
            ],
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isRecording]),
  );

  // Update recording duration
  const updateRecordingDuration = useCallback(() => {
    setRecordingDuration(prev => {
      const newDuration = prev + 1;
      
      // Update progress animation
      const progress = newDuration / maxDuration;
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Auto-stop at max duration
      if (newDuration >= maxDuration) {
        stopRecording();
        return newDuration;
      }
      
      return newDuration;
    });
  }, [maxDuration, progressAnimation]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!cameraRef.current || !device) {
        console.error('[CameraRecording] Cannot start recording - camera ref or device missing');
        Alert.alert('Error', 'Camera not available');
        return;
      }

      console.log('[CameraRecording] Starting video recording with device:', device.id);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Start duration timer
      recordingTimer.current = setInterval(updateRecordingDuration, 1000);

      // Configure recording options
      const options: RecordVideoOptions = {
        quality: 'high',
        fileType: 'mp4',
        onRecordingError: (error) => {
          console.error('[CameraRecording] Recording error:', error);
          setIsRecording(false);
          if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
          }
          recordingPulse.stopAnimation();
          Alert.alert('Recording Error', 'Failed to record video. Please try again.');
        },
        onRecordingFinished: (video: VideoFile) => {
          console.log('[CameraRecording] Recording finished:', video);
          handleVideoRecorded(video);
        },
      };

      await cameraRef.current.startRecording(options);
    } catch (error) {
      console.error('[CameraRecording] Error starting recording:', error);
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      recordingPulse.stopAnimation();
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  }, [device, updateRecordingDuration, recordingPulse]);

  // Stop recording
  const stopRecording = useCallback(async (goBack: boolean = false) => {
    try {
      if (!cameraRef.current || !isRecording) {
        return;
      }

      console.log('[CameraRecording] Stopping video recording');
      
      // Clear timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop animations
      recordingPulse.stopAnimation();
      recordingPulse.setValue(1);

      setIsRecording(false);
      setIsProcessing(true);

      await cameraRef.current.stopRecording();

      if (goBack) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('[CameraRecording] Error stopping recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  }, [isRecording, recordingPulse, navigation]);

  // Handle recorded video
  const handleVideoRecorded = useCallback(async (video: VideoFile) => {
    try {
      console.log('[CameraRecording] Processing recorded video:', video.path);
      setIsProcessing(true);

      // Ensure the file exists
      const fileExists = await RNFS.exists(video.path);
      if (!fileExists) {
        throw new Error('Recorded video file not found');
      }

      // Get file stats
      const stats = await RNFS.stat(video.path);
      console.log('[CameraRecording] Video file stats:', {
        size: stats.size,
        duration: recordingDuration,
        path: video.path,
      });

      // Emit event with video path
      EventRegister.emit('videoRecorded', { videoUri: video.path });

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('[CameraRecording] Error processing recorded video:', error);
      setIsProcessing(false);
      Alert.alert('Processing Error', 'Failed to process recorded video. Please try again.');
    }
  }, [recordingDuration, navigation]);

  // Toggle camera position
  const toggleCameraPosition = useCallback(() => {
    console.log('[CameraRecording] Toggling camera position from', cameraPosition);
    setCameraPosition(prev => {
      const newPosition = prev === 'back' ? 'front' : 'back';
      console.log('[CameraRecording] New camera position:', newPosition);
      return newPosition;
    });
  }, [cameraPosition]);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    setFlashMode(prev => {
      const newMode = prev === 'off' ? 'on' : 'off';
      console.log('[CameraRecording] Flash mode changed to', newMode);
      return newMode;
    });
  }, []);

  // Take photo for thumbnail
  const takePhoto = useCallback(async () => {
    try {
      if (!cameraRef.current || !device) {
        Alert.alert('Error', 'Camera not available');
        return;
      }

      const options: TakePhotoOptions = {
        quality: 90,
        skipMetadata: true,
      };

      const photo: PhotoFile = await cameraRef.current.takePhoto(options);
      console.log('[CameraRecording] Photo taken:', photo.path);
      
      // You could emit this as a thumbnail if needed
      EventRegister.emit('thumbnailCaptured', { thumbnailUri: photo.path });
      Alert.alert('Success', 'Photo captured as thumbnail');
    } catch (error) {
      console.error('[CameraRecording] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [device]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle record button press
  const handleRecordButtonPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Button press animation
      Animated.sequence([
        Animated.timing(recordButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(recordButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      startRecording();
    }
  };

  // Updated camera ready logic
  const isCameraReady = !isInitializing && 
                       isInitialized && 
                       cameraPermission === 'authorized' && 
                       microphonePermission === 'authorized' && 
                       device != null;

  // Check if any device is available
  const hasAnyCamera = backDevice != null || frontDevice != null;

  console.log('[CameraRecording] Render state:', {
    isInitializing,
    isInitialized,
    hasPermissions: cameraPermission === 'authorized' && microphonePermission === 'authorized',
    hasDevice: !!device,
    hasAnyCamera,
    isCameraReady,
  });

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.black }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
          <Text style={[styles.permissionText, { color: colors.text.primary }]}>
            Initializing camera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show permission or error screen
  if (!isCameraReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.black }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={48} color={colors.text.secondary} />
          <Text style={[styles.permissionText, { color: colors.text.primary }]}>
            {cameraPermission !== 'authorized' || microphonePermission !== 'authorized'
              ? 'Camera and microphone permissions are required'
              : !hasAnyCamera
              ? 'No camera available on this device'
              : !device
              ? `${cameraPosition === 'back' ? 'Back' : 'Front'} camera not available`
              : 'Camera error - please try again'}
          </Text>
          
          {/* Permission button */}
          {(cameraPermission !== 'authorized' || microphonePermission !== 'authorized') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={checkAndRequestPermissions}
            >
              <Text style={[styles.actionButtonText, { color: colors.white }]}>
                Grant Permissions
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Camera switch button */}
          {(cameraPermission === 'authorized' && microphonePermission === 'authorized') && 
           hasAnyCamera && !device && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={toggleCameraPosition}
            >
              <Text style={[styles.actionButtonText, { color: colors.white }]}>
                Switch to {cameraPosition === 'back' ? 'Front' : 'Back'} Camera
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Retry button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={retryInitialization}
          >
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              Retry
            </Text>
          </TouchableOpacity>
          
          {/* Debug button */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: colors.gray?.[600] || '#666' }]}
              onPress={logDeviceInfo}
            >
              <Text style={[styles.debugButtonText, { color: colors.white }]}>
                Debug Camera Info
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.black }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
          zoom={zoom}
          enableZoomGesture={true}
          torch={flashMode}
        />

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="x" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.topCenterControls}>
            {/* Flash Button */}
            <TouchableOpacity
              style={[styles.topButton, { opacity: device?.hasTorch ? 1 : 0.3 }]}
              onPress={toggleFlash}
              disabled={!device?.hasTorch}
            >
              <Icon 
                name={flashMode === 'off' ? 'zap-off' : 'zap'} 
                size={24} 
                color={flashMode === 'off' ? colors.text.secondary : colors.primary} 
              />
            </TouchableOpacity>

            {/* Camera Switch */}
            <TouchableOpacity
              style={[styles.topButton, { opacity: (backDevice && frontDevice) ? 1 : 0.3 }]}
              onPress={toggleCameraPosition}
              disabled={!(backDevice && frontDevice)}
            >
              <Icon name="rotate-ccw" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.topButton} />
        </View>

        {/* Recording Duration and Progress */}
        {isRecording && (
          <View style={styles.recordingInfo}>
            <View style={styles.recordingDot} />
            <Text style={[styles.durationText, { color: colors.white }]}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.error,
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Photo Button */}
          <TouchableOpacity
            style={styles.photoButton}
            onPress={takePhoto}
            disabled={isRecording || isProcessing}
          >
            <Icon name="camera" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Record Button */}
          <View style={styles.recordButtonContainer}>
            <Animated.View
              style={[
                styles.recordButtonOuter,
                {
                  transform: [{ scale: recordButtonScale }],
                  borderColor: isRecording ? colors.error : colors.white,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.recordButtonTouchable}
                onPress={handleRecordButtonPress}
                disabled={isProcessing}
              >
                <Animated.View
                  style={[
                    styles.recordButtonInner,
                    {
                      backgroundColor: isRecording ? colors.error : colors.white,
                      transform: [{ scale: isRecording ? recordingPulse : 1 }],
                      borderRadius: isRecording ? 8 : 35,
                    }
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => navigation.goBack()}
            disabled={isRecording || isProcessing}
          >
            <Icon name="image" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Duration Info */}
        <View style={styles.durationInfoContainer}>
          <Text style={[styles.maxDurationText, { color: colors.text.secondary }]}>
            Max {maxDuration}s • {device.name || 'Camera'}
          </Text>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={[styles.processingModal, { backgroundColor: colors.background }]}>
              <Icon name="video" size={32} color={colors.primary} />
              <Text style={[styles.processingText, { color: colors.text.primary }]}>
                Processing video...
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // Loading & Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Top Controls
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topCenterControls: {
    flexDirection: 'row',
    gap: 16,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Recording Info
  recordingInfo: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3333',
    marginRight: 8,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Progress Bar
  progressBarContainer: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  photoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonContainer: {
    alignItems: 'center',
  },
  recordButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Duration Info
  durationInfoContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  maxDurationText: {
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Processing Overlay
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  processingModal: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CameraRecordingScreen;