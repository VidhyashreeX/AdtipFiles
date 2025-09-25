// src/components/common/LoadingState.tsx - Comprehensive loading and skeleton components

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../theme/GlobalTheme';

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  style?: ViewStyle;
}

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

const createLoadingStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.md,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  overlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingContent: {
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
  },
  skeleton: {
    backgroundColor: theme.colors.disabled,
    overflow: 'hidden' as const,
  },
  skeletonText: {
    height: 16,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.xs,
  },
  skeletonAvatar: {
    backgroundColor: theme.colors.disabled,
    borderRadius: 999,
  },
});

// Animated shimmer effect
const useShimmerAnimation = () => {
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, [shimmerValue]);

  return shimmerValue;
};

// Main loading component
export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  children,
  size = 'medium',
  text,
  overlay = false,
  style,
  textStyle,
  color,
}) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createLoadingStyles(theme);

  const getActivityIndicatorSize = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'small';
    }
  };

  const getActivityIndicatorColor = () => {
    return color || theme.colors.primary;
  };

  if (!loading) {
    return <>{children}</>;
  }

  const loadingContent = (
    <View style={styles.loadingContent}>
      <ActivityIndicator
        size={getActivityIndicatorSize()}
        color={getActivityIndicatorColor()}
      />
      {text && (
        <Text style={[styles.loadingText, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <>
        {children}
        <View style={[
          styles.overlay,
          isDarkMode && styles.overlayDark,
          style,
        ]}>
          {loadingContent}
        </View>
      </>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loadingContent}
    </View>
  );
};

// Skeleton components
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createLoadingStyles(theme);
  const shimmerValue = useShimmerAnimation();

  const shimmerStyle = {
    opacity: shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createLoadingStyles(theme);

  return (
    <View style={style}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? '60%' : '100%'}
          style={{ marginBottom: index === lines - 1 ? 0 : theme.spacing.xs }}
        />
      ))}
    </View>
  );
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 40,
  style,
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

// Skeleton card component
interface SkeletonCardProps {
  showAvatar?: boolean;
  showImage?: boolean;
  textLines?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  showImage = false,
  textLines = 3,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
      },
      style,
    ]}>
      {showAvatar && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <SkeletonAvatar size={32} />
          <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            <Skeleton height={12} width="40%" />
            <Skeleton 
              height={10} 
              width="60%" 
              style={{ marginTop: theme.spacing.xs }} 
            />
          </View>
        </View>
      )}
      
      {showImage && (
        <Skeleton
          height={120}
          width="100%"
          borderRadius={theme.borderRadius.sm}
          style={{ marginBottom: theme.spacing.md }}
        />
      )}
      
      <SkeletonText lines={textLines} />
    </View>
  );
};

// Loading list component
interface LoadingListProps {
  itemCount?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  style?: ViewStyle;
}

export const LoadingList: React.FC<LoadingListProps> = ({
  itemCount = 5,
  showAvatar = true,
  showImage = false,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={style}>
      {Array.from({ length: itemCount }, (_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={showAvatar}
          showImage={showImage}
          textLines={2}
          style={{ marginBottom: theme.spacing.md }}
        />
      ))}
    </View>
  );
};

export default LoadingState;