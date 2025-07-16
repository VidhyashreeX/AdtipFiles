# Deep Link Testing Guide

## Overview
This guide provides comprehensive testing instructions for the updated deep linking system across all screens in the Adtip app.

## Updated Screens and Share Functionality

### ✅ HomeScreen
- **Share Button**: Updated to use ShareService
- **Deep Link Pattern**: `adtip://post/:postId` or `https://adtip.in/post/:postId`
- **Test**: Share a post from HomeScreen and verify the generated link

### ✅ PostViewerScreen  
- **Share Button**: Updated to use ShareService
- **Deep Link Reception**: Can receive `postId` parameter
- **Test**: Navigate via deep link `adtip://post/123`

### ✅ VideoPlayerModalScreen
- **Share Button**: Updated to use ShareService with VIDEO_PLAYER pattern
- **Deep Link Pattern**: `adtip://watch/:videoId` or `https://adtip.in/watch/:videoId`
- **Test**: Share a video and verify the generated link

### ✅ TipShortsEnhancedScreen (EnhancedShortCard)
- **Share Button**: Updated to use ShareService
- **Deep Link Pattern**: `adtip://short/:shortId` or `https://adtip.in/short/:shortId`
- **Test**: Share a short video and verify the generated link

### ✅ UserProfileScreen
- **Share Button**: Added new share functionality
- **Deep Link Pattern**: `adtip://user/:userId` or `https://adtip.in/user/:userId`
- **Test**: Share a user profile and verify the generated link

### ✅ TipTubeScreen
- **Note**: Shares through VideoPlayerModal (no direct share buttons)
- **Deep Link Reception**: Can receive video deep links through VideoPlayerModal

## Testing Commands

### Android Testing
```bash
# Test post deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://post/123" com.adtip.app.adtip_app

# Test video deep link  
adb shell am start -W -a android.intent.action.VIEW -d "adtip://watch/456" com.adtip.app.adtip_app

# Test short video deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://short/789" com.adtip.app.adtip_app

# Test user profile deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://user/101" com.adtip.app.adtip_app
```

### iOS Testing
```bash
# Test post deep link
xcrun simctl openurl booted "adtip://post/123"

# Test video deep link
xcrun simctl openurl booted "adtip://watch/456"

# Test short video deep link  
xcrun simctl openurl booted "adtip://short/789"

# Test user profile deep link
xcrun simctl openurl booted "adtip://user/101"
```

### Universal Links Testing
```bash
# Test universal links (replace with actual domain)
https://adtip.in/post/123
https://adtip.in/watch/456
https://adtip.in/short/789
https://adtip.in/user/101
```

## Test Scenarios

### 1. Share Button Functionality
- [ ] HomeScreen: Tap share on a post → Verify ShareService is called
- [ ] PostViewerScreen: Tap share on a post → Verify ShareService is called  
- [ ] VideoPlayerModal: Tap share on a video → Verify ShareService is called
- [ ] TipShorts: Tap share on a short → Verify ShareService is called
- [ ] UserProfile: Tap share profile → Verify ShareService is called

### 2. Deep Link Reception
- [ ] Post deep link → Should navigate to PostViewer with correct postId
- [ ] Video deep link → Should navigate to VideoPlayerModal with correct videoId
- [ ] Short deep link → Should navigate to TipShorts with correct shortId
- [ ] User deep link → Should navigate to UserProfile with correct userId

### 3. Share Content Verification
- [ ] Shared links should use proper deep link format
- [ ] Universal links should be used when specified
- [ ] App name should be included when specified
- [ ] Custom messages should work correctly

### 4. Error Handling
- [ ] Invalid deep links should fallback gracefully
- [ ] Network errors during sharing should show fallback
- [ ] Missing parameters should be handled properly

## Expected Behavior

### Share Flow
1. User taps share button
2. ShareService generates proper deep link
3. Native share dialog opens with formatted message
4. Link includes app name and proper URL structure

### Deep Link Flow  
1. User clicks/taps deep link
2. App opens (or switches to foreground)
3. DeepLinkService parses URL
4. Navigation occurs to correct screen with parameters
5. Screen loads with correct content

## Troubleshooting

### Common Issues
1. **Share button not working**: Check ShareService import and function call
2. **Deep link not opening app**: Verify URL scheme registration
3. **Wrong screen navigation**: Check DeepLinkService parsing logic
4. **Missing parameters**: Verify parameter passing in navigation

### Debug Steps
1. Check console logs for ShareService and DeepLinkService
2. Verify deep link patterns in deepLinkConfig.ts
3. Test with simple deep links first
4. Verify navigation stack is ready

## Success Criteria
- ✅ All share buttons use ShareService
- ✅ All screens can receive appropriate deep links
- ✅ Deep links generate correctly formatted URLs
- ✅ Navigation works properly for all link types
- ✅ Error handling works for edge cases
