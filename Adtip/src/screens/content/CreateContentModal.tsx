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
  const navigation = useNavigation();

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

  const createNavigationHandler = (screenName: string) => () => {
    // Close modal with animation then navigate
    translateY.value = withSpring(screenHeight, springConfig);
    backdropOpacity.value = withTiming(0, timingConfig, (finished) => {
      if (finished) {
        runOnJS(() => {
          onClose();
          navigation.navigate(screenName as never);
        })();
      }
    });
  };

  const handleCreatePost = createNavigationHandler('CreatePost');
  const handleUploadVideo = createNavigationHandler('TipTubeUpload');
  const handleCreateShort = createNavigationHandler('TipShortsUpload');
  const handleStartStream = createNavigationHandler('StartStream');

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
                    styles.disabledOption, // Add disabled style
                    {
                      backgroundColor: isDarkMode ? colors.gray[900] : colors.gray[50],
                      borderWidth: isDarkMode ? 1 : 0,
                      borderColor: isDarkMode ? colors.gray[800] : 'transparent',
                    }
                  ]}
                  onPress={() => {}} // Disable the press handler
                  disabled={true} // Make it disabled
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {backgroundColor: colors.gray[400]}, // Use gray color for disabled state
                    ]}>
                    <Icon name="wifi" size={24} color={colors.white} />
                  </View>
                  <Text style={[styles.optionText, {color: colors.text.tertiary}]}>
                    Start Stream - Coming Soon!
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.text.disabled || colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </SafeAreaView>
      </GestureHandlerRootView>
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
});

CreateContentModal.displayName = 'CreateContentModal';

export default CreateContentModal;
