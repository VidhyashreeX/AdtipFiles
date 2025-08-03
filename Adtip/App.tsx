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
import { ErrorUtils } from 'react-native';
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
import { FCMChatProvider } from './src/contexts/FCMChatContext';
import { DataProvider } from './src/providers/DataProvider';
import { EnhancedQueryProvider } from './src/providers/QueryProvider';
import { KeyboardAvoiderProvider } from '@good-react-native/keyboard-avoider';

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

// Import ProductionLogger for performance-optimized logging
import { Logger } from './src/utils/ProductionLogger';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
//import ChatScreen from './src/screens/chat/ChatScreen';

// Ultra Fast Loader for instant app initialization
import UltraFastLoader from './src/components/common/UltraFastLoader';
import AppErrorBoundary from './src/components/common/AppErrorBoundary';
import ForceUpdateModal from './src/components/common/ForceUpdateModal';
import VersionCheckService from './src/services/VersionCheckService';
import ForceUpdateDebugButton from './src/components/debug/ForceUpdateDebugButton';
import ThemeTestModal from './src/components/debug/ThemeTestModal';

import { RootStackParamList } from 'src/types/navigation';
import useReliableCallManager from './src/hooks/useReliableCallManager';
import useFCMMessageRouter from './src/hooks/useFCMMessageRouter';

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

