# 📱 React Native Ad Viewing System Implementation Plan

**Date**: November 11, 2025  
**Target**: Adtip React Native App  
**Status**: Planning Complete ✅

---

## 🔍 Current State Analysis

### ✅ Existing Infrastructure

1. **Services**
   - ✅ `AdRotationService.ts` - Google Ad Manager (PubScale)
   - ✅ `VideoAdRewardService.ts` - Video ad rewards (incomplete)
   - ✅ `ApiService.ts` - Main API service layer
   - ✅ `WalletService.ts` - Wallet management

2. **Screens**
   - ✅ `WatchToEarnScreen.tsx` - Empty placeholder screen
   - ✅ Existing video player components in `tiptube/` and `tipshorts/`

3. **Backend API**
   - ✅ 8 endpoints ready at `/api/ad-viewer/*`
   - ✅ Database configured
   - ✅ Payout system working

### ⚠️ What's Missing

1. ❌ Ad viewing service integrated with backend
2. ❌ Ad player component for viewing ads
3. ❌ Watch time tracking
4. ❌ Skip functionality
5. ❌ Website visit tracking
6. ❌ Quiz answer submission
7. ❌ Complete UI/UX for Watch to Earn

---

## 🎯 Implementation Plan

### Phase 1: Service Layer (Core Business Logic) ✅ COMPLETED

**Status**: ✅ Complete - November 11, 2025

**Files Created:**

1. ✅ **`services/AdViewerService.ts`** (421 lines)
   - Connected to backend `/api/ad-viewer/*` endpoints
   - Session management implemented
   - Watch time tracking
   - All 8 API methods complete
   - TypeScript interfaces

2. ✅ **`types/ads.ts`** (345 lines)
   - Complete type system
   - Ad configuration constants
   - Helper functions

3. ✅ **Updated `constants/api.ts`**
   - Added AD_VIEWER endpoints section

### Phase 2: Hooks (State Management) ✅ COMPLETED

**Status**: ✅ Complete - November 11, 2025

**Files Created:**

1. ✅ **`hooks/useAdViewer.ts`** (470 lines)
   - Session lifecycle management
   - Watch time tracking with intervals
   - Playback control (start, pause, resume)
   - Skip handling
   - Completion logic
   - Website visit tracking
   - Quiz answer submission
   - App state handling
   - Auto-cleanup

2. ✅ **`hooks/useAdList.ts`** (270 lines)
   - Fetch available ads
   - Pagination support
   - Ad type filtering
   - Pull-to-refresh
   - Loading states

3. ✅ **`hooks/index.ts`**
   - Central export file

### Phase 3: Components (UI Layer) ⏭️ PENDING

**Files to Create:**

1. ⏭️ **`components/ads/AdPlayer.tsx`** (NEW)
   - Video/Image ad display
   - Progress bar
   - Skip button (conditional)
   - Timer display
   - Completion indicator

2. ⏭️ **`components/ads/AdCard.tsx`** (NEW)
   - Display available ads in list
   - Show payout amount
   - Show ad type badge

3. ⏭️ **`components/ads/WebsiteVisitModal.tsx`** (NEW)
   - WebView for brand awareness ads
   - Timer for 30s requirement
   - Completion tracking

4. ⏭️ **`components/ads/QuizModal.tsx`** (NEW)
   - Display quiz question
   - Multiple choice options
   - Submit answer

### Phase 4: Screens (Full Features) ✅

**Files to Modify:**

1. **`screens/watchToEarn/WatchToEarnScreen.tsx`**
   - Replace "Coming Soon" with actual implementation
   - List of available ads
   - Filter by ad type
   - View earnings history
   - Current balance display

2. **`screens/watchToEarn/AdViewScreen.tsx`** (NEW)
   - Full-screen ad player
   - Handle all 8 ad types
   - Navigation integration

3. **`screens/watchToEarn/AdHistoryScreen.tsx`** (NEW)
   - Viewing history
   - Earnings breakdown
   - Statistics

### Phase 5: Navigation Integration ✅

**Files to Modify:**

1. **Navigation Stack**
   - Add AdViewScreen to navigation
   - Add AdHistoryScreen to navigation
   - Configure routes

### Phase 6: Testing & Polish ✅

**Testing Checklist:**

- [ ] Service methods work correctly
- [ ] Ad player displays video/image ads
- [ ] Watch time tracking accurate
- [ ] Skip button works (when allowed)
- [ ] Payout credited correctly
- [ ] Wallet balance updates
- [ ] Error handling works
- [ ] Offline handling
- [ ] Performance optimized

---

## 📊 Ad Model Types to Support

| Type | ID | Features | Implementation |
|------|----|---------|--------------  |
| NON_SKIP | 2 | 20s watch | Basic player |
| SKIP | 5, 29 | Skip after 5s | Player + skip button |
| BRAND_AWARENESS | 30, 90, 91 | 8s + 30s website | Player + WebView modal |

**Note**: Only 6 ad model types exist in production (not 8 as originally planned)

---

## 🗂️ File Structure

```
src/
├── services/
│   ├── AdViewerService.ts          ← NEW
│   └── VideoAdRewardService.ts     ← UPDATE
│
├── components/
│   └── ads/                        ← NEW FOLDER
│       ├── AdPlayer.tsx
│       ├── AdCard.tsx
│       ├── WebsiteVisitModal.tsx
│       └── QuizModal.tsx
│
├── hooks/
│   ├── useAdViewer.ts              ← NEW
│   └── useAdList.ts                ← NEW
│
├── screens/
│   └── watchToEarn/
│       ├── WatchToEarnScreen.tsx   ← UPDATE
│       ├── AdViewScreen.tsx        ← NEW
│       └── AdHistoryScreen.tsx     ← NEW
│
├── types/
│   └── ads.ts                      ← NEW
│
└── constants/
    └── api.ts                      ← UPDATE
```

