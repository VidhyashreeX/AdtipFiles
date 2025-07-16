# Deep Linking Implementation Guide for Adtip

This guide provides comprehensive documentation for the deep linking implementation in the Adtip React Native application.

## Overview

Deep linking allows users to navigate directly to specific screens within the app using URLs. This implementation supports both custom URL schemes (`adtip://`) and universal links (`https://adtip.in`).

## Features Implemented

### 1. Custom URL Scheme Support
- **Scheme**: `adtip://`
- **Example**: `adtip://post/123`

### 2. Universal Links Support
- **Domains**:
  - `https://adtip.in`
  - `https://www.adtip.in`
  - `https://app.adtip.in`
- **Example**: `https://adtip.in/post/123`

### 3. Comprehensive Screen Coverage
- **Content**: Posts, Short Videos, Videos, Stories
- **Profiles**: User profiles, followers, following
- **Communication**: Chat, Comments, Video calls
- **Commerce**: Shop, Products, Cart
- **Financial**: Wallet, Earnings, Transactions
- **Settings**: App settings, Profile editing
- **Entertainment**: Games, Live streams, Challenges

## File Structure

```
src/
├── config/
│   └── deepLinkConfig.ts          # URL patterns and navigation config
├── services/
│   ├── DeepLinkService.ts         # Core deep linking logic
│   └── ShareService.ts            # Sharing functionality
└── utils/
    └── deepLinkTestUtils.ts       # Testing utilities
```

## Configuration Files

### Android Configuration
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Features**:
  - Custom scheme intent filters
  - Universal links with auto-verification
  - Multiple domain support

### iOS Configuration
- **Files**: 
  - `ios/Adtip/Info.plist`
  - `ios/Adtip/AppDelegate.swift`
- **Features**:
  - URL scheme registration
  - Associated domains for universal links
  - Proper URL handling in AppDelegate

## URL Patterns

### Content URLs
```
adtip://post/123                    # Post detail
adtip://short/abc123                # Short video
adtip://video/456                   # Video detail
adtip://story/xyz789                # Story view
```

### User Profile URLs
```
adtip://user/789                    # User profile
adtip://user/789/followers          # User followers
adtip://user/789/following          # User following
```

### Communication URLs
```
adtip://chat/101                    # Chat with user
adtip://call/meeting123             # Video call
adtip://post/123/comments           # Post comments
```

### Commerce URLs
```
adtip://shop                        # Shop home
adtip://shop/product/202            # Product detail
adtip://shop/cart                   # Shopping cart
```

### Financial URLs
```
adtip://wallet                      # Wallet
adtip://earnings                    # Earnings
adtip://wallet/transactions         # Transaction history
```

## Implementation Details

### 1. Deep Link Service (`DeepLinkService.ts`)

The core service handles:
- URL parsing and validation
- Screen navigation
- Parameter extraction
- Error handling

```typescript
// Initialize the service
deepLinkService.initialize();

// Handle incoming deep link
deepLinkService.handleDeepLink(url);

// Parse deep link manually
const parsed = deepLinkService.parseDeepLink(url);
```

### 2. Share Service (`ShareService.ts`)

Provides sharing functionality:
- Generate shareable links
- Share content across platforms
- Copy links to clipboard

```typescript
// Share a post
await shareService.sharePost(123, 'Amazing post!');

// Share user profile
await shareService.shareProfile(789, 'John Doe');

// Share with custom options
await shareService.sharePost(123, 'Title', {
  useUniversalLink: true,
  includeAppName: true
});
```

### 3. Configuration (`deepLinkConfig.ts`)

Centralized configuration for:
- URL patterns
- Navigation mappings
- Link generation

```typescript
// Generate deep link
const link = generateDeepLink('POST', { postId: '123' });

// Generate universal link
const universalLink = generateUniversalLink('POST', { postId: '123' });
```

## Testing

### Automated Testing
```typescript
import { runAllDeepLinkTests } from '../utils/deepLinkTestUtils';

// Run all test cases
runAllDeepLinkTests();
```

### Manual Testing

#### Android Testing
```bash
# Test with ADB
adb shell am start -W -a android.intent.action.VIEW -d "adtip://post/123" com.adtip.app

# Test with URI scheme package
npx uri-scheme open "adtip://post/123" --android
```

