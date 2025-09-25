// src/components/common/StatusIndicator.tsx - Comprehensive status indicators

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from 'react-native';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Info, 
  Clock,
  Wifi,
  WifiOff,
  User,
  UserX,
  Circle,
  Radio,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../theme/GlobalTheme';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'pending'
  | 'online'
  | 'offline'
  | 'busy'
  | 'away'
  | 'live'
  | 'connecting'
  | 'neutral';

export type StatusSize = 'small' | 'medium' | 'large';

interface StatusIndicatorProps {
  type: StatusType;
  size?: StatusSize;
  text?: string;
  showIcon?: boolean;
  animated?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface BadgeIndicatorProps {
  type: StatusType;
  size?: StatusSize;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  style?: ViewStyle;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  size?: StatusSize;
  showText?: boolean;
  style?: ViewStyle;
}

interface UserStatusProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: StatusSize;
  showBorder?: boolean;
  style?: ViewStyle;
}

const createStatusStyles = (theme: Theme) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  large: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  textSmall: {
    fontSize: theme.typography.fontSize.xs,
  },
  textMedium: {
    fontSize: theme.typography.fontSize.sm,
  },
  textLarge: {
    fontSize: theme.typography.fontSize.md,
  },
  // Status colors
  success: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  error: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error,
  },
  warning: {
    backgroundColor: theme.colors.warning + '20',
    borderColor: theme.colors.warning,
  },
  info: {
    backgroundColor: theme.colors.info + '20',
    borderColor: theme.colors.info,
  },
  pending: {
    backgroundColor: theme.colors.text.tertiary + '20',
    borderColor: theme.colors.text.tertiary,
  },
  online: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  offline: {
    backgroundColor: theme.colors.text.tertiary + '20',
    borderColor: theme.colors.text.tertiary,
  },
  busy: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error,
  },
  away: {
    backgroundColor: theme.colors.warning + '20',
    borderColor: theme.colors.warning,
  },
  live: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error,
  },
  connecting: {
    backgroundColor: theme.colors.info + '20',
    borderColor: theme.colors.info,
  },
  neutral: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.border,
  },
  // Text colors
  successText: { color: theme.colors.success },
  errorText: { color: theme.colors.error },
  warningText: { color: theme.colors.warning },
  infoText: { color: theme.colors.info },
  pendingText: { color: theme.colors.text.tertiary },
  onlineText: { color: theme.colors.success },
  offlineText: { color: theme.colors.text.tertiary },
  busyText: { color: theme.colors.error },
  awayText: { color: theme.colors.warning },
  liveText: { color: theme.colors.error },
  connectingText: { color: theme.colors.info },
  neutralText: { color: theme.colors.text.secondary },
  // Dot indicators
  dot: {
    borderRadius: 999,
  },
  dotSmall: { width: 6, height: 6 },
  dotMedium: { width: 8, height: 8 },
  dotLarge: { width: 12, height: 12 },
  // Badge styles
  badgeContainer: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
});

// Pulse animation hook
const usePulseAnimation = (enabled: boolean = false) => {
  const pulseValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!enabled) return;

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [enabled, pulseValue]);

  return pulseValue;
};

// Get icon for status type
const getStatusIcon = (type: StatusType, size: number = 16) => {
  const iconProps = { size, color: 'currentColor' };
  
  switch (type) {
    case 'success': return <CheckCircle2 {...iconProps} />;
    case 'error': return <XCircle {...iconProps} />;
    case 'warning': return <AlertCircle {...iconProps} />;
    case 'info': return <Info {...iconProps} />;
    case 'pending': return <Clock {...iconProps} />;
    case 'online': return <Wifi {...iconProps} />;
    case 'offline': return <WifiOff {...iconProps} />;
    case 'busy': return <UserX {...iconProps} />;
    case 'away': return <User {...iconProps} />;
    case 'live': return <Radio {...iconProps} />;
    case 'connecting': return <Circle {...iconProps} />;
    default: return <Circle {...iconProps} />;
  }
};

// Get icon size based on component size
const getIconSize = (size: StatusSize): number => {
  switch (size) {
    case 'small': return 12;
    case 'large': return 20;
    default: return 16;
  }
};

// Main status indicator component
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  size = 'medium',
  text,
  showIcon = true,
  animated = false,
  style,
  textStyle,
  iconColor,
  backgroundColor,
  borderColor,
}) => {
  const { theme } = useTheme();
  const styles = createStatusStyles(theme);
  const pulseScale = usePulseAnimation(animated);

  const containerStyles = [
    styles.badge,
    styles[size],
    styles[type],
    backgroundColor && { backgroundColor },
    borderColor && { borderColor, borderWidth: 1 },
    style,
  ];

  const textStyles = [
    styles.text,
    size === 'small' ? styles.textSmall : size === 'large' ? styles.textLarge : styles.textMedium,
    styles[`${type}Text` as keyof typeof styles] as any,
    textStyle,
  ];

  const iconSize = getIconSize(size);

  return (
    <Animated.View 
      style={[
        containerStyles,
        animated && { transform: [{ scale: pulseScale }] }
      ]}
    >
      {showIcon && (
        <View>
          {getStatusIcon(type, iconSize)}
        </View>
      )}
      {text && <Text style={textStyles}>{text}</Text>}
    </Animated.View>
  );
};

// Badge indicator component
export const BadgeIndicator: React.FC<BadgeIndicatorProps> = ({
  type,
  size = 'medium',
  count = 0,
  maxCount = 99,
  showZero = false,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStatusStyles(theme);

  if (!showZero && count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const backgroundColor = styles[type].borderColor;

  return (
    <View style={[
      styles.badgeContainer,
      { backgroundColor },
      style,
    ]}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

// Connection status component
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting = false,
  size = 'medium',
  showText = false,
  style,
}) => {
  const getStatusType = (): StatusType => {
    if (isConnecting) return 'connecting';
    return isConnected ? 'online' : 'offline';
  };

  const getStatusText = (): string => {
    if (isConnecting) return 'Connecting...';
    return isConnected ? 'Online' : 'Offline';
  };

  return (
    <StatusIndicator
      type={getStatusType()}
      size={size}
      text={showText ? getStatusText() : undefined}
      animated={isConnecting}
      style={style}
    />
  );
};

// User status dot component
export const UserStatus: React.FC<UserStatusProps> = ({
  status,
  size = 'medium',
  showBorder = true,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStatusStyles(theme);

  const dotSize = size === 'small' ? styles.dotSmall : size === 'large' ? styles.dotLarge : styles.dotMedium;
  const statusColor = (styles[status as keyof typeof styles] as any).borderColor;

  return (
    <View style={[
      styles.dot,
      dotSize,
      { backgroundColor: statusColor },
      showBorder && {
        borderWidth: 2,
        borderColor: theme.colors.surface,
      },
      style,
    ]} />
  );
};

// Live indicator component
export const LiveIndicator: React.FC<{ size?: StatusSize; style?: ViewStyle }> = ({
  size = 'medium',
  style,
}) => {
  return (
    <StatusIndicator
      type="live"
      size={size}
      text="LIVE"
      animated={true}
      style={style}
    />
  );
};

export default {
  StatusIndicator,
  BadgeIndicator,
  ConnectionStatus,
  UserStatus,
  LiveIndicator,
};