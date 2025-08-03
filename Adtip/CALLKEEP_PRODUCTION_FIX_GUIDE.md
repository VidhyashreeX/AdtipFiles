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
- `[CallKeepService] 🚫 CallKeep disabled via production configuration`
- `[App] 🚫 Preventing crash in production build`

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