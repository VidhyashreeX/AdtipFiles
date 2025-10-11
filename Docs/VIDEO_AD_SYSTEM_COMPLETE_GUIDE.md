# YouTube-Style Video Advertising System - Complete Implementation Guide

## Executive Summary

This document describes the complete implementation of a **YouTube-style video advertising system** for the Tiptube platform. The system supports:

- ✅ **Pre-roll ads** (skippable and non-skippable)
- ✅ **Mid-roll ads** at configurable cue points
- ✅ **Post-roll ads** (optional)
- ✅ **Companion banner ads** displayed alongside video
- ✅ **Full analytics tracking** (impressions, completions, skips, clicks)
- ✅ **Multiple billing models** (CPM, CPV, CPC)
- ✅ **User frequency capping**
- ✅ **Campaign targeting** (demographics, video categories)

---

## System Architecture

### High-Level Flow

```
1. User clicks play on video
2. Frontend requests pre-roll ad from backend
3. Backend selects ad based on targeting + budget
4. Ad plays with overlay controls
5. User watches/skips ad (tracked)
6. Main video starts
7. At mid-roll cue points, process repeats
8. Companion banner shown during ad playback
9. All events tracked for billing & analytics
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript |
| Video Player | React Player |
| Backend | Node.js + Express.js |
| Database | MySQL (PostgreSQL compatible) |
| HTTP Client | Axios |
| State Management | React Hooks |

---

## Database Schema

### Core Tables

#### 1. `video_ad_creatives`
Stores ad assets (videos, banners, metadata)

```sql
CREATE TABLE video_ad_creatives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_id INT NOT NULL,               -- Links to admodels table
  creative_name VARCHAR(255),
  creative_type ENUM('video', 'banner'),
  
  -- Video assets
  video_url VARCHAR(500),                 -- CDN URL to video file
  video_duration INT,                     -- Duration in seconds
  video_thumbnail VARCHAR(500),
  
  -- Banner assets
  banner_image_url VARCHAR(500),
  banner_width INT,
  banner_height INT,
  
  -- Behavior
  click_through_url VARCHAR(500),         -- Where user goes on click
  is_skippable TINYINT(1) DEFAULT 1,
  skip_offset INT DEFAULT 5,              -- Seconds before skip enabled
  
  is_active TINYINT(1) DEFAULT 1,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `video_ad_placements`
Defines WHERE and WHEN ads appear

```sql
CREATE TABLE video_ad_placements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  creative_id INT NOT NULL,
  placement_type ENUM('pre-roll', 'mid-roll', 'post-roll', 'banner'),
  
  -- Mid-roll specific
  cue_point_seconds INT,                  -- E.g., 300 = 5 minutes
  cue_point_percentage INT,               -- Alternative: 50 = halfway
  
  -- Targeting
  target_video_categories TEXT,           -- JSON: [1, 2, 3]
  target_video_ids TEXT,                  -- JSON: [101, 102]
  min_video_duration INT,                 -- Only show on long videos
  
  -- Priority & limits
  priority INT DEFAULT 1,                 -- Higher = shown first
  frequency_cap INT,                      -- Max per user per day
  
  is_active TINYINT(1) DEFAULT 1
);
```

#### 3. `video_ad_analytics`
Tracks EVERY ad interaction for billing

