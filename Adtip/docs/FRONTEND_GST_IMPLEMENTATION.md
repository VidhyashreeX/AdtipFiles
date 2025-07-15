# Frontend GST Implementation Guide

## Overview

This guide explains how the frontend has been updated to support 18% GST on subscription plans while maintaining a clean user experience. The implementation fetches both regular plans (for UI display) and GST-enabled plans (for payment processing).

## Key Changes Made

### 1. **ApiService Updates**

Added new GST-enabled API methods:

```typescript
// User Premium Subscription
static async getSubscriptionPlansWithGST(): Promise<any> {
  return this.get('/api/subscription-plans-with-gst');
}

// Content Creator Premium Subscription
static async getContentSubscriptionPlansWithGST(): Promise<any> {
  return this.get('/api/content-premium-plans-with-gst');
}

// Test Plans with GST
static async getSubscriptionPlansTestWithGST(): Promise<any> {
  return this.get('/api/subscription-plans-test-with-gst');
}
```

### 2. **SubscriptionScreen Updates**

#### Data Fetching
- Now fetches both regular plans and GST plans simultaneously
- Uses `Promise.all()` for efficient parallel requests
- Stores both datasets for UI and payment processing

```typescript
const [regularResponse, gstResponse] = await Promise.all([
  ApiService.getSubscriptionPlans(),
  ApiService.getSubscriptionPlansWithGST()
]);
```

#### UI Display
- Shows original base prices for plan selection
- Displays GST breakdown in plan cards
- Shows detailed price breakdown in selected plan summary

#### Payment Processing
- Uses GST-inclusive amounts for Razorpay checkout
- Logs amount details for debugging
- Maintains transparency with users

### 3. **ContentCreatorSubscriptionScreen Updates**

Similar updates as SubscriptionScreen but for content creator plans:

- Fetches both regular and GST plans
- Shows price breakdown
- Uses GST amounts for payment processing

## UI Components

### Plan Card Display

Each plan card now shows:

```typescript
// Base price (for UI display)
₹{plan.amount}

// GST breakdown (if available)
Base: ₹{gstPlan.amount} + GST (18%): ₹{gstPlan.gst_amount / 100}
Total: ₹{gstPlan.amount_with_gst / 100}
```

### Selected Plan Summary

Shows detailed breakdown:

```typescript
Selected Plan: {plan.name}
₹{plan.amount} / {plan.period} {plan.interval}

Price Breakdown:
Base Amount: ₹{selectedGstPlan.amount}
GST (18%): ₹{selectedGstPlan.gst_amount / 100}
Total Amount: ₹{selectedGstPlan.amount_with_gst / 100}
```

## Payment Flow

### 1. Plan Selection
- User sees base prices in plan cards
- GST breakdown shown for transparency
- Selected plan shows detailed breakdown

### 2. Payment Processing
```typescript
// Create subscription with GST calculation
const subResponse = await ApiService.createSubscription(selectedPlanId, user.id);
const { subscription_id, amount_details } = subResponse;

// Open Razorpay with GST-inclusive amount
RazorpayCheckout.open({
  key,
  subscription_id: subscription_id,
  name: 'Adtip Premium',
  description: 'Your premium subscription',
  // ... other options
});
```

### 3. Amount Details
The backend returns amount details including:
- `base_amount`: Original price
- `gst_amount`: GST amount
- `total_amount`: Total with GST
- `gst_percentage`: GST percentage (18%)

## Example Price Breakdown

| Plan | Base Amount | GST (18%) | Total Amount |
|------|-------------|-----------|--------------|
| 1 Month User Premium | ₹200 | ₹36 | ₹236 |
| 6 Month User Premium | ₹1,200 | ₹216 | ₹1,416 |
| 12 Month User Premium | ₹2,400 | ₹432 | ₹2,832 |
| 1 Month Content Creator | ₹2,500 | ₹450 | ₹2,950 |
| 3 Month Content Creator | ₹6,000 | ₹1,080 | ₹7,080 |
| 6 Month Content Creator | ₹12,000 | ₹2,160 | ₹14,160 |
| 12 Month Content Creator | ₹24,000 | ₹4,320 | ₹28,320 |

## State Management

### New State Variables
```typescript
const [plans, setPlans] = useState<any[]>([]); // Regular plans for UI
const [plansWithGST, setPlansWithGST] = useState<any[]>([]); // GST plans for payment
```

