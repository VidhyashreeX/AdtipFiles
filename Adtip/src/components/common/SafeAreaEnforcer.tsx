/**
 * Safe Area Enforcer Component
 * 
 * This HOC ensures every screen properly handles safe areas and has transparent status bar
 */
import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { safeAreaStyles, statusBarConfig } from '../../utils/SafeAreaUtils';

interface SafeAreaEnforcerProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'light' | 'dark' | 'auto';
  fullScreen?: boolean;
}

const SafeAreaEnforcer: React.FC<SafeAreaEnforcerProps> = ({ 
  children, 
  edges = ['top', 'left', 'right'],
  statusBarStyle = 'auto',
  fullScreen = false
}) => {
  const { colors, isDarkMode } = useTheme();

  // Determine status bar style
  const getStatusBarStyle = () => {
    if (statusBarStyle === 'auto') {
      return isDarkMode ? 'light-content' : 'dark-content';
    }
    return statusBarStyle === 'light' ? 'light-content' : 'dark-content';
  };

  // Get appropriate edges for safe area
  const safeAreaEdges = fullScreen ? [] : edges;

  return (
    <>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={getStatusBarStyle()}
        hidden={fullScreen}
      />
      <SafeAreaView 
        style={[
          { flex: 1, backgroundColor: colors.background }
        ]} 
        edges={safeAreaEdges}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

/**
 * HOC to wrap any component with proper safe area
 */
export function withSafeArea<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<SafeAreaEnforcerProps, 'children'> = {}
) {
  return function SafeAreaWrappedComponent(props: P) {
    return (
      <SafeAreaEnforcer {...options}>
        <Component {...props} />
      </SafeAreaEnforcer>
    );
  };
}

export default SafeAreaEnforcer;
