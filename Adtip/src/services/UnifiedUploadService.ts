// adtip-reactnative/Adtip/src/services/UnifiedUploadService.ts
// Unified service that handles both Cloudflare Stream and R2 uploads
// Provides seamless switching between upload methods with fallback support

import { UploadConfigManager, ContentType, UploadMethod } from '../config/UploadConfig';
import CloudflareUploadService from './CloudflareUploadService';
import DirectUploadService from './DirectUploadService';
import ApiService from './ApiService';
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
    userInfo?: { userId: string; userName: string; channelId: string },
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    const contentType: ContentType = 'tipshorts';
    const config = UploadConfigManager.getConfig();
    const method = UploadConfigManager.getUploadMethod(contentType);

    console.log('[UnifiedUpload] TipShorts upload starting with config:', {
      useStreamUploads: config.useStreamUploads,
      streamUploadPercentage: config.streamUploadPercentage,
      preferStreamForTipShorts: config.preferStreamForTipShorts,
      enableR2Fallback: config.enableR2Fallback,
      selectedMethod: method
    });

    UploadConfigManager.logUploadDecision(
      contentType,
      method,
      `Config: ${config.streamUploadPercentage}% rollout`
    );

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      console.log('[UnifiedUpload] Attempting Stream upload for TipShorts');
      const streamResult = await this.uploadWithStream(uploadData, userInfo, onProgress);

      console.log('[UnifiedUpload] Stream upload result:', {
        success: streamResult.success,
        error: streamResult.error,
        method: streamResult.method
      });

      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && UploadConfigManager.shouldUseR2Fallback()) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        console.log('[UnifiedUpload] Stream failure details:', streamResult.error);
        UploadConfigManager.logUploadDecision(contentType, 'r2', 'Stream fallback');

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
    userInfo?: { userId: string; userName: string; channelId: string },
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    const contentType: ContentType = 'tiptube';
    const config = UploadConfigManager.getConfig();
    const method = UploadConfigManager.getUploadMethod(contentType);

    console.log('[UnifiedUpload] TipTube upload starting with config:', {
      useStreamUploads: config.useStreamUploads,
      streamUploadPercentage: config.streamUploadPercentage,
      preferStreamForTipTube: config.preferStreamForTipTube,
      enableR2Fallback: config.enableR2Fallback,
      selectedMethod: method
    });

    UploadConfigManager.logUploadDecision(
      contentType,
      method,
      `Config: ${config.streamUploadPercentage}% rollout`
    );

    onProgress?.({
      stage: 'Determining upload method...',
      percentage: 0,
      method,
    });

    if (method === 'stream') {
      console.log('[UnifiedUpload] Attempting Stream upload for TipTube');
      const streamResult = await this.uploadWithStream(uploadData, userInfo, onProgress);

      console.log('[UnifiedUpload] Stream upload result:', {
        success: streamResult.success,
        error: streamResult.error,
        method: streamResult.method
      });

      // If Stream fails and fallback is enabled, try R2
      if (!streamResult.success && UploadConfigManager.shouldUseR2Fallback()) {
        console.log('[UnifiedUpload] Stream upload failed, falling back to R2');
        console.log('[UnifiedUpload] Stream failure details:', streamResult.error);
        UploadConfigManager.logUploadDecision(contentType, 'r2', 'Stream fallback');

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

      const userInfo = { userId: userId.toString(), userName: '', channelId: userId.toString() };
      const streamResult = await this.uploadWithStream(uploadData, userInfo, onProgress);
      
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
    userInfo?: { userId: string; userName: string; channelId: string },
    onProgress?: (progress: UnifiedUploadProgress) => void
  ): Promise<UnifiedUploadResult> {
    try {
      console.log('[UnifiedUpload] Starting Stream upload');
      console.log('[UnifiedUpload] Upload data:', {
        videoUri: uploadData.videoUri?.substring(0, 50) + '...',
        thumbnailUri: uploadData.thumbnailUri?.substring(0, 50) + '...',
        metadata: uploadData.metadata
      });

      console.log('[UnifiedUpload] User info provided:', userInfo);

      if (!userInfo) {
        console.error('[UnifiedUpload] No user info provided for Stream upload');
        return { success: false, method: 'stream', error: 'User authentication required' };
      }

      const videoFile = {
        uri: uploadData.videoUri,
        type: 'video/mp4',
        name: `${uploadData.metadata.name.replace(/\s+/g, '_')}_${Date.now()}.mp4`,
      };

      console.log('[UnifiedUpload] Video file prepared:', {
        uri: videoFile.uri?.substring(0, 50) + '...',
        type: videoFile.type,
        name: videoFile.name
      });

      console.log('[UnifiedUpload] Starting DirectUploadService.completeUploadWorkflow...');

      // Test authentication with ApiService first
      try {
        console.log('[UnifiedUpload] Testing authentication with ApiService...');
        const testResponse = await ApiService.post('/api/direct-upload/tiptube', userInfo);
        console.log('[UnifiedUpload] ApiService auth test result:', testResponse);
      } catch (authTestError) {
        console.error('[UnifiedUpload] ApiService auth test failed:', authTestError);
      }

      // Transform metadata to match DirectUploadService expectations
      const transformedMetadata = {
        name: uploadData.metadata.name,
        description: uploadData.metadata.description,
        categoryId: uploadData.metadata.categoryId,
        createdBy: parseInt(userInfo.userId),
        videoChannel: userInfo.channelId,
        isShot: uploadData.metadata.isShot,
      };

      console.log('[UnifiedUpload] Transformed metadata:', transformedMetadata);

      const result = await DirectUploadService.completeUploadWorkflow(
        videoFile,
        transformedMetadata,
        userInfo,
        (stage, progress) => {
          console.log(`[UnifiedUpload] Stream upload progress: ${stage} - ${progress}%`);
          onProgress?.({
            stage,
            percentage: progress || 0,
            method: 'stream',
          });
        }
      );

      console.log('[UnifiedUpload] DirectUploadService.completeUploadWorkflow completed:', {
        success: result.success,
        videoId: result.videoId,
        error: result.error
      });

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
      if (error instanceof Error) {
        console.error('[UnifiedUpload] Error stack:', error.stack);
        return { success: false, method: 'stream', error: error.message };
      }
      return { success: false, method: 'stream', error: 'Unknown error occurred' };
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
      return { success: false, method: 'r2', error: error instanceof Error ? error.message : 'Unknown error' };
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
      return { success: false, method: 'r2', error: error instanceof Error ? error.message : 'Unknown error' };
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
      return { success: false, method: 'r2', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default UnifiedUploadService.getInstance();
