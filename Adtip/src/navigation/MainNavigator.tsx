import React, { useEffect } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { withFastLoading } from '../components/hoc/withFastLoading';
import { MainNavigatorParamList } from '../types/navigation';
// Import the navigation ref for global navigation
import { navigationRef } from './NavigationService';
// Import CallKeep initializer hook
import useCallKeepInitializer from '../hooks/useCallKeepInitializer';

// Import navigators
import TabNavigator from './TabNavigator';

// Remove HOC import - using direct useWallet hook in components instead

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
import MyChannelScreen from '../screens/channel/MyChannelScreen';
//import EditChannelScreen from '../screens/channel/EditChannelScreen';
import ChannelSettingsScreen from '../screens/channel/ChannelSettingsScreen';
import EditPostScreen from '../screens/content/EditPostScreen';
import PackagesScreen from '../screens/packages/PackagesScreen';
import ChoosePackagesScreen from '../screens/packages/ChoosePackagesScreen';
import CheckoutScreen from '../screens/packages/CheckoutScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import EditProfile from '../screens/profile/EditProfile';
import WalletScreen from '../screens/wallet/WalletScreen';
import PromotePostScreen from '../screens/content/PromotePostScreen';
import TrackOrderScreen from '../screens/shop/TrackOrderScreen';
import SearchScreen from '../screens/search/SearchScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import EarnMoneyUserScreen from '../screens/earnings/EarnMoneyUserScreen';
import EarnMoneyCreatorScreen from '../screens/earnings/EarnMoneyCreatorScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';
import ChooseGameScreen from '../screens/playtoEarn/ChooseGamesScreen';
import LudoGameScreen from '../screens/playtoEarn/LudoGameScreen';
import InstallToEarnScreen from '../screens/installToEarn/InstallToEarnScreen';
import WatchToEarnScreen from '../screens/watchToEarn/WatchToEarnScreen';
import AdPassbookScreen from '../screens/adPassbook/AdPassbookScreen';
import SupportScreen from '../screens/support/SupportScreen';
import ContactFormScreen from '../screens/support/ContactFormScreen';
import CreateCampaignScreen from '../screens/adPassbook/CreateCampaignScreen';
import CommentsScreen from '../screens/home/CommentScreen';
import FollowersList from '../screens/profile/FollowersList';
import FollowingsList from '../screens/profile/FollowingsList';
import ExploreScreen from '../screens/explore/ExploreScreen';

// FIXED IMPORT - Import as default export instead of named export
import { VideoPlayerModalScreen } from '../screens/tiptube';
import CameraRecordingScreen from '../screens/content/CameraRecordingScreen';

// Add TipCall imports - Fix the import path
import TipCallScreenSimple from '../screens/tipcall/TipCallScreenSimple';
import MissedCallsScreen from '../screens/tipcall/MissedCallsScreen';
// Import MeetingScreen
import MeetingScreenSimple from '../screens/videosdk/MeetingScreenSimple';
import TestCallScreen from '../screens/TestCallScreen';

// Import BlockedUsersScreen
import BlockedUsersScreen from '../screens/blocklist/BlockedUsersScreen';

// Add AddFundsScreen import
import AddFundsScreen from '../screens/wallet/AddFundsScreen';

// Add withdrawal screens
import WithdrawalAmountScreen from '../screens/wallet/WithdrawalAmountScreen';
import WithdrawalMethodScreen from '../screens/wallet/WithdrawalMethodScreen';
import WithdrawalConfirmationScreen from '../screens/wallet/WithdrawalConfirmationScreen';

// Add UpgradePremiumScreen import
import UpgradePremiumScreen from '../screens/wallet/UpgradePremiumScreen';

// Import SubscriptionScreen
import SubscriptionScreen from '../screens/packages/SubscriptionScreen';

import ContentCreatorSubscriptionScreen from '../screens/packages/ContentCreatorSubscriptionScreen';

// Import FCM Chat Screens
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import FCMChatScreen from '../screens/chat/FCMChatScreen';
import InboxScreen from '../screens/chat/InboxScreen';

// Import PrivacyPolicyScreen
import PrivacyPolicyScreen from '../screens/Privacy/PrivacyPolicyScreen';

// Import new TipTube screens
import YourChannelScreen from '../screens/tiptube/YourChannelScreen';
import FollowedChannelScreen from '../screens/tiptube/FollowedChannelScreen';
import LibraryScreen from '../screens/tiptube/LibraryScreen';
import EditChannelScreen from '../screens/channel/EditChannelScreen';
import ComingSoonScreen from '../screens/common/ComingSoonScreen';

// Import PremiumUserScreen
import PremiumUserScreen from '../screens/premium/PremiumUserScreen';

// Import ContentCreatorPremiumScreen
import ContentCreatorPremiumScreen from '../screens/premium/ContentCreatorPremiumScreen';

// Import PermissionsScreen
import PermissionsScreen from '../screens/settings/PermissionsScreen';

// Import new Instagram-style screens
import InstagramProfileScreen from '../screens/profile/InstagramProfileScreen';
import PostViewerScreen from '../screens/profile/PostViewerScreen';
import FollowersFollowingScreen from '../screens/profile/FollowersFollowingScreen';

// Create stack navigator with proper typing
const Stack = createNativeStackNavigator<MainNavigatorParamList>();

