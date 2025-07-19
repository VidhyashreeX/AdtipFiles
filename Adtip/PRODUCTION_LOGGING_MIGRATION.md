# Production Logging Migration Guide

## Overview
This guide outlines the migration from console.log statements to a production-ready logging system that automatically disables console output in production builds while maintaining proper logging for debugging and crash reporting.

## Benefits

### Before (Issues with console.log)
- Console logs appear in production builds
- No centralized log management
- Difficult to debug production issues
- No log persistence
- Performance impact in production
- No log levels or filtering

### After (With LoggingService)
- Console logs automatically disabled in production
- Centralized log management
- Persistent logging to AsyncStorage
- Log levels (DEBUG, INFO, WARN, ERROR)
- Remote logging capability for crash reporting
- Better performance in production
- Easy log export for support

## Installation

The LoggingService is already created. No additional dependencies required.

## Usage Examples

### Basic Usage

**Before:**
```typescript
console.log('User logged in:', user);
console.warn('API response slow:', responseTime);
console.error('Upload failed:', error);
```

**After:**
```typescript
import Logger from '../utils/logger';

Logger.info('Auth', 'User logged in', user);
Logger.warn('API', 'API response slow', { responseTime });
Logger.error('Upload', 'Upload failed', error);
```

### Tagged Loggers (Recommended)

**Before:**
```typescript
console.log('[TipShorts] Video started playing:', videoId);
console.log('[TipShorts] User scrolled to video:', index);
console.error('[TipShorts] Video load failed:', error);
```

**After:**
```typescript
import { TipShortsLogger } from '../utils/logger';

TipShortsLogger.info('Video started playing', { videoId });
TipShortsLogger.debug('User scrolled to video', { index });
TipShortsLogger.error('Video load failed', error);
```

### Component-Specific Loggers

```typescript
// In TipShortsEnhanced.tsx
import { TipShortsLogger } from '../utils/logger';

const TipShortsEnhanced = () => {
  useEffect(() => {
    TipShortsLogger.info('Component mounted');
    
    return () => {
      TipShortsLogger.info('Component unmounted');
    };
  }, []);

  const handleVideoView = () => {
    TipShortsLogger.debug('Video viewed', { activeIndex });
  };

  const handleError = (error: Error) => {
    TipShortsLogger.error('Component error', error);
  };
};
```

## Migration Strategy

### Phase 1: High-Priority Components (Immediate)
Replace console.log in critical components:
- Authentication flows
- Payment processing
- Video upload/playback
- API calls

### Phase 2: User-Facing Features
- TipShorts and TipTube screens
- Channel management
- Campaign creation
- Navigation

### Phase 3: Utility and Service Classes
- CloudflareUploadService
- ApiService
- Background services

### Phase 4: Complete Migration
- All remaining console.log statements
- Add proper error boundaries with logging

## Available Tagged Loggers

```typescript
import {
  AuthLogger,      // Authentication flows
  ApiLogger,       // API calls
  VideoLogger,     // Video playback/upload
  UploadLogger,    // File uploads
  PaymentLogger,   // Payment processing
  NavigationLogger,// Navigation events
  TipShortsLogger, // TipShorts feature
  TipTubeLogger,   // TipTube feature
  ChannelLogger,   // Channel management
  CampaignLogger,  // Campaign creation
} from '../utils/logger';
```

## Log Levels

### DEBUG (Development Only)
Use for detailed debugging information:
```typescript
TipShortsLogger.debug('Video progress updated', { progress: 0.5 });
```

### INFO
Use for general information:
```typescript
AuthLogger.info('User logged in successfully', { userId });
```

### WARN
Use for potential issues:
```typescript
ApiLogger.warn('API response slow', { responseTime: 5000 });
```

### ERROR
Use for errors and exceptions:
```typescript
UploadLogger.error('File upload failed', error);
```

## Configuration

The logging service can be configured:

```typescript
import LoggingService from '../services/LoggingService';

// Enable remote logging for crash reporting
LoggingService.updateConfig({
  enableRemoteLogging: true,
  remoteEndpoint: 'https://your-logging-service.com/logs',
  minLogLevel: LogLevel.WARN, // Only log warnings and errors
});
```

## Log Management

### Export Logs for Support
```typescript
import Logger from '../utils/logger';

const exportLogs = async () => {
  const logs = await Logger.exportLogs();
  // Share logs with support team
  Share.share({ message: logs });
};
```

### Clear Logs
```typescript
await Logger.clearLogs();
```

### View Logs (Debug Screen)
```typescript
const logs = await Logger.getLogs();
console.table(logs); // Only in development
```

## Production Behavior

### Development Mode (__DEV__ = true)
- All console.log statements work normally
- Logs are saved to AsyncStorage
- All log levels are shown

### Production Mode (__DEV__ = false)
- console.log statements are automatically disabled
- Only WARN and ERROR logs are saved
- Logs can be exported for support
- Remote logging for crash reporting

## Performance Impact

### Development
- Minimal impact (same as console.log)
- Logs are buffered and saved periodically

### Production
- No console output (better performance)
- Only critical logs are saved
- Automatic cleanup of old logs

## Migration Checklist

### Immediate Actions
- [ ] Replace console.log in authentication flows
- [ ] Replace console.log in payment processing
- [ ] Replace console.log in video upload/playback
- [ ] Replace console.log in API calls

### Component Updates
- [ ] TipShortsEnhanced.tsx
- [ ] TipTubeScreen.tsx
- [ ] ChannelScreen.tsx
- [ ] CreateCampaignScreen.tsx
- [ ] VideoPlayerModal.tsx

### Service Updates
- [ ] CloudflareUploadService.ts
- [ ] ApiService.ts
- [ ] useVideoRewardAd.ts

### Testing
- [ ] Test logging in development mode
- [ ] Test console.log disabled in production build
- [ ] Test log export functionality
- [ ] Test log persistence across app restarts

## Example Migration

**Before (CreateCampaignScreen.tsx):**
```typescript
console.log('[CreateCampaign] Starting upload:', mediaUri);
console.error('[CreateCampaign] Upload failed:', error);
```

**After:**
```typescript
import { CampaignLogger } from '../utils/logger';

CampaignLogger.info('Starting upload', { mediaUri });
CampaignLogger.error('Upload failed', error);
```

## Remote Logging Setup (Optional)

For crash reporting and production debugging:

```typescript
// In App.tsx or main entry point
import LoggingService, { LogLevel } from './src/services/LoggingService';

// Configure for production
if (!__DEV__) {
  LoggingService.updateConfig({
    enableRemoteLogging: true,
    remoteEndpoint: 'https://your-crash-reporting-service.com/logs',
    minLogLevel: LogLevel.ERROR, // Only send errors to remote
  });
}
```

This migration will significantly improve the app's production performance and debugging capabilities while maintaining full development functionality.
