# Complete Advertisement Integration Guide

## 📋 Overview
This document provides a comprehensive guide to the advertisement functionality integration between the backend and frontend.

## 🎯 System Architecture

### Backend Structure (adtipback)
- **Controller**: `controllers/AdController.js`
- **Service**: `services/AdService.js`
- **Routes**: `routes/api-routes.js`
- **Database**: `admodels`, `company`, `admodels_master` tables

### Frontend Structure (adtip-web-reactjs)
- **Pages**: 
  - `AdModel.tsx` - Ad format selection
  - `ConfigureCampaign.tsx` - Campaign configuration
  - `AdOrders.tsx` - Campaign management dashboard
  - `AdAnalytics.tsx` - Performance analytics
  - `AdOrderDetail.tsx` - Detailed campaign view
  - `PreviewAd.tsx` - Ad preview
  - `UploadCreative.tsx` - Media upload
- **API**: `api.ts` - All API integration functions
- **Routes**: Configured in routing system

## 📊 Database Schema

### `admodels` Table (Main Campaign Table)
```sql
- id: Campaign ID
- company_name: Company name
- campaign_name: Campaign name
- target_gender: Target gender
- marital_status: Marital status
- target_lower_age, target_upper_age: Age range
- target_professions: Target professions (CSV)
- target_area: Target areas (JSON/CSV)
- ad_total_people: Total target people
- ad_customer_target_per_day: Daily target
- adwatch_per_day: Watches per day
- ad_perday_pay: Daily payment
- ad_spend_per_day: Daily spend
- ad_view, ad_like: Engagement metrics
- ad_start_date, ad_end_date: Campaign duration
- ad_upload_filename: Media file
- mediaType: Media type (1=video, 2=image)
- ad_headline, ad_description: Ad content
- ad_website_link: CTA link
- ad_button_text_id: Button type
- ad_model_id: Ad format (1-5)
- company_id: Company reference
- createdby: User ID
- is_active: Active status
- adPauseCountinue: Pause/Continue status
- ad_order_value, ad_charges_value, ad_tax, ad_total: Pricing
```

### `company` Table
```sql
- id: Company ID
- name: Company name
- email, phone, website
- location, industry
- profileimage, coverimage: Media
- createdby: Owner user ID
```

## 🔌 API Endpoints

### Campaign Creation (3-Step Process)

#### Step 1: Basic Campaign Setup
```
POST /api/savefirstpageadmodel
Authentication: Required (Bearer Token)

Request Body:
{
  "companyName": "string",
  "campaignName": "string",
  "targetGender": "string", // "Male", "Female", "Both"
  "maritalStatus": "string", // "Single", "Married", "Both"
  "targetLowerAge": number,
  "targetUpperAge": number,
  "targetProfessions": "string", // CSV of profession IDs
  "targetArea": "string", // JSON or CSV of areas
  "adwatchPerDay": number,
  "adPerdayPay": number,
  "adSpendPerDay": number,
  "adCustomerTargetPerDay": number,
  "companyId": number,
  "adModelId": number, // 1-5 for different ad types
  "createdby": number,
  "adStartDate": "YYYY-MM-DD HH:mm:ss",
  "adEndDate": "YYYY-MM-DD HH:mm:ss",
  "adTime": "HH:mm:ss",
  "adEndTime": "HH:mm:ss",
  "modelTypeName": "string"
}

Response:
{
  "status": 200,
  "message": "First page saved successfully",
  "data": { "id": campaign_id }
}
```

#### Step 2: Media Upload
```
POST /api/savesecondpageadmodel
Authentication: Required (Bearer Token)
Content-Type: multipart/form-data

Request Body (FormData):
{
  "id": campaign_id,
  "adFile": File, // Video or image
  "mediaType": number, // 1=video, 2=image
  "ad_animation_id": number,
  "ad_button_text_id": number,
  "ad_headline": "string",
  "ad_font_size": number,
  "ad_image_alignment": "string"
}

Response:
{
  "status": 200,
  "message": "Second page saved successfully",
  "data": {}
}
```

