/**
 * Ad System Type Definitions
 * TypeScript interfaces and types for the ad viewing system
 */

// ================================================================
// Ad Model Types
// ================================================================

export type AdModelType =
  | 'NON_SKIP'
  | 'SKIP'
  | 'BUMPER'
  | 'BRAND_AWARENESS'
  | 'BUSINESS_STATUS'
  | 'NON_SKIP_LEAD'
  | 'BRAND_AWARENESS_QUESTION'
  | 'NON_SKIP_QUESTION';

export type AdStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'SKIPPED';

export type MediaType = 1 | 2; // 1 = video, 2 = image

// ================================================================
// Ad Configuration
// ================================================================

export interface AdConfig {
  requiredWatchTime: number;
  skipAllowed: boolean;
  skipAvailableAfter: number;
  basePayout: number;
  websiteVisitRequired: boolean;
  websiteVisitDuration: number;
  websiteVisitBonus: number;
  questionRequired: boolean;
  questionBonus: number;
}

export const AD_MODEL_CONFIGS: Record<AdModelType, AdConfig> = {
  SKIP: {
    requiredWatchTime: 5,
    skipAllowed: true,
    skipAvailableAfter: 5,
    basePayout: 0.2,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: false,
    questionBonus: 0,
  },
  NON_SKIP: {
    requiredWatchTime: 20,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.4,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: false,
    questionBonus: 0,
  },
  BUMPER: {
    requiredWatchTime: 8,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.25,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: false,
    questionBonus: 0,
  },
  BRAND_AWARENESS: {
    requiredWatchTime: 8,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.2,
    websiteVisitRequired: true,
    websiteVisitDuration: 30,
    websiteVisitBonus: 2.0,
    questionRequired: false,
    questionBonus: 0,
  },
  BUSINESS_STATUS: {
    requiredWatchTime: 8,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.2,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: false,
    questionBonus: 0,
  },
  NON_SKIP_LEAD: {
    requiredWatchTime: 20,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.4,
    websiteVisitRequired: true,
    websiteVisitDuration: 30,
    websiteVisitBonus: 3.0,
    questionRequired: false,
    questionBonus: 0,
  },
  BRAND_AWARENESS_QUESTION: {
    requiredWatchTime: 8,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.2,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: true,
    questionBonus: 2.0,
  },
  NON_SKIP_QUESTION: {
    requiredWatchTime: 20,
    skipAllowed: false,
    skipAvailableAfter: 0,
    basePayout: 0.4,
    websiteVisitRequired: false,
    websiteVisitDuration: 0,
    websiteVisitBonus: 0,
    questionRequired: true,
    questionBonus: 3.0,
  },
};

// ================================================================
// Ad Session State
// ================================================================

export interface AdSession {
  sessionId: string;
  adId: number;
  userId: number;
  adModelType: AdModelType;
  status: AdStatus;
  
  // Watch time tracking
  currentWatchTime: number;
  requiredWatchTime: number;
  totalAdDuration: number;
  
  // Skip functionality
  skipAllowed: boolean;
  skipAvailableAfter: number;
  canSkipNow: boolean;
  
  // Payout information
  basePayout: number;
  bonusPayout: number;
  totalPayout: number;
  
  // Special requirements
  websiteVisitRequired: boolean;
  websiteUrl?: string;
  websiteVisited: boolean;
  websiteVisitDuration: number;
  
  questionRequired: boolean;
  question?: string;
  questionOptions?: string[];
  questionAnswered: boolean;
  answerCorrect?: boolean;
  
  // Metadata
  createdAt: Date;
  completedAt?: Date;
}

// ================================================================
// Ad View Data
// ================================================================

export interface AdViewData {
  id: number;
  campaign_name: string;
  company_name: string;
  ad_model_id: number;
  ad_model_name: string;
  ad_model_type: AdModelType;
  
  // Media
  media_type: MediaType;
  ad_upload_filename: string;
  thumbnail_url?: string;
  
