/**
 * Adtip App
 *
 * @format
 */

import React, { useEffect, useState } from 'react'; // Ensure useState and useEffect are imported
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  PixelRatio,
  Linking
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewRN,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app'; // Import firebase for app instance

// Contexts
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {WalletProvider} from './src/contexts/WalletContext';
import {ThemeProvider, useTheme} from './src/contexts/ThemeContext';
import {ShortsProvider} from './src/contexts/ShortsContext';
import {SidebarProvider} from './src/contexts/SidebarContext';

// Components
import Sidebar from './src/components/sidebar/Sidebar';

// Navigators
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import {navigationRef} from './src/navigation/NavigationService';

// Theme
import {COLORS} from './src/constants/colors';
import NotificationService from './src/services/NotificationService';

// Stack type
const Stack = createNativeStackNavigator();

// Theme-aware status bar component
const ThemeAwareStatusBar = () => {
  const { isDarkMode } = useTheme();
  return (
    <StatusBar
      translucent={true}
      backgroundColor="transparent"
      barStyle={isDarkMode ? "light-content" : "dark-content"}
    />
  );
};

/**
 * App Navigator component that uses auth context
 */
const AppNavigator = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [messagingInstance, setMessagingInstance] = useState<ReturnType<typeof messaging> | null>(null);
  const [initialCallData, setInitialCallData] = useState<any>(null); // Store initial call data

  useEffect(() => {
    const initFirebaseMessaging = async () => {
      try {
        // Check if the default Firebase app is initialized.
        // This usually happens automatically via native configuration.
        if (firebase.apps.length === 0) {
          // You might call firebase.initializeApp() here if you have a specific non-default setup,
          // but for the default app, native initialization is standard.
          console.log('Default Firebase app not initialized. Ensure native setup is correct.');
          // Optionally, initialize explicitly: await firebase.initializeApp();
        }

        const instance = messaging(); // Get the messaging instance

        // Check if messaging is supported. Your usage is correct.
        // The linter warning about this is likely due to type definition issues.
        if (instance.isSupported) {
          setMessagingInstance(instance);
          console.log('Firebase Messaging is supported and initialized.');

          // Set background message handler. Your usage is correct.
          // The linter warning about this is also likely due to type definition issues.
          instance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background:', remoteMessage);
            // Your background message handling logic here.
            // This handler must return a Promise.
            return Promise.resolve();
          });
        } else {
          console.log('Firebase Messaging is NOT supported on this device.');
        }
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    };

    // Example: Initialize Firebase Messaging only after auth state is determined
    if (isInitialized) {
      initFirebaseMessaging();
    }

    // Optional: Cleanup function if needed
    // return () => {
    //   // Perform any cleanup, e.g., unsubscribe from listeners
    // };
  }, [isInitialized]); // Re-run effect if isInitialized changes

  useEffect(() => {
    const setupNotifications = async () => {
      if (messagingInstance) { // Ensure messagingInstance is available
        try {
          await NotificationService.requestPermissions(messagingInstance);
          
          // Register FCM token with backend if user is authenticated
          if (isAuthenticated) {
            // Get user ID from auth context or storage
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
              await NotificationService.registerFcmToken(userId, messagingInstance);
            }
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    // Only run this effect if messagingInstance or isAuthenticated changes
    // This ensures permissions and token registration happen after Firebase Messaging is ready
    setupNotifications();

    return () => {
      // Cleanup logic if any for NotificationService listeners
    };
  }, [isAuthenticated, messagingInstance]); // Dependencies

  useEffect(() => {
    // Check for initial notification when app opens from killed state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '[FCM] App opened from killed state by notification:',
            remoteMessage.data,
          );
          // Assuming your CallNotificationService puts relevant data here
          // You might need to adapt this based on the actual structure of remoteMessage.data
          // and what your CallNotificationService.java puts in the intent.
          // The `extractCallData` logic from TipCallScreen's NotificationService could be reused or adapted.
          if (remoteMessage.data && remoteMessage.data.isIncomingCall === 'true') { // Check your actual data keys
             const callData = { // Reconstruct call data similar to what RTM provides
                callerName: remoteMessage.data.callerName,
                callType: remoteMessage.data.callType as ('voice' | 'video'),
                channelName: remoteMessage.data.channelName,
                rtcToken: remoteMessage.data.agoraToken, // Ensure this is the RTC token
                callerRtcUid: remoteMessage.data.callerId, // Assuming callerId from FCM is the RTM/RTC UID
                // This is not a full RtmRemoteInvitation, so TipCallScreen needs to handle this partial data
                isFromNotification: true, 
             };
             setInitialCallData(callData);
          }
        }
      });

    // Listen for notifications when app is in background and opened
    const unsubscribeForeground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        '[FCM] App opened from background by notification:',
        remoteMessage.data,
      );
      if (remoteMessage.data && remoteMessage.data.isIncomingCall === 'true') {
         const callData = {
            callerName: remoteMessage.data.callerName,
            callType: remoteMessage.data.callType as ('voice' | 'video'),
            channelName: remoteMessage.data.channelName,
            rtcToken: remoteMessage.data.agoraToken,
            callerRtcUid: remoteMessage.data.callerId,
            isFromNotification: true,
         };
         // Navigate to TipCallScreen or set state that TipCallScreen can read
         // For simplicity, if TipCallScreen is always part of the stack,
         // you could use navigation events or a global state/context.
         // Or, pass initialCallData down as a prop.
         navigationRef.navigate('Main', { 
            screen: 'TipCall', // Assuming TipCall is a screen in MainNavigator
            params: { initialCallNotificationData: callData } 
         });
      }
    });

    return () => {
      // unsubscribeForeground(); // If you store the unsubscribe function
    };
  }, []);


  // Show loading indicator ONLY while AuthContext is initializing
  if (!isInitialized) {
    const insets = useSafeAreaInsets();
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        { paddingTop: insets.top }
      ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaViewRN>
    );
  }
  
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();
  
  return (
    <NavigationContainer 
      ref={navigationRef}
    >
      <View 
        style={{
          flex: 1, 
          width: '100%', 
          paddingTop: insets.top 
        }}
      >
        <Stack.Navigator 
          screenOptions={{
            headerShown: false,
            contentStyle: {
              width: '100%',
              height: '100%'
            }
          }}
        >
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
        <Sidebar />
      </View>
    </NavigationContainer>
  );
};

/**
 * Main application component
 */
function App(): React.JSX.Element {
  const {width, height} = useWindowDimensions();
  
  const normalizedWidth = width / PixelRatio.get();
  const normalizedHeight = height / PixelRatio.get();
  
  const isLandscape = width > height;
  
  
  return (
    <SafeAreaProvider>
      <SafeAreaViewRN 
        style={styles.safeArea}
        edges={['left', 'right', 'bottom']} 
      >
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
            <AuthProvider> {/* AuthProvider now correctly wraps AppNavigator */}
              <WalletProvider>
                <ShortsProvider>
                  <SidebarProvider>
                    <AppNavigator />
                  </SidebarProvider>
                </ShortsProvider>
              </WalletProvider>
            </AuthProvider>
          </ThemeProvider>
        </View>
      </SafeAreaViewRN>
    </SafeAreaProvider>
  );
}

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
    backgroundColor: COLORS.background, 
    width: '100%',
  },
});

export default App;