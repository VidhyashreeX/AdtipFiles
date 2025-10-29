// src/stores/ui.store.ts - World-class UI state management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  // Modal states
  authModal: {
    isOpen: boolean;
    mode: 'login' | 'register' | 'forgot-password';
  };
  shareModal: {
    isOpen: boolean;
    url: string;
    title: string;
  };
  settingsModal: {
    isOpen: boolean;
  };
  logoutModal: {
    isOpen: boolean;
  };

  // Layout states
  sidebar: {
    isOpen: boolean;
    isCollapsed: boolean;
    width: number;
  };

  // Global UI states
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  notifications: NotificationItem[];

  // Actions
  openAuthModal: (mode?: 'login' | 'register' | 'forgot-password') => void;
  closeAuthModal: () => void;
  openShareModal: (url: string, title: string) => void;
  closeShareModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const uiStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    return item;
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        authModal: {
          isOpen: false,
          mode: 'login',
        },
        shareModal: {
          isOpen: false,
          url: '',
          title: '',
        },
        settingsModal: {
          isOpen: false,
        },
        logoutModal: {
          isOpen: false,
        },
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          width: 256,
        },
        theme: 'system',
        isLoading: false,
        notifications: [],

        // Modal actions
        openAuthModal: (mode = 'login') =>
          set((state) => ({
            authModal: { isOpen: true, mode }
          }), false, 'ui/openAuthModal'),

        closeAuthModal: () =>
          set((state) => ({
            authModal: { ...state.authModal, isOpen: false }
          }), false, 'ui/closeAuthModal'),

        openShareModal: (url, title) =>
          set({
            shareModal: { isOpen: true, url, title }
          }, false, 'ui/openShareModal'),

        closeShareModal: () =>
          set((state) => ({
            shareModal: { ...state.shareModal, isOpen: false }
          }), false, 'ui/closeShareModal'),

        openSettingsModal: () =>
          set({ settingsModal: { isOpen: true } }, false, 'ui/openSettingsModal'),

        closeSettingsModal: () =>
          set({ settingsModal: { isOpen: false } }, false, 'ui/closeSettingsModal'),

        openLogoutModal: () =>
          set({ logoutModal: { isOpen: true } }, false, 'ui/openLogoutModal'),

        closeLogoutModal: () =>
          set({ logoutModal: { isOpen: false } }, false, 'ui/closeLogoutModal'),

        // Sidebar actions
        toggleSidebar: () =>
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isOpen: !state.sidebar.isOpen
            }
          }), false, 'ui/toggleSidebar'),

        setSidebarCollapsed: (isCollapsed) =>
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              isCollapsed,
              width: isCollapsed ? 64 : 256
            }
          }), false, 'ui/setSidebarCollapsed'),

        setSidebarWidth: (width) =>
          set((state) => ({
            sidebar: { ...state.sidebar, width }
          }), false, 'ui/setSidebarWidth'),

        // Theme actions
        setTheme: (theme) => set({ theme }, false, 'ui/setTheme'),

        // Loading actions
        setLoading: (isLoading) => set({ isLoading }, false, 'ui/setLoading'),

        // Notification actions
        addNotification: (notification) => {
          const id = Date.now().toString();
          const newNotification: NotificationItem = {
            id,
            duration: 5000,
            ...notification,
          };

          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }), false, 'ui/addNotification');

          // Auto-remove notification after duration
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }), false, 'ui/removeNotification'),

        clearNotifications: () =>
          set({ notifications: [] }, false, 'ui/clearNotifications'),
      }),
      {
        name: 'ui-storage',
        storage: createJSONStorage(() => uiStorage),
        partialize: (state) => ({
          sidebar: state.sidebar,
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'ui-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthModal = () => useUIStore((state) => state.authModal);
export const useShareModal = () => useUIStore((state) => state.shareModal);
export const useSettingsModal = () => useUIStore((state) => state.settingsModal);
export const useLogoutModal = () => useUIStore((state) => state.logoutModal);
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useTheme = () => useUIStore((state) => state.theme);
export const useIsLoading = () => useUIStore((state) => state.isLoading);
export const useUINotifications = () => useUIStore((state) => state.notifications);

// Actions
export const useUIActions = () => useUIStore((state) => ({
  openAuthModal: state.openAuthModal,
  closeAuthModal: state.closeAuthModal,
  openShareModal: state.openShareModal,
  closeShareModal: state.closeShareModal,
  openSettingsModal: state.openSettingsModal,
  closeSettingsModal: state.closeSettingsModal,
  openLogoutModal: state.openLogoutModal,
  closeLogoutModal: state.closeLogoutModal,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));