```sql
CREATE TABLE video_ad_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  creative_id INT NOT NULL,
  placement_id INT NOT NULL,
  campaign_id INT NOT NULL,
  
  -- Context
  user_id INT,                            -- Viewer (can be NULL)
  video_id INT,                           -- Content video
  session_id VARCHAR(100),                -- Unique per playback
  
  -- Event type
  event_type ENUM(
    'request', 'impression', 'start', 
    'firstQuartile', 'midpoint', 'thirdQuartile',
    'complete', 'skip', 'click', 'error'
  ),
  
  -- Metrics
  time_watched_seconds DECIMAL(10,2),
  video_position_seconds INT,
  
  -- Billing
  billable TINYINT(1) DEFAULT 0,
  billing_amount DECIMAL(10,4),
  
  -- Metadata
  platform VARCHAR(50),                   -- web, mobile, tablet
  user_agent VARCHAR(255),
  ip_address VARCHAR(45),
  
  event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `video_ad_metadata`
Per-video ad settings

```sql
CREATE TABLE video_ad_metadata (
  id INT PRIMARY KEY AUTO_INCREMENT,
  video_id INT NOT NULL,
  video_type ENUM('tiptube', 'tipshorts'),
  
  mid_roll_cue_points TEXT,               -- JSON: [180, 360, 540]
  
  allow_pre_roll TINYINT(1) DEFAULT 1,
  allow_mid_roll TINYINT(1) DEFAULT 1,
  allow_post_roll TINYINT(1) DEFAULT 0,
  allow_banner TINYINT(1) DEFAULT 1,
  
  is_monetized TINYINT(1) DEFAULT 0,
  creator_revenue_share DECIMAL(5,2) DEFAULT 55.00
);
```

#### 5. `user_ad_frequency`
Prevents ad fatigue (frequency capping)

```sql
CREATE TABLE user_ad_frequency (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  creative_id INT NOT NULL,
  impressions_today INT DEFAULT 0,
  last_shown_date DATE NOT NULL,
  total_impressions INT DEFAULT 0,
  
  UNIQUE KEY (user_id, creative_id, last_shown_date)
);
```

---

## Backend Implementation

### API Endpoints

#### 1. Request Ad
**Endpoint:** `GET /api/v1/video-ads/request`

**Query Parameters:**
```javascript
{
  videoId: 123,               // Content video ID
  userId: 456,                // Viewer ID (optional)
  placement: 'pre-roll',      // pre-roll | mid-roll | post-roll | banner
  videoDuration: 600,         // Content duration in seconds
  videoPosition: 0,           // Current position (for mid-roll)
  platform: 'web'             // web | mobile | tablet
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Ad retrieved successfully",
  "data": {
    "adId": 789,
    "campaignId": 12,
    "placementId": 45,
    "sessionId": "uuid-here",
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
      "impression": "https://api.adtip.com/api/v1/video-ads/track?event=impression&adId=789&...",
      "start": "https://api.adtip.com/api/v1/video-ads/track?event=start&...",
      "firstQuartile": "...",
      "midpoint": "...",
      "thirdQuartile": "...",
      "complete": "...",
      "skip": "...",
      "click": "...",
      "error": "..."
    },
    "companionBanner": {
      "imageUrl": "https://cdn.adtip.com/ads/banners/banner-728x90.jpg",
      "clickThroughUrl": "https://advertiser.com/product"
    }
  }
}
```

**Logic:**
1. Check if video allows ads for this placement
2. Get user profile for targeting (if logged in)
3. Query eligible ads based on:
   - Placement type
   - Campaign active & budget available
   - Targeting criteria (age, gender, location)
   - Frequency cap not exceeded
   - Video duration requirements
4. Select highest priority ad
5. Log 'request' event
6. Return ad with tracking URLs

---

#### 2. Track Ad Event
**Endpoint:** `GET /api/v1/video-ads/track`

**Query Parameters:**
```javascript
{
  event: 'complete',          // Event type
  adId: 789,
  campaignId: 12,
  placementId: 45,
  sessionId: 'uuid',
  videoId: 123,
  userId: 456,
  platform: 'web',
  timeWatched: 15.5,          // For progress events
  videoPosition: 300          // For mid-roll context
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Event tracked",
  "data": { "event": "complete", "adId": 789 }
}
```

**Logic:**
1. Validate event type
2. Call stored procedure `sp_record_ad_event`
3. Procedure determines if event is billable:
   - CPM model: charge on 'impression'
   - CPV model: charge on 'complete'
   - CPC model: charge on 'click'
4. Update `video_ad_analytics` table
5. Update frequency tracking
6. Return lightweight response (tracking should be fast)

---

#### 3. Get Mid-Roll Cue Points
**Endpoint:** `GET /api/v1/video-ads/cue-points/:videoId`

**Response:**
```json
{
  "status": 200,
  "message": "Cue points retrieved",
  "data": {
    "cuePoints": [180, 360, 540]  // Seconds: 3min, 6min, 9min
  }
}
```

---

#### 4. Get Campaign Analytics
**Endpoint:** `GET /api/v1/video-ads/analytics/:campaignId`

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "campaign_id": 12,
      "campaign_name": "Product Launch",
      "creative_id": 789,
      "creative_name": "15s Video Ad",
      "impressions": 10000,
      "starts": 9500,
      "completions": 7200,
      "skips": 2300,
      "clicks": 450,
      "completion_rate": 75.79,
      "ctr": 4.50,
      "total_spend": 1250.00
    }
  ]
}
```

