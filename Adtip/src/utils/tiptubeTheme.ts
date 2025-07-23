import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints
export const BREAKPOINTS = {
  small: 320,
  medium: 375,
  large: 414,
  tablet: 768,
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) {
    return baseSpacing * 1.5;
  }
  if (SCREEN_WIDTH >= BREAKPOINTS.large) {
    return baseSpacing * 1.2;
  }
  if (SCREEN_WIDTH <= BREAKPOINTS.small) {
    return baseSpacing * 0.8;
  }
  return baseSpacing;
};

// Responsive font sizes
export const getResponsiveFontSize = (baseFontSize: number) => {
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) {
    return baseFontSize * 1.3;
  }
  if (SCREEN_WIDTH >= BREAKPOINTS.large) {
    return baseFontSize * 1.1;
  }
  if (SCREEN_WIDTH <= BREAKPOINTS.small) {
    return baseFontSize * 0.9;
  }
  return baseFontSize;
};

// TipTube specific theme constants
export const TIPTUBE_THEME = {
  colors: {
    primary: '#00C853', // Green color for selected states
    secondary: '#ff4444', // Red color for toggle switch
    accent: '#24d05a',
    youtube: {
      red: '#FF0000',
      darkRed: '#CC0000',
    },
  },
  spacing: {
    xs: getResponsiveSpacing(4),
    sm: getResponsiveSpacing(8),
    md: getResponsiveSpacing(12),
    lg: getResponsiveSpacing(16),
    xl: getResponsiveSpacing(20),
    xxl: getResponsiveSpacing(24),
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 20,
    circle: 50,
  },
  typography: {
    h1: {
      fontSize: getResponsiveFontSize(24),
      fontWeight: 'bold' as const,
      lineHeight: getResponsiveFontSize(32),
    },
    h2: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: 'bold' as const,
      lineHeight: getResponsiveFontSize(28),
    },
    h3: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: '600' as const,
      lineHeight: getResponsiveFontSize(24),
    },
    body: {
      fontSize: getResponsiveFontSize(16),
      fontWeight: '400' as const,
      lineHeight: getResponsiveFontSize(22),
    },
    bodySmall: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: '400' as const,
      lineHeight: getResponsiveFontSize(20),
    },
    caption: {
      fontSize: getResponsiveFontSize(12),
      fontWeight: '400' as const,
      lineHeight: getResponsiveFontSize(16),
    },
    button: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: '600' as const,
      lineHeight: getResponsiveFontSize(20),
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  dimensions: {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    headerHeight: 56,
    tabBarHeight: 60,
    videoCardAspectRatio: 16 / 9,
    shortsCardAspectRatio: 9 / 16,
  },
};

// Helper function to create consistent styles
export const createTipTubeStyles = (colors: any, isDarkMode: boolean) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: TIPTUBE_THEME.borderRadius.md,
    ...TIPTUBE_THEME.shadows.small,
  },
  button: {
    backgroundColor: TIPTUBE_THEME.colors.primary,
    borderRadius: TIPTUBE_THEME.borderRadius.round,
    paddingHorizontal: TIPTUBE_THEME.spacing.lg,
    paddingVertical: TIPTUBE_THEME.spacing.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    color: '#FFFFFF',
    ...TIPTUBE_THEME.typography.button,
  },
  secondaryButton: {
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: TIPTUBE_THEME.borderRadius.round,
    paddingHorizontal: TIPTUBE_THEME.spacing.lg,
    paddingVertical: TIPTUBE_THEME.spacing.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    ...TIPTUBE_THEME.typography.button,
  },
  text: {
    primary: {
      color: colors.text.primary,
      ...TIPTUBE_THEME.typography.body,
    },
    secondary: {
      color: colors.text.secondary,
      ...TIPTUBE_THEME.typography.bodySmall,
    },
    tertiary: {
      color: colors.text.tertiary,
      ...TIPTUBE_THEME.typography.caption,
    },
  },
});

// Utility function to get video card dimensions
export const getVideoCardDimensions = () => {
  const cardWidth = SCREEN_WIDTH - (TIPTUBE_THEME.spacing.lg * 2);
  const cardHeight = cardWidth / TIPTUBE_THEME.dimensions.videoCardAspectRatio;
  
  return {
    width: cardWidth,
    height: cardHeight,
  };
};

// Utility function to get shorts card dimensions
export const getShortsCardDimensions = () => {
  const cardWidth = (SCREEN_WIDTH - (TIPTUBE_THEME.spacing.lg * 3)) / 2;
  const cardHeight = cardWidth / TIPTUBE_THEME.dimensions.shortsCardAspectRatio;
  
  return {
    width: cardWidth,
    height: cardHeight,
  };
};

export default TIPTUBE_THEME;
