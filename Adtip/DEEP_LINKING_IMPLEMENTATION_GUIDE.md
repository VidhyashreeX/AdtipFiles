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

## Backend Support

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
