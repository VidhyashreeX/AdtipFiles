// adtip-reactnative/Adtip/src/services/UnifiedUploadService.ts
// Unified service that handles both Cloudflare Stream and R2 uploads
// Provides seamless switching between upload methods with fallback support

import { UploadConfigManager, ContentType, UploadMethod } from '../config/UploadConfig';
import CloudflareUploadService from './CloudflareUploadService';
import DirectUploadService from './DirectUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UnifiedUploadProgress {
  stage: string;
  percentage: number;
  method: UploadMethod;
  bytesUploaded?: number;
  totalBytes?: number;
}

export interface UnifiedUploadResult {
  success: boolean;
  method: UploadMethod;
  videoUrl?: string;
  thumbnailUrl?: string;
  streamVideoId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface VideoUploadData {
  videoUri: string;
  thumbnailUri: string;
  metadata: {
    name: string;
    description?: string;
    categoryId?: number;
    channelId: number;
    userId: number;
    isShot: boolean;
  };
}

class UnifiedUploadService {
  private static instance: UnifiedUploadService;

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
  private async getUserInfo(): Promise<{ userId: string; userName: string; channelId: string } | null> {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
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
    const contentType: ContentType = 'tipshorts';
    const method = UploadConfigManager.getUploadMethod(contentType);
    
    UploadConfigManager.logUploadDecision(
      contentType, 
      method, 
      `Config: ${UploadConfigManager.getConfig().streamUploadPercentage}% rollout`
    );

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      const streamResult = await this.uploadWithStream(uploadData, onProgress);
      
      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && UploadConfigManager.shouldUseR2Fallback()) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        UploadConfigManager.logUploadDecision(contentType, 'r2', 'Stream fallback');
        
        const r2Result = await this.uploadWithR2(uploadData, onProgress);
        return { ...r2Result, fallbackUsed: true };
      }
      
