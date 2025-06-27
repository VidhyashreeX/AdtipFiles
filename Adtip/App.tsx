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
import { CallProvider, useCall, ActiveCall } from './src/contexts/CallProvider';
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
import CallService from './src/services/CallService';
import WhatsAppCallManager from './src/services/calling/WhatsAppCallManager';
import CallSyncService from './src/services/calling/CallSyncService';

import ApiService from './src/services/ApiService';
import OngoingCallModule from './src/services/OngoingCallModule';
import NotificationService from './src/services/NotificationService';  // CRITICAL FIX: Import NotificationService
import IncomingCallService from './src/services/IncomingCallService';  // CRITICAL FIX: Import IncomingCallService
import CallNotificationHandler from './src/services/calling/CallNotificationHandler';  // NEW: FCM call handler

// Constants
import { COLORS } from './src/constants/colors';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
import { appEventEmitter } from './src/events/AppEventEmitter';
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

// This component now represents the main app UI, including the sidebar and main navigator
const MainApp = () => {
  const { colors } = useTheme();
  return (
    <SafeAreaViewRN style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <ThemeAwareStatusBar />
      <SidebarProvider>
        <TabNavigatorProvider>
          <MainNavigator />
          <Sidebar />
        </TabNavigatorProvider>
      </SidebarProvider>
    </SafeAreaViewRN>
  );
}

