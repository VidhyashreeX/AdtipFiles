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
  profile_image: string | null;
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
  current_otp_verified: string | null;
  created_date: string;
  updated_date: string;
  isOtpVerified: number;
  isSaveUserDetails: number; // This is the key field for navigation
  is_active: string | null;
  createdby: string | null;
  access_type: number;
  online_status: boolean;
  device_token: string;
  is_block: string | null;
  is_mute: string | null;
  referal_code: string;
  referal_earnings: number;
  referred_by: string | null;
  username: string | null;
  referred_count: number;
  is_first_time: number;
  bio: string | null;
  premium_plan_id: number;
  content_creator_plan_id: number;
  is_available: boolean;
  dnd: boolean;
  premium: number;
  country_code: string;
  country: string;
  fcm_token: string;
  fcm_token_updation_date?: string;
  device_id?: string | null;
  platform?: string | null;
  languages: any[];
  interests: any[];
  is_premium: boolean;
}

// Update the API response type to handle both formats
export type OtpVerifyApiResponse = 
  | (ApiResponse<OtpVerifyResponse[]> & { accessToken: string }) // Array format
  | (OtpVerifyResponse & { accessToken?: string }); // Direct object format

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

export interface FcmTokenRequest {
  userId: string | number;
  fcmToken: string;
}

export interface MissedCallsResponse {
  calls: Array<{
    id: number;
    caller_id: number;
    receiver_id: number;
    call_type: string;
    created_at: string;
    caller_name?: string;
    caller_image?: string;
  }>;
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
  created_at: string; // Make created_at required and always a string
  is_premium?: boolean;
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

export interface Contact {
  id: number;
  name?: string | null;
  emailId?: string | null;
  is_available: boolean;
  dnd: boolean;
  updated_date: string;
  last_active: string | null;
  languages: Array<{ id: number; name: string; isPrimary: boolean }>; // Updated inline or use a shared Language type
  interests: Array<{ id: number; name: string; isPrimary: boolean }>; // Updated inline or use a shared Interest type
  product_count: number;
  post_count: number;
  is_following: number;
  following_count: number;
  followers_count: number;
  is_blocked: boolean;
  social_links: string[];
  is_active: boolean;
  last_seen: string;
  online_status: boolean;
}

export interface UserListResponse {
  status: boolean;
  message: string;
  error?: string;
  data: Contact[];
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

// Add these interfaces for the like functionality
export interface LikePostRequest {
  userId: number;
  postId: number;
  is_liked: boolean;
}

// Update LikePostResponse to match actual API response
export interface LikePostResponse {
  status: boolean;
  message: string;
  is_liked: boolean;
}

// Add these interfaces for short video like functionality
export interface LikeShortRequest {
  reelId: number;
  userId: number;
  like: number; // 1 for like, 0 for unlike
  reelCreatorId: number;
}

export interface LikeShortResponse {
  status: number;
  message: string;
  data?: any;
}

// VideoSDK API Types
export interface VideoSDKGenerateTokenRequest {
  // Empty body - backend handles apiKey and permissions
}

export interface VideoSDKGenerateTokenResponse {
  success: boolean;
  token: string;
  message: string;
}

export interface VideoSDKCreateMeetingRequest {
  token: string; // Token from generateVideoSDKParticipantToken response
  region?: string; // Optional region, defaults to "us"
}

export interface VideoSDKMeetingData {
  apiKey: string;
  webhook: { events: string[] };
  disabled: boolean;
  autoCloseConfig: { type: string };
  createdAt: string;
  updatedAt: string;
  roomId: string;
  links: { get_room: string; get_session: string };
  id: string;
}

export interface VideoSDKCreateMeetingResponse {
  success: boolean;
  data: VideoSDKMeetingData;
  message: string;
}

export interface VideoSDKDeactivateRoomRequest {
  // Similar to create meeting, the 'token' is likely for backend-to-VideoSDK auth.
  roomId: string;
}

export interface VideoSDKDeactivateRoomResponse {
  success: boolean;
  data: VideoSDKMeetingData; // Response structure is similar to create meeting
  message: string;
}

export interface VideoSDKValidateMeetingRequest {
    roomId: string;
}

export interface VideoSDKValidateMeetingResponse {
    success: boolean;
    data?: {
        roomId: string;
        valid: boolean;
        meeting?: VideoSDKMeetingData; // Optional: if backend returns full meeting details
    };
    message: string;
}

// Add the UpdateUser API types
export interface UpdateUserRequest {
  id: number;
  dnd?: number; // 1 for DND on, 0 for DND off
  // Add other optional fields that might be part of updateuser API
  is_available?: number;
}

export interface UpdateUserResponse {
  status: boolean;
  message: string;
  data?: any;
}

// Update AgoraCallRequest if it's also used for VideoSDK call actions via your backend
// This type is already in your TipCallScreen.tsx, ensure it's consistent or defined centrally.
// export type VideoSDKCallRequest = { ... } // This is defined in TipCallScreen.tsx
// For ApiService, we can use AgoraCallRequest if the backend /api/call endpoint handles both
// or create a more generic CallActionRequest. For now, assuming AgoraCallRequest is adaptable.

export interface FcmTokensRequest {
  userIds: number[];
}

export interface FcmTokenResult {
  status: boolean;
  userId: number;
  fcm_token: string;
}

export interface FcmTokensResponse {
  results: FcmTokenResult[];
}

// Add these to your types/api.ts file

export interface GetCommentsRequest {
  postId: number;
  userId: number;
  page?: number;
  limit?: number;
}

export interface GetCommentsResponse {
  success: boolean;
  message: string;
  data: Comment[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface SaveCommentRequest {
  userId: number;
  postId: number;
  content: string;
  parentId?: number | null;
}

export interface SaveCommentResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    post_id: number;
    user_id: number;
    user_name: string;
    user_profile_image?: string | null;
    content: string;
    like_count: number;
    reply_count: number;
    is_liked: boolean;
    created_at: string;
    parent_id?: number | null;
  };
}

export interface LikeCommentRequest {
  userId: number;
  commentId: number;
  is_liked: boolean;
}

export interface LikeCommentResponse {
  success: boolean;
  message: string;
  is_liked: boolean;
}

export interface DeleteCommentRequest {
  userId: number;
  commentId: number;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
}

export interface ReportCommentRequest {
  userId: number;
  commentId: number;
  reason: string;
}

export interface ReportCommentResponse {
  success: boolean;
  message: string;
}
