// src/components/common/Avatar.tsx - Enhanced avatar component with consistent styling

import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme, LAYOUT_CONSTANTS } from '../../theme/GlobalTheme';

interface AvatarProps extends Omit<TouchableOpacityProps, 'style'> {
  source?: { uri: string } | number;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  variant?: 'circular' | 'rounded' | 'square';
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  placeholder?: React.ReactNode;
  placeholderBackgroundColor?: string;
  placeholderTextColor?: string;
  pressable?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  badgeStyle?: ViewStyle;
  onPress?: () => void;
  onError?: () => void;
}

const createAvatarStyles = (theme: Theme) => ({
  container: {
    position: 'relative' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatar: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.disabled,
    overflow: 'hidden' as const,
  },
  // Variants
  circular: {
    borderRadius: 999,
  },
  rounded: {
    borderRadius: theme.borderRadius.md,
  },
  square: {
    borderRadius: 0,
  },
  // Sizes
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: LAYOUT_CONSTANTS.AVATAR_SIZE,
    height: LAYOUT_CONSTANTS.AVATAR_SIZE,
  },
  large: {
    width: 64,
    height: 64,
  },
  xlarge: {
    width: 80,
    height: 80,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
  },
  placeholderTextSmall: {
    fontSize: 12,
  },
  placeholderTextMedium: {
    fontSize: 16,
  },
  placeholderTextLarge: {
    fontSize: 24,
  },
  placeholderTextXLarge: {
    fontSize: 32,
  },
  badge: {
    position: 'absolute' as const,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: 999,
  },
  badgeTopRight: {
    top: -2,
    right: -2,
  },
  badgeBottomRight: {
    bottom: -2,
    right: -2,
  },
  badgeTopLeft: {
    top: -2,
    left: -2,
  },
  badgeBottomLeft: {
    bottom: -2,
    left: -2,
  },
  pressable: {
    opacity: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

const getInitials = (name: string): string => {
  if (!name) return '';
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const generatePlaceholderColor = (name: string): string => {
  if (!name) return '#94A3B8';
  
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#8B5CF6', '#EC4899', '#F97316',
    '#84CC16', '#06B6D4', '#14B8A6', '#F43F5E'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'medium',
  variant = 'circular',
  badge,
  badgePosition = 'top-right',
  placeholder,
  placeholderBackgroundColor,
  placeholderTextColor,
  pressable = false,
  style,
  imageStyle,
  textStyle,
  badgeStyle,
  onPress,
  onError,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createAvatarStyles(theme);
  const [imageLoadError, setImageLoadError] = React.useState(false);

  // Calculate size
  const avatarSize = typeof size === 'number' ? { width: size, height: size } : styles[size];
  const sizeKey = typeof size === 'string' ? size : 'medium';

  // Build avatar styles
  const avatarStyles: ViewStyle[] = [
    styles.avatar,
    styles[variant],
    avatarSize,
  ];

  // Add custom styles
  if (style) {
    avatarStyles.push(style);
  }

  // Generate placeholder background color if not provided
  const bgColor = placeholderBackgroundColor || generatePlaceholderColor(name);
  const textColor = placeholderTextColor || theme.colors.white;

  const handleImageError = () => {
    setImageLoadError(true);
    onError?.();
  };

  const renderContent = () => {
    // Show image if source is provided and no error occurred
    if (source && !imageLoadError) {
      return (
        <Image
          source={source}
          style={[styles.image, imageStyle]}
          onError={handleImageError}
          resizeMode="cover"
        />
      );
    }

    // Show custom placeholder if provided
    if (placeholder) {
      return placeholder;
    }

    // Show name initials
    const initials = getInitials(name);
    return (
      <View style={[avatarStyles, { backgroundColor: bgColor }]}>
        <Text
          style={[
            styles.placeholderText,
            styles[`placeholderText${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)}` as keyof typeof styles],
            { color: textColor },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  };

  const avatarContent = (
    <View style={[styles.container, avatarSize]}>
      {source && !imageLoadError ? (
        <View style={avatarStyles}>
          <Image
            source={source}
            style={[styles.image, imageStyle]}
            onError={handleImageError}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={[avatarStyles, { backgroundColor: bgColor }]}>
          {placeholder || (
            <Text
              style={[
                styles.placeholderText,
                styles[`placeholderText${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)}` as keyof typeof styles],
                { color: textColor },
                textStyle,
              ]}
            >
              {getInitials(name)}
            </Text>
          )}
        </View>
      )}
      
      {badge && (
        <View style={[
          styles.badge,
          styles[`badge${badgePosition.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}` as keyof typeof styles],
          badgeStyle,
        ]}>
          {badge}
        </View>
      )}
    </View>
  );

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

export default Avatar;