# Cloudflare Public URL Fix

## Issue Description

The frontend CloudflareUploadService was generating publicly accessible URLs using the raw Cloudflare R2 storage domain (`https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com`), while the backend ReelsService was using a custom domain (`https://theadtip.in`). This inconsistency caused issues with media access and URL generation.

## Root Cause

**Backend ReelsService.js** (line 65):
```javascript
const publicUrl = `${cloudFlareFtpEndpoint}/${folder}/${fileName}`;
// Where cloudFlareFtpEndpoint = "https://theadtip.in"
```

**Frontend CloudflareUploadService.ts** (before fix):
```typescript
const publicUrl = `${CLOUDFLARE_R2_CONFIG.publicUrl}/${key}`;
// Where publicUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com'
```

## Solution

Updated the frontend to use the same custom domain `https://theadtip.in` for generating publicly accessible URLs, ensuring consistency between frontend and backend.

## Changes Made

### 1. Added Custom Domain Configuration

**File:** `src/config/cloudflareConfig.ts`
```typescript
// Custom domain for publicly accessible URLs (matches backend ReelsService.js)
export const CLOUDFLARE_PUBLIC_DOMAIN = "https://theadtip.in";
```

### 2. Updated CloudflareUploadService

**File:** `src/services/CloudflareUploadService.ts`

**Import the new constant:**
```typescript
import {
  CLOUDFLARE_R2_CONFIG,
  UPLOAD_FOLDERS,
  FILE_SIZE_LIMITS,
  SUPPORTED_FORMATS,
  PRESIGNED_URL_EXPIRY,
  CLOUDFLARE_PUBLIC_DOMAIN  // Added this
} from '../config/cloudflareConfig';
```

**Updated uploadFile method (line 271):**
```typescript
// Generate public URL using custom domain (matches backend ReelsService.js)
const publicUrl = `${CLOUDFLARE_PUBLIC_DOMAIN}/${key}`;
```

**Updated generatePresignedUploadUrl method (line 516):**
```typescript
// Generate public download URL using custom domain (matches backend ReelsService.js)
const downloadUrl = `${CLOUDFLARE_PUBLIC_DOMAIN}/${key}`;
```

**Updated extractKeyFromUrl method (line 560):**
```typescript
// Check if this is a Cloudflare R2 URL or our custom domain
if (!url.hostname.includes('r2.cloudflarestorage.com') &&
    !url.hostname.includes(CLOUDFLARE_R2_CONFIG.accountId) &&
    !url.hostname.includes('theadtip.in')) {
  return null;
}
```

### 3. Updated Media Utils

**File:** `src/utils/mediaUtils.ts`

**Updated isCloudflareUrl function:**
```typescript
export const isCloudflareUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('r2.cloudflarestorage.com') ||
           urlObj.hostname.includes('94e2ffe1e7d5daf0d3de8d11c55dd2d6') ||
           urlObj.hostname.includes('theadtip.in');  // Added this
  } catch {
    return false;
  }
};
```

## Impact

### Before Fix
- Frontend generated URLs: `https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/filename.mp4`
- Backend generated URLs: `https://theadtip.in/videos/filename.mp4`
- **Result:** Inconsistent URL formats

### After Fix
- Frontend generated URLs: `https://theadtip.in/videos/filename.mp4`
- Backend generated URLs: `https://theadtip.in/videos/filename.mp4`
- **Result:** Consistent URL formats across the entire application

## Benefits

1. **Consistency:** Both frontend and backend now generate the same URL format
2. **Branding:** Uses custom domain instead of raw Cloudflare storage URLs
3. **Compatibility:** Ensures all media URLs work consistently across the application
4. **Future-proof:** Easier to maintain and update URL generation logic

## Testing

To verify the fix is working:

1. **Upload a video/image** using TipShorts or TipTube upload screens
2. **Check the console logs** for the generated URLs
3. **Verify the URLs** sent to the backend use `https://theadtip.in` domain
4. **Test media playback** to ensure URLs are accessible

### Expected Console Output
```
[CloudflareUpload] Upload successful: {
  key: "videos/filename.mp4",
  url: "https://theadtip.in/videos/filename.mp4"  // Should use custom domain
}
```

## Files Modified

- `src/config/cloudflareConfig.ts` - Added CLOUDFLARE_PUBLIC_DOMAIN constant
- `src/services/CloudflareUploadService.ts` - Updated URL generation methods
- `src/utils/mediaUtils.ts` - Updated URL detection function

## Backward Compatibility

This change is backward compatible. Existing URLs in the database will continue to work, and the media utils will properly handle both old and new URL formats for presigned URL generation.
