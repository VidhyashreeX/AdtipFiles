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
    const insets = useSafeAreaInsets();
    return (
      <SafeAreaViewRN style={[
        styles.loadingContainer,
        { paddingTop: insets.top } // Apply top inset to start below status bar
      ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaViewRN>
    );  }
  
  // Get safe area insets to ensure content renders below status bar
  const insets = useSafeAreaInsets();  const { isDarkMode, colors } = useTheme();
  
  return (
    <NavigationContainer 
      ref={navigationRef}
    >
      <View 
        style={{
          flex: 1, 
          width: '100%', 
          paddingTop: insets.top // Apply top padding to avoid content appearing behind status bar
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
  
  // Get normalized dimensions that adjust for different screen densities
  const normalizedWidth = width / PixelRatio.get();
  const normalizedHeight = height / PixelRatio.get();
  
  // This will be used if we need to apply different styles based on orientation
  const isLandscape = width > height;
  
  // We will access ThemeContext inside ThemeProvider render
  
  return (
    <SafeAreaProvider>
      {/* Use the SafeAreaView from react-native-safe-area-context which is more reliable */}
      <SafeAreaViewRN 
        style={styles.safeArea}
        edges={['left', 'right', 'bottom']} // Exclude top edge to handle it manually in AppNavigator
      >        
        <View 
          style={[
            styles.appContentContainer,
            {
              // Apply conditional styling based on orientation if needed
              maxWidth: isLandscape && (width >= 768) ? 900 : '100%',
              alignSelf: 'center',
            }
          ]}
        >          <ThemeProvider>
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
    backgroundColor: COLORS.primary,
    width: '100%',
    height: '100%',
  },
  appContentContainer: {
    flex: 1,
    backgroundColor: COLORS.background, // Use theme-compatible background color
    width: '100%',
    overflow: 'hidden', // Ensure nothing renders outside container bounds
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background, // Use theme-compatible background color
    width: '100%',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0, // Respect status bar height on Android
      },
    }),
  },
});

export default App;