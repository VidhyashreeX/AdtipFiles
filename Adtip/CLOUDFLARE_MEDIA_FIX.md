# Cloudflare Media Upload Visibility Fix

## Problem Summary

The React Native app was experiencing media upload visibility issues where uploaded content (videos and images) were not visible within the app after successful uploads to Cloudflare R2 storage. Users would see authorization errors when trying to access media URLs directly.

### Root Cause

The Cloudflare R2 bucket was configured as private (requiring authentication), but the app was trying to access media using direct public URLs like:
```
https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/path/to/file
```

This resulted in XML authorization errors when accessing these URLs directly in browsers or within the app.

## Solution Implemented

### Option A: Presigned URLs for Secure Access (Chosen)

Instead of making the bucket public, we implemented presigned URL generation for media access, maintaining security while enabling proper media visibility.

## Key Changes Made

### 1. Enhanced CloudflareUploadService (`src/services/CloudflareUploadService.ts`)

**Added Methods:**
- `extractKeyFromUrl(cloudflareUrl)` - Extracts object key from Cloudflare public URL
- `generatePresignedUrlFromPublicUrl(cloudflareUrl)` - Generates presigned download URL from public URL
- `clearExpiredCache()` - Cleans up expired presigned URL cache entries
- `initializeCacheCleanup()` - Initializes automatic cache cleanup

**Added Caching:**
- Presigned URLs are cached for performance (expire 5 minutes before actual expiry)
- Automatic cache cleanup every 10 minutes
- Cache key format: `{objectKey}_{expiresIn}`

### 2. Updated Media Utils (`src/utils/mediaUtils.ts`)

**New Functions:**
- `isCloudflareUrl(url)` - Detects Cloudflare R2 URLs
- Enhanced `getSecureMediaUrl()` - Automatically generates presigned URLs for Cloudflare media
- Enhanced `validateAndFixVideoUrl()` - Handles Cloudflare video URLs
- Enhanced `createSecureVideoSource()` - Creates proper video sources without conflicting headers
- Enhanced `createSecureImageSource()` - Creates proper image sources without conflicting headers

**Key Logic:**
- Detects Cloudflare URLs using hostname patterns
- Generates presigned URLs for Cloudflare media automatically
- Avoids adding authentication headers to presigned URLs (prevents conflicts)
- Falls back to original URLs if presigned URL generation fails

### 3. Updated Video Components

**Fixed Components:**
- `VideoScreen.tsx` - Now uses `createSecureVideoSource()`
- `VideoPlayerModal.tsx` - Now uses `createSecureVideoSource()`
- `ShortsScreen.tsx` - Now uses `createSecureVideoSource()`
- `VideoPlayerModalScreen.tsx` - Already used secure sources
- `PostItem.tsx` - Already used secure sources

**Pattern Applied:**
```typescript
// Before (problematic)
<Video source={{uri: videoUrl}} />

// After (fixed)
const [secureVideoSource, setSecureVideoSource] = useState(null);

useEffect(() => {
  const loadSource = async () => {
    const source = await createSecureVideoSource(videoUrl);
    setSecureVideoSource(source);
  };
  loadSource();
}, [videoUrl]);

<Video source={secureVideoSource} />
```

### 4. App Initialization (`App.tsx`)

**Added:**
- Automatic cache cleanup initialization on app startup
- Background initialization to avoid blocking UI

## How It Works

### Upload Process (Unchanged)
1. Media files are uploaded to Cloudflare R2 using AWS S3 SDK
2. Public URLs are stored in the database (e.g., `videoLink`, `video_Thumbnail` fields)
3. Upload process remains the same - no changes needed

### Media Access Process (New)
1. When media needs to be displayed, `getSecureMediaUrl()` is called
2. Function detects if URL is a Cloudflare URL using `isCloudflareUrl()`
3. If Cloudflare URL detected:
   - Extract object key from URL using `extractKeyFromUrl()`
   - Check cache for existing presigned URL
   - If not cached, generate new presigned URL using AWS S3 SDK
   - Cache the presigned URL for future use
   - Return presigned URL
