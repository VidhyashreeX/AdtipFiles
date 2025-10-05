// src/services/videoSDKService.ts - VideoSDK Integration for Web

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

interface VideoSDKResponse {
  success: boolean;
  token?: string;
  meetingId?: string;
  error?: string;
}

class VideoSDKService {
  /**
   * Generate VideoSDK token from backend
   */
  static async generateToken(): Promise<VideoSDKResponse> {
    try {
      console.log('[VideoSDKService] Generating token...');

      const response = await api.post('/api/videosdk/generate-token');

      if (response.data.token) {
        console.log('[VideoSDKService] Token generated successfully');
        return {
          success: true,
          token: response.data.token,
        };
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('[VideoSDKService] Failed to generate token:', error);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to generate token',
      };
    }
  }

  /**
   * Create a VideoSDK meeting
   */
  static async createMeeting(token: string, region: string = 'us001'): Promise<VideoSDKResponse> {
    try {
      console.log('[VideoSDKService] Creating meeting...');

      const response = await api.post('/api/videosdk/create-meeting', {
        token,
        region,
      });

      if (response.data.meetingId) {
        console.log('[VideoSDKService] Meeting created successfully:', response.data.meetingId);
        return {
          success: true,
          meetingId: response.data.meetingId,
        };
      } else {
        throw new Error('No meeting ID received from server');
      }
    } catch (error: any) {
      console.error('[VideoSDKService] Failed to create meeting:', error);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create meeting',
      };
    }
  }

  /**
   * Validate a VideoSDK meeting ID
   */
  static async validateMeeting(meetingId: string, token: string): Promise<boolean> {
    try {
      console.log('[VideoSDKService] Validating meeting:', meetingId);

      const response = await api.post('/api/videosdk/validate-meeting', {
        meetingId,
        token,
      });

      return response.data.valid === true;
    } catch (error: any) {
      console.error('[VideoSDKService] Failed to validate meeting:', error);
      return false;
    }
  }
}

export default VideoSDKService;
