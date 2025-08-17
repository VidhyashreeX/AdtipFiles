// Deep Link Service for handling incoming deep links
import { Linking } from 'react-native';
import { navigationRef, navigateWithRetry, resetTo } from '../navigation/NavigationService';
import { DEEP_LINK_PREFIXES, DeepLinkParams } from '../config/deepLinkConfig';

export interface ParsedDeepLink {
  screen: string;
  params?: DeepLinkParams;
  isValid: boolean;
  originalUrl: string;
}

export interface DeepLinkHandler {
  pattern: RegExp;
  handler: (matches: RegExpMatchArray, url: string) => void;
}

class DeepLinkService {
  private handlers: DeepLinkHandler[] = [];
  private isInitialized = false;

  constructor() {
    this.setupHandlers();
  }

  /**
   * Initialize the deep link service
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // Handle initial URL when app is opened from a deep link
    this.getInitialURL();

    // Listen for incoming deep links when app is already open
    Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    this.isInitialized = true;
    console.log('[DeepLinkService] Initialized successfully');
  }

  /**
   * Get the initial URL that opened the app
   */
  private async getInitialURL(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('[DeepLinkService] Initial URL:', initialUrl);
        this.handleDeepLink(initialUrl);
      }
    } catch (error) {
      console.error('[DeepLinkService] Error getting initial URL:', error);
    }
  }

  /**
   * Handle incoming deep link with enhanced app readiness check for killed state
   */
  public handleDeepLink(url: string): void {
    console.log('[DeepLinkService] Handling deep link:', url);

    if (!this.isValidDeepLink(url)) {
      console.warn('[DeepLinkService] Invalid deep link:', url);
      return;
    }

    const parsedLink = this.parseDeepLink(url);
    if (!parsedLink.isValid) {
      console.warn('[DeepLinkService] Failed to parse deep link:', url);
      return;
    }

    // Check if this is a call-related deep link that needs special handling
    const isCallLink = parsedLink.screen === 'Meeting' || parsedLink.screen === 'MeetingSimple';

    if (isCallLink) {
      console.log('[DeepLinkService] Call deep link detected, using enhanced killed state handling');
      this.handleCallDeepLink(parsedLink);
    } else {
      // Regular deep link handling with standard delay
      setTimeout(() => {
        this.navigateToScreen(parsedLink);
      }, 150);
    }
  }

  /**
   * Handle call-related deep links with service readiness checks
   */
  private async handleCallDeepLink(parsedLink: ParsedDeepLink): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('[DeepLinkService] 🚀 Starting enhanced call deep link handling', {
        screen: parsedLink.screen,
        params: parsedLink.params
      });

      // Step 1: Check if Service Orchestrator is available and services are ready
      try {
        const { default: KilledStateServiceOrchestrator } = await import('./KilledStateServiceOrchestrator');
        const orchestrator = KilledStateServiceOrchestrator.getInstance();

        if (orchestrator.isReady()) {
          // Services are already initialized, proceed with navigation
          console.log('[DeepLinkService] ✅ Services already ready, proceeding with navigation');
          this.navigateToScreen(parsedLink);
          return;
        }
      } catch (error) {
        console.warn('[DeepLinkService] Service orchestrator not available, using fallback timing');
      }

      // Step 2: Wait for VideoSDK readiness (critical for call screens)
      await this.waitForVideoSDKReadiness();

      // Step 3: Add additional delay for app stability in killed state scenarios
      const timeSinceStart = Date.now() - startTime;
      const additionalDelay = Math.max(500, 2000 - timeSinceStart); // Ensure at least 2 seconds total

      console.log('[DeepLinkService] ⏳ Adding stability delay for killed state navigation', {
        additionalDelay,
        totalTime: timeSinceStart + additionalDelay
      });

      setTimeout(() => {
        this.navigateToScreen(parsedLink);

        const totalDuration = Date.now() - startTime;
        console.log('[DeepLinkService] ✅ Call deep link navigation completed', {
          duration: totalDuration,
          screen: parsedLink.screen
        });
      }, additionalDelay);

    } catch (error) {
      console.error('[DeepLinkService] ❌ Enhanced call deep link handling failed:', error);

      // Fallback to regular navigation with extended delay
      setTimeout(() => {
        console.log('[DeepLinkService] 🔄 Using fallback navigation for call deep link');
        this.navigateToScreen(parsedLink);
      }, 3000); // Extended delay for safety
    }
  }

  /**
   * Wait for VideoSDK to be ready before navigating to call screens
   */
  private async waitForVideoSDKReadiness(): Promise<void> {
    const maxWaitTime = 5000; // 5 seconds max wait
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkVideoSDK = async () => {
        try {
          // Dynamically import VideoSDK service to avoid circular dependencies
          const VideoSDKServiceModule = await import('./videosdk/VideoSDKService');
          const videoSDKService = VideoSDKServiceModule.default.getInstance();

          const status = videoSDKService.getInitializationStatus();

          if (status.initialized && status.websocketReady) {
            console.log('[DeepLinkService] ✅ VideoSDK ready for call navigation');
            resolve();
            return;
          }

          // Check if we've exceeded max wait time
          if (Date.now() - startTime > maxWaitTime) {
            console.warn('[DeepLinkService] ⚠️ VideoSDK readiness timeout, proceeding anyway');
            resolve();
            return;
          }

          // Check again in 200ms
          setTimeout(checkVideoSDK, 200);

        } catch (error) {
          console.warn('[DeepLinkService] ⚠️ Error checking VideoSDK readiness:', error);
          resolve(); // Don't block navigation on errors
        }
      };

      checkVideoSDK();
    });
  }

  /**
   * Check if URL is a valid deep link for this app
   */
  private isValidDeepLink(url: string): boolean {
    return DEEP_LINK_PREFIXES.some(prefix => url.startsWith(prefix));
  }

  /**
   * Parse deep link URL and extract screen and parameters
   */
  public parseDeepLink(url: string): ParsedDeepLink {
    try {
      // Remove the prefix to get the path
      let path = url;
      for (const prefix of DEEP_LINK_PREFIXES) {
        if (url.startsWith(prefix)) {
          path = url.replace(prefix, '');
          break;
        }
      }

      // Remove leading slash if present
      if (path.startsWith('/')) {
        path = path.substring(1);
      }

      // Handle empty path (home)
      if (!path) {
        return {
          screen: 'Main',
          params: {},
          isValid: true,
          originalUrl: url,
        };
      }

      // Parse different URL patterns
      const segments = path.split('/');
      const firstSegment = segments[0];

      switch (firstSegment) {
        case 'post':
          return this.parsePostLink(segments, url);
        case 'user':
          return this.parseUserLink(segments, url);
        case 'short':
        case 'tipshorts':
          return this.parseShortLink(segments, url);
        case 'video':
          return this.parseVideoLink(segments, url);
        case 'watch':
          return this.parseWatchLink(segments, url);
        case 'call':
          return this.parseCallLink(segments, url);
        case 'chat':
          return this.parseChatLink(segments, url);
        case 'shop':
          return this.parseShopLink(segments, url);
        case 'tiptube':
        case 'tipcall':
        case 'tipshop':
        case 'wallet':
        case 'earnings':
        case 'settings':
        case 'premium':
        case 'referral':
        case 'search':
        case 'explore':
        case 'analytics':
        case 'support':
        case 'play-to-earn':
        case 'watch-to-earn':
          return this.parseSimpleScreenLink(firstSegment, url);
        default:
          console.warn('[DeepLinkService] Unknown deep link pattern:', path);
          return {
            screen: 'Main',
            params: {},
            isValid: false,
            originalUrl: url,
          };
      }
    } catch (error) {
      console.error('[DeepLinkService] Error parsing deep link:', error);
      return {
        screen: 'Main',
        params: {},
        isValid: false,
        originalUrl: url,
      };
    }
  }

  /**
   * Parse post-related deep links
   */
  private parsePostLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const postId = parseInt(segments[1], 10);
      if (!isNaN(postId)) {
        if (segments.length >= 3 && segments[2] === 'comments') {
          return {
            screen: 'Comments',
            params: { postId },
            isValid: true,
            originalUrl: url,
          };
        }
        // For post deep links, navigate to PostViewer with the specific post
        // We'll need to fetch the post data or pass minimal required params
        return {
          screen: 'PostViewer',
          params: {
            posts: [], // Will be populated by the screen
            initialIndex: 0,
            postId, // Pass postId for the screen to fetch the specific post
            userId: undefined
          },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse user profile deep links
   */
  private parseUserLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const userId = parseInt(segments[1], 10);
      if (!isNaN(userId)) {
        if (segments.length >= 3) {
          const subPage = segments[2];
          switch (subPage) {
            case 'followers':
            case 'following':
              return {
                screen: 'FollowersFollowing',
                params: { userId, tab: subPage },
                isValid: true,
                originalUrl: url,
              };
            case 'instagram':
              return {
                screen: 'InstagramProfile',
                params: { userId },
                isValid: true,
                originalUrl: url,
              };
          }
        }
        return {
          screen: 'Profile',
          params: { userId },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse short video deep links
   */
  private parseShortLink(segments: string[], url: string): ParsedDeepLink {
    const shortId = segments.length >= 2 ? segments[1] : undefined;
    return {
      screen: 'TipShorts',
      params: shortId ? { shortId } : {},
      isValid: true,
      originalUrl: url,
    };
  }

  /**
   * Parse video deep links
   */
  private parseVideoLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const videoId = parseInt(segments[1], 10);
      if (!isNaN(videoId)) {
        return {
          screen: 'Video',
          params: { videoId },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse watch video deep links (for VideoPlayerModal)
   */
  private parseWatchLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const videoId = parseInt(segments[1], 10);
      if (!isNaN(videoId)) {
        return {
          screen: 'VideoPlayerModal',
          params: { videoId },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse call-related deep links
   */
  private parseCallLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const callId = segments[1];
      if (segments.length >= 3 && segments[2] === 'simple') {
        return {
          screen: 'MeetingSimple',
          params: { sessionId: callId },
          isValid: true,
          originalUrl: url,
        };
      }
      return {
        screen: 'Meeting',
        params: { meetingId: callId },
        isValid: true,
        originalUrl: url,
      };
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse chat deep links
   */
  private parseChatLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 2) {
      const userId = parseInt(segments[1], 10);
      if (!isNaN(userId)) {
        return {
          screen: 'Chat',
          params: { userId },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return { screen: 'Main', params: {}, isValid: false, originalUrl: url };
  }

  /**
   * Parse shop-related deep links
   */
  private parseShopLink(segments: string[], url: string): ParsedDeepLink {
    if (segments.length >= 3 && segments[1] === 'product') {
      const productId = parseInt(segments[2], 10);
      if (!isNaN(productId)) {
        return {
          screen: 'ProductDetail',
          params: { productId },
          isValid: true,
          originalUrl: url,
        };
      }
    }
    return {
      screen: 'TipShop',
      params: {},
      isValid: true,
      originalUrl: url,
    };
  }

  /**
   * Parse simple screen deep links (no parameters)
   */
  private parseSimpleScreenLink(screen: string, url: string): ParsedDeepLink {
    const screenMap: Record<string, string> = {
      'tiptube': 'TabHome', // Navigate to tab home, TipTube tab will be selected
      'tipcall': 'TabHome', // Navigate to tab home, TipCall tab will be selected
      'tipshop': 'TabHome', // Navigate to tab home, TipShop tab will be selected
      'wallet': 'Wallet',
      'earnings': 'Earnings',
      'settings': 'Settings',
      'premium': 'PremiumUser',
      'referral': 'Referral',
      'search': 'Search',
      'explore': 'Explore',
      'analytics': 'Analytics',
      'support': 'Settings', // Support is usually in settings
      'play-to-earn': 'PlayToEarn',
      'watch-to-earn': 'WatchAndEarn',
    };

    return {
      screen: screenMap[screen] || 'TabHome',
      params: {},
      isValid: true,
      originalUrl: url,
    };
  }

  /**
   * Navigate to the parsed screen with enhanced retry logic and UltraFastLoader awareness
   */
  private navigateToScreen(parsedLink: ParsedDeepLink, retryCount: number = 0): void {
    const maxRetries = 8;
    const retryDelay = 300;

    if (!navigationRef.isReady()) {
      if (retryCount < maxRetries) {
        console.warn(`[DeepLinkService] Navigation not ready, retry ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => this.navigateToScreen(parsedLink, retryCount + 1), retryDelay);
        return;
      } else {
        console.error('[DeepLinkService] Navigation failed after max retries - navigation not ready');
        return;
      }
    }

    try {
      console.log('[DeepLinkService] Navigating to:', parsedLink.screen, 'with params:', parsedLink.params);

      // Get current navigation state for debugging
      const currentState = navigationRef.getCurrentRoute();
      console.log('[DeepLinkService] Current route:', currentState?.name);

      // Check if we're in the right navigation context
      const currentRouteName = currentState?.name;

      // If we're on InitialLoading, wait a bit more for the app to initialize
      if (currentRouteName === 'InitialLoading' && retryCount < 6) {
        console.log('[DeepLinkService] App still initializing, waiting...');
        setTimeout(() => this.navigateToScreen(parsedLink, retryCount + 1), 500);
        return;
      }

      // Navigate to the appropriate screen
      if (parsedLink.screen === 'Meeting' || parsedLink.screen === 'MeetingSimple') {
        // Direct navigation for call screens (these are at root level)
        console.log('[DeepLinkService] Direct navigation to call screen:', parsedLink.screen);
        (navigationRef as any).navigate(parsedLink.screen, parsedLink.params);
      } else {
        // Check if Main navigator is available
        if (currentRouteName === 'Main' || currentRouteName === 'Guest') {
          // We're in the right context, navigate through the nested navigator
          console.log('[DeepLinkService] Navigating through nested navigator to:', parsedLink.screen);

          const targetNavigator = currentRouteName === 'Guest' ? 'Guest' : 'Main';
          (navigateWithRetry as any)(targetNavigator, {
            screen: parsedLink.screen,
            params: parsedLink.params,
          });
        } else {
          // We might be in Auth or other state, try to navigate to Main first
          console.log('[DeepLinkService] Not in Main/Guest context, navigating to Main first');
          (navigateWithRetry as any)('Main', {
            screen: parsedLink.screen,
            params: parsedLink.params,
          });
        }
      }
    } catch (error) {
      console.error('[DeepLinkService] Navigation error:', error);

      // Enhanced fallback: try different approaches
      if (retryCount < 3) {
        console.log('[DeepLinkService] Trying fallback navigation approach');
        setTimeout(() => {
          try {
            // Try direct navigation to the screen
            (navigationRef as any).navigate(parsedLink.screen, parsedLink.params);
          } catch (fallbackError) {
            console.error('[DeepLinkService] Direct navigation fallback failed:', fallbackError);

            // Last resort: try to reset to Main and then navigate
            try {
              resetTo('Main');
              setTimeout(() => {
                (navigationRef as any).navigate('Main', {
                  screen: parsedLink.screen,
                  params: parsedLink.params,
                });
              }, 300);
            } catch (resetError) {
              console.error('[DeepLinkService] Reset navigation fallback also failed:', resetError);
            }
          }
        }, 500);
      }
    }
  }

  /**
   * Setup custom handlers for specific URL patterns
   */
  private setupHandlers(): void {
    // Add any custom handlers here if needed
    console.log('[DeepLinkService] Handlers setup complete');
  }

  /**
   * Add a custom handler for specific URL patterns
   */
  public addHandler(pattern: RegExp, handler: (matches: RegExpMatchArray, url: string) => void): void {
    this.handlers.push({ pattern, handler });
  }

  /**
   * Remove all event listeners (cleanup)
   */
  public cleanup(): void {
    Linking.removeAllListeners('url');
    this.isInitialized = false;
    console.log('[DeepLinkService] Cleaned up');
  }
}

// Export singleton instance
export const deepLinkService = new DeepLinkService();
export default deepLinkService;
