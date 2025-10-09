# 🚀 Quick Start Guide - Advertisement System

## For Developers: Get Started in 5 Minutes

### Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend server running on `http://localhost:5173`
- User logged in with valid JWT token

---

## 🎯 Quick Navigation

### Main Routes
```
Dashboard:    /seller/ad-dashboard
Create Ad:    /seller/ad-model
Manage Ads:   /seller/ad-orders
Analytics:    /seller/ad-analytics/:id
```

### Quick Access from Code
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Create campaign
navigate('/seller/ad-model');

// View all campaigns
navigate('/seller/ad-orders');

// View specific campaign
navigate(`/seller/ad-order/${campaignId}`);

// View analytics
navigate(`/seller/ad-analytics/${campaignId}`);
```

---

## 🔥 Quick Test: Create Your First Campaign

### Step 1: Open Browser Console
```javascript
// Get user data
const userData = JSON.parse(localStorage.getItem('UserData'));
const token = localStorage.getItem('UserLoggedIn');

console.log('User ID:', userData.id);
console.log('Token:', token ? 'Present' : 'Missing');
```

### Step 2: Create Campaign (API Test)
```javascript
// Create campaign via API
const createTestCampaign = async () => {
  const userData = JSON.parse(localStorage.getItem('UserData'));
  const token = localStorage.getItem('UserLoggedIn');
  
  const response = await fetch('http://localhost:3000/api/savefirstpageadmodel', {
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
  
  const result = await response.json();
  console.log('Campaign Created:', result);
  
  if (result.status === 200) {
    console.log('✅ Success! Campaign ID:', result.data.id);
    return result.data.id;
  }
};

// Run it
createTestCampaign();
```

### Step 3: Verify Campaign Created
```javascript
// List all campaigns
const listCampaigns = async () => {
  const userData = JSON.parse(localStorage.getItem('UserData'));
  const token = localStorage.getItem('UserLoggedIn');
  
  const response = await fetch(`http://localhost:3000/api/getalladds/${userData.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  console.log('My Campaigns:', result.data);
  console.log('Total Campaigns:', result.data.length);
};

listCampaigns();
```

---

## 📦 Import Statements Reference

### Common Imports for Ad Pages:
```typescript
// React & Router
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// API Functions
import { 
  apiSaveFirstPageAdModel,
  apiSaveSecondPageAdModel,
  apiSaveThirdPageAdModel,
  apiGetUserAds,
  apiGetAdDetails,
  apiSaveAdPauseContinueStatus,
  apiGetGraphData
} from '@/api';

// UI Components
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Icons
import { Plus, Eye, BarChart3, Pause, Play } from 'lucide-react';
```

---

## 🎨 Common Code Patterns

### 1. Fetch User Campaigns
```typescript
const [campaigns, setCampaigns] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchCampaigns = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const response = await apiGetUserAds(userData.id.toString());
      
      if (response.data?.status === 200) {
        setCampaigns(response.data.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchCampaigns();
}, []);
```

### 2. Create Campaign
```typescript
const handleCreateCampaign = async (formData: any) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    
    // Step 1: Basic setup
    const step1Response = await apiSaveFirstPageAdModel({
      ...formData,
      createdby: userData.id,
      companyId: userData.companyId
    });
    
    const campaignId = step1Response.data.data.id;
    
    toast({
      title: "Success",
      description: "Campaign created successfully!",
    });
    
    navigate('/seller/ad-orders');
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to create campaign",
      variant: "destructive",
    });
  }
};
```

### 3. Toggle Campaign Status
```typescript
const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    const newStatus = currentStatus === 'Running' ? 'Paused' : 'Running';
    
    await apiSaveAdPauseContinueStatus({
      id: campaignId,
      userId: userData.id,
      status: newStatus
    });
    
    toast({
      title: "Success",
      description: `Campaign ${newStatus.toLowerCase()} successfully.`,
    });
    
    // Refresh campaigns
    fetchCampaigns();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to update campaign status",
      variant: "destructive",
    });
  }
};
```

### 4. Display Campaign Card
```tsx
const CampaignCard = ({ campaign }: { campaign: any }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {campaign.campaign_name}
      </h3>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          campaign.adPauseCountinue === 1
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {campaign.adPauseCountinue === 1 ? 'Active' : 'Paused'}
      </span>
    </div>
    
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div>
        <p className="text-sm text-gray-600">Views</p>
        <p className="text-xl font-bold text-gray-900">
          {campaign.ad_view?.toLocaleString() || 0}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Clicks</p>
        <p className="text-xl font-bold text-gray-900">
          {campaign.ad_like?.toLocaleString() || 0}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Budget</p>
        <p className="text-xl font-bold text-gray-900">
          ₹{campaign.ad_total?.toLocaleString() || 0}
        </p>
      </div>
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={() => navigate(`/seller/ad-order/${campaign.id}`)}
        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        View Details
      </button>
      <button
        onClick={() => handleToggleStatus(campaign.id, campaign.adPauseCountinue === 1 ? 'Running' : 'Paused')}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        {campaign.adPauseCountinue === 1 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
    </div>
  </div>
);
```

---

## 🔍 Debugging Tips

### Check Authentication
```javascript
// In browser console
const token = localStorage.getItem('UserLoggedIn');
const userData = localStorage.getItem('UserData');

console.log('Token:', token ? 'Present' : 'Missing');
console.log('User Data:', JSON.parse(userData || '{}'));

// Test API call
fetch('http://localhost:3000/api/getalladds/1', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('API Response:', data));
```

### Monitor API Calls
```javascript
// Add to api.ts for debugging
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.data);
    return Promise.reject(error);
  }
);
```

### Clear Cache & Reload
```javascript
// Clear all cached data
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 🎯 Common Tasks

### Task 1: Add New Ad Format
```typescript
// 1. Add to database: admodels_master table
// 2. Update AdModel.tsx with new format
const newModel = {
  id: 6,
  title: 'New Format',
  price: '₹0.75',
  description: 'Description here',
  image: '/path/to/image',
  recommended: false
};

// 3. Update backend if needed (AdService.js)
```

### Task 2: Add New Targeting Option
```typescript
// 1. Add to api.ts
export const apiGetNewTargetOption = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getnewoption`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// 2. Add to ConfigureCampaign.tsx
const [newOptions, setNewOptions] = useState([]);

useEffect(() => {
  apiGetNewTargetOption()
    .then(res => setNewOptions(res.data.data))
    .catch(err => console.error(err));
}, []);
```

### Task 3: Add New Analytics Metric
```typescript
// 1. Update apiGetGraphData to include new metric
// 2. Update AdAnalytics.tsx to display it
const [metrics, setMetrics] = useState({
  views: 0,
  clicks: 0,
  conversions: 0,
  newMetric: 0  // Add here
});

// 3. Add chart/display component
<div className="bg-white rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-2">New Metric</h3>
  <p className="text-3xl font-bold text-purple-600">
    {metrics.newMetric}
  </p>
</div>
```

---

## 📞 Quick Reference

### API Base URL
```typescript
const BASE_URL = 'http://localhost:3000';  // Development
// const BASE_URL = 'https://api.adtip.in';  // Production
```

### Key LocalStorage Keys
```typescript
'UserLoggedIn'      // JWT token
'UserData'          // User object
'selectedCompany'   // Current company
```

### Status Codes
```typescript
200 // Success
400 // Bad Request
401 // Unauthorized
404 // Not Found
500 // Server Error
```

---

## 🎓 Learning Resources

### Documentation
1. [Complete Integration Guide](./AD_INTEGRATION_COMPLETE_GUIDE.md)
2. [API Reference](./AD_INTEGRATION_COMPLETE_GUIDE.md#api-endpoints)
3. [Testing Guide](./AD_TESTING_GUIDE.md)
4. [Implementation Checklist](./AD_IMPLEMENTATION_CHECKLIST.md)

### Key Files
- **Backend**: `adtipback/controllers/AdController.js`
- **Services**: `adtipback/services/AdService.js`
- **Frontend API**: `adtip-web-reactjs/src/api.ts`
- **Routes**: `adtip-web-reactjs/src/routes.tsx`

---

## 🚨 Common Issues & Solutions

### Issue: "Unauthorized" Error
```typescript
// Solution: Check token validity
const token = localStorage.getItem('UserLoggedIn');
if (!token) {
  navigate('/login');
}
```

### Issue: Campaigns Not Loading
```typescript
// Solution: Check user ID and API response
const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
console.log('User ID:', userData.id);

// Check API response
apiGetUserAds(userData.id.toString())
  .then(res => console.log('Response:', res.data))
  .catch(err => console.error('Error:', err));
```

### Issue: File Upload Fails
```typescript
// Solution: Check file size and type
const validateFile = (file: File) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'image/jpeg', 'image/png'];
  
  if (file.size > maxSize) {
    toast({ title: "Error", description: "File too large" });
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    toast({ title: "Error", description: "Invalid file type" });
    return false;
  }
  
  return true;
};
```

---

**🎉 You're ready to work with the advertisement system!**

For detailed information, refer to the comprehensive documentation files.

---

*Quick Start Guide v1.0.0*
*Last Updated: October 9, 2025*
