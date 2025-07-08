import React, { useEffect } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { withFastLoading } from '../components/hoc/withFastLoading';
import { MainNavigatorParamList } from '../types/navigation';
// Import the navigation ref for global navigation
import { navigationRef } from './NavigationService';

// Import navigators
import TabNavigator from './TabNavigator';

// Import the withWalletBalance HOC
import { withWalletBalance } from '../components/hoc/withWalletBalance';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import CreatePostScreen from '../screens/content/CreatePostScreen';
import SelectCategoryScreen from '../screens/content/SelectCategoryScreen';
import TipTubeUploadScreen from '../screens/content/TipTubeUploadScreen';
import TipShortsUploadScreen from '../screens/content/TipShortsUploadScreen';
// Replace TipShorts import with TipShortsEnhanced
import TipShortsEnhanced from '../screens/tipshorts/TipShortsEnhanced';
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
import EditProfile from '../screens/profile/EditProfile';
import WalletScreen from '../screens/wallet/WalletScreen';
import PromotePostScreen from '../screens/content/PromotePostScreen';
import TrackOrderScreen from '../screens/shop/TrackOrderScreen';
import SearchScreen from '../screens/search/SearchScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';
import ChooseGameScreen from '../screens/playtoEarn/ChooseGamesScreen';
import LudoGameScreen from '../screens/playtoEarn/LudoGameScreen';
import WatchToEarnScreen from '../screens/watchToEarn/WatchToEarnScreen';
import AdPassbookScreen from '../screens/adPassbook/AdPassbookScreen';
import SupportScreen from '../screens/support/SupportScreen';
import CreateCampaignScreen from '../screens/adPassbook/CreateCampaignScreen';
import CommentsScreen from '../screens/home/CommentScreen';
import FollowersList from '../screens/profile/FollowersList';
import FollowingsList from '../screens/profile/FollowingsList';
import ExploreScreen from '../screens/explore/ExploreScreen';

// FIXED IMPORT - Import as default export instead of named export
import { VideoPlayerModalScreen } from '../screens/tiptube';
import CameraRecordingScreen from '../screens/content/CameraRecordingScreen';

// Add TipCall imports - Fix the import path
import TipCallScreen from '../screens/tipcall/TipCallScreen';
import MissedCallsScreen from '../screens/tipcall/MissedCallsScreen';
// Import MeetingScreen
import MeetingScreenSimple from '../screens/videosdk/MeetingScreenSimple';
import TestCallScreen from '../screens/TestCallScreen';

// Import BlockedUsersScreen
import BlockedUsersScreen from '../screens/blocklist/BlockedUsersScreen';

// Add AddFundsScreen import
import AddFundsScreen from '../screens/wallet/AddFundsScreen';

// Add UpgradePremiumScreen import
import UpgradePremiumScreen from '../screens/wallet/UpgradePremiumScreen';

// Import SubscriptionScreen
import SubscriptionScreen from '../screens/packages/SubscriptionScreen';

import ContentCreatorSubscriptionScreen from '../screens/packages/ContentCreatorSubscriptionScreen';

// Import ChatScreen
import ChatScreen from '../screens/chat/ChatScreen';

// Import PrivacyPolicyScreen
import PrivacyPolicyScreen from '../screens/Privacy/PrivacyPolicyScreen';

// Import PremiumUserScreen
import PremiumUserScreen from '../screens/premium/PremiumUserScreen';

// Import ContentCreatorPremiumScreen
import ContentCreatorPremiumScreen from '../screens/premium/ContentCreatorPremiumScreen';

// Import PermissionsScreen
import PermissionsScreen from '../screens/settings/PermissionsScreen';

// Create stack navigator with proper typing
const Stack = createNativeStackNavigator<MainNavigatorParamList>();

