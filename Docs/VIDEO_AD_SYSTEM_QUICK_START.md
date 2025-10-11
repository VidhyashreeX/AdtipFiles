# Video Advertising System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Database Setup
```bash
cd c:\A2\adtipback
mysql -u root -p adtip_qa < database/video_ad_system_schema.sql
```

### Step 2: Create Test Ad
```sql
-- Copy-paste this entire block into MySQL
USE adtip_qa;

-- 1. Create video creative (assumes campaign ID 1 exists)
INSERT INTO video_ad_creatives (
  campaign_id, creative_name, creative_type, video_url, video_duration,
  video_thumbnail, banner_image_url, click_through_url,
  is_skippable, skip_offset, is_active
) VALUES (
  1, 'Test Pre-Roll Ad', 'video',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  15,
  'https://via.placeholder.com/640x360',
  'https://via.placeholder.com/728x90',
  'https://www.google.com',
  1, 5, 1
);

-- 2. Create placement
INSERT INTO video_ad_placements (
  creative_id, placement_type, priority, frequency_cap, 
  min_video_duration, is_active
) VALUES (
  LAST_INSERT_ID(), 'pre-roll', 10, 5, 30, 1
);

-- 3. Set video to allow ads (use your actual video ID)
INSERT INTO video_ad_metadata (
  video_id, video_type, allow_pre_roll, allow_mid_roll,
  mid_roll_cue_points, is_monetized
) VALUES (
  1, 'tiptube', 1, 1, '[60, 120, 180]', 1
);
```

### Step 3: Use TiptubePlayer
```tsx
import TiptubePlayer from '@/components/TiptubePlayer';

function MyVideoPage() {
  return (
    <TiptubePlayer
      videoId={1}
      videoUrl="https://your-cdn.com/video.mp4"
      userId={123}  // Current user ID
      autoplay={true}
    />
  );
}
```

**That's it!** Ads will now play automatically.

---

## 🔍 Testing

### Test Ad Request (Backend)
```bash
# Should return ad data
curl "http://localhost:3000/api/v1/video-ads/request?videoId=1&placement=pre-roll&platform=web"
```

### Check Analytics
```sql
-- View recent tracking events
SELECT event_type, COUNT(*) as count
FROM video_ad_analytics
WHERE created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY event_type;
```

---

## 📊 Key Metrics Dashboard

### Campaign Performance Query
```sql
SELECT * FROM vw_campaign_ad_performance 
WHERE campaign_id = 1;
```

**Returns:**
- Impressions
- Starts
- Completions
- Skips
- Clicks
- Completion Rate
- CTR (Click-Through Rate)
- Total Spend

---

## 🛠️ Common Tasks

### Disable Ads for a Video
```sql
UPDATE video_ad_metadata 
SET allow_pre_roll = 0, allow_mid_roll = 0 
WHERE video_id = 123;
```

### Change Skip Offset
```sql
UPDATE video_ad_creatives 
SET skip_offset = 10  -- 10 seconds instead of 5
WHERE id = 1;
```

### Add Mid-Roll Cue Points
```sql
UPDATE video_ad_metadata 
SET mid_roll_cue_points = '[120, 240, 360]'  -- At 2, 4, 6 minutes
WHERE video_id = 123;
```

### Set Frequency Cap
```sql
UPDATE video_ad_placements 
SET frequency_cap = 3  -- Max 3 times per day per user
WHERE id = 1;
```

---

## 🐛 Troubleshooting

### No Ads Showing?

**Check 1:** Is campaign active?
```sql
SELECT id, campaign_name, is_active, adPauseCountinue, pending_ad_balance 
FROM admodels 
WHERE id = YOUR_CAMPAIGN_ID;
```
- `is_active` should be `1`
- `adPauseCountinue` should be `1`
- `pending_ad_balance` should be > `0`

**Check 2:** Is creative active?
```sql
SELECT * FROM video_ad_creatives WHERE campaign_id = YOUR_CAMPAIGN_ID;
```

**Check 3:** Is placement active?
```sql
SELECT * FROM video_ad_placements WHERE creative_id = YOUR_CREATIVE_ID;
```

