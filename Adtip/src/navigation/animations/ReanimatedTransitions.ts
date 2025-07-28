// src/navigation/animations/ReanimatedTransitions.ts
import { Easing } from 'react-native-reanimated';
import { TransitionSpec, StackNavigationOptions } from '@react-navigation/stack';

// Enhanced transition configurations using Reanimated v3
export const TRANSITION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 400,
} as const;

// Custom easing curves for better feel
export const EASING_CURVES = {
  // iOS-like easing
  IOS: Easing.bezier(0.25, 0.1, 0.25, 1),
  // Material Design easing
  MATERIAL: Easing.bezier(0.4, 0.0, 0.2, 1),
  // Smooth bounce
  BOUNCE: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  // Quick snap
  SNAP: Easing.bezier(0.25, 0.46, 0.45, 0.94),
} as const;

// Base transition spec
const createTransitionSpec = (duration: number, easing: any): TransitionSpec => ({
  animation: 'timing',
  config: {
    duration,
    easing,
  },
});

// ✅ ULTRA-FAST TRANSITIONS for critical paths
export const ultraFastTransition: StackNavigationOptions = {
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.SNAP),
    close: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.SNAP),
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width * 0.3, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.8, 1],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

// ✅ SMOOTH SLIDE for main navigation
export const smoothSlideTransition: StackNavigationOptions = {
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.NORMAL, EASING_CURVES.IOS),
    close: createTransitionSpec(TRANSITION_DURATION.NORMAL, EASING_CURVES.IOS),
  },
  cardStyleInterpolator: ({ current, next: _next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

// ✅ MODAL SLIDE UP for overlays
export const modalSlideUpTransition: StackNavigationOptions = {
  presentation: 'modal',
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.NORMAL, EASING_CURVES.MATERIAL),
    close: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.MATERIAL),
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

// ✅ FADE TRANSITION for seamless switches
export const fadeTransition: StackNavigationOptions = {
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.MATERIAL),
    close: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.MATERIAL),
  },
  cardStyleInterpolator: ({ current }) => {
    return {
      cardStyle: {
        opacity: current.progress,
      },
    };
  },
  gestureEnabled: false,
};

// ✅ SCALE TRANSITION for special screens
export const scaleTransition: StackNavigationOptions = {
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.NORMAL, EASING_CURVES.BOUNCE),
    close: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.SNAP),
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height * 0.1, 0],
            }),
          },
        ],
        opacity: current.progress,
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

// ✅ FLIP TRANSITION for special effects
export const flipTransition: StackNavigationOptions = {
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.SLOW, EASING_CURVES.MATERIAL),
    close: createTransitionSpec(TRANSITION_DURATION.NORMAL, EASING_CURVES.MATERIAL),
  },
  cardStyleInterpolator: ({ current, layouts: _layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            rotateY: current.progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['180deg', '90deg', '0deg'],
            }),
          },
        ],
        backfaceVisibility: 'hidden',
      },
    };
  },
  gestureEnabled: false,
};

// ✅ TRANSPARENT MODAL for overlays
export const transparentModalTransition: StackNavigationOptions = {
  presentation: 'transparentModal',
  transitionSpec: {
    open: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.MATERIAL),
    close: createTransitionSpec(TRANSITION_DURATION.FAST, EASING_CURVES.MATERIAL),
  },
  cardStyleInterpolator: ({ current }) => {
    return {
      cardStyle: {
        opacity: current.progress,
      },
    };
  },
  cardStyle: {
    backgroundColor: 'transparent',
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

// ✅ PRESET CONFIGURATIONS for common use cases
export const NAVIGATION_PRESETS = {
  // For main app navigation
  MAIN_STACK: smoothSlideTransition,
  
  // For auth flow (fast and smooth)
  AUTH_STACK: ultraFastTransition,
  
  // For modals and overlays
  MODAL: modalSlideUpTransition,
  
  // For video player and fullscreen
  FULLSCREEN: fadeTransition,
  
  // For special screens like onboarding
  SPECIAL: scaleTransition,
  
  // For transparent overlays
  OVERLAY: transparentModalTransition,
  
  // For tab switching
  TAB_SWITCH: fadeTransition,
} as const;

// ✅ GESTURE CONFIGURATIONS
export const GESTURE_CONFIGS = {
  ENABLED_HORIZONTAL: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    gestureResponseDistance: 50,
  },
  
  ENABLED_VERTICAL: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    gestureResponseDistance: 100,
  },
  
  DISABLED: {
    gestureEnabled: false,
  },
} as const;

// ✅ PERFORMANCE OPTIMIZED DEFAULTS
export const PERFORMANCE_DEFAULTS = {
  // Reduce overdraw
  cardOverlayEnabled: false,
  
  // Optimize for 60fps
  animationTypeForReplace: 'push' as const,
  
  // Enable native driver when possible
  useNativeDriver: true,
} as const;