---

### Service Layer: `VideoAdService.js`

Key methods:

1. **`requestAd(params)`** - Main ad selection logic
2. **`trackAdEvent(eventData)`** - Record event in database
3. **`findEligibleAds(params)`** - Query ads matching criteria
4. **`selectAd(eligibleAds, userId)`** - Choose best ad
5. **`formatAdResponse(ad, sessionId)`** - Build VAST-like response
6. **`getCampaignAnalytics(campaignId)`** - Performance metrics

---

### Stored Procedure: `sp_record_ad_event`

Handles billing logic in database for performance:

```sql
CREATE PROCEDURE sp_record_ad_event(
  IN p_creative_id INT,
  IN p_placement_id INT,
  IN p_campaign_id INT,
  IN p_user_id INT,
  IN p_video_id INT,
  IN p_session_id VARCHAR(100),
  IN p_event_type VARCHAR(50),
  IN p_time_watched DECIMAL(10,2),
  IN p_video_position INT,
  IN p_platform VARCHAR(50)
)
BEGIN
  DECLARE v_billable TINYINT(1) DEFAULT 0;
  DECLARE v_billing_amount DECIMAL(10,4) DEFAULT 0;
  DECLARE v_campaign_model VARCHAR(100);
  
  -- Get campaign billing model
  SELECT modelTypeName INTO v_campaign_model 
  FROM admodels 
  WHERE id = p_campaign_id;
  
  -- Determine if billable
  IF v_campaign_model = 'CPM' AND p_event_type = 'impression' THEN
    SET v_billable = 1;
    SELECT (ad_perday_pay / 1000) INTO v_billing_amount 
    FROM admodels WHERE id = p_campaign_id;
    
  ELSEIF v_campaign_model = 'CPV' AND p_event_type = 'complete' THEN
    SET v_billable = 1;
    SELECT ad_perday_pay INTO v_billing_amount 
    FROM admodels WHERE id = p_campaign_id;
    
  ELSEIF v_campaign_model = 'CPC' AND p_event_type = 'click' THEN
    SET v_billable = 1;
    SELECT ad_perday_pay INTO v_billing_amount 
    FROM admodels WHERE id = p_campaign_id;
  END IF;
  
  -- Insert analytics
  INSERT INTO video_ad_analytics (...)
  VALUES (...);
  
  -- Update frequency tracking
  IF p_event_type = 'impression' AND p_user_id IS NOT NULL THEN
    INSERT INTO user_ad_frequency (...)
    VALUES (...)
    ON DUPLICATE KEY UPDATE impressions_today = impressions_today + 1;
  END IF;
END;
```

---

## Frontend Implementation

### Component: `TiptubePlayer.tsx`

**Main video player with integrated ads**

Key features:
- Auto-requests pre-roll on mount
- Monitors video progress for mid-roll cue points
- Switches between ad player and content player
- Tracks all events (start, quartiles, complete, skip)
- Displays companion banner during ads

