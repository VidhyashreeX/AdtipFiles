// src/stores/theme.store.ts - World-class theme management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';

interface ThemeState {
  // State
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;

  // Computed properties
  resolvedMode: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetToDefaults: () => void;

  // Advanced actions
  applySystemTheme: () => void;
  getThemeClasses: () => string;
  getColorClasses: () => string;
}

// Detect system theme
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Theme storage with validation
const themeStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      // Validate theme settings
      const validModes: ThemeMode[] = ['light', 'dark', 'system'];
      const validSchemes: ColorScheme[] = ['blue', 'green', 'purple', 'orange', 'red', 'gray'];
      const validSizes = ['small', 'medium', 'large'];

      if (parsed.state?.mode && !validModes.includes(parsed.state.mode)) {
        parsed.state.mode = 'system';
      }
      if (parsed.state?.colorScheme && !validSchemes.includes(parsed.state.colorScheme)) {
        parsed.state.colorScheme = 'blue';
      }
      if (parsed.state?.fontSize && !validSizes.includes(parsed.state.fontSize)) {
        parsed.state.fontSize = 'medium';
      }

      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        mode: 'system',
        colorScheme: 'blue',
        fontSize: 'medium',
        reducedMotion: false,
        highContrast: false,

        // Computed properties
        get resolvedMode() {
          const { mode } = get();
          return mode === 'system' ? getSystemTheme() : mode;
        },

        get isDark() {
          return get().resolvedMode === 'dark';
        },

        get isLight() {
          return get().resolvedMode === 'light';
        },

        // Actions
        setMode: (mode) => {
          set({ mode }, false, 'theme/setMode');
          get().applySystemTheme();
        },

        setColorScheme: (colorScheme) =>
          set({ colorScheme }, false, 'theme/setColorScheme'),

        setFontSize: (fontSize) =>
          set({ fontSize }, false, 'theme/setFontSize'),

        toggleReducedMotion: () =>
          set((state) => ({ reducedMotion: !state.reducedMotion }), false, 'theme/toggleReducedMotion'),

        toggleHighContrast: () =>
          set((state) => ({ highContrast: !state.highContrast }), false, 'theme/toggleHighContrast'),

        resetToDefaults: () => set({
          mode: 'system',
          colorScheme: 'blue',
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false,
        }, false, 'theme/resetToDefaults'),

        // Advanced actions
        applySystemTheme: () => {
          const { resolvedMode, colorScheme, fontSize, reducedMotion, highContrast } = get();

          // Apply theme to document
          if (typeof document !== 'undefined') {
            const root = document.documentElement;

            // Remove existing theme classes
            root.classList.remove('light', 'dark');
            root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red', 'theme-gray');
            root.classList.remove('font-small', 'font-medium', 'font-large');

            // Add current theme classes
            root.classList.add(resolvedMode);
            root.classList.add(`theme-${colorScheme}`);
            root.classList.add(`font-${fontSize}`);

            // Apply accessibility settings
            if (reducedMotion) {
              root.style.setProperty('--animation-duration', '0s');
            } else {
              root.style.removeProperty('--animation-duration');
            }

            if (highContrast) {
              root.classList.add('high-contrast');
            } else {
              root.classList.remove('high-contrast');
            }

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
              metaThemeColor.setAttribute('content', resolvedMode === 'dark' ? '#1a1a1a' : '#ffffff');
            }
          }
        },

        getThemeClasses: () => {
          const { resolvedMode, colorScheme, fontSize, reducedMotion, highContrast } = get();
          const classes = [
            resolvedMode,
            `theme-${colorScheme}`,
            `font-${fontSize}`,
          ];

          if (reducedMotion) classes.push('reduced-motion');
          if (highContrast) classes.push('high-contrast');

          return classes.join(' ');
        },

        getColorClasses: () => {
          const { colorScheme } = get();
          return `theme-${colorScheme}`;
        },
      }),
      {
        name: 'theme-storage',
        storage: createJSONStorage(() => themeStorage),
        partialize: (state) => ({
          mode: state.mode,
          colorScheme: state.colorScheme,
          fontSize: state.fontSize,
          reducedMotion: state.reducedMotion,
          highContrast: state.highContrast,
        }),
      }
    ),
    {
      name: 'theme-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useThemeMode = () => useThemeStore((state) => state.mode);
export const useResolvedTheme = () => useThemeStore((state) => state.resolvedMode);
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useIsLight = () => useThemeStore((state) => state.isLight);
export const useColorScheme = () => useThemeStore((state) => state.colorScheme);
export const useFontSize = () => useThemeStore((state) => state.fontSize);
export const useReducedMotion = () => useThemeStore((state) => state.reducedMotion);
export const useHighContrast = () => useThemeStore((state) => state.highContrast);

// Actions
export const useThemeActions = () => useThemeStore((state) => ({
  setMode: state.setMode,
  setColorScheme: state.setColorScheme,
  setFontSize: state.setFontSize,
  toggleReducedMotion: state.toggleReducedMotion,
  toggleHighContrast: state.toggleHighContrast,
  resetToDefaults: state.resetToDefaults,
  applySystemTheme: state.applySystemTheme,
  getThemeClasses: state.getThemeClasses,
  getColorClasses: state.getColorClasses,
}));