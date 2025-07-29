/**
 * Premium Access Utilities
 * 
 * Centralized utilities for managing premium access restrictions
 * across calling and chat features in the React Native app.
 */

import { Alert } from 'react-native';
import { useMemo } from 'react';
import { Logger } from '../utils/ProductionLogger';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../contexts/AuthContext';

export interface PremiumAccessResult {
  hasAccess: boolean;
  shouldShowUpgradeModal: boolean;
  restrictionReason?: string;
}

export interface PremiumAccessOptions {
  feature: 'voice_call' | 'video_call' | 'chat' | 'general';
  userId?: string | number;
  isPremium: boolean;
  showAlert?: boolean;
  customMessage?: string;
}

/**
 * Check if user has premium access to a specific feature
 */
export const checkPremiumAccess = (options: PremiumAccessOptions): PremiumAccessResult => {
  const { feature, isPremium, showAlert = false, customMessage } = options;

  // Premium users always have access
  if (isPremium) {
    return {
      hasAccess: true,
      shouldShowUpgradeModal: false,
    };
  }

  // Non-premium users are restricted
  const featureMessages = {
    voice_call: 'Voice calling is available for premium users only. Upgrade to premium to make voice calls.',
    video_call: 'Video calling is available for premium users only. Upgrade to premium to make video calls.',
    chat: 'Chat feature is available for premium users only. Upgrade to premium to start chatting.',
    general: 'This feature is available for premium users only. Upgrade to premium to access all features.',
  };

  const restrictionReason = customMessage || featureMessages[feature];

  // Show alert if requested
  if (showAlert) {
    Alert.alert(
      'Premium Feature',
      restrictionReason,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => {
          Logger.info('PremiumAccess', `User prompted to upgrade for ${feature}`);
        }}
      ]
    );
  }

  Logger.info('PremiumAccess', `Access denied for ${feature} - user not premium`);

  return {
    hasAccess: false,
    shouldShowUpgradeModal: true,
    restrictionReason,
  };
};

/**
 * Premium access hook result interface
 */
export interface UsePremiumAccessResult {
  checkAccess: (feature: 'voice_call' | 'video_call' | 'chat' | 'general') => PremiumAccessResult;
  hasVoiceCallAccess: boolean;
  hasVideoCallAccess: boolean;
  hasChatAccess: boolean;
  isPremium: boolean;
}

/**
 * Utility function to create premium access checker for a component
 */
export const createPremiumAccessChecker = (isPremium: boolean, userId?: string | number) => {
  return {
    checkVoiceCallAccess: (showAlert = false) => 
      checkPremiumAccess({ feature: 'voice_call', isPremium, userId, showAlert }),
    
    checkVideoCallAccess: (showAlert = false) => 
      checkPremiumAccess({ feature: 'video_call', isPremium, userId, showAlert }),
    
    checkChatAccess: (showAlert = false) => 
      checkPremiumAccess({ feature: 'chat', isPremium, userId, showAlert }),
    
    checkGeneralAccess: (showAlert = false) => 
      checkPremiumAccess({ feature: 'general', isPremium, userId, showAlert }),
    
    // Convenience properties
    hasVoiceCallAccess: isPremium,
    hasVideoCallAccess: isPremium,
    hasChatAccess: isPremium,
    isPremium,
  };
};

/**
 * Premium feature restriction messages
 */
export const PREMIUM_RESTRICTION_MESSAGES = {
  VOICE_CALL: 'Voice calling is available for premium users only.',
  VIDEO_CALL: 'Video calling is available for premium users only.',
  CHAT: 'Chat feature is available for premium users only.',
  GENERAL: 'This feature is available for premium users only.',
  UPGRADE_CTA: 'Upgrade to premium to access all features.',
} as const;

/**
 * Log premium access attempts for analytics
 */
export const logPremiumAccessAttempt = (
  feature: string,
  isPremium: boolean,
  userId?: string | number,
  additionalData?: Record<string, any>
) => {
  Logger.info('PremiumAccessAttempt', {
    feature,
    isPremium,
    userId,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * React hook for premium access management
 * Provides convenient access to premium checking functionality
 */
export const usePremiumAccess = (): UsePremiumAccessResult => {
  const { user } = useAuth();
  const { isPremium } = useWallet();

  const premiumChecker = useMemo(() =>
    createPremiumAccessChecker(isPremium, user?.id),
    [isPremium, user?.id]
  );

  const checkAccess = useMemo(() =>
    (feature: 'voice_call' | 'video_call' | 'chat' | 'general') =>
      checkPremiumAccess({ feature, isPremium, userId: user?.id }),
    [isPremium, user?.id]
  );

  return {
    checkAccess,
    hasVoiceCallAccess: isPremium,
    hasVideoCallAccess: isPremium,
    hasChatAccess: isPremium,
    isPremium,
  };
};

// Re-export the specialized modal component for easy access
export { default as PremiumAccessModal } from '../components/modals/PremiumAccessModal';
