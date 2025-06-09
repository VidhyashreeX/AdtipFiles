import React, {useState, useCallback} from 'react'; // Added useCallback
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
 * Custom tab bar button for the create content action
 */
const CreateContentButton = () => {
  const {colors} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    console.log('CreateContentButton: handlePress called'); // DEBUG
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    console.log('CreateContentButton: handleCloseModal called'); // DEBUG
    setModalVisible(false);
  };

  console.log('CreateContentButton: rendering, modalVisible =', modalVisible); // DEBUG

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

      {/* Ensure CreateContentModal is correctly rendered using the state */}
      {modalVisible && (
        <CreateContentModal visible={modalVisible} onClose={handleCloseModal} />
      )}
    </>
  );
};

/**
 * Bottom tab navigator component
 */
const TabNavigator = () => {
  const {colors, isDarkMode} = useTheme();
  const insets = useSafeAreaInsets();

  const EnhancedHomeScreen = withWalletBalance(HomeScreen);
  const EnhancedTipTubeScreen = withWalletBalance(TipTubeScreen);
  const EnhancedTipCallScreen = withWalletBalance(TipCallScreen);
  const EnhancedProfileScreen = withWalletBalance(ProfileScreen);

  const tabBarHeight = 60 + Math.min(insets.bottom, 20);

  // Memoize the function that renders the CreateContentButton
  // This prevents CreateContentButton from re-instantiating on every TabNavigator re-render
  const renderCreateButton = useCallback(() => <CreateContentButton />, []);

  return (
    <TabNavigatorProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: tabBarHeight,
            backgroundColor: 'transparent',
            marginBottom: 0, 
          },
          tabBarBackground: () =>
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
            ),
          tabBarItemStyle: {
            paddingBottom: Math.min(insets.bottom, 10),
          },
        }}>
        <Tab.Screen
          name="Home"
          component={EnhancedHomeScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="TipTube"
          component={EnhancedTipTubeScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="video" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="CreateContent"
          component={HomeScreen} // Dummy component, actual action is via tabBarButton
          options={{
            tabBarButton: renderCreateButton, // Use the memoized function
            tabBarLabel: '',
          }}
          listeners={{
            tabPress: e => {
              e.preventDefault(); // Prevent navigation
            },
          }}
        />
        <Tab.Screen
          name="TipCall"
          component={EnhancedTipCallScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="phone" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={EnhancedProfileScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="user" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </TabNavigatorProvider>
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

export default TabNavigator;
