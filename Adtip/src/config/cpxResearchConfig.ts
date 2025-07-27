/**
 * CPX Research SDK Configuration
 * 
 * This file contains all configuration settings for the CPX Research SDK integration.
 * It handles survey monetization with 4x earning potential for premium users.
 */

import { CPX_RESEARCH_APP_ID } from '../constants/api';

// CPX Research Widget Configuration Types
export interface CPXCornerWidgetConfig {
  backgroundColor: string;
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  roundedCorners: number;
  size: number;
  text: string;
  textColor: string;
  textSize: number;
}

export interface CPXNotificationWidgetConfig {
  backgroundColor: string;
  height: number;
  isSingleSurvey: boolean;
  position: 'top' | 'bottom';
  roundedCorners: number;
  text: string;
  textColor: string;
  textSize: number;
  width: number;
}

export interface CPXSidebarWidgetConfig {
  backgroundColor: string;
  height: number;
  position: 'left' | 'right';
  roundedCorners: number;
  text: string;
  textColor: string;
  textSize: number;
  width: number;
}

export interface CPXResearchConfig {
  appId: string;
  userId: string;
  accentColor: string;
  isHidden: boolean;
  cornerWidget?: CPXCornerWidgetConfig;
  notificationWidget?: CPXNotificationWidgetConfig;
  sidebarWidget?: CPXSidebarWidgetConfig;
}

// Default theme colors that match the app's design system
export const CPX_THEME_COLORS = {
  primary: '#24d05a', // App's primary green
  secondary: '#6b48ff', // App's secondary purple
  background: '#f8fafc',
  text: '#0f172a',
  accent: '#00C853', // App's accent green for premium features
  premium: '#FFD700', // Gold for premium features
};

/**
 * Creates CPX Research configuration for authenticated users
 */
export const createCPXConfig = (
  userId: string | number,
  isPremium: boolean = false,
  isDarkMode: boolean = false
): CPXResearchConfig => {
  const baseColor = isPremium ? CPX_THEME_COLORS.premium : CPX_THEME_COLORS.primary;
  const backgroundColor = isDarkMode ? '#000000' : CPX_THEME_COLORS.background;
  const textColor = isDarkMode ? '#ffffff' : CPX_THEME_COLORS.text;

  return {
    appId: CPX_RESEARCH_APP_ID,
    userId: userId.toString(),
    accentColor: baseColor,
    isHidden: false, // Keep the component active for webview functionality
    // No widgets - component will be invisible but functional
  };
};

/**
 * Creates CPX Research configuration for guest users (limited functionality)
 */
export const createGuestCPXConfig = (): CPXResearchConfig => {
  return {
    appId: CPX_RESEARCH_APP_ID,
    userId: 'guest_user',
    accentColor: CPX_THEME_COLORS.secondary,
    isHidden: true, // Hide for guest users initially
  };
};

/**
 * Survey completion callback configuration
 */
export interface CPXCallbacks {
  onSurveysUpdate?: (surveys: any[]) => void;
  onTransactionsUpdate?: (transactions: any[]) => void;
  onWebViewWasClosed?: () => void;
  onSurveyCompleted?: (surveyId: string, reward: number) => void;
  onError?: (error: string) => void;
}

/**
 * Default callbacks for handling CPX Research events
 */
export const createCPXCallbacks = (
  onRewardEarned?: (amount: number, isPremium: boolean) => void
): CPXCallbacks => {
  return {
    onSurveysUpdate: (surveys) => {
      console.log('CPX Research: Surveys updated', surveys?.length || 0);
    },
    onTransactionsUpdate: (transactions) => {
      console.log('CPX Research: Transactions updated', transactions?.length || 0);
      
      // Handle reward processing
      if (transactions && transactions.length > 0) {
        const latestTransaction = transactions[transactions.length - 1];
        if (latestTransaction && latestTransaction.status === 'completed') {
          const reward = parseFloat(latestTransaction.amount || '0');
          const isPremium = latestTransaction.user_type === 'premium';
          onRewardEarned?.(reward, isPremium);
        }
      }
    },
    onWebViewWasClosed: () => {
      console.log('CPX Research: WebView closed');
    },
    onSurveyCompleted: (surveyId, reward) => {
      console.log(`CPX Research: Survey ${surveyId} completed with reward: ${reward}`);
    },
    onError: (error) => {
      console.error('CPX Research Error:', error);
    },
  };
};

/**
 * Utility function to calculate premium multiplier
 */
export const calculatePremiumReward = (baseReward: number, isPremium: boolean): number => {
  return isPremium ? baseReward * 4 : baseReward;
};

/**
 * Format reward amount for display
 */
export const formatRewardAmount = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toFixed(2)}`;
};
