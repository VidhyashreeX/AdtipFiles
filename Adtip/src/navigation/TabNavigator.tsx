import React, {useState, useCallback, useMemo, memo} from 'react'; // Add memo for performance
import {StyleSheet, View, TouchableOpacity, Platform, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Feather';
import { CirclePlay, Airplay } from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useWallet} from '../contexts/WalletContext';
import {useNavigation} from '@react-navigation/native';

import HomeScreen from '../screens/home/HomeScreen';
import TipTubeScreen from '../screens/tiptube/TipTubeScreen';
import TipCallScreenSimple from '../screens/tipcall/TipCallScreenSimple';
import CreateContentModal from '../screens/content/CreateContentModal';
import TipShortsEnhanced from '../screens/tipshorts/TipShortsEnhanced';

// Import theme and contexts
import {useTheme} from '../contexts/ThemeContext';
import {TabNavigatorProvider} from '../contexts/TabNavigatorContext';
// Removed withWalletBalance HOC import - using direct useWallet hook in components instead
import {Logger} from '../utils/ProductionLogger';

// Create tab navigator
const Tab = createBottomTabNavigator();

// ✅ PERFORMANCE FIX: Removed HOC wrappers - components now use useWallet hook directly
// This eliminates unnecessary re-renders on wallet balance updates

/**
 * Bottom tab navigator component
 */
const TabNavigator = () => {
  const {colors, isDarkMode} = useTheme();
  const insets = useSafeAreaInsets();
  const {balance, isLoading} = useWallet();
  const navigation = useNavigation<any>();

  // REMOVED: Memoized enhanced components are now defined outside.

  // ✅ PERFORMANCE FIX: Simplified calculations without unnecessary memoization
  const tabBarHeight = 60 + Math.min(insets.bottom, 20);

  const tabBarStyle = {
    position: 'absolute' as const,
    borderTopWidth: 0,
    elevation: 0,
    height: tabBarHeight,
    backgroundColor: 'transparent',
    marginBottom: 0,
  };

  // Only memoize expensive components that actually benefit from it
  const TabBarBackground = useCallback(() =>
    Platform.OS === 'ios' ? (
      <BlurView
        blurType={isDarkMode ? 'dark' : 'light'}
        blurAmount={10}
        style={StyleSheet.absoluteFill}
      />
    ) : (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? colors.card + 'F0'
              : colors.white + 'F0',
          },
        ]}
      />
    ), [isDarkMode, colors.card, colors.white]);

  const tabBarItemStyle = {
    paddingBottom: Math.min(insets.bottom, 10),
  };

  // ✅ SIMPLIFIED: Only memoize when colors change (actual expensive operation)
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text.tertiary,
    tabBarStyle,
    tabBarBackground: TabBarBackground,
    tabBarItemStyle,
  }), [colors.primary, colors.text.tertiary, TabBarBackground]);

  // ✅ SIMPLIFIED: Simple icon renderers don't need memoization
  const HomeIcon = ({color, size}: {color: string, size: number}) => (
    <Icon name="home" color={color} size={size} />
  );

  const TipTubeIcon = ({color, size}: {color: string, size: number}) => (
    <Airplay color={color} size={size} />
  );

  const TipShortsIcon = ({color, size}: {color: string, size: number}) => (
    <CirclePlay color={color} size={size} />
  );

  const TipCallIcon = ({color, size}: {color: string, size: number}) => (
    <Icon name="phone" color={color} size={size} />
  );

  const ProfileIcon = ({color, size}: {color: string, size: number}) => (
    <Icon name="user" color={color} size={size} />
  );

  // Only memoize components that have complex logic
  const renderCreateButton = useCallback(() => <CreateContentButton />, []);

  // Instant navigation handlers - prioritize navigation over data loading
  const handleInstantNavigation = useCallback((routeName: string) => {
    return (e: any) => {
      // Don't prevent default navigation - let it proceed immediately
      // This ensures instant navigation regardless of current screen's loading state
      Logger.debug('TabNavigator', `Instant navigation to ${routeName}`);

      // Force immediate navigation without waiting for current screen data
      setTimeout(() => {
        // Use the tab navigator's jumpTo method for instant tab switching
        if (navigation && typeof navigation.jumpTo === 'function') {
          navigation.jumpTo(routeName);
        }
      }, 0);
    };
  }, [navigation]);

  // Memoize tab press listeners for instant navigation
  const homeTabPress = useCallback(handleInstantNavigation('Home'), [handleInstantNavigation]);
  const tipTubeTabPress = useCallback(handleInstantNavigation('TipTube'), [handleInstantNavigation]);
  const tipCallTabPress = useCallback(handleInstantNavigation('TipCall'), [handleInstantNavigation]);
  const profileTabPress = useCallback(handleInstantNavigation('Profile'), [handleInstantNavigation]);

  // Custom handler for TipShorts - navigate to fullscreen version
  const tipShortsTabPress = useCallback((e: any) => {
    e.preventDefault(); // Prevent default tab navigation
    Logger.debug('TabNavigator', 'TipShorts tab pressed - navigating to fullscreen');
    navigation.navigate('TipShorts'); // Navigate to the stack screen for fullscreen experience
  }, [navigation]);

  // Memoize tab press listener for create content (prevents navigation)
  const createContentTabPress = useCallback((e: any) => {
    e.preventDefault(); // Prevent navigation
  }, []);

  return (
    <TabNavigatorProvider>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: HomeIcon,
          }}
          listeners={{
            tabPress: homeTabPress,
          }}
        />
        <Tab.Screen
          name="TipTube"
          component={TipTubeScreen}
          options={{
            tabBarIcon: TipTubeIcon,
          }}
          listeners={{
            tabPress: tipTubeTabPress,
          }}
        />
        <Tab.Screen
          name="CreateContent"
          component={HomeScreen} // Dummy component
          options={{
            tabBarButton: renderCreateButton,
            tabBarLabel: '',
          }}
          listeners={{
            tabPress: createContentTabPress,
          }}
        />
        <Tab.Screen
          name="TipCall"
          component={TipCallScreenSimple}
          options={{
            tabBarIcon: TipCallIcon,
          }}
          listeners={{
            tabPress: tipCallTabPress,
          }}
        />
        <Tab.Screen
          name="TipShorts"
          component={TipShortsEnhanced}
          options={{
            tabBarIcon: TipShortsIcon,
          }}
          listeners={{
            tabPress: tipShortsTabPress, // Use custom handler for fullscreen navigation
          }}
        />
      </Tab.Navigator>
    </TabNavigatorProvider>
  );
};

/**
 * Custom tab bar button for the create content action
 */
const CreateContentButton = () => {
  const {colors} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = useCallback(() => {
    Logger.debug('CreateContentButton', 'handlePress called');
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    Logger.debug('CreateContentButton', 'handleCloseModal called');
    setModalVisible(false);
  }, []);

  return (
    <>
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={[styles.createButton, {backgroundColor: colors.primary}]}>
          <Icon name="plus" color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {modalVisible && (
        <CreateContentModal visible={modalVisible} onClose={handleCloseModal} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, 
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    position: 'relative',
    zIndex: 10,
  },
  createButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(TabNavigator);
