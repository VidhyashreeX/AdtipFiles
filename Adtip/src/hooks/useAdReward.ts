import { useState, useCallback } from 'react';
import VideoAdRewardService, {
  AdEligibilityResponse,
  CreditRewardResponse,
} from '../services/VideoAdRewardService';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

interface AdRewardState {
  eligible: boolean;
  loading: boolean;
  adDetails: {
    campaignId: number;
    campaignName: string;
    rewardAmount: number;
    creativeId: number;
    videoDuration: number;
    isSkippable: boolean;
    skipOffset: number;
  } | null;
  error: string | null;
}

interface UseAdRewardReturn {
  checkEligibility: (userId: number, campaignId: number) => Promise<void>;
  creditReward: (
    userId: number,
    campaignId: number,
    creativeId: number,
    viewDuration: number,
    sessionId?: string
  ) => Promise<boolean>;
  state: AdRewardState;
}

/**
 * Custom hook for managing video ad rewards in React Native
 */
export const useAdReward = (): UseAdRewardReturn => {
  const [state, setState] = useState<AdRewardState>({
    eligible: false,
    loading: false,
    adDetails: null,
    error: null,
  });

  /**
   * Check if user is eligible for ad reward
   */
  const checkEligibility = useCallback(
    async (userId: number, campaignId: number) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await VideoAdRewardService.checkEligibility(
          userId,
          campaignId
        );

        if (response.data.eligible && response.data.adDetails) {
          setState({
            eligible: true,
            loading: false,
            adDetails: response.data.adDetails,
            error: null,
          });
        } else {
          setState({
            eligible: false,
            loading: false,
            adDetails: null,
            error: response.data.reason || 'Not eligible for reward',
          });
        }
      } catch (error: any) {
        console.error('Error checking eligibility:', error);
        setState({
          eligible: false,
          loading: false,
          adDetails: null,
          error: error.message || 'Failed to check eligibility',
        });
      }
    },
    []
  );

  /**
   * Credit user wallet after ad view
   * Returns true if successful, false otherwise
   */
  const creditReward = useCallback(
    async (
      userId: number,
      campaignId: number,
      creativeId: number,
      viewDuration: number,
      sessionId?: string
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const response = await VideoAdRewardService.creditReward(
          userId,
          campaignId,
          creativeId,
          viewDuration,
          sessionId
        );

        if (response.data.credited && response.data.rewardAmount) {
          // Show success toast
          Toast.show({
            type: 'success',
            text1: '🎉 Congratulations!',
            text2: `You earned ₹${response.data.rewardAmount}!`,
            visibilityTime: 5000,
            position: 'top',
          });

          // Mark as no longer eligible
          setState({
            eligible: false,
            loading: false,
            adDetails: null,
            error: null,
          });

          return true;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Failed to Credit Reward',
            text2: response.data.reason || 'Please try again later',
            visibilityTime: 4000,
          });

          setState((prev) => ({
            ...prev,
            loading: false,
            error: response.data.reason || 'Failed to credit reward',
          }));

          return false;
        }
      } catch (error: any) {
        console.error('Error crediting reward:', error);
        const errorMessage = error.message || 'Failed to credit reward';
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          visibilityTime: 4000,
        });

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        return false;
      }
    },
    []
  );

  return {
    checkEligibility,
    creditReward,
    state,
  };
};

export default useAdReward;
