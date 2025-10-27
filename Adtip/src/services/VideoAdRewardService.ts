import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

/**
 * Video Ad Reward Service for React Native
 * Handles rewarded video ad functionality
 */

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

class VideoAdRewardService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await AsyncStorage.getItem('UserLoggedIn');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return config;
    });
  }

  /**
   * Check if user is eligible to receive reward for a specific ad
   */
  async checkEligibility(
    userId: number,
    campaignId: number
  ): Promise<AdEligibilityResponse> {
    try {
      const response = await this.api.get<AdEligibilityResponse>(
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
   */
  async creditReward(
    userId: number,
    campaignId: number,
    creativeId: number,
    viewDuration: number,
    sessionId?: string
  ): Promise<CreditRewardResponse> {
    try {
      const response = await this.api.post<CreditRewardResponse>(
        '/api/v1/ads/credit-reward',
        {
          userId,
          campaignId,
          creativeId,
          viewDuration,
          platform: 'mobile',
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
   */
  async getRewardHistory(
    userId: number,
    limit: number = 50
  ): Promise<RewardHistoryResponse> {
    try {
      const response = await this.api.get<RewardHistoryResponse>(
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
   */
  async getTotalEarnings(userId: number): Promise<TotalEarningsResponse> {
    try {
      const response = await this.api.get<TotalEarningsResponse>(
        `/api/v1/ads/total-earnings/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching total earnings:', error);
      throw error.response?.data || error;
    }
  }
}

// Export singleton instance
export default new VideoAdRewardService();
