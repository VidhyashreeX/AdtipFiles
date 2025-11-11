# Watch To Earn - Developer Integration Guide

## Overview
This guide helps developers integrate and use the Watch To Earn feature in the AdTip React Native application.

**Target Audience:** React Native Developers  
**Difficulty Level:** Intermediate  
**Estimated Integration Time:** 30-60 minutes (feature already implemented)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Component Usage](#component-usage)
4. [Hook Usage](#hook-usage)
5. [API Integration](#api-integration)
6. [Navigation Setup](#navigation-setup)
7. [Customization Guide](#customization-guide)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Layer Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Screens Layer                     │
│  WatchToEarnScreen | AdViewScreen | AdHistoryScreen │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│                Components Layer                     │
│  AdCard | AdPlayer | WebsiteVisitModal | QuizModal  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│                   Hooks Layer                       │
│         useAdViewer | useAdList                     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│                 Services Layer                      │
│              AdViewerService                        │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│                  Backend API                        │
│         8 Endpoints for Ad Viewing                  │
└─────────────────────────────────────────────────────┘
```

### File Structure
```
src/
├── screens/
│   └── watchToEarn/
│       ├── WatchToEarnScreen.tsx       # Ad list screen
│       ├── AdViewScreen.tsx            # Full-screen ad viewer
│       ├── AdHistoryScreen.tsx         # Viewing history
│       └── index.ts                    # Exports
├── components/
│   └── ads/
│       ├── AdCard.tsx                  # Ad preview card
│       ├── AdPlayer.tsx                # Video/image player
│       ├── WebsiteVisitModal.tsx       # Website visit modal
│       ├── QuizModal.tsx               # Quiz modal
│       ├── AdTypeBadge.tsx             # Type indicator
│       └── index.ts                    # Exports
├── hooks/
│   ├── useAdViewer.ts                  # Ad session management
│   ├── useAdList.ts                    # Ad list management
│   └── index.ts                        # Exports
├── services/
│   └── AdViewerService.ts              # API integration
├── types/
│   ├── ads.ts                          # Type definitions
│   └── navigation.ts                   # Navigation types
└── navigation/
    └── MainNavigator.tsx               # Screen registration
```

---

## Quick Start

### 1. Import Components

```typescript
// Import screens
import { WatchToEarnScreen, AdViewScreen, AdHistoryScreen } from '@/screens/watchToEarn';

// Import components
import { AdCard, AdPlayer, WebsiteVisitModal, QuizModal, AdTypeBadge } from '@/components/ads';

// Import hooks
import { useAdViewer, useAdList } from '@/hooks';

// Import service
import AdViewerService from '@/services/AdViewerService';

// Import types
import type { AdViewData, AdListItem, AdModelType } from '@/types/ads';
```

### 2. Basic Usage Example

```typescript
import React from 'react';
import { View } from 'react-native';
import { useAdList } from '@/hooks';
import { AdCard } from '@/components/ads';

const MyAdList: React.FC = () => {
  const userId = 1; // Get from auth context
  
  const {
    filteredAds,
    isLoading,
    error,
    refetch
  } = useAdList(userId, {
    pageSize: 20,
    autoFetch: true
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <View>
      {filteredAds.map((ad) => (
        <AdCard
          key={ad.ad_id}
          ad={ad}
          onPress={(adId) => console.log('Ad pressed:', adId)}
        />
      ))}
    </View>
  );
};
```

---

## Component Usage

### 1. AdCard Component

**Purpose:** Display ad preview in list view

```typescript
import { AdCard } from '@/components/ads';

<AdCard
  ad={{
    ad_id: 1,
    campaign_name: 'Summer Sale',
    media_url: 'https://example.com/thumb.jpg',
    ad_model_type: 'SKIP',
    view_price: 1.5,
    duration: 30
  }}
  onPress={(adId) => navigation.navigate('AdView', { userId, adId })}
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| ad | AdListItem | Yes | Ad data object |
| onPress | (adId: number) => void | Yes | Callback when card is tapped |

---

### 2. AdPlayer Component

**Purpose:** Play video or display image ads with controls

```typescript
import { AdPlayer } from '@/components/ads';

<AdPlayer
  adData={adData}
  watchTime={watchTime}
  isPlaying={isPlaying}
  canSkip={canSkip}
  skipTimeReached={skipTimeReached}
  completionPercentage={completionPercentage}
  onPlayPause={handlePlayPause}
  onSkip={handleSkip}
  onComplete={handleComplete}
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| adData | AdViewData | Yes | Complete ad data |
| watchTime | number | Yes | Current watch time in seconds |
| isPlaying | boolean | Yes | Playback state |
| canSkip | boolean | Yes | Whether skip is allowed |
| skipTimeReached | boolean | Yes | Whether minimum skip time reached |
| completionPercentage | number | Yes | Progress percentage (0-100) |
| onPlayPause | () => void | Yes | Play/pause callback |
| onSkip | () => void | Yes | Skip callback |
| onComplete | () => void | No | Completion callback |

---

### 3. WebsiteVisitModal Component

**Purpose:** Show website in WebView with timer for brand awareness ads

```typescript
import { WebsiteVisitModal } from '@/components/ads';

<WebsiteVisitModal
  visible={showModal}
  websiteUrl="https://brand-website.com"
  requiredDuration={30}
  onComplete={() => console.log('Visit complete')}
  onClose={() => setShowModal(false)}
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| visible | boolean | Yes | Modal visibility |
| websiteUrl | string | Yes | Website URL to load |
| requiredDuration | number | Yes | Required visit duration (seconds) |
| onComplete | () => void | Yes | Callback after duration met |
| onClose | () => void | Yes | Callback when modal closes |

---

### 4. QuizModal Component

**Purpose:** Display quiz question after ad completion

```typescript
import { QuizModal } from '@/components/ads';

<QuizModal
  visible={showModal}
  question="What color was the car in the ad?"
  options={['Red', 'Blue', 'Green', 'Black']}
  correctAnswer="Red"
  bonusAmount={2.0}
  onSubmit={async (answer) => {
    const correct = answer === 'Red';
    return { correct, earned: correct ? 2.0 : 0 };
  }}
  onClose={() => setShowModal(false)}
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| visible | boolean | Yes | Modal visibility |
| question | string | Yes | Quiz question text |
| options | string[] | Yes | Answer options |
| correctAnswer | string | Yes | Correct answer |
| bonusAmount | number | Yes | Bonus payout amount |
| onSubmit | (answer: string) => Promise<{correct: boolean; earned?: number}> | Yes | Submit callback |
| onClose | () => void | Yes | Close callback |

---

### 5. AdTypeBadge Component

**Purpose:** Display ad type indicator with color coding

```typescript
import { AdTypeBadge } from '@/components/ads';

<AdTypeBadge adType="SKIP" size="medium" />
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| adType | AdModelType | Yes | Ad model type |
| size | 'small' \| 'medium' \| 'large' | No | Badge size (default: 'medium') |

**Ad Type Colors:**
- `NON_SKIP` - Blue (#3b82f6)
- `SKIP` - Green (#22c55e)
- `BRAND_AWARENESS` - Purple (#a855f7)

---

## Hook Usage

### 1. useAdViewer Hook

**Purpose:** Manage ad viewing session lifecycle

```typescript
import { useAdViewer } from '@/hooks';

const AdViewComponent: React.FC = () => {
  const {
    session,
    adData,
    isPlaying,
    watchTime,
    error,
    canSkip,
    skipTimeReached,
    completionPercentage,
    isComplete,
    startAd,
    pauseAd,
    resumeAd,
    skipAd,
    completeAd,
    trackWebsiteVisit,
    submitQuizAnswer,
    reset
  } = useAdViewer();

  // Start ad session
  useEffect(() => {
    startAd(userId, adId);
    return () => reset();
  }, [userId, adId]);

  // Handle completion
  const handleComplete = async () => {
    try {
      const result = await completeAd();
      console.log('Earned:', result.data.totalPayout);
    } catch (error) {
      console.error('Completion failed:', error);
    }
  };

  return (
    <AdPlayer
      adData={adData}
      watchTime={watchTime}
      isPlaying={isPlaying}
      canSkip={canSkip}
      skipTimeReached={skipTimeReached}
      completionPercentage={completionPercentage}
      onPlayPause={isPlaying ? pauseAd : resumeAd}
      onSkip={skipAd}
      onComplete={handleComplete}
    />
  );
};
```

**Return Values:**
| Property | Type | Description |
|----------|------|-------------|
| session | AdSession \| null | Current session data |
| adData | AdViewData \| null | Complete ad data |
| isPlaying | boolean | Playback state |
| watchTime | number | Current watch time |
| error | string \| null | Error message |
| canSkip | boolean | Skip allowed status |
| skipTimeReached | boolean | Minimum skip time reached |
| completionPercentage | number | Progress (0-100) |
| isComplete | boolean | Completion status |
| startAd | (userId, adId) => Promise | Start session function |
| pauseAd | () => void | Pause playback |
| resumeAd | () => void | Resume playback |
| skipAd | () => Promise | Skip ad function |
| completeAd | () => Promise | Complete ad function |
| trackWebsiteVisit | (duration) => Promise | Track website visit |
| submitQuizAnswer | (answer) => Promise | Submit quiz answer |
| reset | () => void | Reset hook state |

---

### 2. useAdList Hook

**Purpose:** Manage ad list fetching and filtering

```typescript
import { useAdList } from '@/hooks';

const AdListComponent: React.FC = () => {
  const userId = 1;
  
  const {
    ads,
    filteredAds,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    totalAds,
    refetch,
    loadMore,
    adTypeFilter,
    setAdTypeFilter
  } = useAdList(userId, {
    pageSize: 20,
    autoFetch: true
  });

  return (
    <FlatList
      data={filteredAds}
      renderItem={({ item }) => <AdCard ad={item} onPress={handlePress} />}
      onRefresh={refetch}
      refreshing={isRefreshing}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
};
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| pageSize | number | 20 | Ads per page |
| autoFetch | boolean | true | Auto-fetch on mount |

**Return Values:**
| Property | Type | Description |
|----------|------|-------------|
| ads | AdListItem[] | All loaded ads |
| filteredAds | AdListItem[] | Filtered ads |
| isLoading | boolean | Initial loading state |
| isRefreshing | boolean | Refresh loading state |
| isLoadingMore | boolean | Pagination loading state |
| error | string \| null | Error message |
| hasMore | boolean | More ads available |
| totalAds | number | Total ad count |
| refetch | () => Promise | Refresh ad list |
| loadMore | () => Promise | Load next page |
| adTypeFilter | AdModelType \| null | Current filter |
| setAdTypeFilter | (type) => void | Set filter |

---

## API Integration

### AdViewerService Methods

All methods are available through the singleton instance:

```typescript
import AdViewerService from '@/services/AdViewerService';
```

### 1. Get Available Ads

```typescript
const response = await AdViewerService.getAvailableAds(
  userId: number,
  adTypeFilter?: AdModelType | null,
  limit?: number,
  offset?: number
);

// Response type
interface AvailableAdsResponse {
  status: number;
  message: string;
  data: {
    ads: AdListItem[];
    total: number;
    hasMore: boolean;
  };
}
```

---

### 2. Start Ad Session

```typescript
const response = await AdViewerService.startSession(
  userId: number,
  adId: number
);

// Response type
interface StartSessionResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    adData: AdViewData;
  };
}
```

---

### 3. Update Watch Time

```typescript
const response = await AdViewerService.updateWatchTime(
  sessionId: string,
  watchTime: number
);

// Response type
interface UpdateWatchTimeResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    watchTime: number;
    canComplete: boolean;
  };
}
```

---

### 4. Skip Ad

```typescript
const response = await AdViewerService.skipAd(
  sessionId: string
);

// Response type
interface SkipAdResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    skipped: boolean;
    payout: number;
    newWalletBalance: number;
  };
}
```

---

### 5. Track Website Visit

```typescript
const response = await AdViewerService.trackWebsiteVisit(
  sessionId: string,
  visitDuration: number
);

// Response type
interface TrackWebsiteVisitResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    websiteVisited: boolean;
    visitDuration: number;
    bonusUnlocked: boolean;
  };
}
```

---

### 6. Submit Quiz Answer

```typescript
const response = await AdViewerService.submitQuizAnswer(
  sessionId: string,
  userAnswer: string
);

// Response type
interface SubmitAnswerResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    correct: boolean;
    bonusUnlocked: boolean;
  };
}
```

---

### 7. Complete Ad View

```typescript
const response = await AdViewerService.completeAdView(
  sessionId: string
);