      return streamResult;
    } else {
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
    const contentType: ContentType = 'tiptube';
    const method = UploadConfigManager.getUploadMethod(contentType);
    
    UploadConfigManager.logUploadDecision(
      contentType, 
      method, 
      `Config: ${UploadConfigManager.getConfig().streamUploadPercentage}% rollout`
    );

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      const streamResult = await this.uploadWithStream(uploadData, onProgress);
      
      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && UploadConfigManager.shouldUseR2Fallback()) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        UploadConfigManager.logUploadDecision(contentType, 'r2', 'Stream fallback');
        
        const r2Result = await this.uploadWithR2(uploadData, onProgress);
        return { ...r2Result, fallbackUsed: true };
      }
      
      return streamResult;
    } else {
      return await this.uploadWithR2(uploadData, onProgress);
    }
  }

  /**
   * Upload campaign media using the configured method
   */
  async uploadCampaignMedia(
    mediaUri: string,
    mediaType: 'video' | 'image',
    userId: number,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    // For campaigns, only use Stream for videos
    if (mediaType === 'image') {
      return await this.uploadImageWithR2(mediaUri, userId, onProgress);
    }

    const contentType: ContentType = 'campaign';
    const method = UploadConfigManager.getUploadMethod(contentType);
    
    UploadConfigManager.logUploadDecision(
      contentType, 
      method, 
      `Config: ${UploadConfigManager.getConfig().streamUploadPercentage}% rollout`
    );

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      // For campaign videos, create minimal upload data
      const uploadData: VideoUploadData = {
        videoUri: mediaUri,
        thumbnailUri: '', // Will be generated by Stream
        metadata: {
          name: `Campaign Video ${Date.now()}`,
          description: 'Campaign promotional video',
          userId,
          channelId: userId, // Use userId as channelId for campaigns
          isShot: false, // Campaign videos are typically longer
        },
      };

      const streamResult = await this.uploadWithStream(uploadData, onProgress);
      
      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && UploadConfigManager.shouldUseR2Fallback()) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        UploadConfigManager.logUploadDecision(contentType, 'r2', 'Stream fallback');
        
        return await this.uploadVideoWithR2(mediaUri, userId, onProgress);
      }
      
      return streamResult;
    } else {
      return await this.uploadVideoWithR2(mediaUri, userId, onProgress);
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
      
      const userInfo = await this.getUserInfo();
      if (!userInfo) {
        return { success: false, method: 'stream', error: 'User authentication required' };
      }

      const videoFile = {
        uri: uploadData.videoUri,
        type: 'video/mp4',
        name: `${uploadData.metadata.name.replace(/\s+/g, '_')}_${Date.now()}.mp4`,
      };

      const result = await DirectUploadService.completeUploadWorkflow(
        videoFile,
        uploadData.metadata,
        userInfo,
        (stage, progress) => {
          onProgress?.({
            stage,
            percentage: progress || 0,
            method: 'stream',
          });
        }
      );

      if (result.success) {
        console.log('[UnifiedUpload] Stream upload successful:', result.videoId);
        return {
          success: true,
          method: 'stream',
          streamVideoId: result.videoId,
          // Stream URLs will be available after encoding via webhook
          videoUrl: `stream://${result.videoId}`, // Placeholder for hybrid player
          thumbnailUrl: uploadData.thumbnailUri, // Use original thumbnail for now
        };
      } else {
        console.error('[UnifiedUpload] Stream upload failed with error:', result.error);
        console.error('[UnifiedUpload] Full Stream upload result:', result);
        return { success: false, method: 'stream', error: result.error };
      }
    } catch (error) {
      console.error('[UnifiedUpload] Stream upload error:', error);
      return { success: false, method: 'stream', error: error.message };
    }
  }

  /**
   * Upload using Cloudflare R2
   */
  private async uploadWithR2(
    uploadData: VideoUploadData,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      console.log('[UnifiedUpload] Starting R2 upload');
      
      onProgress?.({
        stage: 'Uploading to R2...',
        percentage: 0,
        method: 'r2',
      });

      const uploadMethod = uploadData.metadata.isShot 
        ? CloudflareUploadService.uploadTipShort
        : CloudflareUploadService.uploadTipTube;

      const result = await uploadMethod.call(
        CloudflareUploadService,
        uploadData.videoUri,
        uploadData.thumbnailUri,
        uploadData.metadata.userId,
        (progress) => {
          onProgress?.({
            stage: 'Uploading to R2...',
            percentage: progress.percentage,
            method: 'r2',
            bytesUploaded: progress.bytesUploaded,
            totalBytes: progress.totalBytes,
          });
        }
      );

      if (result.allSuccessful && result.video?.url && result.thumbnail?.url) {
        console.log('[UnifiedUpload] R2 upload successful');
        return {
          success: true,
          method: 'r2',
          videoUrl: result.video.url,
          thumbnailUrl: result.thumbnail.url,
        };
      } else {
        const error = result.errors?.join(', ') || 'R2 upload failed';
        console.error('[UnifiedUpload] R2 upload failed:', error);
        return { success: false, method: 'r2', error };
      }
    } catch (error) {
      console.error('[UnifiedUpload] R2 upload error:', error);
      return { success: false, method: 'r2', error: error.message };
    }
  }

  /**
   * Upload video file with R2 (for campaigns)
   */
  private async uploadVideoWithR2(
    videoUri: string,
    userId: number,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      const result = await CloudflareUploadService.uploadFile(
        videoUri,
        'videos',
        `campaign_${Date.now()}.mp4`,
        userId,
        (progress) => {
          onProgress?.({
            stage: 'Uploading video to R2...',
            percentage: progress.percentage,
            method: 'r2',
          });
        }
      );

      if (result.success && result.url) {
        return {
          success: true,
          method: 'r2',
          videoUrl: result.url,
        };
      } else {
        return { success: false, method: 'r2', error: result.error };
      }
    } catch (error) {
      return { success: false, method: 'r2', error: error.message };
    }
  }

  /**
   * Upload image file with R2 (for campaigns)
   */
  private async uploadImageWithR2(
    imageUri: string,
    userId: number,
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      const result = await CloudflareUploadService.uploadFile(
        imageUri,
        'images',
        `campaign_${Date.now()}.jpg`,
        userId,
        (progress) => {
          onProgress?.({
            stage: 'Uploading image to R2...',
            percentage: progress.percentage,
            method: 'r2',
          });
        }
      );

      if (result.success && result.url) {
        return {
          success: true,
          method: 'r2',
          videoUrl: result.url, // For consistency, use videoUrl field
        };
      } else {
        return { success: false, method: 'r2', error: result.error };
      }
    } catch (error) {
      return { success: false, method: 'r2', error: error.message };
    }
  }
}

export default UnifiedUploadService.getInstance();
