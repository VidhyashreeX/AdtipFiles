// App.tsx

import React, { useEffect, useState } from 'react';
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

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { VideoSDKProvider } from './src/contexts/VideoSDKContext';
import { useTabNavigator, TabNavigatorProvider } from './src/contexts/TabNavigatorContext';
import { CallProvider, useCall, ActiveCall } from './src/contexts/CallProvider';

// Components & Navigators
import Sidebar from './src/components/sidebar/Sidebar';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef, navigateWithRetry, getCurrentRoute, isNavigationReady } from './src/navigation/NavigationService';

// Services
import FirebaseService from './src/services/FirebaseService';
import VideoSDKService from './src/services/videosdk/VideoSDKService';
import CallService from './src/services/CallService';

import ApiService from './src/services/ApiService';
import OngoingCallModule from './src/services/OngoingCallModule';
import NotificationService from './src/services/NotificationService';  // CRITICAL FIX: Import NotificationService
import IncomingCallService from './src/services/IncomingCallService';  // CRITICAL FIX: Import IncomingCallService
import WhatsAppCallManager from './src/services/calling/WhatsAppCallManager';  // NEW: WhatsApp-like calling
import CallNotificationHandler from './src/services/calling/CallNotificationHandler';  // NEW: FCM call handler

// Constants
import { COLORS } from './src/constants/colors';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
import { appEventEmitter } from './src/events/AppEventEmitter';

import { RootStackParamList } from 'src/types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Theme-aware StatusBar
const ThemeAwareStatusBar = () => {
  const { isDarkMode } = useTheme();
  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
    />
  );
};

// This component now represents the main app UI, including the sidebar and main navigator
const MainApp = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SidebarProvider>
        <TabNavigatorProvider>
          <MainNavigator />
          <Sidebar />
        </TabNavigatorProvider>
      </SidebarProvider>
    </View>
  );
}

