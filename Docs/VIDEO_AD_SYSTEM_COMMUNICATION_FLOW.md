# Frontend-Backend Communication Flow

## Overview

This document explains **how the TiptubePlayer frontend and Adtipback backend communicate** to create a seamless ad experience.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              TiptubePlayer Component                      │ │
│  │                                                           │ │
│  │  [State]                                                  │ │
│  │  - isAdPlaying: false                                     │ │
│  │  - currentAdData: null                                    │ │
│  │  - preRollComplete: false                                 │ │
│  │  - midRollCuePoints: [180, 360]                           │ │
│  │                                                           │ │
│  │  [Lifecycle]                                              │ │
│  │  1. Component mounts                                      │ │
│  │  2. Fetch cue points ──────────────────────┐              │ │
│  │  3. Request pre-roll ad ───────────────────┼──────┐       │ │
│  │  4. Play ad / content                      │      │       │ │
│  │  5. Track events ──────────────────────────┼──────┼───┐   │ │
│  │  6. Monitor for mid-rolls                  │      │   │   │ │
│  └───────────────────────────────────────────┼──────┼───┼───┘ │
│                                               │      │   │     │
└───────────────────────────────────────────────┼──────┼───┼─────┘
                                                │      │   │
                                                ▼      ▼   ▼
                                          HTTP Requests (Axios)
                                                │      │   │
