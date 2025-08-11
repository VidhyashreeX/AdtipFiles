# CallKeep Blank Screen Fix - Complete Solution

## Problem Description

After implementing the Vivo device CallKeep fix, the app was showing a white blank screen, indicating that the CallKeep initialization was still blocking the UI thread despite the timeout mechanisms.

## Root Cause Analysis

The blank screen was caused by:

1. **Synchronous Blocking**: Even with timeouts, the CallKeep initialization was still blocking the main thread
2. **Promise Awaiting**: The `await` calls in the initialization hook were preventing the UI from rendering
3. **Import Timing**: Dynamic imports were happening too early in the component lifecycle
4. **Multiple Initialization Points**: CallKeep was being initialized from multiple places simultaneously

## Implemented Solutions

### 1. Complete Non-Blocking Initialization

**Before (Blocking)**:
```javascript
const result = await Promise.race([initPromise, timeoutPromise]);
```

**After (Non-Blocking)**:
```javascript
// Fire and forget - don't await the result
callKeepService.initialize()
  .then((result) => { /* handle success */ })
  .catch((error) => { /* handle error */ });
```

### 2. Enhanced Timing Control

- **setImmediate()**: Ensures initialization runs after all current UI updates
- **Increased Delay**: Extended delay from 2s to 3s for UI stability
- **Background Execution**: All CallKeep operations run in background

### 3. Emergency Disable Mechanism

Added a safety flag to completely disable CallKeep if needed:

```javascript
private static DISABLE_CALLKEEP = false // Emergency disable flag

static setCallKeepEnabled(enabled: boolean): void {
  CallKeepService.DISABLE_CALLKEEP = !enabled
}
```

### 4. Problematic Device Handling

Enhanced device detection with immediate bailout:

```javascript
// For problematic devices, skip CallKeep entirely to prevent crashes
if (this.isVivoDevice && this.initializationAttempts === 1) {
  console.log('[CallKeepService] ðŸš« Skipping CallKeep initialization on problematic device')
  this.isInitialized = true
  this.callKeepAvailable = false
  return false
}
```

## Key Changes Made

### 1. useCallKeepInitializer.ts

```javascript
// Completely non-blocking initialization
const initializeCallKeep = () => {
  setImmediate(() => {
    setTimeout(async () => {
      // Fire and forget - no await blocking
      callKeepService.initialize()
        .then((result) => { /* success */ })
        .catch((error) => { /* error */ });
    }, 3000); // Increased delay
  });
};
```

### 2. CallKeepService.ts

```javascript
// Emergency disable check at start of initialize()
if (CallKeepService.DISABLE_CALLKEEP) {
  this.isInitialized = true
  this.callKeepAvailable = false
  return false
}

// Immediate bailout for problematic devices
if (this.isVivoDevice && this.initializationAttempts === 1) {
  // Skip initialization entirely
  return false
}
```

## Benefits

1. **No More Blank Screen**: App UI renders immediately without waiting for CallKeep
2. **Graceful Degradation**: App works perfectly even if CallKeep fails completely
3. **Emergency Control**: Can disable CallKeep entirely if needed
4. **Better Performance**: Non-blocking initialization improves app startup time
5. **Device Compatibility**: Enhanced handling for problematic devices

## Testing Instructions

### Automated Testing
Run the test script:
```bash
node test-blank-screen-fix.js
```

### Manual Testing
1. **Vivo Device Test**: Install on Vivo device and verify no blank screen
2. **Startup Speed**: App should load immediately without delays
3. **CallKeep Functionality**: Verify calls work with or without CallKeep
4. **Background Logs**: Check that CallKeep logs appear 3+ seconds after startup

### Emergency Commands
If issues persist, use these commands in the app:

```javascript
// Disable CallKeep completely
CallKeepService.setCallKeepEnabled(false)

// Re-enable CallKeep
CallKeepService.setCallKeepEnabled(true)

// Check current status
CallKeepService.getInstance().getDeviceInfo()
```

## Monitoring and Debugging

### Console Logs to Watch For

**Successful Flow**:
```
[useCallKeepInitializer] ðŸš€ CallKeep initialization started in background
[CallKeepService] ðŸ”„ Initializing CallKeep (attempt 1/3)...
[CallKeepService] âœ… Initialization complete (non-blocking)
```

**Problematic Device Flow**:
```
[CallKeepService] ðŸ“± Potentially problematic device detected
[CallKeepService] ðŸš« Skipping CallKeep initialization on problematic device
```

**Emergency Disable Flow**:
```
[CallKeepService] ðŸš« CallKeep disabled via emergency flag
```

## Fallback Behavior

