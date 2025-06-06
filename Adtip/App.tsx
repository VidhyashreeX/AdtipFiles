/**
 * Adtip App
 *
 * @format
 */

import React, {useEffect} from 'react';
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
import { getMessaging, isSupported } from '@react-native-firebase/messaging';

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

const firebaseApp = initializeApp();
const messagingInstance = isSupported() ? getMessaging(firebaseApp) : null;

/**
 * App Navigator component that uses auth context
 */
const AppNavigator = () => {
  const {isAuthenticated, isInitialized} = useAuth(); // <-- Get isInitialized, remove loading

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize push notifications
        if (messagingInstance) {
          await NotificationService.requestPermissions(messagingInstance);
          
          // Set background message handler for call notifications
          messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background:', remoteMessage);
            // Our Java service will handle the notification UI
            return Promise.resolve();
          });

          // Register FCM token with backend if user is authenticated
          if (isAuthenticated) {
            // Get user ID from auth context or storage
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
              await NotificationService.registerFcmToken(userId, messagingInstance);
            }
          }
        }

        // Commented out PubScale integration - June 2, 2025
        // Initialize PubScale SDK with user ID
        // await PubScaleService.initialize(userId);

        // Initialize reward service
        // await RewardService.init();

        // Set up PubScale reward listener
        // PubScaleService.setRewardListener((reward) => {
        //   console.log('Reward received in App.tsx:', reward);
        //   // You can call your backend API here to update the user's balance
        // });
      } catch (error) {
        console.log('Error initializing app:', error);
      }
    };

    initApp();

    return () => {
      // Cleanup logic
      // Commented out PubScale integration - June 2, 2025
      // PubScaleService.removeRewardListener();
    };
  }, [isAuthenticated]); // Add isAuthenticated as a dependency since we use it

  // Show loading indicator ONLY while AuthContext is initializing
  if (!isInitialized) { // <-- Use !isInitialized here
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
        >          <ThemeProvider>
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
    backgroundColor: COLORS.primary, // This might be better as theme background or transparent
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
    // paddingTop is handled by SafeAreaViewRN in the component now
  },
});

export default App;