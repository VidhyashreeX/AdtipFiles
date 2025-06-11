import React, {useState, useCallback, useMemo} from 'react'; // Add useMemo
import {StyleSheet, View, TouchableOpacity, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Feather';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import HomeScreen from '../screens/home/HomeScreen';
import TipTubeScreen from '../screens/tiptube/TipTubeScreen';
import TipCallScreen from '../screens/tipcall/TipCallScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreateContentModal from '../screens/content/CreateContentModal';

// Import theme and contexts
import {useTheme} from '../contexts/ThemeContext';
import {TabNavigatorProvider} from '../contexts/TabNavigatorContext';
import {withWalletBalance} from '../components/hoc/withWalletBalance';

// Create tab navigator
const Tab = createBottomTabNavigator();

/**
 * Bottom tab navigator component
 */
const TabNavigator = () => {
  const {colors, isDarkMode} = useTheme();
  const insets = useSafeAreaInsets();

  // Memoize enhanced components to prevent recreation
  const EnhancedHomeScreen = useMemo(() => withWalletBalance(HomeScreen), []);
  const EnhancedTipTubeScreen = useMemo(() => withWalletBalance(TipTubeScreen), []);
  const EnhancedTipCallScreen = useMemo(() => withWalletBalance(TipCallScreen), []);
  const EnhancedProfileScreen = useMemo(() => withWalletBalance(ProfileScreen), []);

  // Memoize tab bar height calculation
  const tabBarHeight = useMemo(() => 60 + Math.min(insets.bottom, 20), [insets.bottom]);

  // Memoize tab bar style
  const tabBarStyle = useMemo(() => ({
    position: 'absolute' as const,
    borderTopWidth: 0,
    elevation: 0,
    height: tabBarHeight,
    backgroundColor: 'transparent',
    marginBottom: 0, 
  }), [tabBarHeight]);

  // Memoize tab bar background component
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

  // Memoize tab bar item style
  const tabBarItemStyle = useMemo(() => ({
    paddingBottom: Math.min(insets.bottom, 10),
  }), [insets.bottom]);

  // Memoize screen options
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text.tertiary,
    tabBarStyle,
    tabBarBackground: TabBarBackground,
    tabBarItemStyle,
  }), [colors.primary, colors.text.tertiary, tabBarStyle, TabBarBackground, tabBarItemStyle]);

  // Memoize icon renderers
  const HomeIcon = useCallback(({color, size}: {color: string, size: number}) => (
    <Icon name="home" color={color} size={size} />
  ), []);

  const TipTubeIcon = useCallback(({color, size}: {color: string, size: number}) => (
    <Icon name="video" color={color} size={size} />
  ), []);

  const TipCallIcon = useCallback(({color, size}: {color: string, size: number}) => (
    <Icon name="phone" color={color} size={size} />
  ), []);

  const ProfileIcon = useCallback(({color, size}: {color: string, size: number}) => (
    <Icon name="user" color={color} size={size} />
  ), []);

  // Memoize the function that renders the CreateContentButton
  const renderCreateButton = useCallback(() => <CreateContentButton />, []);

  // Memoize tab press listener
  const createContentTabPress = useCallback((e: any) => {
    e.preventDefault(); // Prevent navigation
  }, []);

  return (
    <TabNavigatorProvider>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Home"
          component={EnhancedHomeScreen}
          options={{
            tabBarIcon: HomeIcon,
          }}
        />
        <Tab.Screen
          name="TipTube"
          component={EnhancedTipTubeScreen}
          options={{
            tabBarIcon: TipTubeIcon,
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
          component={EnhancedTipCallScreen}
          options={{
            tabBarIcon: TipCallIcon,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={EnhancedProfileScreen}
          options={{
            tabBarIcon: ProfileIcon,
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
    console.log('CreateContentButton: handlePress called');
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log('CreateContentButton: handleCloseModal called');
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
