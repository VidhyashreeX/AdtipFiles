# Ad App ID Configuration - PubScale Only

## Current Configuration

### **PubScale App ID**
- **App ID**: `ca-app-pub-3206456546664189~6654042212`
- **Company**: PubScale (Bangalore)
- **Status**: ✅ Active in app.json and AndroidManifest.xml

## Configuration

### **App Configuration (app.json)**
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

## Ad Unit Configuration

### **PubScale Ad Units**
```typescript
banner: '/22387492205,23297313686/com.adtip.app.adtip_app.Banner0.1752230666'
rectangle: '/22387492205,23297313686/com.adtip.app.adtip_app.Mrec0.1752230666'
interstitial: '/22387492205,23297313686/com.adtip.app.adtip_app.Interstitial0.1752230772'
appOpen: '/22387492205,23297313686/com.adtip.app.adtip_app.AppOpen0.1752230585'
rewarded: '/22387492205,23297313686/com.adtip.app.adtip_app.Rewarded0.1752230221'
native: '/22387492205,23297313686/com.adtip.app.adtip_app.Native0.1752230236'
```

## Benefits of Single Network Approach

### **1. Simplified Management**
- Single app ID to manage
- Consistent ad experience
- Easier debugging and optimization

### **2. Better Performance Tracking**
- Clear metrics for PubScale performance
- Easier to identify and fix issues
- Focused optimization efforts

### **3. Reduced Complexity**
- No rotation logic to maintain
- Predictable ad behavior
- Lower maintenance overhead

## Testing

### **Development Mode**
- Uses Google test ad unit IDs
- Easy testing without affecting production
- Consistent with production behavior

### **Production Mode**
- Uses PubScale ad unit IDs
- Real-time monitoring and logging
- Optimized for PubScale performance

## Future Considerations

### **1. Performance Monitoring**
- Track fill rates for PubScale
- Monitor revenue performance
- Optimize ad unit performance

### **2. Geographic Optimization**
- Optimize for specific regions
- Localized ad content
- Regional performance tracking

### **3. User Experience**
- Consistent ad experience
- Predictable ad behavior
- Better user engagement

The ad system is now configured to use only PubScale ads, providing a simplified and manageable ad experience! 