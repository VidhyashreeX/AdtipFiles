// Deep Link Configuration for Adtip App
// This file defines all the URL patterns and navigation mappings for deep linking

export interface DeepLinkConfig {
  prefixes: string[];
  config: {
    screens: Record<string, any>;
  };
}

// URL Prefixes for the app
export const DEEP_LINK_PREFIXES = [
  'adtip://',
  'https://adtip.in',
  'https://www.adtip.in',
  'https://app.adtip.in',
];

// Deep Link URL Patterns
export const DEEP_LINK_PATTERNS = {
  // Home and Main Navigation
  HOME: '/',
  TIPTUBE: '/tiptube',
  TIPSHORTS: '/tipshorts',
  TIPCALL: '/tipcall',
  TIPSHOP: '/tipshop',
  
  // Content Specific
  POST: '/post/:postId',
  SHORT: '/short/:shortId',
  VIDEO: '/video/:videoId',
  VIDEO_PLAYER: '/watch/:videoId',
  STORY: '/story/:storyId',
  
  // User Profiles
  PROFILE: '/user/:userId',
  PROFILE_POSTS: '/user/:userId/posts',
  PROFILE_SHORTS: '/user/:userId/shorts',
  PROFILE_FOLLOWERS: '/user/:userId/followers',
  PROFILE_FOLLOWING: '/user/:userId/following',
  
  // Social Features
  CHAT: '/chat/:userId',
  COMMENTS: '/post/:postId/comments',
  LIKES: '/post/:postId/likes',
  
  // Calls and Communication
  CALL: '/call/:callId',
  MISSED_CALLS: '/missed-calls',
  CALL_HISTORY: '/call-history',
  
  // Shopping and Commerce
  SHOP: '/shop',
  PRODUCT: '/shop/product/:productId',
  CART: '/shop/cart',
  ORDERS: '/shop/orders',
  
  // Wallet and Earnings
  WALLET: '/wallet',
  EARNINGS: '/earnings',
  TRANSACTIONS: '/wallet/transactions',
  WITHDRAWAL: '/wallet/withdrawal',
  
  // Settings and Account
  SETTINGS: '/settings',
  EDIT_PROFILE: '/settings/profile',
  PRIVACY: '/settings/privacy',
  NOTIFICATIONS: '/settings/notifications',
  
  // Premium and Subscriptions
  PREMIUM: '/premium',
  SUBSCRIPTION: '/subscription/:planId',
  
  // Games and Entertainment
  PLAY_TO_EARN: '/play-to-earn',
  LUDO_GAME: '/ludo/:gameId',
  WATCH_TO_EARN: '/watch-to-earn',
  
  // Referral and Social
  REFERRAL: '/referral',
  INVITE: '/invite/:referralCode',
  
  // Search and Discovery
  SEARCH: '/search',
  EXPLORE: '/explore',
  TRENDING: '/trending',
  
  // Analytics and Insights
  ANALYTICS: '/analytics',
  INSIGHTS: '/insights',
  
  // Support and Help
  SUPPORT: '/support',
  HELP: '/help',
  FAQ: '/faq',
  
  // Special Features
  LIVE_STREAM: '/live/:streamId',
  EVENT: '/event/:eventId',
  CHALLENGE: '/challenge/:challengeId',

  // Call-specific routes for FCM deep linking
  INCOMING_CALL: '/call/incoming/:sessionId/:meetingId/:token',
  OUTGOING_CALL: '/call/outgoing/:sessionId/:meetingId/:token',
  CALL_SCREEN: '/call/active/:sessionId/:meetingId/:token',
} as const;

