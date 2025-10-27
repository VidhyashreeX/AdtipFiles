import { useState, useEffect, useCallback } from 'react';
import VideoAdRewardService from '../services/VideoAdRewardService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

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
  checkEligibility: (campaignId: number) => Promise<void>;
  creditReward: (
    campaignId: number,
    creativeId: number,
    viewDuration: number,
    sessionId?: string
  ) => Promise<void>;
  state: AdRewardState;
  refreshWallet: () => void;
}

/**
 * Custom hook for managing video ad rewards
 * Handles eligibility checking, reward crediting, and wallet updates
 */
export const useAdReward = (): UseAdRewardReturn => {
  const { user, updateUser } = useAuth();
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
    async (campaignId: number) => {
      if (!user?.id) {
        setState((prev) => ({
          ...prev,
          error: 'User not logged in',
          eligible: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await VideoAdRewardService.checkEligibility(
          user.id,
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
    [user?.id]
  );

  /**
   * Credit user wallet after ad view
   */
  const creditReward = useCallback(
    async (
      campaignId: number,
      creativeId: number,
      viewDuration: number,
      sessionId?: string
    ) => {
      if (!user?.id) {
        toast.error('User not logged in');
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const response = await VideoAdRewardService.creditReward(
          user.id,
          campaignId,
          creativeId,
          viewDuration,
          sessionId
        );

        if (response.data.credited && response.data.rewardAmount) {
          // Show success notification
          toast.success(
            `🎉 You earned ₹${response.data.rewardAmount}!`,
            {
              duration: 5000,
              position: 'top-center',
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold',
              },
            }
          );

          // Update user's wallet balance in context
          if (user.wallet !== undefined) {
            updateUser({
              ...user,
              wallet: user.wallet + response.data.rewardAmount,
            });
          }

          // Mark as no longer eligible
          setState({
            eligible: false,
            loading: false,
            adDetails: null,
            error: null,
          });
        } else {
          toast.error(response.data.reason || 'Failed to credit reward');
          setState((prev) => ({
            ...prev,
            loading: false,
            error: response.data.reason || 'Failed to credit reward',
          }));
        }
      } catch (error: any) {
        console.error('Error crediting reward:', error);
        const errorMessage = error.message || 'Failed to credit reward';
        toast.error(errorMessage);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [user, updateUser]
  );

  /**
   * Refresh wallet balance from server
   */
  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch updated user data from your existing user API
      // This is a placeholder - adjust to your actual API endpoint
      // const response = await api.get(`/api/users/${user.id}`);
      // updateUser(response.data);
      console.log('Wallet refresh - implement based on your user API');
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    }
  }, [user?.id]);

  return {
    checkEligibility,
    creditReward,
    state,
    refreshWallet,
  };
};

export default useAdReward;
