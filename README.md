
# AdTip - Interactive Digital Marketplace

## Overview

## DEV START -

pnpm install  # Install dependencies
pnpm dev      # Start dev server
pnpm build    # Build for production
pnpm lint     # Run linter


AdTip is a comprehensive digital marketplace platform that combines social media features, e-commerce functionality, and advertising opportunities in one integrated ecosystem. The platform enables users to buy and sell products, engage with premium content, promote their offerings through ads, and earn money through various engagement mechanisms.

## Core Features

### E-Commerce Marketplace
- Product listings with search, filter, and category navigation
- Detailed product pages with images, descriptions, and specifications
- Shopping cart functionality with secure checkout
- Unique bargaining feature for price negotiation between buyers and sellers

### Content Monetization
- Premium content marketplace for digital products (courses, templates, e-books)
- Content creator tools for uploading and selling digital assets
- Subscription options for premium content access

### Advertising Platform
- Ad campaign creation and management
- Various ad formats (banner, video, sponsored content)
- Targeted advertising based on demographics and interests
- Analytics dashboard for tracking ad performance

### User Engagement & Earnings
- Earn through content creation, ad engagement, and referrals
- Interactive features like TipTube, TipShort, and TipCall
- Social networking capabilities with following and messaging

## Technology Stack

- **Frontend**: React, TypeScript
- **UI Framework**: Tailwind CSS, Shadcn/UI
- **Routing**: React Router
- **State Management**: React Context API, React Query
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository
```
git clone [repository-url]
cd adtip
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/             # Base UI components from shadcn/ui
│   └── ...             # Feature-specific components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── pages/              # Page components
│   ├── marketplace/    # E-commerce and marketplace pages
│   └── ...             # Other application pages
├── routes.tsx          # Application routes
└── main.tsx            # Application entry point
```

## Features in Detail

### Tip Shop
Browse and purchase products with advanced filtering, search, and detailed product views. The unique bargaining feature allows buyers to negotiate prices directly with sellers.

### Analysis
Comprehensive analytics dashboard showing earnings, views, interactions, and user demographics with visual charts and insights.

### Become Seller
Onboarding process for sellers to register their businesses, add products, and start selling on the platform with detailed seller profiles.

### Post Advertisers
Create and manage advertising campaigns with various formats, targeting options, and budget controls. Track performance metrics in real-time.

### Premium Content
Marketplace for digital products where creators can sell courses, templates, stock photos, and more. Users can browse, purchase, and access premium content.

## Mobile Responsiveness

The application is designed to work seamlessly across desktop and mobile devices with a responsive layout that adapts to different screen sizes.

## Authentication & Security

User authentication is managed through OTP verification with JWT tokens for secure sessions. Payment information is handled securely through encrypted channels.

## Future Development

- Integration with additional payment gateways
- Enhanced messaging and chat features
- Mobile app development
- AI-powered product recommendations
- Advanced analytics and reporting tools
