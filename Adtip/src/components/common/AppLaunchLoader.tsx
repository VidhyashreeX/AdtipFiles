// src/components/common/AppLaunchLoader.tsx
import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

// Import app logo
const AppLogo = require('../../../assets/icon/app_logo.png');

// Screen dimensions available if needed
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppLaunchLoaderProps {
  message?: string;
}

const AppLaunchLoader: React.FC<AppLaunchLoaderProps> = ({ 
  message = "Initializing..." 
}) => {
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const logoRotation = useSharedValue(0);

  useEffect(() => {
    // Pulsing animation for the logo
    pulseScale.value = withRepeat(
      withTiming(1.1, { 
        duration: 1500, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      true
    );

    pulseOpacity.value = withRepeat(
      withTiming(0.7, { 
        duration: 1500, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      true
    );

    // Subtle rotation animation
    logoRotation.value = withRepeat(
      withTiming(360, { 
        duration: 8000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
    opacity: pulseOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundOpacity = interpolate(
      pulseOpacity.value,
      [0.7, 1],
      [0.05, 0.1]
    );
    
    return {
      backgroundColor: `${colors.primary}${Math.round(backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <Image
            source={AppLogo}
            style={[
              styles.logo,
              {
                tintColor: isDarkMode ? colors.primary : undefined,
              }
            ]}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* App name */}
        <Animated.Text style={[
          styles.appName,
          { color: colors.text.primary }
        ]}>
          AdTip
        </Animated.Text>
        
        {/* Loading message */}
        <Animated.Text style={[
          styles.loadingMessage,
          { color: colors.text.secondary }
        ]}>
          {message}
        </Animated.Text>
      </View>
      
      {/* Loading indicator dots */}
      <View style={styles.dotsContainer}>
        <LoadingDots color={colors.primary} />
      </View>
    </Animated.View>
  );
};

// Loading dots component
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDots = () => {
      // Staggered animation for dots
      dot1.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      
      setTimeout(() => {
        dot2.value = withRepeat(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
      }, 200);
      
      setTimeout(() => {
        dot3.value = withRepeat(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
      }, 400);
    };

    animateDots();
  }, []);

  const createDotStyle = (dotValue: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(dotValue.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dotValue.value, [0, 1], [0.8, 1.2]) }],
    }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, createDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, createDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, createDotStyle(dot3)]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  loadingMessage: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 100,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default AppLaunchLoader;
