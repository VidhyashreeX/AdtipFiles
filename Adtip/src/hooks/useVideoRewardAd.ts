import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/ApiService';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARD_INTERVAL = 5;
const NON_PREMIUM_REWARD = 0.03;
const PREMIUM_REWARD = 0.10;

interface UseVideoRewardAdProps {
  isPremium: boolean;
  isGuest: boolean;
  userId?: number;
  hasEarnedReward?: boolean;
}

interface UseVideoRewardAdReturn {
  videoCount: number;
  showRewardPopup: boolean;
  earnedAmount: number;
  handleVideoViewed: () => void;
  handleRewardPopupAction: (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => Promise<void>;
  closeRewardPopup: () => void;
  showRewardAd: () => void;
}

export const useVideoRewardAd = ({
  isPremium,
  isGuest,
  userId,
  hasEarnedReward
}: UseVideoRewardAdProps): UseVideoRewardAdReturn => {
  const [videoCount, setVideoCount] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [isDevelopmentMode] = useState(__DEV__);

  // Handle video view for reward ads (triggered on scroll/view, not completion)
  const handleVideoViewed = useCallback(() => {
    if (isGuest) return;

    setVideoCount(prev => {
      const newCount = prev + 1;
      console.log(`🎬 [useVideoRewardAd] Video viewed. Count: ${newCount}`);
      
      // Only show reward ad after exactly 5th video
      if (newCount === 5) {
        console.log('🎁 [useVideoRewardAd] 5th video reached! Showing reward ad...');
        showRewardAd();
        // Reset count after showing ad
        return 0;
      }
      
      return newCount;
    });
  }, [isGuest]);

  // Show reward ad
  const showRewardAd = useCallback(() => {
    console.log('🎁 [useVideoRewardAd] Showing reward ad...');
    
    // Determine reward amount based on premium status
    const rewardAmount = isPremium ? PREMIUM_REWARD : NON_PREMIUM_REWARD;
    setEarnedAmount(rewardAmount);
    
    // In development mode, just show popup without API call
    if (isDevelopmentMode) {
      console.log('🔧 [useVideoRewardAd] Development mode: Showing popup without API call');
      setShowRewardPopup(true);
      return;
    }
    
    // In production, show actual reward ad
    console.log('🎁 [useVideoRewardAd] Production mode: Would show actual reward ad');
    setShowRewardPopup(true);
  }, [isPremium, isDevelopmentMode]);

  // Listen for reward from external ad system
  useEffect(() => {
    if (hasEarnedReward) {
      console.log('[useVideoRewardAd] User earned reward from ad');
      const amount = isPremium ? PREMIUM_REWARD : NON_PREMIUM_REWARD;
      setEarnedAmount(amount);
      setShowRewardPopup(true);
    }
  }, [hasEarnedReward, isPremium]);

  // Credit wallet with reward amount
  const creditWallet = useCallback(async () => {
    if (!userId || isDevelopmentMode) {
      if (isDevelopmentMode) {
        console.log('🔧 [useVideoRewardAd] Development mode: Skipping wallet credit');
      }
      return;
    }

    try {
      console.log('💰 [useVideoRewardAd] Crediting wallet with amount:', earnedAmount);
      
      // Use ApiService instead of direct fetch
      await ApiService.creditAdReward({ 
        userId, 
        amount: earnedAmount 
      });
      
      console.log('✅ [useVideoRewardAd] Wallet credited successfully');
    } catch (error) {
      console.error('❌ [useVideoRewardAd] Error crediting wallet:', error);
      throw error;
    }
  }, [userId, earnedAmount, isDevelopmentMode]);

  // Handle reward popup actions
  const handleRewardPopupAction = useCallback(async (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => {
    console.log(`🎁 [useVideoRewardAd] Reward popup action: ${action}`);
    
    // Close popup first
    setShowRewardPopup(false);
    
    // Credit wallet for all actions except cancel
    if (action !== 'cancel') {
      try {
        await creditWallet();
      } catch (error) {
        Alert.alert('Error', 'Failed to credit reward to wallet.');
      }
    }
  }, [creditWallet]);

  // Simple close function
  const closeRewardPopup = useCallback(() => {
    setShowRewardPopup(false);
  }, []);

  return {
    videoCount,
    showRewardPopup,
    earnedAmount,
    handleVideoViewed,
    handleRewardPopupAction,
    closeRewardPopup,
    showRewardAd,
  };
};

export default useVideoRewardAd;
