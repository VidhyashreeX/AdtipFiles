// src/stores/ui.store.ts - World-class UI state management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  // Modal states
  authModal: {
    showLogin: boolean;
    showOTP: boolean;
    phoneNumber: string;
    email: string;
    tempUserId: string;
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
    state: 'expanded' | 'collapsed';
    open: boolean;
    openMobile: boolean;
    width: number;
    isCollapsed: boolean;
  };

  // Global UI states
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  notifications: NotificationItem[];

  // Actions
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openOTPModal: (phone: string, userId: string) => void;
  closeOTPModal: () => void;
  setPhoneNumber: (phone: string) => void;
  setEmail: (email: string) => void;
  openShareModal: (url: string, title: string) => void;
  closeShareModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarOpenMobile: (openMobile: boolean) => void;
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
          showLogin: false,
          showOTP: false,
          phoneNumber: '',
          email: '',
          tempUserId: '',
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
          state: 'expanded',
          open: true,
          openMobile: false,
          width: 256,
          isCollapsed: false,
        },
        theme: 'system',
        isLoading: false,
        notifications: [],

        // Modal actions
        openAuthModal: () =>
          set((state) => ({
            authModal: { ...state.authModal, showLogin: true }
          }), false, 'ui/openAuthModal'),

        closeAuthModal: () =>
          set((state) => ({
            authModal: { ...state.authModal, showLogin: false }
          }), false, 'ui/closeAuthModal'),

        openOTPModal: (phone: string, userId: string) =>
          set((state) => ({
            authModal: {
              ...state.authModal,
              phoneNumber: phone,
              tempUserId: userId,
              showLogin: false,
              showOTP: true
            }
          }), false, 'ui/openOTPModal'),

        closeOTPModal: () =>
          set((state) => ({
            authModal: {
              ...state.authModal,
              showOTP: false,
              phoneNumber: '',
              email: '',
              tempUserId: ''
            }
          }), false, 'ui/closeOTPModal'),

        setPhoneNumber: (phone: string) =>
          set((state) => ({
            authModal: { ...state.authModal, phoneNumber: phone }
          }), false, 'ui/setPhoneNumber'),

        setEmail: (email: string) =>
          set((state) => ({
            authModal: { ...state.authModal, email }
          }), false, 'ui/setEmail'),

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
              state: state.sidebar.state === 'expanded' ? 'collapsed' : 'expanded',
              open: state.sidebar.state === 'expanded' ? false : true,
              isCollapsed: state.sidebar.state === 'expanded'
            }
          }), false, 'ui/toggleSidebar'),

        setSidebarCollapsed: (isCollapsed) =>
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              state: isCollapsed ? 'collapsed' : 'expanded',
              open: !isCollapsed,
              isCollapsed,
              width: isCollapsed ? 64 : 256
            }
          }), false, 'ui/setSidebarCollapsed'),

        setSidebarOpen: (open: boolean) =>
          set((state) => ({
            sidebar: {
              ...state.sidebar,
              open,
              state: open ? 'expanded' : 'collapsed',
              isCollapsed: !open
            }
          }), false, 'ui/setSidebarOpen'),

        setSidebarOpenMobile: (openMobile: boolean) =>
          set((state) => ({
            sidebar: { ...state.sidebar, openMobile }
          }), false, 'ui/setSidebarOpenMobile'),

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
  openOTPModal: state.openOTPModal,
  closeOTPModal: state.closeOTPModal,
  setPhoneNumber: state.setPhoneNumber,
  setEmail: state.setEmail,
  openShareModal: state.openShareModal,
  closeShareModal: state.closeShareModal,
  openSettingsModal: state.openSettingsModal,
  closeSettingsModal: state.closeSettingsModal,
  openLogoutModal: state.openLogoutModal,
  closeLogoutModal: state.closeLogoutModal,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarOpenMobile: state.setSidebarOpenMobile,
  setSidebarWidth: state.setSidebarWidth,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));