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

// Go back function
export function goBack() {
  if (navigationRef.isReady()) {
    if (navigationRef.canGoBack()) {
      navigationRef.goBack();
    } else {
      console.warn('[NavigationService] Cannot go back, no previous screen in stack');
    }
  } else {
    console.warn('[NavigationService] Navigation not ready, cannot go back');
  }
}

// Navigation guard to prevent multiple meeting navigations
let isNavigatingToMeeting = false;
let currentMeetingId: string | null = null;

// Special function to navigate to Meeting screen within MainNavigator
export function navigateToMeeting(params: {
  meetingId: string;
  token: string;
  displayName: string;
  callType: 'voice' | 'video';
  isInitiator?: boolean;
  recipientName?: string;
  callData?: any;
  localParticipantId?: string; // Add localParticipantId parameter
}) {
  try {
    // ✅ CRITICAL FIX: Validate parameters
    if (!params.meetingId || !params.token || !params.displayName) {
      console.error('[NavigationService] Invalid parameters for navigateToMeeting:', params);
      return;
    }

    // ✅ CRITICAL FIX: Prevent multiple navigation calls to the same meeting
    if (isNavigatingToMeeting && currentMeetingId === params.meetingId) {
      console.log('[NavigationService] Already navigating to meeting:', params.meetingId);
      return;
    }

    // ✅ CRITICAL FIX: Prevent navigation to different meeting while one is active
    if (isNavigatingToMeeting && currentMeetingId && currentMeetingId !== params.meetingId) {
      console.log('[NavigationService] Different meeting already active, clearing previous state');
      // Reset navigation state for new meeting
      isNavigatingToMeeting = false;
      currentMeetingId = null;
    }

    if (navigationRef.isReady()) {
      console.log('[NavigationService] Navigating to Meeting screen with params:', {
        meetingId: params.meetingId,
        callType: params.callType,
        displayName: params.displayName,
        localParticipantId: params.localParticipantId || 'not_provided' // Log participant ID
      });

      // Set navigation guard
      isNavigatingToMeeting = true;
      currentMeetingId = params.meetingId;

      // Navigate to Main navigator, then to Meeting screen
      (navigationRef as any).navigate('Main', {
        screen: 'Meeting',
        params: params
      });

      // Clear navigation guard after a delay to allow for navigation completion
      setTimeout(() => {
        isNavigatingToMeeting = false;
      }, 1000);

    } else {
      console.warn('[NavigationService] Navigation not ready, skipping navigation to Meeting');
      // ✅ CRITICAL FIX: Retry navigation after a short delay
      setTimeout(() => navigateToMeeting(params), 200);
    }
  } catch (error) {
    console.error('[NavigationService] Error in navigateToMeeting:', error);
    // Reset navigation guard on error
    isNavigatingToMeeting = false;
    currentMeetingId = null;
    // ✅ CRITICAL FIX: Don't let navigation errors crash the app
  }
}

// Function to reset navigation state (called when call ends)
export function resetMeetingNavigationState() {
  console.log('[NavigationService] Resetting meeting navigation state');
  isNavigatingToMeeting = false;
  currentMeetingId = null;
}

/**
 * Navigate to simplified meeting screen with a session ID
 */
export function navigateToMeetingSimple(params: {
  sessionId: string
}) {
  navigate('MeetingSimple', params)
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
  localParticipantId?: string; // Add localParticipantId parameter
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
  localParticipantId?: string; // Add localParticipantId parameter
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

// Add new function for background-to-foreground navigation
export function navigateToMeetingFromBackground(params: {
  meetingId: string;
  token: string;
  displayName: string;
  callType: 'voice' | 'video';
  isInitiator?: boolean;
  recipientName?: string;
  callData?: any;
  localParticipantId?: string;
}) {
  console.log('[NavigationService] Handling background-to-foreground navigation');

  // Import AppState to check current state
  import('react-native').then(({ AppState }) => {
    const handleNavigation = () => {
      console.log('[NavigationService] App state:', AppState.currentState);

      if (AppState.currentState === 'active') {
        // App is already active, navigate immediately
        navigateToMeeting(params);
      } else {
        // App is not active, wait for it to become active
        const listener = AppState.addEventListener('change', (nextAppState) => {
          if (nextAppState === 'active') {
            console.log('[NavigationService] App became active, navigating to meeting');
            listener.remove();

            // Add a small delay to ensure app is fully ready
            setTimeout(() => {
              navigateToMeeting(params);
            }, 500);
          }
        });

        // Cleanup listener after 30 seconds to prevent memory leaks
        setTimeout(() => {
          listener.remove();
        }, 30000);
      }
    };

    handleNavigation();
  }).catch(error => {
    console.error('[NavigationService] Error importing AppState:', error);
    // Fallback to regular navigation
    navigateToMeeting(params);
  });
}

// ✅ CRITICAL FIX: Force navigation back to TipCall screen after call ends
export function navigateToTipCall() {
  try {
    console.log('[NavigationService] Forcing navigation back to TipCallSimple screen');

    // Reset meeting navigation state
    resetMeetingNavigationState();

    if (navigationRef.isReady()) {
      // Reset to TipCall screen - this ensures we're back to the main call screen
      (navigationRef as any).reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            params: {
              screen: 'TipCallSimple'
            }
          }
        ],
      });
      console.log('[NavigationService] Successfully navigated back to TipCallSimple');
    } else {
      console.warn('[NavigationService] Navigation not ready, retrying in 200ms');
      setTimeout(navigateToTipCall, 200);
    }
  } catch (error) {
    console.error('[NavigationService] Error navigating to TipCall:', error);
    // Fallback: try to navigate to Main screen
    try {
      (navigationRef as any).navigate('Main', { screen: 'TipCallSimple' });
    } catch (fallbackError) {
      console.error('[NavigationService] Fallback navigation also failed:', fallbackError);
    }
  }
}
