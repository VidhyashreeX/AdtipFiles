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
[useCallKeepInitializer] 🔄 Starting non-blocking CallKeep initialization...
[CallKeepService] 🔄 Initializing CallKeep (attempt 1/3)...
[CallKeepService] 📱 Platform: android, Device: Standard
[CallKeepService] 🔧 Setting up CallKeep with options: {...}
[CallKeepService] ✅ CallKeep setup complete
[CallKeepService] ✅ CallKeep availability set to true
[CallKeepService] 📋 Permission check result: true/false
[CallKeepService] ✅ CallKeep initialization successful
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
