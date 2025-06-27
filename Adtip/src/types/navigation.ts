// src/types/navigation.ts
import {NavigationProp, NavigatorScreenParams} from '@react-navigation/native';
import { Contact } from '../types/api';

// Define the Comment interface (as you already have it)
interface Comment {
  id: number;
  postId: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_profile: string | null;
}

// Define the structure for call notification data
export type CallNotificationData = {
  callerName: any; // Consider using string | undefined or a more specific type
  callType: 'voice' | 'video';
  channelName: any;
  rtcToken: any;
  callerRtcUid: any;
  isFromNotification: boolean;
};

// Define ParamList for screens within your AuthNavigator
export type AuthNavigatorParamList = {
  Login: undefined;
  OTP: {mobileNumber: string; id: string; isFirstTime: boolean};
  UserDetails: undefined;
  // Add other screens specific to AuthNavigator if any
};

// Define ParamList for screens within your MainNavigator
export type MainNavigatorParamList = {
  Home: undefined;
  TipTube: undefined;
  TipCall: { initialCallNotificationData?: CallNotificationData }; // TipCall now takes params
  TipShop: undefined;
  Chat: { user: Contact }; // Add this line
  Profile: {userId?: number};
  PostDetail: {postId: number};
  Video: {postId: number};
  Story: {storyId: string};
  CreatePost: undefined;
  WatchAndEarn: undefined;
  Referral: undefined;
  TipShortsUploadScreen: {
    videoSource?: {
      uri: string;
      type?: string;
      name?: string;
      duration?: number;
    };
  };
  TabHome: undefined; // Assuming these are part of MainNavigator, e.g., tabs
  Search: undefined;
  Wallet: undefined;
  Settings: undefined;
  // Update TipShorts type definition to support enhanced features
  TipShorts: { 
    shortId?: string;
    initialIndex?: number;
    preloadedShorts?: any[];
  };
  PlayToEarn: undefined;
  LudoGame: undefined;
  WatchToEarn: undefined;
  AdPassbook: undefined;
  Earnings: undefined;
  Analytics: undefined;
  Notifications: undefined;
  Packages: undefined; // Added if it was missing and PackagesScreen is a route
  ChoosePackages: undefined; // Added this line
  Checkout: { package: { id: string; name: string; price: number; bestValue?: boolean }, billing: any, totalPrice: number }; // Ensure Checkout is correctly typed
  FollowersList: { followers: any[]; userId?: number };
  FollowingsList: { followings: any[]; userId?: number };
  CreateChannel: undefined;
  PromotePost: undefined;
  VideoPreview: undefined;
  Shorts: { videoId?: number, shortId?: number };
  TrackOrder: undefined;
  Support: undefined;
  CreateCampaign: undefined;
  Explore: undefined;
  VideoPlayerModal: {
    video: any;
    cardLayout: any;
    upNextVideos: any[];
  };
  SelectCategory: undefined;
  TipTubeUpload: undefined;
  TipShortsUpload: undefined;
  Channel: { channelId: string | number };
  AddFundsScreen: undefined;
  UpgradePremiumScreen: undefined;
  Comments: { postId: number; visible: boolean; onClose: () => void; };
  CameraRecording: undefined;
  // Add Meeting screen here
  Meeting: {
    meetingId: string;
    token: string;
    callType: 'voice' | 'video';
    displayName: string;
    isInitiator?: boolean;
    recipientName?: string;
  };
  UserPremiumPlans: undefined;
  SubscriptionScreen: undefined;
};

// This is the RootStackParamList for the Stack.Navigator in App.tsx
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthNavigatorParamList>; 
  Main: NavigatorScreenParams<MainNavigatorParamList>;
  UserDetails: undefined;
  // REMOVE Meeting from the RootStack
  CameraRecording: {
    maxDuration?: number;
    aspectRatio?: '9:16' | '16:9' | '1:1';
  };
};

// Update NavigationProps if needed, though direct use of hooks like useNavigation is often preferred
// and will be typed based on the navigator they are used within.
export type AppNavigationProps = NavigationProp<RootStackParamList>;

// You might not need a generic NavigationProps if you use typed hooks.
// For example, in a screen within MainNavigator:
// const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();