**Check 4:** Does video allow ads?
```sql
SELECT * FROM video_ad_metadata WHERE video_id = YOUR_VIDEO_ID;
```

### Tracking Not Working?

**Check browser console:**
```
[TiptubePlayer] Ad request: pre-roll
[TiptubePlayer] Ad received: 1
[AdTracking] Tracking event: impression
```

If you don't see these, check:
1. CORS is enabled in backend
2. API_BASE_URL is correct in `.env`
3. Network tab shows 200 responses

---

## 📈 Revenue Calculation

### Creator Earnings
```sql
SELECT 
  video_id,
  SUM(billing_amount) * 0.55 as creator_earnings  -- 55% share
FROM video_ad_analytics
WHERE billable = 1 
  AND video_id = 123
  AND event_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Campaign Spend
```sql
SELECT 
  campaign_id,
  SUM(billing_amount) as total_spend
FROM video_ad_analytics
WHERE billable = 1 
  AND campaign_id = 1
  AND event_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 🎯 Targeting Examples

### Target Specific Age Group
```sql
-- In admodels table (existing targeting)
UPDATE admodels 
SET target_lower_age = 18, target_upper_age = 35
WHERE id = 1;
```

### Target Specific Videos
```sql
-- In placements table
UPDATE video_ad_placements 
SET target_video_ids = '[101, 102, 103]'  -- JSON array
WHERE id = 1;
```

### Target Video Categories
```sql
UPDATE video_ad_placements 
SET target_video_categories = '[1, 2, 5]'  -- Category IDs
WHERE id = 1;
```

---

## 🚨 Critical Considerations

### ⚠️ IMPORTANT: What This System Does NOT Do

1. **Does NOT modify existing ad tables** - It's additive
2. **Does NOT use VAST XML** - Uses simplified JSON format
3. **Does NOT support video bidding** - First-price auction only
4. **Does NOT handle payments** - Uses existing wallet system
5. **Does NOT track offline conversions** - Web-only tracking

### ⚠️ Production Checklist

Before going live:

- [ ] Test with real ad videos (not sample URLs)
- [ ] Set up CDN for ad video delivery
- [ ] Configure CORS properly
- [ ] Enable HTTPS (required for some browsers)
- [ ] Set up monitoring for tracking failures
- [ ] Create admin dashboard for campaign management
- [ ] Implement fraud detection (duplicate sessions, bots)
- [ ] Set up automated backups for analytics table
- [ ] Configure log rotation (analytics grows fast)
- [ ] Test on mobile devices
- [ ] Verify ad quality guidelines
- [ ] Set up payout processing for creators

---

## 📱 Mobile Compatibility

The system works on mobile browsers, but consider:

1. **Autoplay:** May be blocked, require user interaction
2. **Data usage:** Video ads consume bandwidth
3. **Screen size:** Banner ads should be responsive
4. **Touch targets:** Skip button should be large enough

---

## 🔐 Security Notes

1. **SQL Injection:** All queries use parameterized statements ✅
2. **XSS:** Tracking URLs are validated ✅
3. **CSRF:** Tracking endpoints are GET-only ✅
4. **Rate Limiting:** Consider adding to `/track` endpoint
5. **Ad Fraud:** Monitor for suspicious patterns
6. **PII:** Don't log IP addresses without consent

---

## 📞 Support

- **Documentation:** See `VIDEO_AD_SYSTEM_COMPLETE_GUIDE.md`
- **Code:** All files have inline comments
- **Database:** Schema includes comments on each column

---

## 🎓 Key Concepts

**Pre-roll:** Ad before video starts  
**Mid-roll:** Ad during video playback  
**Post-roll:** Ad after video ends  
**Companion Banner:** Static ad shown alongside video  
**Cue Point:** Timestamp where mid-roll appears  
**Skippable:** User can skip after N seconds  
**Frequency Cap:** Max times ad shown to user per day  
**CPM:** Cost Per Mille (1000 impressions)  
**CPV:** Cost Per View (completed view)  
**CPC:** Cost Per Click  
**Impression:** Ad starts loading  
**Start:** Ad video starts playing  
**Complete:** Ad watched to 100%  
**Quartile:** 25% milestone (first, mid, third)  

---

**Version:** 1.0.0  
**Last Updated:** October 11, 2025
