// src/stores/notification.store.ts - World-class notification management
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, null for persistent
  position?: NotificationPosition;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  createdAt: number;
}

interface NotificationState {
  // State
  notifications: Notification[];
  maxNotifications: number;
  defaultDuration: number;
  defaultPosition: NotificationPosition;

  // Computed properties
  hasNotifications: boolean;
  notificationCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  clearByType: (type: NotificationType) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;

  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt'>>) => string;
  error: (title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt'>>) => string;
  warning: (title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt'>>) => string;
  info: (title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt'>>) => string;

  // Advanced actions
  pauseAutoDismiss: (id: string) => void;
  resumeAutoDismiss: (id: string) => void;
  bulkRemove: (ids: string[]) => void;
}

// Auto-dismiss timer management
const timers = new Map<string, NodeJS.Timeout>();

const clearTimer = (id: string) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

const setTimer = (id: string, duration: number, callback: () => void) => {
  clearTimer(id);
  const timer = setTimeout(callback, duration);
  timers.set(id, timer);
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      maxNotifications: 5,
      defaultDuration: 5000, // 5 seconds
      defaultPosition: 'top-right',

      // Computed properties
      get hasNotifications() {
        return get().notifications.length > 0;
      },

      get notificationCount() {
        return get().notifications.length;
      },

      // Actions
      addNotification: (notificationData) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification: Notification = {
          id,
          dismissible: true,
          createdAt: Date.now(),
          ...notificationData,
        };

        set((state) => {
          const newNotifications = [notification, ...state.notifications];

          // Enforce max notifications limit
          if (newNotifications.length > state.maxNotifications) {
            newNotifications.splice(state.maxNotifications);
          }

          return { notifications: newNotifications };
        });

        // Set up auto-dismiss timer if duration is specified
        if (notification.duration !== null && notification.duration !== undefined) {
          const duration = notification.duration || get().defaultDuration;
          setTimer(id, duration, () => {
            get().removeNotification(id);
          });
        }

        return id;
      },

      removeNotification: (id) => {
        clearTimer(id);
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }), false, 'notification/removeNotification');
      },

      clearNotifications: () => {
        // Clear all timers
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();

        set({ notifications: [] }, false, 'notification/clearNotifications');
      },

      clearByType: (type) => {
        set((state) => {
          const remainingNotifications = state.notifications.filter(n => n.type !== type);
          // Clear timers for removed notifications
          state.notifications
            .filter(n => n.type === type)
            .forEach(n => clearTimer(n.id));

          return { notifications: remainingNotifications };
        }, false, 'notification/clearByType');
      },

      updateNotification: (id, updates) =>
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, ...updates } : n
          )
        }), false, 'notification/updateNotification'),

      // Convenience methods
      success: (title, message, options = {}) => {
        return get().addNotification({
          type: 'success',
          title,
          message,
          ...options,
        });
      },

      error: (title, message, options = {}) => {
        return get().addNotification({
          type: 'error',
          title,
          message,
          duration: 8000, // Longer duration for errors
          ...options,
        });
      },

      warning: (title, message, options = {}) => {
        return get().addNotification({
          type: 'warning',
          title,
          message,
          duration: 6000,
          ...options,
        });
      },

      info: (title, message, options = {}) => {
        return get().addNotification({
          type: 'info',
          title,
          message,
          ...options,
        });
      },

      // Advanced actions
      pauseAutoDismiss: (id) => {
        clearTimer(id);
      },

      resumeAutoDismiss: (id) => {
        const notification = get().notifications.find(n => n.id === id);
        if (notification && notification.duration !== null && notification.duration !== undefined) {
          const duration = notification.duration || get().defaultDuration;
          const elapsed = Date.now() - notification.createdAt;
          const remaining = Math.max(0, duration - elapsed);

          if (remaining > 0) {
            setTimer(id, remaining, () => {
              get().removeNotification(id);
            });
          } else {
            get().removeNotification(id);
          }
        }
      },

      bulkRemove: (ids) => {
        ids.forEach(id => clearTimer(id));
        set((state) => ({
          notifications: state.notifications.filter(n => !ids.includes(n.id))
        }), false, 'notification/bulkRemove');
      },
    }),
    {
      name: 'notification-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useHasNotifications = () => useNotificationStore((state) => state.hasNotifications);
export const useNotificationCount = () => useNotificationStore((state) => state.notificationCount);

// Actions
export const useNotificationActions = () => useNotificationStore((state) => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  clearByType: state.clearByType,
  updateNotification: state.updateNotification,
  success: state.success,
  error: state.error,
  warning: state.warning,
  info: state.info,
  pauseAutoDismiss: state.pauseAutoDismiss,
  resumeAutoDismiss: state.resumeAutoDismiss,
  bulkRemove: state.bulkRemove,
}));