// src/config/cloudflareConfig.ts
// Cloudflare R2 Configuration for Video Uploads
// Following best practices from: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/

export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  publicUrl: string;
}

// IMPORTANT: In production, these should be loaded from environment variables
// For React Native, you can use react-native-config or a similar library
// Never commit real credentials to version control!
export const CLOUDFLARE_R2_CONFIG: CloudflareR2Config = {
  // Replace with your actual Cloudflare R2 credentials
  accountId: '94e2ffe1e7d5daf0d3de8d11c55dd2d6',
  accessKeyId: 'cee3aea0fa77a871fbc3d34a28897216',
  secretAccessKey: '686b7a165aa944fbd641de53bbbb277a07e9a284ace18c84a83237b330b63c1d',
  bucketName: 'adtip',
  region: 'auto', // Cloudflare R2 uses 'auto' region
  publicUrl: 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com', // Raw R2 URL (used for S3 client operations only)
};

// Folder structure for organized uploads
export const UPLOAD_FOLDERS = {
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  SHORTS: 'shorts',     // For TipShorts videos
  TIPTUBE: 'tiptube',   // For TipTube videos  
  TEMP: 'temp',
} as const;

// File size limits (in bytes) - following WhatsApp and YouTube standards
export const FILE_SIZE_LIMITS = {
  VIDEO_MAX: 100 * 1024 * 1024,    // 100MB for regular videos
  SHORT_MAX: 50 * 1024 * 1024,     // 50MB for short videos
  THUMBNAIL_MAX: 5 * 1024 * 1024,  // 5MB for thumbnails
} as const;

// Supported file types - optimized for web and mobile playback
export const SUPPORTED_FORMATS = {
  VIDEO: ['mp4', 'mov', 'avi', 'mkv'],
  IMAGE: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

// Presigned URL expiration time (in seconds)
export const PRESIGNED_URL_EXPIRY = 3600; // 1 hour - secure but enough time for uploads

// Custom domain for publicly accessible URLs (matches backend ReelsService.js)
export const CLOUDFLARE_PUBLIC_DOMAIN = "https://theadtip.in";

// Setup Instructions:
// 1. Create a Cloudflare R2 bucket at https://dash.cloudflare.com/
// 2. Generate R2 API tokens with read/write permissions
// 3. Set up a custom domain for your bucket (optional but recommended)
// 4. Configure environment variables in your build system
// 5. Test the connection using CloudflareUploadService.testConnection()
