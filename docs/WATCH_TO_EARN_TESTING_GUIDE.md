# Watch To Earn - Comprehensive Testing Guide

## Overview
This guide provides detailed testing procedures for the Watch To Earn feature implementation in the AdTip React Native application.

**Feature Status:** ✅ Ready for Testing  
**Last Updated:** November 11, 2025  
**Version:** 1.0.0

---

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Component Testing](#component-testing)
3. [Navigation Testing](#navigation-testing)
4. [API Integration Testing](#api-integration-testing)
5. [User Flow Testing](#user-flow-testing)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Performance Testing](#performance-testing)
8. [Device-Specific Testing](#device-specific-testing)
9. [Regression Testing](#regression-testing)

---

## Pre-Testing Setup

### Requirements Checklist
- [ ] Backend server running and accessible
- [ ] Database populated with test ad campaigns
- [ ] Valid user account with authentication token
- [ ] Network connectivity available
- [ ] React Native development environment set up
- [ ] Test devices (iOS/Android) available

### Test Data Setup

#### Required Ad Models in Database:
```sql
-- Verify these ad models exist:
SELECT * FROM admodels_master WHERE AD_MODEL_ID IN (2, 5, 29, 30, 90, 91);

-- AD_MODEL_ID mappings:
-- 2  = NON_SKIP
-- 5  = SKIP
-- 29 = SKIP
-- 30 = BRAND_AWARENESS
-- 90 = BRAND_AWARENESS
-- 91 = BRAND_AWARENESS
```

#### Test User Setup:
```javascript
// Test user credentials
const testUser = {
  id: 1,
  email: 'test@adtip.com',
  role: 'user'
};
```

#### Test Ad Campaigns:
Create at least 3 test campaigns for each ad type:
- 3x NON_SKIP ads (must watch fully)
- 3x SKIP ads (can skip after time)
- 3x BRAND_AWARENESS ads (with website URL)
- 3x Question-based ads (with quiz)

---

## Component Testing

### 1. AdCard Component

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| AC-01 | Render ad card with all data | Mount component with mock ad data | All fields display correctly |
| AC-02 | Display correct ad type badge | Pass different adModelType values | Badge shows correct type and color |
| AC-03 | Display ad thumbnail | Provide image URL | Image loads and displays |
| AC-04 | Handle missing thumbnail | Provide null/invalid URL | Placeholder shows |
| AC-05 | Press handler works | Tap card | onPress callback invoked with adId |
| AC-06 | Display earnings amount | Pass view_price value | Amount formatted as currency |
| AC-07 | Display duration | Pass duration in seconds | Formatted as MM:SS |
| AC-08 | Theme compatibility | Switch dark/light mode | Styles adapt correctly |

#### Test Code Example:
```typescript
// AdCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { AdCard } from '@/components/ads';

describe('AdCard Component', () => {
  const mockAd = {
    ad_id: 1,
    campaign_name: 'Test Campaign',
    media_url: 'https://example.com/image.jpg',
    ad_model_type: 'NON_SKIP',
    view_price: 1.5,
    duration: 30
  };

  it('should render ad card with all data', () => {
    const { getByText } = render(<AdCard ad={mockAd} onPress={jest.fn()} />);
    expect(getByText('Test Campaign')).toBeTruthy();
  });

  it('should call onPress with adId', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AdCard ad={mockAd} onPress={onPress} />);
    fireEvent.press(getByTestId('ad-card'));
    expect(onPress).toHaveBeenCalledWith(1);
  });
});
```

---

### 2. AdPlayer Component

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| AP-01 | Play video ad | Load video URL, press play | Video plays |
| AP-02 | Pause video ad | Play video, press pause | Video pauses |
| AP-03 | Display progress bar | Play video | Progress updates in real-time |
| AP-04 | Skip button disabled initially | Load SKIP ad | Skip button disabled |
| AP-05 | Skip button enables after time | Wait for skip time | Button becomes enabled |
| AP-06 | Skip button works | Click enabled skip button | onSkip callback invoked |
| AP-07 | Completion triggers callback | Watch until end | onComplete callback invoked |
| AP-08 | Display image ad | Load image URL | Image displays (no video controls) |
| AP-09 | Handle invalid media URL | Provide invalid URL | Error state shows |
| AP-10 | Watch time tracking | Play ad | watchTime prop updates correctly |

---

### 3. WebsiteVisitModal Component

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| WM-01 | Modal opens | Set visible=true | Modal displays |
| WM-02 | WebView loads URL | Pass website URL | Website loads in WebView |
| WM-03 | Timer displays | Open modal | 30-second timer shows |
| WM-04 | Timer counts down | Wait | Timer decrements every second |
| WM-05 | Timer completion | Wait 30 seconds | onComplete callback invoked |
| WM-06 | Close before completion | Click close button | onClose callback invoked |
| WM-07 | Cannot close during timer | Try to close in first 5 seconds | Close disabled |
| WM-08 | Close enabled after minimum | Wait 5 seconds | Close button enabled |
| WM-09 | Handle invalid URL | Pass invalid URL | Error message shows |
| WM-10 | Back button handling | Press device back button | Modal closes properly |

---

### 4. QuizModal Component

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| QM-01 | Modal opens | Set visible=true | Modal displays with question |
| QM-02 | Display question | Pass question text | Question displays |
| QM-03 | Display options | Pass options array | All options render as buttons |
| QM-04 | Select option | Tap option button | Option highlighted |
| QM-05 | Submit correct answer | Select correct answer, submit | onSubmit returns {correct: true, earned: 2.0} |
| QM-06 | Submit incorrect answer | Select wrong answer, submit | onSubmit returns {correct: false, earned: 0} |
| QM-07 | Display result feedback | Submit answer | Success/failure message shows |
| QM-08 | Bonus amount display | Pass bonusAmount prop | Amount shows in UI |
| QM-09 | Close after submission | Submit and wait | Modal auto-closes after 2s |
| QM-10 | Close without answering | Click close button | onClose callback invoked |

---

### 5. AdTypeBadge Component

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TB-01 | Display NON_SKIP badge | Pass adType='NON_SKIP' | Blue badge with "Full Watch" |
| TB-02 | Display SKIP badge | Pass adType='SKIP' | Green badge with "Skippable" |
| TB-03 | Display BRAND_AWARENESS badge | Pass adType='BRAND_AWARENESS' | Purple badge with "Brand" |
| TB-04 | Small size variant | Pass size='small' | Smaller badge renders |
| TB-05 | Medium size variant | Pass size='medium' | Medium badge renders |
| TB-06 | Large size variant | Pass size='large' | Large badge renders |

---

## Navigation Testing

### Screen Navigation Flow

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| NAV-01 | Navigate to WatchToEarn | Open app, go to Watch To Earn tab | WatchToEarnScreen displays |
| NAV-02 | Navigate to AdView | Tap ad card on WatchToEarn screen | AdViewScreen opens as modal |
| NAV-03 | Navigate to AdHistory | Tap "View History" link | AdHistoryScreen pushes onto stack |
| NAV-04 | Back from AdView | Press back button on AdView | Returns to WatchToEarn |
| NAV-05 | Back from AdHistory | Press back button on AdHistory | Returns to WatchToEarn |
| NAV-06 | Complete ad flow | Watch ad to completion | Returns to WatchToEarn, shows success |
| NAV-07 | Deep link to AdView | Open app with ad deep link | AdView opens directly |
| NAV-08 | Android back button | Press Android back on any screen | Navigates back correctly |
| NAV-09 | Modal presentation | Check AdView animation | Slides from bottom (modal style) |
| NAV-10 | Push presentation | Check AdHistory animation | Slides from right (push style) |

### Navigation Parameters

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| NP-01 | AdView receives userId | Navigate to AdView | userId passed correctly |
| NP-02 | AdView receives adId | Navigate to AdView | adId passed correctly |
| NP-03 | Invalid adId handling | Navigate with invalid adId | Error shown |
| NP-04 | Missing userId handling | Navigate without userId | Error or redirect |
| NP-05 | Type safety check | Code compilation | No type errors |

---

## API Integration Testing

### 1. Get Available Ads

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-01 | Fetch ads successfully | Call getAvailableAds(userId) | Returns array of ads |
| API-02 | Empty ads list | Call with userId that has no ads | Returns empty array |
| API-03 | Filter by ad type | Call with adTypeFilter='SKIP' | Returns only SKIP ads |
| API-04 | Pagination works | Request page 1, then page 2 | Different ads returned |
| API-05 | Limit parameter | Set limit=10 | Returns max 10 ads |
| API-06 | Offset parameter | Set offset=5 | Skips first 5 ads |
| API-07 | Network error handling | Disconnect network, call API | Error caught and displayed |
| API-08 | 401 unauthorized | Call with invalid token | Redirect to login |
| API-09 | 500 server error | Trigger server error | Error message shown |
| API-10 | Timeout handling | Set short timeout | Timeout error caught |

---

### 2. Start Ad Session

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-11 | Start session successfully | Call startSession(userId, adId) | Returns sessionId |
| API-12 | Invalid adId | Call with non-existent adId | 404 error |
| API-13 | Invalid userId | Call with invalid userId | 401 error |
| API-14 | Duplicate session | Start same ad twice | Error or existing session returned |
| API-15 | Session data returned | Check response | Contains all required ad data |

---

### 3. Complete Ad View

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-16 | Complete successfully | Call completeAd(sessionId) | Returns payout data |
| API-17 | Incomplete watch time | Complete before required time | Error or reduced payout |
| API-18 | Invalid sessionId | Call with fake sessionId | 404 error |
| API-19 | Payout calculation | Check response data | Correct basePayout + bonusPayout |
| API-20 | Wallet update | Complete ad, check wallet | Balance increases |

---

### 4. Track Website Visit

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-21 | Track visit successfully | Call trackWebsiteVisit(sessionId, duration) | Returns bonus status |
| API-22 | Minimum duration check | Visit for less than required | bonusUnlocked=false |
| API-23 | Full duration visit | Visit for full 30 seconds | bonusUnlocked=true |
| API-24 | Invalid sessionId | Track with fake sessionId | 404 error |

---

### 5. Submit Quiz Answer

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-25 | Correct answer | Submit correct answer | Returns correct=true, bonus=2.0 |
| API-26 | Incorrect answer | Submit wrong answer | Returns correct=false, bonus=0 |
| API-27 | Invalid sessionId | Submit with fake sessionId | 404 error |
| API-28 | Multiple submissions | Submit twice | Second attempt rejected |

---

### 6. Get Viewing History

#### Test Cases:
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| API-29 | Fetch history successfully | Call getViewingHistory(userId) | Returns array of history items |
| API-30 | Empty history | Call with new user | Returns empty array |
| API-31 | Pagination works | Request multiple pages | Different history items |
| API-32 | Status filtering | Filter by 'completed' | Returns only completed views |
| API-33 | Sort order | Check returned data | Most recent first |

---

## User Flow Testing

### Flow 1: Complete NON_SKIP Ad

**Goal:** User watches a non-skippable ad to completion and earns money

#### Steps:
1. ✅ Open WatchToEarnScreen
2. ✅ Verify ads are displayed
3. ✅ Tap on a NON_SKIP ad card
4. ✅ AdViewScreen opens
5. ✅ Video starts playing automatically
6. ✅ Progress bar updates
7. ✅ Skip button remains disabled
8. ✅ Watch until 100% complete
9. ✅ Completion alert shows: "Congratulations! You earned $X.XX"
10. ✅ Tap OK on alert
11. ✅ Return to WatchToEarnScreen
12. ✅ Ad list refreshes
13. ✅ Check wallet balance increased

**Expected Time:** 30-60 seconds  
**Expected Payout:** $0.50 - $2.00

---

### Flow 2: Skip SKIP Ad

**Goal:** User skips a skippable ad after minimum watch time

#### Steps:
1. ✅ Open WatchToEarnScreen
2. ✅ Filter by "Quick Skip"
3. ✅ Tap on a SKIP ad card
4. ✅ AdViewScreen opens
5. ✅ Video starts playing
6. ✅ Skip button is disabled
7. ✅ Wait for skip time (e.g., 5 seconds)
8. ✅ Skip button becomes enabled
9. ✅ Tap Skip button
10. ✅ Confirmation alert shows: "Skip this ad? You'll earn $X.XX"
11. ✅ Tap Confirm
12. ✅ Success alert shows: "You earned $X.XX"
13. ✅ Return to WatchToEarnScreen

**Expected Time:** 10-15 seconds  
**Expected Payout:** $0.25 - $1.00

---

### Flow 3: Complete BRAND_AWARENESS Ad with Website Visit

**Goal:** User completes a brand awareness ad by visiting the website

#### Steps:
1. ✅ Open WatchToEarnScreen
2. ✅ Filter by "Brand Bonus"
3. ✅ Tap on a BRAND_AWARENESS ad card
4. ✅ AdViewScreen opens
5. ✅ Video/image displays
6. ✅ Watch until completion
7. ✅ WebsiteVisitModal opens automatically
8. ✅ Website loads in WebView
9. ✅ Timer shows "30 seconds remaining"
10. ✅ Timer counts down
11. ✅ Interact with website
12. ✅ Wait for timer to reach 0
13. ✅ "Visit Complete" button becomes enabled
14. ✅ Tap "Visit Complete"
15. ✅ Success alert shows: "You earned $X.XX + $Y.YY bonus"
16. ✅ Return to WatchToEarnScreen

**Expected Time:** 60-90 seconds  
**Expected Payout:** $1.00 - $3.00 (base + bonus)

---

### Flow 4: Complete Question-Based Ad

**Goal:** User answers quiz question correctly after watching ad

#### Steps:
1. ✅ Open WatchToEarnScreen
2. ✅ Tap on ad with question badge
3. ✅ AdViewScreen opens
4. ✅ Watch ad to completion
5. ✅ QuizModal opens automatically
6. ✅ Read question
7. ✅ Review options (A, B, C, D)
8. ✅ Select correct answer
9. ✅ Tap "Submit Answer"
10. ✅ Success feedback shows: "Correct! +$2.00 bonus"
11. ✅ Modal auto-closes after 2 seconds
12. ✅ Completion alert shows total earnings
13. ✅ Return to WatchToEarnScreen

**Expected Time:** 45-60 seconds  
**Expected Payout:** $1.00 - $4.00 (base + quiz bonus)

---

### Flow 5: View Ad History

**Goal:** User checks their viewing history and earnings

#### Steps:
1. ✅ Open WatchToEarnScreen
2. ✅ Tap "View History" link in stats card
3. ✅ AdHistoryScreen opens
4. ✅ Earnings card shows total earned
5. ✅ History list displays all viewed ads
6. ✅ Each item shows:
   - Campaign name
   - Ad type badge
   - Watch time vs required time
   - Status (completed, skipped, timeout)
   - Earned amount
   - Date/time
7. ✅ Filter by "Completed"
8. ✅ List updates to show only completed ads
9. ✅ Pull down to refresh
10. ✅ List updates with new data
11. ✅ Scroll to bottom
12. ✅ More history loads (pagination)
13. ✅ Tap back to return to WatchToEarnScreen

**Expected Time:** 30-60 seconds

---

## Edge Cases & Error Handling

### Error Scenarios

#### 1. Network Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| No internet on app launch | Error message: "No internet connection. Please check your network." |
| Network lost during ad playback | Pause ad, show reconnection message, resume when online |
| Slow network (< 1 Mbps) | Show loading indicator, buffer video |
| API timeout | Show error: "Request timed out. Please try again." |
| Server unreachable (5xx) | Show error: "Server error. Please try again later." |

#### 2. Authentication Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| Token expired during session | Redirect to login with message |
| Invalid token | Redirect to login |
| User logged out | Clear session data, redirect to login |
| Multiple device login | Handle token refresh gracefully |

#### 3. Data Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| No ads available | Show empty state with message |
| Ad deleted during viewing | Show error, return to list |
| Invalid ad data (missing fields) | Skip ad, log error |
| Corrupted media URL | Show error: "Media failed to load" |
| Invalid JSON response | Show error: "Unable to load data" |

#### 4. Payment Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| Wallet update fails | Show warning, retry payment |
| Insufficient advertiser funds | Don't show ad to users |
| Payment calculation error | Log error, use fallback amount |
| Duplicate payment attempt | Prevent duplicate, show existing payment |

#### 5. Session Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| Session expired | Show message, start new session |
| Concurrent sessions | Allow only one active session per user |
| App backgrounded during ad | Pause timer, resume on foreground |
| App killed during ad | Clear session, allow restart |
| Session data corrupted | Clear session, start fresh |

#### 6. Device Issues

| Scenario | Expected Behavior |
|----------|-------------------|
| Low storage space | Show warning: "Low storage" |
| Video codec not supported | Show error: "Video format not supported" |
| Audio disabled | Continue with video only |
| Screen rotation | Maintain playback, adjust layout |
| Battery saver mode | Continue normally, may reduce quality |

---

## Performance Testing

### Metrics to Monitor

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| App launch time | < 2s | > 5s |
| Screen transition | < 300ms | > 1s |
| API response time | < 500ms | > 2s |
| Video load time | < 3s | > 10s |
| Memory usage | < 150MB | > 300MB |
| CPU usage | < 30% | > 60% |
| Battery drain | < 5%/hour | > 15%/hour |

### Performance Test Cases

#### 1. Memory Leaks
- [ ] Play 10 ads consecutively
- [ ] Check memory usage before and after
- [ ] Memory should not increase more than 20MB
- [ ] Close all screens and verify memory releases

#### 2. Video Playback Performance
- [ ] Test with 720p video
- [ ] Test with 1080p video
- [ ] Monitor frame drops
- [ ] Check audio sync
- [ ] Test with multiple video formats (mp4, webm, etc.)

#### 3. List Rendering Performance
- [ ] Load 100 ads in WatchToEarnScreen
- [ ] Scroll through entire list
- [ ] Monitor FPS (should stay > 50 FPS)
- [ ] Check for jank or stuttering

#### 4. Image Loading Performance
- [ ] Load 20 ad thumbnails simultaneously
- [ ] Check load times
- [ ] Verify caching works
- [ ] Test with slow network

#### 5. State Management Performance
- [ ] Switch between screens rapidly
- [ ] Check for state persistence
- [ ] Verify no unnecessary re-renders
- [ ] Test hook performance

---

## Device-Specific Testing

### iOS Testing

#### Devices to Test:
- [ ] iPhone 15 Pro (iOS 17+)
- [ ] iPhone 14 (iOS 16+)
- [ ] iPhone 12 (iOS 15+)
- [ ] iPad Pro 12.9" (iOS 17+)

#### iOS-Specific Cases:
- [ ] Picture-in-picture video support
- [ ] Control Center integration
- [ ] App switcher video thumbnail
- [ ] Haptic feedback on interactions
- [ ] Dynamic Type support
- [ ] VoiceOver accessibility
- [ ] Dark mode appearance
- [ ] Safe area handling (notch)

---

### Android Testing

#### Devices to Test:
- [ ] Samsung Galaxy S23 (Android 13+)
- [ ] Google Pixel 7 (Android 13+)
- [ ] OnePlus 11 (Android 13+)
- [ ] Samsung Galaxy Tab S8 (Android 12+)

#### Android-Specific Cases:
- [ ] Hardware back button behavior
- [ ] System navigation gestures
- [ ] Picture-in-picture support
- [ ] Notification interaction
- [ ] Split-screen multitasking
- [ ] TalkBack accessibility
- [ ] Dark theme compatibility
- [ ] Different screen sizes/densities

---

## Regression Testing

### Test After Each Update

#### Core Functionality:
- [ ] All 4 ad types work (NON_SKIP, SKIP, BRAND_AWARENESS, QUESTION)
- [ ] Navigation works correctly
- [ ] Payment calculations correct
- [ ] History displays accurately
- [ ] Filters work properly

#### UI/UX:
- [ ] Theme switching works
- [ ] All animations smooth
- [ ] Loading states display
- [ ] Error states display
- [ ] Empty states display

#### Integration:
- [ ] API calls successful
- [ ] Authentication works
- [ ] Deep links work
- [ ] Push notifications work (if applicable)
- [ ] Analytics tracking works

---

## Automated Testing Setup

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run specific test suite
npm test -- AdViewerService.test.ts
```

### E2E Tests (Detox)
```bash
# Build app for E2E
npm run build:e2e:ios
npm run build:e2e:android

# Run E2E tests
npm run test:e2e:ios
npm run test:e2e:android
```

---

## Bug Reporting Template

### Bug Report Format:
```markdown
**Title:** [Component] Brief description

**Severity:** Critical / High / Medium / Low

**Environment:**
- OS: iOS 17.0 / Android 13
- Device: iPhone 15 Pro / Samsung S23
- App Version: 1.0.0
- Network: WiFi / 4G / 5G

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Screenshots/Video:**
[Attach if available]

**Console Logs:**
[Paste relevant logs]

**Additional Context:**
Any other relevant information
```

---

## Testing Sign-Off Checklist

### Before Production Release:
- [ ] All component tests pass
- [ ] All navigation flows work
- [ ] All API integrations tested
- [ ] All user flows completed successfully
- [ ] All edge cases handled
- [ ] Performance metrics within targets
- [ ] iOS devices tested
- [ ] Android devices tested
- [ ] Regression tests pass
- [ ] Security review completed
- [ ] Accessibility review completed
- [ ] Documentation reviewed
- [ ] Stakeholder approval obtained

---

## Contact & Support

**For Testing Issues:**
- Email: dev@adtip.com
- Slack: #watch-to-earn-testing

**Test Lead:** [Name]  
**QA Team:** [Names]  
**Development Team:** [Names]

---

**Document Version:** 1.0.0  
**Last Updated:** November 11, 2025  
**Next Review:** After first production release
