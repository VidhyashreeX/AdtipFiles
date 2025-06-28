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
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallProvider';
import { safeAreaStyles, statusBarConfig } from '../../utils/SafeAreaUtils';
import { navigationRef } from '../../navigation/NavigationService';
import Sidebar from '../sidebar/Sidebar';

// Import navigation screens
import MainNavigator from '../../navigation/MainNavigator';
import AuthNavigator from '../../navigation/AuthNavigator';
import MeetingScreen from '../../screens/videosdk/MeetingScreen';
import { RootStackParamList } from '../../types/navigation';

interface UltraFastLoaderProps {
  onInitializationComplete?: () => void;
}

// Create the RootStack inside UltraFastLoader
const RootStack = createNativeStackNavigator<RootStackParamList>();

const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({ 
  onInitializationComplete 
}) => {
  const { colors, isDarkMode } = useTheme();
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { activeCall } = useCall();
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
  const shouldShowMainApp = isAuthenticated && userHasName && userSaveStatus === 1;
  
  // Use useMemo to prevent excessive logging
  const renderingState = useMemo(() => ({
    shouldShowMainApp,
    isAuthenticated,
    hasUserName: userHasName,
    isSaveUserDetails: userSaveStatus,
    userProfileComplete: !!(userHasName && userSaveStatus === 1)
  }), [shouldShowMainApp, isAuthenticated, userHasName, userSaveStatus]);

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

  // Handle active call navigation
  useEffect(() => {
    if (!isNavReady || !activeCall || !navigationRef.isReady()) return;
    
    // Only navigate if the call is in a state that requires the meeting screen
    const shouldNavigate = activeCall.status === 'connected' || 
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
              (navigationRef as any).navigate('Main', {
                screen: 'Meeting',
                params: navigationParams,
              });
            }
          }
        }, 150);
      }
    }
  }, [activeCall, isNavReady]);

  // Render authentication loading state only while auth context is initializing
  if (!isInitialized) {
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
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </SafeAreaView>
    );
  }

  // Always render the NavigationContainer with RootStack for consistent navigation
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
          console.log('[UltraFastLoader] Navigation is ready');
          setIsNavReady(true);
        }}
      >
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {shouldShowMainApp ? (
            <RootStack.Screen name="Main" component={MainNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
        
        {/* Move Sidebar inside NavigationContainer */}
        {shouldShowMainApp && <Sidebar />}
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default UltraFastLoader;
