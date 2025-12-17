// Enhanced File Validation Utilities
// Comprehensive validation for upload and create-post flows

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  fileInfo?: {
    type: 'image' | 'video' | 'unknown';
    size: number;
    sizeFormatted: string;
    extension: string;
    mimeType: string;
  };
}

export interface ValidationConfig {
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedImageExtensions: string[];
  allowedVideoExtensions: string[];
  maxImageSize: number;
  maxVideoSize: number;
  maxShortVideoSize: number;
  minVideoSize: number;
  minImageSize: number;
}

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  allowedVideoTypes: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/mov'
  ],
  allowedImageExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  allowedVideoExtensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  maxShortVideoSize: 50 * 1024 * 1024, // 50MB for shorts
  minVideoSize: 100 * 1024, // 100KB minimum
  minImageSize: 10 * 1024, // 10KB minimum
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'msi', 'run',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'psm1', 'psd1',
  'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'cgi'
];

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Detect file type from MIME type and extension
 */
export function detectFileType(file: File): 'image' | 'video' | 'unknown' {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);
  
  // Check MIME type first (more reliable)
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  
  // Fallback to extension check
  if (DEFAULT_VALIDATION_CONFIG.allowedImageExtensions.includes(extension)) {
    return 'image';
  }
  if (DEFAULT_VALIDATION_CONFIG.allowedVideoExtensions.includes(extension)) {
    return 'video';
  }
  
  return 'unknown';
}

/**
 * Check if file extension is dangerous
 */
export function isDangerousFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return DANGEROUS_EXTENSIONS.includes(extension);
}

/**
 * Validate file for upload based on post type
 */
export function validateFile(
  file: File,
  postType: 'post' | 'tip-tube' | 'tip-shorts',
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): FileValidationResult {
  const warnings: string[] = [];
  
  // Get file info
  const extension = getFileExtension(file.name);
  const fileType = detectFileType(file);
  const sizeFormatted = formatFileSize(file.size);
  
  const fileInfo = {
    type: fileType,
    size: file.size,
    sizeFormatted,
    extension,
    mimeType: file.type
  };

  // 1. Check for dangerous files first
  if (isDangerousFile(file.name)) {
    return {
      isValid: false,
      error: `File type '.${extension}' is not allowed for security reasons. Please upload an image or video file.`,
      fileInfo
    };
  }

  // 2. Check if file has no extension
  if (!extension) {
    return {
      isValid: false,
      error: 'File must have a valid extension. Please rename your file with the correct extension.',
      fileInfo
    };
  }

  // 3. Validate based on post type
  if (postType === 'post') {
    // Regular posts should be images only
    if (fileType !== 'image') {
      return {
        isValid: false,
        error: 'Regular posts only support image files. Please upload a JPG, PNG, WebP, or GIF image.',
        fileInfo
      };
    }

    // Check MIME type
    if (!config.allowedImageTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: `Image format '${file.type}' is not supported. Allowed formats: ${config.allowedImageExtensions.join(', ').toUpperCase()}`,
        fileInfo
      };
    }

    // Check file size
    if (file.size > config.maxImageSize) {
      return {
        isValid: false,
        error: `Image size (${sizeFormatted}) exceeds maximum limit of ${formatFileSize(config.maxImageSize)}`,
        fileInfo
      };
    }

    if (file.size < config.minImageSize) {
      return {
        isValid: false,
        error: `Image size (${sizeFormatted}) is too small. Minimum size is ${formatFileSize(config.minImageSize)}`,
        fileInfo
      };
    }

  } else if (postType === 'tip-tube' || postType === 'tip-shorts') {
    // Video posts
    if (fileType !== 'video') {
      return {
        isValid: false,
        error: `${postType === 'tip-tube' ? 'Tip Tube' : 'Tip Shorts'} only supports video files. Please upload an MP4, MOV, AVI, or MKV video.`,
        fileInfo
      };
    }

    // Check MIME type
    if (!config.allowedVideoTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: `Video format '${file.type}' is not supported. Allowed formats: ${config.allowedVideoExtensions.join(', ').toUpperCase()}`,
        fileInfo
      };
    }

    // Check file size based on video type
    const maxSize = postType === 'tip-shorts' ? config.maxShortVideoSize : config.maxVideoSize;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `Video size (${sizeFormatted}) exceeds maximum limit of ${formatFileSize(maxSize)} for ${postType === 'tip-shorts' ? 'Tip Shorts' : 'Tip Tube'}`,
        fileInfo
      };
    }

    if (file.size < config.minVideoSize) {
      return {
        isValid: false,
        error: `Video size (${sizeFormatted}) is too small. Minimum size is ${formatFileSize(config.minVideoSize)}`,
        fileInfo
      };
    }

    // Add warnings for large files
    if (file.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large video files may take longer to upload and process.');
    }
  }

  // 4. Additional checks for all file types
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /script/i,
    /malware/i,
    /virus/i,
    /trojan/i,
    /backdoor/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    warnings.push('File name contains suspicious keywords. Please rename your file.');
  }

  // Check for very long filenames
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'File name is too long. Please use a shorter file name (max 255 characters).',
      fileInfo
    };
  }

  // Check for special characters that might cause issues
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(file.name)) {
    warnings.push('File name contains special characters that may cause upload issues.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    fileInfo
  };
}

/**
 * Validate multiple files at once
 */
export function validateFiles(
  files: File[],
  postType: 'post' | 'tip-tube' | 'tip-shorts',
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): { isValid: boolean; results: FileValidationResult[]; errors: string[]; warnings: string[] } {
  const results = files.map(file => validateFile(file, postType, config));
  const errors: string[] = [];
  const warnings: string[] = [];

  results.forEach((result, index) => {
    if (!result.isValid && result.error) {
      errors.push(`File ${index + 1}: ${result.error}`);
    }
    if (result.warnings) {
      warnings.push(...result.warnings.map(w => `File ${index + 1}: ${w}`));
    }
  });

  return {
    isValid: results.every(r => r.isValid),
    results,
    errors,
    warnings
  };
}

/**
 * Get accept attribute for file input based on post type
 */
export function getAcceptAttribute(postType: 'post' | 'tip-tube' | 'tip-shorts'): string {
  if (postType === 'post') {
    return DEFAULT_VALIDATION_CONFIG.allowedImageTypes.join(',');
  } else {
    return DEFAULT_VALIDATION_CONFIG.allowedVideoTypes.join(',');
  }
}

/**
 * Get user-friendly file type description
 */
export function getFileTypeDescription(postType: 'post' | 'tip-tube' | 'tip-shorts'): string {
  if (postType === 'post') {
    return 'Images (JPG, PNG, WebP, GIF)';
  } else if (postType === 'tip-shorts') {
    return 'Short Videos (MP4, MOV, AVI, MKV) - Max 50MB';
  } else {
    return 'Videos (MP4, MOV, AVI, MKV) - Max 100MB';
  }
}

/**
 * Check if user has required permissions for upload
 */
export function checkUploadPermissions(user: any): { canUpload: boolean; error?: string; requiresChannel?: boolean } {
  // Check if user is authenticated
  if (!user) {
    return {
      canUpload: false,
      error: 'You must be logged in to upload content'
    };
  }

  // Check if user has a channel for video uploads
  if (!user.channelId && !user.channel_id) {
    return {
      canUpload: false,
      error: 'You need to create a channel before uploading videos',
      requiresChannel: true
    };
  }

  // Check if user account is verified/active
  if (user.status === 'suspended' || user.status === 'banned') {
    return {
      canUpload: false,
      error: 'Your account is suspended. Please contact support.'
    };
  }

  return { canUpload: true };
}