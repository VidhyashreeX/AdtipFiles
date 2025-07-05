import {createNavigationContainerRef} from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Type the navigationRef with your RootStackParamList
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Enhanced navigate function with Meeting screen support
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

// Special function to navigate to Meeting screen within MainNavigator
export function navigateToMeeting(params: {
  meetingId: string;
  token: string;
  displayName: string;
  callType: 'voice' | 'video';
  isInitiator?: boolean;
  recipientName?: string;
  callData?: any;
}) {
  try {
    // ✅ CRITICAL FIX: Validate parameters
    if (!params.meetingId || !params.token || !params.displayName) {
      console.error('[NavigationService] Invalid parameters for navigateToMeeting:', params);
      return;
    }

    if (navigationRef.isReady()) {
      console.log('[NavigationService] Navigating to Meeting screen with params:', {
        meetingId: params.meetingId,
        callType: params.callType,
        displayName: params.displayName
      });
      
      // Navigate to Main navigator, then to Meeting screen
      (navigationRef as any).navigate('Main', { 
        screen: 'Meeting', 
        params: params 
      });
    } else {
      console.warn('[NavigationService] Navigation not ready, skipping navigation to Meeting');
      // ✅ CRITICAL FIX: Retry navigation after a short delay
      setTimeout(() => navigateToMeeting(params), 200);
    }
  } catch (error) {
    console.error('[NavigationService] Error in navigateToMeeting:', error);
    // ✅ CRITICAL FIX: Don't let navigation errors crash the app
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

// Enhanced navigateWithRetry for Meeting screen
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

// Enhanced navigateWithRetry specifically for Meeting screen
export function navigateToMeetingWithRetry(params: {
  meetingId: string;
  token: string;
  displayName: string;
  callType: 'voice' | 'video';
  isInitiator?: boolean;
  recipientName?: string;
  callData?: any;
}, maxRetries: number = 3, retryDelay: number = 100) {
  let retries = 0;
  
  const attemptNavigation = () => {
    if (navigationRef.isReady()) {
      // Navigate to Main navigator, then to Meeting screen
      (navigationRef as any).navigate('Main', { 
        screen: 'Meeting', 
        params: params 
      });
    } else if (retries < maxRetries) {
      retries++;
      console.log(`[NavigationService] Navigation not ready, retry ${retries}/${maxRetries} for Meeting`);
      setTimeout(attemptNavigation, retryDelay);
    } else {
      console.error('[NavigationService] Failed to navigate to Meeting after max retries');
    }
  };
  
  attemptNavigation();
}

// Add this new function specifically for notification-triggered navigation
export function navigateToMeetingFromNotification(params: {
  meetingId: string;
  token: string;
  displayName: string;
  callType: 'voice' | 'video';
  isInitiator?: boolean;
  recipientName?: string;
  callData?: any;
}) {
  // Use a more persistent retry mechanism for notification clicks
  let retries = 0;
  const maxRetries = 10;
  const retryDelay = 300;
  
  const attemptNavigation = () => {
    console.log(`[NavigationService] Attempting notification navigation (try ${retries+1}/${maxRetries})`);
    
    if (navigationRef.isReady()) {
      try {
        console.log('[NavigationService] Navigation ready, proceeding to Meeting screen');
        (navigationRef as any).navigate('Main', { 
          screen: 'Meeting', 
          params: params 
        });
      } catch (error) {
        console.error('[NavigationService] Error navigating from notification:', error);
        if (retries < maxRetries) {
          retries++;
          setTimeout(attemptNavigation, retryDelay);
        }
      }
    } else if (retries < maxRetries) {
      console.log('[NavigationService] Navigation not ready yet, retrying...');
      retries++;
      setTimeout(attemptNavigation, retryDelay);
    } else {
      console.error('[NavigationService] Failed to navigate after max retries');
    }
  };
  
  // Start the first attempt
  attemptNavigation();
}
