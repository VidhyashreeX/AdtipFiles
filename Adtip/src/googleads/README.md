# Google Mobile Ads Implementation for Adtip

This directory contains all the Google Mobile Ads components and utilities for the Adtip React Native application.

## 🚀 Quick Start

### 1. Import Components

```typescript
import { 
  BannerAdComponent, 
  RectangleAdComponent, 
  NativeAdComponent,
  useAppOpenAd,
  useInterstitialAd,
  useRewardedAd 
} from '../googleads';
```

### 2. App Configuration

Make sure your `app.json` has the correct App ID:

```json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-7659347823138327~5340960546",
    "ios_app_id": "ca-app-pub-7659347823138327~5340960546"
  }
}
```

## 📱 Ad Components

### Banner Ads

```typescript
import { BannerAdComponent } from '../googleads';

function MyScreen() {
  return (
    <View>
      <BannerAdComponent />
    </View>
  );
}
```

### Rectangle/MREC Ads

```typescript
import { RectangleAdComponent } from '../googleads';

function MyScreen() {
  return (
    <View>
      <RectangleAdComponent />
    </View>
  );
}
```

### App Open Ads

```typescript
import { useAppOpenAd } from '../googleads';

function App() {
  const { showAd, adLoaded } = useAppOpenAd();

  useEffect(() => {
    if (adLoaded) {
      showAd();
    }
  }, [adLoaded]);

  return <YourApp />;
}
```

### Interstitial Ads

```typescript
import { useInterstitialAd } from '../googleads';

function GameScreen() {
  const { showAd, isLoaded } = useInterstitialAd();

  const handleGameOver = () => {
    if (isLoaded) {
      showAd();
    }
  };

  return (
    <View>
      <Button title="Game Over" onPress={handleGameOver} />
    </View>
  );
}
```

### Rewarded Ads

```typescript
import { useRewardedAd } from '../googleads';

function RewardScreen() {
  const { showAd, isLoaded, hasEarnedReward, reward } = useRewardedAd();

  const handleWatchAd = () => {
    if (isLoaded) {
      showAd();
    }
  };

  useEffect(() => {
    if (hasEarnedReward && reward) {
      console.log('User earned:', reward);
      // Give user the reward
    }
  }, [hasEarnedReward, reward]);

  return (
    <View>
      <Button 
        title="Watch Ad for Reward" 
        onPress={handleWatchAd}
        disabled={!isLoaded}
      />
    </View>
  );
}
```

## 🔧 Switching Between Test and Production

Each ad component has easy switches between test and production modes:

### Method 1: Automatic (Recommended)
The components automatically use test ads in development (`__DEV__`) and production ads in release builds.

### Method 2: Manual Override
In each component file, you can manually switch by commenting/uncommenting lines:

```typescript
// Test Ad Unit ID (for development/testing)
const TEST_BANNER_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID
// Uncomment the line below and comment the line above to use your custom test ID
// const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-7659347823138327~5340960546';
```

## 📊 Ad Unit IDs

### Production Ad Unit IDs:
- **App ID**: `ca-app-pub-7659347823138327~5340960546`
- **Banner**: `/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844`
- **Interstitial**: `/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897`
- **App Open**: `/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051`
- **Native**: `/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216`
- **Rewarded**: `/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989`
- **MREC**: `/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251`

### Test Ad Unit IDs:
The components use official Google test IDs by default:
- **Banner**: `TestIds.BANNER`
- **Interstitial**: `TestIds.INTERSTITIAL`
- **App Open**: `TestIds.APP_OPEN`
- **Rewarded**: `TestIds.REWARDED`
- **Native**: `TestIds.NATIVE`

## 📈 Ad Tracking

The implementation includes comprehensive ad tracking:

```typescript
import { adTracker, trackAdLoaded, trackAdFailed } from '../googleads';

// Manual tracking
trackAdLoaded('banner', 'banner-unit-id');
trackAdFailed('interstitial', error, 'interstitial-unit-id');

// Get analytics
const metrics = adTracker.getAdMetrics('banner');
console.log('Banner ad metrics:', metrics);

// Get all events
const events = adTracker.getEvents();
console.log('All ad events:', events);
```

## ⚠️ Important Notes

### 1. Test Ads vs Production
- **Always use test ads during development** to avoid policy violations
- **Only use production ad unit IDs in released apps**
- Test ads will show "Test Ad" labels

### 2. Ad Loading
- Ads are automatically preloaded in the background
- Always check `isLoaded` state before showing full-screen ads
- Banner and rectangle ads load automatically when mounted

### 3. Best Practices
- Don't show ads too frequently (respect user experience)
- Always handle ad loading failures gracefully
- Preload interstitial and rewarded ads before needed
- Test thoroughly with both test and production ads

### 4. Troubleshooting
- Ensure proper App ID configuration in `app.json`
- Check network connectivity for ad loading
- Verify ad unit IDs are correct for production
- Use test ads during development

## 🔍 Debugging

Enable detailed logging by checking the console for ad events:
- Ad loading status
- Ad display events
- Error messages
- Performance metrics

All components include comprehensive console logging for debugging purposes.

## 📝 File Structure

```
src/googleads/
├── AppOpenAdManager.ts      # App open ad hook
├── BannerAdComponent.tsx    # Banner ad component
├── RectangleAdComponent.tsx # Rectangle/MREC ad component
├── InterstitialAdComponent.tsx # Interstitial ad hook
├── RewardedAdComponent.tsx  # Rewarded ad hook
├── NativeAdComponent.tsx    # Native ad component (placeholder)
├── AdTracker.ts            # Ad analytics and tracking
├── index.ts                # Main exports
└── README.md               # This file
```

## 🚀 Usage Examples

Check the existing implementations in:
- `src/screens/home/HomeScreen.tsx` - Banner ads
- `src/screens/profile/ProfileScreen.tsx` - Rectangle ads
- `src/screens/tiptube/TipTubeScreen.tsx` - Banner ads in lists
- `App.tsx` - App open ads

Happy monetizing! 💰 