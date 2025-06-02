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
  black: '#000000',  text: {
    primary: '#0f172a',
    secondary: '#374151',
    tertiary: '#6b7280',
    light: '#94a3b8',
  },
  textSecondary: '#374151',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  error: '#f43f5e',
  warning: '#FFF3CD',
  success: '#00C853',
  info: '#3b82f6',
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
  }
};

/**
 * Returns theme-compatible colors based on dark mode status
 */
export const getThemeColors = (isDarkMode: boolean) => {  if (isDarkMode) {
    return {
      ...COLORS,
      background: '#121212',
      surface: '#1e1e1e',
      card: '#2d2d2d',
      text: {
        primary: '#f8fafc',
        secondary: '#e2e8f0',
        tertiary: '#cbd5e1',
        light: '#94a3b8',      },
      border: '#475569',
      borderLight: '#334155',
    };
  }
  return COLORS;
};
