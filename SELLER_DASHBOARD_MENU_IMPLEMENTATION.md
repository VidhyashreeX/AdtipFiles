# Seller Dashboard Menu Implementation

## Overview
Added a dynamic seller dashboard menu item to the sidebar that checks if the user has registered companies and shows appropriate actions based on their status.

## Features Implemented

### 1. Dynamic Menu Visibility
- **User with companies**: Shows "Seller Dashboard" menu item that navigates to `/seller/dashboard`
- **User without companies**: Shows "Seller Dashboard" menu item that opens a registration dialog
- **Unknown status**: Hides the menu item until status is determined

### 2. Real-time Company Status Checking
- Added `useEffect` hook that calls `apiGetCompanyList()` to check user's companies
- Handles API errors gracefully (404 = no companies, other errors = hide menu)
- Updates state based on API response

### 3. User-friendly Registration Dialog
- Clean modal dialog explaining the need for company registration
- Branded with AdTip colors and consistent design
- Two action buttons:
  - "Maybe Later" - closes dialog
  - "Become Advertiser" - navigates to `/seller/register`

### 4. Mobile-Responsive Design
- Dialog adapts to mobile screens
- Proper mobile navigation handling
- Consistent with existing AdTip mobile patterns

## Technical Implementation

### Files Modified
- `src/components/ui/AdTipSidebar.tsx` - Main implementation

### Key Changes

#### 1. Added Imports
```typescript
import { apiGetCompanyList } from "../../api";
import { Building2 } from "lucide-react";
```

#### 2. Added State Management
```typescript
const [hasCompanies, setHasCompanies] = React.useState<boolean | null>(null);
const [isCheckingCompanies, setIsCheckingCompanies] = React.useState(false);
const [showSellerDialog, setShowSellerDialog] = React.useState(false);
```

#### 3. Added Company Status Checking
```typescript
React.useEffect(() => {
  const checkUserCompanies = async () => {
    if (!user?.id) {
      setHasCompanies(null);
      return;
    }

    setIsCheckingCompanies(true);
    try {
      const response = await apiGetCompanyList(user.id.toString());
      
      if (response?.data?.status === 200 && response.data.data?.length > 0) {
        setHasCompanies(true);
      } else {
        setHasCompanies(false);
      }
    } catch (error: any) {
      // Error handling logic
    } finally {
      setIsCheckingCompanies(false);
    }
  };

  checkUserCompanies();
}, [user?.id]);
```

#### 4. Modified Menu Items Array
```typescript
const ecommerceItems = [
  // ... existing items
  
  // Seller Dashboard - conditionally show based on companies
  ...(hasCompanies !== null 
    ? [
        {
          to: hasCompanies ? "/seller/dashboard" : "#",
          label: "Seller Dashboard",
          icon: <Building2 className="h-5 w-5" />,
          onClick: hasCompanies ? undefined : () => setShowSellerDialog(true),
          special: !hasCompanies
        }
      ]
    : []),
  
  // ... rest of items
];
```

#### 5. Added Special Menu Item Handling
```typescript
// Handle special seller dashboard item with onClick
if (item.special && item.onClick) {
  return (
    <button
      key={item.to}
      onClick={() => {
        item.onClick();
        if (isMobile) setOpenMobile(false);
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-0 py-3 text-gray-500 transition-all hover:text-gray-900 w-full text-left",
        isCollapsed && !isMobile && "justify-center px-0"
      )}
    >
      {React.cloneElement(item.icon, { className: "h-6 w-6" })}
      {(!isCollapsed || isMobile) && (
        <span className="text-sm font-medium">{item.label}</span>
      )}
    </button>
  );
}
```

#### 6. Added Registration Dialog
```typescript
<Dialog open={showSellerDialog} onOpenChange={setShowSellerDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Seller Dashboard
      </DialogTitle>
      <DialogDescription>
        Access your business management tools and analytics
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-orange-100 rounded-full">
          <Store className="h-8 w-8 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">No Companies Registered</h3>
          <p className="text-sm text-gray-600 mb-4">
            You need to register at least one company to access the seller dashboard and start advertising your business.
          </p>
        </div>
      </div>
    </div>
    <DialogFooter className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        className="sm:flex-1"
        onClick={() => setShowSellerDialog(false)}
      >
        Maybe Later
      </Button>
      <Button
        className="sm:flex-1 bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085]"
        onClick={() => {
          setShowSellerDialog(false);
          navigate('/seller/register');
          if (isMobile) setOpenMobile(false);
        }}
      >
        Become Advertiser
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 7. Extended NavItem Interface
```typescript
interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  subtitle?: string;
  external?: boolean;
  onClick?: () => void;
  special?: boolean;
  state?: any;
}
```

## User Experience Flow

### For Users with Companies
1. User sees "Seller Dashboard" in sidebar menu
2. Clicking navigates directly to `/seller/dashboard`
3. User can access their business management tools

### For Users without Companies  
1. User sees "Seller Dashboard" in sidebar menu
2. Clicking opens a registration dialog
3. Dialog explains the need for company registration
4. User can choose "Maybe Later" or "Become Advertiser"
5. "Become Advertiser" navigates to `/seller/register`

### For Users with Unknown Status
1. Menu item is hidden while status is being determined
2. Prevents confusion during loading states
3. Menu appears once status is resolved

## Error Handling
- API errors are gracefully handled
- 404 responses correctly identify users without companies
- Network errors hide the menu item to prevent confusion
- Loading states prevent premature actions

## Design Consistency
- Uses existing AdTip color scheme (`#00dcaa` to `#00b894`)
- Consistent with other sidebar menu items
- Matches existing dialog patterns
- Mobile-responsive design

## Testing
- All scenarios are covered with proper state management
- TypeScript types are properly defined
- No compilation errors
- Graceful fallbacks for edge cases

## Dependencies
- Existing `apiGetCompanyList` API function
- Existing UI components (Dialog, Button, etc.)
- Existing navigation patterns
- Existing sidebar context

This implementation provides a seamless user experience for both registered sellers and new users looking to become advertisers, with clear guidance and proper error handling.