// Import simplified deep linking configuration
import { DEEP_LINK_CONFIG } from './src/config/deepLinkConfig';

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
    Logger.debug('App', 'Ultra-fast initialization complete');
  }, []);

  // ✅ SIMPLIFIED: Deep linking now handled in UltraFastLoader

  // Set all services as ready immediately - they'll initialize in background
  useEffect(() => {
    // Initialize all services as ready immediately for ultra-fast app start
    Logger.debug('App', 'All services marked as ready for instant app start');
  }, []);

  // Background initialization - no blocking with delayed execution
  useEffect(() => {
    if (!isInitialized) return;
    
    // Background Firebase initialization - minimal delay for UI responsiveness
    setTimeout(() => {
      (async () => {
        try {
          Logger.debug('App', 'Background: Initializing Firebase service...');
          const apps = getApps();
          if (apps.length === 0) {
            Logger.warn('App', 'Background: No Firebase apps found');
          } else {
            Logger.debug('App', `Background: Found ${apps.length} Firebase app(s)`);
          }

          const firebaseService = FirebaseService.getInstance();
          const success = await firebaseService.initializeMessaging();

          if (success) {
            Logger.info('App', 'Background: Firebase service initialized successfully');
            // Setup notifications when ready
            if (isAuthenticated) {
              await firebaseService.setupNotifications();
              firebaseService.setupNotificationListeners();
              firebaseService.executeDelayedNavigation();
            }
          } else {
            Logger.warn('App', 'Background: Firebase service initialization failed');
          }
        } catch (error) {
          Logger.error('App', 'Background: Firebase initialization error:', error);
        }
      })();
    }, 100); // Minimal delay for UI responsiveness

    // Background VideoSDK initialization with pre-warming
    setTimeout(() => {
      (async () => {
        try {
          Logger.debug('App', 'Background: Initializing VideoSDK service...');
          const videoSDKService = VideoSDKService.getInstance();
          const success = await videoSDKService.initialize();

          if (success) {
            Logger.info('App', 'Background: VideoSDK service initialized successfully');

            // Start WebSocket pre-warming after successful VideoSDK initialization
            try {
              Logger.debug('App', '🔥 Background: Starting VideoSDK WebSocket pre-warming...');
              const { VideoSDKPrewarmingService } = await import('./src/services/videosdk/VideoSDKPrewarmingService');
              const prewarmingService = VideoSDKPrewarmingService.getInstance();

              Logger.debug('App', '🔥 Background: Initializing pre-warming service...');
              // Initialize pre-warming service
              await prewarmingService.initialize();

              Logger.debug('App', '🔥 Background: Starting pre-warming process...');
              // Start pre-warming process in background (non-blocking)
              prewarmingService.startPrewarming().then((prewarmSuccess) => {
                if (prewarmSuccess) {
                  Logger.info('App', '🔥 Background: VideoSDK WebSocket pre-warming completed successfully');
                } else {
                  Logger.warn('App', '🔥 Background: VideoSDK WebSocket pre-warming failed (non-critical)');
                }
              }).catch((prewarmError) => {
                Logger.warn('App', '🔥 Background: VideoSDK WebSocket pre-warming error (non-critical):', prewarmError);
              });

            } catch (prewarmingError) {
              Logger.warn('App', '🔥 Background: VideoSDK pre-warming service initialization failed (non-critical):', prewarmingError);
            }
          } else {
            Logger.warn('App', 'Background: VideoSDK service initialization failed');
          }
        } catch (error) {
          Logger.error('App', 'Background: VideoSDK initialization error:', error);
        }
      })();
    }, 200);

    // Background Unified Call Service initialization
    setTimeout(() => {
      (async () => {
        try {
          // Request notification permissions using centralized service
          Logger.debug('App', 'Background: Requesting notification permissions...');
          const permissionManager = PermissionManagerService.getInstance();
          const notificationResult = await permissionManager.requestNotificationPermissions();
          Logger.debug('App', 'Background: Notification permissions result:', notificationResult);

          Logger.debug('App', 'Background: Call services initialized via CallController (auto-init)');
        } catch (error) {
          Logger.error('App', 'Background: Unified Call Service initialization error:', error);
        }
      })();
    }, 300);

    // Background permissions initialization - delayed to not impact UI
    if (isAuthenticated) {
      setTimeout(async () => {
        try {
          const PermissionsServiceModule = await import('./src/services/PermissionsService');
          const PermissionsService = PermissionsServiceModule.default;
          await PermissionsService.requestPhoneCallForegroundServicePermission();
          Logger.debug('App', 'Background: Phone call permissions requested');
        } catch (error) {
          Logger.debug('App', 'Background: Phone call permissions request failed (not critical):', error);
        }
      }, 1000); // Reduced from 2000ms to 1000ms
    }

    // Background PubScale initialization - delayed to not impact UI
    if (isAuthenticated && user?.id) {
      setTimeout(async () => {
        try {
          Logger.debug('App', 'Background: Initializing PubScale service...');
          await PubScaleService.initialize(String(user.id));
          Logger.info('App', 'Background: PubScale service initialized successfully');
        } catch (error) {
          Logger.debug('App', 'Background: PubScale service initialization failed (not critical):', error);
        }
      }, 1500); // Initialize after other services
    }

    // Background Cloudflare cache cleanup initialization
    setTimeout(async () => {
      try {
        Logger.debug('App', 'Background: Initializing Cloudflare cache cleanup...');
        const { CloudflareUploadService } = await import('./src/services/CloudflareUploadService');
        CloudflareUploadService.initializeCacheCleanup();
        Logger.info('App', 'Background: Cloudflare cache cleanup initialized successfully');
      } catch (error) {
        Logger.debug('App', 'Background: Cloudflare cache cleanup initialization failed (not critical):', error);
      }
    }, 2000); // Initialize after other services
  }, [isInitialized, isAuthenticated]);

  // Setup incoming call handling with Unified Call Service
  useEffect(() => {
    const handleIncomingCallBroadcast = async (data: any) => {
      Logger.debug('App', 'Received incoming call broadcast:', data);

      if (data && data.isIncomingCall) {
        try {
          // Incoming calls are now handled by CallSignalingService via FCM
          Logger.info('App', '✅ Incoming call handled by CallSignalingService');
        } catch (error) {
          Logger.error('App', 'Error handling incoming call broadcast:', error);
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
        Logger.debug('App', 'Native answered call, sessionId:', event.sessionId);
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

  // Force update state
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  // Global error handler for production builds
  useEffect(() => {
    // Check if ErrorUtils is available
    if (!ErrorUtils || typeof ErrorUtils.getGlobalHandler !== 'function') {
      console.warn('[App] ⚠️ ErrorUtils not available, skipping global error handler setup');
      return;
    }

    try {
      const originalErrorHandler = ErrorUtils.getGlobalHandler();
      
      const globalErrorHandler = (error: Error, isFatal?: boolean) => {
        // Log the error
        Logger.error('App', '🚨 Global error caught:', {
          error: error.message,
          stack: error.stack,
          isFatal,
          isProduction: !__DEV__
        });

        // In production, prevent crashes by handling the error gracefully
        if (!__DEV__) {
          console.warn('[App] 🚫 Preventing crash in production build');
          
          // For CallKeep related errors, disable CallKeep and continue
          if (error.message?.includes('RNCallKeep') || error.message?.includes('displayIncomingCall')) {
            console.warn('[App] 🚫 CallKeep error detected, disabling CallKeep functionality');
            // The CallKeepService will handle this gracefully
            return;
          }
          
          // For other errors, log and continue
          console.warn('[App] 🚫 Non-critical error, continuing app execution');
          return;
        }
        
        // In development, let the original handler deal with it
        if (originalErrorHandler && typeof originalErrorHandler === 'function') {
          originalErrorHandler(error, isFatal);
        }
      };
      
      ErrorUtils.setGlobalHandler(globalErrorHandler);
      
      return () => {
        try {
          if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
            ErrorUtils.setGlobalHandler(originalErrorHandler);
          }
        } catch (cleanupError) {
          console.warn('[App] ⚠️ Error during error handler cleanup:', cleanupError);
        }
      };
    } catch (setupError) {
      console.warn('[App] ⚠️ Failed to setup global error handler:', setupError);
    }
  }, []);

  // Initialize call configuration for simplified flow
  useEffect(() => {
    CallConfig.enableSimplifiedFlow();
    Logger.debug('App', 'Call configuration initialized for simplified flow');
  }, []);

  // Version check on app start - critical for force updates
  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        Logger.debug('App', '🔍 Starting critical version check...');
        const versionService = VersionCheckService.getInstance();
        const updateResult = await versionService.forceCheckForUpdates();

        if (updateResult && updateResult.status && updateResult.data) {
          Logger.warn('App', '⚠️ Update required:', updateResult.data);
          setUpdateInfo(updateResult.data);

          if (updateResult.data.force_update) {
            Logger.error('App', '🚨 FORCE UPDATE REQUIRED - Blocking app access');
            setShowForceUpdate(true);
          } else {
            Logger.info('App', '📱 Optional update available');
            // For optional updates, we could show a less intrusive notification
            // For now, we'll still show the modal but allow dismissal
            setShowForceUpdate(true);
          }
        } else {
          Logger.info('App', '✅ App version is up to date');
        }
      } catch (error) {
        Logger.error('App', '❌ Version check failed:', error);
        // Don't block the app if version check fails
      }
    };

    // Run version check immediately on app start
    checkAppVersion();
  }, []);

  // Add reliable call manager for FCM call handling
  useReliableCallManager();

  // Add centralized FCM message router for both call and chat messages
  useFCMMessageRouter();

  // Cleanup pre-warming service on app unmount
  useEffect(() => {
    return () => {
      // Cleanup pre-warming service when app is unmounted
      try {
        import('./src/services/videosdk/VideoSDKPrewarmingService').then(({ VideoSDKPrewarmingService }) => {
          const prewarmingService = VideoSDKPrewarmingService.getInstance();
          prewarmingService.cleanup();
        }).catch(() => {
          // Ignore cleanup errors during app termination
        });
      } catch (error) {
        // Ignore cleanup errors during app termination
      }
    };
  }, []);

  // Initialize background call handler only (lightweight, non-blocking)
  useEffect(() => {
    // Only initialize the lightweight background call handler
    // CallKeep will be initialized later when user is in main app
    const initBackgroundHandler = () => {
      setTimeout(async () => {
        try {
          Logger.debug('App', '🔄 Starting lightweight background call handler initialization...');

          // Initialize background call handler first (lightweight)
          try {
            const { BackgroundCallHandler } = await import('./src/services/calling/BackgroundCallHandler');
            const handler = BackgroundCallHandler.getInstance();
            await handler.loadPendingCall();
            Logger.info('App', '✅ Background call handler initialized');
          } catch (handlerError) {
            Logger.warn('App', '⚠️ Background call handler initialization failed:', handlerError);
          }

          Logger.info('App', '✅ Background services initialization complete');
        } catch (error) {
          Logger.warn('App', '⚠️ Background services setup error (non-critical):', error);
        }
      }, 1000); // Reduced delay to 1 second for faster startup
    };

    // Start lightweight background initialization
    initBackgroundHandler();

  }, []);

  // Initialize AdMob SDK in background
  useEffect(() => {
    setTimeout(() => {
      mobileAds().initialize();
    }, 500);
  }, []);

  // Debug app state for blank screen issues - TEMPORARILY DISABLED
  useEffect(() => {
    Logger.debug('App', '⚠️ Debug utilities temporarily disabled to prevent blank screen');

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
  
  // Ensure ad is ready with throttling to prevent excessive calls
  useEffect(() => {
    // Only force load if we haven't loaded an ad in the last 2 minutes
    const lastForceLoad = Date.now() - (global.lastAdForceLoad || 0);
    const FORCE_LOAD_COOLDOWN = 2 * 60 * 1000; // 2 minutes

    if (!adLoaded && lastForceLoad > FORCE_LOAD_COOLDOWN) {
      Logger.debug('App', 'Ensuring app open ad is loaded');
      global.lastAdForceLoad = Date.now();
      forceLoadAd();
    }
  }, [adLoaded, forceLoadAd]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardAvoiderProvider>
            <ThemeProvider>
              <AuthProvider>
                <EnhancedQueryProvider>
                  <UserDataProvider>
                    <FCMChatProvider>
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

                              {/* Force Update Modal - blocks entire app when force update is required */}
                              <ForceUpdateModal
                                visible={showForceUpdate}
                                updateInfo={updateInfo}
                              />

                              {/* Debug button for testing force updates (only in debug builds) */}
                              <ForceUpdateDebugButton />

                              {/* Theme test modal for debugging dark mode issues (only in debug builds) */}
                              <ThemeTestModal />
                              </GestureHandlerRootView>
                            </SidebarProvider>
                          </TabNavigatorProvider>
                        </ShortsProvider>
                        </DataProvider>
                      </ContentCreatorPremiumProvider>
                    </WalletProvider>
                    </FCMChatProvider>
                  </UserDataProvider>
                </EnhancedQueryProvider>
              </AuthProvider>
            </ThemeProvider>
          </KeyboardAvoiderProvider>
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
