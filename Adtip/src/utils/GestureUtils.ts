// src/utils/GestureUtils.ts
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ GESTURE SENSITIVITY CONFIGURATIONS
export const GESTURE_SENSITIVITY = {
  // Distance from edge to trigger gesture
  EDGE_DISTANCE: {
    TIGHT: 15,      // Very close to edge
    NORMAL: 35,     // Standard distance
    LOOSE: 60,      // Easier to trigger
  },
  
  // Velocity threshold for gesture completion
  VELOCITY_THRESHOLD: {
    LOW: 500,       // Slow swipe
    NORMAL: 800,    // Standard swipe
    HIGH: 1200,     // Fast swipe
  },
  
  // Distance threshold for gesture completion
  DISTANCE_THRESHOLD: {
    SHORT: SCREEN_WIDTH * 0.2,   // 20% of screen
    NORMAL: SCREEN_WIDTH * 0.3,  // 30% of screen
    LONG: SCREEN_WIDTH * 0.5,    // 50% of screen
  },
} as const;

// ✅ GESTURE RESPONSE CONFIGURATIONS
export const GESTURE_RESPONSE = {
  // Quick response for critical actions
  IMMEDIATE: {
    responseDistance: GESTURE_SENSITIVITY.EDGE_DISTANCE.TIGHT,
    velocityImpact: 0.1,
    fullScreenGestureEnabled: false,
  },
  
  // Standard response for most screens
  STANDARD: {
    responseDistance: GESTURE_SENSITIVITY.EDGE_DISTANCE.NORMAL,
    velocityImpact: 0.3,
    fullScreenGestureEnabled: true,
  },
  
  // Relaxed response for complex screens
  RELAXED: {
    responseDistance: GESTURE_SENSITIVITY.EDGE_DISTANCE.LOOSE,
    velocityImpact: 0.5,
    fullScreenGestureEnabled: true,
  },
  
  // Modal-specific response
  MODAL: {
    responseDistance: GESTURE_SENSITIVITY.DISTANCE_THRESHOLD.SHORT,
    velocityImpact: 0.4,
    fullScreenGestureEnabled: true,
  },
  
  // Video/media response (easier dismissal)
  MEDIA: {
    responseDistance: GESTURE_SENSITIVITY.DISTANCE_THRESHOLD.SHORT,
    velocityImpact: 0.6,
    fullScreenGestureEnabled: true,
  },
} as const;

// ✅ PLATFORM-SPECIFIC GESTURE CONFIGURATIONS
export const getPlatformGestureConfig = () => {
  const isIOS = Platform.OS === 'ios';
  
  return {
    // iOS has better native gesture handling
    edgeDistance: isIOS ? GESTURE_SENSITIVITY.EDGE_DISTANCE.TIGHT : GESTURE_SENSITIVITY.EDGE_DISTANCE.NORMAL,
    velocityThreshold: isIOS ? GESTURE_SENSITIVITY.VELOCITY_THRESHOLD.LOW : GESTURE_SENSITIVITY.VELOCITY_THRESHOLD.NORMAL,
    distanceThreshold: isIOS ? GESTURE_SENSITIVITY.DISTANCE_THRESHOLD.SHORT : GESTURE_SENSITIVITY.DISTANCE_THRESHOLD.NORMAL,
    
    // iOS-specific optimizations
    ...(isIOS && {
      interactivePopGestureEnabled: true,
      swipeEdgeWidth: 20,
    }),
    
    // Android-specific optimizations
    ...(!isIOS && {
      gestureResponseDistance: 50,
      gestureVelocityImpact: 0.3,
    }),
  };
};

// ✅ GESTURE VALIDATION UTILITIES
export const GestureValidator = {
  // Check if gesture should be enabled based on screen type
  shouldEnableGesture: (screenType: 'main' | 'modal' | 'fullscreen' | 'overlay') => {
    switch (screenType) {
      case 'main':
        return true;
      case 'modal':
        return true;
      case 'fullscreen':
        return true;
      case 'overlay':
        return false; // Usually handled by backdrop press
      default:
        return true;
    }
  },
  
  // Check if horizontal gesture should be enabled
  shouldEnableHorizontalGesture: (canGoBack: boolean, isModal: boolean) => {
    return canGoBack && !isModal;
  },
  
  // Check if vertical gesture should be enabled
  shouldEnableVerticalGesture: (isModal: boolean, isFullscreen: boolean) => {
    return isModal || isFullscreen;
  },
  
  // Validate gesture velocity
  isValidGestureVelocity: (velocity: number, threshold = GESTURE_SENSITIVITY.VELOCITY_THRESHOLD.NORMAL) => {
    return Math.abs(velocity) >= threshold;
  },
  
  // Validate gesture distance
  isValidGestureDistance: (distance: number, threshold = GESTURE_SENSITIVITY.DISTANCE_THRESHOLD.NORMAL) => {
    return Math.abs(distance) >= threshold;
  },
};