// ✅ SOLUTION: Define HOC-wrapped components OUTSIDE the MainNavigator component
const EnhancedCreatePostScreen = withWalletBalance(CreatePostScreen);
const EnhancedSelectCategoryScreen = withWalletBalance(SelectCategoryScreen);
const EnhancedTipTubeUploadScreen = withWalletBalance(TipTubeUploadScreen);
const EnhancedTipShortsUploadScreen = withWalletBalance(TipShortsUploadScreen);
const EnhancedPromotePostScreen = withWalletBalance(PromotePostScreen);
const EnhancedVideoPreviewScreen = withWalletBalance(VideoPreviewScreen);
const EnhancedVideoScreen = withWalletBalance(VideoScreen);
const EnhancedShortsScreen = withWalletBalance(ShortsScreen);
const EnhancedTipShortsScreen = withWalletBalance(TipShortsEnhanced);
const EnhancedChannelScreen = withWalletBalance(ChannelScreen);
const EnhancedCreateChannelScreen = withWalletBalance(CreateChannelScreen);
const EnhancedPackagesScreen = withWalletBalance(PackagesScreen);
const EnhancedChoosePackagesScreen = withWalletBalance(ChoosePackagesScreen);
const EnhancedCheckoutScreen = withWalletBalance(CheckoutScreen);
const EnhancedAnalyticsScreen = withWalletBalance(AnalyticsScreen);
const EnhancedProfileScreen = withWalletBalance(ProfileScreen);
const EnhancedEditProfileScreen = withWalletBalance(EditProfile);
const EnhancedTrackOrderScreen = withWalletBalance(TrackOrderScreen);
const EnhancedSearchScreen = withWalletBalance(SearchScreen);
const EnhancedNotificationScreen = withWalletBalance(NotificationScreen);
const EnhancedSettingsScreen = withWalletBalance(SettingsScreen);
const EnhancedEarningsScreen = withWalletBalance(EarningsScreen);
const EnhancedReferralScreen = withWalletBalance(ReferralScreen);
const EnhancedPlayToEarnScreen = withWalletBalance(ChooseGameScreen);
const EnhancedLudoGameScreen = withWalletBalance(LudoGameScreen);
const EnhancedWatchToEarnScreen = withWalletBalance(WatchToEarnScreen);
const EnhancedAdPassbookScreen = withWalletBalance(AdPassbookScreen);
const EnhancedSupportScreen = withWalletBalance(SupportScreen);
const EnhancedCreateCampaignScreen = withWalletBalance(CreateCampaignScreen);
const EnhancedCommentsScreen = withWalletBalance(CommentsScreen);
const EnhancedFollowersList = withWalletBalance(FollowersList);
const EnhancedFollowingsList = withWalletBalance(FollowingsList);
const EnhancedExploreScreen = withWalletBalance(ExploreScreen);
const EnhancedPremiumUserScreen = withWalletBalance(PremiumUserScreen);
const EnhancedVideoPlayerModalScreen = withWalletBalance(VideoPlayerModalScreen);
const EnhancedTipCallScreen = withWalletBalance(TipCallScreen);
const EnhancedMissedCallsScreen = withWalletBalance(MissedCallsScreen);

// Custom transition configuration with Reanimated easing
const customTransitionConfig = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 350, // Optimized duration for smoothness
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom cubic-bezier for ultra-smooth animation
      },
    },
    close: {
      animation: 'timing', 
      config: {
        duration: 280,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Accelerated decelerate curve
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }: { current: any; next: any; layouts: any }) => {
    const translateX = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
      extrapolate: 'clamp',
    });

    const overlayOpacity = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.1],
      extrapolate: 'clamp',
    });

    const scale = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.92, 1],
      extrapolate: 'clamp',
    });

    const opacity = current.progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.85, 1],
      extrapolate: 'clamp',
    });

    // Previous screen animation (slide out to left with scale)
    const prevTranslateX = next ? 
      next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -layouts.screen.width * 0.3],
        extrapolate: 'clamp',
      }) : 0;

    const prevScale = next ?
      next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95],
        extrapolate: 'clamp',
      }) : 1;

    const prevOpacity = next ?
      next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.7],
        extrapolate: 'clamp',
      }) : 1;

    return {
      cardStyle: {
        transform: [
          { translateX },
          { scale },
        ],
        opacity,
      },
      overlayStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        opacity: overlayOpacity,
      },
      shadowStyle: {
        shadowColor: '#000',
        shadowOffset: {
          width: -2,
          height: 0,
        },
        shadowOpacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.15],
          extrapolate: 'clamp',
        }),
        shadowRadius: 8,
        elevation: 5,
      },
      // Apply to previous screen when a new one is pushed
      ...(next && {
        cardStyle: {
          transform: [
            { translateX: prevTranslateX },
            { scale: prevScale },
          ],
          opacity: prevOpacity,
        },
      }),
    };
  },
};

