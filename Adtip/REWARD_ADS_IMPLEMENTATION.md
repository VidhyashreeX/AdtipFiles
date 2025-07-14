# Reward Ads Implementation Guide

## Overview
This implementation adds reward ads that show after every 5th video in TipTube and TipShorts. Users earn ₹0.03 (non-premium) or ₹0.06 (premium) per ad view.

## How It Works

### 1. Ad Trigger System
- After every 5th video completion, a reward ad is shown
- Only for authenticated users (not guests)
- Ads are preloaded for better user experience

### 2. Reward Calculation
- **Non-premium users**: ₹0.03 per ad
- **Premium users**: ₹0.06 per ad
- Rewards are credited directly to wallet (no transaction record)

### 3. Integration Points

#### TipTube Screen
```typescript
// Call this when a video is completed
const handleVideoCompletion = useCallback((videoId: number) => {
  console.log(`[TipTube] Video ${videoId} completed`);
  if (!isGuest) {
    handleAdView(); // This triggers the reward ad system
  }
}, [handleAdView, isGuest]);
```

#### TipShorts Screen
```typescript
// Call this when a video is completed
const handleVideoCompletion = useCallback((videoId: string) => {
  console.log(`[TipShorts] Video ${videoId} completed`);
  if (!isGuest) {
    handleAdView(); // This triggers the reward ad system
  }
}, [handleAdView, isGuest]);
```

### 4. Reward Popup
After ad completion, users see a popup with:
- Earned amount display
- "Start Now" button (confirms reward)
- "Upgrade Premium" button (for non-premium users)
- "Cancel" button

### 5. Backend Integration
- New API endpoint: `POST /api/wallet/credit-ad-reward`
- Updates wallet balance directly (no transaction record)
- Parameters: `{ userId, amount }`

## Usage Instructions

### For Video Components
1. Call `handleVideoCompletion(videoId)` when a video ends
2. The system automatically tracks view count
3. After 5 videos, reward ad shows automatically
4. User watches ad and gets reward popup
5. On confirmation, wallet is credited

### For Testing
- Use test ad unit IDs in development
- Check console logs for ad loading/error states
- Verify wallet balance updates after reward confirmation

## Configuration

### Ad Unit IDs
- **Test**: Uses Google's test rewarded ad unit
- **Production**: Uses your configured ad unit IDs

### Reward Intervals
- Currently set to show ad after every 5 videos
- Can be adjusted by changing `REWARD_INTERVAL` constant

### Reward Amounts
- Non-premium: ₹0.03 per ad
- Premium: ₹0.06 per ad
- Can be adjusted by changing `NON_PREMIUM_REWARD` and `PREMIUM_REWARD` constants

## Error Handling
- Ad loading failures are handled gracefully
- Retry mechanism for failed ad loads
- User-friendly error messages
- Fallback behavior when ads are unavailable

## Notes
- Only works for authenticated users
- Guest users see login prompts instead
- Ads are preloaded for better performance
- Reward popup appears after successful ad completion 