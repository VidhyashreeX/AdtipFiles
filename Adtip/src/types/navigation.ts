// src/types/navigation.ts
import { NavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  OtpVerification: { mobileNumber: string; id: number };
  UserDetails: undefined;
  
  // Main app screens
  Main: undefined;
  Home: undefined;
  TipTube: undefined;
  TipCall: undefined;
  TipShop: undefined;
  Profile: { userId?: number };
  
  // Content screens
  PostDetail: { postId: number };
  Video: { postId: number };
  Story: { storyId: string };
  Comments: { postId: number };
  CreatePost: undefined;
  WatchAndEarn: undefined;
  Referral: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;
export type AuthNavigationProps = NavigationProp<RootStackParamList, 'Login' | 'OtpVerification' | 'UserDetails'>;