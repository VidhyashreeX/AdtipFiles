/**
 * ChatUnavailableAlert - Beautiful modern alert for when chat is unavailable
 * 
 * Uses React Native Reanimated and Skia for smooth 60fps animations
 * Shows when recipient doesn't have FCM token (not on latest version)
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';



interface ChatUnavailableAlertProps {
  visible: boolean;
  recipientName: string;
  onClose: () => void;
  onRetry?: () => void;
}

const ChatUnavailableAlert: React.FC<ChatUnavailableAlertProps> = ({
  visible,
  recipientName,
  onClose,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const { colors, isDarkMode } = useTheme();

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);
  const blurRadius = useSharedValue(0);

  useEffect(() => {
    console.log('[ChatUnavailableAlert] Visibility changed:', visible);
    if (visible) {
      // Show animation
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      blurRadius.value = withTiming(10, { duration: 300 });
    } else {
      // Hide animation
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
      blurRadius.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const alertStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Subtle icon animation
      iconRotation.value = withSpring(360, { damping: 12, stiffness: 100 });
      iconScale.value = withSpring(1.1, { damping: 15, stiffness: 200 });
    }
  }, [visible]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${iconRotation.value}deg` },
      { scale: iconScale.value },
    ],
  }));

  const handleClose = () => {
    runOnJS(onClose)();
  };

  const handleRetry = () => {
    if (onRetry) {
      runOnJS(onRetry)();
    }
  };

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    }}>
      {/* Backdrop with gradient effect */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        },
        backdropStyle,
      ]} />

      {/* Alert Container */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
        <Animated.View style={[
          {
            width: screenWidth - 48,
            minHeight: 320,
            backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.98)',
            borderRadius: 28,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: isDarkMode ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: 12,
            },
            shadowOpacity: isDarkMode ? 0.4 : 0.25,
            shadowRadius: 24,
            elevation: 12,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: isDarkMode ? colors.border : 'transparent',
          },
          alertStyle
        ]}>
          {/* Icon */}
            <Animated.View style={[
              {
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
                borderWidth: isDarkMode ? 1 : 0,
                borderColor: isDarkMode ? 'rgba(251, 191, 36, 0.3)' : 'transparent',
              },
              iconStyle,
            ]}>
              <Icon
                name="chat-bubble-outline"
                size={36}
                color={isDarkMode ? '#FCD34D' : '#F59E0B'}
              />
            </Animated.View>

            {/* Title */}
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.text.primary,
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: -0.5,
            }}>
              Chat Unavailable
            </Text>

            {/* Message */}
            <Text style={{
              fontSize: 16,
              fontWeight: '400',
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 36,
              paddingHorizontal: 4,
            }}>
              {recipientName} is not on the latest version of the app yet. Chat is only supported when both users have the updated version.
            </Text>

            {/* Buttons */}
            <View style={{
              flexDirection: onRetry ? 'row' : 'column',
              gap: 12,
              width: '100%',
              alignItems: 'stretch',
              justifyContent: 'center',
            }}>
              {/* Retry Button - Primary Action */}
              {onRetry && (
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: pressed
                      ? (isDarkMode ? '#1E40AF' : '#3B82F6')
                      : (isDarkMode ? '#2563EB' : '#4F46E5'),
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: isDarkMode ? '#2563EB' : '#4F46E5',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  })}
                >
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    letterSpacing: 0.2,
                  }}>
                    Try Again
                  </Text>
                </Pressable>
              )}

              {/* Close Button - Secondary Action */}
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => ({
                  flex: onRetry ? 1 : undefined,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: pressed
                    ? (isDarkMode ? colors.surface : '#F3F4F6')
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'),
                  borderWidth: 1,
                  borderColor: isDarkMode ? colors.border : '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.text.primary,
                  letterSpacing: 0.2,
                }}>
                  {onRetry ? 'Cancel' : 'Got it'}
                </Text>
              </Pressable>
            </View>
        </Animated.View>
      </View>

      {/* Tap outside to close */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
        onPress={handleClose}
      />
    </View>
  );
};

export default ChatUnavailableAlert;
