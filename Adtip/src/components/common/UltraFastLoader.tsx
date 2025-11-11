/**
 * Ultra-Fast App Initialization Component
 * 
 * This component ensures instant app rendering while services initialize in the background.
 * It also determines the correct initial screen based on authentication state:
 * - Authenticated users see the home screen immediately
 * - Non-authenticated users see the onboarding screen
 * No loading screens, no blocking initialization - just immediate UI.
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { safeAreaStyles, statusBarConfig } from '../../utils/SafeAreaUtils';
import { navigationRef, resetTo } from '../../navigation/NavigationService';
import Sidebar from '../sidebar/Sidebar';
import NavigationErrorBoundary from './NavigationErrorBoundary';
import NavigationWithBackHandler from '../navigation/NavigationWithBackHandler';
import { Logger } from '../../utils/ProductionLogger';

// Import navigation screens
import MainNavigator from '../../navigation/MainNavigator';
import AuthNavigator from '../../navigation/AuthNavigator';
import GuestNavigator from '../../navigation/GuestNavigator';
import { RootStackParamList } from '../../types/navigation';

// State machine for navigation
import { useNavigationMachine } from '../../hooks/useNavigationMachine';

// ✅ ENHANCED LOADING
import AppLaunchLoader from './AppLaunchLoader';
import { useNavigationErrorHandler } from '../../hooks/useNavigationErrorHandler';

// Navigation persistence
import NavigationPersistenceService from '../../services/NavigationPersistenceService';

// Simplified deep linking
import SimplifiedDeepLinkService from '../../services/SimplifiedDeepLinkService';

// Navigation analytics
import NavigationAnalyticsService from '../../services/NavigationAnalyticsService';

interface UltraFastLoaderProps {
  onInitializationComplete?: () => void;
}

// Helper function to check if app was launched from killed state
const checkIfLaunchedFromKilledState = async (): Promise<boolean> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const lastAppState = await AsyncStorage.getItem('lastAppState');
    const lastActiveTime = await AsyncStorage.getItem('lastActiveTime');
    const currentTime = Date.now();

    // If no last state or it's been more than 30 seconds, consider it killed state
    if (!lastAppState || !lastActiveTime) {
      return true;
    }

    const timeDiff = currentTime - parseInt(lastActiveTime, 10);
    return timeDiff > 30000; // 30 seconds threshold
  } catch (error) {
    Logger.warn('UltraFastLoader', 'Error checking killed state:', error);
    return true; // Assume killed state on error for safety
  }
};

// Create the RootStack inside UltraFastLoader
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ✅ ENHANCED LOADING SCREEN - App logo with pulsing animation
const InitialLoadingScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      <AppLaunchLoader message="Initializing..." />
    </View>
  );
};

const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({
  onInitializationComplete
}) => {
  const { colors, isDarkMode } = useTheme();
  const { exitGuestMode } = useAuth();

  // ✅ PERFORMANCE FIX: Use navigation state machine instead of complex boolean logic
  const {
    currentState,
    navigatorComponent,
    isInitialized,
    shouldShowSidebar,
  } = useNavigationMachine();

  // ✅ RELIABILITY FIX: Add navigation error handling
  useNavigationErrorHandler();

  // ✅ PERSISTENCE: Add navigation state persistence
  const [initialState, setInitialState] = useState<any>(undefined);
  const [isStateRestored, setIsStateRestored] = useState(false);

  const [isNavReady, setIsNavReady] = useState(false);
  const onInitializationCompleteRef = useRef<(() => void) | null>(null);

  // Store onInitializationComplete in ref to avoid effect re-runs
  onInitializationCompleteRef.current = onInitializationComplete || null;

  // Back button handling is now managed by NavigationWithBackHandler component
  // which provides intelligent back button behavior based on navigation state

  // ✅ SIMPLIFIED: Log state changes using state machine
  useEffect(() => {
    Logger.debug('UltraFastLoader', 'Navigation state changed:', {
      currentState,
      navigatorComponent,
      isInitialized
    });
  }, [currentState, navigatorComponent, isInitialized]);

  // ✅ PERSISTENCE: Restore navigation state on app start with killed state detection
  useEffect(() => {
    const restoreState = async () => {
      try {
        // Check if app was launched from killed state
        const isKilledState = await checkIfLaunchedFromKilledState();

        if (isKilledState) {
          Logger.info('UltraFastLoader', 'App launched from killed state, ensuring proper initialization');
          // Don't restore navigation state for killed state to prevent conflicts
          setIsStateRestored(true);
          return;
        }

        if (NavigationPersistenceService.shouldRestoreState()) {
          const restoredState = await NavigationPersistenceService.restoreNavigationState();
          if (restoredState) {
            setInitialState(restoredState);
            Logger.debug('UltraFastLoader', 'Navigation state restored from persistence');
          }
        }
      } catch (error) {
        Logger.error('UltraFastLoader', 'Failed to restore navigation state:', error);
      } finally {
        setIsStateRestored(true);
      }
    };

    restoreState();
  }, []);

  // ✅ DEEP LINKING: Initialize simplified deep link service
  useEffect(() => {
    const cleanup = SimplifiedDeepLinkService.initialize();
    return cleanup;
  }, []);

  // ✅ ANALYTICS: Initialize navigation analytics
  useEffect(() => {
    const analytics = NavigationAnalyticsService.getInstance();
    analytics.loadPersistedEvents();
    analytics.resetSession();

    return () => {
      analytics.persistEvents();
    };
  }, []);

  // ✅ DEEP LINKING: Process pending links when navigation is ready
  useEffect(() => {
    if (isNavReady) {
      SimplifiedDeepLinkService.processPendingLink();
    }
  }, [isNavReady]);

  // ✅ BACKUP KILLED STATE NOTIFICATION HANDLER
  // This is a secondary check in case App.tsx handler misses the notification
  useEffect(() => {
    if (!isNavReady || !navigationRef.isReady()) return;

    const checkForKilledStateNotification = async () => {
      try {
        // Only run this check once when navigation becomes ready
        const hasChecked = await require('@react-native-async-storage/async-storage').default.getItem('killedStateNotificationChecked');
        if (hasChecked) return;

        const messaging = require('@react-native-firebase/messaging').default;
        const initialNotification = await messaging().getInitialNotification();

        if (initialNotification?.data?.type === 'incoming_call') {
          Logger.info('UltraFastLoader', '🔥 BACKUP: Killed state notification detected in UltraFastLoader');

          // Extract and validate FCM notification data with proper type safety
          const rawData = initialNotification.data;
          const meetingId = typeof rawData.meetingId === 'string' ? rawData.meetingId : '';
          const token = typeof rawData.token === 'string' ? rawData.token : '';
          const callerName = typeof rawData.callerName === 'string' ? rawData.callerName : '';
          const rawCallType = typeof rawData.callType === 'string' ? rawData.callType : 'voice';
          const callType: 'voice' | 'video' = rawCallType === 'video' ? 'video' : 'voice';
          const sessionId = typeof rawData.sessionId === 'string' ? rawData.sessionId : '';

          if (meetingId && token && callerName) {
            Logger.info('UltraFastLoader', '🔥 BACKUP: Processing killed state notification');
            
            // Import navigation service
            const { default: NavigationService } = await import('../../navigation/SimplifiedNavigationService');
            
            const navigationSuccess = NavigationService.navigateToMeeting({
              meetingId,
              token,
              displayName: 'Me',
              callType,
              isInitiator: false,
              recipientName: callerName,
              callData: {
                sessionId: sessionId || `backup-killed-state-${Date.now()}`,
                direction: 'incoming',
                type: callType,
                callerName,
                fromKilledState: true
              }
            });

            if (navigationSuccess) {
              Logger.info('UltraFastLoader', '✅ BACKUP: Successfully navigated to Meeting screen from killed state');
            }
          }
        }

        // Mark as checked to prevent duplicate processing
        await require('@react-native-async-storage/async-storage').default.setItem('killedStateNotificationChecked', 'true');
        
        // Clear the flag after a delay to allow future notifications
        setTimeout(async () => {
          await require('@react-native-async-storage/async-storage').default.removeItem('killedStateNotificationChecked');
        }, 30000); // 30 second window

      } catch (error) {
        Logger.error('UltraFastLoader', 'Backup killed state notification check failed:', error);
      }
    };

    // Run backup check after a small delay to ensure App.tsx has had time to process
    setTimeout(checkForKilledStateNotification, 2000);
  }, [isNavReady]);

  // ✅ SIMPLIFIED: Initialization handled by state machine
  useEffect(() => {
    // Notify completion if callback provided
    if (isInitialized && onInitializationCompleteRef.current) {
      onInitializationCompleteRef.current();
    }
  }, [isInitialized]);

  /*
  // Handle active call navigation
  useEffect(() => {
    console.log('[UltraFastLoader] activeCall changed:', activeCall);
    if (!isNavReady || !activeCall || !navigationRef.isReady()) return;
    
    // CRITICAL FIX: Check if call is in an ending state to prevent navigation back to MeetingScreen
    const isCallEnding = activeCall.status === 'ended';
    const isCallCleanup = activeCall.status === 'cleanup_pending';
    const isCallIdle = activeCall.status === 'idle';
    
    if (isCallEnding || isCallCleanup || isCallIdle) {
      console.log('[UltraFastLoader] Call is ending/ended, skipping navigation to avoid redirect back to MeetingScreen. Status:', activeCall.status);
      return;
    }
    
    // Only navigate if the call is in a state that requires the meeting screen
    const shouldNavigate = activeCall.status === 'connected' || 
                           activeCall.status === 'connecting' ||
                           (activeCall.status === 'ringing' && !activeCall.isInitiator) ||
                           (activeCall.status === 'dialing' && activeCall.isInitiator);

    if (shouldNavigate) {
      console.log('[UltraFastLoader] Active call detected, navigating to Meeting screen. Status:', activeCall.status);
      
      if (activeCall.meetingId && activeCall.token) {
        const navigationParams = {
          meetingId: activeCall.meetingId,
          token: activeCall.token,
          callType: activeCall.callType || 'voice',
          displayName: activeCall.isInitiator ? activeCall.recipientName : activeCall.callerName,
          recipientName: activeCall.recipientName || 'Participant',
          isInitiator: activeCall.isInitiator || false,
        };
        
        // Use a timeout to ensure the navigation container is fully ready
        setTimeout(() => {
          if (navigationRef.isReady()) {
            // Check current route to avoid redundant navigation
            const currentRoute = navigationRef.getCurrentRoute();
            if (currentRoute?.name !== 'Meeting') {
              console.log('[UltraFastLoader] Navigating to Meeting screen');
              (navigationRef as any).navigate('Main', {
                screen: 'Meeting',
                params: navigationParams,
              });
            } else {
              console.log('[UltraFastLoader] Already on Meeting screen, skipping navigation');
            }
          }
        }, 150);
      }
    }
  }, [activeCall, isNavReady]);
  */

  // ✅ REMOVED: Fallback logic handled by state machine

  // --- START: Replace the entire return logic with this ---
  return (
    <SafeAreaView
      style={[
        safeAreaStyles.container,
        { backgroundColor: colors.background }
      ]}
      edges={safeAreaStyles.container.edges}
    >
      <StatusBar
        {...(isDarkMode ? statusBarConfig.dark : statusBarConfig.light)}
      />

      <NavigationErrorBoundary>
        <NavigationWithBackHandler
          navigationRef={navigationRef}
          initialState={initialState}
          onStateChange={(state: any) => {
            // Save navigation state for persistence
            if (state && isStateRestored) {
              NavigationPersistenceService.saveNavigationState(state);
            }

            // Track navigation analytics
            if (state) {
              const currentRoute = state.routes[state.index];
              if (currentRoute) {
                NavigationAnalyticsService.getInstance().trackScreenView(
                  currentRoute.name,
                  currentRoute.params
                );
              }
            }
          }}
          onReady={() => {
            Logger.info('UltraFastLoader', '✅ Navigation is ready');
            setIsNavReady(true);
          }}
          fallback={<InitialLoadingScreen />}
        >
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {/* ✅ PERFORMANCE FIX: Simplified rendering using state machine */}
          {navigatorComponent === 'InitialLoading' && (
            <>
              {Logger.debug('UltraFastLoader', '🔄 Showing InitialLoading screen')}
              <RootStack.Screen name="InitialLoading" component={InitialLoadingScreen} />
            </>
          )}
          {navigatorComponent === 'Main' && (
            <>
              {Logger.debug('UltraFastLoader', '✅ Rendering MainNavigator for authenticated user')}
              <RootStack.Screen name="Main" component={MainNavigator} />
            </>
          )}
          {navigatorComponent === 'Guest' && (
            <>
              {Logger.debug('UltraFastLoader', '👤 Rendering GuestNavigator for guest user')}
              <RootStack.Screen name="Guest" component={GuestNavigator} />
            </>
          )}
          {navigatorComponent === 'Auth' && (
            <>
              {Logger.debug('UltraFastLoader', '🆕 Rendering AuthNavigator')}
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            </>
          )}
        </RootStack.Navigator>
        
        {/* ✅ SIMPLIFIED: Show sidebar using state machine */}
        {shouldShowSidebar && <Sidebar />}
        </NavigationWithBackHandler>
      </NavigationErrorBoundary>
    </SafeAreaView>
  );
  // --- END: Replacement ---
};

export default UltraFastLoader;
