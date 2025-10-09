# Become Advertiser Flow - Quick Reference

## 🔄 Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Clicks "Become Advertiser"              │
│                     (anywhere in the app)                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  BecomeAdvertiserRedirect │
                    │  Component               │
                    │  (checks user status)    │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                          │
         ┌──────────▼──────────┐    ┌─────────▼──────────┐
         │  Has Company?       │    │  No Company?       │
         │  ✓ Existing Seller  │    │  ✗ New User        │
         └──────────┬──────────┘    └─────────┬──────────┘
                    │                          │
                    ▼                          ▼
         ┌──────────────────┐      ┌───────────────────────┐
         │ /seller/dashboard│      │ /become-advertiser-   │
         │                  │      │      landing          │
         └──────────────────┘      └───────────┬───────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  Landing Page       │
                                    │  (earn-reward-ads)  │
                                    │                     │
                                    │  Features:          │
                                    │  • Hero Section     │
                                    │  • Benefits         │
                                    │  • Pricing          │
                                    │  • Features         │
                                    │  • How It Works     │
                                    │  • Special Offers   │
                                    └──────────┬──────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         │                                           │
              ┌──────────▼──────────┐                   ┌───────────▼─────────┐
              │  User Clicks        │                   │  User Clicks        │
              │  "Book Ads"         │                   │  "Contact Us" /     │
              │  "Claim Credits"    │                   │  "Learn More"       │
              └──────────┬──────────┘                   └───────────┬─────────┘
                         │                                          │
                         ▼                                          ▼
              ┌──────────────────────┐                   ┌─────────────────┐
              │  /become-seller-full │                   │   /contact-us   │
              │  (Registration Form) │                   └─────────────────┘
              └──────────────────────┘
```

## 🎨 Landing Page Sections

### 1️⃣ Hero Section
- **Headline**: "AdTip — The Smartest Way to Advertise"
- **Subheadline**: "Reach Real People. Get Real Engagement. Pay Less."
- **CTAs**: 
  - Primary: "Book Ads Now" → `/become-seller-full`
  - Secondary: "Learn More" → `/contact-us`
- **Trust Indicators**: No bots guarantee, 70% cheaper, ₹10K free credits

### 2️⃣ Why Choose AdTip
6 benefit cards with icons:
- 🛡️ Real Users Only
- 👁️ High Attention
- 📊 Live Tracking
- 💰 Ultra-Low Pricing
- 🎁 Free Credits
- 🎯 Real Engagement

### 3️⃣ Pricing Table
Transparent pricing for 6 ad types:
| Ad Type | Cost |
|---------|------|
| Skip Ad | ₹0.20 |
| Non-Skip Ad | ₹0.50 |
| Bumper Ad | ₹0.30 |
| Non-Skip + Lead Form | ₹1.00 |
| Non-Skip + Question Ad | ₹1.00 |
| Skip + Question Ad | ₹0.50 |

### 4️⃣ Interactive Features
3 feature cards:
- 📹 Live Product Streaming
- 🎁 Reward Visits
- 💰 Wallet Integration

### 5️⃣ How It Works
5-step process:
1. Add Your Product
2. Create Your Ad
3. Choose Your Model
4. Promote & Track
5. Watch Sales Grow

### 6️⃣ Special Offer Banner
- **Offer**: ₹10,000 free ad credits
- **CTA**: "Claim Your Credits" → `/become-seller-full`
- **Design**: Orange gradient background

### 7️⃣ Final CTA Section
- **Message**: "Where Ads Reward Everyone"
- **Tagline**: "When your customer earns, your brand wins."
- **CTAs**: 
  - "Book Your Ads Now" → `/become-seller-full`
  - "Contact Us" → `/contact-us`

## 🎯 All CTA Buttons

| Section | Button Text | Destination | Purpose |
|---------|-------------|-------------|---------|
| Hero | "Book Ads Now" | `/become-seller-full` | Primary conversion |
| Hero | "Learn More" | `/contact-us` | Information request |
| Special Offer | "Claim Your Credits" | `/become-seller-full` | Incentive-driven conversion |
| Final CTA | "Book Your Ads Now" | `/become-seller-full` | Last chance conversion |
| Final CTA | "Contact Us" | `/contact-us` | Support request |

## 🎨 Design System

### Colors
- **Primary**: Purple (#9333EA - purple-700)
- **Secondary**: Orange (#EA580C - orange-600)
- **Background**: Dark gradient (gray-900 → gray-800)
- **Text**: White/Gray shades
- **Accents**: Green (success), Purple/Orange gradients

### Visual Effects
- Gradient overlays
- Blur effects (blur-3xl)
- Shadow effects (shadow-2xl)
- Hover transitions
- Icon placeholders (instead of images)

### Typography
- Headings: Bold, 4xl-7xl sizes
- Body: Gray-400 color
- Gradients on key phrases
- Badge highlights

## 📱 Responsive Breakpoints
- **Mobile**: Single column, simplified layout
- **Tablet** (md): 2-column grids
- **Desktop** (lg): 2-3 column grids, show images

## 🔗 Integration Points

### Files Modified
1. `src/pages/BecomeAdvertiserLanding.tsx` - NEW (Landing page)
2. `src/components/BecomeAdvertiserRedirect.tsx` - MODIFIED (routing logic)
3. `src/routes.tsx` - MODIFIED (added new route)

### Routes
- `/become-seller` - Entry point (redirect component)
- `/become-advertiser-landing` - Landing page (NEW)
- `/become-seller-full` - Registration form (existing)
- `/seller/dashboard` - Existing seller destination (existing)

## ✅ Testing Checklist

- [ ] Navigate to `/become-seller` as new user
- [ ] Verify landing page loads
- [ ] Click "Book Ads Now" → Should go to `/become-seller-full`
- [ ] Click "Learn More" → Should go to `/contact-us`
- [ ] Click "Claim Your Credits" → Should go to `/become-seller-full`
- [ ] Test responsive design on mobile
- [ ] Test responsive design on tablet
- [ ] Test responsive design on desktop
- [ ] Navigate to `/become-seller` as existing seller
- [ ] Verify redirect to `/seller/dashboard`

## 🚀 Deployment Notes

### Before Deployment
1. Replace icon placeholders with real images (optional)
2. Test all navigation paths
3. Verify responsive design
4. Check browser compatibility
5. Test with authenticated and unauthenticated users

### After Deployment
1. Monitor conversion rates
2. Track button click analytics
3. Gather user feedback
4. A/B test different CTAs
5. Optimize based on data

---

**Quick Start**: Just navigate to `/become-seller` and the new flow will automatically work!
