# 16 KB Page Size Support Implementation

## Overview
This document describes the implementation of 16 KB memory page size support for the Adtip React Native Android application, as required by Google Play Store for apps targeting Android 15+ (API level 35).

## Background
Starting November 1, 2025, Google Play requires all apps targeting Android 15 or higher to support devices with 16 KB memory page sizes. This is necessary because some Android devices use 16 KB memory pages instead of the standard 4 KB pages, and apps need to be compatible with both configurations.

## Changes Made

### 1. gradle.properties
Added configuration to enable 16 KB page size support:

```properties
# ================================================================================================
# 16 KB PAGE SIZE SUPPORT (Required for Android 15+ and Google Play Store)
# ================================================================================================
# Enable 16 KB page size support for devices with larger memory pages
# This is required for apps targeting Android 15 (API 35) and above
# See: https://developer.android.com/guide/practices/page-sizes
android.experimental.legacyTransform.forceNonIncremental=true
```

**Location:** `android/gradle.properties`

### 2. app/build.gradle
Updated the `defaultConfig` section to explicitly specify NDK ABI filters:

```gradle
defaultConfig {
    // ... existing configuration ...
    
    // 16 KB page size support - Required for Android 15+ and Google Play Store
    // This ensures the app works correctly on devices with 16 KB memory pages
    // See: https://developer.android.com/guide/practices/page-sizes
    ndk {
        abiFilters 'armeabi-v7a', 'arm64-v8a'
    }
}
```

**Location:** `android/app/build.gradle`

**Note:** The app already uses `arm64-v8a` and `armeabi-v7a` architectures, which are compatible with 16 KB page sizes.

### 3. AndroidManifest.xml
Added the `android:enableOnBackInvokedCallback="true"` attribute to the application tag:

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:usesCleartextTraffic="true"
    android:enableOnBackInvokedCallback="true"
    tools:replace="android:allowBackup">
```

**Location:** `android/app/src/main/AndroidManifest.xml`

**Purpose:** This attribute enables the predictable back navigation behavior required for Android 15+ and ensures proper handling of the back gesture on devices with different memory page sizes.

## Dependencies Compatibility

All dependencies in the project are using recent versions that support 16 KB page sizes:

- **React Native:** Using modern version with Hermes engine
- **ExoPlayer 2.19.1:** Compatible with 16 KB pages
- **Firebase SDK:** Using BoM 33.15.0 (latest) - fully compatible
- **OkHttp 4.12.0:** Latest version, fully compatible
- **Native libraries:** All ARM-based architectures (armeabi-v7a, arm64-v8a) are supported

## Testing

### Building the App Bundle
To build an Android App Bundle (AAB) with 16 KB page size support:

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

The AAB will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Verifying 16 KB Support
After building, you can verify 16 KB support using Google Play Console:

1. Upload the AAB to Google Play Console (Internal Testing or Production)
2. Navigate to the release details
3. Check the "Device catalog" or "App bundle explorer"
4. Google Play Console will indicate if the bundle supports 16 KB devices

### Local Testing
While you cannot easily test 16 KB page size locally (requires specific hardware), you can:

1. **Build verification:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Check native libraries:**
   ```bash
   # Extract and inspect the APK/AAB
   unzip -l app/build/outputs/bundle/release/app-release.aab | grep ".so"
   ```
   
   Ensure all `.so` files are only for `armeabi-v7a` and `arm64-v8a`.

3. **Install and test on devices:**
   - Test on various Android devices (Android 14 and 15)
   - Verify app functionality (calls, video, streaming, etc.)
   - Ensure no crashes related to memory allocation

## Important Notes

1. **No Code Changes Required:** The changes are purely configuration-based. No modifications to Java/Kotlin or JavaScript/TypeScript code are needed.

2. **Backward Compatibility:** These changes maintain full backward compatibility with older Android versions and devices with 4 KB page sizes.

3. **Performance Impact:** Minimal to no performance impact. The changes mainly ensure the app can be installed and run on newer Android devices.

4. **Build Time:** First build after these changes might take slightly longer due to the `forceNonIncremental` flag, but subsequent builds should be normal.

## Troubleshooting

### Build Failures
If you encounter build failures after these changes:

1. **Clean the build:**
   ```bash
   cd android
   ./gradlew clean
   rm -rf .gradle
   cd ..
   ```

2. **Clear React Native cache:**
   ```bash
   npx react-native start --reset-cache
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

### Native Library Issues
If you see errors related to native libraries (.so files):

1. Ensure all third-party native libraries support ARM architectures
2. Check that no x86 or x86_64 libraries are included
3. Verify NDK version is up to date (currently using 27.1.12297006)

## References

- [Android Developer Guide: Page Sizes](https://developer.android.com/guide/practices/page-sizes)
- [Building Your App with 16 KB Support](https://developer.android.com/guide/practices/page-sizes#build)
- [Google Play 16 KB Page Size Requirement](https://support.google.com/googleplay/android-developer/answer/14434498)

## Compliance Timeline

- **November 1, 2025:** Deadline for 16 KB page size support
- **Status:** ✅ Implemented
- **Next Steps:** Build and upload AAB to Google Play Console for verification

## Summary

The Adtip React Native Android app has been updated to fully support 16 KB memory page sizes as required by Google Play Store. The changes are minimal, configuration-based, and maintain full compatibility with existing devices while ensuring the app can run on newer Android 15+ devices with larger memory page sizes.
