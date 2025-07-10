/**
 * Application color constants
 */
export const COLORS = {
  primary: '#24d05a',
  secondary: '#6b48ff',
  accent: '#00C853',
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  white: '#ffffff',
  black: '#000000',
  text: {
    primary: '#0f172a',
    secondary: '#374151',
    tertiary: '#6b7280',
    light: '#94a3b8',
  },
  textSecondary: '#374151',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  error: '#f43f5e',
  danger: '#ef4444',
  warning: '#FFF3CD',
  success: '#00C853',
  info: '#3b82f6',
  // Skeleton colors for light mode
  skeleton: {
    background: '#f1f5f9',
    highlight: '#ffffff',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

/**
 * Returns theme-compatible colors based on dark mode status
 */
export const getThemeColors = (isDarkMode: boolean) => {
  if (isDarkMode) {
    return {
      ...COLORS,
      background: '#000000', // Pure black background
      surface: '#000000',    // Pure black surface
      card: '#000000',       // Pure black card background
      text: {
        primary: '#ffffff',   // Pure white text for contrast
        secondary: '#e2e8f0', // Light grey for secondary text
        tertiary: '#cbd5e1',  // Lighter grey for tertiary text
        light: '#94a3b8',     // Keep light text as is
      },
      border: '#333333',      // Dark grey for borders (not pure black for visibility)
      borderLight: '#222222', // Slightly lighter for border variations
      // Skeleton colors for dark mode
      skeleton: {
        background: '#111111', // Very dark grey for skeleton background
        highlight: '#222222',  // Slightly lighter for skeleton highlight
      },
    };
  }
  return COLORS;
};
