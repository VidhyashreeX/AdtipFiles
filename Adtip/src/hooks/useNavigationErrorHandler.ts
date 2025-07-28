// src/hooks/useNavigationErrorHandler.ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { navigationRef } from '../navigation/NavigationService';
import { Logger } from '../utils/ProductionLogger';
import NavigationAnalyticsService from '../services/NavigationAnalyticsService';

interface NavigationError {
  message: string;
  stack?: string;
  route?: string;
}

export const useNavigationErrorHandler = () => {
  useEffect(() => {
    // Handle navigation state errors
    const unsubscribe = navigationRef.addListener('state', (e) => {
      try {
        // Validate navigation state
        if (!e.data?.state) {
          throw new Error('Invalid navigation state received');
        }

        // Check for circular navigation
        const routes = e.data.state.routes || [];
        const routeNames = routes.map((route: any) => route.name);
        const uniqueRoutes = new Set(routeNames);
        
        if (routeNames.length > uniqueRoutes.size + 2) {
          Logger.warn('NavigationErrorHandler', 'Potential circular navigation detected:', routeNames);
        }

        // Check for deep nesting (potential memory leak)
        if (routes.length > 10) {
          Logger.warn('NavigationErrorHandler', 'Deep navigation stack detected:', routes.length);
        }

      } catch (error) {
        handleNavigationError({
          message: error instanceof Error ? error.message : 'Unknown navigation error',
          stack: error instanceof Error ? error.stack : undefined,
          route: navigationRef.getCurrentRoute()?.name,
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleNavigationError = (error: NavigationError) => {
    Logger.error('NavigationErrorHandler', 'Navigation error:', error);

    // Track error in analytics
    NavigationAnalyticsService.getInstance().trackNavigationError(
      error.message,
      error.route,
      { stack: error.stack }
    );

    // Try to recover gracefully
    try {
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        
        // If we're in a problematic state, reset to safe route
        if (currentRoute && isProblematicRoute(currentRoute.name)) {
          resetToSafeRoute();
        }
      }
    } catch (recoveryError) {
      Logger.error('NavigationErrorHandler', 'Failed to recover from navigation error:', recoveryError);
      showErrorAlert();
    }
  };

  const isProblematicRoute = (routeName: string): boolean => {
    // Define routes that commonly cause issues
    const problematicRoutes = [
      'undefined',
      'null',
      '',
    ];
    
    return problematicRoutes.includes(routeName);
  };

  const resetToSafeRoute = () => {
    try {
      // Determine safe route based on current context
      const currentRoute = navigationRef.getCurrentRoute();
      
      if (currentRoute?.name?.includes('Auth') || currentRoute?.name?.includes('Guest')) {
        // Reset to auth flow
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      } else {
        // Reset to main app
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Home' } }],
        });
      }
      
      Logger.info('NavigationErrorHandler', 'Successfully reset to safe route');
    } catch (error) {
      Logger.error('NavigationErrorHandler', 'Failed to reset to safe route:', error);
      throw error;
    }
  };

  const showErrorAlert = () => {
    Alert.alert(
      'Navigation Error',
      'The app encountered a navigation error. We\'ll try to fix it automatically.',
      [
        {
          text: 'Go to Home',
          onPress: () => {
            try {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'Main', params: { screen: 'Home' } }],
              });
            } catch (error) {
              Logger.error('NavigationErrorHandler', 'Failed to navigate to home:', error);
            }
          },
        },
        {
          text: 'Restart App',
          style: 'destructive',
          onPress: () => {
            try {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              Logger.error('NavigationErrorHandler', 'Failed to restart app:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return {
    handleNavigationError,
    resetToSafeRoute,
  };
};