// Enhanced transition config for special screens that need different animations
const slideUpTransitionConfig = {
  headerShown: false,
  animation: 'slide_from_bottom' as const,
  animationDuration: 320,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 120,
        damping: 20,
        mass: 0.9,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.bezier(0.4, 0.0, 1, 1),
      },
    },
  },
};

// Enhanced screens with fast loading
const FastPlayToEarnScreen = withFastLoading(ChooseGameScreen, { 
  skipAnimation: true, // Skip animation for faster loading
  priority: 'high' // High priority screen
});

// Ultra-fast transition config (no animations)
const fastTransitionConfig = {
  headerShown: false,
  animation: 'none' as const,
  animationDuration: 0,
  gestureEnabled: false,
};

// Standard fast transition config (minimal animations)
const standardFastTransitionConfig = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 200, // Reduced from 350ms
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.out(Easing.quad), // Faster easing
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 150,
        easing: Easing.in(Easing.quad),
      },
    },
  },
};

// Call-specific transition config for immediate navigation
const callTransitionConfig = {
  headerShown: false,
  animation: 'fade' as const,
  animationDuration: 150, // Very fast for calls
  gestureEnabled: false, // Disable gestures during calls
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 150,
        easing: Easing.out(Easing.ease),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 100,
        easing: Easing.in(Easing.ease),
      },
    },
  },
};

/**
 * Main application stack navigator (when user is authenticated)
 */
