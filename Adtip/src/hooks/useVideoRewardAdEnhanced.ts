import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useUserPremiumStatus } from '../contexts/UserDataContext';
import ApiService from '../services/ApiService';
import { useTipShortsStore } from '../stores/tipShortsStore';

interface UseVideoRewardAdProps {
  isGuest: boolean;
  userId?: string | number;
}

interface RewardAdResponse {
  success: boolean;
  message: string;
  data?: {
    amount: number;
    newBalance: number;
  };
}

export const useVideoRewardAdEnhanced = ({ isGuest, userId }: UseVideoRewardAdProps) => {
  const { isPremium } = useUserPremiumStatus();
  
  // Zustand store
  const {
    videoCount,
    showRewardPopup,
    earnedAmount,
    hasBeenCredited,
    incrementVideoCount,
    resetVideoCount,
    showRewardModal,
    hideRewardModal,
    setCreditedStatus,
  } = useTipShortsStore();

  const [isProcessingReward, setIsProcessingReward] = useState(false);
  const [lastRewardTime, setLastRewardTime] = useState(0);

  // Calculate reward amount based on premium status
  const getRewardAmount = useCallback(() => {
    return isPremium ? 0.10 : 0.03; // INR
  }, [isPremium]);

  // Credit reward to user's wallet
  const creditRewardToWallet = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId || isGuest) {
      console.log('🚫 [useVideoRewardAdEnhanced] Cannot credit reward - no userId or guest user');
      return false;
    }

    try {
      setIsProcessingReward(true);
      console.log('💰 [useVideoRewardAdEnhanced] Crediting reward to wallet:', { userId, amount, isPremium });

      const response = await ApiService.creditAdReward({ userId: Number(userId), amount });
      
      console.log('💰 [useVideoRewardAdEnhanced] Credit response:', response);

      if (response.status === 200 || response.success === true) {
        setCreditedStatus(true);
        setLastRewardTime(Date.now());
        console.log('✅ [useVideoRewardAdEnhanced] Reward credited successfully:', response.data);
        return true;
      } else {
        console.error('❌ [useVideoRewardAdEnhanced] Failed to credit reward:', response.message);
        Alert.alert('Error', (response as any).message || 'Failed to credit reward');
        return false;
      }
    } catch (error) {
      console.error('❌ [useVideoRewardAdEnhanced] Error crediting reward:', error);
      Alert.alert('Error', 'Failed to credit reward. Please try again.');
      return false;
    } finally {
      setIsProcessingReward(false);
    }
  }, [userId, isGuest, isPremium, setCreditedStatus]);

  // Show reward ad
  const showRewardAd = useCallback(() => {
    if (isGuest || !userId) {
      console.log('🚫 [useVideoRewardAdEnhanced] Cannot show reward ad - guest user or no userId');
      return;
    }

    const amount = getRewardAmount();
    console.log('🎁 [useVideoRewardAdEnhanced] Showing reward ad with amount:', amount);
    
    showRewardModal(amount);
  }, [isGuest, userId, getRewardAmount, showRewardModal]);

  // Handle video view for reward ads
  const handleVideoViewed = useCallback(() => {
    console.log('🎬 [useVideoRewardAdEnhanced] handleVideoViewed called', { 
      isGuest, 
      userId, 
      isPremium, 
      currentCount: videoCount 
    });
    
    if (isGuest) {
      console.log('🚫 [useVideoRewardAdEnhanced] Guest user - skipping video count');
      return;
    }

    if (!userId) {
      console.log('🚫 [useVideoRewardAdEnhanced] No userId - skipping video count');
      return;
    }

    // Prevent too frequent rewards (minimum 30 seconds between rewards)
    const now = Date.now();
    if (now - lastRewardTime < 30000) {
      console.log('🚫 [useVideoRewardAdEnhanced] Too soon for next reward');
      return;
    }

    incrementVideoCount();
    const newCount = videoCount + 1;
    
    console.log(`🎬 [useVideoRewardAdEnhanced] Video viewed. Count: ${newCount}/3 (User: ${userId}, Premium: ${isPremium})`);

    // Show reward ad after 3 videos for testing (change to 10 for production)
    if (newCount >= 3) {
      console.log('🎁 [useVideoRewardAdEnhanced] 3rd video reached! Showing reward ad...');
      setCreditedStatus(false); // Reset credit tracking for new reward cycle
      showRewardAd();
      resetVideoCount(); // Reset count after showing ad
    }
  }, [
    isGuest, 
    userId, 
    isPremium, 
    videoCount, 
    lastRewardTime,
    incrementVideoCount,
    resetVideoCount,
    setCreditedStatus,
    showRewardAd
  ]);

  // Handle reward popup actions
  const handleRewardPopupAction = useCallback(async (action: 'upgrade' | 'cancel' | 'gotit' | 'wallet') => {
    console.log('🎁 [useVideoRewardAdEnhanced] Reward popup action:', action);

    switch (action) {
      case 'gotit':
        if (!hasBeenCredited) {
          const success = await creditRewardToWallet(earnedAmount);
          if (success) {
            Alert.alert(
              'Reward Credited!',
              `₹${earnedAmount.toFixed(2)} has been added to your wallet.`,
              [{ text: 'OK' }]
            );
          }
        }
        break;
      
      case 'wallet':
        // Navigate to wallet screen
        console.log('🎁 [useVideoRewardAdEnhanced] Navigate to wallet');
        break;
      
      case 'upgrade':
        // Navigate to premium upgrade
        console.log('🎁 [useVideoRewardAdEnhanced] Navigate to premium upgrade');
        break;
      
      case 'cancel':
        // Just close the popup
        console.log('🎁 [useVideoRewardAdEnhanced] Cancel reward popup');
        break;
    }
  }, [hasBeenCredited, earnedAmount, creditRewardToWallet]);

  // Close reward popup
  const closeRewardPopup = useCallback(() => {
    console.log('🎁 [useVideoRewardAdEnhanced] Closing reward popup');
    hideRewardModal();
  }, [hideRewardModal]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🎁 [useVideoRewardAdEnhanced] State changed:', {
      videoCount,
      showRewardPopup,
      earnedAmount,
      hasBeenCredited,
      isPremium,
      isProcessingReward,
    });
  }, [videoCount, showRewardPopup, earnedAmount, hasBeenCredited, isPremium, isProcessingReward]);

  return {
    videoCount,
    showRewardPopup,
    earnedAmount,
    hasBeenCredited,
    isProcessingReward,
    handleVideoViewed,
    handleRewardPopupAction,
    closeRewardPopup,
    showRewardAd,
    creditRewardToWallet,
  };
};

export default useVideoRewardAdEnhanced;
