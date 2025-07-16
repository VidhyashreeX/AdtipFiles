// Share Service for generating and sharing deep links
import { Share, Alert } from 'react-native';
import { generateDeepLink, generateUniversalLink, DEEP_LINK_PATTERNS } from '../config/deepLinkConfig';

export interface ShareContent {
  title: string;
  message: string;
  url: string;
  subject?: string;
}

export interface ShareOptions {
  useUniversalLink?: boolean;
  includeAppName?: boolean;
  customMessage?: string;
}

class ShareService {
  private readonly APP_NAME = 'Adtip';
  private readonly APP_DESCRIPTION = 'Join me on Adtip - The ultimate social platform for earning and entertainment!';

  /**
   * Share a post
   */
  public async sharePost(
    postId: number,
    postTitle?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink('POST', { postId: postId.toString() })
      : generateDeepLink('POST', { postId: postId.toString() });

    const title = postTitle || 'Check out this amazing post!';
    const message = options.customMessage || 
      `${title}\n\n${options.includeAppName ? `Shared via ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME}`,
    });
  }

  /**
   * Share a user profile
   */
  public async shareProfile(
    userId: number,
    userName?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink('PROFILE', { userId: userId.toString() })
      : generateDeepLink('PROFILE', { userId: userId.toString() });

    const title = userName ? `Check out ${userName}'s profile!` : 'Check out this profile!';
    const message = options.customMessage || 
      `${title}\n\n${options.includeAppName ? `Join me on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME}`,
    });
  }

  /**
   * Share a short video
   */
  public async shareShort(
    shortId: string,
    shortTitle?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink
      ? generateUniversalLink('SHORT', { shortId })
      : generateDeepLink('SHORT', { shortId });

    const title = shortTitle || 'Watch this amazing short video!';
    const message = options.customMessage ||
      `${title}\n\n${options.includeAppName ? `Watch on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME}`,
    });
  }

  /**
   * Share a video
   */
  public async shareVideo(
    videoId: number,
    videoTitle?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink
      ? generateUniversalLink('VIDEO_PLAYER', { videoId: videoId.toString() })
      : generateDeepLink('VIDEO_PLAYER', { videoId: videoId.toString() });

    const title = videoTitle || 'Watch this amazing video!';
    const message = options.customMessage ||
      `${title}\n\n${options.includeAppName ? `Watch on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME}`,
    });
  }

  /**
   * Share app with referral code
   */
  public async shareApp(
    referralCode?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = referralCode 
      ? (options.useUniversalLink 
          ? generateUniversalLink('INVITE', { referralCode })
          : generateDeepLink('INVITE', { referralCode }))
      : (options.useUniversalLink 
          ? generateUniversalLink('HOME', {})
          : generateDeepLink('HOME', {}));

    const title = `Join me on ${this.APP_NAME}!`;
    const message = options.customMessage || 
      `${this.APP_DESCRIPTION}\n\n${referralCode ? 'Use my referral code to get started!\n' : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `Join me on ${this.APP_NAME}!`,
    });
  }

  /**
   * Share a product from shop
   */
  public async shareProduct(
    productId: number,
    productName?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink('PRODUCT', { productId: productId.toString() })
      : generateDeepLink('PRODUCT', { productId: productId.toString() });

    const title = productName ? `Check out ${productName}!` : 'Check out this amazing product!';
    const message = options.customMessage || 
      `${title}\n\n${options.includeAppName ? `Shop on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME} Shop`,
    });
  }

  /**
   * Share a live stream
   */
  public async shareLiveStream(
    streamId: string,
    streamTitle?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink('LIVE_STREAM', { streamId })
      : generateDeepLink('LIVE_STREAM', { streamId });

    const title = streamTitle ? `Join my live stream: ${streamTitle}` : 'Join my live stream!';
    const message = options.customMessage || 
      `${title}\n\n${options.includeAppName ? `Watch live on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME} Live`,
    });
  }

  /**
   * Share a game or challenge
   */
  public async shareGame(
    gameId: string,
    gameTitle?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink('LUDO_GAME', { gameId })
      : generateDeepLink('LUDO_GAME', { gameId });

    const title = gameTitle ? `Join my game: ${gameTitle}` : 'Join my game!';
    const message = options.customMessage || 
      `${title}\n\n${options.includeAppName ? `Play on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME} Games`,
    });
  }

  /**
   * Generic share method for custom content
   */
  public async shareCustom(
    pattern: keyof typeof DEEP_LINK_PATTERNS,
    params: Record<string, string | number>,
    title: string,
    customMessage?: string,
    options: ShareOptions = {}
  ): Promise<void> {
    const url = options.useUniversalLink 
      ? generateUniversalLink(pattern, params)
      : generateDeepLink(pattern, params);

    const message = customMessage || 
      `${title}\n\n${options.includeAppName ? `Check it out on ${this.APP_NAME}\n` : ''}${url}`;

    await this.shareContent({
      title,
      message,
      url,
      subject: `${title} - ${this.APP_NAME}`,
    });
  }

  /**
   * Core share functionality
   */
  private async shareContent(content: ShareContent): Promise<void> {
    try {
      const result = await Share.share({
        title: content.title,
        message: content.message,
        url: content.url,
      }, {
        subject: content.subject,
        dialogTitle: 'Share via',
      });

      if (result.action === Share.sharedAction) {
        console.log('[ShareService] Content shared successfully');
        if (result.activityType) {
          console.log('[ShareService] Shared via:', result.activityType);
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('[ShareService] Share dismissed');
      }
    } catch (error) {
      console.error('[ShareService] Error sharing content:', error);
      Alert.alert(
        'Share Error',
        'Unable to share content. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Copy link to clipboard
   */
  public async copyToClipboard(
    pattern: keyof typeof DEEP_LINK_PATTERNS,
    params: Record<string, string | number>,
    useUniversalLink: boolean = true
  ): Promise<void> {
    try {
      const Clipboard = await import('@react-native-clipboard/clipboard');
      const url = useUniversalLink 
        ? generateUniversalLink(pattern, params)
        : generateDeepLink(pattern, params);

      await Clipboard.default.setString(url);
      Alert.alert(
        'Link Copied',
        'Link has been copied to clipboard!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[ShareService] Error copying to clipboard:', error);
      Alert.alert(
        'Copy Error',
        'Unable to copy link. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Generate shareable text with deep link
   */
  public generateShareText(
    title: string,
    url: string,
    includeAppName: boolean = true
  ): string {
    return `${title}\n\n${includeAppName ? `Shared via ${this.APP_NAME}\n` : ''}${url}`;
  }

  /**
   * Validate if a URL is a valid deep link for this app
   */
  public isValidDeepLink(url: string): boolean {
    return url.startsWith('adtip://') ||
           url.startsWith('https://adtip.in') ||
           url.startsWith('https://www.adtip.in') ||
           url.startsWith('https://app.adtip.in');
  }
}

// Export singleton instance
export const shareService = new ShareService();
export default shareService;
