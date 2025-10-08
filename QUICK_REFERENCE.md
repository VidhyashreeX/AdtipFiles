# Advertisement API Quick Reference Guide

## 🚀 Quick Start

This guide provides quick code snippets for integrating advertisement APIs into your React components.

---

## 📦 Import Statement

```typescript
import {
  // Ad Models & Config
  apiGetAdModels,
  apiGetTargetAreas,
  apiGetTargetProfessions,
  apiGetButtons,
  apiGetAnimations,
  apiGetCompanyButtonList,
  
  // Campaign Creation
  apiSaveFirstPageAdModel,
  apiSaveSecondPageAdModel,
  apiSaveThirdPageAdModel,
  apiSaveCelebrationAd,
  apiSaveBusinessAd,
  
  // Ad Retrieval
  apiGetUserAds,
  apiGetFilteredAds,
  apiGetMasterFilteredAds,
  apiGetMasterAdsPagination,
  apiGetCelebrationAds,
  apiGetBusinessAds,
  apiGetAdHubAds,
  apiGetDemoRequestAds,
  
  // Ad Details
  apiGetAdDetails,
  apiGetAdDetailsForQr,
  apiGetAdDetailsForVideo,
  apiGetRecentAdsByCompany,
  apiGetOrderTracking,
  apiGetAdForShortVideo,
  
  // Analytics
  apiGetAdViewsAndLikes,
  apiSaveAdViewsAndLikes,
  apiSaveAdLikeAmount,
  apiSaveAdViewAmount,
  apiAddAmountToWallet,
  apiGetAdView,
  apiGetGraphData,
  apiGetMyLikedAds,
  apiGetUserLikedAds,
  apiGetLikeAdsByCompany,
  apiGetLossViewAmount,
  
  // Ad Management
  apiSaveAdPauseContinueStatus,
  apiBlockAd,
  apiGetBlockedAdsByCompany,
  apiGetBlockedCompaniesByUser,
  
  // Company & Follow
  apiFollowCompany,
  apiGetFollowedCompanies,
  
  // Coupons & Demo
  apiValidateCoupon,
  apiGetCoupons,
  apiRequestDemo,
  apiSaveCelebrationAdView
} from '@/api';

import { toast } from '@/hooks/use-toast';
```

---

## 🎯 Common Use Cases

### 1. Fetch User's Ad Campaigns

```typescript
const [ads, setAds] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchAds = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const response = await apiGetUserAds(userData.id.toString());
      
      if (response.data?.status === 200) {
        setAds(response.data.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  fetchAds();
}, []);
```

### 2. Pause/Resume Campaign

```typescript
const handleToggleCampaign = async (adId: string, currentStatus: string) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    const newStatus = currentStatus === 'Running' ? 'Paused' : 'Running';
    
    await apiSaveAdPauseContinueStatus({
      id: adId,
      userId: userData.id,
      status: newStatus
    });
    
    toast({
      title: "Success",
      description: `Campaign ${newStatus.toLowerCase()} successfully`
    });
    
    // Refresh data
    fetchAds();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to update campaign",
      variant: "destructive"
    });
  }
};
```

### 3. Validate Coupon Code

```typescript
const [couponCode, setCouponCode] = useState('');
const [discount, setDiscount] = useState(0);

const handleApplyCoupon = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    const response = await apiValidateCoupon({
      couponCode,
      userId: userData.id,
      amount: totalAmount
    });
    
    if (response.data?.status === 200) {
      const discountAmount = response.data.data?.discount || 0;
      setDiscount(discountAmount);
      
      toast({
        title: "Coupon Applied",
        description: `You saved ₹${discountAmount}!`
      });
    }
  } catch (error) {
    toast({
      title: "Invalid Coupon",
      description: "This coupon code is not valid",
      variant: "destructive"
    });
  }
};
```

### 4. Get Campaign Analytics

```typescript
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      
      const [graphData, viewsLikes, lossAmount] = await Promise.all([
        apiGetGraphData({
          adId: campaignId,
          userId: userData.id,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }),
        apiGetAdViewsAndLikes(userData.id.toString(), campaignId),
        apiGetLossViewAmount(campaignId)
      ]);
      
      setAnalytics({
        graph: graphData.data?.data,
        viewsLikes: viewsLikes.data?.data,
        lossAmount: lossAmount.data?.data
      });
    } catch (error) {
      console.error('Analytics fetch failed:', error);
    }
  };
  
  fetchAnalytics();
}, [campaignId]);
```

### 5. Create New Ad Campaign (Step 1)

```typescript
const handleSaveBasicInfo = async (formData) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    const companyData = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
    
    const campaignData = {
      campaignName: formData.campaignName,
      companyName: companyData.name,
      companyId: companyData.id,
      adModelId: selectedModel.id,
      targetGender: formData.targetGender,
      maritalStatus: formData.maritalStatus,
      targetLowerAge: parseInt(formData.targetAge.split('-')[0]),
      targetUpperAge: parseInt(formData.targetAge.split('-')[1]),
      targetProfessions: formData.targetProfession,
      targetArea: formData.targetAreas.join(','),
      adwatchPerDay: parseInt(formData.watchesPerDay),
      adPerdayPay: parseFloat(formData.amountPerCustomer),
      adSpendPerDay: parseFloat(formData.amountPerDay),
      adStartDate: formData.startDate,
      adEndDate: formData.endDate,
      adCustomerTargetPerDay: parseInt(formData.customersPerDay),
      modelTypeName: selectedModel.title,
      createdby: userData.id
    };
    
    const response = await apiSaveFirstPageAdModel(campaignData);
    
    if (response.data?.status === 200) {
      const adId = response.data.data[0].id;
      
      toast({
        title: "Success",
        description: "Campaign details saved!"
      });
      
      // Navigate to next step
      navigate('/seller/upload-creative', { state: { adId } });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to save campaign",
      variant: "destructive"
    });
  }
};
```

