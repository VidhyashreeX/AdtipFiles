/**
 * Ultra-Fast App Initialization Component
 * 
 * This component ensures instant app rendering while services initialize in the background.
 * It also determines the correct initial screen based on authentication state:
 * - Authenticated users see the home screen immediately
 * - Non-authenticated users see the onboarding screen
 * No loading screens, no blocking initialization - just immediate UI.
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, StatusBar, Animated, Image, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCallStore } from '../../stores/callStoreSimplified';
import { safeAreaStyles, statusBarConfig } from '../../utils/SafeAreaUtils';
import { navigationRef, resetTo } from '../../navigation/NavigationService';
import Sidebar from '../sidebar/Sidebar';

// Import navigation screens
import MainNavigator from '../../navigation/MainNavigator';
import AuthNavigator from '../../navigation/AuthNavigator';
import GuestNavigator from '../../navigation/GuestNavigator';
import { RootStackParamList } from '../../types/navigation';

interface UltraFastLoaderProps {
  onInitializationComplete?: () => void;
}

// Create the RootStack inside UltraFastLoader
const RootStack = createNativeStackNavigator<RootStackParamList>();

const InitialLoadingScreen = () => {
  const { colors } = useTheme();
  const pulseAnimation = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 0.95, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Animated.Image
        // Assuming this is the correct path from LoginScreen.tsx
        source={require('../../assets/images/logo.png')}
        style={{ width: 150, height: 150, transform: [{ scale: pulseAnimation }] }}
        resizeMode="contain"
      />
    </View>
  );
};

const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({ 
  onInitializationComplete 
}) => {
  const { colors, isDarkMode } = useTheme();
  const { isAuthenticated, isGuest, isInitialized, user, exitGuestMode } = useAuth();
  const session = useCallStore(state => state.session);
  const [isVisible, setIsVisible] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isNavReady, setIsNavReady] = useState(false);
  const initStartTime = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const onInitializationCompleteRef = useRef<(() => void) | null>(null);
  const previousStateRef = useRef<any>(null);

  // Initialize start time only once
  if (initStartTime.current === null) {
    initStartTime.current = Date.now();
  }

  // Memoize user-related values to prevent unnecessary re-renders
  const userHasName = !!user?.name;
  const userSaveStatus = user?.isSaveUserDetails;

  // Store onInitializationComplete in ref to avoid effect re-runs
  onInitializationCompleteRef.current = onInitializationComplete || null;

  // Determine which screen to show based on authentication state
  // Authenticated users go to MainNavigator, guest users go to GuestNavigator
  const shouldShowMainApp = isAuthenticated && userHasName && userSaveStatus === 1;
  const shouldShowGuestApp = isGuest;

  // Global back button handler
  useEffect(() => {
    const backAction = () => {
      // Only handle back button when navigation is ready and initialized
      if (!isNavReady || !isInitialized) {
        return false;
      }

      // Check if navigation can go back
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        // Let the default back action happen
        return false;
      }

      // Handle the case when there's no previous screen to go back to
      if (shouldShowMainApp) {
        // For logged-in users: Show exit app alert
        Alert.alert(
          'Exit App',
          'Do you want to exit the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true; // Prevent default back action
      } else if (shouldShowGuestApp) {
        // For guest users: Exit guest mode and navigate back to onboarding screens
        try {
          console.log('[UltraFastLoader] Guest mode back button - exiting guest mode and returning to onboarding');
          exitGuestMode().then(() => {
            resetTo('Auth');
          }).catch((error) => {
            console.error('[UltraFastLoader] Error exiting guest mode:', error);
            // Still try to navigate to onboarding even if exitGuestMode fails
            resetTo('Auth');
          });
          return true; // Prevent default back action
        } catch (error) {
          console.error('[UltraFastLoader] Error handling guest mode back button:', error);
          return false;
        }
      }

      // For other cases (like onboarding), allow default behavior
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isNavReady, isInitialized, shouldShowMainApp, shouldShowGuestApp, exitGuestMode]);

  // Use useMemo to prevent excessive logging
  const renderingState = useMemo(() => ({
    shouldShowMainApp,
    shouldShowGuestApp,
    isAuthenticated,
    isGuest,
    hasUserName: userHasName,
    isSaveUserDetails: userSaveStatus,
    userProfileComplete: !!(userHasName && userSaveStatus === 1)
  }), [shouldShowMainApp, shouldShowGuestApp, isAuthenticated, isGuest, userHasName, userSaveStatus]);

  // Only log when state changes
  useEffect(() => {
    const currentState = JSON.stringify(renderingState);
    const previousState = previousStateRef.current;
    
    if (previousState !== currentState) {
      console.log('[UltraFastLoader] Rendering screen:', renderingState);
      previousStateRef.current = currentState;
    }
  }, [renderingState]);

  // Initialization effect - runs only once
  useEffect(() => {
    // Only run initialization once
    if (hasInitializedRef.current) return;
    
    hasInitializedRef.current = true;
    
    // Immediate visibility - no delays
    setIsVisible(true);
    
    // Background initialization without blocking UI
    const initializeServices = async () => {
      try {
        // All services run in background - UI is already visible
        const renderTime = Date.now() - (initStartTime.current || Date.now());
        
        // Only log significant render times to reduce console spam
        if (renderTime > 100) {
          console.log('[UltraFastLoader] App rendered in:', renderTime, 'ms');
        }
        
        // Log authentication state once
        console.log('[UltraFastLoader] Authentication state:', {
          isAuthenticated,
          isInitialized,
          hasUserName: userHasName,
          userStatus: userSaveStatus
        });
        
        // Mark as initialized
        setHasInitialized(true);
        
        // Notify completion if callback provided
        if (onInitializationCompleteRef.current) {
          onInitializationCompleteRef.current();
        }
      } catch (error) {
        console.error('[UltraFastLoader] Background initialization error:', error);
        // Don't block UI even if services fail
        setHasInitialized(true);
      }
    };

    // Start background initialization immediately
    initializeServices();
  }, []); // Empty dependency array - only run once on mount

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

  // Add fallback state for debugging
  const [showFallback, setShowFallback] = useState(false);

  // Fallback timer to prevent blank screen
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[UltraFastLoader] ⚠️ Initialization taking too long, showing fallback');
        setShowFallback(true);
      }
    }, 15000); // 15 second fallback

    return () => clearTimeout(fallbackTimer);
  }, [isInitialized]);

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

      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          console.log('[UltraFastLoader] ✅ Navigation is ready');
          setIsNavReady(true);
        }}
        fallback={<InitialLoadingScreen />}
      >
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!isInitialized && !showFallback ? (
            <>
              {console.log('[UltraFastLoader] 🔄 Showing InitialLoading screen - isInitialized:', isInitialized)}
              <RootStack.Screen name="InitialLoading" component={InitialLoadingScreen} />
            </>
          ) : showFallback ? (
            <>
              {console.log('[UltraFastLoader] 🚨 Showing fallback AuthNavigator due to initialization timeout')}
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            </>
          ) : shouldShowMainApp ? (
            <>
              {__DEV__ && Math.random() < 0.1 && console.log('[UltraFastLoader] ✅ Rendering MainNavigator for authenticated user')}
              <RootStack.Screen name="Main" component={MainNavigator} />
            </>
          ) : shouldShowGuestApp ? (
            <>
              {__DEV__ && console.log('[UltraFastLoader] 👤 Rendering GuestNavigator for guest user')}
              <RootStack.Screen name="Guest" component={GuestNavigator} />
            </>
          ) : (
            <>
              {__DEV__ && console.log('[UltraFastLoader] 🆕 Rendering AuthNavigator (OnboardingScreen) for new user')}
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            </>
          )}
        </RootStack.Navigator>
        
        {/* Show sidebar when initialized and in the main app or guest mode */}
        {isInitialized && (shouldShowMainApp || shouldShowGuestApp) && <Sidebar />}
      </NavigationContainer>
    </SafeAreaView>
  );
  // --- END: Replacement ---
};

export default UltraFastLoader;
