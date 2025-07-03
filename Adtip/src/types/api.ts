// src/types/api.ts
// This file contains interface definitions for API responses

export interface Comment {
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
}

export interface ApiResponse<T> {
  status: number | boolean;
  message: string;
  data?: T;
  pagination?: {
    page?: number;
    limit?: number;
    totalRecords?: number;
    current_page?: number;
    total_pages?: number;
    total_count?: number;
    per_page?: number;
  };
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
  token: string;
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
  userIds: number[]; // Array with caller and recipient user IDs
}

export interface FcmTokensResponse {
  results: {
    status: boolean;
    userId: number;
    fcm_token: string;
  }[];
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

// ===== CHANNEL AND VIDEO TYPES =====

export interface ChannelInfo {
  channelId: string;
  channelName: string;
  description: string;
  profileImage: string;
  coverImage?: string;
  totalSubscribers: number;
  totalVideos: number;
  totalViews: number;
  isSubscribed: boolean;
  isVerified: boolean;
  createdDate: string;
  createdBy: number;
  isCallEnabled?: boolean;
}

export interface Video {
  id: string;
  name: string;
  videoThumbnail: string;
  playDuration: string;
  views: number;
  createdDate: string;
  description: string;
  videoType: number; // 0 for TipTube, 1 for TipShorts
  videoLink?: string;
  categoryId?: number;
  channelId?: string;
  createdBy?: number;
  likes?: number;
  isLiked?: boolean;
}

export interface VideoListResponse {
  status: number;
  message: string;
  data: Video[];
}

export interface ChannelAnalyticsResponse {
  status: number;
  message: string;
  data: {
    totalViews: number;
    totalSubscribers: number;
    totalVideos: number;
    totalEarnings: number;
    monthlyData?: Array<{
      month: string;
      views: number;
      subscribers: number;
      earnings: number;
    }>;
  };
}

// ===== ADDITIONAL API TYPES FROM CSV ANALYSIS =====

// Upload Shot Request/Response
export interface UploadShotRequest {
  name: string;
  isShot: boolean; // false for TipTube, true for TipShorts
  categoryId: number;
  channelId: number;
  videoLink: string;
  videoDesciption: string;
  createdby: number;
  play_duration: string;
  video_Thumbnail: string;
}

export interface UploadShotResponse {
  status: boolean;
  message: string;
  data?: any;
}

// Upload Post Request (extends existing)
export interface UploadPostRequest {
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: 'video' | 'image';
  is_promoted: boolean;
  video_category_id: number;
  start_date: string;
  end_date: string;
  target_min_age?: number;
  target_max_age?: number;
  pay_per_view?: number;
  reach_goal?: number;
  duration_days?: number;
  total_pay?: number;
  platform_fee?: number;
  post_target_locations?: string[];
  post_target_genders?: string[];
}

// Channel Management Types
export interface SaveChannelRequest {
  channelName: string;
  channelDescription: string;
  profileImageURL: string;
  coverImageURL: string;
  createdBy: number;
  updatedBy: number;
}

export interface SaveChannelResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    channelName: string;
  };
}

export interface UpdateChannelRequest {
  id: number;
  channelName: string;
  channelDescription: string;
  profileImageURL: string;
}

// Video Interaction Types
export interface SaveVideoLikeRequest {
  videoId: number;
  userId: number;
  like: number; // 1 for like, 0 for unlike
  videoCreatorId: number;
}

export interface SaveVideoCommentRequest {
  comment: string;
  videoId: number;
  createdBy: number;
  parentCommetId?: number | null;
}

export interface SaveVideoCommentLikeRequest {
  commentId: number;
  userId: number;
}

// Follow User Types
export interface FollowUserRequest {
  followingId: number;
  followerId: number;
  action: 'follow' | 'unfollow';
}

export interface FollowUserResponse {
  status: boolean;
  message: string;
  is_following?: boolean;
}

// Premium Plan Types
export interface PremiumPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

