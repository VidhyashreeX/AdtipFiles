import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import TipTubeScreen from '../screens/tiptube/TipTubeScreen';
import TipCallScreen from '../screens/tipcall/TipCallScreen';
import TipShopScreen from '../screens/tipshop/TipShopScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreateContentModal from '../screens/content/CreateContentModal';

// Import theme and contexts
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { withWalletBalance } from '../components/hoc/withWalletBalance';

// Create tab navigator
const Tab = createBottomTabNavigator();

/**
 * Custom tab bar button for the create content action
 */
const CreateContentButton = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.createButton, { backgroundColor: colors.primary }]}
      >
        <Icon name="plus" color={colors.white} size={24} />
      </TouchableOpacity>
      
      {modalVisible && (
        <CreateContentModal 
          visible={modalVisible} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
};

/**
 * Bottom tab navigator component
 */
const TabNavigator = () => {
  const { colors } = useTheme();
  const { balance } = useWallet();
  
  // Wrap screen components with wallet balance
  const EnhancedHomeScreen = withWalletBalance(HomeScreen);
  const EnhancedTipTubeScreen = withWalletBalance(TipTubeScreen);
  const EnhancedTipCallScreen = withWalletBalance(TipCallScreen);
  const EnhancedProfileScreen = withWalletBalance(ProfileScreen);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          backgroundColor: 'transparent',
          marginBottom: 16,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              blurType="light"
              blurAmount={10}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.white + 'F0' }]} />
          )
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={EnhancedHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="TipTube"
        component={EnhancedTipTubeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="video" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateContent"
        component={HomeScreen} // This is a dummy component, we're using custom tab bar button
        options={{
          tabBarButton: () => <CreateContentButton />,
          tabBarLabel: '',
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="TipCall"
        component={EnhancedTipCallScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="phone" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EnhancedProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    position: 'relative',
    zIndex: 10,
  },
});

export default TabNavigator;