// Response type
interface CompleteAdViewResponse {
  status: number;
  message: string;
  data: {
    sessionId: string;
    completed: boolean;
    totalPayout: number;
    basePayout: number;
    bonusPayout: number;
    newWalletBalance: number;
  };
}
```

---

### 8. Get Viewing History

```typescript
const response = await AdViewerService.getViewingHistory(
  userId: number,
  limit?: number,
  offset?: number
);

// Response type
interface ViewingHistoryResponse {
  status: number;
  message: string;
  data: Array<{
    session_id: string;
    ad_id: number;
    campaign_name: string;
    ad_model_type: string;
    watch_time: number;
    required_watch_time: number;
    total_payout: number;
    status: string;
    created_at: string;
    completed_at: string;
  }>;
}
```

---

## Navigation Setup

### 1. Register Screens in MainNavigator

```typescript
// MainNavigator.tsx
import AdViewScreen from '../screens/watchToEarn/AdViewScreen';
import AdHistoryScreen from '../screens/watchToEarn/AdHistoryScreen';

<Stack.Screen
  name="AdView"
  component={AdViewScreen}
  options={{
    headerShown: false,
    presentation: 'fullScreenModal',
    animation: 'slide_from_bottom',
  }}
/>
<Stack.Screen
  name="AdHistory"
  component={AdHistoryScreen}
  options={{
    title: 'Ad History',
    headerShown: true,
    animation: 'slide_from_right',
  }}