#### iOS Testing
```bash
# Test with Simulator
xcrun simctl openurl booted "adtip://post/123"

# Test with URI scheme package
npx uri-scheme open "adtip://post/123" --ios
```

### Test Cases Covered
- ✅ Home navigation
- ✅ Content screens (posts, videos, shorts)
- ✅ User profiles and social features
- ✅ Communication (chat, calls, comments)
- ✅ Commerce (shop, products)
- ✅ Financial (wallet, earnings)
- ✅ Settings and configuration
- ✅ Universal links
- ✅ Parameter parsing
- ✅ Error handling

## Updated Share Functionality

### ✅ Screens with Updated Share Buttons

#### HomeScreen
- **Location**: PostItem component share button
- **Implementation**: Uses `shareService.sharePost()` with proper deep link generation
- **Deep Link Pattern**: `adtip://post/:postId` or `https://adtip.in/post/:postId`
- **Features**: Universal links, app name inclusion, fallback handling

#### PostViewerScreen
- **Location**: PostItem component share button
- **Implementation**: Uses `shareService.sharePost()` with post title extraction
- **Deep Link Pattern**: `adtip://post/:postId` or `https://adtip.in/post/:postId`
- **Features**: Dynamic post title, universal links, error handling

#### VideoPlayerModalScreen
- **Location**: Action buttons section
- **Implementation**: Uses `shareService.shareVideo()` with VIDEO_PLAYER pattern
- **Deep Link Pattern**: `adtip://watch/:videoId` or `https://adtip.in/watch/:videoId`
- **Features**: Video title inclusion, proper video player navigation

#### TipShortsEnhancedScreen (EnhancedShortCard)
- **Location**: Right-side action buttons
- **Implementation**: Uses `shareService.shareShort()` with channel name
- **Deep Link Pattern**: `adtip://short/:shortId` or `https://adtip.in/short/:shortId`
- **Features**: Channel name inclusion, short video specific handling

#### UserProfileScreen
- **Location**: Action buttons (for others) and main button (for own profile)
- **Implementation**: Uses `shareService.shareProfile()` with user name
- **Deep Link Pattern**: `adtip://user/:userId` or `https://adtip.in/user/:userId`
- **Features**: User name inclusion, separate buttons for own/other profiles

#### TipTubeScreen
- **Note**: Shares through VideoPlayerModal (no direct share buttons)
- **Implementation**: Inherits VideoPlayerModal share functionality
- **Deep Link Reception**: Can receive video deep links through VideoPlayerModal

## Backend Support

## Enhanced Deep Link Reception

### ✅ Screen Deep Link Support

#### PostViewerScreen
- **Receives**: `adtip://post/:postId` or `https://adtip.in/post/:postId`
- **Parameters**: `postId` (number)
- **Behavior**: Fetches single post data and displays in full-screen viewer
- **API Integration**: Uses `ApiService.listPosts()` with specific post_id

#### VideoPlayerModalScreen
- **Receives**: `adtip://watch/:videoId` or `https://adtip.in/watch/:videoId`
- **Parameters**: `videoId` (number)
- **Behavior**: Opens video in full-screen modal player
- **Navigation**: Direct navigation to VideoPlayerModal screen

#### TipShortsEnhancedScreen
- **Receives**: `adtip://short/:shortId` or `https://adtip.in/short/:shortId`
- **Parameters**: `shortId` (string)
- **Behavior**: Navigates to TipShorts screen with specific short video
- **Features**: Auto-play specific short video

#### UserProfileScreen
- **Receives**: `adtip://user/:userId` or `https://adtip.in/user/:userId`
- **Parameters**: `userId` (number)
- **Behavior**: Opens user profile with all user data
- **Features**: Shows posts, followers, following, and action buttons

#### HomeScreen
- **Receives**: `adtip://` or `https://adtip.in/`
- **Behavior**: Navigates to main home feed
- **Features**: Default landing screen for app deep links

### Deep Link Patterns Added
- `VIDEO_PLAYER: '/watch/:videoId'` - For VideoPlayerModal navigation
- Enhanced parsing in DeepLinkService for 'watch' URLs
- Proper parameter passing for all screen types

