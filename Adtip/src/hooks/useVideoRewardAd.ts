import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/ApiService';
import { useNavigation } from '@react-navigation/native';
import { useRewardedAd } from '../googleads';
import { useUserPremiumStatus } from '../contexts/UserDataContext';

const NON_PREMIUM_REWARD = 0.03;
const PREMIUM_REWARD = 0.10;

interface UseVideoRewardAdProps {
  isGuest: boolean;
  userId?: number;
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
  isGuest,
  userId
}: UseVideoRewardAdProps): UseVideoRewardAdReturn => {
  const [videoCount, setVideoCount] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [hasBeenCredited, setHasBeenCredited] = useState(false);
  const navigation = useNavigation();

  // Get premium status using the same logic as the header toggle
  const { isPremium } = useUserPremiumStatus();

  // Initialize rewarded ad
  const { isLoaded, showAd, hasEarnedReward, reward } = useRewardedAd();

  // Handle reward earned from actual ad
  useEffect(() => {
    if (hasEarnedReward && reward) {
      console.log('🎉 [useVideoRewardAd] User earned reward from ad:', reward);
      const rewardAmount = isPremium ? PREMIUM_REWARD : NON_PREMIUM_REWARD;
      setEarnedAmount(rewardAmount);
      setShowRewardPopup(true);
      // Note: creditWallet will be called when user interacts with popup, not immediately
    }
  }, [hasEarnedReward, reward, isPremium]);

  // Handle video view for reward ads (triggered on scroll/view, not completion)
  const handleVideoViewed = useCallback(() => {
    if (isGuest) {
      console.log('🚫 [useVideoRewardAd] Guest user - skipping video count');
      return;
    }

    if (!userId) {
      console.log('🚫 [useVideoRewardAd] No userId - skipping video count');
      return;
    }

    setVideoCount(prev => {
      const newCount = prev + 1;
      console.log(`🎬 [useVideoRewardAd] Video viewed. Count: ${newCount}/5 (User: ${userId}, Premium: ${isPremium})`);

      // Only show reward ad after exactly 10th video
      if (newCount === 10) {
        console.log('🎁 [useVideoRewardAd] 10th video reached! Showing reward ad...');
        setHasBeenCredited(false); // Reset credit tracking for new reward cycle
        showRewardAd();
        // Reset count after showing ad
        return 0;
      }

      return newCount;
    });
  }, [isGuest, userId, isPremium]);

  // Show reward ad
  const showRewardAd = useCallback(() => {
    console.log('🎁 [useVideoRewardAd] Showing reward ad...');

    if (isLoaded) {
      // Show the actual rewarded ad
      console.log('📺 [useVideoRewardAd] Displaying Google AdMob rewarded ad');
      showAd();
    } else {

      console.log('⚠️ [useVideoRewardAd] Ad not loaded, showing direct reward');
      const rewardAmount = isPremium ? PREMIUM_REWARD : NON_PREMIUM_REWARD;
      setEarnedAmount(rewardAmount);
      setShowRewardPopup(true);
      // Note: creditWallet will be called when user interacts with popup, not immediately
    }
  }, [isPremium, isLoaded, showAd]);

  // Reward system is self-contained - no external ad system integration needed

  // Credit wallet with reward amount
  const creditWallet = useCallback(async (amount?: number) => {
    if (!userId) {
      console.log('❌ [useVideoRewardAd] No userId provided, skipping wallet credit');
      return;
    }

    const amountToCredit = amount || earnedAmount;
    if (!amountToCredit || amountToCredit <= 0) {
      console.log('❌ [useVideoRewardAd] Invalid amount, skipping wallet credit:', amountToCredit);
      return;
    }

    try {
      console.log('💰 [useVideoRewardAd] Crediting wallet with amount:', amountToCredit);

      // Use ApiService instead of direct fetch
      await ApiService.creditAdReward({
        userId,
        amount: amountToCredit
      });

      console.log('✅ [useVideoRewardAd] Wallet credited successfully');
    } catch (error) {
      console.error('❌ [useVideoRewardAd] Error crediting wallet:', error);
      throw error;
    }
  }, [userId, earnedAmount]);

  // Handle reward popup actions
  const handleRewardPopupAction = useCallback(async (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => {
    console.log(`🎁 [useVideoRewardAd] Reward popup action: ${action}`);

    // Close popup first
    setShowRewardPopup(false);

    // Credit wallet for all actions except cancel, but only if not already credited
    if (action !== 'cancel' && !hasBeenCredited) {
      try {
        await creditWallet();
        setHasBeenCredited(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to credit reward to wallet.');
      }
    }

    // Handle wallet navigation
    if (action === 'wallet') {
      console.log('🚀 [useVideoRewardAd] Navigating to wallet screen');
      navigation.navigate('Wallet' as never);
    }
  }, [creditWallet, navigation, hasBeenCredited]);

  // Simple close function
  const closeRewardPopup = useCallback(() => {
    setShowRewardPopup(false);
    setHasBeenCredited(false); // Reset credit tracking when popup is closed
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
