// services/EnhancedLiveStreamService.js - Service for enhanced live streaming features

import ApiService from './ApiService';

class EnhancedLiveStreamService {
  /**
   * Create a free live stream
   */
  async createFreeStream(userId, title) {
    try {
      const response = await ApiService.post('/api/enhanced-livestream/free', {
        user_id: userId,
        title
      });
      return response;
    } catch (error) {
      console.error('[EnhancedLiveStream] Error creating free stream:', error);
      throw error;
    }
  }

  /**
   * Create an influencer live stream
   */
  async createInfluencerStream(userId, title) {
    try {
      const response = await ApiService.post('/api/enhanced-livestream/influencer', {
        user_id: userId,
        title,
        cost_per_minute: 1
      });
      return response;
    } catch (error) {
      console.error('[EnhancedLiveStream] Error creating influencer stream:', error);
      throw error;
    }
  }

  /**
   * Create a promotional live stream
   */
  async createPromotionalStream(userId, streamData) {
    try {
      const response = await ApiService.post('/api/enhanced-livestream/promotional', {
        user_id: userId,
        ...streamData
      });
      return response;
    } catch (error) {
      console.error('[EnhancedLiveStream] Error creating promotional stream:', error);
      throw error;
    }
  }

  /**
   * Confirm promotional stream payment
   */
  async confirmPromotionalPayment(paymentData) {
    try {
      const response = await ApiService.post('/api/enhanced-livestream/confirm-promotional-payment', paymentData);
      return response;
    } catch (error) {
      console.error('[EnhancedLiveStream] Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Get streams by type with targeting
   */
  async getStreamsByType(type, userId, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (userId) {
        params.append('user_id', userId.toString());
      }

      const response = await ApiService.get(`/api/enhanced-livestream/streams/${type}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error(`[EnhancedLiveStream] Error getting ${type} streams:`, error);
      throw error;
    }
  }

  /**
   * Join enhanced stream with billing logic
   */
  async joinEnhancedStream(userId, meetingId) {
    try {
      const response = await ApiService.post('/api/live-stream/join-enhanced', {
        user_id: userId,
        meeting_id: meetingId
      });
      return response;
    } catch (error) {
      console.error('[EnhancedLiveStream] Error joining stream:', error);
      throw error;
    }
  }

  /**
   * Get all active streams (combines all types)
   */
  async getAllActiveStreams(userId, page = 1, limit = 20) {
    try {
      const [freeStreams, influencerStreams, promotionalStreams] = await Promise.allSettled([
        this.getStreamsByType('free', userId, page, Math.ceil(limit / 3)),
        this.getStreamsByType('influencer', userId, page, Math.ceil(limit / 3)),
        this.getStreamsByType('promotional', userId, page, Math.ceil(limit / 3))
      ]);

      let allStreams = [];

      if (freeStreams.status === 'fulfilled' && freeStreams.value?.success) {
        allStreams.push(...(freeStreams.value.data?.streams || []));
      }
      
      if (influencerStreams.status === 'fulfilled' && influencerStreams.value?.success) {
        allStreams.push(...(influencerStreams.value.data?.streams || []));
      }
      
      if (promotionalStreams.status === 'fulfilled' && promotionalStreams.value?.success) {
        allStreams.push(...(promotionalStreams.value.data?.streams || []));
      }

      // Sort by viewer count (descending) and start time
      allStreams.sort((a, b) => {
        if (b.viewer_count !== a.viewer_count) {
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        }
        return new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime();
      });

      return {
        success: true,
        data: {
          streams: allStreams.slice(0, limit),
          pagination: {
            page,
            limit,
            total: allStreams.length
          }
        }
      };
    } catch (error) {
      console.error('[EnhancedLiveStream] Error getting all streams:', error);
      throw error;
    }
  }
}

export default new EnhancedLiveStreamService();