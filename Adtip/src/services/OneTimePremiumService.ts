/**
 * One-Time Premium Service
 * 
 * This service manages one-time premium purchases and status checking.
 * It provides a clean interface for premium-related operations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import { Logger } from '../utils/ProductionLogger';

export interface PremiumPlan {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  original_price: number;
  discounted_price: number;
  features: string[];
  is_popular: boolean;
  monthly_savings: number;
  total_savings: number;
  savings_percentage: number;
}

export interface PremiumStatus {
  is_premium: boolean;
  premium_type: 'subscription' | 'onetime' | null;
  premium_id?: number;
  plan_name?: string;
  plan_description?: string;
  plan_features?: string[];
  starts_at?: string;
  expires_at?: string;
  days_remaining: number;
  amount_paid?: number;
  duration_months?: number;
}

export interface PremiumPurchaseHistory {
  history: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class OneTimePremiumService {
  private static instance: OneTimePremiumService;
  private premiumStatusCache: PremiumStatus | null = null;
  private premiumPlansCache: PremiumPlan[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): OneTimePremiumService {
    if (!this.instance) {
      this.instance = new OneTimePremiumService();
    }
    return this.instance;
  }

  /**
   * Get available one-time premium plans
   */
  async getPremiumPlans(forceRefresh: boolean = false): Promise<PremiumPlan[]> {
    try {
      // Return cached data if available and not expired
      if (!forceRefresh && this.premiumPlansCache && Date.now() < this.cacheExpiry) {
        Logger.info('OneTimePremiumService', 'Returning cached premium plans');
        return this.premiumPlansCache;
      }

      Logger.info('OneTimePremiumService', 'Fetching premium plans from API');
      const response = await ApiService.getOneTimePremiumPlans();

      if (response.status) {
        this.premiumPlansCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        
        // Store in AsyncStorage for offline access
        await AsyncStorage.setItem('@premium_plans_cache', JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));

        Logger.info('OneTimePremiumService', 'Premium plans fetched successfully', {
          plansCount: response.data.length
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch premium plans');
      }

    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error fetching premium plans', error);

      // Try to return cached data from AsyncStorage
      try {
        const cachedData = await AsyncStorage.getItem('@premium_plans_cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Use cached data if it's less than 1 hour old
          if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
            Logger.info('OneTimePremiumService', 'Returning cached premium plans from storage');
            return parsed.data;
          }
        }
      } catch (cacheError) {
        Logger.error('OneTimePremiumService', 'Error reading cached premium plans', cacheError);
      }

      throw error;
    }
  }

  /**
   * Get user's premium status
   */
  async getPremiumStatus(userId: string, forceRefresh: boolean = false): Promise<PremiumStatus> {
    try {
      // Return cached data if available and not expired
      if (!forceRefresh && this.premiumStatusCache && Date.now() < this.cacheExpiry) {
        Logger.info('OneTimePremiumService', 'Returning cached premium status');
        return this.premiumStatusCache;
      }

      Logger.info('OneTimePremiumService', 'Fetching premium status from API', { userId });
      const response = await ApiService.getPremiumStatusOneTime(userId);

      if (response.status) {
        this.premiumStatusCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;

        // Store in AsyncStorage
        await AsyncStorage.setItem('@premium_status_cache', JSON.stringify({
          data: response.data,
          timestamp: Date.now(),
          userId
        }));

        Logger.info('OneTimePremiumService', 'Premium status fetched successfully', {
          isPremium: response.data.is_premium,
          premiumType: response.data.premium_type,
          daysRemaining: response.data.days_remaining
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch premium status');
      }

    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error fetching premium status', error);

      // Try to return cached data from AsyncStorage
      try {
        const cachedData = await AsyncStorage.getItem('@premium_status_cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Use cached data if it's for the same user and less than 30 minutes old
          if (parsed.userId === userId && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            Logger.info('OneTimePremiumService', 'Returning cached premium status from storage');
            return parsed.data;
          }
        }
      } catch (cacheError) {
        Logger.error('OneTimePremiumService', 'Error reading cached premium status', cacheError);
      }

      // Return default status on error
      return {
        is_premium: false,
        premium_type: null,
        days_remaining: 0
      };
    }
  }

  /**
   * Purchase premium plan
   */
  async purchasePremium(params: {
    user_id: number;
    plan_id: number;
    order_id: string;
    payment_id: string;
    amount: number;
    payment_status: string;
  }): Promise<any> {
    try {
      Logger.info('OneTimePremiumService', 'Purchasing premium plan', {
        userId: params.user_id,
        planId: params.plan_id,
        amount: params.amount
      });

      const response = await ApiService.purchasePremiumOneTime(params);

      if (response.status) {
        // Clear cache to force refresh on next status check
        this.clearCache();

        Logger.info('OneTimePremiumService', 'Premium purchase successful', {
          premiumId: response.data.premium_id,
          expiresAt: response.data.expires_at
        });

        return response;
      } else {
        throw new Error(response.message || 'Premium purchase failed');
      }

    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error purchasing premium', error);
      throw error;
    }
  }

  /**
   * Get premium purchase history
   */
  async getPremiumHistory(userId: string, page: number = 1, limit: number = 10): Promise<PremiumPurchaseHistory> {
    try {
      Logger.info('OneTimePremiumService', 'Fetching premium history', {
        userId,
        page,
        limit
      });

      const response = await ApiService.getPremiumHistoryOneTime(userId, page, limit);

      if (response.status) {
        Logger.info('OneTimePremiumService', 'Premium history fetched successfully', {
          totalRecords: response.data.pagination.total
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch premium history');
      }

    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error fetching premium history', error);
      throw error;
    }
  }

  /**
   * Check if user has active premium
   */
  async hasActivePremium(userId: string): Promise<boolean> {
    try {
      const status = await this.getPremiumStatus(userId);
      return status.is_premium && status.days_remaining > 0;
    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error checking active premium', error);
      return false;
    }
  }

  /**
   * Get premium expiry information
   */
  async getPremiumExpiry(userId: string): Promise<{ expires_at: string | null; days_remaining: number }> {
    try {
      const status = await this.getPremiumStatus(userId);
      return {
        expires_at: status.expires_at || null,
        days_remaining: status.days_remaining
      };
    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error getting premium expiry', error);
      return {
        expires_at: null,
        days_remaining: 0
      };
    }
  }

  /**
   * Clear premium cache
   */
  clearCache(): void {
    this.premiumStatusCache = null;
    this.premiumPlansCache = null;
    this.cacheExpiry = 0;
    
    // Clear AsyncStorage cache
    AsyncStorage.removeItem('@premium_status_cache').catch(() => {});
    AsyncStorage.removeItem('@premium_plans_cache').catch(() => {});
    
    Logger.info('OneTimePremiumService', 'Premium cache cleared');
  }

  /**
   * Refresh premium status
   */
  async refreshPremiumStatus(userId: string): Promise<PremiumStatus> {
    return this.getPremiumStatus(userId, true);
  }

  /**
   * Refresh premium plans
   */
  async refreshPremiumPlans(): Promise<PremiumPlan[]> {
    return this.getPremiumPlans(true);
  }

  /**
   * Get recommended plan (most popular or best value)
   */
  async getRecommendedPlan(): Promise<PremiumPlan | null> {
    try {
      const plans = await this.getPremiumPlans();
      
      // First try to find the popular plan
      const popularPlan = plans.find(plan => plan.is_popular);
      if (popularPlan) {
        return popularPlan;
      }

      // Otherwise, find the plan with best savings percentage
      const bestValuePlan = plans.reduce((best, current) => {
        return current.savings_percentage > best.savings_percentage ? current : best;
      }, plans[0]);

      return bestValuePlan || null;

    } catch (error) {
      Logger.error('OneTimePremiumService', 'Error getting recommended plan', error);
      return null;
    }
  }
}

export default OneTimePremiumService;
