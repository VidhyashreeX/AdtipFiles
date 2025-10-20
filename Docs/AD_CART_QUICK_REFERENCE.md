# Quick Reference - Ad Cart & Payment Integration

## 🚀 Quick Start

### Environment Setup
```bash
# Add to .env file
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### Testing Payment Flow
1. Create a campaign in ConfigureCampaign page
2. Upload creative in UploadCreative page
3. Preview and add to cart in PreviewAd page
4. Go to Ads Cart page (automatically or via navigation)
5. Click "Proceed to Payment"
6. Complete test payment in Razorpay modal
7. Verify cart is cleared and redirected to orders

---

## 🎨 Dark Mode Classes Used

### Background Colors
- Main: `dark:bg-gray-950`
- Cards: `dark:bg-gray-900`, `dark:bg-gray-800`
- Inputs: `dark:bg-gray-800`

### Text Colors
- Primary: `dark:text-gray-100`
- Secondary: `dark:text-gray-300`
- Muted: `dark:text-gray-400`

### Borders
- Cards: `dark:border-gray-800`
- Inputs: `dark:border-gray-600`

### Gradients
- Blue: `dark:from-blue-900/30 dark:to-cyan-900/30`
- Green: `dark:from-green-900/30 dark:to-emerald-900/30`
- Purple: `dark:from-purple-900/30 dark:to-pink-900/30`

---

## 💾 localStorage Keys

```typescript
// Cart items
localStorage.getItem('adsCart')
localStorage.setItem('adsCart', JSON.stringify(pendingAds))

// Saved for later items
localStorage.getItem('adsSavedForLater')
localStorage.setItem('adsSavedForLater', JSON.stringify(savedAds))

// User data
localStorage.getItem('UserData')
localStorage.getItem('UserLoggedIn') // Auth token
```

---

## 🔌 API Endpoints

### Create Order
```typescript
POST /api/razorpay-order
Body: {
  amount: number,
  currency: string,
  user_id: string | number
}
Response: {
  status: boolean,
  data: {
    id: string,
    amount: number,
    currency: string
  }
}
```

### Verify Payment
```typescript
POST /api/razorpay-details
Body: {
  order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  amount: number,
  currency: string,
  user_id: string | number,
  payment_status: string,
  transaction_for: string
}
Response: {
  status: boolean,
  is_verified: boolean,
  message: string,
  transactionId: number
}
```

---

## 🎯 Key Component Props

### PreviewAd
```typescript
location.state = {
  selectedModel: AdModel,
  campaignData: CampaignFormData,
  uploadedFile: File,
  uploadedFileUrl: string,
  contentData: ContentData,
  adId: string | number,
  apiData: ApiData
}
```

### AdsCart
```typescript
location.state = {
  adData: {
    selectedModel: AdModel,
    campaignData: CampaignFormData,
    uploadedFile: File,
    uploadedFileUrl: string,
    contentData: ContentData,
    adId: string | number,
    pricing: {
      orderValue: number,
      tax: number,
      total: number
    }
  }
}
```

---

## 🔧 Common Code Snippets

### Load Razorpay Script
```typescript
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
```

### Check Dark Mode
```typescript
const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  const checkDarkMode = () => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  };
  checkDarkMode();
  
  const observer = new MutationObserver(checkDarkMode);
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });
  
  return () => observer.disconnect();
}, []);
```

### Initialize from localStorage
```typescript
const [items, setItems] = useState(() => {
  const saved = localStorage.getItem('key');
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  localStorage.setItem('key', JSON.stringify(items));
}, [items]);
```

---

## 🐛 Troubleshooting

### Payment not working
1. Check Razorpay key in .env
2. Verify script loads in Network tab
3. Check console for errors
4. Verify backend endpoints are accessible

### Cart not persisting
1. Check localStorage in DevTools
2. Verify useEffect dependencies
3. Check for JSON parsing errors
4. Clear localStorage and retry

### Dark mode not working
1. Verify Tailwind config has `darkMode: 'class'`
2. Check HTML element has 'dark' class
3. Verify dark: variants are in Tailwind build
4. Check for CSS conflicts

### Calendar not visible
1. Check MUI theme provider
2. Verify sx styles are applied
3. Check z-index of popper
4. Verify isDarkMode state updates

---

## ✅ Testing Checklist

### Manual Testing
- [ ] Create campaign with all fields
- [ ] Upload creative (image/video)
- [ ] Preview shows correct data
- [ ] Add to cart successful
- [ ] Cart persists after refresh
- [ ] Payment modal opens
- [ ] Payment completes successfully
- [ ] Cart clears after payment
- [ ] Dark mode works everywhere
- [ ] Calendar picker visible in dark mode

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## 📱 Mobile Responsive

All components are mobile responsive with:
- Flex layouts that wrap on small screens
- Responsive grid columns
- Touch-friendly button sizes
- Proper spacing on mobile
- Readable text sizes

---

## 🎨 Brand Colors

```css
Primary: #00dcaa
Hover: #00b894
Light: rgba(0, 220, 170, 0.1)
Dark: rgba(0, 220, 170, 0.2)
```

---

## 📚 Dependencies

- React Router DOM (navigation)
- Axios (API calls)
- Material-UI DatePicker (@mui/x-date-pickers)
- React Select (dropdowns)
- Lucide React (icons)
- Razorpay Checkout (payment)

---

## 🔐 Security Notes

- Never commit Razorpay keys to git
- Use test keys in development
- Verify signatures on backend
- Log all payment transactions
- Handle PCI compliance properly

---

## 📞 Contact & Support

For issues or questions:
1. Check console logs
2. Review API responses
3. Check backend logs
4. Verify environment variables
5. Test in incognito mode

---

Last Updated: October 2025