/>
```

---

### 2. Add Navigation Types

```typescript
// types/navigation.ts
export type MainNavigatorParamList = {
  // ... other screens
  AdView: {
    adId: number;
    userId: number;
  };
  AdHistory: undefined;
};
```

---

### 3. Navigate Between Screens

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainNavigatorParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList>;

const MyComponent: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Navigate to AdView
  const handleAdPress = (adId: number) => {
    navigation.navigate('AdView', { userId: 1, adId });
  };

  // Navigate to AdHistory
  const handleHistoryPress = () => {
    navigation.navigate('AdHistory');
  };

  return (
    // ... UI
  );
};
```

---

## Customization Guide

### 1. Custom Ad Card Design

```typescript
import { AdCard } from '@/components/ads';
import { StyleSheet } from 'react-native';

const CustomAdCard = ({ ad, onPress }) => (
  <View style={styles.customCard}>
    <AdCard
      ad={ad}
      onPress={onPress}
    />
    {/* Add custom elements */}
    <CustomBadge />
  </View>
);

const styles = StyleSheet.create({
  customCard: {
    // Your custom styles
  }
});
```

---

### 2. Custom Theme Colors

```typescript
// Update colors in constants/colors.ts
export const COLORS = {
  primary: '#YOUR_PRIMARY_COLOR',
  // ... other colors
};
```

