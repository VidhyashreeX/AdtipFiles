import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useShorts } from '../../../contexts/ShortsContext';
import { TipShortsLogger } from '../../../utils/logger';

// Import the audio manager (we'll need to export it from the video player)
class TipShortsAudioManager {
  private static instance: TipShortsAudioManager;
  private activeVideos = new Map<string, any>();
  private cleanupTimeouts = new Map<string, NodeJS.Timeout>();

  static getInstance(): TipShortsAudioManager {
    if (!TipShortsAudioManager.instance) {
      TipShortsAudioManager.instance = new TipShortsAudioManager();
    }
    return TipShortsAudioManager.instance;
  }

  pauseAllVideos() {
    TipShortsLogger.debug('AudioManager: Pausing all videos');
    this.activeVideos.forEach((videoRef, videoId) => {
      if (videoRef && typeof videoRef.pause === 'function') {
        try {
          videoRef.pause();
        } catch (error) {
          TipShortsLogger.warn(`AudioManager: Error pausing video ${videoId}:`, error);
        }
      }
    });
  }

  cleanup() {
    TipShortsLogger.debug('AudioManager: Full cleanup');
    this.pauseAllVideos();
    this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cleanupTimeouts.clear();
    this.activeVideos.clear();
  }

  registerVideo(videoId: string, videoRef: any) {
    this.activeVideos.set(videoId, videoRef);
  }

  unregisterVideo(videoId: string) {
    this.activeVideos.delete(videoId);
    const timeout = this.cleanupTimeouts.get(videoId);
    if (timeout) {
      clearTimeout(timeout);
      this.cleanupTimeouts.delete(videoId);
    }
  }
}

interface TipShortsControlsContextType {
  // Global play/pause state
  isGloballyPlaying: boolean;
  isGloballyMuted: boolean;
  toggleGlobalPlayPause: () => void;
  toggleGlobalMute: () => void;
  setGlobalPlayState: (playing: boolean) => void;
  
  // Video progress tracking
  videoProgress: { [key: string]: number };
  setVideoProgress: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  
  // Play/pause UI feedback
  showPlayPause: boolean;
  setShowPlayPause: (show: boolean) => void;
  
  // Active video index
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  
  // Video loading tracking
  handleVideoLoad: (videoId: string) => void;
  
  // Cleanup functions
  cleanup: () => void;
}

const TipShortsControlsContext = createContext<TipShortsControlsContextType | null>(null);

export const useTipShortsControls = () => {
  const context = useContext(TipShortsControlsContext);
  if (!context) {
    throw new Error('useTipShortsControls must be used within TipShortsControlsProvider');
  }
  return context;
};

interface TipShortsControlsProviderProps {
  children: React.ReactNode;
  startIndex?: number;
}

export const TipShortsControlsProvider: React.FC<TipShortsControlsProviderProps> = ({
  children,
  startIndex = 0,
}) => {
  const {
    isGloballyMuted,
    isGloballyPlaying,
    toggleGlobalPlayPause,
    toggleGlobalMute,
    setGlobalPlayState
  } = useShorts();

  // Local states
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [showPlayPause, setShowPlayPause] = useState(false);
  const playPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle video load tracking
  const handleVideoLoad = useCallback((videoId: string) => {
    TipShortsLogger.debug('Video loaded:', videoId);
    // Initialize progress for this video
    setVideoProgress(prev => ({
      ...prev,
      [videoId]: 0
    }));
  }, []);

  // Enhanced play/pause toggle with UI feedback
  const enhancedTogglePlayPause = useCallback(() => {
    toggleGlobalPlayPause();
    
    // Show play/pause indicator
    setShowPlayPause(true);
    
    // Clear existing timeout
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
    }
    
    // Hide indicator after delay
    playPauseTimeoutRef.current = setTimeout(() => {
      setShowPlayPause(false);
    }, 1000);
  }, [toggleGlobalPlayPause]);

  // Enhanced mute toggle with debouncing
  const enhancedToggleMute = useCallback(() => {
    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the mute toggle to prevent rapid changes
    debounceTimeoutRef.current = setTimeout(() => {
      toggleGlobalMute();
    }, 100);
  }, [toggleGlobalMute]);

  // Cleanup function to stop all audio and clear timeouts
  const cleanup = useCallback(() => {
    TipShortsLogger.debug('TipShortsControls cleanup - stopping all audio');

    // Clear any pending timeouts
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Use audio manager for comprehensive cleanup
    const audioManager = TipShortsAudioManager.getInstance();
    audioManager.cleanup();

    // Stop global playback
    setGlobalPlayState(false);

    // Clear video progress
    setVideoProgress({});
  }, [setGlobalPlayState]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const contextValue: TipShortsControlsContextType = {
    isGloballyPlaying,
    isGloballyMuted,
    toggleGlobalPlayPause: enhancedTogglePlayPause,
    toggleGlobalMute: enhancedToggleMute,
    setGlobalPlayState,
    videoProgress,
    setVideoProgress,
    showPlayPause,
    setShowPlayPause,
    activeIndex,
    setActiveIndex,
    handleVideoLoad,
    cleanup,
  };

  return (
    <TipShortsControlsContext.Provider value={contextValue}>
      {children}
    </TipShortsControlsContext.Provider>
  );
};

// Export the audio manager class for external use
export { TipShortsAudioManager };
