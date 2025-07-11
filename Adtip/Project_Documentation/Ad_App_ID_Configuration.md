# Ad App ID Configuration

## Important Note: Google AdMob Limitation

**Google AdMob only allows ONE app ID per application.** This means we cannot use both app IDs simultaneously in the same app. However, we can still implement ad rotation using different ad unit IDs from both companies.

## Current Configuration

### **Primary App ID (PubScale)**
- **App ID**: `ca-app-pub-3206456546664189~6654042212`
- **Company**: PubScale (Bangalore)
- **Status**: ✅ Active in app.json and AndroidManifest.xml

### **Secondary App ID (Business Collaboration)**
- **App ID**: `ca-app-pub-7659347823138327~5340960546`
- **Company**: Business Collaboration
- **Status**: ⚠️ Cannot be used simultaneously (Google limitation)

## Solution: Ad Unit Rotation

Since we can only use one app ID, we implement ad rotation using **ad unit IDs** from both companies under the same app ID.

### **How It Works:**

1. **Primary App ID**: PubScale (`ca-app-pub-3206456546664189~6654042212`)
2. **Ad Unit Rotation**: Both companies' ad units work under the same app ID
3. **Fallback Strategy**: If one company's ad units fail, switch to the other

### **Ad Unit Configuration:**

#### **PubScale Ad Units (Primary)**
```typescript
banner: '/22387492205,23297313686/com.adtip.app.adtip_app.Banner0.1752230666'
rectangle: '/22387492205,23297313686/com.adtip.app.adtip_app.Mrec0.1752230666'
interstitial: '/22387492205,23297313686/com.adtip.app.adtip_app.Interstitial0.1752230772'
appOpen: '/22387492205,23297313686/com.adtip.app.adtip_app.AppOpen0.1752230585'
rewarded: '/22387492205,23297313686/com.adtip.app.adtip_app.Rewarded0.1752230221'
native: '/22387492205,23297313686/com.adtip.app.adtip_app.Native0.1752230236'
```

#### **Business Collaboration Ad Units (Secondary)**
```typescript
banner: '/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844'
rectangle: '/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251'
interstitial: '/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897'
appOpen: '/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051'
rewarded: '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989'
native: '/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216'
```

## Alternative Solutions

### **Option 1: Separate Apps (Recommended for Production)**
Create two separate app builds:
- **App A**: Uses PubScale app ID and ad units
- **App B**: Uses Business Collaboration app ID and ad units
- **Distribution**: A/B test or geographic distribution

### **Option 2: Dynamic App ID Switching**
```typescript
// This would require app restart, not recommended
const switchAppId = async (newAppId: string) => {
  // Save new app ID to storage
  await AsyncStorage.setItem('selected_app_id', newAppId);
  // Restart app to apply new app ID
  // This is complex and not user-friendly
};
```

### **Option 3: Hybrid Approach (Current Implementation)**
- Use one app ID (PubScale)
- Rotate between both companies' ad units
- Monitor performance and optimize

## Current Implementation Benefits

### **✅ Advantages:**
1. **Single App**: No need for multiple app builds
2. **Ad Rotation**: Still get benefits of multiple ad sources
3. **Fallback**: If one company's ads fail, other continues
4. **Revenue Optimization**: Competition between ad units

### **⚠️ Limitations:**
1. **Single App ID**: Can only use one company's app ID
2. **Revenue Attribution**: Harder to track which company generates more revenue
3. **Analytics**: Combined metrics from both companies

## Configuration Files Updated

### **app.json**
```json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-3206456546664189~6654042212",
    "ios_app_id": "ca-app-pub-3206456546664189~6654042212"
  }
}
```

### **AndroidManifest.xml**
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3206456546664189~6654042212"
    tools:replace="android:value" />
```

## Monitoring & Analytics

### **Track Performance by Ad Unit:**
```typescript
// In AdRotationService
const trackAdUnitPerformance = (adUnitId: string, success: boolean) => {
  // Track which ad units perform better
  // Optimize rotation based on performance
};
```

### **Revenue Attribution:**
- Track revenue per ad unit ID
- Identify which company's ads perform better
- Optimize rotation strategy accordingly

## Future Recommendations

### **For Maximum Revenue:**
1. **A/B Test**: Create two app versions with different app IDs
2. **Geographic Distribution**: Use different app IDs for different regions
3. **Performance-Based**: Switch app IDs based on performance data

### **For Current Setup:**
1. **Monitor Performance**: Track which ad units perform better
2. **Optimize Rotation**: Adjust rotation strategy based on data
3. **Gradual Migration**: Consider separate apps if revenue justifies it

## Testing

### **Development:**
- Uses Google test ad unit IDs
- No rotation in development
- Easy testing without affecting production

### **Production:**
- Uses real ad unit IDs from both companies
- Full rotation system active
- Real-time monitoring and logging

The current implementation provides the best balance of functionality and simplicity while working within Google AdMob's limitations. 