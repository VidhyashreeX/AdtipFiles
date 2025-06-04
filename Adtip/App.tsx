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
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Contexts
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {WalletProvider} from './src/contexts/WalletContext';
import {ThemeProvider} from './src/contexts/ThemeContext';
import {ShortsProvider} from './src/contexts/ShortsContext';

// Navigators
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import {navigationRef} from './src/navigation/NavigationService';

// Theme
import {COLORS} from './src/constants/colors';

// Stack type
const Stack = createNativeStackNavigator();

/**
 * App Navigator component that uses auth context
 */
const AppNavigator = () => {
  const {isAuthenticated, loading} = useAuth();

  useEffect(() => {
    const initApp = async () => {
      try {
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
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
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
  );
};

/**
 * Main application component
 */
function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appContentContainer}>
          <ThemeProvider>
            <AuthProvider>
              <WalletProvider>
                <ShortsProvider> 
                  <AppNavigator />
                </ShortsProvider>
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