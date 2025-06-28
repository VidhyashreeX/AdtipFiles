import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define the shape of the context state and actions
interface ShortsContextType {
  isGloballyMuted: boolean;
  isGloballyPlaying: boolean;
  toggleGlobalMute: () => void;
  toggleGlobalPlayPause: () => void;
  setGlobalPlayState: (isPlaying: boolean) => void;
}

// Create the context with a default undefined value
const ShortsContext = createContext<ShortsContextType | undefined>(undefined);

// Props for the provider component
interface ShortsProviderProps {
  children: ReactNode;
}

/**
 * Provides global state and functions for managing video playback (mute and play/pause)
 * across multiple short video cards.
 */
export const ShortsProvider: React.FC<ShortsProviderProps> = ({ children }) => {
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);
  const [isGloballyPlaying, setIsGloballyPlaying] = useState(true); // Default to playing

  // Memoized callback to toggle global mute state
  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []); // No dependencies, so it's created once

  // Memoized callback to toggle global play/pause state
  const toggleGlobalPlayPause = useCallback(() => {
    setIsGloballyPlaying(prev => !prev);
  }, []); // No dependencies, so it's created once

  // Memoized callback to set global play state
  const setGlobalPlayState = useCallback((isPlaying: boolean) => {
    setIsGloballyPlaying(isPlaying);
  }, []); // No dependencies, so it's created once

  // The value provided by the context
  const contextValue = {
    isGloballyMuted,
    isGloballyPlaying,
    toggleGlobalMute,
    toggleGlobalPlayPause,
    setGlobalPlayState,
  };

  return (
    <ShortsContext.Provider value={contextValue}>
      {children}
    </ShortsContext.Provider>
  );
};

/**
 * Custom hook to consume the ShortsContext.
 * Throws an error if used outside of a ShortsProvider.
 */
export const useShorts = (): ShortsContextType => {
  const context = useContext(ShortsContext);
  if (context === undefined) {
    throw new Error('useShorts must be used within a ShortsProvider');
  }
  return context;
};