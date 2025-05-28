interface ShortsState {
  currentIndex: number;
  isMuted: { [key: number]: boolean };
  isPlaying: { [key: number]: boolean };
  isFullscreen: boolean;
}

class ShortsStore {
  private static instance: ShortsStore;
  private state: ShortsState;

  private constructor() {
    // Initialize state from localStorage or defaults
    this.state = {
      currentIndex: this.loadFromStorage('shortsCurrentIndex', 0),
      isMuted: this.loadFromStorage('shortsMuteStates', {}),
      isPlaying: this.loadFromStorage('shortsPlayingStates', {}),
      isFullscreen: false
    };
  }

  static getInstance(): ShortsStore {
    if (!ShortsStore.instance) {
      ShortsStore.instance = new ShortsStore();
    }
    return ShortsStore.instance;
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  private saveToStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  setCurrentIndex(index: number) {
    this.state.currentIndex = index;
    this.saveToStorage('shortsCurrentIndex', index);
  }

  getCurrentIndex(): number {
    return this.state.currentIndex;
  }

  setMuted(id: number, muted: boolean) {
    this.state.isMuted = { ...this.state.isMuted, [id]: muted };
    this.saveToStorage('shortsMuteStates', this.state.isMuted);
  }

  getMuted(id: number): boolean {
    return this.state.isMuted[id] ?? false;
  }

  setPlaying(id: number, playing: boolean) {
    this.state.isPlaying = { ...this.state.isPlaying, [id]: playing };
    this.saveToStorage('shortsPlayingStates', this.state.isPlaying);
  }

  getPlaying(id: number): boolean {
    return this.state.isPlaying[id] ?? false;
  }

  setFullscreen(isFullscreen: boolean) {
    this.state.isFullscreen = isFullscreen;
  }

  getFullscreen(): boolean {
    return this.state.isFullscreen;
  }

  clearStatesForId(id: number) {
    const { [id]: _, ...restMuted } = this.state.isMuted;
    const { [id]: __, ...restPlaying } = this.state.isPlaying;
    this.state.isMuted = restMuted;
    this.state.isPlaying = restPlaying;
    this.saveToStorage('shortsMuteStates', restMuted);
    this.saveToStorage('shortsPlayingStates', restPlaying);
  }
}

export default ShortsStore.getInstance();
