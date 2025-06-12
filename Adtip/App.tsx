/**
 * Adtip App
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  PixelRatio,
  Linking,
  Text,
  AppRegistry, // Add AppRegistry import
} from 'react-native';
import { register } from '@videosdk.live/react-native-sdk'; // Add VideoSDK import
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

  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme(); // Get colors from theme

  useEffect(() => {
    const initFirebaseMessaging = async () => {
      try {
        if (firebase.apps.length === 0) {
          console.log('Default Firebase app not initialized. Ensure native setup is correct.');
        }
        const instance = messaging();
        if (instance.isSupported()) { 
          setMessagingInstance(instance);
          console.log('Firebase Messaging is supported and initialized.');
          instance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background:', remoteMessage);
            return Promise.resolve();
          });
        } else {
          console.log('Firebase Messaging is NOT supported on this device.');
        }
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    };
    if (isInitialized) {
      initFirebaseMessaging();
    }
  }, [isInitialized]); 

  useEffect(() => {
    const setupNotifications = async () => {
      if (messagingInstance) { 
        try {
          await NotificationService.requestPermissions(messagingInstance);
          if (isAuthenticated) {
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
    setupNotifications();
  }, [isAuthenticated, messagingInstance]); 

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '[FCM] App opened from killed state by notification:',
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
             if (navigationRef.isReady()) {
                navigationRef.navigate('Main', { 
                    screen: 'TipCall', 
                    params: { initialCallNotificationData: callData } 
                });
             } else {
                console.warn('[FCM] Navigation not ready for initial notification, data might be lost if not handled.');
             }
          }
        }
      });

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
         navigationRef.navigate('Main', { 
            screen: 'TipCall', 
            params: { initialCallNotificationData: callData } 
         });
      }
    });
    // return () => {
    //   if (typeof unsubscribeForeground === 'function') {
    //     unsubscribeForeground();
    //   }
    // };
  }, []);


  // Show loading indicator ONLY while AuthContext is initializing
  if (!isInitialized) {
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        // Use dynamic theme colors for the loading screen background
        { backgroundColor: colors.background, paddingTop: insets.top } 
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {/* Ensure any text here is wrapped in a <Text> component */}
        <Text style={[styles.loadingText, { color: colors.text?.primary }]}>
          Initializing...
        </Text>
      </SafeAreaViewRN>
    );
  }
  
  return (
    <NavigationContainer 
      ref={navigationRef}
    >
      <View 
        style={{
          flex: 1, 
          width: '100%', 
          paddingTop: insets.top // This provides a global top padding; ensure it's intended.
                                // Individual screens or navigators might also handle safe areas.
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
  
  // Add VideoSDK initialization effect
  useEffect(() => {
    console.log('[App] VideoSDK service registered successfully');
  }, []);
  
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
            <AuthProvider>
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
    backgroundColor: COLORS.primary, // Outer background, if visible due to appContentContainer constraints
    width: '100%',
    height: '100%',
  },
  appContentContainer: {
    flex: 1,
    backgroundColor: COLORS.background, // Default background for the main content area
    width: '100%',
    overflow: 'hidden', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is now set dynamically using theme colors inline
    width: '100%',
  },
  loadingText: { // Added style for loading text
    marginTop: 10,
    fontSize: 16,
  }
});

// Register VideoSDK service before the component definitions
register();

const { name: appName } = require('./app.json');
AppRegistry.registerComponent(appName, () => App);

export default App;