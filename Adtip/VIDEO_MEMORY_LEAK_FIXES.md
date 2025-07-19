# Video Memory Leak Fixes

## Overview
This document outlines comprehensive fixes for video memory leaks in the React Native application. Video components are major sources of memory leaks if not properly managed.

## Common Video Memory Leak Sources

### 1. Unmounted Component State Updates
- Video callbacks firing after component unmount
- State updates on unmounted components
- Timer callbacks continuing after unmount

### 2. Resource Not Released
- Video buffers not cleared
- Native video players not properly disposed
- Event listeners not removed

### 3. Background Playback
- Videos continuing to play when app is backgrounded
- Multiple videos playing simultaneously
- Video resources held in memory unnecessarily

## Implemented Solutions

### 1. Enhanced Video Cleanup Hook (`useVideoCleanup.ts`)

**Features:**
- Automatic video ref registration and cleanup
- Timer management and cleanup
- App state handling for background/foreground
- Comprehensive resource cleanup on unmount

**Usage:**
```typescript
import { useVideoCleanup } from '../hooks/useVideoCleanup';

const MyVideoComponent = () => {
  const { registerVideoRef, cleanup } = useVideoCleanup();
  const videoRef = useRef(null);

  useEffect(() => {
    registerVideoRef(videoRef);
  }, []);

  // Cleanup is automatic on unmount
};
```

### 2. Enhanced Video Component (`EnhancedVideo.tsx`)

**Features:**
- Automatic cleanup on unmount
- App state handling
- Memory-optimized buffer settings
- Safe callback handling
- Ref management

**Usage:**
```typescript
import EnhancedVideo from '../components/common/EnhancedVideo';

<EnhancedVideo
  source={{ uri: videoUrl }}
  paused={!isPlaying}
  enableAutoCleanup={true}
  pauseOnAppBackground={true}
  debugTag="MyComponent"
  onCleanup={() => console.log('Video cleaned up')}
/>
```

### 3. Optimized Video Player (Updated)

**Improvements:**
- Mount state tracking with `isMountedRef`
- Safe state setters that check mount status
- Enhanced error handling
- Proper callback cleanup
- Memory-optimized video settings

## Memory Optimization Settings

### Buffer Configuration
```typescript
bufferConfig={{
  minBufferMs: 1500,        // Reduced from default
  maxBufferMs: 5000,        // Reduced from default
  bufferForPlaybackMs: 1000,
  bufferForPlaybackAfterRebufferMs: 1500,
}}
```

### Video Properties
```typescript
// Memory-saving settings
playInBackground={false}           // Prevent background playback
playWhenInactive={false}          // Pause when app inactive
disableFocus={true}               // Prevent focus memory leaks
hideShutterView={true}            // Hide shutter to save memory
maxBitRate={2000000}              // Limit bitrate to 2Mbps
reportBandwidth={false}           // Disable bandwidth reporting
preventsDisplaySleepDuringVideoPlayback={false} // Allow display sleep
```

## Component-Specific Fixes

### 1. TipShorts OptimizedVideoPlayer

**Before Issues:**
- No mount state tracking
- State updates after unmount
- No proper cleanup

**After Fixes:**
- `isMountedRef` for mount tracking
- Safe state setters
- Enhanced cleanup on unmount
- Memory-optimized video settings

### 2. VideoPlayerModal

**Recommended Fixes:**
```typescript
// Add to VideoPlayerModal
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
    // Stop video playback
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };
}, []);
```

### 3. PostItem Video

**Recommended Fixes:**
```typescript
// Add cleanup to PostItem
useEffect(() => {
  return () => {
    // Clear any video-related timers
    // Reset video state
    setIsPlaying(false);
    setVideoError(false);
  };
}, []);
```

## App-Level Optimizations

### 1. Global Video Management

```typescript
// In App.tsx or main component
import { useVideoCleanup } from './src/hooks/useVideoCleanup';

const App = () => {
  const { pauseAllVideos, cleanup } = useVideoCleanup();

  useEffect(() => {
    const handleMemoryWarning = () => {
      console.log('Memory warning - pausing all videos');
      pauseAllVideos();
    };

    // Listen for memory warnings (iOS)
    const subscription = DeviceEventEmitter.addListener(
      'memoryWarning',
      handleMemoryWarning
    );

    return () => {
      subscription?.remove();
      cleanup();
    };
  }, []);
};
```

### 2. Navigation-Based Cleanup

```typescript
// In navigation screens with videos
useFocusEffect(
  useCallback(() => {
    return () => {
      // Cleanup when screen loses focus
      pauseAllVideos();
    };
  }, [])
);
```

## Testing Memory Leaks

### 1. Development Testing

```typescript
// Add to video components for debugging
useEffect(() => {
  console.log('[VideoComponent] Mounted');
  return () => {
    console.log('[VideoComponent] Unmounted - cleaning up');
  };
}, []);
```

### 2. Memory Monitoring

```typescript
// Monitor memory usage
const checkMemoryUsage = () => {
  if (__DEV__) {
    console.log('Memory usage check - implement native bridge if needed');
  }
};
```

## Migration Checklist

### Immediate Actions (High Priority)
- [x] Create `useVideoCleanup` hook
- [x] Create `EnhancedVideo` component
- [x] Fix `OptimizedVideoPlayer` in TipShorts
- [ ] Update `VideoPlayerModal` component
- [ ] Update `PostItem` video handling
- [ ] Update `VideoScreen` component

### Medium Priority
- [ ] Replace all Video components with EnhancedVideo
- [ ] Add memory monitoring in development
- [ ] Implement global video management
- [ ] Add navigation-based cleanup

### Testing
- [ ] Test video playback after fixes
- [ ] Test app backgrounding/foregrounding
- [ ] Test component unmounting
- [ ] Test memory usage with multiple videos
- [ ] Test on low-memory devices

## Performance Benefits

### Before Fixes
- Memory leaks from unmounted video components
- Multiple videos playing simultaneously
- High memory usage from video buffers
- App crashes on low-memory devices

### After Fixes
- Automatic cleanup prevents memory leaks
- Proper video resource management
- Optimized buffer settings reduce memory usage
- Better performance on low-memory devices

## Best Practices

### 1. Always Use Cleanup Hooks
```typescript
// Good
const { cleanup } = useVideoCleanup();
useEffect(() => cleanup, []);

// Bad
// No cleanup on unmount
```

### 2. Check Mount Status in Callbacks
```typescript
// Good
const handleVideoLoad = useCallback((data) => {
  if (!isMountedRef.current) return;
  setVideoData(data);
}, []);

// Bad
const handleVideoLoad = (data) => {
  setVideoData(data); // May update unmounted component
};
```

### 3. Use Memory-Optimized Settings
```typescript
// Good
<Video
  playInBackground={false}
  disableFocus={true}
  hideShutterView={true}
  maxBitRate={2000000}
/>

// Bad
<Video /> // Uses default settings that may consume more memory
```

These fixes will significantly reduce memory usage and prevent crashes related to video playback.
