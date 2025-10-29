# Quick Start: Build & Deploy with 16 KB Support

## 🚀 Fast Track to Production

### Step 1: Build the App (Choose your OS)

#### Windows PowerShell
```powershell
cd c:\A2\adtip-reactnative\Adtip
.\build-16kb-support.ps1
```

#### Windows Command Prompt / Linux / Mac
```bash
cd Adtip
cd android
./gradlew clean
./gradlew bundleRelease
```

### Step 2: Locate Your Build
The AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Step 3: Upload to Google Play
1. Go to: https://play.google.com/console/
2. Select: Adtip App
3. Click: Release → Production (or Internal Testing)
4. Upload: `app-release.aab`
5. Complete release notes
6. Submit for review

### Step 4: Verify (After 15-30 minutes)
1. Go to "App bundle explorer" in Play Console
2. Look for: **"16 KB page size support: Yes"** ✅
3. If you see this, you're good to go!

## ⚡ One-Line Build Commands

### Full Clean Build (AAB only)
```bash
cd android && ./gradlew clean bundleRelease
```

### Full Clean Build (AAB + APK)
```bash
cd android && ./gradlew clean bundleRelease assembleRelease
```

### Quick Build (No Clean)
```bash
cd android && ./gradlew bundleRelease
```

## 📋 What Changed?

Three simple configuration updates:

1. **gradle.properties** - Added 16 KB support flag
2. **app/build.gradle** - Added NDK ABI filters
3. **AndroidManifest.xml** - Added back navigation callback

## ✅ Pre-Flight Checklist

Before uploading:
- [ ] Build completed without errors
- [ ] AAB file exists and is > 50 MB
- [ ] Test the APK on at least one device (optional but recommended)
- [ ] Increment versionCode if not already done

## 🆘 Troubleshooting

### Build fails?
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
cd android
./gradlew bundleRelease
```

### Upload fails?
- Check you're using the correct signing key
- Ensure versionCode is higher than previous release
- Verify Google Play Console access

### 16 KB support not showing?
- Wait 30 minutes after upload
- Check you uploaded the AAB (not APK)
- Rebuild and re-upload if needed

## 📱 Testing Commands

### Install APK on connected device
```bash
cd android
./gradlew installRelease
```

### Check installed version
```bash
adb shell pm list packages | grep adtip
adb shell dumpsys package com.adtip.app.adtip_app | grep versionCode
```

## 📞 Need Help?

Check these files:
- Full guide: `docs/16KB_PAGE_SIZE_SUPPORT.md`
- Checklist: `docs/16KB_PAGE_SIZE_CHECKLIST.md`
- Summary: `docs/16KB_IMPLEMENTATION_SUMMARY.md`

## 🎯 Success Criteria

You're done when:
1. ✅ Build completes successfully
2. ✅ AAB uploads to Play Console
3. ✅ Play Console shows "16 KB page size support: Yes"
4. ✅ App installs and runs on test device

**That's it! Your app is now compliant with Google Play's 16 KB requirement.**

---

**Deadline:** November 1, 2025  
**Status:** Ready to build and deploy  
**Estimated time:** 10-15 minutes (build) + 15-30 minutes (Play Console processing)
