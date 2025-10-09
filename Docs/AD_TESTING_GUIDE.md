# 🧪 Advertisement System Testing Guide

## Quick Verification Checklist

### Pre-Testing Setup
- [ ] Backend server running (`adtipback`)
- [ ] Frontend server running (`adtip-web-reactjs`)
- [ ] Database connection verified
- [ ] User logged in with valid token
- [ ] Company profile created

---

## 1. Backend API Testing

### Test Campaign Creation (3 Steps)

#### Step 1: Basic Setup
```bash
curl -X POST http://localhost:3000/api/savefirstpageadmodel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "campaignName": "Test Campaign",
    "targetGender": "Both",
    "maritalStatus": "Both",
    "targetLowerAge": 18,
    "targetUpperAge": 65,
    "targetProfessions": "1,2,3",
    "targetArea": "Delhi,Mumbai",
    "adwatchPerDay": 100,
    "adPerdayPay": 500,
    "adSpendPerDay": 500,
    "adCustomerTargetPerDay": 100,
    "companyId": 1,
    "adModelId": 1,
    "createdby": 1,
    "adStartDate": "2025-10-10 00:00:00",
    "adEndDate": "2025-11-10 00:00:00",
    "adTime": "00:00:00",
    "adEndTime": "23:59:59",
    "modelTypeName": "Skip Video Ad"
  }'
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "First page saved successfully",
  "data": { "id": 1234 }
}
```

#### Step 2: Media Upload
```bash
curl -X POST http://localhost:3000/api/savesecondpageadmodel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id=1234" \
  -F "adFile=@/path/to/video.mp4" \
  -F "mediaType=1" \
  -F "ad_animation_id=1" \
  -F "ad_button_text_id=1" \
  -F "ad_headline=Amazing Product" \
  -F "ad_font_size=16"
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "Second page saved successfully"
}
```

#### Step 3: Finalization
```bash
curl -X POST http://localhost:3000/api/savethirdpageadmodel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1234,
    "ad_description": "Amazing product description",
    "ad_website_link": "https://example.com",
    "ad_website": "example.com",
    "ad_company_location": "Mumbai",
    "ad_order_value": 10000,
    "ad_charges_value": 1000,
    "ad_tax": 180,
    "ad_total": 11180
  }'
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "Campaign created successfully"
}
```

### Test Campaign Retrieval
```bash
# Get all user campaigns
curl -X GET http://localhost:3000/api/getalladds/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific campaign details
curl -X GET http://localhost:3000/api/getaddetails/CAMPAIGN_ID/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Campaign Management
```bash
# Pause campaign
curl -X POST http://localhost:3000/api/saveadpausecountinuestatus \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1234,
    "userId": 1,
    "status": "Paused"
  }'

# Resume campaign
curl -X POST http://localhost:3000/api/saveadpausecountinuestatus \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1234,
    "userId": 1,
    "status": "Running"
  }'
```

### Test Analytics
```bash
# Get campaign analytics
curl -X POST http://localhost:3000/api/getgraphdata \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1234,
    "userId": 1,
    "isOverview": "1",
    "campaignId": 1234
  }'

# Get transaction history
curl -X GET http://localhost:3000/api/getadpassbook/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Frontend UI Testing

### Navigation Flow Test
1. **Login**
   - Go to `/login`
   - Enter phone: `9999999999`
   - Verify OTP sent
   - Enter OTP
   - ✅ Should redirect to home

2. **Access Seller Dashboard**
   - Navigate to `/seller/dashboard`
   - ✅ Should show dashboard with options
   - Click "Become an Advertiser" or "Create Campaign"
   - ✅ Should navigate to `/seller/ad-model`

3. **Select Ad Model**
   - View available ad models
   - ✅ Should show 5 models with pricing
   - Click on any model
   - ✅ Should navigate to `/seller/configure-campaign`

4. **Configure Campaign (Step 1)**
   - Fill in campaign name
   - Select company (or create new)
   - Choose targeting options:
     - Gender
     - Age range
     - Profession
     - Location
   - Set budget and duration
   - ✅ Form validation should work
   - Click "Next"
   - ✅ Should proceed to Step 2

