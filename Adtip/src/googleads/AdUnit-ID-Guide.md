# 🆔 App ID vs Ad Unit ID Guide

## ❌ The Problem You Had:
You were using your **App ID** as an **Ad Unit ID**, which caused the "invalid request" errors.

## 📋 **App ID vs Ad Unit ID - The Difference:**

### 🏠 **App ID** (for app.json configuration):
```
ca-app-pub-7659347823138327~5340960546
```
- **Format**: `ca-app-pub-xxxxxxxx~xxxxxxxx` (ends with `~`)
- **Used in**: `app.json` file for app configuration
- **Purpose**: Identifies your entire app to Google AdMob
- **Quantity**: One per app

### 📱 **Ad Unit IDs** (for individual ads):
```
/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844
```
- **Format**: `/xxxxxxxx/com.adtip.app.adtip_app.AdType0.xxxxxxxx` (starts with `/`)
- **Used in**: Individual ad components (BannerAdComponent, etc.)
- **Purpose**: Identifies specific ad placements within your app
- **Quantity**: Multiple per app (one for each ad placement)

## ✅ **Your Correct IDs:**

### App Configuration (app.json):
```json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-7659347823138327~5340960546",
    "ios_app_id": "ca-app-pub-7659347823138327~5340960546"
  }
}
```

### Production Ad Unit IDs:
- **Banner**: `/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844`
- **Interstitial**: `/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897`
- **App Open**: `/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051`
- **Native**: `/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216`
- **Rewarded**: `/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989`
- **MREC**: `/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251`

### Google Test Ad Unit IDs (for development):
- **Banner**: `ca-app-pub-3940256099942544/6300978111`
- **Interstitial**: `ca-app-pub-3940256099942544/1033173712`
- **App Open**: `ca-app-pub-3940256099942544/3419835294`
- **Rewarded**: `ca-app-pub-3940256099942544/5224354917`
- **Native**: `ca-app-pub-3940256099942544/2247696110`

## 🎯 **What I Fixed:**

### Before (❌ Wrong):
```typescript
// This was causing the errors
const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-7659347823138327~5340960546'; // App ID
```

### After (✅ Correct):
```typescript
// Now using proper test ad unit IDs
const TEST_BANNER_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID
```

## 🚀 **Result:**
All your ad components now use:
- ✅ **Proper test ad unit IDs** in development (no more errors!)
- ✅ **Your production ad unit IDs** in release builds
- ✅ **Automatic switching** between test and production modes

Your ads should now load correctly without any "invalid request" errors! 🎉 