---

### 3. Custom Ad Types

Add new ad types to the type definitions:

```typescript
// types/ads.ts
export type AdModelType = 
  | 'NON_SKIP'
  | 'SKIP'
  | 'BRAND_AWARENESS'
  | 'YOUR_CUSTOM_TYPE';
```

Update AdTypeBadge to handle new type:

```typescript
// components/ads/AdTypeBadge.tsx
const getAdTypeConfig = (adType: AdModelType) => {
  switch (adType) {
    case 'YOUR_CUSTOM_TYPE':
      return {
        label: 'Custom',
        color: '#YOUR_COLOR',
        icon: 'your-icon'
      };
    // ... other cases
  }
};
```

---

### 4. Custom Payout Logic

Override payout calculation in AdViewerService:

```typescript
// services/AdViewerService.ts
calculatePayout(adData: AdViewData, watchPercentage: number): number {
  // Your custom logic
  return customAmount;
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot read property 'id' of undefined"
**Solution:** Ensure user is authenticated before accessing Watch To Earn

```typescript
const { user } = useAuth();

if (!user?.id) {
  return <LoginPrompt />;
}
```

---

#### 2. "Network request failed"
**Solution:** Check API base URL and network connectivity

```typescript
// constants/api.ts
export const API_BASE_URL = 'https://your-api-url.com';
```

---

#### 3. Video not playing
**Solution:** Check video codec support and URL format

```typescript
// Supported formats: mp4 (H.264), webm
const validUrl = adData.media_url.match(/\.(mp4|webm)$/);
```

---

#### 4. TypeScript errors in navigation
**Solution:** Ensure navigation types are properly defined

```typescript
// Always use typed navigation
const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();
```

---

#### 5. State not updating
**Solution:** Use proper React hooks and dependencies

```typescript
useEffect(() => {
  fetchData();
}, [dependency]); // Include all dependencies
```

---

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch:

```typescript
try {
  const result = await AdViewerService.completeAdView(sessionId);
  handleSuccess(result);
} catch (error) {
  console.error('[AdView] Error:', error);
  handleError(error);
}
```

---

### 2. Loading States

Show loading indicators for better UX:

```typescript
{isLoading && <ActivityIndicator />}
{error && <ErrorMessage error={error} />}
{!isLoading && !error && <Content />}
```

---

### 3. Memory Management

Clean up on unmount:

```typescript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    reset();
  };
}, []);
```

---

### 4. Type Safety

Use TypeScript properly:

```typescript
// Define types for all props
interface MyComponentProps {
  adId: number;
  userId: number;
  onComplete: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ adId, userId, onComplete }) => {
  // Implementation
};
```

---

## Support

**For Development Questions:**
- Email: dev@adtip.com
- Slack: #watch-to-earn-dev
- Documentation: [Internal Wiki]

**Code Repository:**
- Frontend: github.com/adtip/adtip-reactnative
- Backend: github.com/adtip/adtipback

---

**Document Version:** 1.0.0  
**Last Updated:** November 11, 2025  
**Maintainer:** Development Team
