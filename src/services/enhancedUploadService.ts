// Enhanced Upload Service
// Handles authentication, validation, and error management for uploads

import { uploadToR2 } from './r2UploadService';
import { validateFile, checkUploadPermissions, FileValidationResult } from '../utils/fileValidation';

export interface UploadProgress {
  stage: string;
  percentage: number;
  bytesUploaded?: number;
  totalBytes?: number;
  currentStep?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  errorCode?: string;
  validationResult?: FileValidationResult;
}

export interface UploadMetadata {
  title: string;
  description?: string;
  category?: string;
  postType: 'post' | 'tip-tube' | 'tip-shorts';
  isPaid?: boolean;
  pricePerMinute?: number;
  userId: number;
  channelId?: number;
}

class EnhancedUploadService {
  private static instance: EnhancedUploadService;

  static getInstance(): EnhancedUploadService {
    if (!EnhancedUploadService.instance) {
      EnhancedUploadService.instance = new EnhancedUploadService();
    }
    return EnhancedUploadService.instance;
  }

  /**
   * Get user authentication info
   */
  private getAuthInfo(): { user: any; token: string | null } {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      const token = localStorage.getItem('UserLoggedIn') || localStorage.getItem('token');
      
      const user = userStr ? JSON.parse(userStr) : null;
      
      return { user, token };
    } catch (error) {
      console.error('[EnhancedUpload] Error getting auth info:', error);
      return { user: null, token: null };
    }
  }

  /**
   * Validate upload prerequisites
   */
  private validateUploadPrerequisites(
    file: File,
    metadata: UploadMetadata
  ): { isValid: boolean; error?: string; errorCode?: string; requiresChannel?: boolean } {
    const { user, token } = this.getAuthInfo();

    // Check authentication
    if (!user || !token) {
      return {
        isValid: false,
        error: 'You must be logged in to upload content',
        errorCode: 'AUTH_REQUIRED'
      };
    }

    // Check upload permissions
    const permissionCheck = checkUploadPermissions(user);
    if (!permissionCheck.canUpload) {
      return {
        isValid: false,
        error: permissionCheck.error,
        errorCode: permissionCheck.requiresChannel ? 'CHANNEL_REQUIRED' : 'PERMISSION_DENIED',
        requiresChannel: permissionCheck.requiresChannel
      };
    }

    // Validate file
    const validationResult = validateFile(file, metadata.postType);
    if (!validationResult.isValid) {
      return {
        isValid: false,
        error: validationResult.error,
        errorCode: 'VALIDATION_FAILED'
      };
    }

    // Validate metadata
    if (!metadata.title.trim()) {
      return {
        isValid: false,
        error: 'Title is required',
        errorCode: 'MISSING_TITLE'
      };
    }

    if (metadata.title.length > 100) {
      return {
        isValid: false,
        error: 'Title must be less than 100 characters',
        errorCode: 'TITLE_TOO_LONG'
      };
    }

    // Validate paid content settings
    if (metadata.isPaid && (metadata.postType === 'tip-tube' || metadata.postType === 'tip-shorts')) {
      if (!metadata.pricePerMinute || metadata.pricePerMinute < 0.20 || metadata.pricePerMinute > 5.00) {
        return {
          isValid: false,
          error: 'Price per minute must be between ₹0.20 and ₹5.00',
          errorCode: 'INVALID_PRICE'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Upload content with comprehensive error handling
   */
  async uploadContent(
    file: File,
    metadata: UploadMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('[EnhancedUpload] Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        postType: metadata.postType,
        title: metadata.title
      });

      // Initial progress
      onProgress?.({
        stage: 'Validating upload...',
        percentage: 0,
        currentStep: 'Checking prerequisites'
      });

      // Validate prerequisites
      const validation = this.validateUploadPrerequisites(file, metadata);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          errorCode: validation.errorCode
        };
      }

      const { user, token } = this.getAuthInfo();

      onProgress?.({
        stage: 'Preparing upload...',
        percentage: 10,
        currentStep: 'Validating file'
      });

      // Validate file again for detailed info
      const fileValidation = validateFile(file, metadata.postType);
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error,
          errorCode: 'VALIDATION_FAILED',
          validationResult: fileValidation
        };
      }

      onProgress?.({
        stage: 'Uploading file...',
        percentage: 20,
        currentStep: 'Uploading to cloud storage'
      });

      // Upload file to R2
      const uploadResult = await uploadToR2(
        file,
        metadata.postType === 'post' ? 'images' : 'videos',
        user.id,
        (progress) => {
          onProgress?.({
            stage: 'Uploading file...',
            percentage: 20 + (progress.percentage * 0.6), // 20% to 80%
            bytesUploaded: progress.loaded,
            totalBytes: progress.total,
            currentStep: `Uploading... ${progress.percentage.toFixed(0)}%`
          });
        }
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'File upload failed',
          errorCode: 'UPLOAD_FAILED'
        };
      }

      onProgress?.({
        stage: 'Creating content...',
        percentage: 85,
        currentStep: 'Saving to database'
      });

      // Create content record in database
      const contentResult = await this.createContentRecord(uploadResult.url, metadata, user, token);
      
      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error,
          errorCode: contentResult.errorCode
        };
      }

      onProgress?.({
        stage: 'Upload complete!',
        percentage: 100,
        currentStep: 'Content created successfully'
      });

      return {
        success: true,
        url: uploadResult.url,
        validationResult: fileValidation
      };

    } catch (error: any) {
      console.error('[EnhancedUpload] Upload error:', error);
      
      let errorMessage = 'Upload failed';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        errorCode = 'NETWORK_ERROR';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout. Please try again with a smaller file.';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.';
        errorCode = 'AUTH_FAILED';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Permission denied. You may not have access to upload content.';
        errorCode = 'PERMISSION_DENIED';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Upload service not found. Please contact support.';
        errorCode = 'SERVICE_NOT_FOUND';
      } else if (error.message?.includes('413')) {
        errorMessage = 'File too large. Please compress your file and try again.';
        errorCode = 'FILE_TOO_LARGE';
      } else if (error.message?.includes('429')) {
        errorMessage = 'Too many upload attempts. Please wait a moment and try again.';
        errorCode = 'RATE_LIMITED';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
        errorCode = 'SERVER_ERROR';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode
      };
    }
  }

  /**
   * Create content record in database
   */
  private async createContentRecord(
    fileUrl: string,
    metadata: UploadMetadata,
    user: any,
    token: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      const payload = {
        title: metadata.title,
        contentType: metadata.postType === 'tip-shorts' ? 1 : 0, // 1=Short, 0=Video/Post
        categoryId: this.getCategoryId(metadata.category),
        channelId: user.channelId || user.channel_id,
        videoLink: fileUrl,
        video_Thumbnail: metadata.postType === 'post' ? fileUrl : await this.generateThumbnail(fileUrl),
        contentDescription: metadata.description || '',
        duration: metadata.postType === 'post' ? '00:00:00' : '00:01:30',
        userId: user.id,
        is_paid_promotional: metadata.isPaid || false,
        promotional_price: metadata.pricePerMinute || null
      };

      console.log('[EnhancedUpload] Creating content record:', payload);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploadcontent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EnhancedUpload] Content creation failed:', response.status, errorText);
        
        let errorMessage = 'Failed to create content record';
        let errorCode = 'CONTENT_CREATION_FAILED';

        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please log in again.';
          errorCode = 'AUTH_EXPIRED';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to create content.';
          errorCode = 'PERMISSION_DENIED';
        } else if (response.status === 404) {
          errorMessage = 'Content creation service not found. Please contact support.';
          errorCode = 'SERVICE_NOT_FOUND';
        } else if (response.status === 422) {
          errorMessage = 'Invalid content data. Please check your input and try again.';
          errorCode = 'INVALID_DATA';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
        }

        return { success: false, error: errorMessage, errorCode };
      }

      const result = await response.json();
      console.log('[EnhancedUpload] Content created successfully:', result);

      return { success: true };

    } catch (error: any) {
      console.error('[EnhancedUpload] Content creation error:', error);
      return {
        success: false,
        error: 'Failed to create content record',
        errorCode: 'CONTENT_CREATION_ERROR'
      };
    }
  }

  /**
   * Generate thumbnail for video (placeholder implementation)
   */
  private async generateThumbnail(videoUrl: string): Promise<string> {
    // For now, return a placeholder thumbnail
    // In a real implementation, you might extract a frame from the video
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

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
          const uploadResult = await uploadToR2(thumbnailFile, 'thumbnails', 0);
          resolve(uploadResult.success ? uploadResult.url : videoUrl);
        } else {
          resolve(videoUrl);
        }
      }, 'image/png');
    });
  }

  /**
   * Get category ID from category name
   */
  private getCategoryId(category?: string): number {
    const categoryMap: { [key: string]: number } = {
      'tech': 1,
      'beauty': 2,
      'gaming': 3,
      'food': 4,
      'travel': 5,
      'finance': 6,
      'fashion': 7,
      'music': 8,
      'education': 9,
      'entertainment': 10
    };

    return categoryMap[category?.toLowerCase() || ''] || 1;
  }

  /**
   * Check if user can upload (for UI state management)
   */
  canUserUpload(): { canUpload: boolean; error?: string; requiresChannel?: boolean } {
    const { user } = this.getAuthInfo();
    return checkUploadPermissions(user);
  }

  /**
   * Get upload configuration for UI
   */
  getUploadConfig() {
    return {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      maxVideoSize: 100 * 1024 * 1024, // 100MB
      maxShortVideoSize: 50 * 1024 * 1024, // 50MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedVideoTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
      supportedFormats: {
        images: ['JPG', 'PNG', 'WebP', 'GIF'],
        videos: ['MP4', 'MOV', 'AVI', 'MKV']
      }
    };
  }
}

export default EnhancedUploadService.getInstance();