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
  // const [initialCallData, setInitialCallData] = useState<any>(null); // This state seems unused, consider removing if not needed for other logic

  // Call all hooks at the top level
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme(); // Assuming useTheme() is from your ThemeContext

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

        // Check if messaging is supported.
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
                // Consider a more robust queueing mechanism for pending navigations if this is a common issue.
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

    // It's good practice to store and call the unsubscribe function
    // return () => {
    //   if (typeof unsubscribeForeground === 'function') {
    //     unsubscribeForeground();
    //   }
    // };
  }, []);


  // Show loading indicator ONLY while AuthContext is initializing
  if (!isInitialized) {
    // const insets = useSafeAreaInsets(); // Moved to top
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        { paddingTop: insets.top } // 'insets' is now available from the top-level call
      ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaViewRN>
    );
  }
  
  // const insets = useSafeAreaInsets(); // Moved to top
  // const { isDarkMode, colors } = useTheme(); // Moved to top
  
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