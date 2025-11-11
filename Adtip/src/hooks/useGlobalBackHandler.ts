import { useEffect, useCallback, useRef } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';

/**
 * Global back handler that prevents app exit and shows confirmation dialog
 * when user is at the bottom of the navigation stack (on root/tab screens)
 */
export const useGlobalBackHandler = () => {
  const navigation = useNavigation();
  const lastBackPress = useRef<number>(0);
  const backPressCount = useRef<number>(0);

  // Get current route to check if we're on a tab screen
  const currentRoute = useNavigationState(state => {
    if (!state) return null;
    
    // Get the current route from the navigation state
    let route: any = state.routes[state.index];
    
    // If there's a nested navigator, get the deepest route
    while (route?.state?.routes && typeof route.state.index === 'number') {
      route = route.state.routes[route.state.index];
    }
    
    return route;
  });

  const isOnTabScreen = useCallback(() => {
    // Check if we're on one of the main tab screens
    const tabScreens = ['Home', 'TipTube', 'LiveStream', 'TipShorts', 'Profile'];
    return currentRoute && tabScreens.includes(currentRoute.name);
  }, [currentRoute]);

  const showExitConfirmation = useCallback(() => {
    Alert.alert(
      'Exit AdTip',
      'Are you sure you want to exit the app?',
      [
        {
          text: 'Cancel',
          onPress: () => {
            // Reset counter when user cancels
            backPressCount.current = 0;
          },
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
  }, []);

  const handleBackPress = useCallback(() => {
    const now = Date.now();
    
    // Check if we can go back in the navigation stack
    if (navigation.canGoBack()) {
      // Let the navigation handle it
      return false;
    }

    // We're at the bottom of the stack
    // Check if we're on a tab screen
    if (isOnTabScreen()) {
      // Show exit confirmation
      showExitConfirmation();
      return true; // Prevent default back behavior
    }

    // For non-tab screens at bottom of stack, try to navigate to home
    try {
      navigation.navigate('TabHome' as never);
      return true;
    } catch (error) {
      // If navigation fails, show exit confirmation
      showExitConfirmation();
      return true;
    }
  }, [navigation, isOnTabScreen, showExitConfirmation]);

  useEffect(() => {
    // Add back handler with lower priority (will be called after screen-specific handlers)
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => subscription.remove();
  }, [handleBackPress]);
};
