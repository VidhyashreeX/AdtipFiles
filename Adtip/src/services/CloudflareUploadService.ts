// src/services/CloudflareUploadService.ts
// Cloudflare R2 Upload Service using AWS S3 SDK v3
// Following Cloudflare R2 best practices: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { 
  CLOUDFLARE_R2_CONFIG, 
  UPLOAD_FOLDERS, 
  FILE_SIZE_LIMITS, 
  SUPPORTED_FORMATS,
  PRESIGNED_URL_EXPIRY 
} from '../config/cloudflareConfig';

// Upload interfaces
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  contentType: string;
  error?: string;
}

export interface BatchUploadResult {
  video?: UploadResult;
  thumbnail?: UploadResult;
  errors: string[];
  allSuccessful: boolean;
}

export interface PresignedUrlInfo {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

class CloudflareUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Initialize S3 client for Cloudflare R2
    this.s3Client = new S3Client({
      region: CLOUDFLARE_R2_CONFIG.region,
      endpoint: `https://${CLOUDFLARE_R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: CLOUDFLARE_R2_CONFIG.accessKeyId,
        secretAccessKey: CLOUDFLARE_R2_CONFIG.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2 compatibility
    });

    this.bucketName = CLOUDFLARE_R2_CONFIG.bucketName;
  }

  /**
   * Validate file before upload
   */
  private validateFile(filePath: string, maxSize: number, allowedFormats: readonly string[]): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if file exists
        const exists = await RNFS.exists(filePath);
        if (!exists) {
          reject(new Error('File does not exist'));
          return;
        }

        // Get file info
        const fileInfo = await RNFS.stat(filePath);
        
        // Check file size
        if (fileInfo.size > maxSize) {
          reject(new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`));
          return;
        }

        // Check file format
        const extension = filePath.split('.').pop()?.toLowerCase();
        if (!extension || !allowedFormats.includes(extension)) {
          reject(new Error(`Unsupported file format. Allowed: ${allowedFormats.join(', ')}`));
          return;
        }

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate unique file key for R2 storage
   */
  private generateFileKey(folder: string, originalName: string, userId?: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase();
    const userPrefix = userId ? `user_${userId}` : 'anonymous';
    
    return `${folder}/${userPrefix}/${timestamp}_${random}.${extension}`;
  }

  /**
   * Get content type from file extension
   */
  private getContentType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const contentTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return contentTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Read file as buffer for upload
   */
  private async readFileAsBuffer(filePath: string): Promise<Buffer> {
    try {
      // For React Native, we need to handle file URIs properly
      let normalizedPath = filePath;
      
      if (Platform.OS === 'android' && !filePath.startsWith('file://')) {
        normalizedPath = `file://${filePath}`;
      }

      // Read file as base64 first, then convert to buffer
      const base64Data = await RNFS.readFile(normalizedPath, 'base64');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('[CloudflareUpload] Error reading file:', error);
      throw new Error('Failed to read file for upload');
    }
  }

  /**
   * Upload single file to Cloudflare R2
   */
  async uploadFile(
    filePath: string,
    folder: string,
    fileName?: string,
    userId?: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('[CloudflareUpload] Starting upload:', filePath);

      // Determine file type and validation rules
      const isVideo = folder.includes('video') || folder.includes('short') || folder.includes('tiptube');
      const maxSize = isVideo ? FILE_SIZE_LIMITS.VIDEO_MAX : FILE_SIZE_LIMITS.THUMBNAIL_MAX;
      const allowedFormats = isVideo ? SUPPORTED_FORMATS.VIDEO : SUPPORTED_FORMATS.IMAGE;

      // Validate file
      await this.validateFile(filePath, maxSize, allowedFormats);

      // Get file info
      const fileInfo = await RNFS.stat(filePath);
      const originalName = fileName || filePath.split('/').pop() || 'unknown';
      
      // Generate unique key
      const key = this.generateFileKey(folder, originalName, userId);
      
      // Get content type
      const contentType = this.getContentType(filePath);

      // Read file as buffer
      const fileBuffer = await this.readFileAsBuffer(filePath);

      // Simulate progress if callback provided
      if (onProgress) {
        onProgress({ loaded: 0, total: fileInfo.size, percentage: 0 });
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          originalName: originalName,
          uploadedBy: userId?.toString() || 'anonymous',
          uploadedAt: new Date().toISOString(),
        },
      });

      const response = await this.s3Client.send(command);

      // Simulate progress completion
      if (onProgress) {
        onProgress({ loaded: fileInfo.size, total: fileInfo.size, percentage: 100 });
      }

      // Generate public URL
      const publicUrl = `${CLOUDFLARE_R2_CONFIG.publicUrl}/${key}`;

      console.log('[CloudflareUpload] Upload successful:', {
        key,
        size: fileInfo.size,
        contentType,
        url: publicUrl
      });

      return {
        success: true,
        url: publicUrl,
        key,
        size: fileInfo.size,
        contentType,
      };

    } catch (error: any) {
      console.error('[CloudflareUpload] Upload failed:', error);
      return {
        success: false,
        url: '',
        key: '',
        size: 0,
        contentType: '',
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload video for TipShorts
   */
  async uploadTipShort(
    videoPath: string,
    thumbnailPath: string,
    userId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<BatchUploadResult> {
    const errors: string[] = [];
    let videoResult: UploadResult | undefined;
    let thumbnailResult: UploadResult | undefined;

    try {
      console.log('[CloudflareUpload] Starting TipShorts batch upload');

      // Upload video
      if (onProgress) onProgress({ loaded: 0, total: 100, percentage: 0 });
      
      videoResult = await this.uploadFile(
        videoPath,
        `${UPLOAD_FOLDERS.SHORTS}/${UPLOAD_FOLDERS.VIDEOS}`,
        `short_${Date.now()}.mp4`,
        userId,
        (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: progress.percentage * 0.7, // 70% for video
            });
          }
        }
      );

      if (!videoResult.success) {
        errors.push(`Video upload failed: ${videoResult.error}`);
      }

      // Upload thumbnail
      thumbnailResult = await this.uploadFile(
        thumbnailPath,
        `${UPLOAD_FOLDERS.SHORTS}/${UPLOAD_FOLDERS.THUMBNAILS}`,
        `short_thumbnail_${Date.now()}.jpg`,
        userId,
        (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: 70 + (progress.percentage * 0.3), // 30% for thumbnail
            });
          }
        }
      );

      if (!thumbnailResult.success) {
        errors.push(`Thumbnail upload failed: ${thumbnailResult.error}`);
      }

    } catch (error: any) {
      errors.push(`Batch upload error: ${error.message}`);
    }

    return {
      video: videoResult,
      thumbnail: thumbnailResult,
      errors,
      allSuccessful: errors.length === 0 && (videoResult?.success === true) && (thumbnailResult?.success === true),
    };
  }

  /**
   * Upload video for TipTube
   */
  async uploadTipTube(
    videoPath: string,
    thumbnailPath: string,
    userId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<BatchUploadResult> {
    const errors: string[] = [];
    let videoResult: UploadResult | undefined;
    let thumbnailResult: UploadResult | undefined;

    try {
      console.log('[CloudflareUpload] Starting TipTube batch upload');

      // Upload video
      if (onProgress) onProgress({ loaded: 0, total: 100, percentage: 0 });
      
      videoResult = await this.uploadFile(
        videoPath,
        `${UPLOAD_FOLDERS.TIPTUBE}/${UPLOAD_FOLDERS.VIDEOS}`,
        `video_${Date.now()}.mp4`,
        userId,
        (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: progress.percentage * 0.7, // 70% for video
            });
          }
        }
      );

      if (!videoResult.success) {
        errors.push(`Video upload failed: ${videoResult.error}`);
      }

      // Upload thumbnail
      thumbnailResult = await this.uploadFile(
        thumbnailPath,
        `${UPLOAD_FOLDERS.TIPTUBE}/${UPLOAD_FOLDERS.THUMBNAILS}`,
        `video_thumbnail_${Date.now()}.jpg`,
        userId,
        (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: 70 + (progress.percentage * 0.3), // 30% for thumbnail
            });
          }
        }
      );

      if (!thumbnailResult.success) {
        errors.push(`Thumbnail upload failed: ${thumbnailResult.error}`);
      }

    } catch (error: any) {
      errors.push(`Batch upload error: ${error.message}`);
    }

    return {
      video: videoResult,
      thumbnail: thumbnailResult,
      errors,
      allSuccessful: errors.length === 0 && (videoResult?.success === true) && (thumbnailResult?.success === true),
    };
  }

  /**
   * Generate presigned URL for client-side upload
   */
  async generatePresignedUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
    userId?: number,
    expiresIn: number = PRESIGNED_URL_EXPIRY
  ): Promise<PresignedUrlInfo> {
    try {
      const key = this.generateFileKey(folder, fileName, userId);

      // Generate presigned URL for PUT operation
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, putCommand, { expiresIn });

      // Generate public download URL
      const downloadUrl = `${CLOUDFLARE_R2_CONFIG.publicUrl}/${key}`;

      return {
        uploadUrl,
        downloadUrl,
        key,
        expiresIn,
      };

    } catch (error: any) {
      console.error('[CloudflareUpload] Presigned URL generation failed:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Get presigned download URL for existing file
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = PRESIGNED_URL_EXPIRY
  ): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, getCommand, { expiresIn });

    } catch (error: any) {
      console.error('[CloudflareUpload] Presigned download URL generation failed:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log('[CloudflareUpload] File deleted successfully:', key);
      return true;

    } catch (error: any) {
      console.error('[CloudflareUpload] File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get upload configuration for client
   */
  getUploadConfig() {
    return {
      bucketName: this.bucketName,
      folders: UPLOAD_FOLDERS,
      limits: FILE_SIZE_LIMITS,
      supportedFormats: SUPPORTED_FORMATS,
      maxRetries: 3,
      timeout: 300000, // 5 minutes
    };
  }

  /**
   * Test connection to Cloudflare R2
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list buckets (this will validate our credentials)
      await this.s3Client.send(new ListBucketsCommand({}));

      console.log('[CloudflareUpload] Connection test successful');
      return true;

    } catch (error: any) {
      console.error('[CloudflareUpload] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new CloudflareUploadService();