  // Targeting
  target_gender: string;
  target_lower_age: number;
  target_upper_age: number;
  target_area: string;
  
  // Pricing
  view_price: number;
  adwatch_per_day: number;
  ad_view: number;
  
  // Dates
  ad_start_date: string;
  ad_end_date: string;
  
  // Company
  company_id: number;
  company_web_url?: string;
  question?: string;
  question_answer?: string;
  question_options?: string[];
  
  // Status
  is_active: number;
}

// ================================================================
// Ad History Item
// ================================================================

export interface AdHistoryItem {
  session_id: string;
  ad_id: number;
  campaign_name: string;
  company_name: string;
  ad_model_type: AdModelType;
  watch_time: number;
  required_watch_time: number;
  total_payout: number;
  base_payout: number;
  bonus_payout: number;
  status: AdStatus;
  payout_processed: boolean;
  created_at: string;
  completed_at?: string;
}

// ================================================================
// Viewing Statistics
// ================================================================

export interface ViewingStats {
  totalViews: number;
  completedViews: number;
  skippedViews: number;
  abandonedViews: number;
  totalEarnings: number;
  averageWatchTime: number;
  completionRate: number;
  todayViews: number;
  todayEarnings: number;
  weekViews: number;
  weekEarnings: number;
}

// ================================================================
// Error Types
// ================================================================

export interface AdViewerError {
  code: string;
  message: string;
  details?: any;
}

export const AD_ERROR_CODES = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  AD_NOT_FOUND: 'AD_NOT_FOUND',
  AD_INACTIVE: 'AD_INACTIVE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FRAUD_DETECTED: 'FRAUD_DETECTED',
  INVALID_WATCH_TIME: 'INVALID_WATCH_TIME',
  SKIP_NOT_ALLOWED: 'SKIP_NOT_ALLOWED',
  ALREADY_COMPLETED: 'ALREADY_COMPLETED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// ================================================================
// Helper Functions
// ================================================================

export function getAdModelType(adModelId: number): AdModelType {
  // Based on production database mapping
  const mapping: Record<number, AdModelType> = {
    2: 'NON_SKIP',
    5: 'SKIP',
    29: 'SKIP',
    30: 'BRAND_AWARENESS',
    90: 'BRAND_AWARENESS',
    91: 'BRAND_AWARENESS',
  };
  
  return mapping[adModelId] || 'SKIP'; // Default to SKIP
}

export function formatWatchTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

export function formatPayout(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function calculateCompletionPercentage(
  currentTime: number,
  requiredTime: number
): number {
  return Math.min(100, Math.round((currentTime / requiredTime) * 100));
}

export function getAdTypeColor(type: AdModelType): string {
  const colors: Record<AdModelType, string> = {
    SKIP: '#10B981', // green
    NON_SKIP: '#F59E0B', // amber
    BUMPER: '#3B82F6', // blue
    BRAND_AWARENESS: '#8B5CF6', // purple
    BUSINESS_STATUS: '#EC4899', // pink
    NON_SKIP_LEAD: '#EF4444', // red
    BRAND_AWARENESS_QUESTION: '#6366F1', // indigo
    NON_SKIP_QUESTION: '#F97316', // orange
  };
  
  return colors[type] || '#6B7280'; // gray default
}

export function getAdTypeBadge(type: AdModelType): string {
  const badges: Record<AdModelType, string> = {
    SKIP: '⏭️ Skippable',
    NON_SKIP: '⏯️ Non-Skip',
    BUMPER: '⚡ Bumper',
    BRAND_AWARENESS: '🌟 Brand',
    BUSINESS_STATUS: '💼 Business',
    NON_SKIP_LEAD: '🎯 Lead Gen',
    BRAND_AWARENESS_QUESTION: '❓ Quiz',
    NON_SKIP_QUESTION: '📝 Survey',
  };
  
  return badges[type] || '📺 Ad';
}