// AppNavigator with Services - Ultra Fast with Authentication-aware UltraFastLoader
const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { activeCall, startCall } = useCall();
  const [isNavReady, setIsNavReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [videoSDKReady, setVideoSDKReady] = useState(false);
  const [callServiceReady, setCallServiceReady] = useState(false);
  const [whatsAppCallReady, setWhatsAppCallReady] = useState(false);  // NEW: WhatsApp-like call service ready state
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Check if user needs to complete profile details
  // User needs profile completion if authenticated but either:
  // 1. No name provided, OR
  // 2. Profile details not saved (isSaveUserDetails !== 1)
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
          // Since UltraFastLoader renders MainNavigator directly, navigate directly to Meeting
          (navigationRef as any).navigate('Meeting', {
            meetingId: activeCall.meetingId,
            token: activeCall.token,
            callType: activeCall.callType,
            displayName: activeCall.callerName,
            recipientName: activeCall.recipientName,
            isInitiator: activeCall.isInitiator,
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
  // CRITICAL FIX: Handle activeCall state changes and navigation
  useEffect(() => {
    const handleNavigation = () => {
      if (!isNavReady) return;
      
      const currentRoute = getCurrentRoute()?.name;
      console.log('[App] Navigation effect triggered:', {
        hasActiveCall: !!activeCall,
        currentRoute,
        isNavReady
      });
      
      if (activeCall && currentRoute !== 'Meeting') {
        console.log('[App] Navigating to Meeting screen with call:', {
          meetingId: activeCall.meetingId,
          callerName: activeCall.callerName,
          recipientName: activeCall.recipientName
        });
          // Ensure all required parameters are present
        if (!activeCall.meetingId || !activeCall.token || !activeCall.callerName) {
          console.error('[App] Missing required call parameters:', {
            meetingId: !!activeCall.meetingId,
            token: !!activeCall.token,
            callerName: !!activeCall.callerName,
            fullActiveCall: activeCall
          });
          Alert.alert('Call Error', 'Unable to join call. Missing required information.');
          CallService.endCall('Missing parameters');
          return;
        }        // Use the improved navigation function with retry logic
        const navigationParams = {
          meetingId: activeCall.meetingId,
          token: activeCall.token,
          callType: activeCall.callType || 'voice',
          displayName: activeCall.callerName,
          recipientName: activeCall.recipientName || 'Participant',
          isInitiator: activeCall.isInitiator || false,
        };
        
        console.log('[App] Navigating with params:', navigationParams);
        // Navigate directly to Meeting screen since UltraFastLoader renders MainNavigator directly
        (navigationRef as any).navigate('Meeting', navigationParams);
        
      } else if (!activeCall && currentRoute === 'Meeting') {
        console.log('[App] No active call, navigating back from Meeting screen');
        if (navigationRef.canGoBack()) {
          navigationRef.goBack();
        }
      }
    };

    handleNavigation();
  }, [activeCall, isNavReady]);  // Handle forced navigation events from CallService
  useEffect(() => {
    const handleForceNavigation = (data: { activeCall: ActiveCall }) => {
      if (!isNavReady) {
        console.log('[App] Navigation not ready, scheduling force navigation');
        setTimeout(() => handleForceNavigation(data), 100);
        return;
      }
      
      const currentRoute = getCurrentRoute()?.name;
      if (currentRoute !== 'Meeting' && data.activeCall) {
        console.log('[App] Force navigating to Meeting screen');
        
        // Ensure all required parameters are present
        if (!data.activeCall.meetingId || !data.activeCall.token || !data.activeCall.callerName) {
          console.error('[App] Missing required parameters in force navigation:', data.activeCall);
          Alert.alert('Call Error', 'Unable to join call. Missing required information.');
          CallService.endCall('Missing parameters');
          return;
        }
          // Use the improved navigation function with retry logic
        const localUserName = data.activeCall.isInitiator
          ? data.activeCall.callerName
          : data.activeCall.recipientName;
        const remoteUserName = data.activeCall.isInitiator
          ? data.activeCall.recipientName
          : data.activeCall.callerName;

        const forceNavigationParams = {
          meetingId: data.activeCall.meetingId,
          token: data.activeCall.token,
          callType: data.activeCall.callType || 'voice',
          displayName: localUserName || 'Me',
          recipientName: remoteUserName || 'Participant',
          isInitiator: data.activeCall.isInitiator || false,
        };
        
        console.log('[App] Force navigating with params:', forceNavigationParams);
        // Navigate directly to Meeting screen since UltraFastLoader renders MainNavigator directly
        (navigationRef as any).navigate('Meeting', forceNavigationParams);
      }
    };

    appEventEmitter.on('forceNavigateToMeeting', handleForceNavigation);
    
    return () => {
      appEventEmitter.off('forceNavigateToMeeting', handleForceNavigation);
    };
  }, [isNavReady]);  useEffect(() => {
    if (!isNavReady) return;

    const checkRoute = () => {
      const currentRoute = getCurrentRoute()?.name;
      if (activeCall && currentRoute !== 'Meeting') {
        // Add a delay to ensure the Activity is fully ready
        setTimeout(() => {
          OngoingCallModule.startOngoingCallNotification(
            'Ongoing Call',
            `In call with ${activeCall.recipientName || 'participant'}`
          );
        }, 1000); // 1 second delay
      } else {
        OngoingCallModule.stopOngoingCallNotification();
      }
    };
    
    // Add a delay before the first check to ensure everything is ready
    setTimeout(checkRoute, 500);

    const unsubscribe = navigationRef.addListener('state', checkRoute);

    return () => {
      unsubscribe();
    };
  }, [activeCall, isNavReady]);

  // Set all services as ready immediately - they'll initialize in background
  useEffect(() => {
    // Initialize all services as ready immediately for ultra-fast app start
    setFirebaseReady(true);
    setVideoSDKReady(true);
    setCallServiceReady(true);
    setWhatsAppCallReady(true);
    
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

    // Background WhatsApp Call Manager initialization
    setTimeout(() => {
      (async () => {
        try {
          console.log('[App] Background: Initializing WhatsApp Call Manager...');
          const whatsAppCallManager = WhatsAppCallManager.getInstance();
          const callNotificationHandler = CallNotificationHandler.getInstance();
          
          const success = await whatsAppCallManager.initialize();
          const notificationSuccess = await callNotificationHandler.initialize();
          
          if (success && notificationSuccess) {
            console.log('[App] Background: WhatsApp Call Manager initialized successfully');
            
            // Initialize CallSyncService
            try {
              const callSyncService = CallSyncService.getInstance();
              await callSyncService.initialize();
              console.log('[App] Background: Call Sync Service initialized successfully');
            } catch (syncError) {
              console.error('[App] Background: Call Sync Service initialization failed:', syncError);
            }
          } else {
            console.warn('[App] Background: WhatsApp Call system initialization failed');
          }
        } catch (error) {
          console.error('[App] Background: WhatsApp Call system initialization error:', error);
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
  }, [isInitialized, isAuthenticated]);

  // Essential event listeners and navigation setup
  useEffect(() => {
    const handleStartCall = (callData: ActiveCall) => {
      startCall(callData);
    };

    appEventEmitter.on('CallStarted', handleStartCall);

    return () => {
      appEventEmitter.off('CallStarted', handleStartCall);
    };
  }, [startCall]);

  useEffect(() => {
    const checkNavigationReady = () => {
      const ready = isNavigationReady();
      setIsNavReady(ready);
      if (ready) {
        console.log('[App] Navigation is ready');
        CallService.setNavigationReady();
      }
    };
    
    checkNavigationReady();
    
    // Set up a listener for navigation state changes
    const unsubscribe = navigationRef.addListener('ready', () => {
      console.log('[App] Navigation ready event fired');
      setIsNavReady(true);
      CallService.setNavigationReady();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Setup incoming call handling with WhatsApp Call Manager
  useEffect(() => {
    const handleIncomingCallBroadcast = async (data: any) => {
      console.log('[App] Received incoming call broadcast:', data);
      
      if (data && data.isIncomingCall && whatsAppCallReady) {
        try {
          const whatsAppCallManager = WhatsAppCallManager.getInstance();
          
          // Create call notification data
          const callNotificationData = {
            callId: data.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            callerName: data.callerName || 'Unknown Caller',
            callType: data.callType || 'voice',
            callerId: data.callerId,
            meetingId: data.meetingId,
            token: data.token,
          };
          
          // Handle incoming call with WhatsApp Call Manager
          await whatsAppCallManager.handleIncomingCall(callNotificationData);
          
          console.log('[App] ✅ WhatsApp-like incoming call handled');
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
  }, [whatsAppCallReady]);

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
        // if (callDetails) { CallService.handleIncomingCallFromNative(callDetails); }
        console.log('[App] Native answered call, sessionId:', event.sessionId);
      } else if (event.action === 'DECLINE') {
        CallService.endCall('declined');
      }
    });
    return () => {
      removeCallActionListener();
    };
  }, []);

  // Ultra-fast app initialization with authentication-aware routing
  // Use UltraFastLoader for instant app initialization
  if (!needsUserDetails) {
    return <UltraFastLoader onInitializationComplete={handleInitializationComplete} />;
  }

  // Only show UserDetails screen if authenticated but missing user name
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="UserDetails" component={UserDetailsScreen} />
    </RootStack.Navigator>
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
    }, 500); // Delayed to not block initial render
  }, []);

  // Show App Open Ad in background
  const { showAd, adLoaded } = useAppOpenAd();
  useEffect(() => {
    if (adLoaded) {
      setTimeout(() => {
        showAd();
      }, 1000); // Delayed to not block app start
    }
  }, [adLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <CallProvider>
                <EnhancedQueryProvider>
                  <DataProvider>
                    <ShortsProvider>
                      <TabNavigatorProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <NavigationContainer ref={navigationRef}>
                            <AppNavigator />
                          </NavigationContainer>
                        </GestureHandlerRootView>
                      </TabNavigatorProvider>
                    </ShortsProvider>
                  </DataProvider>
                </EnhancedQueryProvider>
              </CallProvider>
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