┌───────────────────────────────────────────────┼──────┼───┼─────┐
│                         BACKEND                      │   │     │
│                     (Node.js + Express)              │   │     │
│                                                      │   │     │
│  ┌────────────────────────────────────┐             │   │     │
│  │       API Routes                   │             │   │     │
│  │  /api/v1/video-ads/*              │◄────────────┘   │     │
│  └────────────┬───────────────────────┘                 │     │
│               │                                         │     │
│               ▼                                         │     │
│  ┌────────────────────────────────────┐                │     │
│  │    VideoAdController.js            │                │     │
│  │  - requestVideoAd()                │                │     │
│  │  - trackAdEvent()                  │                │     │
│  │  - getMidRollCuePoints()           │                │     │
│  └────────────┬───────────────────────┘                │     │
│               │                                         │     │
│               ▼                                         │     │
│  ┌────────────────────────────────────┐                │     │
│  │     VideoAdService.js              │                │     │
│  │  - requestAd()                     │◄───────────────┘     │
│  │  - findEligibleAds()               │                      │
│  │  - selectAd()                      │                      │
│  │  - formatAdResponse()              │                      │
│  │  - trackAdEvent()                  │◄─────────────────────┘
│  └────────────┬───────────────────────┘
│               │
│               ▼
│  ┌────────────────────────────────────┐
│  │         Database (MySQL)           │
│  │  - video_ad_creatives              │
│  │  - video_ad_placements             │
│  │  - video_ad_analytics              │
│  │  - video_ad_metadata               │
│  │  - user_ad_frequency               │
│  │  - admodels (existing)             │
│  └────────────────────────────────────┘
│                                        │
└────────────────────────────────────────┘
```

---

## Request Flow: Pre-Roll Ad

### 1. Component Mounts

**Frontend (TiptubePlayer.tsx):**
```typescript
useEffect(() => {
  const playPreRoll = async () => {
    if (preRollComplete || isAdPlaying) return;

    const adData = await requestAd('pre-roll');
    
    if (adData) {
      setCurrentAdData(adData);
      setIsAdPlaying(true);
      await trackAdEvent(adData.trackingUrls.impression);
    } else {
      setPreRollComplete(true); // No ad, start content
    }
  };

  playPreRoll();
}, []);
```

### 2. Request Ad from Backend

**HTTP Request:**
```
GET /api/v1/video-ads/request?videoId=123&placement=pre-roll&userId=456&videoDuration=600&platform=web
```

**Backend (VideoAdController.js):**
```javascript
requestVideoAd: async (req, res) => {
  const { videoId, userId, placement, videoDuration } = req.query;
  
  // Validate inputs
  if (!videoId) return res.status(400).json({...});
  
  // Call service layer
  const result = await VideoAdService.requestAd({
    videoId: parseInt(videoId),
    userId: userId ? parseInt(userId) : null,
    placement,
    videoDuration: parseInt(videoDuration) || 0,
    platform: 'web'
  });
  
  return res.status(result.success ? 200 : 404).json({
    status: result.success ? 200 : 404,
    message: result.message,
    data: result.data
  });
}
```

### 3. Ad Selection Logic

**Backend (VideoAdService.js):**
```javascript
static async requestAd(params) {
  const { videoId, userId, placement, videoDuration } = params;
  
  // 1. Check if video allows ads
  const videoSettings = await this.getVideoAdSettings(videoId);
  if (!this.canShowAd(videoSettings, placement)) {
    return { success: false, message: 'No ads available' };
  }
  
  // 2. Get user profile for targeting
  const userProfile = userId ? await this.getUserProfile(userId) : null;
  
  // 3. Find eligible ads
  const eligibleAds = await this.findEligibleAds({
    placement, videoId, videoDuration, userProfile, userId
  });
  
  if (!eligibleAds || eligibleAds.length === 0) {
    return { success: false, message: 'No ads available' };
  }
  
  // 4. Select best ad (priority-based)
  const selectedAd = await this.selectAd(eligibleAds, userId);
  
  // 5. Generate session ID for tracking
  const sessionId = uuidv4();
  
  // 6. Log 'request' event
  await this.trackAdEvent({
    creativeId: selectedAd.creative_id,
    placementId: selectedAd.placement_id,
    campaignId: selectedAd.campaign_id,
    userId, videoId, sessionId,
    eventType: 'request',
    platform: 'web'
  });
  
  // 7. Format response
  const adResponse = this.formatAdResponse(selectedAd, sessionId, videoId, userId);
  
  return { success: true, data: adResponse };
}
```

### 4. Response Sent to Frontend

**HTTP Response:**
```json
{
  "status": 200,
  "message": "Ad retrieved successfully",
  "data": {
    "adId": 789,
    "campaignId": 12,
    "placementId": 45,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "creative": {
      "type": "video/mp4",
      "url": "https://cdn.adtip.com/ads/video/ad-15s.mp4",
      "duration": 15,
      "thumbnail": "https://cdn.adtip.com/ads/thumbnails/thumb.jpg",
      "clickThroughUrl": "https://advertiser.com/product"
    },
    "placement": "pre-roll",
    "isSkippable": true,
    "skipOffset": 5,
    "trackingUrls": {
      "impression": "https://api.adtip.com/api/v1/video-ads/track?event=impression&adId=789&campaignId=12&placementId=45&sessionId=550e8400-e29b-41d4-a716-446655440000&videoId=123&userId=456&platform=web",
      "start": "...?event=start&...",
      "firstQuartile": "...?event=firstQuartile&...",
      "midpoint": "...?event=midpoint&...",
      "thirdQuartile": "...?event=thirdQuartile&...",
      "complete": "...?event=complete&...",
      "skip": "...?event=skip&...",
      "click": "...?event=click&...",
      "error": "...?event=error&..."
    },
    "companionBanner": {
      "imageUrl": "https://cdn.adtip.com/ads/banners/banner-728x90.jpg",
      "clickThroughUrl": "https://advertiser.com/product"
    }
  }
}
```

### 5. Frontend Plays Ad

**Frontend (TiptubePlayer.tsx):**
```typescript
// State updated with ad data
setCurrentAdData(adResponse.data);
setIsAdPlaying(true);

// ReactPlayer renders ad video
<ReactPlayer
  ref={adPlayerRef}
  url={currentAdData.creative.url}
  playing={true}
  onProgress={handleAdProgress}  // Tracks quartiles
  onEnded={() => handleAdEnd(false)}
/>

// AdOverlay shows skip button, countdown, etc.
<AdOverlay
  ad={currentAdData}
  onSkip={() => handleAdEnd(true)}
  onClick={handleAdClick}
/>
```

---

## Tracking Flow: Ad Events

### Tracking: Impression

**When:** Ad starts loading

**Frontend (adTracking.ts):**
```typescript
export const trackAdEvent = async (trackingUrl: string) => {
  try {
    // Method 1: Fetch (primary)
    await fetch(trackingUrl, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    });
  } catch (error) {
    // Method 2: Image pixel (fallback)
    const img = new Image(1, 1);
    img.src = trackingUrl;
  }
};

// Called from TiptubePlayer
await trackAdEvent(currentAdData.trackingUrls.impression);
```

**HTTP Request:**
```
GET /api/v1/video-ads/track?event=impression&adId=789&campaignId=12&placementId=45&sessionId=550e8400-e29b-41d4-a716-446655440000&videoId=123&userId=456&platform=web
```

**Backend (VideoAdController.js):**
```javascript
trackAdEvent: async (req, res) => {
  const {
    event, adId, campaignId, placementId, sessionId,
    videoId, userId, platform
  } = req.query;
  
  // Validate
  if (!event || !adId || !campaignId || !sessionId) {
    return res.status(400).json({...});
  }
  
  // Extract metadata
  const userAgent = req.get('user-agent');
  const ipAddress = req.ip;
  
  // Track event (async, non-blocking)
  await VideoAdService.trackAdEvent({
    creativeId: parseInt(adId),
    placementId: parseInt(placementId),
    campaignId: parseInt(campaignId),
    userId: userId ? parseInt(userId) : null,
    videoId: videoId ? parseInt(videoId) : null,
    sessionId,
    eventType: event,
    platform,
    userAgent,
    ipAddress
  });
  
  // Fast response (tracking shouldn't block)
  return res.status(200).json({
    status: 200,
    message: 'Event tracked',
    data: { event, adId }
  });
}
```

**Backend (VideoAdService.js):**
```javascript
static async trackAdEvent(eventData) {
  const {
    creativeId, placementId, campaignId, userId,
    videoId, sessionId, eventType, platform
  } = eventData;
  
  try {
    // Call stored procedure to handle billing logic
    const query = `CALL sp_record_ad_event(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await db.promise().query(query, [
      creativeId, placementId, campaignId,
      userId, videoId, sessionId, eventType,
      0, 0, platform  // timeWatched, videoPosition
    ]);
    
    console.log(`Tracked event: ${eventType} for creative ${creativeId}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error: error.message };
  }
}
```

**Database (sp_record_ad_event):**
```sql
CREATE PROCEDURE sp_record_ad_event(...)
BEGIN
  DECLARE v_billable TINYINT(1) DEFAULT 0;
  DECLARE v_billing_amount DECIMAL(10,4) DEFAULT 0;
  
  -- Get campaign billing model
  SELECT modelTypeName INTO v_campaign_model 
  FROM admodels WHERE id = p_campaign_id;
  
  -- Determine if billable
  IF v_campaign_model = 'CPM' AND p_event_type = 'impression' THEN
    SET v_billable = 1;
    SELECT (ad_perday_pay / 1000) INTO v_billing_amount 
    FROM admodels WHERE id = p_campaign_id;
  END IF;
  
  -- Insert analytics record
  INSERT INTO video_ad_analytics (...) VALUES (...);
  
  -- Update frequency tracking
  IF p_event_type = 'impression' AND p_user_id IS NOT NULL THEN
    INSERT INTO user_ad_frequency (...)
    VALUES (...)
    ON DUPLICATE KEY UPDATE impressions_today = impressions_today + 1;
  END IF;
END;
```

### Tracking: Quartiles

**When:** Ad reaches 25%, 50%, 75%, 100%

**Frontend (TiptubePlayer.tsx):**
```typescript
const handleAdProgress = useCallback(async (state: { played: number }) => {
  if (!currentAdData) return;
  
  const progress = state.played * 100;
  
  // Track start (0%)
  if (progress > 0 && lastQuartileTracked.current === null) {
    await trackAdEvent(currentAdData.trackingUrls.start);
    lastQuartileTracked.current = 'start';
  }
  
  // Track 25%
  if (progress >= 25 && lastQuartileTracked.current === 'start') {
    await trackAdEvent(currentAdData.trackingUrls.firstQuartile);
    lastQuartileTracked.current = 'firstQuartile';
  }
  
  // Track 50%
  if (progress >= 50 && lastQuartileTracked.current === 'firstQuartile') {
    await trackAdEvent(currentAdData.trackingUrls.midpoint);
    lastQuartileTracked.current = 'midpoint';
  }
  
  // Track 75%
  if (progress >= 75 && lastQuartileTracked.current === 'midpoint') {
    await trackAdEvent(currentAdData.trackingUrls.thirdQuartile);
    lastQuartileTracked.current = 'thirdQuartile';
  }
}, [currentAdData]);

// Attached to ReactPlayer
<ReactPlayer
  onProgress={handleAdProgress}
  // ...
/>
```

---

## Mid-Roll Ad Flow

### 1. Fetch Cue Points on Mount

**Frontend (TiptubePlayer.tsx):**
```typescript
useEffect(() => {
  const fetchCuePoints = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/video-ads/cue-points/${videoId}`
      );
      
      if (response.data.success && response.data.data?.cuePoints) {
        setMidRollCuePoints(response.data.data.cuePoints);
        // e.g., [180, 360, 540] = at 3min, 6min, 9min
      }
    } catch (error) {
      console.error('Error fetching cue points:', error);
    }
  };

  fetchCuePoints();
}, [videoId]);
```

**Backend (VideoAdService.js):**
```javascript
static async getMidRollCuePoints(videoId) {
  const query = `
    SELECT mid_roll_cue_points, allow_mid_roll
    FROM video_ad_metadata
    WHERE video_id = ? AND video_type = 'tiptube'
  `;
  
  const [results] = await db.promise().query(query, [videoId]);
  
  if (results.length === 0 || results[0].allow_mid_roll !== 1) {
    return { success: true, data: { cuePoints: [] } };
  }
  
  // Parse JSON cue points
  let cuePoints = [];
  try {
    if (results[0].mid_roll_cue_points) {
      cuePoints = JSON.parse(results[0].mid_roll_cue_points);
    }
  } catch (e) {
    console.error('Error parsing cue points:', e);
  }
  
  return { success: true, data: { cuePoints } };
}
```

### 2. Monitor Main Video Progress

**Frontend (TiptubePlayer.tsx):**
```typescript
useEffect(() => {
  if (isAdPlaying || !preRollComplete || midRollCuePoints.length === 0) return;
  
  // Check if we've reached a cue point
  const nearestCuePoint = midRollCuePoints.find(
    (cuePoint) => 
      currentVideoTime >= cuePoint && 
      currentVideoTime < cuePoint + 1 && 
      !playedCuePoints.has(cuePoint)
  );
  
  if (nearestCuePoint !== undefined) {
    console.log('Reached mid-roll cue point:', nearestCuePoint);
    handleMidRollAd(nearestCuePoint);
  }
}, [currentVideoTime, midRollCuePoints]);

// Main video progress callback
const handleVideoProgress = (state: { playedSeconds: number }) => {
  setCurrentVideoTime(state.playedSeconds);
};
```

### 3. Pause Main Video, Play Mid-Roll

**Frontend (TiptubePlayer.tsx):**
```typescript
const handleMidRollAd = async (cuePoint: number) => {
  // Pause main video
  if (playerRef.current) {
    const internalPlayer = playerRef.current.getInternalPlayer();
    if (internalPlayer?.pause) {
      internalPlayer.pause();
    }
  }
  
  // Mark cue point as played
  setPlayedCuePoints(prev => new Set([...prev, cuePoint]));
  
  // Request mid-roll ad
  const adData = await requestAd('mid-roll', cuePoint);
  
  if (adData) {
    setCurrentAdData(adData);
    setIsAdPlaying(true);
    await trackAdEvent(adData.trackingUrls.impression);
  } else {
    // No ad available, resume main video
    console.log('No mid-roll ad available, resuming video');
  }
};
```

### 4. Ad Ends, Resume Main Video

**Frontend (TiptubePlayer.tsx):**
```typescript
const handleAdEnd = useCallback(async (skipped: boolean = false) => {
  if (!currentAdData) return;
  
  // Track completion or skip
  if (skipped) {
    await trackAdEvent(currentAdData.trackingUrls.skip);
  } else {
    await trackAdEvent(currentAdData.trackingUrls.complete);
  }
  
  // Reset ad state
  setIsAdPlaying(false);
  setCurrentAdData(null);
  lastQuartileTracked.current = null;
  
  // Resume main video (ReactPlayer will auto-resume)
  console.log('Ad ended, resuming content');
}, [currentAdData]);
```

---

## Data Flow Summary

| Step | Frontend | Backend | Database |
|------|----------|---------|----------|
| **1. Request Ad** | `requestAd('pre-roll')` | `VideoAdService.requestAd()` | Query `video_ad_creatives`, `video_ad_placements` |
| **2. Select Ad** | Receives ad data | `findEligibleAds()` + `selectAd()` | Check targeting, budget, frequency |
| **3. Play Ad** | ReactPlayer plays video | - | - |
| **4. Track Impression** | `trackAdEvent(url)` | `VideoAdController.trackAdEvent()` | INSERT `video_ad_analytics` |
| **5. Track Quartiles** | `onProgress` callback | Same as above | INSERT events |
| **6. Track Complete** | `onEnded` callback | Same as above | INSERT + calculate billing |
| **7. Resume Content** | Switch to main video | - | - |
| **8. Mid-Roll Trigger** | Check cue points | - | - |
| **9. Repeat** | Request mid-roll ad | Same flow as step 1-7 | - |

---

## Key Design Decisions

### Why This Architecture?

1. **Separation of Concerns**
   - Frontend: UI/UX and playback
   - Backend: Business logic and data
   - Database: Storage and billing

2. **Stateless Tracking**
   - Each tracking URL is self-contained
   - No session management required
   - Works with CDNs and load balancers

3. **Fail-Safe Tracking**
   - Dual method: fetch + image pixel
   - Tracking failures don't break video
   - Async, non-blocking

4. **Efficient Database**
   - Stored procedures for complex logic
   - Indexes on frequently queried columns
   - Partitioning for large tables

5. **Extensibility**
   - Easy to add new event types
   - Easy to add new placement types
   - Easy to add new targeting criteria

---

## Performance Optimizations

### Frontend
- Lazy load ads (only when needed)
- Prefetch next mid-roll during content playback
- Debounce progress events
- Cache cue points

### Backend
- Connection pooling
- Query result caching (60s TTL)
- Async event recording
- Batch tracking (optional)

### Database
- Composite indexes on common queries
- Stored procedures for billing
- Archiving old analytics data
- Read replicas for reporting

---

## Security Considerations

### Frontend
- Don't expose sensitive campaign data
- Validate all tracking URLs
- Sanitize click-through URLs

### Backend
- Parameterized queries (SQL injection protection)
- Rate limiting on `/track` endpoint
- Validate all input parameters
- Log suspicious activity

### Database
- Minimal permissions for app user
- Encrypted connections
- Regular backups
- Audit trail for billing changes

---

## Conclusion

This architecture provides:

✅ **Clean separation** between frontend and backend  
✅ **Reliable tracking** with dual method approach  
✅ **Accurate billing** with stored procedure logic  
✅ **Scalable design** for millions of impressions  
✅ **Maintainable code** with clear responsibilities  

The system is production-ready and can handle real-world traffic while maintaining data integrity and billing accuracy.

---

**Version:** 1.0.0  
**Last Updated:** October 11, 2025
