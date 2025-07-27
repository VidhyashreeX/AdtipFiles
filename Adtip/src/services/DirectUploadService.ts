// adtip-reactnative/Adtip/src/services/DirectUploadService.ts
// Frontend service for Cloudflare Stream Direct Creator Uploads
// Reference: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/

import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DirectUploadResponse {
  success: boolean;
  data?: {
    uploadURL: string;
    videoId: string;
    maxDurationSeconds: number;
    allowedOrigins: string[];
  };
  error?: string;
}

export interface UploadStatusResponse {
  success: boolean;
  data?: {
    uid: string;
    status: string;
    readyToStream: boolean;
    duration?: number;
    thumbnail?: string;
    playback?: {
      hls?: string;
      dash?: string;
    };
  };
  error?: string;
}

export interface VideoRegistrationData {
  streamVideoId: string;
  name: string;
  description?: string;
  categoryId?: number;
  createdBy: number;
  videoChannel: string;
  isShot: boolean;
  thumbnailUrl?: string;
}

class DirectUploadService {
  private static instance: DirectUploadService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  static getInstance(): DirectUploadService {
    if (!DirectUploadService.instance) {
      DirectUploadService.instance = new DirectUploadService();
    }
    return DirectUploadService.instance;
  }

  /**
   * Get authentication token from AsyncStorage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Use exact same logic as ApiService for consistency
      let token = await AsyncStorage.getItem('accessToken');
      console.log('[DirectUpload] accessToken from AsyncStorage:', token ? `${token.substring(0, 20)}...` : 'null');

      if (!token) {
        token = await AsyncStorage.getItem('@auth_token');
        console.log('[DirectUpload] @auth_token from AsyncStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      }

      console.log('[DirectUpload] Final token to use:', token ? `${token.substring(0, 20)}...` : 'null');

      // Additional debugging: check all auth-related keys
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => key.includes('token') || key.includes('auth') || key.includes('user'));
      console.log('[DirectUpload] All auth-related keys in AsyncStorage:', authKeys);

      return token;
    } catch (error) {
      console.error('[DirectUpload] Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Create direct upload URL for TipShorts
   */
  async createTipShortsUploadUrl(userInfo: {
    userId: string;
    userName: string;
    channelId: string;
  }): Promise<DirectUploadResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.error('[DirectUpload] No authentication token found');
        return { success: false, error: 'Authentication token not found' };
      }

      console.log('[DirectUpload] Creating TipShorts upload URL for:', userInfo);
      console.log('[DirectUpload] API URL:', `${this.baseUrl}/api/direct-upload/tipshorts`);

      const response = await fetch(`${this.baseUrl}/api/direct-upload/tipshorts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userInfo),
      });

      const data = await response.json();
      console.log('[DirectUpload] TipShorts upload URL response:', { status: response.status, data });

      if (response.ok && data.success) {
        console.log('[DirectUpload] TipShorts upload URL created:', data.data.videoId);
        return data;
      } else {
        console.error('[DirectUpload] Failed to create TipShorts upload URL:', data.error);
        return { success: false, error: data.error || 'Failed to create upload URL' };
      }
    } catch (error) {
      console.error('[DirectUpload] Error creating TipShorts upload URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create direct upload URL for TipTube
   */
  async createTipTubeUploadUrl(userInfo: {
    userId: string;
    userName: string;
    channelId: string;
  }): Promise<DirectUploadResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.error('[DirectUpload] No authentication token found');
        return { success: false, error: 'Authentication token not found' };
      }

      console.log('[DirectUpload] Creating TipTube upload URL for:', userInfo);
      console.log('[DirectUpload] API URL:', `${this.baseUrl}/api/direct-upload/tiptube`);
      console.log('[DirectUpload] Sending request with headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
      });
      console.log('[DirectUpload] Request body:', userInfo);

      // Test token with a simple endpoint first
      try {
        console.log('[DirectUpload] Testing token with simple endpoint...');
        const testResponse = await fetch(`${this.baseUrl}/api/getcategories`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('[DirectUpload] Token test response status:', testResponse.status);
        if (!testResponse.ok) {
          const testError = await testResponse.text();
          console.log('[DirectUpload] Token test failed:', testError);
        } else {
          console.log('[DirectUpload] Token test successful - token is valid');
        }
      } catch (testError) {
        console.error('[DirectUpload] Token test error:', testError);
      }

      const response = await fetch(`${this.baseUrl}/api/direct-upload/tiptube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userInfo),
      });

      const data = await response.json();
      console.log('[DirectUpload] TipTube upload URL response:', { status: response.status, data });

      if (response.ok && data.success) {
        console.log('[DirectUpload] TipTube upload URL created:', data.data.videoId);
        return data;
      } else {
        console.error('[DirectUpload] Failed to create TipTube upload URL:', data.error);
        return { success: false, error: data.error || 'Failed to create upload URL' };
      }
    } catch (error) {
      console.error('[DirectUpload] Error creating TipTube upload URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Pre-register video in database before upload
   */
  async preRegisterVideo(videoData: VideoRegistrationData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication token not found' };
      }

      const response = await fetch(`${this.baseUrl}/api/direct-upload/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(videoData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[DirectUpload] Video pre-registered:', data.data.id);
        return data;
      } else {
        console.error('[DirectUpload] Failed to pre-register video:', data.error);
        return { success: false, error: data.error || 'Failed to pre-register video' };
      }
    } catch (error) {
      console.error('[DirectUpload] Error pre-registering video:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get upload status for a video
   */
  async getUploadStatus(videoId: string): Promise<UploadStatusResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication token not found' };
      }

      const response = await fetch(`${this.baseUrl}/api/direct-upload/status/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return data;
      } else {
        console.error('[DirectUpload] Failed to get upload status:', data.error);
        return { success: false, error: data.error || 'Failed to get upload status' };
      }
    } catch (error) {
      console.error('[DirectUpload] Error getting upload status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload video file directly to Cloudflare Stream
   */
  async uploadVideoFile(
    uploadURL: string,
    videoFile: {
      uri: string;
      type: string;
      name: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[DirectUpload] Starting video upload to:', uploadURL.substring(0, 50) + '...');

      const formData = new FormData();
      formData.append('file', {
        uri: videoFile.uri,
        type: videoFile.type,
        name: videoFile.name,
      } as any);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('[DirectUpload] Video upload completed successfully');
            resolve({ success: true });
          } else {
            console.error('[DirectUpload] Video upload failed:', xhr.status, xhr.responseText);
            resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
          }
        });

        xhr.addEventListener('error', () => {
          console.error('[DirectUpload] Video upload error');
          resolve({ success: false, error: 'Network error during upload' });
        });

        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('[DirectUpload] Error uploading video file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Complete upload workflow: create URL, register video, upload file
   */
  async completeUploadWorkflow(
    videoFile: {
      uri: string;
      type: string;
      name: string;
    },
    videoMetadata: {
      name: string;
      description?: string;
      categoryId?: number;
      createdBy: number;
      videoChannel: string;
      isShot: boolean;
    },
    userInfo: {
      userId: string;
      userName: string;
      channelId: string;
    },
    onProgress?: (stage: string, progress?: number) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> {
    try {
      console.log('[DirectUpload] Starting complete upload workflow');
      console.log('[DirectUpload] Video metadata:', videoMetadata);
      console.log('[DirectUpload] User info:', userInfo);

      // Step 1: Create upload URL
      onProgress?.('Creating upload URL...');
      console.log('[DirectUpload] Step 1: Creating upload URL...');

      const uploadResponse = videoMetadata.isShot
        ? await this.createTipShortsUploadUrl(userInfo)
        : await this.createTipTubeUploadUrl(userInfo);

      console.log('[DirectUpload] Upload URL creation response:', {
        success: uploadResponse.success,
        error: uploadResponse.error,
        hasData: !!uploadResponse.data
      });

      if (!uploadResponse.success) {
        console.error('[DirectUpload] Failed to create upload URL:', uploadResponse.error);
        return { success: false, error: uploadResponse.error };
      }

      const { uploadURL, videoId } = uploadResponse.data!;
      console.log('[DirectUpload] Upload URL and video ID obtained:', {
        videoId,
        uploadURL: uploadURL?.substring(0, 50) + '...'
      });

      // Step 2: Pre-register video
      onProgress?.('Registering video...');
      console.log('[DirectUpload] Step 2: Pre-registering video in database...');

      const registrationResponse = await this.preRegisterVideo({
        streamVideoId: videoId,
        ...videoMetadata,
      });

      console.log('[DirectUpload] Video registration response:', {
        success: registrationResponse.success,
        error: registrationResponse.error
      });

      if (!registrationResponse.success) {
        console.warn('[DirectUpload] Video registration failed, continuing with upload');
      }

      // Step 3: Upload video file
      onProgress?.('Uploading video...', 0);
      console.log('[DirectUpload] Step 3: Uploading video file to Cloudflare Stream...');

      const uploadResult = await this.uploadVideoFile(
        uploadURL,
        videoFile,
        (progress) => {
          console.log(`[DirectUpload] Upload progress: ${progress}%`);
          onProgress?.('Uploading video...', progress);
        }
      );

      console.log('[DirectUpload] Video file upload result:', {
        success: uploadResult.success,
        error: uploadResult.error
      });

      if (!uploadResult.success) {
        console.error('[DirectUpload] Failed to upload video file:', uploadResult.error);
        return { success: false, error: uploadResult.error };
      }

      onProgress?.('Upload complete!', 100);
      console.log('[DirectUpload] Complete upload workflow successful!', { videoId });
      return { success: true, videoId };

    } catch (error) {
      console.error('[DirectUpload] Error in complete upload workflow:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default DirectUploadService.getInstance();
