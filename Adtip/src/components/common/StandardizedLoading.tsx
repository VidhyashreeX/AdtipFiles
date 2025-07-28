// src/components/common/StandardizedLoading.tsx
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

// ✅ LOADING TYPES for different use cases
export type LoadingType = 
  | 'spinner'           // Simple spinner
  | 'pulse'            // Pulsing animation
  | 'skeleton'         // Skeleton placeholder
  | 'dots'             // Three dots animation
  | 'progress'         // Progress bar
  | 'fade'             // Fade in/out
  | 'slide'            // Slide animation
  | 'bounce';          // Bouncing animation

export type LoadingSize = 'small' | 'medium' | 'large';

export interface StandardizedLoadingProps {
  type?: LoadingType;
  size?: LoadingSize;
  message?: string;
  color?: string;
  backgroundColor?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  duration?: number;
  testID?: string;
}

// ✅ SIZE CONFIGURATIONS
const SIZE_CONFIG = {
  small: { indicator: 20, text: 12, spacing: 8 },
  medium: { indicator: 30, text: 14, spacing: 12 },
  large: { indicator: 40, text: 16, spacing: 16 },
} as const;

// ✅ SPINNER LOADING
const SpinnerLoading: React.FC<StandardizedLoadingProps> = ({ 
  size = 'medium', 
  color, 
  message 
}) => {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];
  
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={config.indicator} 
        color={color || colors.primary} 
      />
      {message && (
        <Text style={[
          styles.message, 
          { 
            fontSize: config.text, 
            color: colors.text.secondary,
            marginTop: config.spacing 
          }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// ✅ PULSE LOADING
const PulseLoading: React.FC<StandardizedLoadingProps> = ({ 
  size = 'medium', 
  color, 
  message,
  duration = 1000 
}) => {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.5, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[
        animatedStyle,
        {
          width: config.indicator,
          height: config.indicator,
          borderRadius: config.indicator / 2,
          backgroundColor: color || colors.primary,
        }
      ]} />
      {message && (
        <Text style={[
          styles.message, 
          { 
            fontSize: config.text, 
            color: colors.text.secondary,
            marginTop: config.spacing 
          }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// ✅ DOTS LOADING
const DotsLoading: React.FC<StandardizedLoadingProps> = ({ 
  size = 'medium', 
  color, 
  message,
  duration = 1200 
}) => {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];
  
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: Animated.SharedValue<number>, _delay: number) => {
      dot.value = withRepeat(
        withTiming(1, { 
          duration: duration / 3, 
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      );
    };

    setTimeout(() => animateDot(dot1, 0), 0);
    setTimeout(() => animateDot(dot2, duration / 6), duration / 6);
    setTimeout(() => animateDot(dot3, duration / 3), duration / 3);
  }, [duration]);

  const createDotStyle = (dot: Animated.SharedValue<number>) => 
    useAnimatedStyle(() => ({
      opacity: interpolate(dot.value, [0, 1], [0.3, 1]),
      transform: [{ 
        scale: interpolate(dot.value, [0, 1], [0.8, 1.2]) 
      }],
    }));

  const dotSize = config.indicator / 3;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        <Animated.View style={[
          createDotStyle(dot1),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color || colors.primary,
            marginHorizontal: 2,
          }
        ]} />
        <Animated.View style={[
          createDotStyle(dot2),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color || colors.primary,
            marginHorizontal: 2,
          }
        ]} />
        <Animated.View style={[
          createDotStyle(dot3),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color || colors.primary,
            marginHorizontal: 2,
          }
        ]} />
      </View>
      {message && (
        <Text style={[
          styles.message, 
          { 
            fontSize: config.text, 
            color: colors.text.secondary,
            marginTop: config.spacing 
          }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// ✅ SKELETON LOADING
const SkeletonLoading: React.FC<StandardizedLoadingProps> = ({ 
  size = 'medium', 
  color,
  duration = 1500 
}) => {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  const skeletonColor = color || colors.border;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        animatedStyle,
        {
          width: config.indicator * 3,
          height: config.indicator / 2,
          backgroundColor: skeletonColor,
          borderRadius: 4,
          marginBottom: config.spacing / 2,
        }
      ]} />
      <Animated.View style={[
        animatedStyle,
        {
          width: config.indicator * 2,
          height: config.indicator / 2,
          backgroundColor: skeletonColor,
          borderRadius: 4,
          marginBottom: config.spacing / 2,
        }
      ]} />
      <Animated.View style={[
        animatedStyle,
        {
          width: config.indicator * 2.5,
          height: config.indicator / 2,
          backgroundColor: skeletonColor,
          borderRadius: 4,
        }
      ]} />
    </View>
  );
};

// ✅ MAIN STANDARDIZED LOADING COMPONENT
const StandardizedLoading: React.FC<StandardizedLoadingProps> = ({
  type = 'spinner',
  size = 'medium',
  message,
  color,
  backgroundColor,
  overlay = false,
  fullScreen = false,
  duration = 1000,
  testID = 'standardized-loading',
  ...props
}) => {
  const { colors } = useTheme();

  const renderLoading = () => {
    const commonProps = { size, color, message, duration, ...props };
    
    switch (type) {
      case 'pulse':
        return <PulseLoading {...commonProps} />;
      case 'dots':
        return <DotsLoading {...commonProps} />;
      case 'skeleton':
        return <SkeletonLoading {...commonProps} />;
      case 'spinner':
      default:
        return <SpinnerLoading {...commonProps} />;
    }
  };

  const containerStyle = [
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    backgroundColor && { backgroundColor },
    !backgroundColor && overlay && { backgroundColor: colors.background + '80' },
  ];

  return (
    <View style={containerStyle} testID={testID}>
      {renderLoading()}
    </View>
  );
};

// ✅ STYLES
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  message: {
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StandardizedLoading;
