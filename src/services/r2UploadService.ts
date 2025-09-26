// R2 Upload Service for Web Frontend
// Mimics the functionality of your React Native CloudflareUploadService

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import {
  CLOUDFLARE_PUBLIC_DOMAIN,
  CLOUDFLARE_R2_CONFIG,
  FILE_SIZE_LIMITS,
  SUPPORTED_FORMATS,
  UPLOAD_FOLDERS,
} from './CloudflareUploadService';

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

const s3Client = new S3Client({
  region: CLOUDFLARE_R2_CONFIG.region,
  endpoint: `https://${CLOUDFLARE_R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_CONFIG.accessKeyId,
    secretAccessKey: CLOUDFLARE_R2_CONFIG.secretAccessKey,
  },
  forcePathStyle: true,
});

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
      userId,
    });

    const validationResult = validateFile(file, folder);
    if (!validationResult.valid) {
      return {
        success: false,
        url: '',
        key: '',
        size: 0,
        contentType: '',
        error: validationResult.error,
      };
    }

    const key = generateFileKey(folder, file.name, userId);
    const contentType = getContentType(file.name) || file.type || 'application/octet-stream';

    onProgress?.({ loaded: 0, total: file.size, percentage: 0 });

    // Convert File to ArrayBuffer for better compatibility
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_CONFIG.bucketName,
      Key: key,
      Body: uint8Array,
      ContentType: contentType,
      Metadata: {
        uploadedBy: userId?.toString() ?? 'anonymous',
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    onProgress?.({ loaded: file.size, total: file.size, percentage: 100 });

    const publicUrl = `${CLOUDFLARE_PUBLIC_DOMAIN}/${key}`;

    console.log('[R2Upload] Upload successful:', {
      key,
      size: file.size,
      contentType,
      url: publicUrl,
    });

    return {
      success: true,
      url: publicUrl,
      key,
      size: file.size,
      contentType,
    };
  } catch (error: any) {
    console.error('[R2Upload] Upload failed:', error);

    let errorMessage = 'Upload failed';
    if (error?.name === 'NetworkingError' || error?.message?.includes('NetworkError')) {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error?.message?.includes('size')) {
      errorMessage = 'File size too large. Please compress your video and try again.';
    } else if (error?.message?.includes('format')) {
      errorMessage = 'Unsupported file format. Please use MP4, MOV, AVI, or MKV.';
    } else if (error?.message) {
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
      error: `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isVideo = (SUPPORTED_FORMATS.VIDEO as readonly string[]).includes(extension);
  const isImage = (SUPPORTED_FORMATS.IMAGE as readonly string[]).includes(extension);

  if (folder === UPLOAD_FOLDERS.VIDEOS && !isVideo) {
    return {
      valid: false,
      error: `Unsupported video format. Allowed: ${SUPPORTED_FORMATS.VIDEO.join(', ')}`,
    };
  }

  if (folder === UPLOAD_FOLDERS.THUMBNAILS && !isImage) {
    return {
      valid: false,
      error: `Unsupported image format. Allowed: ${SUPPORTED_FORMATS.IMAGE.join(', ')}`,
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
 * Test R2 upload service
 */
export async function testR2Upload(): Promise<boolean> {
  try {
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    const result = await uploadToR2(testFile, UPLOAD_FOLDERS.TEMP, 123);

    console.log('[R2Upload] Test result:', result);
    return result.success;
  } catch (error) {
    console.error('[R2Upload] Test failed:', error);
    return false;
  }
}

// Export constants for use in other components
export { UPLOAD_FOLDERS, FILE_SIZE_LIMITS, SUPPORTED_FORMATS, CLOUDFLARE_R2_CONFIG };