/**
 * Ad Viewer Service for React Native
 * Integrates with backend ad viewing system
 * Handles ad sessions, watch time tracking, and payouts
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// ================================================================
// TypeScript Interfaces
// ================================================================

export interface AdModel {
  id: number;
  campaign_name: string;
  ad_model_id: number;
  ad_model_name: string;
  ad_upload_filename: string;
  media_type: number; // 1=video, 2=image
  company_name: string;
  company_web_url?: string;
  view_price: number;
  question?: string;
  question_answer?: string;
  question_options?: string[];
}

export interface StartAdSessionRequest {
  userId: number;
  adId: number;
}

export interface StartAdSessionResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    adId: number;
    userId: number;
    adModelType: string;
    requiredWatchTime: number;
    currentWatchTime: number;
    skipAllowed: boolean;
    skipAvailableAfter: number;
    totalAdDuration: number;
    basePayout: number;
    bonusAvailable: number;
    websiteVisitRequired: boolean;
    websiteUrl?: string;
    questionRequired: boolean;
    question?: string;
    questionOptions?: string[];
  };
}

export interface UpdateWatchTimeRequest {
  sessionId: string;
  watchTime: number;
}

export interface UpdateWatchTimeResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    watchTime: number;
    requiredWatchTime: number;
    canComplete: boolean;
    canSkip: boolean;
  };
}

export interface SkipAdRequest {
  sessionId: string;
  skipTime: number;
}

export interface SkipAdResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    skipAllowed: boolean;
    partialPayout: number;
    completionPercentage: number;
  };
}

export interface TrackWebsiteVisitRequest {
  sessionId: string;
  action: 'visit_start' | 'visit_end';
  duration?: number;
}

export interface TrackWebsiteVisitResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    websiteVisited: boolean;
    visitDuration: number;
    bonusUnlocked: boolean;
  };
}

export interface SubmitAnswerRequest {
  sessionId: string;
  userAnswer: string;
}

export interface SubmitAnswerResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    correct: boolean;
    bonusUnlocked: boolean;
  };
}

export interface CompleteAdViewRequest {
  sessionId: string;
}

export interface CompleteAdViewResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    completed: boolean;
    totalPayout: number;
    basePayout: number;
    bonusPayout: number;
    newWalletBalance: number;
  };
}

export interface ViewingHistoryResponse {
  status: number;
  message: string;
  data: Array<{
    session_id: string;
    ad_id: number;
    campaign_name: string;
    ad_model_type: string;
    watch_time: number;
    required_watch_time: number;
    total_payout: number;
    status: string;
    created_at: string;
    completed_at: string;
  }>;
}

export interface AdAnalyticsResponse {
  status: number;
  message: string;
  data: {
    adId: number;
    totalViews: number;
    completedViews: number;
    skippedViews: number;
    averageWatchTime: number;
    completionRate: number;
    totalPayout: number;
  };
}

// ================================================================
// Ad Viewer Service Class
// ================================================================

class AdViewerService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('UserLoggedIn');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('[AdViewer] Error getting auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[AdViewer] API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Start a new ad viewing session
   */
  async startAdSession(
    userId: number,
    adId: number
  ): Promise<StartAdSessionResponse> {
    try {
      console.log(`[AdViewer] Starting session: userId=${userId}, adId=${adId}`);
      
      const response = await this.api.post<StartAdSessionResponse>(
        '/api/ad-viewer/start',
        { userId, adId }
      );

      console.log('[AdViewer] Session started:', response.data.data.sessionId);
      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Start session error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update watch time for active session
   */
  async updateWatchTime(
    sessionId: string,
    watchTime: number
  ): Promise<UpdateWatchTimeResponse> {
    try {
      const response = await this.api.put<UpdateWatchTimeResponse>(
        '/api/ad-viewer/watch-time',
        { sessionId, watchTime }
      );

      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Update watch time error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Skip ad (if allowed)
   */
  async skipAd(
    sessionId: string,
    skipTime: number
  ): Promise<SkipAdResponse> {
    try {
      console.log(`[AdViewer] Skipping ad: sessionId=${sessionId}, time=${skipTime}s`);
      
      const response = await this.api.post<SkipAdResponse>(
        '/api/ad-viewer/skip',
        { sessionId, skipTime }
      );

      console.log('[AdViewer] Ad skipped:', response.data.data);
      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Skip error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Track website visit for brand awareness ads
   */
  async trackWebsiteVisit(
    sessionId: string,
    action: 'visit_start' | 'visit_end',
    duration?: number
  ): Promise<TrackWebsiteVisitResponse> {
    try {
      console.log(`[AdViewer] Website visit: ${action}, duration=${duration}s`);
      
      const response = await this.api.post<TrackWebsiteVisitResponse>(
        '/api/ad-viewer/website-visit',
        { sessionId, action, duration }
      );

      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Website visit error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Submit quiz answer
   */
  async submitAnswer(
    sessionId: string,
    userAnswer: string
  ): Promise<SubmitAnswerResponse> {
    try {
      console.log(`[AdViewer] Submitting answer for session: ${sessionId}`);
      
      const response = await this.api.post<SubmitAnswerResponse>(
        '/api/ad-viewer/submit-answer',
        { sessionId, userAnswer }
      );

      console.log('[AdViewer] Answer submitted:', response.data.data);
      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Submit answer error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Complete ad view and process payout
   */
  async completeAdView(
    sessionId: string
  ): Promise<CompleteAdViewResponse> {
    try {
      console.log(`[AdViewer] Completing ad view: ${sessionId}`);
      
      const response = await this.api.post<CompleteAdViewResponse>(
        '/api/ad-viewer/complete',
        { sessionId }
      );

      console.log('[AdViewer] Ad completed:', response.data.data);
      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Complete error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user's viewing history
   */
  async getViewingHistory(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ViewingHistoryResponse> {
    try {
      const response = await this.api.get<ViewingHistoryResponse>(
        `/api/ad-viewer/history/${userId}`,
        { params: { limit, offset } }
      );

      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Get history error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get ad analytics
   */
  async getAdAnalytics(adId: number): Promise<AdAnalyticsResponse> {
    try {
      const response = await this.api.get<AdAnalyticsResponse>(
        `/api/ad-viewer/analytics/${adId}`
      );

      return response.data;
    } catch (error: any) {
      console.error('[AdViewer] Get analytics error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      const status = error.response.status;
      return new Error(`[${status}] ${message}`);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new AdViewerService();
