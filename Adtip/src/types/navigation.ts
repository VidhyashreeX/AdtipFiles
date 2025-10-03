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
  TipCallSimple: undefined;
  TipShop: undefined;
  Chat: { user: Contact }; // Legacy chat screen
  Conversations: undefined; // New conversations list screen
  NewChat: {
    conversationId?: string;
    participantId?: string;
    participantName?: string;
  }; // New chat screen
  FCMChat: {
    participantId: string;
    participantName: string;
  }; // FCM chat screen
  Inbox: undefined; // Inbox screen for all messages
  MissedCalls: undefined;
  Profile: {userId?: number};
  InstagramProfile: {userId?: number};
  EditProfile: undefined;
  PostDetail: {postId: number; userId?: number};
  Video: {postId: number};
  PostViewer: {posts?: any[]; initialIndex?: number; userId?: number; postId?: number};
  Story: {storyId: string};
  CreatePost: undefined;
  EditPost: { postId: number; currentTitle?: string; currentContent?: string };
  CreateStatus: undefined;
  ViewStatus: { userId: number; statuses: any[] };
  WatchAndEarn: undefined;
  Referral: undefined;
  TabHome: undefined; // Assuming these are part of MainNavigator, e.g., tabs
  Search: undefined;
  Wallet: undefined;
  WithdrawalAmountScreen: {
    balance: number;
    minimumWithdrawal: number;
    onSuccess?: () => void;
  };
  WithdrawalMethodScreen: {
    amount: number;
    balance: number;
    minimumWithdrawal: number;
    onSuccess?: () => void;
  };
  WithdrawalConfirmationScreen: {
    amount: number;
    balance: number;
    minimumWithdrawal: number;
    selectedMethod: string;
    upiId?: string;
    onSuccess?: () => void;
  };
  Settings: undefined;
  // Update TipShorts type definition to support enhanced features
  TipShorts: { 
    shortId?: string;
    initialIndex?: number;
    preloadedShorts?: any[];
  };
  // Live streaming screen types
  LiveStream: {
    userId?: number;
    mode?: 'host' | 'viewer';
    meetingId?: string;
    token?: string;
    streamTitle?: string;
    streamType?: 'free' | 'influencer' | 'promotional';
  };
  
  // Live stream configuration screen
  LiveStreamConfig: {
    userId: number;
  };

  // Go Live screen for creating new streams
  GoLive: {
    initialStreamType?: 'free' | 'influencer' | 'promotional';
  };

  // New proper live streaming interface with ILS
  LiveStreaming: {
    meetingId: string;
    token: string;
    isHost: boolean;
    streamTitle: string;
    streamType: 'free' | 'influencer' | 'promotional';
  };
  PlayToEarn: undefined;
  LudoGame: undefined;
  WatchToEarn: undefined;
  AdPassbook: undefined;
  Earnings: undefined;
  EarnMoneyUser: undefined;
  EarnMoneyCreator: undefined;
  Analytics: { channelId?: string };
  Notifications: undefined;
  Packages: undefined; // Added if it was missing and PackagesScreen is a route
  ChoosePackages: undefined; // Added this line
  Checkout: { package: { id: string; name: string; price: number; bestValue?: boolean }, billing: any, totalPrice: number }; // Ensure Checkout is correctly typed
  FollowersList: { followers: any[]; userId?: number };
  FollowingsList: { followings: any[]; userId?: number };
  FollowersFollowing: { userId: number; initialTab?: 'followers' | 'following'; userName?: string };
  CreateChannel: undefined;
  PromotePost: undefined;
  VideoPreview: undefined;
  Shorts: { videoId?: number, shortId?: number };
  TrackOrder: undefined;
  Support: undefined;
  ContactForm: undefined;
  CreateCampaign: undefined;
  Explore: undefined;
  VideoPlayerModal: {
    video: any;
    cardLayout: any;
    upNextVideos: any[];
  };
  SelectCategory: undefined;
  TipTubeUpload: undefined;
  TipShortsUpload: {
    videoSource?: {
      uri: string;
      type?: string;
      name?: string;
      duration?: number;
    };
  };
  Channel: { channelId: string | number };
  ChannelProfile: {
    channelId: string;
    channelName: string;
    avatar?: string;
    isVerified?: boolean;
    createdBy?: number;
  };
  MyChannel: undefined;
  YourChannel: undefined;
  FollowedChannel: undefined;
  Library: undefined;
  EditChannel: { channelId: string };
  ChannelSettings: undefined;
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
    callData?: any;
  };
  MeetingSimple: {
    sessionId: string;
  };
  TestCall: undefined;
  UserPremiumPlans: undefined;
  SubscriptionScreen: undefined;
  PremiumBenefitsScreen: undefined;
  PremiumPlansScreen: undefined;
  ContentCreatorSubscriptionScreen: undefined;
  PremiumUser: undefined;
  ContentCreatorPremium: undefined;
  UserPremiumBenefits: undefined;
  ContentCreatorPremiumBenefits: undefined;
  PrivacyPolicy: undefined; // Add this line
  BlockedUsers: undefined; // Screen for managing blocked users
  PermissionsScreen: undefined; // Add PermissionsScreen to navigation types
  UploadVideo: undefined; // Upload video screen
  PaidVideoAnalytics: undefined; // Paid video analytics screen
};

// This is the RootStackParamList for the Stack.Navigator in App.tsx
export type RootStackParamList = {
  Splash: undefined;
  InitialLoading: undefined;
  Auth: NavigatorScreenParams<AuthNavigatorParamList>;
  Main: NavigatorScreenParams<MainNavigatorParamList>;
  Guest: undefined;
  ContentCreatorSubscriptionScreen: undefined;
  Meeting: {
    meetingId: string;
    token: string;
    displayName: string;
    callType: 'voice' | 'video';
    isInitiator?: boolean;
    recipientName?: string;
    callData?: any;
    localParticipantId?: string;
  };
  MeetingSimple: {
    sessionId: string;
  };
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