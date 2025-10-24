# TipTube Upload Endpoint Fix

## Issue
When attempting to upload a video through the TipTube Upload screen, the app was encountering a 404 error:

```
Cannot POST /api/uploadshot
Request failed with status code 404
```

## Root Cause
The React Native app was calling an incorrect API endpoint `/api/uploadshot` which does not exist on the backend. The correct endpoint is `/api/uploadcontent`.

## Solution

### 1. Fixed API Endpoint Constant
**File:** `src/constants/apiEndpoints.ts`

Changed:
```typescript
UPLOAD_SHOT: '/api/uploadshot',
```

To:
```typescript
UPLOAD_SHOT: '/api/uploadcontent',
```

### 2. Fixed ApiService Method
**File:** `src/services/ApiService.ts`

Changed the `uploadShot` method to use the correct endpoint:
```typescript
const response = await this.post('/api/uploadcontent', data);
```

## Backend Endpoint Details

### Correct Endpoint: `/api/uploadcontent`
- **Method:** POST
- **Authentication:** Required (Bearer token)
- **Controller:** `ReelsController.uploadContent`
- **Service:** `ReelsService.uploadContent`

### Expected Request Body:
```typescript
{
  name: string;              // Video title
  isShot: boolean;           // false for TipTube, true for TipShorts
  categoryId: number;        // Video category ID
  channelId: number;         // Channel ID
  videoLink: string;         // Video URL (from R2/Stream)
  videoDesciption: string;   // Video description
  createdby: number;         // User ID
  play_duration: string;     // Duration in HH:MM:SS format
  video_Thumbnail: string;   // Thumbnail URL
  is_paid_promotional?: boolean;  // Optional: Is paid video
  promotional_price?: number;     // Optional: Price per view
}
```

### Backend Mapping:
The backend service accepts multiple field name variations for compatibility:
- `title` or `name` → video title
- `contentType` or `isShot` → content type (0=TipTube, 1=TipShorts, 2=Posts)
- `mediaUrl` or `videoLink` → video URL
- `thumbnailUrl` or `video_Thumbnail` → thumbnail URL
- `contentDescription` or `videoDesciption` → description
- `userId` or `createdby` → user ID
- `duration` or `play_duration` → video duration

## Files Modified
1. `src/constants/apiEndpoints.ts` - Fixed endpoint constant
2. `src/services/ApiService.ts` - Fixed API call in uploadShot method

## Testing
After this fix, the TipTube video upload should work correctly:
1. User selects video and thumbnail
2. Video is compressed (if needed)
3. Files are uploaded to R2/Cloudflare Stream via UnifiedUploadService
4. Video metadata is saved to database via `/api/uploadcontent`
5. Success message is displayed and user is navigated back

## Impact
This fix resolves the video upload failure for:
- TipTube videos (long-form content)
- TipShorts videos (short-form content)
- Both free and paid promotional videos

## Notes
- The endpoint name `/api/uploadshot` was misleading - it was supposed to handle both "shots" (shorts) and videos (TipTube)
- The actual backend endpoint `/api/uploadcontent` is more accurate as it handles all content types (videos, shorts, and posts)
- No backend changes were required - only frontend endpoint correction
