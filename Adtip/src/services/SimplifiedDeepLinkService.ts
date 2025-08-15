// src/services/SimplifiedDeepLinkService.ts
import { Linking } from 'react-native';
import { navigationRef } from '../navigation/NavigationService';
import { Logger } from '../utils/ProductionLogger';
import { DEEP_LINK_PREFIXES } from '../config/deepLinkConfig';
import NavigationAnalyticsService from './NavigationAnalyticsService';

export interface DeepLinkRoute {
  screen: string;
  params?: Record<string, any>;
  navigator?: 'Main' | 'Auth' | 'Guest';
}

export interface DeepLinkPattern {
  pattern: RegExp;
  handler: (matches: RegExpMatchArray) => DeepLinkRoute;
}

class SimplifiedDeepLinkService {
  private patterns: DeepLinkPattern[] = [];
  private isInitialized = false;
  private pendingLink: string | null = null;

  constructor() {
    this.setupPatterns();
  }

  /**
   * Initialize the service
   */
  initialize(): (() => void) | undefined {
    if (this.isInitialized) return;

    // Handle initial URL
    this.handleInitialURL();

    // Listen for incoming URLs
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    this.isInitialized = true;
    Logger.info('SimplifiedDeepLinkService', 'Initialized successfully');

    // Return cleanup function
    return () => {
      subscription?.remove();
      this.isInitialized = false;
    };
  }

