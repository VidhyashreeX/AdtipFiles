// src/theme/GlobalTheme.ts - Centralized theme system for consistent UI/UX

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  card: string;
  cardSecondary: string;
  overlay: string;
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    link: string;
    placeholder: string;
    disabled: string;
  };
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI element colors
  border: string;
  borderLight: string;
  borderDark: string;
  divider: string;
  shadow: string;
  
  // Special colors
  white: string;
  black: string;
  transparent: string;
  
  // Interactive states
  pressed: string;
  hover: string;
  focus: string;
  disabled: string;
  
  // Chat specific colors
  messageBubble: {
    own: string;
    other: string;
    system: string;
  };
  
  // Live streaming colors
  live: string;
  offline: string;
  
  // Gradient colors
  gradients: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    error: string[];
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      semiBold: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  shadows: {
    xs: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  animations: {
    fast: number;
    normal: number;
    slow: number;
  };
}

// Light theme colors
const lightColors: ThemeColors = {
  // Primary brand colors - consistent teal theme
  primary: '#1BD4AA',
  primaryDark: '#13B799',
  primaryLight: '#4DE0C1',
  secondary: '#6366F1',
  secondaryDark: '#4F46E5',
  secondaryLight: '#818CF8',
  accent: '#F59E0B',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#1BD4AA',
    placeholder: '#94A3B8',
    disabled: '#CBD5E1',
  },
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // UI element colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  divider: '#E2E8F0',
  shadow: '#000000',
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Interactive states
  pressed: 'rgba(27, 212, 170, 0.1)',
  hover: 'rgba(27, 212, 170, 0.05)',
  focus: 'rgba(27, 212, 170, 0.2)',
  disabled: '#F1F5F9',
  
  // Chat specific colors
  messageBubble: {
    own: '#1BD4AA',
    other: '#F1F5F9',
    system: '#FEF3C7',
  },
  
  // Live streaming colors
  live: '#EF4444',
  offline: '#6B7280',
  
  // Gradient colors
  gradients: {
    primary: ['#1BD4AA', '#13B799'],
    secondary: ['#6366F1', '#4F46E5'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    error: ['#EF4444', '#DC2626'],
  },
};

// Dark theme colors
const darkColors: ThemeColors = {
  // Primary brand colors - same teal theme but adapted for dark mode
  primary: '#1BD4AA',
  primaryDark: '#13B799',
  primaryLight: '#4DE0C1',
  secondary: '#818CF8',
  secondaryDark: '#6366F1',
  secondaryLight: '#A5B4FC',
  accent: '#FBBF24',
  
  // Background colors
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  card: '#334155',
  cardSecondary: '#475569',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Text colors
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    inverse: '#0F172A',
    link: '#4DE0C1',
    placeholder: '#64748B',
    disabled: '#475569',
  },
  
  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // UI element colors
  border: '#475569',
  borderLight: '#334155',
  borderDark: '#64748B',
  divider: '#374151',
  shadow: '#000000',
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Interactive states
  pressed: 'rgba(77, 224, 193, 0.2)',
  hover: 'rgba(77, 224, 193, 0.1)',
  focus: 'rgba(77, 224, 193, 0.3)',
  disabled: '#374151',
  
  // Chat specific colors
  messageBubble: {
    own: '#1BD4AA',
    other: '#374151',
    system: '#92400E',
  },
  
  // Live streaming colors
  live: '#F87171',
  offline: '#9CA3AF',
  
  // Gradient colors
  gradients: {
    primary: ['#1BD4AA', '#13B799'],
    secondary: ['#818CF8', '#6366F1'],
    success: ['#34D399', '#10B981'],
    warning: ['#FBBF24', '#F59E0B'],
    error: ['#F87171', '#EF4444'],
  },
};

// Common theme properties
const commonTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
    },
  },
  shadows: {
    xs: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Export themes
export const lightTheme: Theme = {
  colors: lightColors,
  ...commonTheme,
};

export const darkTheme: Theme = {
  colors: darkColors,
  ...commonTheme,
};

// Helper functions for theme usage
export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};

export const createThemedStyles = (styleFunction: (theme: Theme) => any, theme: Theme) => {
  return styleFunction(theme);
};

// Color utility functions
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - returns white or black based on background luminance
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Layout constants
export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: 56,
  TAB_BAR_HEIGHT: 60,
  SAFE_AREA_PADDING: 16,
  CARD_PADDING: 16,
  SECTION_SPACING: 24,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  STORY_SIZE: 70,
  AVATAR_SIZE: 40,
  ICON_SIZE: 24,
  SMALL_ICON_SIZE: 16,
  LARGE_ICON_SIZE: 32,
};

// Component variants
export const COMPONENT_VARIANTS = {
  button: {
    primary: 'primary',
    secondary: 'secondary',
    outline: 'outline',
    ghost: 'ghost',
    destructive: 'destructive',
  },
  input: {
    default: 'default',
    error: 'error',
    success: 'success',
  },
  badge: {
    default: 'default',
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  },
};

export default { lightTheme, darkTheme, getTheme, createThemedStyles };