### Data Structure
```typescript
// Regular plan (for UI display)
{
  id: "plan_Qjrw31WPrhunxz",
  name: "Premium - 1 Month",
  amount: 200,
  currency: "INR",
  period: 1,
  interval: "monthly",
  description: "Access to premium features for 1 month"
}

// GST plan (for payment processing)
{
  id: "plan_Qjrw31WPrhunxz",
  name: "Premium - 1 Month",
  amount: 200, // Base amount
  amount_with_gst: 23600, // Total in paise
  currency: "INR",
  period: 1,
  interval: "monthly",
  description: "Access to premium features for 1 month",
  gst_amount: 3600, // GST in paise
  gst_percentage: 18
}
```

## Error Handling

### Network Errors
```typescript
try {
  const [regularResponse, gstResponse] = await Promise.all([
    ApiService.getSubscriptionPlans(),
    ApiService.getSubscriptionPlansWithGST()
  ]);
  
  if (regularResponse.status && gstResponse.status) {
    // Process both responses
  } else {
    Alert.alert('Error', 'Could not fetch subscription plans.');
  }
} catch (error) {
  Alert.alert('Error', 'An error occurred while fetching plans.');
}
```

### Payment Errors
```typescript
RazorpayCheckout.open(options)
  .then((data: any) => {
    // Success handling
  })
  .catch((error: any) => {
    if (error?.code === 'BAD_REQUEST_ERROR' && 
        (error?.reason === 'payment_cancelled' || 
         error?.description?.toLowerCase().includes('cancel'))) {
      Alert.alert('Payment Cancelled', 'You cancelled the payment.');
    } else {
      Alert.alert('Payment Failed', 'Something went wrong with your payment.');
    }
  });
```

## Testing

### Test Plans
For testing purposes, use the test endpoints:

```typescript
// Test regular plans
const testPlans = await ApiService.getSubscriptionPlansTest();

// Test GST plans
const testGstPlans = await ApiService.getSubscriptionPlansTestWithGST();
```

### GST Verification
```typescript
// Verify GST calculations
const baseAmount = 200;
const expectedGST = baseAmount * 0.18; // 36
const expectedTotal = baseAmount + expectedGST; // 236

console.log(`Base: ₹${baseAmount}`);
console.log(`GST: ₹${expectedGST}`);
console.log(`Total: ₹${expectedTotal}`);
```

## Migration Notes

### Existing Users
- No changes to existing subscription data
- New subscriptions will include GST details
- Backward compatibility maintained

### Frontend Updates Required
1. ✅ Updated ApiService with GST endpoints
2. ✅ Updated SubscriptionScreen with GST display
3. ✅ Updated ContentCreatorSubscriptionScreen with GST display
4. ✅ Added price breakdown UI components
5. ✅ Updated payment flow to use GST amounts

### Backend Dependencies
- Backend must implement GST endpoints
- GST calculation utility must be available
- Subscription creation must return amount details

## Compliance Features

### Transparency
- Users see base price + GST breakdown
- Total amount clearly displayed
- No hidden charges

### Audit Trail
- GST details logged in console
- Amount breakdown stored in subscription notes
- Payment verification includes GST details

### User Experience
- Clean UI with clear price breakdown
- No confusion about final amount
- Secure payment processing

## Future Enhancements

### Configurable GST
```typescript
// Could be made configurable
const GST_PERCENTAGE = 18; // Could come from API
```

### Multiple Tax Rates
```typescript
// Support for different tax rates based on location
const getTaxRate = (userLocation: string) => {
  switch(userLocation) {
    case 'IN': return 18;
    case 'US': return 0;
    default: return 18;
  }
};
```

### Tax Invoice Generation
```typescript
// Future feature for tax invoice
const generateTaxInvoice = (subscriptionData: any) => {
  // Generate tax invoice with GST details
};
```

## Troubleshooting

### Common Issues

1. **GST amounts not showing**
   - Check if GST API endpoints are working
   - Verify backend GST calculation
   - Check network connectivity

2. **Payment amounts incorrect**
   - Verify GST calculation logic
   - Check amount conversion (rupees to paise)
   - Validate Razorpay integration

3. **UI not updating**
   - Check state management
   - Verify component re-rendering
   - Check for JavaScript errors

### Debug Information
```typescript
// Add these logs for debugging
console.log('Regular plans:', plans);
console.log('GST plans:', plansWithGST);
console.log('Selected plan:', selectedPlan);
console.log('Selected GST plan:', selectedGstPlan);
console.log('Amount details:', amount_details);
```

## Summary

The frontend GST implementation provides:

- ✅ Transparent price display
- ✅ GST breakdown in UI
- ✅ Secure payment processing
- ✅ Error handling
- ✅ Audit trail
- ✅ User-friendly experience
- ✅ Backward compatibility
- ✅ Testing support

The implementation ensures users understand exactly what they're paying while maintaining a smooth payment experience. 