When CallKeep is unavailable or disabled:
- âœ… App continues to function normally
- âœ… Calls work through app UI instead of native call UI
- âœ… Notifications use app notifications instead of native call notifications
- âœ… All other functionality remains intact

## Files Modified

1. **`src/hooks/useCallKeepInitializer.ts`** - Made initialization completely non-blocking
2. **`src/services/calling/CallKeepService.ts`** - Added emergency disable and device bailout
3. **`test-blank-screen-fix.js`** - Test script for verification
4. **`CALLKEEP_BLANK_SCREEN_FIX.md`** - This documentation

## Emergency Rollback

If issues persist, the emergency disable can be activated:

```javascript
// In App.tsx or any initialization file
import CallKeepService from './src/services/calling/CallKeepService'
CallKeepService.setCallKeepEnabled(false)
```

This completely disables CallKeep while maintaining all other app functionality.

# CallKeep Integration Example

## Quick Integration Guide

### 1. Add Permission Guide to Your Home Screen

```typescript
// In your Home screen component (src/scenes/home/index.js)
import { useCallKeepPermissions } from '../../hooks/useCallKeepPermissions'
import { CallKeepPermissionGuide } from '../../components/callkeep/CallKeepPermissionGuide'

export default function Home({ navigation }) {
  // Your existing state...
  const { hasPermissions, showGuide, hideGuide, showPermissionGuide } = useCallKeepPermissions()

  return (
    <KeyboardAvoidingView style={/* your styles */}>
      {/* Your existing UI */}
      
      {/* Add this permission guide */}
      <CallKeepPermissionGuide
        visible={showGuide}
        onClose={hideGuide}
        onPermissionGranted={() => {
          console.log('CallKeep permissions granted!')
          // Optionally show a success message
        }}
      />
    </KeyboardAvoidingView>
  )
}
```

### 2. Add Permission Status Indicator (Optional)

```typescript
// Add this to show permission status in your UI
const PermissionStatus = () => {
  const { hasPermissions, isChecking } = useCallKeepPermissions()
  
  if (isChecking) {
    return <Text>Checking CallKeep permissions...</Text>
  }
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Text>{hasPermissions ? 'âœ…' : 'âš ï¸'}</Text>
      <Text style={{ marginLeft: 8 }}>
        Native Call UI: {hasPermissions ? 'Enabled' : 'Disabled'}
      </Text>
      {!hasPermissions && (
        <TouchableOpacity 
          onPress={showPermissionGuide}
          style={{ marginLeft: 10, padding: 5, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Enable</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

### 3. Debug Screen Integration (Temporary)

```typescript
// Add to your navigation stack for debugging
import { CallKeepDebugScreen } from './src/components/debug/CallKeepDebugScreen'

// In your navigation stack
<Screen
  name="CallKeepDebug"
  component={CallKeepDebugScreen}
  options={{ headerShown: true, title: 'CallKeep Debug' }}
/>

