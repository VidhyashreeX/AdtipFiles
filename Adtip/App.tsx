/**
 * Adtip App
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  View,
  ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Auth Context
import { AuthProvider } from './src/contexts/AuthContext';

// Services
// Commented out PubScale integration - June 2, 2025
// import RewardService from './src/services/RewardService';
// import PubScaleService from './src/services/PubScaleService';

// Navigators
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

// Theme
import { ThemeProvider } from './src/contexts/ThemeContext';
import { COLORS } from './src/constants/colors';

// Stack type
const Stack = createNativeStackNavigator();

/**
 * Main application component
 */
function App(): React.JSX.Element {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Check authentication state and initialize services when app loads
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check auth status
        const userToken = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId') || 'anonymous_user';
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
        console.error("Error initializing app:", error);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <Stack.Screen name="Main" component={MainNavigator} />
              ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  }
});

export default App;
