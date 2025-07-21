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
// import { Canvas, RoundedRect, LinearGradient, vec, Blur } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
            width: SCREEN_WIDTH - 48,
            height: 280,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          },
          alertStyle
        ]}>
          {/* Icon */}
            <Animated.View style={[
              {
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              },
              iconStyle,
            ]}>
              <Icon name="chat-bubble-outline" size={32} color="#F59E0B" />
            </Animated.View>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1F2937',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -0.5,
            }}>
              Chat Unavailable
            </Text>

            {/* Message */}
            <Text style={{
              fontSize: 15,
              fontWeight: '400',
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 32,
            }}>
              {recipientName} is not on the latest version of the app yet. Chat is only supported when both users have the updated version.
            </Text>

            {/* Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              width: '100%',
            }}>
              {/* Retry Button */}
              {onRetry && (
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: pressed ? '#3B82F6' : '#4F46E5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}>
                    Retry
                  </Text>
                </Pressable>
              )}

              {/* Close Button */}
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => ({
                  flex: onRetry ? 1 : 2,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#F3F4F6' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#374151',
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