// Navigate to it for testing
navigation.navigate('CallKeepDebug')
```

## Testing Steps

### 1. Test Current Status
1. Run your app
2. Check the console logs for CallKeep initialization
3. Look for: `[CallKeepService] âœ… CallKeep initialization successful`

### 2. Test Permission Flow
1. Navigate to the debug screen (if added)
2. Tap "Test CallKeep Service" - should show initialization status
3. Tap "Test Permissions" - should show permission status
4. Tap "Setup Permissions" - should show the permission guide

### 3. Test Manual Permission Setup
1. If permissions are not granted, the guide will show automatically
2. Follow the steps in the guide:
   - Tap "Open Settings"
   - Find Adtip in the app list
   - Look for "Phone Account" or "Calling accounts"
   - Toggle it ON
   - Return to the app
   - Tap "Check Again"

### 4. Test Incoming Call
1. Once permissions are granted
2. Use the debug screen "Test Incoming Call" button
3. You should see the native Android call interface

## Expected Behavior

### âœ… Success Case
- CallKeep initializes without errors
- Permissions are granted (automatically or manually)
- Incoming calls show in native Android interface
- Console shows: `[CallKeepService] âœ… CallKeep initialization successful`

### âš ï¸ Needs Manual Setup
- CallKeep initializes but permissions not granted
- Console shows: `[CallKeepService] âš ï¸ CallKeep permissions not granted, but app will continue`
- Permission guide appears automatically
- User follows manual steps to enable

### âŒ Fallback Case
- CallKeep fails to initialize (rare)
- App continues with custom call UI
- Console shows: `[CallKeepService] ðŸš« CallKeep unavailable after max attempts`

## Common Issues & Solutions

### Issue: "Phone Account not found"
**Solution:** The automatic registration didn't work. Use manual setup:
1. Open Android Settings
2. Apps > Adtip > Phone Account > Enable

### Issue: "Permission guide doesn't show"
**Solution:** Check if the hook is properly imported and used:
```typescript
const { showGuide } = useCallKeepPermissions()
// Make sure showGuide is true when permissions are needed
```

### Issue: "Settings button doesn't work"
**Solution:** Some Android versions have different settings paths. Guide the user:
1. Settings > Apps > Adtip
2. Look for "Phone Account", "Calling accounts", or "Default apps"
3. Enable the phone account for Adtip

## Production Integration

### Recommended Approach
1. **Automatic Detection:** Use `useCallKeepPermissions` hook
2. **User Guidance:** Show permission guide when needed
3. **Graceful Fallback:** App works with custom UI if CallKeep fails
4. **User Choice:** Let users enable/disable native call UI in settings

### User Experience
- Most users won't need to do anything (automatic setup works)
- Some users will see a one-time permission guide
- All users can still make/receive calls regardless of CallKeep status
- Clear feedback about what's happening

## Monitoring

### Key Metrics to Track
- CallKeep initialization success rate
- Permission grant rate (automatic vs manual)
- User completion rate of manual setup
- Call quality/reliability with vs without CallKeep

### Logs to Monitor
```
[CallKeepService] âœ… CallKeep initialization successful
[CallKeepService] âœ… CallKeep permissions granted successfully
[CallKeepService] âš ï¸ CallKeep permissions not granted, but app will continue
[CallKeepService] ðŸ’¡ User needs to manually enable phone account
```

## Next Steps

1. **Test the current implementation** with the debug screen
2. **Add permission guide** to your main app flow
3. **Test on multiple devices** to ensure compatibility
4. **Monitor logs** to understand success/failure rates
5. **Iterate based on user feedback** and analytics

The new implementation should resolve the permission issues and provide a much better user experience for enabling CallKeep functionality.

# CallKeep Permissions Fix

## Problem
The app was logging a warning: `CallKeepService.ts:92 [CallKeepService] âš ï¸ CallKeep permissions not granted (continuing anyway)` but never actually requesting the required permissions from the user.

## Root Cause
- CallKeep permissions were checked during initialization
- When permissions were missing, the app logged a warning and continued
- No automatic permission request flow was implemented
- CallUICoordinator would fall back to custom UI without attempting to request permissions

## Solution Implemented

### 1. Automatic Permission Request in CallKeepService
**File**: `src/services/calling/CallKeepService.ts`

- Modified the initialization flow to automatically request permissions when they're not granted
- Added proper error handling and logging
- Improved the `requestPermissions()` method with better user messaging

```typescript
// Before: Just logged warning and continued
if (!hasPermissions) {
  console.warn('[CallKeepService] âš ï¸ CallKeep permissions not granted (continuing anyway)')
}

// After: Automatically attempts to request permissions
if (!hasPermissions) {
  console.warn('[CallKeepService] âš ï¸ CallKeep permissions not granted, attempting to request...')
  try {
    const permissionRequested = await this.requestPermissions()
    if (permissionRequested) {
      console.log('[CallKeepService] âœ… CallKeep permissions granted after request')
    } else {
      console.warn('[CallKeepService] âš ï¸ CallKeep permissions still not granted after request (continuing anyway)')
    }
  } catch (error) {
    console.warn('[CallKeepService] âš ï¸ Failed to request CallKeep permissions:', error)
  }
}
```

### 2. Smart Permission Handling in CallUICoordinator
**File**: `src/services/calling/CallUICoordinator.ts`

- Modified `shouldUseCallKeep()` to attempt permission request before falling back to custom UI
- Added proper error handling for permission request failures

```typescript
// Before: Immediately fell back to custom UI
if (!hasPermissions) {
  console.log('[CallUICoordinator] CallKeep permissions not granted, using custom UI')
  return false
}

