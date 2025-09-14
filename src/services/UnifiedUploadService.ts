// Unified Upload Service for Web Frontend
// Provides seamless switching between Cloudflare Stream and R2 uploads with fallback support
// Based on React Native mobile app implementation

import { uploadToR2 } from './r2UploadService';

export interface UnifiedUploadProgress {
  stage: string;
  percentage: number;
  method: 'stream' | 'r2';
  bytesUploaded?: number;
  totalBytes?: number;
  currentStep?: string;
}

export interface UnifiedUploadResult {
  success: boolean;
  method: 'stream' | 'r2';
  videoUrl?: string;
  thumbnailUrl?: string;
  streamVideoId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface VideoUploadData {
  videoFile: File;
  thumbnailFile?: File;
  metadata: {
    name: string;
    description?: string;
    categoryId?: number;
    channelId: number;
    userId: number;
    isShot: boolean;
    duration?: string;
    is_paid_promotional?: boolean;
    promotional_price?: number;
  };
}

export interface UploadConfig {
  useStreamUploads: boolean;
  streamUploadPercentage: number;
  preferStreamForTipShorts: boolean;
  preferStreamForTipTube: boolean;
  enableR2Fallback: boolean;
}

class UnifiedUploadService {
  private static instance: UnifiedUploadService;
  private config: UploadConfig = {
    useStreamUploads: true, // Re-enable Stream uploads
    streamUploadPercentage: 100, // 100% rollout for now
    preferStreamForTipShorts: true, // Use Stream for TipShorts
    preferStreamForTipTube: true, // Use Stream for TipTube
    enableR2Fallback: true,
  };

  constructor() {
    // Initialize service
  }

  static getInstance(): UnifiedUploadService {
    if (!UnifiedUploadService.instance) {
      UnifiedUploadService.instance = new UnifiedUploadService();
    }
    return UnifiedUploadService.instance;
  }

  /**
   * Get user information for uploads
   */
  private getUserInfo(): { userId: string; userName: string; channelId: string } | null {
    try {
      // Try multiple localStorage keys for user data
      const userDataStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (!userDataStr) return null;

      const userData = JSON.parse(userDataStr);
      return {
        userId: userData.id?.toString() || '',
        userName: userData.name || userData.username || '',
        channelId: userData.channelId?.toString() || userData.id?.toString() || '',
      };
    } catch (error) {
      console.error('[UnifiedUpload] Error getting user info:', error);
      return null;
    }
  }

  /**
   * Upload TipShorts video using the configured method
   */
  async uploadTipShorts(
    uploadData: VideoUploadData,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    const contentType = 'tipshorts';
    const method = this.getUploadMethod(contentType);

    console.log('[UnifiedUpload] TipShorts upload starting with config:', {
      useStreamUploads: this.config.useStreamUploads,
      streamUploadPercentage: this.config.streamUploadPercentage,
      preferStreamForTipShorts: this.config.preferStreamForTipShorts,
      enableR2Fallback: this.config.enableR2Fallback,
      selectedMethod: method
    });

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      console.log('[UnifiedUpload] Attempting Stream upload for TipShorts');
      const streamResult = await this.uploadWithStream(uploadData, onProgress);

      console.log('[UnifiedUpload] Stream upload result:', {
        success: streamResult.success,
        error: streamResult.error,
        method: streamResult.method
      });

      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && this.config.enableR2Fallback) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        console.log('[UnifiedUpload] Stream failure details:', streamResult.error);

        const r2Result = await this.uploadWithR2(uploadData, onProgress);
        console.log('[UnifiedUpload] R2 fallback result:', {
          success: r2Result.success,
          error: r2Result.error,
          method: r2Result.method
        });
        return { ...r2Result, fallbackUsed: true };
      }

