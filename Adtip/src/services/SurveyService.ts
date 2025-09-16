// src/services/SurveyService.ts - Survey service for API interactions

import ApiService from './ApiService';
import { Logger } from '../utils/ProductionLogger';

export interface SurveyProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: string[];
  url: string;
  earnings: string;
  estimatedTime: string;
  rating: number;
  isActive: boolean;
}

export interface SurveyEngagement {
  survey_id: string;
  provider_name: string;
  action_type: 'click' | 'view' | 'complete' | 'start';
}

export interface SurveyHistoryItem {
  survey_id: string;
  provider_name: string;
  action_type: string;
  created_at: string;
}

export interface SurveyAnalytics {
  survey_id: string;
  provider_name: string;
  action_type: string;
  count: number;
  date: string;
}

class SurveyService {
  
  /**
   * Get available survey providers
   */
  static async getSurveyProviders(): Promise<SurveyProvider[]> {
    try {
      Logger.info('SurveyService', 'Fetching survey providers...');
      
      const response = await ApiService.get('/survey/providers');
      
      if (response && response.status === 200) {
        Logger.info('SurveyService', `Fetched ${response.data?.length || 0} survey providers`);
        return response.data || [];
      }
      
      Logger.warn('SurveyService', 'No survey providers returned from API');
      return [];
      
    } catch (error) {
      Logger.error('SurveyService', 'Error fetching survey providers:', error);
      
      // Return fallback static data if API fails
      return this.getFallbackSurveyProviders();
    }
  }
  
  /**
   * Track survey engagement
   */
  static async trackSurveyEngagement(engagement: SurveyEngagement): Promise<boolean> {
    try {
      Logger.info('SurveyService', `Tracking survey engagement: ${engagement.survey_id} - ${engagement.action_type}`);
      
      const response = await ApiService.post('/survey/track-engagement', engagement);
      
      if (response && response.status === 200) {
        Logger.info('SurveyService', 'Survey engagement tracked successfully');
        return true;
      }
      
      Logger.warn('SurveyService', 'Failed to track survey engagement');
      return false;
      
    } catch (error) {
      Logger.error('SurveyService', 'Error tracking survey engagement:', error);
      return false;
    }
  }
  
  /**
   * Get user's survey history
   */
  static async getSurveyHistory(page: number = 1, limit: number = 20): Promise<{
    history: SurveyHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      Logger.info('SurveyService', `Fetching survey history: page ${page}, limit ${limit}`);
      
      const response = await ApiService.get(`/survey/history/${page}/${limit}`);
      
      if (response && response.status === 200 && response.data) {
        Logger.info('SurveyService', `Fetched survey history: ${response.data.history?.length || 0} items`);
        return response.data;
      }
      
      Logger.warn('SurveyService', 'No survey history returned from API');
      return {
        history: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
      
    } catch (error) {
      Logger.error('SurveyService', 'Error fetching survey history:', error);
      return {
        history: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
  }
  
  /**
   * Get survey analytics (admin only)
   */
  static async getSurveyAnalytics(startDate?: string, endDate?: string): Promise<{
    analytics: SurveyAnalytics[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  }> {
    try {
      Logger.info('SurveyService', 'Fetching survey analytics...');
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await ApiService.get(`/survey/analytics?${params.toString()}`);
      
      if (response && response.status === 200 && response.data) {
        Logger.info('SurveyService', `Fetched survey analytics: ${response.data.analytics?.length || 0} records`);
        return response.data;
      }
      
      Logger.warn('SurveyService', 'No survey analytics returned from API');
      return {
        analytics: [],
        dateRange: { startDate: '', endDate: '' }
      };
      
    } catch (error) {
      Logger.error('SurveyService', 'Error fetching survey analytics:', error);
      return {
        analytics: [],
        dateRange: { startDate: '', endDate: '' }
      };
    }
  }
  
  /**
   * Fallback survey providers for offline/error scenarios
   */
  private static getFallbackSurveyProviders(): SurveyProvider[] {
    return [
      {
        id: 'swagbucks',
        name: 'Swagbucks',
        description: 'Complete surveys & earn rewards',
        icon: '💰',
        color: '#FF6B35',
        gradientColors: ['#FF6B35', '#FF8E53'],
        url: 'https://www.swagbucks.com',
        earnings: '₹5-50',
        estimatedTime: '5-15 min',
        rating: 4.5,
        isActive: true
      },
      {
        id: 'toloka',
        name: 'Toloka',
        description: 'AI training tasks & micro jobs',
        icon: '🤖',
        color: '#4A90E2',
        gradientColors: ['#4A90E2', '#357ABD'],
        url: 'https://toloka.yandex.com',
        earnings: '₹2-25',
        estimatedTime: '2-10 min',
        rating: 4.3,
        isActive: true
      },
      {
        id: 'surveytime',
        name: 'SurveyTime',
        description: 'Quick surveys, instant rewards',
        icon: '⏰',
        color: '#50C878',
        gradientColors: ['#50C878', '#45B566'],
        url: 'https://surveytime.app',
        earnings: '₹10-30',
        estimatedTime: '3-12 min',
        rating: 4.2,
        isActive: true
      }
    ];
  }
}

export default SurveyService;