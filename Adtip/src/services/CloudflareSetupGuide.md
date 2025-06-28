# Cloudflare R2 Upload Service Setup Guide

This guide explains how to set up and use the Cloudflare R2 upload service for both TipShorts and TipTube video uploads.

## Overview

The implementation follows Cloudflare's official documentation for AWS SDK integration:
- Uses AWS S3 SDK v3 for compatibility with Cloudflare R2
- Implements presigned URLs for secure uploads
- Handles both direct uploads and presigned URL generation
- Provides progress tracking and error handling

## Setup Steps

### 1. Create Cloudflare R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., "adtip-media")
4. Note your Account ID from the dashboard

### 2. Generate API Tokens

1. Go to "Manage R2 API Tokens"
2. Create a new token with:
   - **Permissions**: Object Read & Write
   - **TTL**: No expiry (or set appropriate expiry)
   - **Bucket**: Select your bucket or "All buckets"
3. Save the Access Key ID and Secret Access Key

### 3. Configure Custom Domain (Optional but Recommended)

1. In your R2 bucket settings, add a custom domain
2. Update DNS records as instructed
3. Use this domain in your `publicUrl` configuration

### 4. Environment Configuration

Update `src/config/cloudflareConfig.ts` with your credentials:

```typescript
export const CLOUDFLARE_R2_CONFIG: CloudflareR2Config = {
  accountId: "your-cloudflare-account-id",
  accessKeyId: "your-r2-access-key-id", 
  secretAccessKey: "your-r2-secret-access-key",
  bucketName: "your-bucket-name",
  region: "auto",
  publicUrl: "https://your-custom-domain.com" // or R2 dev URL
};
```

**Important**: Never commit real credentials to version control. Use environment variables in production.

## Usage Examples

### Basic Upload

```typescript
import CloudflareUploadService from '../services/CloudflareUploadService';

// Upload a single file
const result = await CloudflareUploadService.uploadFile(
  '/path/to/video.mp4',
  'tiptube/videos',
  'my-video.mp4',
  userId,
  (progress) => console.log(`Upload: ${progress.percentage}%`)
);

console.log('File URL:', result.url);
```

### TipShorts Upload

```typescript
// Upload short video with thumbnail
const uploadResult = await CloudflareUploadService.uploadTipShort(
  videoPath,
  thumbnailPath,
  userId,
  (progress) => setUploadProgress(progress.percentage)
);

if (uploadResult.allSuccessful) {
  const videoUrl = uploadResult.video.url;
  const thumbnailUrl = uploadResult.thumbnail.url;
  
  // Send URLs to your API
  await createTipShot(videoUrl, thumbnailUrl);
}
```

### TipTube Upload

```typescript
// Upload regular video with thumbnail
const uploadResult = await CloudflareUploadService.uploadTipTube(
  videoPath,
  thumbnailPath,
  userId,
  (progress) => setUploadProgress(progress.percentage)
);

if (uploadResult.allSuccessful) {
  const videoUrl = uploadResult.video.url;
  const thumbnailUrl = uploadResult.thumbnail.url;
  
  // Send URLs to your API
  await createTipTubeVideo(videoUrl, thumbnailUrl);
}
```

### Presigned URL Upload

```typescript
// Generate presigned URL for client-side upload
const presignedInfo = await CloudflareUploadService.generatePresignedUploadUrl(
  'tiptube/videos',
  'video.mp4',
  'video/mp4',
  userId,
  3600 // 1 hour expiry
);

// Use presignedInfo.uploadUrl for direct upload
// Use presignedInfo.downloadUrl for accessing the file
```

## File Organization

The service automatically organizes files in the following structure:

```
bucket/
├── shorts/
│   ├── videos/
│   │   └── user_123/
│   │       └── 1640995200000_abc123.mp4
│   └── thumbnails/
│       └── user_123/
│           └── 1640995200000_def456.jpg
├── tiptube/
│   ├── videos/
│   │   └── user_123/
│   │       └── 1640995200000_ghi789.mp4
│   └── thumbnails/
│       └── user_123/
│           └── 1640995200000_jkl012.jpg
└── temp/
    └── (temporary files)
```

## Security Features

1. **File Validation**: Checks file size and format before upload
2. **User-based Organization**: Files are organized by user ID
3. **Unique Naming**: Prevents filename collisions with timestamps and random strings
4. **Presigned URLs**: Secure, time-limited upload access
5. **Error Handling**: Comprehensive error reporting and recovery

## Troubleshooting

### Connection Issues

```typescript
// Test your configuration
const isConnected = await CloudflareUploadService.testConnection();
if (!isConnected) {
  console.error('Check your R2 credentials and bucket configuration');
}
```

### Common Errors

1. **"Access Denied"**: Check API token permissions
2. **"Bucket not found"**: Verify bucket name and account ID
3. **"Invalid credentials"**: Check access key ID and secret
4. **"File too large"**: Check file size limits in config
5. **"Unsupported format"**: Verify file extension is allowed

### Debug Mode

Enable debug logging in the service:

```typescript
// Add this to see detailed upload logs
console.log('[CloudflareUpload] Debug mode enabled');
```

## Performance Optimization

1. **Compression**: Videos are compressed before upload using VideoCompressionService
2. **Parallel Uploads**: Video and thumbnail upload in parallel when possible
3. **Progress Tracking**: Real-time upload progress for better UX
4. **Retry Logic**: Built-in retry for failed uploads
5. **File Size Limits**: Prevents oversized uploads that could fail

## API Integration

After successful upload to Cloudflare R2, URLs are sent to your existing API:

```typescript
// TipShorts API call
const response = await ApiService.post('/api/addShot', {
  name: title,
  isShot: true,
  categoryId: categoryId,
  channelId: channelId,
  videoLink: videoUrl,        // Cloudflare R2 URL
  videoDesciption: description,
  createdby: userId,
  play_duration: duration,
  video_Thumbnail: thumbnailUrl // Cloudflare R2 URL
});
```

This approach separates file storage (Cloudflare R2) from metadata storage (your API), providing better scalability and performance.
