# Cloudflare R2 Upload Implementation

This implementation provides a complete solution for uploading videos and thumbnails to Cloudflare R2 storage from React Native, following Cloudflare's official AWS SDK documentation.

## What's Implemented

### ✅ Core Services

1. **CloudflareUploadService** (`src/services/CloudflareUploadService.ts`)
   - Complete AWS S3 SDK v3 integration with Cloudflare R2
   - Direct file uploads with progress tracking
   - Presigned URL generation for secure uploads
   - Batch upload support for video + thumbnail
   - File validation and error handling
   - Specialized methods for TipShorts and TipTube

2. **Configuration** (`src/config/cloudflareConfig.ts`)
   - Centralized R2 configuration
   - Environment variable support
   - File size limits and format restrictions
   - Folder organization structure

### ✅ Screen Integration

1. **TipShortsUploadScreen** (`src/screens/content/TipShortsUploadScreen.tsx`)
   - ✅ Already using CloudflareUploadService.uploadTipShort()
   - ✅ Progress tracking and error handling
   - ✅ Sends Cloudflare URLs to existing API

2. **TipTubeUploadScreen** (`src/screens/content/TipTubeUploadScreen.tsx`)
   - ✅ Updated to use CloudflareUploadService.uploadTipTube()
   - ✅ Replaced old FormData approach with Cloudflare uploads
   - ✅ Sends Cloudflare URLs to existing API

### ✅ Utilities & Documentation

1. **CloudflareTestUtil** (`src/utils/CloudflareTestUtil.ts`)
   - Configuration validation
   - Connectivity testing
   - Setup verification tools

2. **Setup Guide** (`src/services/CloudflareSetupGuide.md`)
   - Complete setup instructions
   - Usage examples
   - Troubleshooting guide

## Package Dependencies

Required packages (already installed):

```json
{
  "@aws-sdk/client-s3": "^3.839.0",
  "@aws-sdk/s3-request-presigner": "^3.x.x",
  "react-native-fs": "^2.20.0"
}
```

## How It Works

### Upload Flow

1. **User selects video/thumbnail** → Local file URIs
2. **Video compression** → VideoCompressionService (existing)
3. **Cloudflare upload** → CloudflareUploadService
4. **Get public URLs** → Cloudflare R2 URLs
5. **API submission** → Send URLs to existing `/api/addShot`

### File Organization

```
your-bucket/
├── shorts/videos/user_123/timestamp_random.mp4
├── shorts/thumbnails/user_123/timestamp_random.jpg
├── tiptube/videos/user_123/timestamp_random.mp4
└── tiptube/thumbnails/user_123/timestamp_random.jpg
```

### Security

- ✅ File validation (size, format)
- ✅ User-based file organization
- ✅ Presigned URLs with expiration
- ✅ Unique file naming to prevent conflicts

## Setup Required

1. **Create Cloudflare R2 bucket**
2. **Generate API tokens** with read/write permissions
3. **Update configuration** in `cloudflareConfig.ts`:

```typescript
export const CLOUDFLARE_R2_CONFIG = {
  accountId: "your-account-id",
  accessKeyId: "your-access-key-id",
  secretAccessKey: "your-secret-access-key", 
  bucketName: "your-bucket-name",
  region: "auto",
  publicUrl: "https://your-domain.com"
};
```

4. **Test the setup**:

```typescript
import CloudflareTestUtil from '../utils/CloudflareTestUtil';

// Run comprehensive test
const testResult = await CloudflareTestUtil.runFullTest();
console.log('Setup valid:', testResult.configValid);
```

## Usage Examples

### TipShorts Upload
```typescript
const uploadResult = await CloudflareUploadService.uploadTipShort(
  videoPath,
  thumbnailPath, 
  userId,
  (progress) => setUploadProgress(progress.percentage)
);

// URLs are now available for API submission
const videoUrl = uploadResult.video.url;
const thumbnailUrl = uploadResult.thumbnail.url;
```

### TipTube Upload
```typescript
const uploadResult = await CloudflareUploadService.uploadTipTube(
  videoPath,
  thumbnailPath,
  userId, 
  (progress) => setUploadProgress(progress.percentage)
);

// URLs are now available for API submission
const videoUrl = uploadResult.video.url;
const thumbnailUrl = uploadResult.thumbnail.url;
```

## Benefits

1. **Cost Effective** - Cloudflare R2 has no egress fees
2. **Global CDN** - Built-in global distribution
3. **S3 Compatible** - Standard AWS SDK integration
4. **Scalable** - Handles large files and high volume
5. **Secure** - Presigned URLs and access controls
6. **Fast** - Optimized for video streaming

## API Integration

The existing API endpoints remain unchanged. Only the URLs change:

**Before**: `https://your-api-server.com/uploads/video123.mp4`  
**After**: `https://your-domain.com/tiptube/videos/user_123/timestamp_random.mp4`

Your API receives the same data structure, just with Cloudflare URLs instead of local server URLs.

## Monitoring & Debugging

Use the test utility to verify setup:

```typescript
// Quick test
const connected = await CloudflareTestUtil.quickConnectivityTest();

// Full diagnostic
const result = await CloudflareTestUtil.runFullTest();
```

Enable debug logging by checking console logs with `[CloudflareUpload]` prefix.

## Next Steps

1. Configure your Cloudflare R2 credentials
2. Test with CloudflareTestUtil
3. Deploy and monitor upload performance
4. Set up custom domain for better branding (optional)
5. Configure CORS if needed for browser uploads
