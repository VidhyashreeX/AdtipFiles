/**
 * Adtip App
 *
 * @format
 */

import React, {useEffect, useState} from 'react'; // Import useState
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewRN,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from '@react-native-firebase/app';
import { getMessaging, isSupported } from '@react-native-firebase/messaging'; // isSupported is still imported, but used later

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

// Remove these lines from the top level
// const firebaseApp = initializeApp();
// const messagingInstance = isSupported() ? getMessaging(firebaseApp) : null;

/**
 * App Navigator component that uses auth context
 */
const AppNavigator = () => {
  const {isAuthenticated, isInitialized} = useAuth();
  // State to hold the messaging instance once it's initialized
  const [messagingInstance, setMessagingInstance] = useState(null);

  useEffect(() => {
    const initFirebaseMessaging = async () => {
      try {
        const firebaseApp = initializeApp(); // Initialize Firebase app here
        // Check if messaging is supported dynamically
        const isMessagingSupported = await isSupported(); // Await isSupported()
        if (isMessagingSupported) {
          const instance = getMessaging(firebaseApp);
          setMessagingInstance(instance); // Set the instance in state
          console.log('Firebase Messaging is supported and initialized.');

          // Set background message handler for call notifications
          instance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background:', remoteMessage);
            // Our Java service will handle the notification UI
            return Promise.resolve();
          });
        } else {
          console.log('Firebase Messaging is NOT supported on this device.');
        }
      } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
      }
    };

    initFirebaseMessaging();

    return () => {
      // Cleanup if needed, though usually not for firebase messaging
    };
  }, []); // Run only once on component mount

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