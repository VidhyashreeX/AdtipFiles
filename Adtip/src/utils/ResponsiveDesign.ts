// src/utils/ResponsiveDesign.ts - Responsive design utilities for React Native

import React from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const DeviceType = {
  PHONE: 'phone',
  TABLET: 'tablet',
  TV: 'tv',
} as const;

export type DeviceTypeValue = typeof DeviceType[keyof typeof DeviceType];

// Breakpoints (similar to Tailwind CSS)
export const Breakpoints = {
  xs: 0,     // Extra small devices
  sm: 640,   // Small devices
  md: 768,   // Medium devices  
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
  xxl: 1536, // 2X large devices
} as const;

// Screen size utilities
export const getDeviceType = (): DeviceTypeValue => {
  if (Platform.isTV) return DeviceType.TV;
  
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  // Tablet detection logic
  if (Platform.OS === 'ios') {
    // iPad detection
    return (adjustedWidth >= 1024 || adjustedHeight >= 1024) ? DeviceType.TABLET : DeviceType.PHONE;
  } else {
    // Android tablet detection
    const minDimension = Math.min(adjustedWidth, adjustedHeight);
    return minDimension >= 600 ? DeviceType.TABLET : DeviceType.PHONE;
  }
};

export const isTablet = (): boolean => getDeviceType() === DeviceType.TABLET;
export const isPhone = (): boolean => getDeviceType() === DeviceType.PHONE;
export const isTV = (): boolean => getDeviceType() === DeviceType.TV;

// Responsive dimensions
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font scaling
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / 320;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive spacing
export const responsiveSpacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  xxl: normalize(48),
};

// Responsive font sizes
export const responsiveFontSizes = {
  xs: normalize(12),
  sm: normalize(14),
  md: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
};

// Breakpoint utilities
export const isBreakpoint = (breakpoint: keyof typeof Breakpoints): boolean => {
  return SCREEN_WIDTH >= Breakpoints[breakpoint];
};

export const isXs = (): boolean => SCREEN_WIDTH >= Breakpoints.xs && SCREEN_WIDTH < Breakpoints.sm;
export const isSm = (): boolean => SCREEN_WIDTH >= Breakpoints.sm && SCREEN_WIDTH < Breakpoints.md;
export const isMd = (): boolean => SCREEN_WIDTH >= Breakpoints.md && SCREEN_WIDTH < Breakpoints.lg;
export const isLg = (): boolean => SCREEN_WIDTH >= Breakpoints.lg && SCREEN_WIDTH < Breakpoints.xl;
export const isXl = (): boolean => SCREEN_WIDTH >= Breakpoints.xl && SCREEN_WIDTH < Breakpoints.xxl;
export const isXxl = (): boolean => SCREEN_WIDTH >= Breakpoints.xxl;

// Responsive value selection
export const responsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  default: T;
}): T => {
  if (isXxl() && values.xxl !== undefined) return values.xxl;
  if (isXl() && values.xl !== undefined) return values.xl;
  if (isLg() && values.lg !== undefined) return values.lg;
  if (isMd() && values.md !== undefined) return values.md;
  if (isSm() && values.sm !== undefined) return values.sm;
  if (isXs() && values.xs !== undefined) return values.xs;
  return values.default;
};

// Device-specific values
export const deviceValue = <T>(values: {
  phone?: T;
  tablet?: T;
  tv?: T;
  default: T;
}): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case DeviceType.PHONE:
      return values.phone !== undefined ? values.phone : values.default;
    case DeviceType.TABLET:
      return values.tablet !== undefined ? values.tablet : values.default;
    case DeviceType.TV:
      return values.tv !== undefined ? values.tv : values.default;
    default:
      return values.default;
  }
};

// Responsive grid calculations
export const getGridColumns = (itemWidth: number, spacing: number = 16): number => {
  const availableWidth = SCREEN_WIDTH - (spacing * 2);
  const itemsWithSpacing = Math.floor((availableWidth + spacing) / (itemWidth + spacing));
  return Math.max(1, itemsWithSpacing);
};

