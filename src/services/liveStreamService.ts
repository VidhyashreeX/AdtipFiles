// src/services/liveStreamService.ts - Live Streaming Service for Web

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

export interface StreamConfig {
  title: string;
  cost_per_minute: number;
  viewer_reward_per_minute?: number;
  is_private?: boolean;
}

export interface TipData {
  amount: number;
  message?: string;
}

export interface LiveStreamResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ActiveStream {
  id: string;
  meeting_id: string;
  title: string;
  streamer_name: string;
  thumbnail_url?: string;
  profile_image?: string;
  viewer_count: number;
  start_time: string;
  stream_type: 'free' | 'influencer' | 'promotional';
  cost_per_minute?: number;
  company_pay_per_viewer_per_minute?: number;
  streamer_id: number;
  product_service_name?: string;
  product_service_description?: string;
  is_active: boolean;
  status: string;
}

class LiveStreamService {
  /**
   * Start a new live stream
   */
  static async startStream(
    userId: number,
    config: StreamConfig
  ): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Starting live stream:', { userId, config });

      const response = await api.post('/api/live-stream/start', {
        user_id: userId,
        meeting_id: '', // Empty string - backend will auto-generate
        title: config.title,
        cost_per_minute: config.cost_per_minute,
        viewer_reward_per_minute: config.viewer_reward_per_minute || 0,
        is_private: config.is_private || false,
      });

      console.log('[LiveStreamService] Live stream started successfully:', response.data);

      return {
        success: true,
        message: 'Stream started successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to start stream:', error);

      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to start stream';

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * End an active live stream
   */
  static async endStream(userId: number, meetingId: string): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Ending live stream:', { userId, meetingId });

      const response = await api.post('/api/live-stream/end', {
        user_id: userId,
        meeting_id: meetingId,
      });

      console.log('[LiveStreamService] Live stream ended successfully:', response.data);

      return {
        success: true,
        message: 'Stream ended successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to end stream:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to end stream',
      };
    }
  }

  /**
   * Join an active live stream as a viewer
   */
  static async joinStream(userId: number, meetingId: string): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Joining live stream:', { userId, meetingId });

      const response = await api.post('/api/live-stream/join', {
        user_id: userId,
        meeting_id: meetingId,
      });

      console.log('[LiveStreamService] Successfully joined stream:', response.data);

      return {
        success: true,
        message: 'Joined stream successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to join stream:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to join stream',
      };
    }
  }

  /**
   * Leave a live stream
   */
  static async leaveStream(userId: number, meetingId: string): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Leaving live stream:', { userId, meetingId });

      const response = await api.post('/api/live-stream/leave', {
        user_id: userId,
        meeting_id: meetingId,
      });

      return {
        success: true,
        message: 'Left stream successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to leave stream:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to leave stream',
      };
    }
  }

  /**
   * Get all active live streams
   */
  static async getActiveStreams(page: number = 1, limit: number = 20): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Fetching active streams:', { page, limit });

      const response = await api.get('/api/live-stream/active', {
        params: { page, limit },
      });

      console.log('[LiveStreamService] Active streams fetched:', response.data);

      return {
        success: true,
        message: 'Active streams fetched successfully',
        data: response.data.data || { streams: [], total: 0 },
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to fetch active streams:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch active streams',
        data: { streams: [], total: 0 },
      };
    }
  }

  /**
   * Send a tip during a live stream
   */
  static async sendTip(
    userId: number,
    streamerId: number,
    tipData: TipData
  ): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Sending tip:', { userId, streamerId, tipData });

      const response = await api.post('/api/live-stream/tip', {
        user_id: userId,
        streamer_id: streamerId,
        amount: tipData.amount,
        message: tipData.message || '',
      });

      return {
        success: true,
        message: 'Tip sent successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to send tip:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send tip',
      };
    }
  }

  /**
   * Get stream analytics
   */
  static async getStreamAnalytics(streamId: string): Promise<LiveStreamResponse> {
    try {
      const response = await api.get(`/api/live-stream/analytics/${streamId}`);

      return {
        success: true,
        message: 'Analytics fetched successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to fetch analytics:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch analytics',
      };
    }
  }

  /**
   * Get all active streams of all types (free, influencer, promotional)
   */
  static async getAllActiveStreams(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Fetching all active streams for user:', userId);

      // Fetch all three types of streams in parallel
      const [freeStreams, influencerStreams, promotionalStreams] = await Promise.allSettled([
        this.getStreamsByType('free', userId, page, limit),
        this.getStreamsByType('influencer', userId, page, limit),
        this.getStreamsByType('promotional', userId, page, limit),
      ]);

      // Combine all successful results
      const allStreams: ActiveStream[] = [];

      if (freeStreams.status === 'fulfilled' && freeStreams.value.success) {
        allStreams.push(...(freeStreams.value.data?.streams || []));
      }

      if (influencerStreams.status === 'fulfilled' && influencerStreams.value.success) {
        allStreams.push(...(influencerStreams.value.data?.streams || []));
      }

      if (promotionalStreams.status === 'fulfilled' && promotionalStreams.value.success) {
        allStreams.push(...(promotionalStreams.value.data?.streams || []));
      }

      console.log('[LiveStreamService] Fetched total active streams:', allStreams.length);

      return {
        success: true,
        message: 'Streams fetched successfully',
        data: {
          streams: allStreams,
          total: allStreams.length,
        },
      };
    } catch (error: any) {
      console.error('[LiveStreamService] Failed to fetch all active streams:', error);

      return {
        success: false,
        message: error.message || 'Failed to fetch streams',
        data: { streams: [], total: 0 },
      };
    }
  }

  /**
   * Get streams by type
   */
  static async getStreamsByType(
    streamType: 'free' | 'influencer' | 'promotional',
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<LiveStreamResponse> {
    try {
      console.log('[LiveStreamService] Fetching streams by type:', streamType);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        user_id: userId.toString(),
      });

      const response = await api.get(
        `/api/enhanced-livestream/streams/${streamType}?${params.toString()}`
      );

      if (response.data.success) {
        return {
          success: true,
          message: 'Streams fetched successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch streams',
          data: { streams: [] },
        };
      }
    } catch (error: any) {
      console.error(`[LiveStreamService] Error fetching ${streamType} streams:`, error);

      return {
        success: false,
        message: error.message || 'Failed to fetch streams',
        data: { streams: [] },
      };
    }
  }
}

export default LiveStreamService;
