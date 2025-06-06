// src/types/navigation.ts
import {NavigationProp} from '@react-navigation/native';

// Define the Comment interface here or import it if it's in a shared types file.
// Since it was defined in HomeScreen.tsx, we'll include it here for completeness
// so that the RootStackParamList can correctly reference it.
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

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  OTP: {mobileNumber: string; id: string; isFirstTime: boolean};
  UserDetails: undefined;

  // Main app screens
  Main: undefined;
  Home: undefined;
  TipTube: undefined;
  TipCall: undefined;
  TipShop: undefined;
  Profile: {userId?: number};

  // Content screens
  PostDetail: {postId: number};
  Video: {postId: number};
  Story: {storyId: string};
  Comments: {postId: number; initialComments: Comment[]; userId: number}; // UPDATED THIS LINE
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

  // Navigation screens
  TabHome: undefined;
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
};

export type NavigationProps = NavigationProp<RootStackParamList>;
export type AuthNavigationProps = NavigationProp<
  RootStackParamList,
  'Login' | 'OTP' | 'UserDetails'
>;