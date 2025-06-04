/**
 * Adtip App
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Contexts
import {AuthProvider} from './src/contexts/AuthContext';
import {WalletProvider} from './src/contexts/WalletContext';

// Services
// Commented out PubScale integration - June 2, 2025
// import RewardService from './src/services/RewardService';
// import PubScaleService from './src/services/PubScaleService';

// Navigators
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import {navigationRef} from './src/navigation/NavigationService';

// Theme
import {ThemeProvider} from './src/contexts/ThemeContext';
import {COLORS} from './src/constants/colors';

// Stack type
const Stack = createNativeStackNavigator();

/**
 * Main application component
 */
function App(): React.JSX.Element {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Check authentication state and initialize services when app loads
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check auth status
        const userToken = await AsyncStorage.getItem('accessToken');
        const isAuth = !!userToken;
        setIsAuthenticated(isAuth);

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
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      // Commented out PubScale integration - June 2, 2025
      // PubScaleService.removeRewardListener();
    };
  }, []);

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appContentContainer}>
          <ThemeProvider>
            <AuthProvider>
              <WalletProvider>
                <NavigationContainer ref={navigationRef}>
                  <StatusBar
                    backgroundColor={COLORS.primary}
                    barStyle="light-content"
                  />
                  <Stack.Navigator screenOptions={{headerShown: false}}>
                    {isAuthenticated ? (
                      <Stack.Screen name="Main" component={MainNavigator} />
                    ) : (
                      <Stack.Screen name="Auth" component={AuthNavigator} />
                    )}
                  </Stack.Navigator>
                </NavigationContainer>
              </WalletProvider>
            </AuthProvider>
          </ThemeProvider>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Or a neutral color if status bar and app bg differ
  },
  appContentContainer: { // Replaces the role of the old 'styles.container' for the main app
    flex: 1,
    backgroundColor: COLORS.white, // App's main background color
  },
  loadingContainer: { // For the loading screen's SafeAreaView
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  // The original 'container' style is removed as 'appContentContainer' and 'safeArea' cover its roles.
  // If 'container' was used elsewhere, it might need to be kept or refactored.
});

export default App;
