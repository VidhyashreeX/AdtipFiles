import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

interface BackHandlerOptions {
  screenType?: 'call' | 'profile' | 'chat' | 'default';
  fallbackRoute?: string;
  onCustomBack?: () => boolean; // Return true if handled, false to use default
}

/**
 * Custom back button handler that provides dynamic navigation based on screen type
 * and navigation source tracking
 */
export const useCustomBackHandler = (options: BackHandlerOptions = {}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { screenType = 'default', fallbackRoute = 'Home', onCustomBack } = options;

  const handleBackPress = useCallback(() => {
    // Allow custom handling first
    if (onCustomBack && onCustomBack()) {
      return true; // Custom handler handled it
    }

    const params = route.params as any;
    const navigationSource = params?.from || params?.source || params?.navigationSource;

    console.log('[BackHandler] Handling back press:', {
      screenType,
      currentRoute: route.name,
      navigationSource,
      params
    });

    switch (screenType) {
      case 'call': {
        // For call screens, navigate based on source or to contacts/home
        if (navigationSource) {
          if (navigationSource === 'contacts' || navigationSource === 'ContactsList') {
            navigation.navigate('TipCall' as never);
          } else if (navigationSource === 'profile' || navigationSource === 'UserProfile') {
            navigation.goBack();
          } else if (navigationSource === 'chat') {
            navigation.navigate('ChatList' as never);
          } else {
            navigation.navigate(navigationSource as never);
          }
        } else {
          // Default: go to TipCall stack screen, not tab
          navigation.navigate('TipCall' as never);
        }
        return true;
      }

      case 'profile': {
        // For profile screens, check navigation source
        if (navigationSource) {
          if (navigationSource === 'call' || navigationSource === 'TipCall') {
            navigation.navigate('TipCall' as never);
          } else if (navigationSource === 'chat' || navigationSource === 'ChatScreen') {
            navigation.goBack();
          } else if (navigationSource === 'search' || navigationSource === 'SearchResults') {
            navigation.goBack();
          } else if (navigationSource === 'home' || navigationSource === 'Home') {
            navigation.navigate('Home' as never);
          } else {
            navigation.navigate(navigationSource as never);
          }
        } else {
          // Default: go back if possible, otherwise to home
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(fallbackRoute as never);
          }
        }
        return true;
      }

      case 'chat': {
        // For chat screens, go back to chat list or source
        if (navigationSource) {
          navigation.navigate(navigationSource as never);
        } else {
          navigation.navigate('ChatList' as never);
        }
        return true;
      }

      default: {
        // Default behavior: go back if possible, otherwise to fallback
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: fallbackRoute }],
            })
          );
        }
        return true;
      }
    }
  }, [navigation, route, screenType, fallbackRoute, onCustomBack]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  return handleBackPress;
};

/**
 * Helper function to navigate with source tracking
 */
export const navigateWithSource = (
  navigation: any,
  targetScreen: string,
  params: any = {},
  sourceScreen: string
) => {
  navigation.navigate(targetScreen, {
    ...params,
    from: sourceScreen,
    source: sourceScreen,
    navigationSource: sourceScreen
  });
};