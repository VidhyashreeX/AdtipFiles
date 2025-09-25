// src/services/CloudflareUploadService.ts
// Web-compatible Cloudflare R2 Upload Service
// Adapted from React Native version for web browsers

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Import config - we'll create a web version
interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  publicUrl: string;
}

// Configuration for web (should match your backend config)
const CLOUDFLARE_R2_CONFIG: CloudflareR2Config = {
  accountId: '94e2ffe1e7d5daf0d3de8d11c55dd2d6',
  accessKeyId: 'cee3aea0fa77a871fbc3d34a28897216',
  secretAccessKey: '686b7a165aa944fbd641de53bbbb277a07e9a284ace18c84a83237b330b63c1d',
  bucketName: 'adtip',
  region: 'auto',
  publicUrl: 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com',
};

// Folder structure
export const UPLOAD_FOLDERS = {
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  IMAGES: 'images',
  COMPANIES: 'companies',
  ADS: 'ads',
  TEMP: 'temp',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  VIDEO_MAX: 100 * 1024 * 1024,    // 100MB
  IMAGE_MAX: 5 * 1024 * 1024,      // 5MB
  COMPANY_LOGO_MAX: 2 * 1024 * 1024,  // 2MB
} as const;

// Supported file formats
export const SUPPORTED_FORMATS = {
  VIDEO: ['mp4', 'mov', 'avi', 'mkv'],
  IMAGE: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
} as const;

// Custom domain for public URLs
export const CLOUDFLARE_PUBLIC_DOMAIN = "https://theadtip.in";

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
  private validateFile(file: File, maxSize: number, allowedFormats: readonly string[]): boolean {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedFormats.includes(extension)) {
      throw new Error(`File format .${extension} is not supported. Allowed formats: ${allowedFormats.join(', ')}`);
    }

    return true;
  }

  /**
   * Generate unique file key for R2 storage
   */
  private generateFileKey(folder: string, originalName: string, userId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase();
    
    // Create organized structure: folder/timestamp_random.extension
    return `${folder}/${timestamp}_${random}.${extension}`;
  }

  /**
   * Get content type from file
   */
  private getContentType(file: File): string {
    // Use the file's built-in type if available
    if (file.type) {
      return file.type;
    }

    // Fallback to extension-based detection
    const extension = file.name.split('.').pop()?.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    return contentTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Convert File to ArrayBuffer for upload
   */
  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Upload single file to Cloudflare R2
   */
  async uploadFile(
    file: File,
    folder: string,
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting Cloudflare R2 upload:', { fileName: file.name, size: file.size, folder });

      // Determine file type and validation rules
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      let maxSize: number;
      let allowedFormats: readonly string[];
      
      if (isVideo) {
        maxSize = FILE_SIZE_LIMITS.VIDEO_MAX;
        allowedFormats = SUPPORTED_FORMATS.VIDEO;
      } else if (isImage) {
        maxSize = FILE_SIZE_LIMITS.IMAGE_MAX;
        allowedFormats = SUPPORTED_FORMATS.IMAGE;
      } else {
        throw new Error('Unsupported file type. Please upload an image or video file.');
      }

      // Validate file
      this.validateFile(file, maxSize, allowedFormats);

      // Generate unique key
      const key = this.generateFileKey(folder, file.name, userId);
      
      // Get content type
      const contentType = this.getContentType(file);

      // Convert file to ArrayBuffer
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      const fileBuffer = await this.fileToArrayBuffer(file);

      if (onProgress) {
        onProgress({ loaded: file.size * 0.5, total: file.size, percentage: 50 });
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(fileBuffer),
        ContentType: contentType,
        ContentLength: file.size,
        Metadata: {
          originalName: file.name,
          uploadedBy: userId || 'anonymous',
          uploadedAt: new Date().toISOString(),
          fileType: isVideo ? 'video' : 'image',
          originalSize: file.size.toString(),
        },
      });

      console.log('Sending upload command to Cloudflare R2...');
      const response = await this.s3Client.send(command);
      console.log('Cloudflare R2 upload response:', response);

      // Complete progress
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      // Generate public URL using custom domain
      const publicUrl = `${CLOUDFLARE_PUBLIC_DOMAIN}/${key}`;

      console.log('Upload successful:', {
        key,
        size: file.size,
        contentType,
        url: publicUrl
      });

      return {
        success: true,
        url: publicUrl,
        key,
        size: file.size,
        contentType,
      };

    } catch (error: any) {
      console.error('Cloudflare R2 upload failed:', error);

      // Enhanced error handling
      let errorMessage = 'Upload failed';

      if (error.name === 'NetworkingError') {
        errorMessage = 'Network error - please check your internet connection';
      } else if (error.name === 'CredentialsError') {
        errorMessage = 'Authentication failed - invalid credentials';
      } else if (error.name === 'NoSuchBucket') {
        errorMessage = 'Storage bucket not found';
      } else if (error.name === 'AccessDenied') {
        errorMessage = 'Access denied - insufficient permissions';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout - please try again';
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
   * Upload company logo/banner
   */
  async uploadCompanyImage(
    file: File,
    imageType: 'logo' | 'banner',
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return this.uploadFile(file, UPLOAD_FOLDERS.COMPANIES, userId, onProgress);
  }

  /**
   * Upload ad creative
   */
  async uploadAdCreative(
    file: File,
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return this.uploadFile(file, UPLOAD_FOLDERS.ADS, userId, onProgress);
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
      console.log('File deleted successfully:', key);
      return true;

    } catch (error: any) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get upload configuration
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
      console.log('Testing connection to Cloudflare R2...');

      // Try a simple operation to test credentials
      const testKey = `test/${Date.now()}_connection_test.txt`;
      const testData = new TextEncoder().encode('connection test');

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: testKey,
        Body: testData,
        ContentType: 'text/plain',
      });

      await this.s3Client.send(command);

      // Clean up test file
      await this.deleteFile(testKey);

      console.log('Connection test successful');
      return { success: true };

    } catch (error: any) {
      console.error('Connection test failed:', error);

      let errorMessage = 'Connection test failed';
      if (error.name === 'CredentialsError') {
        errorMessage = 'Invalid credentials';
      } else if (error.name === 'NetworkingError') {
        errorMessage = 'Network connectivity issue';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export default new CloudflareUploadService();
export { CloudflareUploadService };