### 6. Upload Ad Creative (Step 2)

```typescript
const handleUploadCreative = async (adId, mediaFile) => {
  try {
    const response = await apiSaveSecondPageAdModel(
      {
        id: adId,
        adUploadFilename: mediaFile.name,
        // ... other fields
      },
      mediaFile
    );
    
    if (response.data?.status === 200) {
      toast({
        title: "Success",
        description: "Creative uploaded successfully!"
      });
      
      // Navigate to next step
      navigate('/seller/preview-ad', { state: { adId } });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to upload creative",
      variant: "destructive"
    });
  }
};
```

### 7. Get Ad Details

```typescript
const [adDetails, setAdDetails] = useState(null);

useEffect(() => {
  const fetchAdDetails = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const response = await apiGetAdDetails(adId, userData.id.toString());
      
      if (response.data?.status === 200) {
        setAdDetails(response.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch ad details:', error);
    }
  };
  
  fetchAdDetails();
}, [adId]);
```

### 8. Follow/Unfollow Company

```typescript
const handleFollowCompany = async (companyId) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    
    await apiFollowCompany({
      companyId,
      userId: userData.id
    });
    
    toast({
      title: "Success",
      description: "Company followed successfully!"
    });
    
    // Refresh followed companies list
    fetchFollowedCompanies();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to follow company",
      variant: "destructive"
    });
  }
};
```

### 9. Get Available Coupons

```typescript
const [coupons, setCoupons] = useState([]);

useEffect(() => {
  const fetchCoupons = async () => {
    try {
      const response = await apiGetCoupons();
      
      if (response.data?.status === 200) {
        setCoupons(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    }
  };
  
  fetchCoupons();
}, []);
```

### 10. Request Demo

```typescript
const handleRequestDemo = async (adModelId) => {
  try {
    const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    
    const response = await apiRequestDemo({
      userId: userData.id,
      adModelId,
      message: 'Interested in this ad format',
      contactNumber: userData.mobile_number,
      email: userData.email
    });
    
    if (response.data?.status === 200) {
      toast({
        title: "Demo Requested",
        description: "Our team will contact you soon!"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to request demo",
      variant: "destructive"
    });
  }
};
```

---

## 🎨 UI Components Examples

### Loading Spinner Component

```typescript
import { Loader2 } from 'lucide-react';

{loading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-[#00dcaa]" />
    <span className="ml-3 text-gray-600">Loading campaigns...</span>
  </div>
)}
```

### Empty State Component

```typescript
{!loading && ads.length === 0 && (
  <div className="text-center py-12">
    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      No campaigns found
    </h3>
    <p className="text-gray-600 mb-6">
      Create your first advertising campaign to get started
    </p>
    <button
      onClick={() => navigate('/seller/ad-models')}
      className="bg-[#00dcaa] text-white px-6 py-3 rounded-lg"
    >
      Create Campaign
    </button>
  </div>
)}
```

### Status Badge Component

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Running': return 'bg-green-100 text-green-800';
    case 'Paused': return 'bg-yellow-100 text-yellow-800';
    case 'Completed': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

<span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
  {status}
</span>
```

---

## ⚠️ Error Handling

### Standard Error Handler

```typescript
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  
  const errorMessage = 
    error.response?.data?.message || 
    error.response?.data?.error ||
    error.message ||
    defaultMessage;
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive"
  });
};

// Usage:
try {
  const response = await apiGetUserAds(userId);
} catch (error) {
  handleApiError(error, "Failed to fetch campaigns");
}
```

---

## 🔐 Authentication Check

```typescript
const checkAuth = () => {
  const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
  const token = localStorage.getItem('UserLoggedIn');
  
  if (!userData.id || !token) {
    toast({
      title: "Authentication Required",
      description: "Please log in to continue",
      variant: "destructive"
    });
    navigate('/login');
    return null;
  }
  
  return userData;
};

// Usage:
const userData = checkAuth();
if (!userData) return;
```

---

## 📊 Data Formatting Helpers

```typescript
// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
```

---

## 🎯 Best Practices

1. **Always handle loading states**
```typescript
const [loading, setLoading] = useState(true);
// Show loading spinner while fetching
```

2. **Implement error handling**
```typescript
try {
  // API call
} catch (error) {
  // Show error toast
}
```

3. **Check authentication**
```typescript
const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
if (!userData.id) navigate('/login');
```

4. **Use TypeScript types**
```typescript
interface Campaign {
  id: string;
  name: string;
  status: 'Running' | 'Paused' | 'Completed';
  // ... other fields
}
```

5. **Cleanup on unmount**
```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const data = await apiGetUserAds(userId);
    if (isMounted) setAds(data);
  };
  
  fetchData();
  
  return () => { isMounted = false; };
}, []);
```

---

## 📞 Support

For issues or questions:
- Check the main documentation: `ADVERTISEMENT_API_INTEGRATION_PLAN.md`
- Implementation status: `IMPLEMENTATION_STATUS.md`
- Backend API routes: `adtipback/routes/api-routes.js`
- API controller: `adtipback/controllers/AdController.js`

---

**Last Updated:** January 2025  
**Version:** 1.0
