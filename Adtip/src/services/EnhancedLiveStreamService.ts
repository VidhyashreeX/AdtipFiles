// src/services/EnhancedLiveStreamService.ts - Enhanced service for new live streaming types

import ApiService from './ApiService';
import { logError, logInfo } from '../utils/ProductionLogger';

export interface EnhancedStreamResponse {
  success: boolean;
  message: string;
  data?: any;
}

class EnhancedLiveStreamService {
  /**
   * Get all active streams of all types
   */
  static async getAllActiveStreams(userId: number, page: number = 1, limit: number = 20): Promise<EnhancedStreamResponse> {
    try {
      logInfo('EnhancedLiveStreamService', `Fetching all active streams for user ${userId}`);
      
      // Fetch all three types of streams in parallel
      const [freeStreams, influencerStreams, promotionalStreams] = await Promise.allSettled([
        this.getStreamsByType('free', userId, page, limit),
        this.getStreamsByType('influencer', userId, page, limit),
        this.getStreamsByType('promotional', userId, page, limit),
      ]);

      // Combine all successful results
      const allStreams: any[] = [];
      
      if (freeStreams.status === 'fulfilled' && freeStreams.value.success && freeStreams.value.data?.streams) {
        allStreams.push(...freeStreams.value.data.streams);
      }
      
      if (influencerStreams.status === 'fulfilled' && influencerStreams.value.success && influencerStreams.value.data?.streams) {
        allStreams.push(...influencerStreams.value.data.streams);
      }
      
      if (promotionalStreams.status === 'fulfilled' && promotionalStreams.value.success && promotionalStreams.value.data?.streams) {
        allStreams.push(...promotionalStreams.value.data.streams);
      }

      logInfo('EnhancedLiveStreamService', `Fetched ${allStreams.length} total active streams`);

      return {
        success: true,
        message: 'Streams fetched successfully',
        data: {
          streams: allStreams,
          total: allStreams.length
        }
      };
    } catch (error) {
      logError('EnhancedLiveStreamService', 'Failed to fetch all active streams', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch streams'
      };
    }
  }

  /**
   * Get streams by type with proper API endpoint
   */
  static async getStreamsByType(
    streamType: 'free' | 'influencer' | 'promotional',
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<EnhancedStreamResponse> {
    try {
      logInfo('EnhancedLiveStreamService', `Fetching ${streamType} streams for user ${userId}`);
      
      // Build URL with query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        user_id: userId.toString()
      });

      const response = await ApiService.authenticatedRequest(
        'GET',
        `/api/enhanced-livestream/streams/${streamType}?${params.toString()}`,
        null,
        true
      );

      if (response.success && response.data) {
        logInfo('EnhancedLiveStreamService', `Successfully fetched ${streamType} streams`);
        return {
          success: true,
          message: 'Streams fetched successfully',
          data: response.data
        };
      } else {
        logError('EnhancedLiveStreamService', `Failed to fetch ${streamType} streams`, response);
        return {
          success: false,
          message: response.message || 'Failed to fetch streams',
          data: { streams: [] }
        };
      }
    } catch (error) {
      logError('EnhancedLiveStreamService', `Error fetching ${streamType} streams`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch streams',
        data: { streams: [] }
      };
    }
  }
}

export default EnhancedLiveStreamService;
