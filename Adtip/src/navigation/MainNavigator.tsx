import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Import navigators
import TabNavigator from './TabNavigator';

// Import the withWalletBalance HOC
import {withWalletBalance} from '../components/hoc/withWalletBalance';

// Import screens
import CreatePostScreen from '../screens/content/CreatePostScreen';
import SelectCategoryScreen from '../screens/content/SelectCategoryScreen';
import TipTubeUploadScreen from '../screens/content/TipTubeUploadScreen';
import TipShortsUploadScreen from '../screens/content/TipShortsUploadScreen';
import TipShorts from '../screens/tipshorts/tipshorts';
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
  // Wrap all individual screens with the wallet balance HOC
  const EnhancedCreatePostScreen = withWalletBalance(CreatePostScreen);
  const EnhancedSelectCategoryScreen = withWalletBalance(SelectCategoryScreen);
  const EnhancedTipTubeUploadScreen = withWalletBalance(TipTubeUploadScreen);
  const EnhancedTipShortsUploadScreen = withWalletBalance(
    TipShortsUploadScreen,
  );
  const EnhancedPromotePostScreen = withWalletBalance(PromotePostScreen);
  const EnhancedVideoPreviewScreen = withWalletBalance(VideoPreviewScreen);
  const EnhancedVideoScreen = withWalletBalance(VideoScreen);
  const EnhancedShortsScreen = withWalletBalance(ShortsScreen);
  const EnhancedTipShortsScreen = withWalletBalance(TipShorts);
  const EnhancedChannelScreen = withWalletBalance(ChannelScreen);
  const EnhancedCreateChannelScreen = withWalletBalance(CreateChannelScreen);
  const EnhancedPackagesScreen = withWalletBalance(PackagesScreen);
  const EnhancedChoosePackagesScreen = withWalletBalance(ChoosePackagesScreen);
  const EnhancedCheckoutScreen = withWalletBalance(CheckoutScreen);
  const EnhancedAnalyticsScreen = withWalletBalance(AnalyticsScreen);
  const EnhancedProfileScreen = withWalletBalance(ProfileScreen);
  const EnhancedTrackOrderScreen = withWalletBalance(TrackOrderScreen);
  const EnhancedSearchScreen = withWalletBalance(SearchScreen);
  const EnhancedNotificationScreen = withWalletBalance(NotificationScreen);
  const EnhancedSettingsScreen = withWalletBalance(SettingsScreen);
  const EnhancedEarningsScreen = withWalletBalance(EarningsScreen);
  const EnhancedReferralScreen = withWalletBalance(ReferralScreen);

  // Note: We don't wrap WalletScreen because it already has its own direct wallet balance implementation

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="TabHome" component={TabNavigator} />
      {/* Content creation */}
      <Stack.Screen name="CreatePost" component={EnhancedCreatePostScreen} />
      <Stack.Screen
        name="SelectCategory"
        component={EnhancedSelectCategoryScreen}
      />
      <Stack.Screen
        name="TipTubeUpload"
        component={EnhancedTipTubeUploadScreen}
      />
      <Stack.Screen
        name="TipShortsUpload"
        component={EnhancedTipShortsUploadScreen}
      />
      <Stack.Screen name="PromotePost" component={EnhancedPromotePostScreen} />
      {/* Media viewing */}
      <Stack.Screen
        name="VideoPreview"
        component={EnhancedVideoPreviewScreen}
      />
      <Stack.Screen name="Video" component={EnhancedVideoScreen} />
      <Stack.Screen name="TipShorts" component={EnhancedTipShortsScreen} />
      <Stack.Screen name="Shorts" component={EnhancedShortsScreen} />
      {/* Channel */}
      <Stack.Screen name="Channel" component={EnhancedChannelScreen} />
      <Stack.Screen
        name="CreateChannel"
        component={EnhancedCreateChannelScreen}
      />
      {/* Packages and checkout */}
      <Stack.Screen name="Packages" component={EnhancedPackagesScreen} />
      <Stack.Screen
        name="ChoosePackages"
        component={EnhancedChoosePackagesScreen}
      />
      <Stack.Screen name="Checkout" component={EnhancedCheckoutScreen} />
      {/* Other screens */}
      <Stack.Screen name="Analytics" component={EnhancedAnalyticsScreen} />
      <Stack.Screen name="Profile" component={EnhancedProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="TrackOrder" component={EnhancedTrackOrderScreen} />
      <Stack.Screen name="Search" component={EnhancedSearchScreen} />
      <Stack.Screen
        name="Notifications"
        component={EnhancedNotificationScreen}
      />
      <Stack.Screen name="Settings" component={EnhancedSettingsScreen} />
      <Stack.Screen name="Earnings" component={EnhancedEarningsScreen} />
      <Stack.Screen name="Referral" component={EnhancedReferralScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
