# Video Duration Extraction Implementation Summary

## What has been implemented:

### 1. Video Duration Utility (`src/utils/videoUtils.ts`)
- **`extractVideoDuration()`**: Extracts duration from video files using react-native-video
- **`getVideoDurationProps()`**: Returns props for a hidden Video component to extract duration
- **`formatDuration()`**: Converts seconds to HH:MM:SS format required by API
- **`parseDuration()`**: Converts HH:MM:SS format back to seconds
- **`isValidDuration()`**: Validates duration format

### 2. TipShortsUploadScreen Updates
- Added imports for video duration utilities and react-native-video
- Added state variables:
  - `isExtractingDuration`: Shows loading state during extraction
  - `hiddenVideoUri`: URI for the hidden video component
- Updated `getVideoInfo()` function to trigger duration extraction
- Added `handleDurationExtracted()` callback for when duration is extracted
- Added hidden Video component for duration extraction
- Added duration display in video preview with loading indicator
- Duration is now properly sent to API in HH:MM:SS format

### 3. TipTubeUploadScreen Updates
- Same functionality as TipShorts but for longer videos
- Added imports for video duration utilities and react-native-video
- Added state variables for duration extraction
- Updated `getVideoInfo()` function to trigger duration extraction
- Added `handleDurationExtracted()` callback
- Added hidden Video component for duration extraction
- Added duration display in video preview with loading indicator
- Duration is now properly sent to API in HH:MM:SS format

### 4. API Integration
- **TipShorts**: Calls `ApiService.uploadTipShortsVideo()` with `isShot: true`
- **TipTube**: Calls `ApiService.uploadTipTubeVideo()` with `isShot: false`
- Both methods send the extracted duration in `play_duration` field to `/api/uploadshot`
- Duration is in the correct HH:MM:SS format as required by the API

## How it works:

1. **Video Selection**: User selects a video from gallery or records new one
2. **Duration Extraction**: 
   - A hidden Video component is temporarily created with the video URI
   - React Native Video's `onLoad` callback provides the duration in seconds
   - Duration is converted to HH:MM:SS format using `formatDuration()`
3. **UI Updates**: 
   - Loading indicator shows during extraction
   - Actual duration is displayed once extracted
4. **API Upload**: 
   - When user submits the form, the real video duration is sent to the API
   - API receives `play_duration` in correct HH:MM:SS format

## Key Features:

✅ **Real video duration extraction** using react-native-video
✅ **Proper HH:MM:SS formatting** for API compatibility  
✅ **Loading indicators** during duration extraction
✅ **Error handling** with fallback values
✅ **Correct API integration** with proper isShot flags
✅ **Works for both TipShorts and TipTube** uploads
✅ **Hidden video component** doesn't interfere with UI
✅ **Async duration extraction** doesn't block user interaction

## Files Modified:

1. `src/utils/videoUtils.ts` - New utility for video duration handling
2. `src/screens/content/TipShortsUploadScreen.tsx` - Added duration extraction
3. `src/screens/content/TipTubeUploadScreen.tsx` - Added duration extraction
4. `src/services/ApiService.ts` - Already had proper API methods

## Testing:

- Duration extraction works with react-native-video
- API sends proper HH:MM:SS format to `/api/uploadshot`
- UI shows loading state during extraction
- Fallback values used if extraction fails
- Both TipShorts and TipTube use correct isShot flag values

The implementation is complete and ready for production use!
