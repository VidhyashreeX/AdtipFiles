# PubScale Integration for AdtipApp

> **IMPORTANT NOTE (June 2, 2025)**: The PubScale integration has been temporarily commented out across the codebase. All functionality is preserved in the code but is currently inactive. To re-enable, search for the comment "Commented out PubScale integration - June 2, 2025" across the project files and uncomment the relevant code.

This document describes how the PubScale Offerwall SDK has been integrated into the AdtipApp React Native project.

## Overview

PubScale Offerwall SDK allows users to earn rewards by completing offers, watching videos, or participating in surveys. This integration enables AdtipApp to monetize users and provide them with in-app coins that can be used within the app.

## Integration Details

### Android Setup

1. The native module files are located at:
   - `android/app/src/main/java/com/adtip/PubscaleOfferwallSdkModule.java`
   - `android/app/src/main/java/com/adtip/PubscaleOfferwallSdkPackage.java`

2. The PubScale SDK dependency is added in `android/app/build.gradle`
   ```groovy
   implementation 'com.pubscale.sdkone:offerwall:1.0.10'
   ```

3. The package is registered in `MainApplication.kt`
   ```kotlin
   packages.add(PubscaleOfferwallSdkPackage())
   ```

### JavaScript/TypeScript Integration

1. PubScale Service:
   - Located at `src/services/PubScaleService.ts`
   - Provides a wrapper around the native PubScale SDK
   - Handles initialization, showing the offerwall, and reward callbacks

2. Reward Service Integration:
   - Located at `src/services/RewardService.ts`
   - Uses PubScaleService to show offerwalls and handle rewards
   - Includes methods for tracking rewards in the backend

3. App Initialization:
   - PubScale is initialized in `App.tsx` during app startup
   - Uses the app ID `39604779` from the PubScale dashboard
   - Sets up reward listener to handle reward events

4. Analytics Integration:
   - Located at `src/services/AnalyticsService.ts`
   - Tracks offerwall events, reward completions, and errors
   - Provides insights into user interaction with offerwalls

5. Fallback Implementation:
   - Located at `src/services/PubScaleFallbackService.ts`
   - Provides a web-based alternative when native modules aren't available
   - Simulates rewards for testing purposes

## Usage

### Initializing PubScale

PubScale is automatically initialized during app startup with the user ID. This happens in `App.tsx`:

```typescript
// Initialize PubScale SDK with user ID
await PubScaleService.initialize(userId);

// Set up PubScale reward listener
PubScaleService.setRewardListener((reward) => {
  console.log('Reward received:', reward);
  // Handle reward
});
```

### Showing the Offerwall

To show the PubScale offerwall, you can use the RewardService's showOfferwall method:

```typescript
import RewardService from '../services/RewardService';

// Inside a component or function:
try {
  await RewardService.showOfferwall();
} catch (error) {
  console.error('Error showing offerwall:', error);
}
```

There's also a reusable button component available at `src/components/common/PubScaleOfferwallButton.tsx` that you can include in any screen:

```typescript
import PubScaleOfferwallButton from '../components/common/PubScaleOfferwallButton';

// In your component's render method:
<PubScaleOfferwallButton
  title="Earn Rewards"
  onPress={() => console.log('Offerwall button pressed')}
/>
```

### Handling Rewards

Rewards are automatically tracked when received. The reward listener in App.tsx handles all incoming rewards and can be customized to update the user's balance or trigger other actions:

```typescript
PubScaleService.setRewardListener((reward) => {
  console.log('Reward received:', reward);
  
  // Update user's balance via API
  ApiService.post(ENDPOINTS.REWARDS.TRACK_REWARD, {
    placementName: 'offerwall',
    rewardAmount: reward.amount,
    rewardType: reward.currency
  });
  
  // Track the reward in analytics
  AnalyticsService.trackOfferwallEvent('reward_received', {
    amount: reward.amount,
    currency: reward.currency
  });
});
```

### Analytics Integration

The integration now includes comprehensive analytics tracking for all offerwall events:

- Initialization events
- User interactions (show attempts, launches, closes)
- Reward events (received, processed)
- Error events (network issues, SDK errors)

Data is batch-processed and sent to the backend for analysis. To access analytics data:

1. Navigate to the Analytics screen in the admin dashboard
2. Filter by "offerwall" events
3. View metrics on offerwall usage, reward distribution, and error rates

## Error Handling

The integration includes robust error handling:

- Network connectivity checks before showing offerwalls
- SDK initialization error recovery
- Detailed error tracking and reporting
- Fallback mechanism for devices without native module support

## Testing

To test the PubScale integration:

1. Run the app on an Android device or emulator
2. Navigate to the wallet screen
3. Press the "Earn More Coins" button to show the offerwall
4. Complete offers to earn rewards
5. Check the logs and analytics dashboard for event tracking

### Testing the Fallback Implementation

To test the fallback implementation:

1. Use the debug menu to disable native modules
2. Navigate to the wallet screen
3. Press the "Earn More Coins" button
4. You should see an alert offering to open the web offerwall
5. Test both the "Cancel" and "Open Web Offerwall" options

## Troubleshooting

### Common Issues

1. **Offerwall Not Showing**
   - Check network connectivity
   - Verify the app ID is correct
   - Ensure the user ID is properly set

2. **No Rewards Received**
   - Check the event listener is properly set up
   - Verify the reward callback is correctly implemented
   - Check the API endpoint for tracking rewards

3. **Crashes When Opening Offerwall**
   - Verify the PubScale SDK version is correct (1.0.10)
   - Check for any Java exceptions in the logs
   - Ensure all required permissions are in AndroidManifest.xml

### Debugging Tools

1. Use the `build_pubscale.ps1` script to quickly rebuild and test changes
2. Enable debug logs in PubScaleService by setting `DEBUG_MODE = true`
3. Check the analytics dashboard for any error events

## Future Improvements

1. iOS Support: Add native implementation when PubScale iOS SDK becomes available
2. Better Offline Mode: Enhance fallback implementation with offline queueing
3. A/B Testing: Implement different offerwall placements to test conversion rates
4. Enhanced Analytics: Add user segmentation and retention metrics

## Contact

For any issues or questions regarding the PubScale integration, contact the team at devs@adtip.com

If you encounter issues with the PubScale integration:

1. Check the Android logs for any PubScale-related errors
2. Verify that the app ID is correct in `src/constants/api.ts`
3. Ensure the user ID is properly set during initialization
4. Verify that the PubScale SDK dependency is correctly added to the build.gradle file

For more information, refer to the PubScale SDK documentation.
