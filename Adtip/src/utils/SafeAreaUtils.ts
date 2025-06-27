/**
 * Safe Area Utilities for consistent safe area handling across the app
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar, Dimensions } from 'react-native';

/**
 * Hook to get consistent safe area paddings
 */
export const useSafeAreaStyle = () => {
  const insets = useSafeAreaInsets();
  
  return {
    // For full screen containers
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    
    // For containers that need only top safe area (most common)
    paddingTopOnly: insets.top,
    
    // For containers that need horizontal safe areas
    paddingHorizontal: Math.max(insets.left, insets.right),
    
    // Individual insets for custom usage
    insets,
  };
};

/**
 * Status bar height utility
 */
export const getStatusBarHeight = () => {
  return Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
};

/**
 * Check if device has notch/dynamic island
 */
export const hasNotch = () => {
  const { height, width } = Dimensions.get('window');
  return Platform.OS === 'ios' && (height >= 812 || width >= 812);
};

/**
 * Get safe area edges for SafeAreaView
 */
export const getSafeAreaEdges = (excludeEdges: string[] = []) => {
  const allEdges = ['top', 'bottom', 'left', 'right'];
  return allEdges.filter(edge => !excludeEdges.includes(edge));
};

/**
 * Common safe area styles
 */
export const safeAreaStyles = {
  // Most common: safe area with transparent status bar
  container: {
    flex: 1,
    edges: ['top', 'left', 'right'] as const,
  },
  
  // For screens with bottom tab navigation
  containerWithTabs: {
    flex: 1,
    edges: ['top', 'left', 'right'] as const,
  },
  
  // For modal screens
  modal: {
    flex: 1,
    edges: ['top', 'bottom', 'left', 'right'] as const,
  },
  
  // For full screen content (videos, camera, etc.)
  fullScreen: {
    flex: 1,
    edges: [] as const,
  },
};

/**
 * Status bar configuration for different screen types
 */
export const statusBarConfig = {
  // Default for most screens
  default: {
    translucent: true,
    backgroundColor: 'transparent',
  },
  
  // For dark screens (videos, camera, etc.)
  dark: {
    translucent: true,
    backgroundColor: 'transparent',
    barStyle: 'light-content' as const,
  },
  
  // For light screens
  light: {
    translucent: true,
    backgroundColor: 'transparent',
    barStyle: 'dark-content' as const,
  },
  
  // For full screen content
  hidden: {
    hidden: true,
  },
};