**State Management:**
```typescript
const [isAdPlaying, setIsAdPlaying] = useState(false);
const [currentAdData, setCurrentAdData] = useState<AdData | null>(null);
const [preRollComplete, setPreRollComplete] = useState(false);
const [midRollCuePoints, setMidRollCuePoints] = useState<number[]>([]);
const [playedCuePoints, setPlayedCuePoints] = useState<Set<number>>(new Set());
```

**Lifecycle:**
1. Component mounts → fetch mid-roll cue points
2. Request pre-roll ad
3. If ad available → play ad, else → start content
4. Monitor video time → trigger mid-roll at cue points
5. Ad completes/skipped → resume content
6. Track all events asynchronously

---

### Component: `AdOverlay.tsx`

**Overlay displayed on top of ad video**

Features:
- "Ad" badge in top-left
- Countdown timer
- Skip button (appears after `skipOffset` seconds)
- Click-through area (opens advertiser URL)
- "Learn More" button

Visual design:
```
┌─────────────────────────────────────┐
│ [Ad] [Video will play in 10s]  [i] │ ← Top bar
│                                     │
│                                     │
│         [Video playing]             │ ← Clickable area
│                                     │
│                                     │
│ [Learn More]        [Skip Ad ✕]    │ ← Bottom bar
└─────────────────────────────────────┘
```

---

### Component: `CompanionBanner.tsx`

**Banner ad shown below video player**

Features:
- Displays banner image
- "Advertisement" disclosure
- Hover effect with "Visit Website" prompt
- Click tracking
- Responsive design (max height 120px)

---

### Utility: `adTracking.ts`

**Centralized tracking functions**

Methods:
- `trackAdEvent(url)` - Fire tracking pixel
- `trackAdEventsBulk(urls[])` - Batch tracking
- `sendTrackingBeacon(url)` - Reliable tracking during page unload
- `trackAdImpressionWhenVisible(url, element)` - Only track if visible
- `trackAdError(url, code, message)` - Error tracking

Uses dual approach:
1. **Primary:** `fetch()` with no-cors
2. **Fallback:** Image pixel (`new Image().src = url`)

---

## Integration with Existing System

### How It Works With Current Ad System

| Current System | New Video Ad System | Integration |
|----------------|---------------------|-------------|
| `admodels` table (campaigns) | References same table | ✅ Shared |
| `company_post` (static ads) | `video_ad_creatives` | ✅ Separate |
| `ad_details` (views/likes) | `video_ad_analytics` | ✅ Separate |
| Social ad delivery | Video ad delivery | ✅ Parallel |

**Key Point:** The new system is **additive** - it doesn't break existing functionality.

### Enabling Video Ads for a Campaign

1. Create campaign in `admodels` (existing flow)
2. Create video creative:
   ```sql
   INSERT INTO video_ad_creatives (
     campaign_id, creative_name, video_url, video_duration, 
     is_skippable, skip_offset, banner_image_url, click_through_url
   ) VALUES (
     123, 'Product Launch 15s', 'https://cdn.../ad.mp4', 15,
     1, 5, 'https://cdn.../banner.jpg', 'https://advertiser.com'
   );
   ```

3. Create placement:
   ```sql
   INSERT INTO video_ad_placements (
     creative_id, placement_type, priority, frequency_cap, min_video_duration
   ) VALUES (
     789, 'pre-roll', 10, 3, 60
   );
   ```

4. Ads will now be served automatically when videos play!

---

## Usage Example

### Basic Implementation

