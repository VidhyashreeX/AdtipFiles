// src/components/common/Button.tsx - Enhanced button component with consistent styling

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme, COMPONENT_VARIANTS, LAYOUT_CONSTANTS } from '../../theme/GlobalTheme';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: keyof typeof COMPONENT_VARIANTS.button;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const createButtonStyles = (theme: Theme) => ({
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: LAYOUT_CONSTANTS.BUTTON_HEIGHT,
    ...theme.shadows.sm,
  },
  buttonSmall: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  buttonMedium: {
    minHeight: LAYOUT_CONSTANTS.BUTTON_HEIGHT,
    paddingHorizontal: theme.spacing.md,
  },
  buttonLarge: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonFullWidth: {
    width: '100%' as const,
  },
  // Variant styles
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDestructive: {
    backgroundColor: theme.colors.error,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.6,
  },
  // Text styles
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    textAlign: 'center' as const,
  },
  buttonTextPrimary: {
    color: theme.colors.text.inverse,
  },
  buttonTextSecondary: {
    color: theme.colors.text.inverse,
  },
  buttonTextOutline: {
    color: theme.colors.primary,
  },
  buttonTextGhost: {
    color: theme.colors.primary,
  },
  buttonTextDestructive: {
    color: theme.colors.text.inverse,
  },
  buttonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  buttonTextSmall: {
    fontSize: theme.typography.fontSize.sm,
  },
  buttonTextLarge: {
    fontSize: theme.typography.fontSize.lg,
  },
  iconContainer: {
    marginHorizontal: theme.spacing.xs / 2,
  },
  loadingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
});

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createButtonStyles(theme);

  const isDisabled = disabled || loading;

  // Build styles based on props
  const buttonStyle: ViewStyle[] = [styles.button];
  const textStyles: TextStyle[] = [styles.buttonText];
  
  // Add size styles
  if (size === 'small') buttonStyle.push(styles.buttonSmall);
  else if (size === 'large') buttonStyle.push(styles.buttonLarge);
  else buttonStyle.push(styles.buttonMedium);
  
  // Add variant styles
  if (variant === 'primary') {
    buttonStyle.push(styles.buttonPrimary);
    textStyles.push(styles.buttonTextPrimary);
  } else if (variant === 'secondary') {
    buttonStyle.push(styles.buttonSecondary);
    textStyles.push(styles.buttonTextSecondary);
  } else if (variant === 'outline') {
    buttonStyle.push(styles.buttonOutline);
    textStyles.push(styles.buttonTextOutline);
  } else if (variant === 'ghost') {
    buttonStyle.push(styles.buttonGhost);
    textStyles.push(styles.buttonTextGhost);
  } else if (variant === 'destructive') {
    buttonStyle.push(styles.buttonDestructive);
    textStyles.push(styles.buttonTextDestructive);
  }
  
  // Add size text styles
  if (size === 'small') textStyles.push(styles.buttonTextSmall);
  else if (size === 'large') textStyles.push(styles.buttonTextLarge);
  
  // Add conditional styles
  if (fullWidth) buttonStyle.push(styles.buttonFullWidth);
  if (isDisabled) {
    buttonStyle.push(styles.buttonDisabled);
    textStyles.push(styles.buttonTextDisabled);
  }
  
  // Add custom styles
  if (style) buttonStyle.push(style);
  if (textStyle) textStyles.push(textStyle);

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.text.inverse}
          style={[styles.iconContainer]}
        />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
      <Text style={textStyles}>{title}</Text>
      {!loading && icon && iconPosition === 'right' && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
    </>
  );

  // Note: Gradient support can be added later with expo-linear-gradient
  // if (gradient && (variant === 'primary' || variant === 'secondary')) {
  //   return gradient implementation
  // }

  return (
    <TouchableOpacity
      {...props}
      style={buttonStyle}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;