// App.tsx

import React, { useEffect, useState, useCallback } from 'react';
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
import { useAppOpenAd } from './src/googleads/AppOpenAdManager';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { VideoSDKProvider } from './src/contexts/VideoSDKContext';
import { useTabNavigator, TabNavigatorProvider } from './src/contexts/TabNavigatorContext';
// CallProvider removed - using Zustand for call state management
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
import UnifiedCallService from './src/services/calling/UnifiedCallService';  // Unified call service (replacing all legacy services)
import PermissionManagerService from './src/services/PermissionManagerService';
import PubScaleService from './src/services/PubScaleService';
import CallKeepIntegrationService from './src/services/calling/CallKeepIntegrationService';

import IncomingCallService from './src/services/IncomingCallService';

// Constants
import { COLORS } from './src/constants/colors';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
import ChatScreen from './src/screens/chat/ChatScreen';

// Ultra Fast Loader for instant app initialization
import UltraFastLoader from './src/components/common/UltraFastLoader';

import { RootStackParamList } from 'src/types/navigation';

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

// Define deep linking config
const linking = {
  prefixes: ['adtip://', 'https://adtip.com'],
  config: {
    screens: {
      Main: {
        screens: {
          TipTube: 'tiptube',
          TipShorts: {
            path: 'tipshorts/:shortId',
            parse: { shortId: (id: string) => id },
          },
          Profile: {
            path: 'user/:userId',
            parse: { userId: (id: string) => Number(id) },
          },
          // Add more screens as needed
        },
      },
    },
  },
};

// Import Zustand stores and hooks
import { useCallStore, CallData } from './src/stores/callStore';

