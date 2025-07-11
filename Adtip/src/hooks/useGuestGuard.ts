import React, { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// List of screens that guest users are allowed to access
const GUEST_ALLOWED_SCREENS = [
  'Home',
  'TipTube', 
  'TipShorts',
  'GuestTabs',
  // Add any other screens that guests should be able to access
];

// List of actions that guest users are restricted from
const GUEST_RESTRICTED_ACTIONS = [
  'like',
  'comment', 
  'share',
  'follow',
  'create_content',
  'video_call',
  'profile_view',
  'channel_view',
  'settings',
  'wallet',
  'earnings',
  'notifications',
  'premium',
  'upload',
];

export interface GuestGuardResult {
  isAllowed: boolean;
  showLoginPrompt: () => void;
  hideLoginPrompt: () => void;
  loginPromptVisible: boolean;
  loginPromptMessage: string;
  checkScreenAccess: (screenName: string) => boolean;
  checkActionAccess: (actionName: string) => boolean;
  requireAuth: (action: string, callback?: () => void) => void;
}

/**
 * Hook to manage guest mode restrictions and login prompts
 */
export const useGuestGuard = (): GuestGuardResult => {
  const { isGuest } = useAuth();
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');

  /**
   * Check if a screen is accessible to guest users
   */
  const checkScreenAccess = useCallback((screenName: string): boolean => {
    if (!isGuest) return true; // Authenticated users can access all screens
    return GUEST_ALLOWED_SCREENS.includes(screenName);
  }, [isGuest]);

  /**
   * Check if an action is allowed for guest users
   */
  const checkActionAccess = useCallback((actionName: string): boolean => {
    if (!isGuest) return true; // Authenticated users can perform all actions
    return !GUEST_RESTRICTED_ACTIONS.includes(actionName);
  }, [isGuest]);

  /**
   * Show login prompt with custom message
   */
  const showLoginPrompt = useCallback((message?: string) => {
    if (message) {
      setLoginPromptMessage(message);
    }
    setLoginPromptVisible(true);
  }, []);

  /**
   * Hide login prompt
   */
  const hideLoginPrompt = useCallback(() => {
    setLoginPromptVisible(false);
  }, []);

  /**
   * Require authentication for an action
   * If user is guest, show login prompt
   * If user is authenticated, execute callback
   */
  const requireAuth = useCallback((action: string, callback?: () => void) => {
    if (isGuest) {
      const actionMessages: Record<string, string> = {
        like: 'Login to like posts and videos',
        comment: 'Login to comment on posts and videos',
        share: 'Login to share content',
        follow: 'Login to follow users and channels',
        create_content: 'Login to create and upload content',
        video_call: 'Login to make video calls',
        profile_view: 'Login to view user profiles',
        channel_view: 'Login to view channels',
        settings: 'Login to access settings',
        wallet: 'Login to access your wallet',
        earnings: 'Login to view your earnings',
        notifications: 'Login to view notifications',
        premium: 'Login to access premium features',
        upload: 'Login to upload content',
      };

      const message = actionMessages[action] || `Login to ${action}`;
      showLoginPrompt(message);
      return;
    }

    // User is authenticated, execute callback
    if (callback) {
      callback();
    }
  }, [isGuest, showLoginPrompt]);

  return {
    isAllowed: !isGuest, // Guest users have restricted access
    showLoginPrompt,
    hideLoginPrompt,
    loginPromptVisible,
    loginPromptMessage,
    checkScreenAccess,
    checkActionAccess,
    requireAuth,
  };
};

/**
 * Higher-order component to protect screens from guest access
 */
export const withGuestGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string,
  fallbackMessage?: string
) => {
  return (props: P) => {
    const { checkScreenAccess, showLoginPrompt } = useGuestGuard();

    if (!checkScreenAccess(screenName)) {
      // @ts-ignoreShow login prompt immediately for restricted screens
      showLoginPrompt(fallbackMessage || `Login to access ${screenName}`);
      return null; // Don't render the component
    }

    return React.createElement(WrappedComponent, props);
  };
};

/**
 * Navigation guard function to check if navigation is allowed
 */
export const useNavigationGuard = () => {
  const { checkScreenAccess, requireAuth } = useGuestGuard();

  const guardNavigation = useCallback((screenName: string, navigationCallback: () => void) => {
    if (checkScreenAccess(screenName)) {
      navigationCallback();
    } else {
      requireAuth(`access ${screenName}`);
    }
  }, [checkScreenAccess, requireAuth]);

  return { guardNavigation };
};

export default useGuestGuard;
