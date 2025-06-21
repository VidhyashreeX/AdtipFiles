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

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { VideoSDKProvider } from './src/contexts/VideoSDKContext';

// Components & Navigators
import Sidebar from './src/components/sidebar/Sidebar';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/NavigationService';

// Services
import FirebaseService from './src/services/FirebaseService';
import VideoSDKService from './src/services/videosdk/VideoSDKService';
import CallService from './src/services/CallService';

// Constants
import { COLORS } from './src/constants/colors';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';

const Stack = createNativeStackNavigator();

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

// AppNavigator with Services
const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [videoSDKReady, setVideoSDKReady] = useState(false);
  const [callServiceReady, setCallServiceReady] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();

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
        setFirebaseReady(success);
        
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
      setVideoSDKReady(success);
      
      if (success) {
        console.log('[App] VideoSDK service initialized successfully');
      } else {
        console.warn('[App] VideoSDK service initialization failed, continuing without video calls');
        setVideoSDKReady(true); // Allow app to continue
      }
    };

    initVideoSDK();
  }, []);

  // Initialize Call Service
  useEffect(() => {
    const initializeCallService = async () => {
      try {
        console.log('[App] Initializing Call service...');
        const callService = CallService.getInstance();
        await callService.initialize();
        setCallServiceReady(true);
        console.log('[App] Call service initialized successfully');
      } catch (error) {
        console.error('[App] Failed to initialize CallService:', error);
        setCallServiceReady(true); // Allow app to continue
      }
    };

    initializeCallService();
  }, []);

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

  const allServicesReady = firebaseReady && videoSDKReady && callServiceReady;

  if (!isInitialized || !allServicesReady) {
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        { backgroundColor: colors.background, paddingTop: insets.top }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text?.primary }]}>
          {!isInitialized ? 'Initializing...' : 
           !firebaseReady ? 'Setting up notifications...' :
           !videoSDKReady ? 'Initializing video services...' :
           !callServiceReady ? 'Setting up call management...' : 'Loading...'}
        </Text>
      </SafeAreaViewRN>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            // User not authenticated - show auth flow
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : user?.isSaveUserDetails === 0 ? (
            // User authenticated but profile incomplete - show user details
            <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
          ) : (
            // User fully authenticated with complete profile - show main app
            <Stack.Screen name="Main" component={MainNavigator} />
          )}
        </Stack.Navigator>
        <Sidebar />
      </View>
    </NavigationContainer>
  );
};

// Root App Component
function App(): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaProvider>
      <SafeAreaViewRN style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View
          style={[
            styles.appContentContainer,
            {
              maxWidth: isLandscape && (width >= 768) ? 900 : '100%',
              alignSelf: 'center',
            }
          ]}
        >
          <ThemeProvider>
            <ThemeAwareStatusBar />
            <AuthProvider>
              <WalletProvider>
                <VideoSDKProvider>
                  <ShortsProvider>
                    <SidebarProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <AppNavigator />
                      </GestureHandlerRootView>
                    </SidebarProvider>
                  </ShortsProvider>
                </VideoSDKProvider>
              </WalletProvider>
            </AuthProvider>
          </ThemeProvider>
        </View>
      </SafeAreaViewRN>
    </SafeAreaProvider>
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