// After: Attempts to request permissions first
if (!hasPermissions) {
  console.log('[CallUICoordinator] CallKeep permissions not granted, attempting to request...')
  try {
    const permissionGranted = await this.requestPermissions()
    if (permissionGranted) {
      console.log('[CallUICoordinator] CallKeep permissions granted, will use CallKeep UI')
      return true
    } else {
      console.log('[CallUICoordinator] CallKeep permissions still denied, using custom UI')
      return false
    }
  } catch (error) {
    console.warn('[CallUICoordinator] Error requesting CallKeep permissions:', error)
    return false
  }
}
```

### 3. Enhanced Permission Management in Settings
**File**: `src/screens/settings/PermissionsScreen.tsx`

- Added CallKeep to the permissions list
- Integrated CallKeep permission checking and requesting
- Added proper state management for CallKeep permissions

### 4. Utility Helper for Permission Management
**File**: `src/utils/callKeepPermissionHelper.ts`

- Created a comprehensive utility class for CallKeep permission management
- Provides user-friendly permission request dialogs
- Includes detailed status checking and reporting
- Can be used throughout the app for proactive permission management

### 5. Comprehensive Test Coverage
**File**: `testing/unit/CallKeepPermissions.test.ts`

- Added unit tests for the permission request flow
- Tests automatic permission requests during initialization
- Tests fallback behavior when permissions are denied
- Tests error handling scenarios

## How It Works Now

### Automatic Flow
1. **App Startup**: CallKeepService initializes and checks permissions
2. **Missing Permissions**: If permissions are missing, automatically requests them
3. **Incoming Call**: CallUICoordinator checks permissions and requests if needed before deciding UI type
4. **Graceful Fallback**: If permissions are denied, falls back to custom notification UI

### Manual Flow
1. **Settings Screen**: Users can manually grant CallKeep permissions
2. **Permission Helper**: Utility functions available for proactive permission requests
3. **Status Checking**: Detailed permission status available for debugging

### User Experience
- **First Time**: User sees permission dialog when CallKeep is first needed
- **Denied Permissions**: App continues to work with custom notification UI
- **Granted Permissions**: Native CallKeep UI provides better user experience

## Benefits

1. **Automatic Resolution**: Permissions are requested automatically when needed
2. **Better UX**: Users get native call experience when permissions are granted
3. **Graceful Degradation**: App continues to work even if permissions are denied
4. **Proactive Management**: Settings screen allows users to manage permissions
5. **Developer Tools**: Utility functions and comprehensive logging for debugging

## Testing

Run the unit tests to verify the fix:
```bash
npm test -- CallKeepPermissions.test.ts
```

## Platform Considerations

- **Android**: Requires explicit phone account permissions for CallKeep
- **iOS**: No additional permissions required beyond basic app permissions
- **Backwards Compatibility**: Maintains compatibility with existing permission flows

## Monitoring

The fix includes comprehensive logging to monitor permission request success:
- `[CallKeepService] âœ… CallKeep permissions granted after request`
- `[CallUICoordinator] CallKeep permissions granted, will use CallKeep UI`
- `[CallKeepPermissionHelper] CallKeep permissions granted`

## Future Enhancements

1. **Onboarding Integration**: Add CallKeep permission request to app onboarding
2. **Analytics**: Track permission grant/deny rates for optimization
3. **User Education**: Add explanatory screens about CallKeep benefits
4. **Retry Logic**: Implement smart retry logic for permission requests

# CallKeep Production Error Fix Guide

## Problem Description

The app was crashing in production builds due to CallKeep native module conflicts. The error showed:
```
com.facebook.react.common.JavascriptException: Error: Exception in HostObject::get for prop 'RNCallKeep'
com.facebook.react.internal.turbomodule.core.TurboModuleInteropUtils$ParsingException: Unable to parse @ReactMethod annotations from native module: RNCallKeep.
Details: Module exports two methods to JavaScript with the same name: "displayIncomingCall"
```

## Root Cause

1. **Duplicate Method Names**: The `react-native-callkeep` library and custom `IncomingCallModule` both export methods with the same name
2. **Native Module Conflicts**: Multiple native modules trying to handle the same functionality
3. **Production vs Development**: Errors that work in development but crash in production builds

## Solutions Implemented

### 1. Removed Custom IncomingCallModule
- **File**: `android/app/src/main/java/com/adtip/app/adtip_app/MainApplication.kt`
- **Change**: Removed `IncomingCallPackage()` registration
- **Reason**: Eliminates duplicate method conflicts

### 2. Added Production Error Handler
- **File**: `src/services/calling/CallKeepErrorHandler.ts`
- **Purpose**: Prevents crashes in production builds
- **Features**:
  - Detects production mode automatically
  - Handles CallKeep initialization errors
  - Handles method call errors
  - Handles native module errors
  - Provides graceful degradation

### 3. Updated CallKeepService
- **File**: `src/services/calling/CallKeepService.ts`
- **Changes**:
  - Integrated with error handler
  - Added production configuration checks
  - Enhanced error handling for `displayIncomingCall` method

### 4. Added Global Error Handler
- **File**: `App.tsx`
- **Purpose**: Catches all React Native errors in production
- **Features**:
  - Prevents app crashes
  - Logs errors for debugging
  - Handles CallKeep-specific errors gracefully

### 5. Production Configuration
- **File**: `src/config/ProductionConfig.ts`
- **Purpose**: Centralized production settings
- **Features**:
  - Disables problematic features in production
  - Configurable error handling
  - Safe defaults for production builds

## How to Build Production APK

### Option 1: Use the provided script
```bash
# Run the batch script
./build-production-apk.bat
```

### Option 2: Manual build
```bash
# Clean the project
cd android
./gradlew clean
cd ..