// AppNavigator with Services
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

  useEffect(() => {    const handleDeepLink = (url: string | null) => {
      if (url) {
        const route = url.replace(/.*?:\/\//g, '');
        const host = route.split('/')[0];

        if (host === 'call' && activeCall) {
          navigationRef.navigate('Main', {
            screen: 'Meeting',
            params: {
              meetingId: activeCall.meetingId,
              token: activeCall.token,
              callType: activeCall.callType,
              displayName: activeCall.callerName,
              recipientName: activeCall.recipientName,
              isInitiator: activeCall.isInitiator,
            },
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
          screen: 'Meeting' as const,
          params: {
            meetingId: activeCall.meetingId,
            token: activeCall.token,
            callType: activeCall.callType || 'voice',
            displayName: activeCall.callerName,
            recipientName: activeCall.recipientName || 'Participant',
            isInitiator: activeCall.isInitiator || false,
          },
        };
        
        console.log('[App] Navigating with params:', navigationParams);
        navigateWithRetry('Main', navigationParams, 3, 150);
        
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
          screen: 'Meeting' as const,
          params: {
            meetingId: data.activeCall.meetingId,
            token: data.activeCall.token,
            callType: data.activeCall.callType || 'voice',
            displayName: localUserName || 'Me',
            recipientName: remoteUserName || 'Participant',
            isInitiator: data.activeCall.isInitiator || false,
          },
        };
        
        console.log('[App] Force navigating with params:', forceNavigationParams);
        navigateWithRetry('Main', forceNavigationParams, 3, 150);
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

  // Initialize Firebase Service
  useEffect(() => {
    const initFirebase = async () => {
      if (isInitialized) {
        console.log('[App] Initializing Firebase service...');
        
        // Check if Firebase apps are available using v22.2.1 API
        const apps = getApps();
        if (apps.length === 0) {
          console.warn('[App] No Firebase apps found. Firebase features may be limited.');
        } else {
          console.log(`[App] Found ${apps.length} Firebase app(s)`);
        }
        
        const firebaseService = FirebaseService.getInstance();
        const success = await firebaseService.initializeMessaging();
        setFirebaseReady(success || true); // Allow app to continue even if FCM fails
        
        if (success) {
          console.log('[App] Firebase service initialized successfully');
        } else {
          console.warn('[App] Firebase service initialization failed, continuing without FCM');
          setFirebaseReady(true); // Allow app to continue
        }
      }
    };

    initFirebase();
  }, [isInitialized]);

  // Initialize VideoSDK Service
  useEffect(() => {
    const initVideoSDK = async () => {
      console.log('[App] Initializing VideoSDK service...');
      const videoSDKService = VideoSDKService.getInstance();
      const success = await videoSDKService.initialize();
      setVideoSDKReady(success || true);
      
      if (success) {
        console.log('[App] VideoSDK service initialized successfully');
      } else {
        console.warn('[App] VideoSDK service initialization failed, continuing without video calls');
        setVideoSDKReady(true); // Allow app to continue
      }
    };

    initVideoSDK();
  }, []);
  // Initialize permissions early when app is ready
  useEffect(() => {
    const initializePermissions = async () => {      if (isAuthenticated && isInitialized) {
        console.log('[App] Pre-requesting call permissions...');
        
        // Pre-request phone call permissions when app is fully ready
        setTimeout(async () => {
          try {
            const PermissionsService = require('./src/services/PermissionsService').default;
            await PermissionsService.requestPhoneCallForegroundServicePermission();
            console.log('[App] Phone call permissions pre-requested');
          } catch (error) {
            console.log('[App] Phone call permissions pre-request failed (not critical):', error);
          }
        }, 2000); // Wait 2 seconds after authentication to ensure Activity is ready
      }
    };

    initializePermissions();
  }, [isAuthenticated, isInitialized]);
  // Initialize Call Service and notify when navigation is ready
  useEffect(() => {
    console.log('[App] Call service is loading...');
    // Since CallService is a singleton exported as a default instance,
    // it is initialized at the time of import. There's no separate init method to call.
    setCallServiceReady(true);
    console.log('[App] Call service is ready.');
    
    // Notify CallService when navigation is ready
    if (isNavReady) {
      CallService.setNavigationReady();
    }
  }, [isNavReady]);

  // Setup notifications when Firebase is ready and user is authenticated
  useEffect(() => {
    const setupNotifications = async () => {
      if (firebaseReady && isAuthenticated) {
        console.log('[App] Setting up notifications...');
        const firebaseService = FirebaseService.getInstance();
        await firebaseService.setupNotifications();
      }
    };

    setupNotifications();
  }, [firebaseReady, isAuthenticated]);

  // Setup notification listeners
  useEffect(() => {
    if (firebaseReady) {
      console.log('[App] Setting up notification listeners...');
      const firebaseService = FirebaseService.getInstance();
      const unsubscribe = firebaseService.setupNotificationListeners();

      // Execute any delayed navigation
      firebaseService.executeDelayedNavigation();

      return unsubscribe;
    }
  }, [firebaseReady]);

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
      }
    };
    
    checkNavigationReady();
    
    // Set up a listener for navigation state changes
    const unsubscribe = navigationRef.addListener('ready', () => {
      console.log('[App] Navigation ready event fired');
      setIsNavReady(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize WhatsApp-like Call Manager (NEW enhanced system)
  useEffect(() => {
    const initWhatsAppCall = async () => {
      console.log('[App] Initializing WhatsApp Call Manager...');
      try {
        const whatsAppCallManager = WhatsAppCallManager.getInstance();
        const callNotificationHandler = CallNotificationHandler.getInstance();
        
        const success = await whatsAppCallManager.initialize();
        const notificationSuccess = await callNotificationHandler.initialize();
        
        setWhatsAppCallReady(success && notificationSuccess);
        
        if (success && notificationSuccess) {
          console.log('[App] ✅ WhatsApp Call Manager and Notification Handler initialized successfully');
        } else {
          console.warn('[App] ❌ WhatsApp Call system initialization failed, continuing without enhanced calls');
          setWhatsAppCallReady(true); // Allow app to continue
        }
      } catch (error) {
        console.error('[App] WhatsApp Call system initialization error:', error);
        setWhatsAppCallReady(true); // Allow app to continue even if fails
      }
    };

    initWhatsAppCall();
  }, [isInitialized]);

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

  if (!isInitialized || !firebaseReady || !videoSDKReady || !callServiceReady || !whatsAppCallReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.text.primary, marginTop: 10}}>Initializing...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated && user?.name ? (
        <>
          <RootStack.Screen name="Main" component={MainApp} />
          {/* REMOVE MeetingScreen from the root navigator */}
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
      {!user?.name && isAuthenticated && (
         <RootStack.Screen name="UserDetails" component={UserDetailsScreen} />
      )}
    </RootStack.Navigator>
  );
};

// Root App Component
function App(): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <CallProvider>
                <ShortsProvider>
                  <TabNavigatorProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <NavigationContainer ref={navigationRef}>
                        <AppNavigator />
                      </NavigationContainer>
                    </GestureHandlerRootView>
                  </TabNavigatorProvider>
                </ShortsProvider>
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