### API Endpoints
- `POST /api/deeplink/generate` - Generate deep links
- `POST /api/deeplink/validate` - Validate deep links
- `GET /api/deeplink/metadata/:type/:id` - Get sharing metadata
- `GET /api/post/:postId` - Get single post for deep linking

### Universal Link Handling
- Automatic app/store redirection
- Social media metadata
- SEO-friendly fallbacks

## Usage Examples

### Basic Navigation
```typescript
// Navigate to a post
deepLinkService.handleDeepLink('adtip://post/123');

// Navigate to user profile
deepLinkService.handleDeepLink('adtip://user/789');
```

### Sharing Content
```typescript
// Share a post
await shareService.sharePost(123, 'Check out this post!');

// Share with universal link
await shareService.sharePost(123, 'Title', { 
  useUniversalLink: true 
});
```

### Custom Link Generation
```typescript
// Generate custom deep link
const link = generateDeepLink('PROFILE', { userId: '789' });

// Generate universal link
const universalLink = generateUniversalLink('POST', { postId: '123' });
```

## Testing and Validation

### Test Files Created
- `DEEP_LINK_TESTING_GUIDE.md` - Comprehensive testing instructions
- `src/utils/testDeepLinks.ts` - Utility functions for testing deep link generation and parsing

### Validation Commands
```typescript
// Test deep link generation
import { runAllDeepLinkTests, validateResults } from './src/utils/testDeepLinks';

// Run comprehensive tests
await runAllDeepLinkTests();

// Validate expected results
validateResults();
```

### Manual Testing
```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "adtip://post/123" com.adtip.app.adtip_app

# iOS
xcrun simctl openurl booted "adtip://post/123"
```

### Success Criteria
- ✅ All share buttons use ShareService
- ✅ All screens can receive appropriate deep links
- ✅ Deep links generate correctly formatted URLs
- ✅ Navigation works properly for all link types
- ✅ Error handling works for edge cases
- ✅ Universal links work alongside custom schemes
- ✅ Fallback mechanisms work when ShareService fails

## Troubleshooting

### Common Issues

1. **Links not opening app**
   - Verify URL scheme registration
   - Check intent filters (Android)
   - Verify associated domains (iOS)

2. **Navigation not working**
   - Ensure navigation is ready
   - Check screen name mappings
   - Verify parameter parsing

3. **Universal links not working**
   - Verify domain verification
   - Check HTTPS configuration
   - Ensure proper server setup

4. **Share buttons not working**
   - Check ShareService import
   - Verify function parameters
   - Check console logs for errors

5. **Wrong screen navigation**
   - Verify DeepLinkService parsing logic
   - Check deep link patterns in config
   - Ensure screen names match navigation structure

### Debug Tools
```typescript
// Enable debug logging
console.log('[DeepLinkService] Debug mode enabled');

// Test URL parsing
const parsed = deepLinkService.parseDeepLink(url);
console.log('Parsed result:', parsed);

// Validate configuration
validateDeepLinkConfig();
```

## Best Practices

1. **Always validate URLs** before processing
2. **Handle errors gracefully** with fallbacks
3. **Test on both platforms** regularly
4. **Use universal links** for sharing
5. **Provide meaningful fallbacks** for unsupported links
6. **Monitor analytics** for deep link usage
7. **Keep URL patterns consistent** and intuitive

## Security Considerations

1. **Validate all parameters** from deep links
2. **Sanitize user input** before navigation
3. **Implement rate limiting** for sensitive actions
4. **Use HTTPS** for universal links
5. **Verify domain ownership** for associated domains

## Future Enhancements

- [ ] Dynamic link generation
- [ ] A/B testing for link formats
- [ ] Analytics integration
- [ ] Deferred deep linking
- [ ] Branch.io integration
- [ ] Firebase Dynamic Links support

## Support

For issues or questions regarding deep linking implementation:
1. Check the test utilities for debugging
2. Review the configuration files
3. Test with the provided test cases
4. Consult the React Navigation documentation
5. Check platform-specific documentation (Android/iOS)

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Compatibility**: React Native 0.72+, React Navigation 6+