#### Step 3: Final Configuration
```
POST /api/savethirdpageadmodel
Authentication: Required (Bearer Token)

Request Body:
{
  "id": campaign_id,
  "ad_description": "string",
  "ad_website_link": "string",
  "ad_website": "string",
  "ad_company_location": "string",
  "ad_place_app": "string",
  "ad_other_platform": "string",
  "ad_payment_mode": "string",
  "ad_order_value": number,
  "ad_charges_value": number,
  "ad_tax": number,
  "ad_total": number,
  "ad_coupon": "string"
}

Response:
{
  "status": 200,
  "message": "Campaign created successfully",
  "data": {}
}
```

### Campaign Management

#### Get User's Campaigns
```
GET /api/getalladds/:userId
Authentication: Required

Response:
{
  "status": 200,
  "message": "Fetch ad successfully",
  "data": [
    {
      "id": number,
      "campaign_name": "string",
      "company_name": "string",
      "ad_model_id": number,
      "adPauseCountinue": number, // 1=Active, 0=Paused
      "ad_view": number,
      "ad_like": number,
      "ad_start_date": "string",
      "ad_end_date": "string",
      "ad_total": number,
      "ad_upload_filename": "string",
      "imagePath": "string" // Full URL
    }
  ]
}
```

#### Pause/Resume Campaign
```
POST /api/saveadpausecountinuestatus
Authentication: Required

Request Body:
{
  "id": campaign_id,
  "userId": user_id,
  "status": "string" // "Running" or "Paused"
}

Response:
{
  "status": 200,
  "message": "Status updated successfully"
}
```

#### Get Campaign Details
```
GET /api/getaddetails/:adId/:userId
Authentication: Required

Response:
{
  "status": 200,
  "message": "Ad details fetched successfully",
  "data": [
    {
      // Full campaign details including all fields
      "imagePath": "string",
      "companyProfileFilePath": "string",
      "addUrl": "string"
    }
  ]
}
```

### Analytics & Reporting

#### Get Campaign Analytics
```
POST /api/getgraphdata
Authentication: Required

Request Body:
{
  "id": campaign_id,
  "userId": user_id,
  "isOverview": "1", // For overview data
  "campaignId": campaign_id
}

Response:
{
  "status": 200,
  "message": "Graph data fetched",
  "data": {
    "views": number,
    "likes": number,
    "clicks": number,
    "conversions": number,
    // Time-series data for charts
  }
}
```

#### Get Ad Passbook (Transaction History)
```
GET /api/getadpassbook/:userId
Authentication: Required

Response:
{
  "status": 200,
  "message": "Transactions fetched",
  "data": [
    {
      "transaction_id": string,
      "amount": number,
      "type": string,
      "date": string,
      "campaign_name": string
    }
  ]
}
```

### Supporting APIs

#### Get Ad Models (Ad Formats)
```
GET /api/getadmodels

Response:
{
  "status": 200,
  "message": "Fetch ad models successfully",
  "data": [
    {
      "id": number,
      "name": "string",
      "view_price": number,
      "base_price": number,
      "discount": number,
      "modelImage": "string",
      "imagePath": "string",
      "media_type": string
    }
  ]
}
```

#### Get Target Areas
```
GET /api/gettargetareas
Authentication: Required

Response:
{
  "status": 200,
  "data": [
    {
      "id": number,
      "name": "string",
      "state": "string"
    }
  ]
}
```

#### Get Target Professions
```
GET /api/gettargetprofessions
Authentication: Required

Response:
{
  "status": 200,
  "data": [
    {
      "id": number,
      "name": "string"
    }
  ]
}
```

#### Get Button Types
```
GET /api/getbuttons
Authentication: Required

Response:
{
  "status": 200,
  "data": [
    {
      "id": number,
      "name": "string" // "Shop Now", "Learn More", etc.
    }
  ]
}
```

#### Validate Coupon
```
POST /api/validatecoupon
Authentication: Required

Request Body:
{
  "couponCode": "string",
  "userId": number
}

Response:
{
  "status": 200,
  "message": "Coupon valid",
  "data": {
    "discount": number,
    "discountType": "string" // "percentage" or "fixed"
  }
}
```

## 🎨 Frontend Integration

### User Flows

