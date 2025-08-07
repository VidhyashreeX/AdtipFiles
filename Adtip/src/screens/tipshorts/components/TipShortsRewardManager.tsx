import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserPremiumStatus } from '../../../contexts/UserDataContext';
import { useInshortsReward } from '../../../hooks/useInshortsReward';
import { TipShortsLogger } from '../../../utils/logger';

interface TipShortsRewardContextType {
  // Reward state
  shortsCount: number;
  showInshortsRewardPopup: boolean;
  earnedAmount: number;
  isPremium: boolean;
  
  // Reward actions
  handleShortViewed: () => void;
  handleInshortsRewardAction: (action: 'upgrade' | 'cancel') => void;
  closeInshortsRewardPopup: () => void;
  handleVideoCompletion: (videoId: string) => void;
}

const TipShortsRewardContext = createContext<TipShortsRewardContextType | null>(null);

export const useTipShortsReward = () => {
  const context = useContext(TipShortsRewardContext);
  if (!context) {
    throw new Error('useTipShortsReward must be used within TipShortsRewardProvider');
  }
  return context;
};

interface TipShortsRewardProviderProps {
  children: React.ReactNode;
}

export const TipShortsRewardProvider: React.FC<TipShortsRewardProviderProps> = ({
  children,
}) => {
  const { user, isGuest } = useAuth();
  const { isPremium } = useUserPremiumStatus();
  
  // Use the Inshorts reward hook
  const {
    shortsCount,
    showInshortsRewardPopup,
    earnedAmount,
    handleShortViewed,
    handleInshortsRewardAction,
    closeInshortsRewardPopup,
  } = useInshortsReward({
    isGuest,
    userId: user?.id,
  });

  // Debug Inshorts reward state changes
  useEffect(() => {
    TipShortsLogger.debug('TipShortsRewardManager - Inshorts reward state changed:', {
      shortsCount,
      showInshortsRewardPopup,
      earnedAmount,
      isPremium,
      userId: user?.id,
      isGuest
    });
  }, [shortsCount, showInshortsRewardPopup, earnedAmount, isPremium, user?.id, isGuest]);

  // Handle video completion for reward system
  const handleVideoCompletion = useCallback((videoId: string) => {
    TipShortsLogger.debug('TipShortsRewardManager - Video completed, triggering reward check:', videoId);
    handleShortViewed();
  }, [handleShortViewed]);

  const contextValue: TipShortsRewardContextType = {
    shortsCount,
    showInshortsRewardPopup,
    earnedAmount,
    isPremium,
    handleShortViewed,
    handleInshortsRewardAction,
    closeInshortsRewardPopup,
    handleVideoCompletion,
  };

  return (
    <TipShortsRewardContext.Provider value={contextValue}>
      {children}
    </TipShortsRewardContext.Provider>
  );
};