const MainNavigator = () => {
  // Note: Navigation to Meeting screen now happens via Zustand state changes
  // in UnifiedCallService when a call is accepted or started
  
  // The HOC-wrapped components are now defined outside, so this function is much cleaner.

  return (
    <Stack.Navigator
      screenOptions={standardFastTransitionConfig}
    >
      <Stack.Screen name="TabHome" component={TabNavigator} />
      
      {/* High-priority screens with no animation */}
      <Stack.Screen 
        name="PlayToEarn" 
        component={FastPlayToEarnScreen}
        options={fastTransitionConfig}
      />
      <Stack.Screen 
        name="LudoGame" 
        component={EnhancedLudoGameScreen}
        options={standardFastTransitionConfig}
      />
      <Stack.Screen 
        name="Home" 
        component={withFastLoading(HomeScreen, { priority: 'high' })}
        options={fastTransitionConfig}
      />
        {/* TipCall screens - Fix these */}
      <Stack.Screen 
        name="TipCall" 
        component={EnhancedTipCallScreen}
        options={standardFastTransitionConfig}
      />
      <Stack.Screen
        name="TipCallSimple"
        component={TipCallScreen}
        options={{ headerShown: false }}
      />
      {/* MissedCalls screen with standard transition */}
      <Stack.Screen 
        name="MissedCalls" 
        component={EnhancedMissedCallsScreen}
        options={standardFastTransitionConfig}
      />
      {/* Meeting screen (simple version) */}
      <Stack.Screen 
        name="Meeting" 
        component={MeetingScreenSimple}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
          headerShown: false,
        }}
      />

             {/* Test Call Screen */}
       <Stack.Screen
         name="TestCall"
         component={TestCallScreen}
         options={{
           title: 'Test Call',
           headerShown: true
         }}
       />

      {/* Add Chat screen */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      
      {/* Content creation with slide up animation */}
      <Stack.Screen 
        name="CreatePost" 
        component={EnhancedCreatePostScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen 
        name="SelectCategory" 
        component={EnhancedSelectCategoryScreen}
      />
      <Stack.Screen 
        name="TipTubeUpload" 
        component={EnhancedTipTubeUploadScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen 
        name="TipShortsUpload" 
        component={EnhancedTipShortsUploadScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen name="PromotePost" component={EnhancedPromotePostScreen} />
      
      {/* Media viewing with custom transitions */}
      <Stack.Screen name="VideoPreview" component={EnhancedVideoPreviewScreen} />
      <Stack.Screen name="Video" component={EnhancedVideoScreen} />
      {/* Replace TipShorts screen with TipShortsEnhanced - keep ultra-smooth transition */}
      <Stack.Screen 
        name="TipShorts" 
        component={EnhancedTipShortsScreen}
        options={{
          ...fastTransitionConfig, // Use fastest transition for smooth Reels experience
          gestureEnabled: true,
          gestureDirection: 'vertical' as const, // Allow vertical gesture for better UX
        }}
      />
      <Stack.Screen name="Shorts" component={EnhancedShortsScreen} />
      
      {/* Comments with slide up */}
      <Stack.Screen 
        name="Comments" 
        component={EnhancedCommentsScreen as any}
        options={slideUpTransitionConfig}
      />
      
      {/* Channel screens */}
      <Stack.Screen name="Channel" component={EnhancedChannelScreen} />
      <Stack.Screen 
        name="CreateChannel" 
        component={EnhancedCreateChannelScreen}
        options={slideUpTransitionConfig}
      />
      
      {/* Packages and checkout */}
      <Stack.Screen name="Packages" component={EnhancedPackagesScreen} />
      <Stack.Screen name="ChoosePackages" component={EnhancedChoosePackagesScreen} />
      <Stack.Screen name="Checkout" component={EnhancedCheckoutScreen} />
      
      {/* Other screens with standard transition */}
      <Stack.Screen name="Analytics" component={EnhancedAnalyticsScreen} />
      <Stack.Screen name="Profile" component={EnhancedProfileScreen} />
      <Stack.Screen name="EditProfile" component={EnhancedEditProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="AddFundsScreen" component={AddFundsScreen} />
      <Stack.Screen name="TrackOrder" component={EnhancedTrackOrderScreen} />
      <Stack.Screen name="Search" component={EnhancedSearchScreen} />
      <Stack.Screen name="Notifications" component={EnhancedNotificationScreen} />
      <Stack.Screen name="Settings" component={EnhancedSettingsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={standardFastTransitionConfig} />
      <Stack.Screen name="Earnings" component={EnhancedEarningsScreen} />
      <Stack.Screen name="Referral" component={EnhancedReferralScreen} />
      <Stack.Screen name="WatchToEarn" component={EnhancedWatchToEarnScreen} />
      <Stack.Screen name="AdPassbook" component={EnhancedAdPassbookScreen} />
      <Stack.Screen name="Support" component={EnhancedSupportScreen} />
      <Stack.Screen 
        name="CreateCampaign" 
        component={EnhancedCreateCampaignScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen name="FollowersList" component={EnhancedFollowersList} />
      <Stack.Screen name="FollowingsList" component={EnhancedFollowingsList} />
      <Stack.Screen name="Explore" component={EnhancedExploreScreen} />
      
      {/* FIXED VIDEO PLAYER MODAL SCREEN */}
      <Stack.Screen 
        name="VideoPlayerModal" 
        component={EnhancedVideoPlayerModalScreen}
        options={{
          presentation: 'transparentModal',
          headerShown: false,
          gestureEnabled: false,
          animation: 'none',
          animationDuration: 0,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen 
        name="CameraRecording" 
        component={CameraRecordingScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
        

      {/* Add UpgradePremiumScreen */}
      <Stack.Screen name="UpgradePremiumScreen" component={UpgradePremiumScreen} />
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="PremiumUser" component={EnhancedPremiumUserScreen} />
      <Stack.Screen name="ContentCreatorPremium" component={ContentCreatorPremiumScreen} />
      <Stack.Screen name="ContentCreatorSubscriptionScreen" component={ContentCreatorSubscriptionScreen} />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;