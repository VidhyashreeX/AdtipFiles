// src/components/common/Input.tsx - Enhanced input component with consistent styling

import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme, COMPONENT_VARIANTS, LAYOUT_CONSTANTS } from '../../theme/GlobalTheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: keyof typeof COMPONENT_VARIANTS.input;
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
}

const createInputStyles = (theme: Theme) => ({
  container: {
    marginVertical: theme.spacing.xs,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    minHeight: LAYOUT_CONSTANTS.INPUT_HEIGHT,
  },
  inputContainerSmall: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  inputContainerMedium: {
    minHeight: LAYOUT_CONSTANTS.INPUT_HEIGHT,
    paddingHorizontal: theme.spacing.md,
  },
  inputContainerLarge: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  // Variant styles
  inputContainerDefault: {
    borderColor: theme.colors.border,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  inputContainerSuccess: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },
  inputSmall: {
    fontSize: theme.typography.fontSize.sm,
  },
  inputLarge: {
    fontSize: theme.typography.fontSize.lg,
  },
  iconContainer: {
    marginHorizontal: theme.spacing.xs,
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
  messageContainer: {
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.error,
  },
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
});

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const styles = createInputStyles(theme);
  const [isFocused, setIsFocused] = React.useState(false);

  // Determine variant based on error state
  const currentVariant = error ? 'error' : variant;

  // Build styles
  const containerStyles: ViewStyle[] = [styles.inputContainer];
  const inputStyles: TextStyle[] = [styles.input];

  // Add size styles
  if (size === 'small') {
    containerStyles.push(styles.inputContainerSmall);
    inputStyles.push(styles.inputSmall);
  } else if (size === 'large') {
    containerStyles.push(styles.inputContainerLarge);
    inputStyles.push(styles.inputLarge);
  } else {
    containerStyles.push(styles.inputContainerMedium);
  }

  // Add variant styles
  if (currentVariant === 'error') {
    containerStyles.push(styles.inputContainerError);
  } else if (currentVariant === 'success') {
    containerStyles.push(styles.inputContainerSuccess);
  } else {
    containerStyles.push(styles.inputContainerDefault);
  }

  // Add focused state
  if (isFocused) {
    containerStyles.push(styles.inputContainerFocused);
  }

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        </View>
      )}
      
      <View style={containerStyles}>
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIcon]}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[inputStyles, inputStyle]}
          placeholderTextColor={theme.colors.text.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <View style={[styles.iconContainer, styles.rightIcon]}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || hint) && (
        <View style={styles.messageContainer}>
          {error && (
            <Text style={[styles.errorText, errorStyle]}>{error}</Text>
          )}
          {!error && hint && (
            <Text style={[styles.hintText, hintStyle]}>{hint}</Text>
          )}
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

export default Input;