// AppNavigator with Services - Ultra Fast with Authentication-aware UltraFastLoader
const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { callStatus, activeCall, startOutgoingCall } = useCallStore();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [videoSDKReady, setVideoSDKReady] = useState(false);
  const [unifiedCallServiceReady, setUnifiedCallServiceReady] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Check if user needs to complete profile details
  const needsUserDetails = isAuthenticated && (!user?.name || user?.isSaveUserDetails !== 1);

  // Memoize the initialization complete callback to prevent re-renders
  const handleInitializationComplete = useCallback(() => {
    console.log('[App] Ultra-fast initialization complete');
  }, []);

  // Ultra-fast deep linking setup
  useEffect(() => {    const handleDeepLink = (url: string | null) => {
      if (url) {
        const route = url.replace(/.*?:\/\//g, '');
        const host = route.split('/')[0];

        if (host === 'call' && activeCall) {
          // Navigate to Meeting using nested navigation
          (navigationRef as any).navigate('Main', {
            screen: 'Meeting',
            params: {
              meetingId: activeCall.meetingId,
              token: activeCall.token,
              callType: activeCall.callType,
              displayName: activeCall.callerName,
              recipientName: activeCall.recipientName,
              isInitiator: activeCall.isInitiator,
            }
          });
        }
      }
    };

    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });    return () => {
      subscription.remove();
    };
  }, [activeCall]);

  // Set all services as ready immediately - they'll initialize in background
  useEffect(() => {
    // Initialize all services as ready immediately for ultra-fast app start
    setFirebaseReady(true);
    
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

          console.log('[App] Background: Initializing Unified Call Service...');
          const unifiedCallService = UnifiedCallService.getInstance();
          
          const success = await unifiedCallService.initialize();
          
          if (success) {
            console.log('[App] Background: Unified Call Service initialized successfully');
            
            // Check CallKeep availability
            try {
              const callKeepService = CallKeepIntegrationService.getInstance();
              const isAvailable = await callKeepService.isAvailable();
              if (isAvailable) {
                console.log('[App] Background: CallKeep is available and will be initialized by UnifiedCallService');
              } else {
                console.log('[App] Background: CallKeep not available, using notifications only');
              }
            } catch (error) {
              console.warn('[App] Background: CallKeep availability check failed:', error);
            }
          } else {
            console.warn('[App] Background: Unified Call Service initialization failed');
          }
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
  }, [isInitialized, isAuthenticated]);

  // Setup incoming call handling with Unified Call Service
  useEffect(() => {
    const handleIncomingCallBroadcast = async (data: any) => {
      console.log('[App] Received incoming call broadcast:', data);
      
      if (data && data.isIncomingCall && unifiedCallServiceReady) {
        try {
          const unifiedCallService = UnifiedCallService.getInstance();
          
          // Create call notification data
          const callNotificationData = {
            callId: data.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            callerName: data.callerName || 'Unknown Caller',
            callType: data.callType || 'voice',
            callerId: data.callerId,
            meetingId: data.meetingId,
            token: data.token,
          };
          
          // Handle incoming call with Unified Call Service
          await unifiedCallService.handleIncomingFCMCall(callNotificationData);
          
          console.log('[App] ✅ Unified Call Service incoming call handled');
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
  }, [unifiedCallServiceReady]);

  // Global navigation listener for call status changes
  useEffect(() => {
    const unsubscribe = useCallStore.subscribe((state) => {
      const currentStatus = state.callStatus;
      const activeCall = state.activeCall;
      
      // Auto-navigate to Meeting screen when call starts
      if ((currentStatus === 'dialing' || currentStatus === 'connecting' || currentStatus === 'connected') && activeCall) {
        console.log('[App] Auto-navigating to Meeting screen due to call status:', currentStatus);
        
        // Only navigate if we're not already on the Meeting screen
        const currentRoute = getCurrentRoute();
        if (currentRoute?.name !== 'Meeting') {
          try {
            navigateWithRetry('Main', {
              screen: 'Meeting',
              params: {
                meetingId: activeCall.meetingId,
                token: activeCall.token,
                displayName: activeCall.isInitiator ? activeCall.callerName : activeCall.recipientName,
                callType: activeCall.callType,
                isInitiator: activeCall.isInitiator,
                recipientName: activeCall.isInitiator ? activeCall.recipientName : activeCall.callerName,
                callData: activeCall
              }
            });
          } catch (error) {
            console.error('[App] Error navigating to Meeting screen:', error);
          }
        }
      }
      
      // Auto-navigate back to TipCall when call ends
      if (currentStatus === 'ended' || currentStatus === 'idle') {
        console.log('[App] Auto-navigating back to TipCall due to call status:', currentStatus);
        // Only navigate back if we're currently on the Meeting screen
        const currentRoute = getCurrentRoute();
        if (currentRoute?.name === 'Meeting') {
          try {
            // Use a delay to ensure proper cleanup
            setTimeout(() => {
              navigateWithRetry('Main', { 
                screen: 'TipCall', 
                params: {} 
              });
            }, 500);
          } catch (error) {
            console.error('[App] Error navigating back to TipCall:', error);
          }
        }
      }
    });

    return unsubscribe;
  }, []);

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
        // if (callDetails) { UnifiedCallService.getInstance().handleIncomingCall(callDetails); }
        console.log('[App] Native answered call, sessionId:', event.sessionId);
      } else if (event.action === 'DECLINE') {
        UnifiedCallService.getInstance().endCall('declined');
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
    <NavigationContainer ref={navigationRef} linking={linking} fallback={<Text>Loading...</Text>}>
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

  // Initialize AdMob SDK in background
  useEffect(() => {
    setTimeout(() => {
      mobileAds().initialize();
    }, 500);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <EnhancedQueryProvider>
                <DataProvider>
                  <ShortsProvider>
                    <TabNavigatorProvider>
                      <SidebarProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <AppNavigator />
                          {/* REMOVE Sidebar from here since it's now in UltraFastLoader */}
                        </GestureHandlerRootView>
                      </SidebarProvider>
                    </TabNavigatorProvider>
                  </ShortsProvider>
                </DataProvider>
              </EnhancedQueryProvider>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
