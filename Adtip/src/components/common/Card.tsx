// src/components/common/Card.tsx - Enhanced card component with consistent styling

import React from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../theme/GlobalTheme';

interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'round';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  pressable?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

const createCardStyles = (theme: Theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
  },
  // Variants
  cardDefault: {
    backgroundColor: theme.colors.card,
  },
  cardElevated: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.md,
  },
  cardOutlined: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardFilled: {
    backgroundColor: theme.colors.surface,
  },
  // Padding
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: theme.spacing.sm,
  },
  paddingMedium: {
    padding: theme.spacing.md,
  },
  paddingLarge: {
    padding: theme.spacing.lg,
  },
  // Margin
  marginNone: {
    margin: 0,
  },
  marginSmall: {
    margin: theme.spacing.sm,
  },
  marginMedium: {
    margin: theme.spacing.md,
  },
  marginLarge: {
    margin: theme.spacing.lg,
  },
  // Border radius
  borderRadiusNone: {
    borderRadius: 0,
  },
  borderRadiusSmall: {
    borderRadius: theme.borderRadius.sm,
  },
  borderRadiusMedium: {
    borderRadius: theme.borderRadius.md,
  },
  borderRadiusLarge: {
    borderRadius: theme.borderRadius.lg,
  },
  borderRadiusRound: {
    borderRadius: theme.borderRadius.round,
  },
  // Shadows
  shadowNone: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  shadowSmall: theme.shadows.xs,
  shadowMedium: theme.shadows.sm,
  shadowLarge: theme.shadows.md,
  // Pressable states
  pressable: {
    opacity: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  shadow = 'none',
  pressable = false,
  style,
  containerStyle,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createCardStyles(theme);

  // Build card styles
  const cardStyles: ViewStyle[] = [styles.card];

  // Add variant styles
  if (variant === 'elevated') {
    cardStyles.push(styles.cardElevated);
  } else if (variant === 'outlined') {
    cardStyles.push(styles.cardOutlined);
  } else if (variant === 'filled') {
    cardStyles.push(styles.cardFilled);
  } else {
    cardStyles.push(styles.cardDefault);
  }

  // Add padding
  if (padding === 'none') {
    cardStyles.push(styles.paddingNone);
  } else if (padding === 'small') {
    cardStyles.push(styles.paddingSmall);
  } else if (padding === 'large') {
    cardStyles.push(styles.paddingLarge);
  } else {
    cardStyles.push(styles.paddingMedium);
  }

  // Add margin
  if (margin === 'small') {
    cardStyles.push(styles.marginSmall);
  } else if (margin === 'medium') {
    cardStyles.push(styles.marginMedium);
  } else if (margin === 'large') {
    cardStyles.push(styles.marginLarge);
  } else {
    cardStyles.push(styles.marginNone);
  }

  // Add border radius
  if (borderRadius === 'none') {
    cardStyles.push(styles.borderRadiusNone);
  } else if (borderRadius === 'small') {
    cardStyles.push(styles.borderRadiusSmall);
  } else if (borderRadius === 'large') {
    cardStyles.push(styles.borderRadiusLarge);
  } else if (borderRadius === 'round') {
    cardStyles.push(styles.borderRadiusRound);
  } else {
    cardStyles.push(styles.borderRadiusMedium);
  }

  // Add shadow (only if not using elevated variant)
  if (variant !== 'elevated') {
    if (shadow === 'small') {
      cardStyles.push(styles.shadowSmall);
    } else if (shadow === 'medium') {
      cardStyles.push(styles.shadowMedium);
    } else if (shadow === 'large') {
      cardStyles.push(styles.shadowLarge);
    } else {
      cardStyles.push(styles.shadowNone);
    }
  }

  // Add custom styles
  if (style) {
    cardStyles.push(style);
  }

  // Render as pressable if onPress is provided or pressable is true
  if (pressable || onPress) {
    return (
      <View style={containerStyle}>
        <TouchableOpacity
          style={cardStyles}
          onPress={onPress}
          activeOpacity={0.8}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </View>
    );
  }

  // Render as regular view
  return (
    <View style={containerStyle}>
      <View style={cardStyles}>
        {children}
      </View>
    </View>
  );
};

export default Card;