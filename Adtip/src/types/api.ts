// src/types/api.ts
// This file contains interface definitions for API responses

export interface ApiResponse<T> {
  status: number | boolean;
  message: string;
  data?: T;
}

// Authentication types
export interface OtpLoginRequest {
  mobileNumber: string;
  userType: string;
}

export interface OtpLoginResponse {
  otp: string;
  id: number;
  messageId: string;
  mobile_number: string;
  user_type: string;
  isOtpVerified: number;
  is_first_time: boolean;
}

export interface OtpVerifyRequest {
  mobile_number: string;
  otp: string;
  id: string;
}

export interface OtpVerifyResponse {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  emailId: string;
  gender: string;
  dob: string;
  profile_image: string;
  message_id: string;
  mobile_number: string;
  otp: string;
  user_type: number;
  profession: string;
  maternal_status: string;
  address: string;
  longitude: string;
  latitude: string;
  pincode: string | null;
  isOtpVerified: number;
  isSaveUserDetails: number;
  is_first_time: number;
  bio: string | null;
  premium: number;
  country_code: string;
  country: string;
  languages: any[];
  interests: any[];
  is_premium: boolean;
  // Add other fields as needed
}

export interface LogoutRequest {
  id: string;
}

export interface UserDetailsRequest {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  gender: string;
  dob: string;
  profile_image: string;
  profession: string;
  maternal_status: string;
  address: string;
  emailId: string;
  longitude: string;
  latitude: string;
  pincode: string;
  languages: number;
  interests: number;
  referal_code: string;
}

// Home page types
export interface WalletBalanceResponse {
  status: number;
  message: string;
  availableBalance: string;
}

export interface PostListRequest {
  category: number;
  page: number;
  limit: number;
  loggined_user_id: number;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  is_promoted: number;
  video_category_id: number;
  user_name: string;
  user_profile_image: string | null;
  address: string | null;
  category_name: string;
  likeCount: number;
  commentCount: number;
  is_liked: boolean;
  post_promotion_id?: number;
  target_min_age?: number;
  target_max_age?: number;
  reach_goal?: number;
  duration_days?: number;
  pay_per_view?: string;
  total_pay?: string;
  platform_fee?: string;
}

export interface PostListResponse {
  data: Post[];
  pagination: {
    current_page: number;
    total_page: number;
    total_count: number;
  };
}

export interface PremiumCheckResponse {
  user_id: string;
  plan_id: number;
  end_time: string;
  is_premium_expired: boolean;
}

export interface UserListRequest {
  id: number;
  page: number;
  limit: number;
  language: number[];
  interest: number[];
  user_id: number | null;
  search_by_name: string;
  loggined_user_id: number;
  sortBy: Record<string, any>;
}

export interface User {
  id: number;
  name: string;
  profile_image: string | null;
  online_status: boolean;
  // Add other fields as needed
}

export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
  };
}

export interface ReferralDetailsResponse {
  referral_code: string;
  total_referrals: number;
  total_referrals_earnings: number;
  total_referral_withdrawals_amount: number;
  available_referral_balance: number;
  each_referral: number;
  total_premiums: number;
  total_premium_earnings: number;
  total_coupon_withdrawals_amount: number;
  available_coupon_balance: number;
  coupon_code: string | null;
  each_coupon: number;
}
