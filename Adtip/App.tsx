// App.tsx
// Removed legacy callStore import to prevent dual store confusion
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Text,
  Platform,
  Linking,
  Alert,
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewRN,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import mobileAds from 'react-native-google-mobile-ads';
import { useAppOpenAd, AdDebugger } from './src/googleads';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { VideoSDKProvider } from './src/contexts/VideoSDKContext';
import { useTabNavigator, TabNavigatorProvider } from './src/contexts/TabNavigatorContext';
//import { CallProvider, useCall, ActiveCall } from './src/contexts/CallProvider';
import { ContentCreatorPremiumProvider } from './src/contexts/ContentCreatorPremiumContext';
import { UserDataProvider } from './src/contexts/UserDataContext';
import { DataProvider } from './src/providers/DataProvider';
import { EnhancedQueryProvider } from './src/providers/QueryProvider';

// Components & Navigators
import Sidebar from './src/components/sidebar/Sidebar';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef, navigateWithRetry, getCurrentRoute, isNavigationReady } from './src/navigation/NavigationService';

// Services
import FirebaseService from './src/services/FirebaseService';
import VideoSDKService from './src/services/videosdk/VideoSDKService';
import PermissionManagerService from './src/services/PermissionManagerService';
import PubScaleService from './src/services/PubScaleService';

import IncomingCallService from './src/services/IncomingCallService';

// Constants
import { COLORS } from './src/constants/colors';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
//import ChatScreen from './src/screens/chat/ChatScreen';

// Ultra Fast Loader for instant app initialization
import UltraFastLoader from './src/components/common/UltraFastLoader';
import AppErrorBoundary from './src/components/common/AppErrorBoundary';

import { RootStackParamList } from 'src/types/navigation';
import useReliableCallManager from './src/hooks/useReliableCallManager';

// Import call store (simplified)
import { useCallStore } from './src/stores/callStoreSimplified';
import CallController from './src/services/calling/CallController';
import CallConfig from './src/config/CallConfig';
import PersistentMeetingManager from './src/components/videosdk/PersistentMeetingManager';

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Theme-aware StatusBar with proper safe area handling
const ThemeAwareStatusBar = () => {
  const { isDarkMode, colors } = useTheme();
  return (
    <StatusBar
      translucent={true}
      backgroundColor="transparent"
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
    />
  );
};

// Import comprehensive deep linking configuration
import { DEEP_LINK_CONFIG } from './src/config/deepLinkConfig';
import deepLinkService from './src/services/DeepLinkService';

