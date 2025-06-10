// src/types/navigation.ts
import {NavigationProp, NavigatorScreenParams} from '@react-navigation/native';

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
  Profile: {userId?: number};
  PostDetail: {postId: number};
  Video: {postId: number};
  Story: {storyId: string};
  Comments: {postId: number; initialComments: Comment[]; userId: number};
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
  TipShorts: undefined;
  PlayToEarn: undefined;
  WatchToEarn: undefined;
  AdPassbook: undefined;
  Earnings: undefined;
  Analytics: undefined;
  Notifications: undefined;
  // Add other screens specific to MainNavigator
};

// This is the RootStackParamList for the Stack.Navigator in App.tsx
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthNavigatorParamList>; // AuthNavigator is nested
  Main: NavigatorScreenParams<MainNavigatorParamList>; // MainNavigator is nested
};

// Update NavigationProps if needed, though direct use of hooks like useNavigation is often preferred
// and will be typed based on the navigator they are used within.
export type AppNavigationProps = NavigationProp<RootStackParamList>;

// You might not need a generic NavigationProps if you use typed hooks.
// For example, in a screen within MainNavigator:
// const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();