  /**
   * Handle initial URL when app is opened from deep link
   */
  private async handleInitialURL(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        Logger.debug('SimplifiedDeepLinkService', 'Initial URL detected:', initialUrl);
        // Store for later processing when navigation is ready
        this.pendingLink = initialUrl;
      }
    } catch (error) {
      Logger.error('SimplifiedDeepLinkService', 'Failed to get initial URL:', error);
    }
  }

  /**
   * Process pending deep link when navigation becomes ready
   */
  processPendingLink(): void {
    if (this.pendingLink && navigationRef.isReady()) {
      const link = this.pendingLink;
      this.pendingLink = null;
      this.handleDeepLink(link);
    }
  }

  /**
   * Handle incoming deep link
   */
  handleDeepLink(url: string): void {
    Logger.debug('SimplifiedDeepLinkService', 'Handling deep link:', url);

    if (!this.isValidDeepLink(url)) {
      Logger.warn('SimplifiedDeepLinkService', 'Invalid deep link:', url);
      NavigationAnalyticsService.getInstance().trackDeepLink(url, 'unknown', false);
      return;
    }

    const route = this.parseDeepLink(url);
    if (!route) {
      Logger.warn('SimplifiedDeepLinkService', 'Failed to parse deep link:', url);
      NavigationAnalyticsService.getInstance().trackDeepLink(url, 'unknown', false);
      return;
    }

    this.navigateToRoute(route);

    // Track deep link analytics
    NavigationAnalyticsService.getInstance().trackDeepLink(url, route.screen, true);
  }

  /**
   * Check if URL is valid for this app
   */
  private isValidDeepLink(url: string): boolean {
    return DEEP_LINK_PREFIXES.some(prefix => url.startsWith(prefix));
  }

  /**
   * Parse deep link URL into navigation route
   */
  private parseDeepLink(url: string): DeepLinkRoute | null {
    for (const { pattern, handler } of this.patterns) {
      const matches = url.match(pattern);
      if (matches) {
        try {
          return handler(matches);
        } catch (error) {
          Logger.error('SimplifiedDeepLinkService', 'Error in pattern handler:', error);
        }
      }
    }
    return null;
  }

  /**
   * Navigate to the parsed route
   */
  private navigateToRoute(route: DeepLinkRoute): void {
    if (!navigationRef.isReady()) {
      Logger.warn('SimplifiedDeepLinkService', 'Navigation not ready, storing link for later');
      // Store for later processing
      this.pendingLink = JSON.stringify(route);
      return;
    }

    try {
      const navigator = route.navigator || 'Main';

      Logger.debug('SimplifiedDeepLinkService', 'Navigating to:', {
        navigator,
        screen: route.screen,
        params: route.params,
      });

      // Handle root-level screens (like Meeting) differently
      if (navigator === null || route.screen === 'Meeting' || route.screen === 'MeetingSimple') {
        // Direct navigation to root-level screens
        Logger.debug('SimplifiedDeepLinkService', 'Direct navigation to root-level screen:', route.screen);
        navigationRef.navigate(route.screen as any, route.params);
      } else if (navigator === 'Main') {
        // Navigation through Main navigator
        navigationRef.navigate('Main' as any, {
          screen: route.screen,
          params: route.params,
        });
      } else {
        // Navigation through other navigators
        navigationRef.navigate(navigator as any, {
          screen: route.screen,
          params: route.params,
        });
      }
    } catch (error) {
      Logger.error('SimplifiedDeepLinkService', 'Navigation failed:', error);
      
      // Fallback: try direct navigation
      try {
        navigationRef.navigate(route.screen as any, route.params);
      } catch (fallbackError) {
        Logger.error('SimplifiedDeepLinkService', 'Fallback navigation also failed:', fallbackError);
      }
    }
  }

  /**
   * Setup URL patterns and their handlers
   */
  private setupPatterns(): void {
    this.patterns = [
      // Post: adtip://post/123 or https://adtip.in/post/123
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)post\/(\d+)/,
        handler: (matches) => ({
          screen: 'PostViewer',
          params: { postId: matches[1] },
          navigator: 'Main',
        }),
      },

      // Video: adtip://watch/123 or https://adtip.in/watch/123
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)watch\/(\d+)/,
        handler: (matches) => ({
          screen: 'Video',
          params: { videoId: matches[1] },
          navigator: 'Main',
        }),
      },

      // Short: adtip://short/123 or https://adtip.in/short/123
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)short\/(\w+)/,
        handler: (matches) => ({
          screen: 'TipShorts',
          params: { shortId: matches[1] },
          navigator: 'Main',
        }),
      },

      // User Profile: adtip://user/123 or https://adtip.in/user/123
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)user\/(\d+)/,
        handler: (matches) => ({
          screen: 'Profile',
          params: { userId: parseInt(matches[1]) },
          navigator: 'Main',
        }),
      },

      // Channel: adtip://channel/123 or https://adtip.in/channel/123
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)channel\/(\d+)/,
        handler: (matches) => ({
          screen: 'Channel',
          params: { channelId: matches[1] },
          navigator: 'Main',
        }),
      },

      // Home sections
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)home/,
        handler: () => ({
          screen: 'Home',
          navigator: 'Main',
        }),
      },

      // TipTube
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)tiptube/,
        handler: () => ({
          screen: 'TipTube',
          navigator: 'Main',
        }),
      },

      // Wallet
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)wallet/,
        handler: () => ({
          screen: 'Wallet',
          navigator: 'Main',
        }),
      },

      // Settings
      {
        pattern: /(?:adtip:\/\/|https:\/\/(?:www\.)?adtip\.in\/)settings/,
        handler: () => ({
          screen: 'Settings',
          navigator: 'Main',
        }),
      },

      // Meeting/Call deep links - these should navigate to Meeting screen (root level)
      {
        pattern: /adtip:\/\/meeting\?(.+)/,
        handler: (matches) => {
          const queryString = matches[1];
          const params = new URLSearchParams(queryString);

          return {
            screen: 'Meeting',
            params: {
              meetingId: params.get('meetingId') || 'unknown',
              token: params.get('token') || 'unknown',
              displayName: 'User', // Default display name
              callType: params.get('callType') || 'video',
              isInitiator: false,
              recipientName: params.get('callerName') || 'Unknown Caller',
              callData: {
                sessionId: params.get('sessionId') || `session-${Date.now()}`,
                direction: 'incoming',
                type: params.get('callType') || 'video',
                callerName: params.get('callerName') || 'Unknown Caller'
              }
            },
            navigator: null, // Meeting is at root level, not nested
          };
        },
      },

      // Call deep links with path parameters
      {
        pattern: /adtip:\/\/call\/(\w+)\/(.+)/,
        handler: (matches) => {
          const callType = matches[1]; // incoming, outgoing, active, etc.
          const pathParams = matches[2].split('/');

          // Extract sessionId, meetingId, token from path
          const sessionId = pathParams[0] || `session-${Date.now()}`;
          const meetingId = pathParams[1] || `meeting-${Date.now()}`;
          const token = pathParams[2] ? decodeURIComponent(pathParams[2]) : `token-${Date.now()}`;

          return {
            screen: 'Meeting',
            params: {
              meetingId,
              token,
              displayName: 'User',
              callType: 'video',
              isInitiator: callType === 'outgoing',
              callData: {
                sessionId,
                direction: callType === 'outgoing' ? 'outgoing' : 'incoming',
                type: 'video'
              }
            },
            navigator: null, // Meeting is at root level
          };
        },
      },

      // Fallback for any other adtip:// links - go to home
      {
        pattern: /adtip:\/\/.*/,
        handler: () => ({
          screen: 'Home',
          navigator: 'Main',
        }),
      },
    ];

    Logger.debug('SimplifiedDeepLinkService', `Setup ${this.patterns.length} URL patterns`);
  }

  /**
   * Add custom pattern
   */
  addPattern(pattern: RegExp, handler: (matches: RegExpMatchArray) => DeepLinkRoute): void {
    this.patterns.unshift({ pattern, handler });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.isInitialized = false;
    this.pendingLink = null;
    Logger.debug('SimplifiedDeepLinkService', 'Cleaned up');
  }
}

export default new SimplifiedDeepLinkService();
