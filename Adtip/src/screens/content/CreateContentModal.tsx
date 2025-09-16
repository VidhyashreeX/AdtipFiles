// src/screens/content/CreateContentModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainNavigatorParamList } from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// Context
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';

interface CreateContentModalProps {
  visible: boolean;
  onClose: () => void;
}

const screenHeight = Dimensions.get('window').height;

const CreateContentModal: React.FC<CreateContentModalProps> = React.memo(({
  visible: propVisible,
  onClose,
}) => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
  const {isGuest, exitGuestMode} = useAuth();

  // Local state for login prompt instead of using global useGuestGuard
  const [showLocalLoginPrompt, setShowLocalLoginPrompt] = React.useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = React.useState('');

  // Reanimated shared values for smooth animations
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  // Spring configuration for smooth, natural animations
  const springConfig = {
    damping: 20,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restSpeedThreshold: 0.1,
    restDisplacementThreshold: 0.1,
  };

  // Timing configuration for backdrop
  const timingConfig = {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  };

  // Pan gesture for swipe to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward swipes
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY;
        // Reduce backdrop opacity as user swipes down
        const progress = Math.min(event.translationY / (screenHeight * 0.3), 1);
        backdropOpacity.value = 1 - progress * 0.5;
      }
    })
    .onEnd((event) => {
      const shouldDismiss = event.translationY > screenHeight * 0.2 || event.velocityY > 500;

      if (shouldDismiss) {
        // Dismiss modal
        translateY.value = withSpring(screenHeight, springConfig);
        backdropOpacity.value = withTiming(0, timingConfig, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
      } else {
        // Snap back to original position
        gestureTranslateY.value = withSpring(0, springConfig);
        backdropOpacity.value = withTiming(1, timingConfig);
      }
    });

  React.useEffect(() => {
    if (propVisible) {
      // Reset gesture value and animate in
      gestureTranslateY.value = 0;
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withTiming(1, timingConfig);
    } else {
      // Animate out with spring for modal and timing for backdrop
      translateY.value = withSpring(screenHeight, springConfig);
      backdropOpacity.value = withTiming(0, timingConfig);
    }
  }, [propVisible]);

  const handleCloseModalWithAnimation = () => {
    // Start close animation then call onClose
    translateY.value = withSpring(screenHeight, springConfig);
    backdropOpacity.value = withTiming(0, timingConfig, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  // Local login prompt handlers
  const showLoginPrompt = (message: string) => {
    setLoginPromptMessage(message);
    setShowLocalLoginPrompt(true);
  };

  const hideLoginPrompt = () => {
    setShowLocalLoginPrompt(false);
  };

  const handleLogin = async () => {
    try {
      await exitGuestMode();
      hideLoginPrompt();
      onClose(); // Close the create content modal
      // Navigation will be handled by UltraFastLoader
    } catch (error) {
      console.error('[CreateContentModal] Failed to exit guest mode:', error);
    }
  };

  const createNavigationHandler = (screenName: string, actionName: string) => () => {
    console.log(`[CreateContentModal] Navigation handler called for ${screenName}, isGuest: ${isGuest}`);

    // Check if user is guest and show local login prompt
    if (isGuest) {
      console.log(`[CreateContentModal] Guest user attempting to access ${screenName}, showing local login prompt`);
      const actionMessages: Record<string, string> = {
        'create posts': 'Login to create and share posts',
        'upload videos': 'Login to upload and share videos',
        'create shorts': 'Login to create short videos',
        'start live streams': 'Login to start live streaming',
      };
      const message = actionMessages[actionName] || `Login to ${actionName}`;
      showLoginPrompt(message);
      return;
    }

    // For authenticated users, close modal first, then navigate
    console.log(`[CreateContentModal] Authenticated user, closing modal and navigating to ${screenName}`);

    // Close modal immediately without animation to avoid conflicts
    onClose();

    // Navigate after a small delay to ensure modal is closed
    setTimeout(() => {
      try {
        console.log(`[CreateContentModal] Navigating to ${screenName}`);
        navigation.navigate(screenName as never);
      } catch (error) {
        console.error(`[CreateContentModal] Navigation error to ${screenName}:`, error);
      }
    }, 100);
  };

  const handleCreatePost = createNavigationHandler('CreatePost', 'create posts');
  const handleUploadVideo = createNavigationHandler('TipTubeUpload', 'upload videos');
  const handleCreateShort = createNavigationHandler('TipShortsUpload', 'create shorts');
  const handleStartStream = createNavigationHandler('StartStream', 'start live streams');

  // Animated styles using Reanimated
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: translateY.value + gestureTranslateY.value
      }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  // Don't render if not visible
  if (!propVisible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={propVisible}
      onRequestClose={handleCloseModalWithAnimation}
      animationType="none"
      statusBarTranslucent={true}
    >
      <GestureHandlerRootView style={styles.safeArea}>
        <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor={propVisible ? (isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)") : "transparent"}
          barStyle={propVisible ? "light-content" : (isDarkMode ? "light-content" : "dark-content")}
        />

        {/* Animated backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
            },
            backdropAnimatedStyle,
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseModalWithAnimation}
          />
        </Animated.View>

        <View style={styles.centeredView} pointerEvents="box-none">
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.modalView,
                {
                  backgroundColor: colors.background,
                  shadowColor: isDarkMode ? colors.white : colors.black,
                },
                modalAnimatedStyle,
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, {color: colors.text.primary}]}>
                  Create Content
                </Text>
                <TouchableOpacity 
                  onPress={handleCloseModalWithAnimation}
                  style={[styles.closeButton, {backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100]}]}
                >
                  <Icon name="x" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleCreatePost}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Icon name="file-text" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Create Post
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleUploadVideo}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.secondary},
                    ]}>
                    <Icon name="video" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Upload Video
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option, 
                    {
                      backgroundColor: isDarkMode ? colors.gray[800] : colors.gray[100],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[700] : 'transparent',
                    }
                  ]}
                  onPress={handleCreateShort}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.error},
                    ]}>
                    <Icon name="play" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Create Short
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: isDarkMode ? colors.surface : colors.white,
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.border : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    onClose();
                    navigation.navigate('LiveStream', { mode: 'host' });
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: '#FF6B6B'}, // Red color for live streaming
                    ]}>
                    <Icon name="wifi" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.primary}]}>
                    Start Live Stream
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </SafeAreaView>
      </GestureHandlerRootView>

      {/* Local Login Prompt Overlay - Inside the main modal to avoid nested modal conflicts */}
      {showLocalLoginPrompt && (
        <View style={[StyleSheet.absoluteFill, styles.loginOverlay]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={hideLoginPrompt}
          />
          <View style={[styles.loginContainer, {backgroundColor: colors.background}]}>
            <Text style={[styles.loginTitle, {color: colors.text.primary}]}>
              Login Required
            </Text>
            <Text style={[styles.loginMessage, {color: colors.text.secondary}]}>
              {loginPromptMessage}
            </Text>

            <View style={styles.loginButtonContainer}>
              <TouchableOpacity
                style={[styles.loginCancelButton, {borderColor: colors.gray[300]}]}
                onPress={hideLoginPrompt}
                activeOpacity={0.7}
              >
                <Text style={[styles.loginCancelButtonText, {color: colors.text.secondary}]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginActionButton, {backgroundColor: colors.primary}]}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginActionButtonText, {color: colors.white}]}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 200,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    marginBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  disabledOption: {
    opacity: 0.6,
  },
  // Login prompt overlay styles
  loginOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  loginContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  loginCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  loginCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loginActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

CreateContentModal.displayName = 'CreateContentModal';

export default CreateContentModal;