      return streamResult;
    } else {
      console.log('[UnifiedUpload] Using R2 upload for TipShorts (method selected by config)');
      return await this.uploadWithR2(uploadData, onProgress);
    }
  }

  /**
   * Upload TipTube video using the configured method
   */
  async uploadTipTube(
    uploadData: VideoUploadData,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    const contentType = 'tiptube';
    const method = this.getUploadMethod(contentType);

    console.log('[UnifiedUpload] TipTube upload starting with config:', {
      useStreamUploads: this.config.useStreamUploads,
      streamUploadPercentage: this.config.streamUploadPercentage,
      preferStreamForTipTube: this.config.preferStreamForTipTube,
      enableR2Fallback: this.config.enableR2Fallback,
      selectedMethod: method
    });

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      console.log('[UnifiedUpload] Attempting Stream upload for TipTube');
      const streamResult = await this.uploadWithStream(uploadData, onProgress);

      console.log('[UnifiedUpload] Stream upload result:', {
        success: streamResult.success,
        error: streamResult.error,
        method: streamResult.method
      });

      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && this.config.enableR2Fallback) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        console.log('[UnifiedUpload] Stream failure details:', streamResult.error);

        const r2Result = await this.uploadWithR2(uploadData, onProgress);
        console.log('[UnifiedUpload] R2 fallback result:', {
          success: r2Result.success,
          error: r2Result.error,
          method: r2Result.method
        });
        return { ...r2Result, fallbackUsed: true };
      }

      return streamResult;
    } else {
      console.log('[UnifiedUpload] Using R2 upload for TipTube (method selected by config)');
      return await this.uploadWithR2(uploadData, onProgress);
    }
  }

  /**
   * Upload using Cloudflare Stream
   */
  private async uploadWithStream(
    uploadData: VideoUploadData,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      console.log('[UnifiedUpload] Starting Stream upload');
      
      const userInfo = this.getUserInfo();
      if (!userInfo) {
        console.error('[UnifiedUpload] No user info available for Stream upload');
        return { success: false, method: 'stream', error: 'User authentication required' };
      }

      onProgress?.({
        stage: 'Preparing video for Stream upload...',
        percentage: 10,
        method: 'stream',
        currentStep: 'Validating files'
      });

      // Upload video to R2 first to get URL
      console.log('[UnifiedUpload] Uploading video to R2...');
      const videoResult = await uploadToR2(
        uploadData.videoFile, 
        'videos', 
        uploadData.metadata.userId
      );
      if (!videoResult.success) {
        throw new Error(`Video upload failed: ${videoResult.error}`);
      }
      const videoUrl = videoResult.url;
      console.log('[UnifiedUpload] Video uploaded successfully:', videoUrl);

      // Upload thumbnail to R2 first to get URL
      let thumbnailUrl = '';
      if (uploadData.thumbnailFile) {
        console.log('[UnifiedUpload] Uploading thumbnail to R2...');
        const thumbnailResult = await uploadToR2(
          uploadData.thumbnailFile, 
          'thumbnails', 
          uploadData.metadata.userId
        );
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.url;
          console.log('[UnifiedUpload] Thumbnail uploaded successfully:', thumbnailUrl);
        } else {
          throw new Error(`Thumbnail upload failed: ${thumbnailResult.error}`);
        }
      } else {
        // Generate placeholder thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 320, 240);
          ctx.fillStyle = '#666';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Video Thumbnail', 160, 120);
        }
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
        const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
        
        const thumbnailResult = await uploadToR2(
          placeholderFile, 
          'thumbnails', 
          uploadData.metadata.userId
        );
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.url;
          console.log('[UnifiedUpload] Placeholder thumbnail uploaded:', thumbnailUrl);
        } else {
          throw new Error(`Placeholder thumbnail upload failed: ${thumbnailResult.error}`);
        }
      }

      // Create JSON payload for Stream upload (backend expects JSON, not FormData)
      const payload = {
        title: uploadData.metadata.name,
        contentType: uploadData.metadata.isShot ? 1 : 0, // 1=Short, 0=Video
        categoryId: uploadData.metadata.categoryId || 1,
        channelId: uploadData.metadata.channelId,
        videoLink: videoUrl,
        video_Thumbnail: thumbnailUrl,
        contentDescription: uploadData.metadata.description || '',
        duration: uploadData.metadata.duration || '00:01:30', // Use provided duration or default
        userId: uploadData.metadata.userId,
        is_paid_promotional: uploadData.metadata.is_paid_promotional || false,
        promotional_price: uploadData.metadata.promotional_price || null
      };

      onProgress?.({
        stage: 'Uploading to Cloudflare Stream...',
        percentage: 30,
        method: 'stream',
        currentStep: 'Uploading video file'
      });

      // Upload to Stream endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploadcontent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('UserLoggedIn')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UnifiedUpload] Stream upload failed:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 404) {
          return { 
            success: false, 
            method: 'stream', 
            error: `Backend API endpoint '/api/uploadcontent' not found. Please contact support to fix the backend server.` 
          };
        }
        
        return { 
          success: false, 
          method: 'stream', 
          error: `Stream upload failed: ${response.status} ${errorText}` 
        };
      }

      const result = await response.json();
      console.log('[UnifiedUpload] Stream upload successful:', result);

      onProgress?.({
        stage: 'Stream upload completed!',
        percentage: 100,
        method: 'stream',
        currentStep: 'Processing complete'
      });

      return {
        success: true,
        method: 'stream',
        streamVideoId: result.videoId || result.data?.videoId,
        videoUrl: videoUrl, // Use the actual R2 video URL
        thumbnailUrl: thumbnailUrl,
      };
    } catch (error) {
      console.error('[UnifiedUpload] Stream upload error:', error);
      return { 
        success: false, 
        method: 'stream', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Upload using Cloudflare R2 (fallback)
   */
  private async uploadWithR2(
    uploadData: VideoUploadData,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      console.log('[UnifiedUpload] Starting R2 upload');
      
      onProgress?.({
        stage: 'Preparing video for R2 upload...',
        percentage: 10,
        method: 'r2',
        currentStep: 'Validating files'
      });

      // Upload video to R2 first to get URL
      console.log('[UnifiedUpload] Uploading video to R2...');
      const videoResult = await uploadToR2(
        uploadData.videoFile, 
        'videos', 
        uploadData.metadata.userId
      );
      if (!videoResult.success) {
        throw new Error(`Video upload failed: ${videoResult.error}`);
      }
      const videoUrl = videoResult.url;
      console.log('[UnifiedUpload] Video uploaded successfully:', videoUrl);

      // Upload thumbnail to R2 first to get URL
      let thumbnailUrl = '';
      if (uploadData.thumbnailFile) {
        console.log('[UnifiedUpload] Uploading thumbnail to R2...');
        const thumbnailResult = await uploadToR2(
          uploadData.thumbnailFile, 
          'thumbnails', 
          uploadData.metadata.userId
        );
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.url;
          console.log('[UnifiedUpload] Thumbnail uploaded successfully:', thumbnailUrl);
        } else {
          throw new Error(`Thumbnail upload failed: ${thumbnailResult.error}`);
        }
      } else {
        // Generate placeholder thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 320, 240);
          ctx.fillStyle = '#666';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Video Thumbnail', 160, 120);
        }
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
        const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
        
        const thumbnailResult = await uploadToR2(
          placeholderFile, 
          'thumbnails', 
          uploadData.metadata.userId
        );
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.url;
          console.log('[UnifiedUpload] Placeholder thumbnail uploaded:', thumbnailUrl);
        } else {
          throw new Error(`Placeholder thumbnail upload failed: ${thumbnailResult.error}`);
        }
      }

      // Create JSON payload for R2 upload (backend expects JSON, not FormData)
      const payload = {
        title: uploadData.metadata.name,
        contentType: uploadData.metadata.isShot ? 1 : 0, // 1=Short, 0=Video
        categoryId: uploadData.metadata.categoryId || 1,
        channelId: uploadData.metadata.channelId,
        videoLink: videoUrl,
        video_Thumbnail: thumbnailUrl,
        contentDescription: uploadData.metadata.description || '',
        duration: uploadData.metadata.duration || '00:01:30', // Use provided duration or default
        userId: uploadData.metadata.userId,
        is_paid_promotional: uploadData.metadata.is_paid_promotional || false,
        promotional_price: uploadData.metadata.promotional_price || null
      };
      
      // Debug: Log payload contents
      console.log('[UnifiedUpload] JSON payload:', payload);

      onProgress?.({
        stage: 'Uploading to Cloudflare R2...',
        percentage: 30,
        method: 'r2',
        currentStep: 'Uploading video file'
      });

      // Upload to R2 endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploadcontent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('UserLoggedIn')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UnifiedUpload] R2 upload failed:', response.status, errorText);
        return { 
          success: false, 
          method: 'r2', 
          error: `R2 upload failed: ${response.status} ${errorText}` 
        };
      }

      const result = await response.json();
      console.log('[UnifiedUpload] R2 upload successful:', result);

      onProgress?.({
        stage: 'R2 upload completed!',
        percentage: 100,
        method: 'r2',
        currentStep: 'Processing complete'
      });

      return {
        success: true,
        method: 'r2',
        videoUrl: videoUrl, // Use the actual R2 video URL
        thumbnailUrl: thumbnailUrl,
      };
    } catch (error) {
      console.error('[UnifiedUpload] R2 upload error:', error);
      return { 
        success: false, 
        method: 'r2', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Determine upload method based on configuration
   */
  private getUploadMethod(contentType: 'tipshorts' | 'tiptube'): 'stream' | 'r2' {
    if (!this.config.useStreamUploads) {
      return 'r2';
    }

    // Check if we should use Stream based on percentage rollout
    const random = Math.random() * 100;
    if (random > this.config.streamUploadPercentage) {
      return 'r2';
    }

    // Check content type preferences
    if (contentType === 'tipshorts' && !this.config.preferStreamForTipShorts) {
      return 'r2';
    }
    if (contentType === 'tiptube' && !this.config.preferStreamForTipTube) {
      return 'r2';
    }

    return 'stream';
  }

  /**
   * Update upload configuration
   */
  updateConfig(newConfig: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[UnifiedUpload] Config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): UploadConfig {
    return { ...this.config };
  }
}

export default UnifiedUploadService.getInstance();
