# Publisher Pages - Quick Reference

## 🔗 URLs

- **Publisher Landing Page**: `/publisher`
- **Publisher Dashboard**: `/publisher-dashboard`

## 📍 Sidebar Location

The menu items appear in the sidebar under the E-commerce section:
- 🗞️ **Publisher** (Newspaper icon)
- 📊 **Publisher Dashboard** (Layout icon)

## 🎨 Theme Support

Both pages fully support **Light** and **Dark** modes automatically through the theme context.

## 🧩 Components Used

### Publisher Landing
1. Hero - Main banner with 50-50 revenue messaging
2. ComparisonTable - AdTip vs competitors
3. AdFormats - 7+ ad format showcase
4. Steps - 5-step onboarding process
5. Analytics - Dashboard preview
6. Benefits - 6 key advantages
7. CTA - Call-to-action section

### Publisher Dashboard
1. MetricCard - Key performance indicators
2. EarningsChart - 7-day earnings visualization
3. AppsTable - Manage integrated apps
4. AdModelsTable - Ad format performance
5. PaymentHistory - Transaction records & balances

## 🎯 Key Features

### Publisher Page
- ✅ 50-50 revenue share highlight
- ✅ Interactive comparison table
- ✅ 7 ad format cards
- ✅ Visual step-by-step guide
- ✅ Dashboard preview screenshot
- ✅ Benefits showcase
- ✅ Multiple CTAs

### Dashboard Page
- ✅ 6 real-time metrics
- ✅ Interactive earnings chart
- ✅ App management interface
- ✅ Ad performance analytics
- ✅ Payment history
- ✅ Balance tracking
- ✅ Withdrawal interface

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: 1024px - 1280px (3 columns)
- **Large**: > 1280px (6 columns for metrics)

## 🎨 Color Scheme

### Light Mode
- Primary: Teal (#00dcaa)
- Accent: Green
- Background: White
- Text: Dark gray

### Dark Mode
- Primary: Teal (#00dcaa)
- Accent: Green
- Background: Dark gray (#0f1419)
- Text: Light gray

## 🔄 User Flow

```
1. User clicks "Publisher" in sidebar
   → Lands on Publisher landing page
   → Sees 50-50 revenue model
   → Clicks "Get Started Free" CTA

2. User navigates to Publisher Dashboard
   → Views earnings metrics
   → Manages apps
   → Checks payment history
   → Analyzes ad performance
```

## 📊 Dashboard Metrics

1. **Total Views** - Eye icon, primary color
2. **Total Earnings** - Dollar icon, green color
3. **Today's Earnings** - Trending icon, accent color
4. **Active Users** - Users icon, primary color
5. **Avg. eCPM** - Target icon, green color
6. **CTR** - Percent icon, accent color

## 🔧 Customization Points

### To Update Mock Data:
- **AppsTable.tsx**: Line 12-35 (apps array)
- **AdModelsTable.tsx**: Line 12-19 (adModels array)
- **PaymentHistory.tsx**: Line 13-34 (payments array)
- **EarningsChart.tsx**: Line 4-12 (data array)

### To Update Metrics:
- **PublisherDashboard.tsx**: Lines 13-63 (MetricCard components)

### To Update Hero Content:
- **Hero.tsx**: Lines 18-38 (text content)

## 🚀 Next Steps

1. **Connect to API**: Replace mock data with real API calls
2. **Add Authentication**: Protect dashboard routes
3. **Enable Features**: Wire up "Add New App" and "Request Payout" buttons
4. **Add Filtering**: Implement date range filters for charts
5. **Expand Analytics**: Add more detailed analytics views

## 📚 Dependencies Used

- **React Router** - Navigation
- **Lucide React** - Icons
- **Recharts** - Charts/graphs
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components (Card, Table, Badge, etc.)

## 💡 Tips

- Use browser DevTools to toggle dark mode: `document.documentElement.classList.toggle('dark')`
- Charts are responsive and will adapt to container width
- All tables are scrollable on mobile devices
- Images are optimized for web viewing

---

For detailed implementation, see `PUBLISHER_INTEGRATION_SUMMARY.md`