// ✅ PERFORMANCE FIX: Removed HOC cascade - components now use useWallet hook directly
// This eliminates 43 HOC wrappers that were causing re-render storms on wallet balance updates

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
const FastPlayToEarnScreen = withFastLoading(InstallToEarnScreen, {
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
  // Initialize CallKeep now that user is authenticated and in main app
  useCallKeepInitializer();

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
        component={LudoGameScreen}
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
        component={TipCallScreenSimple}
        options={standardFastTransitionConfig}
      />
      <Stack.Screen
        name="TipCallSimple"
        component={TipCallScreenSimple}
        options={{ headerShown: false }}
      />
      {/* MissedCalls screen with standard transition */}
      <Stack.Screen
        name="MissedCalls"
        component={MissedCallsScreen}
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

      {/* Chat Screens */}
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          headerShown: true,
          title: 'Chats',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="FCMChat"
        component={FCMChatScreen}
        options={{
          headerShown: true,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          headerShown: true,
          title: 'Inbox',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      {/* Chat screen now uses FCM chat */}
      <Stack.Screen
        name="Chat"
        component={FCMChatScreen}
        options={{
          headerShown: true,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      
      {/* Content creation with slide up animation */}
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen
        name="EditPost"
        component={EditPostScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen
        name="SelectCategory"
        component={SelectCategoryScreen}
      />
      <Stack.Screen
        name="TipTubeUpload"
        component={TipTubeUploadScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen
        name="TipShortsUpload"
        component={TipShortsUploadScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen name="PromotePost" component={PromotePostScreen} />
      
      {/* Media viewing with custom transitions */}
      <Stack.Screen name="VideoPreview" component={VideoPreviewScreen} />
      <Stack.Screen name="Video" component={VideoScreen} />
      {/* Replace TipShorts screen with TipShortsEnhanced - keep ultra-smooth transition */}
      <Stack.Screen
        name="TipShorts"
        component={TipShortsEnhanced}
        options={{
          ...fastTransitionConfig, // Use fastest transition for smooth Reels experience
          gestureEnabled: true,
          gestureDirection: 'vertical' as const, // Allow vertical gesture for better UX
          presentation: 'fullScreenModal', // Fullscreen modal presentation
          headerShown: false, // Hide header for fullscreen experience
        }}
      />
      <Stack.Screen name="Shorts" component={ShortsScreen} />

      {/* Comments with slide up */}
      <Stack.Screen
        name="Comments"
        component={CommentsScreen as any}
        options={slideUpTransitionConfig}
      />
      
      {/* Channel screens */}
      <Stack.Screen name="Channel" component={ChannelScreen} />
      <Stack.Screen name="MyChannel" component={MyChannelScreen} />
      <Stack.Screen name="EditChannel" component={EditChannelScreen} />
      <Stack.Screen name="ChannelSettings" component={ChannelSettingsScreen} />
      <Stack.Screen
        name="CreateChannel"
        component={CreateChannelScreen}
        options={slideUpTransitionConfig}
      />

      {/* Packages and checkout */}
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="ChoosePackages" component={ChoosePackagesScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />

      {/* Other screens with standard transition */}
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen
        name="Profile"
        component={({
          route,
        }: {
          route: import('@react-navigation/native').RouteProp<
            MainNavigatorParamList,
            'Profile'
          >;
        }) => {
          const userId = route.params.userId;
          if (typeof userId !== 'number') {
            // Optionally render a fallback or null if userId is not valid
            return null;
          }
          return <UserProfileScreen userId={userId} />;
        }}
      />
      <Stack.Screen name="InstagramProfile" component={InstagramProfileScreen} />
      <Stack.Screen name="FollowersFollowing" component={FollowersFollowingScreen} />
      <Stack.Screen
        name="PostViewer"
        component={PostViewerScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="AddFundsScreen" component={AddFundsScreen} />
      <Stack.Screen name="WithdrawalAmountScreen" component={WithdrawalAmountScreen} />
      <Stack.Screen name="WithdrawalMethodScreen" component={WithdrawalMethodScreen} />
      <Stack.Screen name="WithdrawalConfirmationScreen" component={WithdrawalConfirmationScreen} />
      <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={standardFastTransitionConfig} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="EarnMoneyUser" component={EarnMoneyUserScreen} />
      <Stack.Screen name="EarnMoneyCreator" component={EarnMoneyCreatorScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="WatchToEarn" component={WatchToEarnScreen} />
      <Stack.Screen name="AdPassbook" component={AdPassbookScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="ContactForm" component={ContactFormScreen} />
      <Stack.Screen
        name="CreateCampaign"
        component={CreateCampaignScreen}
        options={slideUpTransitionConfig}
      />
      <Stack.Screen name="FollowersList" component={FollowersList} />
      <Stack.Screen name="FollowingsList" component={FollowingsList} />
      <Stack.Screen name="Explore" component={ExploreScreen} />
      
      {/* FIXED VIDEO PLAYER MODAL SCREEN */}
      <Stack.Screen
        name="VideoPlayerModal"
        component={VideoPlayerModalScreen}
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
      <Stack.Screen name="PremiumUser" component={PremiumUserScreen} />
      <Stack.Screen name="ContentCreatorPremium" component={ContentCreatorPremiumScreen} />
      <Stack.Screen name="ContentCreatorSubscriptionScreen" component={ContentCreatorSubscriptionScreen} />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />

      {/* New TipTube screens */}
      <Stack.Screen
        name="YourChannel"
        component={YourChannelScreen}
        options={standardFastTransitionConfig}
      />
      <Stack.Screen
        name="FollowedChannel"
        component={FollowedChannelScreen}
        options={standardFastTransitionConfig}
      />
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={standardFastTransitionConfig}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;