---

## 🔧 Technical Specifications

### API Integration

**Base URL**: `https://api.adtip.in`

**Endpoints to Use:**
```typescript
POST   /api/ad-viewer/start           // Start session
PUT    /api/ad-viewer/watch-time      // Update watch time
POST   /api/ad-viewer/skip            // Skip ad
POST   /api/ad-viewer/website-visit   // Track website visit
POST   /api/ad-viewer/submit-answer   // Submit quiz
POST   /api/ad-viewer/complete        // Complete & payout
GET    /api/ad-viewer/history/:userId // History
GET    /api/ad-viewer/analytics/:adId // Analytics
```

### Data Flow

```
1. User opens Watch to Earn
   ↓
2. Fetch available ads (GET /api/getallads)
   ↓
3. User selects ad
   ↓
4. Start session (POST /api/ad-viewer/start)
   ↓
5. Play ad + Track watch time (PUT /api/ad-viewer/watch-time)
   ↓
6. Handle special actions:
   - Skip (if allowed)
   - Website visit
   - Quiz answer
   ↓
7. Complete ad (POST /api/ad-viewer/complete)
   ↓
8. Update wallet balance
   ↓
9. Show success message
```

### State Management

```typescript
interface AdViewSession {
  sessionId: string;
  adId: number;
  adModelType: string;
  requiredWatchTime: number;
  currentWatchTime: number;
  skipAllowed: boolean;
  skipAvailableAfter: number;
  websiteVisitRequired: boolean;
  websiteVisited: boolean;
  questionRequired: boolean;
  questionAnswered: boolean;
  completed: boolean;
  payout: number;
}
```

---

## 🎨 UI/UX Design

### Watch to Earn Screen

```
┌─────────────────────────────────┐
│ ← Watch to Earn       [History] │
├─────────────────────────────────┤
│  💰 Balance: ₹150.00           │
│  📊 Today: 5 ads • ₹7.50       │
├─────────────────────────────────┤
│ 🎬 Available Ads                │
│                                 │
│ ┌───────────────────────────┐  │
│ │ [Thumbnail]               │  │
│ │ Brand Name Campaign       │  │
│ │ 🎥 Video • 20s            │  │
│ │ 💰 Earn ₹2.00    [WATCH]  │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ [Thumbnail]               │  │
│ │ Product Launch Ad         │  │
│ │ 🖼️ Image • 8s             │  │
│ │ 💰 Earn ₹1.20    [WATCH]  │  │
│ └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Ad Player Screen

```
┌─────────────────────────────────┐
│ [×] Close                       │
├─────────────────────────────────┤
│                                 │
│                                 │
│        [VIDEO PLAYING]          │
│                                 │
│                                 │
├─────────────────────────────────┤
│ ████████░░░░░░░░░  15s / 20s   │
│                                 │
│ 💰 ₹2.00   [Skip in 5s...]     │
└─────────────────────────────────┘
```

---

## ⚡ Performance Considerations

1. **Video Preloading**: Preload next ad video
2. **Caching**: Cache ad thumbnails
3. **Offline Handling**: Queue watch time updates
4. **Battery Optimization**: Pause tracking when app backgrounded
5. **Memory Management**: Clear video buffers after completion

---

## 🔒 Security Considerations

1. **Session Validation**: Backend validates all watch time
2. **Fraud Prevention**: Rate limiting on backend
3. **Secure Tokens**: JWT authentication required
4. **Data Encryption**: HTTPS only
5. **Input Validation**: Sanitize all user inputs

---

## 📋 Testing Strategy

### Unit Tests
- Service methods
- Hook logic
- Component rendering

### Integration Tests
- API communication
- Navigation flow
- State management

### E2E Tests
- Complete ad viewing flow
- Payout processing
- Error scenarios

---

## 🚀 Deployment Checklist

- [ ] All services implemented
- [ ] All components created
- [ ] All hooks working
- [ ] Screens updated
- [ ] Navigation integrated
- [ ] Error handling complete
- [ ] Loading states added
- [ ] Offline support added
- [ ] Analytics tracking added
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Testing complete
- [ ] Documentation updated

---

## 📊 Success Metrics

- Ad view completion rate > 80%
- Average watch time meets requirements
- Payout accuracy 100%
- Crash rate < 0.1%
- User satisfaction > 4.0/5.0

---

## 🎯 Next Steps

1. ✅ Create plan document
2. ⏭️ Implement AdViewerService
3. ⏭️ Create ad types and interfaces
4. ⏭️ Build AdPlayer component
5. ⏭️ Create useAdViewer hook
6. ⏭️ Update WatchToEarnScreen
7. ⏭️ Create AdViewScreen
8. ⏭️ Test complete flow
9. ⏭️ Polish UI/UX
10. ⏭️ Deploy to staging

---

**Estimated Time**: 4-6 hours  
**Complexity**: Medium  
**Priority**: High  
**Dependencies**: Backend API (✅ Ready)

---

*Plan created by: AI Agent*  
*Date: November 11, 2025*  
*Status: Ready for Implementation*
