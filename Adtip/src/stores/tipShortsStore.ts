import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
interface VideoProgress {
  [videoId: string]: number;
}

interface TipShortsState {
  // Video playback state
  activeIndex: number;
  videoProgress: VideoProgress;
  isGloballyPlaying: boolean;
  isGloballyMuted: boolean;
  showPlayPause: boolean;
  
  // UI state
  showLoginPrompt: boolean;
  loginPromptMessage: string;
  commentModalVisible: boolean;
  selectedCommentShortId: string | null;
  
  // Video reward state
  videoCount: number;
  showRewardPopup: boolean;
  earnedAmount: number;
  hasBeenCredited: boolean;
  lastRewardTime: number;

  // Video pause control
  pausedVideos: Set<string>;
  forceGlobalPause: boolean;
}

interface TipShortsActions {
  // Video playback actions
  setActiveIndex: (index: number) => void;
  updateVideoProgress: (videoId: string, progress: number) => void;
  toggleGlobalPlayPause: () => void;
  setGlobalPlayState: (isPlaying: boolean) => void;
  toggleGlobalMute: () => void;
  setShowPlayPause: (show: boolean) => void;
  
  // UI actions
  showLoginPromptForAction: (action: string) => void;
  hideLoginPrompt: () => void;
  openCommentModal: (shortId: string) => void;
  closeCommentModal: () => void;
  
  // Video reward actions
  incrementVideoCount: () => void;
  resetVideoCount: () => void;
  showRewardModal: (amount: number) => void;
  hideRewardModal: () => void;
  setCredited: (credited: boolean) => void;

  // Enhanced video pause control
  pauseVideo: (videoId: string) => void;
  resumeVideo: (videoId: string) => void;
  pauseAllVideos: () => void;
  resumeAllVideos: () => void;
  setForceGlobalPause: (pause: boolean) => void;

  // Reset store
  resetStore: () => void;
  
  // Reset actions
  resetState: () => void;
}

type TipShortsStore = TipShortsState & TipShortsActions;

const initialState: TipShortsState = {
  // Video playback state
  activeIndex: 0,
  videoProgress: {},
  isGloballyPlaying: true,
  isGloballyMuted: false,
  showPlayPause: false,

  // UI state
  showLoginPrompt: false,
  loginPromptMessage: 'Login to unlock all features',
  commentModalVisible: false,
  selectedCommentShortId: null,

  // Video reward state
  videoCount: 0,
  showRewardPopup: false,
  earnedAmount: 0,
  hasBeenCredited: false,
  lastRewardTime: 0,

  // Video pause control
  pausedVideos: new Set<string>(),
  forceGlobalPause: false,
};

export const useTipShortsStore = create<TipShortsStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      
      // Video playback actions
      setActiveIndex: (index: number) => {
        set((state) => {
          state.activeIndex = index;
        });
      },
      
      updateVideoProgress: (videoId: string, progress: number) => {
        set((state) => {
          state.videoProgress[videoId] = progress;
        });
      },
      
      toggleGlobalPlayPause: () => {
        set((state) => {
          state.isGloballyPlaying = !state.isGloballyPlaying;
        });
      },
      
      setGlobalPlayState: (isPlaying: boolean) => {
        set((state) => {
          state.isGloballyPlaying = isPlaying;
        });
      },
      
      toggleGlobalMute: () => {
        set((state) => {
          state.isGloballyMuted = !state.isGloballyMuted;
        });
      },
      
      setShowPlayPause: (show: boolean) => {
        set((state) => {
          state.showPlayPause = show;
        });
      },
      
      // UI actions
      showLoginPromptForAction: (action: string) => {
        set((state) => {
          state.showLoginPrompt = true;
          state.loginPromptMessage = `Login to ${action}`;
        });
      },
      
      hideLoginPrompt: () => {
        set((state) => {
          state.showLoginPrompt = false;
        });
      },
      
      openCommentModal: (shortId: string) => {
        set((state) => {
          state.commentModalVisible = true;
          state.selectedCommentShortId = shortId;
        });
      },
      
      closeCommentModal: () => {
        set((state) => {
          state.commentModalVisible = false;
          state.selectedCommentShortId = null;
        });
      },
      
      // Video reward actions
      incrementVideoCount: () => {
        set((state) => {
          state.videoCount += 1;
        });
      },
      
      resetVideoCount: () => {
        set((state) => {
          state.videoCount = 0;
        });
      },
      
      showRewardModal: (amount: number) => {
        set((state) => {
          state.showRewardPopup = true;
          state.earnedAmount = amount;
          state.hasBeenCredited = false;
        });
      },
      
      hideRewardModal: () => {
        set((state) => {
          state.showRewardPopup = false;
          state.hasBeenCredited = false;
        });
      },
      
      setCreditedStatus: (credited: boolean) => {
        set((state) => {
          state.hasBeenCredited = credited;
        });
      },

      // Enhanced video pause control
      pauseVideo: (videoId: string) => {
        set((state) => {
          state.pausedVideos.add(videoId);
        });
      },

      resumeVideo: (videoId: string) => {
        set((state) => {
          state.pausedVideos.delete(videoId);
        });
      },

      pauseAllVideos: () => {
        set((state) => {
          state.forceGlobalPause = true;
          state.isGloballyPlaying = false;
        });
      },

      resumeAllVideos: () => {
        set((state) => {
          state.forceGlobalPause = false;
          state.isGloballyPlaying = true;
        });
      },

      setForceGlobalPause: (pause: boolean) => {
        set((state) => {
          state.forceGlobalPause = pause;
          if (pause) {
            state.isGloballyPlaying = false;
          }
        });
      },

      // Reset actions
      resetStore: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    }))
  )
);

// Selectors for optimized re-renders
export const selectVideoPlayback = (state: TipShortsStore) => ({
  activeIndex: state.activeIndex,
  isGloballyPlaying: state.isGloballyPlaying,
  isGloballyMuted: state.isGloballyMuted,
  showPlayPause: state.showPlayPause,
});

export const selectUIState = (state: TipShortsStore) => ({
  showLoginPrompt: state.showLoginPrompt,
  loginPromptMessage: state.loginPromptMessage,
  commentModalVisible: state.commentModalVisible,
  selectedCommentShortId: state.selectedCommentShortId,
});

export const selectRewardState = (state: TipShortsStore) => ({
  videoCount: state.videoCount,
  showRewardPopup: state.showRewardPopup,
  earnedAmount: state.earnedAmount,
  hasBeenCredited: state.hasBeenCredited,
});

// Computed selectors
export const selectVideoProgress = (videoId: string) => (state: TipShortsStore) =>
  state.videoProgress[videoId] || 0;

export const selectIsVideoActive = (index: number) => (state: TipShortsStore) =>
  state.activeIndex === index;