// AppNavigator with Services - Ultra Fast with Authentication-aware UltraFastLoader
const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { status: callStatus, session: activeSession } = useCallStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Check if user needs to complete profile details
  const needsUserDetails = isAuthenticated && (!user?.name || user?.isSaveUserDetails !== 1);

  // Memoize the initialization complete callback to prevent re-renders
  const handleInitializationComplete = useCallback(() => {
    console.log('[App] Ultra-fast initialization complete');
  }, []);

  // Initialize comprehensive deep linking service
  useEffect(() => {
    // Initialize the deep link service
    deepLinkService.initialize();

    // Cleanup on unmount
    return () => {
      deepLinkService.cleanup();
    };
  }, []);

  // Set all services as ready immediately - they'll initialize in background
  useEffect(() => {
    // Initialize all services as ready immediately for ultra-fast app start
    console.log('[App] All services marked as ready for instant app start');
  }, []);

  // Background initialization - no blocking with delayed execution
  useEffect(() => {
    if (!isInitialized) return;
    
    // Background Firebase initialization - minimal delay for UI responsiveness
    setTimeout(() => {
      (async () => {
        try {
          console.log('[App] Background: Initializing Firebase service...');
          const apps = getApps();
          if (apps.length === 0) {
            console.warn('[App] Background: No Firebase apps found');
          } else {
            console.log(`[App] Background: Found ${apps.length} Firebase app(s)`);
          }
          
          const firebaseService = FirebaseService.getInstance();
          const success = await firebaseService.initializeMessaging();
          
          if (success) {
            console.log('[App] Background: Firebase service initialized successfully');
            // Setup notifications when ready
            if (isAuthenticated) {
              await firebaseService.setupNotifications();
              firebaseService.setupNotificationListeners();
              firebaseService.executeDelayedNavigation();
            }
          } else {
            console.warn('[App] Background: Firebase service initialization failed');
          }
        } catch (error) {
          console.error('[App] Background: Firebase initialization error:', error);
        }
      })();
    }, 100); // Minimal delay for UI responsiveness

    // Background VideoSDK initialization
    setTimeout(() => {
      (async () => {
        try {
          console.log('[App] Background: Initializing VideoSDK service...');
          const videoSDKService = VideoSDKService.getInstance();
          const success = await videoSDKService.initialize();
          
          if (success) {
            console.log('[App] Background: VideoSDK service initialized successfully');
          } else {
            console.warn('[App] Background: VideoSDK service initialization failed');
          }
        } catch (error) {
          console.error('[App] Background: VideoSDK initialization error:', error);
        }
      })();
    }, 200);

    // Background Unified Call Service initialization
    setTimeout(() => {
      (async () => {
        try {
          // Request notification permissions using centralized service
          console.log('[App] Background: Requesting notification permissions...');
          const permissionManager = PermissionManagerService.getInstance();
          const notificationResult = await permissionManager.requestNotificationPermissions();
          console.log('[App] Background: Notification permissions result:', notificationResult);

          console.log('[App] Background: Call services initialized via CallController (auto-init)');
        } catch (error) {
          console.error('[App] Background: Unified Call Service initialization error:', error);
        }
      })();
    }, 300);

    // Background permissions initialization - delayed to not impact UI
    if (isAuthenticated) {
      setTimeout(async () => {
        try {
          const PermissionsService = require('./src/services/PermissionsService').default;
          await PermissionsService.requestPhoneCallForegroundServicePermission();
          console.log('[App] Background: Phone call permissions requested');
        } catch (error) {
          console.log('[App] Background: Phone call permissions request failed (not critical):', error);
        }
      }, 1000); // Reduced from 2000ms to 1000ms
    }

    // Background PubScale initialization - delayed to not impact UI
    if (isAuthenticated && user?.id) {
      setTimeout(async () => {
        try {
          console.log('[App] Background: Initializing PubScale service...');
          await PubScaleService.initialize(String(user.id));
          console.log('[App] Background: PubScale service initialized successfully');
        } catch (error) {
          console.log('[App] Background: PubScale service initialization failed (not critical):', error);
        }
      }, 1500); // Initialize after other services
    }

    // Background Cloudflare cache cleanup initialization
    setTimeout(async () => {
      try {
        console.log('[App] Background: Initializing Cloudflare cache cleanup...');
        const { CloudflareUploadService } = await import('./src/services/CloudflareUploadService');
        CloudflareUploadService.initializeCacheCleanup();
        console.log('[App] Background: Cloudflare cache cleanup initialized successfully');
      } catch (error) {
        console.log('[App] Background: Cloudflare cache cleanup initialization failed (not critical):', error);
      }
    }, 2000); // Initialize after other services
  }, [isInitialized, isAuthenticated]);

  // Setup incoming call handling with Unified Call Service
  useEffect(() => {
    const handleIncomingCallBroadcast = async (data: any) => {
      console.log('[App] Received incoming call broadcast:', data);
      
      if (data && data.isIncomingCall) {
        try {
          // Incoming calls are now handled by CallSignalingService via FCM
          console.log('[App] ✅ Incoming call handled by CallSignalingService');
        } catch (error) {
          console.error('[App] Error handling incoming call broadcast:', error);
        }
      }
    };

    // Use the new IncomingCallService for cleaner event handling
    const incomingCallService = IncomingCallService.getInstance();
    const unsubscribe = incomingCallService.onIncomingCall(handleIncomingCallBroadcast);

    return () => {
      unsubscribe();
    };
  }, []);

  // Navigation handler for call status changes is no longer needed
  // The PersistentMeetingManager handles call UI directly
  // Removed to prevent conflicts with persistent meeting component

  useEffect(() => {
    // Listen for native call actions (answer/decline)
    const removeCallActionListener = IncomingCallService.getInstance().onCallAction(async (event) => {
      if (event.action === 'ANSWER') {
        // If only sessionId is present, fetch call details from backend or cache
        // For demo, just log and skip if details are missing
        if (!event.sessionId) {
          console.warn('[App] Native ANSWER event missing sessionId');
          return;
        }
        // TODO: Fetch call details using sessionId if needed
        // Example: const callDetails = await ApiService.getCallDetails(event.sessionId);
        // if (callDetails) { CallController.getInstance().handleIncomingCall(callDetails); }
        console.log('[App] Native answered call, sessionId:', event.sessionId);
      } else if (event.action === 'DECLINE') {
        CallController.getInstance().declineCall();
      }
    });
    return () => {
      removeCallActionListener();
    };
  }, []);

  // Always use UltraFastLoader unless user needs profile completion
  if (!needsUserDetails) {
    return <UltraFastLoader onInitializationComplete={handleInitializationComplete} />;
  }

  // Only show UserDetails screen if authenticated but missing user name
  return (
    <NavigationContainer ref={navigationRef} linking={DEEP_LINK_CONFIG} fallback={<Text>Loading...</Text>}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="UserDetails" component={UserDetailsScreen} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Root App Component
function App(): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { colors } = useTheme();
  const callRef = useRef<string | null>(null);
  const tabRouteRef = useRef<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<string | undefined>();

  // Initialize call configuration for simplified flow
  useEffect(() => {
    CallConfig.enableSimplifiedFlow();
    console.log('[App] Call configuration initialized for simplified flow');
  }, []);

  // Add reliable call manager for FCM call handling
  useReliableCallManager();

  // Initialize background call handler and CallKeep (non-blocking) - RE-ENABLED WITH FIXES
  useEffect(() => {
    const initCallServices = async () => {
      try {
        console.log('[App] 🔄 Starting non-blocking call services initialization...');

        // Initialize background call handler first (lightweight)
        const { BackgroundCallHandler } = await import('./src/services/calling/BackgroundCallHandler');
        const handler = BackgroundCallHandler.getInstance();
        await handler.loadPendingCall();
        console.log('[App] ✅ Background call handler initialized');

        // Initialize CallKeep with timeout to prevent blocking
        const initCallKeepWithTimeout = async () => {
          try {
            console.log('[App] 🔄 Starting CallKeep initialization in background...');
            const { default: CallKeepService } = await import('./src/services/calling/CallKeepService');
            const callKeepService = CallKeepService.getInstance();

            // Set a timeout for CallKeep initialization
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('CallKeep initialization timeout')), 3000)
            );

            const initPromise = callKeepService.initialize();
            const callKeepInitialized = await Promise.race([initPromise, timeoutPromise]);
            console.log('[App] ✅ CallKeep initialized successfully:', callKeepInitialized);
          } catch (callKeepError) {
            console.warn('[App] ⚠️ CallKeep initialization failed (non-critical):', callKeepError);
            // Don't block app startup for CallKeep issues
          }
        };

        // Run CallKeep initialization in background with delay to not interfere with UI
        setTimeout(() => {
          initCallKeepWithTimeout().catch(err => {
            console.warn('[App] ⚠️ CallKeep background initialization error:', err);
          });
        }, 3000); // 3 second delay to let UI settle first

      } catch (error) {
        console.error('[App] ❌ Error initializing call services (non-critical):', error);
        // Don't block app startup for call service issues
      }
    };

    // Run initialization in background without blocking
    setTimeout(initCallServices, 1000); // 1 second delay to let app initialize first
  }, []);

  // Initialize AdMob SDK in background
  useEffect(() => {
    setTimeout(() => {
      mobileAds().initialize();
    }, 500);
  }, []);

  // Debug app state for blank screen issues - TEMPORARILY DISABLED
  useEffect(() => {
    console.log('[App] ⚠️ Debug utilities temporarily disabled to prevent blank screen');

    // TODO: Re-enable once the blank screen issue is resolved
    // const startDebugging = async () => {
    //   try {
    //     // Run initialization test first
    //     const { testAppInitialization } = await import('./src/utils/testAppInitialization');
    //     setTimeout(testAppInitialization, 1000);

    //     // Then start regular debugging
    //     const { debugAppState, startAppStateMonitoring } = await import('./src/utils/debugAppState');

    //     // Initial debug
    //     setTimeout(debugAppState, 3000);

    //     // Start monitoring if app seems stuck
    //     const stopMonitoring = startAppStateMonitoring();

    //     // Stop monitoring after 2 minutes
    //     setTimeout(stopMonitoring, 120000);
    //   } catch (error) {
    //     console.error('[App] Debug utility error:', error);
    //   }
    // };

    // startDebugging();
  }, []);

  // Initialize App Open Ad with aggressive showing
  const { adLoaded, showAd, forceLoadAd } = useAppOpenAd();
  
  // The AppOpenAdManager now handles showing ads aggressively:
  // - On app launch (after 1.5 second delay)
  // - When app comes to foreground from background
  // - With only 30-second cooldown between ads
  // - Automatically retries loading ads
  
  // Ensure ad is always ready
  useEffect(() => {
    if (!adLoaded) {
      console.log('App.tsx: Ensuring app open ad is loaded');
      forceLoadAd();
    }
  }, [adLoaded, forceLoadAd]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <EnhancedQueryProvider>
                <UserDataProvider>
                  <WalletProvider>
                    <ContentCreatorPremiumProvider>
                      <DataProvider>
                        <ShortsProvider>
                          <TabNavigatorProvider>
                            <SidebarProvider>
                              <GestureHandlerRootView style={{ flex: 1 }}>
                                <AppNavigator />
                                <PersistentMeetingManager />
                              {/* REMOVE Sidebar from here since it's now in UltraFastLoader */}

                              {/* Ad Debugger - only shows in development */}
                              {/*<AdDebugger />*/}
                              </GestureHandlerRootView>
                            </SidebarProvider>
                          </TabNavigatorProvider>
                        </ShortsProvider>
                      </DataProvider>
                    </ContentCreatorPremiumProvider>
                  </WalletProvider>
                </UserDataProvider>
              </EnhancedQueryProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
    width: '100%',
    height: '100%',
  },
  appContentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});

export default App;