5. **Upload Media (Step 2)**
   - Upload video/image
   - ✅ File validation (size, type)
   - Preview uploaded media
   - Set headline, button text
   - Click "Next"
   - ✅ Should proceed to Step 3

6. **Finalize Campaign (Step 3)**
   - Review campaign details
   - Enter description
   - Add website link
   - Review pricing
   - Apply coupon (if any)
   - Click "Create Campaign"
   - ✅ Should create campaign and redirect to `/seller/ad-orders`

7. **View Campaigns**
   - Navigate to `/seller/ad-orders`
   - ✅ Should show list of campaigns
   - ✅ Should show metrics (views, clicks, budget)
   - ✅ Should show status (Active/Paused)

8. **View Campaign Details**
   - Click on any campaign
   - ✅ Should navigate to `/seller/ad-order/:id`
   - ✅ Should show detailed metrics
   - ✅ Should have Edit, Pause/Resume buttons

9. **View Analytics**
   - Click "View Analytics" on a campaign
   - ✅ Should navigate to `/seller/ad-analytics/:id`
   - ✅ Should show charts and graphs
   - ✅ Should show demographic breakdown

10. **Pause/Resume Campaign**
    - On campaign detail page
    - Click "Pause Campaign"
    - ✅ Status should change to "Paused"
    - Click "Resume Campaign"
    - ✅ Status should change to "Active"

---

## 3. Integration Testing

### End-to-End Campaign Creation
```javascript
// Test script (run in browser console on frontend)
const testCampaignCreation = async () => {
  const userData = JSON.parse(localStorage.getItem('UserData'));
  const token = localStorage.getItem('UserLoggedIn');
  
  console.log('Step 1: Creating campaign...');
  const step1 = await fetch('http://localhost:3000/api/savefirstpageadmodel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyName: 'Test Company',
      campaignName: `Test Campaign ${Date.now()}`,
      targetGender: 'Both',
      maritalStatus: 'Both',
      targetLowerAge: 18,
      targetUpperAge: 65,
      targetProfessions: '1,2,3',
      targetArea: 'Delhi,Mumbai',
      adwatchPerDay: 100,
      adPerdayPay: 500,
      adSpendPerDay: 500,
      adCustomerTargetPerDay: 100,
      companyId: userData.companyId || 1,
      adModelId: 1,
      createdby: userData.id,
      adStartDate: '2025-10-10 00:00:00',
      adEndDate: '2025-11-10 00:00:00',
      adTime: '00:00:00',
      adEndTime: '23:59:59',
      modelTypeName: 'Skip Video Ad'
    })
  });
  
  const step1Data = await step1.json();
  console.log('Step 1 Result:', step1Data);
  
  if (step1Data.status === 200) {
    const campaignId = step1Data.data.id;
    console.log(`✅ Campaign created with ID: ${campaignId}`);
    
    // Test retrieval
    const getCampaign = await fetch(`http://localhost:3000/api/getalladds/${userData.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const campaigns = await getCampaign.json();
    console.log('✅ Campaigns retrieved:', campaigns.data.length);
    
    return campaignId;
  } else {
    console.error('❌ Campaign creation failed:', step1Data);
  }
};