// ✅ GESTURE PERFORMANCE OPTIMIZATIONS
export const GesturePerformance = {
  // Optimize gesture handling for different screen sizes
  getOptimizedConfig: () => {
    const isTablet = SCREEN_WIDTH >= 768;
    const isSmallScreen = SCREEN_WIDTH < 375;
    
    if (isTablet) {
      return {
        responseDistance: GESTURE_SENSITIVITY.EDGE_DISTANCE.LOOSE,
        velocityImpact: 0.2,
        fullScreenGestureEnabled: true,
      };
    }
    
    if (isSmallScreen) {
      return {
        responseDistance: GESTURE_SENSITIVITY.EDGE_DISTANCE.TIGHT,
        velocityImpact: 0.4,
        fullScreenGestureEnabled: false,
      };
    }
    
    return GESTURE_RESPONSE.STANDARD;
  },
  
  // Debounce gesture events to prevent performance issues
  debounceGesture: (callback: () => void, delay = 16) => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },
  
  // Throttle gesture updates for smooth animations
  throttleGesture: (callback: (value: number) => void, limit = 16) => {
    let inThrottle: boolean;
    
    return (value: number) => {
      if (!inThrottle) {
        callback(value);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

// ✅ GESTURE ACCESSIBILITY
export const GestureAccessibility = {
  // Check if gestures should be disabled for accessibility
  shouldDisableForAccessibility: (isScreenReaderEnabled: boolean, isReduceMotionEnabled: boolean) => {
    return isScreenReaderEnabled || isReduceMotionEnabled;
  },
  
  // Get accessibility-friendly gesture config
  getAccessibleConfig: () => ({
    gestureEnabled: false, // Disable gestures for screen readers
    animationDuration: 0,  // Disable animations for reduce motion
  }),
  
  // Provide alternative navigation methods
  getAlternativeNavigation: () => ({
    showBackButton: true,
    showCloseButton: true,
    enableKeyboardNavigation: true,
  }),
};

// ✅ GESTURE ANALYTICS
export const GestureAnalytics = {
  // Track gesture usage for optimization
  trackGestureUsage: (gestureType: 'swipe_back' | 'swipe_dismiss' | 'edge_swipe', success: boolean) => {
    // Implementation would depend on analytics service
    console.log(`Gesture ${gestureType} ${success ? 'completed' : 'cancelled'}`);
  },
  
  // Track gesture performance
  trackGesturePerformance: (gestureType: string, duration: number, distance: number) => {
    // Implementation would depend on analytics service
    console.log(`Gesture ${gestureType} took ${duration}ms over ${distance}px`);
  },
};

// ✅ PRESET GESTURE CONFIGURATIONS
export const GESTURE_PRESETS = {
  // Standard navigation gestures
  NAVIGATION: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    ...GESTURE_RESPONSE.STANDARD,
  },
  
  // Modal dismissal gestures
  MODAL_DISMISS: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    ...GESTURE_RESPONSE.MODAL,
  },
  
  // Media/video gestures
  MEDIA_CONTROLS: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    ...GESTURE_RESPONSE.MEDIA,
  },
  
  // Quick action gestures
  QUICK_ACTION: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    ...GESTURE_RESPONSE.IMMEDIATE,
  },
  
  // Disabled gestures
  DISABLED: {
    gestureEnabled: false,
  },
} as const;

export default {
  GESTURE_SENSITIVITY,
  GESTURE_RESPONSE,
  getPlatformGestureConfig,
  GestureValidator,
  GesturePerformance,
  GestureAccessibility,
  GestureAnalytics,
  GESTURE_PRESETS,
};