# Build production APK
cd android
./gradlew assembleRelease
```

## Error Handling Behavior

### Development Mode
- Errors are logged and may crash the app (for debugging)
- CallKeep functionality is fully enabled
- Native modules work normally

### Production Mode
- Errors are caught and logged
- App continues running without crashes
- CallKeep is disabled if errors occur
- Fallback to custom call UI

## Testing the Fix

### 1. Development Testing
```bash
# Run in development mode
npx react-native run-android
```

### 2. Production Testing
```bash
# Build and install production APK
./build-production-apk.bat
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 3. Error Simulation
To test error handling:
1. Install the production APK
2. Open the app
3. Check logs for error handling messages
4. Verify app doesn't crash

## Monitoring and Debugging

### Log Messages to Watch For
- `[CallKeepErrorHandler] Production mode detected: true`
- `[CallKeepService] ðŸš« CallKeep disabled via production configuration`
- `[App] ðŸš« Preventing crash in production build`

### Error Recovery
The app will automatically:
1. Detect production mode
2. Disable CallKeep if errors occur
3. Use custom call UI as fallback
4. Continue app functionality

## Fallback Behavior

When CallKeep is disabled:
1. **Incoming Calls**: Use custom notification UI
2. **Call Management**: Use in-app call interface
3. **Background Calls**: Use system notifications
4. **Call Actions**: Handle through app UI

## Configuration Options

### Enable CallKeep in Production (Not Recommended)
```typescript
// In ProductionConfig.ts
isCallKeepDisabled(): boolean {
  return false; // Enable CallKeep (may cause crashes)
}
```

### Adjust Error Handling
```typescript
// In CallKeepErrorHandler.ts
private maxErrors = 5; // Increase error tolerance
private errorWindowMs = 120000; // 2 minute window
```

## Troubleshooting

### If App Still Crashes
1. Check if all files are properly updated
2. Verify production build is being used
3. Check logs for error messages
4. Ensure no conflicting native modules

### If CallKeep Not Working
1. Check if it's disabled in production
2. Verify permissions are granted
3. Check device compatibility
4. Review error logs

### If Custom Call UI Not Working
1. Verify fallback implementation
2. Check notification permissions
3. Test on different devices
4. Review call flow logic

## Future Improvements

1. **Better Error Detection**: More specific error patterns
2. **User Feedback**: Inform users when features are disabled
3. **Analytics**: Track error frequency and patterns
4. **Auto-Recovery**: Re-enable features when safe

## Files Modified

1. `android/app/src/main/java/com/adtip/app/adtip_app/MainApplication.kt`
2. `src/services/calling/CallKeepErrorHandler.ts` (new)
3. `src/services/calling/CallKeepService.ts`
4. `src/config/ProductionConfig.ts` (new)
5. `App.tsx`
6. `build-production-apk.bat` (new)

## Verification Checklist

- [ ] Production APK builds successfully
- [ ] App opens without crashing
- [ ] CallKeep errors are handled gracefully
- [ ] Custom call UI works as fallback
- [ ] Error logs are properly generated
- [ ] App functionality remains intact
- [ ] No duplicate method conflicts
- [ ] Production configuration is active 
# CallKeep Troubleshooting Guide

## Overview
This guide helps you diagnose and fix CallKeep initialization issues in your React Native video calling app.

## Recent Changes Made

### 1. Simplified CallKeepService Initialization
- **Removed overly restrictive device-specific bailouts** that were preventing CallKeep from working on many devices
- **Simplified permission handling** to reduce timeout issues
- **Added comprehensive error logging** to better understand failures
- **Removed complex timeout logic** that was causing race conditions
- **Added VideoSDK-recommended configuration** based on their proven setup

### 2. Enhanced Error Handling
- Better TypeScript error handling for unknown error types
- More detailed error logging with platform and device information
- Non-blocking initialization that doesn't fail the entire app

### 3. Debug Tools Added
- `CallKeepDebugger` utility for comprehensive diagnostics
- `CallKeepDebugScreen` component for interactive testing
- Enhanced logging in `useCallKeepInitializer`

## How to Debug CallKeep Issues

### Step 1: Check the Logs
Look for these log messages in your console:

