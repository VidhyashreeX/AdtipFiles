// src/types/index.ts - Core type definitions for AdTip

// User and Authentication Types
export interface User {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  emailId: string | null;
  mobile_number: string;
  gender: string | null;
  dob: string | null;
  profile_image: string | null;
  profession: string | null;
  maternal_status: string | null;
  address: string | null;
  longitude: string | null;
  latitude: string | null;
  pincode: string | null;
  isOtpVerified: number;
  isSaveUserDetails: number;
  online_status: boolean;
  referal_code: string | null;
  referal_earnings: number;
  bio: string | null;
  premium_plan_id: number;
  content_creator_plan_id: number;
  is_available: boolean;
  dnd: boolean;
  premium: number;
  country_code: string;
  country: string;
  languages: Language[];
  interests: Interest[];
  accessToken: string;
  is_premium: boolean;
  channelId: string | null;
  wallet?: number;
}

export interface Language {
  id: number;
  name: string;
  isPrimary: boolean;
}

export interface Interest {
  id: number;
  name: string;
  isPrimary: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  current_page: number;
  total_page: number;
  total_count: number;
}

// Post and Content Types
export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: 'video' | 'image';
  is_promoted: number;
  video_category_id: number;
  user_name: string | null;
  user_profile_image: string | null;
  address: string | null;
  category_name: string;
  post_promotion_id: number | null;
  target_min_age: number | null;
  target_max_age: number | null;
  reach_goal: number | null;
  duration_days: number | null;
  pay_per_view: string | null;
  total_pay: string | null;
  platform_fee: string | null;
  likeCount: number;
  commentCount: number;
  is_liked: boolean;
  thumbnail?: string;
  duration?: string;
  views?: number;
}

// Comment Types
export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_profile_image: string | null;
  like_count: number;
  is_liked: boolean;
}

export interface CommentsResponse {
  status: boolean;
  message: string;
  data: Comment[];
  pagination: Pagination;
}

// Product and Marketplace Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  seller_id: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

// Advertisement Types
export interface AdCampaign {
  id: number;
  name: string;
  budget: number;
  status: 'active' | 'paused' | 'completed';
  target_audience: TargetAudience;
  creatives: AdCreative[];
  analytics: AdAnalytics;
}

export interface TargetAudience {
  age_range: [number, number];
  gender: 'all' | 'male' | 'female';
  interests: string[];
  location: string[];
}

export interface AdCreative {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  description: string;
}

export interface AdAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
}

// Video and Streaming Types
export interface VideoData {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  dislikes: number;
  upload_date: string;
  channel_id: number;
  tags: string[];
}

export interface LiveStream {
  id: number;
  title: string;
  description: string;
  stream_key: string;
  is_live: boolean;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
}

// Form and Validation Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Error Types
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// API Request/Response Types
export interface CompanyData {
  companyName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  description?: string;
  industry?: string;
  companyType?: string;
  ctaButton?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface AdModelData {
  campaignName?: string;
  targetAudience?: string;
  budget?: number;
  duration?: number;
  adType?: string;
  mediaFile?: File;
  creativeUrl?: string;
  title?: string;
  description?: string;
  callToAction?: string;
  targetUrl?: string;
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  tags?: string[];
  specifications?: Record<string, string>;
}

export interface OrderData {
  product_id: number;
  quantity: number;
  shipping_address: string;
  payment_method: string;
}

export interface PaymentData {
  amount: number;
  currency: string;
  payment_method: string;
  order_id?: number;
  description?: string;
}

// Utility Types for API functions
export type ApiFunction<TData = unknown, TParams = unknown> = (
  data?: TData,
  params?: TParams
) => Promise<ApiResponse>;

// Error handling types
export interface ApiErrorResponse {
  status: number;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
}

// Event Types
export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Channel Types
export interface UpdateChannelRequest {
  id: number;
  channelName: string;
  channelDescription: string;
  profileImageURL: string;
}

export interface ChannelData {
  id: number;
  channelName: string;
  channelDescription: string;
  profileImageURL: string;
  // Add other channel fields as needed
}

export interface UserCompleteData {
  channel: ChannelData | null;
  videos: VideoData[];
  shorts: VideoData[];
  posts: Post[];
  errors: string[];
}