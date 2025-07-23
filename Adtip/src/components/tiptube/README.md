# TipTube Redesign

This directory contains the redesigned TipTube components that implement a YouTube-style interface as specified in the design requirements.

## Components

### TipTubeHeader
A custom header component that replaces the generic header for TipTube screens.

**Features:**
- Tiptube logo with red toggle switch
- Share, Cast, Search, and Profile icons
- Responsive design with proper spacing
- Theme support for light/dark modes

**Usage:**
```tsx
<TipTubeHeader 
  onSearchPress={() => setSearchActive(true)}
  onProfilePress={() => navigation.navigate('Library')}
  onSharePress={() => handleShare()}
  onCastPress={() => handleCast()}
/>
```

### CategoryTabs
Horizontal scrolling category tabs for filtering content.

**Features:**
- Smooth scrolling with auto-centering
- Green highlight for selected category
- Responsive design
- Animated transitions

**Usage:**
```tsx
<CategoryTabs
  categories={categories}
  selectedCategory={selectedCategory}
  onCategoryChange={handleCategoryChange}
/>
```

### YouTubeStyleVideoCard
Full-width video card component matching YouTube's design.

**Features:**
- 16:9 aspect ratio thumbnail
- Duration overlay
- Creator info with avatar
- Follow button
- Price badge for paid content
- Responsive dimensions

**Usage:**
```tsx
<YouTubeStyleVideoCard
  video={videoData}
  onPress={() => handleVideoPress(video)}
  onChannelPress={() => handleChannelPress(video)}
  onFollowPress={() => handleFollow(video)}
  isFollowing={false}
/>
```

### TipShortsSection
Horizontal grid section for TipShorts content.

**Features:**
- 2-column grid layout
- "See All" navigation
- Overlay text on thumbnails
- Responsive card sizing

**Usage:**
```tsx
<TipShortsSection 
  shorts={shortsData}
  onSeeAllPress={() => navigation.navigate('TipShorts')}
/>
```

## Screens

### YourChannelScreen
User's personal channel management screen.

**Features:**
- Profile section with stats
- Video Management button
- Action icons (star, edit, analytics)
- Tabs for Home/InShorts/Products
- Video grid layout

### FollowedChannelScreen
Grid view of followed channels.

**Features:**
- 2-column responsive grid
- Channel avatars and names
- Following/Unfollow buttons
- Empty state handling

### LibraryScreen
Menu-based navigation screen for TipTube features.

**Features:**
- List of navigation options
- Proper icons for each menu item
- Consistent styling
- Navigation to various TipTube features

## Theme Support

All components use the `tiptubeTheme.ts` utility for:
- Responsive spacing and typography
- Consistent color schemes
- Dark/light mode support
- Proper aspect ratios

## Navigation Integration

The redesign integrates with the existing navigation structure:
- New screens added to MainNavigator
- Proper transition animations
- Guest user handling
- Deep linking support

## Responsive Design

All components are responsive and work across different screen sizes:
- Phone (320px - 414px)
- Large phones (414px+)
- Tablets (768px+)

## Usage in Main TipTube Screen

The main TipTubeScreen has been updated to use these new components:

```tsx
// Replace old header
<TipTubeHeader onSearchPress={handleSearch} />

// Replace old categories
<CategoryTabs 
  categories={categories}
  selectedCategory={selectedCategory}
  onCategoryChange={handleCategoryChange}
/>

// Add TipShorts section
<TipShortsSection onSeeAllPress={handleNavigateToTipShorts} />

// Use new video cards
<YouTubeStyleVideoCard video={item} onPress={handleVideoPress} />
```

## Testing

To test the implementation:
1. Navigate to TipTube tab
2. Verify header displays correctly
3. Test category switching
4. Check video card interactions
5. Navigate to new screens (Your Channel, Library, etc.)
6. Test responsive behavior on different screen sizes
7. Verify dark/light theme switching
