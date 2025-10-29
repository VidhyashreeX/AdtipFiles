// src/stores/auth.store.ts - World-class authentication state management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;

  // Computed properties
  isNewUser: boolean;
  hasProfile: boolean;
  isPremium: boolean;
}

// Custom storage for sensitive data
const authStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      // Check if token is expired (basic check)
      if (parsed.state?.user?.tokenExpiry && new Date() > new Date(parsed.state.user.tokenExpiry)) {
        localStorage.removeItem(name);
        return null;
      }
      return item;
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

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user }, false, 'auth/setUser'),

        setAuthenticated: (authenticated) =>
          set({ isAuthenticated: authenticated }, false, 'auth/setAuthenticated'),

        setLoading: (loading) => set({ isLoading: loading }, false, 'auth/setLoading'),

        setError: (error) => set({ error }, false, 'auth/setError'),

        login: (user) => set({
          user,
          isAuthenticated: true,
          error: null
        }, false, 'auth/login'),

        logout: () => set({
          user: null,
          isAuthenticated: false,
          error: null
        }, false, 'auth/logout'),

        clearError: () => set({ error: null }, false, 'auth/clearError'),

        // Computed properties
        get isNewUser() {
          const user = get().user;
          return !user?.name;
        },

        get hasProfile() {
          const user = get().user;
          return !!(user?.name && user?.profile_image);
        },

        get isPremium() {
          const user = get().user;
          return user?.is_premium === true;
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => authStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsNewUser = () => useAuthStore((state) => state.isNewUser);
export const useHasProfile = () => useAuthStore((state) => state.hasProfile);
export const useIsPremium = () => useAuthStore((state) => state.isPremium);

// Actions
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
}));