// src/services/CloudflareUploadService.ts
// Cloudflare R2 Upload Service using AWS S3 SDK v3
// Following Cloudflare R2 best practices: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/

import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

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

export interface CachedPresignedUrl {
  url: string;
  expiresAt: number;
}

class CloudflareUploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private static presignedUrlCache: Map<string, CachedPresignedUrl> = new Map();

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
        if (!extension || !(allowedFormats as readonly string[]).includes(extension)) {
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
    
    // Simple flat structure - no user folders
    return `${folder}/${timestamp}_${random}.${extension}`;
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
   * Read file as Uint8Array for upload (React Native compatible)
   */
  private async readFileAsUint8Array(filePath: string): Promise<Uint8Array> {
    try {
      // For React Native, we need to handle file URIs properly
      let normalizedPath = filePath;
      
      if (Platform.OS === 'android' && !filePath.startsWith('file://')) {
        normalizedPath = `file://${filePath}`;
      }

      // Read file as base64 first, then convert to Uint8Array
      const base64Data = await RNFS.readFile(normalizedPath, 'base64');
      
      // Convert base64 to Uint8Array (React Native compatible)
      // Use global atob if available, otherwise use a polyfill
      let binaryString: string;
      if (typeof atob !== 'undefined') {
        binaryString = atob(base64Data);
      } else {
        // Simple base64 decode polyfill for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = base64Data.replace(/[^A-Za-z0-9+/]/g, '');
        let output = '';
        
        for (let i = 0; i < str.length; i += 4) {
          const encoded1 = chars.indexOf(str.charAt(i));
          const encoded2 = chars.indexOf(str.charAt(i + 1));
          const encoded3 = chars.indexOf(str.charAt(i + 2));
          const encoded4 = chars.indexOf(str.charAt(i + 3));
          
          const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
          
          output += String.fromCharCode((bitmap >> 16) & 255);
          if (encoded3 !== 64) output += String.fromCharCode((bitmap >> 8) & 255);
          if (encoded4 !== 64) output += String.fromCharCode(bitmap & 255);
        }
        binaryString = output;
      }
      
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes;
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

      // Determine file type and validation rules based on file extension
      const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
      const isVideo = (SUPPORTED_FORMATS.VIDEO as readonly string[]).includes(fileExtension);
      const isImage = (SUPPORTED_FORMATS.IMAGE as readonly string[]).includes(fileExtension);
      
      let maxSize: number;
      let allowedFormats: readonly string[];
      
      if (isVideo) {
        maxSize = folder.includes('short') ? FILE_SIZE_LIMITS.SHORT_MAX : FILE_SIZE_LIMITS.VIDEO_MAX;
        allowedFormats = SUPPORTED_FORMATS.VIDEO;
      } else if (isImage) {
        maxSize = FILE_SIZE_LIMITS.THUMBNAIL_MAX;
        allowedFormats = SUPPORTED_FORMATS.IMAGE;
      } else {
        // Default to video validation if we can't determine
        maxSize = FILE_SIZE_LIMITS.VIDEO_MAX;
        allowedFormats = [...SUPPORTED_FORMATS.VIDEO, ...SUPPORTED_FORMATS.IMAGE];
      }

      // Validate file
      await this.validateFile(filePath, maxSize, allowedFormats);

      // Get file info
      const fileInfo = await RNFS.stat(filePath);
      const originalName = fileName || filePath.split('/').pop() || 'unknown';
      
      // Generate unique key
      const key = this.generateFileKey(folder, originalName, userId);
      
      // Get content type
      const contentType = this.getContentType(filePath);

      // Read file as Uint8Array
      const fileData = await this.readFileAsUint8Array(filePath);

      // Simulate progress if callback provided
      if (onProgress) {
        onProgress({ loaded: 0, total: fileInfo.size, percentage: 0 });
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileData,
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

      // Enhanced error handling with specific error types
      let errorMessage = 'Upload failed';

      if (error.code === 'NetworkingError') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.code === 'CredentialsError') {
        errorMessage = 'Authentication failed. Please contact support.';
      } else if (error.code === 'NoSuchBucket') {
        errorMessage = 'Storage configuration error. Please contact support.';
      } else if (error.code === 'AccessDenied') {
        errorMessage = 'Access denied. Please contact support.';
      } else if (error.code === 'EntityTooLarge') {
        errorMessage = 'File size too large. Please compress your video and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout. Please check your connection and try again.';
      } else if (error.message?.includes('ENOENT')) {
        errorMessage = 'File not found. Please select the file again.';
      } else if (error.message?.includes('EACCES')) {
        errorMessage = 'Permission denied. Please check file permissions.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        url: '',
        key: '',
        size: 0,
        contentType: '',
        error: errorMessage,
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
      console.log('[CloudflareUpload] Starting TipShorts batch upload', {
        videoPath,
        thumbnailPath,
        userId
      });

      // Upload video directly to /videos folder
      if (onProgress) onProgress({ loaded: 0, total: 100, percentage: 0 });
      
      console.log('[CloudflareUpload] Uploading TipShorts video to /videos...');
      videoResult = await this.uploadFile(
        videoPath,
        'videos', // Direct to videos folder
        `tipshort_${Date.now()}.mp4`,
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
        console.error('[CloudflareUpload] TipShorts video upload failed:', videoResult.error);
        errors.push(`Video upload failed: ${videoResult.error}`);
      } else {
        console.log('[CloudflareUpload] TipShorts video upload successful:', videoResult.url);
      }

      // Upload thumbnail directly to /images folder
      console.log('[CloudflareUpload] Uploading TipShorts thumbnail to /images...');
      thumbnailResult = await this.uploadFile(
        thumbnailPath,
        'images', // Direct to images folder
        `tipshort_thumb_${Date.now()}.jpg`,
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
        console.error('[CloudflareUpload] TipShorts thumbnail upload failed:', thumbnailResult.error);
        errors.push(`Thumbnail upload failed: ${thumbnailResult.error}`);
      } else {
        console.log('[CloudflareUpload] TipShorts thumbnail upload successful:', thumbnailResult.url);
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
      console.log('[CloudflareUpload] Starting TipTube batch upload', {
        videoPath,
        thumbnailPath,
        userId
      });

      // Upload video directly to /videos folder
      if (onProgress) onProgress({ loaded: 0, total: 100, percentage: 0 });
      
      console.log('[CloudflareUpload] Uploading TipTube video to /videos...');
      videoResult = await this.uploadFile(
        videoPath,
        'videos', // Direct to videos folder
        `tiptube_${Date.now()}.mp4`,
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
        console.error('[CloudflareUpload] TipTube video upload failed:', videoResult.error);
        errors.push(`Video upload failed: ${videoResult.error}`);
      } else {
        console.log('[CloudflareUpload] TipTube video upload successful:', videoResult.url);
      }

      // Upload thumbnail directly to /images folder
      console.log('[CloudflareUpload] Uploading TipTube thumbnail to /images...');
      thumbnailResult = await this.uploadFile(
        thumbnailPath,
        'images', // Direct to images folder
        `tiptube_thumb_${Date.now()}.jpg`,
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
        console.error('[CloudflareUpload] TipTube thumbnail upload failed:', thumbnailResult.error);
        errors.push(`Thumbnail upload failed: ${thumbnailResult.error}`);
      } else {
        console.log('[CloudflareUpload] TipTube thumbnail upload successful:', thumbnailResult.url);
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
   * Extract object key from Cloudflare public URL
   */
  static extractKeyFromUrl(cloudflareUrl: string): string | null {
    try {
      const url = new URL(cloudflareUrl);

      // Check if this is a Cloudflare R2 URL
      if (!url.hostname.includes('r2.cloudflarestorage.com') &&
          !url.hostname.includes(CLOUDFLARE_R2_CONFIG.accountId)) {
        return null;
      }

      // Extract the key (path without leading slash)
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

      console.log('[CloudflareUpload] Extracted key from URL:', {
        originalUrl: cloudflareUrl,
        extractedKey: key
      });

      return key || null;
    } catch (error) {
      console.error('[CloudflareUpload] Failed to extract key from URL:', cloudflareUrl, error);
      return null;
    }
  }

  /**
   * Generate presigned download URL from public Cloudflare URL with caching
   */
  static async generatePresignedUrlFromPublicUrl(
    cloudflareUrl: string,
    expiresIn: number = PRESIGNED_URL_EXPIRY
  ): Promise<string | null> {
    try {
      const key = this.extractKeyFromUrl(cloudflareUrl);

      if (!key) {
        console.warn('[CloudflareUpload] Could not extract key from URL:', cloudflareUrl);
        return null;
      }

      // Check cache first
      const cacheKey = `${key}_${expiresIn}`;
      const cached = this.presignedUrlCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        console.log('[CloudflareUpload] Using cached presigned URL for key:', key);
        return cached.url;
      }

      // Generate new presigned URL
      const instance = new CloudflareUploadService();
      const presignedUrl = await instance.generatePresignedDownloadUrl(key, expiresIn);

      if (presignedUrl) {
        // Cache the URL (expire 5 minutes before actual expiry for safety)
        const expiresAt = Date.now() + (expiresIn - 300) * 1000;
        this.presignedUrlCache.set(cacheKey, {
          url: presignedUrl,
          expiresAt
        });

        console.log('[CloudflareUpload] Generated and cached presigned URL for key:', key);
      }

      return presignedUrl;

    } catch (error: any) {
      console.error('[CloudflareUpload] Failed to generate presigned URL from public URL:', error);
      return null;
    }
  }

  /**
   * Clear expired entries from presigned URL cache
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.presignedUrlCache.entries()) {
      if (cached.expiresAt <= now) {
        this.presignedUrlCache.delete(key);
      }
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
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[CloudflareUpload] Testing connection to Cloudflare R2...');

      // Try to list buckets (this will validate our credentials)
      const result = await this.s3Client.send(new ListBucketsCommand({}));

      console.log('[CloudflareUpload] Connection test successful. Buckets found:', result.Buckets?.length || 0);
      return { success: true };

    } catch (error: any) {
      console.error('[CloudflareUpload] Connection test failed:', error);

      let errorMessage = 'Connection test failed';
      if (error.code === 'CredentialsError') {
        errorMessage = 'Invalid Cloudflare R2 credentials';
      } else if (error.code === 'NetworkingError') {
        errorMessage = 'Network connection failed';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Diagnose upload issues
   */
  async diagnoseUploadIssues(): Promise<{
    connectionOk: boolean;
    configValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let connectionOk = false;
    let configValid = true;

    // Check configuration
    if (!CLOUDFLARE_R2_CONFIG.accessKeyId) {
      issues.push('Missing access key ID');
      configValid = false;
    }
    if (!CLOUDFLARE_R2_CONFIG.secretAccessKey) {
      issues.push('Missing secret access key');
      configValid = false;
    }
    if (!CLOUDFLARE_R2_CONFIG.bucketName) {
      issues.push('Missing bucket name');
      configValid = false;
    }

    // Test connection if config is valid
    if (configValid) {
      const connectionTest = await this.testConnection();
      connectionOk = connectionTest.success;
      if (!connectionOk && connectionTest.error) {
        issues.push(`Connection failed: ${connectionTest.error}`);
      }
    }

    return { connectionOk, configValid, issues };
  }

  /**
   * Initialize cache cleanup interval
   */
  static initializeCacheCleanup(): void {
    // Clean expired cache entries every 10 minutes
    setInterval(() => {
      this.clearExpiredCache();
    }, 10 * 60 * 1000);
  }
}

// Export both the class and singleton instance
export { CloudflareUploadService };
export default new CloudflareUploadService();
