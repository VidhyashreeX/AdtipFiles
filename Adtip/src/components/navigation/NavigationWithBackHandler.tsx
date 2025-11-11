import React, { useEffect, useCallback, useRef } from 'react';
import { BackHandler, Alert } from 'react-native';
import { NavigationContainer, NavigationContainerRef, useNavigationState } from '@react-navigation/native';
import { Logger } from '../../utils/ProductionLogger';

interface NavigationWithBackHandlerProps {
  children: React.ReactNode;
  navigationRef: any; // Use any to support both RefObject and NavigationContainerRefWithCurrent
  linking?: any;
  fallback?: React.ReactElement;
  onStateChange?: (state: any) => void;
  onReady?: () => void;
  initialState?: any;
}

/**
 * Enhanced NavigationContainer wrapper with global back button handling
 * Prevents app exit and shows confirmation dialog when at root screens
 */
const NavigationWithBackHandler: React.FC<NavigationWithBackHandlerProps> = ({
  children,
  navigationRef,
  linking,
  fallback,
  onStateChange,
  onReady,
  initialState,
}) => {
  const lastBackPressTime = useRef<number>(0);

  const handleBackPress = useCallback(() => {
    try {
      // Check if navigation is ready
      if (!navigationRef.current?.isReady()) {
        Logger.debug('BackHandler', 'Navigation not ready, allowing default behavior');
        return false;
      }

      // Get current route
      const currentRoute = navigationRef.current.getCurrentRoute();
      const routeName = currentRoute?.name;

      Logger.debug('BackHandler', 'Hardware back pressed', {
        currentRoute: routeName,
        canGoBack: navigationRef.current.canGoBack(),
      });

      // Check if we can go back in the navigation stack
      if (navigationRef.current.canGoBack()) {
        // Let React Navigation handle the back action
        navigationRef.current.goBack();
        return true;
      }

      // We're at the root of the navigation stack
      // Check if we're on a main tab screen
      const rootTabScreens = ['Home', 'TipTube', 'LiveStream', 'TipShorts', 'Profile'];
      const isOnRootTab = rootTabScreens.includes(routeName || '');

      // Check if we're on TabHome (the tab navigator itself)
      const isOnTabHome = routeName === 'TabHome';

      if (isOnRootTab || isOnTabHome) {
        // Double-tap to exit functionality with confirmation
        const now = Date.now();
        const DOUBLE_PRESS_INTERVAL = 2000; // 2 seconds

        if (lastBackPressTime.current && now - lastBackPressTime.current < DOUBLE_PRESS_INTERVAL) {
          // Second press within interval - show exit confirmation
          Alert.alert(
            'Exit AdTip',
            'Are you sure you want to exit?',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  lastBackPressTime.current = 0;
                },
                style: 'cancel',
              },
              {
                text: 'Exit',
                onPress: () => {
                  BackHandler.exitApp();
                },
                style: 'destructive',
              },
            ],
            { cancelable: true, onDismiss: () => {
              lastBackPressTime.current = 0;
            }}
          );
          return true;
        } else {
          // First press - record time and show toast-like message
          lastBackPressTime.current = now;
          
          // You could show a toast here if you have a toast library
          Logger.debug('BackHandler', 'Press back again to exit');
          
          // For now, just show an alert that auto-dismisses
          // Note: This is optional, you can remove this if you prefer silent double-tap
          return true;
        }
      }

      // For other root screens (Auth, Guest, etc.), navigate to home or show exit dialog
      if (routeName === 'Auth' || routeName === 'Guest') {
        // On auth/guest screens, exit the app
        Alert.alert(
          'Exit AdTip',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
        return true;
      }

      // Default: try to navigate to home
      try {
        navigationRef.current.navigate('TabHome' as never);
        return true;
      } catch (error) {
        Logger.error('BackHandler', 'Failed to navigate to home:', error);
        // If navigation fails, show exit dialog
        Alert.alert(
          'Exit AdTip',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
        return true;
      }
    } catch (error) {
      Logger.error('BackHandler', 'Error in handleBackPress:', error);
      return false;
    }
  }, [navigationRef]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [handleBackPress]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      fallback={fallback}
      onStateChange={onStateChange}
      onReady={onReady}
      initialState={initialState}
    >
      {children}
    </NavigationContainer>
  );
};

export default NavigationWithBackHandler;
