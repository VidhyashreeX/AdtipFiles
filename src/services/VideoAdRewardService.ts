import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AdEligibilityResponse {
  status: number;
  message: string;
  data: {
    eligible: boolean;
    reason?: string;
    adDetails?: {
      campaignId: number;
      campaignName: string;
      rewardAmount: number;
      creativeId: number;
      videoDuration: number;
      isSkippable: boolean;
      skipOffset: number;
    };
    previousReward?: {
      id: number;
      reward_amount: number;
      credited_at: string;
    };
  };
}

export interface CreditRewardResponse {
  status: number;
  message: string;
  data: {
    credited: boolean;
    reason?: string;
    rewardAmount?: number;
    campaignName?: string;
    walletTransactionId?: number;
    completionPercentage?: string;
  };
}

export interface RewardHistoryResponse {
  status: number;
  message: string;
  data: Array<{
    id: number;
    campaign_id: number;
    reward_amount: number;
    view_duration: number;
    completion_percentage: number;
    credited_at: string;
    platform: string;
    campaign_name: string;
    company_name: string;
  }>;
}

export interface TotalEarningsResponse {
  status: number;
  message: string;
  data: {
    totalEarnings: number;
    totalAdsWatched: number;
  };
}

/**
 * Video Ad Reward Service
 * Handles rewarded video ad functionality for React Web
 */
class VideoAdRewardService {
  /**
   * Check if user is eligible to receive reward for a specific ad
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @returns Promise with eligibility status
   */
  static async checkEligibility(
    userId: number,
    campaignId: number
  ): Promise<AdEligibilityResponse> {
    try {
      const response = await api.get<AdEligibilityResponse>(
        `/api/v1/ads/check-eligibility/${userId}/${campaignId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error checking ad eligibility:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Credit user wallet after successful ad view
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @param creativeId - Creative ID
   * @param viewDuration - How long user watched (seconds)
   * @param sessionId - Optional session ID
   * @returns Promise with credit result
   */
  static async creditReward(
    userId: number,
    campaignId: number,
    creativeId: number,
    viewDuration: number,
    sessionId?: string
  ): Promise<CreditRewardResponse> {
    try {
      const response = await api.post<CreditRewardResponse>(
        '/api/v1/ads/credit-reward',
        {
          userId,
          campaignId,
          creativeId,
          viewDuration,
          platform: 'web',
          sessionId,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error crediting ad reward:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get user's ad reward history
   * @param userId - User ID
   * @param limit - Number of records to return
   * @returns Promise with reward history
   */
  static async getRewardHistory(
    userId: number,
    limit: number = 50
  ): Promise<RewardHistoryResponse> {
    try {
      const response = await api.get<RewardHistoryResponse>(
        `/api/v1/ads/reward-history/${userId}?limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reward history:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get user's total ad earnings
   * @param userId - User ID
   * @returns Promise with total earnings
   */
  static async getTotalEarnings(
    userId: number
  ): Promise<TotalEarningsResponse> {
    try {
      const response = await api.get<TotalEarningsResponse>(
        `/api/v1/ads/total-earnings/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching total earnings:', error);
      throw error.response?.data || error;
    }
  }
}

export default VideoAdRewardService;