export interface UserPremiumPlansResponse {
  status: boolean;
  message: string;
  data: PremiumPlan[];
}

export interface UpgradePremiumRequest {
  coupon_code?: string | null;
  isCron: boolean;
  order_id: string;
  payment_id: string;
  payment_status: string;
  plan_id: number;
  user_id: number;
}

// Razorpay Types
export interface RazorpayDetailsResponse {
  status: number;
  message: string;
  api_key: string;
  api_secret: string;
}

export interface CreateRazorpayOrderRequest {
  amount: number;
  currency: string;
  user_id: number;
}

export interface CreateRazorpayOrderResponse {
  status: boolean;
  data: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
    user_id: number;
  };
}

export interface VerifyRazorpayPaymentRequest {
  amount: number;
  currency: string;
  order_id: string;
  payment_status: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  transaction_for: string;
  user_id: number;
  plan_id?: number;
}

export interface AddFundsRequest {
  amount: number;
  createdby: number;
  isCron: boolean;
  order_id: string;
  payment_id: string;
  transaction_type: string;
  transactionStatus: string;
}

export interface AddFundsResponse {
  status: number;
  message: string;
  data: Array<{
    id: number;
    createdby: number;
    amount: number;
    transactionStatus: string;
    transaction_type: string;
    order_id: string;
    payment_id: string;
    isCron: boolean;
    totalBalance: number;
  }>;
}

// Celebration Ads Types
export interface SaveCelebrationAdsRequest {
  campaignName: string;
  targetPeople: number;
  AdModelId: number;
  targetArea: string;
  targetLowerAge: number;
  targetUpperAge: number;
  maritalStatus: string;
  targetGender: string;
  targetProfessions: string;
  adTotal: number;
  Coupon?: string;
  AdTax: number;
  createdby: number;
  adStartDateTime: string;
  adEndDateTime: string;
  modelTypeName?: string;
  adFile?: string;
}

export interface GetCelebrationAdsRequest {
  userId: number;
  gender: string;
  age: number;
  maritalStatus: string;
  targetLocation: string;
  targetProfession?: string;
  limit?: number;
}

export interface SaveCelebrationAdViewRequest {
  adId: number;
  userId: number;
}

// Explore Content Types
export interface ExploreContentRequest {
  page: number;
  limit: number;
  loggined_user_id: number;
}

export interface ExploreItem {
  // Post-specific fields
  id: number;
  user_id: number;
  title?: string;
  content: string;
  media_url: string;
  media_type?: string;
  is_promoted?: number;
  video_category_id?: number;
  user_name: string;
  user_profile_image: string | null;
  address?: string | null;
  premium_plan_id?: number;
  post_promotion_id?: number | null;
  target_min_age?: number | null;
  target_max_age?: number | null;
  reach_goal?: number | null;
  duration_days?: number | null;
  pay_per_view?: number | null;
  total_pay?: number | null;
  platform_fee?: number | null;
  likeCount?: number;
  commentCount?: number;
  is_liked: boolean;
  content_type: 'post' | 'shot';
  
  // Short/Shot-specific fields (when content_type is 'shot')
  name?: string;
  category_id?: number;
  total_views?: number;
  total_likes?: number;
  thumbnail?: string;
  channel_follow?: any;
  channelId?: number;
  total_comments?: number;
}

export interface ExploreContentResponse {
  status: boolean;
  message: string;
  data: ExploreItem[];
  pagination: {
    current_page: number;
    total_page: number;
    total_count: number;
  };
}

// Presigned URL Types
export interface GeneratePresignedUrlRequest {
  files: Array<{ contentType: string }>;
}

export interface GeneratePresignedUrlResponse {
  status: boolean;
  message: string;
  data: Array<{
    presignedUrl: string;
    publicUrl: string;
    fileName: string;
  }>;
}
export interface ChatMessage {
  id: number;
  sender: number;
  receiver: number;
  message: string;
  createddate: string;
  is_seen: boolean;
}

export interface ChatConversation {
  messages: ChatMessage[];
}