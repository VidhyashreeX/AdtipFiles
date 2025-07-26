# CPX Research Survey Integration

## Overview

This document describes the integration of CPX Research Survey system to replace the Rush Play Games feature in the ADTIP React Native application. The integration provides monetization through surveys with 4x earning potential for premium users.

## Features Implemented

### 1. Survey Banner Component
- **Location**: `src/components/home/SurveyBanner.tsx`
- **Replaces**: RushPlayGamesBanner in HomeScreen.tsx
- **Features**:
  - Different UI states for guest, regular, and premium users
  - 4x earning messaging for premium users
  - Real-time survey count display
  - Proper error handling and loading states
  - Integration with CPX Research SDK

### 2. CPX Research Configuration
- **Location**: `src/config/cpxResearchConfig.ts`
- **Features**:
  - App ID and user ID configuration
  - Theme-based styling that matches app design
  - Premium user detection and 4x multiplier
  - Guest mode handling
  - Widget configuration for different user types

### 3. Reward Processing Service
- **Location**: `src/services/CPXRewardService.ts`
- **Features**:
  - Survey completion reward processing
  - Integration with existing wallet system
  - Local storage for offline capability
  - Transaction sync with backend
  - Premium multiplier calculation (4x for premium users)

### 4. API Integration
- **Location**: `src/constants/api.ts`
- **Configuration**:
  ```typescript
  export const CPX_RESEARCH_APP_ID = '16548';
  export const CPX_RESEARCH_BASE_URL = 'https://offers.cpx-research.com';
  export const CPX_RESEARCH_API_URL = 'https://live-api.cpx-research.com/api/get-surveys.php';
  ```

## User Experience

### Guest Users
- See survey banner with login prompt
- Cannot access surveys until authenticated
- Banner shows "Login to Start" message
- Uses app's secondary purple color scheme

### Regular Users
- Access to all available surveys
- Standard earning rates
- Green color scheme matching app's primary colors
- Real-time survey count display

### Premium Users
- 4x earning multiplier on all surveys
- Gold color scheme for premium branding
- "Earn 4x Now!" messaging
- Priority access to high-value surveys

## Technical Implementation

### Dependencies
- `cpx-research-sdk-react-native`: Main SDK for survey integration
- `react-native-webview`: Required dependency (already installed)
- Compatible with React Native 0.79.2

### Key Components

#### SurveyBanner Component
```typescript
interface SurveyBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
  onRewardEarned?: (amount: number, isPremium: boolean) => void;
  style?: any;
}
```

#### CPX Research Configuration
```typescript
interface CPXResearchConfig {
  appId: string;
  userId: string;
  accentColor: string;
  isHidden: boolean;
  notificationWidget?: CPXNotificationWidgetConfig;
}
```

#### Reward Processing
```typescript
interface CPXRewardResponse {
  success: boolean;
  transaction_id?: string;
  new_balance?: string;
  message?: string;
  error?: string;
}
```

## Integration Points

### HomeScreen.tsx Changes
1. **Import Added**: `import SurveyBanner from '../../components/home/SurveyBanner';`
2. **Component Replaced**: RushPlayGamesBanner → SurveyBanner
3. **Props Maintained**: Same interface for seamless replacement
4. **Styling Removed**: Old RushPlayGamesBanner styles cleaned up

### Wallet Integration
- Rewards are processed through existing wallet system
- Uses `ApiService.creditAdReward()` as fallback
- Integrates with `WalletContext` for balance updates
- Supports both primary and fallback API endpoints

### Authentication Integration
- Uses `AuthContext` for user state management
- Handles guest mode appropriately
- Premium status detection from user context
- Automatic user ID passing to CPX Research SDK

## Testing

### Test Component
- **Location**: `src/tests/CPXResearchIntegrationTest.tsx`
- **Features**:
  - Configuration generation testing
  - Reward service testing
  - Component rendering verification
  - Storage operations testing
  - Mock reward processing

### Test Scenarios
1. **Guest User**: Login prompt, no survey access
2. **Regular User**: Standard surveys, normal earning rates
3. **Premium User**: 4x multiplier, premium messaging
4. **Offline Mode**: Local storage, sync on reconnection
5. **Error Handling**: API failures, network issues

## Configuration

### Environment Setup
1. CPX Research App ID configured in `api.ts`
2. iOS pod install completed for react-native-webview
3. Package.json updated with CPX Research SDK
4. Legacy peer deps flag used for compatibility

### Color Scheme
- **Primary**: #24d05a (App's green)
- **Secondary**: #6b48ff (App's purple)
- **Premium**: #FFD700 (Gold)
- **Background**: #f8fafc (App's background)
- **Text**: #0f172a (App's text)

## Earning Structure

### Regular Users
- Base survey rewards as provided by CPX Research
- Standard earning rates
- Green color scheme

### Premium Users
- 4x multiplier on all survey rewards
- Gold color scheme for premium branding
- Priority messaging and UI treatment
- Enhanced reward notifications

## Error Handling

### Network Errors
- Graceful fallback to cached data
- Retry mechanisms for failed transactions
- User-friendly error messages

### API Failures
- Primary API with fallback to existing reward system
- Local storage for offline capability
- Sync on reconnection

### User Experience
- Loading states during survey processing
- Clear success/failure notifications
- Consistent error messaging

## Future Enhancements

### Potential Improvements
1. **Analytics**: Track survey completion rates
2. **Personalization**: Targeted survey recommendations
3. **Gamification**: Survey streaks and achievements
4. **Social Features**: Share survey completions
5. **Advanced Filtering**: Survey categories and preferences

### Backend Integration
1. **Dedicated API**: Create survey-specific reward endpoint
2. **Analytics Dashboard**: Track survey performance
3. **User Preferences**: Store survey preferences
4. **Reporting**: Survey completion and earning reports

## Maintenance

### Regular Tasks
1. Monitor CPX Research SDK updates
2. Update app ID if needed
3. Review earning rates and multipliers
4. Test integration with app updates
5. Monitor user feedback and usage analytics

### Troubleshooting
1. Check CPX Research SDK logs
2. Verify API endpoints are accessible
3. Test reward processing flow
4. Validate user authentication state
5. Review local storage data

## Support

For issues related to CPX Research integration:
1. Check component logs in development
2. Use the test component for debugging
3. Verify user authentication state
4. Test with different user types (guest, regular, premium)
5. Review network connectivity and API responses