```
[useCallKeepInitializer] ðŸ”„ Starting non-blocking CallKeep initialization...
[CallKeepService] ðŸ”„ Initializing CallKeep (attempt 1/3)...
[CallKeepService] ðŸ“± Platform: android, Device: Standard
[CallKeepService] ðŸ”§ Setting up CallKeep with options: {...}
[CallKeepService] âœ… CallKeep setup complete
[CallKeepService] âœ… CallKeep availability set to true
[CallKeepService] ðŸ“‹ Permission check result: true/false
[CallKeepService] âœ… CallKeep initialization successful
```

### Step 2: Use the Debug Tools

#### Option A: Add Debug Screen to Your App
1. Import the debug screen in your navigation:
```typescript
import { CallKeepDebugScreen } from './src/components/debug/CallKeepDebugScreen'
```

2. Add it to your navigation stack temporarily:
```typescript
<Screen
  name="CallKeepDebug"
  component={CallKeepDebugScreen}
  options={{ headerShown: true, title: 'CallKeep Debug' }}
/>
```

3. Navigate to the debug screen and run the tests

#### Option B: Use Debug Utility Directly
```typescript
import { CallKeepDebugger } from './src/utils/callKeepDebugger'

// Run comprehensive diagnostics
await CallKeepDebugger.runDiagnostics()

// Test basic setup
await CallKeepDebugger.testBasicSetup()

// Test permissions
await CallKeepDebugger.testPermissions()
```

### Step 3: Common Issues and Solutions

#### Issue 1: "CallKeep module not available"
**Solution:** Check your installation and linking
```bash
# Reinstall CallKeep
npm uninstall react-native-callkeep
npm install react-native-callkeep

# For React Native 0.60+, auto-linking should work
# For older versions, check manual linking
```

#### Issue 2: "CallKeep permissions not granted"
**Solution:** This is the most common issue. Follow these steps:

**Automatic Setup:**
1. Use the debug screen: "Setup Permissions" button
2. Or use the permission guide component in your app

**Manual Setup:**
1. Open Android Settings
2. Go to Apps > Adtip
3. Look for "Phone Account" or "Calling accounts"
4. Toggle it ON to enable
5. Return to the app

**In Code:**
```typescript
import { useCallKeepPermissions } from './src/hooks/useCallKeepPermissions'
import { CallKeepPermissionGuide } from './src/components/callkeep/CallKeepPermissionGuide'

// In your component
const { hasPermissions, showGuide, hideGuide } = useCallKeepPermissions()

// Show the guide
<CallKeepPermissionGuide
  visible={showGuide}
  onClose={hideGuide}
  onPermissionGranted={() => console.log('Permissions granted!')}
/>
```

#### Issue 3: "Setup timeout" or "Setup failed"
**Solution:** The new implementation removes timeout issues, but if it persists:
- Check if your device supports ConnectionService
- Try on a different device
- Check Android version (Android 6.0+ required)

#### Issue 4: CallKeep works but no incoming call UI
**Solution:** Check permissions and phone account:
```typescript
// Check if phone account is registered
const hasAccount = await RNCallKeep.hasPhoneAccount()
console.log('Has phone account:', hasAccount)

// Check if it's enabled
const isEnabled = await RNCallKeep.checkPhoneAccountEnabled()
console.log('Phone account enabled:', isEnabled)
```

### Step 4: Platform-Specific Checks

#### Android
1. **Check Android version:** CallKeep requires Android 6.0+ (API 23+)
2. **Check permissions in AndroidManifest.xml:**
   - `BIND_TELECOM_CONNECTION_SERVICE`
   - `CALL_PHONE`
   - `READ_PHONE_STATE`
   - `FOREGROUND_SERVICE_PHONE_CALL` (Android 14+)

3. **Check ConnectionService in manifest:**
```xml
<service
    android:name="io.wazo.callkeep.VoiceConnectionService"
    android:label="VoiceConnectionService"
    android:permission="android.permission.BIND_TELECOM_CONNECTION_SERVICE"
    android:foregroundServiceType="phoneCall|camera|microphone"
    android:exported="true">
    <intent-filter>
        <action android:name="android.telecom.ConnectionService" />
    </intent-filter>
</service>
```

#### iOS
1. **Check Info.plist for background modes:**
```xml
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>remote-notification</string>
</array>
```

2. **Check AppDelegate.swift for CallKeep import and setup**

### Step 5: Testing CallKeep Functionality

#### Test 1: Basic Initialization
```typescript
const callKeepService = CallKeepService.getInstance()
const result = await callKeepService.initialize()
console.log('CallKeep available:', result)
```

#### Test 2: Display Incoming Call
```typescript
if (callKeepService.isAvailable()) {
  const uuid = 'test-' + Date.now()
  await callKeepService.displayIncomingCall(
    uuid,
    '+1234567890',
    'Test Caller'
  )
  
  // End after 5 seconds
  setTimeout(() => callKeepService.endCall(uuid), 5000)
}
```

