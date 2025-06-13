// App.tsx

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  PixelRatio,
  Text,
  AppRegistry,
  Platform,
} from 'react-native';
import { register } from '@videosdk.live/react-native-sdk';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewRN,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';

// Components & Navigators
import Sidebar from './src/components/sidebar/Sidebar';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/NavigationService';
import NotificationService from './src/services/NotificationService';

// Constants
import { COLORS } from './src/constants/colors';

const Stack = createNativeStackNavigator();

// ✅ Theme-aware StatusBar
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

// ✅ AppNavigator with Firebase Messaging Setup
const AppNavigator = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [messagingReady, setMessagingReady] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    const initMessaging = async () => {
      try {
        // Wait for Firebase to be ready
        if (firebase.apps.length === 0) {
          console.warn('[Firebase] No app instance found, waiting...');
          // Give Firebase time to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (firebase.apps.length === 0) {
            console.error('[Firebase] Still no app instance after waiting');
            return;
          }
        }

        const msg = messaging();

        if (Platform.OS === 'android') {
          await msg.setAutoInitEnabled(true);
        }

        await msg.registerDeviceForRemoteMessages();
        setMessagingReady(true);

        msg.setBackgroundMessageHandler(async remoteMessage => {
          console.log('[FCM] Background message:', remoteMessage);
        });

        console.log('[FCM] Firebase messaging initialized');
      } catch (err) {
        console.error('[FCM] Firebase Messaging init failed:', err);
      }
    };

    if (isInitialized) {
      initMessaging();
    }
  }, [isInitialized]);

  // ✅ Notification Permission + Token
  useEffect(() => {
    const setupNotifications = async () => {
      if (messagingReady) {
        try {
          await NotificationService.requestPermissions(messaging());
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            await NotificationService.registerFcmToken(userId, messaging());
          }
        } catch (e) {
          console.error('[FCM] Notification setup failed:', e);
        }
      }
    };
    setupNotifications();
  }, [messagingReady, isAuthenticated]);

  // ✅ Handle notifications (killed + background)
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage?.data?.isIncomingCall === 'true') {
          navigationRef.navigate('Main', {
            screen: 'TipCall',
            params: {
              initialCallNotificationData: {
                callerName: remoteMessage.data.callerName,
                callType: remoteMessage.data.callType,
                channelName: remoteMessage.data.channelName,
                rtcToken: remoteMessage.data.agoraToken,
                callerRtcUid: remoteMessage.data.callerId,
                isFromNotification: true,
              }
            }
          });
        }
      });

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage?.data?.isIncomingCall === 'true') {
        navigationRef.navigate('Main', {
          screen: 'TipCall',
          params: {
            initialCallNotificationData: {
              callerName: remoteMessage.data.callerName,
              callType: remoteMessage.data.callType,
              channelName: remoteMessage.data.channelName,
              rtcToken: remoteMessage.data.agoraToken,
              callerRtcUid: remoteMessage.data.callerId,
              isFromNotification: true,
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isInitialized) {
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        { backgroundColor: colors.background, paddingTop: insets.top }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text?.primary }]}>
          Initializing...
        </Text>
      </SafeAreaViewRN>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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

// ✅ Root App Component
function App(): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    console.log('[App] VideoSDK registered');
  }, []);

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

// ✅ Styles
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