// Responsive card dimensions
export const getCardDimensions = (columns: number, spacing: number = 16) => {
  const totalSpacing = spacing * (columns + 1);
  const availableWidth = SCREEN_WIDTH - totalSpacing;
  const cardWidth = availableWidth / columns;
  
  return {
    width: cardWidth,
    height: cardWidth * 0.75, // 4:3 aspect ratio by default
  };
};

// Orientation utilities
export const isLandscape = (): boolean => SCREEN_WIDTH > SCREEN_HEIGHT;
export const isPortrait = (): boolean => SCREEN_HEIGHT > SCREEN_WIDTH;

// Safe area utilities (approximation for devices without notch)
export const getSafeAreaInsets = () => {
  const deviceType = getDeviceType();
  
  // Default safe area values
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;
  
  if (Platform.OS === 'ios') {
    // iPhone X and newer detection (approximation)
    if (SCREEN_HEIGHT >= 812) {
      top = 44;
      bottom = 34;
    } else {
      top = 20;
      bottom = 0;
    }
  } else {
    // Android status bar
    top = 24;
    bottom = 0;
  }
  
  if (deviceType === DeviceType.TABLET) {
    // Tablets usually don't have notches
    top = Platform.OS === 'ios' ? 20 : 24;
    bottom = 0;
  }
  
  return { top, bottom, left, right };
};

// Typography scale utilities
export const getResponsiveFontSize = (size: keyof typeof responsiveFontSizes): number => {
  return responsiveFontSizes[size];
};

export const getResponsiveLineHeight = (fontSize: number, ratio: number = 1.4): number => {
  return Math.round(fontSize * ratio);
};

// Component sizing utilities
export const getButtonHeight = (): number => {
  return deviceValue({
    phone: 44,
    tablet: 48,
    tv: 56,
    default: 44,
  });
};

export const getInputHeight = (): number => {
  return getButtonHeight();
};

export const getHeaderHeight = (): number => {
  return deviceValue({
    phone: 56,
    tablet: 64,
    tv: 72,
    default: 56,
  });
};

export const getTabBarHeight = (): number => {
  return deviceValue({
    phone: 60,
    tablet: 64,
    tv: 72,
    default: 60,
  });
};

// Animation duration utilities
export const getAnimationDuration = (type: 'fast' | 'normal' | 'slow'): number => {
  const baseValues = {
    fast: 150,
    normal: 300,
    slow: 500,
  };
  
  // Reduce animation duration on lower-end devices
  const scale = Platform.OS === 'android' && PixelRatio.get() < 2 ? 0.8 : 1;
  return Math.round(baseValues[type] * scale);
};

// Utility hooks
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState(() => Dimensions.get('window'));
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove?.();
  }, []);
  
  return {
    ...dimensions,
    isTablet: getDeviceType() === DeviceType.TABLET,
    isPhone: getDeviceType() === DeviceType.PHONE,
    isLandscape: dimensions.width > dimensions.height,
    isPortrait: dimensions.height > dimensions.width,
  };
};

export const useBreakpoint = () => {
  const { width } = useResponsiveDimensions();
  
  return {
    xs: width >= Breakpoints.xs && width < Breakpoints.sm,
    sm: width >= Breakpoints.sm && width < Breakpoints.md,
    md: width >= Breakpoints.md && width < Breakpoints.lg,
    lg: width >= Breakpoints.lg && width < Breakpoints.xl,
    xl: width >= Breakpoints.xl && width < Breakpoints.xxl,
    xxl: width >= Breakpoints.xxl,
    current: width,
  };
};

export default {
  wp,
  hp,
  normalize,
  responsiveSpacing,
  responsiveFontSizes,
  responsiveValue,
  deviceValue,
  getDeviceType,
  isTablet,
  isPhone,
  isTV,
  getGridColumns,
  getCardDimensions,
  getSafeAreaInsets,
  getResponsiveFontSize,
  getButtonHeight,
  getInputHeight,
  getHeaderHeight,
  getTabBarHeight,
  getAnimationDuration,
};