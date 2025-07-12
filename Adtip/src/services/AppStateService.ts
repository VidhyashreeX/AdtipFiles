// src/services/AppStateService.ts
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Service for managing app state changes and their effects on data fetching
 * Handles background/foreground transitions and optimizes data usage
 */
class AppStateService {
  private static instance: AppStateService | null = null;
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = AppState.currentState;
  private backgroundTime: number | null = null;
  private foregroundCallbacks: Array<() => void> = [];
  private backgroundCallbacks: Array<() => void> = [];

  // Singleton pattern
  static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  /**
   * Initialize app state monitoring
   */
  initialize(): void {
    if (this.appStateSubscription) {
      console.log('[AppStateService] Already initialized');
      return;
    }

    console.log('[AppStateService] Initializing app state monitoring');
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Cleanup app state monitoring
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      console.log('[AppStateService] Cleaning up app state monitoring');
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.foregroundCallbacks = [];
    this.backgroundCallbacks = [];
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    console.log('[AppStateService] App state changed from', this.currentAppState, 'to', nextAppState);

    if (this.currentAppState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      this.handleAppForeground();
    } else if (this.currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
      // App went to background
      this.handleAppBackground();
    }

    this.currentAppState = nextAppState;
  };

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground(): void {
    console.log('[AppStateService] App came to foreground');
    
    const backgroundDuration = this.backgroundTime ? Date.now() - this.backgroundTime : 0;
    console.log('[AppStateService] App was in background for', Math.round(backgroundDuration / 1000), 'seconds');

    // Reset background time
    this.backgroundTime = null;

    // Execute foreground callbacks
    this.foregroundCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[AppStateService] Error executing foreground callback:', error);
      }
    });
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    console.log('[AppStateService] App went to background');
    
    // Record background time
    this.backgroundTime = Date.now();

    // Execute background callbacks
    this.backgroundCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[AppStateService] Error executing background callback:', error);
      }
    });
  }

  /**
   * Register callback for when app comes to foreground
   */
  onForeground(callback: () => void): () => void {
    this.foregroundCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.foregroundCallbacks.indexOf(callback);
      if (index > -1) {
        this.foregroundCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for when app goes to background
   */
  onBackground(callback: () => void): () => void {
    this.backgroundCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.backgroundCallbacks.indexOf(callback);
      if (index > -1) {
        this.backgroundCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    return this.currentAppState;
  }

  /**
   * Check if app is in foreground
   */
  isInForeground(): boolean {
    return this.currentAppState === 'active';
  }

  /**
   * Check if app is in background
   */
  isInBackground(): boolean {
    return this.currentAppState.match(/inactive|background/) !== null;
  }

  /**
   * Get time spent in background (in milliseconds)
   */
  getBackgroundDuration(): number {
    if (!this.backgroundTime) {
      return 0;
    }
    return Date.now() - this.backgroundTime;
  }

  /**
   * Check if app should refresh data based on background duration
   * @param threshold - Threshold in milliseconds (default: 5 minutes)
   */
  shouldRefreshData(threshold: number = 5 * 60 * 1000): boolean {
    const backgroundDuration = this.getBackgroundDuration();
    return backgroundDuration > threshold;
  }
}

/**
 * React hook for using AppStateService
 */
export const useAppState = () => {
  const appStateService = AppStateService.getInstance();

  return {
    getCurrentState: () => appStateService.getCurrentState(),
    isInForeground: () => appStateService.isInForeground(),
    isInBackground: () => appStateService.isInBackground(),
    getBackgroundDuration: () => appStateService.getBackgroundDuration(),
    shouldRefreshData: (threshold?: number) => appStateService.shouldRefreshData(threshold),
    onForeground: (callback: () => void) => appStateService.onForeground(callback),
    onBackground: (callback: () => void) => appStateService.onBackground(callback),
  };
};

/**
 * React hook for managing TanStack Query based on app state
 */
export const useAppStateQueryManagement = () => {
  const queryClient = useQueryClient();
  const appStateService = AppStateService.getInstance();

  // Initialize app state monitoring
  React.useEffect(() => {
    appStateService.initialize();
    
    return () => {
      appStateService.cleanup();
    };
  }, []);

  // Handle foreground/background query management
  React.useEffect(() => {
    const unsubscribeForeground = appStateService.onForeground(() => {
      console.log('[AppStateQueryManagement] App foregrounded, resuming queries');
      queryClient.resumeQueries();
      
      // Refetch user data if app was in background for more than 5 minutes
      if (appStateService.shouldRefreshData()) {
        console.log('[AppStateQueryManagement] Refetching user data after long background');
        queryClient.invalidateQueries({ queryKey: ['userData'] });
      }
    });

    const unsubscribeBackground = appStateService.onBackground(() => {
      console.log('[AppStateQueryManagement] App backgrounded, pausing queries');
      queryClient.pauseQueries();
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, [queryClient]);

  return {
    pauseQueries: () => queryClient.pauseQueries(),
    resumeQueries: () => queryClient.resumeQueries(),
    invalidateUserData: () => queryClient.invalidateQueries({ queryKey: ['userData'] }),
  };
};

export default AppStateService;
