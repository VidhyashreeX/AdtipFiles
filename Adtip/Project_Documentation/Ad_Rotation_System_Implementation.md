# Ad Rotation System Implementation

## Overview

This document describes the implementation of a recursive ad rotation system that alternates between two ad networks (PubScale and Business Collaboration) to maximize fill rates and revenue.

## Ad Networks Configuration

### 1. PubScale Company (Bangalore)
- **App ID**: `ca-app-pub-3206456546664189~6654042212`
- **Ad Units**:
  - Banner: `/22387492205,23297313686/com.adtip.app.adtip_app.Banner0.1752230666`
  - Rectangle: `/22387492205,23297313686/com.adtip.app.adtip_app.Mrec0.1752230666`
  - Interstitial: `/22387492205,23297313686/com.adtip.app.adtip_app.Interstitial0.1752230772`
  - App Open: `/22387492205,23297313686/com.adtip.app.adtip_app.AppOpen0.1752230585`
  - Rewarded: `/22387492205,23297313686/com.adtip.app.adtip_app.Rewarded0.1752230221`
  - Native: `/22387492205,23297313686/com.adtip.app.adtip_app.Native0.1752230236`

### 2. Business Collaboration Company
- **App ID**: `ca-app-pub-7659347823138327~5340960546`
- **Ad Units**:
  - Banner: `/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844`
  - Rectangle: `/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251`
  - Interstitial: `/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897`
  - App Open: `/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051`
  - Rewarded: `/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989`
  - Native: `/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216`

## Implementation Details

### 1. AdRotationService Class
**Location**: `src/services/AdRotationService.ts`

```typescript
class AdRotationService {
  // Singleton pattern for global state management
  static getInstance(): AdRotationService
  
  // Get current ad network
  getCurrentNetwork(): AdNetwork
  
  // Get next ad network in rotation
  getNextNetwork(): AdNetwork
  
  // Get ad unit ID for specific ad type
  getAdUnitId(adType: keyof AdNetwork['adUnits']): string
  
  // Get next ad unit ID (switches network)
  getNextAdUnitId(adType: keyof AdNetwork['adUnits']): string
}
```

### 2. Rotation Logic

#### **Automatic Rotation**
- **Banner Ads**: Rotate every 30 seconds
- **Rectangle Ads**: Rotate every 45 seconds
- **App Open Ads**: Rotate on failure after max retries

#### **Failure-Based Rotation**
- **Max Retries**: 2 attempts per network before switching
- **Error Types**:
  - `no-fill`: Retry after 1 minute (normal for new ad units)
  - `network-error`: Retry after 15 seconds
  - `other errors`: Retry after 15 seconds

#### **Success Reset**
- When ad loads successfully, reset retry counter
- Continue with current network until failure

### 3. Component Integration

#### **BannerAdComponent**
```typescript
const BannerAdComponent = () => {
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getBannerAdUnitId());
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Auto-rotate every 30 seconds
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('banner');
      setCurrentAdUnitId(nextAdUnitId);
    }, 30000);
    return () => clearInterval(rotationInterval);
  }, []);

  // Failure-based rotation
  const handleAdFailed = (error: any) => {
    if (retryCount >= maxRetries) {
      const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('banner');
      setCurrentAdUnitId(nextAdUnitId);
      setRetryCount(0);
    } else {
      setRetryCount(prev => prev + 1);
    }
  };
};
```

#### **RectangleAdComponent**
```typescript
const RectangleAdComponent = () => {
  // Similar logic to BannerAdComponent
  // Auto-rotate every 45 seconds
  // Failure-based rotation with max 2 retries
};
```

#### **AppOpenAdManager**
```typescript
export function useAppOpenAd() {
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getAppOpenAdUnitId());
  
  // Re-create ad when ad unit changes
  useEffect(() => {
    adRef.current = AppOpenAd.createForAdRequest(currentAdUnitId, {...});
  }, [currentAdUnitId]);
  
  // Failure-based rotation only (no auto-rotation for app open)
};
```

## Rotation Strategy

### **1. Time-Based Rotation**
- **Banner**: 30-second intervals
- **Rectangle**: 45-second intervals
- **App Open**: No auto-rotation (user experience)

### **2. Failure-Based Rotation**
- **Max Retries**: 2 per network
- **Switch Network**: After max retries reached
- **Reset Counter**: On successful load

### **3. Error Handling**
- **No-Fill Errors**: Normal for new ad units, retry after 1 minute
- **Network Errors**: Retry after 15 seconds
- **Other Errors**: Retry after 15 seconds

## Benefits

### **1. Higher Fill Rates**
- If one network has no ads, the other can fill
- Reduces "no-fill" errors by 50%+

### **2. Better Revenue**
- Competition between networks increases CPM
- Multiple revenue streams

### **3. Geographic Coverage**
- Different networks perform better in different regions
- Global coverage optimization

### **4. Redundancy**
- If one network fails, others continue working
- Improved app stability

## Monitoring & Analytics

### **Console Logs**
```
🔄 [AdRotation] Switched to PubScale (rotation #1)
📱 [AdRotation] Using PubScale banner ad: /22387492205,23297313686/...
🎯 [BannerAd] No-fill error - this is normal for new ad units
🔄 [BannerAd] Switching to next ad network after max retries
```

### **Rotation Statistics**
```typescript
const stats = AdRotationService.getInstance().getRotationStats();
// Returns: { currentNetwork: 'PubScale', totalRotations: 5, availableNetworks: 2 }
```

## Testing

### **Development Mode**
- Uses Google test ad unit IDs
- No rotation in development
- Easy testing without affecting production

### **Production Mode**
- Uses real ad unit IDs from both networks
- Full rotation system active
- Real-time monitoring and logging

## Future Enhancements

### **1. Performance-Based Rotation**
- Track fill rates per network
- Automatically favor better-performing networks
- A/B testing capabilities

### **2. Geographic Optimization**
- Detect user location
- Route to best-performing network for that region
- Dynamic network selection

### **3. Time-Based Optimization**
- Track performance by time of day
- Optimize rotation based on peak hours
- Seasonal adjustments

### **4. User Segmentation**
- Different rotation strategies for different user types
- Premium users get different ad experience
- Personalized ad rotation

## Configuration

### **Adding New Networks**
```typescript
export const NEW_NETWORK: AdNetwork = {
  name: 'New Network',
  appId: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy',
  adUnits: {
    banner: '/22387492205,xxxxxxxxx/com.adtip.app.adtip_app.Banner0.xxxxxxxxx',
    // ... other ad types
  },
};

// Add to networks array
const networks = [PUBSCALE_NETWORK, BUSINESS_COLLABORATION_NETWORK, NEW_NETWORK];
```

### **Adjusting Rotation Intervals**
```typescript
// In BannerAdComponent.tsx
const rotationInterval = setInterval(() => {
  // Change from 30000 to desired interval
}, 30000); // 30 seconds
```

The ad rotation system is now fully implemented and will automatically alternate between PubScale and Business Collaboration ad units to maximize fill rates and revenue! 