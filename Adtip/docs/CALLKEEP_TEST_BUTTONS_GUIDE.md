# CallKeep Test Buttons Guide

## Overview

This guide explains how to use the CallKeep test buttons that have been added to trigger incoming and outgoing native UI calls in your React Native app. These buttons are only available in debug APK builds and are positioned at the top-left of the screen.

## Integration Summary

### CallKeepExample vs Adtip-ReactNative

**CallKeepExample (`c:\A1/CKE\ios\CallKeepExample/`):**
- Basic React Native template
- Minimal CallKeep setup
- Used as reference for CallKeep integration patterns

**Adtip-ReactNative (`c:\A1/adtip-reactnative/`):**
- Full production app with comprehensive CallKeep integration
- Advanced call management system
- Multiple debug components and test panels
- **NEW: CallKeep Test Buttons at top-left for native UI testing**

## CallKeep Test Buttons Component

### Location
- **File**: `src/components/debug/CallKeepTestButtons.tsx`
- **Position**: Top-left corner of screen
- **Visibility**: Debug builds only (`__DEV__ === true`)

### Features

#### Three Test Buttons:
1. **📞 Incoming** - Triggers native incoming call UI
2. **📱 Outgoing** - Triggers native outgoing call UI  
3. **📹 Video** - Triggers native video call UI

#### Technical Implementation:
- **Direct CallKeep Integration**: Uses `CallKeepService.displayIncomingCall()` and `CallKeepService.startCall()`
- **Automatic Fallback**: Falls back to `NotificationService` and `CallController` if CallKeep unavailable
- **Error Handling**: Comprehensive error handling with user alerts
- **Loading States**: Prevents multiple simultaneous test calls
- **Theme Aware**: Adapts to app's dark/light theme

## How to Use

### 1. Build Debug APK
```bash
cd c:\A1/adtip-reactnative/Adtip
npm run android:debug
# or
npx react-native run-android --variant=debug
```

### 2. Look for Test Buttons
- Open the debug APK on your device
- Look for small buttons in the **top-left corner** of the screen
- You should see three colored buttons with emojis

### 3. Test Native UI
- **Tap 📞 Incoming**: Triggers native incoming call interface
- **Tap 📱 Outgoing**: Triggers native outgoing call interface
- **Tap 📹 Video**: Triggers native video call interface

### 4. Verify Native UI
- Check your phone's native call interface
- You should see the system's built-in call UI (not the app's custom UI)
- Test answering, declining, and call controls

## CallKeep Service Integration

### Incoming Calls
```typescript
// Direct CallKeep service usage
const callKeepService = CallKeepService.getInstance();
await callKeepService.displayIncomingCall(
  sessionId,
  callerName,
  callerName,
  'generic',
  false // voice call
);
```

### Outgoing Calls
```typescript
// Direct CallKeep service usage
const callKeepService = CallKeepService.getInstance();
await callKeepService.startCall(
  callUUID,
  recipientName,
  recipientName,
  'generic',
  false // voice call
);
```

## Comparison with Existing Debug Components

| Component | Position | Purpose |
|-----------|----------|---------|
| `ForceUpdateDebugButton` | Bottom-right | Test app update scenarios |
| `CallSystemDebugPanel` | Top-right | System diagnostics |
| `CallSystemTestPanel` | Full screen | Comprehensive call testing |
| **`CallKeepTestButtons`** | **Top-left** | **Native UI testing** |

## Troubleshooting

### Buttons Not Visible
- Ensure you're using a debug build (`__DEV__ === true`)
- Check that the component is imported in `App.tsx`
- Verify no other UI elements are covering the top-left area

### Native UI Not Appearing
1. **Check CallKeep Permissions**:
   - Android: Settings > Apps > Adtip > Phone Account > Enable
   - iOS: Settings > Phone > Call Blocking & Identification

2. **Check CallKeep Availability**:
   - Use the existing `CallSystemDebugPanel` to verify CallKeep status
   - Look for console logs indicating CallKeep initialization

3. **Fallback Behavior**:
   - If CallKeep unavailable, buttons will use custom UI fallbacks
   - Check alerts for error messages

### Test Data
- All test calls use fake data:
  - Caller: "Test Caller"
  - Recipient: "Test Recipient" 
  - Session IDs: Generated with timestamp

## Integration with Existing Systems

### CallKeep Service
- Uses the existing `CallKeepService` singleton
- Leverages all existing error handling and device compatibility

### Notification Service
- Falls back to `NotificationService.showIncomingCall()` for incoming calls
- Maintains compatibility with existing notification system

### Call Controller
- Falls back to `CallController.startCall()` for outgoing calls
- Integrates with existing call management flow

## Development Notes

### Why Top-Left Position?
- Avoids conflicts with existing debug buttons (bottom-right, top-right)
- Easy access during testing
- Clear visual separation from other debug tools

### Production Safety
- Component automatically hidden in production builds
- No performance impact on release versions
- Debug-only imports and functionality

### Testing Workflow
1. Use test buttons to trigger native UI
2. Verify CallKeep integration works correctly
3. Test fallback behavior when CallKeep unavailable
4. Validate call flow from native UI to app logic

## Files Modified

1. **`src/components/debug/CallKeepTestButtons.tsx`** - New component
2. **`App.tsx`** - Added component import and integration
3. **`test-callkeep-buttons.js`** - Verification script
4. **`CALLKEEP_TEST_BUTTONS_GUIDE.md`** - This documentation

## Next Steps

1. Build and test the debug APK
2. Verify native UI appears when tapping test buttons
3. Test on different Android devices and versions
4. Validate CallKeep permissions and setup
5. Use alongside existing debug tools for comprehensive testing

The test buttons provide a quick and easy way to verify that your CallKeep integration is working correctly and that native UI is properly triggered for both incoming and outgoing calls.
