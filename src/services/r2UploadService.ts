// R2 Upload Service for Web Frontend
// Mimics the functionality of your React Native CloudflareUploadService

export interface UploadResult {
    success: boolean;
    url: string;
    key: string;
    size: number;
    contentType: string;
    error?: string;
  }
  
  export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
  }
  
  // Configuration matching your mobile app
  const R2_CONFIG = {
    accountId: '94e2ffe1e7d5daf0d3de8d11c55dd2d6',
    bucketName: 'adtip',
    publicDomain: 'https://theadtip.in', // Matches your mobile app's CLOUDFLARE_PUBLIC_DOMAIN
    region: 'auto'
  };
  
  // Upload folders matching your mobile app
  const UPLOAD_FOLDERS = {
    VIDEOS: 'videos',
    THUMBNAILS: 'thumbnails',
    SHORTS: 'shorts',
    TIPTUBE: 'tiptube',
    TEMP: 'temp',
  } as const;
  
  // File size limits matching your mobile app
  const FILE_SIZE_LIMITS = {
    VIDEO_MAX: 100 * 1024 * 1024,    // 100MB for regular videos
    SHORT_MAX: 50 * 1024 * 1024,     // 50MB for short videos
    THUMBNAIL_MAX: 5 * 1024 * 1024,  // 5MB for thumbnails
  } as const;
  
  // Supported formats matching your mobile app
  const SUPPORTED_FORMATS = {
    VIDEO: ['mp4', 'mov', 'avi', 'mkv'],
    IMAGE: ['jpg', 'jpeg', 'png', 'webp'],
  } as const;
  
  /**
   * Upload file to Cloudflare R2 (web-compatible version)
   * This mimics your mobile app's uploadFile method
   */
  export async function uploadToR2(
    file: File,
    folder: string,
    userId: number | string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('[R2Upload] Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder,
        userId
      });
  
      // Validate file
      const validationResult = validateFile(file, folder);
      if (!validationResult.valid) {
        return {
          success: false,
          url: '',
          key: '',
          size: 0,
          contentType: '',
          error: validationResult.error
        };
      }
  
      // Generate unique key (matching your mobile app's generateFileKey method)
      const key = generateFileKey(folder, file.name, userId);
      
      // Get content type
      const contentType = getContentType(file.name);
  
      // Simulate progress
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }
  
      // For web, we'll use a mock upload that returns a URL
      // In production, you'd integrate with your actual R2 upload endpoint
      const mockUploadResult = await mockR2Upload(file, key, contentType, onProgress);
  
      if (mockUploadResult.success) {
        // Generate public URL using custom domain (matching your mobile app)
        const publicUrl = `${R2_CONFIG.publicDomain}/${key}`;
        
        console.log('[R2Upload] Upload successful:', {
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
      } else {
        throw new Error(mockUploadResult.error || 'Upload failed');
      }
  
    } catch (error: any) {
      console.error('[R2Upload] Upload failed:', error);
      
      let errorMessage = 'Upload failed';
      if (error.message?.includes('size')) {
        errorMessage = 'File size too large. Please compress your video and try again.';
      } else if (error.message?.includes('format')) {
        errorMessage = 'Unsupported file format. Please use MP4, MOV, AVI, or MKV.';
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
   * Validate file before upload (matching your mobile app's validateFile method)
   */
  function validateFile(file: File, folder: string): { valid: boolean; error?: string } {
    // Check file size
    let maxSize: number;
    if (folder.includes('short')) {
      maxSize = FILE_SIZE_LIMITS.SHORT_MAX;
    } else if (folder === UPLOAD_FOLDERS.VIDEOS) {
      maxSize = FILE_SIZE_LIMITS.VIDEO_MAX;
    } else if (folder === UPLOAD_FOLDERS.THUMBNAILS) {
      maxSize = FILE_SIZE_LIMITS.THUMBNAIL_MAX;
    } else {
      maxSize = FILE_SIZE_LIMITS.VIDEO_MAX;
    }
  
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`
      };
    }
  
    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase() as keyof typeof SUPPORTED_FORMATS.VIDEO | keyof typeof SUPPORTED_FORMATS.IMAGE;
    const isVideo = SUPPORTED_FORMATS.VIDEO.includes(extension as any);
    const isImage = SUPPORTED_FORMATS.IMAGE.includes(extension as any);
  
    if (folder === UPLOAD_FOLDERS.VIDEOS && !isVideo) {
      return {
        valid: false,
        error: `Unsupported video format. Allowed: ${SUPPORTED_FORMATS.VIDEO.join(', ')}`
      };
    }
  
    if (folder === UPLOAD_FOLDERS.THUMBNAILS && !isImage) {
      return {
        valid: false,
        error: `Unsupported image format. Allowed: ${SUPPORTED_FORMATS.IMAGE.join(', ')}`
      };
    }
  
    return { valid: true };
  }
  
  /**
   * Generate unique file key (matching your mobile app's generateFileKey method)
   */
  function generateFileKey(folder: string, originalName: string, userId: number | string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase();
    
    // Simple flat structure - no user folders (matching your mobile app)
    return `${folder}/${timestamp}_${random}.${extension}`;
  }
  
  /**
   * Get content type from file extension (matching your mobile app's getContentType method)
   */
  function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
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
   * Mock R2 upload for development/testing
   * In production, replace this with actual R2 upload logic
   */
  async function mockR2Upload(
    file: File,
    key: string,
    contentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Simulate upload delay
      const totalSteps = 10;
      let currentStep = 0;
  
      const uploadInterval = setInterval(() => {
        currentStep++;
        
        if (onProgress) {
          const percentage = (currentStep / totalSteps) * 100;
          const loaded = (file.size * percentage) / 100;
          onProgress({ loaded, total: file.size, percentage });
        }
  
        if (currentStep >= totalSteps) {
          clearInterval(uploadInterval);
          
          // Simulate successful upload
          console.log('[R2Upload] Mock upload completed:', { key, contentType });
          resolve({ success: true });
        }
      }, 100); // 100ms per step = 1 second total
    });
  }
  
  /**
   * Test R2 upload service
   */
  export async function testR2Upload(): Promise<boolean> {
    try {
      // Create a test file
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
  
      const result = await uploadToR2(testFile, 'temp', 123);
      
      console.log('[R2Upload] Test result:', result);
      return result.success;
    } catch (error) {
      console.error('[R2Upload] Test failed:', error);
      return false;
    }
  }
  
  // Export constants for use in other components
  export { UPLOAD_FOLDERS, FILE_SIZE_LIMITS, SUPPORTED_FORMATS, R2_CONFIG };