/**
 * CPX Research Reward Service
 * 
 * Handles survey completion rewards, transaction processing, and integration
 * with the existing wallet system for CPX Research surveys.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import Logger from '../utils/logger';
import { calculatePremiumReward } from '../config/cpxResearchConfig';

// Types for CPX Research transactions
export interface CPXTransaction {
  id: string;
  survey_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  user_type?: 'premium' | 'regular';
  final_amount?: number;
}

export interface CPXSurvey {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  estimated_time: number;
  status: 'available' | 'completed' | 'expired';
}

export interface CPXRewardResponse {
  success: boolean;
  transaction_id?: string;
  new_balance?: string;
  message?: string;
  error?: string;
}

class CPXRewardService {
  private static readonly STORAGE_KEYS = {
    PENDING_TRANSACTIONS: '@cpx_pending_transactions',
    COMPLETED_SURVEYS: '@cpx_completed_surveys',
    LAST_SYNC: '@cpx_last_sync',
  };

  /**
   * Process a completed survey reward
   */
  static async processSurveyReward(
    userId: string | number,
    surveyId: string,
    baseAmount: number,
    isPremium: boolean = false
  ): Promise<CPXRewardResponse> {
    try {
      Logger.info('CPXRewardService', 'Processing survey reward', {
        userId,
        surveyId,
        baseAmount,
        isPremium,
      });

      // Calculate final amount with premium multiplier
      const finalAmount = calculatePremiumReward(baseAmount, isPremium);

      // Create transaction record
      const transaction: CPXTransaction = {
        id: `cpx_${Date.now()}_${surveyId}`,
        survey_id: surveyId,
        user_id: userId.toString(),
        amount: baseAmount,
        currency: 'INR',
        status: 'pending',
        timestamp: Date.now(),
        user_type: isPremium ? 'premium' : 'regular',
        final_amount: finalAmount,
      };

      // Store pending transaction locally
      await this.storePendingTransaction(transaction);

      // Credit reward to user's wallet via API
      const response = await this.creditSurveyReward(
        Number(userId),
        finalAmount,
        surveyId,
        isPremium
      );

      if (response.success) {
        // Mark transaction as completed
        transaction.status = 'completed';
        await this.updateTransactionStatus(transaction.id, 'completed');
        
        // Store completed survey
        await this.storeCompletedSurvey(surveyId, finalAmount);

        Logger.info('CPXRewardService', 'Survey reward processed successfully', {
          transactionId: transaction.id,
          finalAmount,
        });

        return {
          success: true,
          transaction_id: transaction.id,
          new_balance: response.new_balance,
          message: `Survey completed! Earned ₹${finalAmount.toFixed(2)}${isPremium ? ' (4x Premium Bonus!)' : ''}`,
        };
      } else {
        // Mark transaction as failed
        transaction.status = 'failed';
        await this.updateTransactionStatus(transaction.id, 'failed');

        return {
          success: false,
          error: response.error || 'Failed to credit survey reward',
        };
      }
    } catch (error) {
      Logger.error('CPXRewardService', 'Error processing survey reward', error);
      return {
        success: false,
        error: 'An error occurred while processing the survey reward',
      };
    }
  }

  /**
   * Credit survey reward to user's wallet via API
   */
  private static async creditSurveyReward(
    userId: number,
    amount: number,
    surveyId: string,
    isPremium: boolean
  ): Promise<CPXRewardResponse> {
    try {
      // Use the existing reward API endpoint
      const response = await ApiService.post('/api/credit-survey-reward', {
        userId,
        amount,
        surveyId,
        isPremium,
        source: 'cpx_research',
        description: `CPX Research Survey Reward - Survey ID: ${surveyId}${isPremium ? ' (Premium 4x)' : ''}`,
      });

      if (response && response.success) {
        return {
          success: true,
          new_balance: response.new_balance || response.availableBalance,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to credit reward',
        };
      }
    } catch (error) {
      Logger.error('CPXRewardService', 'API error crediting survey reward', error);
      
      // Fallback to existing ad reward API if survey-specific endpoint doesn't exist
      try {
        const fallbackResponse = await ApiService.creditAdReward(userId, amount);
        return {
          success: fallbackResponse.success,
          new_balance: fallbackResponse.new_balance,
          error: fallbackResponse.success ? undefined : 'Fallback API failed',
        };
      } catch (fallbackError) {
        Logger.error('CPXRewardService', 'Fallback API also failed', fallbackError);
        return {
          success: false,
          error: 'Both primary and fallback APIs failed',
        };
      }
    }
  }

  /**
   * Store pending transaction locally
   */
  private static async storePendingTransaction(transaction: CPXTransaction): Promise<void> {
    try {
      const existingTransactions = await this.getPendingTransactions();
      const updatedTransactions = [...existingTransactions, transaction];
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_TRANSACTIONS,
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      Logger.error('CPXRewardService', 'Error storing pending transaction', error);
    }
  }

  /**
   * Get pending transactions
   */
  private static async getPendingTransactions(): Promise<CPXTransaction[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_TRANSACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      Logger.error('CPXRewardService', 'Error getting pending transactions', error);
      return [];
    }
  }

  /**
   * Update transaction status
   */
  private static async updateTransactionStatus(
    transactionId: string,
    status: 'completed' | 'failed'
  ): Promise<void> {
    try {
      const transactions = await this.getPendingTransactions();
      const updatedTransactions = transactions.map(t =>
        t.id === transactionId ? { ...t, status } : t
      );
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_TRANSACTIONS,
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      Logger.error('CPXRewardService', 'Error updating transaction status', error);
    }
  }

  /**
   * Store completed survey
   */
  private static async storeCompletedSurvey(
    surveyId: string,
    amount: number
  ): Promise<void> {
    try {
      const completedSurveys = await this.getCompletedSurveys();
      const newSurvey = {
        id: surveyId,
        amount,
        completed_at: Date.now(),
      };
      
      const updatedSurveys = [...completedSurveys, newSurvey];
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.COMPLETED_SURVEYS,
        JSON.stringify(updatedSurveys)
      );
    } catch (error) {
      Logger.error('CPXRewardService', 'Error storing completed survey', error);
    }
  }

  /**
   * Get completed surveys
   */
  static async getCompletedSurveys(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.COMPLETED_SURVEYS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      Logger.error('CPXRewardService', 'Error getting completed surveys', error);
      return [];
    }
  }

  /**
   * Get user's total survey earnings
   */
  static async getTotalSurveyEarnings(): Promise<number> {
    try {
      const completedSurveys = await this.getCompletedSurveys();
      return completedSurveys.reduce((total, survey) => total + (survey.amount || 0), 0);
    } catch (error) {
      Logger.error('CPXRewardService', 'Error calculating total survey earnings', error);
      return 0;
    }
  }

  /**
   * Sync pending transactions with server
   */
  static async syncPendingTransactions(): Promise<void> {
    try {
      const pendingTransactions = await this.getPendingTransactions();
      const failedTransactions = pendingTransactions.filter(t => t.status === 'pending');

      for (const transaction of failedTransactions) {
        const response = await this.creditSurveyReward(
          Number(transaction.user_id),
          transaction.final_amount || transaction.amount,
          transaction.survey_id,
          transaction.user_type === 'premium'
        );

        if (response.success) {
          await this.updateTransactionStatus(transaction.id, 'completed');
        }
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      Logger.error('CPXRewardService', 'Error syncing pending transactions', error);
    }
  }

  /**
   * Clear all stored data (for logout)
   */
  static async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.PENDING_TRANSACTIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.COMPLETED_SURVEYS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LAST_SYNC),
      ]);
    } catch (error) {
      Logger.error('CPXRewardService', 'Error clearing stored data', error);
    }
  }
}

export default CPXRewardService;