## Expected Behavior

### Successful Initialization
- CallKeep initializes without errors
- Phone account is registered (Android)
- Permissions are granted
- Incoming calls show native UI
- App continues normally even if CallKeep fails

### Graceful Degradation
- If CallKeep fails, app uses custom call UI
- No app crashes or blocking behavior
- Clear logging about what failed and why

## Next Steps

1. **Run the debug tools** to identify the specific issue
2. **Check the logs** for detailed error information
3. **Test on multiple devices** to see if it's device-specific
4. **Verify permissions** are properly granted
5. **Test with a simple incoming call** using the debug screen

## Support Resources

- [VideoSDK CallKeep Guide](https://www.videosdk.live/blog/react-native-android-video-calling-app-with-callkeep)
- [React Native CallKeep NPM](https://www.npmjs.com/package/react-native-callkeep)
- [Android ConnectionService Docs](https://developer.android.com/guide/topics/connectivity/telecom/selfManaged)
- [iOS CallKit Documentation](https://developer.apple.com/documentation/callkit)

## Emergency Disable

If CallKeep is causing critical issues, you can disable it temporarily:

```typescript
// In CallKeepService.ts, set the emergency flag
private static DISABLE_CALLKEEP = true // Set to true to disable
```

This will make the app use custom call UI instead of native CallKeep UI.

# Manual Linking for `react-native-callkeep` - COMPLETED âœ…

This document outlines the manual linking steps that have been completed for `react-native-callkeep` in the Adtip React Native project.

## Overview

Manual linking has been completed for both iOS and Android platforms. This ensures that CallKeep functionality works properly across all devices and React Native versions.

## âœ… Completed Steps

### Android Configuration

#### 1. MainApplication.kt âœ…
- **File**: `android/app/src/main/java/com/adtip/app/adtip_app/MainApplication.kt`
- **Import added**: `import io.wazo.callkeep.RNCallKeepPackage;`
- **Package registered**: `packages.add(RNCallKeepPackage());`

#### 2. MainActivity.kt âœ…
- **File**: `android/app/src/main/java/com/adtip/app/adtip_app/MainActivity.kt`
- **Permission handling added**: `onRequestPermissionsResult` method implemented
- **CallKeep import**: `import io.wazo.callkeep.RNCallKeepModule;`

#### 3. AndroidManifest.xml âœ…
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Permissions added**:
  - `android.permission.BIND_TELECOM_CONNECTION_SERVICE`
  - `android.permission.CALL_PHONE`
  - `android.permission.READ_PHONE_STATE`
  - `android.permission.FOREGROUND_SERVICE_PHONE_CALL`
  - `android.permission.MANAGE_OWN_CALLS`

- **Services configured**:
  - `VoiceConnectionService` (lines 157-168)
  - `RNCallKeepBackgroundMessagingService` (line 169)

#### 4. settings.gradle âœ…
- **File**: `android/settings.gradle`
- **Module included**: 
  ```gradle
  include ':react-native-callkeep'
  project(':react-native-callkeep').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-callkeep/android')
  ```

### iOS Configuration

#### 1. AppDelegate.swift âœ…
- **File**: `ios/Adtip/AppDelegate.swift`
- **Import added**: `import RNCallKeep`
- **User activity handling**: `application(_:continue:restorationHandler:)` method implemented

#### 2. Info.plist âœ…
- **File**: `ios/Adtip/Info.plist`
- **Background modes added**:
  ```xml
  <key>UIBackgroundModes</key>
  <array>
      <string>voip</string>
      <string>remote-notification</string>
  </array>
  ```

### JavaScript Configuration

#### 1. index.js âœ…
- **File**: `index.js`
- **Headless task registered**: `RNCallKeepBackgroundMessage` for background call handling
- **Integration**: Connected with existing `ReliableCallManager`

## ðŸ”§ Custom Patches Applied

### react-native-callkeep@4.3.3 Patch âœ…
- **File**: `patches/react-native-callkeep+4.3.3.patch`
- **Changes**:
  - `displayIncomingCall` â†’ `basicdisplayIncomingCall`
  - `startCall` â†’ `basicstartCall`
- **Auto-applied**: Via `patch-package` on `npm install`

## ðŸ§ª Verification

### Verification Script âœ…
- **File**: `verify-patches.bat`
- **Checks**: Automatically verifies patch application
- **Methods verified**: `basicdisplayIncomingCall` and `basicstartCall`

### Integration Check âœ…
- **File**: `src/utils/callSystemIntegrationCheck.ts`
- **Validates**: Native module availability and method existence

## ðŸš€ Usage

The CallKeep service is now ready for use:

```javascript
import { CallKeepService } from './src/services/calling/CallKeepService';

// Initialize CallKeep
await CallKeepService.initialize();

// Display incoming call
CallKeepService.displayIncomingCall(uuid, handle, localizedCallerName);

// Start outgoing call
CallKeepService.startCall(uuid, handle, localizedCallerName);
```

## ðŸ” Troubleshooting

### Build Issues
1. **Clean and rebuild**:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

2. **iOS clean**:
   - In Xcode: Product â†’ Clean Build Folder
   - `npx react-native run-ios`

3. **Reset Metro cache**:
   ```bash
   npx react-native start --reset-cache
   ```

### Permission Issues
- Ensure all required permissions are granted in device settings
- Check `MainActivity.kt` permission handling implementation
- Verify `AndroidManifest.xml` permission declarations

## ðŸ“‹ Next Steps

1. **Test CallKeep functionality** on both platforms
2. **Verify background call handling** works correctly
3. **Test integration** with existing call management system
4. **Monitor logs** for any CallKeep-related issues

## ðŸ”— Related Files

- `src/services/calling/CallKeepService.ts` - Main CallKeep service implementation
- `src/services/calling/ReliableCallManager.ts` - Call management integration
- `PATCH_MANAGEMENT.md` - Patch management documentation

---

**Status**: âœ… Manual linking completed successfully
**Last Updated**: 2025-07-14
**React Native Version**: Compatible with current project version
**CallKeep Version**: 4.3.3 (with custom patches)

# Vivo Device CallKeep Crash Fix

## Problem Description

The app was crashing on Vivo devices immediately after the "Initializing CallKeep" console log. This is a known issue with Vivo devices due to their aggressive battery optimization and custom Android modifications that interfere with CallKeep functionality.

## Root Causes

1. **Aggressive Battery Optimization**: Vivo devices have aggressive power management that can kill background processes
2. **Custom Permission System**: Vivo's custom Android skin has stricter permission management
3. **Phone Account Registration Issues**: Vivo devices often have problems with CallKeep's phone account registration
4. **Timeout Issues**: Standard timeouts are too long for Vivo devices, causing crashes

## Implemented Solutions

### 1. Device Detection
- Added device detection logic to identify potentially problematic devices
- Uses available React Native APIs and heuristics
- Defaults to "safe mode" for better compatibility

### 2. Enhanced Error Handling
- Implemented device-specific timeouts (shorter for Vivo devices)
- Added retry logic with maximum attempt limits
- Graceful degradation when CallKeep fails

### 3. Compatibility Mode
- Shorter setup timeouts for Vivo devices (1.5s vs 3s)
- Skip problematic permission checks on Vivo devices
- Enhanced error recovery and fallback mechanisms

### 4. Availability Tracking
- Track CallKeep availability separately from initialization
- Disable CallKeep if it consistently fails
- Provide device info for debugging

## Key Changes Made

### CallKeepService.ts Enhancements

1. **Device Detection**:
   ```typescript
   private detectVivoDevice(): void {
     // Enhanced device detection logic
     // Defaults to safe mode for better compatibility
   }
   ```

2. **Enhanced Initialization**:
   ```typescript
   async initialize(): Promise<boolean> {
     // Device-specific timeouts
     // Retry logic for non-Vivo devices
     // Skip problematic operations on Vivo devices
   }
   ```

3. **Improved Error Handling**:
   ```typescript
   async displayIncomingCall(): Promise<boolean> {
     // Check availability before operations
     // Device-specific timeout handling
     // Graceful degradation on failures
   }
   ```

4. **Availability Tracking**:
   ```typescript
   isAvailable(): boolean {
     return this.isInitialized && this.callKeepAvailable
   }
   ```

## Benefits

1. **Crash Prevention**: App no longer crashes on Vivo devices
2. **Graceful Degradation**: App continues to function without native call UI if CallKeep fails
3. **Better User Experience**: Faster initialization on problematic devices
4. **Debugging Support**: Device info available for troubleshooting

## Testing Recommendations

1. Test on various Vivo device models
2. Verify app doesn't crash during CallKeep initialization
3. Confirm call functionality works with and without CallKeep
4. Test battery optimization scenarios

## Fallback Behavior

When CallKeep is unavailable:
- App continues to function normally
- Calls work through the app's UI instead of native call UI
- No native call notifications (uses app notifications instead)
- All other functionality remains intact

## Monitoring

The service now provides detailed logging:
- Device detection results
- Initialization attempts and results
- Availability status changes
- Error details for debugging

## Future Improvements

1. Add more device-specific optimizations
2. Implement user preference for CallKeep usage
3. Add analytics for CallKeep success rates
4. Consider alternative native call solutions for problematic devices