// React Navigation Deep Link Configuration
export const DEEP_LINK_CONFIG: DeepLinkConfig = {
  prefixes: DEEP_LINK_PREFIXES,
  config: {
    screens: {
      // Authentication Flow
      Auth: {
        screens: {
          Onboarding: 'onboarding',
          Login: 'login',
          OTP: 'otp',
          UserDetails: 'user-details',
        },
      },
      
      // Main App Flow
      Main: {
        screens: {
          // Tab Navigation
          TabHome: {
            screens: {
              Home: '',
              TipTube: 'tiptube',
              TipShorts: 'tipshorts',
              TipCall: 'tipcall',
              TipShop: 'tipshop',
            },
          },
          
          // Content Screens
          PostViewer: {
            path: 'post/:postId',
            parse: {
              postId: (postId: string) => Number(postId),
            },
          },
          
          TipShorts: {
            path: 'short/:shortId?',
            parse: {
              shortId: (shortId: string) => shortId,
            },
          },
          
          Video: {
            path: 'video/:videoId',
            parse: {
              videoId: (videoId: string) => Number(videoId),
            },
          },

          VideoPlayerModal: {
            path: 'watch/:videoId',
            parse: {
              videoId: (videoId: string) => Number(videoId),
            },
          },

          Story: {
            path: 'story/:storyId',
            parse: {
              storyId: (storyId: string) => storyId,
            },
          },
          
          // User Profile Screens
          Profile: {
            path: 'user/:userId',
            parse: {
              userId: (userId: string) => Number(userId),
            },
          },
          
          InstagramProfile: {
            path: 'user/:userId/instagram',
            parse: {
              userId: (userId: string) => Number(userId),
            },
          },
          
          FollowersFollowing: {
            path: 'user/:userId/:tab',
            parse: {
              userId: (userId: string) => Number(userId),
              tab: (tab: string) => tab,
            },
          },
          
          // Communication Screens
          Chat: {
            path: 'chat/:userId',
            parse: {
              userId: (userId: string) => Number(userId),
            },
          },
          
          Comments: {
            path: 'post/:postId/comments',
            parse: {
              postId: (postId: string) => Number(postId),
            },
          },
          
          MissedCalls: 'missed-calls',
          
          // Shopping Screens
          TipShop: 'shop',
          ProductDetail: {
            path: 'shop/product/:productId',
            parse: {
              productId: (productId: string) => Number(productId),
            },
          },
          
          // Wallet and Financial Screens
          Wallet: 'wallet',
          Earnings: 'earnings',
          Withdrawal: 'wallet/withdrawal',
          
          // Settings and Account
          Settings: 'settings',
          EditProfile: 'settings/profile',
          Privacy: 'settings/privacy',
          NotificationSettings: 'settings/notifications',
          
          // Premium and Subscriptions
          Premium: 'premium',
          ContentCreatorSubscriptionScreen: 'subscription',
          
          // Games and Entertainment
          PlayToEarn: 'play-to-earn',
          LudoGame: {
            path: 'ludo/:gameId?',
            parse: {
              gameId: (gameId: string) => gameId,
            },
          },
          WatchAndEarn: 'watch-to-earn',
          
          // Social and Referral
          Referral: 'referral',
          
          // Search and Discovery
          Search: 'search',
          Explore: 'explore',
          
          // Analytics
          Analytics: 'analytics',
          
          // Support
          Support: 'support',
          
          // Media Creation
          CreatePost: 'create',
          CameraRecording: 'camera',
          VideoPreview: 'video-preview',

          // Chat
          Conversations: 'chats',
          NewChat: 'chat/:conversationId?',
        },
      },
      
      // Special Screens (outside main navigation)
      Meeting: {
        path: 'call/:meetingId',
        parse: {
          meetingId: (meetingId: string) => meetingId,
        },
      },

      MeetingSimple: {
        path: 'call/simple/:sessionId',
        parse: {
          sessionId: (sessionId: string) => sessionId,
        },
      },

      // Enhanced call routes for FCM deep linking
      IncomingCall: {
        path: 'call/incoming/:sessionId/:meetingId/:token',
        parse: {
          sessionId: (sessionId: string) => sessionId,
          meetingId: (meetingId: string) => meetingId,
          token: (token: string) => token,
        },
      },

      OutgoingCall: {
        path: 'call/outgoing/:sessionId/:meetingId/:token',
        parse: {
          sessionId: (sessionId: string) => sessionId,
          meetingId: (meetingId: string) => meetingId,
          token: (token: string) => token,
        },
      },

      CallScreen: {
        path: 'call/active/:sessionId/:meetingId/:token',
        parse: {
          sessionId: (sessionId: string) => sessionId,
          meetingId: (meetingId: string) => meetingId,
          token: (token: string) => token,
        },
      },
      
      // Guest Mode
      Guest: 'guest',
    },
  },
};

// URL Parameter Types
export interface DeepLinkParams {
  postId?: number;
  userId?: number;
  shortId?: string;
  videoId?: number;
  storyId?: string;
  callId?: string;
  meetingId?: string;
  sessionId?: string;
  productId?: number;
  gameId?: string;
  referralCode?: string;
  tab?: string;
  initialIndex?: number;
  posts?: any[]; // For PostViewer screen
  video?: any; // For VideoPlayerModal screen
  upNextVideos?: any[]; // For VideoPlayerModal screen
}

// Helper function to generate deep links
export const generateDeepLink = (
  pattern: keyof typeof DEEP_LINK_PATTERNS,
  params?: Record<string, string | number>
): string => {
  let url: string = DEEP_LINK_PATTERNS[pattern];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  return `${DEEP_LINK_PREFIXES[0]}${url}`;
};

// Helper function to generate universal links
export const generateUniversalLink = (
  pattern: keyof typeof DEEP_LINK_PATTERNS,
  params?: Record<string, string | number>
): string => {
  let url: string = DEEP_LINK_PATTERNS[pattern];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  return `https://adtip.in${url}`;
};
