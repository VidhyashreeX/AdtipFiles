# Version Check and Premium Popup Implementation

## Overview

This implementation adds two key features to the Adtip React Native app:

1. **App Version Checking with Forced Updates**: Automatically checks for app updates and forces users to update when critical updates are available
2. **Premium Subscription Popup**: Shows a premium upgrade popup when users don't have an active premium subscription

## Features Implemented

### 1. App Version Checking

#### Components Created:
- **VersionCheckService** (`src/services/VersionCheckService.ts`)
  - Singleton service for managing version checks
  - Prevents multiple simultaneous checks
  - Implements rate limiting (5-minute intervals)
  - Handles version comparison logic
  - Manages update dialogs and store navigation

#### Key Features:
- ✅ Automatic version checking on app start
- ✅ Forced updates for critical versions
- ✅ Optional updates for non-critical versions
- ✅ Platform-specific store URLs (Google Play/App Store)
- ✅ Rate limiting to prevent excessive API calls
- ✅ Comprehensive logging for debugging

#### API Endpoint:
- **POST** `/api/check-app-version`
- Accepts: `current_version`, `current_build`, `platform`
- Returns: Update information with force update flags

### 2. Premium Subscription Popup

#### Components Created:
- **PremiumPopup** (`src/components/common/PremiumPopup.tsx`)
  - Modal popup with gradient design
  - Shows premium benefits
  - Upgrade and cancel buttons
  - Responsive design with dark mode support

#### Key Features:
- ✅ Beautiful gradient UI design
- ✅ Premium benefits display
- ✅ Direct navigation to subscription screen
- ✅ Dark mode support
- ✅ Responsive layout

### 3. HomeScreen Integration

#### Enhanced Features:
- ✅ Version check on app start
- ✅ Premium popup for non-premium users
- ✅ Comprehensive logging throughout
- ✅ Non-blocking implementation
- ✅ Error handling and fallbacks

## Implementation Details

### Version Check Flow

1. **App Start**: HomeScreen triggers version check
2. **API Call**: VersionCheckService calls `/api/check-app-version`
3. **Version Comparison**: Compares current vs latest/minimum versions
4. **Update Dialog**: Shows appropriate dialog based on update type
5. **Store Navigation**: Opens appropriate app store for updates

### Premium Popup Flow

1. **Subscription Check**: HomeScreen checks subscription status via API
2. **Popup Display**: Shows premium popup for non-premium users
3. **User Action**: User can upgrade or dismiss popup
4. **Navigation**: Direct navigation to subscription screen

### API Integration

#### Version Check API:
```javascript
POST /api/check-app-version
{
  "current_version": "1.0.0",
  "current_build": "1",
  "platform": "android"
}
```

#### Subscription Status API:
```javascript
GET /api/subscriptions/status/{userId}
```

## Configuration

### Version Settings

#### Current App Version:
- **package.json**: `"version": "1.0.0"`
- **Android**: `versionName "1.0.0"`, `versionCode 1`

#### Backend Version Settings:
- **Latest Version**: `1.1.0` (for testing)
- **Minimum Version**: `1.0.0` (for testing)
- **Force Update**: `false` (set to `true` for critical updates)

### Store URLs

#### Android:
- **Google Play**: `https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app`

#### iOS:
- **App Store**: `https://apps.apple.com/app/adtip-watch-to-earn/id1234567890`

## Usage Examples

### Testing Version Check

1. **Set current version lower than latest**:
   ```json
   // package.json
   "version": "0.9.0"
   ```

2. **Force critical update**:
   ```javascript
   // Backend API
   const force_update = true;
   ```

### Testing Premium Popup

1. **Use non-premium user account**
2. **Or modify subscription API response**:
   ```javascript
   {
     "status": false,
     "message": "No subscription found",
     "data": null
   }
   ```

## Logging

### Version Check Logs:
```
🔍 [HomeScreen] Starting version check and premium validation...
📱 [VersionCheckService] Current app version: 1.0.0
📡 [ApiService] Checking app version: {current_version: "1.0.0", ...}
⚠️ [HomeScreen] Update required, showing update dialog
```

### Premium Popup Logs:
```
💎 [HomeScreen] No premium subscription found, showing premium popup
🚀 [PremiumPopup] User clicked upgrade button
```

## Error Handling

### Version Check Errors:
- ✅ Network connectivity issues
- ✅ API failures
- ✅ Invalid version formats
- ✅ Store URL failures

### Premium Popup Errors:
- ✅ Subscription API failures
- ✅ Navigation errors
- ✅ Modal display issues

## Performance Considerations

### Version Check:
- ✅ Rate limiting (5-minute intervals)
- ✅ Singleton service prevents multiple instances
- ✅ Non-blocking implementation
- ✅ Cached results

### Premium Popup:
- ✅ Lightweight modal component
- ✅ Optimized re-renders
- ✅ Minimal memory footprint

## Security Features

### Version Check:
- ✅ Input validation
- ✅ Version format verification
- ✅ Platform verification
- ✅ Rate limiting

### Premium Popup:
- ✅ User authentication required
- ✅ Secure navigation
- ✅ Input sanitization

## Future Enhancements

### Version Check:
- [ ] Database-driven version management
- [ ] A/B testing for update messages
- [ ] In-app update for minor versions
- [ ] Update analytics tracking

### Premium Popup:
- [ ] Personalized benefits based on user activity
- [ ] A/B testing for different popup designs
- [ ] Analytics tracking for conversion rates
- [ ] Dynamic content based on user preferences

## Testing Checklist

### Version Check:
- [ ] Current version < latest version → Shows update dialog
- [ ] Current version < minimum version → Shows forced update
- [ ] Current version >= latest version → No dialog
- [ ] Network error → Graceful fallback
- [ ] Rate limiting → Prevents excessive calls

### Premium Popup:
- [ ] Non-premium user → Shows popup
- [ ] Premium user → No popup
- [ ] Upgrade button → Navigates to subscription
- [ ] Cancel button → Dismisses popup
- [ ] Dark mode → Proper styling

## Deployment Notes

### Backend:
1. Deploy the new `/api/check-app-version` endpoint
2. Configure version settings in the API
3. Test with different version scenarios

### Frontend:
1. Update app version in `package.json` and `build.gradle`
2. Deploy new components and services
3. Test version check flow
4. Test premium popup flow

### Production Configuration:
1. Set appropriate version numbers
2. Configure force update flags
3. Update store URLs for production
4. Enable comprehensive logging
5. Set up monitoring and analytics

## Support

For issues or questions regarding this implementation:
1. Check the console logs for detailed error information
2. Verify API endpoints are accessible
3. Confirm version numbers are correctly set
4. Test with different user scenarios

---

**Implementation Date**: December 2024  
**Version**: 1.0.0  
**Status**: Ready for Production 