```tsx
import TiptubePlayer from '@/components/TiptubePlayer';

function VideoPage() {
  const videoId = 123;
  const videoUrl = 'https://cdn.adtip.com/videos/content.mp4';
  const userId = 456; // From auth context

  return (
    <div className="video-container">
      <h1>Video Title</h1>
      
      <TiptubePlayer
        videoId={videoId}
        videoUrl={videoUrl}
        userId={userId}
        autoplay={true}
        width="100%"
        height="600px"
        onVideoEnd={() => console.log('Video ended')}
        onVideoPlay={() => console.log('Video started')}
      />
      
      <div className="video-description">
        Description goes here...
      </div>
    </div>
  );
}
```

That's it! The player handles everything:
- Ad requests
- Ad playback
- Tracking
- Mid-rolls
- Companion banners

---

## Testing Guide

### 1. Database Setup

```bash
# Run the schema
mysql -u root -p adtip_qa < database/video_ad_system_schema.sql

# Verify tables created
mysql -u root -p adtip_qa -e "SHOW TABLES LIKE 'video_ad%';"
```

### 2. Create Test Ad

```sql
-- 1. Create video creative
INSERT INTO video_ad_creatives (
  campaign_id, creative_name, creative_type, video_url, video_duration,
  video_thumbnail, banner_image_url, click_through_url,
  is_skippable, skip_offset, is_active
) VALUES (
  1, -- Use existing campaign ID
  'Test Pre-Roll Ad',
  'video',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  15,
  'https://via.placeholder.com/640x360',
  'https://via.placeholder.com/728x90',
  'https://www.google.com',
  1,
  5,
  1
);

-- 2. Create placement
INSERT INTO video_ad_placements (
  creative_id, placement_type, priority, frequency_cap, 
  min_video_duration, is_active
) VALUES (
  LAST_INSERT_ID(), 'pre-roll', 10, 5, 30, 1
);

-- 3. Set video to allow ads
INSERT INTO video_ad_metadata (
  video_id, video_type, allow_pre_roll, allow_mid_roll,
  mid_roll_cue_points, is_monetized
) VALUES (
  1, 'tiptube', 1, 1, '[60, 120]', 1
);
```

### 3. Test Ad Request

```bash
# Request pre-roll ad
curl "http://localhost:3000/api/v1/video-ads/request?videoId=1&placement=pre-roll&videoDuration=180&platform=web"

# Should return ad data with tracking URLs
```

### 4. Test Tracking

```bash
# Track impression
curl "http://localhost:3000/api/v1/video-ads/track?event=impression&adId=1&campaignId=1&placementId=1&sessionId=test-123"

# Check analytics table
mysql -u root -p adtip_qa -e "SELECT * FROM video_ad_analytics ORDER BY id DESC LIMIT 5;"
```

### 5. Frontend Testing

1. Start dev server: `npm run dev`
2. Navigate to video page
3. **Expected behavior:**
   - Loading spinner appears
   - Pre-roll ad plays automatically
   - "Skip Ad" button appears after 5 seconds
   - Clicking skip → main video starts
   - Companion banner visible during ad
   - Mid-rolls trigger at cue points

4. **Check browser console:**
   ```
   [TiptubePlayer] Ad request: pre-roll
   [TiptubePlayer] Ad received: 1
   [AdTracking] Tracking event: impression
   [AdTracking] Tracking event: start
   [TiptubePlayer] Ad playback ended, resuming content
   ```

5. **Check network tab:**
   - Look for tracking pixel requests
   - All should return 200 OK

---

## Performance Considerations

### Frontend Optimizations

1. **Lazy load ads:** Only request when needed
2. **Prefetch mid-rolls:** Load next ad during content playback
3. **Track throttling:** Debounce progress events
4. **Error handling:** Fallback to content if ad fails

### Backend Optimizations

1. **Database indexes:** See schema file
2. **Query optimization:** Use stored procedures for billing
3. **Caching:** Cache eligible ads for 60 seconds
4. **Connection pooling:** Reuse DB connections
5. **Async tracking:** Non-blocking event recording

### Database Tuning