#### 1. Create New Campaign
```
Path: /seller/dashboard → /seller/ad-model → /seller/configure-campaign

Components:
1. SellerDashboard: Entry point with "Create Campaign" button
2. AdModel: Select ad format (Skip, Non-Skip, Bumper, etc.)
3. ConfigureCampaign: Multi-step form
   - Step 1: Basic info & targeting
   - Step 2: Media upload
   - Step 3: Payment & finalization
```

#### 2. View Campaigns
```
Path: /seller/ad-orders

Components:
- AdOrders: List all campaigns with filters
  - Active campaigns
  - Paused campaigns
  - Completed campaigns
  - Performance metrics
```

#### 3. Campaign Analytics
```
Path: /seller/ad-analytics/:campaignId

Components:
- AdAnalytics: Detailed performance dashboard
  - Views, clicks, conversions
  - Time-series charts
  - Demographic breakdown
  - ROI calculator
```

#### 4. Campaign Details
```
Path: /seller/ad-order/:orderId

Components:
- AdOrderDetail: Full campaign view
  - Campaign overview
  - Edit campaign
  - Pause/Resume
  - Performance stats
```

### State Management

#### localStorage Keys
```javascript
- 'UserLoggedIn': JWT token
- 'UserData': User object with id, name, email
- 'selectedCompany': Current company context
- 'tempCampaignData': Draft campaign data
```

### API Integration Pattern

```typescript
// Example: Create Campaign
import { 
  apiSaveFirstPageAdModel, 
  apiSaveSecondPageAdModel, 
  apiSaveThirdPageAdModel 
} from '@/api';

const createCampaign = async (campaignData, mediaFile) => {
  try {
    // Step 1: Basic setup
    const step1Response = await apiSaveFirstPageAdModel({
      companyName: campaignData.companyName,
      campaignName: campaignData.campaignName,
      // ... other fields
    });
    
    const campaignId = step1Response.data.data.id;
    
    // Step 2: Upload media
    await apiSaveSecondPageAdModel({
      id: campaignId,
      // ... fields
    }, mediaFile);
    
    // Step 3: Finalize
    await apiSaveThirdPageAdModel({
      id: campaignId,
      // ... fields
    });
    
    toast.success('Campaign created successfully!');
    navigate('/seller/ad-orders');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create campaign');
  }
};
```

## 🔐 Authentication & Authorization

All API calls require:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('UserLoggedIn')}`,
  'Content-Type': 'application/json' // or 'multipart/form-data' for file uploads
}
```

## 🧪 Testing Checklist

### Backend Testing
- [x] Campaign creation (3 steps)
- [x] Campaign listing
- [x] Campaign update
- [x] Pause/Resume functionality
- [x] Analytics data
- [x] File upload handling

### Frontend Testing
- [ ] Complete campaign creation flow
- [ ] Campaign list displays correctly
- [ ] Pause/Resume buttons work
- [ ] Analytics charts render
- [ ] File upload validation
- [ ] Error handling & user feedback
- [ ] Mobile responsiveness

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] File storage configured (for ad media)
- [ ] CORS settings verified
- [ ] API rate limiting configured
- [ ] Error logging setup
- [ ] Performance monitoring

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=adtip_qa
JWT_SECRET=your_jwt_secret
UPLOAD_PATH=./uploads
```

**Frontend (.env)**
```
VITE_API_BASE_URL=https://your-api-domain.com
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_API_TOKEN=your_api_token
```

## 📝 Known Issues & Solutions

### Issue 1: File Upload Size Limit
**Solution**: Configure multer in backend
```javascript
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});
```

### Issue 2: CORS Errors
**Solution**: Add proper CORS headers in backend
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

## 📞 Support & Maintenance

For issues or questions:
1. Check backend logs: `logs/error.log`
2. Check frontend console errors
3. Verify API responses in Network tab
4. Test with Postman/curl

## 🎯 Next Steps

1. **Complete UI Testing**: Test all user flows end-to-end
2. **Performance Optimization**: Implement caching for static data
3. **Analytics Enhancement**: Add more detailed reporting
4. **Mobile App Integration**: Ensure API compatibility with React Native app
5. **Payment Integration**: Complete Razorpay integration for ad billing

---

Last Updated: October 9, 2025
Version: 1.0.0
