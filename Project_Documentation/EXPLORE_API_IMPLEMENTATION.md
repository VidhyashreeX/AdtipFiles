# Explore API Implementation

## Overview
Successfully implemented the Explore API integration with TanStack Query for optimal performance and caching.

## API Details

### Endpoint
- **URL**: `/api/explore`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)

### Request Format
```json
{
  "page": 1,
  "limit": 10,
  "loggined_user_id": 58422
}
```

### Response Format
```json
{
  "status": true,
  "message": "Explore content fetched successfully",
  "data": [
    {
      "id": 195,
      "user_id": 39541,
      "title": "താടി മുന്ജലു",
      "content": "താടി മുന്ജലु",
      "media_url": "https://theadtip.in/images/scaled_IMG_20250221_132801.jpg",
      "media_type": "image",
      "is_promoted": 0,
      "video_category_id": 28,
      "user_name": "Supriya",
      "user_profile_image": "https://theadtip.in/images/scaled_IMG_20220609_124025-removebg-preview.png",
      "address": "JQJ4+52W, Uppusaka, Telangana, India-507114",
      "premium_plan_id": 1,
      "post_promotion_id": null,
      "target_min_age": null,
      "target_max_age": null,
      "reach_goal": null,
      "duration_days": null,
      "pay_per_view": null,
      "total_pay": null,
      "platform_fee": null,
      "likeCount": 48,
      "commentCount": 0,
      "is_liked": false,
      "content_type": "post"
    },
    {
      "id": 195,
      "name": "funny",
      "category_id": 0,
      "media_url": "https://theadtip.in/videos/1000123911.mp4",
      "content": "funny",
      "total_views": 0,
      "total_likes": 42,
      "user_id": 413,
      "thumbnail": "https://theadtip.in/image/1000129065.png",
      "is_liked": false,
      "channel_follow": null,
      "user_name": "maha",
      "user_profile_image": "https://theadtip.in/image/1000121510.png",
      "channelId": 185,
      "total_comments": 0,
      "content_type": "shot"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_page": 314,
    "total_count": 1570
  }
}
```

## Implementation Details

### 1. API Service (ApiService.ts)
- Added `getExploreContent` method with proper TypeScript interfaces
- Includes logging for debugging
- Handles authentication automatically via interceptors

### 2. TypeScript Types (api.ts)
- Created `ExploreContentRequest` interface
- Created `ExploreContentResponse` interface
- Created `ExploreItem` interface that handles both posts and shots

### 3. React Query Hook (useQueries.ts)
- Implemented `useExplore` hook using TanStack Query's `useInfiniteQuery`
- Automatic pagination support
- Smart caching with 10-minute stale time
- Optimistic updates and error handling

### 4. UI Component (ExploreScreen.tsx)
- Updated to use the new `useExplore` hook
- Proper handling of mixed content types (posts and shots)
- Optimized rendering with memoization
- Loading skeletons and error states
- Pull-to-refresh and infinite scroll

## Key Features

### Performance Optimizations
- **TanStack Query Integration**: Automatic caching, background refetching, and optimistic updates
- **Memoized Components**: `renderItem`, `keyExtractor`, and other expensive operations are memoized
- **Virtual Scrolling**: FlatList optimizations with `removeClippedSubviews` and windowing
- **Image Caching**: Proper image URL handling with fallbacks

### User Experience
- **Loading States**: Skeleton screens during initial load
- **Error Handling**: User-friendly error messages with retry buttons
- **Infinite Scroll**: Automatic loading of more content
- **Pull to Refresh**: Manual refresh capability
- **Mixed Content**: Handles both posts and shots in a unified grid

### Data Management
- **Real-time User ID**: Uses authenticated user ID from AuthContext
- **Offline Support**: TanStack Query handles offline scenarios
- **Smart Pagination**: Based on API response pagination metadata
- **Type Safety**: Full TypeScript support with proper interfaces

## Usage

The ExploreScreen will automatically:
1. Load explore content for the authenticated user
2. Display a 3-column grid of posts and shots
3. Show play icons on video content
4. Handle navigation to VideoPreview or TipShorts screens
5. Provide infinite scrolling and pull-to-refresh

## File Changes

1. **ApiService.ts**: Added `getExploreContent` method
2. **api.ts**: Added explore-related TypeScript interfaces
3. **useQueries.ts**: Added `useExplore` hook
4. **ExploreScreen.tsx**: Complete refactor to use new API and hook
5. **apiEndpoints.ts**: Already had the correct endpoint

## Error Handling

The implementation includes comprehensive error handling:
- Network errors are caught and displayed
- Retry functionality for failed requests
- Graceful fallbacks for missing data
- Loading states during API calls

## Testing

To test the implementation:
1. Ensure user is authenticated
2. Navigate to the Explore screen
3. Verify content loads in a 3-column grid
4. Test pull-to-refresh functionality
5. Test infinite scrolling
6. Test navigation to individual posts/shots
