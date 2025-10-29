# 16 KB Page Size Support - Implementation Checklist

## Pre-Build Verification
- [x] Updated `android/gradle.properties` with `android.experimental.legacyTransform.forceNonIncremental=true`
- [x] Updated `android/app/build.gradle` with NDK ABI filters
- [x] Updated `AndroidManifest.xml` with `android:enableOnBackInvokedCallback="true"`
- [x] All native libraries are ARM-based (armeabi-v7a, arm64-v8a)
- [x] Target SDK is set to 35 (Android 15)
- [x] Compile SDK is set to 35 (Android 15)

## Build Process
- [ ] Clean build directories
  ```bash
  cd android
  ./gradlew clean
  ```
- [ ] Build Release AAB
  ```bash
  ./gradlew bundleRelease
  ```
- [ ] Build Release APK (optional)
  ```bash
  ./gradlew assembleRelease
  ```
- [ ] Verify AAB file exists at `android/app/build/outputs/bundle/release/app-release.aab`

## Testing & Verification
- [ ] Upload AAB to Google Play Console (Internal Testing track first)
- [ ] Check Google Play Console for 16 KB support confirmation
- [ ] Test on Android 14 device
- [ ] Test on Android 15 device (if available)
- [ ] Verify all core features work:
  - [ ] App launches correctly
  - [ ] Video calls work
  - [ ] Live streaming works
  - [ ] TipShorts video playback works
  - [ ] Audio calls work
  - [ ] Notifications work
  - [ ] File upload/download works
  - [ ] Camera functionality works

## Google Play Console Verification
- [ ] Log in to Google Play Console
- [ ] Navigate to Release > Production (or Internal Testing)
- [ ] Upload the new AAB
- [ ] Wait for processing (usually 15-30 minutes)
- [ ] Check "App bundle explorer"
- [ ] Verify "16 KB page size support: Yes"
- [ ] Check device compatibility list

## Common Issues & Solutions

### Issue: Build fails with "NDK not found"
**Solution:** Ensure NDK is installed via Android Studio SDK Manager

### Issue: "Unsupported class file major version"
**Solution:** Ensure Java 17 is being used (already configured)

### Issue: Native library conflicts
**Solution:** Verify no x86/x86_64 libraries are included, only ARM

### Issue: Google Play Console shows "No 16 KB support"
**Solution:** 
1. Ensure all changes are committed
2. Clean build (`./gradlew clean`)
3. Rebuild AAB
4. Re-upload to Play Console

## References
- Documentation: `docs/16KB_PAGE_SIZE_SUPPORT.md`
- Android Guide: https://developer.android.com/guide/practices/page-sizes
- Google Play Requirements: https://support.google.com/googleplay/android-developer/answer/14434498

## Deadline
**November 1, 2025** - All app updates must support 16 KB page sizes

## Status
- [x] Implementation complete
- [ ] Build verification
- [ ] Google Play Console upload
- [ ] Testing complete
- [ ] Production release

## Notes
<!-- Add any additional notes or observations here -->
