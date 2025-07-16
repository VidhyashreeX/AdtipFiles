// Deep Link Service for handling incoming deep links
import { Linking } from 'react-native';
import { navigationRef } from '../navigation/NavigationService';
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
   * Handle incoming deep link
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

    this.navigateToScreen(parsedLink);
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
   * Navigate to the parsed screen
   */
  private navigateToScreen(parsedLink: ParsedDeepLink): void {
    if (!navigationRef.isReady()) {
      console.warn('[DeepLinkService] Navigation not ready, queuing navigation');
      setTimeout(() => this.navigateToScreen(parsedLink), 100);
      return;
    }

    try {
      console.log('[DeepLinkService] Navigating to:', parsedLink.screen, parsedLink.params);
      
      // Navigate to the appropriate screen
      if (parsedLink.screen === 'Meeting' || parsedLink.screen === 'MeetingSimple') {
        // Direct navigation for call screens
        (navigationRef as any).navigate(parsedLink.screen, parsedLink.params);
      } else {
        // Navigate through Main navigator for other screens
        (navigationRef as any).navigate('Main', {
          screen: parsedLink.screen,
          params: parsedLink.params,
        });
      }
    } catch (error) {
      console.error('[DeepLinkService] Navigation error:', error);
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
