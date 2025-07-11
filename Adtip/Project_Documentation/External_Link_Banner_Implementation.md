# External Link Banner Implementation

## Overview

This document describes the implementation of a premium-only external link banner that navigates to `https://37b802eb.epicplay.in/` for premium users, while showing an upgrade prompt for non-premium users.

## Features Implemented

### 1. Premium-Only Access
- **Location**: `src/screens/home/HomeScreen.tsx`
- **Component**: `ExternalLinkBanner`
- **Check**: Premium status is verified before allowing access to external link
- **Fallback**: Shows upgrade navigation for non-premium users

### 2. External Link Navigation
- **URL**: `https://37b802eb.epicplay.in/`
- **Method**: Uses React Native's `Linking.openURL()` to open in external browser
- **Error Handling**: Shows alert if URL cannot be opened

### 3. Visual Design
- **Premium Users**: Green gradient (`#4CAF50`, `#45A049`) with "Click to play exciting games and earn rewards!" message
- **Non-Premium Users**: Gold gradient (`#FFD700`, `#FFB300`) with "Upgrade to Premium to unlock this feature" message and "Premium Only" badge
- **Icon**: Gamepad2 icon from Lucide React Native
- **Positioning**: Above the "Play & Earn" section in the home screen

## Implementation Details

### Component Structure
```typescript
interface ExternalLinkBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

const ExternalLinkBanner: React.FC<ExternalLinkBannerProps> = ({ isPremium, onUpgrade }) => {
  // Component implementation
};
```

### Premium Check Logic
```typescript
const handleBannerPress = async () => {
  if (!isPremium) {
    onUpgrade();
    return;
  }

  try {
    const url = 'https://37b802eb.epicplay.in/';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open the link. Please try again later.');
    }
  } catch (error) {
    console.error('Error opening external link:', error);
    Alert.alert('Error', 'Failed to open the link. Please try again.');
  }
};
```

### Integration in HomeScreen
```typescript
// In ListHeaderComponent
<ExternalLinkBanner 
  isPremium={isPremium} 
  onUpgrade={() => navigation.navigate('PremiumUser' as never)} 
/>
```

## User Experience Flow

### For Premium Users:
1. User sees green banner with "🎮 Epic Play Games" title
2. User clicks on banner
3. External URL opens in device's default browser
4. User can play games and earn rewards

### For Non-Premium Users:
1. User sees gold banner with "🎮 Epic Play Games" title and "Premium Only" badge
2. User clicks on banner
3. Navigation to PremiumUser screen is triggered
4. User can upgrade to premium to unlock the feature

## Styling

### Container Styles
```typescript
externalLinkBannerSection: {
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},
externalLinkBannerContainer: {
  paddingHorizontal: 16,
  paddingVertical: 12,
},
```

### Banner Styles
```typescript
externalLinkBannerGradient: {
  borderRadius: 12,
  padding: 16,
  minHeight: 100,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
```

## Error Handling

1. **URL Support Check**: Verifies if device can open the URL before attempting
2. **Network Errors**: Shows user-friendly error messages
3. **Navigation Errors**: Graceful fallback to upgrade flow

## Testing

The implementation includes:
- Premium status checking
- External URL opening
- Error handling for unsupported URLs
- Visual feedback for different user states
- Consistent styling with existing earn cards

## Future Enhancements

1. **Analytics Tracking**: Track banner clicks and conversion rates
2. **A/B Testing**: Test different banner designs and messages
3. **Deep Linking**: Consider in-app web view for better user experience
4. **Caching**: Cache premium status to reduce API calls 