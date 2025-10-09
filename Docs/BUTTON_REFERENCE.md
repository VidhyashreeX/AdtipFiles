# 🔘 All Buttons Reference - Become Advertiser Landing Page

## Quick Button Map

This document lists every clickable button/CTA on the landing page and where it goes.

---

## 🎯 Section 1: Hero Section (Top of Page)

### Button 1: "Book Ads Now" 
- **Location**: Hero section, left side, primary button
- **Appearance**: Purple gradient background, large size
- **Action**: `navigate('/become-seller-full')`
- **Destination**: Seller Registration Form
- **Purpose**: Primary conversion - Get users to start registration

### Button 2: "Learn More"
- **Location**: Hero section, left side, secondary button  
- **Appearance**: Outlined button with purple border
- **Action**: `navigate('/contact-us')`
- **Destination**: Contact Us page
- **Purpose**: Information request - For users who want to learn more first

---

## 🎁 Section 2: Special Offer Banner

### Button 3: "Claim Your Credits"
- **Location**: Special Offer section (orange gradient background)
- **Appearance**: White button with orange text, large size
- **Action**: `navigate('/become-seller-full')`
- **Destination**: Seller Registration Form
- **Purpose**: Incentive-driven conversion - Emphasizes free ₹10,000 credits

---

## 🚀 Section 3: Final CTA (Bottom of Page)

### Button 4: "Book Your Ads Now"
- **Location**: Final CTA section, bottom of page, primary button
- **Appearance**: Purple gradient background, large size
- **Action**: `navigate('/become-seller-full')`
- **Destination**: Seller Registration Form
- **Purpose**: Last chance conversion - Catch users who scrolled through everything

### Button 5: "Contact Us"
- **Location**: Final CTA section, bottom of page, secondary button
- **Appearance**: Outlined button with purple border
- **Action**: `navigate('/contact-us')`
- **Destination**: Contact Us page
- **Purpose**: Support request - For users who still have questions

---

## 📊 Button Statistics

| Destination | Number of Buttons | Button Names |
|-------------|-------------------|--------------|
| `/become-seller-full` | 3 | "Book Ads Now" (x2), "Claim Your Credits" (x1) |
| `/contact-us` | 2 | "Learn More" (x1), "Contact Us" (x1) |
| **Total** | **5** | |

---

## 🎨 Button Styles

### Primary Buttons (Conversion-focused)
```tsx
className="text-lg bg-gradient-to-r from-purple-600 to-purple-700 
           hover:from-purple-700 hover:to-purple-800 text-white"
```
Used for: "Book Ads Now" (x2), "Claim Your Credits" (x1)

### Secondary Buttons (Information-focused)
```tsx
variant="outline" 
className="text-lg border-purple-500/50 hover:bg-purple-500/10 text-white"
```
Used for: "Learn More" (x1), "Contact Us" (x1)

### Special Offer Button
```tsx
className="text-lg bg-white text-orange-600 hover:bg-gray-100"
```
Used for: "Claim Your Credits" (stands out on orange background)

---

## 🔄 Navigation Flow

```
Landing Page Button Click
        ↓
   ┌────┴────┐
   │         │
Primary    Secondary
Buttons    Buttons
   │         │
   ↓         ↓
Registration  Contact
   Form       Page
```

---

## 💡 Button Placement Strategy

### Top of Page (Hero)
- **Primary CTA**: Immediate conversion opportunity
- **Secondary CTA**: Build trust, get more info

### Middle of Page (Special Offer)
- **Incentive CTA**: Catch users who are now interested after seeing benefits

### Bottom of Page (Final CTA)
- **Last Chance CTA**: Convert users who scrolled through everything
- **Support CTA**: Help undecided users

---

## 🎯 Conversion Funnel

```
100% Users land on page
    ↓
85% Scroll down
    ↓
60% Read benefits/pricing
    ↓
40% Reach special offer
    ↓
25% Scroll to bottom
    ↓
10-15% Click CTA (Target conversion rate)
```

---

## 🔍 Button Testing Checklist

- [ ] Hero "Book Ads Now" → `/become-seller-full` ✓
- [ ] Hero "Learn More" → `/contact-us` ✓
- [ ] Special Offer "Claim Your Credits" → `/become-seller-full` ✓
- [ ] Final "Book Your Ads Now" → `/become-seller-full` ✓
- [ ] Final "Contact Us" → `/contact-us` ✓
- [ ] All buttons have hover effects ✓
- [ ] All buttons are responsive ✓
- [ ] All buttons are accessible ✓

---

## 🛠️ How to Modify Button Destinations

To change where a button goes, edit the handler functions in `BecomeAdvertiserLanding.tsx`:

```typescript
// Line ~66-78
const handleBookAds = () => {
  navigate('/become-seller-full');  // ← Change this path
};

const handleClaimCredits = () => {
  navigate('/become-seller-full');  // ← Change this path
};

const handleContactUs = () => {
  navigate('/contact-us');  // ← Change this path
};
```

---

## 📈 Analytics Tracking (Future Enhancement)

To track button clicks, add analytics events:

```typescript
const handleBookAds = () => {
  // Add analytics event
  analytics.track('Book Ads CTA Clicked', {
    section: 'hero',
    page: 'become-advertiser-landing'
  });
  
  navigate('/become-seller-full');
};
```

---

## 🎨 Button Variants Summary

| Button Type | Count | Purpose | Style |
|-------------|-------|---------|-------|
| Primary Gradient | 3 | Drive conversions | Purple gradient |
| Outline Secondary | 2 | Information/Support | Purple outline |
| Special (White) | 1 | Special offer emphasis | White on orange |

---

**Quick Answer**: 
- **"Book Ads" / "Claim Credits"** → Registration Form
- **"Learn More" / "Contact Us"** → Contact Page

**Total Buttons**: 5 (3 conversion + 2 information)
