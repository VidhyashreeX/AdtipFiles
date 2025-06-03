import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import UserDetailsScreen from '../screens/auth/UserDetailsScreen';

// Create stack navigator
const Stack = createNativeStackNavigator();

/**
 * Authentication flow stack navigator
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
