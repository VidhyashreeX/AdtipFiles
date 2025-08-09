import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/ApiService';
import { useNavigation } from '@react-navigation/native';
import { useUserPremiumStatus } from '../contexts/UserDataContext';

const NON_PREMIUM_REWARD = 0.03;
const PREMIUM_REWARD = 0.10;
const SHORTS_REQUIRED = 5;

interface UseInshortsRewardProps {
  isGuest: boolean;
  userId?: number;
}

interface UseInshortsRewardReturn {
  shortsCount: number;
  showInshortsRewardPopup: boolean;
  earnedAmount: number;
  handleShortViewed: () => void;
  handleInshortsRewardAction: (action: 'startNow' | 'gotIt' | 'wallet') => Promise<void>;
  closeInshortsRewardPopup: () => void;
}

export const useInshortsReward = ({
  isGuest,
  userId
}: UseInshortsRewardProps): UseInshortsRewardReturn => {
  const [shortsCount, setShortsCount] = useState(0);
  const [showInshortsRewardPopup, setShowInshortsRewardPopup] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [hasBeenCredited, setHasBeenCredited] = useState(false);
  const [lastRewardTime, setLastRewardTime] = useState(0);
  const navigation = useNavigation();

  // Get premium status
  const { isPremium } = useUserPremiumStatus();

  // Calculate reward amount based on premium status
  const getRewardAmount = useCallback(() => {
    return isPremium ? PREMIUM_REWARD : NON_PREMIUM_REWARD;
  }, [isPremium]);

  // Credit reward to user's wallet
  const creditRewardToWallet = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId || isGuest) {
      console.log('🚫 [useInshortsReward] Cannot credit reward - no userId or guest user');
      return false;
    }

    try {
      console.log('💰 [useInshortsReward] Crediting wallet with amount:', amount);
      
      const response = await ApiService.creditAdReward({
        userId: Number(userId),
        amount: amount
      });

      if (response.status === 200) {
        console.log('✅ [useInshortsReward] Wallet credited successfully');
        return true;
      } else {
        console.error('❌ [useInshortsReward] Failed to credit wallet:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ [useInshortsReward] Error crediting wallet:', error);
      return false;
    }
  }, [userId, isGuest]);

  // Handle short viewed for reward tracking
  const handleShortViewed = useCallback(() => {
    console.log('🎬 [useInshortsReward] handleShortViewed called', { isGuest, userId, isPremium });

    if (isGuest) {
      console.log('🚫 [useInshortsReward] Guest user - skipping short count');
      return;
    }

    if (!userId) {
      console.log('🚫 [useInshortsReward] No userId - skipping short count');
      return;
    }

    // Prevent rapid calls and ensure strict counting
    const now = Date.now();
    if (now - lastRewardTime < 1000) {
      console.log('🚫 [useInshortsReward] Too soon since last reward, skipping');
      return;
    }

    setShortsCount(prev => {
      const newCount = prev + 1;
      console.log(`🎬 [useInshortsReward] Short viewed. Count: ${newCount}/${SHORTS_REQUIRED} (User: ${userId}, Premium: ${isPremium})`);

      // Show reward popup after exactly 5 shorts
      if (newCount === SHORTS_REQUIRED) {
        console.log('🎁 [useInshortsReward] 5th short reached! Showing reward popup...');
        const rewardAmount = getRewardAmount();
        setEarnedAmount(rewardAmount);
        setHasBeenCredited(false); // Reset credit tracking for new reward cycle
        setShowInshortsRewardPopup(true);
        setLastRewardTime(now);
        // Reset count after showing popup
        return 0;
      }

      return newCount;
    });
  }, [isGuest, userId, isPremium, getRewardAmount, lastRewardTime]);

  // Handle reward popup actions
  const handleInshortsRewardAction = useCallback(async (action: 'startNow' | 'gotIt' | 'wallet') => {
    console.log('🎁 [useInshortsReward] Reward popup action:', action);

    switch (action) {
      case 'gotIt':
        if (!hasBeenCredited) {
          const success = await creditRewardToWallet(earnedAmount);
          if (success) {
            setHasBeenCredited(true);
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
        console.log('🎁 [useInshortsReward] Navigate to wallet');
        navigation.navigate('Wallet' as never);
        break;
      
      case 'startNow':
        // Navigate to PremiumUser component
        console.log('🎁 [useInshortsReward] Navigate to PremiumUser');
        navigation.navigate('PremiumUser' as never);
        break;
    }
  }, [hasBeenCredited, earnedAmount, creditRewardToWallet, navigation]);

  // Close reward popup
  const closeInshortsRewardPopup = useCallback(() => {
    console.log('🎁 [useInshortsReward] Closing reward popup');
    setShowInshortsRewardPopup(false);
  }, []);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🎁 [useInshortsReward] State changed:', {
      shortsCount,
      showInshortsRewardPopup,
      earnedAmount,
      hasBeenCredited,
      isPremium,
    });
  }, [shortsCount, showInshortsRewardPopup, earnedAmount, hasBeenCredited, isPremium]);

  return {
    shortsCount,
    showInshortsRewardPopup,
    earnedAmount,
    handleShortViewed,
    handleInshortsRewardAction,
    closeInshortsRewardPopup,
  };
}; 