# CallKeep Debug Buttons Enhancement & FORCED_LOGOUT Error Fix

## Summary

This document outlines the implementation of two key improvements:

1. **Enhanced CallKeep Debug Test Buttons** - Made draggable and closable for better UX
2. **FORCED_LOGOUT Error Handling** - Improved user experience when reinstalling app without logout

## 1. CallKeep Debug Test Buttons Enhancement

### Changes Made

#### File: `src/components/debug/CallKeepTestButtons.tsx`

**Added Draggable Functionality:**
- Imported `PanResponder`, `Animated`, and `Dimensions`
- Added `pan` and `scale` animation values
- Implemented PanResponder with:
  - Drag gesture detection (5px threshold)
  - Scale animation during drag (1.05x)
  - Snap-to-edge behavior (left/right edges)
  - Screen bounds checking
  - Smooth spring animations

**Added Closable Functionality:**
- Added `isVisible` state management
- Created title bar with close button (×)
- Implemented proper component unmounting when closed
- Theme-aware styling for close button

**Updated Styling:**
- Removed fixed positioning from styles
- Added `titleBar`, `closeButton`, and `closeButtonText` styles
- Added border styling for better visual definition
- Updated container to use `Animated.View`

### Features

✅ **Draggable**: Users can drag the component around the screen
✅ **Snap-to-Edge**: Component snaps to left or right edge when released
✅ **Screen Bounds**: Prevents component from going off-screen
✅ **Closable**: Users can close the component with × button
✅ **Smooth Animations**: Spring animations for natural feel
✅ **Theme-Aware**: Respects app's dark/light theme
✅ **Debug-Only**: Still only shows in debug builds

### Usage

1. Component appears in top-left corner in debug builds
2. Drag anywhere on the component to move it
3. Release to snap to nearest edge
4. Click × button to close/hide
5. Component stays hidden until app restart

## 2. FORCED_LOGOUT Error Handling

### Problem

When users uninstall the app without signing out and then reinstall:
1. Old session token remains stored locally
2. Backend detects token mismatch with `current_session_token`
3. Returns 401 error with `FORCED_LOGOUT` code
4. User sees technical error instead of helpful explanation

### Solution

#### File: `src/services/ApiService.ts`

**Added Imports:**
```typescript
import { Platform, Alert } from 'react-native';
import { navigationRef } from '../navigation/NavigationService';
```

**Enhanced 401 Error Handling:**
- Added specific detection for `FORCED_LOGOUT` error code
- Implemented user-friendly alert with clear explanation
- Added comprehensive data cleanup
- Implemented proper navigation reset
- Differentiated from other 401 errors (no retry for FORCED_LOGOUT)

### Features

✅ **Smart Detection**: Specifically detects `FORCED_LOGOUT` error code
✅ **User-Friendly Message**: Clear explanation of what happened and why
✅ **Complete Cleanup**: Removes all auth data (`accessToken`, `@auth_token`, `user`, `userId`)
✅ **Proper Navigation**: Resets to Auth screen with no back navigation
✅ **No Retry**: Doesn't attempt token refresh for this specific error
✅ **Non-Cancelable Alert**: User must acknowledge before proceeding

### Error Message

```
Title: "Logged Out"

Message: "You have been logged out because your account was accessed from another device. This can happen if:

• You logged in on a different device
• You reinstalled the app without signing out first

Please log in again to continue using the app."
```

## Testing

### CallKeep Debug Buttons Test
- **File**: `test-callkeep-buttons.js`
- **Tests**: 7/7 passed
- **Coverage**: Draggable, closable, and existing functionality

### FORCED_LOGOUT Error Test
- **File**: `test-forced-logout-error.js`
- **Tests**: 6/6 passed
- **Coverage**: Error detection, messaging, cleanup, navigation

## Files Modified

1. **`src/components/debug/CallKeepTestButtons.tsx`** - Enhanced with drag/close
2. **`src/services/ApiService.ts`** - Added FORCED_LOGOUT handling
3. **`test-callkeep-buttons.js`** - Updated tests for new features
4. **`test-forced-logout-error.js`** - New test file for error handling

## Benefits

### CallKeep Debug Buttons
- **Better UX**: Draggable positioning prevents UI conflicts
- **Cleaner Interface**: Closable when not needed
- **Professional Feel**: Smooth animations and proper theming
- **Flexible Positioning**: Snap-to-edge for consistent placement

### FORCED_LOGOUT Error Handling
- **User Understanding**: Clear explanation instead of technical error
- **Reduced Support**: Users understand what happened and how to fix
- **Better Security**: Proper cleanup prevents auth issues
- **Smooth Recovery**: Direct path back to login screen

## Technical Implementation

### Draggable Pattern
- Uses React Native's `PanResponder` for gesture handling
- `Animated.ValueXY` for smooth position tracking
- Spring animations for natural feel
- Screen dimension calculations for bounds checking

### Error Handling Pattern
- Axios interceptor for centralized error handling
- Error code-specific logic for different scenarios
- React Native Alert for user communication
- Navigation service for screen transitions

## Future Considerations

1. **Persistence**: Could save drag position between sessions
2. **Minimize**: Could add minimize functionality like other debug components
3. **Error Logging**: Could add analytics for FORCED_LOGOUT frequency
4. **Recovery Options**: Could offer "Remember Me" option to prevent future issues

## Conclusion

Both enhancements improve the developer and user experience:
- Debug buttons are now more user-friendly and flexible
- FORCED_LOGOUT errors provide clear guidance instead of confusion
- Both implementations follow React Native best practices
- Comprehensive testing ensures reliability
