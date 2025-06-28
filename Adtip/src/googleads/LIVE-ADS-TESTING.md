# 🚀 Testing Live Ads in Development

Since test ads are working well, here's how to test your **live/production ads** in development mode:

## ⚡ **Quick Switch Method**

### **1. Banner Ads** (`BannerAdComponent.tsx`):
```typescript
// Find this line:
const BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID : PROD_BANNER_AD_UNIT_ID;

// Replace with:
const BANNER_AD_UNIT_ID = PROD_BANNER_AD_UNIT_ID; // 🔴 TESTING LIVE ADS
```

### **2. App Open Ads** (`AppOpenAdManager.ts`):
```typescript
// Find this line:
const APP_OPEN_AD_UNIT_ID = __DEV__ ? TEST_APP_OPEN_AD_UNIT_ID : PROD_APP_OPEN_AD_UNIT_ID;

// Replace with:
const APP_OPEN_AD_UNIT_ID = PROD_APP_OPEN_AD_UNIT_ID; // 🔴 TESTING LIVE ADS
```

### **3. Rectangle/MREC Ads** (`RectangleAdComponent.tsx`):
```typescript
// Find this line:
const RECTANGLE_AD_UNIT_ID = __DEV__ ? TEST_RECTANGLE_AD_UNIT_ID : PROD_RECTANGLE_AD_UNIT_ID;

// Replace with:
const RECTANGLE_AD_UNIT_ID = PROD_RECTANGLE_AD_UNIT_ID; // 🔴 TESTING LIVE ADS
```

### **4. Interstitial Ads** (`InterstitialAdComponent.tsx`):
```typescript
// Find this line:
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TEST_INTERSTITIAL_AD_UNIT_ID : PROD_INTERSTITIAL_AD_UNIT_ID;

// Replace with:
const INTERSTITIAL_AD_UNIT_ID = PROD_INTERSTITIAL_AD_UNIT_ID; // 🔴 TESTING LIVE ADS
```

### **5. Rewarded Ads** (`RewardedAdComponent.tsx`):
```typescript
// Find this line:
const REWARDED_AD_UNIT_ID = __DEV__ ? TEST_REWARDED_AD_UNIT_ID : PROD_REWARDED_AD_UNIT_ID;

// Replace with:
const REWARDED_AD_UNIT_ID = PROD_REWARDED_AD_UNIT_ID; // 🔴 TESTING LIVE ADS
```

## 🎯 **What You'll See:**

### ✅ **Live Ads Will Show:**
- Real advertisements from real advertisers
- No "Test Ad" labels
- Actual ad content that users will see
- Real ad performance tracking

### 📊 **Live Ad Benefits:**
- Verify your production ad unit IDs work
- See actual ad fill rates
- Test real ad sizes and layouts
- Confirm revenue tracking

## ⚠️ **IMPORTANT WARNINGS:**

### 🚨 **Google Policy Compliance:**
```
❌ DON'T: Click on your own live ads (policy violation)
❌ DON'T: Leave live ads enabled for daily development
❌ DON'T: Generate fake impressions

✅ DO: Only view the ads to test they load
✅ DO: Test briefly and switch back to test ads
✅ DO: Use live ads only for final verification
```

### 🔒 **Best Practices:**
1. **Test live ads only when needed** (before releases)
2. **Never click your own live ads** (serious policy violation)
3. **Switch back to test ads** for regular development
4. **Use test ads 95% of the time** during development

## 🔄 **When Done Testing - REVERT BACK:**

**ALWAYS** change back to the original lines:
```typescript
// Revert to this for regular development:
const BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID : PROD_BANNER_AD_UNIT_ID;
const APP_OPEN_AD_UNIT_ID = __DEV__ ? TEST_APP_OPEN_AD_UNIT_ID : PROD_APP_OPEN_AD_UNIT_ID;
const RECTANGLE_AD_UNIT_ID = __DEV__ ? TEST_RECTANGLE_AD_UNIT_ID : PROD_RECTANGLE_AD_UNIT_ID;
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TEST_INTERSTITIAL_AD_UNIT_ID : PROD_INTERSTITIAL_AD_UNIT_ID;
const REWARDED_AD_UNIT_ID = __DEV__ ? TEST_REWARDED_AD_UNIT_ID : PROD_REWARDED_AD_UNIT_ID;
```

## 🎯 **Testing Checklist:**

- [ ] Live banner ads load correctly
- [ ] Live app open ads show on app launch
- [ ] Live rectangle ads display properly
- [ ] Live interstitial ads work between screens
- [ ] Live rewarded ads give proper rewards
- [ ] All ads show real content (no "Test Ad" labels)
- [ ] No console errors with live ad unit IDs
- [ ] **REVERTED back to test ads when done**

## 💡 **Pro Tip:**
Create a simple environment variable or config flag to switch between test and live ads easily:

```typescript
// Future improvement - environment-based switching
const USE_LIVE_ADS = false; // Set to true for live ad testing
const BANNER_AD_UNIT_ID = (USE_LIVE_ADS || !__DEV__) ? PROD_BANNER_AD_UNIT_ID : TEST_BANNER_AD_UNIT_ID;
```

Remember: **Test ads are your friend** for daily development! 🧪✨ 