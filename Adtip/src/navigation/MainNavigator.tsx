import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import navigators
import TabNavigator from './TabNavigator';

// Import screens
import CreatePostScreen from '../screens/content/CreatePostScreen';
import SelectCategoryScreen from '../screens/content/SelectCategoryScreen';
import TipTubeUploadScreen from '../screens/content/TipTubeUploadScreen';
import TipShortsUploadScreen from '../screens/content/TipShortsUploadScreen';
import VideoPreviewScreen from '../screens/media/VideoPreviewScreen';
import VideoScreen from '../screens/media/VideoScreen';
import ShortsScreen from '../screens/media/ShortsScreen';
import ChannelScreen from '../screens/channel/ChannelScreen';
import CreateChannelScreen from '../screens/channel/CreateChannelScreen';
import PackagesScreen from '../screens/packages/PackagesScreen';
import ChoosePackagesScreen from '../screens/packages/ChoosePackagesScreen';
import CheckoutScreen from '../screens/packages/CheckoutScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import PromotePostScreen from '../screens/content/PromotePostScreen';
import TrackOrderScreen from '../screens/shop/TrackOrderScreen';
import SearchScreen from '../screens/search/SearchScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';

// Create stack navigator
const Stack = createNativeStackNavigator();

/**
 * Main application stack navigator (when user is authenticated)
 */
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TabHome" component={TabNavigator} />
      
      {/* Content creation */}
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} />
      <Stack.Screen name="TipTubeUpload" component={TipTubeUploadScreen} />
      <Stack.Screen name="TipShortsUpload" component={TipShortsUploadScreen} />
      <Stack.Screen name="PromotePost" component={PromotePostScreen} />
      
      {/* Media viewing */}
      <Stack.Screen name="VideoPreview" component={VideoPreviewScreen} />
      <Stack.Screen name="Video" component={VideoScreen} />
      <Stack.Screen name="Shorts" component={ShortsScreen} />
      
      {/* Channel */}
      <Stack.Screen name="Channel" component={ChannelScreen} />
      <Stack.Screen name="CreateChannel" component={CreateChannelScreen} />
      
      {/* Packages and checkout */}
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="ChoosePackages" component={ChoosePackagesScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      
      {/* Other screens */}
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
