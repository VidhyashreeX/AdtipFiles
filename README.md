# AdTip Web Application - React.js

A comprehensive social media and content creation platform built with React.js, featuring advanced wallet management, live streaming, engagement systems, and premium subscriptions.

## 🚀 Features Implemented

### 1. Enhanced Authentication System
- **Secure OTP Verification** with 30-second resend cooldown
- **User-friendly Error Messages** instead of raw API errors
- **Automatic Input Clearing** when OTP resend is clicked
- **Session Management** with proper token handling
- **Maximum 3 resend attempts** per session for security

### 2. Advanced Wallet & Premium System
- **Real-time Balance Updates** without page refresh
- **Multi-Currency Support** (INR, USD, EUR, GBP)
- **Accurate Currency Conversion** (1 USD = ₹83.25, 1 INR = $0.012)
- **Transaction History** with proper currency tracking
- **Premium Subscription Management** with instant activation
- **Content Creator Premium** with enhanced features
- **Razorpay Payment Integration** with proper error handling

### 3. Live Streaming Enhancement
- **WebSocket Integration** for real-time communication
- **Live Stream State Management** with Zustand
- **Balance Monitoring Service** for real-time updates
- **Enhanced Streaming Components** with modern UI
- **Stream Comparison Demo** to showcase improvements
- **Real-time Viewer Count** and engagement metrics

### 4. Engagement Actions System
- **Optimistic UI Updates** for immediate feedback
- **Like, Follow, Share** functionality with error recovery
- **Centralized State Management** via Zustand store
- **Loading States** for all engagement actions
- **Automatic Rollback** on API failures
- **Enhanced Post Cards** with improved interactions

### 5. Upload & Create-Post Flow
- **Enhanced File Validation** blocking dangerous files (.exe, .bat, etc.)
- **Proper Authentication** and error handling
- **Step-by-step Guidance** for content creators
- **Channel Creation Integration** for new users
- **TipTube and TipShort** upload support
- **Image/Video Type Detection** and validation

### 6. Currency Conversion System
- **Accurate Exchange Rates** with real-world values
- **Multi-Currency Formatting** with proper symbols
- **Locale-based Number Formatting** (en-IN, en-US, etc.)
- **Currency Validation** with min/max limits
- **Compact Notation** (1K, 1M, 1B) for large amounts
- **Interactive Currency Demo** page for testing

## 🛠 Technology Stack

- **Frontend**: React.js 18+ with TypeScript
- **State Management**: Zustand for efficient state handling
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Shadcn/ui component library
- **Routing**: React Router v6
- **Forms**: React Hook Form with validation
- **Payments**: Razorpay integration
- **Real-time**: WebSocket for live features
- **Testing**: Jest with React Testing Library
- **Build Tool**: Vite for fast development

## 📁 Project Structure

```
adtip-web-reactjs/
├── src/
│   ├── components/
│   │   ├── engagement/          # Enhanced engagement components
│   │   ├── enhanced-auth/       # Authentication components
│   │   ├── EnhancedWallet.tsx   # Wallet management
│   │   └── EnhancedAddFunds.tsx # Fund addition
│   ├── pages/
│   │   ├── EnhancedHome.tsx     # Enhanced home page
│   │   ├── EnhancedLiveStream.tsx # Live streaming
│   │   ├── CurrencyDemo.tsx     # Currency testing
│   │   └── EnhancedCreatePost.tsx # Content creation
│   ├── stores/
│   │   ├── enhanced-wallet-premium.store.ts # Wallet state
│   │   ├── engagement.store.ts  # Engagement state
│   │   ├── livestream.store.ts  # Streaming state
│   │   └── enhanced-auth.store.ts # Auth state
│   ├── services/
│   │   ├── websocketService.ts  # Real-time communication
│   │   ├── balanceMonitorService.ts # Balance monitoring
│   │   └── enhancedUploadService.ts # File uploads
│   ├── utils/
│   │   ├── currencyUtils.ts     # Currency conversion
│   │   └── fileValidation.ts    # File validation
│   └── hooks/
│       ├── useEnhancedAuth.ts   # Authentication hook
│       └── useEnhancedEngagement.ts # Engagement hook
├── public/                      # Static assets
└── docs/                       # Documentation files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VidhyashreeX/AdtipFiles.git
   cd AdtipFiles
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoints and keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:8080
   ```

## 🧪 Testing the Features

### Currency Conversion
- Navigate to `/currency-demo`
- Test conversions between USD, INR, EUR, GBP
- Verify exchange rates are accurate

### Wallet System
- Go to `/wallet` to see enhanced wallet interface
- Add funds via `/add-funds` with proper INR formatting
- Check premium subscriptions with correct pricing

### Live Streaming
- Visit `/livestream` for enhanced streaming experience
- Compare with `/livestream-comparison` to see improvements
- Test real-time features and WebSocket connectivity

### Engagement Actions
- Use `/enhanced-home` for improved engagement
- Test like, follow, share with optimistic updates
- Verify error handling and recovery

### Upload System
- Try `/create-post` for enhanced content creation
- Test file validation with different file types
- Verify channel creation flow integration

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=your_api_endpoint
VITE_RAZORPAY_KEY=your_razorpay_key
VITE_WEBSOCKET_URL=your_websocket_endpoint
```

### Currency Settings
The app supports multiple currencies with accurate exchange rates:
- **USD to INR**: 83.25
- **INR to USD**: 0.012
- **EUR to INR**: 90.54
- **GBP to INR**: 105.38

## 📊 Performance Optimizations

- **Memoized Selectors**: Prevent unnecessary re-renders
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Immediate UI feedback
- **Efficient State Management**: Zustand for minimal boilerplate
- **Code Splitting**: Reduced bundle sizes

## 🔒 Security Features

- **File Validation**: Blocks dangerous file types
- **Authentication Tokens**: Secure API communication
- **Input Sanitization**: Prevents XSS attacks
- **Rate Limiting**: OTP resend cooldowns
- **Error Handling**: No sensitive data exposure

## 📱 Responsive Design

- **Mobile-first Approach**: Optimized for all devices
- **Touch-friendly Interface**: Enhanced mobile interactions
- **Progressive Web App**: Offline capabilities
- **Dark Mode Support**: User preference based theming

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
pnpm build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- **Currency System**: See `CURRENCY_CONVERSION_FIXES_SUMMARY.md`
- **Wallet Implementation**: See `WALLET_PREMIUM_IMPLEMENTATION_COMPLETE.md`
- **API Documentation**: Available in `/docs` folder
- **Component Documentation**: Inline JSDoc comments

## 🐛 Known Issues

- None currently reported

## 🔄 Recent Updates

### Latest Release (December 2024)
- ✅ Fixed currency conversion with accurate exchange rates
- ✅ Enhanced wallet system with real-time updates
- ✅ Improved live streaming with WebSocket integration
- ✅ Fixed engagement actions with optimistic UI
- ✅ Enhanced upload system with proper validation
- ✅ Updated authentication with better error handling

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in `/docs`

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ by the AdTip Development Team**