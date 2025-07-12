import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Import only the allowed screens for guest users
import HomeScreen from '../screens/home/HomeScreen';
import TipTubeScreen from '../screens/tiptube/TipTubeScreen';
import TipShortsEnhanced from '../screens/tipshorts/TipShortsEnhanced';

// Import icons
import Icon from 'react-native-vector-icons/Feather';
import { View, TouchableOpacity, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginPromptModal from '../components/modals/LoginPromptModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Guest Tab Navigator - Only 3 allowed screens
const GuestTabNavigator = () => {
  const { colors } = useTheme();
  const { exitGuestMode } = useAuth();
  const insets = useSafeAreaInsets();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to access all features');

  const showRestrictedAccessPrompt = useCallback((feature: string) => {
    setLoginPromptMessage(`Login to access ${feature}`);
    setShowLoginPrompt(true);
  }, []);

  // Custom tab bar icons
  const HomeIcon = ({ focused }: { focused: boolean }) => (
    <Icon name="home" size={24} color={focused ? colors.primary : colors.text.secondary} />
  );

  const TipTubeIcon = ({ focused }: { focused: boolean }) => (
    <Icon name="play-circle" size={24} color={focused ? colors.primary : colors.text.secondary} />
  );

  const TipShortsIcon = ({ focused }: { focused: boolean }) => (
    <Icon name="video" size={24} color={focused ? colors.primary : colors.text.secondary} />
  );

  // Create content icon for guest mode (shows plus icon but triggers login prompt)
  const CreateContentIcon = ({ focused }: { focused: boolean }) => (
    <Icon name="plus" size={24} color={focused ? colors.primary : colors.text.secondary} />
  );

  // TipCall icon for guest mode (shows phone icon but triggers login prompt)
  const TipCallIcon = ({ focused }: { focused: boolean }) => (
    <Icon name="phone" size={24} color={focused ? colors.primary : colors.text.secondary} />
  );

  // Restricted button for features not available to guests
  const RestrictedButton = ({ feature, iconName, label }: { feature: string; iconName: string; label: string }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
      }}
      onPress={() => showRestrictedAccessPrompt(feature)}
    >
      <Icon name={iconName} size={24} color={colors.text.secondary} />
      <Text style={{
        color: colors.text.secondary,
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Calculate Android-specific padding for OS navbar
  const androidNavbarPadding = Platform.OS === 'android' ? 20 : 0; // Increased from 10 to 20
  const tabBarHeight = 60 + Math.min(insets.bottom, 20) + androidNavbarPadding;

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: tabBarHeight,
      paddingBottom: Math.max(insets.bottom, 8) + androidNavbarPadding,
      paddingTop: 8,
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text.secondary,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  };

  return (
    <>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: HomeIcon,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="TipTube"
          component={TipTubeScreen}
          options={{
            tabBarIcon: TipTubeIcon,
            tabBarLabel: 'Videos',
          }}
        />
        <Tab.Screen
          name="CreateContent"
          component={View} // Dummy component
          options={{
            tabBarButton: () => <RestrictedButton feature="content creation" iconName="plus" label="Create" />,
          }}
        />
        <Tab.Screen
          name="TipCall"
          component={View} // Dummy component
          options={{
            tabBarButton: () => <RestrictedButton feature="video calls" iconName="phone" label="Calls" />,
          }}
        />
        <Tab.Screen
          name="TipShorts"
          component={TipShortsEnhanced}
          options={{
            tabBarIcon: TipShortsIcon,
            tabBarLabel: 'Shorts',
          }}
        />
      </Tab.Navigator>

      {/* Login Prompt Modal for Restricted Features */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
      />
    </>
  );
};

// Guest Stack Navigator - Only contains the tab navigator
const GuestNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="GuestTabs" component={GuestTabNavigator} />
      {/* TipShorts as a separate screen for full-screen experience */}
      <Stack.Screen 
        name="TipShorts" 
        component={TipShortsEnhanced}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default GuestNavigator;