// Run the test
testCampaignCreation();
```

---

## 4. Error Scenarios Testing

### Test Invalid Data
```javascript
// Missing required fields
fetch('http://localhost:3000/api/savefirstpageadmodel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => {
  console.log('Should return error:', data);
  // Expected: { status: 400, message: 'Invalid request' }
});
```

### Test Unauthorized Access
```javascript
// No token
fetch('http://localhost:3000/api/getalladds/1', {
  headers: {}
})
.then(r => r.json())
.then(data => {
  console.log('Should return 401:', data);
  // Expected: { status: 401, message: 'Unauthorized' }
});
```

### Test Invalid Campaign ID
```javascript
// Non-existent campaign
fetch('http://localhost:3000/api/getaddetails/99999/1', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('Should return 404 or empty:', data);
});
```

---

## 5. Performance Testing

### Load Test Campaign Listing
```javascript
// Fetch campaigns multiple times
const loadTest = async () => {
  const userData = JSON.parse(localStorage.getItem('UserData'));
  const token = localStorage.getItem('UserLoggedIn');
  
  const startTime = performance.now();
  
  const promises = Array(10).fill(null).map(() => 
    fetch(`http://localhost:3000/api/getalladds/${userData.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  );
  
  await Promise.all(promises);
  
  const endTime = performance.now();
  console.log(`10 concurrent requests completed in ${endTime - startTime}ms`);
};

loadTest();
```

---

## 6. Database Verification

### Check Campaign Data
```sql
-- Verify campaign was created
SELECT * FROM admodels 
WHERE createdby = YOUR_USER_ID 
ORDER BY createddate DESC 
LIMIT 5;

-- Check campaign status
SELECT 
  id, 
  campaign_name, 
  adPauseCountinue as status,
  ad_view as views,
  ad_like as clicks,
  ad_total as budget
FROM admodels 
WHERE createdby = YOUR_USER_ID;

-- Verify company linkage
SELECT 
  a.id as campaign_id,
  a.campaign_name,
  c.id as company_id,
  c.name as company_name
FROM admodels a
LEFT JOIN company c ON a.company_id = c.id
WHERE a.createdby = YOUR_USER_ID;
```

---

## 7. Mobile Responsiveness Testing

### Test on Different Devices
- [ ] iPhone 12/13/14 (375px width)
- [ ] iPad (768px width)
- [ ] Desktop (1920px width)

### Key Pages to Test:
1. Ad Dashboard
2. Ad Model Selection
3. Configure Campaign form
4. Ad Orders list
5. Campaign details
6. Analytics charts

### Responsive Checks:
- [ ] Navigation menu works
- [ ] Forms are usable
- [ ] Charts display correctly
- [ ] Buttons are clickable
- [ ] Text is readable
- [ ] Images scale properly

---

## 8. Browser Compatibility Testing

### Test in Multiple Browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Key Functionality:
- [ ] File upload works
- [ ] Charts render correctly
- [ ] Forms submit properly
- [ ] Navigation functions
- [ ] Modals/dialogs work

---

## 9. Accessibility Testing

### Screen Reader Test:
- [ ] All buttons have labels
- [ ] Forms have proper labels
- [ ] Images have alt text
- [ ] Navigation is logical

### Keyboard Navigation:
- [ ] Tab through forms
- [ ] Submit with Enter
- [ ] Esc closes modals
- [ ] Focus indicators visible

---

## 10. Security Testing

### Authentication Tests:
- [ ] Cannot access pages without login
- [ ] Token expiration handled
- [ ] Refresh token works
- [ ] Logout clears session

### Data Validation:
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] File upload validation
- [ ] Input sanitization

---

## Test Results Template

```
✅ = Passed
❌ = Failed
⚠️ = Needs Attention

[ ] Backend API Tests
  [ ] Campaign creation (3 steps)
  [ ] Campaign retrieval
  [ ] Campaign management
  [ ] Analytics APIs
  
[ ] Frontend UI Tests
  [ ] Navigation flow
  [ ] Form validation
  [ ] Data display
  [ ] User interactions
  
[ ] Integration Tests
  [ ] End-to-end campaign creation
  [ ] Data persistence
  [ ] Error handling
  
[ ] Performance Tests
  [ ] Load testing
  [ ] Response times
  
[ ] Compatibility Tests
  [ ] Mobile responsiveness
  [ ] Browser compatibility
  [ ] Accessibility

Notes:
_____________________
```

---

## Quick Debug Commands

### Check if backend is running:
```bash
curl http://localhost:3000/api/ping
```

### Check if user is authenticated:
```javascript
// In browser console
console.log('Token:', localStorage.getItem('UserLoggedIn'));
console.log('User:', JSON.parse(localStorage.getItem('UserData')));
```

### Clear localStorage (if needed):
```javascript
localStorage.clear();
location.reload();
```

### Check API response in Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Perform action
5. Click on request to see details

---

**Happy Testing! 🚀**

*Remember: Test both happy paths and error scenarios!*
