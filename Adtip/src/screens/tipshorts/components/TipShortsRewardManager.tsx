import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserPremiumStatus } from '../../../contexts/UserDataContext';
import { useInshortsReward } from '../../../hooks/useInshortsReward';
import { useShorts } from '../../../contexts/ShortsContext';
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
  const isFocused = useIsFocused();
  const { setGlobalPlayState } = useShorts();

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

  // Debug Inshorts reward state changes and manage audio when popup appears
  useEffect(() => {
    TipShortsLogger.debug('TipShortsRewardManager - Inshorts reward state changed:', {
      shortsCount,
      showInshortsRewardPopup,
      earnedAmount,
      isPremium,
      userId: user?.id,
      isGuest
    });

    // Pause audio when reward popup appears, resume when it disappears
    if (showInshortsRewardPopup) {
      TipShortsLogger.debug('Inshorts reward popup appeared - pausing audio');
      setGlobalPlayState(false);
    } else {
      // Only resume if screen is focused and app is active
      if (isFocused && AppState.currentState === 'active') {
        TipShortsLogger.debug('Inshorts reward popup dismissed - resuming audio');
        setGlobalPlayState(true);
      }
    }
  }, [shortsCount, showInshortsRewardPopup, earnedAmount, isPremium, user?.id, isGuest, setGlobalPlayState, isFocused]);

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
