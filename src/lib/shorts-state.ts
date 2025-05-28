// Global persistent state for TipShorts
const SHORTS_STATE_KEY = 'adtip-shorts-state';

interface ShortsState {
  currentIndex: number;
  isMuted: { [key: number]: boolean };
  isPlaying: { [key: number]: boolean };
  liked: { [key: number]: boolean };
  isFullscreen: boolean;
}

export const getStoredShortsState = (): ShortsState => {
  const stored = localStorage.getItem(SHORTS_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultShortsState();
    }
  }
  return getDefaultShortsState();
};

export const updateShortsState = (state: Partial<ShortsState>) => {
  const current = getStoredShortsState();
  const updated = { ...current, ...state };
  localStorage.setItem(SHORTS_STATE_KEY, JSON.stringify(updated));
  return updated;
};

export const getDefaultShortsState = (): ShortsState => ({
  currentIndex: 0,
  isMuted: {},
  isPlaying: {},
  liked: {},
  isFullscreen: false,
});

// Helper functions for specific state updates
export const updateShortMuteState = (shortId: number, muted: boolean) => {
  const state = getStoredShortsState();
  state.isMuted[shortId] = muted;
  updateShortsState(state);
};

export const updateShortPlayState = (shortId: number, playing: boolean) => {
  const state = getStoredShortsState();
  state.isPlaying[shortId] = playing;
  updateShortsState(state);
};

export const updateShortLikeState = (shortId: number, liked: boolean) => {
  const state = getStoredShortsState();
  state.liked[shortId] = liked;
  updateShortsState(state);
};

export const updateCurrentIndex = (index: number) => {
  updateShortsState({ currentIndex: index });
};

export const updateFullscreenState = (isFullscreen: boolean) => {
  updateShortsState({ isFullscreen });
};