4. If not Cloudflare URL, return original URL
5. Video/Image components use the processed URL

### Caching Strategy
- Presigned URLs are cached with key: `{objectKey}_{expiresIn}`
- Cache expires 5 minutes before actual URL expiry (safety margin)
- Automatic cleanup every 10 minutes removes expired entries
- Cache is in-memory and resets on app restart

## Security Benefits

1. **Private Bucket**: Media remains private in Cloudflare R2
2. **Time-Limited Access**: Presigned URLs expire (default 1 hour)
3. **No Permanent Public URLs**: No risk of unauthorized long-term access
4. **Fallback Safety**: Falls back to original URL if presigned generation fails

## Performance Benefits

1. **Caching**: Reduces repeated presigned URL generation
2. **Background Processing**: Cache cleanup doesn't block UI
3. **Lazy Loading**: Presigned URLs generated only when needed
4. **Efficient Cleanup**: Automatic removal of expired cache entries

## Testing Instructions

### 1. Upload New Media
1. Upload a video via TipTube or TipShorts
2. Upload an image via Posts or Campaigns
3. Verify upload completes successfully

### 2. Verify Media Visibility
1. Navigate to TipTube screen - videos should play correctly
2. Navigate to TipShorts screen - short videos should play correctly
3. Check Posts feed - images and videos should display correctly
4. Open VideoPlayerModal - videos should play without errors

### 3. Check Console Logs
Look for these log messages indicating the fix is working:
```
[MediaUtils] Detected Cloudflare URL, generating presigned URL
[MediaUtils] Generated presigned URL successfully
[CloudflareUpload] Generated and cached presigned URL for key
```

### 4. Test Error Scenarios
1. Network disconnection during presigned URL generation
2. Invalid Cloudflare URLs
3. Expired presigned URLs (wait 1+ hours)

## Troubleshooting

### Common Issues

**1. "generatePresignedUrlFromPublicUrl is not a function"**
- Ensure CloudflareUploadService is imported as named export: `import { CloudflareUploadService }`

**2. Videos still not playing**
- Check console for presigned URL generation logs
- Verify Cloudflare credentials are correct
- Ensure bucket permissions allow GetObject operations

**3. Performance issues**
- Check cache cleanup is running (logs every 10 minutes)
- Monitor cache size in development

### Debug Commands
```javascript
// Test URL detection
import { isCloudflareUrl } from './src/utils/mediaUtils';
console.log(isCloudflareUrl('https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/test.mp4'));

// Test key extraction
import { CloudflareUploadService } from './src/services/CloudflareUploadService';
console.log(CloudflareUploadService.extractKeyFromUrl('https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4'));
```

## Future Improvements

1. **Persistent Cache**: Store presigned URLs in AsyncStorage for app restarts
2. **Batch Generation**: Generate multiple presigned URLs in single request
3. **Background Refresh**: Refresh presigned URLs before expiry
4. **Analytics**: Track presigned URL usage and cache hit rates
5. **Custom Domain**: Use custom domain for Cloudflare URLs for better branding

## Files Modified

- `src/services/CloudflareUploadService.ts` - Added presigned URL generation and caching
- `src/utils/mediaUtils.ts` - Enhanced URL processing for Cloudflare media
- `src/screens/media/VideoScreen.tsx` - Updated to use secure video sources
- `src/components/tiptube/VideoPlayerModal.tsx` - Updated to use secure video sources
- `src/screens/media/ShortsScreen.tsx` - Updated to use secure video sources
- `App.tsx` - Added cache cleanup initialization

## Files Added

- `src/utils/__tests__/mediaUtils.test.ts` - Unit tests for media utilities
- `src/services/__tests__/CloudflareUploadService.test.ts` - Unit tests for Cloudflare service
- `CLOUDFLARE_MEDIA_FIX.md` - This documentation file