```sql
-- Partition analytics by date for faster queries
ALTER TABLE video_ad_analytics 
PARTITION BY RANGE (YEAR(event_timestamp)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026)
);

-- Archive old analytics (monthly cron)
INSERT INTO video_ad_analytics_archive 
SELECT * FROM video_ad_analytics 
WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM video_ad_analytics 
WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## Monetization & Revenue Share

### Creator Revenue Share

```sql
-- Calculate creator earnings
SELECT 
  v.video_id,
  u.name as creator_name,
  SUM(va.billing_amount) as total_ad_revenue,
  vm.creator_revenue_share,
  SUM(va.billing_amount) * (vm.creator_revenue_share / 100) as creator_earnings
FROM video_ad_analytics va
JOIN video_ad_metadata vm ON va.video_id = vm.video_id
JOIN videos v ON v.id = vm.video_id
JOIN users u ON v.creator_id = u.id
WHERE va.billable = 1
  AND va.event_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY v.video_id;
```

### Payout Processing

1. Calculate earnings monthly
2. Minimum payout threshold: $10
3. Transfer to creator wallet
4. Generate invoice/statement

---

## Future Enhancements

### Phase 2 Features

1. **Ad Pods:** Multiple ads in sequence
2. **Interactive Ads:** Overlays, cards, polls
3. **Programmatic Bidding:** Real-time auction
4. **A/B Testing:** Test different creatives
5. **Geo-Targeting:** Location-based ads
6. **Viewability Tracking:** Only count visible impressions
7. **Brand Safety:** Content categorization
8. **Ad Blockers:** Detection & messaging

### Advanced Analytics

1. **Heatmaps:** Where users skip
2. **Engagement Score:** Watch time vs skip rate
3. **Conversion Tracking:** Post-click actions
4. **Attribution:** Multi-touch attribution
5. **Predictive Analytics:** AI-powered optimization

---

## Troubleshooting

### Common Issues

**1. "No ads available"**
- Check if campaign is active: `SELECT * FROM admodels WHERE id = X`
- Check budget: `pending_ad_balance > 0`
- Check creative: `SELECT * FROM video_ad_creatives WHERE campaign_id = X AND is_active = 1`
- Check placement: `SELECT * FROM video_ad_placements WHERE creative_id = X AND is_active = 1`

**2. Tracking not working**
- Check CORS settings in backend
- Verify tracking URLs are reachable
- Check browser console for errors
- Verify stored procedure exists

**3. Mid-rolls not triggering**
- Check cue points: `SELECT mid_roll_cue_points FROM video_ad_metadata WHERE video_id = X`
- Verify `allow_mid_roll = 1`
- Check video duration is long enough

**4. Ads repeating too often**
- Check frequency cap: `SELECT * FROM video_ad_placements WHERE id = X`
- Verify frequency tracking: `SELECT * FROM user_ad_frequency WHERE user_id = X`

---

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/video-ads/request` | GET/POST | Request ad for video |
| `/api/v1/video-ads/track` | GET/POST | Track ad events |
| `/api/v1/video-ads/cue-points/:videoId` | GET | Get mid-roll cue points |
| `/api/v1/video-ads/analytics/:campaignId` | GET | Campaign performance |
| `/api/v1/video-ads/creative` | POST | Create ad creative |
| `/api/v1/video-ads/placement` | POST | Create ad placement |

---

## Conclusion

This implementation provides a **production-ready video advertising system** that:

✅ **Works with your existing infrastructure**  
✅ **Scales to millions of impressions**  
✅ **Provides accurate billing**  
✅ **Delivers professional user experience**  
✅ **Is fully analytics-driven**

The system is designed to be:
- **Extensible** (easy to add new features)
- **Maintainable** (clean separation of concerns)
- **Performant** (optimized queries and caching)
- **Reliable** (error handling and fallbacks)

For support or questions, refer to the code comments or contact the development team.

---

**Last Updated:** October 11, 2025  
**Version:** 1.0.0
