import {createNavigationContainerRef} from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Type the navigationRef with your RootStackParamList
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Update helper functions to be more type-safe or rely on direct, typed navigationRef usage
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  } else {
    console.warn('[NavigationService] Navigation not ready, skipping navigation to:', name);
  }
}

export function resetTo<RouteName extends keyof RootStackParamList>(
  routeName: RouteName,
  // This assumes params are optional or match the structure.
  // For routes that are navigators (like 'Main' or 'Auth'), params would be NavigatorScreenParams
  params?: RootStackParamList[RouteName] 
) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      // @ts-ignore
      routes: [{name: routeName, params: params}],
    });
  } else {
    console.warn('[NavigationService] Navigation not ready, skipping reset to:', routeName);
  }
}

// Add helper function to check if navigation is ready
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}

// Add helper function to get current route safely
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}

// Add helper function to navigate with retry logic
export function navigateWithRetry<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
  maxRetries: number = 3,
  retryDelay: number = 100
) {
  let retries = 0;
  
  const attemptNavigation = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name as any, params as any);
    } else if (retries < maxRetries) {
      retries++;
      console.log(`[NavigationService] Navigation not ready, retry ${retries}/${maxRetries} for:`, name);
      setTimeout(attemptNavigation, retryDelay);
    } else {
      console.error('[NavigationService] Failed to navigate after max retries:', name);
    }
  };
  
  attemptNavigation();
}
